import React, { useState, useEffect } from 'react';
import { X, Users, AlertCircle, Loader2, CheckCircle, WifiOff, Shield, UserX } from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import axios from 'axios';

const TransferReimbursementModal = ({ 
  isOpen, 
  onClose, 
  currentRequest, 
  onTransferComplete 
}) => {
  const { currentUser } = useAuth();
  const [reimbursementContacts, setReimbursementContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState(''); // 新增：錯誤類型
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false); // 新增：成功訊息
  const [retryCount, setRetryCount] = useState(0); // 新增：重試計數

  // 載入報帳聯絡人清單
  useEffect(() => {
    if (isOpen && currentUser) {
      loadReimbursementContacts();
    }
  }, [isOpen, currentUser]);

  const loadReimbursementContacts = async (isRetry = false) => {
    try {
      setIsLoadingContacts(true);
      setError('');
      setErrorType('');
      
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/users/reimbursement-contacts', {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 10000 // 10秒超時
      });
      
      // 過濾掉目前的報帳負責人
      const filteredContacts = response.data.filter(
        contact => contact.uid !== currentRequest?.reimbursementerId
      );
      
      setReimbursementContacts(filteredContacts);
      
      // 如果是重試成功，重置重試計數
      if (isRetry) {
        setRetryCount(0);
      }
    } catch (err) {
      console.error('載入報帳聯絡人失敗:', err);
      
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        setError('請求超時，請檢查網路連線後重試。');
        setErrorType('timeout');
      } else if (err.response?.status === 403) {
        const errorCode = err.response.data?.code;
        if (errorCode === 'ACCOUNT_NOT_APPROVED') {
          setError('權限不足：您的帳號正在等待管理員審核。');
          setErrorType('permission');
        } else {
          setError('權限不足：無法載入報帳聯絡人清單。');
          setErrorType('permission');
        }
      } else if (err.response?.status === 401) {
        setError('登入已過期，請重新登入後再試。');
        setErrorType('auth');
      } else if (err.response?.status >= 500) {
        setError('伺服器暫時無法回應，請稍後再試。');
        setErrorType('server');
      } else if (err.request) {
        setError('無法連線至伺服器，請檢查您的網路連線。');
        setErrorType('network');
      } else {
        setError('載入報帳聯絡人清單時發生錯誤，請稍後再試。');
        setErrorType('unknown');
      }
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleContactSelect = (contactId) => {
    setSelectedContactId(contactId);
    setError('');
  };

  const handleTransferClick = () => {
    if (!selectedContactId) {
      setError('請選擇要轉交的報帳聯絡人。');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmTransfer = async () => {
    try {
      setIsLoading(true);
      setError('');
      setErrorType('');
      
      const selectedContact = reimbursementContacts.find(
        contact => contact.uid === selectedContactId
      );
      
      if (!selectedContact) {
        setError('選擇的聯絡人無效，請重新選擇。');
        setErrorType('validation');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await axios.put(
        `/api/requirements/${currentRequest.id}/transfer`,
        {
          newReimbursementerId: selectedContact.uid,
          newReimbursementerName: selectedContact.displayName
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000 // 15秒超時
        }
      );

      if (response.data.success) {
        // 顯示成功訊息
        setShowSuccessMessage(true);
        
        // 延遲一下讓使用者看到成功訊息
        setTimeout(() => {
          // 通知父組件轉交完成
          if (onTransferComplete) {
            onTransferComplete(response.data.updatedRequirement);
          }
          
          // 重置狀態並關閉彈窗
          resetModal();
          onClose();
        }, 1500);
      } else {
        setError(response.data.message || '轉交失敗，請稍後再試。');
        setErrorType('api');
      }
    } catch (err) {
      console.error('轉交報帳失敗:', err);
      
      if (err.code === 'ECONNABORTED' || (err.message && err.message.includes('timeout'))) {
        setError('請求超時，請檢查網路連線後重試。');
        setErrorType('timeout');
      } else if (err.response) {
        const errorCode = err.response.data?.code;
        const status = err.response.status;
        
        switch (errorCode) {
          case 'PERMISSION_DENIED':
            setError('權限不足：只有目前的報帳負責人才能執行此操作。');
            setErrorType('permission');
            break;
          case 'INVALID_TARGET_USER':
            setError('選擇的使用者沒有報帳權限，請選擇其他人員。');
            setErrorType('validation');
            break;
          case 'REQUIREMENT_NOT_FOUND':
            setError('找不到指定的購買需求，請重新整理頁面。');
            setErrorType('not_found');
            break;
          case 'INVALID_REQUEST_DATA':
            setError('請求資料無效，請重新選擇聯絡人。');
            setErrorType('validation');
            break;
          case 'DATABASE_ERROR':
            setError('資料庫錯誤，請稍後再試。');
            setErrorType('server');
            break;
          default:
            if (status === 401) {
              setError('登入已過期，請重新登入後再試。');
              setErrorType('auth');
            } else if (status === 403) {
              setError('權限不足，無法執行此操作。');
              setErrorType('permission');
            } else if (status >= 500) {
              setError('伺服器暫時無法回應，請稍後再試。');
              setErrorType('server');
            } else {
              setError(err.response.data?.message || '轉交失敗，請稍後再試。');
              setErrorType('api');
            }
        }
      } else if (err.request) {
        setError('無法連線至伺服器，請檢查您的網路連線。');
        setErrorType('network');
      } else {
        setError('發生預期外的錯誤，請稍後再試。');
        setErrorType('unknown');
      }
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const resetModal = () => {
    setSelectedContactId('');
    setError('');
    setErrorType('');
    setShowConfirmDialog(false);
    setIsLoading(false);
    setShowSuccessMessage(false);
    setRetryCount(0);
  };

  // 重試載入聯絡人清單
  const handleRetryLoadContacts = () => {
    setRetryCount(prev => prev + 1);
    loadReimbursementContacts(true);
  };

  // 根據錯誤類型獲取對應的圖示
  const getErrorIcon = () => {
    switch (errorType) {
      case 'network':
      case 'timeout':
        return <WifiOff size={16} className="text-red-500 mt-0.5 flex-shrink-0" />;
      case 'permission':
      case 'auth':
        return <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />;
      case 'validation':
      case 'not_found':
        return <UserX size={16} className="text-red-500 mt-0.5 flex-shrink-0" />;
      default:
        return <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />;
    }
  };

  // 檢查是否可以重試
  const canRetry = () => {
    return ['network', 'timeout', 'server', 'unknown'].includes(errorType) && retryCount < 3;
  };

  const handleClose = () => {
    if (!isLoading) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 標題列 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Users size={20} />
            轉交報帳
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* 內容區域 */}
        <div className="p-4">
          {/* 目前購買需求資訊 */}
          {currentRequest && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">購買項目：</p>
              <p className="font-medium text-gray-800">{currentRequest.text}</p>
              <p className="text-sm text-gray-600 mt-2">
                目前報帳負責人：{currentRequest.reimbursementerName}
              </p>
            </div>
          )}

          {/* 成功訊息 */}
          {showSuccessMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">轉交成功！</p>
                <p className="text-xs text-green-600 mt-1">報帳責任已成功轉交，頁面即將更新...</p>
              </div>
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && !showSuccessMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                {getErrorIcon()}
                <div className="flex-1">
                  <p className="text-sm text-red-700">{error}</p>
                  {errorType === 'timeout' && (
                    <p className="text-xs text-red-600 mt-1">
                      請檢查您的網路連線是否穩定
                    </p>
                  )}
                  {errorType === 'permission' && (
                    <p className="text-xs text-red-600 mt-1">
                      請聯繫系統管理員確認您的權限設定
                    </p>
                  )}
                </div>
              </div>
              {/* 重試按鈕 */}
              {canRetry() && (
                <div className="flex justify-end">
                  <button
                    onClick={handleRetryLoadContacts}
                    disabled={isLoadingContacts}
                    className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {isLoadingContacts ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        重試中...
                      </>
                    ) : (
                      <>
                        重試 ({3 - retryCount} 次剩餘)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 報帳聯絡人清單 */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              選擇新的報帳負責人：
            </h3>
            
            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">載入中...</span>
              </div>
            ) : reimbursementContacts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={24} className="mx-auto mb-2 opacity-50" />
                <p>沒有其他可選擇的報帳聯絡人</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {reimbursementContacts.map((contact) => (
                  <label
                    key={contact.uid}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedContactId === contact.uid
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reimbursementContact"
                      value={contact.uid}
                      checked={selectedContactId === contact.uid}
                      onChange={() => handleContactSelect(contact.uid)}
                      className="mr-3 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-gray-800">
                        {contact.displayName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {contact.email}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 按鈕區域 */}
        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading || showSuccessMessage}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleTransferClick}
            disabled={isLoading || !selectedContactId || isLoadingContacts || showSuccessMessage}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {showSuccessMessage ? (
              <>
                <CheckCircle size={16} />
                轉交成功
              </>
            ) : isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                轉交中...
              </>
            ) : (
              '確認轉交'
            )}
          </button>
        </div>
      </div>

      {/* 確認對話框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle size={20} className="text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  確認轉交報帳
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-3">
                  您即將將以下購買需求的報帳責任轉交：
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <p className="font-medium text-gray-800 text-sm">
                    {currentRequest?.text}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    購買金額：NT$ {currentRequest?.purchaseAmount?.toLocaleString()}
                  </p>
                </div>
                <p className="text-gray-600">
                  <span className="font-medium">轉交給：</span>
                  <span className="text-blue-600 font-medium">
                    {reimbursementContacts.find(c => c.uid === selectedContactId)?.displayName}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  ⚠️ 轉交後，您將無法再管理此項目的報帳事宜
                </p>
              </div>

              {/* 錯誤訊息 */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  {getErrorIcon()}
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmDialog(false);
                    setError('');
                    setErrorType('');
                  }}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={handleConfirmTransfer}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      轉交中...
                    </>
                  ) : (
                    '確認轉交'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferReimbursementModal;