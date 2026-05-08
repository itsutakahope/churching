# BQ GRACE CHURCH - UI/UX 風格指南

> **版本：** 1.0.0
> **最後更新：** 2025-11-14
> **適用專案：** 採購板與奉獻計算系統

本文件提供完整的 UI/UX 設計規範，包含色彩系統、元件樣式、佈局模式與最佳實踐，可作為開發新功能或維護現有功能的完整參考。

---

## 目錄

1. [技術堆疊](#1-技術堆疊)
2. [色彩系統](#2-色彩系統)
3. [元件樣式庫](#3-元件樣式庫)
4. [深色模式實現](#4-深色模式實現)
5. [佈局與響應式設計](#5-佈局與響應式設計)
6. [字體與排版](#6-字體與排版)
7. [間距與圓角系統](#7-間距與圓角系統)
8. [動畫與過渡](#8-動畫與過渡)
9. [圖示系統](#9-圖示系統)
10. [最佳實踐檢查清單](#10-最佳實踐檢查清單)

---

## 1. 技術堆疊

### 核心技術
- **前端框架：** React 18
- **建置工具：** Vite
- **樣式框架：** Tailwind CSS
- **圖示庫：** Lucide React
- **路由：** React Router

### 核心配置檔案
- **Tailwind 配置：** `tailwind.config.js`
- **全域樣式：** `client/index.css`
- **CSS 變數：** `client/App.css`
- **主題管理：** `client/ThemeContext.jsx`

---

## 2. 色彩系統

### 2.1 品牌色彩

#### 主色系 - 榮耀紅 (Glory Red)
```javascript
'glory-red': {
  50:  '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#A91D22',  // 主色調
  600: '#991B1F',  // Hover 狀態
  700: '#7F1D1F',
  800: '#6B1D1D',
  900: '#4B1D1D'
}
```

**使用場景：**
- 主要按鈕背景
- 導航列 Active 狀態
- 重要標題背景
- Focus 狀態外框

#### 輔助色系 - 聖光金 (Holy Gold)
```javascript
'holy-gold': {
  100: '#FEF3C7',
  500: '#E4B869',  // 次要操作
  600: '#D69E2E',  // Hover 狀態
  800: '#92400E'
}
```

**使用場景：**
- 次要按鈕
- 特殊狀態標籤
- 強調文字

#### 中性色系 - 石墨黑 (Graphite)
```javascript
'graphite': {
  100: '#F3F4F6',  // 淺背景
  200: '#E5E7EB',  // 邊框、分隔線
  300: '#D1D5DB',  // 輸入框邊框
  400: '#9CA3AF',  // 禁用狀態
  500: '#6B7280',  // 次要文字
  600: '#4B5563',  // 深色邊框
  700: '#374151',  // 主要文字（淺色模式）
  800: '#1F2937',
  900: '#222222'   // 主要文字（深）
}
```

### 2.2 深色模式專用色彩

```javascript
colors: {
  'dark-primary': '#E5484D',      // 熾熱之紅（更亮更鮮活）
  'dark-accent': '#FFD479',       // 榮光金
  'dark-text-main': '#EAEAEA',    // 月光白（主要文字）
  'dark-text-subtle': '#A0A0A0',  // 星辰灰（次要文字）
  'dark-surface': '#1A1A1A',      // 曜石黑（元件背景）
  'dark-background': '#121212',   // 永夜黑（主背景）
}
```

**使用原則：**
- 深色模式使用更高對比度的色彩
- 避免純黑 (#000000)，使用 `dark-background` (#121212)
- 文字使用 `dark-text-main` 確保可讀性

### 2.3 語意化狀態色彩

#### 成功色 (Success)
```javascript
success: {
  DEFAULT: '#28A745',  // 淺色模式
  dark: '#30C44E'      // 深色模式
}
```
**使用場景：** 成功訊息、完成狀態、正向操作

#### 危險色 (Danger)
```javascript
danger: {
  DEFAULT: '#DC3545',  // 淺色模式
  dark: '#F87171'      // 深色模式
}
```
**使用場景：** 錯誤訊息、刪除按鈕、警告提示

#### 警告色 (Warning)
```javascript
warning: {
  DEFAULT: '#FFC107',  // 淺色模式
  dark: '#FBBF24'      // 深色模式
}
```
**使用場景：** 警告訊息、待處理狀態

#### 資訊色 (Info)
```javascript
info: {
  DEFAULT: '#17A2B8',  // 淺色模式
  dark: '#06B6D4'      // 深色模式
}
```
**使用場景：** 提示訊息、資訊性內容

### 2.4 語意化別名（推薦使用）

```javascript
// 背景色
'background': 'colors.gray.50',          // 淺色主背景
'surface': 'colors.white',               // 淺色元件背景
'cloud-white': 'colors.gray.50',         // 雲白色

// 文字色
'text-main': 'colors.graphite.900',      // 主要文字
'text-subtle': 'colors.graphite.500',    // 次要文字
```

---

## 3. 元件樣式庫

### 3.1 按鈕元件

#### 主要按鈕 (Primary Button)
```jsx
<button className="bg-glory-red-500 dark:bg-dark-primary
                   hover:bg-glory-red-600 dark:hover:bg-dark-primary/90
                   disabled:bg-graphite-400 dark:disabled:bg-graphite-600
                   text-white font-bold py-2 px-4 rounded-lg
                   flex items-center gap-2
                   transition-theme">
  <Plus size={20} />
  新增項目
</button>
```

**狀態變化：**
- **Normal:** `bg-glory-red-500 dark:bg-dark-primary`
- **Hover:** `hover:bg-glory-red-600 dark:hover:bg-dark-primary/90`
- **Disabled:** `disabled:bg-graphite-400 dark:disabled:bg-graphite-600`

#### 次要按鈕 (Secondary Button)
```jsx
<button className="bg-graphite-200 dark:bg-dark-background
                   text-graphite-900 dark:text-dark-text-main
                   px-4 py-2 rounded-lg
                   hover:bg-graphite-300 dark:hover:bg-dark-surface
                   transition-theme">
  取消
</button>
```

#### 成功按鈕 (Success Button)
```jsx
<button className="bg-success-600 hover:bg-success-700
                   dark:bg-success-700 dark:hover:bg-success-600
                   text-white font-bold py-2 px-4 rounded-lg
                   transition-theme">
  確認
</button>
```

#### 危險按鈕 (Danger Button)
```jsx
<button className="bg-danger-600 dark:bg-danger-dark
                   text-white rounded-lg px-4 py-2
                   hover:bg-danger-700 dark:hover:bg-danger-dark/90
                   transition-theme">
  刪除
</button>
```

#### 載入狀態按鈕
```jsx
<button disabled={isLoading} className="...">
  {isLoading ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      載入中...
    </>
  ) : (
    <>
      <Plus size={20} />
      新增
    </>
  )}
</button>
```

### 3.2 表單元件

#### 文字輸入框 (Text Input)
```jsx
<div>
  <label
    htmlFor="email"
    className="block text-sm font-medium
               text-graphite-700 dark:text-dark-text-main
               mb-2 transition-theme"
  >
    Email*
  </label>
  <input
    id="email"
    type="email"
    placeholder="test@example.com"
    className="w-full border border-graphite-300 dark:border-graphite-600
               rounded-lg px-3 py-2
               bg-surface dark:bg-dark-surface
               text-text-main dark:text-dark-text-main
               placeholder:text-graphite-400 dark:placeholder:text-graphite-500
               focus:outline-none focus:ring-2
               focus:ring-glory-red-500 dark:focus:ring-glory-red-400
               focus:border-glory-red-500 dark:focus:border-glory-red-400
               transition-theme"
  />
</div>
```

**Focus 狀態：**
- 外框：`focus:ring-2 focus:ring-glory-red-500`
- 邊框：`focus:border-glory-red-500`
- 移除預設輪廓：`focus:outline-none`

#### 下拉選單 (Select)
```jsx
<select className="p-2 border border-gray-300 dark:border-graphite-600
                   rounded-md shadow-sm
                   focus:ring-glory-red-500 dark:focus:ring-glory-red-400
                   focus:border-glory-red-500 dark:focus:border-glory-red-400
                   dark:bg-graphite-700 dark:text-dark-text-main
                   transition-theme">
  <option value="">請選擇...</option>
  <option value="1">選項 1</option>
  <option value="2">選項 2</option>
</select>
```

#### 文字區域 (Textarea)
```jsx
<textarea
  rows="4"
  className="w-full border border-graphite-300 dark:border-graphite-600
             rounded-lg px-3 py-2
             bg-surface dark:bg-dark-surface
             text-text-main dark:text-dark-text-main
             focus:outline-none focus:ring-2
             focus:ring-glory-red-500 dark:focus:ring-glory-red-400
             transition-theme"
/>
```

#### 單選按鈕 (Radio Button)
```jsx
<label className="flex items-center cursor-pointer">
  <input
    type="radio"
    name="payment-method"
    value="cash"
    className="focus:ring-glory-red-500 dark:focus:ring-glory-red-400
               h-4 w-4 text-glory-red-600
               border-graphite-300 dark:border-graphite-600
               transition-theme"
  />
  <span className="ml-2 text-sm text-graphite-700 dark:text-dark-text-main">
    現金
  </span>
</label>
```

#### 核取方塊 (Checkbox)
```jsx
<label className="flex items-center cursor-pointer">
  <input
    type="checkbox"
    className="form-checkbox h-5 w-5 rounded
               text-glory-red-600
               focus:ring-glory-red-500/50
               border-graphite-300 dark:border-graphite-600"
  />
  <span className="ml-2 text-sm">接收通知</span>
</label>
```

### 3.3 卡片與容器

#### 標準卡片容器
```jsx
<div className="bg-surface dark:bg-dark-surface
                shadow-md rounded-lg p-6
                transition-theme">
  {/* 卡片內容 */}
</div>
```

#### 次要容器（背景層）
```jsx
<div className="bg-background dark:bg-dark-background
                rounded-lg p-4
                transition-theme">
  {/* 次要內容 */}
</div>
```

#### 成功區塊（綠色強調）
```jsx
<div className="bg-success-50 dark:bg-graphite-800/40
                border-l-4 border-success-500 dark:border-success-600
                p-6 rounded-r-lg
                transition-theme">
  <h3 className="text-success-700 dark:text-dark-text-main font-semibold">
    操作成功
  </h3>
  <p className="text-success-600 dark:text-dark-text-subtle mt-2">
    您的變更已儲存。
  </p>
</div>
```

#### 紅色強調區塊
```jsx
<div className="bg-glory-red-50 dark:bg-dark-surface/80
                border border-glory-red-200 dark:border-dark-primary/30
                rounded-xl p-6
                transition-theme">
  {/* 重要內容 */}
</div>
```

### 3.4 Modal（彈窗）

#### 完整 Modal 結構
```jsx
{isOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50
                  flex items-center justify-center z-50 p-4">
    <div className="bg-surface dark:bg-dark-surface
                    rounded-lg shadow-xl
                    w-full max-w-md max-h-[80vh]
                    flex flex-col
                    transition-theme">

      {/* 標題列 */}
      <div className="bg-glory-red-500 dark:bg-dark-primary
                      p-4 rounded-t-lg
                      flex justify-between items-center
                      border-b border-graphite-200 dark:border-graphite-600
                      transition-theme">
        <h2 className="text-lg font-semibold text-white">
          Modal 標題
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:text-glory-red-100
                     transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 內容區（可滾動） */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* 表單或內容 */}
      </div>

      {/* 按鈕區 */}
      <div className="flex gap-3 p-4
                      border-t border-graphite-200 dark:border-graphite-600
                      transition-theme">
        <button className="flex-1 bg-graphite-200 dark:bg-dark-background
                           text-graphite-900 dark:text-dark-text-main
                           px-4 py-2 rounded-lg
                           hover:bg-graphite-300 dark:hover:bg-dark-surface
                           transition-theme">
          取消
        </button>
        <button className="flex-1 bg-glory-red-500 dark:bg-dark-primary
                           text-white px-4 py-2 rounded-lg
                           hover:bg-glory-red-600 dark:hover:bg-dark-primary/90
                           transition-theme">
          確認
        </button>
      </div>
    </div>
  </div>
)}
```

### 3.5 表格樣式

#### 標準表格
```jsx
<div className="overflow-x-auto">
  <table className="min-w-full bg-surface dark:bg-dark-surface transition-theme">
    <thead className="bg-background dark:bg-dark-background">
      <tr>
        <th className="py-3 px-4 text-left text-sm font-semibold
                       text-text-subtle dark:text-dark-text-subtle
                       border-b border-graphite-200 dark:border-gray-600
                       transition-theme">
          標題欄位
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-graphite-200 dark:border-gray-600
                     hover:bg-background dark:hover:bg-dark-background
                     transition-theme">
        <td className="py-3 px-4 text-text-main dark:text-dark-text-main">
          內容資料
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 成功色表格（綠色主題）
```jsx
<table className="min-w-full">
  <thead className="bg-success-100 dark:bg-graphite-700 transition-theme">
    <tr>
      <th className="py-2 px-3 text-left text-sm font-semibold
                     text-success-700 dark:text-dark-text-main
                     transition-theme">
        標題
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="hover:bg-success-50 dark:hover:bg-graphite-600
                   transition-theme">
      <td className="py-2 px-3">資料</td>
    </tr>
  </tbody>
</table>
```

### 3.6 通知與訊息

#### Toast 通知（成功）
```jsx
<div className="fixed top-4 right-4 z-50
                bg-success-50 dark:bg-success-900/20
                border border-success-100 dark:border-success-800
                text-success-700 dark:text-success-300
                px-4 py-3 rounded-lg shadow-lg
                flex items-center gap-3
                transition-all duration-300">
  <CheckCircle size={20} />
  <span>操作成功！</span>
</div>
```

#### Toast 通知（錯誤）
```jsx
<div className="fixed top-4 right-4 z-50
                bg-danger-50 dark:bg-danger-900/20
                border border-danger-100 dark:border-danger-800
                text-danger-700 dark:text-danger-300
                px-4 py-3 rounded-lg shadow-lg
                flex items-center gap-3
                transition-all duration-300">
  <AlertCircle size={20} />
  <span>發生錯誤，請稍後再試。</span>
</div>
```

#### 內嵌錯誤訊息
```jsx
{error && (
  <p className="text-danger-500 dark:text-danger-dark text-sm
                bg-danger-100 dark:bg-danger-900/20
                p-3 rounded-md border border-danger-200 dark:border-danger-800
                transition-theme">
    {error}
  </p>
)}
```

### 3.7 導航元件

#### NavLink（帶 Active 狀態）
```jsx
<Link
  to="/purchase"
  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-theme ${
    isActive
      ? 'bg-glory-red-500 dark:bg-dark-primary text-white'
      : 'text-graphite-700 dark:text-dark-text-main
         hover:bg-glory-red-50 dark:hover:bg-dark-surface
         hover:text-glory-red-700 dark:hover:text-dark-primary'
  }`}
>
  <LayoutDashboard size={18} />
  採購看板
</Link>
```

### 3.8 主題切換開關

#### Toggle Switch
```jsx
<button
  onClick={toggleTheme}
  className="relative inline-flex items-center h-7 w-12 rounded-full
             transition-colors duration-300 ease-in-out
             focus:outline-none focus:ring-2 focus:ring-offset-2
             focus:ring-glory-red-500 dark:focus:ring-offset-dark-surface
             ${theme === 'dark' ? 'bg-glory-red-500' : 'bg-graphite-200'}"
  aria-label="切換深色模式"
>
  <span
    className={`inline-block h-5 w-5 transform rounded-full
                bg-white shadow-lg
                transition-transform duration-300 ease-in-out
                flex items-center justify-center
                ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
  >
    {theme === 'dark' ? (
      <Moon size={12} className="text-glory-red-500" />
    ) : (
      <Sun size={12} className="text-holy-gold-600" />
    )}
  </span>
</button>
```

### 3.9 狀態標籤（Badge）

#### 狀態 Badge
```jsx
<span className={`px-2 py-1 rounded-full text-xs font-semibold ${
  status === 'completed'
    ? 'bg-success-100 dark:bg-success-dark/20
       text-success-700 dark:text-success-dark'
    : status === 'in_progress'
    ? 'bg-holy-gold-100 dark:bg-dark-accent/20
       text-holy-gold-800 dark:text-dark-accent'
    : 'bg-graphite-100 dark:bg-graphite-700
       text-graphite-600 dark:text-graphite-300'
}`}>
  {statusText}
</span>
```

#### 優先級 Badge
```jsx
<span className={`px-2 py-1 rounded text-xs font-semibold ${
  priority === 'high'
    ? 'bg-danger-100 dark:bg-danger-dark/20 text-danger-700 dark:text-danger-dark'
    : priority === 'medium'
    ? 'bg-warning-100 dark:bg-warning-dark/20 text-warning-700 dark:text-warning-dark'
    : 'bg-graphite-100 dark:bg-graphite-700 text-graphite-600'
}`}>
  {priorityLabel}
</span>
```

---

## 4. 深色模式實現

### 4.1 ThemeContext 設定

**檔案位置：** `client/ThemeContext.jsx`

```jsx
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      isLight: theme === 'light'
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 4.2 在元件中使用主題

```jsx
import { useTheme } from './ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="bg-white dark:bg-dark-surface transition-theme">
      <p>目前主題：{theme}</p>
      <button onClick={toggleTheme}>切換主題</button>
    </div>
  );
}
```

### 4.3 深色模式樣式規則

#### 必須遵守的原則
1. **同時定義淺色與深色模式樣式**
   ```jsx
   // ✅ 正確
   className="bg-white dark:bg-dark-surface"

   // ❌ 錯誤（缺少深色模式）
   className="bg-white"
   ```

2. **所有支援深色模式的元素必須包含 `transition-theme`**
   ```jsx
   // ✅ 正確
   className="bg-white dark:bg-dark-surface transition-theme"

   // ❌ 錯誤（缺少過渡動畫）
   className="bg-white dark:bg-dark-surface"
   ```

3. **使用語意化色彩別名而非硬編碼**
   ```jsx
   // ✅ 正確
   className="text-text-main dark:text-dark-text-main"

   // ❌ 錯誤（硬編碼顏色）
   className="text-gray-900 dark:text-gray-100"
   ```

4. **深色模式避免純黑色**
   ```jsx
   // ✅ 正確（使用 #121212）
   className="dark:bg-dark-background"

   // ❌ 錯誤（使用純黑 #000000）
   className="dark:bg-black"
   ```

### 4.4 過渡動畫配置

**Tailwind 配置（tailwind.config.js）：**
```javascript
extend: {
  transitionProperty: {
    'theme': 'background-color, border-color, color, fill, stroke'
  },
  transitionDuration: {
    'theme': '300ms'
  },
  transitionTimingFunction: {
    'theme': 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
}
```

**CSS 類別（index.css）：**
```css
.transition-theme {
  transition: background-color 0.3s ease,
              color 0.3s ease,
              border-color 0.3s ease;
}
```

---

## 5. 佈局與響應式設計

### 5.1 主容器佈局

#### 應用程式主容器
```jsx
<div className="bg-cloud-white dark:bg-dark-background
                min-h-screen p-1 sm:p-6
                transition-theme">
  <div className="max-w-6xl mx-auto">
    {/* 頁面內容 */}
  </div>
</div>
```

**說明：**
- `min-h-screen`：確保容器至少佔滿螢幕高度
- `p-1 sm:p-6`：行動裝置使用小間距，桌面使用大間距
- `max-w-6xl mx-auto`：限制最大寬度並置中

### 5.2 Header 佈局模式

#### 三欄 Grid 佈局
```jsx
<header className="flex items-center justify-between
                   md:grid md:grid-cols-3 md:gap-4
                   mb-3 sm:mb-6
                   transition-theme">
  {/* 左側（桌面顯示） */}
  <div className="hidden md:block">
    <button>返回</button>
  </div>

  {/* 中間標題 */}
  <h1 className="text-xl sm:text-2xl md:text-3xl
                 text-center
                 text-graphite-900 dark:text-dark-text-main
                 font-bold transition-theme">
    頁面標題
  </h1>

  {/* 右側操作 */}
  <div className="flex justify-end gap-2">
    <ThemeSwitcher />
    <ProfileMenu />
  </div>
</header>
```

**響應式行為：**
- 小螢幕：使用 Flexbox，標題與右側操作水平排列
- 中等螢幕以上：使用 Grid 三欄佈局

### 5.3 表單 Grid 佈局

#### 響應式表單欄位
```jsx
<form className="space-y-4">
  {/* 第一排：5 個欄位 */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    <div className="flex flex-col">
      <label className="block text-sm font-medium mb-2">奉獻日期</label>
      <input type="date" className="..." />
    </div>
    <div className="flex flex-col">
      <label className="block text-sm font-medium mb-2">會計類別</label>
      <select className="...">...</select>
    </div>
    {/* 其餘欄位... */}
  </div>

  {/* 第二排：按鈕組 */}
  <div className="flex gap-3 justify-end">
    <button>取消</button>
    <button>送出</button>
  </div>
</form>
```

**響應式行為：**
- 小螢幕 (< 768px)：1 欄
- 中等螢幕 (768px - 1024px)：2 欄
- 大螢幕 (≥ 1024px)：5 欄

### 5.4 Flexbox 常用模式

#### 水平置中佈局
```jsx
<div className="flex items-center justify-center gap-2">
  <Icon size={20} />
  <span>文字內容</span>
</div>
```

#### 空間分配佈局（Space Between）
```jsx
<div className="flex justify-between items-center">
  <h2 className="text-lg font-semibold">標題</h2>
  <button>操作按鈕</button>
</div>
```

#### 垂直堆疊（帶間距）
```jsx
<div className="space-y-4">
  <div>區塊 1</div>
  <div>區塊 2</div>
  <div>區塊 3</div>
</div>
```

#### 水平排列（帶間距）
```jsx
<div className="flex gap-3">
  <button>按鈕 1</button>
  <button>按鈕 2</button>
  <button>按鈕 3</button>
</div>
```

### 5.5 響應式斷點

**Tailwind 預設斷點：**

| 前綴 | 最小寬度 | 裝置類型 |
|------|----------|----------|
| `sm:` | 640px | 小型平板、大型手機 |
| `md:` | 768px | 平板 |
| `lg:` | 1024px | 小型桌面 |
| `xl:` | 1280px | 桌面 |
| `2xl:` | 1536px | 大型桌面 |

#### 常見響應式模式
```jsx
// 文字大小響應式
className="text-xl sm:text-2xl md:text-3xl"

// 間距響應式
className="p-1 sm:p-4 md:p-6"

// 顯示/隱藏響應式
className="hidden md:block"        // 中等螢幕以上顯示
className="block sm:hidden"        // 小螢幕顯示，更大隱藏

// Grid 欄數響應式
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Flex 方向響應式
className="flex flex-col sm:flex-row"
```

### 5.6 特殊佈局模式

#### 滾動容器
```jsx
<div className="max-h-[80vh] overflow-y-auto">
  {/* 長內容 */}
</div>
```

#### 固定高度容器（帶滾動）
```jsx
<div className="space-y-2 max-h-48 overflow-y-auto
                border border-graphite-200 dark:border-graphite-600
                rounded-lg p-3">
  {items.map(item => (
    <div key={item.id}>{item.name}</div>
  ))}
</div>
```

#### 響應式計算式顯示（水平/垂直切換）
```jsx
{/* 大螢幕：水平排列 */}
<div className="hidden sm:flex items-center gap-3">
  <span>現金</span>
  <Plus size={16} />
  <span>支票</span>
  <Equal size={16} />
  <span className="font-bold">總計</span>
</div>

{/* 小螢幕：垂直排列 */}
<div className="block sm:hidden space-y-3">
  <div>現金：NT$ 1,000</div>
  <div>支票：NT$ 2,000</div>
  <div className="border-t pt-2">總計：NT$ 3,000</div>
</div>
```

---

## 6. 字體與排版

### 6.1 字體系統

**字體設定（App.css）：**
```css
body {
  font-family: sans-serif;
}
```

**說明：** 使用系統預設 sans-serif 字體堆疊，確保在不同平台上都有良好的可讀性。

### 6.2 字體大小階層

| 用途 | Tailwind Class | 實際大小 | 使用場景 |
|------|----------------|----------|----------|
| 主標題 (h1) | `text-xl sm:text-2xl md:text-3xl` | 響應式 | 頁面主標題 |
| 次標題 (h2) | `text-2xl` | 1.5rem | 區段標題 |
| 三級標題 (h3) | `text-xl` | 1.25rem | 卡片標題 |
| 四級標題 (h4) | `text-lg` | 1.125rem | 小區段標題 |
| 正文 | `text-base` | 1rem | 主要內容 |
| 小文字 | `text-sm` | 0.875rem | 次要資訊、標籤 |
| 極小文字 | `text-xs` | 0.75rem | Badge、說明文字 |
| 大數字顯示 | `text-xl lg:text-2xl` | 響應式 | 統計數字 |

### 6.3 字重（Font Weight）

| Tailwind Class | 數值 | 使用場景 |
|----------------|------|----------|
| `font-normal` | 400 | 正文 |
| `font-medium` | 500 | 次要標題、強調文字 |
| `font-semibold` | 600 | 表格標題、卡片標題 |
| `font-bold` | 700 | 按鈕、主標題 |

### 6.4 行高與間距

```jsx
// 緊湊行高（標題）
className="leading-tight"

// 標準行高（正文）
className="leading-normal"  // 預設值

// 寬鬆行高（易讀性）
className="leading-relaxed"
```

### 6.5 文字顏色

```jsx
// 主要文字
className="text-text-main dark:text-dark-text-main"
// 等同於 text-graphite-900 dark:text-dark-text-main

// 次要文字
className="text-text-subtle dark:text-dark-text-subtle"
// 等同於 text-graphite-500 dark:text-dark-text-subtle

// 淺色文字（在深色背景上）
className="text-white"
```

### 6.6 特殊排版

#### 截斷文字（單行）
```jsx
className="truncate"  // overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
```

#### 限制行數
```jsx
className="line-clamp-2"  // 最多顯示 2 行，其餘省略
```

#### 字間距
```jsx
className="tracking-wide"  // 用於標題
className="tracking-normal"  // 預設值
```

---

## 7. 間距與圓角系統

### 7.1 內間距（Padding）

**Tailwind Spacing Scale（基於 4px）：**

| Class | 數值 | 使用場景 |
|-------|------|----------|
| `p-1` | 0.25rem (4px) | 極小元素 |
| `p-2` | 0.5rem (8px) | 小按鈕、Badge |
| `p-3` | 0.75rem (12px) | 輸入框、次要容器 |
| `p-4` | 1rem (16px) | 標準按鈕、Modal 內容 |
| `p-6` | 1.5rem (24px) | 卡片內容 |
| `p-8` | 2rem (32px) | 大容器 |

**常用模式：**
```jsx
// 按鈕
className="py-2 px-4"  // 垂直 8px，水平 16px

// 輸入框
className="px-3 py-2"  // 水平 12px，垂直 8px

// 卡片
className="p-6"        // 全方向 24px

// 響應式間距
className="p-1 sm:p-4 md:p-6"
```

### 7.2 外間距（Margin）

**常用模式：**
```jsx
// 標籤下方
className="mb-2"  // 8px

// 區塊下方
className="mb-4"  // 16px

// 大區塊下方
className="mb-6"  // 24px

// 頂部間距
className="mt-4"  // 16px

// 響應式外距
className="mb-3 sm:mb-6"
```

### 7.3 間隙（Gap）

**用於 Flexbox 與 Grid：**

```jsx
// 小間隙（圖示與文字）
className="gap-2"  // 8px

// 中間隙（按鈕組）
className="gap-3"  // 12px

// 大間隙（表單欄位）
className="gap-4"  // 16px

// 垂直堆疊間距
className="space-y-4"  // 子元素之間垂直間距 16px

// 水平排列間距
className="space-x-3"  // 子元素之間水平間距 12px
```

### 7.4 圓角（Border Radius）

| Class | 數值 | 使用場景 |
|-------|------|----------|
| `rounded` | 0.25rem (4px) | 小元素（checkbox、小按鈕） |
| `rounded-md` | 0.375rem (6px) | 輸入框、下拉選單 |
| `rounded-lg` | 0.5rem (8px) | 按鈕、卡片 |
| `rounded-xl` | 0.75rem (12px) | 大卡片、特殊容器 |
| `rounded-full` | 9999px | 圓形元素（Badge、頭像） |

**方向性圓角：**
```jsx
// 只圓角上方
className="rounded-t-lg"

// 只圓角下方
className="rounded-b-lg"

// 只圓角右方
className="rounded-r-lg"
```

### 7.5 邊框（Border）

```jsx
// 標準邊框
className="border border-graphite-300 dark:border-graphite-600"

// 粗邊框
className="border-2 border-glory-red-500"

// 方向性邊框
className="border-t border-b"  // 只有上下邊框
className="border-l-4"          // 左側 4px 邊框
```

### 7.6 陰影（Shadow）

| Class | 使用場景 |
|-------|----------|
| `shadow-sm` | 輕微陰影（輸入框） |
| `shadow` | 標準陰影（按鈕） |
| `shadow-md` | 中等陰影（卡片） |
| `shadow-lg` | 大陰影（Toggle switch） |
| `shadow-xl` | 特大陰影（Modal、浮動元件） |
| `shadow-2xl` | 超大陰影（強調元素） |

```jsx
// 卡片陰影
className="shadow-md"

// Modal 陰影
className="shadow-xl"

// Hover 時增加陰影
className="shadow-md hover:shadow-lg transition-shadow"
```

---

## 8. 動畫與過渡

### 8.1 標準過渡動畫

#### 主題切換過渡
```jsx
className="transition-theme"
```

**等同於：**
```css
transition: background-color 0.3s ease,
            color 0.3s ease,
            border-color 0.3s ease;
```

**使用場景：** 所有支援深色模式的元素

#### 顏色過渡
```jsx
className="transition-colors duration-300"
```

**使用場景：** Hover 狀態、按鈕互動

#### 變形過渡
```jsx
className="transition-transform duration-300"
```

**使用場景：** Toggle switch、展開/收合動畫

#### 陰影過渡
```jsx
className="transition-shadow duration-300"
```

**使用場景：** 卡片 Hover 效果

#### 全面過渡
```jsx
className="transition-all duration-300 ease-in-out"
```

**使用場景：** Toast 通知、滑入滑出動畫

### 8.2 動畫效果

#### 旋轉動畫（載入指示器）
```jsx
<Loader2 size={20} className="animate-spin" />
```

**等同於：**
```css
animation: spin 1s linear infinite;
```

#### 彈跳動畫
```jsx
className="animate-bounce"
```

#### 脈衝動畫
```jsx
className="animate-pulse"
```

### 8.3 Hover 效果模式

#### 按鈕 Hover
```jsx
// 背景色變化
className="bg-glory-red-500 hover:bg-glory-red-600
           dark:bg-dark-primary dark:hover:bg-dark-primary/90
           transition-colors"

// 透明度變化
className="hover:opacity-80 transition-opacity"

// 陰影變化
className="shadow-md hover:shadow-lg transition-shadow"
```

#### 卡片 Hover
```jsx
className="bg-surface dark:bg-dark-surface
           hover:bg-background dark:hover:bg-dark-background
           transition-theme cursor-pointer"
```

#### 文字 Hover
```jsx
className="text-graphite-700 dark:text-dark-text-main
           hover:text-glory-red-600 dark:hover:text-dark-primary
           hover:underline
           transition-colors"
```

### 8.4 Toast 通知動畫

```jsx
<div className={`
  fixed top-4 right-4 z-50
  transition-all duration-300 ease-in-out transform
  ${isShowing
    ? 'translate-x-0 opacity-100'
    : 'translate-x-full opacity-0'
  }
`}>
  {/* Toast 內容 */}
</div>
```

**行為：**
- 顯示時：從右側滑入 (`translate-x-0`)，完全不透明 (`opacity-100`)
- 隱藏時：滑出至右側 (`translate-x-full`)，完全透明 (`opacity-0`)

### 8.5 Toggle Switch 動畫

```jsx
<span className={`
  inline-block h-5 w-5 transform rounded-full
  bg-white shadow-lg
  transition-transform duration-300 ease-in-out
  ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
`}>
  {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
</span>
```

**行為：**
- 深色模式：開關滑塊向右移動 (`translate-x-6`)
- 淺色模式：開關滑塊向左移動 (`translate-x-1`)

### 8.6 過渡時間建議

| 用途 | 時間 | Class |
|------|------|-------|
| 快速互動（按鈕 Hover） | 150ms | `duration-150` |
| 標準過渡（主題切換） | 300ms | `duration-300` |
| 慢速動畫（展開收合） | 500ms | `duration-500` |

---

## 9. 圖示系統

### 9.1 圖示庫

**使用：** [Lucide React](https://lucide.dev/)

**安裝：**
```bash
npm install lucide-react
```

### 9.2 常用圖示清單

#### 操作類圖示
```javascript
import {
  Plus,           // 新增
  Edit,           // 編輯
  Trash2,         // 刪除
  X,              // 關閉
  Send,           // 發送
  Download,       // 下載
  Upload,         // 上傳
  Save,           // 儲存
  Search,         // 搜尋
  Filter,         // 篩選
  RefreshCw,      // 重新整理
} from 'lucide-react';
```

#### 使用者與身份驗證
```javascript
import {
  LogIn,          // 登入
  LogOut,         // 登出
  User,           // 使用者
  UserPlus,       // 新增使用者
  Users,          // 多個使用者
  Shield,         // 權限/安全
  UserX,          // 禁用使用者
} from 'lucide-react';
```

#### 資料與內容
```javascript
import {
  Calendar,       // 日期
  Tag,            // 標籤
  Receipt,        // 收據/發票
  DollarSign,     // 金額
  FileText,       // 文件
  Paperclip,      // 附件
} from 'lucide-react';
```

#### 狀態與回饋
```javascript
import {
  CheckCircle,    // 成功/完成
  AlertCircle,    // 警告/錯誤
  Info,           // 資訊
  WifiOff,        // 離線/網路錯誤
  Loader2,        // 載入中（可旋轉）
} from 'lucide-react';
```

#### 導航與介面
```javascript
import {
  ChevronDown,    // 向下箭頭
  ChevronUp,      // 向上箭頭
  ChevronLeft,    // 向左箭頭
  ChevronRight,   // 向右箭頭
  LayoutDashboard,// 看板
  Menu,           // 選單
  MoreVertical,   // 更多選項（垂直）
} from 'lucide-react';
```

#### 主題與外觀
```javascript
import {
  Sun,            // 淺色模式
  Moon,           // 深色模式
} from 'lucide-react';
```

#### 業務專用
```javascript
import {
  HandCoins,      // 奉獻
  MessageCircle,  // 留言/評論
  ShoppingCart,   // 採購
  Package,        // 包裹/物品
} from 'lucide-react';
```

### 9.3 使用模式

#### 標準大小
```jsx
<Plus size={20} />
```

**建議大小：**
- 小圖示：16px
- 標準圖示：20px
- 大圖示：24px

#### 與文字配合
```jsx
<button className="flex items-center gap-2">
  <LogIn size={18} />
  <span>登入</span>
</button>
```

#### 旋轉動畫（載入中）
```jsx
<Loader2 size={16} className="animate-spin" />
```

#### 自訂顏色
```jsx
<CheckCircle size={20} className="text-success-600" />
<AlertCircle size={20} className="text-danger-600" />
```

#### 在 Input 中使用
```jsx
<div className="relative">
  <Search size={18} className="absolute left-3 top-3 text-graphite-400" />
  <input
    type="text"
    className="pl-10 ..."
    placeholder="搜尋..."
  />
</div>
```

---

## 10. 最佳實踐檢查清單

### 10.1 設計一致性

- ✅ **色彩使用**
  - 所有顏色使用 Tailwind 配置的語意化別名
  - 不直接使用 `#hex` 顏色碼
  - 使用 `glory-red`、`holy-gold`、`graphite` 等預定義色系

- ✅ **深色模式支援**
  - 所有深色模式元素包含 `transition-theme` class
  - 同時定義淺色與深色模式樣式
  - 避免使用純黑色 (#000000)，使用 `dark-background` (#121212)

- ✅ **圖示系統**
  - 統一使用 Lucide React 作為圖示庫
  - 不混用多個圖示庫
  - 圖示大小保持一致（16/18/20/24px）

- ✅ **間距系統**
  - 使用 Tailwind spacing scale（4 的倍數）
  - 不使用自訂的 `m-[13px]` 等非標準間距

### 10.2 響應式設計

- ✅ **行動優先**
  - 預設樣式為小螢幕設計
  - 使用 `sm:`、`md:`、`lg:` 前綴漸進增強

- ✅ **文字大小響應式**
  - 標題使用 `text-xl sm:text-2xl md:text-3xl`
  - 確保小螢幕上的可讀性

- ✅ **間距響應式**
  - 使用 `p-1 sm:p-4 md:p-6` 等響應式間距
  - 避免小螢幕上過大的間距

- ✅ **佈局響應式**
  - Grid 使用 `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  - Flex 方向使用 `flex-col sm:flex-row`

### 10.3 可訪問性（Accessibility）

- ✅ **表單元素**
  - 所有 `<input>` 都有對應的 `<label>`
  - 使用 `htmlFor` 連接 label 與 input
  - 必填欄位標示 `required` 或 `*`

- ✅ **按鈕狀態**
  - 包含 `disabled` 狀態樣式
  - 載入中時禁用按鈕並顯示 Loader

- ✅ **Focus 狀態**
  - 所有可互動元素都有明確的 Focus 狀態
  - 使用 `focus:ring-2 focus:ring-glory-red-500`

- ✅ **顏色對比度**
  - 文字與背景對比度符合 WCAG AA 標準（至少 4.5:1）
  - 不僅依賴顏色傳達資訊

- ✅ **語意化 HTML**
  - 使用正確的 HTML 標籤（`<button>` 而非 `<div onClick>`）
  - 使用 `aria-label` 為圖示按鈕提供說明

### 10.4 使用者體驗

- ✅ **載入狀態**
  - 非同步操作顯示 Loader 圖示
  - 載入中時禁用表單提交

- ✅ **錯誤處理**
  - 錯誤訊息清晰可見
  - 使用紅色視覺提示（`text-danger-500`）

- ✅ **Hover 狀態**
  - 所有可點擊元素都有 Hover 效果
  - 使用 `transition-colors` 提供流暢過渡

- ✅ **回饋機制**
  - 成功操作顯示 Toast 通知
  - 使用 CheckCircle 圖示強化視覺回饋

### 10.5 效能最佳化

- ✅ **過渡動畫**
  - 動畫時間控制在 150ms - 300ms
  - 避免過於複雜的動畫影響效能

- ✅ **條件渲染**
  - Modal 使用 `{isOpen && <Modal />}` 而非 `display: none`
  - 減少不必要的 DOM 元素

- ✅ **圖示大小**
  - 不過度使用超大圖示
  - 標準操作圖示使用 16-20px

### 10.6 程式碼品質

- ✅ **Class 命名**
  - 使用 Tailwind utility classes
  - 避免自訂 CSS 類別（除非必要）

- ✅ **重複程式碼**
  - 將重複的樣式組合提取為共用元件
  - 使用 Context 管理全域狀態（如主題）

- ✅ **註解與文件**
  - 複雜的佈局添加註解說明
  - 保持程式碼可讀性

---

## 11. 快速參考

### 11.1 核心配置檔案路徑

```
/home/user/churching/
├── tailwind.config.js          # Tailwind 配置（色彩、間距、過渡）
├── client/
│   ├── index.css               # 全域樣式（transition-theme 定義）
│   ├── App.css                 # CSS 變數（背景色）
│   ├── ThemeContext.jsx        # 主題管理
│   ├── AuthContext.jsx         # 身份驗證
│   └── components/
│       ├── ToastNotification.jsx     # 通知元件
│       ├── ThemeSwitcher.jsx         # 主題切換開關
│       └── CategorySelector.jsx      # 類別選擇器
```

### 11.2 快速複製範本

#### 完整的主要按鈕
```jsx
<button
  onClick={handleSubmit}
  disabled={isLoading}
  className="bg-glory-red-500 dark:bg-dark-primary
             hover:bg-glory-red-600 dark:hover:bg-dark-primary/90
             disabled:bg-graphite-400 dark:disabled:bg-graphite-600
             text-white font-bold py-2 px-4 rounded-lg
             flex items-center justify-center gap-2
             transition-theme"
>
  {isLoading ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      載入中...
    </>
  ) : (
    <>
      <Plus size={20} />
      新增項目
    </>
  )}
</button>
```

#### 完整的輸入欄位
```jsx
<div>
  <label
    htmlFor="email"
    className="block text-sm font-medium
               text-graphite-700 dark:text-dark-text-main
               mb-2 transition-theme"
  >
    Email*
  </label>
  <input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="test@example.com"
    className="w-full border border-graphite-300 dark:border-graphite-600
               rounded-lg px-3 py-2
               bg-surface dark:bg-dark-surface
               text-text-main dark:text-dark-text-main
               focus:outline-none focus:ring-2
               focus:ring-glory-red-500 dark:focus:ring-glory-red-400
               focus:border-glory-red-500 dark:focus:border-glory-red-400
               transition-theme"
    required
  />
</div>
```

#### 完整的卡片
```jsx
<div className="bg-surface dark:bg-dark-surface
                shadow-md rounded-lg p-6
                transition-theme">
  <h2 className="text-xl font-semibold
                 text-text-main dark:text-dark-text-main
                 mb-4 transition-theme">
    卡片標題
  </h2>
  <p className="text-text-subtle dark:text-dark-text-subtle
                transition-theme">
    卡片內容
  </p>
</div>
```

---

## 12. 版本歷史

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| 1.0.0 | 2025-11-14 | 初始版本，完整 UI/UX 風格指南 |

---

## 13. 授權與使用

本風格指南專為 **BQ GRACE CHURCH** 專案開發團隊提供，僅供內部使用。未經授權不得對外公開或用於其他專案。

---

**文件維護者：** 開發團隊
**聯絡方式：** 請參考專案 README.md
