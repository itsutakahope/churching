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

describe('EditRequestModal - 樂觀更新機制', () => {
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

  it('應該在 API 成功時執行樂觀更新', async () => {
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

    const descriptionInput = screen.getByDisplayValue('原始描述');
    fireEvent.change(descriptionInput, { target: { value: '更新後描述' } });

    // 提交表單
    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 驗證樂觀更新立即執行
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id',
          text: '更新後需求',
          title: '更新後需求',
          description: '更新後描述',
          priority: 'general',
          accountingCategory: '原始科目'
        })
      );
    });

    // 驗證模態框立即關閉
    expect(onClose).toHaveBeenCalled();

    // 等待 API 呼叫完成
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/requirements/test-id',
        expect.objectContaining({
          text: '更新後需求',
          title: '更新後需求',
          description: '更新後描述',
          priority: 'general',
          accountingCategory: '原始科目'
        }),
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer mock-token',
            'Content-Type': 'application/json'
          },
          timeout: 10000
        })
      );
    });
  });

  it('應該在 API 失敗時執行回滾機制', async () => {
    // Mock API 失敗回應
    const apiError = new Error('API Error');
    apiError.response = {
      status: 500,
      data: { message: '伺服器錯誤' }
    };
    axios.put.mockRejectedValue(apiError);

    const onUpdateComplete = vi.fn();
    const onClose = vi.fn();
    const onError = vi.fn();

    render(
      <EditRequestModal 
        {...defaultProps} 
        onUpdateComplete={onUpdateComplete}
        onClose={onClose}
        onError={onError}
      />
    );

    // 修改表單資料
    const titleInput = screen.getByDisplayValue('原始需求');
    fireEvent.change(titleInput, { target: { value: '更新後需求' } });

    // 提交表單
    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 驗證樂觀更新先執行
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenNthCalledWith(1, 
        expect.objectContaining({
          text: '更新後需求',
          title: '更新後需求'
        })
      );
    });

    // 等待 API 失敗和回滾
    await waitFor(() => {
      // 驗證回滾：恢復原始資料
      expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);
    });

    // 驗證錯誤處理（使用後端回傳的錯誤訊息）
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '伺服器錯誤',
        'api'
      );
    });
  });

  it('應該在網路錯誤時執行回滾機制', async () => {
    // Mock 網路錯誤
    const networkError = new Error('Network Error');
    networkError.request = {}; // 表示是網路錯誤
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

    // 驗證回滾到原始資料
    expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);

    // 驗證網路錯誤訊息
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '無法連線至伺服器，請檢查您的網路連線。',
        'network'
      );
    });
  });

  it('應該在權限錯誤時執行回滾機制', async () => {
    // Mock 權限錯誤
    const permissionError = new Error('Permission Error');
    permissionError.response = {
      status: 403,
      data: { message: '權限不足' }
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

    // 修改並提交表單
    const titleInput = screen.getByDisplayValue('原始需求');
    fireEvent.change(titleInput, { target: { value: '更新後需求' } });

    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 等待樂觀更新和回滾
    await waitFor(() => {
      expect(onUpdateComplete).toHaveBeenCalledTimes(2);
    });

    // 驗證回滾到原始資料
    expect(onUpdateComplete).toHaveBeenNthCalledWith(2, mockRequest);

    // 驗證權限錯誤訊息
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        '權限不足，您無法編輯此需求。',
        'permission'
      );
    });
  });
});