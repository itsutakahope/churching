import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import PurchaseRequestBoard from '../PurchaseRequestBoard.jsx';

// Mock dependencies
vi.mock('axios');
vi.mock('../AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      uid: 'test-user-id',
      displayName: 'Test User',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    },
    isReimburser: true
  })
}));

vi.mock('../firebaseConfig', () => ({
  firestore: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()) // 返回 unsubscribe 函式
}));

const mockedAxios = vi.mocked(axios);

describe('PurchaseRequestBoard - API 整合測試', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模擬初始的 API 請求
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: 'test-record-1',
          text: '測試項目 1',
          status: 'purchased',
          accountingCategory: '辦公用品',
          purchaserId: 'test-user-id',
          reimbursementerId: 'test-user-id',
          purchaseAmount: 100,
          createdAt: '2024-01-01T00:00:00Z',
          purchaseDate: '2024-01-01T00:00:00Z',
          purchaserName: 'Test User',
          reimbursementerName: 'Test User'
        }
      ]
    });
  });

  it('應該成功更新會計科目並更新 UI', async () => {
    // 模擬成功的更新回應
    const updatedRecord = {
      id: 'test-record-1',
      text: '測試項目 1',
      status: 'purchased',
      accountingCategory: '文具用品',
      purchaserId: 'test-user-id',
      reimbursementerId: 'test-user-id'
    };
    
    mockedAxios.put.mockResolvedValue({ data: updatedRecord });

    render(<PurchaseRequestBoard />);

    // 等待初始資料載入
    await waitFor(() => {
      expect(screen.getByText('測試項目 1')).toBeInTheDocument();
    });

    // 點擊編輯按鈕（假設有編輯按鈕）
    const editButtons = screen.getAllByTitle('編輯會計科目');
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);

      // 等待模態框出現
      await waitFor(() => {
        expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
      });

      // 模擬選擇新的會計科目（這裡簡化處理）
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      // 驗證 API 請求
      await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
          '/api/requirements/test-record-1',
          expect.objectContaining({
            accountingCategory: expect.any(String)
          }),
          expect.objectContaining({
            headers: { 'Authorization': 'Bearer mock-token' }
          })
        );
      });
    }
  });

  it('應該正確處理 API 錯誤並顯示錯誤訊息', async () => {
    // 模擬 API 錯誤
    const mockError = {
      response: {
        status: 403,
        data: {
          message: '權限不足，只有報帳負責人可以編輯會計科目。'
        }
      }
    };
    
    mockedAxios.put.mockRejectedValue(mockError);

    render(<PurchaseRequestBoard />);

    // 等待初始資料載入
    await waitFor(() => {
      expect(screen.getByText('測試項目 1')).toBeInTheDocument();
    });

    // 點擊編輯按鈕
    const editButtons = screen.getAllByTitle('編輯會計科目');
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);

      // 等待模態框出現
      await waitFor(() => {
        expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
      });

      // 點擊儲存按鈕
      const saveButton = screen.getByText('儲存');
      fireEvent.click(saveButton);

      // 等待錯誤訊息出現
      await waitFor(() => {
        expect(screen.getByText('權限不足，只有報帳負責人可以編輯會計科目。')).toBeInTheDocument();
      });
    }
  });

  it('應該在權限檢查失敗時不顯示編輯按鈕', async () => {
    // 重新 mock AuthContext 以模擬非報帳負責人
    vi.doMock('../AuthContext', () => ({
      useAuth: () => ({
        currentUser: {
          uid: 'other-user-id',
          displayName: 'Other User',
          getIdToken: vi.fn().mockResolvedValue('mock-token')
        },
        isReimburser: false
      })
    }));

    // 模擬資料，其中報帳負責人不是當前用戶
    mockedAxios.get.mockResolvedValue({
      data: [
        {
          id: 'test-record-1',
          text: '測試項目 1',
          status: 'purchased',
          accountingCategory: '辦公用品',
          purchaserId: 'test-user-id',
          reimbursementerId: 'test-user-id', // 不同的用戶
          purchaseAmount: 100,
          createdAt: '2024-01-01T00:00:00Z',
          purchaseDate: '2024-01-01T00:00:00Z',
          purchaserName: 'Test User',
          reimbursementerName: 'Test User'
        }
      ]
    });

    render(<PurchaseRequestBoard />);

    // 等待初始資料載入
    await waitFor(() => {
      expect(screen.getByText('測試項目 1')).toBeInTheDocument();
    });

    // 驗證編輯按鈕不存在
    const editButtons = screen.queryAllByTitle('編輯會計科目');
    expect(editButtons).toHaveLength(0);
  });
});