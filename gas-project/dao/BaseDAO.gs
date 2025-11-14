// --- ▼▼▼ BaseDAO.gs - 基礎資料存取類別 ▼▼▼ ---

/**
 * 基礎 DAO 類別
 * 提供基本的 CRUD 操作
 */
class BaseDAO {
  /**
   * 建構子
   * @param {string} sheetName - 工作表名稱
   */
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.sheet = getSheet(sheetName);
  }

  /**
   * 初始化工作表（建立標題列）
   * @param {Array<string>} headers - 標題列陣列
   */
  initializeSheet(headers) {
    const existingHeaders = this.getHeaders();

    // 如果已經有標題列，不重複建立
    if (existingHeaders.length > 0) {
      Logger.log(`工作表 ${this.sheetName} 已初始化`);
      return;
    }

    // 建立標題列
    const headerRange = this.sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);

    // 設定標題列樣式
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#4285F4');
    headerRange.setFontColor('#FFFFFF');

    // 凍結標題列
    this.sheet.setFrozenRows(1);

    Logger.log(`工作表 ${this.sheetName} 初始化完成`);
  }

  /**
   * 取得標題列
   * @returns {Array<string>} 標題列陣列
   */
  getHeaders() {
    const lastCol = this.sheet.getLastColumn();
    if (lastCol === 0) return [];

    const headers = this.sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    return headers.filter(h => h !== '');
  }

  /**
   * 取得所有資料
   * @returns {Array<object>} 資料陣列
   */
  findAll() {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) return []; // 只有標題列或空白

    const lastCol = this.sheet.getLastColumn();
    const data = this.sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => this._rowToObject(row, headers));
  }

  /**
   * 根據 ID 查找
   * @param {string} id - ID
   * @returns {object|null} 資料物件或 null
   */
  findById(id) {
    const allData = this.findAll();
    return allData.find(item => item.id === id) || null;
  }

  /**
   * 根據條件查找（單筆）
   * @param {object} conditions - 條件物件
   * @returns {object|null} 資料物件或 null
   */
  findOne(conditions) {
    const allData = this.findAll();
    return allData.find(item => this._matchConditions(item, conditions)) || null;
  }

  /**
   * 根據條件查找（多筆）
   * @param {object} conditions - 條件物件
   * @returns {Array<object>} 資料陣列
   */
  findBy(conditions) {
    const allData = this.findAll();
    return allData.filter(item => this._matchConditions(item, conditions));
  }

  /**
   * 新增資料
   * @param {object} data - 資料物件
   * @returns {object} 新增後的資料物件
   */
  create(data) {
    const lock = getUserLock();

    try {
      const headers = this.getHeaders();

      // 補充系統欄位
      if (!data.id) {
        data.id = generateUUID();
      }
      if (!data.createdAt) {
        data.createdAt = formatDateTime(new Date());
      }

      // 建立新列
      const newRow = headers.map(header => {
        const value = data[header];
        return value !== undefined && value !== null ? value : '';
      });

      // 新增到工作表
      this.sheet.appendRow(newRow);

      Logger.log(`新增資料到 ${this.sheetName}: ${data.id}`);

      return data;
    } finally {
      releaseLock(lock);
    }
  }

  /**
   * 批次新增資料
   * @param {Array<object>} dataArray - 資料陣列
   * @returns {Array<object>} 新增後的資料陣列
   */
  createBatch(dataArray) {
    const lock = getUserLock();

    try {
      const headers = this.getHeaders();
      const now = formatDateTime(new Date());

      const newRows = dataArray.map(data => {
        // 補充系統欄位
        if (!data.id) {
          data.id = generateUUID();
        }
        if (!data.createdAt) {
          data.createdAt = now;
        }

        return headers.map(header => {
          const value = data[header];
          return value !== undefined && value !== null ? value : '';
        });
      });

      // 批次新增到工作表
      if (newRows.length > 0) {
        const startRow = this.sheet.getLastRow() + 1;
        this.sheet.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);
      }

      Logger.log(`批次新增 ${newRows.length} 筆資料到 ${this.sheetName}`);

      return dataArray;
    } finally {
      releaseLock(lock);
    }
  }

  /**
   * 更新資料
   * @param {string} id - ID
   * @param {object} updates - 更新內容
   * @returns {object} 更新後的資料物件
   */
  update(id, updates) {
    const lock = getUserLock();

    try {
      const data = this.sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('id');

      if (idIndex === -1) {
        throw new Error('INTERNAL_ERROR|找不到 id 欄位');
      }

      // 補充更新時間
      if (!updates.updatedAt) {
        updates.updatedAt = formatDateTime(new Date());
      }

      // 找到要更新的行
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === id) {
          // 更新欄位
          Object.keys(updates).forEach(key => {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              this.sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
            }
          });

          // 取得更新後的資料
          const updatedRow = this.sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0];
          const updatedObj = this._rowToObject(updatedRow, headers);

          Logger.log(`更新資料 ${this.sheetName}: ${id}`);

          return updatedObj;
        }
      }

      throw new Error('RECORD_NOT_FOUND|找不到指定的記錄');
    } finally {
      releaseLock(lock);
    }
  }

  /**
   * 刪除資料
   * @param {string} id - ID
   * @returns {boolean} 是否成功刪除
   */
  delete(id) {
    const lock = getUserLock();

    try {
      const data = this.sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('id');

      if (idIndex === -1) {
        throw new Error('INTERNAL_ERROR|找不到 id 欄位');
      }

      // 找到要刪除的行
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === id) {
          this.sheet.deleteRow(i + 1);
          Logger.log(`刪除資料 ${this.sheetName}: ${id}`);
          return true;
        }
      }

      throw new Error('RECORD_NOT_FOUND|找不到指定的記錄');
    } finally {
      releaseLock(lock);
    }
  }

  /**
   * 取得資料總數
   * @param {object} conditions - 篩選條件（可選）
   * @returns {number} 資料總數
   */
  count(conditions = null) {
    if (conditions) {
      return this.findBy(conditions).length;
    }
    return Math.max(0, this.sheet.getLastRow() - 1); // 扣除標題行
  }

  /**
   * 清空所有資料（保留標題列）
   */
  truncate() {
    const lock = getUserLock();

    try {
      const lastRow = this.sheet.getLastRow();
      if (lastRow > 1) {
        this.sheet.deleteRows(2, lastRow - 1);
        Logger.log(`清空工作表 ${this.sheetName}`);
      }
    } finally {
      releaseLock(lock);
    }
  }

  /**
   * 檢查記錄是否存在
   * @param {string} id - ID
   * @returns {boolean} 是否存在
   */
  exists(id) {
    return this.findById(id) !== null;
  }

  /**
   * 將資料列轉換為物件
   * @private
   */
  _rowToObject(row, headers) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }

  /**
   * 檢查資料是否符合條件
   * @private
   */
  _matchConditions(item, conditions) {
    return Object.keys(conditions).every(key => {
      // 如果條件值為陣列，使用 includes 檢查
      if (Array.isArray(conditions[key])) {
        return conditions[key].includes(item[key]);
      }
      // 否則使用嚴格相等檢查
      return item[key] === conditions[key];
    });
  }
}

// --- ▲▲▲ BaseDAO.gs 結束 ▲▲▲ ---
