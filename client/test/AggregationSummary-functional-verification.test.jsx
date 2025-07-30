import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AggregationSummary from '../AggregationSummary.jsx';

// Mock the payment calculation utils
vi.mock('../paymentCalculationUtils', () => ({
  calculatePaymentBreakdown: vi.fn(),
  validateCalculationConsistency: vi.fn(),
  formatAmount: vi.fn((amount) => amount.toLocaleString('zh-TW')),
  handleCalculationError: vi.fn()
}));

import { calculatePaymentBreakdown, validateCalculationConsistency } from '../paymentCalculationUtils';

describe('AggregationSummary - 功能驗證：同時顯示摘要表格和計算式', () => {
  const mockSummary = {
    totalAmount: 12000,
    byCategory: {
      '十一': 8000,
      '感恩': 2000,
      '宣教': 2000
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    validateCalculationConsistency.mockReturnValue(true);
  });

  describe('場景 1: 無支票情況', () => {
    it('應該只顯示摘要表格，不顯示計算式', () => {
      const mockDedications = [
        { amount: 8000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
        { amount: 2000, method: 'cash', dedicationCategory: '感恩', dedicatorId: 'user2', dedicationDate: '2024-01-01' },
        { amount: 2000, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'user3', dedicationDate: '2024-01-01' }
      ];

      calculatePaymentBreakdown.mockReturnValue({
        cashTotal: 12000,
        chequeTotal: 0,
        hasCheque: false
      });

      render(<AggregationSummary summary={mockSummary} dedications={mockDedications} />);

      // ✅ 應該顯示摘要表格
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('十一')).toBeInTheDocument();
      expect(screen.getByText('感恩')).toBeInTheDocument();
      expect(screen.getByText('宣教')).toBeInTheDocument();
      expect(screen.getByText('總計')).toBeInTheDocument();

      // ✅ 不應該顯示計算式
      expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
      expect(screen.queryByText(/現金.*\+.*支票.*=.*總計/)).not.toBeInTheDocument();
    });
  });

  describe('場景 2: 有支票情況', () => {
    it('應該同時顯示摘要表格和計算式', () => {
      const mockDedications = [
        { amount: 5000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
        { amount: 3000, method: 'cheque', dedicationCategory: '十一', dedicatorId: 'user2', dedicationDate: '2024-01-01' },
        { amount: 1000, method: 'cash', dedicationCategory: '感恩', dedicatorId: 'user3', dedicationDate: '2024-01-01' },
        { amount: 1000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'user4', dedicationDate: '2024-01-01' },
        { amount: 2000, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'user5', dedicationDate: '2024-01-01' }
      ];

      calculatePaymentBreakdown.mockReturnValue({
        cashTotal: 8000,
        chequeTotal: 4000,
        hasCheque: true
      });

      render(<AggregationSummary summary={mockSummary} dedications={mockDedications} />);

      // ✅ 應該顯示摘要表格（原有功能）
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('十一')).toBeInTheDocument();
      expect(screen.getByText('感恩')).toBeInTheDocument();
      expect(screen.getByText('宣教')).toBeInTheDocument();
      
      // 驗證摘要表格中的總計
      const summaryRows = screen.getAllByText('總計');
      expect(summaryRows.length).toBeGreaterThan(0);

      // ✅ 應該額外顯示計算式（新增功能）
      expect(screen.getByText('付款方式明細')).toBeInTheDocument();
      expect(screen.getByText(/現金 8,000/)).toBeInTheDocument();
      expect(screen.getByText(/支票 4,000/)).toBeInTheDocument();
      expect(screen.getByText(/總計 12,000/)).toBeInTheDocument();

      // ✅ 驗證計算式的數學符號
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('=')).toBeInTheDocument();
    });

    it('應該驗證摘要表格和計算式的數據一致性', () => {
      const mockDedications = [
        { amount: 1500, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
        { amount: 2500, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'user2', dedicationDate: '2024-01-01' }
      ];

      calculatePaymentBreakdown.mockReturnValue({
        cashTotal: 1500,
        chequeTotal: 2500,
        hasCheque: true
      });

      const customSummary = {
        totalAmount: 4000,
        byCategory: {
          '十一': 1500,
          '感恩': 2500
        }
      };

      render(<AggregationSummary summary={customSummary} dedications={mockDedications} />);

      // ✅ 摘要表格應該顯示正確的總額
      const summaryTotalElements = screen.getAllByText('4,000');
      expect(summaryTotalElements.length).toBeGreaterThanOrEqual(1);

      // ✅ 計算式應該顯示正確的分解
      expect(screen.getByText(/現金 1,500/)).toBeInTheDocument();
      expect(screen.getByText(/支票 2,500/)).toBeInTheDocument();
      expect(screen.getByText(/總計 4,000/)).toBeInTheDocument();
    });
  });

  describe('場景 3: 邊界情況', () => {
    it('應該在只有支票沒有現金時正確顯示', () => {
      const mockDedications = [
        { amount: 5000, method: 'cheque', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
        { amount: 3000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'user2', dedicationDate: '2024-01-01' }
      ];

      calculatePaymentBreakdown.mockReturnValue({
        cashTotal: 0,
        chequeTotal: 8000,
        hasCheque: true
      });

      const customSummary = {
        totalAmount: 8000,
        byCategory: {
          '十一': 5000,
          '感恩': 3000
        }
      };

      render(<AggregationSummary summary={customSummary} dedications={mockDedications} />);

      // ✅ 應該同時顯示摘要表格和計算式
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('付款方式明細')).toBeInTheDocument();

      // ✅ 計算式應該正確顯示零現金
      expect(screen.getByText(/現金 0/)).toBeInTheDocument();
      expect(screen.getByText(/支票 8,000/)).toBeInTheDocument();
      expect(screen.getByText(/總計 8,000/)).toBeInTheDocument();
    });
  });
});