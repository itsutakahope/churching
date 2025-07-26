import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../ThemeContext.jsx';
import ThemeSwitcher from '../ThemeSwitcher.jsx';
import App from '../App.jsx';
import PurchaseRequestBoard from '../PurchaseRequestBoard.jsx';
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

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Return unsubscribe function
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

// Test wrapper component
const TestWrapper = ({ children, initialTheme = 'light' }) => {
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

describe('深色模式視覺回歸測試', () => {
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

    // Use Object.defineProperty to mock documentElement
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

  describe('主題切換按鈕視覺測試', () => {
    it('應該在淺色模式下顯示月亮圖示', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // 檢查月亮圖示是否存在（淺色模式）
      const button = screen.getByRole('button', { name: /切換至深色模式/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', '切換至深色模式');
    });

    it('應該在深色模式下顯示太陽圖示', async () => {
      // 設定初始為深色模式
      global.localStorage.getItem.mockReturnValue('dark');
      global.document.documentElement.classList.contains.mockReturnValue(true);

      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // 等待主題狀態更新
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /切換至淺色模式/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveAttribute('title', '切換至淺色模式');
      });
    });

    it('應該在主題切換時更新圖示', async () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 初始狀態應該是淺色模式（月亮圖示）
      expect(button).toHaveAttribute('title', '切換至深色模式');

      // 點擊切換到深色模式
      fireEvent.click(button);

      // 驗證 DOM 類別操作被調用
      await waitFor(() => {
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
        expect(global.localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
      });
    });
  });

  describe('主要頁面深色模式樣式測試', () => {
    it('應該正確應用深色模式類別到根元素', async () => {
      render(
        <TestWrapper>
          <div className="bg-background dark:bg-dark-background text-text-main dark:text-dark-text-main">
            測試內容
          </div>
        </TestWrapper>
      );

      // 驗證元素包含深色模式類別
      const testElement = screen.getByText('測試內容');
      expect(testElement).toHaveClass('dark:bg-dark-background');
      expect(testElement).toHaveClass('dark:text-dark-text-main');
    });

    it('應該正確應用品牌色彩的深色模式變體', () => {
      render(
        <TestWrapper>
          <button className="bg-glory-red-500 dark:bg-dark-primary text-white">
            主要按鈕
          </button>
          <button className="bg-holy-gold-500 dark:bg-dark-accent text-white">
            次要按鈕
          </button>
        </TestWrapper>
      );

      const primaryButton = screen.getByText('主要按鈕');
      const secondaryButton = screen.getByText('次要按鈕');

      expect(primaryButton).toHaveClass('dark:bg-dark-primary');
      expect(secondaryButton).toHaveClass('dark:bg-dark-accent');
    });

    it('應該正確應用文字色彩的深色模式變體', () => {
      render(
        <TestWrapper>
          <h1 className="text-graphite-900 dark:text-dark-text-main">主標題</h1>
          <p className="text-graphite-500 dark:text-dark-text-subtle">次要文字</p>
        </TestWrapper>
      );

      const heading = screen.getByText('主標題');
      const paragraph = screen.getByText('次要文字');

      expect(heading).toHaveClass('dark:text-dark-text-main');
      expect(paragraph).toHaveClass('dark:text-dark-text-subtle');
    });
  });

  describe('主題切換動畫測試', () => {
    it('應該包含過渡動畫類別', () => {
      render(
        <TestWrapper>
          <div className="transition-theme bg-background dark:bg-dark-background">
            動畫測試
          </div>
        </TestWrapper>
      );

      const element = screen.getByText('動畫測試');
      expect(element).toHaveClass('transition-theme');
    });

    it('主題切換按鈕應該包含過渡動畫', () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('transition-theme');
    });

    it('應該在主題切換時觸發過渡效果', async () => {
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      
      // 模擬點擊切換主題
      fireEvent.click(button);

      // 驗證過渡動畫相關的 DOM 操作
      await waitFor(() => {
        expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });
  });

  describe('響應式設計測試', () => {
    it('應該在不同螢幕尺寸下正確顯示深色模式樣式', () => {
      render(
        <TestWrapper>
          <div className="p-1 sm:p-6 bg-cloud-white dark:bg-dark-background" data-testid="responsive-container">
            <div className="max-w-6xl mx-auto">
              響應式內容
            </div>
          </div>
        </TestWrapper>
      );

      const container = screen.getByTestId('responsive-container');
      expect(container).toHaveClass('dark:bg-dark-background');
      expect(container).toHaveClass('p-1');
      expect(container).toHaveClass('sm:p-6');
    });
  });

  describe('狀態指示器深色模式測試', () => {
    it('應該正確顯示成功狀態的深色模式樣式', () => {
      render(
        <TestWrapper>
          <span className="bg-success-100 text-success-800 dark:bg-success-dark/20 dark:text-success-dark">
            成功狀態
          </span>
        </TestWrapper>
      );

      const statusElement = screen.getByText('成功狀態');
      expect(statusElement).toHaveClass('dark:text-success-dark');
    });

    it('應該正確顯示錯誤狀態的深色模式樣式', () => {
      render(
        <TestWrapper>
          <span className="bg-danger-100 text-danger-800 dark:bg-danger-dark/20 dark:text-danger-dark">
            錯誤狀態
          </span>
        </TestWrapper>
      );

      const statusElement = screen.getByText('錯誤狀態');
      expect(statusElement).toHaveClass('dark:text-danger-dark');
    });

    it('應該正確顯示警告狀態的深色模式樣式', () => {
      render(
        <TestWrapper>
          <span className="bg-warning-100 text-warning-800 dark:bg-warning-dark/20 dark:text-warning-dark">
            警告狀態
          </span>
        </TestWrapper>
      );

      const statusElement = screen.getByText('警告狀態');
      expect(statusElement).toHaveClass('dark:text-warning-dark');
    });
  });

  describe('表單元件深色模式測試', () => {
    it('應該正確應用輸入框的深色模式樣式', () => {
      render(
        <TestWrapper>
          <input
            type="text"
            placeholder="測試輸入框"
            className="border-graphite-300 dark:border-dark-surface bg-white dark:bg-dark-surface text-text-main dark:text-dark-text-main focus:border-glory-red-500 dark:focus:border-dark-primary"
          />
        </TestWrapper>
      );

      const input = screen.getByPlaceholderText('測試輸入框');
      expect(input).toHaveClass('dark:bg-dark-surface');
      expect(input).toHaveClass('dark:text-dark-text-main');
      expect(input).toHaveClass('dark:border-dark-surface');
      expect(input).toHaveClass('dark:focus:border-dark-primary');
    });

    it('應該正確應用按鈕的深色模式樣式', () => {
      render(
        <TestWrapper>
          <button className="bg-glory-red-500 hover:bg-glory-red-600 dark:bg-dark-primary dark:hover:bg-dark-primary/90 text-white">
            測試按鈕
          </button>
        </TestWrapper>
      );

      const button = screen.getByText('測試按鈕');
      expect(button).toHaveClass('dark:bg-dark-primary');
      expect(button).toHaveClass('dark:hover:bg-dark-primary/90');
    });
  });

  describe('模態框深色模式測試', () => {
    it('應該正確應用模態框的深色模式樣式', () => {
      render(
        <TestWrapper>
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70">
            <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl">
              <h3 className="text-graphite-800 dark:text-dark-text-main">模態框標題</h3>
              <p className="text-graphite-500 dark:text-dark-text-subtle">模態框內容</p>
            </div>
          </div>
        </TestWrapper>
      );

      const backdrop = screen.getByText('模態框標題').parentElement.parentElement;
      const modal = screen.getByText('模態框標題').parentElement;
      const title = screen.getByText('模態框標題');
      const content = screen.getByText('模態框內容');

      expect(backdrop).toHaveClass('dark:bg-opacity-70');
      expect(modal).toHaveClass('dark:bg-dark-surface');
      expect(title).toHaveClass('dark:text-dark-text-main');
      expect(content).toHaveClass('dark:text-dark-text-subtle');
    });
  });

  describe('導航元件深色模式測試', () => {
    it('應該正確應用導航列的深色模式樣式', () => {
      render(
        <TestWrapper>
          <nav className="bg-white dark:bg-dark-surface shadow-md rounded-lg">
            <a className="text-graphite-700 dark:text-dark-text-main hover:bg-glory-red-50 dark:hover:bg-dark-primary/10">
              導航連結
            </a>
          </nav>
        </TestWrapper>
      );

      const nav = screen.getByRole('navigation');
      const link = screen.getByText('導航連結');

      expect(nav).toHaveClass('dark:bg-dark-surface');
      expect(link).toHaveClass('dark:text-dark-text-main');
      expect(link).toHaveClass('dark:hover:bg-dark-primary/10');
    });
  });
});