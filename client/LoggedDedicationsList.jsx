import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from './firebaseConfig';
import { Pencil, Trash2 } from 'lucide-react';
import ToastNotification from './ToastNotification';
import EditDedicationModal from './EditDedicationModal';

const LoggedDedicationsList = ({ taskId, isTaskCompleted }) => {
  const [dedications, setDedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDedication, setEditingDedication] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toastState, setToastState] = useState({ isVisible: false, message: '', type: 'success' });

  useEffect(() => {
    setLoading(true);
    const dedicationsCollectionRef = collection(firestore, 'tithe', taskId, 'dedications');
    const q = query(dedicationsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const dedicationsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDedications(dedicationsData);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error listening to dedications:", err);
      setError("無法即時載入奉獻記錄。");
      setLoading(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [taskId]);

  const handleEditClick = (dedication) => {
    setEditingDedication(dedication);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (dedicationId, updatedData) => {
    try {
      const docRef = doc(firestore, 'tithe', taskId, 'dedications', dedicationId);
      await updateDoc(docRef, updatedData);
      setToastState({
        isVisible: true,
        message: `成功更新奉獻記錄：${updatedData.dedicatorId} / $${updatedData.amount.toLocaleString()}`,
        type: 'success'
      });
    } catch (err) {
      console.error("Error updating dedication:", err);
      throw err; // throw to modal for handling
    }
  };

  const handleDeleteClick = async (dedication) => {
    if (window.confirm(`確定要刪除這筆來自「${dedication.dedicatorId}」金額為 ${dedication.amount} 的記錄嗎？此操作無法還原。`)) {
      try {
        const docRef = doc(firestore, 'tithe', taskId, 'dedications', dedication.id);
        await deleteDoc(docRef);
        setToastState({
          isVisible: true,
          message: '已成功刪除該筆記錄。',
          type: 'success'
        });
      } catch (err) {
        console.error("Error deleting dedication:", err);
        setToastState({
          isVisible: true,
          message: '刪除失敗，請檢查網路或稍後再試。',
          type: 'error'
        });
      }
    }
  };

  if (loading) {
    return <p className="text-center text-graphite-500 dark:text-dark-text-subtle transition-theme">正在載入奉獻記錄...</p>;
  }

  if (error) {
    return <p className="text-center text-danger-500 transition-theme">{error}</p>;
  }

  return (
    <>
      <ToastNotification 
        isVisible={toastState.isVisible}
        message={toastState.message}
        type={toastState.type}
        onClose={() => setToastState(prev => ({ ...prev, isVisible: false }))}
      />
      <div className="overflow-x-auto dark:bg-dark-surface transition-theme">
        <table className="min-w-full bg-white dark:bg-dark-surface transition-theme">
          <thead className="bg-graphite-200 dark:bg-graphite-800 transition-theme">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻日期</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻者代號</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻科目</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">金額</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">方式</th>
              {!isTaskCompleted && (
                <th className="py-3 px-4 text-center text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface transition-theme">
            {dedications.length > 0 ? (
              dedications.map(item => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-graphite-600 hover:bg-graphite-50 dark:hover:bg-graphite-700 transition-theme">
                  <td className="py-3 px-4 dark:text-dark-text-main transition-theme">{item.dedicationDate}</td>
                  <td className="py-3 px-4 dark:text-dark-text-main transition-theme">{item.dedicatorId}</td>
                  <td className="py-3 px-4 dark:text-dark-text-main transition-theme">{item.dedicationCategory}</td>
                  <td className="py-3 px-4 text-right dark:text-dark-text-main transition-theme">{item.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 dark:text-dark-text-main transition-theme">{item.method === 'cash' ? '現金' : '支票'}</td>
                  {!isTaskCompleted && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center items-center gap-3">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="text-graphite-500 hover:text-primary dark:text-dark-text-subtle dark:hover:text-dark-primary transition-theme"
                          title="編輯"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item)}
                          className="text-graphite-500 hover:text-danger-500 dark:text-dark-text-subtle dark:hover:text-danger-dark transition-theme"
                          title="刪除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isTaskCompleted ? "5" : "6"} className="py-6 px-4 text-center text-graphite-500 dark:text-dark-text-subtle transition-theme">
                  尚未新增任何奉獻記錄。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <EditDedicationModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        dedication={editingDedication}
        onSave={handleSaveEdit}
      />
    </>
  );
};

export default LoggedDedicationsList;
