import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PaymentBreakdownDisplay from '../PaymentBreakdownDisplay';

describe('PaymentBreakdownDisplay - Visual Consistency', () => {
  it('should maintain visual consistency with summary table styling', () => {
    const breakdown = {
      cashTotal: 15000,
      chequeTotal: 25000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={40000} />
    );
    
    // 檢查主容器使用品牌色彩的邊框和間距
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('mt-6', 'pt-6', 'border-t-2');
    expect(mainContainer.className).toContain('border-glory-red-200');
    expect(mainContainer.className).toContain('dark:border-dark-primary/30');
    
    // 檢查內部容器使用品牌色彩的背景色
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer).toHaveClass('rounded-xl');
    expect(innerContainer.className).toContain('p-4');
    expect(innerContainer.className).toContain('sm:p-6');
    expect(innerContainer.className).toContain('dark:bg-dark-surface/80');
    
    // 檢查標題使用品牌色彩系統（更新為新的設計）
    const title = container.querySelector('h4');
    expect(title).toHaveClass('font-bold');
    expect(title.className).toContain('text-lg');
    // 標題沒有直接的邊距，而是在父容器中有 mb-4
    expect(title.className).toContain('text-glory-red-700');
    expect(title.className).toContain('dark:text-dark-primary');
    
    // 檢查計算式使用等寬字體（與表格數字一致）
    const calculationContainer = container.querySelector('.font-mono');
    expect(calculationContainer).toHaveClass('font-mono');
    
    // 檢查所有元素都有過渡動畫類別
    const elementsWithTransition = container.querySelectorAll('.transition-theme');
    expect(elementsWithTransition.length).toBeGreaterThan(0);
  });

  it('should use consistent color scheme with success theme', () => {
    const breakdown = {
      cashTotal: 8000,
      chequeTotal: 12000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={20000} />
    );
    
    // 檢查邊框使用品牌色彩
    const mainContainer = container.firstChild;
    expect(mainContainer.className).toContain('border-glory-red-200');
    
    // 檢查背景使用品牌色彩
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer).toBeTruthy();
    
    // 檢查標題使用品牌色彩
    const title = container.querySelector('h4');
    expect(title.className).toContain('text-glory-red-700');
    
    // 檢查運算符號使用聖光金色彩
    const operators = container.querySelectorAll('.text-holy-gold-600');
    expect(operators.length).toBe(2); // + 和 = 符號
  });

  it('should be responsive with proper text sizing', () => {
    const breakdown = {
      cashTotal: 5000,
      chequeTotal: 3000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={8000} />
    );
    
    // 檢查響應式內邊距（更新為新的設計）
    const innerContainer = container.querySelector('.bg-glory-red-50');
    expect(innerContainer.className).toContain('p-4');
    expect(innerContainer.className).toContain('sm:p-6');
    
    // 檢查標題大小（更新為新的設計）
    const title = container.querySelector('h4');
    expect(title.className).toContain('text-lg');
    expect(title.className).toContain('font-bold');
    
    // 檢查大螢幕水平佈局
    const desktopLayout = container.querySelector('.hidden.sm\\:block');
    expect(desktopLayout).toBeTruthy();
    
    // 檢查小螢幕垂直佈局
    const mobileLayout = container.querySelector('.block.sm\\:hidden');
    expect(mobileLayout).toBeTruthy();
    
    // 檢查大螢幕計算式容器的響應式文字大小（更新為新的設計）
    const calculationContainer = desktopLayout.querySelector('.inline-flex');
    expect(calculationContainer.className).toContain('text-lg');
    expect(calculationContainer.className).toContain('lg:text-xl');
    
    // 檢查響應式間距（更新為新的設計）
    expect(calculationContainer.className).toContain('gap-3');
    expect(calculationContainer.className).toContain('lg:gap-4');
  });

  it('should maintain proper spacing and alignment', () => {
    const breakdown = {
      cashTotal: 10000,
      chequeTotal: 15000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={25000} />
    );
    
    // 檢查主容器的上邊距和內邊距（更新為新的設計）
    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('mt-6', 'pt-6');
    
    // 檢查內部容器的響應式內邊距（更新為新的設計）
    const innerContainer = mainContainer.querySelector('.bg-glory-red-50');
    expect(innerContainer.className).toContain('p-4');
    expect(innerContainer.className).toContain('sm:p-6');
    
    // 檢查文字居中對齊
    const textCenter = container.querySelector('.text-center');
    expect(textCenter).toBeTruthy();
  });

  it('should provide proper mobile layout for small screens', () => {
    const breakdown = {
      cashTotal: 8000,
      chequeTotal: 12000,
      hasCheque: true
    };
    
    const { container } = render(
      <PaymentBreakdownDisplay breakdown={breakdown} totalAmount={20000} />
    );
    
    // 檢查小螢幕垂直佈局存在（更新為新的設計）
    const mobileLayout = container.querySelector('.block.sm\\:hidden');
    expect(mobileLayout).toBeTruthy();
    expect(mobileLayout).toHaveClass('space-y-3');
    
    // 檢查現金行（更新為新的設計）
    const cashRow = mobileLayout.querySelector('.flex.justify-between');
    expect(cashRow).toBeTruthy();
    expect(cashRow).toHaveClass('items-center', 'py-2');
    
    // 檢查分隔線（更新為品牌色彩）
    const separator = mobileLayout.querySelector('.border-t-2');
    expect(separator).toBeTruthy();
    expect(separator.className).toContain('border-holy-gold-300');
    expect(separator.className).toContain('dark:border-dark-accent/50');
    expect(separator).toHaveClass('pt-3', 'mt-3');
    
    // 檢查總計行的樣式（更新為品牌色彩）
    const totalRow = separator.querySelector('.flex.justify-between');
    expect(totalRow).toBeTruthy();
    
    const totalLabel = totalRow.querySelector('.text-glory-red-700');
    expect(totalLabel).toHaveClass('font-bold');
    expect(totalLabel.className).toContain('dark:text-dark-primary');
    
    const totalAmount = totalRow.querySelector('.font-mono.font-bold');
    expect(totalAmount).toBeTruthy();
    expect(totalAmount).toHaveClass('text-xl');
    expect(totalAmount.className).toContain('text-glory-red-700');
    expect(totalAmount.className).toContain('dark:text-dark-primary');
  });
});