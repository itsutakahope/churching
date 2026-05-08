import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  BarChart3,
  FileText,
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Mail,
  Calendar,
  DollarSign,
  ShoppingCart,
  HandCoins,
  AlertCircle
} from 'lucide-react';
import ToastNotification from './ToastNotification.jsx';

const AdminSettings = () => {
  const { currentUser, userRoles } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // 檢查是否為管理員
  useEffect(() => {
    if (!currentUser || !userRoles.includes('admin')) {
      setToast({
        show: true,
        message: '您沒有權限訪問此頁面',
        type: 'error'
      });
      setTimeout(() => navigate('/purchase'), 2000);
    }
  }, [currentUser, userRoles, navigate]);

  // 使用者管理狀態
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // 顯示 Toast 通知
  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type });
  };

  // 關閉 Toast
  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  // 獲取所有使用者
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.data?.code === 'INSUFFICIENT_PERMISSIONS') {
        showToast('權限不足，無法訪問使用者列表', 'error');
      } else {
        showToast('獲取使用者列表失敗', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // 獲取統計數據
  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get('/api/admin/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      showToast('獲取統計數據失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 審核使用者
  const handleApproveUser = async (uid, status) => {
    try {
      const token = await currentUser.getIdToken();
      await axios.put(`/api/admin/users/${uid}/approve`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(`使用者已${status === 'approved' ? '批准' : '拒絕'}`, 'success');
      fetchUsers(); // 重新獲取使用者列表
    } catch (error) {
      console.error('Error approving user:', error);
      showToast('更新使用者狀態失敗', 'error');
    }
  };

  // 修改使用者角色
  const handleUpdateRoles = async (uid, roles) => {
    try {
      const token = await currentUser.getIdToken();
      await axios.put(`/api/admin/users/${uid}/roles`,
        { roles },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('使用者角色已更新', 'success');
      fetchUsers(); // 重新獲取使用者列表
    } catch (error) {
      console.error('Error updating roles:', error);
      showToast('更新使用者角色失敗', 'error');
    }
  };

  // 當切換 Tab 時載入數據
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'statistics') {
      fetchStatistics();
    }
  }, [activeTab]);

  // Tab 配置
  const tabs = [
    { id: 'users', label: '使用者管理', icon: Users },
    { id: 'statistics', label: '數據統計', icon: BarChart3 },
    { id: 'categories', label: '會計類別', icon: FileText },
    { id: 'logs', label: '系統日誌', icon: SettingsIcon },
  ];

  return (
    <div className="bg-cloud-white dark:bg-dark-background min-h-screen transition-theme">
      <div className="max-w-7xl mx-auto p-6">
        {/* 頁面標題 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-glory-red-700 dark:text-dark-primary transition-theme flex items-center gap-3">
            <Shield size={32} />
            系統管理後台
          </h1>
          <p className="text-graphite-600 dark:text-dark-text-subtle mt-2">管理系統使用者、查看統計數據和系統設定</p>
        </div>

        {/* Tab 導航 */}
        <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg mb-6 transition-theme">
          <div className="flex border-b border-graphite-200 dark:border-graphite-700">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-theme ${
                    activeTab === tab.id
                      ? 'border-b-2 border-glory-red-500 text-glory-red-600 dark:text-dark-primary bg-glory-red-50 dark:bg-dark-primary/10'
                      : 'text-graphite-600 dark:text-dark-text-subtle hover:text-glory-red-500 dark:hover:text-dark-primary hover:bg-graphite-50 dark:hover:bg-graphite-700'
                  }`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab 內容 */}
        <div className="bg-white dark:bg-dark-surface shadow-md rounded-lg p-6 transition-theme">
          {activeTab === 'users' && <UserManagement users={users} loading={loading} onApprove={handleApproveUser} onUpdateRoles={handleUpdateRoles} />}
          {activeTab === 'statistics' && <StatisticsView statistics={statistics} loading={loading} />}
          {activeTab === 'categories' && <CategoriesManagement />}
          {activeTab === 'logs' && <SystemLogs />}
        </div>
      </div>

      {/* Toast 通知 */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

// --- ▼▼▼ 使用者管理組件 ▼▼▼ ---
const UserManagement = ({ users, loading, onApprove, onUpdateRoles }) => {
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);

  const getStatusBadge = (status) => {
    const badges = {
      approved: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: '已批准' },
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', label: '待審核' },
      rejected: { icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: '已拒絕' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon size={16} />
        {badge.label}
      </span>
    );
  };

  const handleEditRoles = (user) => {
    setEditingUser(user);
    setSelectedRoles(user.roles || ['user']);
  };

  const handleSaveRoles = () => {
    if (editingUser) {
      onUpdateRoles(editingUser.uid, selectedRoles);
      setEditingUser(null);
    }
  };

  const toggleRole = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-graphite-500 dark:text-dark-text-subtle">載入中...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-graphite-800 dark:text-dark-text-main mb-4">使用者列表</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-graphite-50 dark:bg-graphite-700 border-b border-graphite-200 dark:border-graphite-600">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">顯示名稱</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">電子郵件</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">狀態</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">角色</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">註冊時間</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-graphite-700 dark:text-dark-text-main">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid} className="border-b border-graphite-100 dark:border-graphite-700 hover:bg-graphite-50 dark:hover:bg-graphite-700/50 transition-theme">
                <td className="px-4 py-3 text-sm text-graphite-800 dark:text-dark-text-main">{user.displayName}</td>
                <td className="px-4 py-3 text-sm text-graphite-600 dark:text-dark-text-subtle flex items-center gap-2">
                  <Mail size={14} />
                  {user.email}
                </td>
                <td className="px-4 py-3">{getStatusBadge(user.status)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map(role => (
                      <span key={role} className="px-2 py-1 bg-glory-red-100 dark:bg-glory-red-900/30 text-glory-red-700 dark:text-glory-red-400 text-xs rounded">
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-graphite-600 dark:text-dark-text-subtle">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(user.createdAt).toLocaleDateString('zh-TW')}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {user.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(user.uid, 'approved')}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-theme"
                        >
                          批准
                        </button>
                        <button
                          onClick={() => onApprove(user.uid, 'rejected')}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-theme"
                        >
                          拒絕
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleEditRoles(user)}
                      className="px-3 py-1 bg-glory-red-500 hover:bg-glory-red-600 text-white text-sm rounded transition-theme"
                    >
                      編輯角色
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 編輯角色 Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg shadow-xl p-6 w-full max-w-md transition-theme">
            <h3 className="text-xl font-bold text-graphite-800 dark:text-dark-text-main mb-4">
              編輯使用者角色 - {editingUser.displayName}
            </h3>
            <div className="space-y-3 mb-6">
              {['user', 'admin', 'finance_staff', 'treasurer', 'reimbursementContact'].map(role => (
                <label key={role} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="w-5 h-5 text-glory-red-500 rounded focus:ring-glory-red-500"
                  />
                  <span className="text-graphite-700 dark:text-dark-text-main">{role}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSaveRoles}
                className="flex-1 px-4 py-2 bg-glory-red-500 hover:bg-glory-red-600 text-white rounded-lg transition-theme"
              >
                儲存
              </button>
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-graphite-300 hover:bg-graphite-400 text-graphite-800 rounded-lg transition-theme"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ▼▼▼ 統計數據組件 ▼▼▼ ---
const StatisticsView = ({ statistics, loading }) => {
  if (loading) {
    return <div className="text-center py-8 text-graphite-500 dark:text-dark-text-subtle">載入中...</div>;
  }

  if (!statistics) {
    return <div className="text-center py-8 text-graphite-500 dark:text-dark-text-subtle">暫無統計數據</div>;
  }

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-gradient-to-br from-white to-graphite-50 dark:from-dark-surface dark:to-graphite-800 rounded-lg shadow-md p-6 border border-graphite-200 dark:border-graphite-700 transition-theme">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-graphite-700 dark:text-dark-text-main">{title}</h3>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-graphite-900 dark:text-dark-text-main">{value}</p>
      {subtext && <p className="text-sm text-graphite-600 dark:text-dark-text-subtle mt-2">{subtext}</p>}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold text-graphite-800 dark:text-dark-text-main mb-6">系統統計數據</h2>

      {/* 使用者統計 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-graphite-700 dark:text-dark-text-main mb-4 flex items-center gap-2">
          <Users size={24} />
          使用者統計
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="總使用者" value={statistics.users.total} icon={Users} color="bg-blue-500" />
          <StatCard title="已批准" value={statistics.users.approved} icon={CheckCircle} color="bg-green-500" />
          <StatCard title="待審核" value={statistics.users.pending} icon={Clock} color="bg-yellow-500" />
          <StatCard title="已拒絕" value={statistics.users.rejected} icon={XCircle} color="bg-red-500" />
        </div>
      </div>

      {/* 採購需求統計 */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-graphite-700 dark:text-dark-text-main mb-4 flex items-center gap-2">
          <ShoppingCart size={24} />
          採購需求統計
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="總需求" value={statistics.requirements.total} icon={ShoppingCart} color="bg-purple-500" />
          <StatCard title="待購買" value={statistics.requirements.pending} icon={Clock} color="bg-yellow-500" />
          <StatCard title="已購買" value={statistics.requirements.purchased} icon={CheckCircle} color="bg-green-500" />
          <StatCard
            title="總金額"
            value={`NT$ ${statistics.requirements.totalAmount.toLocaleString()}`}
            icon={DollarSign}
            color="bg-indigo-500"
          />
        </div>
      </div>

      {/* 奉獻任務統計 */}
      <div>
        <h3 className="text-xl font-semibold text-graphite-700 dark:text-dark-text-main mb-4 flex items-center gap-2">
          <HandCoins size={24} />
          奉獻任務統計
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="總任務" value={statistics.tithe.total} icon={HandCoins} color="bg-teal-500" />
          <StatCard title="進行中" value={statistics.tithe.inProgress} icon={Clock} color="bg-yellow-500" />
          <StatCard title="已完成" value={statistics.tithe.completed} icon={CheckCircle} color="bg-green-500" />
          <StatCard
            title="總奉獻金額"
            value={`NT$ ${statistics.tithe.totalAmount.toLocaleString()}`}
            icon={DollarSign}
            color="bg-holy-gold-500"
          />
        </div>
      </div>
    </div>
  );
};

// --- ▼▼▼ 會計類別管理組件 ▼▼▼ ---
const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // 載入會計類別
    import('./acount_catagory.json').then(data => {
      setCategories(data.default);
    });
  }, []);

  const renderCategory = (category, level = 0) => {
    return (
      <div key={category.code} className="mb-2">
        <div
          className="flex items-center gap-3 p-3 bg-graphite-50 dark:bg-graphite-700 rounded-lg hover:bg-graphite-100 dark:hover:bg-graphite-600 transition-theme"
          style={{ marginLeft: `${level * 20}px` }}
        >
          <span className="font-mono text-sm text-glory-red-600 dark:text-glory-red-400 font-semibold">{category.code}</span>
          <span className="text-graphite-800 dark:text-dark-text-main">{category.name}</span>
        </div>
        {category.children && category.children.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-graphite-800 dark:text-dark-text-main mb-4">會計類別管理</h2>
      <div className="bg-white dark:bg-dark-background rounded-lg p-4">
        {categories.map(category => renderCategory(category))}
      </div>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">會計類別資訊</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              會計類別儲存於 <code className="bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded">acount_catagory.json</code> 檔案中。
              如需修改，請直接編輯該檔案。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- ▼▼▼ 系統日誌組件 ▼▼▼ ---
const SystemLogs = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-graphite-800 dark:text-dark-text-main mb-4">系統活動日誌</h2>
      <div className="p-8 text-center bg-graphite-50 dark:bg-graphite-700 rounded-lg">
        <AlertCircle size={48} className="mx-auto text-graphite-400 dark:text-dark-text-subtle mb-3" />
        <p className="text-graphite-600 dark:text-dark-text-subtle">系統日誌功能開發中...</p>
        <p className="text-sm text-graphite-500 dark:text-dark-text-subtle mt-2">
          未來將顯示使用者登入、資料變更等系統活動記錄
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
