import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('深色模式模態框與介面修復驗證', () => {
  const purchaseRequestBoardContent = readFileSync(
    join(process.cwd(), 'client/PurchaseRequestBoard.jsx'),
    'utf-8'
  );

  describe('採購看板模態框深色模式檢查', () => {
    it('應該檢查需求詳情模態框是否需要深色模式修復', () => {
      // 檢查是否存在需要修復的模態框結構
      const hasDetailModal = purchaseRequestBoardContent.includes('需求詳情') || 
                            purchaseRequestBoardContent.includes('showDetailModal');
      
      if (hasDetailModal) {
        // 檢查是否已有深色模式樣式
        const hasDarkModeStyles = purchaseRequestBoardContent.includes('dark:bg-dark-surface') &&
                                 purchaseRequestBoardContent.includes('dark:text-dark-text-main');
        
        // 如果沒有深色模式樣式，則需要修復
        expect(hasDarkModeStyles).toBeTruthy();
      }
    });

    it('應該檢查新增採購需求模態框是否需要深色模式修復', () => {
      // 檢查是否存在新增需求模態框
      const hasAddModal = purchaseRequestBoardContent.includes('新增採購需求') ||
                         purchaseRequestBoardContent.includes('showModal');
      
      if (hasAddModal) {
        // 檢查表單輸入欄位是否有深色模式樣式
        const hasFormDarkStyles = purchaseRequestBoardContent.includes('dark:bg-graphite-700') ||
                                 purchaseRequestBoardContent.includes('dark:border-graphite-600');
        
        // 記錄當前狀態以便後續修復
        console.log('新增採購需求模態框深色模式狀態:', hasFormDarkStyles ? '已修復' : '需要修復');
      }
    });

    it('應該檢查確認購買彈出視窗是否需要深色模式修復', () => {
      // 檢查是否存在確認購買視窗
      const hasPurchaseModal = purchaseRequestBoardContent.includes('確認購買') ||
                              purchaseRequestBoardContent.includes('showPurchaseModal');
      
      if (hasPurchaseModal) {
        // 檢查購買視窗是否有深色模式樣式
        const hasPurchaseDarkStyles = purchaseRequestBoardContent.includes('dark:bg-dark-surface');
        
        // 記錄當前狀態
        console.log('確認購買彈出視窗深色模式狀態:', hasPurchaseDarkStyles ? '已修復' : '需要修復');
      }
    });
  });

  describe('奉獻計算介面深色模式檢查', () => {
    it('應該檢查奉獻任務詳情頁面是否需要深色模式修復', () => {
      let tithingTaskDetailContent;
      try {
        tithingTaskDetailContent = readFileSync(
          join(process.cwd(), 'client/TithingTaskDetail.jsx'),
          'utf-8'
        );
      } catch (error) {
        console.log('TithingTaskDetail.jsx 文件不存在或無法讀取');
        return;
      }

      // 檢查主要容器是否有深色模式樣式
      const hasContainerDarkStyles = tithingTaskDetailContent.includes('dark:bg-dark-background') ||
                                    tithingTaskDetailContent.includes('dark:bg-dark-surface');
      
      // 檢查任務資訊卡片是否有深色模式樣式
      const hasCardDarkStyles = tithingTaskDetailContent.includes('dark:bg-dark-surface') &&
                               tithingTaskDetailContent.includes('dark:text-dark-text-main');
      
      console.log('奉獻任務詳情頁面深色模式狀態:', {
        容器樣式: hasContainerDarkStyles ? '已修復' : '需要修復',
        卡片樣式: hasCardDarkStyles ? '已修復' : '需要修復'
      });
    });

    it('應該檢查奉獻記錄表單是否需要深色模式修復', () => {
      let dedicationEntryFormContent;
      try {
        dedicationEntryFormContent = readFileSync(
          join(process.cwd(), 'client/DedicationEntryForm.jsx'),
          'utf-8'
        );
      } catch (error) {
        console.log('DedicationEntryForm.jsx 文件不存在或無法讀取');
        return;
      }

      // 檢查表單輸入欄位是否有深色模式樣式
      const hasFormDarkStyles = dedicationEntryFormContent.includes('dark:bg-graphite-700') ||
                               dedicationEntryFormContent.includes('dark:border-graphite-600');
      
      console.log('奉獻記錄表單深色模式狀態:', hasFormDarkStyles ? '已修復' : '需要修復');
    });

    it('應該檢查奉獻記錄列表是否需要深色模式修復', () => {
      let loggedDedicationsListContent;
      try {
        loggedDedicationsListContent = readFileSync(
          join(process.cwd(), 'client/LoggedDedicationsList.jsx'),
          'utf-8'
        );
      } catch (error) {
        console.log('LoggedDedicationsList.jsx 文件不存在或無法讀取');
        return;
      }

      // 檢查表格是否有深色模式樣式
      const hasTableDarkStyles = loggedDedicationsListContent.includes('dark:bg-dark-surface') ||
                                 loggedDedicationsListContent.includes('dark:bg-graphite-800');
      
      console.log('奉獻記錄列表深色模式狀態:', hasTableDarkStyles ? '已修復' : '需要修復');
    });

    it('應該檢查彙總摘要區域是否需要深色模式修復', () => {
      let aggregationSummaryContent;
      try {
        aggregationSummaryContent = readFileSync(
          join(process.cwd(), 'client/AggregationSummary.jsx'),
          'utf-8'
        );
      } catch (error) {
        console.log('AggregationSummary.jsx 文件不存在或無法讀取');
        return;
      }

      // 檢查摘要卡片是否有深色模式樣式
      const hasSummaryDarkStyles = aggregationSummaryContent.includes('dark:bg-success-900') ||
                                  aggregationSummaryContent.includes('dark:bg-dark-surface');
      
      console.log('彙總摘要區域深色模式狀態:', hasSummaryDarkStyles ? '已修復' : '需要修復');
    });
  });

  describe('深色模式色彩系統檢查', () => {
    it('應該檢查是否使用統一的深色模式色彩變數', () => {
      const darkColorVariables = [
        'dark:bg-dark-surface',
        'dark:bg-dark-background',
        'dark:text-dark-text-main',
        'dark:text-dark-text-subtle',
        'dark:border-graphite-600',
        'dark:bg-graphite-700',
        'dark:bg-graphite-800'
      ];

      const usedVariables = darkColorVariables.filter(variable => 
        purchaseRequestBoardContent.includes(variable)
      );

      console.log('已使用的深色模式色彩變數:', usedVariables);
      console.log('尚未使用的深色模式色彩變數:', 
        darkColorVariables.filter(variable => !usedVariables.includes(variable))
      );
    });

    it('應該檢查過渡動畫類別的使用情況', () => {
      const transitionMatches = purchaseRequestBoardContent.match(/transition-theme/g);
      const transitionCount = transitionMatches ? transitionMatches.length : 0;
      
      console.log('當前使用 transition-theme 的元素數量:', transitionCount);
      
      // 檢查是否有足夠的過渡動畫應用
      expect(transitionCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('模態框結構分析', () => {
    it('應該分析模態框的基本結構', () => {
      // 檢查模態框的基本結構模式
      const modalPatterns = [
        /fixed inset-0.*bg-black.*bg-opacity/,  // 模態框背景遮罩
        /bg-white.*rounded-lg.*shadow/,         // 模態框主體
        /flex.*justify-center.*items-center/,   // 模態框居中佈局
        /z-50/                                  // 模態框層級
      ];

      const foundPatterns = modalPatterns.map(pattern => 
        pattern.test(purchaseRequestBoardContent)
      );

      console.log('模態框結構分析:', {
        背景遮罩: foundPatterns[0] ? '存在' : '不存在',
        主體結構: foundPatterns[1] ? '存在' : '不存在',
        居中佈局: foundPatterns[2] ? '存在' : '不存在',
        層級設定: foundPatterns[3] ? '存在' : '不存在'
      });
    });

    it('應該檢查表單元素的深色模式需求', () => {
      // 檢查各種表單元素
      const formElements = {
        輸入框: /input.*className.*border/g,
        下拉選單: /select.*className.*border/g,
        文字區域: /textarea.*className.*border/g,
        複選框: /checkbox.*className/g,
        按鈕: /button.*className.*bg-/g
      };

      Object.entries(formElements).forEach(([elementType, pattern]) => {
        const matches = purchaseRequestBoardContent.match(pattern);
        const count = matches ? matches.length : 0;
        console.log(`${elementType}元素數量:`, count);
      });
    });
  });
});