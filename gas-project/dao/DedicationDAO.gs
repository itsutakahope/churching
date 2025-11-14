// --- ▼▼▼ DedicationDAO.gs - 奉獻記錄資料存取物件 ▼▼▼ ---

/**
 * 奉獻記錄資料存取物件
 * 繼承 BaseDAO
 */
class DedicationDAO extends BaseDAO {
  constructor() {
    super(SHEET_NAMES.DEDICATIONS);
  }

  /**
   * 建立奉獻記錄
   * @param {object} data - 記錄資料
   * @returns {object} 建立的記錄物件
   */
  create(data) {
    // 設定預設值
    const now = new Date().toISOString();
    const dedicationData = {
      id: generateUUID(),
      titheTaskId: data.titheTaskId,
      '献金者': data['献金者'] || data.donor,
      '奉獻類別': data['奉獻類別'] || data.category,
      '金額': parseFloat(data['金額'] || data.amount || 0),
      '入帳日期': data['入帳日期'] || data.date,
      '備註': data['備註'] || data.notes || '',
      createdAt: now
    };

    return super.create(dedicationData);
  }

  /**
   * 批次建立奉獻記錄
   * @param {string} titheTaskId - 奉獻任務 ID
   * @param {Array} dedications - 奉獻記錄陣列
   * @returns {Array} 建立的記錄陣列
   */
  batchCreate(titheTaskId, dedications) {
    const createdDedications = [];

    dedications.forEach(dedication => {
      const data = {
        titheTaskId: titheTaskId,
        ...dedication
      };
      createdDedications.push(this.create(data));
    });

    return createdDedications;
  }

  /**
   * 取得任務的所有奉獻記錄
   * @param {string} titheTaskId - 任務 ID
   * @returns {Array} 記錄陣列
   */
  getByTaskId(titheTaskId) {
    return this.query(dedication => dedication.titheTaskId === titheTaskId);
  }

  /**
   * 刪除任務的所有奉獻記錄
   * @param {string} titheTaskId - 任務 ID
   * @returns {number} 刪除的記錄數量
   */
  deleteByTaskId(titheTaskId) {
    const dedications = this.getByTaskId(titheTaskId);
    let deletedCount = 0;

    dedications.forEach(dedication => {
      if (this.delete(dedication.id)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  /**
   * 計算任務的奉獻統計
   * @param {string} titheTaskId - 任務 ID
   * @returns {object} 統計資料
   */
  getTaskStatistics(titheTaskId) {
    const dedications = this.getByTaskId(titheTaskId);

    const stats = {
      totalCount: dedications.length,
      totalAmount: 0,
      byCategory: {},
      byDonor: {}
    };

    dedications.forEach(dedication => {
      const amount = parseFloat(dedication['金額'] || 0);
      const category = dedication['奉獻類別'];
      const donor = dedication['献金者'];

      // 總金額
      stats.totalAmount += amount;

      // 按類別統計
      if (!stats.byCategory[category]) {
        stats.byCategory[category] = {
          count: 0,
          amount: 0
        };
      }
      stats.byCategory[category].count++;
      stats.byCategory[category].amount += amount;

      // 按奉獻者統計
      if (!stats.byDonor[donor]) {
        stats.byDonor[donor] = {
          count: 0,
          amount: 0
        };
      }
      stats.byDonor[donor].count++;
      stats.byDonor[donor].amount += amount;
    });

    return stats;
  }

  /**
   * 取得日期範圍內的奉獻記錄
   * @param {string} titheTaskId - 任務 ID
   * @param {string} startDate - 開始日期
   * @param {string} endDate - 結束日期
   * @returns {Array} 記錄陣列
   */
  getByDateRange(titheTaskId, startDate, endDate) {
    const dedications = this.getByTaskId(titheTaskId);

    return dedications.filter(dedication => {
      const date = dedication['入帳日期'];
      return date >= startDate && date <= endDate;
    });
  }

  /**
   * 搜尋奉獻記錄
   * @param {string} titheTaskId - 任務 ID
   * @param {object} filters - 篩選條件 {category, donor, minAmount, maxAmount}
   * @returns {Array} 記錄陣列
   */
  search(titheTaskId, filters = {}) {
    let dedications = this.getByTaskId(titheTaskId);

    // 按類別篩選
    if (filters.category) {
      dedications = dedications.filter(d => d['奉獻類別'] === filters.category);
    }

    // 按奉獻者篩選
    if (filters.donor) {
      dedications = dedications.filter(d =>
        d['献金者'].includes(filters.donor)
      );
    }

    // 按金額範圍篩選
    if (filters.minAmount !== undefined) {
      dedications = dedications.filter(d =>
        parseFloat(d['金額']) >= filters.minAmount
      );
    }

    if (filters.maxAmount !== undefined) {
      dedications = dedications.filter(d =>
        parseFloat(d['金額']) <= filters.maxAmount
      );
    }

    return dedications;
  }

  /**
   * 更新奉獻記錄
   * @param {string} id - 記錄 ID
   * @param {object} data - 更新資料
   * @returns {object} 更新後的記錄物件
   */
  update(id, data) {
    const allowedFields = [
      '献金者',
      '奉獻類別',
      '金額',
      '入帳日期',
      '備註'
    ];

    // 只允許更新特定欄位
    const updateData = {};
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    // 如果更新金額，確保是數字
    if (updateData['金額'] !== undefined) {
      updateData['金額'] = parseFloat(updateData['金額']);
    }

    return super.update(id, updateData);
  }

  /**
   * 驗證奉獻記錄資料
   * @param {object} data - 記錄資料
   * @returns {object} 驗證結果 {valid: boolean, errors: Array}
   */
  validate(data) {
    const errors = [];

    // 必填欄位
    if (!data['献金者'] && !data.donor) {
      errors.push('献金者為必填欄位');
    }

    if (!data['奉獻類別'] && !data.category) {
      errors.push('奉獻類別為必填欄位');
    }

    if (!data['金額'] && !data.amount) {
      errors.push('金額為必填欄位');
    }

    if (!data['入帳日期'] && !data.date) {
      errors.push('入帳日期為必填欄位');
    }

    // 金額驗證
    const amount = parseFloat(data['金額'] || data.amount || 0);
    if (isNaN(amount) || amount <= 0) {
      errors.push('金額必須是大於 0 的數字');
    }

    // 類別驗證
    const category = data['奉獻類別'] || data.category;
    if (category && !DEDICATION_CATEGORIES.includes(category)) {
      errors.push('無效的奉獻類別');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 匯出奉獻記錄為陣列（用於 CSV 或 Excel）
   * @param {string} titheTaskId - 任務 ID
   * @returns {Array} 二維陣列
   */
  exportToArray(titheTaskId) {
    const dedications = this.getByTaskId(titheTaskId);

    // 標題列
    const data = [
      ['献金者', '奉獻類別', '金額', '入帳日期', '備註']
    ];

    // 資料列
    dedications.forEach(dedication => {
      data.push([
        dedication['献金者'],
        dedication['奉獻類別'],
        dedication['金額'],
        dedication['入帳日期'],
        dedication['備註']
      ]);
    });

    return data;
  }
}

// --- ▲▲▲ DedicationDAO.gs 結束 ▲▲▲ ---
