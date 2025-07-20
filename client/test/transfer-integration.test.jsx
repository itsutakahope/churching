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

describe('轉交報帳整合測試', () => {
  const mockOnClose = vi.fn();
  const mockOnTransferComplete = vi.fn();
  
  const mockCurrentRequest = {
    id: 'req-123',
    text: '辦公用品採購',
    description: '購買文具用品',
    purchaseAmount: 2500,
    reimbursementerId: 'user-1',
    reimbursementerName: '張三',
    purchaserName: '李四',
    accountingCategory: '辦公費用',
  };

  const mockReimbursementContacts = [
    {
      uid: 'user-2',
      displayName: '王五',
      email: 'wang@example.com',
    },
    {
      uid: 'user-3',
      displayName: '趙六',
      email: 'zhao@example.com',
    },
    {
      uid: 'user-4',
      displayName: '錢七',
      email: 'qian@example.com',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('完整轉交流程測試', () => {
    it('應該完成完整的轉交流程：載入聯絡人 → 選擇 → 確認 → 轉交成功', async () => {
      // 設置 API 回應
      axios.get.mockResolvedValue({
        data: mockReimbursementContacts,
      });

      axios.put.mockResolvedValue({
        data: {
          success: true,
          message: '報帳責任已成功轉交',
          updatedRequirement: {
            ...mockCurrentRequest,
            reimbursementerId: 'user-2',
            reimbursementerName: '王五',
            updatedAt: new Date().toISOString(),
          },
        },
      });

      // 渲染組件
      render(
        <TransferReimbursementModal
          isOpen={true}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      // 步驟 1: 驗證初始狀態
      expect(screen.getByText('轉交報帳')).toBeInTheDocument();
      expect(screen.getByText('辦公用品採購')).toBeInTheDocument();
      expect(screen.getByText('目前報帳負責人：張三')).toBeInTheDocument();

      // 步驟 2: 等待聯絡人載入完成
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('趙六')).toBeInTheDocument();
        expect(screen.getByText('錢七')).toBeInTheDocument();
      });

      // 驗證 API 呼叫
      expect(axios.get).toHaveBeenCalledWith('/api/users/reimbursement-contacts', {
        headers: { 'Authorization': 'Bearer mock-token' },
        timeout: 10000,
      });

      // 步驟 3: 選擇報帳聯絡人
      const wangWuOption = screen.getByLabelText(/王五/);
      await userEvent.click(wangWuOption);

      expect(wangWuOption).toBeChecked();

      // 步驟 4: 點擊轉交按鈕
      const transferButton = screen.getByText('確認轉交');
      expect(transferButton).not.toBeDisabled();
      await userEvent.click(transferButton);

      // 步驟 5: 驗證確認對話框
      expect(screen.getByText('確認轉交報帳')).toBeInTheDocument();
      expect(screen.getAllByText('辦公用品採購')).toHaveLength(2); // 主彈窗和確認對話框各一個
      expect(screen.getByText('購買金額：NT$ 2,500')).toBeInTheDocument();
      expect(screen.getByText('轉交給：王五')).toBeInTheDocument();
      expect(screen.getByText('⚠️ 轉交後，您將無法再管理此項目的報帳事宜')).toBeInTheDocument();

      // 步驟 6: 確認轉交
      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1]; // 對話框中的確認按鈕
      await userEvent.click(dialogConfirmButton);

      // 步驟 7: 驗證載入狀態
      await waitFor(() => {
        expect(screen.getByText('轉交中...')).toBeInTheDocument();
      });

      // 步驟 8: 驗證 API 呼叫
      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          '/api/requirements/req-123/transfer',
          {
            newReimbursementerId: 'user-2',
            newReimbursementerName: '王五',
          },
          {
            headers: { 'Authorization': 'Bearer mock-token' },
            timeout: 15000,
          }
        );
      });

      // 步驟 9: 驗證成功狀態
      await waitFor(() => {
        expect(screen.getByText('轉交成功！')).toBeInTheDocument();
        expect(screen.getByText('報帳責任已成功轉交，頁面即將更新...')).toBeInTheDocument();
      });

      // 步驟 10: 驗證回調函式被呼叫
      await waitFor(() => {
        expect(mockOnTransferComplete).toHaveBeenCalledWith({
          ...mockCurrentRequest,
          reimbursementerId: 'user-2',
          reimbursementerName: '王五',
          updatedAt: expect.any(String),
        });
      }, { timeout: 2000 });

      // 步驟 11: 驗證彈窗關閉
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('應該處理網路錯誤並允許重試', async () => {
      // 第一次請求失敗
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

      // 等待錯誤訊息顯示
      await waitFor(() => {
        expect(screen.getByText('無法連線至伺服器，請檢查您的網路連線。')).toBeInTheDocument();
        expect(screen.getByText('重試 (3 次剩餘)')).toBeInTheDocument();
      });

      // 設置重試成功的回應
      axios.get.mockResolvedValue({
        data: mockReimbursementContacts,
      });

      // 點擊重試
      const retryButton = screen.getByText('重試 (3 次剩餘)');
      await userEvent.click(retryButton);

      // 驗證重試成功
      await waitFor(() => {
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.queryByText('無法連線至伺服器')).not.toBeInTheDocument();
      });
    });

    it('應該處理轉交過程中的各種錯誤情境', async () => {
      // 設置聯絡人載入成功
      axios.get.mockResolvedValue({
        data: mockReimbursementContacts,
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
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 選擇聯絡人
      const wangWuOption = screen.getByLabelText(/王五/);
      await userEvent.click(wangWuOption);

      // 測試權限不足錯誤
      axios.put.mockRejectedValueOnce({
        response: {
          status: 403,
          data: {
            code: 'PERMISSION_DENIED',
            message: '權限不足：只有目前的報帳負責人才能執行此操作。',
          },
        },
      });

      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      const confirmButtons = screen.getAllByText('確認轉交');
      const dialogConfirmButton = confirmButtons[1];
      await userEvent.click(dialogConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('權限不足：只有目前的報帳負責人才能執行此操作。')).toBeInTheDocument();
      }, { timeout: 3000 });

      // 關閉錯誤訊息並重試
      const cancelButton = screen.getByText('取消');
      await userEvent.click(cancelButton);

      // 測試無效目標使用者錯誤
      axios.put.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            code: 'INVALID_TARGET_USER',
            message: '選擇的使用者沒有報帳權限，請選擇其他人員。',
          },
        },
      });

      await userEvent.click(transferButton);
      const newConfirmButtons = screen.getAllByText('確認轉交');
      const newDialogConfirmButton = newConfirmButtons[1];
      await userEvent.click(newDialogConfirmButton);

      await waitFor(() => {
        expect(screen.getByText('選擇的使用者沒有報帳權限，請選擇其他人員。')).toBeInTheDocument();
      });
    });

    it('應該正確處理使用者取消操作', async () => {
      axios.get.mockResolvedValue({
        data: mockReimbursementContacts,
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
        expect(screen.getByText('王五')).toBeInTheDocument();
      });

      // 選擇聯絡人
      const wangWuOption = screen.getByLabelText(/王五/);
      await userEvent.click(wangWuOption);

      // 點擊轉交按鈕
      const transferButton = screen.getByText('確認轉交');
      await userEvent.click(transferButton);

      // 驗證確認對話框出現
      expect(screen.getByText('確認轉交報帳')).toBeInTheDocument();

      // 點擊取消
      const cancelButtons = screen.getAllByText('取消');
      const dialogCancelButton = cancelButtons[1];
      await userEvent.click(dialogCancelButton);

      // 確認對話框應該關閉
      expect(screen.queryByText('確認轉交報帳')).not.toBeInTheDocument();

      // 主彈窗仍然開啟
      expect(screen.getByText('轉交報帳')).toBeInTheDocument();

      // 選擇狀態應該保持
      expect(wangWuOption).toBeChecked();

      // 沒有呼叫轉交 API
      expect(axios.put).not.toHaveBeenCalled();
    });

    it('應該正確處理空的聯絡人清單情境', async () => {
      // 設置空的聯絡人清單
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

      // 轉交按鈕應該被禁用
      const transferButton = screen.getByText('確認轉交');
      expect(transferButton).toBeDisabled();

      // 不應該有任何聯絡人選項
      expect(screen.queryByText('王五')).not.toBeInTheDocument();
      expect(screen.queryByText('趙六')).not.toBeInTheDocument();
    });

    it('應該正確過濾目前報帳負責人', async () => {
      // 包含目前報帳負責人的聯絡人清單
      const contactsWithCurrentUser = [
        ...mockReimbursementContacts,
        {
          uid: 'user-1', // 目前報帳負責人的 UID
          displayName: '張三', // 目前報帳負責人
          email: 'zhang@example.com',
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
        expect(screen.getByText('王五')).toBeInTheDocument();
        expect(screen.getByText('趙六')).toBeInTheDocument();
        expect(screen.getByText('錢七')).toBeInTheDocument();
      });

      // 目前報帳負責人不應該出現在選項中
      expect(screen.queryByText('zhang@example.com')).not.toBeInTheDocument();
      
      // 但應該在目前報帳負責人資訊中顯示
      expect(screen.getByText('目前報帳負責人：張三')).toBeInTheDocument();
    });
  });

  describe('錯誤恢復測試', () => {
    it('應該在多次網路錯誤後停止重試', async () => {
      // 連續三次網路錯誤
      axios.get
        .mockRejectedValueOnce({ request: {}, message: 'Network Error' })
        .mockRejectedValueOnce({ request: {}, message: 'Network Error' })
        .mockRejectedValueOnce({ request: {}, message: 'Network Error' })
        .mockRejectedValueOnce({ request: {}, message: 'Network Error' });

      render(
        <TransferReimbursementModal
          isOpen={true}
          onClose={mockOnClose}
          currentRequest={mockCurrentRequest}
          onTransferComplete={mockOnTransferComplete}
        />
      );

      // 第一次錯誤
      await waitFor(() => {
        expect(screen.getByText('重試 (3 次剩餘)')).toBeInTheDocument();
      });

      // 第一次重試
      let retryButton = screen.getByText('重試 (3 次剩餘)');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('重試 (2 次剩餘)')).toBeInTheDocument();
      });

      // 第二次重試
      retryButton = screen.getByText('重試 (2 次剩餘)');
      await userEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('重試 (1 次剩餘)')).toBeInTheDocument();
      });

      // 第三次重試
      retryButton = screen.getByText('重試 (1 次剩餘)');
      await userEvent.click(retryButton);

      // 應該不再顯示重試按鈕
      await waitFor(() => {
        expect(screen.queryByText(/重試/)).not.toBeInTheDocument();
      });
    });
  });
});