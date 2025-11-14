// --- ▼▼▼ UserAPI.gs - 使用者 API ▼▼▼ ---

/**
 * 取得所有使用者列表（管理員功能）
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getUsers(request, user) {
  try {
    // 檢查權限：只有管理員可以查看所有使用者
    checkRole(user, [USER_ROLES.ADMIN]);

    const userDAO = new UserDAO();
    const users = userDAO.findAll();

    // 按建立時間排序
    users.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return bDate - aDate;
    });

    return createSuccessResponse(users);
  } catch (error) {
    logError('getUsers', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得報帳聯絡人列表
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getReimbursementContacts(request, user) {
  try {
    const userDAO = new UserDAO();
    const contacts = userDAO.findReimbursementContacts();

    return createSuccessResponse(contacts);
  } catch (error) {
    logError('getReimbursementContacts', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得財務人員列表
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getFinanceStaff(request, user) {
  try {
    // 檢查權限：只有財務人員或管理員可以查看
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    const userDAO = new UserDAO();
    const staff = userDAO.findFinanceStaff();

    return createSuccessResponse(staff);
  } catch (error) {
    logError('getFinanceStaff', error);
    return createErrorResponse(error);
  }
}

/**
 * 更新使用者資料（管理員功能）
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function updateUser(request, user) {
  try {
    const userId = request.data.id;
    const updates = request.data.updates;

    if (!userId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少使用者 ID');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少更新資料');
    }

    // 檢查權限：只有管理員可以更新使用者資料
    checkRole(user, [USER_ROLES.ADMIN]);

    const userDAO = new UserDAO();

    // 檢查使用者是否存在
    const targetUser = userDAO.findById(userId);
    if (!targetUser) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的使用者');
    }

    // 更新角色
    if (updates.roles) {
      const roles = Array.isArray(updates.roles) ? updates.roles : stringToArray(updates.roles);
      userDAO.updateRoles(userId, roles);
    }

    // 更新狀態
    if (updates.status) {
      if (updates.status === USER_STATUS.APPROVED) {
        userDAO.approveUser(userId);
      } else if (updates.status === USER_STATUS.SUSPENDED) {
        userDAO.suspendUser(userId);
      } else {
        userDAO.update(userId, { status: updates.status });
      }
    }

    // 更新其他欄位
    const otherUpdates = {};
    if (updates.displayName) otherUpdates.displayName = updates.displayName;
    if (updates.wantsNewRequestNotification !== undefined) {
      otherUpdates.wantsNewRequestNotification = updates.wantsNewRequestNotification;
    }
    if (updates.wantsPurchaseCompleteNotification !== undefined) {
      otherUpdates.wantsPurchaseCompleteNotification = updates.wantsPurchaseCompleteNotification;
    }

    if (Object.keys(otherUpdates).length > 0) {
      userDAO.update(userId, otherUpdates);
    }

    // 取得更新後的使用者資料
    const updated = userDAO.findById(userId);

    Logger.log(`管理員 ${user.displayName} 更新使用者資料: ${userId}`);

    return createSuccessResponse(updated, SUCCESS_MESSAGES.USER_UPDATED);
  } catch (error) {
    logError('updateUser', error);
    return createErrorResponse(error);
  }
}

/**
 * 更新使用者偏好設定
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function updateUserPreferences(request, user) {
  try {
    const preferences = request.data;

    const userDAO = new UserDAO();
    const updated = userDAO.updatePreferences(user.id, preferences);

    Logger.log(`使用者 ${user.displayName} 更新偏好設定`);

    return createSuccessResponse(updated, SUCCESS_MESSAGES.USER_UPDATED);
  } catch (error) {
    logError('updateUserPreferences', error);
    return createErrorResponse(error);
  }
}

/**
 * 批准使用者（管理員功能）
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function approveUser(request, user) {
  try {
    const userId = request.data.id;

    if (!userId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少使用者 ID');
    }

    // 檢查權限：只有管理員可以批准使用者
    checkRole(user, [USER_ROLES.ADMIN]);

    const userDAO = new UserDAO();
    const updated = userDAO.approveUser(userId);

    Logger.log(`管理員 ${user.displayName} 批准使用者: ${userId}`);

    return createSuccessResponse(updated, '使用者已批准');
  } catch (error) {
    logError('approveUser', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得當前使用者資訊
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getCurrentUserProfile(request, user) {
  try {
    return createSuccessResponse(user);
  } catch (error) {
    logError('getCurrentUserProfile', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得使用者簡要資訊
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getUserInfo(request, user) {
  try {
    const userId = request.data.id;

    if (!userId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少使用者 ID');
    }

    const userDAO = new UserDAO();
    const userInfo = userDAO.getUserInfo(userId);

    if (!userInfo) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的使用者');
    }

    return createSuccessResponse(userInfo);
  } catch (error) {
    logError('getUserInfo', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ UserAPI.gs 結束 ▲▲▲ ---
