# 奉獻計算系統前端實作指南

**日期**: 2025-11-14
**狀態**: 後端完成，前端待實作

---

## 📊 系統概覽

奉獻計算系統包含兩個主要頁面：
1. **奉獻任務列表頁面** (TitheTasks.html) - 顯示所有奉獻任務
2. **奉獻任務詳情頁面** (TitheTaskDetail.html) - 輸入和管理奉獻記錄

---

## 🔗 路由設計

更新 `WebApp.gs` 的 `doGet()` 函式以支援多頁面路由：

```javascript
function doGet(e) {
  try {
    const userInfo = getCurrentUserInfo();

    if (!userInfo) {
      return HtmlService.createHtmlOutputFromFile('Login')
        .setTitle('教會管理系統 - 登入');
    }

    if (userInfo.status !== USER_STATUS.APPROVED) {
      return HtmlService.createTemplateFromFile('Pending')
        .evaluate()
        .setTitle('教會管理系統 - 等待批准');
    }

    // 路由處理
    const page = e.parameter.page || 'purchase';

    // 檢查權限
    if (page === 'tithe' || page === 'titheDetail') {
      const hasPermission = userInfo.roles.includes('finance_staff') ||
                          userInfo.roles.includes('treasurer') ||
                          userInfo.roles.includes('admin');

      if (!hasPermission) {
        // 顯示無權限頁面
        return HtmlService.createHtmlOutput('<h1>您沒有權限存取此頁面</h1>')
          .setTitle('權限不足');
      }
    }

    const template = HtmlService.createTemplateFromFile(getPageTemplate(page));
    template.user = userInfo;

    return template.evaluate()
      .setTitle('教會管理系統')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  } catch (error) {
    logError('doGet', error);
    return HtmlService.createHtmlOutput('<h1>系統錯誤</h1>')
      .setTitle('錯誤');
  }
}

function getPageTemplate(page) {
  switch (page) {
    case 'purchase':
      return 'Index';
    case 'tithe':
      return 'TitheTasks';
    case 'titheDetail':
      return 'TitheTaskDetail';
    default:
      return 'Index';
  }
}
```

---

## 📄 頁面 1: 奉獻任務列表 (TitheTasks.html)

### 頁面結構

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>奉獻計算 - 教會管理系統</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <?!= include('styles'); ?>
</head>
<body class="bg-gray-50 dark:bg-gray-900">

  <!-- 導航列（包含到採購板的連結） -->
  <nav class="bg-white dark:bg-gray-800 border-b">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex items-center h-16">
        <h1 class="text-xl font-bold">奉獻計算</h1>
        <div class="ml-auto flex items-center gap-4">
          <a href="?page=purchase" class="text-sm">採購板</a>
          <a href="?page=tithe" class="text-sm font-semibold">奉獻計算</a>
          <!-- 深色模式切換 -->
          <!-- 使用者選單 -->
        </div>
      </div>
    </div>
  </nav>

  <!-- 主要內容 -->
  <main class="max-w-7xl mx-auto px-4 py-8">

    <!-- 工具列 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div class="flex justify-between items-center">
        <div class="flex gap-3">
          <!-- 狀態篩選 -->
          <select id="statusFilter" class="form-input">
            <option value="">所有狀態</option>
            <option value="in-progress">進行中</option>
            <option value="completed">已完成</option>
          </select>

          <!-- 生成摘要報告按鈕 -->
          <button onclick="generateSummaryPDF()" class="btn btn-secondary">
            匯出摘要 PDF
          </button>
        </div>

        <!-- 新增任務按鈕 -->
        <button onclick="openCreateTaskModal()" class="btn btn-primary">
          新增奉獻任務
        </button>
      </div>
    </div>

    <!-- 任務列表 -->
    <div id="tasksList" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- 任務卡片由 JavaScript 動態生成 -->
    </div>

    <!-- 載入中 -->
    <div id="loading" class="text-center py-12">
      <div class="spinner"></div>
      <p class="mt-4">載入中...</p>
    </div>

    <!-- 無資料 -->
    <div id="noData" class="hidden text-center py-12">
      <h3>沒有奉獻任務</h3>
      <p class="mt-2">點擊「新增奉獻任務」開始建立</p>
    </div>
  </main>

  <!-- 新增任務模態框 -->
  <div id="createTaskModal" class="modal hidden">
    <div class="modal-backdrop" onclick="closeModal('createTaskModal')"></div>
    <div class="modal-content">
      <h3>新增奉獻任務</h3>
      <form onsubmit="handleCreateTask(event)">
        <div>
          <label>任務名稱</label>
          <input type="text" id="taskName" required>
        </div>
        <div>
          <label>計算時間</label>
          <input type="datetime-local" id="calculationTimestamp" required>
        </div>
        <div>
          <label>會計</label>
          <select id="treasurerUid" required>
            <option value="">載入中...</option>
          </select>
        </div>
        <div>
          <label>財務人員</label>
          <select id="financeStaffUid" required>
            <option value="">載入中...</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button type="button" onclick="closeModal('createTaskModal')">取消</button>
          <button type="submit" class="btn btn-primary">建立</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Toast 通知 -->
  <div id="toastContainer"></div>

  <!-- JavaScript -->
  <script>
    const currentUser = {
      id: '<?= user.id ?>',
      email: '<?= user.email ?>',
      displayName: '<?= user.displayName ?>',
      roles: '<?= user.roles ?>'.split(',')
    };

    // API 包裝函式
    function callAPI(action, data = {}) {
      return new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .handleAPIRequest({ action, data });
      });
    }

    // 載入任務列表
    async function loadTasks() {
      try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('tasksList').classList.add('hidden');

        const status = document.getElementById('statusFilter').value;
        const response = await callAPI('getTitheTasks', { status });

        if (response.success) {
          renderTasks(response.data);
        }
      } catch (error) {
        showToast('載入失敗: ' + error.message, 'error');
      } finally {
        document.getElementById('loading').classList.add('hidden');
      }
    }

    // 渲染任務列表
    function renderTasks(tasks) {
      const container = document.getElementById('tasksList');
      const noData = document.getElementById('noData');

      if (tasks.length === 0) {
        container.classList.add('hidden');
        noData.classList.remove('hidden');
        return;
      }

      container.classList.remove('hidden');
      noData.classList.add('hidden');

      container.innerHTML = tasks.map(task => `
        <div class="task-card bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer hover:shadow-lg transition"
             onclick="goToTaskDetail('${task.id}')">
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-lg font-semibold">${task.taskName}</h3>
            <span class="badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}">
              ${task.status === 'completed' ? '已完成' : '進行中'}
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <p><strong>會計：</strong> ${task.treasurerName}</p>
            <p><strong>財務人員：</strong> ${task.financeStaffName}</p>
            <p><strong>建立時間：</strong> ${formatDate(task.createdAt)}</p>

            ${task.status === 'completed' ? `
              <div class="mt-4 pt-4 border-t">
                <p class="text-lg"><strong>總金額：</strong> NT$ ${task.totalAmount.toLocaleString()}</p>
                <p><strong>總筆數：</strong> ${task.totalCount}</p>
              </div>
            ` : ''}
          </div>

          <div class="mt-4 flex gap-2">
            <button onclick="event.stopPropagation(); generateTaskPDF('${task.id}')"
                    class="btn btn-sm btn-secondary">
              下載 PDF
            </button>
            ${task.status === 'in-progress' ? `
              <button onclick="event.stopPropagation(); deleteTask('${task.id}')"
                      class="btn btn-sm btn-danger">
                刪除
              </button>
            ` : ''}
          </div>
        </div>
      `).join('');
    }

    // 前往任務詳情頁面
    function goToTaskDetail(taskId) {
      window.location.href = `?page=titheDetail&taskId=${taskId}`;
    }

    // 其他函式...
    // - openCreateTaskModal()
    // - handleCreateTask()
    // - loadFinanceStaff()
    // - generateTaskPDF()
    // - generateSummaryPDF()
    // - deleteTask()
    // - formatDate()
    // - showToast()

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      loadTasks();
      loadFinanceStaff();

      document.getElementById('statusFilter').addEventListener('change', loadTasks);
    });
  </script>
</body>
</html>
```

### 主要功能

1. **任務列表顯示**
   - 卡片式佈局
   - 顯示任務資訊（名稱、會計、財務人員、狀態）
   - 已完成任務顯示總金額和筆數

2. **篩選功能**
   - 按狀態篩選（所有/進行中/已完成）

3. **操作按鈕**
   - 新增任務
   - 下載 PDF
   - 刪除任務（僅進行中）

4. **導航**
   - 點擊卡片進入詳情頁面

---

## 📄 頁面 2: 奉獻任務詳情 (TitheTaskDetail.html)

### 頁面結構

```html
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>奉獻任務詳情 - 教會管理系統</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <?!= include('styles'); ?>
</head>
<body>

  <!-- 導航列 -->
  <nav>
    <a href="?page=tithe">← 返回列表</a>
    <h1 id="taskTitle">奉獻任務詳情</h1>
    <div>
      <button onclick="generatePDF()">下載 PDF</button>
      <button onclick="completeTask()" id="completeBtn" class="btn-success">完成任務</button>
    </div>
  </nav>

  <!-- 主要內容 -->
  <main class="max-w-7xl mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- 左側：任務資訊 -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold mb-4">任務資訊</h2>
          <div id="taskInfo">
            <!-- 動態載入 -->
          </div>
        </div>

        <!-- 統計資訊 -->
        <div class="bg-white rounded-lg shadow p-6 mt-6">
          <h2 class="text-lg font-semibold mb-4">統計資訊</h2>
          <div id="statistics">
            <!-- 動態載入 -->
          </div>
        </div>
      </div>

      <!-- 右側：奉獻記錄 -->
      <div class="lg:col-span-2">

        <!-- 新增奉獻記錄表單 -->
        <div class="bg-white rounded-lg shadow p-6 mb-6" id="addDedicationForm">
          <h2 class="text-lg font-semibold mb-4">新增奉獻記錄</h2>
          <form onsubmit="handleAddDedication(event)" class="grid grid-cols-2 gap-4">
            <div>
              <label>奉獻者</label>
              <input type="text" id="donor" required>
            </div>
            <div>
              <label>奉獻類別</label>
              <select id="category" required>
                <option value="">請選擇</option>
                <option value="十一">十一</option>
                <option value="感恩">感恩</option>
                <option value="主日">主日</option>
                <option value="宣教">宣教</option>
                <option value="特別">特別</option>
                <option value="專案">專案</option>
                <option value="裝潢">裝潢</option>
                <option value="指定">指定</option>
              </select>
            </div>
            <div>
              <label>金額</label>
              <input type="number" id="amount" required min="1">
            </div>
            <div>
              <label>入帳日期</label>
              <input type="date" id="date" required>
            </div>
            <div class="col-span-2">
              <label>備註</label>
              <input type="text" id="notes">
            </div>
            <div class="col-span-2">
              <button type="submit" class="btn btn-primary w-full">新增記錄</button>
            </div>
          </form>
        </div>

        <!-- 奉獻記錄列表 -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold">奉獻記錄列表</h2>
            <div class="flex gap-2">
              <input type="text" id="searchInput" placeholder="搜尋奉獻者..." class="form-input-sm">
              <select id="categoryFilter" class="form-input-sm">
                <option value="">所有類別</option>
                <!-- 動態載入類別 -->
              </select>
            </div>
          </div>

          <!-- 表格 -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>奉獻者</th>
                  <th>類別</th>
                  <th>金額</th>
                  <th>日期</th>
                  <th>備註</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody id="dedicationsTable">
                <!-- 動態載入 -->
              </tbody>
            </table>
          </div>

          <!-- 分頁 -->
          <div id="pagination" class="mt-4 flex justify-center gap-2">
            <!-- 動態載入 -->
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- 編輯記錄模態框 -->
  <div id="editDedicationModal" class="modal hidden">
    <!-- 編輯表單 -->
  </div>

  <!-- JavaScript -->
  <script>
    const taskId = new URLSearchParams(window.location.search).get('taskId');
    let currentTask = null;
    let dedications = [];

    // 載入任務資訊
    async function loadTaskInfo() {
      try {
        const response = await callAPI('getTitheTask', { id: taskId });
        if (response.success) {
          currentTask = response.data;
          renderTaskInfo(currentTask);

          // 隱藏新增表單（如果已完成）
          if (currentTask.status === 'completed') {
            document.getElementById('addDedicationForm').style.display = 'none';
            document.getElementById('completeBtn').style.display = 'none';
          }
        }
      } catch (error) {
        showToast('載入任務失敗', 'error');
      }
    }

    // 載入奉獻記錄
    async function loadDedications() {
      try {
        const response = await callAPI('getDedications', { titheTaskId: taskId });
        if (response.success) {
          dedications = response.data;
          renderDedications(dedications);
        }
      } catch (error) {
        showToast('載入記錄失敗', 'error');
      }
    }

    // 載入統計資料
    async function loadStatistics() {
      try {
        const response = await callAPI('getTitheStatistics', { titheTaskId: taskId });
        if (response.success) {
          renderStatistics(response.data);
        }
      } catch (error) {
        console.error('載入統計失敗', error);
      }
    }

    // 新增奉獻記錄
    async function handleAddDedication(event) {
      event.preventDefault();

      const data = {
        titheTaskId: taskId,
        donor: document.getElementById('donor').value,
        category: document.getElementById('category').value,
        amount: parseFloat(document.getElementById('amount').value),
        date: document.getElementById('date').value,
        notes: document.getElementById('notes').value
      };

      try {
        const response = await callAPI('addDedication', data);
        if (response.success) {
          showToast('記錄已新增', 'success');
          event.target.reset();
          loadDedications();
          loadStatistics();
        }
      } catch (error) {
        showToast('新增失敗: ' + error.message, 'error');
      }
    }

    // 完成任務
    async function completeTask() {
      if (!confirm('確定要完成此任務嗎？完成後將無法再修改記錄。')) {
        return;
      }

      try {
        const response = await callAPI('completeTitheTask', { id: taskId });
        if (response.success) {
          showToast('任務已完成', 'success');
          setTimeout(() => {
            window.location.href = '?page=tithe';
          }, 1500);
        }
      } catch (error) {
        showToast('完成失敗: ' + error.message, 'error');
      }
    }

    // 其他函式...
    // - renderTaskInfo()
    // - renderDedications()
    // - renderStatistics()
    // - editDedication()
    // - deleteDedication()
    // - generatePDF()

    // 初始化
    document.addEventListener('DOMContentLoaded', function() {
      if (!taskId) {
        window.location.href = '?page=tithe';
        return;
      }

      loadTaskInfo();
      loadDedications();
      loadStatistics();
    });
  </script>
</body>
</html>
```

### 主要功能

1. **任務資訊顯示**
   - 任務名稱、會計、財務人員、狀態
   - 建立時間、完成時間

2. **統計資訊**
   - 總筆數、總金額
   - 按類別統計
   - 按奉獻者統計（圖表顯示）

3. **奉獻記錄管理**
   - 新增記錄表單（進行中任務可用）
   - 記錄列表（表格顯示）
   - 搜尋和篩選功能
   - 編輯和刪除記錄

4. **操作按鈕**
   - 完成任務（進行中任務可用）
   - 下載 PDF
   - 返回列表

---

## 🎨 樣式指南

### 使用現有的 styles.html

奉獻系統可以重用 `ui/styles.html` 中已定義的樣式：

- `.btn` - 按鈕基礎樣式
- `.btn-primary` - 主要按鈕
- `.btn-secondary` - 次要按鈕
- `.btn-success` - 成功按鈕
- `.btn-danger` - 危險按鈕
- `.form-input` - 表單輸入
- `.badge` - 徽章
- `.modal` - 模態框

### 額外樣式需求

```css
/* 任務卡片 */
.task-card {
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
}

/* 統計卡片 */
.stat-card {
  padding: 1rem;
  border-radius: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 表格樣式 */
table th {
  background-color: #f3f4f6;
  padding: 0.75rem;
  text-align: left;
  font-weight: 600;
}

table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

/* 深色模式 */
.dark table th {
  background-color: #374151;
}

.dark table td {
  border-bottom-color: #4b5563;
}
```

---

## 🔧 JavaScript 函式庫

### 必要函式

所有頁面都需要以下函式：

1. **callAPI()** - API 包裝函式
2. **showToast()** - 顯示通知
3. **formatDate()** - 日期格式化
4. **formatCurrency()** - 金額格式化
5. **openModal() / closeModal()** - 模態框管理

這些可以從 `ui/scripts.html` 中重用或創建新的 `ui/tithe-scripts.html`。

---

## 📱 響應式設計

### 斷點

- **Mobile** (< 640px): 單列顯示
- **Tablet** (640px - 1024px): 雙列顯示
- **Desktop** (> 1024px): 三列顯示

### 調整

```html
<!-- 任務列表：響應式網格 -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- 詳情頁面：響應式佈局 -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

<!-- 表單：響應式輸入 -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

---

## ✅ 實作檢查清單

### TitheTasks.html (任務列表頁面)
- [ ] 導航列（含連結到採購板）
- [ ] 深色模式切換
- [ ] 使用者選單
- [ ] 狀態篩選
- [ ] 任務列表（卡片顯示）
- [ ] 新增任務模態框
- [ ] 載入財務人員清單
- [ ] 生成摘要 PDF
- [ ] 刪除任務功能
- [ ] Toast 通知
- [ ] 響應式佈局

### TitheTaskDetail.html (任務詳情頁面)
- [ ] 導航列（返回列表）
- [ ] 任務資訊顯示
- [ ] 統計資訊顯示
- [ ] 新增奉獻記錄表單
- [ ] 奉獻記錄列表（表格）
- [ ] 搜尋功能
- [ ] 類別篩選
- [ ] 編輯記錄模態框
- [ ] 刪除記錄功能
- [ ] 完成任務功能
- [ ] 生成 PDF 功能
- [ ] 分頁功能
- [ ] 響應式佈局

### JavaScript 函式
- [ ] callAPI() - API 包裝
- [ ] loadTasks() - 載入任務列表
- [ ] renderTasks() - 渲染任務
- [ ] loadTaskInfo() - 載入任務資訊
- [ ] loadDedications() - 載入奉獻記錄
- [ ] loadStatistics() - 載入統計
- [ ] renderDedications() - 渲染記錄
- [ ] renderStatistics() - 渲染統計
- [ ] handleCreateTask() - 建立任務
- [ ] handleAddDedication() - 新增記錄
- [ ] editDedication() - 編輯記錄
- [ ] deleteDedication() - 刪除記錄
- [ ] completeTask() - 完成任務
- [ ] generatePDF() - 生成 PDF
- [ ] showToast() - 顯示通知

---

## 📝 實作順序建議

1. **第一階段**：基礎結構
   - 更新 WebApp.gs 路由
   - 創建 TitheTasks.html 基礎架構
   - 實作任務列表顯示

2. **第二階段**：任務管理
   - 新增任務模態框
   - 載入財務人員清單
   - 刪除任務功能

3. **第三階段**：詳情頁面
   - 創建 TitheTaskDetail.html
   - 實作奉獻記錄表單
   - 記錄列表顯示

4. **第四階段**：高級功能
   - 編輯和刪除記錄
   - 統計資訊顯示
   - PDF 生成功能

5. **第五階段**：優化
   - 搜尋和篩選
   - 分頁功能
   - 響應式調整
   - 深色模式支援

---

## 🔗 相關檔案

- **後端 API**: `gas-project/api/TitheAPI.gs`
- **PDF 服務**: `gas-project/services/TithePDFService.gs`
- **DAO**: `gas-project/dao/TitheDAO.gs`, `DedicationDAO.gs`
- **樣式**: `ui/styles.html`
- **腳本**: `ui/scripts.html` (可重用的函式)

---

## 📊 預期成果

完成後，奉獻計算系統將提供：

1. **直觀的任務管理**
   - 清晰的任務列表
   - 狀態標示
   - 快速篩選

2. **高效的資料輸入**
   - 簡潔的表單設計
   - 即時驗證
   - 批次操作支援

3. **完整的統計功能**
   - 即時統計資訊
   - 按類別/奉獻者分析
   - 視覺化圖表

4. **專業的報告生成**
   - 格式化 PDF 報告
   - 詳細的統計資料
   - 完整的明細列表

---

**實作指南版本**: 1.0
**最後更新**: 2025-11-14
**後端狀態**: ✅ 100% 完成
**前端狀態**: ⏳ 待實作
