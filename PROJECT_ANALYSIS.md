# 教會管理系統 (Churching) - Google Apps Script 遷移分析報告

## 1. 項目概述

### 1.1 核心功能
本項目是一個完整的教會管理系統，包含：
- **採購申請管理系統** (Purchase Board)
- **奉獻計算管理系統** (Tithing Management)
- **角色基礎訪問控制** (RBAC)
- **Email 通知系統**

### 1.2 技術堆棧
| 層 | 技術 |
|---|---|
| 前端 | React 18.3 + Vite + Tailwind CSS |
| 後端 | Firebase Cloud Functions + Express.js |
| 數據庫 | Cloud Firestore |
| 認證 | Firebase Authentication |
| Email | Gmail API |

---

## 2. 前端結構分析

### 2.1 前端文件清單 (24 個主要文件)

#### 核心應用
- `App.jsx` (107 行) - 主應用程序入口
  - 路由定義: `/purchase`, `/tithing`, `/tithing/:taskId`
  - 導航欄管理
  - 登入入口點

#### 採購系統組件
- `PurchaseRequestBoard.jsx` (181 KB) - 採購看板
  - 功能: 列表/網格視圖、搜尋、篩選、留言
  - 狀態管理: 採購申請、購買紀錄、篩選條件
  - 支持批量匯出功能

- `EditRequestModal.jsx` (20 KB) - 編輯採購申請
- `TransferReimbursementModal.jsx` (21 KB) - 轉帳管理
- `EditCategoryModal.jsx` (5 KB) - 會計科目編輯
- `CategorySelector.jsx` (4.5 KB) - 科目選擇器
- `pdfGenerator.js` - PDF 憑證生成 (採購憑證)

#### 奉獻系統組件
- `TithingTaskList.jsx` (13 KB) - 奉獻任務列表
- `TithingTaskDetail.jsx` (7.9 KB) - 任務詳情
  - 管理奉獻記錄、計算匯總、完成任務
  
- `DedicationEntryForm.jsx` (6.4 KB) - 奉獻錄入表單
  - 奉獻科目: 十一、感恩、主日、宣教、特別、專案、裝潢、指定、慈惠、植堂
  - 方式: 現金、支票
  
- `LoggedDedicationsList.jsx` (3.7 KB) - 奉獻記錄列表
- `AggregationSummary.jsx` (7.2 KB) - 統計匯總
- `PaymentBreakdownDisplay.jsx` (6.3 KB) - 支付分解顯示
- `tithingPdfGenerator.js` - PDF 報告生成 (奉獻報告)
- `paymentCalculationUtils.js` (16 KB) - 核心計算邏輯
  - 現金/支票分離計算
  - 數據驗證

#### 認證和上下文
- `AuthContext.jsx` (144 行) - 認證管理
  - 登入、註冊、登出、權限檢查
  - 支持 Email + Password 和 Google OAuth
  
- `LoginModal.jsx` - 登入模態框
- `ProfileMenu.jsx` (9.6 KB) - 用戶菜單
  - 姓名編輯、通知偏好設定、登出

#### 通用組件
- `ThemeContext.jsx` (1.8 KB) - 深色/淺色模式
- `ThemeSwitcher.jsx` (1.3 KB) - 主題切換器
- `ToastNotification.jsx` (3.9 KB) - 通知系統

#### 配置文件
- `firebaseConfig.js` - Firebase 初始化
- `acount_catagory.json` (2.9 KB) - 會計科目配置
  - 層級結構: 2.3 行政費、2.4 事工、2.5 其他
  - 支持多層嵌套

---

## 3. 後端 API 端點清單 (14 個端點)

### 3.1 健康檢查
```
GET /api/health
```

### 3.2 用戶管理 (3 個端點)
```
GET    /api/users                              - 獲取所有用戶 (需認證)
GET    /api/users/reimbursement-contacts      - 獲取報帳人清單 (需認證)
PUT    /api/user/preferences                  - 更新用戶通知偏好 (需認證)
```

### 3.3 採購需求管理 (5 個端點)
```
POST   /api/requirements                      - 創建採購需求 (需認證)
GET    /api/requirements                      - 獲取所有採購需求 (需認證)
PUT    /api/requirements/:id                  - 更新採購需求 (需認證)
PUT    /api/requirements/:id/transfer         - 轉移報帳負責人 (需認證)
DELETE /api/requirements/:id                  - 刪除採購需求 (需認證)
```

### 3.4 留言系統 (2 個端點)
```
POST   /api/requirements/:reqId/comments      - 新增留言 (需認證)
DELETE /api/requirements/:reqId/comments/:commentId - 刪除留言 (需認證)
```

### 3.5 奉獻任務管理 (3 個端點)
```
GET    /api/tithe-tasks                       - 獲取奉獻任務 (需 finance_staff/treasurer)
POST   /api/tithe-tasks                       - 創建奉獻任務 (需 finance_staff/treasurer)
GET    /api/finance-staff                     - 獲取財務同工列表 (需 finance_staff/treasurer)
```

### 3.6 可呼叫雲函式 (2 個)
```
completeTithingTask    - 完成奉獻任務並計算匯總 (Client → Firebase)
getUserDisplayName     - 獲取用戶顯示名稱 (Client → Firebase)
```

### 3.7 觸發器 (1 個)
```
createuserprofile      - 用戶註冊時自動創建用戶資料
```

---

## 4. Firestore 數據結構

### 4.1 主要 Collections

#### users 集合
```javascript
{
  uid: "firebase_uid",
  email: "user@example.com",
  displayName: "使用者名稱",
  status: "approved" | "pending",           // 使用者狀態
  roles: ["admin", "finance_staff", ...],   // 角色陣列
  wantsNewRequestNotification: boolean,     // 新申請通知
  wantsPurchaseCompleteNotification: boolean, // 採購完成通知
  createdAt: timestamp
}
```

**允許的角色:**
- `admin` - 管理員 (完全權限)
- `finance_staff` - 財務同工
- `treasurer` - 財務主管
- `reimbursementContact` - 報帳聯絡人
- `user` - 普通使用者

#### requirements 集合 (採購需求)
```javascript
{
  id: "doc_id",
  userId: "creator_uid",
  requesterName: "申請人名稱",
  text: "物品名稱",                          // 必填
  description: "規格說明",                   // 選填
  accountingCategory: "2.3.1",               // 會計科目
  priority: "general" | "urgent",            // 優先級
  status: "pending" | "purchased",           // 狀態
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // 採購資訊 (當 status = "purchased" 時才有)
  purchaseAmount: number,                    // 購買金額
  purchaseDate: "2024-01-01",               // 購買日期
  purchaserId: "uid",                        // 購買人 ID
  purchaserName: "購買人名稱",
  purchaseNotes: "購買備註",                 // 最多 500 字
  reimbursementerId: "uid",                  // 報帳負責人 ID
  reimbursementerName: "報帳人名稱",
  
  // 子集合: comments
  comments: [
    {
      id: "comment_id",
      userId: "commenter_uid",
      authorName: "評論者名稱",
      text: "評論文本",
      createdAt: timestamp
    }
  ]
}
```

#### tithe 集合 (奉獻任務)
```javascript
{
  id: "task_id",
  treasurerUid: "uid",                       // 司庫 UID
  treasurerName: "司庫名稱",
  financeStaffUid: "uid",                    // 財務同工 UID
  financeStaffName: "財務同工名稱",
  status: "in-progress" | "completed",       // 任務狀態
  calculationTimestamp: timestamp,           // 計算時間
  
  // 完成後的聚合結果 (status = "completed" 時才有)
  summary: {
    totalAmount: number,                     // 總金額
    byCategory: {
      "十一": 1000,
      "感恩": 500,
      ...
    }
  },
  completedAt: timestamp
  
  // 子集合: dedications (奉獻記錄)
  dedications: [
    {
      id: "dedication_id",
      dedicationDate: "2024-01-01",
      dedicatorId: "B0001",                  // 奉獻者代號
      dedicationCategory: "十一",             // 奉獻科目
      amount: 1000,                          // 奉獻金額
      method: "cash" | "cheque",             // 方式
      createdAt: timestamp
    }
  ]
}
```

### 4.2 會計科目結構 (acount_catagory.json)
```json
[
  {
    "code": "2.3",
    "name": "行政費",
    "children": [
      { "code": "2.3.1", "name": "文具印刷" },
      { "code": "2.3.2", "name": "交通費" },
      { "code": "2.3.3", "name": "郵電費", "children": [...] },
      // ... 更多子科目
    ]
  },
  {
    "code": "2.4",
    "name": "事工",
    "children": [
      { "code": "2.4.1", "name": "愛宴餐點費" },
      // ... 更多子科目
    ]
  },
  { "code": "2.5", "name": "其他" }
]
```

---

## 5. Firestore 安全規則

### 5.1 權限規則總結
```firestore
users 集合:
- 讀取: 本人或管理員
- 創建/刪除: 管理員
- 更新: 本人 (但不能改 roles/status) 或管理員

requirements 集合:
- 讀取: 已認證用戶
- 創建: 已認證用戶 (userId == auth.uid)
- 更新/刪除: 創建者本人

tithe 集合:
- 讀取: finance_staff、treasurer、admin
- 寫入: 分配者或管理員
- dedications 子集合: 繼承父層邏輯
```

---

## 6. Email 通知系統

### 6.1 使用的技術
- **提供者:** Gmail API (OAuth2)
- **環境變數:**
  - `GMAIL_CLIENT_ID`
  - `GMAIL_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`
  - `GMAIL_SENDER`

### 6.2 通知類型

#### 1. 新採購申請通知
- **觸發:** 創建新的 pending 狀態採購需求
- **收件人:** 訂閱 `wantsNewRequestNotification = true` 的用戶
- **內容:** 申請人、品項、規格、科目、優先級

#### 2. 採購完成通知
- **觸發:** 採購需求狀態從 pending 改為 purchased
- **收件人:** 原始申請人 (如果 `wantsPurchaseCompleteNotification = true`)
- **內容:** 品項、規格、科目、金額、購買人、購買日期

---

## 7. 核心業務邏輯

### 7.1 採購流程
1. 用戶創建採購申請 (status = pending)
   - 可立即標記為已購買 (status = purchased)
   
2. 觸發新申請通知給訂閱用戶

3. 採購人員完成購買
   - 更新狀態為 purchased
   - 填入金額、日期、購買備註
   - 分配報帳負責人

4. 報帳負責人可轉移職責給其他報帳聯絡人

5. 生成採購憑證 PDF (客戶端)

### 7.2 奉獻計算流程
1. 司庫創建奉獻任務
   - 選擇財務同工進行計算

2. 財務同工/司庫逐筆輸入奉獻記錄
   - 奉獻日期、奉獻者代號、科目、金額、方式

3. 完成任務
   - 計算現金和支票分離統計
   - 按科目聚合匯總
   - 生成奉獻報告 PDF

4. 結果驗證和一致性檢查

### 7.3 支付計算邏輯 (paymentCalculationUtils.js)
- **現金 vs 支票分離**
  - 分別統計現金和支票
  - 確保數據驗證 (金額 > 0, 方式有效, 科目有效)

- **聚合統計**
  - 按奉獻科目分類統計
  - 計算總金額

---

## 8. 認證和授權

### 8.1 認證流程
1. Firebase Authentication (Email/Password 或 Google OAuth)
2. 登入時獲取 ID Token
3. 每個 API 請求的 Authorization header 中攜帶 Bearer token
4. 後端驗證 Token 並檢查用戶狀態 (status = "approved")

### 8.2 權限檢查
- **verifyFirebaseToken** 中間件: 驗證 token 和用戶狀態
- **verifyRole** 中間件: 驗證用戶角色
- **Firestore Rules**: 數據庫級別的訪問控制

---

## 9. 主要功能清單

### 9.1 採購系統功能
- [x] 創建採購申請
- [x] 編輯採購申請
- [x] 刪除採購申請
- [x] 標記為已購買 (含金額、日期、備註)
- [x] 撤銷購買 (恢復為 pending)
- [x] 轉移報帳負責人
- [x] 留言系統
- [x] 搜尋和篩選
- [x] 列表/網格視圖切換
- [x] 批量匯出功能
- [x] 生成購買憑證 PDF
- [x] Email 通知

### 9.2 奉獻系統功能
- [x] 創建奉獻任務
- [x] 輸入奉獻記錄
- [x] 現金/支票分離計算
- [x] 按科目聚合統計
- [x] 完成任務並生成報告
- [x] 生成奉獻報告 PDF
- [x] 結果驗證

### 9.3 用戶系統功能
- [x] 用戶註冊
- [x] 用戶登入 (Email/Google)
- [x] 用戶登出
- [x] 編輯用戶名稱
- [x] 通知偏好設定
- [x] 深色/淺色模式切換
- [x] 角色管理 (後台)

---

## 10. Google Apps Script 遷移策略

### 10.1 遷移範圍

#### 可遷移到 Google Sheets
1. **採購申請數據** → Google Sheet
   - 搜尋、篩選、排序
   - 匯出功能

2. **奉獻記錄** → Google Sheet
   - 現金/支票分離統計
   - 按科目聚合

3. **自動化工作流**
   - 新申請通知 → Email 或 Google Chat
   - 購買完成提醒

#### 需要保留的功能
1. 實時登入和認證 (需要 Firebase 或替代方案)
2. PDF 生成 (可用 Google Docs API)
3. 複雜的 Email 模板 (可遷移到 Google Apps Script)

### 10.2 遷移架構建議
```
Google Apps Script Solution
├── Google Sheets
│   ├── 採購申請工作表
│   ├── 奉獻記錄工作表
│   ├── 用戶設定表
│   └── 統計儀表板
├── Apps Script
│   ├── onEdit() 觸發器 - 自動計算
│   ├── 定時觸發器 - 定期同步
│   ├── Email 發送邏輯
│   └── PDF 生成
└── Google Forms
    ├── 採購申請表單
    └── 奉獻記錄表單
```

### 10.3 遷移步驟
1. **第一階段:** 搭建 Google Sheets 架構
   - 設計工作表結構
   - 創建數據驗證規則

2. **第二階段:** 開發 Apps Script
   - 表單提交自動化
   - 數據聚合和計算
   - Email 通知

3. **第三階段:** 集成 API
   - Firebase 認證集成 (如適用)
   - 與現有系統同步

4. **第四階段:** 測試和優化
   - 性能測試
   - 權限管理測試

---

## 11. 數據遷移計劃

### 11.1 需要遷移的數據
1. **Users** - 用戶和角色資訊
2. **Requirements** - 所有採購申請
3. **Comments** - 採購申請留言
4. **Tithe Tasks** - 奉獻任務記錄
5. **Dedications** - 奉獻記錄

### 11.2 遷移方式
- 使用 Firebase Export 功能導出 JSON
- 轉換為 CSV 格式
- 導入到 Google Sheets

---

## 12. 文件大小統計

| 組件 | 大小 | 行數 |
|---|---|---|
| PurchaseRequestBoard.jsx | 181 KB | ~3000+ |
| functions/index.js | - | 1171 |
| 前端文件總計 | ~500 KB | ~8000+ |
| 後端文件總計 | ~50 KB | 1171 |

---

## 13. 測試覆蓋

### 13.1 前端測試 (38 個測試文件)
- 組件功能測試
- API 集成測試
- 深色模式測試
- 無障礙功能測試
- 響應式設計測試

### 13.2 後端測試
- API 端點測試
- 轉移權限測試

---

## 14. 環境配置

### 14.1 開發環境
- Vite 開發伺服器 (port 5173)
- Firebase Functions 模擬器 (port 5001)
- Firestore 模擬器 (port 8080)

### 14.2 部署環境
- Firebase Hosting
- Cloud Functions

---

## 15. 依賴清單

### 15.1 前端依賴
- react@18.3.1
- react-dom@18.3.1
- react-router-dom@7.6.2
- axios@1.7.2
- firebase@11.10.0
- lucide-react@0.395.0
- jspdf@3.0.1
- jspdf-autotable@5.0.2
- tailwindcss@3.4.3

### 15.2 後端依賴
- express@4.19.2
- firebase-admin@12.1.1
- firebase-functions@5.1.0
- googleapis@153.0.0

---

## 16. 關鍵代碼示例

### 16.1 API 認證示例
```javascript
// 後端中間件
const verifyFirebaseToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  
  // 檢查用戶狀態
  const userDoc = await db.collection('users').doc(decodedToken.uid).get();
  if (userDoc.data().status !== 'approved') {
    return res.status(403).json({ code: 'ACCOUNT_NOT_APPROVED' });
  }
  
  req.user = { ...decodedToken, ...userDoc.data() };
  next();
};
```

### 16.2 支付計算示例
```javascript
// 支付分離計算
const calculatePaymentBreakdown = (dedications) => {
  const summary = { totalAmount: 0, byCategory: {} };
  
  dedications.forEach(d => {
    summary.totalAmount += d.amount;
    summary.byCategory[d.dedicationCategory] = 
      (summary.byCategory[d.dedicationCategory] || 0) + d.amount;
  });
  
  return summary;
};
```

---

## 17. 總結

### 17.1 項目特點
- ✅ 完整的權限管理系統
- ✅ 實時數據同步
- ✅ 複雜的業務邏輯 (支付計算)
- ✅ Email 自動化
- ✅ PDF 生成
- ✅ 離線支持 (Firebase 實時監聽)

### 17.2 遷移難度
- **採購系統:** 中等難度 (需要表單 + 自動化)
- **奉獻系統:** 中等難度 (需要複雜計算邏輯)
- **認證系統:** 高難度 (可能需要第三方服務)
- **Email 通知:** 低難度 (Apps Script 原生支持)

### 17.3 建議
1. 優先遷移採購和奉獻的數據存儲層
2. 保留 Firebase Authentication (或使用 Google 帳號)
3. 使用 Google Sheets 作為主要數據存儲
4. 使用 Apps Script 實現業務邏輯和自動化
5. 考慮使用 Google Cloud 作為後端替代方案

