import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculatePaymentBreakdown,
  validateDedication,
  validateCalculationConsistency,
  formatAmount,
  handleCalculationError,
  performHealthCheck
} from '../paymentCalculationUtils.js';

describe('Payment Calculation Utils - Comprehensive Unit Tests', () => {
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

  describe('calculatePaymentBreakdown - 核心功能測試', () => {
    describe('純現金奉獻測試', () => {
      it('應該正確計算單筆現金奉獻', () => {
        const dedications = [
          {
            amount: 1000,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(1000);
        expect(result.chequeTotal).toBe(0);
        expect(result.hasCheque).toBe(false);
      });

      it('應該正確計算多筆現金奉獻', () => {
        const dedications = [
          {
            amount: 1000,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 500,
            method: 'cash',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 2000,
            method: 'cash',
            dedicationCategory: '宣教',
            dedicatorId: 'user003',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(3500);
        expect(result.chequeTotal).toBe(0);
        expect(result.hasCheque).toBe(false);
      });

      it('應該處理小數金額的現金奉獻', () => {
        const dedications = [
          {
            amount: 100.50,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 250.25,
            method: 'cash',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(350.75);
        expect(result.chequeTotal).toBe(0);
        expect(result.hasCheque).toBe(false);
      });
    });

    describe('純支票奉獻測試', () => {
      it('應該正確計算單筆支票奉獻', () => {
        const dedications = [
          {
            amount: 5000,
            method: 'cheque',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(0);
        expect(result.chequeTotal).toBe(5000);
        expect(result.hasCheque).toBe(true);
      });

      it('應該正確計算多筆支票奉獻', () => {
        const dedications = [
          {
            amount: 3000,
            method: 'cheque',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 2000,
            method: 'cheque',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 1500,
            method: 'cheque',
            dedicationCategory: '宣教',
            dedicatorId: 'user003',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(0);
        expect(result.chequeTotal).toBe(6500);
        expect(result.hasCheque).toBe(true);
      });

      it('應該處理小數金額的支票奉獻', () => {
        const dedications = [
          {
            amount: 1500.75,
            method: 'cheque',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 800.25,
            method: 'cheque',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(0);
        expect(result.chequeTotal).toBe(2301);
        expect(result.hasCheque).toBe(true);
      });
    });

    describe('混合支付方式測試', () => {
      it('應該正確計算現金和支票混合奉獻', () => {
        const dedications = [
          {
            amount: 1000,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 2000,
            method: 'cheque',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 500,
            method: 'cash',
            dedicationCategory: '宣教',
            dedicatorId: 'user003',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 1500,
            method: 'cheque',
            dedicationCategory: '慈惠',
            dedicatorId: 'user004',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(1500);
        expect(result.chequeTotal).toBe(3500);
        expect(result.hasCheque).toBe(true);
      });

      it('應該正確處理複雜的混合支付情況', () => {
        const dedications = [
          { amount: 100, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          { amount: 200, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' },
          { amount: 150, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'u3', dedicationDate: '2025-01-15' },
          { amount: 300, method: 'cheque', dedicationCategory: '慈惠', dedicatorId: 'u4', dedicationDate: '2025-01-15' },
          { amount: 75, method: 'cash', dedicationCategory: '建堂', dedicatorId: 'u5', dedicationDate: '2025-01-15' },
          { amount: 250, method: 'cheque', dedicationCategory: '特別', dedicatorId: 'u6', dedicationDate: '2025-01-15' }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(325); // 100 + 150 + 75
        expect(result.chequeTotal).toBe(750); // 200 + 300 + 250
        expect(result.hasCheque).toBe(true);
      });

      it('應該處理混合支付中的小數金額', () => {
        const dedications = [
          { amount: 100.50, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          { amount: 200.25, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' },
          { amount: 150.75, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'u3', dedicationDate: '2025-01-15' },
          { amount: 300.10, method: 'cheque', dedicationCategory: '慈惠', dedicatorId: 'u4', dedicationDate: '2025-01-15' }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(251.25); // 100.50 + 150.75
        expect(result.chequeTotal).toBe(500.35); // 200.25 + 300.10
        expect(result.hasCheque).toBe(true);
      });
    });

    describe('邊界情況測試', () => {
      it('應該處理空陣列', () => {
        const result = calculatePaymentBreakdown([]);
        
        expect(result.cashTotal).toBe(0);
        expect(result.chequeTotal).toBe(0);
        expect(result.hasCheque).toBe(false);
      });

      it('應該處理極大金額', () => {
        const dedications = [
          {
            amount: 999999999,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 888888888,
            method: 'cheque',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(999999999);
        expect(result.chequeTotal).toBe(888888888);
        expect(result.hasCheque).toBe(true);
      });

      it('應該處理極小金額', () => {
        const dedications = [
          {
            amount: 0.01,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          {
            amount: 0.02,
            method: 'cheque',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(0.01);
        expect(result.chequeTotal).toBe(0.02);
        expect(result.hasCheque).toBe(true);
      });

      it('應該處理大量記錄', () => {
        const dedications = [];
        const recordCount = 1000;
        
        for (let i = 0; i < recordCount; i++) {
          dedications.push({
            amount: 100,
            method: i % 2 === 0 ? 'cash' : 'cheque',
            dedicationCategory: '十一',
            dedicatorId: `user${String(i).padStart(3, '0')}`,
            dedicationDate: '2025-01-15'
          });
        }

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(50000); // 500 筆現金 * 100
        expect(result.chequeTotal).toBe(50000); // 500 筆支票 * 100
        expect(result.hasCheque).toBe(true);
      });
    });

    describe('錯誤處理測試', () => {
      it('應該拋出錯誤當輸入不是陣列', () => {
        expect(() => calculatePaymentBreakdown(null)).toThrow('INVALID_INPUT');
        expect(() => calculatePaymentBreakdown(undefined)).toThrow('INVALID_INPUT');
        expect(() => calculatePaymentBreakdown('not an array')).toThrow('INVALID_INPUT');
        expect(() => calculatePaymentBreakdown(123)).toThrow('INVALID_INPUT');
        expect(() => calculatePaymentBreakdown({})).toThrow('INVALID_INPUT');
      });

      it('應該跳過無效記錄並繼續處理', () => {
        const dedications = [
          // 有效記錄
          {
            amount: 1000,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          // 無效記錄 - 負金額
          {
            amount: -500,
            method: 'cash',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          },
          // 有效記錄
          {
            amount: 2000,
            method: 'cheque',
            dedicationCategory: '宣教',
            dedicatorId: 'user003',
            dedicationDate: '2025-01-15'
          },
          // 無效記錄 - 無效方式
          {
            amount: 300,
            method: 'invalid',
            dedicationCategory: '慈惠',
            dedicatorId: 'user004',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        expect(result.cashTotal).toBe(1000);
        expect(result.chequeTotal).toBe(2000);
        expect(result.hasCheque).toBe(true);
        
        // 應該記錄警告
        expect(consoleSpy.warn).toHaveBeenCalledWith(
          'Payment breakdown calculation: 2 invalid records were skipped',
          expect.any(Object)
        );
      });

      it('應該拋出錯誤當所有記錄都無效', () => {
        const invalidDedications = [
          { amount: -100, method: 'invalid' },
          { amount: 'not a number', method: 'cash' },
          null,
          { amount: 0, method: 'cheque' }
        ];

        expect(() => calculatePaymentBreakdown(invalidDedications)).toThrow('DATA_VALIDATION_ERROR');
      });

      it('應該處理記錄中的異常情況', () => {
        const problematicDedications = [
          // 正常記錄
          {
            amount: 1000,
            method: 'cash',
            dedicationCategory: '十一',
            dedicatorId: 'user001',
            dedicationDate: '2025-01-15'
          },
          // 會導致屬性存取錯誤的記錄
          {
            get amount() {
              throw new Error('Property access error');
            },
            method: 'cash',
            dedicationCategory: '感恩',
            dedicatorId: 'user002',
            dedicationDate: '2025-01-15'
          }
        ];

        const result = calculatePaymentBreakdown(problematicDedications);
        
        // 應該跳過有問題的記錄，只處理有效記錄
        expect(result.cashTotal).toBe(1000);
        expect(result.chequeTotal).toBe(0);
        expect(result.hasCheque).toBe(false);
      });
    });

    describe('計算結果準確性驗證', () => {
      it('應該確保計算結果的數學準確性', () => {
        const testCases = [
          {
            dedications: [
              { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
              { amount: 2000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' }
            ],
            expectedCash: 1000,
            expectedCheque: 2000,
            expectedTotal: 3000
          },
          {
            dedications: [
              { amount: 500.50, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
              { amount: 750.25, method: 'cash', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' },
              { amount: 1200.75, method: 'cheque', dedicationCategory: '宣教', dedicatorId: 'u3', dedicationDate: '2025-01-15' }
            ],
            expectedCash: 1250.75,
            expectedCheque: 1200.75,
            expectedTotal: 2451.50
          }
        ];

        testCases.forEach((testCase, index) => {
          const result = calculatePaymentBreakdown(testCase.dedications);
          
          expect(result.cashTotal).toBe(testCase.expectedCash);
          expect(result.chequeTotal).toBe(testCase.expectedCheque);
          expect(result.cashTotal + result.chequeTotal).toBe(testCase.expectedTotal);
          
          // 驗證 hasCheque 標誌的正確性
          expect(result.hasCheque).toBe(testCase.expectedCheque > 0);
        });
      });

      it('應該處理浮點數精度問題', () => {
        const dedications = [
          { amount: 0.1, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          { amount: 0.2, method: 'cash', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' },
          { amount: 0.3, method: 'cheque', dedicationCategory: '宣教', dedicatorId: 'u3', dedicationDate: '2025-01-15' }
        ];

        const result = calculatePaymentBreakdown(dedications);
        
        // 驗證浮點數計算的準確性
        expect(Math.abs(result.cashTotal - 0.3)).toBeLessThan(0.001);
        expect(Math.abs(result.chequeTotal - 0.3)).toBeLessThan(0.001);
        expect(result.hasCheque).toBe(true);
      });
    });

    describe('一致性驗證測試', () => {
      it('應該驗證計算結果與預期總額的一致性', () => {
        const dedications = [
          { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          { amount: 2000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' }
        ];

        const result = calculatePaymentBreakdown(dedications);
        const expectedTotal = 3000;
        
        const consistencyResult = validateCalculationConsistency(result, expectedTotal);
        
        expect(consistencyResult.isConsistent).toBe(true);
        expect(consistencyResult.calculatedTotal).toBe(expectedTotal);
        expect(consistencyResult.difference).toBe(0);
      });

      it('應該檢測計算結果與預期總額的不一致', () => {
        const breakdown = {
          cashTotal: 1000,
          chequeTotal: 2000,
          hasCheque: true
        };
        
        const incorrectTotal = 3100; // 差異 100 元
        
        const consistencyResult = validateCalculationConsistency(breakdown, incorrectTotal);
        
        expect(consistencyResult.isConsistent).toBe(false);
        expect(consistencyResult.difference).toBe(100);
        expect(consistencyResult.errors.some(error => error.includes('不一致'))).toBe(true);
      });
    });
  });

  describe('validateDedication - 詳細驗證測試', () => {
    it('應該驗證完整的有效記錄', () => {
      const validDedication = {
        amount: 1000,
        method: 'cash',
        dedicationCategory: '十一奉獻',
        dedicatorId: 'user123',
        dedicationDate: '2025-01-15'
      };

      const result = validateDedication(validDedication);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該檢測所有可能的驗證錯誤', () => {
      const invalidDedication = {
        amount: -100,        // 無效金額
        method: 'invalid',   // 無效方式
        dedicationCategory: '', // 空科目
        dedicatorId: null,   // 無效 ID
        dedicationDate: 123  // 無效日期類型
      };

      const result = validateDedication(invalidDedication);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors).toContain('金額必須大於 0');
      expect(result.errors).toContain('奉獻方式必須是 cash 或 cheque');
      expect(result.errors.some(error => error.includes('奉獻科目'))).toBe(true);
      expect(result.errors).toContain('缺少奉獻者 ID');
      expect(result.errors).toContain('奉獻日期必須是字串');
    });

    it('應該處理各種邊界情況', () => {
      const testCases = [
        {
          input: null,
          expectedError: '記錄不是有效的物件'
        },
        {
          input: undefined,
          expectedError: '記錄不是有效的物件'
        },
        {
          input: { amount: 0, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          expectedError: '金額必須大於 0'
        },
        {
          input: { amount: Infinity, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          expectedError: '金額必須是有限數值'
        },
        {
          input: { amount: NaN, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
          expectedError: '金額必須是有限數值'
        }
      ];

      testCases.forEach((testCase, index) => {
        const result = validateDedication(testCase.input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes(testCase.expectedError) || error === testCase.expectedError)).toBe(true);
      });
    });
  });

  describe('錯誤處理和恢復機制測試', () => {
    it('應該正確分類和處理不同類型的錯誤', () => {
      const errorTypes = [
        {
          error: new Error('INVALID_INPUT: test error'),
          expectedType: 'validation',
          expectedMessage: '輸入資料格式錯誤'
        },
        {
          error: new Error('DATA_VALIDATION_ERROR: test error'),
          expectedType: 'validation',
          expectedMessage: '奉獻記錄資料無效'
        },
        {
          error: new Error('CALCULATION_ERROR: test error'),
          expectedType: 'calculation',
          expectedMessage: '計算過程中發生錯誤'
        },
        {
          error: new TypeError('Cannot read property'),
          expectedType: 'type_error',
          expectedMessage: '資料類型錯誤'
        },
        {
          error: new RangeError('Invalid range'),
          expectedType: 'range_error',
          expectedMessage: '數值範圍錯誤'
        },
        {
          error: new Error('Unknown error'),
          expectedType: 'unknown',
          expectedMessage: '發生未預期的錯誤'
        }
      ];

      errorTypes.forEach((testCase) => {
        const result = handleCalculationError(testCase.error);
        
        expect(result.type).toBe(testCase.expectedType);
        expect(result.message).toContain(testCase.expectedMessage);
        expect(result.originalError).toBeDefined();
      });
    });

    it('應該處理 null 和 undefined 錯誤', () => {
      const result1 = handleCalculationError(null);
      expect(result1.type).toBe('unknown');
      expect(result1.originalError).toBe(null);

      const result2 = handleCalculationError(undefined);
      expect(result2.type).toBe('unknown');
      expect(result2.originalError).toBe(null);
    });

    it('應該記錄所有錯誤到控制台', () => {
      const testError = new Error('Test error for logging');
      handleCalculationError(testError);
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Payment calculation error occurred:',
        expect.objectContaining({
          error: testError,
          message: 'Test error for logging',
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('系統健康檢查測試', () => {
    it('應該通過健康的系統檢查', () => {
      const dedications = [
        { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' }
      ];
      const summaryTotal = 1000;

      const result = performHealthCheck(dedications, summaryTotal);
      
      expect(result.isHealthy).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.dedicationsCount).toBe(1);
      expect(result.stats.summaryTotal).toBe(1000);
    });

    it('應該檢測不健康的系統狀態', () => {
      const testCases = [
        {
          dedications: 'not an array',
          summaryTotal: 1000,
          expectedError: 'dedications 不是有效的陣列'
        },
        {
          dedications: [],
          summaryTotal: 'not a number',
          expectedError: 'summaryTotal 不是有效的數字'
        },
        {
          dedications: [],
          summaryTotal: Infinity,
          expectedError: 'summaryTotal 不是有限數值'
        }
      ];

      testCases.forEach((testCase) => {
        const result = performHealthCheck(testCase.dedications, testCase.summaryTotal);
        
        expect(result.isHealthy).toBe(false);
        expect(result.errors.some(error => error.includes(testCase.expectedError) || error === testCase.expectedError)).toBe(true);
      });
    });

    it('應該產生適當的警告', () => {
      const result1 = performHealthCheck([], 1000);
      expect(result1.warnings).toContain('沒有提供奉獻記錄資料');

      const result2 = performHealthCheck([{ amount: 1000, method: 'cash' }], -100);
      expect(result2.warnings).toContain('summaryTotal 為負數');
    });
  });

  describe('格式化和輔助函數測試', () => {
    it('應該正確格式化金額', () => {
      const testCases = [
        { input: 1000, expected: '1,000' },
        { input: 1234567, expected: '1,234,567' },
        { input: 0, expected: '0' },
        { input: 100.50, expected: '100.5' },
        { input: 'invalid', expected: '0' },
        { input: null, expected: '0' },
        { input: undefined, expected: '0' },
        { input: NaN, expected: '0' }
      ];

      testCases.forEach((testCase) => {
        const result = formatAmount(testCase.input);
        expect(result).toBe(testCase.expected);
      });
    });
  });

  describe('整合測試 - 完整流程驗證', () => {
    it('應該完整執行計算流程並驗證一致性', () => {
      const dedications = [
        { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
        { amount: 2000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' },
        { amount: 500, method: 'cash', dedicationCategory: '宣教', dedicatorId: 'u3', dedicationDate: '2025-01-15' }
      ];

      // 執行計算
      const result = calculatePaymentBreakdown(dedications);
      
      // 驗證計算結果
      expect(result.cashTotal).toBe(1500);
      expect(result.chequeTotal).toBe(2000);
      expect(result.hasCheque).toBe(true);
      
      // 驗證一致性
      const expectedTotal = 3500;
      const consistencyResult = validateCalculationConsistency(result, expectedTotal);
      expect(consistencyResult.isConsistent).toBe(true);
      
      // 驗證系統健康狀態
      const healthResult = performHealthCheck(dedications, expectedTotal);
      expect(healthResult.isHealthy).toBe(true);
      
      // 驗證日誌記錄
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Payment breakdown calculation completed successfully:',
        expect.any(Object)
      );
    });

    it('應該處理包含錯誤的複雜情況', () => {
      const mixedDedications = [
        // 有效記錄
        { amount: 1000, method: 'cash', dedicationCategory: '十一', dedicatorId: 'u1', dedicationDate: '2025-01-15' },
        // 無效記錄
        { amount: -500, method: 'invalid', dedicationCategory: '', dedicatorId: '', dedicationDate: null },
        // 有效記錄
        { amount: 2000, method: 'cheque', dedicationCategory: '感恩', dedicatorId: 'u2', dedicationDate: '2025-01-15' }
      ];

      const result = calculatePaymentBreakdown(mixedDedications);
      
      // 應該只計算有效記錄
      expect(result.cashTotal).toBe(1000);
      expect(result.chequeTotal).toBe(2000);
      expect(result.hasCheque).toBe(true);
      
      // 應該記錄警告
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        'Payment breakdown calculation: 1 invalid records were skipped',
        expect.any(Object)
      );
    });
  });
});