// --- ▼▼▼ Code.gs - 主入口點 ▼▼▼ ---

/**
 * 教會管理系統 - Google Apps Script 版本
 *
 * 這是主入口檔案，提供系統初始化和基本管理功能
 *
 * @version 1.0.0
 * @author Claude
 */

/**
 * 初始化所有工作表
 * 這個函式會建立所有需要的工作表並設定標題列
 *
 * 使用方式：
 * 1. 在 Apps Script 編輯器中
 * 2. 選擇函式 initializeSheets
 * 3. 點選「執行」
 */
function initializeSheets() {
  Logger.log('開始初始化工作表...');

  try {
    // 初始化使用者工作表
    const userDAO = new UserDAO();
    userDAO.initialize();
    Logger.log('✓ Users 工作表初始化完成');

    // 初始化採購申請工作表
    const requirementDAO = new RequirementDAO();
    requirementDAO.initialize();
    Logger.log('✓ Requirements 工作表初始化完成');

    // 初始化留言工作表
    const commentDAO = new CommentDAO();
    commentDAO.initialize();
    Logger.log('✓ Comments 工作表初始化完成');

    // 初始化奉獻任務工作表（稍後實作）
    // const titheDAO = new TitheDAO();
    // titheDAO.initialize();
    // Logger.log('✓ Tithe 工作表初始化完成');

    // 初始化奉獻記錄工作表（稍後實作）
    // const dedicationDAO = new DedicationDAO();
    // dedicationDAO.initialize();
    // Logger.log('✓ Dedications 工作表初始化完成');

    // 初始化系統設定工作表
    initializeConfigSheet();
    Logger.log('✓ Config 工作表初始化完成');

    Logger.log('========================================');
    Logger.log('✓ 所有工作表初始化完成！');
    Logger.log('========================================');

    // 顯示成功訊息
    SpreadsheetApp.getUi().alert(
      '初始化成功',
      '所有工作表已成功初始化！\n\n請查看執行記錄以了解詳細資訊。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('初始化失敗: ' + error.message);
    Logger.log(error.stack);

    SpreadsheetApp.getUi().alert(
      '初始化失敗',
      '初始化過程中發生錯誤：\n\n' + error.message + '\n\n請查看執行記錄以了解詳細資訊。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    throw error;
  }
}

/**
 * 初始化系統設定工作表
 */
function initializeConfigSheet() {
  const sheet = getSheet(SHEET_NAMES.CONFIG);

  // 檢查是否已初始化
  if (sheet.getLastRow() > 0) {
    Logger.log('Config 工作表已初始化，跳過');
    return;
  }

  // 建立標題列
  const headers = ['key', 'value', 'description', 'updatedAt'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // 設定標題列樣式
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');

  // 凍結標題列
  sheet.setFrozenRows(1);

  // 新增預設設定
  const configs = [
    {
      key: CONFIG_KEYS.SYSTEM_VERSION,
      value: '1.0.0',
      description: '系統版本號',
      updatedAt: formatDateTime(new Date())
    },
    {
      key: CONFIG_KEYS.DEDICATION_CATEGORIES,
      value: JSON.stringify(DEDICATION_CATEGORIES),
      description: '奉獻科目列表',
      updatedAt: formatDateTime(new Date())
    }
  ];

  configs.forEach(config => {
    sheet.appendRow([config.key, config.value, config.description, config.updatedAt]);
  });

  Logger.log('Config 工作表已建立並新增預設設定');
}

/**
 * 建立第一個管理員帳號
 * 請修改 email 為您的 Google 帳號
 */
function createFirstAdmin() {
  const email = 'admin@example.com';  // ← 請修改為您的 Email
  const displayName = '系統管理員';

  try {
    const userDAO = new UserDAO();

    // 檢查是否已存在
    const existing = userDAO.findByEmail(email);
    if (existing) {
      Logger.log('使用者已存在: ' + email);
      SpreadsheetApp.getUi().alert(
        '使用者已存在',
        '使用者 ' + email + ' 已存在！',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    // 建立管理員帳號
    const admin = userDAO.create({
      email: email,
      displayName: displayName,
      roles: USER_ROLES.ADMIN,
      status: USER_STATUS.APPROVED,
      wantsNewRequestNotification: true,
      wantsPurchaseCompleteNotification: true,
      lastLoginAt: formatDateTime(new Date())
    });

    Logger.log('管理員帳號建立成功: ' + email);

    SpreadsheetApp.getUi().alert(
      '建立成功',
      '管理員帳號已建立！\n\nEmail: ' + email + '\n角色: 管理員\n狀態: 已批准',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('建立管理員失敗: ' + error.message);
    SpreadsheetApp.getUi().alert(
      '建立失敗',
      '建立管理員帳號時發生錯誤：\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 測試身份驗證系統
 */
function testAuth() {
  try {
    const user = checkAuth();

    Logger.log('========================================');
    Logger.log('身份驗證測試');
    Logger.log('========================================');
    Logger.log('使用者 Email: ' + user.email);
    Logger.log('顯示名稱: ' + user.displayName);
    Logger.log('角色: ' + user.roles);
    Logger.log('狀態: ' + user.status);
    Logger.log('========================================');

    SpreadsheetApp.getUi().alert(
      '身份驗證測試',
      '登入成功！\n\n' +
      'Email: ' + user.email + '\n' +
      '名稱: ' + user.displayName + '\n' +
      '角色: ' + user.roles + '\n' +
      '狀態: ' + user.status,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('身份驗證失敗: ' + error.message);

    SpreadsheetApp.getUi().alert(
      '身份驗證測試',
      '身份驗證失敗：\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 測試資料庫操作
 */
function testDatabase() {
  try {
    Logger.log('========================================');
    Logger.log('資料庫測試');
    Logger.log('========================================');

    // 測試使用者 DAO
    const userDAO = new UserDAO();
    const userCount = userDAO.count();
    Logger.log('使用者總數: ' + userCount);

    // 測試採購申請 DAO
    const requirementDAO = new RequirementDAO();
    const requirementCount = requirementDAO.count();
    Logger.log('採購申請總數: ' + requirementCount);

    // 測試留言 DAO
    const commentDAO = new CommentDAO();
    const commentCount = commentDAO.count();
    Logger.log('留言總數: ' + commentCount);

    Logger.log('========================================');
    Logger.log('✓ 資料庫測試完成');
    Logger.log('========================================');

    SpreadsheetApp.getUi().alert(
      '資料庫測試',
      '測試完成！\n\n' +
      '使用者: ' + userCount + ' 筆\n' +
      '採購申請: ' + requirementCount + ' 筆\n' +
      '留言: ' + commentCount + ' 筆',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('資料庫測試失敗: ' + error.message);
    Logger.log(error.stack);

    SpreadsheetApp.getUi().alert(
      '資料庫測試',
      '測試失敗：\n\n' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 清空所有資料（危險！僅用於開發測試）
 */
function dangerousClearAllData() {
  const ui = SpreadsheetApp.getUi();

  // 確認對話框
  const response = ui.alert(
    '⚠️ 警告',
    '這將刪除所有資料（保留標題列）！\n\n此操作無法復原！\n\n您確定要繼續嗎？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    Logger.log('使用者取消清空資料操作');
    return;
  }

  // 二次確認
  const response2 = ui.alert(
    '⚠️ 最後確認',
    '真的要刪除所有資料嗎？\n\n此操作無法復原！',
    ui.ButtonSet.YES_NO
  );

  if (response2 !== ui.Button.YES) {
    Logger.log('使用者取消清空資料操作');
    return;
  }

  try {
    Logger.log('開始清空所有資料...');

    // 清空使用者
    const userDAO = new UserDAO();
    userDAO.truncate();
    Logger.log('✓ 使用者資料已清空');

    // 清空採購申請
    const requirementDAO = new RequirementDAO();
    requirementDAO.truncate();
    Logger.log('✓ 採購申請資料已清空');

    // 清空留言
    const commentDAO = new CommentDAO();
    commentDAO.truncate();
    Logger.log('✓ 留言資料已清空');

    Logger.log('========================================');
    Logger.log('✓ 所有資料已清空');
    Logger.log('========================================');

    ui.alert(
      '清空完成',
      '所有資料已清空！',
      ui.ButtonSet.OK
    );
  } catch (error) {
    Logger.log('清空資料失敗: ' + error.message);

    ui.alert(
      '清空失敗',
      '清空資料時發生錯誤：\n\n' + error.message,
      ui.ButtonSet.OK
    );
  }
}

/**
 * 在選單中新增自訂功能
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('教會管理系統')
    .addItem('🔧 初始化工作表', 'initializeSheets')
    .addItem('👤 建立第一個管理員', 'createFirstAdmin')
    .addSeparator()
    .addItem('🧪 測試身份驗證', 'testAuth')
    .addItem('🧪 測試資料庫', 'testDatabase')
    .addSeparator()
    .addItem('⚠️ 清空所有資料', 'dangerousClearAllData')
    .addToUi();

  Logger.log('自訂選單已載入');
}

/**
 * 取得系統資訊
 * @returns {object} 系統資訊
 */
function getSystemInfo() {
  const ss = getSpreadsheet();

  return {
    spreadsheetId: ss.getId(),
    spreadsheetName: ss.getName(),
    spreadsheetUrl: ss.getUrl(),
    scriptId: ScriptApp.getScriptId(),
    timeZone: Session.getScriptTimeZone(),
    currentUser: getCurrentUserEmail(),
    version: '1.0.0'
  };
}

/**
 * 顯示系統資訊
 */
function showSystemInfo() {
  const info = getSystemInfo();

  const message =
    '系統資訊\n\n' +
    '試算表名稱: ' + info.spreadsheetName + '\n' +
    '試算表 ID: ' + info.spreadsheetId + '\n' +
    '指令碼 ID: ' + info.scriptId + '\n' +
    '時區: ' + info.timeZone + '\n' +
    '當前使用者: ' + info.currentUser + '\n' +
    '系統版本: ' + info.version;

  SpreadsheetApp.getUi().alert(
    '系統資訊',
    message,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  Logger.log(message);
}

// --- ▲▲▲ Code.gs 結束 ▲▲▲ ---
