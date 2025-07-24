import React, { useState, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import LoginModal from './LoginModal.jsx';
import ProfileMenu from './ProfileMenu.jsx'; 
import { useAuth } from './AuthContext.jsx';
import { LogIn, LayoutDashboard, HandCoins } from 'lucide-react';
import './App.css';

const PurchaseRequestBoard = React.lazy(() => import('./PurchaseRequestBoard.jsx'));
const TithingTaskList = React.lazy(() => import('./TithingTaskList.jsx'));
const TithingTaskDetail = React.lazy(() => import('./TithingTaskDetail.jsx'));

const LoadingFallback = () => (
  <div className="text-center py-20">
    <p className="text-xl text-graphite-500">正在載入頁面...</p>
  </div>
);

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        isActive
          ? 'bg-glory-red-500 text-white'
          : 'text-graphite-700 hover:bg-glory-red-50 hover:text-glory-red-700'
      }`}
    >
      {children}
    </Link>
  );
};

function App() {
  const { currentUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
     <div className="bg-cloud-white min-h-screen p-1 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* --- 核心修改區域 --- */}
        <header className="flex items-center gap-4 mb-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-glory-red-700">BQ GRACE CHURCH</h1>
          
          <div className="ml-auto">
            {currentUser ? (
              <ProfileMenu />
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-glory-red-500 hover:bg-glory-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <LogIn size={18} />
                登入
              </button>
            )}
          </div>
        </header>

        {/* 不再需要 <UserProfile /> 元件 */}

        {currentUser && (
          <nav className="bg-white shadow-md rounded-lg p-2 mb-3 flex items-center gap-2">
            <NavLink to="/purchase">
              <LayoutDashboard size={18} />
              採購看板
            </NavLink>
            <NavLink to="/tithing">
              <HandCoins size={18} />
              奉獻計算
            </NavLink>
          </nav>
        )}


        <main>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/purchase" element={<PurchaseRequestBoard />} />
              <Route path="/tithing" element={<TithingTaskList />} />
              <Route path="/tithing/:taskId" element={<TithingTaskDetail />} />
              <Route path="/" element={<Navigate to="/purchase" replace />} />
            </Routes>
          </Suspense>
        </main>

        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;
