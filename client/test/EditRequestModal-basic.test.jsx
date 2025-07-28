import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EditRequestModal from '../EditRequestModal.jsx';

// Mock all dependencies
vi.mock('../AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-user' }
  })
}));

vi.mock('../ThemeContext.jsx', () => ({
  useTheme: () => ({
    theme: 'light'
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

describe('EditRequestModal - Basic Structure', () => {
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

  it('應該在 isOpen 為 false 時不渲染任何內容', () => {
    const { container } = render(
      <EditRequestModal {...defaultProps} isOpen={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('應該在 isOpen 為 true 時渲染模態框結構', () => {
    render(<EditRequestModal {...defaultProps} />);

    // 檢查標題
    expect(screen.getByText('編輯採購需求')).toBeInTheDocument();
    
    // 檢查表單欄位
    expect(screen.getByLabelText(/需求標題/)).toBeInTheDocument();
    expect(screen.getByText('緊急程度')).toBeInTheDocument();
    expect(screen.getByLabelText(/詳細描述/)).toBeInTheDocument();
    
    // 檢查按鈕
    expect(screen.getByText('取消')).toBeInTheDocument();
    expect(screen.getByText('儲存變更')).toBeInTheDocument();
    
    // 檢查關閉按鈕
    expect(screen.getByTitle('關閉')).toBeInTheDocument();
  });

  it('應該正確顯示表單資料', () => {
    render(<EditRequestModal {...defaultProps} />);

    // 檢查標題輸入框的值
    const titleInput = screen.getByDisplayValue('測試需求');
    expect(titleInput).toBeInTheDocument();
    
    // 檢查描述輸入框的值
    const descriptionInput = screen.getByDisplayValue('測試描述');
    expect(descriptionInput).toBeInTheDocument();
    
    // 檢查一般優先級被選中
    const generalRadio = screen.getByRole('radio', { name: /一般/ });
    expect(generalRadio).toBeChecked();
  });

  it('應該顯示字元計數', () => {
    render(<EditRequestModal {...defaultProps} />);

    // 標題字元計數 ('測試需求' = 4 字元)
    expect(screen.getByText('4/100')).toBeInTheDocument();
    
    // 描述字元計數 ('測試描述' = 4 字元)
    expect(screen.getByText('4/500')).toBeInTheDocument();
  });

  it('應該包含 CategorySelector 組件', () => {
    render(<EditRequestModal {...defaultProps} />);

    expect(screen.getByTestId('category-selector')).toBeInTheDocument();
  });
});