import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import PurchaseRequestBoard from '../PurchaseRequestBoard.jsx';
import { useAuth } from '../AuthContext.jsx';

// Mock dependencies
vi.mock('axios');
vi.mock('../AuthContext.jsx');
vi.mock('../firebaseConfig', () => ({
  firestore: {}
}));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn())
}));

describe('Toast Notification Integration', () => {
  const mockCurrentUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  };

  const mockRecord = {
    id: 'test-record-id',
    text: 'Test Purchase Item',
    accountingCategory: 'Office Supplies',
    status: 'purchased',
    reimbursementerId: 'test-user-id',
    reimbursementerName: 'Test User'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
      isReimburser: true,
      userRoles: ['reimbursementContact']
    });

    // Mock initial data fetch
    axios.get.mockResolvedValue({
      data: [mockRecord]
    });
  });

  it('should show success toast when category update succeeds', async () => {
    // Mock successful API response
    axios.put.mockResolvedValue({
      data: { ...mockRecord, accountingCategory: 'New Category' }
    });

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value (simulate CategorySelector change)
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for success toast to appear
    await waitFor(() => {
      expect(screen.getByText('會計科目已成功更新')).toBeInTheDocument();
    });

    // Verify API was called with correct data
    expect(axios.put).toHaveBeenCalledWith(
      '/api/requirements/test-record-id',
      { accountingCategory: 'New Category' },
      { headers: { 'Authorization': 'Bearer mock-token' } }
    );
  });

  it('should show error toast when category update fails', async () => {
    // Mock API error response
    axios.put.mockRejectedValue({
      response: {
        status: 403,
        data: { message: '權限不足，只有報帳負責人可以編輯會計科目。' }
      }
    });

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for error toast to appear
    await waitFor(() => {
      expect(screen.getByText('權限不足，只有報帳負責人可以編輯會計科目。')).toBeInTheDocument();
    });

    // Verify the error is also shown in the modal
    expect(screen.getByText('權限不足，只有報帳負責人可以編輯會計科目。')).toBeInTheDocument();
  });

  it('should show network error toast with retry option', async () => {
    // Mock network error
    axios.put.mockRejectedValue({
      request: {}
    });

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for network error toast to appear
    await waitFor(() => {
      expect(screen.getByText('無法連線至伺服器，請檢查您的網路連線。')).toBeInTheDocument();
    });

    // Check if retry button is available for network errors
    const retryButton = screen.getByText('重試');
    expect(retryButton).toBeInTheDocument();
  });

  it('should show conflict error toast with page refresh suggestion', async () => {
    // Mock conflict error
    axios.put.mockRejectedValue({
      response: {
        status: 409,
        data: { message: '資料已被其他人修改，請重新整理後再試。' }
      }
    });

    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(false);

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for conflict error toast to appear
    await waitFor(() => {
      expect(screen.getByText('資料已被其他人修改，請重新整理後再試。')).toBeInTheDocument();
    });

    // Wait for confirm dialog to appear
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('資料已被其他人修改，是否重新整理頁面以獲取最新資料？');
    }, { timeout: 3000 });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('should auto-hide success toast after 5 seconds', async () => {
    vi.useFakeTimers();

    // Mock successful API response
    axios.put.mockResolvedValue({
      data: { ...mockRecord, accountingCategory: 'New Category' }
    });

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for success toast to appear
    await waitFor(() => {
      expect(screen.getByText('會計科目已成功更新')).toBeInTheDocument();
    });

    // Fast-forward time by 5 seconds
    vi.advanceTimersByTime(5000);

    // Wait for toast to disappear
    await waitFor(() => {
      expect(screen.queryByText('會計科目已成功更新')).not.toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('should use brand color system for toast notifications', async () => {
    // Mock successful API response
    axios.put.mockResolvedValue({
      data: { ...mockRecord, accountingCategory: 'New Category' }
    });

    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Test Purchase Item')).toBeInTheDocument();
    });

    // Find and click the edit category button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Change category value
    const categoryInput = screen.getByDisplayValue('Office Supplies');
    fireEvent.change(categoryInput, { target: { value: 'New Category' } });

    // Click save button
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for success toast to appear
    await waitFor(() => {
      const toast = screen.getByText('會計科目已成功更新').closest('div');
      expect(toast).toHaveClass('bg-success-50');
      expect(toast).toHaveClass('border-success-100');
      expect(toast).toHaveClass('text-success-700');
    });
  });
});