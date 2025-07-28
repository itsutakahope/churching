import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import EditRequestModal from '../EditRequestModal.jsx';

// Mock axios
vi.mock('axios');

// Mock all dependencies
vi.mock('../AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { 
      uid: 'test-user',
      getIdToken: vi.fn().mockResolvedValue('mock-token')
    }
  })
}));

vi.mock('../CategorySelector.jsx', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="category-selector">
      <input
        data-testid="category-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="會計科目"
      />
    </div>
  )
}));

describe('EditRequestModal - 即時資料同步整合', () => {
  const mockRequest = {
    id: 'test-id',
    text: '原始需求',
    title: '原始需求',
    description: '原始描述',
    priority: 'general',
    accountingCategory: '原始科目'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    request: mockRequest,
    onUpdateComplete: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該在成功更新後與 Firestore 監聽器協調工作', async () => {
    // Mock API 成功回應
    axios.put.mockResolvedValue({ data: { message: 'Success' } });

    const onUpdateComplete = vi.fn();
    const onClose = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onClose={onClose}
      />
    );

    // 修改表單資料
    const titleInput = screen.getByDisplayValue('原始需求');
    fireEvent.change(titleInput, { target: { value: '更新後需求' } });

    // 提交表單
    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 驗證樂觀更新立即執行
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '更新後需求',
          title: '更新後需求'
        })
      );
    });

    // 驗證模態框立即關閉（不等待 API 回應）
    expect(onClose).toHaveBeenCalled();

    // 等待 API 呼叫完成
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/requirements/test-id',
        expect.objectContaining({
          text: '更新後需求',
          title: '更新後需求'
        }),
        expect.any(Object)
      );
    });

    // 驗證沒有額外的 onUpdateComplete 呼叫（因為 Firestore 監聽器會處理後續更新）
    expect(onUpdateComplete).toHaveBeenCalledTimes(1);
  });

  it('應該在 API 失敗時執行回滾並與 Firestore 監聽器協調', async () => {
    // Mock API 失敗回應
    const apiError = new Error('API Error');
    apiError.response = {
      status: 409,
      data: { message: '資料已被其他使用者修改' }
    };
    axios.put.mockRejectedValue(apiError);

    const onUpdateComplete = vi.fn();
    const onError = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onError={onError}
      />
    );

    // 修改並提交表單
    const titleInput = screen.getByDisplayValue('原始需求');
    fireEvent.change(titleInput, { target: { value: '更新後需求' } });

    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 驗證樂觀更新先執行
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          text: '更新後需求'
        })
      );
    });

    // 等待 API 失敗和回滾
    await waitFor(() => {
      // 驗證回滾：恢復原始資料
      expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);
    });

    // 驗證衝突錯誤處理
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '需求已被其他人修改，請重新整理後再試。',
        'conflict'
      );
    });

    // 驗證總共有兩次 onUpdateComplete 呼叫：樂觀更新 + 回滾
    expect(onUpdateComplete).toHaveBeenCalledTimes(2);
  });

  it('應該正確處理資料一致性問題', async () => {
    // 模擬資料已被其他使用者修改的情況
    const conflictError = new Error('Conflict Error');
    conflictError.response = {
      status: 409,
      data: { 
        message: '此需求已被他人標記為已購買，頁面將會自動更新。',
        code: 'ALREADY_PURCHASED'
      }
    };
    axios.put.mockRejectedValue(conflictError);

    const onUpdateComplete = vi.fn();
    const onError = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onError={onError}
      />
    );

    // 提交表單
    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 等待樂觀更新和回滾
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledTimes(2);
    });

    // 驗證衝突處理
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '需求已被其他人修改，請重新整理後再試。',
        'conflict'
      );
    });

    // 在這種情況下，Firestore 監聽器會自動獲取最新資料
    // 所以不需要額外的同步操作
  });

  it('應該在網路錯誤時保持資料一致性', async () => {
    // Mock 網路錯誤
    const networkError = new Error('Network Error');
    networkError.request = {};
    axios.put.mockRejectedValue(networkError);

    const onUpdateComplete = vi.fn();
    const onError = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onError={onError}
      />
    );

    // 修改並提交表單
    const titleInput = screen.getByDisplayValue('原始需求');
    fireEvent.change(titleInput, { target: { value: '更新後需求' } });

    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 等待樂觀更新和回滾
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledTimes(2);
    });

    // 驗證回滾到原始資料，保持與伺服器狀態一致
    expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);

    // 驗證網路錯誤訊息
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '無法連線至伺服器，請檢查您的網路連線。',
        'network'
      );
    });
  });

  it('應該在權限變更時正確處理', async () => {
    // Mock 權限錯誤（可能是在編輯過程中權限發生變化）
    const permissionError = new Error('Permission Error');
    permissionError.response = {
      status: 403,
      data: { 
        message: '權限不足，只有原始購買者才能撤銷此操作。',
        code: 'PERMISSION_DENIED'
      }
    };
    axios.put.mockRejectedValue(permissionError);

    const onUpdateComplete = vi.fn();
    const onError = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onError={onError}
      />
    );

    // 提交表單
    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 等待樂觀更新和回滾
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledTimes(2);
    });

    // 驗證權限錯誤處理
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '權限不足，您無法編輯此需求。',
        'permission'
      );
    });

    // 驗證回滾到原始狀態
    expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);
  });
});