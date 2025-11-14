// --- ▼▼▼ TithePDFAPI.gs - 奉獻 PDF 生成 API ▼▼▼ ---

/**
 * 生成奉獻任務 PDF 報告
 * API: generateTithePDF
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {titheTaskId}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function generateTithePDFAPI(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入
    const validation = validateInput(request, {
      titheTaskId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const { titheTaskId } = request;

    // 檢查任務是否存在
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 生成 PDF
    const pdfInfo = generateTithePDF(titheTaskId);

    // 記錄活動
    logInfo('生成奉獻任務 PDF', {
      titheTaskId: titheTaskId,
      user: user.email,
      pdfFileId: pdfInfo.fileId
    });

    return createSuccessResponse(pdfInfo, '已生成奉獻報告 PDF');

  } catch (error) {
    logError('generateTithePDFAPI', error);
    return createErrorResponse(error);
  }
}

/**
 * 生成奉獻摘要報告 PDF
 * API: generateTitheSummaryPDF
 * 權限: finance_staff 或 treasurer
 *
 * @param {object} request - 請求物件 {status, startDate, endDate}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function generateTitheSummaryPDFAPI(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER, USER_ROLES.ADMIN]);

    // 驗證輸入（選擇性欄位）
    const filters = {};

    if (request.status) {
      if (!Object.values(TITHE_STATUS).includes(request.status)) {
        throw new Error('INVALID_INPUT|無效的狀態');
      }
      filters.status = request.status;
    }

    if (request.startDate) {
      filters.startDate = request.startDate;
    }

    if (request.endDate) {
      filters.endDate = request.endDate;
    }

    // 生成 PDF
    const pdfInfo = generateTitheSummaryPDF(filters);

    // 記錄活動
    logInfo('生成奉獻摘要報告', {
      user: user.email,
      filters: filters,
      pdfFileId: pdfInfo.fileId
    });

    return createSuccessResponse(pdfInfo, '已生成奉獻摘要報告 PDF');

  } catch (error) {
    logError('generateTitheSummaryPDFAPI', error);
    return createErrorResponse(error);
  }
}

// --- ▲▲▲ TithePDFAPI.gs 結束 ▲▲▲ ---
