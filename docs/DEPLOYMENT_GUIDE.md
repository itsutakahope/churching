# Google Apps Script 部署指南

**版本**: 2.0.0
**更新日期**: 2025-11-14
**系統**: 教會管理系統 - Google Apps Script 版本

---

## 📋 部署前檢查清單

### 必備條件
- [ ] Google 帳號（具有 Google Drive 和 Sheets 存取權限）
- [ ] Google Apps Script 專案
- [ ] 已初始化的 Google Sheets 資料庫
- [ ] 已完成程式碼上傳

### 程式碼檢查
- [ ] 所有 `.gs` 檔案已上傳到 Google Apps Script 專案
- [ ] 所有 HTML 檔案已上傳（Login.html, Pending.html, Index.html 等）
- [ ] Constants.gs 中的常數設定正確
- [ ] 沒有語法錯誤

---

## 🚀 部署步驟

### 步驟 1: 建立 Google Apps Script 專案

1. **開啟 Google Apps Script**
   - 前往 https://script.google.com/
   - 點擊「新專案」

2. **設定專案名稱**
   - 點擊「未命名專案」
   - 重新命名為「教會管理系統」

3. **上傳所有程式碼檔案**

   **後端檔案**（.gs 檔案）:
   ```
   gas-project/
   ├── Code.gs                     # 主程式入口
   ├── WebApp.gs                   # Web 應用程式端點
   ├── InitializeDatabase.gs       # 資料庫初始化
   ├── utils/
   │   ├── Constants.gs
   │   ├── Utils.gs
   │   └── Validator.gs
   ├── dao/
   │   ├── BaseDAO.gs
   │   ├── UserDAO.gs
   │   ├── RequirementDAO.gs
   │   └── CommentDAO.gs
   ├── services/
   │   ├── AuthService.gs
   │   ├── EmailService.gs
   │   └── PDFService.gs
   ├── api/
   │   ├── RequirementAPI.gs
   │   ├── CommentAPI.gs
   │   ├── UserAPI.gs
   │   └── PDFAPI.gs
   └── tests/
       └── APITests.gs
   ```

   **前端檔案**（HTML 檔案）:
   ```
   gas-project/ui/
   ├── Login.html
   ├── Pending.html
   ├── Index.html
   ├── styles.html
   ├── scripts.html
   ├── modals.html
   └── modals-scripts.html
   ```

4. **設定檔案順序**
   - 確保 Code.gs 在最上方
   - 其他檔案依照依賴關係排列

---

### 步驟 2: 建立 Google Sheets 資料庫

1. **建立新試算表**
   - 前往 https://sheets.google.com/
   - 建立新試算表
   - 命名為「教會管理系統資料庫」

2. **連結試算表到 Apps Script**
   - 在 Apps Script 專案中，點擊「資源」→「雲端平台專案」
   - 或直接在 Code.gs 中使用試算表 ID

3. **執行資料庫初始化**
   - 在 Apps Script 編輯器中，選擇函式 `initializeDatabase`
   - 點擊「執行」
   - 授權必要的權限
   - 確認初始化成功

4. **驗證資料庫結構**
   - 檢查試算表是否有以下工作表：
     - Users
     - Requirements
     - Comments
     - Config
     - Tithe
     - Dedications
   - 每個工作表應該有正確的標題列

---

### 步驟 3: 設定環境變數（選填）

1. **開啟 Script Properties**
   - 點擊「專案設定」
   - 找到「指令碼屬性」

2. **新增必要的屬性**（如果需要 Email 通知）:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REFRESH_TOKEN=your_refresh_token
   GMAIL_SENDER=your_email@gmail.com
   ```

3. **設定試算表 ID**（如果使用獨立試算表）:
   ```
   SPREADSHEET_ID=your_spreadsheet_id
   ```

---

### 步驟 4: 部署 Web App

1. **點擊「部署」→「新增部署作業」**

2. **選擇類型**
   - 選擇「網頁應用程式」

3. **設定部署參數**
   - **說明**: 教會管理系統 v2.0.0
   - **執行身分**: 我
   - **存取權**: 任何人（包括匿名使用者）
   - ⚠️ 注意：實際部署時建議設定為「僅限組織內的使用者」

4. **點擊「部署」**
   - 授權必要的權限
   - 複製 Web App URL

5. **測試部署**
   - 在瀏覽器中開啟 Web App URL
   - 應該看到登入頁面

---

### 步驟 5: 初始設定

1. **登入系統**
   - 使用 Google 帳號登入
   - 首次登入會自動建立使用者記錄

2. **設定管理員**
   - 開啟 Google Sheets 資料庫
   - 找到 Users 工作表
   - 找到你的使用者記錄
   - 修改欄位：
     - `status`: 改為 `approved`
     - `roles`: 改為 `admin,user`

3. **重新載入頁面**
   - 重新整理瀏覽器
   - 現在應該可以看到主頁面

4. **設定其他使用者**
   - 邀請其他使用者登入
   - 在 Users 工作表中批准他們（修改 status 為 approved）
   - 視需要設定角色（admin, finance_staff, treasurer, reimbursementContact）

---

## 🧪 測試部署

### 自動化測試

1. **執行健康檢查**
   ```
   函式: quickHealthCheck
   ```
   - 在 Apps Script 編輯器中執行
   - 檢查日誌輸出

2. **執行完整 API 測試**
   ```
   函式: runAllAPITests
   ```
   - 執行所有 API 端點測試
   - 檢查測試結果

### 手動測試

1. **測試登入流程**
   - [ ] 開啟 Web App URL
   - [ ] 使用 Google 帳號登入
   - [ ] 驗證使用者資料正確建立

2. **測試基本功能**
   - [ ] 新增採購需求
   - [ ] 編輯採購需求
   - [ ] 刪除採購需求
   - [ ] 標記已購買
   - [ ] 新增留言
   - [ ] 刪除留言

3. **測試 PDF 生成**
   - [ ] 生成單一採購需求 PDF
   - [ ] 生成摘要報告 PDF
   - [ ] 驗證 PDF 內容正確

4. **測試 UI 功能**
   - [ ] 深色模式切換
   - [ ] 視圖切換（列表/網格）
   - [ ] 搜尋功能
   - [ ] 篩選功能

5. **測試權限控制**
   - [ ] 一般使用者無法存取管理員功能
   - [ ] 使用者只能編輯自己的需求
   - [ ] 使用者只能刪除自己的留言

---

## 🔧 常見問題

### Q1: 執行函式時出現「未授權」錯誤
**A**:
- 點擊「檢閱權限」
- 選擇你的 Google 帳號
- 點擊「前往教會管理系統（不安全）」
- 點擊「允許」

### Q2: Web App 顯示「未授權」
**A**:
- 確認部署設定中「執行身分」為「我」
- 確認「存取權」設定正確
- 重新部署 Web App

### Q3: 無法看到 Google Sheets 資料
**A**:
- 檢查 Code.gs 中的試算表 ID 是否正確
- 確認已執行 `initializeDatabase` 函式
- 檢查試算表權限

### Q4: PDF 生成失敗
**A**:
- 檢查是否有 Google Drive 寫入權限
- 確認 DriveApp 和 DocumentApp 服務已啟用
- 檢查日誌中的錯誤訊息

### Q5: Email 通知無法發送
**A**:
- 確認已設定 Gmail API 憑證
- 檢查 Script Properties 中的環境變數
- 確認 GmailApp 服務已啟用

---

## 📊 效能最佳化

### 建議設定

1. **啟用快取**
   - 在 Code.gs 中啟用 CacheService

2. **批次操作**
   - 使用 `setValues()` 而非 `setValue()`
   - 一次處理多筆資料

3. **並發控制**
   - 使用 LockService 避免資料衝突

4. **資料量限制**
   - 建議每個工作表不超過 10,000 筆記錄
   - 定期備份和歸檔舊資料

---

## 🔒 安全性設定

### 建議措施

1. **存取控制**
   - 設定 Web App 存取權為「僅限組織內的使用者」
   - 定期檢查使用者權限

2. **資料保護**
   - 定期備份 Google Sheets 資料庫
   - 限制試算表編輯權限

3. **日誌監控**
   - 定期檢查 Stackdriver Logging
   - 監控異常活動

4. **API 安全**
   - 驗證所有輸入資料
   - 使用權限檢查中介軟體

---

## 📝 維護指南

### 日常維護

1. **每日檢查**
   - 檢查系統運作狀態
   - 查看錯誤日誌

2. **每週檢查**
   - 檢查資料完整性
   - 清理測試資料

3. **每月檢查**
   - 備份資料庫
   - 檢查效能指標
   - 更新使用者權限

### 資料備份

1. **手動備份**
   - 在 Google Sheets 中選擇「檔案」→「建立副本」
   - 命名格式：`教會管理系統資料庫_備份_YYYY-MM-DD`

2. **自動備份**（可選）
   - 設定 Google Apps Script 觸發器
   - 定期執行備份函式

### 版本更新

1. **準備更新**
   - 備份當前資料
   - 備份當前程式碼

2. **執行更新**
   - 上傳新程式碼
   - 執行資料庫遷移（如需要）
   - 測試新功能

3. **部署更新**
   - 建立新的部署版本
   - 更新 Web App URL（如需要）

---

## 🎯 下一步

部署完成後，建議：

1. **使用者培訓**
   - 製作使用手冊
   - 進行使用者培訓

2. **持續監控**
   - 監控系統效能
   - 收集使用者反饋

3. **功能擴展**
   - 實作奉獻計算系統
   - 新增其他需要的功能

---

## 📞 支援與協助

如遇到問題，請：

1. 檢查本文件的「常見問題」章節
2. 查看 Google Apps Script 日誌
3. 參考 Google Apps Script 官方文件

---

**部署文件版本**: 1.0
**最後更新**: 2025-11-14
