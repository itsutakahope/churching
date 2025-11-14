# 教會管理系統 - Google Apps Script 遷移執行摘要

**文檔生成日期:** 2024-11-14  
**項目名稱:** Churching (教會管理系統)  
**遷移目標:** Firebase → Google Apps Script

---

## 一、項目規模一覽

| 指標 | 數值 |
|---|---|
| 前端組件 | 24 個 JSX/JS 文件 |
| 後端端點 | 14 個 API 端點 |
| 數據集合 | 5 個主要 Firestore 集合 |
| 可呼叫函式 | 2 個 |
| 觸發器 | 1 個 (新用戶註冊) |
| 測試覆蓋 | 38 個前端測試 + 後端測試 |
| 代碼行數 | ~9,000+ (前端) + 1,171 (後端) |
| 文件大小 | ~500 KB (前端) + ~50 KB (後端) |

---

## 二、核心系統架構

### 現有系統 (Firebase)
```
┌─────────────────────────────────────────────┐
│              React Web App (5173)           │
│  - 24 個組件 (採購系統 + 奉獻系統)          │
│  - 實時 UI 更新                              │
│  - 深色/淺色模式                             │
└──────────────────┬──────────────────────────┘
                   │ HTTPS (Bearer Token)
┌──────────────────▼──────────────────────────┐
│   Firebase Cloud Functions (Express API)   │
│  - 14 個 API 端點                            │
│  - 權限檢查 (middleware)                    │
│  - Gmail 通知發送                            │
│  - 交易/原子操作                             │
└──────────────────┬──────────────────────────┘
                   │ Admin SDK
┌──────────────────▼──────────────────────────┐
│         Cloud Firestore Database           │
│  - users (用戶)                             │
│  - requirements (採購申請)                 │
│  - tithe (奉獻任務)                        │
│  - comments (留言)                         │
│  - dedications (奉獻記錄)                  │
└──────────────────────────────────────────────┘
```

### 建議的新系統 (Google Apps Script)
```
┌─────────────────────────────────────────────┐
│         Google Sheets Interface             │
│  - 採購申請工作表                             │
│  - 奉獻記錄工作表                             │
│  - 用戶設定表                                 │
│  - 統計儀表板                                 │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│      Google Apps Script Backend             │
│  - onEdit() 觸發器 - 自動計算               │
│  - doPost() - Google Forms 集成             │
│  - Email 發送邏輯                            │
│  - PDF 生成 (Google Docs API)               │
│  - 定時觸發器 - 定期同步                    │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│        Google Forms + Firebase Auth         │
│  (或 Google 帳號身份驗證)                    │
└──────────────────────────────────────────────┘
```

---

## 三、主要功能模塊詳解

### A. 採購申請管理 (PurchaseRequestBoard)

**核心流程:**
```
申請人創建採購 → 發送通知 → 採購人完成購買 → 報帳人轉移 → 生成憑證
```

**主要字段 (18 個):**
- 基本: text, description, accountingCategory, priority, status
- 購買相關: purchaseAmount, purchaseDate, purchaseNotes
- 人員: userId, requesterName, purchaserId, purchaserName
- 報帳: reimbursementerId, reimbursementerName
- 系統: createdAt, updatedAt, id

**複雜特性:**
- 列表/網格視圖切換
- 多條件篩選和搜尋
- 留言系統 (含 Markdown 連結)
- 批量選擇和匯出
- 樂觀更新 UI
- 轉帳流程 (Transaction 保證原子性)

**數據量預計:**
- 採購申請: ~100-1000 條/年
- 留言: ~500-2000 條/年

---

### B. 奉獻計算管理 (Tithing System)

**核心流程:**
```
司庫創建任務 → 選財務同工 → 逐筆輸入奉獻 → 完成計算 → 生成報告
```

**關鍵計算:**
```javascript
// 現金 vs 支票分離
totalCash = sum(method == "cash")
totalCheque = sum(method == "cheque")
totalAmount = totalCash + totalCheque

// 按科目聚合
byCategory = {
  "十一": 1500,
  "感恩": 200,
  ...
}

// 驗證
validate: totalCash + totalCheque === totalAmount
```

**奉獻科目 (10 種):**
十一、感恩、主日、宣教、特別、專案、裝潢、指定、慈惠、植堂

**支付方式:**
- 現金 (cash)
- 支票 (cheque)

**數據量預計:**
- 奉獻任務: ~12-52 條/年
- 奉獻記錄: ~500-5000 條/年

---

### C. 用戶和權限系統

**角色類型 (5 種):**
```
admin                 - 完全權限 (數據庫管理、用戶管理)
finance_staff         - 財務同工 (查看和編輯奉獻)
treasurer             - 財務主管 (查看和編輯奉獻)
reimbursementContact  - 報帳聯絡人 (轉移報帳責任)
user                  - 普通用戶 (創建採購、查看)
```

**用戶狀態:**
```
pending (待批准) → approved (已批准)
  ↑
  └─ 只有 approved 用戶才能存取系統
```

**通知偏好:**
- wantsNewRequestNotification (新申請通知)
- wantsPurchaseCompleteNotification (完成通知)

---

## 四、Email 通知系統

### 通知類型 (2 種)

#### 1. 新採購申請通知
- **觸發:** 創建新的 pending 申請
- **收件人:** 訂閱用戶
- **內容:** 申請人、品項、規格、科目、優先級

#### 2. 採購完成通知
- **觸發:** 申請狀態變更為 purchased
- **收件人:** 原始申請人
- **內容:** 品項、金額、購買人、日期、備註

**技術實現:**
- Gmail API (OAuth2)
- UTF-8 編碼 (Subject + Body)
- 非同步發送 (不阻塞響應)

---

## 五、PDF 生成功能

### 1. 採購憑證 PDF
- 品項、規格、科目、金額、購買人
- 簽名區域 (經手人 + 報帳人)
- 日期欄位

### 2. 奉獻報告 PDF
- 司庫、財務同工、計算日期
- 現金/支票統計
- 按科目分類表
- 詳細記錄表
- 一致性驗證結果

**實現技術:**
- jsPDF + jsPDF-autotable (前端)
- 可遷移到 Google Docs API (Google Apps Script)

---

## 六、會計科目結構

**層級樹狀結構:**
```
2.3 行政費
  ├─ 2.3.1 文具印刷
  ├─ 2.3.2 交通費
  ├─ 2.3.3 郵電費 (含子類)
  ├─ 2.3.4 修繕費 (含子類)
  └─ 2.3.5 水電費 (含子類)

2.4 事工 (子科目最多)
  ├─ 2.4.1 愛宴餐點費
  ├─ 2.4.2 主日 (含 3 個子類)
  ├─ 2.4.3-2.4.8 其他事工
  ├─ 2.4.12 節慶 (含 6 個子類)
  ├─ 2.4.13-2.4.15 其他
  └─ 2.4.15 團契事工 (含 6 個子類)

2.5 其他
```

**總計:** ~40+ 個科目代碼

---

## 七、API 端點完整列表

### 用戶管理 (3 個)
```
GET    /api/users
GET    /api/users/reimbursement-contacts
PUT    /api/user/preferences
```

### 採購需求 (5 個)
```
POST   /api/requirements
GET    /api/requirements
PUT    /api/requirements/:id
PUT    /api/requirements/:id/transfer
DELETE /api/requirements/:id
```

### 留言系統 (2 個)
```
POST   /api/requirements/:reqId/comments
DELETE /api/requirements/:reqId/comments/:commentId
```

### 奉獻任務 (3 個)
```
GET    /api/tithe-tasks
POST   /api/tithe-tasks
GET    /api/finance-staff
```

### 可呼叫函式 (2 個)
```
completeTithingTask    - 完成任務並計算
getUserDisplayName     - 取得用戶名稱
```

---

## 八、Firestore 數據結構

### Collections (5 個)

#### 1. users
```
{
  uid, email, displayName, status, roles,
  wantsNewRequestNotification, wantsPurchaseCompleteNotification,
  createdAt
}
```

#### 2. requirements
```
{
  userId, requesterName, text, description, accountingCategory,
  priority, status, createdAt, updatedAt,
  
  // 當 status="purchased" 時
  purchaseAmount, purchaseDate, purchaserId, purchaserName,
  purchaseNotes, reimbursementerId, reimbursementerName,
  
  // 子集合: comments
}
```

#### 3. tithe
```
{
  treasurerUid, treasurerName, financeStaffUid, financeStaffName,
  status, calculationTimestamp,
  
  // 當 status="completed" 時
  summary {totalAmount, byCategory}, completedAt,
  
  // 子集合: dedications
}
```

#### 4. Comments (tithe/[id]/comments)
```
{
  userId, authorName, text, createdAt
}
```

#### 5. Dedications (tithe/[id]/dedications)
```
{
  dedicationDate, dedicatorId, dedicationCategory,
  amount, method, createdAt
}
```

**總計數據量:** ~100-5000 條記錄

---

## 九、技術債務和複雜性分析

### 高複雜度模塊
1. **支付計算邏輯** (paymentCalculationUtils.js)
   - 現金/支票分離
   - 數據驗證 (多層檢查)
   - 結果一致性驗證

2. **交易管理** (Firestore Transaction)
   - 採購更新 (防止並發修改)
   - 報帳轉移 (原子性)

3. **PurchaseRequestBoard** (181 KB)
   - 複雜狀態管理
   - 多個視圖和模態框
   - 樂觀更新模式

### 中等複雜度模塊
1. **Email 通知系統**
   - UTF-8 編碼
   - OAuth2 認證
   - 非同步流程

2. **PDF 生成**
   - 多語言支持 (中文)
   - 複雜表格佈局

3. **實時數據同步**
   - Firestore 監聽器
   - 狀態同步

### 低複雜度模塊
1. **認證流程** (基於 Firebase)
2. **CRUD 操作** (標準 REST)
3. **UI 組件** (React patterns)

---

## 十、遷移評估

### 遷移難度分析

| 功能 | 難度 | 說明 | 工作量 |
|---|---|---|---|
| 採購申請 CRUD | 中 | 需要表單 + 自動化 | 40-50 小時 |
| 奉獻記錄 CRUD | 中 | 需要複雜計算 | 35-45 小時 |
| 現金/支票計算 | 中 | 驗證邏輯複雜 | 20-30 小時 |
| Email 通知 | 低 | Apps Script 原生 | 10-15 小時 |
| PDF 生成 | 中 | Google Docs API | 20-30 小時 |
| 認證系統 | 高 | 需要第三方服務 | 30-50 小時 |
| 權限管理 | 中 | 角色檢查邏輯 | 15-20 小時 |
| 數據遷移 | 中 | 從 Firestore 導出 | 20-25 小時 |
| **總計** | | | **190-265 小時** |

### 遷移成本評估
- **開發時間:** 190-265 小時 (5-7 週)
- **測試時間:** 50-80 小時 (2-3 週)
- **上線時間:** 40-60 小時 (1-2 週)
- **總計:** 280-405 小時 (7-11 週)

### 風險評估

**高風險:**
- 認證系統轉換 (Firebase Auth → Google Account/OAuth)
- 複雜計算邏輯的遷移 (JavaScript → Apps Script)
- 大量數據遷移 (可能丟失或損壞)

**中風險:**
- 實時性能 (Google Sheets 更新延遲)
- 並發編輯衝突
- Email 發送限制

**低風險:**
- UI 佈局遷移 (Google Forms)
- PDF 生成 (Google Docs API)

---

## 十一、推薦遷移策略

### 方案 A: 完全遷移到 Google Apps Script (激進方案)

**優點:**
- 完全脫離 Firebase 依賴
- 所有數據在 Google 生態
- 簡化部署和維護

**缺點:**
- 實現複雜度高
- 認證系統需要重建
- 性能可能下降

**時間表:** 10-12 週

### 方案 B: 混合方案 (推薦)

**架構:**
```
Google Sheets    ← 數據存儲
    ↓
Google Apps Script ← 業務邏輯
    ↓
Firebase Auth   ← 認證 (保留)
    ↓
Google Gmail API ← Email 發送
```

**優點:**
- 充分利用 Google 服務優勢
- 降低開發複雜度
- 認證方案已驗證

**缺點:**
- 仍然依賴 Firebase
- 需要 API 整合

**時間表:** 7-9 週

### 方案 C: 保守方案 (優化現有系統)

**做法:**
- 保留 Firebase
- 優化現有代碼
- 添加 Google Sheets 導出

**優點:**
- 風險最低
- 代碼修改最少
- 快速實現

**缺點:**
- 沒有真正的遷移
- 仍需支付 Firebase 費用

**時間表:** 2-3 週

---

## 十二、建議的遷移路線圖 (方案 B)

### 第 1 階段 (2-3 週): 規劃和設計
- [ ] 確定 Google Sheets 結構
- [ ] 設計 Apps Script 架構
- [ ] 規劃數據遷移策略
- [ ] 設定開發環境

### 第 2 階段 (2-3 週): Google Sheets 搭建
- [ ] 建立採購申請工作表
- [ ] 建立奉獻記錄工作表
- [ ] 建立用戶設定表
- [ ] 添加數據驗證規則
- [ ] 建立統計儀表板

### 第 3 階段 (2-3 週): Apps Script 開發
- [ ] 開發 onEdit 觸發器 (自動計算)
- [ ] 開發 doPost 端點 (Google Forms 集成)
- [ ] 實現 Email 發送邏輯
- [ ] 開發 PDF 生成 (Google Docs API)
- [ ] 實現定時同步

### 第 4 階段 (1-2 週): 數據遷移
- [ ] 導出 Firestore 數據
- [ ] 轉換為 CSV 格式
- [ ] 導入到 Google Sheets
- [ ] 數據驗證和清洗

### 第 5 階段 (2 週): 測試和調試
- [ ] 功能測試 (CRUD)
- [ ] 計算邏輯驗證
- [ ] Email 發送測試
- [ ] PDF 生成測試
- [ ] 性能測試

### 第 6 階段 (1 週): 上線
- [ ] 用戶培訓
- [ ] 逐步遷移
- [ ] 監控和支持
- [ ] 故障排除

**總計:** 10-12 週

---

## 十三、關鍵檔案位置

已生成的分析文檔:
- `/home/user/churching/PROJECT_ANALYSIS.md` (16 KB)
  - 詳細的項目結構和 API 列表
  - 數據模型和權限規則
  - 遷移策略建議

- `/home/user/churching/DETAILED_FEATURES.md` (20 KB)
  - 每個功能模塊的詳細說明
  - 代碼示例和實現邏輯
  - 錯誤處理和驗證規則

- `/home/user/churching/MIGRATION_SUMMARY.md` (本文件)
  - 執行摘要和關鍵指標
  - 成本評估和風險分析
  - 推薦遷移路線圖

---

## 十四、重要代碼片段

### 支付計算核心
```javascript
export const calculatePaymentBreakdown = (dedications) => {
  const summary = { totalAmount: 0, byCategory: {} };
  
  dedications.forEach(d => {
    summary.totalAmount += d.amount;
    summary.byCategory[d.dedicationCategory] = 
      (summary.byCategory[d.dedicationCategory] || 0) + d.amount;
  });
  
  return summary;
};
```

### API 權限檢查
```javascript
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.roles?.some(r => allowedRoles.includes(r))) {
      return res.status(403).json({ 
        code: 'INSUFFICIENT_PERMISSIONS' 
      });
    }
    next();
  };
};
```

### 奉獻記錄驗證
```javascript
export const validateDedication = (dedication) => {
  if (typeof dedication.amount !== 'number' || dedication.amount <= 0) {
    return { isValid: false, errors: ['金額必須 > 0'] };
  }
  if (!['cash', 'cheque'].includes(dedication.method)) {
    return { isValid: false, errors: ['方式無效'] };
  }
  return { isValid: true, errors: [] };
};
```

---

## 十五、最後建議

### 優先事項
1. **立即** - 備份現有數據 (Firestore 導出)
2. **第一週** - 與團隊討論遷移計劃
3. **第二週** - 開始 Google Sheets 原型
4. **第四週** - 評估和調整計劃

### 成功指標
- [ ] 所有功能都在新系統上運行
- [ ] 數據準確性 100%
- [ ] 性能符合要求
- [ ] 用戶培訓完成
- [ ] 支援人員準備就緒

### 應急計劃
- 保留 Firebase 系統至少 3 個月作為備份
- 定期備份 Google Sheets 數據
- 建立快速回滾程序

---

**下一步:** 根據推薦的方案 B，開始規劃 Google Sheets 架構設計。

