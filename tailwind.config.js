/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // For classes used in the main HTML file
    "./client/**/*.{js,ts,jsx,tsx}", // For classes used in React components
  ],
  theme: {
    extend: {
      colors: {
        // 品牌色彩 - 榮耀紅 (Glory Red)
        'glory-red': {
          50: '#FEF2F2',   // 最淺色調，用於背景和淺色狀態
          100: '#FEE2E2',  // 淺色調，用於 hover 背景
          200: '#FECACA',  // 較淺色調，用於邊框和分隔線
          300: '#FCA5A5',  // 中淺色調
          400: '#F87171',  // 中等色調
          500: '#A91D22',  // 主色調，用於主要按鈕和品牌元素
          600: '#991B1F',  // 深色調，用於 hover 狀態
          700: '#7F1D1D',  // 更深色調，用於 active 狀態
          800: '#6B1D1D',  // 很深色調
          900: '#4B1D1D',  // 最深色調
        },
        
        // 輔助色彩 - 聖光金 (Holy Gold)
        'holy-gold': {
          50: '#FFFBEB',   // 最淺金色，用於背景
          100: '#FEF3C7',  // 淺金色，用於 hover 背景
          200: '#FDE68A',  // 較淺金色
          300: '#FCD34D',  // 中淺金色
          400: '#FBBF24',  // 中等金色
          500: '#E4B869',  // 主金色，用於次要操作
          600: '#D69E2E',  // 深金色，用於 hover 狀態
          700: '#B7791F',  // 更深金色，用於 active 狀態
          800: '#92400E',  // 很深金色
          900: '#78350F',  // 最深金色
        },
        
        // 中性色彩 - 石墨黑系列 (Graphite)
        'graphite': {
          50: '#F9FAFB',   // 最淺灰，用於背景
          100: '#F3F4F6',  // 淺灰，用於卡片背景
          200: '#E5E7EB',  // 較淺灰，用於邊框
          300: '#D1D5DB',  // 中淺灰
          400: '#9CA3AF',  // 中等灰
          500: '#6B7280',  // 中灰，用於次要文字
          600: '#4B5563',  // 深灰
          700: '#374151',  // 更深灰，用於標題
          800: '#1F2937',  // 很深灰
          900: '#222222',  // 石墨黑，用於主要文字
        },
        
        // 背景色彩 - 雲霧白 (Cloud White)
        'cloud-white': '#F8F9FA',
        
        // 保留語意化色彩以維持功能完整性
        'success': {
          DEFAULT: '#28A745',
          50: '#F0FDF4',
          100: '#DCFCE7',
          500: '#28A745',
          600: '#16A34A',
          700: '#15803D',
        },
        'danger': {
          DEFAULT: '#DC3545',
          50: '#FEF2F2',
          100: '#FEE2E2',
          500: '#DC3545',
          600: '#DC2626',
          700: '#B91C1C',
        },
        'warning': {
          DEFAULT: '#FFC107',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#FFC107',
          600: '#F59E0B',
          700: '#D97706',
        },
      },
    },
  },
  plugins: [],
}
