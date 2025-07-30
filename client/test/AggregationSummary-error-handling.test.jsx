import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AggregationSummary from '../AggregationSummary.jsx';

describe('AggregationSummary - Error Handling and Graceful Degradation', () => {
  let consoleSpy;

  beforeEach(() => {
    // Mock console methods to capture logs
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Restore console methods
    vi.restoreAllMocks();
  });

  const mockSummary = {
    totalAmount: 1500,
    byCategory: {
      '十一': 1000,
      '感恩': 500
    }
  };

  describe('Graceful Degradation', () => {
    it('應該在沒有 summary 時返回 null', () => {
      const { container } = render(<AggregationSummary summary={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('應該在沒有 dedications 時顯示正常摘要', () => {
      render(<AggregationSummary summary={mockSummary} dedications={[]} />);
      
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('十一')).toBeInTheDocument();
      expect(screen.getByText('感恩')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
      
      // 不應該顯示付款方式明細
      expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
    });

    it('應該在計算錯誤時優雅降級', async () => {
      // 提供會導致計算錯誤的 dedications
      const invalidDedications = [
        { amount: 'not a number', method: 'cash' }, // 無效資料
        null, // null 記錄
        { amount: -100, method: 'invalid' } // 無效方式
      ];

      render(<AggregationSummary summary={mockSummary} dedications={invalidDedications} />);
      
      // 應該顯示正常的摘要表格
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('十一')).toBeInTheDocument();
      
      // 應該顯示錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/計算錯誤/)).toBeInTheDocument();
      });
      
      // 不應該顯示付款方式明細（因為計算失敗）
      expect(screen.queryByText('付款方式明細')).not.toBeInTheDocument();
      
      // 應該記錄錯誤到控制台
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('應該在健康檢查失敗時優雅降級', async () => {
      // 提供無效的 summary 總額
      const invalidSummary = {
        totalAmount: 'not a number',
        byCategory: {
          '十一': 1000
        }
      };

      render(<AggregationSummary summary={invalidSummary} dedications={[]} />);
      
      // 應該顯示基本摘要結構
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      
      // 應該顯示系統錯誤訊息
      await waitFor(() => {
        expect(screen.getByText(/系統檢查發現資料異常/)).toBeInTheDocument();
      });
    });
  });

  describe('Consistency Validation', () => {
    it('應該在計算結果不一致時顯示警告', async () => {
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user1',
          dedicationDate: '2024-01-01'
        }
      ];

      // summary 總額與 dedications 總額不一致
      const inconsistentSummary = {
        totalAmount: 1500, // 與 dedications 總額 1000 不一致
        byCategory: {
          '十一': 1500
        }
      };

      render(<AggregationSummary summary={inconsistentSummary} dedications={dedications} />);
      
      // 應該顯示正常的摘要
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      
      // 應該顯示一致性警告
      await waitFor(() => {
        expect(screen.getByText(/計算結果與摘要總額存在差異/)).toBeInTheDocument();
      });
      
      // 應該記錄警告到控制台
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('應該在計算結果一致時正常顯示', async () => {
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user1',
          dedicationDate: '2024-01-01'
        },
        {
          amount: 500,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'user2',
          dedicationDate: '2024-01-01'
        }
      ];

      render(<AggregationSummary summary={mockSummary} dedications={dedications} />);
      
      // 應該顯示正常的摘要
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getAllByText('1,500')).toHaveLength(2); // 摘要表格和計算式都會顯示
      
      // 應該顯示付款方式明細（因為有支票）
      await waitFor(() => {
        expect(screen.getByText('付款方式明細')).toBeInTheDocument();
      });
      
      // 不應該顯示錯誤訊息
      expect(screen.queryByText(/計算錯誤/)).not.toBeInTheDocument();
      expect(screen.queryByText(/差異/)).not.toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('應該正確顯示錯誤訊息的樣式', async () => {
      const invalidDedications = [null, undefined, 'not an object'];

      render(<AggregationSummary summary={mockSummary} dedications={invalidDedications} />);
      
      await waitFor(() => {
        const errorElement = screen.getByText(/計算錯誤/);
        expect(errorElement).toBeInTheDocument();
        
        // 檢查錯誤訊息的樣式類別
        const errorContainer = errorElement.closest('div');
        expect(errorContainer).toHaveClass('bg-danger-50');
        expect(errorContainer).toHaveClass('dark:bg-danger-dark/20');
        expect(errorContainer).toHaveClass('border-danger-200');
        expect(errorContainer).toHaveClass('dark:border-danger-dark/40');
      });
    });

    it('應該在深色模式下正確顯示錯誤訊息', async () => {
      // 模擬深色模式
      document.documentElement.classList.add('dark');
      
      const invalidDedications = [{ invalid: 'data' }];

      render(<AggregationSummary summary={mockSummary} dedications={invalidDedications} />);
      
      await waitFor(() => {
        const errorElement = screen.getByText(/計算錯誤/);
        expect(errorElement).toBeInTheDocument();
        
        // 檢查錯誤元素的父容器是否有正確的樣式
        const errorContainer = errorElement.closest('p');
        expect(errorContainer).toHaveClass('text-danger-600');
        expect(errorContainer).toHaveClass('dark:text-danger-dark');
      });
      
      // 清理
      document.documentElement.classList.remove('dark');
    });
  });

  describe('Logging and Monitoring', () => {
    it('應該記錄成功的計算過程', async () => {
      const validDedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user1',
          dedicationDate: '2024-01-01'
        },
        {
          amount: 500,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'user2',
          dedicationDate: '2024-01-01'
        }
      ];

      render(<AggregationSummary summary={mockSummary} dedications={validDedications} />);
      
      await waitFor(() => {
        // 應該記錄計算開始
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('AggregationSummary: Starting payment breakdown calculation'),
          expect.any(Object)
        );
        
        // 應該記錄計算成功
        expect(consoleSpy.log).toHaveBeenCalledWith(
          expect.stringContaining('AggregationSummary: Payment breakdown calculation successful'),
          expect.any(Object)
        );
      });
    });

    it('應該記錄健康檢查警告', async () => {
      const emptySummary = {
        totalAmount: -100, // 負數總額會產生警告
        byCategory: {
          '十一': -100
        }
      };

      render(<AggregationSummary summary={emptySummary} dedications={[]} />);
      
      await waitFor(() => {
        // 應該記錄健康檢查警告
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('[AggregationSummary] System health check warnings detected'),
          expect.any(Object)
        );
      });
    });

    it('應該記錄優雅降級事件', async () => {
      const invalidDedications = 'not an array';

      render(<AggregationSummary summary={mockSummary} dedications={invalidDedications} />);
      
      await waitFor(() => {
        // 應該記錄健康檢查失敗（這會觸發降級）
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          expect.stringContaining('System health check failed'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('應該處理空的 byCategory 物件', () => {
      const emptySummary = {
        totalAmount: 0,
        byCategory: {}
      };

      render(<AggregationSummary summary={emptySummary} dedications={[]} />);
      
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // 總計應該顯示 0
    });

    it('應該處理非常大的數值', async () => {
      const largeDedications = [
        {
          amount: Number.MAX_SAFE_INTEGER,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user1',
          dedicationDate: '2024-01-01'
        }
      ];

      const largeSummary = {
        totalAmount: Number.MAX_SAFE_INTEGER,
        byCategory: {
          '十一': Number.MAX_SAFE_INTEGER
        }
      };

      render(<AggregationSummary summary={largeSummary} dedications={largeDedications} />);
      
      // 應該能夠處理大數值而不崩潰
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
      
      await waitFor(() => {
        // 應該成功計算而不顯示錯誤
        expect(screen.queryByText(/計算錯誤/)).not.toBeInTheDocument();
      });
    });

    it('應該處理浮點數精度問題', async () => {
      const floatDedications = [
        {
          amount: 0.1,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user1',
          dedicationDate: '2024-01-01'
        },
        {
          amount: 0.2,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'user2',
          dedicationDate: '2024-01-01'
        }
      ];

      const floatSummary = {
        totalAmount: 0.3,
        byCategory: {
          '十一': 0.3
        }
      };

      render(<AggregationSummary summary={floatSummary} dedications={floatDedications} />);
      
      // 應該能夠處理浮點數而不出現一致性錯誤
      await waitFor(() => {
        expect(screen.queryByText(/差異/)).not.toBeInTheDocument();
      });
    });
  });
});