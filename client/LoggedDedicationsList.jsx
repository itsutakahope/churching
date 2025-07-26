import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from './firebaseConfig';

const LoggedDedicationsList = ({ taskId }) => {
  const [dedications, setDedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return <p className="text-center text-graphite-500 dark:text-dark-text-subtle transition-theme">正在載入奉獻記錄...</p>;
  }

  if (error) {
    return <p className="text-center text-danger-500 transition-theme">{error}</p>;
  }

  return (
    <div className="overflow-x-auto dark:bg-dark-surface transition-theme">
      <table className="min-w-full bg-white dark:bg-dark-surface transition-theme">
        <thead className="bg-graphite-200 dark:bg-graphite-800 transition-theme">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻日期</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻者代號</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">奉獻科目</th>
            <th className="py-3 px-4 text-right text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">金額</th>
            <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500 dark:text-dark-text-main transition-theme">方式</th>
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="py-6 px-4 text-center text-graphite-500 dark:text-dark-text-subtle transition-theme">
                尚未新增任何奉獻記錄。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LoggedDedicationsList;
