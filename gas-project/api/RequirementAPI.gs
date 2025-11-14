// --- ▼▼▼ RequirementAPI.gs - 採購申請 API ▼▼▼ ---

/**
 * 建立採購申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function createRequirement(request, user) {
  try {
    const data = request.data;

    // 補充使用者資訊
    data.userId = user.id;
    data.requesterName = user.displayName;

    // 建立採購申請
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.createRequirement(data);

    Logger.log(`使用者 ${user.displayName} 建立採購申請: ${requirement.id}`);

    // 發送 Email 通知（非同步，不阻塞回應）
    try {
      sendNewRequirementNotification(requirement);
    } catch (emailError) {
      Logger.log('發送 Email 通知失敗: ' + emailError.message);
      // Email 失敗不影響採購申請建立
    }

    return createSuccessResponse(requirement, SUCCESS_MESSAGES.REQUIREMENT_CREATED);
  } catch (error) {
    logError('createRequirement', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得採購申請列表
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getRequirements(request, user) {
  try {
    const data = request.data || {};

    const requirementDAO = new RequirementDAO();
    const result = requirementDAO.query({
      filters: data.filters,
      sort: data.sort,
      pagination: data.pagination
    });

    return createSuccessResponse(result);
  } catch (error) {
    logError('getRequirements', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得單一採購申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getRequirement(request, user) {
  try {
    const requirementId = request.data.id;

    if (!requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(requirementId);

    if (!requirement) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    return createSuccessResponse(requirement);
  } catch (error) {
    logError('getRequirement', error);
    return createErrorResponse(error);
  }
}

/**
 * 更新採購申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function updateRequirement(request, user) {
  try {
    const requirementId = request.data.id;
    const updates = request.data.updates;

    if (!requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少更新資料');
    }

    // 檢查權限
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(requirementId);

    if (!requirement) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    // 只有建立者或管理員可以修改
    requireOwnerOrAdmin(user, requirement.userId);

    // 更新採購申請
    const updated = requirementDAO.updateRequirement(requirementId, updates);

    Logger.log(`使用者 ${user.displayName} 更新採購申請: ${requirementId}`);

    // 如果狀態變更為 purchased，發送通知
    if (updates.status === REQUIREMENT_STATUS.PURCHASED && requirement.status !== REQUIREMENT_STATUS.PURCHASED) {
      try {
        sendPurchaseCompleteNotification(updated, requirement.userId);
      } catch (emailError) {
        Logger.log('發送 Email 通知失敗: ' + emailError.message);
      }
    }

    return createSuccessResponse(updated, SUCCESS_MESSAGES.REQUIREMENT_UPDATED);
  } catch (error) {
    logError('updateRequirement', error);
    return createErrorResponse(error);
  }
}

/**
 * 刪除採購申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function deleteRequirement(request, user) {
  try {
    const requirementId = request.data.id;

    if (!requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    // 檢查權限
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(requirementId);

    if (!requirement) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    // 只有建立者或管理員可以刪除
    requireOwnerOrAdmin(user, requirement.userId);

    // 刪除相關留言
    const commentDAO = new CommentDAO();
    commentDAO.deleteByRequirementId(requirementId);

    // 刪除採購申請
    requirementDAO.delete(requirementId);

    Logger.log(`使用者 ${user.displayName} 刪除採購申請: ${requirementId}`);

    return createSuccessResponse(null, SUCCESS_MESSAGES.REQUIREMENT_DELETED);
  } catch (error) {
    logError('deleteRequirement', error);
    return createErrorResponse(error);
  }
}

/**
 * 轉移報帳人
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function transferReimbursement(request, user) {
  try {
    const requirementId = request.data.id;
    const newReimbursementerId = request.data.newReimbursementerId;
    const newReimbursementerName = request.data.newReimbursementerName;

    if (!requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    if (!newReimbursementerId || !newReimbursementerName) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少新報帳人資訊');
    }

    // 檢查權限：只有報帳聯絡人或管理員可以轉移
    if (!isReimbursementContact(user) && !isAdmin(user)) {
      throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限轉移報帳人');
    }

    // 轉移報帳人
    const requirementDAO = new RequirementDAO();
    const updated = requirementDAO.transferReimbursement(
      requirementId,
      newReimbursementerId,
      newReimbursementerName
    );

    Logger.log(`使用者 ${user.displayName} 轉移報帳人: ${requirementId} -> ${newReimbursementerName}`);

    return createSuccessResponse(updated, '報帳人已成功轉移');
  } catch (error) {
    logError('transferReimbursement', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得採購申請統計
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getRequirementStatistics(request, user) {
  try {
    const requirementDAO = new RequirementDAO();
    const stats = requirementDAO.getStatistics();

    return createSuccessResponse(stats);
  } catch (error) {
    logError('getRequirementStatistics', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得我的採購申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getMyRequirements(request, user) {
  try {
    const data = request.data || {};

    // 強制篩選當前使用者的申請
    if (!data.filters) {
      data.filters = {};
    }
    data.filters.userId = user.id;

    const requirementDAO = new RequirementDAO();
    const result = requirementDAO.query({
      filters: data.filters,
      sort: data.sort,
      pagination: data.pagination
    });

    return createSuccessResponse(result);
  } catch (error) {
    logError('getMyRequirements', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得我的報帳申請
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getMyReimbursements(request, user) {
  try {
    const requirementDAO = new RequirementDAO();
    const requirements = requirementDAO.findByReimbursementerId(user.id);

    // 按更新時間排序
    requirements.sort((a, b) => {
      const aDate = new Date(a.updatedAt || a.createdAt);
      const bDate = new Date(b.updatedAt || b.createdAt);
      return bDate - aDate;
    });

    return createSuccessResponse({
      data: requirements,
      pagination: {
        page: 1,
        pageSize: requirements.length,
        total: requirements.length,
        totalPages: 1
      }
    });
  } catch (error) {
    logError('getMyReimbursements', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ RequirementAPI.gs 結束 ▲▲▲ ---
