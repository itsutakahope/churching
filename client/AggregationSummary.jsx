import React, { useState, useEffect } from 'react';
import { calculatePaymentBreakdown, validateCalculationConsistency, formatAmount, handleCalculationError, performHealthCheck, logSystemWarning, logSystemError } from './paymentCalculationUtils';
import PaymentBreakdownDisplay from './PaymentBreakdownDisplay';

const AggregationSummary = ({ summary, dedications = [] }) => {
  const [paymentBreakdown, setPaymentBreakdown] = useState({
    cashTotal: 0,
    chequeTotal: 0,
    hasCheque: false
  });
  const [calculationError, setCalculationError] = useState(null);

  if (!summary) {
    return null;
  }

  const { totalAmount, byCategory } = summary;
  const categories = Object.keys(byCategory).sort();

  // 計算現金與支票分解
  useEffect(() => {
    // 重置錯誤狀態
    setCalculationError(null);

    // 執行系統健康檢查
    const healthCheck = performHealthCheck(dedications, totalAmount);
    
    if (!healthCheck.isHealthy) {
      logSystemError('AggregationSummary', 'System health check failed', {
        healthCheck,
        dedications: dedications?.length || 0,
        totalAmount
      });
      
      // 健康檢查失敗時的優雅降級
      setCalculationError('系統檢查發現資料異常，無法進行計算');
      setPaymentBreakdown({
        cashTotal: 0,
        chequeTotal: 0,
        hasCheque: false
      });
      return;
    }

    // 如果有警告，記錄但繼續處理
    if (healthCheck.warnings.length > 0) {
      logSystemWarning('AggregationSummary', 'System health check warnings detected', {
        warnings: healthCheck.warnings,
        stats: healthCheck.stats
      });
    }

    // 如果沒有 dedications 資料，設置預設值
    if (!dedications || dedications.length === 0) {
      logSystemWarning('AggregationSummary', 'No dedications data provided, using default values');
      setPaymentBreakdown({
        cashTotal: 0,
        chequeTotal: 0,
        hasCheque: false
      });
      return;
    }

    console.log('AggregationSummary: Starting payment breakdown calculation', {
      dedicationsCount: dedications.length,
      summaryTotal: totalAmount,
      healthCheck: healthCheck.stats
    });

    try {
      // 嘗試計算現金與支票分解
      const breakdown = calculatePaymentBreakdown(dedications);
      
      // 驗證計算結果與摘要總額的一致性
      const consistencyResult = validateCalculationConsistency(breakdown, totalAmount);
      
      if (!consistencyResult.isConsistent) {
        // 一致性驗證失敗，記錄警告但不阻止顯示
        logSystemWarning('AggregationSummary', 'Calculation consistency check failed', {
          consistencyResult,
          breakdown,
          summaryTotal: totalAmount
        });
        
        // 顯示警告訊息，但仍然顯示計算結果
        setCalculationError(`計算結果與摘要總額存在差異（${consistencyResult.difference} 元），請檢查資料完整性`);
      } else {
        console.log('AggregationSummary: Payment breakdown calculation successful', {
          breakdown,
          consistencyResult: {
            isConsistent: consistencyResult.isConsistent,
            difference: consistencyResult.difference
          }
        });
      }
      
      // 設置計算結果
      setPaymentBreakdown(breakdown);
      
    } catch (error) {
      // 計算失敗時的優雅降級處理
      logSystemError('AggregationSummary', 'Payment breakdown calculation failed, activating graceful degradation', {
        error,
        dedicationsCount: dedications.length,
        summaryTotal: totalAmount
      });
      
      const errorInfo = handleCalculationError(error);
      setCalculationError(errorInfo.message);
      
      // 優雅降級：設置預設值以防止 UI 崩潰
      setPaymentBreakdown({
        cashTotal: 0,
        chequeTotal: 0,
        hasCheque: false
      });
      
      // 記錄降級事件
      logSystemWarning('AggregationSummary', 'Graceful degradation activated - payment breakdown display will be hidden');
    }
  }, [dedications, totalAmount]);

  return (
    <div className="bg-success-50 dark:bg-graphite-800/40 border-l-4 border-success-500 dark:border-success-600 p-6 rounded-r-lg transition-theme">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-success-500 dark:bg-success-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-success-700 dark:text-success-300 transition-theme">計算結果摘要</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-surface dark:bg-dark-surface rounded-lg shadow transition-theme">
          <thead className="bg-success-100 dark:bg-graphite-700 transition-theme">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-success-700 dark:text-dark-text-main transition-theme">奉獻科目</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-success-700 dark:text-dark-text-main transition-theme">金額</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category} className="border-b border-graphite-200 dark:border-graphite-600 hover:bg-success-50 dark:hover:bg-graphite-600 transition-theme">
                <td className="py-3 px-4 font-medium text-graphite-700 dark:text-dark-text-main transition-theme">{category}</td>
                <td className="py-3 px-4 text-right text-graphite-900 dark:text-dark-text-main font-mono transition-theme">
                  {byCategory[category].toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-success-100 dark:bg-graphite-700 transition-theme">
            <tr>
              <td className="py-3 px-4 text-left text-lg font-bold text-success-700 dark:text-dark-text-main transition-theme">總計</td>
              <td className="py-3 px-4 text-right text-lg font-bold text-success-700 dark:text-dark-text-main font-mono transition-theme">
                {totalAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 付款方式明細計算式 */}
      <PaymentBreakdownDisplay 
        breakdown={paymentBreakdown} 
        totalAmount={totalAmount} 
      />

      {/* 錯誤訊息顯示 */}
      {calculationError && (
        <div className="mt-4 p-4 bg-danger-50 dark:bg-danger-dark/20 border border-danger-200 dark:border-danger-dark/40 rounded-lg transition-theme">
          <p className="text-danger-600 dark:text-danger-dark text-sm transition-theme">
            <strong>計算錯誤：</strong>{calculationError}
          </p>
        </div>
      )}
    </div>
  );
};

export default AggregationSummary;
