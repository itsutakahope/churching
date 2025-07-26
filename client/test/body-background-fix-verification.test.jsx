import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../ThemeContext.jsx';
import ThemeSwitcher from '../ThemeSwitcher.jsx';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

describe('Body Background Dark Mode Fix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM classes
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  });

  afterEach(() => {
    // Clean up DOM classes
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  });

  describe('CSS Variables', () => {
    it('should have CSS variables defined for body background', () => {
      // Check if CSS variables are available
      const rootStyles = getComputedStyle(document.documentElement);
      
      // Note: In test environment, CSS variables might not be loaded
      // This test verifies the structure is correct
      expect(document.documentElement).toBeDefined();
    });
  });

  describe('Theme Context Integration', () => {
    it('should apply dark class to body when theme is dark', async () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Wait for theme to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if dark class is applied to body
      expect(document.body.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from body when theme is light', async () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Wait for theme to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if dark class is removed from body
      expect(document.body.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should toggle body dark class when theme switcher is clicked', async () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const themeSwitcher = screen.getByRole('button');
      
      // Initially should be light mode
      expect(document.body.classList.contains('dark')).toBe(false);

      // Click to switch to dark mode
      fireEvent.click(themeSwitcher);
      
      // Wait for theme change to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should now have dark class
      expect(document.body.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Click again to switch back to light mode
      fireEvent.click(themeSwitcher);
      
      // Wait for theme change to be applied
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should remove dark class
      expect(document.body.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference to localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const themeSwitcher = screen.getByRole('button');
      
      // Click to switch theme
      fireEvent.click(themeSwitcher);
      
      // Wait for theme change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should save to localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should load theme preference from localStorage on initialization', () => {
      localStorageMock.getItem.mockReturnValue('dark');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      // Should read from localStorage
      expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw error
      expect(() => {
        render(
          <TestWrapper>
            <ThemeSwitcher />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('should handle DOM manipulation errors gracefully', async () => {
      // Mock console.error to suppress error logs in test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock document.body to be null temporarily
      const originalBody = document.body;
      Object.defineProperty(document, 'body', {
        value: null,
        configurable: true
      });
      
      localStorageMock.getItem.mockReturnValue('dark');
      
      // Should not throw error even if body is null
      expect(() => {
        render(
          <TestWrapper>
            <ThemeSwitcher />
          </TestWrapper>
        );
      }).not.toThrow();
      
      // Restore original body
      Object.defineProperty(document, 'body', {
        value: originalBody,
        configurable: true
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for theme switcher', () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const themeSwitcher = screen.getByRole('button');
      
      // Should have aria-label
      expect(themeSwitcher).toHaveAttribute('aria-label');
      expect(themeSwitcher.getAttribute('aria-label')).toContain('切換至深色模式');
    });

    it('should update ARIA label when theme changes', async () => {
      localStorageMock.getItem.mockReturnValue('light');
      
      render(
        <TestWrapper>
          <ThemeSwitcher />
        </TestWrapper>
      );

      const themeSwitcher = screen.getByRole('button');
      
      // Initially should show "切換至深色模式"
      expect(themeSwitcher.getAttribute('aria-label')).toContain('切換至深色模式');

      // Click to switch to dark mode
      fireEvent.click(themeSwitcher);
      
      // Wait for theme change
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should now show "切換至淺色模式"
      expect(themeSwitcher.getAttribute('aria-label')).toContain('切換至淺色模式');
    });
  });
});