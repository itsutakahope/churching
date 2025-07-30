import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PaymentBreakdownDisplay from '../PaymentBreakdownDisplay';

describe('PaymentBreakdownDisplay', () => {
  it('should not render when breakdown has no cheque', () => {
    const breakdown = {
      cashTotal: 1000,
      chequeTotal: 0,
      hasCheque: false
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={1000} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should not render when breakdown is null', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={null} totalAmount={1000} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should render payment breakdown when cheque is present', () => {
    const breakdown = {
      cashTotal: 1500,
      chequeTotal: 2000,
      hasCheque: true
    };
    
    render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={3500} />
    );
    
    // 檢查標題
    expect(screen.getByText('付款方式明細')).toBeInTheDocument();
    
    // 檢查計算式元素（使用 getAllByText 處理重複文字）
    expect(screen.getAllByText('現金')).toHaveLength(2); // 桌面和移動版本各一個
    expect(screen.getAllByText('1,500')).toHaveLength(2);
    expect(screen.getAllByText('支票')).toHaveLength(2);
    expect(screen.getAllByText('2,000')).toHaveLength(2);
    expect(screen.getAllByText(/總計/)).toHaveLength(2);
    // 總計數字：桌面版本在同一個 span 中，移動版本分開，所以只有移動版本的獨立數字
    expect(screen.getByText('3,500')).toBeInTheDocument();
    
    // 檢查運算符號
    const plusSigns = screen.getAllByText('+');
    const equalSigns = screen.getAllByText('=');
    expect(plusSigns).toHaveLength(1);
    expect(equalSigns).toHaveLength(1);
  });

  it('should format amounts correctly', () => {
    const breakdown = {
      cashTotal: 12345,
      chequeTotal: 67890,
      hasCheque: true
    };
    
    render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={80235} />
    );
    
    // 檢查數字格式化（千分位逗號）
    expect(screen.getAllByText('現金')).toHaveLength(2);
    expect(screen.getAllByText('12,345')).toHaveLength(2);
    expect(screen.getAllByText('支票')).toHaveLength(2);
    expect(screen.getAllByText('67,890')).toHaveLength(2);
    expect(screen.getAllByText(/總計/)).toHaveLength(2);
    // 總計數字：桌面版本在同一個 span 中，移動版本分開，所以只有移動版本的獨立數字
    expect(screen.getByText('80,235')).toBeInTheDocument();
  });

  it('should have proper CSS classes for styling', () => {
    const breakdown = {
      cashTotal: 1000,
      chequeTotal: 2000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={3000} />
    );
    
    // 檢查主容器的樣式類別（更新為新的設計）
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('mt-6', 'pt-6', 'border-t-2');
    
    // 檢查內部容器的響應式樣式類別（更新為新的品牌色彩）
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer).toHaveClass('rounded-xl');
    expect(innerContainer.className).toContain('p-4');
    expect(innerContainer.className).toContain('sm:p-6');
    
    // 檢查標題的響應式樣式類別（更新為新的設計）
    const title = screen.getByText('付款方式明細');
    expect(title).toHaveClass('font-bold');
    expect(title.className).toContain('text-lg');
    // 標題沒有直接的邊距，而是在父容器中有 mb-4
  });

  it('should support dark mode classes', () => {
    const breakdown = {
      cashTotal: 1000,
      chequeTotal: 2000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={3000} />
    );
    
    // 檢查深色模式相關的 CSS 類別（更新為新的品牌色彩）
    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('dark:border-dark-primary/30');
    
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer.className).toContain('dark:bg-dark-surface/80');
    
    const title = screen.getByText('付款方式明細');
    expect(title.className).toContain('dark:text-dark-primary');
  });

  it('should be responsive with proper layout', () => {
    const breakdown = {
      cashTotal: 1000,
      chequeTotal: 2000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={3000} />
    );
    
    // 檢查大螢幕水平佈局
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    expect(desktopLayout).toBeTruthy();
    
    const calculationContainer = desktopLayout.querySelector('.inline-flex');
    expect(calculationContainer).toHaveClass('items-center');
    expect(calculationContainer.className).toContain('gap-3');
    expect(calculationContainer.className).toContain('lg:gap-4');
    expect(calculationContainer.className).toContain('text-lg');
    expect(calculationContainer.className).toContain('lg:text-xl');
    
    // 檢查小螢幕垂直佈局（更新為新的設計）
    const mobileLayout = container.querySelector('.block.sm\\:hidden');
    expect(mobileLayout).toBeTruthy();
    expect(mobileLayout).toHaveClass('space-y-3');
  });
});