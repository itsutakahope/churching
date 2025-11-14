import express from 'express';
import admin from 'firebase-admin';
import * as logger from "firebase-functions/logger"; // Gen 2 logging
import {onRequest} from "firebase-functions/v2/https"; // For HTTP functions
import {onCall, HttpsError} from "firebase-functions/v2/https"; // For Callable functions
import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import { defineString } from 'firebase-functions/params'; // <-- 1. 引入 defineString

// --- 👇 2. 使用 V2 的方式定義參數 ---
const GMAIL_CLIENT_ID = defineString('GMAIL_CLIENT_ID');
const GMAIL_CLIENT_SECRET = defineString('GMAIL_CLIENT_SECRET');
const GMAIL_REFRESH_TOKEN = defineString('GMAIL_REFRESH_TOKEN');
const GMAIL_SENDER = defineString('GMAIL_SENDER');

// Initialize firebase-admin
admin.initializeApp();
const db = admin.firestore();

// --- ✨ 核心修正 2：Gmail API 客戶端延遲初始化 ---
let gmailClient;

function getGmailClient() {
  if (!gmailClient) {
    const oauth2Client = new google.auth.OAuth2(
      GMAIL_CLIENT_ID.value(),
      GMAIL_CLIENT_SECRET.value(),
      'https://developers.google.com/oauthplayground'
    );
    if (GMAIL_REFRESH_TOKEN.value()) {
      oauth2Client.setCredentials({
        refresh_token: GMAIL_REFRESH_TOKEN.value(),
      });
    }
    gmailClient = google.gmail({ version: 'v1', auth: oauth2Client });
  }
  return gmailClient;
}

/**
 * Sends an email notification about a new purchase request.
 * @param {object} requirementData The data of the newly created requirement.
 */
async function sendNewRequestNotification(requirementData) {
  // Check if Gmail config is available
  if (!GMAIL_CLIENT_ID.value() || !GMAIL_REFRESH_TOKEN.value() || !GMAIL_SENDER.value()) {
    logger.warn('Gmail configuration parameters are missing. Skipping email notification.');
    return;
  }

  try {
    // 1. Find users who want notifications
    const usersSnapshot = await db.collection('users').where('wantsNewRequestNotification', '==', true).get();

    if (usersSnapshot.empty) {
      logger.log('No users are subscribed to new request notifications.');
      return;
    }

    const recipients = usersSnapshot.docs.map(doc => doc.data().email).filter(email => email);
    
    if (recipients.length === 0) {
      logger.log('Found subscribed users, but they have no valid email addresses.');
      return;
    }

    // 2. Create Email Content
    const subject = `[新採購申請] ${requirementData.requesterName} 申請了 ${requirementData.text}`;
    const emailBody = `
      您好,<br><br>
      系統收到一筆新的採購申請，詳情如下：<br><br>
      <ul>
        <li><b>申請人:</b> ${requirementData.requesterName}</li>
        <li><b>品項:</b> ${requirementData.text}</li>
        <li><b>規格/描述:</b> ${requirementData.description || '無'}</li>
        <li><b>會計科目:</b> ${requirementData.accountingCategory || '未分類'}</li>
        <li><b>優先級:</b> ${requirementData.priority === 'urgent' ? '緊急' : '一般'}</li>
      </ul>
      <br>
      請至採購板查看詳情。<br>
      <small>(此為系統自動發送郵件，請勿回覆)</small>
    `.trim();

   // --- 👇 核心修改開始 ---
    // 3. Construct and Send Email (with proper encoding for headers)
    const senderDisplayName = '採購板系統';
    const encodedDisplayName = `=?UTF-8?B?${Buffer.from(senderDisplayName).toString('base64')}?=`;
    const fromHeader = `${encodedDisplayName} <${GMAIL_SENDER.value()}>`;
    
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const rawMessage = [
      `From: ${fromHeader}`,
      `To: ${recipients.join(',')}`,
      'Content-Type: text/html; charset=UTF-8',
      'MIME-Version: 1.0',
      `Subject: ${encodedSubject}`,
      '',
      emailBody,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const gmail = getGmailClient(); // ✨ 使用延遲初始化
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    // --- ▲▲▲ 核心修改結束 ▲▲▲

    logger.log(`Notification email sent successfully to ${recipients.length} recipient(s).`);

  } catch (error) {
    logger.error('Error sending new request notification email:', error);
    if (error.response && error.response.data) {
      logger.error('Gmail API Error Details:', error.response.data);
    }
  }
}

/**
 * Sends an email notification about a completed purchase to the original requester.
 * @param {object} requirementData The data of the purchased requirement.
 * @param {string} originalRequesterUid The UID of the original requester.
 */
async function sendPurchaseCompleteNotification(requirementData, originalRequesterUid) {
  // Enhanced error handling: Check if Gmail config is available
  if (!GMAIL_CLIENT_ID.value() || !GMAIL_REFRESH_TOKEN.value() || !GMAIL_SENDER.value()) {
    logger.warn('Gmail configuration parameters are missing. Skipping purchase complete notification.');
    return;
  }

  // Enhanced error handling: Validate input parameters
  if (!originalRequesterUid) {
    logger.error('sendPurchaseCompleteNotification called with invalid originalRequesterUid', {
      originalRequesterUid,
      requirementId: requirementData.id || 'unknown'
    });
    return;
  }

  if (!requirementData || !requirementData.text) {
    logger.error('sendPurchaseCompleteNotification called with invalid requirementData', {
      hasRequirementData: !!requirementData,
      hasText: !!(requirementData && requirementData.text),
      requirementId: requirementData?.id || 'unknown'
    });
    return;
  }

  try {
    // 1. Get the original requester's notification preferences and email
    const requesterDoc = await db.collection('users').doc(originalRequesterUid).get();
    
    if (!requesterDoc.exists) {
      logger.warn(`Original requester ${originalRequesterUid} not found in Firestore. Skipping notification.`, {
        originalRequesterUid,
        requirementId: requirementData.id || 'unknown'
      });
      return;
    }

    const requesterData = requesterDoc.data();
    
    // --- 👇 核心修正 1：修復 if 判斷式 ---
    // Check if user wants purchase complete notifications
    if (!requesterData.wantsPurchaseCompleteNotification) {
      logger.log(`Requester ${originalRequesterUid} has opted out of purchase complete notifications.`);
      return;
    }

    // --- 👇 核心修正 2：定義遺失的變數 ---
    const subject = `[採購完成] 您的申請「${requirementData.text}」已由 ${requirementData.purchaserName || '系統'} 完成購買`;
    
    const formattedAmount = (requirementData.purchaseAmount || 0).toLocaleString('en-US', {
      style: 'currency',
      currency: 'TWD', // Assuming TWD, adjust if necessary
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    const purchaseDate = requirementData.purchaseDate 
      ? new Date(requirementData.purchaseDate).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })
      : '未指定';
    
    const emailBody = `
      您好 ${requirementData.requesterName || ''}<br><br>
      您申請的採購項目已完成購買，詳情如下：<br><br>
      <ul>
        <li><b>品項名稱:</b> ${requirementData.text}</li>
        <li><b>規格/描述:</b> ${requirementData.description || '無'}</li>
        <li><b>會計科目:</b> ${requirementData.accountingCategory || '未分類'}</li>
        <li><b>購買金額:</b> ${formattedAmount}</li>
        <li><b>購買人:</b> ${requirementData.purchaserName || '未指定'}</li>
        <li><b>購買日期:</b> ${purchaseDate}</li>
        ${requirementData.purchaseNotes ? `<li><b>購買備註:</b> ${requirementData.purchaseNotes}</li>` : ''}
      </ul>
      <br>
      感謝您使用採購管理系統。<br>
      <small>(此為系統自動發送郵件，請勿回覆)</small>
    `.trim();

    // 5. Construct and Send Email (with proper encoding for headers)
    const senderDisplayName = '採購板系統';
    const encodedDisplayName = `=?UTF-8?B?${Buffer.from(senderDisplayName).toString('base64')}?=`;
    const fromHeader = `${encodedDisplayName} <${GMAIL_SENDER.value()}>`;
    
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`;
    
    const rawMessage = [
      `From: ${fromHeader}`,
      `To: ${requesterData.email}`,
      'Content-Type: text/html; charset=UTF-8',
      'MIME-Version: 1.0',
      `Subject: ${encodedSubject}`,
      '',
      emailBody,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const gmail = getGmailClient(); // ✨ 使用延遲初始化
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    logger.log(`Purchase complete notification email sent successfully to ${requesterData.email} for requirement ${requirementData.id || 'unknown'}.`);

  } catch (error) {
    logger.error('Error sending purchase complete notification email:', error);
    if (error.response && error.response.data) {
      logger.error('Gmail API Error Details:', error.response.data);
    }
  }
}

const app = express();

// Middleware for parsing JSON request bodies
app.use(express.json());

// Helper function to get user display name
const getUserDisplayName = async (uid) => {
  if (!uid) return 'Anonymous';
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord.displayName || userRecord.email || 'Anonymous';
  } catch (error) {
    logger.error('Error fetching user data for display name:', uid, error);
    return 'Unknown User';
  }
};


// Authentication Middleware
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('No Firebase ID token was passed as a Bearer token in the Authorization header.');
    return res.status(401).json({ message: 'Unauthorized. No token provided.' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);

     // --- 👇 新增的審核邏輯 ---
    // 取得 Firestore 中的使用者文件
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();

    // 如果文件不存在，或狀態不是 'approved'，則拒絕存取
    if (!userDoc.exists || userDoc.data().status !== 'approved') {
      logger.warn(`User ${decodedToken.uid} is not approved or profile does not exist.`);
      return res.status(403).json({
        message: 'Forbidden. Your account requires administrator approval to access this resource.',
        code: 'ACCOUNT_NOT_APPROVED' 
      });
    }
    // --- 審核邏輯結束 ---

    // ⭐ 核心修改：合併 Token 和 Firestore 的使用者資料
    req.user = {
      ...decodedToken, // 包含 uid, email, 和 'name' 屬性
      ...userDoc.data()  // 包含 status, roles, 和 'displayName' 屬性
    };

    logger.log('ID Token correctly decoded', decodedToken);
    next();
  } catch (error) {
    logger.error('Error while verifying Firebase ID token:', error);
    res.status(403).json({ message: 'Forbidden. Invalid token.', error: error.message });
  }
};


/**
 * 中介軟體工廠函式，用於產生角色驗證的中介軟體。
 * @param {string[]} allowedRoles - 允許存取此路由的角色陣列。
 * @returns Express middleware function
 */
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles;

    const hasPermission = Array.isArray(userRoles) && 
                          userRoles.some(role => allowedRoles.includes(role));

    if (!hasPermission) {
      logger.warn(`Permission denied for user ${req.user.uid}. Required roles: ${allowedRoles.join(', ')}. User roles: ${userRoles?.join(', ')}`);
      return res.status(403).json({ 
        message: 'Forbidden. You do not have the required permissions to access this resource.',
        code: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    next();
  };
};


/**
 * Sanitizes purchase notes to prevent XSS and limit length.
 * @param {string | null | undefined} notes The raw notes string.
 * @returns {string | null} The sanitized notes or null if empty.
 */
const sanitizePurchaseNotes = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  
  // A simple way to strip HTML tags. For more robust sanitization, a library like DOMPurify would be better.
  const cleanNotes = notes.replace(/<[^>]*>/g, '');
  
  // Trim and limit length
  const trimmedNotes = cleanNotes.trim().substring(0, 500);
  
  return trimmedNotes || null;
};

// API endpoint for health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', message: 'Server is healthy' });
});

// --- Users API Endpoint ---

// GET /api/users (Get All Users) - Protected
app.get('/api/users', verifyFirebaseToken, async (req, res) => {
  try {
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      displayName: userRecord.displayName || 'N/A',
    }));
    res.status(200).json(users);
  } catch (error) {
    logger.error('Error listing users:', error);
    res.status(500).json({ message: 'Error listing users', error: error.message });
  }
});

// GET /api/users/reimbursement-contacts (Get All Reimbursement Contacts) - Protected
app.get('/api/users/reimbursement-contacts', verifyFirebaseToken, async (req, res) => {
  try {
    // 步驟 1: 從 Firestore 查詢有 'reimbursementContact' 角色的使用者 UID
    const contactsQuery = db.collection('users').where('roles', 'array-contains', 'reimbursementContact');
    const contactsSnapshot = await contactsQuery.get();

    if (contactsSnapshot.empty) {
      return res.status(200).json([]);
    }

    const contactUids = contactsSnapshot.docs.map(doc => doc.id);

    if (contactUids.length === 0) {
      return res.status(200).json([]);
    }
    
    // 步驟 2: 使用 UID 列表批次從 Firebase Authentication 獲取使用者紀錄
    const userRecordsResult = await admin.auth().getUsers(contactUids.map(uid => ({ uid })));

    // 步驟 3: 建立最終回傳列表，使用 Firebase Auth 的 displayName
    const contactsList = userRecordsResult.users.map(user => ({
      uid: user.uid,
      displayName: user.displayName || user.email || 'N/A', // 優先使用 displayName
    }));

    // (可選，但建議) 記錄下哪些在 Firestore 中有紀錄但在 Auth 中找不到的使用者
    if (userRecordsResult.notFound.length > 0) {
        logger.warn('The following UIDs were found in Firestore roles but not in Firebase Auth:', userRecordsResult.notFound.map(user => user.uid));
    }

    res.status(200).json(contactsList);

  } catch (error) {
    logger.error('Error fetching reimbursement contacts:', error);
    res.status(500).json({ message: 'An unexpected error occurred while fetching reimbursement contacts.', error: error.message });
  }
});


// PUT /api/user/preferences (Update user's notification preferences) - Protected
app.put('/api/user/preferences', verifyFirebaseToken, async (req, res) => {
  const { uid } = req.user;
  const { wantsNewRequestNotification, wantsPurchaseCompleteNotification } = req.body;

  // 新增：檢查用戶審核狀態
  if (req.user.status !== 'approved') {
    return res.status(403).json({ 
      message: 'Forbidden. Your account requires administrator approval to modify notification preferences.',
      code: 'ACCOUNT_NOT_APPROVED' 
    });
  }

  // Validate notification preferences - maintain backward compatibility
  const updateData = {};
  
  if (wantsNewRequestNotification !== undefined) {
    if (typeof wantsNewRequestNotification !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for wantsNewRequestNotification. It must be a boolean.' });
    }
    updateData.wantsNewRequestNotification = wantsNewRequestNotification;
  }

  if (wantsPurchaseCompleteNotification !== undefined) {
    if (typeof wantsPurchaseCompleteNotification !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for wantsPurchaseCompleteNotification. It must be a boolean.' });
    }
    updateData.wantsPurchaseCompleteNotification = wantsPurchaseCompleteNotification;
  }

  // Ensure at least one preference is being updated
  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ message: 'At least one notification preference must be provided.' });
  }

  try {
    const userRef = db.collection('users').doc(uid);
    // Use `set` with `merge: true` to create or update the field without overwriting the whole document
    await userRef.set(updateData, { merge: true });
    
    // Fetch the updated user document to send back to the client
    const updatedUserDoc = await userRef.get();
    const updatedUserData = updatedUserDoc.data();

    res.status(200).json({ 
        message: 'Preferences updated successfully.',
        preferences: {
            wantsNewRequestNotification: updatedUserData.wantsNewRequestNotification,
            wantsPurchaseCompleteNotification: updatedUserData.wantsPurchaseCompleteNotification
        } 
    });
  } catch (error) {
    logger.error(`Error updating preferences for user ${uid}:`, error);
    res.status(500).json({ message: 'Error updating preferences.', error: error.message });
  }
});



// --- Requirements API Endpoints ---

// POST /api/requirements (Create) - Protected
// POST /api/requirements (Create) - Protected
app.post('/api/requirements', verifyFirebaseToken, async (req, res) => {
  try {
    // 👇 解構出所有可能的欄位
    const { text, description, accountingCategory, status, purchaseAmount, purchaseDate, priority, reimbursementerId, reimbursementerName } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text (title) is required' });
    }

    const newRequirement = {
      text,
      description: description || "",
      accountingCategory: accountingCategory || "",
      priority: priority || 'general', // <-- 新增：設置緊急程度，預設為 'general'
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: req.user.uid,
      requesterName: req.user.name || req.user.email || 'Anonymous',
    };

    // ▼▼▼ 核心修改：根據傳入的 status 決���如何處理 ▼▼▼
    if (status === 'purchased') {
      // 如果是直接建立 "已購買" 狀態
      if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
        return res.status(400).json({ message: 'A valid purchaseAmount is required for purchased status.' });
      }
      newRequirement.status = 'purchased';
      newRequirement.purchaseAmount = purchaseAmount;
      // 使用客戶端傳來的 purchaseDate，或設為當前伺服器時間作為備用
      newRequirement.purchaseDate = purchaseDate || new Date().toISOString();
      newRequirement.purchaserName = req.user.name || req.user.email; // 使用 token 中的使用者資訊
      newRequirement.purchaserId = req.user.uid;

      // --- 👇 新增：處理報帳人邏輯 ---
      if (reimbursementerId && reimbursementerName) {
        // 如果前端已指定報帳人
        newRequirement.reimbursementerId = reimbursementerId;
        newRequirement.reimbursementerName = reimbursementerName;
      } else {
        // 如果未指定，則預設為購買人自己
        newRequirement.reimbursementerId = newRequirement.purchaserId;
        newRequirement.reimbursementerName = newRequirement.purchaserName;
      }
      // --- 報帳人邏輯結束 ---
      
    } else {
      // 預設行為：建立 "待購買" 狀態
      newRequirement.status = 'pending';
    }
    // ▲▲▲ 修改結束 ▲▲▲

    const docRef = await db.collection('requirements').add(newRequirement);    
    const createdData = { id: docRef.id, ...newRequirement, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()};

    // --- 👇 新增：非同步觸發郵件通知 ---
   // --- 👇 核心修改：只在狀態為 'pending' 時才觸發郵件通知 ---
    // Only send a notification if the new request is in 'pending' status.
    if (newRequirement.status === 'pending') {
      sendNewRequestNotification(createdData).catch(err => {
        logger.error("Failed to trigger notification email send:", err);
      });
    }
    // --- 修改結束 ---

    res.status(201).json(createdData);
  } catch (error) {
    logger.error('Error creating requirement:', error);
    res.status(500).json({ message: 'Error creating requirement', error: error.message });
  }
});

// purchaseboard/functions/index.js

// PUT /api/requirements/:id (Update) - Protected with Transaction
app.put('/api/requirements/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const dataToUpdate = req.body; // e.g., { status, purchaseAmount, text, description, etc. }
    const requirementRef = db.collection('requirements').doc(id);

    // Run the update in a transaction and capture the result
    const transactionResult = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(requirementRef);
      if (!doc.exists) {
        throw new Error('NOT_FOUND');
      }

      const docData = doc.data();
      const actionRequesterId = req.user.uid;

      const updatePayload = { ...dataToUpdate };

      // Logic for marking as 'purchased'
      if (dataToUpdate.status === 'purchased') {
        if (docData.status !== 'pending') {
          throw new Error('ALREADY_PURCHASED');
        }
        if (typeof dataToUpdate.purchaseAmount !== 'number' || dataToUpdate.purchaseAmount <= 0) {
          throw new Error('INVALID_AMOUNT');
        }
        updatePayload.purchaserId = actionRequesterId;
        updatePayload.purchaserName = req.user.name || req.user.email;
        updatePayload.purchaseDate = dataToUpdate.purchaseDate || new Date().toISOString();
        updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        if (dataToUpdate.reimbursementerId && dataToUpdate.reimbursementerName) {
            updatePayload.reimbursementerId = dataToUpdate.reimbursementerId;
            updatePayload.reimbursementerName = dataToUpdate.reimbursementerName;
        } else {
            updatePayload.reimbursementerId = updatePayload.purchaserId;
            updatePayload.reimbursementerName = updatePayload.purchaserName;
        }
      }

      // Logic for reverting to 'pending'
      if (dataToUpdate.status === 'pending') {
        if (docData.status !== 'purchased') {
          throw new Error('NOT_PURCHASED_YET');
        }
        if (docData.purchaserId !== actionRequesterId) {
          throw new Error('PERMISSION_DENIED');
        }
        updatePayload.status = 'pending';
        updatePayload.purchaseAmount = admin.firestore.FieldValue.delete();
        updatePayload.purchaseDate = admin.firestore.FieldValue.delete();
        updatePayload.purchaserName = admin.firestore.FieldValue.delete();
        updatePayload.purchaserId = admin.firestore.FieldValue.delete();
        updatePayload.reimbursementerId = admin.firestore.FieldValue.delete();
        updatePayload.reimbursementerName = admin.firestore.FieldValue.delete();
        updatePayload.updatedAt = admin.firestore.FieldValue.serverTimestamp();
      }

      // Sanitize purchaseNotes
      if (updatePayload.purchaseNotes) {
        updatePayload.purchaseNotes = sanitizePurchaseNotes(updatePayload.purchaseNotes);
      }
      
      transaction.update(requirementRef, updatePayload);
      
      // If status changes from 'pending' to 'purchased', prepare data for notification
      if (docData.status === 'pending' && dataToUpdate.status === 'purchased') {
        return { 
          sendNotification: true, 
          updatedData: { id, ...docData, ...updatePayload },
          originalRequesterUid: docData.userId 
        };
      }

      // If no notification is needed, return a standard object
      return { sendNotification: false };
    });

    // After the transaction, check if a notification should be sent
    if (transactionResult?.sendNotification) {
      sendPurchaseCompleteNotification(transactionResult.updatedData, transactionResult.originalRequesterUid)
        .catch(err => logger.error("Failed to trigger purchase complete notification:", err));
    }

    res.status(200).json({ message: 'Requirement updated successfully' });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ message: '該採購需求不存在。' });
    }
    if (error.message === 'ALREADY_PURCHASED') {
      return res.status(409).json({ message: '此需求已被他人標記為已購買，頁面將會自動更新。' });
    }
    if (error.message === 'PERMISSION_DENIED') {
      return res.status(403).json({ message: '權限不足，只有原始購買者才能撤銷此操作。' });
    }
    res.status(500).json({ message: '更新採購需求時發生錯誤', error: error.message });
  }
});

// PUT /api/requirements/:id/transfer (轉交報帳責任) - 受保護
app.put('/api/requirements/:id/transfer', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newReimbursementerId, newReimbursementerName } = req.body;
    const currentUserId = req.user.uid;

    // 驗證請求參數
    if (!newReimbursementerId || !newReimbursementerName) {
      return res.status(400).json({ 
        message: '缺少必要參數：需要提供新報帳負責人的 ID 和姓名。',
        code: 'INVALID_REQUEST_DATA'
      });
    }

    const requirementRef = db.collection('requirements').doc(id);

    // 使用 Firestore 交易確保資料一致性
    const transactionResult = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(requirementRef);
      
      if (!doc.exists) {
        throw new Error('REQUIREMENT_NOT_FOUND');
      }

      const docData = doc.data();

      // 權限驗證：確保只有目前報帳負責人可以執行轉交
      if (docData.reimbursementerId !== currentUserId) {
        throw new Error('PERMISSION_DENIED');
      }

      // 驗證目標使用者是否具有 reimbursementContact 角色
      const targetUserDoc = await transaction.get(db.collection('users').doc(newReimbursementerId));
      
      if (!targetUserDoc.exists) {
        throw new Error('INVALID_TARGET_USER');
      }

      const targetUserData = targetUserDoc.data();
      const targetUserRoles = targetUserData.roles || [];
      
      if (!targetUserRoles.includes('reimbursementContact')) {
        throw new Error('INVALID_TARGET_USER');
      }

      // 更新報帳負責人資訊
      const updateData = {
        reimbursementerId: newReimbursementerId,
        reimbursementerName: newReimbursementerName,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.update(requirementRef, updateData);

      return {
        id,
        ...docData,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
    });

    logger.log(`報帳責任已成功轉交：需求 ${id} 從 ${currentUserId} 轉交給 ${newReimbursementerId}`);

    res.status(200).json({
      success: true,
      message: '報帳責任已成功轉交',
      updatedRequirement: transactionResult
    });

  } catch (error) {
    logger.error('轉交報帳責任時發生錯誤:', error);

    // 處理特定錯誤情況
    if (error.message === 'REQUIREMENT_NOT_FOUND') {
      return res.status(404).json({ 
        success: false,
        message: '找不到指定的採購需求。',
        code: 'REQUIREMENT_NOT_FOUND'
      });
    }

    if (error.message === 'PERMISSION_DENIED') {
      return res.status(403).json({ 
        success: false,
        message: '權限不足：只有目前的報帳負責人才能執行此操作。',
        code: 'PERMISSION_DENIED'
      });
    }

    if (error.message === 'INVALID_TARGET_USER') {
      return res.status(400).json({ 
        success: false,
        message: '選擇的使用者沒有報帳權限，請選擇其他人員。',
        code: 'INVALID_TARGET_USER'
      });
    }

    // 一般性錯誤
    res.status(500).json({ 
      success: false,
      message: '轉交報帳責任時發生系統錯誤，請稍後再試。',
      code: 'DATABASE_ERROR',
      error: error.message 
    });
  }
});

// DELETE /api/requirements/:id (刪除一筆採購需求) - 受保護
app.delete('/api/requirements/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const { id } = req.params;
    const requirementRef = db.collection('requirements').doc(id);
    const doc = await requirementRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: '找不到該採購需求' });
    }

    // 權限檢查：確保只有建立者本人才能刪除
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ message: '權限不足，您只能刪除自己建立的需求。' });
    }

    // (建議步驟) Firestore 不會自動刪除子集合，所以在刪除文件前，先手動刪除其下的所有留言
    const commentsRef = requirementRef.collection('comments');
    const commentsSnapshot = await commentsRef.get();
    if (!commentsSnapshot.empty) {
      const batch = db.batch();
      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });
      await batch.commit();
      logger.log(`已刪除 ${commentsSnapshot.size} 則與採購需求 ${id} 相關的留言`);
    }

    // 刪除主文件
    await requirementRef.delete();
    logger.log(`採購需求 ${id} 已被用戶 ${req.user.uid} 成功刪除`);

    // 成功刪除後，回傳 204 No Content 是標準做法
    res.status(204).send();

  } catch (error) {
    logger.error('刪除採購需求時發生錯誤:', error);
    res.status(500).json({ message: '刪除採購需求時發生錯誤', error: error.message });
  }
});
// GET /api/requirements (Read All)
app.get('/api/requirements', verifyFirebaseToken, async (req, res) => {
  logger.info('Received request for /api/requirements'); // 新增日誌
  try {
    const snapshot = await db.collection('requirements').orderBy('createdAt', 'desc').get();
    logger.info(`Firestore snapshot fetched. Empty: ${snapshot.empty}. Size: ${snapshot.size}`); // 新增日誌

    if (snapshot.empty) {
      logger.info('No requirements found, returning empty array.'); // 新增日誌
      return res.status(200).json([]); // 確保空情況回傳陣列
    }

    const requirementsPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let requesterName = data.requesterName; // 從既有資料開始

      if (!requesterName && data.userId) { // 只有當 requesterName 不存在且有 userId 時才嘗試獲取
        try {
          requesterName = await getUserDisplayName(data.userId);
        } catch (userError) {
          // 即使 getUserDisplayName 內部發生了無法預料的錯誤（例如網路問題、服務暫時不可用）
          // 或者如果 getUserDisplayName 被修改為可能拋出錯誤
          logger.error(`Failed to get display name for UID: ${data.userId} in requirement ${doc.id}`, userError);
          requesterName = 'Unknown User (Error)'; // 或其他標識符
        }
      } else if (!requesterName) {
        requesterName = 'Anonymous'; // 如果連 userId 都沒有
      }

      // Fetch comments for each requirement
      const commentsSnapshot = await db.collection('requirements').doc(doc.id).collection('comments').orderBy('createdAt', 'asc').get();
      const comments = commentsSnapshot.docs.map(commentDoc => ({
        id: commentDoc.id,
        ...commentDoc.data(),
        createdAt: commentDoc.data().createdAt?.toDate().toISOString(),
      }));

      return {
        id: doc.id,
        ...data,
        requesterName, // 使用處理過的 requesterName
        comments, // Add comments array
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      };
    });
    const requirements = await Promise.all(requirementsPromises);
    logger.info(`Successfully processed ${requirements.length} requirements. Returning them.`); // 新增日誌
    res.status(200).json(requirements);
  } catch (error) {
    logger.error('Error in /api/requirements:', error); // 你已經有這個了，很好
    // 確保錯誤時也回傳 JSON
    return res.status(500).json({ message: 'Error fetching requirements from server', error: error.message, stack: error.stack }); // 可以考慮加入 stack trace 以便調試
  }
});

// --- Comments API Endpoints ---

// POST /api/requirements/:reqId/comments (Create Comment) - Protected
app.post('/api/requirements/:reqId/comments', verifyFirebaseToken, async (req, res) => {
  try {
    const { reqId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    // Check if requirement exists
    const requirementRef = db.collection('requirements').doc(reqId);
    const requirementDoc = await requirementRef.get();
    if (!requirementDoc.exists) {
      return res.status(404).json({ message: 'Requirement not found' });
    }

    const newComment = {
      text,
      userId: req.user.uid,
      authorName: req.user.name || req.user.email || 'Anonymous', // Use token name or email
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const commentRef = await requirementRef.collection('comments').add(newComment);
    const createdCommentData = { id: commentRef.id, ...newComment, createdAt: new Date().toISOString() };

    res.status(201).json(createdCommentData);
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ message: 'Error creating comment', error: error.message });
  }
});

// DELETE /api/requirements/:reqId/comments/:commentId (Delete Comment) - Protected
app.delete('/api/requirements/:reqId/comments/:commentId', verifyFirebaseToken, async (req, res) => {
  try {
    const { reqId, commentId } = req.params;

    const commentRef = db.collection('requirements').doc(reqId).collection('comments').doc(commentId);
    const commentDoc = await commentRef.get();

    if (!commentDoc.exists) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Authorization: Only comment author can delete (or requirement owner - more complex, skip for now)
    if (commentDoc.data().userId !== req.user.uid) {
      // As an alternative, one might allow the requirement owner to delete comments too.
      // const requirementDoc = await db.collection('requirements').doc(reqId).get();
      // if (!requirementDoc.exists || requirementDoc.data().userId !== req.user.uid) {
      //   return res.status(403).json({ message: 'Forbidden. You can only delete your own comments.' });
      // }
      return res.status(403).json({ message: 'Forbidden. You can only delete your own comments.' });
    }

    await commentRef.delete();
    res.status(204).send(); // No Content
  } catch (error) {
    logger.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
});

// =================================================================
// Tithing Tasks API Endpoints (CORRECTED SYNTAX)
// =================================================================

// GET all tithing tasks
app.get('/api/tithe-tasks', verifyFirebaseToken, verifyRole(['finance_staff', 'treasurer']), async (req, res) => {
  try {
    const snapshot = await db.collection('tithe').orderBy('calculationTimestamp', 'desc').get();
    
    // ✨ 所有需要的名稱都已存在於文件中，無需額外查詢
    const tasks = snapshot.docs.map(doc => {
      const taskData = doc.data();
      return {
        id: doc.id,
        ...taskData,
        // 確保時間戳總是 ISO string 格式
        calculationTimestamp: taskData.calculationTimestamp?.toDate().toISOString(),
      };
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    logger.error('Error getting tithing tasks:', error);
    res.status(500).json({ message: 'Error getting tithing tasks', error: error.message });
  }
});

// POST a new tithing task
app.post('/api/tithe-tasks', verifyFirebaseToken, verifyRole(['finance_staff', 'treasurer']), async (req, res) => {
  try {
    const { uid, name, email } = req.user; // 從已驗證的 token 中取得司庫資訊
    const { financeStaffUid } = req.body; // 從請求的 body 中獲取財務同工的 UID

    if (!financeStaffUid) {
      return res.status(400).json({ message: 'Finance staff UID is required.' });
    }

    // ✨ 步驟 1: 即時查詢財務同工的最新 displayName
    const financeStaffUserRecord = await admin.auth().getUser(financeStaffUid);
    const financeStaffName = financeStaffUserRecord.displayName || financeStaffUserRecord.email || 'N/A';
    
    // ✨ 步驟 2: 將 UID 和 Name 快照一起寫入資料庫
    const newTaskData = {
      treasurerUid: uid,
      treasurerName: name || email || 'Anonymous', // 寫入司庫名稱快照
      financeStaffUid: financeStaffUid,
      financeStaffName: financeStaffName || email || 'Anonymous', // 寫入財務同工名稱快照
      status: 'in-progress',
      calculationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection('tithe').add(newTaskData);
    
    const createdTask = { 
      id: docRef.id, 
      ...newTaskData,
      calculationTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    res.status(201).json(createdTask);
  } catch (error) {
    logger.error('Error creating tithing task:', error);
    res.status(500).json({ message: 'Error creating tithing task', error: error.message });
  }
});

app.get('/api/finance-staff', verifyFirebaseToken, verifyRole(['finance_staff', 'treasurer']), async (req, res) => {
  try {
    const requestingUserUid = req.user.uid; // 新增：取得請求者 UID
    const staffQuery = db.collection('users').where('roles', 'array-contains-any', ['finance_staff', 'treasurer']);
    const staffSnapshot = await staffQuery.get();

    if (staffSnapshot.empty) {
      return res.status(200).json([]);
    }

    const staffUids = staffSnapshot.docs
    .map(doc => doc.id)
    .filter(uid => uid !== requestingUserUid); // 修改：過濾掉請求者自己
    
    // ✨ 批次查詢 Firebase Auth
    const userRecordsResult = await admin.auth().getUsers(staffUids.map(uid => ({ uid })));

    // ✨ 建立最終回傳列表，只包含成功找到的使用者
    const staffList = userRecordsResult.users.map(user => ({
      uid: user.uid,
      displayName: user.displayName || user.email || 'N/A',
    }));

    // (可選，但建議) 記錄下哪些 UID 找不到，方便除錯
    if (userRecordsResult.notFound.length > 0) {
        logger.warn('The following UIDs were not found in Firebase Auth:', userRecordsResult.notFound.map(user => user.uid));
    }
    
    res.status(200).json(staffList);

  } catch (error) {
    // 針對非預期的錯誤進行記錄
    logger.error('Error fetching finance staff list:', error);
    res.status(500).json({ message: 'An unexpected error occurred while fetching the staff list.', error: error.message });
  }
});


// =================================================================
// AI 辨識功能 API 端點
// =================================================================

// --- ▼▼▼ 核心修改開始：AI 辨識功能 ▼▼▼ ---

/**
 * 輔助函式：呼叫 OpenAI Vision API 辨識收據
 */
async function recognizeReceiptWithOpenAI(imageBase64, apiKey, model = 'gpt-4o') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '請辨識這張收據或發票，提取以下資訊並以 JSON 格式回傳：\n1. items: 商品名稱陣列（如有多項請分別列出）\n2. totalAmount: 總金額（數字）\n3. quantity: 總數量（數字，如果只有一項則為 1）\n4. date: 日期（YYYY-MM-DD 格式）\n5. suggestedCategory: 建議的會計類別（從以下類別中選擇最適合的：「行政費 > 文具印刷」、「行政費 > 郵電費 > 電話網路費」、「行政費 > 郵電費 > 郵資費&匯費」、「事工費」、「水電費」、「維修費」、「雜費」）\n\n請只回傳 JSON，不要有其他文字。'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    // 解析 JSON 回應
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in OpenAI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * 輔助函式：呼叫 Anthropic Claude Vision API 辨識收據
 */
async function recognizeReceiptWithAnthropic(imageBase64, apiKey, model = 'claude-3-5-sonnet-20241022') {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: imageBase64
                }
              },
              {
                type: 'text',
                text: '請辨識這張收據或發票，提取以下資訊並以 JSON 格式回傳：\n1. items: 商品名稱陣列（如有多項請分別列出）\n2. totalAmount: 總金額（數字）\n3. quantity: 總數量（數字，如果只有一項則為 1）\n4. date: 日期（YYYY-MM-DD 格式）\n5. suggestedCategory: 建議的會計類別（從以下類別中選擇最適合的：「行政費 > 文具印刷」、「行政費 > 郵電費 > 電話網路費」、「行政費 > 郵電費 > 郵資費&匯費」、「事工費」、「水電費」、「維修費」、「雜費」）\n\n請只回傳 JSON，不要有其他文字。'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No content in Anthropic response');
    }

    // 解析 JSON 回應
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Anthropic response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Error calling Anthropic API:', error);
    throw error;
  }
}

/**
 * 輔助函式：呼叫 Google Gemini Vision API 辨識收據
 */
async function recognizeReceiptWithGoogle(imageBase64, apiKey, model = 'gemini-1.5-flash') {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: '請辨識這張收據或發票，提取以下資訊並以 JSON 格式回傳：\n1. items: 商品名稱陣列（如有多項請分別列出）\n2. totalAmount: 總金額（數字）\n3. quantity: 總數量（數字，如果只有一項則為 1）\n4. date: 日期（YYYY-MM-DD 格式）\n5. suggestedCategory: 建議的會計類別（從以下類別中選擇最適合的：「行政費 > 文具印刷」、「行政費 > 郵電費 > 電話網路費」、「行政費 > 郵電費 > 郵資費&匯費」、「事工費」、「水電費」、「維修費」、「雜費」）\n\n請只回傳 JSON，不要有其他文字。'
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text;

    if (!content) {
      throw new Error('No content in Google response');
    }

    // 解析 JSON 回應
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Google response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Error calling Google API:', error);
    throw error;
  }
}

// GET /api/ai/settings - 取得 AI 設定（admin only）
app.get('/api/ai/settings', verifyFirebaseToken, verifyRole(['admin']), async (req, res) => {
  try {
    const settingsDoc = await db.collection('aiSettings').doc('config').get();

    if (!settingsDoc.exists) {
      // 如果沒有設定，回傳預設值
      return res.status(200).json({
        provider: '',
        model: '',
        apiKeyConfigured: false
      });
    }

    const settings = settingsDoc.data();

    // 不回傳完整的 API Key，只回傳是否已設定
    res.status(200).json({
      provider: settings.provider || '',
      model: settings.model || '',
      apiKeyConfigured: !!settings.apiKey,
      updatedAt: settings.updatedAt,
      updatedBy: settings.updatedBy
    });

  } catch (error) {
    logger.error('Error fetching AI settings:', error);
    res.status(500).json({
      message: '取得 AI 設定時發生錯誤',
      code: 'AI_SETTINGS_FETCH_ERROR',
      error: error.message
    });
  }
});

// PUT /api/ai/settings - 更新 AI 設定（admin only）
app.put('/api/ai/settings', verifyFirebaseToken, verifyRole(['admin']), async (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;

    // 驗證必要欄位
    if (!provider || !apiKey || !model) {
      return res.status(400).json({
        message: '請提供完整的 AI 設定（provider、apiKey、model）',
        code: 'MISSING_AI_SETTINGS'
      });
    }

    // 驗證 provider 是否有效
    const validProviders = ['openai', 'anthropic', 'google'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        message: '無效的 AI 提供商，請選擇 openai、anthropic 或 google',
        code: 'INVALID_PROVIDER'
      });
    }

    // 儲存設定到 Firestore
    await db.collection('aiSettings').doc('config').set({
      provider,
      apiKey, // 在生產環境中應該加密儲存
      model,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: req.user.uid
    });

    logger.log(`AI settings updated by ${req.user.uid}: provider=${provider}, model=${model}`);

    res.status(200).json({
      message: 'AI 設定已成功更新',
      provider,
      model
    });

  } catch (error) {
    logger.error('Error updating AI settings:', error);
    res.status(500).json({
      message: '更新 AI 設定時發生錯誤',
      code: 'AI_SETTINGS_UPDATE_ERROR',
      error: error.message
    });
  }
});

// POST /api/ai/recognize - 辨識收據圖片（需要認證）
app.post('/api/ai/recognize', verifyFirebaseToken, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    // 驗證必要欄位
    if (!imageBase64) {
      return res.status(400).json({
        message: '請提供圖片資料（imageBase64）',
        code: 'MISSING_IMAGE_DATA'
      });
    }

    // 取得 AI 設定
    const settingsDoc = await db.collection('aiSettings').doc('config').get();

    if (!settingsDoc.exists) {
      return res.status(400).json({
        message: '尚未設定 AI 辨識功能，請聯絡管理員',
        code: 'AI_NOT_CONFIGURED'
      });
    }

    const settings = settingsDoc.data();
    const { provider, apiKey, model } = settings;

    if (!provider || !apiKey) {
      return res.status(400).json({
        message: 'AI 設定不完整，請聯絡管理員',
        code: 'INCOMPLETE_AI_SETTINGS'
      });
    }

    // 移除 base64 前綴（如果有）
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    // 根據提供商呼叫對應的 API
    let recognitionResult;

    switch (provider) {
      case 'openai':
        recognitionResult = await recognizeReceiptWithOpenAI(base64Data, apiKey, model);
        break;
      case 'anthropic':
        recognitionResult = await recognizeReceiptWithAnthropic(base64Data, apiKey, model);
        break;
      case 'google':
        recognitionResult = await recognizeReceiptWithGoogle(base64Data, apiKey, model);
        break;
      default:
        return res.status(400).json({
          message: '不支援的 AI 提供商',
          code: 'UNSUPPORTED_PROVIDER'
        });
    }

    // 格式化回應
    const formattedResult = {
      title: recognitionResult.items?.join('、') || '',
      description: `數量: ${recognitionResult.quantity || 1}`,
      amount: recognitionResult.totalAmount || 0,
      suggestedCategory: recognitionResult.suggestedCategory || '',
      date: recognitionResult.date || new Date().toISOString().split('T')[0],
      rawData: recognitionResult
    };

    logger.log(`Receipt recognized successfully for user ${req.user.uid} using ${provider}`);

    res.status(200).json(formattedResult);

  } catch (error) {
    logger.error('Error recognizing receipt:', error);

    // 根據錯誤類型提供友善的錯誤訊息
    if (error.message.includes('API error')) {
      return res.status(502).json({
        message: 'AI 服務暫時無法使用，請稍後再試',
        code: 'AI_SERVICE_ERROR',
        error: error.message
      });
    }

    res.status(500).json({
      message: '辨識收據時發生錯誤',
      code: 'RECOGNITION_ERROR',
      error: error.message
    });
  }
});

// --- ▲▲▲ 核心修改結束：AI 辨識功能 ▲▲▲ ---


// =================================================================
// 只有在所有 API 路由都定義完畢後，才匯出 Express app
// =================================================================

export const api = onRequest(app); 
// 新增：可呼叫雲端函式來獲取用戶的 displayName
// Gen 2 syntax for onCall
export const getUserDisplayNameCallable = onCall(async (request) => {
  // 1. 檢查用戶是否已登入
  if (!request.auth) {
    throw new HttpsError( // Use imported HttpsError
      'unauthenticated',
      'Only authenticated users can request their display name.'
    );
  }

  const uid = request.auth.uid; // 從 request.auth 中獲取當前用戶的 UID

  try {
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      throw new HttpsError( // Use imported HttpsError
        'not-found',
        'User profile not found in Firestore.'
      );
    }

    const displayName = userDoc.data().displayName;
    if (!displayName) {
      throw new HttpsError( // Use imported HttpsError
        'not-found',
        'Display name not found for this user.'
      );
    }

    return { displayName: displayName };
  } catch (error) {
    logger.error(`Error fetching display name for UID ${uid}:`, error);
    // 如果是 HttpsError，重新拋出；否則，包裝成 HttpsError
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError( // Use imported HttpsError
      'internal',
      'Failed to retrieve display name.',
      error.message
    );
  }
});

// --- 👇 這是要修改的部分 ---

// 當有新使用者在 Authentication 建立時，自動在 Firestore 中建立 user profile
// Gen 2 syntax for onUserCreate
// 當有新使用者在 Authentication 建立時，自動在 Firestore 中建立 user profile
export const createuserprofile = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  const userProfile = {
    email: email,
    displayName: displayName || 'N/A',
    status: 'pending', // 預設狀態為待審核
    roles: ['user'],   // 可選：預設角色
    
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection('users').doc(uid).set(userProfile);
    functions.logger.log(`Successfully created profile for user ${uid}`);
  } catch (error) {
    functions.logger.error(`Error creating profile for user ${uid}:`, error);
  }
});

// Export the Express app as an HTTP function
// Gen 2 syntax for onRequest
// You can add options here if needed, e.g., onRequest({region: 'us-central1'}, app)

// New Cloud Function for Tithing Task Aggregation
export const completeTithingTask = onCall(async (request) => {
     // 1. 身份驗證 (Authentication) - 已有
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {

    const uid = request.auth.uid;
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    const userRoles = userDoc.exists ? userDoc.data().roles || [] : [];
    const allowedRoles = ['finance_staff', 'treasurer'];

    if (!userDoc.exists || !userRoles.some(role => allowedRoles.includes(role))) {
      throw new HttpsError('permission-denied', 'You do not have permission to perform this action.');
    }

    // --- 權限檢查通過 ---

    // 👇 您提到的程式碼就放在這裡 👇
    // 步驟 3: 處理傳入的參數並準備資料庫操作
    const { taskId } = request.data;
    if (!taskId) {
      throw new HttpsError('invalid-argument', 'The function must be called with a "taskId" argument.');
    }

    const taskRef = db.collection('tithe').doc(taskId);
    const dedicationsRef = taskRef.collection('dedications');


    const taskDoc = await taskRef.get();
    if (!taskDoc.exists) {
      throw new HttpsError('not-found', 'The specified task does not exist.');
    }

    // Optional: Add a role-based check here later if needed
    // For now, we assume the frontend logic prevents unauthorized calls.

    const dedicationsSnapshot = await dedicationsRef.get();
    if (dedicationsSnapshot.empty) {
      logger.info(`No dedications found for task ${taskId}. Marking as complete with zero amounts.`);
    }

    const summary = {
      totalAmount: 0,
      byCategory: {},
    };

    dedicationsSnapshot.forEach(doc => {
      const { amount, dedicationCategory } = doc.data();
      if (typeof amount === 'number' && dedicationCategory) {
        summary.totalAmount += amount;
        summary.byCategory[dedicationCategory] = (summary.byCategory[dedicationCategory] || 0) + amount;
      }
    });

    await taskRef.update({
      summary: summary,
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.log(`Task ${taskId} has been successfully completed and aggregated.`);
    return { success: true, summary };

  } catch (error) {
    logger.error(`Error completing tithing task ${taskId}:`, error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'An unexpected error occurred while completing the task.');
  }
});
