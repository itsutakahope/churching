import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import axios from 'axios';
import { Settings, Save, AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const AISettingsPage = () => {
  const { currentUser, userRoles } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    provider: '',
    apiKey: '',
    model: ''
  });

  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);

  // 模型選項（根據提供商顯示不同選項）
  const modelOptions = {
    openai: [
      { value: 'gpt-4o', label: 'GPT-4O (推薦)' },
      { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
      { value: 'gpt-4o-mini', label: 'GPT-4O Mini (經濟)' }
    ],
    anthropic: [
      { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (推薦)' },
      { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
      { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
      { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (經濟)' }
    ],
    google: [
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (推薦)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { value: 'gemini-pro-vision', label: 'Gemini Pro Vision' }
    ]
  };

  // 檢查是否為 admin
  const isAdmin = userRoles.includes('admin');

  useEffect(() => {
    if (!isAdmin) {
      setNotification({
        type: 'error',
        message: '您沒有權限存取此頁面（需要 admin 角色）'
      });
      setIsLoading(false);
      return;
    }

    fetchSettings();
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/ai/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const settings = response.data;
      setFormData({
        provider: settings.provider || '',
        apiKey: '',
        model: settings.model || ''
      });
      setApiKeyConfigured(settings.apiKeyConfigured);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching AI settings:', error);

      if (error.response?.status === 403) {
        setNotification({
          type: 'error',
          message: '您沒有權限存取 AI 設定'
        });
      } else {
        setNotification({
          type: 'error',
          message: '載入 AI 設定時發生錯誤'
        });
      }

      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.provider || !formData.apiKey || !formData.model) {
      setNotification({
        type: 'error',
        message: '請填寫所有必要欄位'
      });
      return;
    }

    setIsSaving(true);

    try {
      const token = await currentUser.getIdToken();
      await axios.put('/api/ai/settings', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotification({
        type: 'success',
        message: 'AI 設定已成功儲存'
      });

      setApiKeyConfigured(true);
      setFormData(prev => ({ ...prev, apiKey: '' }));
      setShowApiKey(false);

    } catch (error) {
      console.error('Error saving AI settings:', error);

      const errorMessage = error.response?.data?.message || '儲存 AI 設定時發生錯誤';
      setNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (provider) => {
    setFormData({
      provider,
      apiKey: '',
      model: modelOptions[provider]?.[0]?.value || ''
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background transition-theme flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-main dark:text-dark-text-main">
          <Loader2 size={24} className="animate-spin" />
          <span>載入中...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background transition-theme p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-danger-600 dark:text-danger-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-danger-800 dark:text-danger-300">存取被拒絕</h3>
              <p className="text-danger-700 dark:text-danger-400 text-sm mt-1">
                您沒有權限存取此頁面。只有管理員可以設定 AI 辨識功能。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background transition-theme p-6">
      <div className="max-w-2xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-main dark:text-dark-text-main flex items-center gap-3">
            <Settings size={28} className="text-primary dark:text-dark-primary" />
            AI 辨識設定
          </h1>
          <p className="text-text-subtle dark:text-dark-text-subtle mt-2">
            設定 AI 模型提供商和 API 金鑰，啟用收據自動辨識功能
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

        {/* 設定表單 */}
        <form onSubmit={handleSubmit} className="bg-surface dark:bg-dark-surface rounded-lg shadow-md p-6 space-y-6">
          {/* AI 提供商 */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              AI 提供商 <span className="text-danger-500">*</span>
            </label>
            <select
              value={formData.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary transition-theme"
              required
            >
              <option value="">請選擇提供商</option>
              <option value="openai">OpenAI (GPT-4)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="google">Google (Gemini)</option>
            </select>
            <p className="text-xs text-text-subtle dark:text-dark-text-subtle mt-1">
              選擇您要使用的 AI 服務提供商
            </p>
          </div>

          {/* 模型選擇 */}
          {formData.provider && (
            <div>
              <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
                模型 <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary transition-theme"
                required
              >
                {modelOptions[formData.provider]?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-subtle dark:text-dark-text-subtle mt-1">
                選擇要使用的 AI 模型版本
              </p>
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-dark-text-main mb-2">
              API 金鑰 <span className="text-danger-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder={apiKeyConfigured ? '已設定（輸入新金鑰以更新）' : '請輸入 API 金鑰'}
                className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-dark-primary transition-theme"
                required={!apiKeyConfigured}
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-subtle dark:text-dark-text-subtle hover:text-primary dark:hover:text-dark-primary transition-theme"
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-text-subtle dark:text-dark-text-subtle mt-1">
              {formData.provider === 'openai' && '從 OpenAI Platform (platform.openai.com) 取得 API 金鑰'}
              {formData.provider === 'anthropic' && '從 Anthropic Console (console.anthropic.com) 取得 API 金鑰'}
              {formData.provider === 'google' && '從 Google AI Studio (makersuite.google.com) 取得 API 金鑰'}
              {!formData.provider && '請先選擇 AI 提供商'}
            </p>
            {apiKeyConfigured && (
              <p className="text-xs text-success-600 dark:text-success-400 mt-1 flex items-center gap-1">
                <CheckCircle size={14} />
                API 金鑰已設定
              </p>
            )}
          </div>

          {/* 儲存按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t border-graphite-200 dark:border-graphite-600">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-primary dark:bg-dark-primary hover:bg-primary/90 dark:hover:bg-dark-primary/90 text-white px-6 py-2 rounded-lg transition-theme flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  儲存中...
                </>
              ) : (
                <>
                  <Save size={16} />
                  儲存設定
                </>
              )}
            </button>
          </div>
        </form>

        {/* 說明資訊 */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">重要提示</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside">
            <li>API 金鑰將安全地儲存在 Firebase 中（建議在生產環境中加密）</li>
            <li>所有已驗證的使用者都可以使用 AI 辨識功能</li>
            <li>確保您的 API 金鑰有足夠的額度以支援圖片辨識</li>
            <li>不同提供商的價格和辨識準確度可能有所不同</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AISettingsPage;
