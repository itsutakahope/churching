import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import admin from 'firebase-admin';

// Mock Firebase Admin SDK
vi.mock('firebase-admin', () => ({
  default: {
    initializeApp: vi.fn(),
    firestore: vi.fn(() => ({
      collection: vi.fn(),
      runTransaction: vi.fn(),
    })),
    auth: vi.fn(() => ({
      verifyIdToken: vi.fn(),
      getUser: vi.fn(),
    })),
    FieldValue: {
      serverTimestamp: vi.fn(() => 'mock-timestamp'),
      delete: vi.fn(() => 'mock-delete'),
    },
  },
}));

// Mock Firebase Functions
vi.mock('firebase-functions/logger', () => ({
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}));

vi.mock('firebase-functions/v2/https', () => ({
  onRequest: vi.fn(),
  onCall: vi.fn(),
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock('firebase-functions', () => ({
  config: vi.fn(() => ({
    gmail: {
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      refresh_token: 'mock-refresh-token',
      sender: 'test@example.com',
    },
  })),
  auth: {
    user: vi.fn(() => ({
      onCreate: vi.fn(),
    })),
  },
}));

vi.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => ({
        setCredentials: vi.fn(),
      })),
    },
    gmail: vi.fn(() => ({
      users: {
        messages: {
          send: vi.fn(),
        },
      },
    })),
  },
}));

describe('轉交報帳 API 測試', () => {
  let app;
  let mockDb;
  let mockAuth;
  let mockTransaction;
  let mockRequirementRef;
  let mockUserRef;

  beforeEach(async () => {
    // 重置所有 mocks
    vi.clearAllMocks();

    // 設置 Firebase Admin mocks
    mockTransaction = {
      get: vi.fn(),
      update: vi.fn(),
    };

    mockRequirementRef = {
      get: vi.fn(),
    };

    mockUserRef = {
      get: vi.fn(),
    };

    mockDb = {
      collection: vi.fn((collectionName) => {
        if (collectionName === 'requirements') {
          return {
            doc: vi.fn(() => mockRequirementRef),
          };
        }
        if (collectionName === 'users') {
          return {
            doc: vi.fn(() => mockUserRef),
          };
        }
        return {
          doc: vi.fn(),
        };
      }),
      runTransaction: vi.fn((callback) => callback(mockTransaction)),
    };

    mockAuth = {
      verifyIdToken: vi.fn(),
      getUser: vi.fn(),
    };

    admin.firestore.mockReturnValue(mockDb);
    admin.auth.mockReturnValue(mockAuth);

    // 建立測試用的 Express 應用程式
    app = express();
    app.use(express.json());
    
    // 設置中介軟體來模擬已認證的使用者
    app.use((req, res, next) => {
      req.user = { uid: 'user-1' };
      next();
    });
    
    // 手動設置轉交 API 路由
    app.put('/api/requirements/:id/transfer', async (req, res) => {
      try {
        const { id } = req.params;
        const { newReimbursementerId, newReimbursementerName } = req.body;
        const currentUserId = req.user?.uid;

        // 驗證請求參數
        if (!newReimbursementerId || !newReimbursementerName) {
          return res.status(400).json({ 
            message: '缺少必要參數：需要提供新報帳負責人的 ID 和姓名。',
            code: 'INVALID_REQUEST_DATA'
          });
        }

        const requirementRef = mockDb.collection('requirements').doc(id);

        // 使用 Firestore 交易確保資料一致性
        const transactionResult = await mockDb.runTransaction(async (transaction) => {
          const doc = await transaction.get(requirementRef);
          
          if (!doc.exists) {
            throw new Error('REQUIREMENT_NOT_FOUND');
          }

          const docData = doc.data();

          // 權限驗證：確保只有目前報帳負責人可以執行轉交
          if (docData.reimbursementerId !== currentUserId) {
            throw new Error('PERMISSION_DENIED');
          }

          // 驗證目標使用者是否具有 reimbursementContact 角色
          const targetUserDoc = await transaction.get(mockDb.collection('users').doc(newReimbursementerId));
          
          if (!targetUserDoc.exists) {
            throw new Error('INVALID_TARGET_USER');
          }

          const targetUserData = targetUserDoc.data();
          const targetUserRoles = targetUserData.roles || [];
          
          if (!targetUserRoles.includes('reimbursementContact')) {
            throw new Error('INVALID_TARGET_USER');
          }

          // 更新報帳負責人資訊
          const updateData = {
            reimbursementerId: newReimbursementerId,
            reimbursementerName: newReimbursementerName,
            updatedAt: admin.FieldValue.serverTimestamp()
          };

          transaction.update(requirementRef, updateData);

          return {
            id,
            ...docData,
            ...updateData,
            updatedAt: new Date().toISOString()
          };
        });

        res.status(200).json({
          success: true,
          message: '報帳責任已成功轉交',
          updatedRequirement: transactionResult
        });

      } catch (error) {
        // 處理特定錯誤情況
        if (error.message === 'REQUIREMENT_NOT_FOUND') {
          return res.status(404).json({ 
            success: false,
            message: '找不到指定的採購需求。',
            code: 'REQUIREMENT_NOT_FOUND'
          });
        }

        if (error.message === 'PERMISSION_DENIED') {
          return res.status(403).json({ 
            success: false,
            message: '權限不足：只有目前的報帳負責人才能執行此操作。',
            code: 'PERMISSION_DENIED'
          });
        }

        if (error.message === 'INVALID_TARGET_USER') {
          return res.status(400).json({ 
            success: false,
            message: '選擇的使用者沒有報帳權限，請選擇其他人員。',
            code: 'INVALID_TARGET_USER'
          });
        }

        // 一般性錯誤
        res.status(500).json({ 
          success: false,
          message: '轉交報帳責任時發生系統錯誤，請稍後再試。',
          code: 'DATABASE_ERROR',
          error: error.message 
        });
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('成功轉交情境', () => {
    it('應該成功轉交報帳責任', async () => {
      // 設置 mock 資料
      const mockRequirementData = {
        id: 'req-123',
        text: '測試採購項目',
        reimbursementerId: 'user-1',
        reimbursementerName: '原報帳人',
      };

      const mockTargetUserData = {
        uid: 'user-2',
        roles: ['reimbursementContact'],
        displayName: '新報帳人',
      };

      // 設置 mock 回傳值
      mockTransaction.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockRequirementData,
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockTargetUserData,
        });

      mockDb.runTransaction.mockImplementation(async (callback) => {
        const result = await callback(mockTransaction);
        return result;
      });

      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .send({
          newReimbursementerId: 'user-2',
          newReimbursementerName: '新報帳人',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('報帳責任已成功轉交');
      expect(response.body.updatedRequirement.reimbursementerId).toBe('user-2');
      expect(response.body.updatedRequirement.reimbursementerName).toBe('新報帳人');
    });
  });

  describe('權限驗證測試', () => {
    it('應該拒絕非目前報帳負責人的轉交請求', async () => {
      const mockRequirementData = {
        id: 'req-123',
        reimbursementerId: 'user-2', // 目前報帳負責人是 user-2，但請求者是 user-1
      };

      mockTransaction.get.mockResolvedValueOnce({
        exists: true,
        data: () => mockRequirementData,
      });

      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .send({
          newReimbursementerId: 'user-3',
          newReimbursementerName: '新報帳人',
        });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    it('應該拒絕目標使用者沒有報帳權限的轉交請求', async () => {
      const mockRequirementData = {
        id: 'req-123',
        reimbursementerId: 'user-1',
      };

      const mockTargetUserData = {
        uid: 'user-2',
        roles: ['regularUser'], // 沒有 reimbursementContact 角色
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockRequirementData,
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockTargetUserData,
        });

      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'user-2',
          newReimbursementerName: '無權限使用者',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TARGET_USER');
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理採購需求不存在的情況', async () => {
      mockTransaction.get.mockResolvedValueOnce({
        exists: false,
      });

      const response = await request(app)
        .put('/api/requirements/non-existent/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'user-2',
          newReimbursementerName: '新報帳人',
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('REQUIREMENT_NOT_FOUND');
    });

    it('應該處理缺少必要參數的情況', async () => {
      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'user-2',
          // 缺少 newReimbursementerName
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_REQUEST_DATA');
    });

    it('應該處理目標使用者不存在的情況', async () => {
      const mockRequirementData = {
        id: 'req-123',
        reimbursementerId: 'user-1',
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockRequirementData,
        })
        .mockResolvedValueOnce({
          exists: false, // 目標使用者不存在
        });

      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'non-existent-user',
          newReimbursementerName: '不存在的使用者',
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_TARGET_USER');
    });
  });

  describe('資料庫交易測試', () => {
    it('應該正確更新資料庫中的報帳負責人資訊', async () => {
      const mockRequirementData = {
        id: 'req-123',
        text: '測試採購項目',
        reimbursementerId: 'user-1',
        reimbursementerName: '原報帳人',
      };

      const mockTargetUserData = {
        uid: 'user-2',
        roles: ['reimbursementContact'],
      };

      mockTransaction.get
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockRequirementData,
        })
        .mockResolvedValueOnce({
          exists: true,
          data: () => mockTargetUserData,
        });

      await request(app)
        .put('/api/requirements/req-123/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'user-2',
          newReimbursementerName: '新報帳人',
        });

      // 驗證交易中的更新操作被正確呼叫
      expect(mockTransaction.update).toHaveBeenCalledWith(
        mockRequirementRef,
        expect.objectContaining({
          reimbursementerId: 'user-2',
          reimbursementerName: '新報帳人',
          updatedAt: 'mock-timestamp', // mocked serverTimestamp
        })
      );
    });

    it('應該在交易失敗時回滾變更', async () => {
      mockTransaction.get.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .put('/api/requirements/req-123/transfer')
        .set('user', JSON.stringify({ uid: 'user-1' }))
        .send({
          newReimbursementerId: 'user-2',
          newReimbursementerName: '新報帳人',
        });

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('DATABASE_ERROR');
      
      // 確保更新操作沒有被呼叫
      expect(mockTransaction.update).not.toHaveBeenCalled();
    });
  });
});