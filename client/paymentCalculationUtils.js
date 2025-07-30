/**
 * 奉獻計算工具函數
 * 用於處理現金與支票分離計算的核心邏輯
 */

/**
 * 驗證奉獻記錄資料的完整性和格式正確性
 * @param {Object} dedication - 奉獻記錄物件
 * @param {number} index - 記錄索引（用於錯誤日誌）
 * @returns {Object} - 包含驗證結果和錯誤詳情的物件
 */
export const validateDedication = (dedication, index = -1) => {
  const result = {
    isValid: false,
    errors: []
  };

  try {
    // 檢查基本物件存在性
    if (!dedication || typeof dedication !== 'object') {
      result.errors.push('記錄不是有效的物件');
      console.warn(`Dedication validation failed at index ${index}: Not a valid object`, dedication);
      return result;
    }

    // 檢查 amount 欄位
    if (typeof dedication.amount !== 'number') {
      result.errors.push('金額必須是數字');
    } else if (dedication.amount <= 0) {
      result.errors.push('金額必須大於 0');
    } else if (!isFinite(dedication.amount)) {
      result.errors.push('金額必須是有限數值');
    }

    // 檢查 method 欄位
    if (!dedication.method) {
      result.errors.push('缺少奉獻方式');
    } else if (typeof dedication.method !== 'string') {
      result.errors.push('奉獻方式必須是字串');
    } else if (!['cash', 'cheque'].includes(dedication.method)) {
      result.errors.push('奉獻方式必須是 cash 或 cheque');
    }

    // 檢查 dedicationCategory 欄位
    if (!dedication.dedicationCategory) {
      result.errors.push('缺少奉獻科目');
    } else if (typeof dedication.dedicationCategory !== 'string') {
      result.errors.push('奉獻科目必須是字串');
    } else if (dedication.dedicationCategory.trim().length === 0) {
      result.errors.push('奉獻科目不能為空');
    }

    // 檢查 dedicatorId 欄位
    if (!dedication.dedicatorId) {
      result.errors.push('缺少奉獻者 ID');
    } else if (typeof dedication.dedicatorId !== 'string') {
      result.errors.push('奉獻者 ID 必須是字串');
    } else if (dedication.dedicatorId.trim().length === 0) {
      result.errors.push('奉獻者 ID 不能為空');
    }

    // 檢查 dedicationDate 欄位
    if (!dedication.dedicationDate) {
      result.errors.push('缺少奉獻日期');
    } else if (typeof dedication.dedicationDate !== 'string') {
      result.errors.push('奉獻日期必須是字串');
    } else if (dedication.dedicationDate.trim().length === 0) {
      result.errors.push('奉獻日期不能為空');
    }

    // 如果沒有錯誤，則驗證通過
    result.isValid = result.errors.length === 0;

    // 記錄驗證結果
    if (!result.isValid) {
      console.warn(`Dedication validation failed at index ${index}:`, {
        dedication,
        errors: result.errors
      });
    }

    return result;
  } catch (error) {
    // 如果在驗證過程中發生任何異常，記錄錯誤並返回失敗結果
    result.errors.push(`驗證過程中發生異常: ${error.message}`);
    console.error(`Dedication validation exception at index ${index}:`, error, dedication);
    return result;
  }
};

/**
 * 計算現金與支票分離統計
 * @param {Array} dedications - 奉獻記錄陣列
 * @returns {Object} - 包含現金總計、支票總計和是否包含支票的物件
 * @throws {Error} - 當資料驗證失敗或計算錯誤時拋出錯誤
 */
export const calculatePaymentBreakdown = (dedications) => {
  console.log('Starting payment breakdown calculation with', dedications?.length || 0, 'records');

  // 初始化結果物件
  const breakdown = {
    cashTotal: 0,
    chequeTotal: 0,
    hasCheque: false
  };

  // 輸入驗證：檢查 dedications 是否為陣列
  if (!Array.isArray(dedications)) {
    const errorMsg = `INVALID_INPUT: dedications 必須是陣列，收到的類型: ${typeof dedications}`;
    console.error(errorMsg, dedications);
    throw new Error(errorMsg);
  }

  // 如果陣列為空，記錄並返回初始值
  if (dedications.length === 0) {
    console.log('Payment breakdown calculation: No dedications provided, returning zero values');
    return breakdown;
  }

  // 用於追蹤處理統計
  const processingStats = {
    totalRecords: dedications.length,
    validRecords: 0,
    invalidRecords: 0,
    cashRecords: 0,
    chequeRecords: 0,
    validationErrors: []
  };

  // 遍歷所有奉獻記錄進行計算
  dedications.forEach((dedication, index) => {
    // 驗證每筆記錄的資料完整性
    const validationResult = validateDedication(dedication, index);
    
    if (!validationResult.isValid) {
      processingStats.invalidRecords++;
      processingStats.validationErrors.push({
        index,
        errors: validationResult.errors,
        record: dedication
      });
      return; // 跳過無效記錄，繼續處理下一筆
    }

    processingStats.validRecords++;

    // 根據奉獻方式累加金額
    try {
      if (dedication.method === 'cash') {
        breakdown.cashTotal += dedication.amount;
        processingStats.cashRecords++;
      } else if (dedication.method === 'cheque') {
        breakdown.chequeTotal += dedication.amount;
        breakdown.hasCheque = true;
        processingStats.chequeRecords++;
      }
    } catch (error) {
      const errorMsg = `CALCULATION_ERROR: 處理第 ${index + 1} 筆記錄時發生錯誤 - ${error.message}`;
      console.error(errorMsg, { dedication, error });
      throw new Error(errorMsg);
    }
  });

  // 檢查是否有任何有效記錄
  if (processingStats.validRecords === 0 && processingStats.totalRecords > 0) {
    const errorMsg = 'DATA_VALIDATION_ERROR: 所有奉獻記錄都無效或格式錯誤';
    console.error(errorMsg, {
      processingStats,
      validationErrors: processingStats.validationErrors
    });
    throw new Error(errorMsg);
  }

  // 驗證計算結果的合理性
  if (breakdown.cashTotal < 0 || breakdown.chequeTotal < 0) {
    const errorMsg = `CALCULATION_ERROR: 計算結果出現負數 - 現金: ${breakdown.cashTotal}, 支票: ${breakdown.chequeTotal}`;
    console.error(errorMsg, { breakdown, processingStats });
    throw new Error(errorMsg);
  }

  // 檢查數值是否為有限數
  if (!isFinite(breakdown.cashTotal) || !isFinite(breakdown.chequeTotal)) {
    const errorMsg = `CALCULATION_ERROR: 計算結果包含無效數值 - 現金: ${breakdown.cashTotal}, 支票: ${breakdown.chequeTotal}`;
    console.error(errorMsg, { breakdown, processingStats });
    throw new Error(errorMsg);
  }

  // 記錄詳細的計算統計資訊
  console.log('Payment breakdown calculation completed successfully:', {
    ...processingStats,
    result: {
      cashTotal: breakdown.cashTotal,
      chequeTotal: breakdown.chequeTotal,
      totalAmount: breakdown.cashTotal + breakdown.chequeTotal,
      hasCheque: breakdown.hasCheque
    }
  });

  // 如果有無效記錄，記錄警告
  if (processingStats.invalidRecords > 0) {
    console.warn(`Payment breakdown calculation: ${processingStats.invalidRecords} invalid records were skipped`, {
      invalidRecords: processingStats.validationErrors
    });
  }

  return breakdown;
};

/**
 * 驗證計算結果與後端摘要總額的一致性
 * @param {Object} breakdown - 計算分解結果
 * @param {number} summaryTotal - 後端摘要總額
 * @returns {Object} - 包含驗證結果和詳細資訊的物件
 */
export const validateCalculationConsistency = (breakdown, summaryTotal) => {
  const result = {
    isConsistent: false,
    calculatedTotal: 0,
    summaryTotal: summaryTotal,
    difference: 0,
    tolerance: 1, // 允許的浮點數誤差範圍，調整為 1 元
    errors: []
  };

  try {
    // 驗證輸入參數
    if (!breakdown || typeof breakdown !== 'object') {
      result.errors.push('breakdown 參數無效');
      console.error('Consistency validation failed: Invalid breakdown parameter', breakdown);
      return result;
    }

    if (typeof summaryTotal !== 'number') {
      result.errors.push(`summaryTotal 必須是數字，收到的類型: ${typeof summaryTotal}`);
      console.error('Consistency validation failed: Invalid summaryTotal parameter', summaryTotal);
      return result;
    }

    if (!isFinite(summaryTotal)) {
      result.errors.push('summaryTotal 必須是有限數值');
      console.error('Consistency validation failed: summaryTotal is not finite', summaryTotal);
      return result;
    }

    // 檢查 breakdown 物件是否包含必要屬性
    if (typeof breakdown.cashTotal !== 'number') {
      result.errors.push(`breakdown.cashTotal 必須是數字，收到的類型: ${typeof breakdown.cashTotal}`);
    }

    if (typeof breakdown.chequeTotal !== 'number') {
      result.errors.push(`breakdown.chequeTotal 必須是數字，收到的類型: ${typeof breakdown.chequeTotal}`);
    }

    if (result.errors.length > 0) {
      console.error('Consistency validation failed: Invalid breakdown properties', {
        breakdown,
        errors: result.errors
      });
      return result;
    }

    // 檢查數值是否為有限數
    if (!isFinite(breakdown.cashTotal) || !isFinite(breakdown.chequeTotal)) {
      result.errors.push('breakdown 包含無效數值');
      console.error('Consistency validation failed: breakdown contains invalid numbers', breakdown);
      return result;
    }

    // 計算總額和差異
    result.calculatedTotal = breakdown.cashTotal + breakdown.chequeTotal;
    result.difference = Math.abs(result.calculatedTotal - result.summaryTotal);
    result.isConsistent = result.difference <= result.tolerance;

    // 記錄驗證結果
    const logData = {
      breakdown: {
        cashTotal: breakdown.cashTotal,
        chequeTotal: breakdown.chequeTotal,
        calculatedTotal: result.calculatedTotal
      },
      summaryTotal: result.summaryTotal,
      difference: result.difference,
      tolerance: result.tolerance,
      isConsistent: result.isConsistent
    };

    if (result.isConsistent) {
      console.log('Calculation consistency validation passed:', logData);
    } else {
      console.warn('Calculation consistency validation failed:', logData);
      result.errors.push(`計算總額與摘要總額不一致，差異: ${result.difference} 元`);
    }

    return result;
  } catch (error) {
    result.errors.push(`一致性驗證過程中發生異常: ${error.message}`);
    console.error('Consistency validation exception:', error, { breakdown, summaryTotal });
    return result;
  }
};

/**
 * 格式化金額顯示
 * @param {number} amount - 金額數值
 * @returns {string} - 格式化後的金額字串
 */
export const formatAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0';
  }
  return amount.toLocaleString('zh-TW');
};

/**
 * 錯誤處理輔助函數
 * @param {Error} error - 錯誤物件
 * @returns {Object} - 包含錯誤類型和使用者友善訊息的物件
 */
export const handleCalculationError = (error) => {
  // 記錄原始錯誤到控制台
  console.error('Payment calculation error occurred:', {
    error,
    message: error?.message,
    stack: error?.stack,
    timestamp: new Date().toISOString()
  });

  // 處理 null 或 undefined 錯誤物件
  if (!error) {
    console.warn('handleCalculationError: Received null or undefined error');
    return {
      type: 'unknown',
      message: '發生未預期的錯誤，請重試或聯繫系統管理員',
      originalError: null
    };
  }

  const errorMessage = (error.message || '未知錯誤').toString();
  
  // 根據錯誤訊息分類處理
  if (errorMessage.includes('INVALID_INPUT')) {
    return {
      type: 'validation',
      message: '輸入資料格式錯誤，請檢查資料結構',
      originalError: errorMessage,
      suggestion: '請確認 dedications 參數是有效的陣列'
    };
  }
  
  if (errorMessage.includes('DATA_VALIDATION_ERROR')) {
    return {
      type: 'validation',
      message: '奉獻記錄資料無效，請檢查資料完整性',
      originalError: errorMessage,
      suggestion: '請檢查每筆奉獻記錄是否包含必要欄位（amount, method, dedicationCategory 等）'
    };
  }
  
  if (errorMessage.includes('CALCULATION_ERROR')) {
    return {
      type: 'calculation',
      message: '計算過程中發生錯誤，請重試或聯繫系統管理員',
      originalError: errorMessage,
      suggestion: '請檢查奉獻記錄中的金額是否為有效數值'
    };
  }

  // 處理 JavaScript 原生錯誤類型
  if (error instanceof TypeError) {
    return {
      type: 'type_error',
      message: '資料類型錯誤，請檢查輸入資料格式',
      originalError: errorMessage,
      suggestion: '請確認所有必要欄位的資料類型正確'
    };
  }

  if (error instanceof RangeError) {
    return {
      type: 'range_error',
      message: '數值範圍錯誤，請檢查金額數值',
      originalError: errorMessage,
      suggestion: '請確認金額數值在合理範圍內'
    };
  }
  
  // 預設錯誤處理
  return {
    type: 'unknown',
    message: '發生未預期的錯誤，請重試或聯繫系統管理員',
    originalError: errorMessage,
    suggestion: '如果問題持續發生，請聯繫技術支援'
  };
};

/**
 * 記錄系統警告的輔助函數
 * @param {string} component - 組件名稱
 * @param {string} message - 警告訊息
 * @param {Object} data - 相關資料
 */
export const logSystemWarning = (component, message, data = {}) => {
  console.warn(`[${component}] ${message}`, {
    timestamp: new Date().toISOString(),
    component,
    message,
    data
  });
};

/**
 * 記錄系統錯誤的輔助函數
 * @param {string} component - 組件名稱
 * @param {string} message - 錯誤訊息
 * @param {Error|Object} error - 錯誤物件或相關資料
 */
export const logSystemError = (component, message, error = {}) => {
  console.error(`[${component}] ${message}`, {
    timestamp: new Date().toISOString(),
    component,
    message,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error
  });
};

/**
 * 檢查系統健康狀態的輔助函數
 * @param {Array} dedications - 奉獻記錄陣列
 * @param {number} summaryTotal - 摘要總額
 * @returns {Object} - 健康檢查結果
 */
export const performHealthCheck = (dedications, summaryTotal) => {
  const healthCheck = {
    isHealthy: true,
    warnings: [],
    errors: [],
    stats: {
      dedicationsCount: 0,
      summaryTotal: summaryTotal,
      timestamp: new Date().toISOString()
    }
  };

  try {
    // 檢查 dedications 參數
    if (!Array.isArray(dedications)) {
      healthCheck.errors.push('dedications 不是有效的陣列');
      healthCheck.isHealthy = false;
    } else {
      healthCheck.stats.dedicationsCount = dedications.length;
      
      if (dedications.length === 0) {
        healthCheck.warnings.push('沒有提供奉獻記錄資料');
      }
    }

    // 檢查 summaryTotal 參數
    if (typeof summaryTotal !== 'number') {
      healthCheck.errors.push(`summaryTotal 不是有效的數字，類型: ${typeof summaryTotal}`);
      healthCheck.isHealthy = false;
    } else if (!isFinite(summaryTotal)) {
      healthCheck.errors.push('summaryTotal 不是有限數值');
      healthCheck.isHealthy = false;
    } else if (summaryTotal < 0) {
      healthCheck.warnings.push('summaryTotal 為負數');
    }

    // 記錄健康檢查結果
    if (healthCheck.isHealthy) {
      console.log('System health check passed:', healthCheck);
    } else {
      console.warn('System health check failed:', healthCheck);
    }

    return healthCheck;
  } catch (error) {
    healthCheck.errors.push(`健康檢查過程中發生異常: ${error.message}`);
    healthCheck.isHealthy = false;
    console.error('Health check exception:', error);
    return healthCheck;
  }
};