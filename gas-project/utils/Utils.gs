// --- ▼▼▼ Utils.gs - 通用工具函式 ▼▼▼ ---

/**
 * 生成 UUID
 * @returns {string} UUID 字串
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * 生成短 ID（用於顯示）
 * @param {string} prefix - ID 前綴
 * @returns {string} 短 ID
 */
function generateShortId(prefix = '') {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
}

/**
 * 格式化日期時間
 * @param {Date|string} date - 日期物件或字串
 * @param {string} format - 格式（預設為 DATE_FORMAT.DATETIME）
 * @returns {string} 格式化後的日期時間字串
 */
function formatDateTime(date, format = DATE_FORMAT.DATETIME) {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  return Utilities.formatDate(date, Session.getScriptTimeZone(), format);
}

/**
 * 格式化日期
 * @param {Date|string} date - 日期物件或字串
 * @returns {string} 格式化後的日期字串
 */
function formatDate(date) {
  return formatDateTime(date, DATE_FORMAT.DATE);
}

/**
 * 解析 JSON（安全）
 * @param {string} jsonString - JSON 字串
 * @param {any} defaultValue - 預設值
 * @returns {any} 解析後的物件或預設值
 */
function safeParseJSON(jsonString, defaultValue = null) {
  try {
    if (!jsonString || jsonString === '') {
      return defaultValue;
    }
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log('JSON 解析失敗: ' + e.message);
    Logger.log('JSON 字串: ' + jsonString);
    return defaultValue;
  }
}

/**
 * 轉換為 JSON 字串（安全）
 * @param {any} obj - 要轉換的物件
 * @param {string} defaultValue - 預設值
 * @returns {string} JSON 字串或預設值
 */
function safeStringifyJSON(obj, defaultValue = '') {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    Logger.log('JSON 字串化失敗: ' + e.message);
    return defaultValue;
  }
}

/**
 * 取得 Spreadsheet
 * @returns {Spreadsheet} Spreadsheet 物件
 */
function getSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('INTERNAL_ERROR|無法取得 Spreadsheet');
  }
  return ss;
}

/**
 * 取得指定工作表
 * @param {string} sheetName - 工作表名稱
 * @returns {Sheet} Sheet 物件
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  // 如果工作表不存在，嘗試建立
  if (!sheet) {
    Logger.log('工作表不存在，正在建立: ' + sheetName);
    sheet = ss.insertSheet(sheetName);
  }

  return sheet;
}

/**
 * 取得使用者 Lock
 * @param {number} timeout - 超時時間（毫秒）
 * @returns {Lock} Lock 物件
 */
function getUserLock(timeout = LOCK_TIMEOUT.MEDIUM) {
  const lock = LockService.getUserLock();
  const hasLock = lock.tryLock(timeout);

  if (!hasLock) {
    throw new Error('LOCK_TIMEOUT|系統忙碌中，請稍後再試');
  }

  return lock;
}

/**
 * 釋放 Lock
 * @param {Lock} lock - Lock 物件
 */
function releaseLock(lock) {
  if (lock) {
    lock.releaseLock();
  }
}

/**
 * 取得當前使用者 Email
 * @returns {string} 使用者 Email
 */
function getCurrentUserEmail() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('UNAUTHORIZED|未登入');
  }
  return email;
}

/**
 * 取得當前使用者有效 Email（兼容開發環境）
 * @returns {string} 使用者 Email
 */
function getEffectiveUserEmail() {
  const email = Session.getEffectiveUser().getEmail();
  if (!email) {
    throw new Error('UNAUTHORIZED|未登入');
  }
  return email;
}

/**
 * 清理字串（去除前後空白）
 * @param {string} str - 字串
 * @returns {string} 清理後的字串
 */
function cleanString(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

/**
 * 驗證 Email 格式
 * @param {string} email - Email 地址
 * @returns {boolean} 是否為有效 Email
 */
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 驗證日期格式
 * @param {string} dateString - 日期字串（yyyy-MM-dd）
 * @returns {boolean} 是否為有效日期
 */
function isValidDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * 驗證數字
 * @param {any} value - 值
 * @returns {boolean} 是否為有效數字
 */
function isValidNumber(value) {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 陣列轉字串（逗號分隔）
 * @param {Array} arr - 陣列
 * @returns {string} 字串
 */
function arrayToString(arr) {
  if (!Array.isArray(arr)) return '';
  return arr.join(',');
}

/**
 * 字串轉陣列（逗號分隔）
 * @param {string} str - 字串
 * @returns {Array} 陣列
 */
function stringToArray(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(s => s.trim()).filter(s => s !== '');
}

/**
 * 深度複製物件
 * @param {any} obj - 物件
 * @returns {any} 複製後的物件
 */
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 檢查物件是否為空
 * @param {object} obj - 物件
 * @returns {boolean} 是否為空
 */
function isEmpty(obj) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * 格式化錯誤訊息
 * @param {Error|string} error - 錯誤物件或訊息
 * @returns {object} 格式化後的錯誤物件
 */
function formatError(error) {
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = '系統錯誤，請稍後再試';

  if (typeof error === 'string') {
    // 如果錯誤字串包含 '|'，分離錯誤碼和訊息
    if (error.includes('|')) {
      const parts = error.split('|');
      code = parts[0];
      message = parts[1];
    } else {
      message = error;
    }
  } else if (error instanceof Error) {
    const errorMessage = error.message || '';
    if (errorMessage.includes('|')) {
      const parts = errorMessage.split('|');
      code = parts[0];
      message = parts[1];
    } else {
      message = errorMessage;
    }
  }

  return {
    code: code,
    message: message
  };
}

/**
 * 建立成功回應
 * @param {any} data - 回應資料
 * @param {string} message - 成功訊息
 * @returns {object} 回應物件
 */
function createSuccessResponse(data = null, message = '') {
  return {
    success: true,
    data: data,
    message: message
  };
}

/**
 * 建立錯誤回應
 * @param {Error|string} error - 錯誤物件或訊息
 * @returns {object} 回應物件
 */
function createErrorResponse(error) {
  const formattedError = formatError(error);
  return {
    success: false,
    error: formattedError
  };
}

/**
 * 記錄錯誤
 * @param {string} context - 錯誤上下文
 * @param {Error|string} error - 錯誤
 */
function logError(context, error) {
  Logger.log('=== 錯誤 ===');
  Logger.log('上下文: ' + context);
  if (error instanceof Error) {
    Logger.log('錯誤訊息: ' + error.message);
    Logger.log('堆疊追蹤: ' + error.stack);
  } else {
    Logger.log('錯誤訊息: ' + error);
  }
  Logger.log('時間: ' + new Date());
  Logger.log('==========');
}

/**
 * 記錄資訊
 * @param {string} context - 上下文
 * @param {any} info - 資訊
 */
function logInfo(context, info) {
  Logger.log('=== 資訊 ===');
  Logger.log('上下文: ' + context);
  Logger.log('內容: ' + JSON.stringify(info));
  Logger.log('時間: ' + new Date());
  Logger.log('==========');
}

/**
 * 睡眠（毫秒）
 * @param {number} ms - 毫秒數
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

/**
 * 重試函式
 * @param {function} fn - 要執行的函式
 * @param {number} maxAttempts - 最大重試次數
 * @param {number} delay - 重試延遲（毫秒）
 * @returns {any} 函式執行結果
 */
function retry(fn, maxAttempts = 3, delay = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return fn();
    } catch (error) {
      lastError = error;
      Logger.log(`第 ${attempt} 次嘗試失敗: ${error.message}`);

      if (attempt < maxAttempts) {
        sleep(delay * attempt); // 指數退避
      }
    }
  }

  throw lastError;
}

// --- ▲▲▲ Utils.gs 結束 ▲▲▲ ---
