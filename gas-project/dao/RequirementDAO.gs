// --- ▼▼▼ RequirementDAO.gs - 採購申請資料存取 ▼▼▼ ---

/**
 * 採購申請 DAO 類別
 */
class RequirementDAO extends BaseDAO {
  constructor() {
    super(SHEET_NAMES.REQUIREMENTS);
  }

  /**
   * 初始化採購申請工作表
   */
  initialize() {
    const headers = [
      'id',
      'userId',
      'requesterName',
      'text',
      'description',
      'accountingCategory',
      'priority',
      'status',
      'purchaseAmount',
      'purchaseDate',
      'purchaserId',
      'purchaserName',
      'purchaseNotes',
      'reimbursementerId',
      'reimbursementerName',
      'createdAt',
      'updatedAt'
    ];

    this.initializeSheet(headers);
  }

  /**
   * 建立採購申請
   * @param {object} data - 採購申請資料
   * @returns {object} 建立後的採購申請
   */
  createRequirement(data) {
    // 驗證資料
    const validation = validateRequirement(data, false);
    if (!validation.isValid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join('、'));
    }

    // 補充預設值
    const requirementData = {
      ...data,
      priority: data.priority || REQUIREMENT_PRIORITY.NORMAL,
      status: data.status || REQUIREMENT_STATUS.PENDING
    };

    return this.create(requirementData);
  }

  /**
   * 更新採購申請
   * @param {string} id - 採購申請 ID
   * @param {object} updates - 更新資料
   * @returns {object} 更新後的採購申請
   */
  updateRequirement(id, updates) {
    // 驗證資料
    const validation = validateRequirement(updates, true);
    if (!validation.isValid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join('、'));
    }

    // 取得原始資料
    const original = this.findById(id);
    if (!original) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    // 如果已經是 purchased 狀態，不允許修改基本資訊
    if (original.status === REQUIREMENT_STATUS.PURCHASED && updates.text) {
      throw new Error('CANNOT_EDIT_PURCHASED_REQUIREMENT|已購買的申請不能修改基本資訊');
    }

    return this.update(id, updates);
  }

  /**
   * 根據使用者 ID 查找採購申請
   * @param {string} userId - 使用者 ID
   * @returns {Array<object>} 採購申請陣列
   */
  findByUserId(userId) {
    return this.findBy({ userId: userId });
  }

  /**
   * 根據狀態查找採購申請
   * @param {string} status - 狀態
   * @returns {Array<object>} 採購申請陣列
   */
  findByStatus(status) {
    return this.findBy({ status: status });
  }

  /**
   * 根據優先級查找採購申請
   * @param {string} priority - 優先級
   * @returns {Array<object>} 採購申請陣列
   */
  findByPriority(priority) {
    return this.findBy({ priority: priority });
  }

  /**
   * 根據報帳人 ID 查找採購申請
   * @param {string} reimbursementerId - 報帳人 ID
   * @returns {Array<object>} 採購申請陣列
   */
  findByReimbursementerId(reimbursementerId) {
    const allRequirements = this.findAll();
    return allRequirements.filter(req =>
      req.reimbursementerId === reimbursementerId &&
      req.status === REQUIREMENT_STATUS.PURCHASED
    );
  }

  /**
   * 查詢採購申請（支援篩選、排序、分頁）
   * @param {object} options - 查詢選項
   * @returns {object} 查詢結果 {data, pagination}
   */
  query(options = {}) {
    let results = this.findAll();

    // 篩選
    if (options.filters) {
      const filters = options.filters;

      if (filters.status) {
        results = results.filter(req => req.status === filters.status);
      }

      if (filters.priority) {
        results = results.filter(req => req.priority === filters.priority);
      }

      if (filters.userId) {
        results = results.filter(req => req.userId === filters.userId);
      }

      if (filters.reimbursementerId) {
        results = results.filter(req => req.reimbursementerId === filters.reimbursementerId);
      }

      // 搜尋關鍵字（品項或規格）
      if (filters.searchText) {
        const searchText = filters.searchText.toLowerCase();
        results = results.filter(req => {
          const text = (req.text || '').toLowerCase();
          const description = (req.description || '').toLowerCase();
          return text.includes(searchText) || description.includes(searchText);
        });
      }
    }

    // 排序
    if (options.sort) {
      const field = options.sort.field || 'createdAt';
      const order = options.sort.order || 'desc';

      results.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];

        // 處理日期
        if (field.includes('At') || field.includes('Date')) {
          aVal = new Date(aVal || 0);
          bVal = new Date(bVal || 0);
        }

        // 處理數字
        if (field === 'purchaseAmount') {
          aVal = parseFloat(aVal || 0);
          bVal = parseFloat(bVal || 0);
        }

        if (order === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }

    // 分頁
    const pagination = validatePagination(options.pagination);
    const total = results.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    const paginatedResults = results.slice(start, end);

    return {
      data: paginatedResults,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: total,
        totalPages: Math.ceil(total / pagination.pageSize)
      }
    };
  }

  /**
   * 標記為已購買
   * @param {string} id - 採購申請 ID
   * @param {object} purchaseInfo - 購買資訊
   * @returns {object} 更新後的採購申請
   */
  markAsPurchased(id, purchaseInfo) {
    const updates = {
      status: REQUIREMENT_STATUS.PURCHASED,
      purchaseAmount: purchaseInfo.purchaseAmount,
      purchaseDate: purchaseInfo.purchaseDate,
      purchaserId: purchaseInfo.purchaserId,
      purchaserName: purchaseInfo.purchaserName,
      purchaseNotes: purchaseInfo.purchaseNotes || '',
      reimbursementerId: purchaseInfo.reimbursementerId,
      reimbursementerName: purchaseInfo.reimbursementerName
    };

    return this.updateRequirement(id, updates);
  }

  /**
   * 轉移報帳人
   * @param {string} id - 採購申請 ID
   * @param {string} newReimbursementerId - 新報帳人 ID
   * @param {string} newReimbursementerName - 新報帳人名稱
   * @returns {object} 更新後的採購申請
   */
  transferReimbursement(id, newReimbursementerId, newReimbursementerName) {
    // 檢查是否已購買
    const requirement = this.findById(id);
    if (!requirement) {
      throw new Error('RECORD_NOT_FOUND|找不到指定的採購申請');
    }

    if (requirement.status !== REQUIREMENT_STATUS.PURCHASED) {
      throw new Error('INVALID_INPUT|只有已購買的申請才能轉移報帳人');
    }

    return this.update(id, {
      reimbursementerId: newReimbursementerId,
      reimbursementerName: newReimbursementerName
    });
  }

  /**
   * 取消採購申請
   * @param {string} id - 採購申請 ID
   * @returns {object} 更新後的採購申請
   */
  cancelRequirement(id) {
    return this.update(id, {
      status: REQUIREMENT_STATUS.CANCELLED
    });
  }

  /**
   * 取得統計資料
   * @returns {object} 統計資料
   */
  getStatistics() {
    const allRequirements = this.findAll();

    const stats = {
      total: allRequirements.length,
      pending: 0,
      purchased: 0,
      cancelled: 0,
      urgent: 0,
      totalAmount: 0
    };

    allRequirements.forEach(req => {
      // 狀態統計
      if (req.status === REQUIREMENT_STATUS.PENDING) stats.pending++;
      if (req.status === REQUIREMENT_STATUS.PURCHASED) stats.purchased++;
      if (req.status === REQUIREMENT_STATUS.CANCELLED) stats.cancelled++;

      // 優先級統計
      if (req.priority === REQUIREMENT_PRIORITY.URGENT) stats.urgent++;

      // 金額統計
      if (req.purchaseAmount && req.status === REQUIREMENT_STATUS.PURCHASED) {
        stats.totalAmount += parseFloat(req.purchaseAmount);
      }
    });

    return stats;
  }
}

// --- ▲▲▲ RequirementDAO.gs 結束 ▲▲▲ ---
