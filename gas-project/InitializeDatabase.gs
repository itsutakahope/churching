// --- ▼▼▼ InitializeDatabase.gs - 資料庫初始化腳本 ▼▼▼ ---

/**
 * 初始化 Google Sheets 資料庫結構
 * 警告：此函式會刪除現有的試算表並重新建立
 * 請務必在執行前備份資料
 */
function initializeDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 確認對話框
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '初始化資料庫',
    '此操作將會刪除所有現有工作表並重新建立資料庫結構。\n\n是否確定要繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消初始化');
    return;
  }

  try {
    Logger.log('開始初始化資料庫...');

    // 1. 刪除所有現有工作表（保留一個）
    const sheets = ss.getSheets();
    while (sheets.length > 1) {
      ss.deleteSheet(sheets[0]);
      sheets.shift();
    }

    // 2. 建立所有必要的工作表
    createUsersSheet(ss);
    createRequirementsSheet(ss);
    createCommentsSheet(ss);
    createConfigSheet(ss);
    createTitheSheet(ss);
    createDedicationsSheet(ss);

    // 3. 刪除最後一個預設工作表
    const remainingSheets = ss.getSheets();
    if (remainingSheets.length > 6) {
      ss.deleteSheet(remainingSheets[remainingSheets.length - 1]);
    }

    // 4. 設定試算表名稱
    ss.rename('教會管理系統資料庫');

    // 5. 初始化設定
    initializeConfig(ss);

    Logger.log('資料庫初始化完成！');
    ui.alert('成功', '資料庫初始化完成！', ui.ButtonSet.OK);

  } catch (error) {
    Logger.log('初始化失敗: ' + error.message);
    ui.alert('錯誤', '初始化失敗: ' + error.message, ui.ButtonSet.OK);
    throw error;
  }
}

/**
 * 建立 Users 工作表
 */
function createUsersSheet(ss) {
  Logger.log('建立 Users 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.USERS);

  // 設定標題列
  const headers = [
    'id',
    'email',
    'displayName',
    'roles',
    'status',
    'wantsNewRequestNotification',
    'createdAt',
    'updatedAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 200); // id
  sheet.setColumnWidth(2, 250); // email
  sheet.setColumnWidth(3, 150); // displayName
  sheet.setColumnWidth(4, 200); // roles
  sheet.setColumnWidth(5, 100); // status
  sheet.setColumnWidth(6, 150); // wantsNewRequestNotification
  sheet.setColumnWidth(7, 180); // createdAt
  sheet.setColumnWidth(8, 180); // updatedAt

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Users 工作表建立完成');
}

/**
 * 建立 Requirements 工作表
 */
function createRequirementsSheet(ss) {
  Logger.log('建立 Requirements 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.REQUIREMENTS);

  // 設定標題列
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

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 200); // id
  sheet.setColumnWidth(2, 200); // userId
  sheet.setColumnWidth(3, 120); // requesterName
  sheet.setColumnWidth(4, 200); // text
  sheet.setColumnWidth(5, 300); // description
  sheet.setColumnWidth(6, 150); // accountingCategory
  sheet.setColumnWidth(7, 80);  // priority
  sheet.setColumnWidth(8, 80);  // status
  sheet.setColumnWidth(9, 100); // purchaseAmount
  sheet.setColumnWidth(10, 100); // purchaseDate
  sheet.setColumnWidth(11, 200); // purchaserId
  sheet.setColumnWidth(12, 120); // purchaserName
  sheet.setColumnWidth(13, 250); // purchaseNotes
  sheet.setColumnWidth(14, 200); // reimbursementerId
  sheet.setColumnWidth(15, 120); // reimbursementerName
  sheet.setColumnWidth(16, 180); // createdAt
  sheet.setColumnWidth(17, 180); // updatedAt

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Requirements 工作表建立完成');
}

/**
 * 建立 Comments 工作表
 */
function createCommentsSheet(ss) {
  Logger.log('建立 Comments 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.COMMENTS);

  // 設定標題列
  const headers = [
    'id',
    'requirementId',
    'userId',
    'authorName',
    'text',
    'createdAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 200); // id
  sheet.setColumnWidth(2, 200); // requirementId
  sheet.setColumnWidth(3, 200); // userId
  sheet.setColumnWidth(4, 120); // authorName
  sheet.setColumnWidth(5, 400); // text
  sheet.setColumnWidth(6, 180); // createdAt

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Comments 工作表建立完成');
}

/**
 * 建立 Config 工作表
 */
function createConfigSheet(ss) {
  Logger.log('建立 Config 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.CONFIG);

  // 設定標題列
  const headers = ['key', 'value', 'description'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 250); // key
  sheet.setColumnWidth(2, 350); // value
  sheet.setColumnWidth(3, 400); // description

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Config 工作表建立完成');
}

/**
 * 建立 Tithe 工作表（奉獻任務）
 */
function createTitheSheet(ss) {
  Logger.log('建立 Tithe 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.TITHE);

  // 設定標題列
  const headers = [
    'id',
    'taskName',
    'calculationTimestamp',
    'treasurerUid',
    'treasurerName',
    'financeStaffUid',
    'financeStaffName',
    'status',
    'totalAmount',
    'totalCount',
    'createdAt',
    'completedAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 200); // id
  sheet.setColumnWidth(2, 200); // taskName
  sheet.setColumnWidth(3, 180); // calculationTimestamp
  sheet.setColumnWidth(4, 200); // treasurerUid
  sheet.setColumnWidth(5, 120); // treasurerName
  sheet.setColumnWidth(6, 200); // financeStaffUid
  sheet.setColumnWidth(7, 120); // financeStaffName
  sheet.setColumnWidth(8, 80);  // status
  sheet.setColumnWidth(9, 120); // totalAmount
  sheet.setColumnWidth(10, 80); // totalCount
  sheet.setColumnWidth(11, 180); // createdAt
  sheet.setColumnWidth(12, 180); // completedAt

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Tithe 工作表建立完成');
}

/**
 * 建立 Dedications 工作表（奉獻記錄）
 */
function createDedicationsSheet(ss) {
  Logger.log('建立 Dedications 工作表...');

  const sheet = ss.insertSheet(SHEET_NAMES.DEDICATIONS);

  // 設定標題列
  const headers = [
    'id',
    'titheTaskId',
    '献金者',
    '奉獻類別',
    '金額',
    '入帳日期',
    '備註',
    'createdAt'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 格式化標題列
  formatHeaderRow(sheet, headers.length);

  // 設定欄位寬度
  sheet.setColumnWidth(1, 200); // id
  sheet.setColumnWidth(2, 200); // titheTaskId
  sheet.setColumnWidth(3, 120); // 献金者
  sheet.setColumnWidth(4, 120); // 奉獻類別
  sheet.setColumnWidth(5, 100); // 金額
  sheet.setColumnWidth(6, 120); // 入帳日期
  sheet.setColumnWidth(7, 300); // 備註
  sheet.setColumnWidth(8, 180); // createdAt

  // 凍結標題列
  sheet.setFrozenRows(1);

  Logger.log('Dedications 工作表建立完成');
}

/**
 * 格式化標題列
 */
function formatHeaderRow(sheet, columnCount) {
  const headerRange = sheet.getRange(1, 1, 1, columnCount);

  // 設定背景色
  headerRange.setBackground('#4285F4');

  // 設定文字顏色
  headerRange.setFontColor('#FFFFFF');

  // 設定粗體
  headerRange.setFontWeight('bold');

  // 設定置中對齊
  headerRange.setHorizontalAlignment('center');

  // 設定字體大小
  headerRange.setFontSize(11);
}

/**
 * 初始化設定資料
 */
function initializeConfig(ss) {
  Logger.log('初始化設定資料...');

  const sheet = ss.getSheetByName(SHEET_NAMES.CONFIG);

  const configData = [
    ['APP_NAME', '教會管理系統', '應用程式名稱'],
    ['APP_VERSION', '2.0.0', '應用程式版本'],
    ['ADMIN_EMAIL', Session.getActiveUser().getEmail(), '管理員 Email'],
    ['PDF_FOLDER_ID', '', 'PDF 儲存資料夾 ID（選填）'],
    ['ENABLE_EMAIL_NOTIFICATIONS', 'true', '是否啟用 Email 通知'],
    ['DEFAULT_USER_ROLE', 'user', '新使用者預設角色'],
    ['DEFAULT_USER_STATUS', 'pending', '新使用者預設狀態']
  ];

  sheet.getRange(2, 1, configData.length, 3).setValues(configData);

  Logger.log('設定資料初始化完成');
}

/**
 * 新增範例資料（測試用）
 */
function addSampleData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '新增範例資料',
    '此操作將會新增一些範例資料供測試使用。\n\n是否確定要繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消');
    return;
  }

  try {
    Logger.log('開始新增範例資料...');

    const currentUser = getCurrentUserInfo();

    // 新增範例採購需求
    const requirementDAO = new RequirementDAO();

    const sampleRequirements = [
      {
        text: '影印紙 A4',
        description: '白色 A4 影印紙，70磅，5包',
        accountingCategory: '2.3.1 文具印刷',
        priority: REQUIREMENT_PRIORITY.NORMAL
      },
      {
        text: '原子筆',
        description: '藍色原子筆 0.5mm，20支',
        accountingCategory: '2.3.1 文具印刷',
        priority: REQUIREMENT_PRIORITY.NORMAL
      },
      {
        text: '投影機燈泡',
        description: 'EPSON 投影機專用燈泡',
        accountingCategory: '2.3.4 修繕費',
        priority: REQUIREMENT_PRIORITY.URGENT
      }
    ];

    sampleRequirements.forEach(req => {
      req.userId = currentUser.id;
      req.requesterName = currentUser.displayName;
      requirementDAO.create(req);
    });

    Logger.log('範例資料新增完成！');
    ui.alert('成功', '範例資料新增完成！', ui.ButtonSet.OK);

  } catch (error) {
    Logger.log('新增範例資料失敗: ' + error.message);
    ui.alert('錯誤', '新增範例資料失敗: ' + error.message, ui.ButtonSet.OK);
    throw error;
  }
}

/**
 * 清空所有資料（保留結構）
 */
function clearAllData() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    '清空所有資料',
    '⚠️ 警告：此操作將會刪除所有資料，但保留資料庫結構。\n\n此操作無法復原！\n\n是否確定要繼續？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('已取消');
    return;
  }

  try {
    Logger.log('開始清空資料...');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetNames = [
      SHEET_NAMES.USERS,
      SHEET_NAMES.REQUIREMENTS,
      SHEET_NAMES.COMMENTS,
      SHEET_NAMES.TITHE,
      SHEET_NAMES.DEDICATIONS
    ];

    sheetNames.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (sheet) {
        const lastRow = sheet.getLastRow();
        if (lastRow > 1) {
          sheet.deleteRows(2, lastRow - 1);
        }
        Logger.log(name + ' 工作表已清空');
      }
    });

    Logger.log('所有資料已清空！');
    ui.alert('成功', '所有資料已清空！', ui.ButtonSet.OK);

  } catch (error) {
    Logger.log('清空資料失敗: ' + error.message);
    ui.alert('錯誤', '清空資料失敗: ' + error.message, ui.ButtonSet.OK);
    throw error;
  }
}

// --- ▲▲▲ InitializeDatabase.gs 結束 ▲▲▲ ---
