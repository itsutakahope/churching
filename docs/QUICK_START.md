# 快速開始指南

**教會管理系統 - Google Apps Script 版本**

---

## 🚀 5 分鐘快速部署

### 前置需求
- Google 帳號
- 15 分鐘的時間

---

## 步驟 1: 建立 Google Apps Script 專案（2 分鐘）

1. 前往 https://script.google.com/
2. 點擊「新專案」
3. 將專案命名為「教會管理系統」

---

## 步驟 2: 上傳所有程式碼（5 分鐘）

### 複製所有 .gs 檔案

依序上傳以下檔案（從 `gas-project/` 目錄）:

**必要檔案（按順序）**:
1. ✅ `utils/Constants.gs`
2. ✅ `utils/Utils.gs`
3. ✅ `utils/Validator.gs`
4. ✅ `dao/BaseDAO.gs`
5. ✅ `dao/UserDAO.gs`
6. ✅ `dao/RequirementDAO.gs`
7. ✅ `dao/CommentDAO.gs`
8. ✅ `services/AuthService.gs`
9. ✅ `services/EmailService.gs`
10. ✅ `services/PDFService.gs`
11. ✅ `api/RequirementAPI.gs`
12. ✅ `api/CommentAPI.gs`
13. ✅ `api/UserAPI.gs`
14. ✅ `api/PDFAPI.gs`
15. ✅ `WebApp.gs`
16. ✅ `Code.gs`
17. ✅ `InitializeDatabase.gs`

**測試檔案（可選）**:
18. ⭕ `tests/APITests.gs`

### 上傳所有 HTML 檔案

從 `gas-project/ui/` 目錄上傳:

1. ✅ `Login.html`
2. ✅ `Pending.html`
3. ✅ `Index.html`
4. ✅ `styles.html`
5. ✅ `scripts.html`
6. ✅ `modals.html`
7. ✅ `modals-scripts.html`

**上傳方式**:
- 在 Apps Script 編輯器中
- 點擊「+」→「HTML」
- 將檔案名稱改為對應名稱（不含 .html）
- 複製貼上程式碼內容

---

## 步驟 3: 初始化資料庫（2 分鐘）

1. **在 Apps Script 編輯器中**:
   - 選擇函式: `initializeDatabase`
   - 點擊「執行」
   - 授權必要權限（第一次執行）
   - 等待完成（會彈出確認對話框）

2. **驗證資料庫**:
   - 開啟建立的 Google Sheets
   - 確認有以下 6 個工作表:
     - Users
     - Requirements
     - Comments
     - Config
     - Tithe
     - Dedications

---

## 步驟 4: 部署 Web App（3 分鐘）

1. **點擊「部署」→「新增部署作業」**

2. **設定**:
   - 類型: 網頁應用程式
   - 說明: 教會管理系統 v2.0.0
   - 執行身分: 我
   - 存取權: 任何人（或「僅限組織內的使用者」）

3. **部署**:
   - 點擊「部署」
   - 授權權限
   - 複製 Web App URL

---

## 步驟 5: 首次登入與設定（3 分鐘）

1. **開啟 Web App URL**
   - 在瀏覽器中貼上 URL
   - 應該看到登入頁面

2. **使用 Google 帳號登入**
   - 點擊「使用 Google 帳號登入」
   - 選擇帳號
   - 授權存取

3. **設定管理員權限**
   - 開啟 Google Sheets 資料庫
   - 前往「Users」工作表
   - 找到你的使用者記錄
   - 修改:
     ```
     status: pending → approved
     roles: user → admin,user
     ```
   - 儲存變更

4. **重新載入頁面**
   - 重新整理瀏覽器
   - 現在應該看到主頁面！

---

## 🎉 完成！

你現在可以：
- ✅ 新增採購需求
- ✅ 管理採購需求
- ✅ 標記已購買
- ✅ 新增留言
- ✅ 生成 PDF 報告
- ✅ 切換深色模式

---

## 📚 下一步

### 新增更多使用者

1. 邀請其他人開啟 Web App URL 並登入
2. 在 Google Sheets 的 Users 工作表中:
   - 將他們的 `status` 改為 `approved`
   - 設定適當的 `roles`:
     - `admin` - 管理員
     - `finance_staff` - 財務人員
     - `treasurer` - 會計
     - `reimbursementContact` - 報帳聯絡人
     - `user` - 一般使用者

### 新增範例資料（可選）

1. 在 Apps Script 編輯器中
2. 選擇函式: `addSampleData`
3. 點擊「執行」
4. 系統會自動建立 3 個範例採購需求

### 測試系統

1. 在 Apps Script 編輯器中
2. 選擇函式: `quickHealthCheck`
3. 點擊「執行」
4. 查看日誌確認一切正常

---

## 🔧 常見問題快速解答

### Q: 執行函式時要求授權？
**A**: 這是正常的！點擊「檢閱權限」→「前往...（不安全）」→「允許」

### Q: 看到「等待批准」頁面？
**A**: 前往 Google Sheets，將你的 `status` 改為 `approved`

### Q: 無法新增採購需求？
**A**: 確認你的 `status` 是 `approved`

### Q: 找不到 Web App URL？
**A**: 點擊「部署」→「管理部署作業」，可以看到 URL

---

## 📖 完整文件

- **整合測試計劃**: `docs/INTEGRATION_TEST_PLAN.md`
- **部署指南**: `docs/DEPLOYMENT_GUIDE.md`
- **遷移進度報告**: `docs/GAS_MIGRATION_PROGRESS.md`
- **專案說明**: `CLAUDE.md`

---

## 🎯 系統功能一覽

### 採購板功能
- ✅ 新增/編輯/刪除採購需求
- ✅ 標記已購買
- ✅ 轉移報帳人
- ✅ 留言系統
- ✅ 搜尋與篩選
- ✅ PDF 生成（單一/摘要）

### 使用者管理
- ✅ Google OAuth 登入
- ✅ 角色權限管理
- ✅ 使用者批准流程

### UI 功能
- ✅ 深色模式
- ✅ 響應式設計
- ✅ Toast 通知
- ✅ 列表/網格視圖

### 即將推出
- ⏳ 奉獻計算系統
- ⏳ 資料分析報表
- ⏳ 更多功能...

---

**需要協助？** 查看 `docs/DEPLOYMENT_GUIDE.md` 獲取詳細說明！
