// --- ▼▼▼ AuthService.gs - 身份驗證服務 ▼▼▼ ---

/**
 * 檢查使用者身份驗證
 * @returns {object} 使用者物件
 * @throws {Error} 未登入、使用者不存在或未批准
 */
function checkAuth() {
  const email = getCurrentUserEmail();

  const userDAO = new UserDAO();
  let user = userDAO.findByEmail(email);

  // 如果使用者不存在，自動建立新使用者（待批准狀態）
  if (!user) {
    Logger.log(`新使用者首次登入: ${email}`);

    // 嘗試取得使用者顯示名稱
    const displayName = Session.getActiveUser().getEmail().split('@')[0];

    user = userDAO.createUser(email, displayName);

    // 拋出錯誤，告知使用者需要等待批准
    throw new Error('USER_NOT_APPROVED|您的帳號尚未批准，請等待管理員審核');
  }

  // 檢查使用者狀態
  if (user.status !== USER_STATUS.APPROVED) {
    if (user.status === USER_STATUS.SUSPENDED) {
      throw new Error('USER_NOT_APPROVED|您的帳號已被停用，請聯絡管理員');
    } else {
      throw new Error('USER_NOT_APPROVED|您的帳號尚未批准，請等待管理員審核');
    }
  }

  // 更新最後登入時間
  try {
    userDAO.updateLastLogin(user.id);
  } catch (e) {
    // 更新失敗不影響登入
    Logger.log('更新最後登入時間失敗: ' + e.message);
  }

  return user;
}

/**
 * 檢查使用者角色
 * @param {object} user - 使用者物件
 * @param {Array<string>} allowedRoles - 允許的角色陣列
 * @returns {boolean} 是否有權限
 * @throws {Error} 權限不足
 */
function checkRole(user, allowedRoles) {
  if (!user || !user.roles) {
    throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限執行此操作');
  }

  const userDAO = new UserDAO();
  const hasRole = userDAO.hasAnyRole(user, allowedRoles);

  if (!hasRole) {
    throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限執行此操作');
  }

  return true;
}

/**
 * 檢查使用者是否為管理員
 * @param {object} user - 使用者物件
 * @returns {boolean} 是否為管理員
 */
function isAdmin(user) {
  if (!user) return false;
  const userDAO = new UserDAO();
  return userDAO.hasRole(user, USER_ROLES.ADMIN);
}

/**
 * 檢查使用者是否為財務人員
 * @param {object} user - 使用者物件
 * @returns {boolean} 是否為財務人員
 */
function isFinanceStaff(user) {
  if (!user) return false;
  const userDAO = new UserDAO();
  return userDAO.hasAnyRole(user, [
    USER_ROLES.FINANCE_STAFF,
    USER_ROLES.TREASURER,
    USER_ROLES.ADMIN
  ]);
}

/**
 * 檢查使用者是否為報帳聯絡人
 * @param {object} user - 使用者物件
 * @returns {boolean} 是否為報帳聯絡人
 */
function isReimbursementContact(user) {
  if (!user) return false;
  const userDAO = new UserDAO();
  return userDAO.hasAnyRole(user, [
    USER_ROLES.REIMBURSEMENT_CONTACT,
    USER_ROLES.ADMIN
  ]);
}

/**
 * 取得當前使用者
 * @returns {object} 使用者物件
 */
function getCurrentUser() {
  return checkAuth();
}

/**
 * 取得當前使用者資訊（不檢查狀態）
 * @returns {object|null} 使用者物件或 null
 */
function getCurrentUserInfo() {
  try {
    const email = getCurrentUserEmail();
    const userDAO = new UserDAO();
    return userDAO.findByEmail(email);
  } catch (e) {
    return null;
  }
}

/**
 * 驗證 API 請求（中介軟體）
 * @param {function} handler - API 處理函式
 * @param {Array<string>} requiredRoles - 需要的角色（可選）
 * @returns {function} 包裝後的處理函式
 */
function requireAuth(handler, requiredRoles = null) {
  return function(request) {
    try {
      // 檢查身份驗證
      const user = checkAuth();

      // 檢查角色（如果需要）
      if (requiredRoles && requiredRoles.length > 0) {
        checkRole(user, requiredRoles);
      }

      // 執行處理函式
      return handler(request, user);
    } catch (error) {
      return createErrorResponse(error);
    }
  };
}

/**
 * 檢查使用者是否為資源擁有者
 * @param {object} user - 使用者物件
 * @param {string} resourceUserId - 資源擁有者 ID
 * @returns {boolean} 是否為擁有者
 */
function isResourceOwner(user, resourceUserId) {
  if (!user || !resourceUserId) return false;
  return user.id === resourceUserId;
}

/**
 * 檢查使用者是否可以修改資源（擁有者或管理員）
 * @param {object} user - 使用者物件
 * @param {string} resourceUserId - 資源擁有者 ID
 * @returns {boolean} 是否可以修改
 */
function canModifyResource(user, resourceUserId) {
  return isResourceOwner(user, resourceUserId) || isAdmin(user);
}

/**
 * 檢查使用者是否可以刪除資源（擁有者或管理員）
 * @param {object} user - 使用者物件
 * @param {string} resourceUserId - 資源擁有者 ID
 * @returns {boolean} 是否可以刪除
 * @throws {Error} 權限不足
 */
function requireOwnerOrAdmin(user, resourceUserId) {
  if (!canModifyResource(user, resourceUserId)) {
    throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限執行此操作');
  }
  return true;
}

// --- ▲▲▲ AuthService.gs 結束 ▲▲▲ ---
