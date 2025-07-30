import React from 'react';

const PaymentBreakdownDisplay = ({ breakdown, totalAmount }) => {
  // 輸入驗證和錯誤處理
  try {
    // 檢查 breakdown 參數
    if (!breakdown || typeof breakdown !== 'object') {
      console.warn('PaymentBreakdownDisplay: Invalid breakdown parameter', breakdown);
      return null;
    }

    // 檢查 totalAmount 參數
    if (typeof totalAmount !== 'number' || !isFinite(totalAmount)) {
      console.warn('PaymentBreakdownDisplay: Invalid totalAmount parameter', totalAmount);
      return null;
    }

    // 如果沒有支票，不顯示計算式
    if (!breakdown.hasCheque) {
      console.log('PaymentBreakdownDisplay: No cheques found, hiding payment breakdown display');
      return null;
    }

    // 驗證 breakdown 物件的必要屬性
    if (typeof breakdown.cashTotal !== 'number' || typeof breakdown.chequeTotal !== 'number') {
      console.error('PaymentBreakdownDisplay: Invalid breakdown properties', {
        cashTotal: breakdown.cashTotal,
        chequeTotal: breakdown.chequeTotal,
        cashTotalType: typeof breakdown.cashTotal,
        chequeTotalType: typeof breakdown.chequeTotal
      });
      return null;
    }

    // 檢查數值是否為有限數
    if (!isFinite(breakdown.cashTotal) || !isFinite(breakdown.chequeTotal)) {
      console.error('PaymentBreakdownDisplay: breakdown contains invalid numbers', breakdown);
      return null;
    }

    console.log('PaymentBreakdownDisplay: Rendering payment breakdown', {
      breakdown,
      totalAmount
    });

  } catch (error) {
    console.error('PaymentBreakdownDisplay: Error during validation', error);
    return null;
  }

  // 使用與 AggregationSummary 一致的數字格式化
  const formatAmount = (amount) => {
    try {
      if (typeof amount !== 'number' || !isFinite(amount)) {
        console.warn('PaymentBreakdownDisplay: Invalid amount for formatting', amount);
        return '0';
      }
      return amount.toLocaleString('zh-TW');
    } catch (error) {
      console.error('PaymentBreakdownDisplay: Error formatting amount', error, amount);
      return '0';
    }
  };

  return (
    <div className="mt-6 pt-6 border-t-2 border-glory-red-200 dark:border-dark-primary/30 transition-theme">
      {/* 視覺分隔標題 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-glory-red-500 dark:bg-dark-primary rounded-full transition-theme"></div>
        <h4 className="text-lg font-bold text-glory-red-700 dark:text-dark-primary transition-theme">
          付款方式明細
        </h4>
        <div className="flex-1 h-px bg-glory-red-200 dark:bg-dark-primary/30 transition-theme"></div>
      </div>

      {/* 計算式容器 */}
      <div className="bg-glory-red-50 dark:bg-dark-surface/80 border border-glory-red-200 dark:border-dark-primary/30 rounded-xl p-4 sm:p-6 transition-theme">
        <div className="text-center">
          {/* 大螢幕：水平排列計算式 */}
          <div className="hidden sm:block">
            <div className="inline-flex items-center gap-3 lg:gap-4 text-lg lg:text-xl font-mono bg-surface dark:bg-dark-background/50 rounded-lg px-4 py-3 shadow-sm transition-theme">
              <span className="text-graphite-800 dark:text-dark-text-main font-semibold transition-theme">
                現金 <span className="text-glory-red-600 dark:text-dark-primary font-bold">{formatAmount(breakdown.cashTotal)}</span>
              </span>
              <span className="text-holy-gold-600 dark:text-dark-accent text-xl lg:text-2xl font-bold transition-theme">+</span>
              <span className="text-graphite-800 dark:text-dark-text-main font-semibold transition-theme">
                支票 <span className="text-glory-red-600 dark:text-dark-primary font-bold">{formatAmount(breakdown.chequeTotal)}</span>
              </span>
              <span className="text-holy-gold-600 dark:text-dark-accent text-xl lg:text-2xl font-bold transition-theme">=</span>
              <span className="text-glory-red-700 dark:text-dark-primary font-bold text-xl lg:text-2xl transition-theme">
                總計 {formatAmount(breakdown.cashTotal + breakdown.chequeTotal)}
              </span>
            </div>
          </div>
          
          {/* 小螢幕：垂直排列 */}
          <div className="block sm:hidden space-y-3">
            <div className="bg-surface dark:bg-dark-background/50 rounded-lg p-3 transition-theme">
              <div className="flex justify-between items-center py-2">
                <span className="text-graphite-700 dark:text-dark-text-main font-medium transition-theme">現金</span>
                <span className="text-glory-red-600 dark:text-dark-primary font-mono font-bold text-lg transition-theme">
                  {formatAmount(breakdown.cashTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-graphite-700 dark:text-dark-text-main font-medium transition-theme">支票</span>
                <span className="text-glory-red-600 dark:text-dark-primary font-mono font-bold text-lg transition-theme">
                  {formatAmount(breakdown.chequeTotal)}
                </span>
              </div>
              <div className="border-t-2 border-holy-gold-300 dark:border-dark-accent/50 pt-3 mt-3 transition-theme">
                <div className="flex justify-between items-center">
                  <span className="text-glory-red-700 dark:text-dark-primary font-bold text-lg transition-theme">總計</span>
                  <span className="text-glory-red-700 dark:text-dark-primary font-mono font-bold text-xl transition-theme">
                    {formatAmount(breakdown.cashTotal + breakdown.chequeTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 補充說明文字 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-graphite-600 dark:text-dark-text-subtle transition-theme">
            以上為本次奉獻的付款方式分解統計
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentBreakdownDisplay;