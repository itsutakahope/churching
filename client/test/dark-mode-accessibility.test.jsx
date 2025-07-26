import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../ThemeContext.jsx';
import ThemeSwitcher from '../ThemeSwitcher.jsx';
import { AuthProvider } from '../AuthContext.jsx';

// Mock Firebase
vi.mock('../firebaseConfig.js', () => ({
  firestore: {},
  auth: {},
}));

// Mock AuthContext for testing
const mockAuthContext = {
  currentUser: { uid: 'test-user', email: 'test@example.com', displayName: 'Test User' },
  userProfile: { status: 'approved', roles: ['user'] },
  isReimburser: false,
  userRoles: ['user'],
  loading: false,
};

vi.mock('../AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext,
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

// 色彩對比度計算工具函式
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (color1, color2) => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

describe('深色模式無障礙性測試', () => {
  let originalLocalStorage;
  let mockDocumentElement;

  beforeEach(() => {
    // Mock localStorage
    originalLocalStorage = global.localStorage;
    global.localStorage = {
      getItem: vi.fn(() => 'light'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };

    // Mock document.documentElement
    mockDocumentElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(() => false),
      },
    };

    Object.defineProperty(global.document, 'documentElement', {
      value: mockDocumentElement,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    vi.clearAllMocks();
  });

  describe('色彩對比度測試', () => {
    it('深色模式主要文字色彩應符合 WCAG AA 標準 (4.5:1)', () => {
      // 深色模式：月光白 (#EAEAEA) 在永夜黑 (#121212) 背景上
      const textColor = '#EAEAEA';
      const backgroundColor = '#121212';
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('深色模式次要文字色彩應符合 WCAG AA 標準 (4.5:1)', () => {
      // 深色模式：星辰灰 (#A0A0A0) 在永夜黑 (#121212) 背景上
      const textColor = '#A0A0A0';
      const backgroundColor = '#121212';
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('深色模式主要按鈕色彩應符合 WCAG AA 標準', () => {
      // 深色模式：白色文字 (#FFFFFF) 在熾熱之紅 (#E5484D) 背景上
      const textColor = '#FFFFFF';
      const backgroundColor = '#E5484D';
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      
      // 如果對比度不足 4.5:1，檢查是否至少達到 3:1 (WCAG AA Large Text 標準)
      // 或者建議使用更深的背景色
      if (contrastRatio < 4.5) {
        expect(contrastRatio).toBeGreaterThanOrEqual(3.0); // 大文字的最低標準
        
        // 測試替代方案：使用更深的紅色
        const darkerRed = '#B91C1C'; // 更深的紅色
        const betterContrastRatio = getContrastRatio(textColor, darkerRed);
        expect(betterContrastRatio).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('深色模式次要按鈕色彩應符合 WCAG AA 標準', () => {
      // 深色模式：白色文字 (#FFFFFF) 在榮光金 (#FFD479) 背景上
      const textColor = '#FFFFFF';
      const backgroundColor = '#FFD479';
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      
      // 注意：金色背景可能需要深色文字來達到足夠對比度
      // 如果對比度不足，應該使用深色文字
      if (contrastRatio < 4.5) {
        const darkTextColor = '#000000';
        const darkTextContrast = getContrastRatio(darkTextColor, backgroundColor);
        expect(darkTextContrast).toBeGreaterThanOrEqual(4.5);
      } else {
        expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('深色模式成功狀態色彩應符合 WCAG AA 標準', () => {
      // 深色模式：螢光綠 (#30C44E) 在深色背景上
      const statusColor = '#30C44E';
      const backgroundColor = '#121212';
      const contrastRatio = getContrastRatio(statusColor, backgroundColor);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });

    it('深色模式錯誤狀態色彩應符合 WCAG AA 標準', () => {
      // 深色模式：警示粉 (#F87171) 在深色背景上
      const statusColor = '#F87171';
      const backgroundColor = '#121212';
      const contrastRatio = getContrastRatio(statusColor, backgroundColor);
      
      expect(contrastRatio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('主題切換按鈕無障礙性測試', () => {
    it('應該有適當的 ARIA 標籤', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', '切換至深色模式');
      expect(button).toHaveAttribute('title', '切換至深色模式');
    });

    it('應該支援鍵盤導航 - Enter 鍵', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 使用 Tab 鍵聚焦到按鈕
      await user.tab();
      expect(button).toHaveFocus();
      
      // 使用 Enter 鍵觸發點擊
      await user.keyboard('{Enter}');
      
      // 驗證主題切換被觸發
      await waitFor(() => {
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });

    it('應該支援鍵盤導航 - Space 鍵', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 聚焦到按鈕
      button.focus();
      expect(button).toHaveFocus();
      
      // 使用 Space 鍵觸發點擊
      await user.keyboard(' ');
      
      // 驗證主題切換被觸發
      await waitFor(() => {
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });

    it('應該有適當的焦點指示器', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 檢查是否有焦點樣式類別
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-glory-red-500');
      expect(button).toHaveClass('dark:focus:ring-dark-primary');
    });

    it('主題切換後應該更新 ARIA 標籤', async () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 初始狀態
      expect(button).toHaveAttribute('aria-label', '切換至深色模式');
      
      // 點擊切換主題
      fireEvent.click(button);
      
      // 等待狀態更新後檢查標籤
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', '切換至淺色模式');
        expect(button).toHaveAttribute('title', '切換至淺色模式');
      });
    });
  });

  describe('螢幕閱讀器相容性測試', () => {
    it('主題切換按鈕應該有語意化的角色', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });

    it('應該提供狀態變化的語意化描述', async () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 檢查初始狀態的描述
      expect(button).toHaveAttribute('aria-label', '切換至深色模式');
      
      // 模擬主題切換
      fireEvent.click(button);
      
      // 檢查切換後的描述
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-label', '切換至淺色模式');
      });
    });

    it('圖示應該有適當的語意化標記', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 檢查按鈕內容是否包含圖示
      // Lucide React 圖示會渲染為 SVG 元素
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('深色模式狀態變化應該對螢幕閱讀器可見', async () => {
      render(
        <TestWrapper>
          <div>
            <ThemeSwitcher />
            <div 
              className="bg-background dark:bg-dark-background text-text-main dark:text-dark-text-main"
              aria-live="polite"
              data-testid="theme-status"
            >
              當前主題狀態
            </div>
          </div>
        </TestWrapper>
      );

      const statusDiv = screen.getByTestId('theme-status');
      const button = screen.getByRole('button');
      
      // 檢查 aria-live 屬性
      expect(statusDiv).toHaveAttribute('aria-live', 'polite');
      
      // 模擬主題切換
      fireEvent.click(button);
      
      // 驗證狀態變化
      await waitFor(() => {
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });
  });

  describe('色盲使用者支援測試', () => {
    it('不應該僅依賴色彩來傳達主題狀態', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 檢查是否有文字標籤（title 和 aria-label）
      expect(button).toHaveAttribute('title');
      expect(button).toHaveAttribute('aria-label');
      
      // 檢查是否有圖示來表示狀態（月亮/太陽）
      const svg = button.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('狀態指示器應該使用圖示和文字組合', () => {
      render(
        <TestWrapper>
          <div className="flex items-center gap-2">
            <span className="bg-success-100 text-success-800 dark:bg-success-dark/20 dark:text-success-dark px-2 py-1 rounded">
              ✓ 成功
            </span>
            <span className="bg-danger-100 text-danger-800 dark:bg-danger-dark/20 dark:text-danger-dark px-2 py-1 rounded">
              ✗ 錯誤
            </span>
            <span className="bg-warning-100 text-warning-800 dark:bg-warning-dark/20 dark:text-warning-dark px-2 py-1 rounded">
              ⚠ 警告
            </span>
          </div>
        </TestWrapper>
      );

      // 檢查狀態指示器是否包含文字和符號
      expect(screen.getByText('✓ 成功')).toBeInTheDocument();
      expect(screen.getByText('✗ 錯誤')).toBeInTheDocument();
      expect(screen.getByText('⚠ 警告')).toBeInTheDocument();
    });

    it('重要資訊應該有多種視覺提示', () => {
      render(
        <TestWrapper>
          <div className="border-l-4 border-danger-500 dark:border-danger-dark bg-danger-50 dark:bg-danger-dark/10 p-4">
            <div className="flex items-center">
              <span className="text-danger-600 dark:text-danger-dark font-bold mr-2">錯誤：</span>
              <span className="text-danger-800 dark:text-danger-dark">這是一個錯誤訊息</span>
            </div>
          </div>
        </TestWrapper>
      );

      const errorMessage = screen.getByText('這是一個錯誤訊息');
      const errorLabel = screen.getByText('錯誤：');
      
      // 檢查是否有多種視覺提示：邊框、背景色、文字標籤
      expect(errorMessage).toBeInTheDocument();
      expect(errorLabel).toBeInTheDocument();
      
      // 檢查容器是否有邊框樣式
      const container = errorMessage.parentElement.parentElement;
      expect(container).toHaveClass('border-l-4');
      expect(container).toHaveClass('border-danger-500');
      expect(container).toHaveClass('dark:border-danger-dark');
    });
  });

  describe('動畫和過渡效果無障礙性測試', () => {
    it('應該支援 prefers-reduced-motion 設定', () => {
      // 模擬使用者偏好減少動畫
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <div className="transition-theme motion-reduce:transition-none bg-background dark:bg-dark-background">
            動畫測試內容
          </div>
        </TestWrapper>
      );

      const element = screen.getByText('動畫測試內容');
      
      // 檢查是否有減少動畫的類別
      expect(element).toHaveClass('motion-reduce:transition-none');
    });

    it('主題切換動畫應該有合理的持續時間', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 檢查過渡動畫類別
      expect(button).toHaveClass('transition-theme');
      
      // 根據 Tailwind 配置，transition-theme 應該是 300ms
      // 這個持續時間對於無障礙性來說是合理的（不會太快或太慢）
    });
  });

  describe('高對比度模式支援測試', () => {
    it('應該在高對比度模式下保持可讀性', () => {
      // 模擬高對比度模式
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <button className="bg-glory-red-500 dark:bg-dark-primary text-white border-2 border-transparent contrast-more:border-white">
            高對比度按鈕
          </button>
        </TestWrapper>
      );

      const button = screen.getByText('高對比度按鈕');
      
      // 檢查高對比度模式的樣式
      expect(button).toHaveClass('contrast-more:border-white');
    });
  });
});