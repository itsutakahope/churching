import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditCategoryModal from '../EditCategoryModal.jsx';

// Mock CategorySelector component
vi.mock('../CategorySelector.jsx', () => ({
  default: ({ value, onChange }) => (
    <div data-testid="category-selector">
      <input
        data-testid="category-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="選擇會計科目"
      />
    </div>
  )
}));

describe('EditCategoryModal', () => {
  const mockRecord = {
    id: 'test-id',
    text: '測試項目',
    accountingCategory: '辦公用品'
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    record: mockRecord,
    onSave: vi.fn(),
    isLoading: false,
    error: ''
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該在 isOpen 為 true 時渲染模態框', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    expect(screen.getByText('項目名稱')).toBeInTheDocument();
    expect(screen.getByText('測試項目')).toBeInTheDocument();
    expect(screen.getByText('目前會計科目')).toBeInTheDocument();
    expect(screen.getByText('辦公用品')).toBeInTheDocument();
  });

  it('應該在 isOpen 為 false 時不渲染任何內容', () => {
    render(<EditCategoryModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('編輯會計科目')).not.toBeInTheDocument();
  });

  it('應該顯示未分類當沒有會計科目時', () => {
    const recordWithoutCategory = { ...mockRecord, accountingCategory: null };
    render(<EditCategoryModal {...defaultProps} record={recordWithoutCategory} />);
    
    expect(screen.getByText('未分類')).toBeInTheDocument();
  });

  it('應該在點擊關閉按鈕時調用 onClose', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    const closeButton = screen.getByTitle('關閉');
    fireEvent.click(closeButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('應該在點擊取消按鈕時調用 onClose', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('應該在點擊儲存按鈕時調用 onSave', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    expect(defaultProps.onSave).toHaveBeenCalledWith('辦公用品');
  });

  it('應該在載入狀態時禁用按鈕並顯示載入文字', () => {
    render(<EditCategoryModal {...defaultProps} isLoading={true} />);
    
    const saveButton = screen.getByText('儲存中...');
    const cancelButton = screen.getByText('取消');
    const closeButton = screen.getByTitle('關閉');
    
    expect(saveButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('應該顯示錯誤訊息當有錯誤時', () => {
    const errorMessage = '更新失敗，請稍後再試';
    render(<EditCategoryModal {...defaultProps} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('應該在按下 ESC 鍵時關閉模態框', async () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('應該在載入狀態時不響應 ESC 鍵', async () => {
    render(<EditCategoryModal {...defaultProps} isLoading={true} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  it('應該初始化 CategorySelector 的值為當前會計科目', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    const categoryInput = screen.getByTestId('category-input');
    expect(categoryInput.value).toBe('辦公用品');
  });

  it('應該更新 CategorySelector 的值', () => {
    render(<EditCategoryModal {...defaultProps} />);
    
    const categoryInput = screen.getByTestId('category-input');
    fireEvent.change(categoryInput, { target: { value: '新的會計科目' } });
    
    expect(categoryInput.value).toBe('新的會計科目');
    
    // 點擊儲存應該傳遞新的值
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);
    
    expect(defaultProps.onSave).toHaveBeenCalledWith('新的會計科目');
  });
});