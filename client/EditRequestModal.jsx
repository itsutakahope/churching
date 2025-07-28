import React, { useState, useEffect, useRef } from 'react';
import { X, ClipboardPenLine, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { useTheme } from './ThemeContext.jsx';
import CategorySelector from './CategorySelector.jsx';
import axios from 'axios';

const EditRequestModal = ({ 
  isOpen, 
  onClose, 
  request, 
  onUpdateComplete, 
  onError 
}) => {
  const { currentUser } = useAuth();
  const modalRef = useRef(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'general',
    accountingCategory: ''
  });

  // UI 狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // 當 request 變化時，初始化表單資料
  useEffect(() => {
    if (request && isOpen) {
      setFormData({
        title: request.text || request.title || '',
        description: request.description || '',
        priority: request.priority || 'general',
        accountingCategory: request.accountingCategory || ''
      });
      setValidationErrors({});
    }
  }, [request, isOpen]);

  // ESC 鍵關閉模態框
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isSubmitting, onClose]);

  // 點擊外部關閉模態框
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isSubmitting, onClose]);

  // 表單驗證
  const validateForm = () => {
    const errors = {};
    
    // 標題驗證
    if (!formData.title.trim()) {
      errors.title = '需求標題為必填項目';
    } else if (formData.title.trim().length > 100) {
      errors.title = '需求標題不能超過100個字元';
    } else if (formData.title.trim().length < 2) {
      errors.title = '需求標題至少需要2個字元';
    }
    
    // 描述驗證
    if (formData.description.length > 500) {
      errors.description = '詳細描述不能超過500個字元';
    }
    
    // 優先級驗證
    if (!['general', 'urgent'].includes(formData.priority)) {
      errors.priority = '請選擇有效的緊急程度';
    }
    
    return errors;
  };

  // 即時驗證單個欄位
  const validateField = (field, value) => {
    const errors = {};
    
    switch (field) {
      case 'title':
        if (!value.trim()) {
          errors.title = '需求標題為必填項目';
        } else if (value.trim().length > 100) {
          errors.title = '需求標題不能超過100個字元';
        } else if (value.trim().length < 2) {
          errors.title = '需求標題至少需要2個字元';
        }
        break;
        
      case 'description':
        if (value.length > 500) {
          errors.description = '詳細描述不能超過500個字元';
        }
        break;
        
      case 'priority':
        if (!['general', 'urgent'].includes(value)) {
          errors.priority = '請選擇有效的緊急程度';
        }
        break;
    }
    
    return errors;
  };

  // API 錯誤處理函式
  const handleApiError = (error) => {
    let errorMessage = '更新需求時發生錯誤，請稍後再試。';
    let errorType = 'unknown';

    // 處理網路超時錯誤
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = '請求超時，請檢查網路連線後重試。';
      errorType = 'timeout';
    }
    // 處理 HTTP 回應錯誤
    else if (error.response) {
      const status = error.response.status;
      const backendMessage = error.response.data?.message;
      const errorCode = error.response.data?.code;

      switch (status) {
        case 400:
          errorMessage = backendMessage || '請求參數不正確，請檢查輸入內容。';
          errorType = 'validation';
          break;
        case 401:
          errorMessage = '登入已過期，請重新登入後再試。';
          errorType = 'auth';
          break;
        case 403:
          switch (errorCode) {
            case 'ACCOUNT_NOT_APPROVED':
              errorMessage = '您的帳號正在等待管理員審核，無法執行此操作。';
              break;
            case 'INSUFFICIENT_PERMISSIONS':
              errorMessage = '權限不足，您無法編輯此需求。';
              break;
            default:
              errorMessage = '權限不足，您無法編輯此需求。';
          }
          errorType = 'permission';
          break;
        case 404:
          errorMessage = '找不到該需求，可能已被刪除。請重新整理頁面。';
          errorType = 'not_found';
          break;
        case 409:
          errorMessage = '需求已被其他人修改，請重新整理後再試。';
          errorType = 'conflict';
          break;
        case 422:
          errorMessage = backendMessage || '提交的資料格式不正確，請檢查輸入內容。';
          errorType = 'validation';
          break;
        case 429:
          errorMessage = '請求過於頻繁，請稍後再試。';
          errorType = 'rate_limit';
          break;
        case 500:
          errorMessage = backendMessage || '伺服器內部錯誤，請稍後再試。';
          errorType = 'api';
          break;
        case 502:
          errorMessage = '伺服器暫時無法回應，請稍後再試。';
          errorType = 'server';
          break;
        case 503:
          errorMessage = '服務暫時不可用，請稍後再試。';
          errorType = 'server';
          break;
        case 504:
          errorMessage = '伺服器回應超時，請稍後再試。';
          errorType = 'timeout';
          break;
        default:
          if (status >= 500) {
            errorMessage = '伺服器發生錯誤，請稍後再試。';
            errorType = 'server';
          } else if (status >= 400) {
            errorMessage = backendMessage || '請求處理失敗，請檢查輸入內容。';
            errorType = 'client';
          } else {
            errorMessage = backendMessage || errorMessage;
            errorType = 'api';
          }
      }
    } 
    // 處理請求發送失敗（無回應）
    else if (error.request) {
      errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
      errorType = 'network';
    }
    // 處理特定網路連線錯誤
    else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      errorMessage = '網路連線失敗，請檢查您的網路狀態。';
      errorType = 'network';
    }
    // 處理其他未知錯誤
    else {
      errorMessage = error.message || '發生未知錯誤，請稍後再試。';
      errorType = 'unknown';
    }

    // 記錄錯誤詳情供調試使用
    console.error('EditRequestModal API Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      errorType,
      finalMessage: errorMessage
    });

    onError(errorMessage, errorType);
  };

  // 處理表單提交
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors({});

    // 建立更新後的需求資料（用於樂觀更新）
    const optimisticUpdate = {
      ...request,
      text: formData.title.trim(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      priority: formData.priority,
      accountingCategory: formData.accountingCategory.trim(),
      updatedAt: new Date().toISOString()
    };

    // 樂觀更新：立即更新前端狀態
    onUpdateComplete(optimisticUpdate);
    onClose();

    try {
      // 獲取 Firebase 認證 token
      const token = await currentUser.getIdToken();
      
      // 建立請求 payload
      const payload = {
        text: formData.title.trim(), // 向後相容，保持 text 欄位
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        accountingCategory: formData.accountingCategory.trim()
      };

      // 發送 PUT 請求到後端 API
      const response = await axios.put(`/api/requirements/${request.id}`, payload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000, // 10 秒超時
        // 添加請求攔截器處理
        validateStatus: (status) => {
          // 只有 2xx 狀態碼才被視為成功
          return status >= 200 && status < 300;
        }
      });

      // API 成功，樂觀更新已經完成，無需額外操作
      console.log('需求更新成功:', response.data);

    } catch (error) {
      console.error('編輯需求失敗:', error);
      
      // API 失敗，執行回滾機制：恢復原始資料
      onUpdateComplete(request);
      
      // 顯示錯誤訊息
      handleApiError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 處理取消
  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // 處理輸入變化
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 即時驗證回饋機制
    const fieldErrors = validateField(field, value);
    
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      
      // 清除該欄位的舊錯誤
      delete newErrors[field];
      
      // 如果有新錯誤，添加到錯誤狀態中
      if (fieldErrors[field]) {
        newErrors[field] = fieldErrors[field];
      }
      
      return newErrors;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-theme"
      >
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b border-graphite-200 dark:border-graphite-600 transition-theme">
          <h2 className="text-lg font-semibold text-text-main dark:text-dark-text-main flex items-center gap-2 transition-theme">
            <ClipboardPenLine size={20} />
            編輯採購需求
          </h2>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-text-subtle dark:text-dark-text-subtle hover:text-primary dark:hover:text-dark-primary transition-theme disabled:opacity-50"
            title="關閉"
          >
            <X size={20} />
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 relative">
          {/* 載入覆蓋層 */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-surface/50 dark:bg-dark-surface/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="bg-surface dark:bg-dark-surface border border-graphite-200 dark:border-graphite-600 rounded-lg p-4 shadow-lg flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-primary dark:text-dark-primary" />
                <span className="text-text-main dark:text-dark-text-main font-medium">正在更新需求...</span>
              </div>
            </div>
          )}
          {/* 需求標題 */}
          <div>
            <label htmlFor="editTitle" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
              需求標題 *
            </label>
            <input
              id="editTitle"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 focus:border-glory-red-500 dark:focus:border-glory-red-400 transition-theme ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              placeholder="請輸入需求標題"
              maxLength={100}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-graphite-400 dark:text-dark-text-subtle transition-theme">
                必填項目
              </span>
              <span className={`text-xs transition-theme ${
                formData.title.length > 90 
                  ? 'text-danger-500 dark:text-danger-400' 
                  : formData.title.length > 80
                  ? 'text-warning-500 dark:text-warning-400'
                  : 'text-graphite-400 dark:text-dark-text-subtle'
              }`}>
                {formData.title.length}/100
              </span>
            </div>
            {validationErrors.title && (
              <p className="text-danger-500 dark:text-danger-400 text-sm mt-1 transition-theme">
                {validationErrors.title}
              </p>
            )}
          </div>

          {/* 緊急程度 */}
          <div>
            <label className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
              緊急程度
            </label>
            <div className="flex gap-4">
              {[
                { 
                  value: 'general', 
                  label: '一般', 
                  color: 'bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main' 
                },
                { 
                  value: 'urgent', 
                  label: '緊急', 
                  color: 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300' 
                }
              ].map(option => (
                <label key={option.value} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value={option.value}
                    checked={formData.priority === option.value}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <span className={`px-3 py-2 rounded-full text-sm font-medium transition-theme ${
                    formData.priority === option.value 
                      ? option.color 
                      : 'bg-graphite-200 dark:bg-graphite-600 text-graphite-600 dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-500'
                  } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 詳細描述 */}
          <div>
            <label htmlFor="editDescription" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
              詳細描述
            </label>
            <textarea
              id="editDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 focus:border-glory-red-500 dark:focus:border-glory-red-400 resize-y transition-theme ${
                isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              placeholder="請輸入詳細描述（選填）"
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-graphite-500 dark:text-dark-text-subtle transition-theme">
                可使用連結和換行
              </span>
              <span className={`text-xs transition-theme ${
                formData.description.length > 450 
                  ? 'text-danger-500 dark:text-danger-400' 
                  : 'text-graphite-400 dark:text-dark-text-subtle'
              }`}>
                {formData.description.length}/500
              </span>
            </div>
            {validationErrors.description && (
              <p className="text-danger-500 dark:text-danger-400 text-sm mt-1 transition-theme">
                {validationErrors.description}
              </p>
            )}
          </div>

          {/* 會計科目 */}
          <div className={isSubmitting ? 'opacity-60 pointer-events-none' : ''}>
            <CategorySelector
              value={formData.accountingCategory}
              onChange={(value) => handleInputChange('accountingCategory', value)}
              disabled={isSubmitting}
            />
          </div>

          {/* 按鈕區域 */}
          <div className="flex gap-3 pt-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-text-main dark:text-dark-text-main bg-surface dark:bg-dark-surface border border-graphite-300 dark:border-graphite-600 rounded-lg hover:bg-background dark:hover:bg-dark-background transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSubmitting ? '正在更新中，請稍候...' : '取消編輯'}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary dark:bg-dark-primary text-white rounded-lg hover:bg-primary/90 dark:hover:bg-dark-primary/90 transition-theme disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={isSubmitting ? '正在更新中，請稍候...' : '儲存變更'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  更新中...
                </>
              ) : (
                '儲存變更'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRequestModal;