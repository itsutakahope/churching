# Google Apps Script 專案

這是教會管理系統（Churching）的 Google Apps Script 實作版本。

## 專案結構

```
gas-project/
├── Code.gs                      # 主入口點
├── WebApp.gs                    # Web App 端點 (doGet/doPost)
├── api/                         # API 端點
│   ├── AuthAPI.gs              # 身份驗證 API
│   ├── UserAPI.gs              # 使用者 API
│   ├── RequirementAPI.gs       # 採購申請 API
│   ├── CommentAPI.gs           # 留言 API
│   ├── TitheAPI.gs             # 奉獻任務 API
│   └── DedicationAPI.gs        # 奉獻記錄 API
├── dao/                         # 資料存取層
│   ├── BaseDAO.gs              # 基礎資料存取類別
│   ├── UserDAO.gs              # 使用者資料存取
│   ├── RequirementDAO.gs       # 採購申請資料存取
│   ├── CommentDAO.gs           # 留言資料存取
│   ├── TitheDAO.gs             # 奉獻任務資料存取
│   └── DedicationDAO.gs        # 奉獻記錄資料存取
├── services/                    # 業務邏輯層
│   ├── AuthService.gs          # 身份驗證服務
│   ├── EmailService.gs         # Email 服務
│   ├── PDFService.gs           # PDF 生成服務
│   └── CalculationService.gs   # 奉獻計算服務
├── utils/                       # 工具函式
│   ├── Utils.gs                # 通用工具函式
│   ├── Validator.gs            # 資料驗證
│   └── Constants.gs            # 常數定義
├── triggers/                    # 觸發器
│   ├── OnEdit.gs               # onEdit 觸發器
│   └── TimeBased.gs            # 定時觸發器
└── ui/                          # 前端介面
    ├── Index.html              # 主頁面
    ├── PurchaseBoard.html      # 採購板頁面
    ├── TithingManagement.html  # 奉獻計算頁面
    ├── UserManagement.html     # 使用者管理頁面
    ├── styles.html             # CSS 樣式
    └── scripts.html            # JavaScript 腳本
```

## 部署步驟

### 1. 建立 Google Sheets

1. 前往 Google Sheets (https://sheets.google.com)
2. 建立新試算表，命名為「教會管理系統」
3. 建立以下工作表：
   - Users（使用者表）
   - Requirements（採購申請表）
   - Comments（留言表）
   - Tithe（奉獻任務表）
   - Dedications（奉獻記錄表）
   - Config（系統設定表）

### 2. 建立 Apps Script 專案

1. 在 Google Sheets 中，點選「擴充功能」→「Apps Script」
2. 將 `gas-project` 目錄中的所有 `.gs` 檔案內容複製到 Apps Script 編輯器
3. 將 `ui` 目錄中的所有 `.html` 檔案新增到 Apps Script 專案

### 3. 設定專案屬性

在 Apps Script 編輯器中：
1. 點選「專案設定」
2. 記下「指令碼 ID」
3. 在「指令碼屬性」中新增：
   - `SPREADSHEET_ID`: 你的 Google Sheets ID
   - `WEBAPP_URL`: 部署後的 Web App URL

### 4. 部署為 Web App

1. 點選「部署」→「新增部署」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - 說明：「教會管理系統 v1.0」
   - 執行身分：「我」
   - 存取權限：「任何人」（組織內部）
4. 點選「部署」
5. 複製 Web App URL

### 5. 設定權限

1. 授權 Apps Script 存取 Google Sheets
2. 授權 Gmail API（用於發送通知）
3. 授權 Google Docs API（用於生成 PDF）
4. 授權 Google Drive API（用於檔案存儲）

### 6. 初始化資料

1. 執行 `initializeSheets()` 函式（在 Code.gs 中）
2. 這將建立所有工作表的標題列
3. 建立第一個管理員帳號

### 7. 測試

1. 訪問 Web App URL
2. 使用 Google 帳號登入
3. 測試所有功能

## 開發指南

### 本地開發

1. 安裝 clasp (Google Apps Script CLI):
   ```bash
   npm install -g @google/clasp
   ```

2. 登入 Google 帳號:
   ```bash
   clasp login
   ```

3. 複製專案:
   ```bash
   clasp clone <SCRIPT_ID>
   ```

4. 推送程式碼:
   ```bash
   clasp push
   ```

5. 部署:
   ```bash
   clasp deploy
   ```

### 除錯

1. 使用 `Logger.log()` 記錄訊息
2. 在 Apps Script 編輯器中查看「執行記錄」
3. 使用「偵錯」功能逐步執行程式碼

### 測試

1. 在 Apps Script 編輯器中執行函式
2. 檢查「執行記錄」中的輸出
3. 使用 Postman 測試 API 端點

## 維護

### 更新程式碼

1. 修改本地檔案
2. 執行 `clasp push`
3. 測試變更
4. 建立新版本部署

### 備份資料

1. 定期匯出 Google Sheets 為 CSV
2. 儲存到 Google Drive
3. 設定自動備份觸發器

### 監控

1. 檢查「執行記錄」查看錯誤
2. 監控 API 配額使用量
3. 定期檢查系統性能

## 常見問題

### Q: 如何新增新的 API 端點？

1. 在 `api/` 目錄建立新檔案
2. 實作 API 函式
3. 在 `WebApp.gs` 的 `doPost()` 中註冊路由
4. 測試新端點

### Q: 如何修改資料結構？

1. 更新 Google Sheets 欄位
2. 更新對應的 DAO 檔案
3. 更新 API 和前端程式碼
4. 執行資料遷移腳本

### Q: 如何處理錯誤？

所有錯誤都應該使用以下格式拋出：
```javascript
throw new Error('ERROR_CODE|錯誤訊息');
```

前端會解析錯誤碼和訊息並顯示給使用者。

## 授權

本專案為內部使用，版權所有。

## 聯絡

如有問題請聯絡系統管理員。
