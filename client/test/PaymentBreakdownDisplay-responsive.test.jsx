import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import PaymentBreakdownDisplay from '../PaymentBreakdownDisplay';

describe('PaymentBreakdownDisplay - Responsive Design', () => {
  const mockBreakdown = {
    cashTotal: 15000,
    chequeTotal: 25000,
    hasCheque: true
  };

  // 模擬不同螢幕尺寸的輔助函數
  const mockViewport = (width) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    window.dispatchEvent(new Event('resize'));
  };

  afterEach(() => {
    // 重置視窗大小
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('should have responsive padding classes', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    const innerContainer = container.querySelector('.bg-glory-red-50');
    
    // 檢查響應式內邊距（更新為新的設計）
    expect(innerContainer.className).toContain('p-4');      // 小螢幕
    expect(innerContainer.className).toContain('sm:p-6');   // 中等螢幕
  });

  it('should have responsive text sizing', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查標題的響應式文字大小（更新為新的設計）
    const title = container.querySelector('h4');
    expect(title.className).toContain('text-lg');      // 固定大小

    // 檢查大螢幕計算式的響應式文字大小
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    const calculationContainer = desktopLayout.querySelector('.inline-flex');
    expect(calculationContainer.className).toContain('text-lg');      // 基礎大小
    expect(calculationContainer.className).toContain('lg:text-xl');   // 大螢幕
  });

  it('should have responsive spacing and margins', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查標題區域的間距（更新為新的設計）
    const titleContainer = container.querySelector('.flex.items-center.gap-3.mb-4');
    expect(titleContainer).toBeTruthy();

    // 檢查大螢幕計算式的響應式間距（更新為新的設計）
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    const calculationContainer = desktopLayout.querySelector('.inline-flex');
    expect(calculationContainer.className).toContain('gap-3');      // 預設間距
    expect(calculationContainer.className).toContain('lg:gap-4');   // 大螢幕間距
  });

  it('should show desktop layout on medium and large screens', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查大螢幕水平佈局
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    expect(desktopLayout).toBeTruthy();
    
    // 檢查計算式容器
    const calculationContainer = desktopLayout.querySelector('.inline-flex');
    expect(calculationContainer).toBeTruthy();
    expect(calculationContainer).toHaveClass('items-center', 'font-mono');
    
    // 檢查所有計算元素都存在（更新為品牌色彩）
    const cashElement = calculationContainer.querySelector('.text-graphite-800');
    expect(cashElement).toBeTruthy();
    expect(cashElement.textContent).toContain('現金');
    
    const operators = calculationContainer.querySelectorAll('.text-holy-gold-600');
    expect(operators).toHaveLength(2); // + 和 = 符號
    
    const totalElement = calculationContainer.querySelector('.text-glory-red-700');
    expect(totalElement).toBeTruthy();
    expect(totalElement.textContent).toContain('總計');
  });

  it('should show mobile layout on small screens', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查小螢幕垂直佈局（更新為新的設計）
    const mobileLayout = container.querySelector('.block.sm\\:hidden');
    expect(mobileLayout).toBeTruthy();
    expect(mobileLayout).toHaveClass('space-y-3');
    
    // 檢查現金行
    const rows = mobileLayout.querySelectorAll('.flex.justify-between');
    expect(rows).toHaveLength(3); // 現金、支票、總計
    
    // 檢查現金行內容（更新為新的設計）
    const cashRow = rows[0];
    expect(cashRow).toHaveClass('items-center', 'py-2');
    const cashLabel = cashRow.querySelector('.text-graphite-700');
    expect(cashLabel).toBeTruthy();
    expect(cashLabel.textContent).toBe('現金');
    const cashAmount = cashRow.querySelector('.text-glory-red-600');
    expect(cashAmount).toBeTruthy();
    expect(cashAmount.textContent).toBe('15,000');
    
    // 檢查支票行內容（更新為新的設計）
    const chequeRow = rows[1];
    const chequeLabel = chequeRow.querySelector('.text-graphite-700');
    expect(chequeLabel.textContent).toBe('支票');
    const chequeAmount = chequeRow.querySelector('.text-glory-red-600');
    expect(chequeAmount.textContent).toBe('25,000');
    
    // 檢查分隔線（更新為新的設計）
    const separator = mobileLayout.querySelector('.border-t-2');
    expect(separator).toBeTruthy();
    expect(separator.className).toContain('border-holy-gold-300');
    expect(separator.className).toContain('dark:border-dark-accent/50');
    expect(separator).toHaveClass('pt-3', 'mt-3');
    
    // 檢查總計行（更新為品牌色彩）
    const totalRow = separator.querySelector('.flex.justify-between');
    expect(totalRow).toBeTruthy();
    const totalLabel = totalRow.querySelector('.text-glory-red-700');
    expect(totalLabel.textContent).toBe('總計');
    const totalAmount = totalRow.querySelector('.font-mono.font-bold.text-xl');
    expect(totalAmount.textContent).toBe('40,000');
  });

  it('should maintain proper visual hierarchy across screen sizes', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查主容器的一致性（更新為新的設計）
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('mt-6', 'pt-6', 'border-t-2');
    expect(mainContainer.className).toContain('border-glory-red-200');
    expect(mainContainer.className).toContain('dark:border-dark-primary/30');
    
    // 檢查內部容器的一致性（更新為品牌色彩）
    const innerContainer = container.querySelector('.bg-glory-red-50');
    expect(innerContainer).toHaveClass('rounded-xl');
    expect(innerContainer.className).toContain('dark:bg-dark-surface/80');
    
    // 檢查標題的一致性（更新為品牌色彩）
    const title = container.querySelector('h4');
    expect(title).toHaveClass('font-bold');
    expect(title.className).toContain('text-glory-red-700');
    expect(title.className).toContain('dark:text-dark-primary');
    
    // 檢查文字居中對齊
    const textCenter = container.querySelector('.text-center');
    expect(textCenter).toBeTruthy();
  });

  it('should handle edge cases with responsive design', () => {
    // 測試極小金額
    const smallBreakdown = {
      cashTotal: 1,
      chequeTotal: 2,
      hasCheque: true
    };
    
    const { container: smallContainer } = render(
      <PaymentBreakdownDisplay breakdown={smallBreakdown} totalAmount={3} />
    );
    
    // 檢查小金額在兩種佈局中都正確顯示
    const desktopLayout = smallContainer.querySelector('.hidden.sm\\:block');
    expect(desktopLayout.textContent).toContain('現金 1');
    expect(desktopLayout.textContent).toContain('支票 2');
    expect(desktopLayout.textContent).toContain('總計 3');
    
    const mobileLayout = smallContainer.querySelector('.block.sm\\:hidden');
    expect(mobileLayout.textContent).toContain('現金');
    expect(mobileLayout.textContent).toContain('支票');
    expect(mobileLayout.textContent).toContain('總計');
    
    // 測試大金額
    const largeBreakdown = {
      cashTotal: 1234567,
      chequeTotal: 9876543,
      hasCheque: true
    };
    
    const { container: largeContainer } = render(
      <PaymentBreakdownDisplay breakdown={largeBreakdown} totalAmount={11111110} />
    );
    
    // 檢查大金額的千分位格式化
    const largeDesktopLayout = largeContainer.querySelector('.hidden.sm\\:block');
    expect(largeDesktopLayout.textContent).toContain('1,234,567');
    expect(largeDesktopLayout.textContent).toContain('9,876,543');
    expect(largeDesktopLayout.textContent).toContain('11,111,110');
  });

  it('should maintain accessibility across different screen sizes', () => {
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={mockBreakdown} totalAmount={40000} />
    );

    // 檢查所有文字元素都有適當的對比度類別
    const textElements = container.querySelectorAll('[class*="text-"]');
    textElements.forEach(element => {
      // 確保每個文字元素都有深色模式支援
      const hasLightModeColor = element.className.includes('text-graphite-') || 
                               element.className.includes('text-success-');
      const hasDarkModeColor = element.className.includes('dark:text-');
      
      if (hasLightModeColor) {
        expect(hasDarkModeColor).toBe(true);
      }
    });

    // 檢查所有元素都有過渡動畫
    const transitionElements = container.querySelectorAll('.transition-theme');
    expect(transitionElements.length).toBeGreaterThan(5);
    
    // 檢查字體大小在不同螢幕尺寸下都保持可讀性（更新為新的設計）
    const title = container.querySelector('h4');
    expect(title.className).toContain('text-lg');      // 固定大小，保持可讀性
  });
});