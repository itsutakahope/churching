// --- ▼▼▼ TithePDFService.gs - 奉獻 PDF 生成服務 ▼▼▼ ---

/**
 * 生成奉獻任務 PDF 報告
 * @param {string} titheTaskId - 奉獻任務 ID
 * @returns {object} 包含 PDF 檔案 ID 和 URL 的物件
 */
function generateTithePDF(titheTaskId) {
  try {
    // 取得奉獻任務資料
    const titheDAO = new TitheDAO();
    const task = titheDAO.findById(titheTaskId);

    if (!task) {
      throw new Error('NOT_FOUND|找不到奉獻任務');
    }

    // 取得奉獻記錄
    const dedicationDAO = new DedicationDAO();
    const dedications = dedicationDAO.getByTaskId(titheTaskId);
    const stats = dedicationDAO.getTaskStatistics(titheTaskId);

    // 建立文件
    const doc = DocumentApp.create(`奉獻計算報告_${task.taskName}_${formatDateString(new Date())}`);
    const body = doc.getBody();

    // 設定文件樣式
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Noto Sans TC';
    style[DocumentApp.Attribute.FONT_SIZE] = 11;
    body.setAttributes(style);

    // 標題
    const title = body.appendParagraph('奉獻計算報告');
    title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
    title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

    // 任務名稱
    const taskNamePara = body.appendParagraph(task.taskName);
    taskNamePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    taskNamePara.setFontSize(12);
    taskNamePara.setBold(true);

    // 分隔線
    body.appendHorizontalRule();

    // 任務資訊
    body.appendParagraph('').appendText('任務資訊').setBold(true).setFontSize(14);
    body.appendParagraph('');

    const taskInfo = [
      ['計算時間', task.calculationTimestamp ? formatDateString(task.calculationTimestamp) : ''],
      ['會計', task.treasurerName],
      ['財務人員', task.financeStaffName],
      ['狀態', task.status === TITHE_STATUS.COMPLETED ? '已完成' : '進行中'],
      ['建立時間', formatDateString(task.createdAt)],
      ['完成時間', task.completedAt ? formatDateString(task.completedAt) : '-']
    ];

    const taskInfoTable = body.appendTable(taskInfo);
    styleTable(taskInfoTable);

    // 統計摘要
    body.appendParagraph('');
    body.appendParagraph('').appendText('統計摘要').setBold(true).setFontSize(14);
    body.appendParagraph('');

    const statsData = [
      ['項目', '數量'],
      ['總筆數', stats.totalCount.toString()],
      ['總金額', `NT$ ${stats.totalAmount.toLocaleString()}`]
    ];

    const statsTable = body.appendTable(statsData);
    styleTable(statsTable, true);

    // 按類別統計
    if (Object.keys(stats.byCategory).length > 0) {
      body.appendParagraph('');
      body.appendParagraph('').appendText('按類別統計').setBold(true).setFontSize(14);
      body.appendParagraph('');

      const categoryData = [
        ['奉獻類別', '筆數', '金額']
      ];

      Object.keys(stats.byCategory).sort().forEach(category => {
        const catStats = stats.byCategory[category];
        categoryData.push([
          category,
          catStats.count.toString(),
          `NT$ ${catStats.amount.toLocaleString()}`
        ]);
      });

      const categoryTable = body.appendTable(categoryData);
      styleTable(categoryTable, true);
    }

    // 按奉獻者統計（前 20 名）
    if (Object.keys(stats.byDonor).length > 0) {
      body.appendParagraph('');
      body.appendParagraph('').appendText('按奉獻者統計（前 20 名）').setBold(true).setFontSize(14);
      body.appendParagraph('');

      const donorData = [
        ['奉獻者', '筆數', '金額']
      ];

      // 按金額排序並取前 20 名
      const sortedDonors = Object.keys(stats.byDonor)
        .sort((a, b) => stats.byDonor[b].amount - stats.byDonor[a].amount)
        .slice(0, 20);

      sortedDonors.forEach(donor => {
        const donorStats = stats.byDonor[donor];
        donorData.push([
          donor,
          donorStats.count.toString(),
          `NT$ ${donorStats.amount.toLocaleString()}`
        ]);
      });

      const donorTable = body.appendTable(donorData);
      styleTable(donorTable, true);
    }

    // 詳細列表
    body.appendPageBreak(); // 新頁面
    body.appendParagraph('').appendText('奉獻明細').setBold(true).setFontSize(14);
    body.appendParagraph('');

    if (dedications.length === 0) {
      body.appendParagraph('沒有奉獻記錄');
    } else {
      // 建立表格標題
      const detailData = [
        ['編號', '奉獻者', '類別', '金額', '入帳日期', '備註']
      ];

      // 加入資料行
      dedications.forEach((dedication, index) => {
        detailData.push([
          (index + 1).toString(),
          dedication['献金者'],
          dedication['奉獻類別'],
          `NT$ ${parseFloat(dedication['金額']).toLocaleString()}`,
          dedication['入帳日期'],
          dedication['備註'] || ''
        ]);
      });

      const detailTable = body.appendTable(detailData);
      styleTable(detailTable, true);
    }

    // 頁尾
    body.appendHorizontalRule();
    const footer = body.appendParagraph(`生成時間：${formatDateString(new Date())}`);
    footer.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    footer.setFontSize(9);

    const footerNote = body.appendParagraph(`共 ${dedications.length} 筆記錄`);
    footerNote.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
    footerNote.setFontSize(9);

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
    logError('generateTithePDF', error);
    throw error;
  }
}

/**
 * 生成奉獻任務摘要報告（多個任務）
 * @param {object} filters - 篩選條件 {status, startDate, endDate}
 * @returns {object} 包含 PDF 檔案 ID 和 URL 的物件
 */
function generateTitheSummaryPDF(filters = {}) {
  try {
    // 取得奉獻任務列表
    const titheDAO = new TitheDAO();
    let tasks = titheDAO.findAll();

    // 套用篩選
    if (filters.status) {
      tasks = tasks.filter(t => t.status === filters.status);
    }
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      tasks = tasks.filter(t => new Date(t.calculationTimestamp) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      tasks = tasks.filter(t => new Date(t.calculationTimestamp) <= endDate);
    }

    // 建立文件
    const doc = DocumentApp.create(`奉獻計算摘要報告_${formatDateString(new Date())}`);
    const body = doc.getBody();

    // 設定文件樣式
    const style = {};
    style[DocumentApp.Attribute.FONT_FAMILY] = 'Noto Sans TC';
    style[DocumentApp.Attribute.FONT_SIZE] = 11;
    body.setAttributes(style);

    // 標題
    const title = body.appendParagraph('奉獻計算摘要報告');
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

    const stats = calculateTitheSummaryStats(tasks);
    const statsData = [
      ['項目', '數量'],
      ['任務總數', stats.totalTasks.toString()],
      ['進行中', stats.inProgress.toString()],
      ['已完成', stats.completed.toString()],
      ['總奉獻筆數', stats.totalCount.toString()],
      ['總奉獻金額', `NT$ ${stats.totalAmount.toLocaleString()}`]
    ];

    const statsTable = body.appendTable(statsData);
    styleTable(statsTable, true);

    // 詳細列表
    body.appendParagraph('');
    body.appendParagraph('').appendText('任務列表').setBold(true).setFontSize(14);
    body.appendParagraph('');

    if (tasks.length === 0) {
      body.appendParagraph('沒有符合條件的奉獻任務');
    } else {
      // 建立表格標題
      const tableData = [
        ['任務名稱', '計算時間', '會計', '財務人員', '狀態', '筆數', '金額']
      ];

      // 加入資料行
      tasks.forEach(task => {
        tableData.push([
          task.taskName,
          formatDateString(task.calculationTimestamp, 'YYYY-MM-DD'),
          task.treasurerName,
          task.financeStaffName,
          task.status === TITHE_STATUS.COMPLETED ? '已完成' : '進行中',
          task.totalCount ? task.totalCount.toString() : '0',
          task.totalAmount ? `NT$ ${task.totalAmount.toLocaleString()}` : 'NT$ 0'
        ]);
      });

      const detailTable = body.appendTable(tableData);
      styleTable(detailTable, true);
    }

    // 頁尾
    body.appendHorizontalRule();
    const footer = body.appendParagraph(`共 ${tasks.length} 個任務`);
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
    logError('generateTitheSummaryPDF', error);
    throw error;
  }
}

/**
 * 計算奉獻摘要統計資料
 * @param {Array} tasks - 任務陣列
 * @returns {object} 統計資料
 */
function calculateTitheSummaryStats(tasks) {
  const stats = {
    totalTasks: tasks.length,
    inProgress: 0,
    completed: 0,
    totalCount: 0,
    totalAmount: 0
  };

  tasks.forEach(task => {
    if (task.status === TITHE_STATUS.IN_PROGRESS) {
      stats.inProgress++;
    } else if (task.status === TITHE_STATUS.COMPLETED) {
      stats.completed++;
      stats.totalCount += task.totalCount || 0;
      stats.totalAmount += task.totalAmount || 0;
    }
  });

  return stats;
}

// --- ▲▲▲ TithePDFService.gs 結束 ▲▲▲ ---
