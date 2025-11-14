// --- ▼▼▼ CommentAPI.gs - 留言 API ▼▼▼ ---

/**
 * 新增留言
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function addComment(request, user) {
  try {
    const data = request.data;

    if (!data.requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    if (!data.text) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少留言內容');
    }

    // 檢查採購申請是否存在
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(data.requirementId);

    if (!requirement) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    // 補充使用者資訊
    const commentData = {
      requirementId: data.requirementId,
      text: data.text,
      userId: user.id,
      authorName: user.displayName
    };

    // 建立留言
    const commentDAO = new CommentDAO();
    const comment = commentDAO.createComment(commentData);

    Logger.log(`使用者 ${user.displayName} 新增留言: ${comment.id}`);

    return createSuccessResponse(comment, SUCCESS_MESSAGES.COMMENT_ADDED);
  } catch (error) {
    logError('addComment', error);
    return createErrorResponse(error);
  }
}

/**
 * 刪除留言
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function deleteComment(request, user) {
  try {
    const commentId = request.data.id;

    if (!commentId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少留言 ID');
    }

    const commentDAO = new CommentDAO();
    const isAdminUser = isAdmin(user);

    commentDAO.deleteComment(commentId, user.id, isAdminUser);

    Logger.log(`使用者 ${user.displayName} 刪除留言: ${commentId}`);

    return createSuccessResponse(null, SUCCESS_MESSAGES.COMMENT_DELETED);
  } catch (error) {
    logError('deleteComment', error);
    return createErrorResponse(error);
  }
}

/**
 * 取得採購申請的留言列表
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function getComments(request, user) {
  try {
    const requirementId = request.data.requirementId;

    if (!requirementId) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少採購申請 ID');
    }

    const commentDAO = new CommentDAO();
    const comments = commentDAO.findByRequirementId(requirementId);

    return createSuccessResponse(comments);
  } catch (error) {
    logError('getComments', error);
    return createErrorResponse(error);
  }
}

/**
 * 搜尋留言
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function searchComments(request, user) {
  try {
    const searchText = request.data.searchText;

    if (!searchText) {
      throw new Error('MISSING_REQUIRED_FIELD|缺少搜尋關鍵字');
    }

    const commentDAO = new CommentDAO();
    const comments = commentDAO.search(searchText);

    return createSuccessResponse(comments);
  } catch (error) {
    logError('searchComments', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ CommentAPI.gs 結束 ▲▲▲ ---
