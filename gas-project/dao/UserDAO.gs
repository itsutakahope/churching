// --- ▼▼▼ UserDAO.gs - 使用者資料存取 ▼▼▼ ---

/**
 * 使用者 DAO 類別
 */
class UserDAO extends BaseDAO {
  constructor() {
    super(SHEET_NAMES.USERS);
  }

  /**
   * 初始化使用者工作表
   */
  initialize() {
    const headers = [
      'id',
      'email',
      'displayName',
      'roles',
      'status',
      'wantsNewRequestNotification',
      'wantsPurchaseCompleteNotification',
      'createdAt',
      'lastLoginAt',
      'updatedAt'
    ];

    this.initializeSheet(headers);
  }

  /**
   * 根據 Email 查找使用者
   * @param {string} email - Email 地址
   * @returns {object|null} 使用者物件或 null
   */
  findByEmail(email) {
    return this.findOne({ email: email });
  }

  /**
   * 根據角色查找使用者
   * @param {string} role - 角色名稱
   * @returns {Array<object>} 使用者陣列
   */
  findByRole(role) {
    const allUsers = this.findAll();
    return allUsers.filter(user => {
      const roles = stringToArray(user.roles);
      return roles.includes(role);
    });
  }

  /**
   * 取得所有已批准的使用者
   * @returns {Array<object>} 使用者陣列
   */
  findApprovedUsers() {
    return this.findBy({ status: USER_STATUS.APPROVED });
  }

  /**
   * 取得所有報帳聯絡人
   * @returns {Array<object>} 使用者陣列
   */
  findReimbursementContacts() {
    const allUsers = this.findApprovedUsers();
    return allUsers.filter(user => {
      const roles = stringToArray(user.roles);
      return roles.includes(USER_ROLES.REIMBURSEMENT_CONTACT) || roles.includes(USER_ROLES.ADMIN);
    });
  }

  /**
   * 取得所有財務人員
   * @returns {Array<object>} 使用者陣列
   */
  findFinanceStaff() {
    const allUsers = this.findApprovedUsers();
    return allUsers.filter(user => {
      const roles = stringToArray(user.roles);
      return roles.includes(USER_ROLES.FINANCE_STAFF) ||
             roles.includes(USER_ROLES.TREASURER) ||
             roles.includes(USER_ROLES.ADMIN);
    });
  }

  /**
   * 建立新使用者
   * @param {string} email - Email 地址
   * @param {string} displayName - 顯示名稱
   * @returns {object} 使用者物件
   */
  createUser(email, displayName) {
    // 檢查是否已存在
    const existing = this.findByEmail(email);
    if (existing) {
      throw new Error('DUPLICATE_RECORD|使用者已存在');
    }

    const userData = {
      email: email,
      displayName: displayName,
      roles: USER_ROLES.USER,  // 預設為普通使用者
      status: USER_STATUS.PENDING,  // 預設為待批准
      wantsNewRequestNotification: true,  // 預設訂閱新申請通知
      wantsPurchaseCompleteNotification: true,  // 預設訂閱完成通知
      lastLoginAt: formatDateTime(new Date())
    };

    return this.create(userData);
  }

  /**
   * 更新使用者最後登入時間
   * @param {string} userId - 使用者 ID
   * @returns {object} 更新後的使用者物件
   */
  updateLastLogin(userId) {
    return this.update(userId, {
      lastLoginAt: formatDateTime(new Date())
    });
  }

  /**
   * 更新使用者通知偏好
   * @param {string} userId - 使用者 ID
   * @param {object} preferences - 偏好設定
   * @returns {object} 更新後的使用者物件
   */
  updatePreferences(userId, preferences) {
    const updates = {};

    if (preferences.wantsNewRequestNotification !== undefined) {
      updates.wantsNewRequestNotification = preferences.wantsNewRequestNotification;
    }

    if (preferences.wantsPurchaseCompleteNotification !== undefined) {
      updates.wantsPurchaseCompleteNotification = preferences.wantsPurchaseCompleteNotification;
    }

    if (preferences.displayName !== undefined) {
      updates.displayName = preferences.displayName;
    }

    return this.update(userId, updates);
  }

  /**
   * 批准使用者
   * @param {string} userId - 使用者 ID
   * @returns {object} 更新後的使用者物件
   */
  approveUser(userId) {
    return this.update(userId, {
      status: USER_STATUS.APPROVED
    });
  }

  /**
   * 停用使用者
   * @param {string} userId - 使用者 ID
   * @returns {object} 更新後的使用者物件
   */
  suspendUser(userId) {
    return this.update(userId, {
      status: USER_STATUS.SUSPENDED
    });
  }

  /**
   * 更新使用者角色
   * @param {string} userId - 使用者 ID
   * @param {Array<string>} roles - 角色陣列
   * @returns {object} 更新後的使用者物件
   */
  updateRoles(userId, roles) {
    const rolesString = arrayToString(roles);
    return this.update(userId, {
      roles: rolesString
    });
  }

  /**
   * 檢查使用者是否有指定角色
   * @param {object} user - 使用者物件
   * @param {string} role - 角色名稱
   * @returns {boolean} 是否有該角色
   */
  hasRole(user, role) {
    if (!user || !user.roles) return false;
    const roles = stringToArray(user.roles);
    return roles.includes(role);
  }

  /**
   * 檢查使用者是否有任一指定角色
   * @param {object} user - 使用者物件
   * @param {Array<string>} allowedRoles - 允許的角色陣列
   * @returns {boolean} 是否有任一角色
   */
  hasAnyRole(user, allowedRoles) {
    if (!user || !user.roles) return false;
    const roles = stringToArray(user.roles);
    return allowedRoles.some(role => roles.includes(role));
  }

  /**
   * 取得訂閱新申請通知的使用者
   * @returns {Array<object>} 使用者陣列
   */
  findUsersWantingNewRequestNotification() {
    const allUsers = this.findApprovedUsers();
    return allUsers.filter(user => user.wantsNewRequestNotification === true || user.wantsNewRequestNotification === 'TRUE');
  }

  /**
   * 取得使用者簡要資訊（用於顯示）
   * @param {string} userId - 使用者 ID
   * @returns {object} 簡要資訊 {id, displayName, email}
   */
  getUserInfo(userId) {
    const user = this.findById(userId);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email
    };
  }
}

// --- ▲▲▲ UserDAO.gs 結束 ▲▲▲ ---
