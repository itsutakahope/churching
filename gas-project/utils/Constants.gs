// --- ▼▼▼ Constants.gs - 常數定義 ▼▼▼ ---

/**
 * 工作表名稱常數
 */
const SHEET_NAMES = {
  USERS: 'Users',
  REQUIREMENTS: 'Requirements',
  COMMENTS: 'Comments',
  TITHE: 'Tithe',
  DEDICATIONS: 'Dedications',
  CONFIG: 'Config'
};

/**
 * 使用者狀態常數
 */
const USER_STATUS = {
  PENDING: 'pending',      // 待批准
  APPROVED: 'approved',    // 已批准
  SUSPENDED: 'suspended'   // 已停用
};

/**
 * 使用者角色常數
 */
const USER_ROLES = {
  ADMIN: 'admin',                            // 管理員
  FINANCE_STAFF: 'finance_staff',            // 財務同工
  TREASURER: 'treasurer',                    // 司庫
  REIMBURSEMENT_CONTACT: 'reimbursementContact',  // 報帳聯絡人
  USER: 'user'                               // 普通使用者
};

/**
 * 採購申請狀態常數
 */
const REQUIREMENT_STATUS = {
  PENDING: 'pending',      // 待購買
  PURCHASED: 'purchased',  // 已購買
  CANCELLED: 'cancelled'   // 已取消
};

/**
 * 採購優先級常數
 */
const REQUIREMENT_PRIORITY = {
  NORMAL: 'normal',   // 一般
  URGENT: 'urgent'    // 緊急
};

/**
 * 奉獻任務狀態常數
 */
const TITHE_STATUS = {
  IN_PROGRESS: 'in-progress',  // 進行中
  COMPLETED: 'completed'       // 已完成
};

/**
 * 奉獻支付方式常數
 */
const PAYMENT_METHOD = {
  CASH: 'cash',       // 現金
  CHEQUE: 'cheque'    // 支票
};

/**
 * 奉獻科目常數
 */
const DEDICATION_CATEGORIES = [
  '十一',
  '感恩',
  '主日',
  '宣教',
  '特別',
  '專案',
  '裝潢',
  '指定',
  '慈惠',
  '植堂'
];

/**
 * 錯誤碼常數
 */
const ERROR_CODES = {
  // 身份驗證錯誤
  UNAUTHORIZED: 'UNAUTHORIZED',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_NOT_APPROVED: 'USER_NOT_APPROVED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // 資料驗證錯誤
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_DATE_FORMAT: 'INVALID_DATE_FORMAT',
  INVALID_AMOUNT: 'INVALID_AMOUNT',

  // 資料操作錯誤
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  DUPLICATE_RECORD: 'DUPLICATE_RECORD',
  DELETE_FAILED: 'DELETE_FAILED',
  UPDATE_FAILED: 'UPDATE_FAILED',
  CREATE_FAILED: 'CREATE_FAILED',

  // 業務邏輯錯誤
  CANNOT_DELETE_OWN_COMMENT: 'CANNOT_DELETE_OWN_COMMENT',
  CANNOT_EDIT_PURCHASED_REQUIREMENT: 'CANNOT_EDIT_PURCHASED_REQUIREMENT',
  TASK_ALREADY_COMPLETED: 'TASK_ALREADY_COMPLETED',
  CALCULATION_FAILED: 'CALCULATION_FAILED',

  // 系統錯誤
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',
  LOCK_TIMEOUT: 'LOCK_TIMEOUT'
};

/**
 * 成功訊息常數
 */
const SUCCESS_MESSAGES = {
  REQUIREMENT_CREATED: '採購申請已建立',
  REQUIREMENT_UPDATED: '採購申請已更新',
  REQUIREMENT_DELETED: '採購申請已刪除',
  COMMENT_ADDED: '留言已新增',
  COMMENT_DELETED: '留言已刪除',
  TITHE_TASK_CREATED: '奉獻任務已建立',
  TITHE_TASK_COMPLETED: '奉獻任務已完成',
  DEDICATION_ADDED: '奉獻記錄已新增',
  USER_UPDATED: '使用者資料已更新',
  EMAIL_SENT: 'Email 已發送'
};

/**
 * 系統設定鍵常數
 */
const CONFIG_KEYS = {
  ACCOUNTING_CATEGORIES: 'ACCOUNTING_CATEGORIES',
  DEDICATION_CATEGORIES: 'DEDICATION_CATEGORIES',
  EMAIL_SETTINGS: 'EMAIL_SETTINGS',
  SYSTEM_VERSION: 'SYSTEM_VERSION'
};

/**
 * 日期時間格式常數
 */
const DATE_FORMAT = {
  DATE: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  TIME: 'HH:mm:ss'
};

/**
 * 分頁預設值
 */
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

/**
 * Email 配額限制
 */
const EMAIL_QUOTA = {
  DAILY_LIMIT: 100,        // 每日發送上限
  BATCH_SIZE: 10,          // 批次發送數量
  RETRY_ATTEMPTS: 3        // 重試次數
};

/**
 * LockService 超時設定（毫秒）
 */
const LOCK_TIMEOUT = {
  SHORT: 5000,     // 5 秒
  MEDIUM: 10000,   // 10 秒
  LONG: 30000      // 30 秒
};

/**
 * 快取設定（秒）
 */
const CACHE_DURATION = {
  SHORT: 300,      // 5 分鐘
  MEDIUM: 1800,    // 30 分鐘
  LONG: 3600       // 1 小時
};

// --- ▲▲▲ Constants.gs 結束 ▲▲▲ ---
