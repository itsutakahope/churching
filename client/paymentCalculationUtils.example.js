/**
 * 奉獻計算工具函數使用示例
 * 
 * 這個文件展示了如何使用 paymentCalculationUtils.js 中的核心函數
 * 來處理現金與支票分離計算
 */

import {
  calculatePaymentBreakdown,
  validateCalculationConsistency,
  formatAmount,
  handleCalculationError
} from './paymentCalculationUtils.js';

// 示例 1: 基本使用 - 混合支付方式計算
console.log('=== 示例 1: 基本使用 ===');
const sampleDedications = [
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

try {
  const breakdown = calculatePaymentBreakdown(sampleDedications);
  console.log('計算結果:', {
    現金總計: formatAmount(breakdown.cashTotal),
    支票總計: formatAmount(breakdown.chequeTotal),
    包含支票: breakdown.hasCheque ? '是' : '否',
    總金額: formatAmount(breakdown.cashTotal + breakdown.chequeTotal)
  });
  
  // 驗證與後端摘要的一致性
  const summaryTotal = 3500;
  const isConsistent = validateCalculationConsistency(breakdown, summaryTotal);
  console.log('與後端摘要一致性:', isConsistent ? '一致' : '不一致');
  
} catch (error) {
  const errorInfo = handleCalculationError(error);
  console.error('計算錯誤:', errorInfo);
}

// 示例 2: 純現金奉獻
console.log('\n=== 示例 2: 純現金奉獻 ===');
const cashOnlyDedications = [
  {
    amount: 800,
    method: 'cash',
    dedicationCategory: '十一',
    dedicatorId: 'B0004',
    dedicationDate: '2025-01-15'
  },
  {
    amount: 1200,
    method: 'cash',
    dedicationCategory: '感恩',
    dedicatorId: 'B0005',
    dedicationDate: '2025-01-15'
  }
];

try {
  const breakdown = calculatePaymentBreakdown(cashOnlyDedications);
  console.log('純現金計算結果:', {
    現金總計: formatAmount(breakdown.cashTotal),
    支票總計: formatAmount(breakdown.chequeTotal),
    包含支票: breakdown.hasCheque ? '是' : '否'
  });
} catch (error) {
  const errorInfo = handleCalculationError(error);
  console.error('計算錯誤:', errorInfo);
}

// 示例 3: 錯誤處理 - 無效資料
console.log('\n=== 示例 3: 錯誤處理 ===');
const invalidDedications = [
  {
    amount: 1000,
    method: 'cash',
    dedicationCategory: '十一',
    dedicatorId: 'B0001',
    dedicationDate: '2025-01-15'
  },
  {
    amount: -500, // 無效金額
    method: 'cash',
    dedicationCategory: '感恩',
    dedicatorId: 'B0002',
    dedicationDate: '2025-01-15'
  },
  {
    amount: 2000,
    method: 'invalid_method', // 無效方式
    dedicationCategory: '宣教',
    dedicatorId: 'B0003',
    dedicationDate: '2025-01-15'
  }
];

try {
  const breakdown = calculatePaymentBreakdown(invalidDedications);
  console.log('包含無效記錄的計算結果:', {
    現金總計: formatAmount(breakdown.cashTotal),
    支票總計: formatAmount(breakdown.chequeTotal),
    包含支票: breakdown.hasCheque ? '是' : '否',
    說明: '無效記錄已被自動跳過'
  });
} catch (error) {
  const errorInfo = handleCalculationError(error);
  console.error('計算錯誤:', errorInfo);
}

// 示例 4: 空資料處理
console.log('\n=== 示例 4: 空資料處理 ===');
try {
  const emptyBreakdown = calculatePaymentBreakdown([]);
  console.log('空資料計算結果:', {
    現金總計: formatAmount(emptyBreakdown.cashTotal),
    支票總計: formatAmount(emptyBreakdown.chequeTotal),
    包含支票: emptyBreakdown.hasCheque ? '是' : '否'
  });
} catch (error) {
  const errorInfo = handleCalculationError(error);
  console.error('計算錯誤:', errorInfo);
}

// 示例 5: 在 React 組件中的使用模式
console.log('\n=== 示例 5: React 組件使用模式 ===');
const ReactComponentExample = `
// 在 React 組件中使用的典型模式
import { calculatePaymentBreakdown, handleCalculationError } from './paymentCalculationUtils.js';

const AggregationSummary = ({ summary, dedications }) => {
  const [paymentBreakdown, setPaymentBreakdown] = useState(null);
  const [calculationError, setCalculationError] = useState(null);

  useEffect(() => {
    if (!dedications || dedications.length === 0) {
      setPaymentBreakdown(null);
      return;
    }

    try {
      const breakdown = calculatePaymentBreakdown(dedications);
      setPaymentBreakdown(breakdown);
      setCalculationError(null);
    } catch (error) {
      const errorInfo = handleCalculationError(error);
      setCalculationError(errorInfo);
      setPaymentBreakdown(null);
    }
  }, [dedications]);

  // 渲染邏輯...
  if (calculationError) {
    console.warn('Payment calculation error:', calculationError);
    // 降級到原有顯示方式
    return <OriginalSummaryDisplay summary={summary} />;
  }

  if (paymentBreakdown && paymentBreakdown.hasCheque) {
    return (
      <div>
        <OriginalSummaryDisplay summary={summary} />
        <PaymentBreakdownDisplay breakdown={paymentBreakdown} totalAmount={summary.totalAmount} />
      </div>
    );
  }

  return <OriginalSummaryDisplay summary={summary} />;
};
`;

console.log('React 組件使用模式代碼示例已準備好，請參考上方註釋中的代碼。');

export {
  sampleDedications,
  cashOnlyDedications,
  invalidDedications
};