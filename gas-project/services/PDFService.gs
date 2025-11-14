// --- ▼▼▼ PDFService.gs - PDF 生成服務 ▼▼▼ ---

/**
 * PDF 生成服務
 * 使用 Google Docs 作為模板，轉換為 PDF
 */

/**
 * 生成單一採購需求的 PDF
 * @param {string} requirementId - 採購需求 ID
 * @returns {object} 包含 PDF 檔案 ID 和 URL 的物件
 */
function generateRequirementPDF(requirementId) {
  try {
    // 取得採購需求資料
    const requirementDAO = new RequirementDAO();
    const requirement = requirementDAO.findById(requirementId);

    if (!requirement) {
      throw new Error('NOT_FOUND|找不到採購需求');
    }

    // 建立文件
    const doc = DocumentApp.create(`採購需求_${requirement.text}_${formatDateString(new Date())}`);
    const body = doc.getBody();

    // 設定文件樣式
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Noto Sans TC';
    style[DocumentApp.Attribute.FONT_SIZE] = 11;
    body.setAttributes(style);

    // 標題
    const title = body.appendParagraph('採購需求詳情');
    title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // 分隔線
    body.appendHorizontalRule();

    // 基本資訊
    body.appendParagraph('').appendText('基本資訊').setBold(true).setFontSize(14);
    body.appendParagraph('');

    const basicInfo = [
      ['品項', requirement.text],
      ['狀態', getStatusText(requirement.status)],
      ['優先級', getPriorityText(requirement.priority)],
      ['會計科目', requirement.accountingCategory],
      ['申請人', requirement.requesterName],
      ['建立時間', formatDateString(requirement.createdAt)]
    ];

    const basicTable = body.appendTable(basicInfo);
    styleTable(basicTable);

    // 規格說明
    if (requirement.description) {
      body.appendParagraph('');
      body.appendParagraph('').appendText('規格說明').setBold(true).setFontSize(14);
      body.appendParagraph(requirement.description);
    }

    // 購買資訊（如果已購買）
    if (requirement.status === REQUIREMENT_STATUS.PURCHASED) {
      body.appendParagraph('');
      body.appendParagraph('').appendText('購買資訊').setBold(true).setFontSize(14);
      body.appendParagraph('');

      const purchaseInfo = [
        ['購買金額', `NT$ ${requirement.purchaseAmount}`],
        ['購買日期', requirement.purchaseDate],
        ['購買人', requirement.purchaserName],
        ['報帳人', requirement.reimbursementerName]
      ];

      if (requirement.purchaseNotes) {
        purchaseInfo.push(['購買備註', requirement.purchaseNotes]);
      }

      const purchaseTable = body.appendTable(purchaseInfo);
      styleTable(purchaseTable);
    }

    // 留言（如果有）
    const commentDAO = new CommentDAO();
    const comments = commentDAO.getCommentsByRequirement(requirementId);

    if (comments.length > 0) {
      body.appendParagraph('');
      body.appendParagraph('').appendText('留言記錄').setBold(true).setFontSize(14);
      body.appendParagraph('');

      comments.forEach((comment, index) => {
        const commentPara = body.appendParagraph(`${index + 1}. ${comment.authorName} (${formatDateString(comment.createdAt)})`);
        commentPara.setBold(true);
        body.appendParagraph(`   ${comment.text}`);
        body.appendParagraph('');
      });
    }

    // 頁尾
    body.appendHorizontalRule();
    const footer = body.appendParagraph(`生成時間：${formatDateString(new Date())}`);
    footer.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    footer.setFontSize(9);

    // 儲存文件
    doc.saveAndClose();

    // 轉換為 PDF
    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs('application/pdf');
    const pdfFile = DriveApp.createFile(pdfBlob);

    // 刪除原始 Google Doc
    docFile.setTrashed(true);

    // 移動 PDF 到特定資料夾（如果有設定）
    const pdfFolderId = getConfigValue('PDF_FOLDER_ID');
    if (pdfFolderId) {
      const folder = DriveApp.getFolderById(pdfFolderId);
      pdfFile.moveTo(folder);
    }

    // 設定 PDF 權限為任何擁有連結的人都可檢視
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      fileId: pdfFile.getId(),
      fileName: pdfFile.getName(),
      url: pdfFile.getUrl(),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`
    };

  } catch (error) {
    logError('generateRequirementPDF', error);
    throw error;
  }
}

/**
 * 生成採購需求摘要報告
 * @param {object} filters - 篩選條件 {status, priority, startDate, endDate}
 * @returns {object} 包含 PDF 檔案 ID 和 URL 的物件
 */
function generateRequirementsSummaryPDF(filters = {}) {
  try {
    // 取得採購需求列表
    const requirementDAO = new RequirementDAO();
    let requirements = requirementDAO.findAll();

    // 套用篩選
    if (filters.status) {
      requirements = requirements.filter(r => r.status === filters.status);
    }
    if (filters.priority) {
      requirements = requirements.filter(r => r.priority === filters.priority);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      requirements = requirements.filter(r => new Date(r.createdAt) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      requirements = requirements.filter(r => new Date(r.createdAt) <= endDate);
    }

    // 建立文件
    const doc = DocumentApp.create(`採購需求摘要報告_${formatDateString(new Date())}`);
    const body = doc.getBody();

    // 設定文件樣式
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Noto Sans TC';
    style[DocumentApp.Attribute.FONT_SIZE] = 11;
    body.setAttributes(style);

    // 標題
    const title = body.appendParagraph('採購需求摘要報告');
    title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // 報告日期
    const reportDate = body.appendParagraph(`報告日期：${formatDateString(new Date())}`);
    reportDate.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    reportDate.setFontSize(10);

    // 分隔線
    body.appendHorizontalRule();

    // 統計摘要
    body.appendParagraph('').appendText('統計摘要').setBold(true).setFontSize(14);
    body.appendParagraph('');

    const stats = calculateRequirementStats(requirements);
    const statsData = [
      ['項目', '數量'],
      ['總計', stats.total.toString()],
      ['待購買', stats.pending.toString()],
      ['已購買', stats.purchased.toString()],
      ['已取消', stats.cancelled.toString()],
      ['總金額', `NT$ ${stats.totalAmount.toLocaleString()}`]
    ];

    const statsTable = body.appendTable(statsData);
    styleTable(statsTable, true);

    // 詳細列表
    body.appendParagraph('');
    body.appendParagraph('').appendText('詳細列表').setBold(true).setFontSize(14);
    body.appendParagraph('');

    if (requirements.length === 0) {
      body.appendParagraph('沒有符合條件的採購需求');
    } else {
      // 建立表格標題
      const tableData = [
        ['品項', '狀態', '優先級', '會計科目', '申請人', '金額', '建立日期']
      ];

      // 加入資料行
      requirements.forEach(req => {
        tableData.push([
          req.text,
          getStatusText(req.status),
          getPriorityText(req.priority),
          req.accountingCategory,
          req.requesterName,
          req.purchaseAmount ? `NT$ ${req.purchaseAmount}` : '-',
          formatDateString(req.createdAt, 'YYYY-MM-DD')
        ]);
      });

      const detailTable = body.appendTable(tableData);
      styleTable(detailTable, true);
    }

    // 頁尾
    body.appendHorizontalRule();
    const footer = body.appendParagraph(`共 ${requirements.length} 筆記錄`);
    footer.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    footer.setFontSize(9);

    // 儲存文件
    doc.saveAndClose();

    // 轉換為 PDF
    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs('application/pdf');
    const pdfFile = DriveApp.createFile(pdfBlob);

    // 刪除原始 Google Doc
    docFile.setTrashed(true);

    // 移動 PDF 到特定資料夾（如果有設定）
    const pdfFolderId = getConfigValue('PDF_FOLDER_ID');
    if (pdfFolderId) {
      const folder = DriveApp.getFolderById(pdfFolderId);
      pdfFile.moveTo(folder);
    }

    // 設定 PDF 權限
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      fileId: pdfFile.getId(),
      fileName: pdfFile.getName(),
      url: pdfFile.getUrl(),
      downloadUrl: `https://drive.google.com/uc?export=download&id=${pdfFile.getId()}`
    };

  } catch (error) {
    logError('generateRequirementsSummaryPDF', error);
    throw error;
  }
}

/**
 * 計算採購需求統計資料
 * @param {Array} requirements - 採購需求陣列
 * @returns {object} 統計資料
 */
function calculateRequirementStats(requirements) {
  const stats = {
    total: requirements.length,
    pending: 0,
    purchased: 0,
    cancelled: 0,
    totalAmount: 0
  };

  requirements.forEach(req => {
    // 統計狀態
    if (req.status === REQUIREMENT_STATUS.PENDING) {
      stats.pending++;
    } else if (req.status === REQUIREMENT_STATUS.PURCHASED) {
      stats.purchased++;
      // 累加金額
      if (req.purchaseAmount) {
        stats.totalAmount += req.purchaseAmount;
      }
    } else if (req.status === REQUIREMENT_STATUS.CANCELLED) {
      stats.cancelled++;
    }
  });

  return stats;
}

/**
 * 設定表格樣式
 * @param {GoogleAppsScript.Document.Table} table - 表格物件
 * @param {boolean} hasHeader - 是否有標題列
 */
function styleTable(table, hasHeader = false) {
  const numRows = table.getNumRows();
  const numCols = table.getRow(0).getNumCells();

  // 設定所有儲存格的樣式
  for (let i = 0; i < numRows; i++) {
    const row = table.getRow(i);
    for (let j = 0; j < numCols; j++) {
      const cell = row.getCell(j);

      // 設定內距
      cell.setPaddingTop(5);
      cell.setPaddingBottom(5);
      cell.setPaddingLeft(8);
      cell.setPaddingRight(8);

      // 設定邊框
      cell.setBorderWidth(0.5);
      cell.setBorderColor('#CCCCCC');

      // 如果是標題列，設定粗體和背景色
      if (hasHeader && i === 0) {
        cell.setBackgroundColor('#4285F4');
        const text = cell.getChild(0).asText();
        text.setBold(true);
        text.setForegroundColor('#FFFFFF');
      }

      // 如果是第一欄（標籤欄），設定粗體
      if (!hasHeader && j === 0) {
        const text = cell.getChild(0).asText();
        text.setBold(true);
        cell.setBackgroundColor('#F5F5F5');
      }
    }
  }

  // 設定表格寬度
  table.setBorderWidth(1);
  table.setBorderColor('#CCCCCC');
}

/**
 * 取得狀態文字
 * @param {string} status - 狀態代碼
 * @returns {string} 狀態文字
 */
function getStatusText(status) {
  const statusMap = {
    [REQUIREMENT_STATUS.PENDING]: '待購買',
    [REQUIREMENT_STATUS.PURCHASED]: '已購買',
    [REQUIREMENT_STATUS.CANCELLED]: '已取消'
  };
  return statusMap[status] || status;
}

/**
 * 取得優先級文字
 * @param {string} priority - 優先級代碼
 * @returns {string} 優先級文字
 */
function getPriorityText(priority) {
  const priorityMap = {
    [REQUIREMENT_PRIORITY.URGENT]: '緊急',
    [REQUIREMENT_PRIORITY.NORMAL]: '一般'
  };
  return priorityMap[priority] || priority;
}

/**
 * 格式化日期字串
 * @param {Date|string} date - 日期物件或字串
 * @param {string} format - 格式（預設：YYYY-MM-DD HH:mm:ss）
 * @returns {string} 格式化後的日期字串
 */
function formatDateString(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '';

  const d = date instanceof Date ? date : new Date(date);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// --- ▲▲▲ PDFService.gs 結束 ▲▲▲ ---
