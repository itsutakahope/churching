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

import { calculatePaymentBreakdown, validateCalculationConsistency, handleCalculationError } from '../paymentCalculationUtils';

describe('AggregationSummary - Payment Breakdown', () => {
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

  it('應該在沒有支票時正常顯示摘要表格', () => {
    const mockDedications = [
      { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
      { amount: 500, method: 'cash', dedicationCategory: '感恩', dedicatorId: 'user2', dedicationDate: '2024-01-01' }
    ];

    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 1500,
      chequeTotal: 0,
      hasCheque: false
    });

    render(<AggregationSummary summary={mockSummary} dedications={mockDedications} />);

    // 應該顯示摘要表格
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    expect(screen.getByText('十一')).toBeInTheDocument();
    expect(screen.getByText('感恩')).toBeInTheDocument();
    expect(screen.getByText('宣教')).toBeInTheDocument();

    // 不應該顯示付款方式明細
    expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
  });

  it('應該在有支票時同時顯示摘要表格和計算式', () => {
    const mockDedications = [
      { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' },
      { amount: 2000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'user2', dedicationDate: '2024-01-01' },
      { amount: 500, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'user3', dedicationDate: '2024-01-01' }
    ];

    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 1500,
      chequeTotal: 2000,
      hasCheque: true
    });

    render(<AggregationSummary summary={mockSummary} dedications={mockDedications} />);

    // 應該同時顯示摘要表格
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    expect(screen.getByText('十一')).toBeInTheDocument();
    expect(screen.getByText('感恩')).toBeInTheDocument();
    expect(screen.getByText('宣教')).toBeInTheDocument();
    
    // 檢查摘要表格中的總計（使用更具體的選擇器）
    const summaryTable = screen.getByRole('table');
    expect(summaryTable).toBeInTheDocument();
    const totalElements = screen.getAllByText('總計');
    expect(totalElements.length).toBeGreaterThanOrEqual(1);

    // 應該同時顯示付款方式明細計算式
    expect(screen.getByText('付款方式明細')).toBeInTheDocument();
    
    // 應該顯示計算式的各個部分
    expect(screen.getByText(/現金 1,500/)).toBeInTheDocument();
    expect(screen.getByText(/支票 2,000/)).toBeInTheDocument();
    expect(screen.getByText(/總計 3,500/)).toBeInTheDocument();
  });

  it('應該在沒有 dedications 時正常顯示', () => {
    render(<AggregationSummary summary={mockSummary} dedications={[]} />);

    // 應該顯示摘要表格
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    
    // 不應該顯示付款方式明細
    expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
  });

  it('應該在計算錯誤時顯示錯誤訊息', () => {
    const mockDedications = [
      { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'user1', dedicationDate: '2024-01-01' }
    ];

    calculatePaymentBreakdown.mockImplementation(() => {
      throw new Error('CALCULATION_ERROR: 測試錯誤');
    });

    handleCalculationError.mockReturnValue({
      type: 'calculation',
      message: '計算過程中發生錯誤，請重試或聯繫系統管理員'
    });

    render(<AggregationSummary summary={mockSummary} dedications={mockDedications} />);

    // 應該顯示錯誤訊息
    expect(screen.getByText('計算錯誤：')).toBeInTheDocument();
    expect(screen.getByText('計算過程中發生錯誤，請重試或聯繫系統管理員')).toBeInTheDocument();
  });

  it('應該在沒有 summary 時返回 null', () => {
    const { container } = render(<AggregationSummary summary={null} dedications={[]} />);
    expect(container.firstChild).toBeNull();
  });
});