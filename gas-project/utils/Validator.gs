// --- ▼▼▼ Validator.gs - 資料驗證 ▼▼▼ ---

/**
 * 驗證必填欄位
 * @param {object} data - 資料物件
 * @param {Array<string>} requiredFields - 必填欄位陣列
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateRequiredFields(data, requiredFields) {
  const errors = [];

  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`欄位 ${field} 為必填`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證採購申請資料
 * @param {object} data - 採購申請資料
 * @param {boolean} isUpdate - 是否為更新操作
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateRequirement(data, isUpdate = false) {
  const errors = [];

  // 新增時的必填欄位
  if (!isUpdate) {
    const requiredFields = ['text', 'accountingCategory'];
    const result = validateRequiredFields(data, requiredFields);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  // 驗證優先級
  if (data.priority && !Object.values(REQUIREMENT_PRIORITY).includes(data.priority)) {
    errors.push('優先級必須為 normal 或 urgent');
  }

  // 驗證狀態
  if (data.status && !Object.values(REQUIREMENT_STATUS).includes(data.status)) {
    errors.push('狀態必須為 pending、purchased 或 cancelled');
  }

  // 如果狀態為 purchased，必須提供購買相關資訊
  if (data.status === REQUIREMENT_STATUS.PURCHASED) {
    if (!data.purchaseAmount || !isValidNumber(data.purchaseAmount)) {
      errors.push('購買金額必須為有效數字');
    }
    if (data.purchaseAmount && data.purchaseAmount <= 0) {
      errors.push('購買金額必須大於 0');
    }
    if (!data.purchaseDate || !isValidDate(data.purchaseDate)) {
      errors.push('購買日期格式不正確（yyyy-MM-dd）');
    }
    if (!data.purchaserId) {
      errors.push('購買人 ID 為必填');
    }
    if (!data.purchaserName) {
      errors.push('購買人名稱為必填');
    }
    if (!data.reimbursementerId) {
      errors.push('報帳人 ID 為必填');
    }
    if (!data.reimbursementerName) {
      errors.push('報帳人名稱為必填');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證留言資料
 * @param {object} data - 留言資料
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateComment(data) {
  const errors = [];

  const requiredFields = ['requirementId', 'text'];
  const result = validateRequiredFields(data, requiredFields);
  if (!result.isValid) {
    errors.push(...result.errors);
  }

  // 驗證留言內容長度
  if (data.text && data.text.length > 1000) {
    errors.push('留言內容不能超過 1000 字');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證奉獻任務資料
 * @param {object} data - 奉獻任務資料
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateTitheTask(data) {
  const errors = [];

  const requiredFields = ['taskName', 'treasurerUid', 'treasurerName', 'financeStaffUid', 'financeStaffName'];
  const result = validateRequiredFields(data, requiredFields);
  if (!result.isValid) {
    errors.push(...result.errors);
  }

  // 驗證狀態
  if (data.status && !Object.values(TITHE_STATUS).includes(data.status)) {
    errors.push('狀態必須為 in-progress 或 completed');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證奉獻記錄資料
 * @param {object} data - 奉獻記錄資料
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateDedication(data) {
  const errors = [];

  const requiredFields = ['titheTaskId', 'dedicationDate', 'dedicatorId', 'dedicationCategory', 'amount', 'method'];
  const result = validateRequiredFields(data, requiredFields);
  if (!result.isValid) {
    errors.push(...result.errors);
  }

  // 驗證金額
  if (!isValidNumber(data.amount)) {
    errors.push('金額必須為有效數字');
  } else if (data.amount <= 0) {
    errors.push('金額必須大於 0');
  }

  // 驗證支付方式
  if (!Object.values(PAYMENT_METHOD).includes(data.method)) {
    errors.push('支付方式必須為 cash 或 cheque');
  }

  // 驗證奉獻科目
  if (!DEDICATION_CATEGORIES.includes(data.dedicationCategory)) {
    errors.push('奉獻科目不正確');
  }

  // 驗證奉獻日期
  if (!isValidDate(data.dedicationDate)) {
    errors.push('奉獻日期格式不正確（yyyy-MM-dd）');
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證使用者資料
 * @param {object} data - 使用者資料
 * @param {boolean} isUpdate - 是否為更新操作
 * @returns {object} 驗證結果 {isValid, errors}
 */
function validateUser(data, isUpdate = false) {
  const errors = [];

  // 新增時的必填欄位
  if (!isUpdate) {
    const requiredFields = ['email', 'displayName'];
    const result = validateRequiredFields(data, requiredFields);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }

  // 驗證 Email 格式
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Email 格式不正確');
  }

  // 驗證狀態
  if (data.status && !Object.values(USER_STATUS).includes(data.status)) {
    errors.push('狀態必須為 pending、approved 或 suspended');
  }

  // 驗證角色
  if (data.roles) {
    const roles = typeof data.roles === 'string' ? stringToArray(data.roles) : data.roles;
    const validRoles = Object.values(USER_ROLES);
    const invalidRoles = roles.filter(role => !validRoles.includes(role));

    if (invalidRoles.length > 0) {
      errors.push(`無效的角色: ${invalidRoles.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * 驗證分頁參數
 * @param {object} pagination - 分頁參數
 * @returns {object} 驗證並格式化後的分頁參數
 */
function validatePagination(pagination) {
  let page = pagination?.page || PAGINATION.DEFAULT_PAGE;
  let pageSize = pagination?.pageSize || PAGINATION.DEFAULT_PAGE_SIZE;

  // 確保為正整數
  page = Math.max(1, Math.floor(page));
  pageSize = Math.max(1, Math.min(PAGINATION.MAX_PAGE_SIZE, Math.floor(pageSize)));

  return {
    page: page,
    pageSize: pageSize
  };
}

/**
 * 驗證排序參數
 * @param {object} sort - 排序參數
 * @param {Array<string>} validFields - 有效的排序欄位
 * @returns {object} 驗證後的排序參數
 */
function validateSort(sort, validFields = []) {
  if (!sort || !sort.field) {
    return {
      field: 'createdAt',
      order: 'desc'
    };
  }

  // 驗證排序欄位
  if (validFields.length > 0 && !validFields.includes(sort.field)) {
    return {
      field: 'createdAt',
      order: 'desc'
    };
  }

  // 驗證排序順序
  const order = (sort.order || 'desc').toLowerCase();
  if (!['asc', 'desc'].includes(order)) {
    return {
      field: sort.field,
      order: 'desc'
    };
  }

  return {
    field: sort.field,
    order: order
  };
}

/**
 * 驗證篩選參數
 * @param {object} filters - 篩選參數
 * @param {Array<string>} validFields - 有效的篩選欄位
 * @returns {object} 驗證後的篩選參數
 */
function validateFilters(filters, validFields = []) {
  if (!filters || typeof filters !== 'object') {
    return {};
  }

  const validatedFilters = {};

  Object.keys(filters).forEach(key => {
    // 如果指定了有效欄位，則只保留有效欄位
    if (validFields.length === 0 || validFields.includes(key)) {
      validatedFilters[key] = filters[key];
    }
  });

  return validatedFilters;
}

// --- ▲▲▲ Validator.gs 結束 ▲▲▲ ---
