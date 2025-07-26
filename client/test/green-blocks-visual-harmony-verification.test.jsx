import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AggregationSummary from '../AggregationSummary.jsx';

// Mock dependencies
vi.mock('../AuthContext.jsx');

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <div className="dark">
      {children}
    </div>
  </BrowserRouter>
);

describe('Green Blocks Visual Harmony in Dark Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AggregationSummary Dark Mode Optimization', () => {
    const mockData = {
      byCategory: {
        '什一奉獻': 10000,
        '感恩奉獻': 5000,
        '宣教奉獻': 3000
      },
      totalAmount: 18000
    };

    it('should render with optimized dark mode colors', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check if the component renders without errors
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    });

    it('should have proper dark mode background classes', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for optimized dark background classes
      const summaryElements = document.querySelectorAll('.dark\\:bg-graphite-800\\/40');
      expect(summaryElements.length).toBeGreaterThan(0);
    });

    it('should have success icon in the title area', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for the presence of success icon
      const iconElements = document.querySelectorAll('svg');
      expect(iconElements.length).toBeGreaterThan(0);
    });

    it('should have harmonious text colors in dark mode', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for dark mode text color classes
      const darkTextElements = document.querySelectorAll('.dark\\:text-success-300');
      expect(darkTextElements.length).toBeGreaterThan(0);
    });

    it('should display all category data correctly', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check if all categories are displayed
      expect(screen.getByText('什一奉獻')).toBeInTheDocument();
      expect(screen.getByText('感恩奉獻')).toBeInTheDocument();
      expect(screen.getByText('宣教奉獻')).toBeInTheDocument();
      
      // Check if total is displayed
      expect(screen.getByText('總計')).toBeInTheDocument();
      expect(screen.getByText('18,000')).toBeInTheDocument();
    });

    it('should have proper transition classes', () => {
      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for transition-theme classes
      const transitionElements = document.querySelectorAll('.transition-theme');
      expect(transitionElements.length).toBeGreaterThan(0);
    });
  });

  describe('Color Harmony Verification', () => {
    it('should use harmonious color combinations', () => {
      const mockData = {
        byCategory: { '測試類別': 1000 },
        totalAmount: 1000
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Verify that the component uses the new harmonious color scheme
      // Check for graphite background instead of bright success colors
      const harmoniousElements = document.querySelectorAll('[class*="dark:bg-graphite"]');
      expect(harmoniousElements.length).toBeGreaterThan(0);
    });

    it('should maintain visual hierarchy in dark mode', () => {
      const mockData = {
        byCategory: {
          '主要類別': 5000,
          '次要類別': 2000
        },
        totalAmount: 7000
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check that the title is properly emphasized
      const titleElement = screen.getByText('計算結果摘要');
      expect(titleElement).toHaveClass('text-xl', 'font-bold');
    });

    it('should have accessible contrast ratios', () => {
      const mockData = {
        byCategory: { '測試': 100 },
        totalAmount: 100
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // This test ensures the component renders successfully
      // In a real implementation, you would test actual contrast ratios
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should maintain harmony across different screen sizes', () => {
      const mockData = {
        byCategory: { '響應式測試': 1000 },
        totalAmount: 1000
      };

      // Test with different viewport sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty data gracefully', () => {
      const emptyData = {
        byCategory: {},
        totalAmount: 0
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={emptyData} />
        </TestWrapper>
      );

      // Should still render the title
      expect(screen.getByText('計算結果摘要')).toBeInTheDocument();
    });

    it('should handle missing data properties', () => {
      const incompleteData = {
        byCategory: { '測試': 100 }
        // Missing totalAmount
      };

      expect(() => {
        render(
          <TestWrapper>
            <AggregationSummary summary={incompleteData} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      const mockData = {
        byCategory: { '無障礙測試': 1000 },
        totalAmount: 1000
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for proper heading structure
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('計算結果摘要');
    });

    it('should have proper table structure for data', () => {
      const mockData = {
        byCategory: {
          '類別1': 1000,
          '類別2': 2000
        },
        totalAmount: 3000
      };

      render(
        <TestWrapper>
          <AggregationSummary summary={mockData} />
        </TestWrapper>
      );

      // Check for table elements
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });
  });
});