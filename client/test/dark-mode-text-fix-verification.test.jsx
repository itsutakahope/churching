import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('深色模式文字可見性修復驗證', () => {
  const purchaseRequestBoardContent = readFileSync(
    join(process.cwd(), 'client/PurchaseRequestBoard.jsx'),
    'utf-8'
  );

  describe('品名標題深色模式樣式修復', () => {
    it('應該包含深色模式文字樣式', () => {
      // 檢查列表視圖品名標題是否包含深色模式樣式
      expect(purchaseRequestBoardContent).toMatch(
        /text-graphite-900 dark:text-dark-text-main transition-theme.*truncate/
      );
    });

    it('應該修復所有品名標題位置', () => {
      // 檢查是否有兩個品名標題都被修復
      const matches = purchaseRequestBoardContent.match(
        /text-md font-semibold text-graphite-900 dark:text-dark-text-main transition-theme truncate/g
      );
      expect(matches).toHaveLength(2);
    });
  });

  describe('狀態標籤後備樣式修復', () => {
    it('應該不再包含舊的後備樣式', () => {
      // 檢查是否已移除所有舊的 bg-gray-100 text-graphite-900 樣式
      expect(purchaseRequestBoardContent).not.toMatch(/bg-gray-100 text-graphite-900/);
    });

    it('應該包含新的深色模式後備樣式', () => {
      // 檢查是否包含新的深色模式後備樣式
      expect(purchaseRequestBoardContent).toMatch(
        /bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme/
      );
    });

    it('應該修復所有狀態標籤位置', () => {
      // 檢查是否有四個狀態標籤都被修復
      const matches = purchaseRequestBoardContent.match(
        /bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme/g
      );
      expect(matches).toHaveLength(4);
    });
  });

  describe('表單標籤文字樣式修復', () => {
    it('應該修復所有表單標籤的深色模式樣式', () => {
      // 檢查表單標籤是否包含深色模式樣式
      const formLabelMatches = purchaseRequestBoardContent.match(
        /text-sm font-medium text-graphite-900 dark:text-dark-text-main transition-theme/g
      );
      expect(formLabelMatches).toHaveLength(3);
    });

    it('應該包含正確的表單標籤文字', () => {
      // 檢查特定的表單標籤文字
      expect(purchaseRequestBoardContent).toMatch(/我已購買此項目.*直接登記為「已購買」/);
      expect(purchaseRequestBoardContent).toMatch(/指定他人請款.*非本人報帳/);
    });
  });

  describe('過渡動畫效果', () => {
    it('所有修復的元素都應該包含過渡動畫類別', () => {
      // 檢查所有修復的元素都包含 transition-theme 類別
      const transitionMatches = purchaseRequestBoardContent.match(/transition-theme/g);
      expect(transitionMatches.length).toBeGreaterThanOrEqual(9); // 至少9個元素被修復
    });
  });

  describe('深色模式色彩一致性', () => {
    it('應該使用統一的深色模式文字色彩', () => {
      // 檢查是否統一使用 dark:text-dark-text-main
      const darkTextMatches = purchaseRequestBoardContent.match(/dark:text-dark-text-main/g);
      expect(darkTextMatches.length).toBeGreaterThanOrEqual(9);
    });

    it('應該使用統一的深色模式背景色彩', () => {
      // 檢查狀態標籤是否使用統一的深色背景
      const darkBgMatches = purchaseRequestBoardContent.match(/dark:bg-graphite-700/g);
      expect(darkBgMatches.length).toBeGreaterThanOrEqual(4);
    });
  });
});