import { describe, it, expect, vi } from 'vitest';
import {
  calculatePaymentBreakdown,
  validateCalculationConsistency,
  handleCalculationError
} from '../paymentCalculationUtils.js';

describe('paymentCalculationUtils - Edge Cases', () => {
  describe('calculatePaymentBreakdown - 邊界情況', () => {
    it('應該處理極大金額', () => {
      const dedications = [
        {
          amount: 999999999,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 888888888,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(999999999);
      expect(result.chequeTotal).toBe(888888888);
      expect(result.hasCheque).toBe(true);
    });

    it('應該處理小數金額', () => {
      const dedications = [
        {
          amount: 100.50,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 200.25,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(100.50);
      expect(result.chequeTotal).toBe(200.25);
      expect(result.hasCheque).toBe(true);
    });

    it('應該處理大量記錄', () => {
      const dedications = [];
      for (let i = 0; i < 1000; i++) {
        dedications.push({
          amount: 100,
          method: i % 2 === 0 ? 'cash' : 'cheque',
          dedicationCategory: '十一',
          dedicatorId: `B${String(i).padStart(4, '0')}`,
          dedicationDate: '2025-01-15'
        });
      }

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(50000); // 500 筆現金 * 100
      expect(result.chequeTotal).toBe(50000); // 500 筆支票 * 100
      expect(result.hasCheque).toBe(true);
    });

    it('應該處理混合有效和無效記錄的複雜情況', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const dedications = [
        // 有效記錄
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        // 無效記錄 - 負金額
        {
          amount: -500,
          method: 'cash',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        },
        // 有效記錄
        {
          amount: 2000,
          method: 'cheque',
          dedicationCategory: '宣教',
          dedicatorId: 'B0003',
          dedicationDate: '2025-01-15'
        },
        // 無效記錄 - 無效方式
        {
          amount: 300,
          method: 'invalid',
          dedicationCategory: '特別',
          dedicatorId: 'B0004',
          dedicationDate: '2025-01-15'
        },
        // 有效記錄
        {
          amount: 500,
          method: 'cash',
          dedicationCategory: '慈惠',
          dedicatorId: 'B0005',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(1500); // 1000 + 500
      expect(result.chequeTotal).toBe(2000);
      expect(result.hasCheque).toBe(true);
      expect(consoleSpy).toHaveBeenCalledTimes(3); // 兩筆無效記錄的驗證警告 + 一次跳過記錄的警告
      
      consoleSpy.mockRestore();
    });

    it('應該處理特殊字符和 Unicode 字符', () => {
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一奉獻 🙏',
          dedicatorId: 'B0001-特殊',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 2000,
          method: 'cheque',
          dedicationCategory: '感恩 & 讚美',
          dedicatorId: 'B0002@test',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(1000);
      expect(result.chequeTotal).toBe(2000);
      expect(result.hasCheque).toBe(true);
    });
  });

  describe('validateCalculationConsistency - 邊界情況', () => {
    it('應該處理浮點數精度問題', () => {
      const breakdown = {
        cashTotal: 0.1 + 0.2, // JavaScript 浮點數精度問題
        chequeTotal: 0.3,
        hasCheque: true
      };
      
      // 0.1 + 0.2 + 0.3 在 JavaScript 中不等於 0.6
      const summaryTotal = 0.6;
      
      const result = validateCalculationConsistency(breakdown, summaryTotal);
      expect(result.isConsistent).toBe(true);
    });

    it('應該處理極大數值', () => {
      const breakdown = {
        cashTotal: Number.MAX_SAFE_INTEGER - 1,
        chequeTotal: 1,
        hasCheque: true
      };
      
      const result = validateCalculationConsistency(breakdown, Number.MAX_SAFE_INTEGER);
      expect(result.isConsistent).toBe(true);
    });

    it('應該拒絕包含 NaN 的 breakdown', () => {
      const breakdown = {
        cashTotal: NaN,
        chequeTotal: 1000,
        hasCheque: true
      };
      
      const result = validateCalculationConsistency(breakdown, 1000);
      expect(result.isConsistent).toBe(false);
      expect(result.errors.some(error => error.includes('無效數值'))).toBe(true);
    });

    it('應該拒絕包含 Infinity 的 breakdown', () => {
      const breakdown = {
        cashTotal: Infinity,
        chequeTotal: 1000,
        hasCheque: true
      };
      
      const result = validateCalculationConsistency(breakdown, 1000);
      expect(result.isConsistent).toBe(false);
      expect(result.errors.some(error => error.includes('無效數值'))).toBe(true);
    });
  });

  describe('錯誤恢復和日誌記錄', () => {
    it('應該在計算過程中記錄詳細的統計資訊', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: -100, // 無效
          method: 'cash',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 2000,
          method: 'cheque',
          dedicationCategory: '宣教',
          dedicatorId: 'B0003',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      // 驗證日誌記錄 - 更新為實際的日誌格式
      expect(warnSpy).toHaveBeenCalledWith(
        'Payment breakdown calculation: 1 invalid records were skipped',
        expect.any(Object)
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Payment breakdown calculation completed successfully:',
        expect.objectContaining({
          totalRecords: 3,
          validRecords: 2,
          invalidRecords: 1,
          result: expect.objectContaining({
            cashTotal: 1000,
            chequeTotal: 2000,
            hasCheque: true
          })
        })
      );
      
      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('應該處理計算過程中的異常', () => {
      // 這個測試驗證當在驗證階段就失敗時，記錄會被跳過而不是拋出異常
      // 因為 validateDedication 會在 amount 存取時失敗，導致記錄被標記為無效
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const problematicDedications = [
        {
          get amount() {
            throw new Error('Property access error');
          },
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        }
      ];

      // 應該跳過有問題的記錄，只處理有效的記錄
      const result = calculatePaymentBreakdown(problematicDedications);
      
      expect(result.cashTotal).toBe(1000); // 只計算有效記錄
      expect(result.chequeTotal).toBe(0);
      expect(result.hasCheque).toBe(false);
      
      // 驗證錯誤日誌記錄
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dedication validation exception at index 0:'),
        expect.any(Error),
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('handleCalculationError - 完整錯誤處理', () => {
    it('應該處理複雜的錯誤訊息', () => {
      const complexError = new Error('INVALID_INPUT: 複雜的錯誤訊息包含多種資訊');
      const result = handleCalculationError(complexError);
      
      expect(result.type).toBe('validation');
      expect(result.message).toContain('輸入資料格式錯誤');
    });

    it('應該處理錯誤物件沒有 message 屬性的情況', () => {
      const errorWithoutMessage = {};
      const result = handleCalculationError(errorWithoutMessage);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toContain('發生未預期的錯誤');
    });

    it('應該處理 null 錯誤物件', () => {
      const result = handleCalculationError(null);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toContain('發生未預期的錯誤');
    });
  });
});