import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, WifiOff, Shield, UserX } from 'lucide-react';

const ToastNotification = ({ 
  message, 
  type = 'info', 
  errorType = '', 
  isVisible, 
  onClose, 
  duration = 5000,
  showRetry = false,
  onRetry = null
}) => {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsShowing(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300); // 等待動畫完成
  };

  const getIcon = () => {
    if (type === 'success') {
      return <CheckCircle size={20} className="text-success-600 dark:text-success-400 flex-shrink-0 transition-theme" />;
    }
    
    if (type === 'error') {
      switch (errorType) {
        case 'network':
        case 'timeout':
          return <WifiOff size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 transition-theme" />;
        case 'permission':
        case 'auth':
          return <Shield size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 transition-theme" />;
        case 'validation':
        case 'not_found':
          return <UserX size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 transition-theme" />;
        default:
          return <AlertCircle size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 transition-theme" />;
      }
    }
    
    if (type === 'warning') {
      return <AlertCircle size={20} className="text-warning-600 dark:text-warning-400 flex-shrink-0 transition-theme" />;
    }
    
    // 資訊類型通知使用主色系
    return <AlertCircle size={20} className="text-primary dark:text-dark-primary flex-shrink-0 transition-theme" />;
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 dark:bg-success-900/20 border-success-100 dark:border-success-800 text-success-700 dark:text-success-300';
      case 'error':
        return 'bg-danger-50 dark:bg-danger-900/20 border-danger-100 dark:border-danger-800 text-danger-700 dark:text-danger-300';
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-900/20 border-warning-100 dark:border-warning-800 text-warning-700 dark:text-warning-300';
      default:
        // 資訊類型通知使用主色系
        return 'bg-primary/10 dark:bg-dark-primary/20 border-primary/20 dark:border-dark-primary/30 text-primary dark:text-dark-primary';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform ${
      isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 transition-theme ${getStyles()}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{message}</p>
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs px-3 py-1 bg-surface dark:bg-dark-surface bg-opacity-50 dark:bg-opacity-50 rounded hover:bg-opacity-75 dark:hover:bg-opacity-75 transition-theme"
              >
                重試
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-current opacity-50 hover:opacity-75 transition-theme"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;