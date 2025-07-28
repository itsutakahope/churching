import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditRequestModal from '../EditRequestModal.jsx';
import { AuthProvider } from '../AuthContext.jsx';
import { ThemeProvider } from '../ThemeContext.jsx';

// Mock Firebase
vi.mock('../firebaseConfig', () => ({
  auth: {},
  firestore: {},
  default: {}
}));

// Mock CategorySelector
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

// Test wrapper with providers
const TestWrapper = ({ children }) => (
  <ThemeProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ThemeProvider>
);

describe('EditRequestModal', () => {
  const mockRequest = {
    id: 'test-id',
    text: '測試需求',
    title: '測試需求',
    description: '測試描述',
    priority: 'general',
    accountingCategory: '測試科目'
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

  it('應該在 isOpen 為 true 時渲染模態框', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    expect(screen.getByText('編輯採購需求')).toBeInTheDocument();
    expect(screen.getByDisplayValue('測試需求')).toBeInTheDocument();
    expect(screen.getByDisplayValue('測試描述')).toBeInTheDocument();
  });

  it('應該在 isOpen 為 false 時不渲染模態框', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} isOpen={false} />
      </TestWrapper>
    );

    expect(screen.queryByText('編輯採購需求')).not.toBeInTheDocument();
  });

  it('應該正確初始化表單資料', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const titleInput = screen.getByDisplayValue('測試需求');
    const descriptionInput = screen.getByDisplayValue('測試描述');
    const generalRadio = screen.getByRole('radio', { name: /一般/ });

    expect(titleInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    expect(generalRadio).toBeChecked();
  });

  it('應該在點擊關閉按鈕時呼叫 onClose', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const closeButton = screen.getByTitle('關閉');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('應該在點擊取消按鈕時呼叫 onClose', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('應該驗證必填欄位', async () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const titleInput = screen.getByDisplayValue('測試需求');
    const submitButton = screen.getByText('儲存變更');

    // 清空標題
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('需求標題為必填項目')).toBeInTheDocument();
    });

    expect(defaultProps.onUpdateComplete).not.toHaveBeenCalled();
  });

  it('應該驗證字元長度限制', async () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const titleInput = screen.getByDisplayValue('測試需求');
    const submitButton = screen.getByText('儲存變更');

    // 輸入超過100字元的標題
    const longTitle = 'a'.repeat(101);
    fireEvent.change(titleInput, { target: { value: longTitle } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('需求標題不能超過100個字元')).toBeInTheDocument();
    });

    expect(defaultProps.onUpdateComplete).not.toHaveBeenCalled();
  });

  it('應該正確處理優先級選擇', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const urgentRadio = screen.getByRole('radio', { name: /緊急/ });
    fireEvent.click(urgentRadio);

    expect(urgentRadio).toBeChecked();
  });

  it('應該顯示字元計數', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    // 標題字元計數
    expect(screen.getByText('4/100')).toBeInTheDocument(); // '測試需求' = 4 字元
    
    // 描述字元計數
    expect(screen.getByText('4/500')).toBeInTheDocument(); // '測試描述' = 4 字元
  });

  it('應該支援 ESC 鍵關閉', () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('應該在提交時顯示載入狀態', async () => {
    render(
      <TestWrapper>
        <EditRequestModal {...defaultProps} />
      </TestWrapper>
    );

    const submitButton = screen.getByText('儲存變更');
    fireEvent.click(submitButton);

    // 檢查載入狀態
    await waitFor(() => {
      expect(screen.getByText('更新中...')).toBeInTheDocument();
    });
  });
});