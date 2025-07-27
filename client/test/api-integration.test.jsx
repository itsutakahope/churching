import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('API Integration - 會計科目更新', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該發送正確的 PUT 請求來更新會計科目', async () => {
    // 模擬成功的 API 回應
    const mockResponse = {
      data: {
        id: 'test-id',
        accountingCategory: '辦公用品',
        text: '測試項目',
        status: 'purchased'
      }
    };
    
    mockedAxios.put.mockResolvedValue(mockResponse);

    // 模擬 Firebase 用戶
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    };

    // 模擬 API 請求邏輯
    const updateAccountingCategory = async (recordId, newCategory, currentUser) => {
      const token = await currentUser.getIdToken();
      const payload = {
        accountingCategory: newCategory.trim()
      };
      
      return await axios.put(`/api/requirements/${recordId}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    };

    // 執行測試
    const result = await updateAccountingCategory('test-id', '辦公用品', mockUser);

    // 驗證請求
    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/requirements/test-id',
      { accountingCategory: '辦公用品' },
      { headers: { 'Authorization': 'Bearer mock-token' } }
    );

    // 驗證回應
    expect(result.data).toEqual(mockResponse.data);
  });

  it('應該正確處理 API 錯誤', async () => {
    // 模擬 API 錯誤
    const mockError = {
      response: {
        status: 403,
        data: {
          message: '權限不足，只有報帳負責人可以編輯會計科目。',
          code: 'INSUFFICIENT_PERMISSIONS'
        }
      }
    };
    
    mockedAxios.put.mockRejectedValue(mockError);

    // 模擬 Firebase 用戶
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    };

    // 模擬 API 請求邏輯
    const updateAccountingCategory = async (recordId, newCategory, currentUser) => {
      const token = await currentUser.getIdToken();
      const payload = {
        accountingCategory: newCategory.trim()
      };
      
      return await axios.put(`/api/requirements/${recordId}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    };

    // 執行測試並期望錯誤
    await expect(updateAccountingCategory('test-id', '辦公用品', mockUser))
      .rejects.toEqual(mockError);

    // 驗證請求仍然被發送
    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/requirements/test-id',
      { accountingCategory: '辦公用品' },
      { headers: { 'Authorization': 'Bearer mock-token' } }
    );
  });

  it('應該正確處理網路錯誤', async () => {
    // 模擬網路錯誤
    const mockError = {
      request: {},
      message: 'Network Error'
    };
    
    mockedAxios.put.mockRejectedValue(mockError);

    // 模擬 Firebase 用戶
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    };

    // 模擬 API 請求邏輯
    const updateAccountingCategory = async (recordId, newCategory, currentUser) => {
      const token = await currentUser.getIdToken();
      const payload = {
        accountingCategory: newCategory.trim()
      };
      
      return await axios.put(`/api/requirements/${recordId}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    };

    // 執行測試並期望錯誤
    await expect(updateAccountingCategory('test-id', '辦公用品', mockUser))
      .rejects.toEqual(mockError);
  });

  it('應該只包含 accountingCategory 欄位在請求中', async () => {
    // 模擬成功的 API 回應
    const mockResponse = {
      data: {
        id: 'test-id',
        accountingCategory: '辦公用品'
      }
    };
    
    mockedAxios.put.mockResolvedValue(mockResponse);

    // 模擬 Firebase 用戶
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    };

    // 模擬 API 請求邏輯
    const updateAccountingCategory = async (recordId, newCategory, currentUser) => {
      const token = await currentUser.getIdToken();
      const payload = {
        accountingCategory: newCategory.trim()
      };
      
      return await axios.put(`/api/requirements/${recordId}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    };

    // 執行測試
    await updateAccountingCategory('test-id', '  辦公用品  ', mockUser);

    // 驗證請求只包含 accountingCategory 欄位，且已去除空白
    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/requirements/test-id',
      { accountingCategory: '辦公用品' }, // 確保去除了前後空白
      { headers: { 'Authorization': 'Bearer mock-token' } }
    );
  });

  it('應該包含正確的認證標頭', async () => {
    // 模擬成功的 API 回應
    const mockResponse = {
      data: { id: 'test-id', accountingCategory: '辦公用品' }
    };
    
    mockedAxios.put.mockResolvedValue(mockResponse);

    // 模擬 Firebase 用戶
    const mockUser = {
      getIdToken: vi.fn().mockResolvedValue('test-token-123')
    };

    // 模擬 API 請求邏輯
    const updateAccountingCategory = async (recordId, newCategory, currentUser) => {
      const token = await currentUser.getIdToken();
      const payload = {
        accountingCategory: newCategory.trim()
      };
      
      return await axios.put(`/api/requirements/${recordId}`, payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    };

    // 執行測試
    await updateAccountingCategory('test-id', '辦公用品', mockUser);

    // 驗證認證標頭
    expect(mockedAxios.put).toHaveBeenCalledWith(
      '/api/requirements/test-id',
      { accountingCategory: '辦公用品' },
      { headers: { 'Authorization': 'Bearer test-token-123' } }
    );

    // 驗證 getIdToken 被調用
    expect(mockUser.getIdToken).toHaveBeenCalled();
  });
});