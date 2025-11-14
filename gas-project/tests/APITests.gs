// --- ▼▼▼ APITests.gs - API 端點自動化測試 ▼▼▼ ---

/**
 * 執行所有 API 測試
 * 在 Google Apps Script 編輯器中執行此函式
 */
function runAllAPITests() {
  const ui = SpreadsheetApp.getUi();

  Logger.log('========== 開始執行 API 測試 ==========');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // 1. 測試健康檢查
    testHealthCheck(results);

    // 2. 測試使用者 API
    testUserAPIs(results);

    // 3. 測試採購需求 API
    testRequirementAPIs(results);

    // 4. 測試留言 API
    testCommentAPIs(results);

    // 5. 測試 PDF 生成 API（可選，因為會生成實際檔案）
    // testPDFAPIs(results);

    // 顯示測試結果
    displayTestResults(results);

  } catch (error) {
    Logger.log('測試執行失敗: ' + error.message);
    ui.alert('測試失敗', error.message, ui.ButtonSet.OK);
  }

  Logger.log('========== API 測試完成 ==========');
}

/**
 * 測試健康檢查 API
 */
function testHealthCheck(results) {
  Logger.log('\n--- 測試健康檢查 API ---');

  try {
    const user = checkAuth();
    const request = { action: 'healthCheck' };
    const response = routeRequest(request, user);

    // 驗證回應
    assertEqual(response.success, true, '健康檢查應該成功', results);
    assertEqual(response.data.status, 'healthy', '狀態應該是 healthy', results);
    assertExists(response.data.timestamp, '應該有時間戳記', results);
    assertExists(response.data.user, '應該有使用者資訊', results);

    Logger.log('✓ 健康檢查測試通過');

  } catch (error) {
    recordError('healthCheck', error, results);
  }
}

/**
 * 測試使用者相關 API
 */
function testUserAPIs(results) {
  Logger.log('\n--- 測試使用者 API ---');

  try {
    const user = checkAuth();

    // 測試 getCurrentUserProfile
    Logger.log('測試 getCurrentUserProfile...');
    const profileRequest = { action: 'getCurrentUserProfile' };
    const profileResponse = routeRequest(profileRequest, user);

    assertEqual(profileResponse.success, true, 'getCurrentUserProfile 應該成功', results);
    assertExists(profileResponse.data.id, '應該有使用者 ID', results);
    assertExists(profileResponse.data.email, '應該有 Email', results);

    // 測試 getUsers（需要管理員權限）
    if (user.roles.includes(USER_ROLES.ADMIN)) {
      Logger.log('測試 getUsers...');
      const usersRequest = { action: 'getUsers' };
      const usersResponse = routeRequest(usersRequest, user);

      assertEqual(usersResponse.success, true, 'getUsers 應該成功', results);
      assertEqual(Array.isArray(usersResponse.data), true, '應該返回陣列', results);
    }

    // 測試 getReimbursementContacts
    Logger.log('測試 getReimbursementContacts...');
    const contactsRequest = { action: 'getReimbursementContacts' };
    const contactsResponse = routeRequest(contactsRequest, user);

    assertEqual(contactsResponse.success, true, 'getReimbursementContacts 應該成功', results);
    assertEqual(Array.isArray(contactsResponse.data), true, '應該返回陣列', results);

    Logger.log('✓ 使用者 API 測試通過');

  } catch (error) {
    recordError('userAPIs', error, results);
  }
}

/**
 * 測試採購需求相關 API
 */
function testRequirementAPIs(results) {
  Logger.log('\n--- 測試採購需求 API ---');

  let createdRequirementId = null;

  try {
    const user = checkAuth();

    // 1. 測試建立採購需求
    Logger.log('測試 createRequirement...');
    const createRequest = {
      action: 'createRequirement',
      text: '測試品項 - API 測試',
      description: '這是自動化測試建立的採購需求',
      accountingCategory: '2.3.1 文具印刷',
      priority: 'normal'
    };
    const createResponse = routeRequest(createRequest, user);

    assertEqual(createResponse.success, true, 'createRequirement 應該成功', results);
    assertExists(createResponse.data.id, '應該返回 ID', results);

    createdRequirementId = createResponse.data.id;
    Logger.log('建立的採購需求 ID: ' + createdRequirementId);

    // 2. 測試取得所有採購需求
    Logger.log('測試 getRequirements...');
    const getRequest = { action: 'getRequirements' };
    const getResponse = routeRequest(getRequest, user);

    assertEqual(getResponse.success, true, 'getRequirements 應該成功', results);
    assertEqual(Array.isArray(getResponse.data), true, '應該返回陣列', results);

    // 3. 測試取得單一採購需求
    Logger.log('測試 getRequirement...');
    const getOneRequest = {
      action: 'getRequirement',
      id: createdRequirementId
    };
    const getOneResponse = routeRequest(getOneRequest, user);

    assertEqual(getOneResponse.success, true, 'getRequirement 應該成功', results);
    assertEqual(getOneResponse.data.id, createdRequirementId, 'ID 應該匹配', results);
    assertEqual(getOneResponse.data.text, '測試品項 - API 測試', '品項應該匹配', results);

    // 4. 測試更新採購需求
    Logger.log('測試 updateRequirement...');
    const updateRequest = {
      action: 'updateRequirement',
      id: createdRequirementId,
      text: '測試品項 - API 測試（已更新）',
      description: '更新後的描述',
      accountingCategory: '2.3.1 文具印刷',
      priority: 'urgent'
    };
    const updateResponse = routeRequest(updateRequest, user);

    assertEqual(updateResponse.success, true, 'updateRequirement 應該成功', results);
    assertEqual(updateResponse.data.text, '測試品項 - API 測試（已更新）', '品項應該更新', results);
    assertEqual(updateResponse.data.priority, 'urgent', '優先級應該更新', results);

    // 5. 測試取得我的採購需求
    Logger.log('測試 getMyRequirements...');
    const myRequirementsRequest = { action: 'getMyRequirements' };
    const myRequirementsResponse = routeRequest(myRequirementsRequest, user);

    assertEqual(myRequirementsResponse.success, true, 'getMyRequirements 應該成功', results);
    assertEqual(Array.isArray(myRequirementsResponse.data), true, '應該返回陣列', results);

    // 6. 測試刪除採購需求
    Logger.log('測試 deleteRequirement...');
    const deleteRequest = {
      action: 'deleteRequirement',
      id: createdRequirementId
    };
    const deleteResponse = routeRequest(deleteRequest, user);

    assertEqual(deleteResponse.success, true, 'deleteRequirement 應該成功', results);

    // 驗證已刪除
    const verifyDeleteRequest = {
      action: 'getRequirement',
      id: createdRequirementId
    };
    const verifyDeleteResponse = routeRequest(verifyDeleteRequest, user);

    assertEqual(verifyDeleteResponse.success, false, '應該找不到已刪除的需求', results);

    Logger.log('✓ 採購需求 API 測試通過');

  } catch (error) {
    // 清理：如果測試失敗，嘗試刪除建立的測試資料
    if (createdRequirementId) {
      try {
        const user = checkAuth();
        const deleteRequest = {
          action: 'deleteRequirement',
          id: createdRequirementId
        };
        routeRequest(deleteRequest, user);
        Logger.log('已清理測試資料: ' + createdRequirementId);
      } catch (cleanupError) {
        Logger.log('清理測試資料失敗: ' + cleanupError.message);
      }
    }

    recordError('requirementAPIs', error, results);
  }
}

/**
 * 測試留言相關 API
 */
function testCommentAPIs(results) {
  Logger.log('\n--- 測試留言 API ---');

  let testRequirementId = null;
  let testCommentId = null;

  try {
    const user = checkAuth();

    // 先建立一個測試用的採購需求
    Logger.log('建立測試用採購需求...');
    const createRequirement = {
      action: 'createRequirement',
      text: '測試品項 - 留言測試',
      description: '用於測試留言功能',
      accountingCategory: '2.3.1 文具印刷',
      priority: 'normal'
    };
    const reqResponse = routeRequest(createRequirement, user);
    testRequirementId = reqResponse.data.id;

    // 1. 測試新增留言
    Logger.log('測試 addComment...');
    const addCommentRequest = {
      action: 'addComment',
      requirementId: testRequirementId,
      text: '這是測試留言'
    };
    const addCommentResponse = routeRequest(addCommentRequest, user);

    assertEqual(addCommentResponse.success, true, 'addComment 應該成功', results);
    assertExists(addCommentResponse.data.id, '應該返回留言 ID', results);

    testCommentId = addCommentResponse.data.id;

    // 2. 測試取得留言列表
    Logger.log('測試 getComments...');
    const getCommentsRequest = {
      action: 'getComments',
      requirementId: testRequirementId
    };
    const getCommentsResponse = routeRequest(getCommentsRequest, user);

    assertEqual(getCommentsResponse.success, true, 'getComments 應該成功', results);
    assertEqual(Array.isArray(getCommentsResponse.data), true, '應該返回陣列', results);
    assertEqual(getCommentsResponse.data.length >= 1, true, '應該至少有一則留言', results);

    // 3. 測試刪除留言
    Logger.log('測試 deleteComment...');
    const deleteCommentRequest = {
      action: 'deleteComment',
      requirementId: testRequirementId,
      commentId: testCommentId
    };
    const deleteCommentResponse = routeRequest(deleteCommentRequest, user);

    assertEqual(deleteCommentResponse.success, true, 'deleteComment 應該成功', results);

    // 清理測試資料
    Logger.log('清理測試資料...');
    const deleteRequirement = {
      action: 'deleteRequirement',
      id: testRequirementId
    };
    routeRequest(deleteRequirement, user);

    Logger.log('✓ 留言 API 測試通過');

  } catch (error) {
    // 清理測試資料
    if (testRequirementId) {
      try {
        const user = checkAuth();
        const deleteRequest = {
          action: 'deleteRequirement',
          id: testRequirementId
        };
        routeRequest(deleteRequest, user);
        Logger.log('已清理測試資料');
      } catch (cleanupError) {
        Logger.log('清理測試資料失敗: ' + cleanupError.message);
      }
    }

    recordError('commentAPIs', error, results);
  }
}

/**
 * 測試 PDF 生成 API（可選）
 * 注意：此測試會生成實際的 PDF 檔案
 */
function testPDFAPIs(results) {
  Logger.log('\n--- 測試 PDF 生成 API ---');

  let testRequirementId = null;
  let generatedPDFIds = [];

  try {
    const user = checkAuth();

    // 先建立一個測試用的採購需求
    Logger.log('建立測試用採購需求...');
    const createRequirement = {
      action: 'createRequirement',
      text: '測試品項 - PDF 測試',
      description: '用於測試 PDF 生成功能',
      accountingCategory: '2.3.1 文具印刷',
      priority: 'normal'
    };
    const reqResponse = routeRequest(createRequirement, user);
    testRequirementId = reqResponse.data.id;

    // 測試生成單一 PDF
    Logger.log('測試 generateRequirementPDF...');
    const generatePDFRequest = {
      action: 'generateRequirementPDF',
      requirementId: testRequirementId
    };
    const generatePDFResponse = routeRequest(generatePDFRequest, user);

    assertEqual(generatePDFResponse.success, true, 'generateRequirementPDF 應該成功', results);
    assertExists(generatePDFResponse.data.fileId, '應該返回檔案 ID', results);
    assertExists(generatePDFResponse.data.url, '應該返回 URL', results);

    generatedPDFIds.push(generatePDFResponse.data.fileId);
    Logger.log('生成的 PDF 檔案 ID: ' + generatePDFResponse.data.fileId);

    // 測試生成摘要報告
    Logger.log('測試 generateRequirementsSummaryPDF...');
    const generateSummaryRequest = {
      action: 'generateRequirementsSummaryPDF',
      status: 'pending'
    };
    const generateSummaryResponse = routeRequest(generateSummaryRequest, user);

    assertEqual(generateSummaryResponse.success, true, 'generateRequirementsSummaryPDF 應該成功', results);
    assertExists(generateSummaryResponse.data.fileId, '應該返回檔案 ID', results);

    generatedPDFIds.push(generateSummaryResponse.data.fileId);
    Logger.log('生成的摘要 PDF 檔案 ID: ' + generateSummaryResponse.data.fileId);

    // 清理測試資料
    Logger.log('清理測試資料...');

    // 刪除採購需求
    const deleteRequirement = {
      action: 'deleteRequirement',
      id: testRequirementId
    };
    routeRequest(deleteRequirement, user);

    // 刪除生成的 PDF 檔案
    generatedPDFIds.forEach(fileId => {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
        Logger.log('已刪除 PDF: ' + fileId);
      } catch (error) {
        Logger.log('無法刪除 PDF: ' + fileId + ', 錯誤: ' + error.message);
      }
    });

    Logger.log('✓ PDF 生成 API 測試通過');

  } catch (error) {
    // 清理測試資料
    if (testRequirementId) {
      try {
        const user = checkAuth();
        const deleteRequest = {
          action: 'deleteRequirement',
          id: testRequirementId
        };
        routeRequest(deleteRequest, user);
      } catch (cleanupError) {
        Logger.log('清理採購需求失敗');
      }
    }

    // 嘗試刪除 PDF
    generatedPDFIds.forEach(fileId => {
      try {
        DriveApp.getFileById(fileId).setTrashed(true);
      } catch (cleanupError) {
        // 忽略錯誤
      }
    });

    recordError('pdfAPIs', error, results);
  }
}

// ==================== 測試輔助函式 ====================

/**
 * 斷言相等
 */
function assertEqual(actual, expected, message, results) {
  results.total++;

  if (actual === expected) {
    results.passed++;
    Logger.log('  ✓ ' + message);
  } else {
    results.failed++;
    const error = message + '\n    預期: ' + expected + '\n    實際: ' + actual;
    Logger.log('  ✗ ' + error);
    results.errors.push(error);
  }
}

/**
 * 斷言存在
 */
function assertExists(value, message, results) {
  results.total++;

  if (value !== null && value !== undefined) {
    results.passed++;
    Logger.log('  ✓ ' + message);
  } else {
    results.failed++;
    const error = message + ' (值為 ' + value + ')';
    Logger.log('  ✗ ' + error);
    results.errors.push(error);
  }
}

/**
 * 記錄錯誤
 */
function recordError(testName, error, results) {
  results.failed++;
  const errorMsg = testName + ' 測試失敗: ' + error.message;
  Logger.log('✗ ' + errorMsg);
  results.errors.push(errorMsg);
}

/**
 * 顯示測試結果
 */
function displayTestResults(results) {
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;

  Logger.log('\n========== 測試結果摘要 ==========');
  Logger.log('總測試數: ' + results.total);
  Logger.log('通過: ' + results.passed);
  Logger.log('失敗: ' + results.failed);
  Logger.log('通過率: ' + passRate + '%');

  if (results.errors.length > 0) {
    Logger.log('\n失敗的測試:');
    results.errors.forEach((error, index) => {
      Logger.log((index + 1) + '. ' + error);
    });
  }

  // 顯示對話框
  const ui = SpreadsheetApp.getUi();
  const message = `總測試數: ${results.total}\n通過: ${results.passed}\n失敗: ${results.failed}\n通過率: ${passRate}%`;

  if (results.failed === 0) {
    ui.alert('✓ 測試通過', message, ui.ButtonSet.OK);
  } else {
    ui.alert('✗ 測試失敗', message + '\n\n請查看日誌以獲取詳細資訊', ui.ButtonSet.OK);
  }
}

/**
 * 執行快速健康檢查
 */
function quickHealthCheck() {
  Logger.log('執行快速健康檢查...');

  try {
    const user = checkAuth();
    Logger.log('✓ 身份驗證正常');
    Logger.log('  使用者: ' + user.email);
    Logger.log('  角色: ' + user.roles.join(', '));

    // 檢查試算表連接
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✓ 試算表連接正常');
    Logger.log('  試算表名稱: ' + ss.getName());

    // 檢查工作表
    const requiredSheets = [
      SHEET_NAMES.USERS,
      SHEET_NAMES.REQUIREMENTS,
      SHEET_NAMES.COMMENTS,
      SHEET_NAMES.CONFIG
    ];

    requiredSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet) {
        Logger.log('✓ 工作表 "' + sheetName + '" 存在');
      } else {
        Logger.log('✗ 工作表 "' + sheetName + '" 不存在');
      }
    });

    // 測試 API 路由
    const testRequest = { action: 'healthCheck' };
    const response = routeRequest(testRequest, user);

    if (response.success) {
      Logger.log('✓ API 路由正常');
    } else {
      Logger.log('✗ API 路由失敗');
    }

    Logger.log('\n健康檢查完成！');

  } catch (error) {
    Logger.log('✗ 健康檢查失敗: ' + error.message);
  }
}

// --- ▲▲▲ APITests.gs 結束 ▲▲▲ ---
