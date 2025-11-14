// --- ▼▼▼ TitheDAO.gs - 奉獻任務資料存取物件 ▼▼▼ ---

/**
 * 奉獻任務資料存取物件
 * 繼承 BaseDAO
 */
class TitheDAO extends BaseDAO {
  constructor() {
    super(SHEET_NAMES.TITHE);
  }

  /**
   * 建立奉獻任務
   * @param {object} data - 任務資料
   * @returns {object} 建立的任務物件
   */
  create(data) {
    // 設定預設值
    const now = new Date().toISOString();
    const taskData = {
      id: generateUUID(),
      taskName: data.taskName,
      calculationTimestamp: data.calculationTimestamp || now,
      treasurerUid: data.treasurerUid,
      treasurerName: data.treasurerName,
      financeStaffUid: data.financeStaffUid,
      financeStaffName: data.financeStaffName,
      status: TITHE_STATUS.IN_PROGRESS,
      totalAmount: 0,
      totalCount: 0,
      createdAt: now,
      completedAt: null
    };

    return super.create(taskData);
  }

  /**
   * 更新奉獻任務
   * @param {string} id - 任務 ID
   * @param {object} data - 更新資料
   * @returns {object} 更新後的任務物件
   */
  update(id, data) {
    const allowedFields = [
      'taskName',
      'status',
      'totalAmount',
      'totalCount',
      'completedAt'
    ];

    // 只允許更新特定欄位
    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    return super.update(id, updateData);
  }

  /**
   * 取得所有進行中的任務
   * @returns {Array} 任務陣列
   */
  getInProgressTasks() {
    return this.query(task => task.status === TITHE_STATUS.IN_PROGRESS);
  }

  /**
   * 取得已完成的任務
   * @returns {Array} 任務陣列
   */
  getCompletedTasks() {
    return this.query(task => task.status === TITHE_STATUS.COMPLETED);
  }

  /**
   * 取得使用者相關的任務
   * @param {string} userId - 使用者 ID
   * @returns {Array} 任務陣列
   */
  getUserTasks(userId) {
    return this.query(task =>
      task.treasurerUid === userId || task.financeStaffUid === userId
    );
  }

  /**
   * 完成奉獻任務
   * @param {string} id - 任務 ID
   * @param {number} totalAmount - 總金額
   * @param {number} totalCount - 總筆數
   * @returns {object} 更新後的任務物件
   */
  completeTask(id, totalAmount, totalCount) {
    return this.update(id, {
      status: TITHE_STATUS.COMPLETED,
      totalAmount: totalAmount,
      totalCount: totalCount,
      completedAt: new Date().toISOString()
    });
  }

  /**
   * 取得任務統計
   * @returns {object} 統計資料
   */
  getStatistics() {
    const allTasks = this.findAll();

    const stats = {
      total: allTasks.length,
      inProgress: 0,
      completed: 0,
      totalAmount: 0,
      totalCount: 0
    };

    allTasks.forEach(task => {
      if (task.status === TITHE_STATUS.IN_PROGRESS) {
        stats.inProgress++;
      } else if (task.status === TITHE_STATUS.COMPLETED) {
        stats.completed++;
        stats.totalAmount += task.totalAmount || 0;
        stats.totalCount += task.totalCount || 0;
      }
    });

    return stats;
  }

  /**
   * 取得日期範圍內的任務
   * @param {Date} startDate - 開始日期
   * @param {Date} endDate - 結束日期
   * @returns {Array} 任務陣列
   */
  getTasksByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return this.query(task => {
      const taskDate = new Date(task.calculationTimestamp).getTime();
      return taskDate >= start && taskDate <= end;
    });
  }

  /**
   * 檢查任務是否存在
   * @param {string} taskName - 任務名稱
   * @param {string} calculationTimestamp - 計算時間
   * @returns {boolean} 是否存在
   */
  taskExists(taskName, calculationTimestamp) {
    const tasks = this.query(task =>
      task.taskName === taskName &&
      task.calculationTimestamp === calculationTimestamp
    );
    return tasks.length > 0;
  }
}

// --- ▲▲▲ TitheDAO.gs 結束 ▲▲▲ ---
