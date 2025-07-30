import { describe, it, expect, vi } from 'vitest';
import {
  validateDedication,
  calculatePaymentBreakdown,
  validateCalculationConsistency,
  formatAmount,
  handleCalculationError
} from '../paymentCalculationUtils.js';

describe('paymentCalculationUtils', () => {
  describe('validateDedication', () => {
    it('應該驗證有效的奉獻記錄', () => {
      const validDedication = {
        amount: 1000,
        method: 'cash',
        dedicationCategory: '十一',
        dedicatorId: 'B0001',
        dedicationDate: '2025-01-15'
      };
      
      const result = validateDedication(validDedication);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該拒絕無效的奉獻記錄 - null 或 undefined', () => {
      const result1 = validateDedication(null);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('記錄不是有效的物件');
      
      const result2 = validateDedication(undefined);
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('記錄不是有效的物件');
      
      const result3 = validateDedication({});
      expect(result3.isValid).toBe(false);
      expect(result3.errors.length).toBeGreaterThan(0);
    });

    it('應該拒絕無效的金額', () => {
      const invalidAmount = {
        amount: -100,
        method: 'cash',
        dedicationCategory: '十一',
        dedicatorId: 'B0001',
        dedicationDate: '2025-01-15'
      };
      
      const result1 = validateDedication(invalidAmount);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('金額必須大於 0');
      
      const result2 = validateDedication({ ...invalidAmount, amount: 0 });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('金額必須大於 0');
      
      const result3 = validateDedication({ ...invalidAmount, amount: 'invalid' });
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('金額必須是數字');
    });

    it('應該拒絕無效的奉獻方式', () => {
      const invalidMethod = {
        amount: 1000,
        method: 'invalid',
        dedicationCategory: '十一',
        dedicatorId: 'B0001',
        dedicationDate: '2025-01-15'
      };
      
      const result1 = validateDedication(invalidMethod);
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('奉獻方式必須是 cash 或 cheque');
      
      const result2 = validateDedication({ ...invalidMethod, method: null });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('缺少奉獻方式');
    });

    it('應該拒絕缺少必要欄位的記錄', () => {
      const baseDedication = {
        amount: 1000,
        method: 'cash',
        dedicationCategory: '十一',
        dedicatorId: 'B0001',
        dedicationDate: '2025-01-15'
      };

      const result1 = validateDedication({ ...baseDedication, dedicationCategory: null });
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('缺少奉獻科目');
      
      const result2 = validateDedication({ ...baseDedication, dedicatorId: '' });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('缺少奉獻者 ID');
      
      const result3 = validateDedication({ ...baseDedication, dedicationDate: null });
      expect(result3.isValid).toBe(false);
      expect(result3.errors).toContain('缺少奉獻日期');
    });
  });

  describe('calculatePaymentBreakdown', () => {
    it('應該正確計算純現金奉獻', () => {
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 500,
          method: 'cash',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(1500);
      expect(result.chequeTotal).toBe(0);
      expect(result.hasCheque).toBe(false);
    });

    it('應該正確計算純支票奉獻', () => {
      const dedications = [
        {
          amount: 2000,
          method: 'cheque',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 1000,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(0);
      expect(result.chequeTotal).toBe(3000);
      expect(result.hasCheque).toBe(true);
    });

    it('應該正確計算混合支付方式', () => {
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 2000,
          method: 'cheque',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 500,
          method: 'cash',
          dedicationCategory: '宣教',
          dedicatorId: 'B0003',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(1500);
      expect(result.chequeTotal).toBe(2000);
      expect(result.hasCheque).toBe(true);
    });

    it('應該處理空陣列', () => {
      const result = calculatePaymentBreakdown([]);
      
      expect(result.cashTotal).toBe(0);
      expect(result.chequeTotal).toBe(0);
      expect(result.hasCheque).toBe(false);
    });

    it('應該拋出錯誤當輸入不是陣列', () => {
      expect(() => calculatePaymentBreakdown(null)).toThrow('INVALID_INPUT');
      expect(() => calculatePaymentBreakdown(undefined)).toThrow('INVALID_INPUT');
      expect(() => calculatePaymentBreakdown('invalid')).toThrow('INVALID_INPUT');
      expect(() => calculatePaymentBreakdown({})).toThrow('INVALID_INPUT');
    });

    it('應該跳過無效記錄並記錄警告', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        },
        {
          amount: -100, // 無效金額
          method: 'cash',
          dedicationCategory: '感恩',
          dedicatorId: 'B0002',
          dedicationDate: '2025-01-15'
        },
        {
          amount: 500,
          method: 'cash',
          dedicationCategory: '宣教',
          dedicatorId: 'B0003',
          dedicationDate: '2025-01-15'
        }
      ];

      const result = calculatePaymentBreakdown(dedications);
      
      expect(result.cashTotal).toBe(1500); // 只計算有效記錄
      expect(result.chequeTotal).toBe(0);
      expect(result.hasCheque).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Payment breakdown calculation: 1 invalid records were skipped',
        expect.any(Object)
      );
      
      consoleSpy.mockRestore();
    });

    it('應該拋出錯誤當所有記錄都無效', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const invalidDedications = [
        { amount: -100, method: 'invalid' },
        { amount: 'invalid', method: 'cash' },
        null
      ];

      expect(() => calculatePaymentBreakdown(invalidDedications))
        .toThrow('DATA_VALIDATION_ERROR');
      
      consoleSpy.mockRestore();
    });

    it('應該記錄計算統計資訊', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const dedications = [
        {
          amount: 1000,
          method: 'cash',
          dedicationCategory: '十一',
          dedicatorId: 'B0001',
          dedicationDate: '2025-01-15'
        }
      ];

      calculatePaymentBreakdown(dedications);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Payment breakdown calculation completed successfully:',
        expect.objectContaining({
          totalRecords: 1,
          validRecords: 1,
          invalidRecords: 0,
          result: expect.objectContaining({
            cashTotal: 1000,
            chequeTotal: 0,
            hasCheque: false
          })
        })
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('validateCalculationConsistency', () => {
    it('應該驗證計算結果與摘要總額的一致性', () => {
      const breakdown = {
        cashTotal: 1500,
        chequeTotal: 2000,
        hasCheque: true
      };
      
      const result1 = validateCalculationConsistency(breakdown, 3500);
      expect(result1.isConsistent).toBe(true);
      
      const result2 = validateCalculationConsistency(breakdown, 3500.01);
      expect(result2.isConsistent).toBe(true); // 在誤差範圍內
      
      const result3 = validateCalculationConsistency(breakdown, 3600);
      expect(result3.isConsistent).toBe(false); // 超出誤差範圍
    });

    it('應該處理無效輸入', () => {
      const result1 = validateCalculationConsistency(null, 1000);
      expect(result1.isConsistent).toBe(false);
      expect(result1.errors).toContain('breakdown 參數無效');
      
      const result2 = validateCalculationConsistency({}, 'invalid');
      expect(result2.isConsistent).toBe(false);
      expect(result2.errors.some(error => error.includes('summaryTotal 必須是數字'))).toBe(true);
    });
  });

  describe('formatAmount', () => {
    it('應該正確格式化金額', () => {
      expect(formatAmount(1000)).toBe('1,000');
      expect(formatAmount(1234567)).toBe('1,234,567');
      expect(formatAmount(0)).toBe('0');
    });

    it('應該處理無效輸入', () => {
      expect(formatAmount('invalid')).toBe('0');
      expect(formatAmount(null)).toBe('0');
      expect(formatAmount(undefined)).toBe('0');
      expect(formatAmount(NaN)).toBe('0');
    });
  });

  describe('handleCalculationError', () => {
    it('應該正確分類驗證錯誤', () => {
      const validationError = new Error('INVALID_INPUT: test error');
      const result = handleCalculationError(validationError);
      
      expect(result.type).toBe('validation');
      expect(result.message).toContain('輸入資料格式錯誤');
    });

    it('應該正確分類資料驗證錯誤', () => {
      const dataError = new Error('DATA_VALIDATION_ERROR: test error');
      const result = handleCalculationError(dataError);
      
      expect(result.type).toBe('validation');
      expect(result.message).toContain('奉獻記錄資料無效');
    });

    it('應該正確分類計算錯誤', () => {
      const calcError = new Error('CALCULATION_ERROR: test error');
      const result = handleCalculationError(calcError);
      
      expect(result.type).toBe('calculation');
      expect(result.message).toContain('計算過程中發生錯誤');
    });

    it('應該處理未知錯誤', () => {
      const unknownError = new Error('Some unknown error');
      const result = handleCalculationError(unknownError);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toContain('發生未預期的錯誤');
    });

    it('應該處理沒有訊息的錯誤', () => {
      const errorWithoutMessage = new Error();
      const result = handleCalculationError(errorWithoutMessage);
      
      expect(result.type).toBe('unknown');
      expect(result.message).toContain('發生未預期的錯誤');
    });
  });
});