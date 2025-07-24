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
      return <CheckCircle size={20} className="text-success-600 flex-shrink-0" />;
    }
    
    if (type === 'error') {
      switch (errorType) {
        case 'network':
        case 'timeout':
          return <WifiOff size={20} className="text-danger-600 flex-shrink-0" />;
        case 'permission':
        case 'auth':
          return <Shield size={20} className="text-danger-600 flex-shrink-0" />;
        case 'validation':
        case 'not_found':
          return <UserX size={20} className="text-danger-600 flex-shrink-0" />;
        default:
          return <AlertCircle size={20} className="text-danger-600 flex-shrink-0" />;
      }
    }
    
    if (type === 'warning') {
      return <AlertCircle size={20} className="text-holy-gold-600 flex-shrink-0" />;
    }
    
    // 資訊類型通知使用榮耀紅色系
    return <AlertCircle size={20} className="text-glory-red-600 flex-shrink-0" />;
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-success-50 border-success-100 text-success-700';
      case 'error':
        return 'bg-danger-50 border-danger-100 text-danger-700';
      case 'warning':
        return 'bg-holy-gold-50 border-holy-gold-100 text-holy-gold-700';
      default:
        // 資訊類型通知使用榮耀紅色系
        return 'bg-glory-red-50 border-glory-red-200 text-glory-red-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform ${
      isShowing ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 ${getStyles()}`}>
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">{message}</p>
            {showRetry && onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs px-3 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-all duration-200"
              >
                重試
              </button>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-current opacity-50 hover:opacity-75 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;