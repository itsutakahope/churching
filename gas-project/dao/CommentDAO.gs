// --- ▼▼▼ CommentDAO.gs - 留言資料存取 ▼▼▼ ---

/**
 * 留言 DAO 類別
 */
class CommentDAO extends BaseDAO {
  constructor() {
    super(SHEET_NAMES.COMMENTS);
  }

  /**
   * 初始化留言工作表
   */
  initialize() {
    const headers = [
      'id',
      'requirementId',
      'userId',
      'authorName',
      'text',
      'createdAt'
    ];

    this.initializeSheet(headers);
  }

  /**
   * 建立留言
   * @param {object} data - 留言資料
   * @returns {object} 建立後的留言
   */
  createComment(data) {
    // 驗證資料
    const validation = validateComment(data);
    if (!validation.isValid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join('、'));
    }

    return this.create(data);
  }

  /**
   * 根據採購申請 ID 查找留言
   * @param {string} requirementId - 採購申請 ID
   * @returns {Array<object>} 留言陣列（按時間排序）
   */
  findByRequirementId(requirementId) {
    const comments = this.findBy({ requirementId: requirementId });

    // 按建立時間排序（最新的在前）
    comments.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return bDate - aDate;
    });

    return comments;
  }

  /**
   * 根據使用者 ID 查找留言
   * @param {string} userId - 使用者 ID
   * @returns {Array<object>} 留言陣列
   */
  findByUserId(userId) {
    return this.findBy({ userId: userId });
  }

  /**
   * 刪除留言（檢查權限）
   * @param {string} commentId - 留言 ID
   * @param {string} userId - 當前使用者 ID
   * @param {boolean} isAdmin - 是否為管理員
   * @returns {boolean} 是否成功刪除
   */
  deleteComment(commentId, userId, isAdmin = false) {
    // 檢查留言是否存在
    const comment = this.findById(commentId);
    if (!comment) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的留言');
    }

    // 檢查權限：只有留言作者或管理員可以刪除
    if (comment.userId !== userId && !isAdmin) {
      throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限刪除此留言');
    }

    return this.delete(commentId);
  }

  /**
   * 刪除採購申請的所有留言
   * @param {string} requirementId - 採購申請 ID
   * @returns {number} 刪除的留言數量
   */
  deleteByRequirementId(requirementId) {
    const comments = this.findByRequirementId(requirementId);
    let deletedCount = 0;

    comments.forEach(comment => {
      try {
        this.delete(comment.id);
        deletedCount++;
      } catch (e) {
        Logger.log(`刪除留言失敗: ${comment.id}, 錯誤: ${e.message}`);
      }
    });

    Logger.log(`刪除 ${deletedCount} 則留言（採購申請 ${requirementId}）`);

    return deletedCount;
  }

  /**
   * 取得留言統計
   * @param {string} requirementId - 採購申請 ID（可選）
   * @returns {object} 統計資料
   */
  getStatistics(requirementId = null) {
    let comments;

    if (requirementId) {
      comments = this.findByRequirementId(requirementId);
    } else {
      comments = this.findAll();
    }

    // 統計每個使用者的留言數
    const userStats = {};
    comments.forEach(comment => {
      const userId = comment.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId,
          authorName: comment.authorName,
          count: 0
        };
      }
      userStats[userId].count++;
    });

    return {
      total: comments.length,
      byUser: Object.values(userStats)
    };
  }

  /**
   * 搜尋留言
   * @param {string} searchText - 搜尋關鍵字
   * @returns {Array<object>} 留言陣列
   */
  search(searchText) {
    if (!searchText || searchText.trim() === '') {
      return [];
    }

    const allComments = this.findAll();
    const keyword = searchText.toLowerCase();

    return allComments.filter(comment => {
      const text = (comment.text || '').toLowerCase();
      const authorName = (comment.authorName || '').toLowerCase();
      return text.includes(keyword) || authorName.includes(keyword);
    });
  }
}

// --- ▲▲▲ CommentDAO.gs 結束 ▲▲▲ ---
