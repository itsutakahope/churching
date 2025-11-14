# 教會管理系統 - 詳細功能與實現清單

## A. 採購系統詳細功能

### A.1 採購申請生命週期

```
創建 (pending)
    ↓ (可直接購買)
創建 (purchased) ← 編輯 (pending 變更為 purchased)
    ↓
購買完成 (含金額、日期、備註)
    ↓
報帳流程 (可轉移給其他報帳人)
    ↓
撤銷購買 (revert to pending)
```

### A.2 採購申請數據字段

| 字段 | 類型 | 必填 | 説明 |
|---|---|---|---|
| text | string | ✓ | 物品名稱 |
| description | string | | 規格/詳細說明 |
| accountingCategory | string | | 會計科目代碼 (2.3.1) |
| priority | enum | | "general" 或 "urgent" |
| status | enum | | "pending" 或 "purchased" |
| purchaseAmount | number | 條件 | 當 status="purchased" 時必填 |
| purchaseDate | date | 條件 | 當 status="purchased" 時必填 |
| purchaserId | string | 條件 | 當 status="purchased" 時必填 |
| purchaseNotes | string | | 購買備註 (最多 500 字) |
| reimbursementerId | string | 條件 | 當 status="purchased" 時必填 |
| reimbursementerName | string | 條件 | 當 status="purchased" 時必填 |
| createdAt | timestamp | | 創建時間 (自動) |
| updatedAt | timestamp | | 更新時間 (自動) |

### A.3 PurchaseRequestBoard 主要功能

#### 視圖模式
- 列表視圖 (預設)
- 網格視圖 (可切換)

#### 篩選功能
- 狀態篩選 (pending/purchased)
- 優先級篩選 (general/urgent)
- 科目篩選 (多選)
- 申請人篩選 (搜尋)
- 日期範圍篩選

#### 搜尋功能
- 按物品名稱搜尋
- 按描述搜尋
- 按申請人名稱搜尋

#### 批量操作
- 批量選擇採購紀錄
- 批量匯出 (CSV/Excel)

#### 留言系統
- 添加留言 (支持 Markdown 連結)
- 刪除留言 (僅自己的)
- 實時更新

### A.4 PurchaseRequestBoard 狀態管理

```javascript
// 主要狀態
const [requests, setRequests] = useState([]);           // 採購申請
const [purchaseRecords, setPurchaseRecords] = useState([]);  // 購買紀錄
const [viewMode, setViewMode] = useState('list');       // 視圖模式
const [showModal, setShowModal] = useState(false);       // 添加申請
const [showPurchaseModal, setShowPurchaseModal] = useState(false); // 標記購買
const [showRecordsModal, setShowRecordsModal] = useState(false);   // 購買紀錄
const [selectedRecordIds, setSelectedRecordIds] = useState(new Set()); // 批量選擇
```

### A.5 轉帳/報帳流程

1. 採購人員標記為已購買時分配報帳人
2. 報帳人可轉移責任給其他有 reimbursementContact 角色的人
3. 轉移時需驗證目標人員的角色
4. 使用 Firestore Transaction 確保原子性

### A.6 會計科目管理

**層級結構:**
```
2.3 行政費
  ├─ 2.3.1 文具印刷
  ├─ 2.3.2 交通費
  ├─ 2.3.3 郵電費
  │  ├─ 1 電話網路費
  │  └─ 2 郵資費&匯費
  ├─ 2.3.4 修繕費
  │  ├─ 1 維修費
  │  └─ 2 裝潢費
  └─ 2.3.5 水電費
     ├─ 1 水
     ├─ 2 電
     └─ 3 瓦斯

2.4 事工
  ├─ 2.4.1 愛宴餐點費
  ├─ 2.4.2 主日
  │  ├─ 1 聖餐
  │  ├─ 2 花藝
  │  └─ 3 茶水/點心
  ├─ 2.4.3 外展英語
  ├─ 2.4.4 外展特約費
  ├─ 2.4.5 講座-家庭
  ├─ 2.4.6 教育事工
  │  ├─ 1 成主教材
  │  ├─ 2 兒主教材
  │  ├─ 3 老師訓練
  │  └─ 4 圖書費
  ├─ 2.4.7 外請講員費
  ├─ 2.4.8 兒童事工
  ├─ 2.4.12 節慶
  │  ├─ 1 聖誕節
  │  ├─ 2 復活節
  │  ├─ 3 母親節
  │  ├─ 4 父親節
  │  ├─ 5 感恩節
  │  └─ 6 音樂事工
  ├─ 2.4.13 慈善支出
  ├─ 2.4.14 教會退修會
  └─ 2.4.15 團契事工
     ├─ 1 弟兄
     ├─ 2 姊妹
     ├─ 3 青年
     ├─ 4 青少年
     ├─ 5 松柏
     └─ 6 葡萄樹

2.5 其他
```

---

## B. 奉獻系統詳細功能

### B.1 奉獻任務生命週期

```
創建任務 (in-progress)
    ↓
添加奉獻記錄 (逐筆或批量)
    ↓
查看統計匯總 (實時計算)
    ↓
完成任務 (completed)
    ↓
生成報告 PDF
    ↓
驗證結果一致性
```

### B.2 奉獻記錄字段

| 字段 | 類型 | 必填 | 説明 |
|---|---|---|---|
| dedicationDate | date | ✓ | 奉獻日期 |
| dedicatorId | string | ✓ | 奉獻者代號 (如 B0001) |
| dedicationCategory | string | ✓ | 奉獻科目 |
| amount | number | ✓ | 奉獻金額 (> 0) |
| method | enum | ✓ | "cash" 或 "cheque" |
| createdAt | timestamp | | 記錄時間 (自動) |

### B.3 奉獻科目列表

```javascript
const DEDICATION_CATEGORIES = [
  "十一",    // Tithe - 十分之一奉獻
  "感恩",    // Thanksgiving
  "主日",    // Sunday service offering
  "宣教",    // Mission
  "特別",    // Special purpose
  "專案",    // Project
  "裝潢",    // Decoration/Renovation
  "指定",    // Designated
  "慈惠",    // Benevolence
  "植堂"     // Church planting
];
```

### B.4 支付方式

- **現金** (cash) - 立即可用
- **支票** (cheque) - 需要額外處理

### B.5 DedicationEntryForm 功能

```javascript
// 表單字段
dedicationDate      // 日期選擇器
dedicatorId         // 文本輸入 (代號)
dedicationCategory  // 下拉選擇
amount              // 數字輸入
method              // 單選按鈕 (cash/cheque)

// 驗證規則
- 奉獻者代號: 不能為空
- 金額: 必須 > 0, 必須是有效數字
- 方式: 必須是 cash 或 cheque
- 科目: 必須從列表中選擇
- 日期: 必須是有效日期
```

### B.6 AggregationSummary 計算

```javascript
// 計算邏輯
summarizedByCategory = {
  "十一": { cash: 1000, cheque: 500, total: 1500 },
  "感恩": { cash: 200, cheque: 0, total: 200 },
  ...
}

totalAmount = sum(所有 amount)
totalCash = sum(method == "cash" 的 amount)
totalCheque = sum(method == "cheque" 的 amount)

// 驗證
totalCash + totalCheque === totalAmount
```

### B.7 PaymentBreakdownDisplay 顯示

```
現金總計:        ¥1,000
支票總計:        ¥500
總計:            ¥1,500

按科目分解:
十一:            ¥1,500
感恩:            ¥200
...
```

### B.8 完成任務流程

1. 點擊 "完成計算" 按鈕
2. 觸發 `completeTithingTask` 可呼叫函式
3. 後端計算聚合結果
4. 儲存 summary 和 status = "completed"
5. 前端自動生成 PDF 報告

---

## C. 認證和權限系統

### C.1 登入流程

```
用戶點擊 "登入"
    ↓
打開登入模態框
    ↓
選擇登入方式:
  ├─ Email + Password
  └─ Google OAuth
    ↓
驗證 Firebase Auth
    ↓
獲取 ID Token
    ↓
檢查 Firestore 用戶狀態
    ↓
如果 status != "approved" → 拒絕存取
    ↓
登入成功 → 重定向到 /purchase
```

### C.2 角色和權限映射

```javascript
const rolePermissions = {
  'admin': {
    // 完全權限
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canManageUsers: true,
    canManageRoles: true
  },
  'finance_staff': {
    canViewTithing: true,
    canCreateTasks: true,
    canEditTasks: true,
    canCompleteTasks: true
  },
  'treasurer': {
    canViewTithing: true,
    canCreateTasks: true,
    canEditTasks: true,
    canCompleteTasks: true
  },
  'reimbursementContact': {
    canTransferReimbursement: true,
    canViewOwnRequirements: true,
    canViewPurchaseRecords: true
  },
  'user': {
    canCreateRequirements: true,
    canEditOwnRequirements: true,
    canDeleteOwnRequirements: true,
    canCommentOnRequirements: true,
    canViewRequirements: true
  }
};
```

### C.3 用戶狀態

```
pending (待批准) → approved (已批准)
                 ↗ 管理員批准
                    (在 Firestore 中手動設置)
```

### C.4 ProfileMenu 功能

```javascript
// 用戶菜單選項
1. 編輯姓名
   - 點擊 "編輯"
   - 輸入新姓名
   - 點擊 "保存" 或 "取消"

2. 通知偏好設定
   - 新採購申請通知 (checkbox)
   - 採購完成通知 (checkbox)
   - 保存時自動同步

3. 深色/淺色模式切換
   - 切換按鈕
   - 狀態保存到本地儲存

4. 登出
   - 點擊 "登出"
   - 清除本地狀態
   - 重定向到 /purchase
```

---

## D. Email 通知系統詳細

### D.1 新採購申請通知

**觸發條件:**
- 創建新的採購申請
- status = "pending"
- 非空用戶具有 wantsNewRequestNotification = true

**郵件内容:**
```html
主題: [新採購申請] {申請人名稱} 申請了 {品項名稱}

內容:
您好,

系統收到一筆新的採購申請，詳情如下：

申請人: {requesterName}
品項: {text}
規格/描述: {description}
會計科目: {accountingCategory}
優先級: {priority}

請至採購板查看詳情。

(此為系統自動發送郵件，請勿回覆)
```

### D.2 採購完成通知

**觸發條件:**
- 採購申請狀態從 pending 改為 purchased
- 原始申請人具有 wantsPurchaseCompleteNotification = true

**郵件内容:**
```html
主題: [採購完成] 您的申請「{品項名稱}」已由 {購買人名稱} 完成購買

內容:
您好 {申請人名稱},

您申請的採購項目已完成購買，詳情如下：

品項名稱: {text}
規格/描述: {description}
會計科目: {accountingCategory}
購買金額: ¥{purchaseAmount}
購買人: {purchaserName}
購買日期: {purchaseDate}
購買備註: {purchaseNotes}

感謝您使用採購管理系統。

(此為系統自動發送郵件，請勿回覆)
```

### D.3 Email 編碼

- Subject: Base64 編碼 (UTF-8)
- From: RFC 2047 編碼 (UTF-8)
- Body: HTML 格式 with UTF-8 charset

---

## E. PDF 生成功能

### E.1 採購憑證 PDF (pdfGenerator.js)

**頁面內容:**
```
┌─────────────────────────────────┐
│        採購憑證 (Receipt)        │
├─────────────────────────────────┤
│ 品項: {text}                    │
│ 規格: {description}             │
│ 科目: {accountingCategory}      │
│ 金額: ¥{purchaseAmount}         │
│ 購買人: {purchaserName}         │
│ 日期: {purchaseDate}            │
│                                  │
│ 簽名區域 (空白線)               │
│ 經手人簽署: _____________       │
│ 日期: _____________             │
│                                  │
│ 報帳人簽署: _____________       │
│ 日期: _____________             │
└─────────────────────────────────┘
```

### E.2 奉獻報告 PDF (tithingPdfGenerator.js)

**頁面內容:**
```
┌──────────────────────────────────┐
│      奉獻計算報告 (Tithing Report) │
├──────────────────────────────────┤
│ 司庫: {treasurerName}             │
│ 財務同工: {financeStaffName}      │
│ 日期: {calculationTimestamp}      │
│                                   │
│ 統計匯總:                         │
│ 現金: ¥{totalCash}               │
│ 支票: ¥{totalCheque}             │
│ 合計: ¥{totalAmount}             │
│                                   │
│ 按科目分類:                       │
│ 十一: ¥{amount}                  │
│ 感恩: ¥{amount}                  │
│ ...                              │
│                                   │
│ 詳細記錄表 (列表)                 │
│ 日期 | 代號 | 科目 | 金額 | 方式 │
│ ... | ... | ... | ... | ...    │
│                                   │
│ 一致性驗證: ✓ PASS               │
└──────────────────────────────────┘
```

---

## F. 數據驗證邏輯

### F.1 paymentCalculationUtils.js 驗證函數

```javascript
// 驗證奉獻記錄
export const validateDedication = (dedication, index) => {
  const result = { isValid: false, errors: [] };
  
  // 檢查對象
  if (!dedication || typeof dedication !== 'object') {
    result.errors.push('記錄不是有效的物件');
    return result;
  }
  
  // 檢查 amount
  if (typeof dedication.amount !== 'number') {
    result.errors.push('金額必須是數字');
  } else if (dedication.amount <= 0) {
    result.errors.push('金額必須大於 0');
  } else if (!isFinite(dedication.amount)) {
    result.errors.push('金額必須是有限數值');
  }
  
  // 檢查 method
  if (!['cash', 'cheque'].includes(dedication.method)) {
    result.errors.push('奉獻方式必須是 cash 或 cheque');
  }
  
  // 檢查其他必填字段
  // ...
  
  result.isValid = result.errors.length === 0;
  return result;
};
```

### F.2 採購申請驗證

```javascript
// 後端驗證
if (!text) {
  return res.status(400).json({ message: 'Text (title) is required' });
}

if (status === 'purchased') {
  if (typeof purchaseAmount !== 'number' || purchaseAmount <= 0) {
    return res.status(400).json({ 
      message: 'A valid purchaseAmount is required for purchased status.' 
    });
  }
}

// 購買備註淨化
const sanitizePurchaseNotes = (notes) => {
  if (!notes || typeof notes !== 'string') return null;
  
  // 移除 HTML 標籤
  const cleanNotes = notes.replace(/<[^>]*>/g, '');
  
  // 限制長度 (500 字)
  const trimmedNotes = cleanNotes.trim().substring(0, 500);
  
  return trimmedNotes || null;
};
```

---

## G. 實時數據同步

### G.1 Firestore 監聽器模式

```javascript
// 採購申請
const unsubscribe = onSnapshot(
  collection(firestore, 'requirements'),
  (snapshot) => {
    const requirements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setRequests(requirements);
  }
);

// 奉獻記錄
const unsubscribe = onSnapshot(
  collection(firestore, 'tithe', taskId, 'dedications'),
  (snapshot) => {
    const dedications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setDedications(dedications);
  }
);

// 清理監聽器
return () => unsubscribe();
```

### G.2 樂觀更新模式 (EditRequestModal)

```javascript
// 1. 立即更新本地狀態 (樂觀)
setLocalRequest(updatedData);

// 2. 向後端發送請求
await axios.put(`/api/requirements/${id}`, updateData);

// 3. 如果失敗，回滾
if (error) {
  setLocalRequest(originalData);
  showError(error.message);
}
```

---

## H. 組件通信和狀態管理

### H.1 Context 提供者

```javascript
// AuthContext
{
  currentUser,           // Firebase User
  userProfile,           // Firestore 用戶文件
  login(),              // Email 登入
  signInWithGoogle(),   // Google 登入
  logout(),             // 登出
  signUp(),             // 註冊
  updateUserProfile(),  // 編輯名稱
  updateUserPreferences(), // 更新通知偏好
  isReimburser,         // 檢查是否有報帳權限
  userRoles            // 用戶角色陣列
}

// ThemeContext
{
  theme,                // 'light' 或 'dark'
  toggleTheme()         // 切換主題
}
```

### H.2 Props 傳遞模式

```javascript
// 父組件傳遞 props 給子組件
<DedicationEntryForm
  taskId={taskId}
  onAddDedication={handleAddDedication}
/>

// 子組件調用父組件回調
await onAddDedication(newDedication);
```

---

## I. 錯誤處理模式

### I.1 API 請求錯誤處理

```javascript
try {
  const response = await axios.get('/api/requirements', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  setRequests(response.data);
} catch (err) {
  // 伺服器回應錯誤
  if (err.response) {
    const code = err.response.data?.code;
    if (code === 'ACCOUNT_NOT_APPROVED') {
      showError('您的帳號尚未被管理員批准');
    } else {
      showError(err.response.data?.message || '請求失敗');
    }
  }
  // 網路請求失敗
  else if (err.request) {
    showError('網路連接失敗，請檢查您的連接');
  }
  // 其他未知錯誤
  else {
    showError('發生未知錯誤，請稍後重試');
  }
}
```

### I.2 後端錯誤碼

```javascript
// 定義的錯誤碼
'ACCOUNT_NOT_APPROVED'      // 帳號未批准
'INSUFFICIENT_PERMISSIONS' // 權限不足
'NOT_FOUND'                // 資源不存在
'ALREADY_PURCHASED'        // 已被他人購買
'PERMISSION_DENIED'        // 無權執行此操作
'INVALID_AMOUNT'           // 金額無效
'INVALID_REQUEST_DATA'     // 請求數據無效
'INVALID_TARGET_USER'      // 目標用戶無效
'DATABASE_ERROR'           // 數據庫錯誤
```

---

## J. 深色模式支持

### J.1 CSS 類名約定

```tailwind
bg-cloud-white dark:bg-dark-background
text-graphite-700 dark:text-dark-text-main
border-gray-300 dark:border-graphite-600
hover:bg-glory-red-50 dark:hover:bg-dark-surface
```

### J.2 顏色系統

**淺色模式:**
- 背景: cloud-white (#F5F5F5)
- 文本: graphite-700 (#3D3D3D)
- 強調: glory-red-500 (#C41E3A)

**深色模式:**
- 背景: dark-background (#1A1A1A)
- 文本: dark-text-main (#E5E5E5)
- 強調: dark-primary (#DC3545)

---

## K. 響應式設計

### K.1 斷點

```tailwind
sm: 640px   (小螢幕)
md: 768px   (中等螢幕)
lg: 1024px  (大螢幕)
xl: 1280px  (特大螢幕)
```

### K.2 佈局調整

```javascript
// PurchaseRequestBoard
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

// DedicationEntryForm
grid-cols-1 md:grid-cols-2 lg:grid-cols-5

// 導航
header: flex md:grid md:cols-3
```

---

## L. 測試覆蓋範圍

### L.1 前端測試類型

1. **功能測試** (*.test.jsx)
   - 組件渲染
   - 用戶交互
   - 狀態更新

2. **集成測試** (api-integration.test.jsx)
   - API 調用
   - 數據流

3. **視覺測試** (dark-mode-*.test.jsx)
   - 深色模式渲染
   - 樣式應用

4. **無障礙測試** (accessibility.test.jsx)
   - ARIA 屬性
   - 鍵盤導航

5. **響應式測試** (*-responsive.test.jsx)
   - 不同螢幕尺寸
   - 佈局調整

### L.2 後端測試

- transfer-api.test.js - 報帳轉移 API 測試

---

## M. 性能優化

### M.1 前端優化

- React.lazy() 路由分割
- useMemo() 減少計算
- useCallback() 穩定函數引用
- 虛擬化列表 (大量數據)

### M.2 後端優化

- Firestore 索引優化
- 批量操作 (batch writes)
- 交易 (transactions) 確保原子性
- 非同步 Email 發送 (不阻塞響應)

---

## N. 安全考慮

### N.1 前端安全

- Firebase Token 驗證
- XSS 防護 (HTML 淨化)
- CSRF Token (在 axios 請求中自動)

### N.2 後端安全

```javascript
// 淨化購買備註
const sanitizePurchaseNotes = (notes) => {
  const cleanNotes = notes.replace(/<[^>]*>/g, '');
  return cleanNotes.trim().substring(0, 500);
};

// 驗證報帳人角色
if (!targetUserRoles.includes('reimbursementContact')) {
  throw new Error('INVALID_TARGET_USER');
}

// 檢查用戶批准狀態
if (userDoc.data().status !== 'approved') {
  return res.status(403).json({ code: 'ACCOUNT_NOT_APPROVED' });
}
```

---

## O. 部署和維護

### O.1 構建命令

```bash
# 開發
npm run dev           # 啟動前端和後端模擬器
npm run dev:client   # 只啟動前端

# 測試
npm test             # 運行測試
npm run test:watch  # 監視模式

# 生產
npm run build        # 構建前端
npm run deploy:hosting  # 部署到 Firebase Hosting
```

### O.2 環境變數

**前端 (.env):**
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**後端 (firebase.json 參數):**
```
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
GMAIL_SENDER
```

