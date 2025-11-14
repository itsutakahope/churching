import React, { useState } from 'react';
import { X, Save, Edit, AlertCircle, Loader2 } from 'lucide-react';
import CategorySelector from './CategorySelector.jsx';

const RecognitionResultModal = ({ isOpen, onClose, recognitionData, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: recognitionData.title || '',
    description: recognitionData.description || '',
    accountingCategory: recognitionData.suggestedCategory || '',
    amount: recognitionData.amount || '',
    priority: 'general'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '請輸入需求標題';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = '請輸入有效的金額';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting recognition result:', error);
      setErrors({ submit: '提交需求時發生錯誤，請稍後再試' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-theme">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-graphite-200 dark:border-graphite-600 sticky top-0 bg-surface dark:bg-dark-surface z-10">
          <h2 className="text-lg font-semibold text-text-main dark:text-dark-text-main flex items-center gap-2">
            <Edit size={20} className="text-primary dark:text-dark-primary" />
            確認辨識結果
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-text-subtle dark:text-dark-text-subtle hover:text-primary dark:hover:text-dark-primary transition-theme disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* 內容區域 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 提示訊息 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              以下是 AI 自動辨識的結果，請確認並修改（如有需要），然後提交建立採購需求。
            </p>
          </div>

          {/* 錯誤訊息 */}
          {errors.submit && (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-700 dark:text-danger-300">{errors.submit}</p>
            </div>
          )}

          {/* 需求標題 */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              需求標題 <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full border ${errors.title ? 'border-danger-500' : 'border-graphite-300 dark:border-graphite-600'} bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary transition-theme`}
              placeholder="例如：A4 影印紙"
              required
            />
            {errors.title && (
              <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.title}</p>
            )}
          </div>

          {/* 詳細描述（數量） */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              詳細描述 / 數量
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary resize-y transition-theme"
              placeholder="例如：數量: 5 包"
            />
          </div>

          {/* 會計類別 */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              會計類別
            </label>
            <CategorySelector
              value={formData.accountingCategory}
              onChange={(value) => setFormData(prev => ({ ...prev, accountingCategory: value }))}
            />
            <p className="text-xs text-text-subtle dark:text-dark-text-subtle mt-1">
              AI 建議：{recognitionData.suggestedCategory || '無'}
            </p>
          </div>

          {/* 購買金額 */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              購買金額 <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle dark:text-dark-text-subtle">
                NT$
              </span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className={`w-full border ${errors.amount ? 'border-danger-500' : 'border-graphite-300 dark:border-graphite-600'} bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg pl-12 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary transition-theme`}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.amount}</p>
            )}
          </div>

          {/* 優先級 */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              優先級
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="general"
                  checked={formData.priority === 'general'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="text-primary dark:text-dark-primary focus:ring-primary dark:focus:ring-dark-primary"
                />
                <span className="text-text-main dark:text-dark-text-main">一般</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="urgent"
                  checked={formData.priority === 'urgent'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="text-danger-500 focus:ring-danger-500"
                />
                <span className="text-text-main dark:text-dark-text-main">緊急</span>
              </label>
            </div>
          </div>

          {/* 已購買提示 */}
          <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3">
            <p className="text-sm text-success-700 dark:text-success-300">
              ✓ 此需求將自動標記為「我已購買此項目」
            </p>
          </div>

          {/* 按鈕區域 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-graphite-200 dark:border-graphite-600">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="bg-surface dark:bg-dark-surface border border-graphite-300 dark:border-graphite-600 text-text-main dark:text-dark-text-main hover:bg-background dark:hover:bg-dark-background px-6 py-2 rounded-lg transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary dark:bg-dark-primary hover:bg-primary/90 dark:hover:bg-dark-primary/90 text-white px-6 py-2 rounded-lg transition-theme flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  提交需求
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecognitionResultModal;
