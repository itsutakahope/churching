import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Loader2, Tag } from 'lucide-react';
import CategorySelector from './CategorySelector.jsx';

// Simple Spinner Icon Component
const SpinnerIcon = ({ className = "" }) => <Loader2 size={16} className={`animate-spin ${className}`} />;

const EditCategoryModal = ({ 
  isOpen, 
  onClose, 
  record, 
  onSave, 
  isLoading = false, 
  error = '' 
}) => {
  const [tempCategoryValue, setTempCategoryValue] = useState('');

  // 初始化暫存會計科目值
  useEffect(() => {
    if (isOpen && record) {
      setTempCategoryValue(record.accountingCategory || '');
    }
  }, [isOpen, record]);

  // 處理儲存操作
  const handleSave = () => {
    if (onSave) {
      onSave(tempCategoryValue);
    }
  };

  // 處理關閉操作
  const handleClose = () => {
    if (!isLoading && onClose) {
      onClose();
    }
  };

  // 處理點擊背景關閉
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isLoading) {
      handleClose();
    }
  };

  // 處理 ESC 鍵關閉
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading]);

  // 如果模態框未開啟，不渲染任何內容
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-md border border-graphite-200 dark:border-graphite-600 transition-theme">
        {/* 標題區域 */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-graphite-800 dark:text-dark-text-main transition-theme">
            編輯會計科目
          </h3>
          <button 
            onClick={handleClose}
            disabled={isLoading}
            className="text-graphite-500 dark:text-dark-text-subtle hover:text-glory-red-600 dark:hover:text-dark-primary disabled:opacity-50 transition-theme"
            title="關閉"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 項目資訊 */}
        <div className="mb-4">
          <p className="text-sm text-graphite-600 dark:text-dark-text-subtle transition-theme">項目名稱</p>
          <p className="font-medium text-graphite-900 dark:text-dark-text-main transition-theme">
            {record?.text || record?.title || '未知項目'}
          </p>
        </div>
        
        {/* 當前會計科目 */}
        <div className="mb-4">
          <p className="text-sm text-graphite-600 dark:text-dark-text-subtle transition-theme">目前會計科目</p>
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-graphite-500 dark:text-dark-text-subtle transition-theme" />
            <p className="text-graphite-700 dark:text-dark-text-main transition-theme">
              {record?.accountingCategory || '未分類'}
            </p>
          </div>
        </div>
        
        {/* CategorySelector */}
        <div className="mb-6">
          <CategorySelector 
            value={tempCategoryValue} 
            onChange={setTempCategoryValue} 
          />
        </div>
        
        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-danger-50 dark:bg-danger-dark/20 border border-danger-200 dark:border-danger-dark/40 rounded-md transition-theme">
            <p className="text-sm text-danger-600 dark:text-danger-dark transition-theme">
              {error}
            </p>
          </div>
        )}
        
        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-glory-red-500 dark:bg-dark-primary hover:bg-glory-red-600 dark:hover:bg-dark-primary/90 disabled:bg-graphite-300 dark:disabled:bg-graphite-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-theme"
          >
            {isLoading ? <SpinnerIcon /> : <CheckSquare size={18} />}
            {isLoading ? '儲存中...' : '儲存'}
          </button>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 bg-graphite-200 dark:bg-dark-background text-graphite-900 dark:text-dark-text-main hover:bg-graphite-300 dark:hover:bg-dark-surface disabled:opacity-50 font-bold py-2 px-4 rounded-lg transition-theme"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;