// --- ▼▼▼ EmailService.gs - Email 服務 ▼▼▼ ---

/**
 * 發送新採購申請通知
 * @param {object} requirement - 採購申請物件
 */
function sendNewRequirementNotification(requirement) {
  try {
    // 取得訂閱通知的使用者
    const userDAO = new UserDAO();
    const subscribers = userDAO.findUsersWantingNewRequestNotification();

    if (subscribers.length === 0) {
      Logger.log('沒有使用者訂閱新申請通知');
      return;
    }

    // 準備 Email 內容
    const subject = `[新採購申請] ${requirement.text}`;

    const body = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #4285F4;">新的採購申請</h2>

  <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">申請人</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.requesterName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">品項</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.text}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">規格說明</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.description || '無'}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">會計科目</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.accountingCategory}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">優先級</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">
        ${requirement.priority === REQUIREMENT_PRIORITY.URGENT ? '<span style="color: red; font-weight: bold;">緊急</span>' : '一般'}
      </td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">建立時間</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.createdAt}</td>
    </tr>
  </table>

  <p style="margin-top: 20px;">
    <a href="${getSpreadsheet().getUrl()}" style="background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
      查看詳情
    </a>
  </p>

  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    這是系統自動發送的通知郵件，請勿直接回覆。<br>
    如果不想再收到通知，請在系統中修改通知偏好設定。
  </p>
</body>
</html>
    `.trim();

    // 批次發送 Email
    const emailChunks = chunkArray(subscribers, EMAIL_QUOTA.BATCH_SIZE);

    emailChunks.forEach((chunk, index) => {
      try {
        chunk.forEach(subscriber => {
          MailApp.sendEmail({
            to: subscriber.email,
            subject: subject,
            htmlBody: body
          });
        });

        Logger.log(`已發送第 ${index + 1} 批通知 (${chunk.length} 封)`);

        // 避免超過配額，批次之間稍作延遲
        if (index < emailChunks.length - 1) {
          Utilities.sleep(1000);
        }
      } catch (emailError) {
        Logger.log(`發送第 ${index + 1} 批通知失敗: ${emailError.message}`);
      }
    });

    Logger.log(`新採購申請通知已發送給 ${subscribers.length} 位使用者`);
  } catch (error) {
    logError('sendNewRequirementNotification', error);
    // Email 發送失敗不拋出錯誤，避免影響主要功能
  }
}

/**
 * 發送採購完成通知
 * @param {object} requirement - 採購申請物件
 * @param {string} requesterId - 申請人 ID
 */
function sendPurchaseCompleteNotification(requirement, requesterId) {
  try {
    // 取得申請人資訊
    const userDAO = new UserDAO();
    const requester = userDAO.findById(requesterId);

    if (!requester) {
      Logger.log('找不到申請人，無法發送通知');
      return;
    }

    // 檢查申請人是否訂閱通知
    if (!requester.wantsPurchaseCompleteNotification) {
      Logger.log('申請人未訂閱完成通知');
      return;
    }

    // 準備 Email 內容
    const subject = `[採購完成] ${requirement.text}`;

    const body = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #34A853;">您的採購申請已完成</h2>

  <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">品項</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.text}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">購買金額</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">NT$ ${requirement.purchaseAmount}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">購買日期</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.purchaseDate}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">購買人</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.purchaserName}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">報帳人</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.reimbursementerName}</td>
    </tr>
    ${requirement.purchaseNotes ? `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold;">購買備註</td>
      <td style="padding: 10px; border-bottom: 1px solid #ddd;">${requirement.purchaseNotes}</td>
    </tr>
    ` : ''}
  </table>

  <p style="margin-top: 20px;">
    <a href="${getSpreadsheet().getUrl()}" style="background-color: #34A853; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
      查看詳情
    </a>
  </p>

  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    這是系統自動發送的通知郵件，請勿直接回覆。<br>
    如果不想再收到通知，請在系統中修改通知偏好設定。
  </p>
</body>
</html>
    `.trim();

    // 發送 Email
    MailApp.sendEmail({
      to: requester.email,
      subject: subject,
      htmlBody: body
    });

    Logger.log(`採購完成通知已發送給 ${requester.email}`);
  } catch (error) {
    logError('sendPurchaseCompleteNotification', error);
    // Email 發送失敗不拋出錯誤，避免影響主要功能
  }
}

/**
 * 將陣列分割成多個小陣列
 * @param {Array} array - 原始陣列
 * @param {number} size - 每個小陣列的大小
 * @returns {Array<Array>} 分割後的陣列
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * 測試 Email 發送
 * @param {string} toEmail - 收件人 Email
 */
function testEmail(toEmail) {
  if (!toEmail) {
    toEmail = getCurrentUserEmail();
  }

  try {
    MailApp.sendEmail({
      to: toEmail,
      subject: '[測試] 教會管理系統 Email 通知',
      htmlBody: `
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>Email 測試成功！</h2>
  <p>如果您收到這封郵件，表示 Email 通知功能正常運作。</p>
  <p>發送時間: ${new Date()}</p>
</body>
</html>
      `.trim()
    });

    Logger.log('測試 Email 已發送至: ' + toEmail);

    SpreadsheetApp.getUi().alert(
      'Email 測試',
      '測試 Email 已發送至: ' + toEmail,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (error) {
    Logger.log('Email 發送失敗: ' + error.message);

    SpreadsheetApp.getUi().alert(
      'Email 測試失敗',
      '發送失敗：' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// --- ▲▲▲ EmailService.gs 結束 ▲▲▲ ---
