import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const DEDICATION_CATEGORIES = [
  "十一", "感恩", "主日", "宣教", "特別", 
  "專案", "裝潢", "指定", "慈惠", "植堂"
];

const EditDedicationModal = ({ isOpen, onClose, dedication, onSave }) => {
  const [dedicationDate, setDedicationDate] = useState('');
  const [dedicatorId, setDedicatorId] = useState('');
  const [dedicationCategory, setDedicationCategory] = useState(DEDICATION_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (dedication && isOpen) {
      setDedicationDate(dedication.dedicationDate || new Date().toISOString().split('T')[0]);
      setDedicatorId(dedication.dedicatorId || '');
      setDedicationCategory(dedication.dedicationCategory || DEDICATION_CATEGORIES[0]);
      setAmount(dedication.amount || '');
      setMethod(dedication.method || 'cash');
      setError('');
    }
  }, [dedication, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dedicatorId || !amount) {
      setError("請填寫奉獻者代號和金額。");
      return;
    }
    
    setError('');
    setIsSubmitting(true);

    const updatedData = {
      dedicationDate,
      dedicatorId,
      dedicationCategory,
      amount: Number(amount),
      method,
    };

    try {
      await onSave(dedication.id, updatedData);
      onClose();
    } catch (err) {
      console.error("Error updating dedication:", err);
      setError("更新失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-lg shadow-xl w-full max-w-2xl transition-theme relative max-h-[90vh] overflow-y-auto">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-graphite-500 hover:text-graphite-700 dark:text-dark-text-subtle dark:hover:text-dark-text-main transition-theme"
        >
          <X size={24} />
        </button>
        
        <h3 className="text-xl font-bold mb-6 text-text-main dark:text-dark-text-main transition-theme">編輯奉獻記錄</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label htmlFor="edit-date" className="text-sm font-medium text-graphite-500 dark:text-dark-text-main mb-1 transition-theme">奉獻日期</label>
              <input
                id="edit-date"
                type="date"
                value={dedicationDate}
                onChange={(e) => setDedicationDate(e.target.value)}
                className="p-2 border border-gray-300 dark:border-graphite-600 rounded-md shadow-sm focus:ring-glory-red-500 dark:focus:ring-glory-red-400 dark:bg-graphite-700 dark:text-dark-text-main transition-theme"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="edit-id" className="text-sm font-medium text-graphite-500 dark:text-dark-text-main mb-1 transition-theme">奉獻者代號</label>
              <input
                id="edit-id"
                type="text"
                value={dedicatorId}
                onChange={(e) => setDedicatorId(e.target.value)}
                className="p-2 border border-gray-300 dark:border-graphite-600 rounded-md shadow-sm focus:ring-glory-red-500 dark:focus:ring-glory-red-400 dark:bg-graphite-700 dark:text-dark-text-main transition-theme"
                required
              />
            </div>

            <div className="flex flex-col">
              <label htmlFor="edit-category" className="text-sm font-medium text-graphite-500 dark:text-dark-text-main mb-1 transition-theme">奉獻科目</label>
              <select
                id="edit-category"
                value={dedicationCategory}
                onChange={(e) => setDedicationCategory(e.target.value)}
                className="p-2 border border-gray-300 dark:border-graphite-600 rounded-md shadow-sm focus:ring-glory-red-500 dark:focus:ring-glory-red-400 dark:bg-graphite-700 dark:text-dark-text-main transition-theme"
              >
                {DEDICATION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label htmlFor="edit-amount" className="text-sm font-medium text-graphite-500 dark:text-dark-text-main mb-1 transition-theme">奉獻數額</label>
              <input
                id="edit-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="p-2 border border-gray-300 dark:border-graphite-600 rounded-md shadow-sm focus:ring-glory-red-500 dark:focus:ring-glory-red-400 dark:bg-graphite-700 dark:text-dark-text-main transition-theme"
                required
              />
            </div>

            <div className="flex flex-col justify-center md:col-span-2">
               <label className="text-sm font-medium text-graphite-500 dark:text-dark-text-main mb-1 transition-theme">奉獻方式</label>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center">
                  <input type="radio" name="edit-method" value="cash" checked={method === 'cash'} onChange={() => setMethod('cash')} className="focus:ring-glory-red-500 h-4 w-4 text-glory-red-600 transition-theme"/>
                  <span className="ml-2 text-sm text-graphite-700 dark:text-dark-text-main transition-theme">現金</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="edit-method" value="cheque" checked={method === 'cheque'} onChange={() => setMethod('cheque')} className="focus:ring-glory-red-500 h-4 w-4 text-glory-red-600 transition-theme"/>
                  <span className="ml-2 text-sm text-graphite-700 dark:text-dark-text-main transition-theme">支票</span>
                </label>
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm text-danger-500 transition-theme">{error}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-graphite-200 dark:bg-graphite-700 text-graphite-800 dark:text-dark-text-main rounded-lg hover:bg-graphite-300 dark:hover:bg-graphite-600 transition-theme"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary dark:bg-dark-primary text-white rounded-lg hover:bg-primary/90 dark:hover:bg-dark-primary/90 transition-theme disabled:bg-graphite-400 dark:disabled:bg-graphite-600"
            >
              <Save size={18} />
              {isSubmitting ? '儲存中...' : '儲存修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDedicationModal;
