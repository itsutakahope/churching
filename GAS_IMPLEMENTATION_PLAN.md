# Google Apps Script 完全遷移實施計劃（方案 A）

**專案名稱**: 教會管理系統 (Churching)
**遷移方式**: Firebase → Google Apps Script (完全遷移)
**實施日期**: 2025-11-14
**優先順序**: 採購板 → 奉獻計算

---

## 一、架構設計

### 整體架構
```
┌─────────────────────────────────────────────┐
│         Google Sheets (資料庫)              │
│  ├─ Users (使用者表)                        │
│  ├─ Requirements (採購申請表)               │
│  ├─ Comments (留言表)                       │
│  ├─ Tithe (奉獻任務表)                      │
│  ├─ Dedications (奉獻記錄表)                │
│  └─ Config (系統設定表)                     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Google Apps Script (後端邏輯)          │
│  ├─ Web App (doGet/doPost)                  │
│  ├─ API 端點 (RESTful)                      │
│  ├─ 資料存取層 (DAO)                        │
│  ├─ 業務邏輯層 (Service)                    │
│  ├─ 權限檢查 (Authorization)                │
│  ├─ 觸發器 (onEdit, timeBased)              │
│  └─ 工具函式 (Utils)                        │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│       前端 UI (HTML Service)                │
│  ├─ 採購板介面                               │
│  ├─ 奉獻計算介面                             │
│  ├─ 使用者管理介面                           │
│  └─ Tailwind CSS (CDN)                      │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Google 服務整合                      │
│  ├─ Gmail API (Email 通知)                  │
│  ├─ Google Docs API (PDF 生成)              │
│  ├─ Google Drive API (檔案存儲)             │
│  └─ Session Service (使用者身份驗證)        │
└──────────────────────────────────────────────┘
```

---

## 二、Google Sheets 資料結構設計

### Sheet 1: Users（使用者表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| id | 文字 | 唯一識別碼 (UUID) | `user_001` |
| email | 文字 | Google 帳號 Email | `user@example.com` |
| displayName | 文字 | 顯示名稱 | `王小明` |
| roles | 文字 | 角色（逗號分隔） | `admin,finance_staff` |
| status | 文字 | 狀態 | `approved`/`pending` |
| wantsNewRequestNotification | 布林 | 新申請通知 | `TRUE`/`FALSE` |
| wantsPurchaseCompleteNotification | 布林 | 完成通知 | `TRUE`/`FALSE` |
| createdAt | 日期時間 | 建立時間 | `2025-11-14 10:00:00` |
| lastLoginAt | 日期時間 | 最後登入 | `2025-11-14 15:30:00` |

**索引欄位**: email（唯一）

---

### Sheet 2: Requirements（採購申請表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| id | 文字 | 唯一識別碼 | `req_001` |
| userId | 文字 | 申請人 ID | `user_001` |
| requesterName | 文字 | 申請人名稱 | `王小明` |
| text | 文字 | 品項 | `影印紙 A4` |
| description | 文字 | 規格說明 | `500 張/包，共 10 包` |
| accountingCategory | 文字 | 會計科目 | `2.3.1 文具印刷` |
| priority | 文字 | 優先級 | `normal`/`urgent` |
| status | 文字 | 狀態 | `pending`/`purchased`/`cancelled` |
| purchaseAmount | 數字 | 購買金額 | `1500` |
| purchaseDate | 日期 | 購買日期 | `2025-11-14` |
| purchaserId | 文字 | 購買人 ID | `user_002` |
| purchaserName | 文字 | 購買人名稱 | `李小華` |
| purchaseNotes | 文字 | 購買備註 | `已於 7-11 購買` |
| reimbursementerId | 文字 | 報帳人 ID | `user_003` |
| reimbursementerName | 文字 | 報帳人名稱 | `張小美` |
| createdAt | 日期時間 | 建立時間 | `2025-11-14 10:00:00` |
| updatedAt | 日期時間 | 更新時間 | `2025-11-14 15:30:00` |

**索引欄位**: id（唯一）, userId, status

---

### Sheet 3: Comments（留言表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| id | 文字 | 唯一識別碼 | `comment_001` |
| requirementId | 文字 | 採購申請 ID | `req_001` |
| userId | 文字 | 留言者 ID | `user_001` |
| authorName | 文字 | 留言者名稱 | `王小明` |
| text | 文字 | 留言內容 | `請問何時可以購買？` |
| createdAt | 日期時間 | 建立時間 | `2025-11-14 10:00:00` |

**索引欄位**: requirementId

---

### Sheet 4: Tithe（奉獻任務表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| id | 文字 | 唯一識別碼 | `tithe_001` |
| taskName | 文字 | 任務名稱 | `2025年11月第二週奉獻` |
| treasurerUid | 文字 | 司庫 ID | `user_001` |
| treasurerName | 文字 | 司庫名稱 | `王司庫` |
| financeStaffUid | 文字 | 財務同工 ID | `user_002` |
| financeStaffName | 文字 | 財務同工名稱 | `李同工` |
| status | 文字 | 狀態 | `in-progress`/`completed` |
| calculationTimestamp | 日期時間 | 計算時間 | `2025-11-14 10:00:00` |
| totalAmount | 數字 | 總金額 | `50000` |
| totalCash | 數字 | 現金總額 | `30000` |
| totalCheque | 數字 | 支票總額 | `20000` |
| summaryJson | 文字 | 按科目統計 (JSON) | `{"十一":30000,"感恩":20000}` |
| completedAt | 日期時間 | 完成時間 | `2025-11-14 15:00:00` |
| createdAt | 日期時間 | 建立時間 | `2025-11-14 09:00:00` |

**索引欄位**: id（唯一）, status

---

### Sheet 5: Dedications（奉獻記錄表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| id | 文字 | 唯一識別碼 | `dedication_001` |
| titheTaskId | 文字 | 奉獻任務 ID | `tithe_001` |
| dedicationDate | 日期 | 奉獻日期 | `2025-11-10` |
| dedicatorId | 文字 | 奉獻者代碼 | `D001` |
| dedicationCategory | 文字 | 奉獻科目 | `十一` |
| amount | 數字 | 金額 | `1000` |
| method | 文字 | 支付方式 | `cash`/`cheque` |
| createdAt | 日期時間 | 建立時間 | `2025-11-14 10:00:00` |

**索引欄位**: titheTaskId, dedicationCategory

---

### Sheet 6: Config（系統設定表）
| 欄位名稱 | 型別 | 說明 | 範例 |
|---------|------|------|------|
| key | 文字 | 設定鍵 | `ACCOUNTING_CATEGORIES` |
| value | 文字 | 設定值 (JSON) | `[{"code":"2.3.1","name":"文具印刷"}]` |
| description | 文字 | 說明 | `會計科目列表` |
| updatedAt | 日期時間 | 更新時間 | `2025-11-14 10:00:00` |

**預設設定**:
- `ACCOUNTING_CATEGORIES`: 會計科目 JSON
- `DEDICATION_CATEGORIES`: 奉獻科目 JSON
- `EMAIL_SETTINGS`: Email 通知設定
- `SYSTEM_VERSION`: 系統版本號

---

## 三、Google Apps Script 檔案結構

```
gas-project/
├── Code.gs                      # 主入口點
├── WebApp.gs                    # Web App 端點 (doGet/doPost)
├── api/
│   ├── AuthAPI.gs              # 身份驗證 API
│   ├── UserAPI.gs              # 使用者 API
│   ├── RequirementAPI.gs       # 採購申請 API
│   ├── CommentAPI.gs           # 留言 API
│   ├── TitheAPI.gs             # 奉獻任務 API
│   └── DedicationAPI.gs        # 奉獻記錄 API
├── dao/
│   ├── BaseDAO.gs              # 基礎資料存取類別
│   ├── UserDAO.gs              # 使用者資料存取
│   ├── RequirementDAO.gs       # 採購申請資料存取
│   ├── CommentDAO.gs           # 留言資料存取
│   ├── TitheDAO.gs             # 奉獻任務資料存取
│   └── DedicationDAO.gs        # 奉獻記錄資料存取
├── services/
│   ├── AuthService.gs          # 身份驗證服務
│   ├── EmailService.gs         # Email 服務
│   ├── PDFService.gs           # PDF 生成服務
│   └── CalculationService.gs   # 奉獻計算服務
├── utils/
│   ├── Utils.gs                # 通用工具函式
│   ├── Validator.gs            # 資料驗證
│   └── Constants.gs            # 常數定義
├── triggers/
│   ├── OnEdit.gs               # onEdit 觸發器
│   └── TimeBased.gs            # 定時觸發器
└── ui/
    ├── Index.html              # 主頁面
    ├── PurchaseBoard.html      # 採購板頁面
    ├── TithingManagement.html  # 奉獻計算頁面
    ├── UserManagement.html     # 使用者管理頁面
    ├── styles.html             # CSS 樣式
    └── scripts.html            # JavaScript 腳本
```

---

## 四、身份驗證策略

### 方式：Google Session Service

**流程**:
```
1. 使用者訪問 Web App URL
   ↓
2. Google 自動驗證 Google 帳號
   ↓
3. Apps Script 獲取 Session.getActiveUser().getEmail()
   ↓
4. 查詢 Users 表，檢查使用者狀態和角色
   ↓
5. 根據角色顯示對應功能
```

**權限檢查函式**:
```javascript
// 檢查使用者是否已登入且已批准
function checkAuth() {
  const email = Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('UNAUTHORIZED: 未登入');
  }

  const user = UserDAO.findByEmail(email);
  if (!user) {
    throw new Error('USER_NOT_FOUND: 使用者不存在');
  }

  if (user.status !== 'approved') {
    throw new Error('USER_NOT_APPROVED: 使用者未批准');
  }

  return user;
}

// 檢查使用者角色
function checkRole(user, allowedRoles) {
  const userRoles = user.roles.split(',');
  const hasRole = allowedRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    throw new Error('INSUFFICIENT_PERMISSIONS: 權限不足');
  }

  return true;
}
```

---

## 五、API 端點設計

### RESTful API 結構

所有 API 請求透過 `doPost()` 處理，使用 JSON 格式：

```javascript
// 請求格式
{
  "action": "createRequirement",  // API 動作
  "data": {                         // 請求資料
    "text": "影印紙 A4",
    "description": "500 張/包"
    // ...
  }
}

// 回應格式（成功）
{
  "success": true,
  "data": { /* 回應資料 */ }
}

// 回應格式（失敗）
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤訊息"
  }
}
```

### 採購板 API 端點

#### 1. 建立採購申請
```javascript
// POST /api
{
  "action": "createRequirement",
  "data": {
    "text": "影印紙 A4",
    "description": "500 張/包，共 10 包",
    "accountingCategory": "2.3.1 文具印刷",
    "priority": "normal"
  }
}
```

#### 2. 取得採購申請列表
```javascript
// POST /api
{
  "action": "getRequirements",
  "data": {
    "filters": {
      "status": "pending",           // 可選
      "userId": "user_001",          // 可選
      "priority": "urgent"           // 可選
    },
    "sort": {
      "field": "createdAt",
      "order": "desc"
    },
    "pagination": {
      "page": 1,
      "pageSize": 20
    }
  }
}
```

#### 3. 更新採購申請
```javascript
// POST /api
{
  "action": "updateRequirement",
  "data": {
    "id": "req_001",
    "updates": {
      "status": "purchased",
      "purchaseAmount": 1500,
      "purchaseDate": "2025-11-14",
      "purchaserId": "user_002",
      "purchaserName": "李小華",
      "purchaseNotes": "已於 7-11 購買",
      "reimbursementerId": "user_003",
      "reimbursementerName": "張小美"
    }
  }
}
```

#### 4. 刪除採購申請
```javascript
// POST /api
{
  "action": "deleteRequirement",
  "data": {
    "id": "req_001"
  }
}
```

#### 5. 轉移報帳人
```javascript
// POST /api
{
  "action": "transferReimbursement",
  "data": {
    "id": "req_001",
    "newReimbursementerId": "user_004",
    "newReimbursementerName": "陳小強"
  }
}
```

#### 6. 新增留言
```javascript
// POST /api
{
  "action": "addComment",
  "data": {
    "requirementId": "req_001",
    "text": "請問何時可以購買？"
  }
}
```

#### 7. 刪除留言
```javascript
// POST /api
{
  "action": "deleteComment",
  "data": {
    "commentId": "comment_001"
  }
}
```

---

## 六、實施階段規劃

### 第一階段：基礎建設（第 1-2 週）

#### 任務清單：
- [x] 制定實施計劃
- [ ] 建立 Google Sheets 資料庫
  - [ ] 建立 6 個工作表（Users, Requirements, Comments, Tithe, Dedications, Config）
  - [ ] 設定欄位標題和資料驗證
  - [ ] 匯入會計科目和奉獻科目資料
- [ ] 建立 Google Apps Script 專案
  - [ ] 設定專案結構
  - [ ] 建立基礎檔案（Code.gs, WebApp.gs）
  - [ ] 設定專案屬性（SPREADSHEET_ID 等）
- [ ] 實作基礎工具函式
  - [ ] Utils.gs（UUID 生成、日期格式化等）
  - [ ] Constants.gs（狀態常數、角色常數等）
  - [ ] Validator.gs（資料驗證函式）
- [ ] 實作 BaseDAO.gs（基礎資料存取類別）
- [ ] 實作身份驗證系統
  - [ ] AuthService.gs（checkAuth, checkRole）
  - [ ] UserDAO.gs（使用者資料存取）
  - [ ] 測試身份驗證流程

**完成標準**：
✅ Google Sheets 結構完整
✅ Google Apps Script 專案建立
✅ 基礎工具函式可正常運作
✅ 身份驗證系統可正確識別使用者和角色

---

### 第二階段：採購板核心功能（第 3-4 週）

#### 任務清單：
- [ ] 實作採購申請資料存取層
  - [ ] RequirementDAO.gs（CRUD 操作）
  - [ ] CommentDAO.gs（留言 CRUD）
- [ ] 實作採購申請 API 端點
  - [ ] createRequirement
  - [ ] getRequirements（含篩選、排序、分頁）
  - [ ] updateRequirement
  - [ ] deleteRequirement
  - [ ] transferReimbursement
- [ ] 實作留言系統 API
  - [ ] addComment
  - [ ] deleteComment
  - [ ] getComments
- [ ] 實作 WebApp 路由
  - [ ] doPost() 處理所有 API 請求
  - [ ] 錯誤處理和回應格式化
- [ ] 單元測試
  - [ ] 測試所有 API 端點
  - [ ] 測試權限檢查
  - [ ] 測試資料驗證

**完成標準**：
✅ 所有採購申請 API 端點正常運作
✅ 留言系統功能完整
✅ 權限檢查正確執行
✅ 資料驗證有效

---

### 第三階段：採購板前端 UI（第 5 週）

#### 任務清單：
- [ ] 建立主頁面框架
  - [ ] Index.html（登入後的主選單）
  - [ ] 導航列和使用者資訊顯示
- [ ] 建立採購板介面
  - [ ] PurchaseBoard.html（採購申請列表）
  - [ ] 列表/網格視圖切換
  - [ ] 搜尋和篩選功能
  - [ ] 新增申請表單
  - [ ] 編輯申請模態框
  - [ ] 留言區塊
  - [ ] 轉移報帳人模態框
- [ ] 整合 Tailwind CSS
  - [ ] 引入 Tailwind CSS CDN
  - [ ] 設計響應式佈局
  - [ ] 深色/淺色模式切換
- [ ] 前後端整合
  - [ ] 使用 google.script.run 呼叫後端 API
  - [ ] 實作 Loading 狀態
  - [ ] 實作錯誤提示
  - [ ] 實作成功提示
- [ ] UI/UX 優化
  - [ ] 樂觀更新 UI
  - [ ] 平滑動畫效果
  - [ ] 無障礙功能（aria-label 等）

**完成標準**：
✅ 採購板介面完整且美觀
✅ 所有功能可正常操作
✅ 響應式設計在各裝置上正常顯示
✅ 使用者體驗流暢

---

### 第四階段：Email 和 PDF 功能（第 6 週）

#### 任務清單：
- [ ] 實作 Email 服務
  - [ ] EmailService.gs
  - [ ] 新採購申請通知
  - [ ] 採購完成通知
  - [ ] Email 模板設計（HTML 格式）
  - [ ] 批次發送邏輯
- [ ] 實作 PDF 生成服務
  - [ ] PDFService.gs
  - [ ] 使用 Google Docs API 生成 PDF
  - [ ] 採購憑證 PDF 模板
  - [ ] 簽名區域和日期欄位
  - [ ] 儲存到 Google Drive
- [ ] 前端整合
  - [ ] Email 通知偏好設定
  - [ ] PDF 下載按鈕
  - [ ] 預覽功能
- [ ] 測試
  - [ ] Email 發送測試
  - [ ] PDF 生成測試
  - [ ] 中文編碼測試

**完成標準**：
✅ Email 通知正確發送
✅ PDF 可正常生成並下載
✅ 中文顯示正確

---

### 第五階段：奉獻計算系統（第 7-8 週）

#### 任務清單：
- [ ] 實作奉獻任務資料存取層
  - [ ] TitheDAO.gs
  - [ ] DedicationDAO.gs
- [ ] 實作奉獻任務 API
  - [ ] createTitheTask
  - [ ] getTitheTasks
  - [ ] completeTitheTask
- [ ] 實作奉獻記錄 API
  - [ ] addDedication
  - [ ] getDedications
  - [ ] updateDedication
  - [ ] deleteDedication
- [ ] 實作計算服務
  - [ ] CalculationService.gs
  - [ ] 現金/支票分離計算
  - [ ] 按科目聚合
  - [ ] 一致性驗證
- [ ] 實作奉獻計算前端
  - [ ] TithingManagement.html（任務列表）
  - [ ] TitheTaskDetail.html（任務詳情）
  - [ ] 奉獻記錄輸入表單
  - [ ] 已登記奉獻列表
  - [ ] 計算結果顯示
- [ ] 實作奉獻報告 PDF
  - [ ] 報告模板設計
  - [ ] 統計表格
  - [ ] 詳細記錄表
  - [ ] 一致性驗證結果
- [ ] 測試
  - [ ] 計算邏輯正確性測試
  - [ ] 驗證邏輯測試
  - [ ] PDF 報告測試

**完成標準**：
✅ 奉獻任務管理功能完整
✅ 奉獻記錄輸入和計算正確
✅ 驗證邏輯有效
✅ 報告 PDF 正確生成

---

### 第六階段：使用者管理和系統管理（第 9 週）

#### 任務清單：
- [ ] 實作使用者管理 API
  - [ ] getUsers
  - [ ] updateUser（管理員功能）
  - [ ] updateUserPreferences（使用者自己）
  - [ ] approveUser（管理員功能）
- [ ] 實作使用者管理前端
  - [ ] UserManagement.html
  - [ ] 使用者列表
  - [ ] 角色編輯
  - [ ] 狀態審核（pending → approved）
  - [ ] 通知偏好設定
- [ ] 實作系統設定功能
  - [ ] 會計科目管理
  - [ ] 奉獻科目管理
  - [ ] Email 設定
- [ ] 測試
  - [ ] 角色權限測試
  - [ ] 使用者審核流程測試

**完成標準**：
✅ 使用者管理功能完整
✅ 角色權限正確執行
✅ 系統設定可正常修改

---

### 第七階段：資料遷移（第 10 週）

#### 任務清單：
- [ ] 準備資料遷移腳本
  - [ ] Firestore 資料匯出腳本
  - [ ] 資料轉換腳本（JSON → CSV）
  - [ ] Google Sheets 匯入腳本
- [ ] 執行資料遷移
  - [ ] 匯出 users 資料
  - [ ] 匯出 requirements 資料
  - [ ] 匯出 comments 資料
  - [ ] 匯出 tithe 資料
  - [ ] 匯出 dedications 資料
- [ ] 資料驗證
  - [ ] 比對資料筆數
  - [ ] 驗證資料完整性
  - [ ] 驗證關聯正確性
- [ ] 測試遷移後系統
  - [ ] 測試所有功能
  - [ ] 驗證資料正確性

**完成標準**：
✅ 所有資料成功遷移
✅ 資料完整性驗證通過
✅ 系統功能正常運作

---

### 第八階段：整合測試和優化（第 11 週）

#### 任務清單：
- [ ] 功能測試
  - [ ] 測試所有採購板功能
  - [ ] 測試所有奉獻計算功能
  - [ ] 測試所有使用者管理功能
  - [ ] 測試 Email 通知
  - [ ] 測試 PDF 生成
- [ ] 性能測試
  - [ ] 測試大量資料讀取
  - [ ] 測試並發操作
  - [ ] 優化查詢效率
- [ ] 安全性測試
  - [ ] 測試權限檢查
  - [ ] 測試資料驗證
  - [ ] 測試 SQL Injection 防護
- [ ] 使用者體驗優化
  - [ ] 優化 Loading 時間
  - [ ] 優化錯誤提示
  - [ ] 優化 UI 動畫
- [ ] Bug 修復
  - [ ] 收集並修復所有 Bug

**完成標準**：
✅ 所有功能測試通過
✅ 性能符合要求
✅ 無重大 Bug

---

### 第九階段：文檔和部署（第 12 週）

#### 任務清單：
- [ ] 撰寫技術文檔
  - [ ] 系統架構文檔
  - [ ] API 文檔
  - [ ] 資料庫結構文檔
  - [ ] 部署文檔
- [ ] 撰寫使用者手冊
  - [ ] 採購板使用說明
  - [ ] 奉獻計算使用說明
  - [ ] 使用者管理使用說明
  - [ ] 常見問題 FAQ
- [ ] 部署準備
  - [ ] 建立正式環境 Google Sheets
  - [ ] 部署 Google Apps Script
  - [ ] 設定 Web App 權限
  - [ ] 設定 API 權限
- [ ] 使用者培訓
  - [ ] 準備培訓材料
  - [ ] 進行使用者培訓
  - [ ] 收集使用者反饋
- [ ] 上線
  - [ ] 正式環境測試
  - [ ] 切換到新系統
  - [ ] 監控系統運作
  - [ ] 提供技術支援

**完成標準**：
✅ 文檔完整
✅ 使用者培訓完成
✅ 系統成功上線
✅ 監控系統穩定

---

## 七、關鍵技術實作範例

### 1. 基礎工具函式（Utils.gs）

```javascript
// --- ▼▼▼ Utils.gs ▼▼▼ ---

/**
 * 生成 UUID
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * 格式化日期時間
 */
function formatDateTime(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * 格式化日期
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') date = new Date(date);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * 解析 JSON（安全）
 */
function safeParseJSON(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Logger.log('JSON 解析失敗: ' + e.message);
    return defaultValue;
  }
}

/**
 * 取得 Spreadsheet
 */
function getSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('無法取得 Spreadsheet');
  }
  return ss;
}

/**
 * 取得指定工作表
 */
function getSheet(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('找不到工作表: ' + sheetName);
  }
  return sheet;
}

// --- ▲▲▲ Utils.gs ▲▲▲ ---
```

---

### 2. 基礎資料存取類別（BaseDAO.gs）

```javascript
// --- ▼▼▼ BaseDAO.gs ▼▼▼ ---

/**
 * 基礎 DAO 類別
 */
class BaseDAO {
  constructor(sheetName) {
    this.sheetName = sheetName;
    this.sheet = getSheet(sheetName);
  }

  /**
   * 取得所有資料
   */
  findAll() {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    return rows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  }

  /**
   * 根據 ID 查找
   */
  findById(id) {
    const allData = this.findAll();
    return allData.find(item => item.id === id);
  }

  /**
   * 根據條件查找
   */
  findBy(conditions) {
    const allData = this.findAll();
    return allData.filter(item => {
      return Object.keys(conditions).every(key => {
        return item[key] === conditions[key];
      });
    });
  }

  /**
   * 新增資料
   */
  create(data) {
    const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    const newRow = headers.map(header => data[header] !== undefined ? data[header] : '');

    this.sheet.appendRow(newRow);

    return data;
  }

  /**
   * 更新資料
   */
  update(id, updates) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) {
      throw new Error('找不到 id 欄位');
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) {
        // 找到要更新的行
        Object.keys(updates).forEach(key => {
          const colIndex = headers.indexOf(key);
          if (colIndex !== -1) {
            this.sheet.getRange(i + 1, colIndex + 1).setValue(updates[key]);
          }
        });

        // 回傳更新後的資料
        const updatedRow = this.sheet.getRange(i + 1, 1, 1, headers.length).getValues()[0];
        const updatedObj = {};
        headers.forEach((header, index) => {
          updatedObj[header] = updatedRow[index];
        });
        return updatedObj;
      }
    }

    throw new Error('找不到 ID: ' + id);
  }

  /**
   * 刪除資料
   */
  delete(id) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) {
      throw new Error('找不到 id 欄位');
    }

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === id) {
        this.sheet.deleteRow(i + 1);
        return true;
      }
    }

    throw new Error('找不到 ID: ' + id);
  }

  /**
   * 取得資料總數
   */
  count() {
    return this.sheet.getLastRow() - 1; // 扣除標題行
  }
}

// --- ▲▲▲ BaseDAO.gs ▲▲▲ ---
```

---

### 3. 身份驗證服務（AuthService.gs）

```javascript
// --- ▼▼▼ AuthService.gs ▼▼▼ ---

/**
 * 檢查使用者身份驗證
 */
function checkAuth() {
  const email = Session.getActiveUser().getEmail();

  if (!email) {
    throw new Error('UNAUTHORIZED|未登入');
  }

  const userDAO = new UserDAO();
  const user = userDAO.findByEmail(email);

  if (!user) {
    throw new Error('USER_NOT_FOUND|使用者不存在，請聯絡管理員');
  }

  if (user.status !== 'approved') {
    throw new Error('USER_NOT_APPROVED|您的帳號尚未批准，請等待管理員審核');
  }

  return user;
}

/**
 * 檢查使用者角色
 */
function checkRole(user, allowedRoles) {
  const userRoles = user.roles ? user.roles.split(',').map(r => r.trim()) : [];
  const hasRole = allowedRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    throw new Error('INSUFFICIENT_PERMISSIONS|您沒有權限執行此操作');
  }

  return true;
}

/**
 * 檢查是否為管理員
 */
function isAdmin(user) {
  const userRoles = user.roles ? user.roles.split(',').map(r => r.trim()) : [];
  return userRoles.includes('admin');
}

/**
 * 檢查是否為財務人員
 */
function isFinanceStaff(user) {
  const userRoles = user.roles ? user.roles.split(',').map(r => r.trim()) : [];
  return userRoles.includes('finance_staff') || userRoles.includes('treasurer') || userRoles.includes('admin');
}

/**
 * 檢查是否為報帳聯絡人
 */
function isReimbursementContact(user) {
  const userRoles = user.roles ? user.roles.split(',').map(r => r.trim()) : [];
  return userRoles.includes('reimbursementContact') || userRoles.includes('admin');
}

// --- ▲▲▲ AuthService.gs ▲▲▲ ---
```

---

## 八、風險管理

### 高風險項目

| 風險 | 影響 | 可能性 | 對策 |
|------|------|--------|------|
| Google Sheets 性能限制 | 高 | 中 | 1. 定期清理舊資料<br>2. 使用索引優化查詢<br>3. 實作分頁和懶加載 |
| 並發編輯衝突 | 中 | 高 | 1. 使用 LockService<br>2. 實作樂觀鎖定<br>3. 錯誤重試機制 |
| 資料遷移失敗 | 高 | 低 | 1. 完整備份 Firestore<br>2. 分階段遷移<br>3. 驗證每個階段 |
| Email 配額限制 | 中 | 中 | 1. 批次發送<br>2. 使用者可選擇訂閱<br>3. 監控配額使用 |
| 使用者適應問題 | 中 | 高 | 1. 詳細使用者手冊<br>2. 培訓課程<br>3. 技術支援 |

### 應急計劃

**情境 1: Google Sheets 性能不足**
- 短期: 優化查詢和索引
- 中期: 考慮使用 Google Cloud SQL
- 長期: 評估回遷到 Firebase

**情境 2: 資料遷移失敗**
- 立即: 回滾到 Firebase
- 檢查: 找出失敗原因
- 重試: 修正問題後再次遷移

**情境 3: 使用者抵制新系統**
- 保留: Firebase 系統作為備份（3 個月）
- 培訓: 加強使用者培訓
- 優化: 根據反饋改進 UI/UX

---

## 九、成功指標

### 技術指標
- [ ] 所有功能正常運作（100% 功能完整性）
- [ ] API 回應時間 < 2 秒（平均）
- [ ] 資料完整性 100%（無資料遺失）
- [ ] 並發支援 10+ 使用者
- [ ] 系統可用性 > 99%

### 業務指標
- [ ] 使用者採用率 > 90%
- [ ] 使用者滿意度 > 4/5
- [ ] 支援請求 < 5 次/週
- [ ] 資料錯誤率 < 0.1%

### 成本指標
- [ ] 開發成本在預算內
- [ ] 運營成本降低（相比 Firebase）
- [ ] 維護成本可控

---

## 十、下一步行動

### 立即執行（本週）
1. ✅ 制定實施計劃（已完成）
2. ⏳ 建立 Google Sheets 資料庫
3. ⏳ 建立 Google Apps Script 專案
4. ⏳ 實作基礎工具函式

### 第二週
1. 實作 BaseDAO 和 UserDAO
2. 實作身份驗證系統
3. 測試基礎功能

### 第三週
1. 開始實作採購板 API
2. 測試 API 端點

---

**備註**：本計劃為動態文檔，會根據實際執行情況進行調整。

**聯絡人**：Claude
**最後更新**：2025-11-14
