import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AggregationSummary from '../AggregationSummary';

// Mock the payment calculation utils
vi.mock('../paymentCalculationUtils', () => ({
  calculatePaymentBreakdown: vi.fn(),
  validateCalculationConsistency: vi.fn(() => true),
  formatAmount: vi.fn((amount) => amount.toLocaleString('zh-TW')),
  handleCalculationError: vi.fn(() => ({ message: '計算錯誤' }))
}));

import { calculatePaymentBreakdown } from '../paymentCalculationUtils';

describe('PaymentBreakdownDisplay - Integration with AggregationSummary', () => {
  const mockSummary = {
    totalAmount: 12000,
    byCategory: {
      '十一': 8000,
      '感恩': 2000,
      '宣教': 2000
    }
  };

  const mockDedications = [
    { amount: 5000, method: 'cash', dedicationCategory: '十一' },
    { amount: 3000, method: 'cheque', dedicationCategory: '十一' },
    { amount: 2000, method: 'cash', dedicationCategory: '感恩' },
    { amount: 2000, method: 'cash', dedicationCategory: '宣教' }
  ];

  it('should render PaymentBreakdownDisplay as part of AggregationSummary when cheques are present', () => {
    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 9000,
      chequeTotal: 3000,
      hasCheque: true
    });

    render(
      <AggregationSummary 
        summary={mockSummary} 
        dedications={mockDedications} 
      />
    );

    // 檢查摘要表格存在
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    expect(screen.getByText('十一')).toBeInTheDocument();
    expect(screen.getByText('感恩')).toBeInTheDocument();
    expect(screen.getByText('宣教')).toBeInTheDocument();

    // 檢查 PaymentBreakdownDisplay 組件被渲染
    expect(screen.getByText('付款方式明細')).toBeInTheDocument();
    // 由於文字被分割到多個元素中，檢查數字是否存在
    expect(screen.getAllByText('9,000')).toHaveLength(2); // 桌面和移動版本
    expect(screen.getAllByText('3,000')).toHaveLength(2);
    expect(screen.getAllByText('12,000')).toHaveLength(2); // 摘要表格 + 移動版本（桌面版本在同一個 span 中）
  });

  it('should not render PaymentBreakdownDisplay when no cheques are present', () => {
    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 12000,
      chequeTotal: 0,
      hasCheque: false
    });

    render(
      <AggregationSummary 
        summary={mockSummary} 
        dedications={mockDedications} 
      />
    );

    // 檢查摘要表格存在
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();

    // 檢查 PaymentBreakdownDisplay 組件不被渲染
    expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
  });

  it('should maintain proper visual hierarchy between summary table and breakdown display', () => {
    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 7000,
      chequeTotal: 5000,
      hasCheque: true
    });

    const { container } = render(
      <AggregationSummary 
        summary={mockSummary} 
        dedications={mockDedications} 
      />
    );

    // 檢查摘要表格在前
    const summaryTable = container.querySelector('table');
    expect(summaryTable).toBeInTheDocument();

    // 檢查 PaymentBreakdownDisplay 在摘要表格之後（更新為新的 CSS 類別）
    const breakdownDisplay = container.querySelector('.mt-6.pt-6.border-t-2');
    expect(breakdownDisplay).toBeInTheDocument();

    // 檢查視覺分隔（邊框）- 更新為品牌色彩
    expect(breakdownDisplay.className).toContain('border-t-2');
    expect(breakdownDisplay.className).toContain('border-glory-red-200');
  });

  it('should pass correct props to PaymentBreakdownDisplay', () => {
    const mockBreakdown = {
      cashTotal: 8500,
      chequeTotal: 3500,
      hasCheque: true
    };

    calculatePaymentBreakdown.mockReturnValue(mockBreakdown);

    render(
      <AggregationSummary 
        summary={mockSummary} 
        dedications={mockDedications} 
      />
    );

    // 驗證 PaymentBreakdownDisplay 接收到正確的 props（文字被分割到多個元素）
    expect(screen.getAllByText('8,500')).toHaveLength(2); // 桌面和移動版本
    expect(screen.getAllByText('3,500')).toHaveLength(2);
    expect(screen.getAllByText('12,000')).toHaveLength(2); // 摘要表格 + 移動版本（桌面版本在同一個 span 中）
  });

  it('should handle edge case when breakdown calculation returns null', () => {
    calculatePaymentBreakdown.mockReturnValue({
      cashTotal: 0,
      chequeTotal: 0,
      hasCheque: false
    });

    render(
      <AggregationSummary 
        summary={mockSummary} 
        dedications={[]} 
      />
    );

    // 檢查摘要表格仍然存在
    expect(screen.getByText('計算結果摘要')).toBeInTheDocument();

    // 檢查 PaymentBreakdownDisplay 不被渲染
    expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
  });
});