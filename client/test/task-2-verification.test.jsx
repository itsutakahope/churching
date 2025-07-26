import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('任務 2 - 次要文字元素深色模式樣式修復驗證', () => {
  const purchaseRequestBoardContent = readFileSync(
    join(process.cwd(), 'client/PurchaseRequestBoard.jsx'),
    'utf-8'
  );

  describe('2.1 購買備註標題樣式修復', () => {
    it('應該修復購買備註標題的深色模式樣式', () => {
      // 檢查購買備註標題是否包含深色模式樣式
      expect(purchaseRequestBoardContent).toMatch(
        /text-graphite-900 dark:text-dark-text-main.*transition-theme.*購買備註：/
      );
    });

    it('應該修復購買備註內容的深色模式樣式', () => {
      // 檢查購買備註內容是否包含深色模式樣式
      expect(purchaseRequestBoardContent).toMatch(
        /text-graphite-500 dark:text-dark-text-subtle.*bg-gray-50 dark:bg-graphite-700.*transition-theme/
      );
    });

    it('應該修復購買備註區域邊框的深色模式樣式', () => {
      // 檢查購買備註區域邊框是否包含深色模式樣式
      expect(purchaseRequestBoardContent).toMatch(
        /border-gray-200 dark:border-graphite-600.*transition-theme/
      );
    });
  });

  describe('2.2 留言模態框標題樣式修復', () => {
    it('應該修復留言模態框標題的深色模式樣式', () => {
      // 檢查留言模態框標題是否包含深色模式樣式
      expect(purchaseRequestBoardContent).toMatch(
        /text-xl font-semibold text-graphite-900 dark:text-dark-text-main transition-theme.*發表留言於/
      );
    });

    it('應該修復留言模態框標籤的深色模式樣式', () => {
      // 檢查姓名標籤
      expect(purchaseRequestBoardContent).toMatch(
        /text-gray-700 dark:text-dark-text-main.*transition-theme.*您的姓名/
      );
      
      // 檢查留言內容標籤
      expect(purchaseRequestBoardContent).toMatch(
        /text-gray-700 dark:text-dark-text-main.*transition-theme.*留言內容/
      );
    });

    it('應該修復留言模態框輸入框的深色模式樣式', () => {
      // 檢查姓名輸入框
      expect(purchaseRequestBoardContent).toMatch(
        /border-gray-300 dark:border-graphite-600.*dark:bg-dark-surface dark:text-dark-text-main.*transition-theme/
      );
      
      // 檢查留言內容 textarea
      expect(purchaseRequestBoardContent).toMatch(
        /border-gray-300 dark:border-graphite-600.*dark:bg-dark-surface dark:text-dark-text-main.*resize-none transition-theme/
      );
    });

    it('應該修復留言模態框底部邊框的深色模式樣式', () => {
      // 檢查模態框底部邊框
      expect(purchaseRequestBoardContent).toMatch(
        /border-t border-gray-200 dark:border-graphite-600.*transition-theme/
      );
    });
  });

  describe('整體驗證', () => {
    it('所有修復的元素都應該包含過渡動畫', () => {
      // 計算包含 transition-theme 的修復元素數量
      const transitionMatches = purchaseRequestBoardContent.match(/transition-theme/g);
      expect(transitionMatches).toBeTruthy();
      expect(transitionMatches.length).toBeGreaterThanOrEqual(7); // 至少 7 個元素被修復
    });

    it('應該使用統一的深色模式文字色彩', () => {
      // 檢查是否使用了統一的深色模式文字色彩
      expect(purchaseRequestBoardContent).toMatch(/dark:text-dark-text-main/);
      expect(purchaseRequestBoardContent).toMatch(/dark:text-dark-text-subtle/);
    });

    it('應該使用統一的深色模式背景和邊框色彩', () => {
      // 檢查是否使用了統一的深色模式背景和邊框色彩
      expect(purchaseRequestBoardContent).toMatch(/dark:bg-dark-surface/);
      expect(purchaseRequestBoardContent).toMatch(/dark:bg-graphite-700/);
      expect(purchaseRequestBoardContent).toMatch(/dark:border-graphite-600/);
    });
  });
});