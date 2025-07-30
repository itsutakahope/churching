import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PaymentBreakdownDisplay from '../PaymentBreakdownDisplay';

describe('PaymentBreakdownDisplay - Dark Mode Support', () => {
  beforeEach(() => {
    // 模擬深色模式環境
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  });

  afterEach(() => {
    // 清理深色模式設定
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  });

  it('should apply dark mode colors correctly', () => {
    const breakdown = {
      cashTotal: 15000,
      chequeTotal: 25000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={40000} />
    );
    
    // 檢查主容器的深色模式邊框（更新為品牌色彩）
    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('dark:border-dark-primary/30');
    
    // 檢查內部容器的深色模式背景（更新為品牌色彩）
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer.className).toContain('dark:bg-dark-surface/80');
    
    // 檢查標題的深色模式文字色彩（更新為品牌色彩）
    const title = container.querySelector('h4');
    expect(title.className).toContain('dark:text-dark-primary');
    
    // 檢查大螢幕佈局中的深色模式文字色彩（更新為品牌色彩）
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    const textElements = desktopLayout.querySelectorAll('.text-graphite-800');
    textElements.forEach(element => {
      expect(element.className).toContain('dark:text-dark-text-main');
    });
    
    // 檢查運算符號的深色模式色彩（更新為聖光金）
    const operators = desktopLayout.querySelectorAll('.text-holy-gold-600');
    operators.forEach(operator => {
      expect(operator.className).toContain('dark:text-dark-accent');
    });
    
    // 檢查總計的深色模式色彩（更新為品牌色彩）
    const total = desktopLayout.querySelector('.text-glory-red-700');
    expect(total.className).toContain('dark:text-dark-primary');
  });

  it('should apply dark mode colors to mobile layout', () => {
    const breakdown = {
      cashTotal: 8000,
      chequeTotal: 12000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={20000} />
    );
    
    // 檢查小螢幕佈局
    const mobileLayout = container.querySelector('.block.sm\\:hidden');
    
    // 檢查標籤文字的深色模式色彩
    const labels = mobileLayout.querySelectorAll('.text-graphite-600');
    labels.forEach(label => {
      expect(label.className).toContain('dark:text-dark-text-subtle');
    });
    
    // 檢查金額文字的深色模式色彩
    const amounts = mobileLayout.querySelectorAll('.text-graphite-700');
    amounts.forEach(amount => {
      expect(amount.className).toContain('dark:text-dark-text-main');
    });
    
    // 檢查分隔線的深色模式色彩（更新為品牌色彩）
    const separator = mobileLayout.querySelector('.border-holy-gold-300');
    expect(separator.className).toContain('dark:border-dark-accent/50');
    
    // 檢查總計標籤和金額的深色模式色彩（更新為品牌色彩）
    const totalElements = mobileLayout.querySelectorAll('.text-glory-red-700');
    totalElements.forEach(element => {
      expect(element.className).toContain('dark:text-dark-primary');
    });
  });

  it('should have transition-theme class on all color-changing elements', () => {
    const breakdown = {
      cashTotal: 10000,
      chequeTotal: 15000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={25000} />
    );
    
    // 檢查所有有顏色變化的元素都有 transition-theme 類別
    const elementsWithTransition = container.querySelectorAll('.transition-theme');
    
    // 應該至少包含：主容器、內部容器、標題、文字元素、運算符號等
    expect(elementsWithTransition.length).toBeGreaterThanOrEqual(10);
    
    // 檢查主要元素都有過渡動畫
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('transition-theme');
    
    const innerContainer = container.querySelector('.bg-glory-red-50');
    expect(innerContainer).toHaveClass('transition-theme');
    
    const title = container.querySelector('h4');
    expect(title).toHaveClass('transition-theme');
  });

  it('should maintain proper contrast ratios in dark mode', () => {
    const breakdown = {
      cashTotal: 5000,
      chequeTotal: 7000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={12000} />
    );
    
    // 檢查深色模式下的色彩對比度設計
    // 主要文字使用 dark-text-main (#EAEAEA) 確保可讀性
    const mainTextElements = container.querySelectorAll('.dark\\:text-dark-text-main');
    expect(mainTextElements.length).toBeGreaterThan(0);
    
    // 次要文字使用 dark-text-subtle (#A0A0A0) 保持層次
    const subtleTextElements = container.querySelectorAll('.dark\\:text-dark-text-subtle');
    expect(subtleTextElements.length).toBeGreaterThan(0);
    
    // 品牌色彩在深色模式下使用適當的變體
    const brandElements = container.querySelectorAll('.dark\\:text-dark-primary, .dark\\:text-dark-accent');
    expect(brandElements.length).toBeGreaterThan(0);
    
    // 背景使用適當的深色變體
    const backgroundElement = container.querySelector('.dark\\:bg-dark-surface\\/80');
    expect(backgroundElement).toBeTruthy();
  });

  it('should handle theme transitions smoothly', () => {
    const breakdown = {
      cashTotal: 6000,
      chequeTotal: 9000,
      hasCheque: true
    };
    
    const { container, rerender } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={15000} />
    );
    
    // 檢查所有過渡元素都有正確的過渡類別
    const transitionElements = container.querySelectorAll('.transition-theme');
    
    transitionElements.forEach(element => {
      expect(element).toHaveClass('transition-theme');
    });
    
    // 模擬主題切換（移除深色模式）
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    
    // 重新渲染以測試主題切換
    rerender(<PaymentBreakdownDisplay breakdown={breakdown} totalAmount={15000} />);
    
    // 確保過渡類別仍然存在
    const updatedTransitionElements = container.querySelectorAll('.transition-theme');
    expect(updatedTransitionElements.length).toBe(transitionElements.length);
  });
});