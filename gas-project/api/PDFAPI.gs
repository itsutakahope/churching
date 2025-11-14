// --- ▼▼▼ PDFAPI.gs - PDF 生成 API ▼▼▼ ---

/**
 * 生成單一採購需求的 PDF
 * API: generateRequirementPDF
 * 權限: 已登入使用者
 *
 * @param {object} request - 請求物件 {requirementId}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function generateRequirementPDFAPI(request, user) {
  try {
    // 驗證輸入
    const validation = validateInput(request, {
      requirementId: { required: true, type: 'string' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const { requirementId } = request;

    // 檢查採購需求是否存在
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(requirementId);

    if (!requirement) {
      throw new Error('NOT_FOUND|找不到採購需求');
    }

    // 檢查權限：只有申請人、管理員或財務相關人員可以生成 PDF
    const canGenerate =
      requirement.userId === user.id ||
      user.roles.includes(USER_ROLES.ADMIN) ||
      user.roles.includes(USER_ROLES.FINANCE_STAFF) ||
      user.roles.includes(USER_ROLES.TREASURER);

    if (!canGenerate) {
      throw new Error('PERMISSION_DENIED|您沒有權限生成此採購需求的 PDF');
    }

    // 生成 PDF
    const pdfInfo = generateRequirementPDF(requirementId);

    // 記錄活動
    logInfo('生成採購需求 PDF', {
      requirementId: requirementId,
      user: user.email,
      pdfFileId: pdfInfo.fileId
    });

    return createSuccessResponse(pdfInfo, '已生成 PDF');

  } catch (error) {
    logError('generateRequirementPDFAPI', error);
    return createErrorResponse(error);
  }
}

/**
 * 生成採購需求摘要報告
 * API: generateRequirementsSummaryPDF
 * 權限: 已登入使用者
 *
 * @param {object} request - 請求物件 {status, priority, startDate, endDate}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function generateRequirementsSummaryPDFAPI(request, user) {
  try {
    // 驗證輸入（選擇性欄位）
    const filters = {};

    if (request.status) {
      if (!Object.values(REQUIREMENT_STATUS).includes(request.status)) {
        throw new Error('INVALID_INPUT|無效的狀態');
      }
      filters.status = request.status;
    }

    if (request.priority) {
      if (!Object.values(REQUIREMENT_PRIORITY).includes(request.priority)) {
        throw new Error('INVALID_INPUT|無效的優先級');
      }
      filters.priority = request.priority;
    }

    if (request.startDate) {
      filters.startDate = request.startDate;
    }

    if (request.endDate) {
      filters.endDate = request.endDate;
    }

    // 生成 PDF
    const pdfInfo = generateRequirementsSummaryPDF(filters);

    // 記錄活動
    logInfo('生成採購需求摘要報告', {
      user: user.email,
      filters: filters,
      pdfFileId: pdfInfo.fileId
    });

    return createSuccessResponse(pdfInfo, '已生成摘要報告 PDF');

  } catch (error) {
    logError('generateRequirementsSummaryPDFAPI', error);
    return createErrorResponse(error);
  }
}

/**
 * 批次生成多個採購需求的 PDF（壓縮成 ZIP）
 * API: generateMultipleRequirementsPDF
 * 權限: 管理員或財務人員
 *
 * @param {object} request - 請求物件 {requirementIds: string[]}
 * @param {object} user - 當前使用者
 * @returns {object} 回應物件
 */
function generateMultipleRequirementsPDFAPI(request, user) {
  try {
    // 檢查權限
    checkRole(user, [USER_ROLES.ADMIN, USER_ROLES.FINANCE_STAFF, USER_ROLES.TREASURER]);

    // 驗證輸入
    const validation = validateInput(request, {
      requirementIds: { required: true, type: 'array' }
    });

    if (!validation.valid) {
      throw new Error('INVALID_INPUT|' + validation.errors.join(', '));
    }

    const { requirementIds } = request;

    if (requirementIds.length === 0) {
      throw new Error('INVALID_INPUT|請至少選擇一個採購需求');
    }

    if (requirementIds.length > 50) {
      throw new Error('INVALID_INPUT|一次最多只能生成 50 個 PDF');
    }

    // 建立臨時資料夾來存放 PDF
    const tempFolder = DriveApp.createFolder(`採購需求PDF_${new Date().getTime()}`);
    const pdfFiles = [];

    // 生成每個採購需求的 PDF
    requirementIds.forEach(requirementId => {
      try {
        const pdfInfo = generateRequirementPDF(requirementId);
        const pdfFile = DriveApp.getFileById(pdfInfo.fileId);

        // 複製到臨時資料夾
        const copy = pdfFile.makeCopy(pdfFile.getName(), tempFolder);
        pdfFiles.push(copy);

      } catch (error) {
        logError('生成單一 PDF 失敗', { requirementId, error: error.message });
        // 繼續處理其他 PDF
      }
    });

    if (pdfFiles.length === 0) {
      // 刪除臨時資料夾
      tempFolder.setTrashed(true);
      throw new Error('INTERNAL_ERROR|無法生成任何 PDF');
    }

    // 建立 ZIP 檔案
    const zipBlob = createZipFromFolder(tempFolder);
    const zipFile = DriveApp.createFile(zipBlob);
    zipFile.setName(`採購需求PDF打包_${formatDateString(new Date(), 'YYYY-MM-DD')}.zip`);

    // 刪除臨時資料夾和檔案
    tempFolder.setTrashed(true);

    // 移動 ZIP 到特定資料夾（如果有設定）
    const pdfFolderId = getConfigValue('PDF_FOLDER_ID');
    if (pdfFolderId) {
      const folder = DriveApp.getFolderById(pdfFolderId);
      zipFile.moveTo(folder);
    }

    // 設定 ZIP 權限
    zipFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const zipInfo = {
      fileId: zipFile.getId(),
      fileName: zipFile.getName(),
      url: zipFile.getUrl(),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${zipFile.getId()}`,
      filesCount: pdfFiles.length
    };

    // 記錄活動
    logInfo('批次生成採購需求 PDF', {
      user: user.email,
      count: requirementIds.length,
      successCount: pdfFiles.length,
      zipFileId: zipInfo.fileId
    });

    return createSuccessResponse(zipInfo, `已生成 ${pdfFiles.length} 個 PDF 並打包成 ZIP`);

  } catch (error) {
    logError('generateMultipleRequirementsPDFAPI', error);
    return createErrorResponse(error);
  }
}

/**
 * 從資料夾建立 ZIP 檔案
 * @param {GoogleAppsScript.Drive.Folder} folder - 資料夾物件
 * @returns {GoogleAppsScript.Base.Blob} ZIP Blob
 */
function createZipFromFolder(folder) {
  const files = folder.getFiles();
  const blobs = [];

  while (files.hasNext()) {
    const file = files.next();
    blobs.push(file.getBlob());
  }

  return Utilities.zip(blobs, folder.getName() + '.zip');
}

// --- ▲▲▲ PDFAPI.gs 結束 ▲▲▲ ---
