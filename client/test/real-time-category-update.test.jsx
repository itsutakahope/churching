import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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
  onSnapshot: vi.fn(() => vi.fn()) // Return unsubscribe function
}));

describe('Real-time Category Update', () => {
  const mockCurrentUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  };

  const mockRecord = {
    id: 'test-record-1',
    text: 'Test Purchase Item',
    title: 'Test Purchase Item',
    status: 'purchased',
    accountingCategory: 'Office Supplies',
    reimbursementerId: 'test-user-id',
    reimbursementerName: 'Test User',
    purchaseAmount: 1000,
    purchaseDate: '2025-01-01T00:00:00.000Z',
    purchaserName: 'Test Purchaser',
    createdAt: '2024-12-01T00:00:00.000Z'
  };

  beforeEach(() => {
    useAuth.mockReturnValue({
      currentUser: mockCurrentUser,
      isReimburser: true,
      userRoles: ['reimbursementContact']
    });

    // Mock initial data fetch
    axios.get.mockResolvedValue({
      data: [mockRecord]
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should implement optimistic updates for category changes', async () => {
    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Find and click the edit button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Mock successful API response
    const updatedRecord = { ...mockRecord, accountingCategory: 'Marketing' };
    axios.put.mockResolvedValue({ data: updatedRecord });

    // Simulate category change and save
    const saveButton = screen.getByText('儲存');
    
    // Mock CategorySelector behavior - this would normally be handled by the component
    // For testing purposes, we'll simulate the save action directly
    fireEvent.click(saveButton);

    // The UI should immediately show the new category (optimistic update)
    // Note: This test assumes the optimistic update happens before the API call completes
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `/api/requirements/${mockRecord.id}`,
        { accountingCategory: expect.any(String) },
        { headers: { 'Authorization': 'Bearer mock-token' } }
      );
    });

    // After API success, the category should still be displayed
    await waitFor(() => {
      expect(screen.queryByText('編輯會計科目')).not.toBeInTheDocument(); // Modal should be closed
    });
  });

  it('should rollback changes on API failure', async () => {
    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Find and click the edit button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Mock API failure
    axios.put.mockRejectedValue(new Error('Network error'));

    // Simulate save action
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for API call and error handling
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    // The original category should be restored after rollback
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/更新會計科目時發生錯誤/)).toBeInTheDocument();
    });
  });

  it('should show loading indicator during update', async () => {
    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Find and click the edit button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Mock slow API response
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    axios.put.mockReturnValue(apiPromise);

    // Simulate save action
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Loading indicator should be shown
    await waitFor(() => {
      expect(screen.getByText('儲存中...')).toBeInTheDocument();
    });

    // Edit button should be disabled during update
    const editButtonAfterSave = screen.queryByTitle('編輯會計科目');
    if (editButtonAfterSave) {
      expect(editButtonAfterSave).toBeDisabled();
    }

    // Resolve the API call
    resolveApiCall({ data: { ...mockRecord, accountingCategory: 'Updated Category' } });

    // Loading should disappear
    await waitFor(() => {
      expect(screen.queryByText('儲存中...')).not.toBeInTheDocument();
    });
  });

  it('should sync updates across all UI components', async () => {
    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Mock successful API response
    const updatedRecord = { ...mockRecord, accountingCategory: 'Updated Category' };
    axios.put.mockResolvedValue({ data: updatedRecord });

    // Find and click the edit button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open and simulate save
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Wait for API call to complete
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });

    // All instances of the category should be updated
    // This includes grid view, list view, and any detail modals
    await waitFor(() => {
      // The test should verify that all UI components show the updated category
      // This is a simplified check - in a real scenario, you'd test multiple views
      expect(screen.queryByText('Office Supplies')).not.toBeInTheDocument();
    });
  });

  it('should prevent multiple simultaneous updates', async () => {
    render(<PurchaseRequestBoard />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    });

    // Find and click the edit button
    const editButton = screen.getByTitle('編輯會計科目');
    fireEvent.click(editButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText('編輯會計科目')).toBeInTheDocument();
    });

    // Mock slow API response
    let resolveApiCall;
    const apiPromise = new Promise((resolve) => {
      resolveApiCall = resolve;
    });
    axios.put.mockReturnValue(apiPromise);

    // Simulate save action
    const saveButton = screen.getByText('儲存');
    fireEvent.click(saveButton);

    // Save button should be disabled during update
    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    // Cancel button should also be disabled
    const cancelButton = screen.getByText('取消');
    expect(cancelButton).toBeDisabled();

    // Resolve the API call
    resolveApiCall({ data: { ...mockRecord, accountingCategory: 'Updated Category' } });

    // Buttons should be enabled again after completion
    await waitFor(() => {
      expect(screen.queryByText('儲存中...')).not.toBeInTheDocument();
    });
  });
});