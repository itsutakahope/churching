import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import axios from 'axios';

// Modal Component
const SelectFinanceStaffModal = ({ isOpen, onClose, staffList, onConfirm, loading }) => {
  const [selectedStaff, setSelectedStaff] = useState('');

  useEffect(() => {
    // 當列表載入後，預設選中第一個
    if (staffList.length > 0) {
      setSelectedStaff(staffList[0].uid);
    }
  }, [staffList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">選擇財務同工</h3>
        {loading ? (
          <p>載入同工名單中...</p>
        ) : (
          <>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full p-2 border rounded-md mb-6"
            >
              {staffList.length > 0 ? (
                staffList.map(staff => (
                  <option key={staff.uid} value={staff.uid}>
                    {staff.displayName}
                  </option>
                ))
              ) : (
                <option disabled>沒有可用的財務同工</option>
              )}
            </select>
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-graphite-300 text-graphite-900 rounded-md hover:bg-graphite-400 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => onConfirm(selectedStaff)}
                disabled={!selectedStaff}
                className="px-4 py-2 bg-glory-red-500 text-white rounded-md hover:bg-glory-red-600 disabled:bg-graphite-300 disabled:text-graphite-500 transition-colors"
              >
                確認新增
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


const TithingTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // New states for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [financeStaffList, setFinanceStaffList] = useState([]);
  const [isStaffListLoading, setIsStaffListLoading] = useState(false);


  const fetchTasks = async () => {
    if (!currentUser) {
      setLoading(false);
      setTasks([]);
      return;
    }
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/tithe-tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (Array.isArray(response.data)) {
        setTasks(response.data);
      } else {
        setTasks([]);
        console.error("API response is not an array:", response.data);
        setError("資料格式不正確。");
      }
      
    } catch (err) {
      console.error("Error fetching tithing tasks:", err);
      // --- ▼▼▼ 核心修改開始 ▼▼▼ ---
      if (err.response) {
        // 伺服器有回應，但狀態碼不是 2xx
        if (err.response.status === 403) {
          const errorCode = err.response.data?.code; // 使用 optional chaining 增加安全性
          switch (errorCode) {
            case 'ACCOUNT_NOT_APPROVED':
              setError("權限不足：您的帳號正在等待管理員審核，請聯繫管理員。");
              break;
            case 'INSUFFICIENT_PERMISSIONS': // 注意：後端代碼是 INSUFFICIENT_PERMISSIONS
              setError("權限不足：您需要財務同工或司庫權限才能查看此頁面。");
              break;
            default:
              setError("權限不足，無法載入奉獻計算任務。");
              break;
          }
        } else {
          // 處理其他伺服器錯誤，如 404, 500
          setError(`伺服器發生錯誤 (代碼: ${err.response.status})，請稍後再試。`);
        }
      } else if (err.request) {
        // 請求已發出，但沒有收到回應 (例如網路問題)
        setError("無法連線至伺服器，請檢查您的網路連線。");
      } else {
        // 其他錯誤 (例如設定請求時發生錯誤)
        setError("發生預期外的錯誤，請稍後再試。");
      }
      // --- ▲▲▲ 核心修改結束 ▲▲▲ ---
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [currentUser]);

  const handleAddNewTask = async () => {
    if (!currentUser) {
      alert("請先登入。");
      return;
    }
    
    setIsModalOpen(true);
    setIsStaffListLoading(true);

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/finance-staff', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setFinanceStaffList(response.data);
    } catch (err) {
      console.error("Error fetching finance staff:", err);
      setError("無法載入財務同工名單，請重試。");
      setIsModalOpen(false); // 發生錯誤時關閉 modal
      // --- ▼▼▼ 核心修改開始 ▼▼▼ ---
      if (err.response) {
        // 伺服器有回應，但狀態碼不是 2xx
        if (err.response.status === 403) {
          const errorCode = err.response.data?.code;
          switch (errorCode) {
            case 'ACCOUNT_NOT_APPROVED':
              setError("權限不足：您的帳號正在等待管理員審核，無法執行此操作。");
              break;
            case 'INSUFFICIENT_PERMISSIONS':
              setError("權限不足：您需要財務同工或司庫權限才能新增任務。");
              break;
            default:
              setError("權限不足，無法載入財務同工名單。");
              break;
          }
        } else {
          // 處理其他伺服器錯誤
          setError(`伺服器錯誤 (代碼: ${err.response.status})：無法載入財務同工名單。`);
        }
      } else if (err.request) {
        // 請求已發出，但沒有收到回應
        setError("無法連線至伺服器，請檢查您的網路連線。");
      } else {
        // 其他錯誤
        setError("發生預期外的錯誤，請稍後再試。");
      }
      // --- ▲▲▲ 核心修改結束 ▲▲▲ ---
    } finally {
      setIsStaffListLoading(false);
    }
  };

  const handleConfirmAddTask = async (financeStaffUid) => {
    if (!financeStaffUid) {
        alert("請選擇一位財務同工。");
        return;
    }

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.post('/api/tithe-tasks', 
        { financeStaffUid: financeStaffUid }, // 將選擇的 UID 放在 body 中
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const newTask = response.data;
      setIsModalOpen(false);
      navigate(`/tithing/${newTask.id}`);
      
    } catch (err) {
      console.error("Error creating new task:", err);
      setError("建立新任務失敗，請重試。");
      setIsModalOpen(false);
      if (err.response) {
        // 伺服器有回應，但狀態碼不是 2xx
        if (err.response.status === 403) {
          const errorCode = err.response.data?.code;
          switch (errorCode) {
            case 'ACCOUNT_NOT_APPROVED':
              setError("權限不足：您的帳號正在等待管理員審核，無法建立新任務。");
              break;
            case 'INSUFFICIENT_PERMISSIONS':
              setError("權限不足：您需要財務同工或司庫權限才能建立新任務。");
              break;
            default:
              setError("權限不足，無法建立新任務。");
              break;
          }
        } else {
          // 處理其他伺服器錯誤
          setError(`伺服器錯誤 (代碼: ${err.response.status})：建立新任務失敗。`);
        }
      } else if (err.request) {
        // 請求已發出，但沒有收到回應
        setError("無法連線至伺服器，請檢查您的網路連線。");
      } else {
        // 其他錯誤
        setError("建立新任務時發生預期外的錯誤，請稍後再試。");
      }
      // --- ▲▲▲ 核心修改結束 ▲▲▲ ---
    }
  };


  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <SelectFinanceStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        staffList={financeStaffList}
        onConfirm={handleConfirmAddTask}
        loading={isStaffListLoading}
      />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-graphite-900">任務列表</h2>
        <button
          onClick={handleAddNewTask}
          className="bg-glory-red-500 hover:bg-glory-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <PlusCircle size={20} />
          新增任務
        </button>
      </div>

      {loading && <p className="text-center text-graphite-500">載入中...</p>}
      {error && <p className="text-center text-danger-500">{error}</p>}
      
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-graphite-200">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500">計算日期</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500">司庫</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500">財務同工</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500">狀態</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-graphite-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <tr key={task.id} className="border-b hover:bg-graphite-50">
                    <td className="py-3 px-4">
                    {task.calculationTimestamp && new Date(task.calculationTimestamp).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">{task.treasurerName || task.treasurerEmail || 'N/A'}</td>
                    <td className="py-3 px-4">{task.financeStaffName || task.financeStaffEmail || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        task.status === 'completed' 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-holy-gold-100 text-holy-gold-800'
                      }`}>
                        {task.status === 'completed' ? '已完成' : '進行中'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        to={`/tithing/${task.id}`}
                        className="text-glory-red-600 hover:underline"
                      >
                        查看詳情
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-6 px-4 text-center text-graphite-500">
                    目前沒有任何計算任務。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TithingTaskList;