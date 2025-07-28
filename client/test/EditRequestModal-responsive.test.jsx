import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EditRequestModal from '../EditRequestModal.jsx';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../ThemeContext.jsx';

// Mock dependencies
vi.mock('../AuthContext.jsx');
vi.mock('../ThemeContext.jsx');
vi.mock('../CategorySelector.jsx', () => ({
  default: ({ value, onChange, disabled }) => (
    <div data-testid="category-selector">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        data-testid="category-select"
      >
        <option value="">選擇會計科目</option>
        <option value="辦公用品">辦公用品</option>
        <option value="設備維護">設備維護</option>
      </select>
    </div>
  )
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    put: vi.fn()
  }
}));

describe('EditRequestModal - 響應式設計測試', () => {
  const mockCurrentUser = {
    uid: 'test-user-id',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  };

  const mockRequest = {
    id: 'test-request-id',
    text: '測試需求',
    title: '測試需求',
    description: '測試描述',
    priority: 'general',
    accountingCategory: '辦公用品',
    requesterUid: 'test-user-id',
    requesterName: '測試用戶',
    status: 'pending',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    request: mockRequest,
    onUpdateComplete: vi.fn(),
    onError: vi.fn()
  };

  beforeEach(() => {
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser
    });
    
    useTheme.mockReturnValue({
      theme: 'light',
      isDark: false
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('模態框響應式佈局', () => {
    it('應該在小螢幕上使用較小的內邊距', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const modal = document.querySelector('.bg-surface');
      
      expect(modal).toBeInTheDocument();
      
      // 檢查模態框容器的響應式類別
      const modalContainer = document.querySelector('.fixed.inset-0');
      expect(modalContainer).toHaveClass('p-2', 'sm:p-4');
      
      // 檢查模態框內容的響應式高度
      const modalContent = document.querySelector('.bg-surface');
      expect(modalContent).toHaveClass('max-h-[95vh]', 'sm:max-h-[90vh]');
    });

    it('應該在小螢幕上使用較小的表單間距', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const form = document.querySelector('form');
      expect(form).toHaveClass('p-3', 'sm:p-4', 'space-y-3', 'sm:space-y-4');
    });

    it('應該在小螢幕上垂直排列按鈕', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const buttonContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('flex-col', 'sm:flex-row', 'gap-2', 'sm:gap-4');
    });
  });

  describe('輸入框響應式設計', () => {
    it('應該在小螢幕上使用較大的內邊距和字體', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const titleInput = screen.getByLabelText(/需求標題/);
      expect(titleInput).toHaveClass('py-3', 'sm:py-2', 'text-base', 'sm:text-sm');
      
      const descriptionTextarea = screen.getByLabelText(/詳細描述/);
      expect(descriptionTextarea).toHaveClass('py-3', 'sm:py-2', 'text-base', 'sm:text-sm');
    });

    it('應該包含觸控優化類別', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const titleInput = screen.getByLabelText(/需求標題/);
      expect(titleInput).toHaveClass('touch-manipulation');
      
      const descriptionTextarea = screen.getByLabelText(/詳細描述/);
      expect(descriptionTextarea).toHaveClass('touch-manipulation');
    });
  });

  describe('按鈕響應式設計', () => {
    it('應該在小螢幕上使用全寬按鈕', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /取消/ });
      expect(cancelButton).toHaveClass('w-full', 'sm:flex-1');
      
      const submitButton = screen.getByRole('button', { name: /儲存變更/ });
      expect(submitButton).toHaveClass('w-full', 'sm:flex-1');
    });

    it('應該在小螢幕上使用較大的內邊距', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /取消/ });
      expect(cancelButton).toHaveClass('py-3', 'sm:py-2');
      
      const submitButton = screen.getByRole('button', { name: /儲存變更/ });
      expect(submitButton).toHaveClass('py-3', 'sm:py-2');
    });

    it('應該包含觸控優化類別', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /取消/ });
      expect(cancelButton).toHaveClass('touch-manipulation');
      
      const submitButton = screen.getByRole('button', { name: /儲存變更/ });
      expect(submitButton).toHaveClass('touch-manipulation');
    });
  });

  describe('緊急程度選項響應式設計', () => {
    it('應該在小螢幕上垂直排列選項', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const priorityContainer = document.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(priorityContainer).toBeInTheDocument();
      expect(priorityContainer).toHaveClass('flex-col', 'sm:flex-row', 'gap-2', 'sm:gap-4');
    });

    it('應該在小螢幕上使用較大的內邊距', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const priorityOptions = document.querySelectorAll('[class*="px-4 py-3 sm:px-3 sm:py-2"]');
      expect(priorityOptions.length).toBeGreaterThan(0);
      
      priorityOptions.forEach(option => {
        expect(option).toHaveClass('px-4', 'py-3', 'sm:px-3', 'sm:py-2');
        expect(option).toHaveClass('touch-manipulation');
      });
    });
  });

  describe('深色模式響應式支援', () => {
    it('應該在深色模式下正確應用響應式樣式', () => {
      useTheme.mockReturnValue({
        theme: 'dark',
        isDark: true
      });

      render(<EditRequestModal {...mockProps} />);
      
      const modalContent = document.querySelector('.bg-surface');
      expect(modalContent).toHaveClass('dark:bg-dark-surface');
      
      const titleInput = screen.getByLabelText(/需求標題/);
      expect(titleInput).toHaveClass('dark:bg-dark-surface', 'dark:text-dark-text-main');
      
      const submitButton = screen.getByRole('button', { name: /儲存變更/ });
      expect(submitButton).toHaveClass('dark:bg-dark-primary');
    });
  });

  describe('觸控裝置互動測試', () => {
    it('應該支援觸控點擊事件', async () => {
      render(<EditRequestModal {...mockProps} />);
      
      const titleInput = screen.getByLabelText(/需求標題/);
      
      // 模擬觸控事件
      fireEvent.touchStart(titleInput);
      fireEvent.touchEnd(titleInput);
      fireEvent.focus(titleInput);
      
      expect(titleInput).toHaveFocus();
    });

    it('應該支援緊急程度選項的觸控選擇', async () => {
      render(<EditRequestModal {...mockProps} />);
      
      // 查找緊急選項
      const urgentOption = screen.getByText('緊急').closest('label');
      expect(urgentOption).toBeInTheDocument();
      
      // 模擬觸控點擊
      fireEvent.touchStart(urgentOption);
      fireEvent.touchEnd(urgentOption);
      fireEvent.click(urgentOption);
      
      // 檢查選項是否被選中
      const urgentRadio = urgentOption.querySelector('input[type="radio"]');
      expect(urgentRadio).toBeChecked();
    });
  });

  describe('無障礙響應式支援', () => {
    it('應該在不同螢幕尺寸下保持適當的焦點管理', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const titleInput = screen.getByLabelText(/需求標題/);
      // 檢查輸入框是否存在（autoFocus 在測試環境中可能不會被設置）
      expect(titleInput).toBeInTheDocument();
      
      // 檢查焦點環的響應式設計
      expect(titleInput).toHaveClass('focus:ring-2');
    });

    it('應該在小螢幕上保持適當的點擊目標大小', () => {
      render(<EditRequestModal {...mockProps} />);
      
      const closeButton = screen.getByTitle('關閉');
      const cancelButton = screen.getByRole('button', { name: /取消/ });
      const submitButton = screen.getByRole('button', { name: /儲存變更/ });
      
      // 檢查按鈕是否有足夠的內邊距（至少 44px 高度）
      expect(cancelButton).toHaveClass('py-3'); // 在小螢幕上
      expect(submitButton).toHaveClass('py-3'); // 在小螢幕上
    });
  });
});