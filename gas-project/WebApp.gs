// --- ▼▼▼ WebApp.gs - Web App 端點 ▼▼▼ ---

/**
 * GET 請求處理器
 * 用於顯示前端 UI
 */
function doGet(e) {
  try {
    // 取得當前使用者資訊（不檢查狀態）
    const userInfo = getCurrentUserInfo();

    // 如果使用者未登入，顯示登入頁面
    if (!userInfo) {
      return HtmlService.createHtmlOutputFromFile('Login')
        .setTitle('教會管理系統 - 登入')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // 如果使用者未批准，顯示等待頁面
    if (userInfo.status !== USER_STATUS.APPROVED) {
      return HtmlService.createTemplateFromFile('Pending')
        .evaluate()
        .setTitle('教會管理系統 - 等待批准')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    }

    // 顯示主頁面
    const template = HtmlService.createTemplateFromFile('Index');
    template.user = userInfo;

    return template.evaluate()
      .setTitle('教會管理系統')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    logError('doGet', error);

    // 顯示錯誤頁面
    const template = HtmlService.createTemplate(
      '<html><body><h1>系統錯誤</h1><p><?= errorMessage ?></p></body></html>'
    );
    template.errorMessage = error.message;

    return template.evaluate()
      .setTitle('系統錯誤')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * POST 請求處理器
 * 用於處理所有 API 請求
 */
function doPost(e) {
  try {
    // 解析請求
    const request = parseRequest(e);

    // 記錄 API 請求
    logInfo('API 請求', {
      action: request.action,
      user: getCurrentUserEmail()
    });

    // 檢查身份驗證
    const user = checkAuth();

    // 路由到對應的 API 處理函式
    const response = routeRequest(request, user);

    // 回傳 JSON 回應
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    logError('doPost', error);

    // 回傳錯誤回應
    const errorResponse = createErrorResponse(error);

    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 解析請求
 * @param {object} e - 事件物件
 * @returns {object} 解析後的請求物件
 */
function parseRequest(e) {
  let request;

  // 嘗試解析 JSON
  if (e.postData && e.postData.contents) {
    try {
      request = JSON.parse(e.postData.contents);
    } catch (err) {
      throw new Error('INVALID_INPUT|無效的請求格式');
    }
  } else if (e.parameter) {
    request = e.parameter;
  } else {
    throw new Error('INVALID_INPUT|缺少請求資料');
  }

  // 驗證請求格式
  if (!request.action) {
    throw new Error('INVALID_INPUT|缺少 action 參數');
  }

  return request;
}

/**
 * 路由請求到對應的 API 處理函式
 * @param {object} request - 請求物件
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function routeRequest(request, user) {
  const action = request.action;

  // API 路由表
  const routes = {
    // 採購申請 API
    'createRequirement': createRequirement,
    'getRequirements': getRequirements,
    'getRequirement': getRequirement,
    'updateRequirement': updateRequirement,
    'deleteRequirement': deleteRequirement,
    'transferReimbursement': transferReimbursement,
    'getRequirementStatistics': getRequirementStatistics,
    'getMyRequirements': getMyRequirements,
    'getMyReimbursements': getMyReimbursements,

    // 留言 API
    'addComment': addComment,
    'deleteComment': deleteComment,
    'getComments': getComments,
    'searchComments': searchComments,

    // PDF 生成 API
    'generateRequirementPDF': generateRequirementPDFAPI,
    'generateRequirementsSummaryPDF': generateRequirementsSummaryPDFAPI,
    'generateMultipleRequirementsPDF': generateMultipleRequirementsPDFAPI,

    // 奉獻計算 API
    'createTitheTask': createTitheTask,
    'getTitheTasks': getTitheTasks,
    'getTitheTask': getTitheTask,
    'addDedication': addDedication,
    'batchAddDedications': batchAddDedications,
    'getDedications': getDedications,
    'updateDedication': updateDedication,
    'deleteDedication': deleteDedication,
    'completeTitheTask': completeTitheTask,
    'getTitheStatistics': getTitheStatistics,
    'generateTithePDF': generateTithePDFAPI,
    'generateTitheSummaryPDF': generateTitheSummaryPDFAPI,

    // 使用者 API
    'getUsers': getUsers,
    'getReimbursementContacts': getReimbursementContacts,
    'getFinanceStaff': getFinanceStaff,
    'updateUser': updateUser,
    'updateUserPreferences': updateUserPreferences,
    'approveUser': approveUser,
    'getCurrentUserProfile': getCurrentUserProfile,
    'getUserInfo': getUserInfo,

    // 系統 API
    'getSystemInfo': handleGetSystemInfo,
    'healthCheck': handleHealthCheck
  };

  // 查找對應的處理函式
  const handler = routes[action];

  if (!handler) {
    throw new Error('INVALID_INPUT|不支援的 API 動作: ' + action);
  }

  // 執行處理函式
  return handler(request, user);
}

/**
 * 系統資訊 API
 */
function handleGetSystemInfo(request, user) {
  try {
    // 檢查權限：只有管理員可以查看
    checkRole(user, [USER_ROLES.ADMIN]);

    const info = getSystemInfo();
    return createSuccessResponse(info);
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * 健康檢查 API
 */
function handleHealthCheck(request, user) {
  return createSuccessResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    user: {
      email: user.email,
      displayName: user.displayName
    }
  });
}

/**
 * 載入 HTML 片段（用於前端頁面）
 * @param {string} filename - 檔案名稱
 * @returns {string} HTML 內容
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * 處理前端的 API 請求
 * 這個函式會被前端的 google.script.run 呼叫
 * @param {object} request - 請求物件 {action, data}
 * @returns {object} 回應物件
 */
function handleAPIRequest(request) {
  try {
    // 記錄 API 請求
    logInfo('前端 API 請求', {
      action: request.action,
      user: getCurrentUserEmail()
    });

    // 檢查身份驗證
    const user = checkAuth();

    // 路由到對應的 API 處理函式
    const response = routeRequest(request, user);

    return response;
  } catch (error) {
    logError('handleAPIRequest', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ WebApp.gs 結束 ▲▲▲ ---
