import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('TransferReimbursementModal 組件測試', () => {
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
    {
      uid: 'user-3',
      displayName: '報帳聯絡人 B',
      email: 'contact-b@example.com',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // 預設成功載入聯絡人清單
    axios.get.mockResolvedValue({
      data: mockReimbursementContacts,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染測試', () => {
    it('應該在 isOpen 為 true 時顯示彈窗', async () => {
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
      expect(screen.getByText('目前報帳負責人：目前報帳人')).toBeInTheDocument();
    });

    it('應該在 isOpen 為 false 時不顯示彈窗', () => {
      render(
        <TransferReimbursementModal
          isOpen={false}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      expect(screen.queryByText('轉交報帳')).not.toBeInTheDocument();
    });

    it('應該顯示載入狀態', async () => {
      render(
        <TransferReimbursementModal
          isOpen={true}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });
  });

  describe('報帳聯絡人載入測試', () => {
    it('應該成功載入並顯示報帳聯絡人清單', async () => {
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
        expect(screen.getByText('報帳聯絡人 B')).toBeInTheDocument();
      });

      expect(axios.get).toHaveBeenCalledWith('/api/users/reimbursement-contacts', {
        headers: { 'Authorization': 'Bearer mock-token' },
        timeout: 10000,
      });
    });

    it('應該過濾掉目前的報帳負責人', async () => {
      const contactsWithCurrentUser = [
        ...mockReimbursementContacts,
        {
          uid: 'user-1', // 目前報帳負責人
          displayName: '目前報帳人',
          email: 'current@example.com',
        },
      ];

      axios.get.mockResolvedValue({
        data: contactsWithCurrentUser,
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
        expect(screen.getByText('報帳聯絡人 B')).toBeInTheDocument();
      });

      // 目前報帳負責人不應該出現在清單中
      expect(screen.queryByText('目前報帳人')).not.toBeInTheDocument();
    });

    it('應該處理空的聯絡人清單', async () => {
      axios.get.mockResolvedValue({
        data: [],
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
        expect(screen.getByText('沒有其他可選擇的報帳聯絡人')).toBeInTheDocument();
      });
    });
  });

  describe('錯誤處理測試', () => {
    it('應該處理網路錯誤', async () => {
      axios.get.mockRejectedValue({
        request: {},
        message: 'Network Error',
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
        expect(screen.getByText('無法連線至伺服器，請檢查您的網路連線。')).toBeInTheDocument();
      });
    });

    it('應該處理權限錯誤', async () => {
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

    it('應該處理超時錯誤', async () => {
      axios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 10000ms exceeded',
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
        expect(screen.getByText('請求超時，請檢查網路連線後重試。')).toBeInTheDocument();
      });
    });

    it('應該顯示重試按鈕並允許重試', async () => {
      axios.get.mockRejectedValueOnce({
        request: {},
        message: 'Network Error',
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
        expect(screen.getByText('重試 (3 次剩餘)')).toBeInTheDocument();
      });

      // 設置重試成功的回應
      axios.get.mockResolvedValue({
        data: mockReimbursementContacts,
      });

      // 點擊重試按鈕
      const retryButton = screen.getByText('重試 (3 次剩餘)');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('報帳聯絡人 A')).toBeInTheDocument();
      });
    });
  });

  describe('使用者互動測試', () => {
    beforeEach(async () => {
      render(
        <TransferReimbursementModal
          isOpen={true}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      // 等待聯絡人載入完成
      await waitFor(() => {
        expect(screen.getByText('報帳聯絡人 A')).toBeInTheDocument();
      });
    });

    it('應該允許選擇報帳聯絡人', async () => {
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      expect(contactA).toBeChecked();
    });

    it('應該在未選擇聯絡人時顯示錯誤訊息', async () => {
      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      expect(screen.getByText('請選擇要轉交的報帳聯絡人。')).toBeInTheDocument();
    });

    it('應該顯示確認對話框', async () => {
      // 選擇聯絡人
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      // 點擊轉交按鈕
      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      // 應該顯示確認對話框
      expect(screen.getByText('確認轉交報帳')).toBeInTheDocument();
      expect(screen.getByText('轉交給：報帳聯絡人 A')).toBeInTheDocument();
    });

    it('應該允許取消確認對話框', async () => {
      // 選擇聯絡人並開啟確認對話框
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);
      
      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      // 點擊取消按鈕
      const cancelButtons = screen.getAllByText('取消');
      const dialogCancelButton = cancelButtons[1]; // 對話框中的取消按鈕
      await userEvent.click(dialogCancelButton);

      // 確認對話框應該關閉
      expect(screen.queryByText('確認轉交報帳')).not.toBeInTheDocument();
    });
  });

  describe('轉交流程測試', () => {
    beforeEach(async () => {
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
    });

    it('應該成功執行轉交流程', async () => {
      // 設置成功的轉交回應
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

      // 選擇聯絡人
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      // 點擊轉交按鈕
      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      // 在確認對話框中點擊確認
      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1]; // 對話框中的確認按鈕
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

      // 應該顯示成功訊息
      await waitFor(() => {
        expect(screen.getByText('轉交成功！')).toBeInTheDocument();
      });

      // 應該呼叫完成回調
      await waitFor(() => {
        expect(mockOnTransferComplete).toHaveBeenCalledWith({
          ...mockCurrentRequest,
          reimbursementerId: 'user-2',
          reimbursementerName: '報帳聯絡人 A',
        });
      }, { timeout: 2000 });
    });

    it('應該處理轉交 API 錯誤', async () => {
      // 設置轉交失敗的回應
      axios.put.mockRejectedValue({
        response: {
          status: 403,
          data: {
            code: 'PERMISSION_DENIED',
            message: '權限不足：只有目前的報帳負責人才能執行此操作。',
          },
        },
      });

      // 選擇聯絡人並執行轉交
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1];
      await userEvent.click(dialogConfirmButton);

      // 應該顯示錯誤訊息
      await waitFor(() => {
        expect(screen.getByText('權限不足：只有目前的報帳負責人才能執行此操作。')).toBeInTheDocument();
      });
    });

    it('應該處理無效目標使用者錯誤', async () => {
      axios.put.mockRejectedValue({
        response: {
          status: 400,
          data: {
            code: 'INVALID_TARGET_USER',
            message: '選擇的使用者沒有報帳權限，請選擇其他人員。',
          },
        },
      });

      // 執行轉交流程
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1];
      await userEvent.click(dialogConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('選擇的使用者沒有報帳權限，請選擇其他人員。')).toBeInTheDocument();
      });
    });

    it('應該處理需求不存在錯誤', async () => {
      axios.put.mockRejectedValue({
        response: {
          status: 404,
          data: {
            code: 'REQUIREMENT_NOT_FOUND',
            message: '找不到指定的購買需求，請重新整理頁面。',
          },
        },
      });

      // 執行轉交流程
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1];
      await userEvent.click(dialogConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('找不到指定的購買需求，請重新整理頁面。')).toBeInTheDocument();
      });
    });
  });

  describe('關閉彈窗測試', () => {
    it('應該允許點擊 X 按鈕關閉彈窗', async () => {
      render(
        <TransferReimbursementModal
          isOpen={true}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      const closeButton = screen.getByRole('button', { name: '' }); // X 按鈕沒有文字
      await userEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('應該允許點擊取消按鈕關閉彈窗', async () => {
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

      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('應該在轉交進行中時禁用關閉按鈕', async () => {
      // 設置一個永不解決的 Promise 來模擬載入狀態
      axios.put.mockImplementation(() => new Promise(() => {}));

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

      // 開始轉交流程
      const contactA = screen.getByLabelText(/報帳聯絡人 A/);
      await userEvent.click(contactA);

      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1];
      await userEvent.click(dialogConfirmButton);

      // 等待載入狀態
      await waitFor(() => {
        expect(screen.getByText('轉交中...')).toBeInTheDocument();
      });

      // 關閉按鈕應該被禁用
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toBeDisabled();

      const cancelButton = screen.getByText('取消');
      expect(cancelButton).toBeDisabled();
    });
  });
});