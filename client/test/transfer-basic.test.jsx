import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import TransferReimbursementModal from '../TransferReimbursementModal.jsx';

// Mock axios
vi.mock('axios');

// Mock AuthContext
const mockCurrentUser = {
  uid: 'user-1',
  getIdToken: vi.fn().mockResolvedValue('mock-token'),
};

vi.mock('../AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}));

describe('轉交報帳基本功能測試', () => {
  const mockOnClose = vi.fn();
  const mockOnTransferComplete = vi.fn();
  
  const mockCurrentRequest = {
    id: 'req-123',
    text: '測試採購項目',
    purchaseAmount: 1000,
    reimbursementerId: 'user-1',
    reimbursementerName: '目前報帳人',
  };

  const mockReimbursementContacts = [
    {
      uid: 'user-2',
      displayName: '報帳聯絡人 A',
      email: 'contact-a@example.com',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axios.get.mockResolvedValue({
      data: mockReimbursementContacts,
    });
  });

  it('應該正確渲染彈窗', async () => {
    render(
      <TransferReimbursementModal
        isOpen={true}
        onClose={mockOnClose}
        currentRequest={mockCurrentRequest}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    expect(screen.getByText('轉交報帳')).toBeInTheDocument();
    expect(screen.getByText('測試採購項目')).toBeInTheDocument();
  });

  it('應該載入並顯示報帳聯絡人', async () => {
    render(
      <TransferReimbursementModal
        isOpen={true}
        onClose={mockOnClose}
        currentRequest={mockCurrentRequest}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('報帳聯絡人 A')).toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith('/api/users/reimbursement-contacts', {
      headers: { 'Authorization': 'Bearer mock-token' },
      timeout: 10000,
    });
  });

  it('應該允許選擇聯絡人', async () => {
    render(
      <TransferReimbursementModal
        isOpen={true}
        onClose={mockOnClose}
        currentRequest={mockCurrentRequest}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('報帳聯絡人 A')).toBeInTheDocument();
    });

    const contactOption = screen.getByRole('radio', { name: /報帳聯絡人 A/ });
    await userEvent.click(contactOption);

    expect(contactOption).toBeChecked();
  });

  it('應該成功執行轉交', async () => {
    axios.put.mockResolvedValue({
      data: {
        success: true,
        updatedRequirement: {
          ...mockCurrentRequest,
          reimbursementerId: 'user-2',
          reimbursementerName: '報帳聯絡人 A',
        },
      },
    });

    render(
      <TransferReimbursementModal
        isOpen={true}
        onClose={mockOnClose}
        currentRequest={mockCurrentRequest}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('報帳聯絡人 A')).toBeInTheDocument();
    });

    // 選擇聯絡人
    const contactOption = screen.getByRole('radio', { name: /報帳聯絡人 A/ });
    await userEvent.click(contactOption);

    // 點擊轉交按鈕
    const transferButton = screen.getByText('確認轉交');
    await userEvent.click(transferButton);

    // 在確認對話框中點擊確認
    await waitFor(() => {
      expect(screen.getByText('確認轉交報帳')).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText('確認轉交');
    const dialogConfirmButton = confirmButtons[1];
    await userEvent.click(dialogConfirmButton);

    // 驗證 API 呼叫
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        '/api/requirements/req-123/transfer',
        {
          newReimbursementerId: 'user-2',
          newReimbursementerName: '報帳聯絡人 A',
        },
        {
          headers: { 'Authorization': 'Bearer mock-token' },
          timeout: 15000,
        }
      );
    });

    // 驗證成功訊息
    await waitFor(() => {
      expect(screen.getByText('轉交成功！')).toBeInTheDocument();
    });
  });

  it('應該處理 API 錯誤', async () => {
    axios.get.mockRejectedValue({
      response: {
        status: 403,
        data: { code: 'ACCOUNT_NOT_APPROVED' },
      },
    });

    render(
      <TransferReimbursementModal
        isOpen={true}
        onClose={mockOnClose}
        currentRequest={mockCurrentRequest}
        onTransferComplete={mockOnTransferComplete}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('權限不足：您的帳號正在等待管理員審核。')).toBeInTheDocument();
    });
  });
});