import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastNotification from '../ToastNotification.jsx';

describe('Toast Notification Basic Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render success toast with brand colors', () => {
    const mockOnClose = vi.fn();
    
    render(
      <ToastNotification
        message="會計科目已成功更新"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Check if success message is displayed
    expect(screen.getByText('會計科目已成功更新')).toBeInTheDocument();
    
    // Check if success icon is present
    const successIcon = screen.getByRole('img', { hidden: true });
    expect(successIcon).toHaveClass('text-success-600');
    
    // Check if toast has success styling
    const toast = screen.getByText('會計科目已成功更新').closest('div');
    expect(toast).toHaveClass('bg-success-50');
    expect(toast).toHaveClass('border-success-100');
    expect(toast).toHaveClass('text-success-700');
  });

  it('should render error toast with brand colors', () => {
    const mockOnClose = vi.fn();
    
    render(
      <ToastNotification
        message="權限不足，只有報帳負責人可以編輯會計科目。"
        type="error"
        errorType="permission"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Check if error message is displayed
    expect(screen.getByText('權限不足，只有報帳負責人可以編輯會計科目。')).toBeInTheDocument();
    
    // Check if error icon is present
    const errorIcon = screen.getByRole('img', { hidden: true });
    expect(errorIcon).toHaveClass('text-danger-600');
    
    // Check if toast has error styling
    const toast = screen.getByText('權限不足，只有報帳負責人可以編輯會計科目。').closest('div');
    expect(toast).toHaveClass('bg-danger-50');
    expect(toast).toHaveClass('border-danger-100');
    expect(toast).toHaveClass('text-danger-700');
  });

  it('should render network error toast with retry button', () => {
    const mockOnClose = vi.fn();
    const mockOnRetry = vi.fn();
    
    render(
      <ToastNotification
        message="無法連線至伺服器，請檢查您的網路連線。"
        type="error"
        errorType="network"
        isVisible={true}
        onClose={mockOnClose}
        showRetry={true}
        onRetry={mockOnRetry}
      />
    );

    // Check if error message is displayed
    expect(screen.getByText('無法連線至伺服器，請檢查您的網路連線。')).toBeInTheDocument();
    
    // Check if retry button is present
    const retryButton = screen.getByText('重試');
    expect(retryButton).toBeInTheDocument();
    
    // Test retry button functionality
    fireEvent.click(retryButton);
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    
    render(
      <ToastNotification
        message="Test message"
        type="info"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Find and click close button
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not render when isVisible is false', () => {
    const mockOnClose = vi.fn();
    
    render(
      <ToastNotification
        message="Test message"
        type="info"
        isVisible={false}
        onClose={mockOnClose}
      />
    );

    // Toast should not be in the document
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should support dark mode classes', () => {
    const mockOnClose = vi.fn();
    
    render(
      <ToastNotification
        message="會計科目已成功更新"
        type="success"
        isVisible={true}
        onClose={mockOnClose}
      />
    );

    // Check if dark mode classes are present
    const toast = screen.getByText('會計科目已成功更新').closest('div');
    expect(toast).toHaveClass('dark:bg-success-900/20');
    expect(toast).toHaveClass('dark:border-success-800');
    expect(toast).toHaveClass('dark:text-success-300');
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('dark:text-success-400');
  });
});