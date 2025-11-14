import React, { useState, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import axios from 'axios';
import { Scan, Upload, Image as ImageIcon, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import RecognitionResultModal from './RecognitionResultModal.jsx';

const AIRecognitionPage = () => {
  const { currentUser, userProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [notification, setNotification] = useState(null);

  // 處理檔案選擇
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      setNotification({
        type: 'error',
        message: '請選擇圖片檔案（JPG、PNG 等）'
      });
      return;
    }

    // 驗證檔案大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      setNotification({
        type: 'error',
        message: '圖片檔案過大，請選擇小於 10MB 的圖片'
      });
      return;
    }

    setSelectedImage(file);

    // 產生預覽
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // 清除通知
    setNotification(null);
  };

  // 處理拖放
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // 觸發相同的檔案處理邏輯
    const fakeEvent = {
      target: {
        files: [file]
      }
    };
    handleFileSelect(fakeEvent);
  };

  // 清除選擇的圖片
  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setRecognitionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 辨識收據
  const handleRecognize = async () => {
    if (!selectedImage) {
      setNotification({
        type: 'error',
        message: '請先選擇圖片'
      });
      return;
    }

    setIsRecognizing(true);
    setNotification(null);

    try {
      // 將圖片轉換為 base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result;

        try {
          const token = await currentUser.getIdToken();
          const response = await axios.post('/api/ai/recognize', {
            imageBase64: base64Data
          }, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          setRecognitionResult(response.data);
          setShowResultModal(true);
          setNotification({
            type: 'success',
            message: 'AI 辨識完成！請確認結果'
          });

        } catch (error) {
          console.error('Error recognizing receipt:', error);

          let errorMessage = '辨識收據時發生錯誤';

          if (error.response?.data?.code === 'AI_NOT_CONFIGURED') {
            errorMessage = '尚未設定 AI 辨識功能，請聯絡管理員';
          } else if (error.response?.data?.code === 'AI_SERVICE_ERROR') {
            errorMessage = 'AI 服務暫時無法使用，請稍後再試';
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          }

          setNotification({
            type: 'error',
            message: errorMessage
          });
        } finally {
          setIsRecognizing(false);
        }
      };

      reader.readAsDataURL(selectedImage);

    } catch (error) {
      console.error('Error reading file:', error);
      setNotification({
        type: 'error',
        message: '讀取圖片時發生錯誤'
      });
      setIsRecognizing(false);
    }
  };

  // 提交採購需求
  const handleSubmitRequirement = async (formData) => {
    try {
      const token = await currentUser.getIdToken();

      const payload = {
        text: formData.title.trim(),
        description: formData.description.trim(),
        accountingCategory: formData.accountingCategory.trim(),
        priority: formData.priority,
        status: 'purchased',
        purchaseAmount: parseFloat(formData.amount),
        purchaseDate: new Date().toISOString(),
        purchaserName: userProfile.displayName || currentUser.displayName
      };

      await axios.post('/api/requirements', payload, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotification({
        type: 'success',
        message: '採購需求已成功建立！'
      });

      // 清除狀態
      handleClearImage();
      setShowResultModal(false);

    } catch (error) {
      console.error('Error creating requirement:', error);
      throw error;
    }
  };

  // 檢查使用者狀態
  if (userProfile?.status !== 'approved') {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background transition-theme p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger-800 dark:text-danger-300">帳號尚未審核</h3>
              <p className="text-danger-700 dark:text-danger-400 text-sm mt-1">
                您的帳號尚未通過審核，無法使用 AI 辨識功能。請聯絡管理員。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background transition-theme p-6">
      <div className="max-w-4xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main dark:text-dark-text-main flex items-center gap-3">
            <Scan size={28} className="text-primary dark:text-dark-primary" />
            AI 收據辨識
          </h1>
          <p className="text-text-subtle dark:text-dark-text-subtle mt-2">
            上傳收據或發票圖片，AI 將自動辨識並填寫採購需求資訊
          </p>
        </div>

        {/* 通知訊息 */}
        {notification && (
          <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${
            notification.type === 'success'
              ? 'bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800'
              : 'bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle size={20} className="text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${
              notification.type === 'success'
                ? 'text-success-700 dark:text-success-300'
                : 'text-danger-700 dark:text-danger-300'
            }`}>
              {notification.message}
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* 左側：上傳區域 */}
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-text-main dark:text-dark-text-main mb-4 flex items-center gap-2">
              <Upload size={20} />
              上傳收據圖片
            </h2>

            {/* 拖放區域 */}
            {!imagePreview ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-graphite-300 dark:border-graphite-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary dark:hover:border-dark-primary hover:bg-background dark:hover:bg-dark-background transition-theme"
              >
                <ImageIcon size={48} className="mx-auto text-graphite-400 dark:text-graphite-500 mb-4" />
                <p className="text-text-main dark:text-dark-text-main font-medium mb-2">
                  點擊選擇圖片或拖放至此
                </p>
                <p className="text-text-subtle dark:text-dark-text-subtle text-sm">
                  支援 JPG、PNG 格式，檔案大小限制 10MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="收據預覽"
                  className="w-full rounded-lg shadow-md"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 bg-danger-500 hover:bg-danger-600 text-white rounded-full p-2 shadow-lg transition-theme"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* 隱藏的檔案輸入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 辨識按鈕 */}
            {imagePreview && (
              <button
                onClick={handleRecognize}
                disabled={isRecognizing}
                className="w-full mt-4 bg-primary dark:bg-dark-primary hover:bg-primary/90 dark:hover:bg-dark-primary/90 text-white px-6 py-3 rounded-lg transition-theme flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRecognizing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    AI 辨識中...
                  </>
                ) : (
                  <>
                    <Scan size={20} />
                    開始辨識
                  </>
                )}
              </button>
            )}
          </div>

          {/* 右側：說明與提示 */}
          <div className="space-y-6">
            {/* 使用步驟 */}
            <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-text-main dark:text-dark-text-main mb-4">
                使用步驟
              </h2>
              <ol className="space-y-3 text-text-main dark:text-dark-text-main">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-dark-primary text-white text-sm flex items-center justify-center">1</span>
                  <span>上傳收據或發票圖片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-dark-primary text-white text-sm flex items-center justify-center">2</span>
                  <span>點擊「開始辨識」讓 AI 分析圖片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-dark-primary text-white text-sm flex items-center justify-center">3</span>
                  <span>確認並修改 AI 辨識結果</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-dark-primary text-white text-sm flex items-center justify-center">4</span>
                  <span>提交建立採購需求</span>
                </li>
              </ol>
            </div>

            {/* 注意事項 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">注意事項</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
                <li>請確保圖片清晰，文字易於辨識</li>
                <li>支援中文和英文收據</li>
                <li>AI 辨識結果僅供參考，請務必確認</li>
                <li>提交後將自動標記為「我已購買此項目」</li>
              </ul>
            </div>

            {/* AI 辨識資訊 */}
            {recognitionResult && !showResultModal && (
              <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
                <h3 className="font-semibold text-success-800 dark:text-success-300 mb-2 flex items-center gap-2">
                  <CheckCircle size={16} />
                  辨識完成
                </h3>
                <div className="text-sm text-success-700 dark:text-success-400 space-y-1">
                  <p><strong>品項：</strong>{recognitionResult.title}</p>
                  <p><strong>金額：</strong>NT$ {recognitionResult.amount}</p>
                  <p><strong>建議類別：</strong>{recognitionResult.suggestedCategory || '無'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 辨識結果確認彈窗 */}
      {showResultModal && recognitionResult && (
        <RecognitionResultModal
          isOpen={showResultModal}
          onClose={() => setShowResultModal(false)}
          recognitionData={recognitionResult}
          onSubmit={handleSubmitRequirement}
        />
      )}
    </div>
  );
};

export default AIRecognitionPage;
