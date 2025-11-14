# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

這是一個結合「採購板 (Purchase Board)」與「奉獻計算 (Tithing Management)」功能的 Web 應用程式，使用 Firebase 作為完整的後端解決方案。

**技術堆疊：**
- **前端：** React 18 + Vite + Tailwind CSS + React Router
- **後端：** Firebase Functions (Express.js)
- **資料庫：** Cloud Firestore
- **身份驗證：** Firebase Authentication
- **測試：** Vitest + React Testing Library

## 常用指令

### 開發環境
```bash
# 啟動前端開發伺服器 (port 5173) 和 Firebase Functions 模擬器 (port 5007)
npm run dev

# 只啟動前端開發伺服器
npm run dev:client

# 只啟動 Firebase Functions 模擬器
npm run emulate:functions
```

### 測試
```bash
# 執行所有測試（單次執行）
npm test

# 監視模式（自動重新執行）
npm run test:watch

# 啟動測試 UI 介面
npm run test:ui
```

### 建置與部署
```bash
# 建置前端應用程式（輸出到 dist/client）
npm run build

# 部署到 Firebase Hosting
npm run deploy:hosting
```

## 架構概覽

### 前端架構

**核心元件組織：**
- `App.jsx` - 應用程式根元件，定義路由結構（/purchase, /tithing, /tithing/:taskId）
- `PurchaseRequestBoard.jsx` - 採購需求主看板
- `TithingTaskList.jsx` - 奉獻計算任務列表
- `TithingTaskDetail.jsx` - 單一奉獻任務詳細頁面
- `DedicationEntryForm.jsx` - 奉獻資料輸入表單
- `LoggedDedicationsList.jsx` - 已登記奉獻列表

**Context 提供者：**
- `AuthContext.jsx` - 管理 Firebase 身份驗證狀態、使用者資料（currentUser, userProfile, userRoles, isReimburser）
- `ThemeContext.jsx` - 管理深色/淺色模式切換

**共用元件：**
- `EditRequestModal.jsx` - 編輯採購需求的模態框
- `EditCategoryModal.jsx` - 編輯會計類別的模態框
- `TransferReimbursementModal.jsx` - 轉移報帳負責人的模態框
- `CategorySelector.jsx` - 會計類別選擇器
- `ToastNotification.jsx` - 通知訊息顯示元件
- `ProfileMenu.jsx` - 使用者個人資料選單
- `LoginModal.jsx` - 登入模態框

### 後端架構（functions/index.js）

**API 端點結構：**
所有 API 端點都以 `/api` 為前綴，並由 Express app 處理。

**身份驗證與權限：**
- `verifyFirebaseToken` - 驗證 Firebase ID Token 的中介軟體（必須用於所有需要身份驗證的端點）
- `verifyRole([roles])` - 驗證使用者角色的中介軟體（用於需要特定權限的端點）

**主要 API 端點：**
```
GET    /api/health                              - 健康檢查
GET    /api/users                               - 取得所有使用者列表
GET    /api/users/reimbursement-contacts        - 取得報帳聯絡人列表
PUT    /api/user/preferences                    - 更新使用者偏好設定
POST   /api/requirements                        - 建立新的採購需求
GET    /api/requirements                        - 取得所有採購需求
PUT    /api/requirements/:id                    - 更新採購需求
PUT    /api/requirements/:id/transfer           - 轉移報帳負責人
DELETE /api/requirements/:id                    - 刪除採購需求
POST   /api/requirements/:reqId/comments        - 新增留言
DELETE /api/requirements/:reqId/comments/:commentId - 刪除留言
GET    /api/tithe-tasks                         - 取得奉獻任務列表（需要 finance_staff/treasurer 角色）
POST   /api/tithe-tasks                         - 建立新的奉獻任務（需要 finance_staff/treasurer 角色）
GET    /api/finance-staff                       - 取得財務人員列表（需要 finance_staff/treasurer 角色）
```

**Callable Functions：**
- `getUserDisplayNameCallable` - 根據 UID 取得使用者顯示名稱
- `completeTithingTask` - 完成奉獻任務

**Triggers：**
- `createuserprofile` - 當新使用者註冊時自動建立 Firestore 使用者資料

**Email 通知系統：**
- 使用 Gmail API 發送新採購申請通知
- 需要設定環境變數：GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER

### Firestore 資料結構

**主要 Collections：**
- `users` - 使用者資料
  - 關鍵欄位：email, displayName, roles (array), status, wantsNewRequestNotification
  - 角色類型：admin, finance_staff, treasurer, reimbursementContact

- `requirements` - 採購需求
  - 關鍵欄位：userId, requesterName, text, description, accountingCategory, priority, status, reimbursementerId
  - 子集合：comments

- `tithe` - 奉獻計算任務
  - 關鍵欄位：taskName, calculationTimestamp, treasurerUid, financeStaffUid, status
  - 子集合：dedications（各項奉獻記錄）

**權限規則重點（firestore.rules）：**
- users：管理員可完全存取；使用者可讀取自己的資料並更新（但不能修改 roles 或 status）
- requirements：所有已驗證使用者可讀取；只有建立者可更新/刪除
- tithe：只有 finance_staff、treasurer 或 admin 可讀取；只有任務分配者可寫入
- dedications 子集合：繼承父層任務的權限邏輯

## 開發規範

### 前端開發
- **元件風格：** 使用 React 函式元件 + Hooks，不使用 Class Components
- **樣式：** 統一使用 Tailwind CSS utility classes，避免自訂 CSS 檔案
- **圖示：** 使用 `lucide-react` 作為標準圖示庫
- **API 請求：** 統一使用 `axios`，並確保包含完整的錯誤處理（參考 TithingTaskList.jsx 的模式）
- **深色模式：** 使用 ThemeContext 提供的 theme 狀態，並在 className 中加入 `dark:` 前綴樣式

### 錯誤處理模式
所有 API 請求必須處理三種錯誤情境：
1. `err.response` - 伺服器回應錯誤（檢查 err.response.data.code）
2. `err.request` - 網路請求失敗
3. 其他未知錯誤

根據後端回傳的 `code` 欄位提供清晰、對使用者友善的中文錯誤訊息。

### 身份驗證與權限
- **前端：** 使用 `useAuth()` hook 取得 currentUser、userProfile、userRoles
- **後端：** 所有需要驗證的端點必須使用 `verifyFirebaseToken` 中介軟體
- **角色檢查：** 需要特定角色的端點額外使用 `verifyRole([...roles])` 中介軟體
- **狀態檢查：** 前端操作應檢查 `userProfile.status === 'approved'` 以啟用/禁用功能

### 程式碼修改標示
在進行核心邏輯修改時，使用以下註解標示修改範圍：
```javascript
// --- ▼▼▼ 核心修改開始 ▼▼▼ ---
// 修改的程式碼
// --- ▲▲▲ 核心修改結束 ▲▲▲ ---
```

### PDF 產生
- **位置：** 客戶端（使用 jspdf 與 jspdf-autotable）
- **中文支援：** 必須正確載入 NotoSansTC-Regular.ttf 字體檔案

## 開發環境設定

**Firebase Emulators 連接埠：**
- Auth: 9099
- Functions: 5001
- Firestore: 8080
- Hosting: 5002
- UI: 4000

**Vite 代理設定：**
前端開發伺服器 (5173) 會將 `/api` 請求代理到 Functions 模擬器 (http://127.0.0.1:5007)

## 重要提醒

- **禁止臆測：** 若不確定上下文或需求細節，必須提問確認
- **禁止創造：** 只能使用 package.json 已安裝的函式庫，不得虛構不存在的函式或套件
- **路徑確認：** 在引用任何檔案之前，務必確認路徑存在且正確
- **禁止覆寫：** 除非明確指示，否則不得刪除或覆寫現有程式碼，應以修改或擴充為主
- **語言：** 程式碼註解與使用者介面文字統一使用繁體中文

## 測試
測試檔案位於 `client/test/` 目錄，使用 Vitest + jsdom 環境。測試涵蓋：
- 元件基本功能測試
- API 整合測試
- 深色模式視覺測試
- 無障礙功能測試
- 響應式設計測試
