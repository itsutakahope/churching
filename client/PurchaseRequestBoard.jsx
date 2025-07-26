import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, MessageCircle, Edit, Trash2, X, Send, Calendar, User, RotateCcw, Receipt, DollarSign, Tag, Download, Loader2, CheckSquare, AlertTriangle, LayoutGrid, List, UserCheck, ArrowRightLeft, Filter, ChevronDown, ChevronUp, ArrowRight, ArrowUpDown } from 'lucide-react'; // 新增 CheckSquare icon 和 ArrowRightLeft icon
import axios from 'axios';
import { useAuth } from './AuthContext';
import { collection, query, onSnapshot } from "firebase/firestore";
import { firestore } from './firebaseConfig';
import CategorySelector from './CategorySelector';
import Linkify from 'react-linkify';
import { generateVoucherPDF } from './pdfGenerator.js';
import TransferReimbursementModal from './TransferReimbursementModal.jsx';
import ToastNotification from './ToastNotification.jsx';

// Simple Spinner Icon Component
const SpinnerIcon = ({ className = "" }) => <Loader2 size={16} className={`animate-spin ${className}`} />;

const PurchaseRequestBoard = () => {
  const commenterNameInputRef = useRef(null);
  const selectAllCheckboxRef = useRef(null);
  const { currentUser, isReimburser } = useAuth();

  const [requests, setRequests] = useState([]);
  const [purchaseRecords, setPurchaseRecords] = useState([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState(new Set());

  // --- 新增開始：主要採購請求的視圖切換與詳情彈窗狀態 ---
  const [viewMode, setViewMode] = useState('list'); // 'grid' 或 'list'
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState(null);
  // --- 新增結束 ---

  // --- 新增開始：購買紀錄視窗的視圖切換與詳情彈窗狀態 ---
  const [recordsViewMode, setRecordsViewMode] = useState('list'); // 'grid' 或 'list'
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState(null);
  const [shouldRestoreRecordsModal, setShouldRestoreRecordsModal] = useState(false);
  const [isFilterPanelExpanded, setIsFilterPanelExpanded] = useState(false);
  // --- 新增結束 ---

  const handleRecordSelection = (recordId) => {
    setSelectedRecordIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  // --- 新增開始：打開詳情彈窗的處理函式 ---
  const handleShowDetails = (request) => {
    setSelectedRequestForDetail(request);
    setShowDetailModal(true);
  };
  // --- 新增結束 ---

  // --- 新增開始：打開購買紀錄詳情彈窗的處理函式 ---
  const handleShowRecordDetails = (record) => {
    setSelectedRecordForDetail(record);
    setShowRecordDetailModal(true);
    // 如果購買紀錄視窗目前是開啟的，記住需要恢復它
    if (showRecordsModal) {
      setShouldRestoreRecordsModal(true);
      setShowRecordsModal(false);
    }
  };

  // --- 新增開始：關閉購買紀錄詳情彈窗的處理函式 ---
  const handleCloseRecordDetailModal = () => {
    setShowRecordDetailModal(false);
    setSelectedRecordForDetail(null);
    // 如果需要恢復購買紀錄視窗，重新顯示它
    if (shouldRestoreRecordsModal) {
      setShowRecordsModal(true);
      setShouldRestoreRecordsModal(false);
    }
  };
  // --- 新增結束 ---

  // --- 👇 新增：打開 "新增需求" 彈窗的處理函式 ---
  const handleOpenAddModal = () => {
    setSubmitError(null);
    setFormData({
      title: '',
      description: '',
      requester: currentUser?.displayName || '',
      accountingCategory: '',
      priority: 'general',
      isAlreadyPurchased: false,
      purchaseAmount: ''
    });
    // 重設報帳代理人相關狀態
    setIsDifferentReimburser(false);
    setSelectedReimburserId('');
    setShowModal(true);
  };
  // --- 新增結束 ---

  const handleBatchExport = () => {
    if (selectedRecordIds.size === 0) {
      alert("請先勾選至少一筆要匯出的購買紀錄。");
      return;
    }
    const recordsToExport = purchaseRecords.filter(r => selectedRecordIds.has(r.id));
    generateVoucherPDF(recordsToExport, currentUser);
  };

  const componentDecorator = (href, text, key) => (
    <a
      href={href}
      key={key}
      target="_blank"
      rel="noopener noreferrer"
      className="text-glory-red-600 hover:underline hover:text-glory-red-800 transition-colors duration-200"
    >
      {text}
    </a>
  );

  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isUpdatingRequest, setIsUpdatingRequest] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [isDeletingRequest, setIsDeletingRequest] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newStatusForUpdate, setNewStatusForUpdate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaserNameInput, setPurchaserNameInput] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState(''); // 1. 新增備註狀態
  const [notesCharCount, setNotesCharCount] = useState(0); // 1. 新增備註字數狀態
  const MAX_NOTES_LENGTH = 50; // 1. 新增備註最大長度
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentRequestForComment, setCurrentRequestForComment] = useState(null);
  const [filterPurchaserName, setFilterPurchaserName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filterPurchaserUid, setFilterPurchaserUid] = useState('');
  const [filterReimburserUid, setFilterReimburserUid] = useState(''); // <-- 1. 新增 state

  // 計算活躍篩選條件數量
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterPurchaserUid) count++;
    if (filterReimburserUid) count++;
    if (filterStartDate) count++;
    if (filterEndDate) count++;
    return count;
  }, [filterPurchaserUid, filterReimburserUid, filterStartDate, filterEndDate]);

  // 清除所有篩選條件
  const clearAllFilters = useCallback(() => {
    setFilterPurchaserUid('');
    setFilterReimburserUid('');
    setFilterStartDate('');
    setFilterEndDate('');
  }, []);

  // --- 👇 新增：用於確認購買彈窗的狀態 ---
  const [isDifferentReimburser, setIsDifferentReimburser] = useState(false);
  const [reimbursementContacts, setReimbursementContacts] = useState([]);
  const [selectedReimburserId, setSelectedReimburserId] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  // --- 狀態新增結束 ---

  // --- 👇 新增：轉交報帳功能的狀態 ---
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedRequestForTransfer, setSelectedRequestForTransfer] = useState(null);
  // --- 轉交狀態新增結束 ---

  // --- 👇 新增：Toast 通知狀態 ---
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [toastErrorType, setToastErrorType] = useState('');
  const [showToast, setShowToast] = useState(false);
  // --- Toast 狀態新增結束 ---


  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requester: '',
    accountingCategory: '',
    priority: 'general', // <-- 新增：緊急程度
    isAlreadyPurchased: false, // <-- 新增：是否已購買的旗標
    purchaseAmount: '',       // <-- 新增：購買金額
  });

  // --- 2. 修改此 useEffect，讓它在打開紀錄視窗時，能同時獲取兩份人員列表 ---
  useEffect(() => {
    const fetchModalData = async () => {
      if (showRecordsModal && currentUser) {
        try {
          const token = await currentUser.getIdToken();
          // 使用 Promise.all 平行發送請求，提升效率
          const [usersResponse, contactsResponse] = await Promise.all([
            axios.get('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
            axios.get('/api/users/reimbursement-contacts', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          setAllUsers(usersResponse.data);
          setReimbursementContacts(contactsResponse.data);
        } catch (error) {
          console.error('Error fetching users/contacts for records modal:', error);
          // 可以選擇性地設定一個錯誤狀態來提示使用者
        }
      }
    };
    fetchModalData();
  }, [showRecordsModal, currentUser]);


  const statusLabels = {
    'pending': { text: '待購買', shortText: '待', color: 'bg-holy-gold-100 text-holy-gold-700' },
    'purchased': { text: '已購買', shortText: '已', color: 'bg-success-100 text-success-700' }
  };


  const priorityLabels = {
    'general': { text: '一般', color: 'bg-graphite-100 text-graphite-800' },
    'urgent': { text: '緊急', color: 'bg-danger-100 text-danger-700' }
  };

  const fetchRequests = useCallback(async () => {
    setIsLoadingRequests(true);
    setFetchError(null);
    // --- 修改開始 ---

    // 1. 如果沒有登入，就不要發送請求，直接清空列表
    if (!currentUser) {
      setRequests([]);
      setPurchaseRecords([]);
      setIsLoadingRequests(false);
      return;
    }

    try {
      // 2. 獲取當前使用者的 Firebase ID Token
      const token = await currentUser.getIdToken();

      // 3. 在 axios.get 請求中加入 Authorization 標頭
      const response = await axios.get('/api/requirements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // --- 修改結束 ---

      if (Array.isArray(response.data)) {
        setRequests(response.data);
        const purchased = response.data.filter(req => req.status === 'purchased');
        setPurchaseRecords(purchased.map(p => ({
          id: p.id,
          title: p.title || p.text,
          requester: p.requesterName || p.requester,
          purchaseAmount: p.purchaseAmount,
          requestDate: p.createdAt,
          purchaseDate: p.purchaseDate,
          purchaserName: p.purchaserName,
          purchaserId: p.purchaserId, // <-- 確保 purchaserId 被正確映射
          accountingCategory: p.accountingCategory,
          // --- 👇 核心修改：新增這兩個遺漏的欄位 ---
          reimbursementerId: p.reimbursementerId,
          reimbursementerName: p.reimbursementerName,
          purchaseNotes: p.purchaseNotes, // 新增 purchaseNotes
          // --- 修改結束 ---
        })));
      } else {
        console.error('API response for /api/requirements is not an array:', response.data);
        setFetchError('無法獲取採購請求：資料格式不正確。');
        setRequests([]);
        setPurchaseRecords([]);
      }
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      // --- ▼▼▼ 核心修改開始 ▼▼▼ ---
      if (error.response) {
        // 後端有回應，優先使用後端提供的錯誤訊息
        const backendMessage = error.response.data?.message;

        // 檢查 HTTP 狀態碼
        if (error.response.status === 403) {
          const errorCode = error.response.data?.code;
          switch (errorCode) {
            case 'ACCOUNT_NOT_APPROVED':
              setFetchError("權限不足：您的帳號正在等待管理員審核，無法查看購物清單。");
              break;
            default:
              // 如果有後端訊息，就用它，否則用通用訊息
              setFetchError(backendMessage || "權限不足，無法載入採購請求。");
              break;
          }
        } else {
          // 處理其他伺服器錯誤 (如 500)
          // 同樣優先使用後端訊息
          setFetchError(backendMessage || `伺服器發生錯誤 (代碼: ${error.response.status})，請稍後再試。`);
        }
      } else if (error.request) {
        // 請求已發出，但沒有收到回應 (網路問題)
        setFetchError("無法連線至伺服器，請檢查您的網路連線。");
      } else {
        // 其他前端設定錯誤
        setFetchError("發生預期外的錯誤，請稍後再試。");
      }
      // --- ▲▲▲ 核心修改結束 ▲▲▲ ---
      setRequests([]);
      setPurchaseRecords([]);
    } finally {
      setIsLoadingRequests(false);
    }
    // 記得將 currentUser 加入依賴陣列，確保在登入/登出狀態改變時，能觸發此函式
  }, [currentUser]); // <-- 修改此處的依賴

  useEffect(() => {
    setIsLoadingRequests(true);
    const q = query(collection(firestore, "requirements"));
    const unsubscribe = onSnapshot(q,
      () => {
        console.log("Firestore listener: Detected change in requirements, re-fetching data...");
        fetchRequests();
      },
      (error) => {
        console.error("Real-time listener failed: ", error);
        setFetchError("無法建立即時連線，資料可能不會自動更新。");
        setIsLoadingRequests(false);
      }
    );
    return () => unsubscribe();
  }, [fetchRequests]);

  useEffect(() => {
    const fetchReimbursementContacts = async () => {
      if (!currentUser) return;
      setIsLoadingContacts(true);
      try {
        const token = await currentUser.getIdToken();
        const response = await axios.get('/api/users/reimbursement-contacts', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setReimbursementContacts(response.data);
      } catch (error) {
        console.error('Error fetching reimbursement contacts:', error);
        // 根據哪個彈窗開啟，來決定在哪裡顯示錯誤
        if (showPurchaseModal) setUpdateError('無法載入可報帳人員列表。');
        if (showModal) setSubmitError('無法載入可報帳人員列表。');
      } finally {
        setIsLoadingContacts(false);
      }
    };

    const shouldFetch = showPurchaseModal || (showModal && formData.isAlreadyPurchased);

    if (shouldFetch) {
      fetchReimbursementContacts();
      // 核心邏輯：根據登入者是否有報帳權限，來決定UI的預設狀態
      if (!isReimburser) {
        // 如果當前用戶沒有報帳權限，強制他必須指定代理人
        setIsDifferentReimburser(true);
      } else {
        // 只有在 "標記已購買" 彈窗開啟時，才重設為 false
        // 在 "新增" 彈窗中，由使用者手動控制
        if (showPurchaseModal) {
          setIsDifferentReimburser(false);
        }
      }
      // 清空上一次的選擇
      if (showPurchaseModal) {
        setSelectedReimburserId('');
      }
    }

    // 當在 "新增" 彈窗中取消勾選 "我已購買"，也要重設狀態
    if (showModal && !formData.isAlreadyPurchased) {
      setIsDifferentReimburser(false);
      setSelectedReimburserId('');
    }
  }, [showPurchaseModal, showModal, formData.isAlreadyPurchased, currentUser, isReimburser]);


  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert('請填寫需求標題。');
      return;
    }
    // 如果已勾選購買，則必須填寫有效的金額
    if (formData.isAlreadyPurchased && (!formData.purchaseAmount || parseFloat(formData.purchaseAmount) <= 0)) {
      alert('您已勾選「我已購買此項目」，請輸入有效的購買金額。');
      return;
    }
    // --- 👇 新增：如果需要指定代理人，則必須選擇一個 ---
    if (formData.isAlreadyPurchased && isDifferentReimburser && !selectedReimburserId) {
      alert('請選擇一位報帳請款人。');
      return;
    }
    if (!currentUser) {
      setSubmitError("您必須登入才能提交採購需求。");
      alert("您必須登入才能提交採購需求。");
      return;
    }
    setIsSubmittingRequest(true);
    setSubmitError(null);
    try {
      const token = await currentUser.getIdToken();

      // 基本的 payload
      const payload = {
        text: formData.title.trim(),
        description: formData.description.trim(),
        accountingCategory: formData.accountingCategory.trim(),
        priority: formData.priority, // <-- 新增：傳遞緊急程度
      };

      // 如果使用者已購買，則在 payload 中加入購買資訊
      if (formData.isAlreadyPurchased) {
        payload.status = 'purchased'; // 直接設定狀態
        payload.purchaseAmount = parseFloat(formData.purchaseAmount);
        payload.purchaseDate = new Date().toISOString(); // 使用當前時間作為購買日期
        payload.purchaserName = currentUser.displayName; // 自動填入當前使用者
        payload.purchaserId = currentUser.uid;

        // --- 👇 新增：如果指定了不同的報帳人，則加入 payload ---
        if (isDifferentReimburser && selectedReimburserId) {
          const selectedContact = reimbursementContacts.find(c => c.uid === selectedReimburserId);
          if (selectedContact) {
            payload.reimbursementerId = selectedContact.uid;
            payload.reimbursementerName = selectedContact.displayName;
          }
        }
      }

      // 無論是哪種情況，都發送到同一個 endpoint
      // ▼▼▼ 核心修改開始 ▼▼▼

      // 1. axios.post 現在會接收後端回傳的新資料
      const response = await axios.post('/api/requirements', payload, { headers: { 'Authorization': `Bearer ${token}` } });
      const newRequirement = response.data; // 這就是後端回傳的、格式正確的單筆新資料

      // 2. 手動更新前端狀態，將新資料加到列表最前面
      setRequests(prevRequests => [newRequirement, ...prevRequests]);

      // 如果是已購買狀態，也要同步更新 purchaseRecords
      if (newRequirement.status === 'purchased') {
        const newRecord = {
          id: newRequirement.id,
          title: newRequirement.title || newRequirement.text,
          requester: newRequirement.requesterName,
          purchaseAmount: newRequirement.purchaseAmount,
          requestDate: newRequirement.createdAt,
          purchaseDate: newRequirement.purchaseDate,
          purchaserName: newRequirement.purchaserName,
          accountingCategory: newRequirement.accountingCategory
        };
        setPurchaseRecords(prevRecords => [newRecord, ...prevRecords]);
      }

      // 3. 不再呼叫 fetchRequests()，直接處理 UI
      setFormData({ title: '', description: '', requester: currentUser?.displayName || '', accountingCategory: '', priority: 'general', isAlreadyPurchased: false, purchaseAmount: '' });
      setShowModal(false);
      // ▲▲▲ 核心修改結束 ▲▲▲

    } catch (error) {
      console.error("Error submitting request:", error);
      // 讓錯誤日誌更具體
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
      }

      // 根據錯誤類型顯示不同的錯誤訊息和 Toast 通知
      let errorMessage = '無法提交採購需求，請再試一次。';
      let errorType = 'unknown';

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '請求超時，請檢查網路連線後重試。';
        errorType = 'timeout';
      } else if (error.response) {
        const status = error.response.status;
        const backendMessage = error.response.data?.message;

        if (status === 401) {
          errorMessage = '登入已過期，請重新登入後再試。';
          errorType = 'auth';
        } else if (status === 403) {
          errorMessage = backendMessage || '權限不足，無法提交採購需求。';
          errorType = 'permission';
        } else if (status >= 500) {
          errorMessage = '伺服器暫時無法回應，請稍後再試。';
          errorType = 'server';
        } else {
          errorMessage = backendMessage || errorMessage;
          errorType = 'api';
        }
      } else if (error.request) {
        errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
        errorType = 'network';
      }

      setSubmitError(errorMessage);
      showToastNotification(errorMessage, 'error', errorType);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setSelectedRequestId(id);
    setNewStatusForUpdate(newStatus);
    if (newStatus === 'purchased') {
      setUpdateError(null);
      setPurchaseAmount('');
      setPurchaserNameInput(currentUser?.displayName || '');
      setPurchaseNotes(''); // 清空舊備註
      setNotesCharCount(0); // 重設字數
      // 清理舊狀態
      // --- 👇 核心修改：移除此處的狀態設定，將權力完全交給 useEffect ---
      // setIsDifferentReimburser(false);
      // --- 修改結束 ---
      setSelectedReimburserId('');
      setReimbursementContacts([]);
      setShowPurchaseModal(true);
    } else {
      const confirmed = window.confirm("您確定要撤銷這次的購買紀錄嗎？相關的購買金額與日期將會被清除。");
      if (confirmed) {
        if (!currentUser) {
          alert("請登入以更新狀態。");
          setUpdateError("請登入以更新狀態。");
          setSelectedRequestId(null);
          setNewStatusForUpdate(null);
          return;
        }
        setIsUpdatingRequest(true);
        setUpdateError(null);
        try {
          const token = await currentUser.getIdToken();
          const payload = {
            status: 'pending',
            purchaseAmount: null,
            purchaseDate: null,
            purchaserName: null,
            purchaserId: null,
            reimbursementerId: null, // <-- 新增：一併清除報帳人
            reimbursementerName: null, // <-- 新增：一併清除報帳人
          };
          await axios.put(`/api/requirements/${id}`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
          await fetchRequests();
        } catch (error) {
          console.error("Error reverting status:", error);
          setUpdateError(error.response?.data?.message || '無法還原狀態，請再試一次。');
        } finally {
          setIsUpdatingRequest(false);
          setSelectedRequestId(null);
          setNewStatusForUpdate(null);
        }
      } else {
        setSelectedRequestId(null);
        setNewStatusForUpdate(null);
      }
    }
  };

  const confirmPurchase = async () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) { alert('請輸入有效的購買金額'); return; }
    if (!purchaserNameInput.trim()) { alert('請輸入購買人姓名'); return; }
    // --- 👇 新增：如果需要指定代理人，則必須選擇一個 ---
    if (isDifferentReimburser && !selectedReimburserId) {
      alert('請選擇一位報帳請款人。');
      return;
    }
    if (!currentUser) { alert("請登入以確認購買。"); setUpdateError("請登入以確認購買。"); return; }
    setIsUpdatingRequest(true);
    setUpdateError(null);
    try {
      const token = await currentUser.getIdToken();
      const payload = {
        status: 'purchased',
        purchaseAmount: parseFloat(purchaseAmount),
        purchaseDate: new Date().toISOString(),
        purchaserName: purchaserNameInput.trim(),
        purchaserId: currentUser.uid,
        purchaseNotes: purchaseNotes.trim(), // 新增 purchaseNotes
      };

      // --- 👇 新增：如果指定了不同的報帳人，則加入 payload ---
      if (isDifferentReimburser && selectedReimburserId) {
        const selectedContact = reimbursementContacts.find(c => c.uid === selectedReimburserId);
        if (selectedContact) {
          payload.reimbursementerId = selectedContact.uid;
          payload.reimbursementerName = selectedContact.displayName;
        }
      }

      await axios.put(`/api/requirements/${selectedRequestId}`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      setPurchaseAmount('');
      setPurchaserNameInput('');
      setShowPurchaseModal(false);
      await fetchRequests();
    } catch (error) {
      console.error("Error confirming purchase:", error);

      let errorMessage = '無法確認購買，請再試一次。';
      let errorType = 'unknown';

      if (error.response && error.response.status === 409) {
        showToastNotification('此項目已被其他人購買，頁面將自動更新', 'warning');
        setShowPurchaseModal(false);
        await fetchRequests();
        return;
      }

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '請求超時，請檢查網路連線後重試。';
        errorType = 'timeout';
      } else if (error.response) {
        const status = error.response.status;
        const backendMessage = error.response.data?.message;

        if (status === 401) {
          errorMessage = '登入已過期，請重新登入後再試。';
          errorType = 'auth';
        } else if (status === 403) {
          errorMessage = backendMessage || '權限不足，無法確認購買。';
          errorType = 'permission';
        } else if (status >= 500) {
          errorMessage = '伺服器暫時無法回應，請稍後再試。';
          errorType = 'server';
        } else {
          errorMessage = backendMessage || errorMessage;
          errorType = 'api';
        }
      } else if (error.request) {
        errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
        errorType = 'network';
      }

      setUpdateError(errorMessage);
      showToastNotification(errorMessage, 'error', errorType);
    } finally {
      setIsUpdatingRequest(false);
    }
  };

  const deleteRequest = async (id) => {
    const confirmed = window.confirm("您確定要刪除此採購需求嗎？相關的購買記錄和留言也會一併移除。");
    if (confirmed) {
      if (!currentUser) {
        alert("請登入以刪除採購需求。");
        setUpdateError("請登入以刪除採購需求。");
        return;
      }
      setIsDeletingRequest(true);
      setSelectedRequestId(id);
      setUpdateError(null);
      try {
        const token = await currentUser.getIdToken();
        await axios.delete(`/api/requirements/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        await fetchRequests();
      } catch (error) {
        console.error("Error deleting request:", error);

        let errorMessage = '無法刪除採購需求，請再試一次。';
        let errorType = 'unknown';

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = '請求超時，請檢查網路連線後重試。';
          errorType = 'timeout';
        } else if (error.response) {
          const status = error.response.status;
          const backendMessage = error.response.data?.message;

          if (status === 401) {
            errorMessage = '登入已過期，請重新登入後再試。';
            errorType = 'auth';
          } else if (status === 403) {
            errorMessage = backendMessage || '權限不足，無法刪除此採購需求。';
            errorType = 'permission';
          } else if (status === 404) {
            errorMessage = '採購需求不存在或已被刪除。';
            errorType = 'not_found';
          } else if (status >= 500) {
            errorMessage = '伺服器暫時無法回應，請稍後再試。';
            errorType = 'server';
          } else {
            errorMessage = backendMessage || errorMessage;
            errorType = 'api';
          }
        } else if (error.request) {
          errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
          errorType = 'network';
        }

        setUpdateError(errorMessage);
        showToastNotification(errorMessage, 'error', errorType);
      } finally {
        setIsDeletingRequest(false);
        setSelectedRequestId(null);
      }
    }
  };

  const addComment = async (requestId) => {
    const trimmedComment = newComment.trim();
    if (!trimmedComment) { alert('請輸入留言內容！'); return; }
    if (!currentUser) { alert("請登入以新增留言。"); setUpdateError("請登入以新增留言。"); return; }
    setIsAddingComment(true);
    setUpdateError(null);
    try {
      const token = await currentUser.getIdToken();
      const payload = { text: trimmedComment };
      await axios.post(`/api/requirements/${requestId}/comments`, payload, { headers: { 'Authorization': `Bearer ${token}` } });
      setNewComment('');
      closeCommentModal();
      await fetchRequests();
    } catch (error) {
      console.error("Error adding comment:", error);

      let errorMessage = '無法新增留言，請再試一次。';
      let errorType = 'unknown';

      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = '請求超時，請檢查網路連線後重試。';
        errorType = 'timeout';
      } else if (error.response) {
        const status = error.response.status;
        const backendMessage = error.response.data?.message;

        if (status === 401) {
          errorMessage = '登入已過期，請重新登入後再試。';
          errorType = 'auth';
        } else if (status === 403) {
          errorMessage = backendMessage || '權限不足，無法新增留言。';
          errorType = 'permission';
        } else if (status >= 500) {
          errorMessage = '伺服器暫時無法回應，請稍後再試。';
          errorType = 'server';
        } else {
          errorMessage = backendMessage || errorMessage;
          errorType = 'api';
        }
      } else if (error.request) {
        errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
        errorType = 'network';
      }

      setUpdateError(errorMessage);
      showToastNotification(errorMessage, 'error', errorType);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (requestId, commentId) => {
    const confirmed = window.confirm("您確定要刪除此則留言嗎？");
    if (confirmed) {
      if (!currentUser) { alert("請登入以刪除留言。"); setUpdateError("請登入以刪除留言。"); return; }
      setUpdateError(null);
      try {
        const token = await currentUser.getIdToken();
        await axios.delete(`/api/requirements/${requestId}/comments/${commentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
        await fetchRequests();
      } catch (error) {
        console.error("Error deleting comment:", error);

        let errorMessage = '無法刪除留言，請再試一次。';
        let errorType = 'unknown';

        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          errorMessage = '請求超時，請檢查網路連線後重試。';
          errorType = 'timeout';
        } else if (error.response) {
          const status = error.response.status;
          const backendMessage = error.response.data?.message;

          if (status === 401) {
            errorMessage = '登入已過期，請重新登入後再試。';
            errorType = 'auth';
          } else if (status === 403) {
            errorMessage = backendMessage || '權限不足，無法刪除此留言。';
            errorType = 'permission';
          } else if (status === 404) {
            errorMessage = '留言不存在或已被刪除。';
            errorType = 'not_found';
          } else if (status >= 500) {
            errorMessage = '伺服器暫時無法回應，請稍後再試。';
            errorType = 'server';
          } else {
            errorMessage = backendMessage || errorMessage;
            errorType = 'api';
          }
        } else if (error.request) {
          errorMessage = '無法連線至伺服器，請檢查您的網路連線。';
          errorType = 'network';
        }

        setUpdateError(errorMessage);
        showToastNotification(errorMessage, 'error', errorType);
      }
    }
  };

  const openCommentModal = useCallback((request) => {
    setCurrentRequestForComment(request);
    setIsCommentModalOpen(true);
    setNewComment('');
    setCommenterName(currentUser?.displayName || '');
    setUpdateError(null);
  }, [currentUser]);

  const closeCommentModal = useCallback(() => {
    setIsCommentModalOpen(false);
    setCurrentRequestForComment(null);
    setUpdateError(null);
  }, []);

  // --- 👇 新增：轉交報帳功能的處理函式 ---
  const handleOpenTransferModal = (request) => {
    // 清除之前的錯誤狀態
    setUpdateError(null);
    setSelectedRequestForTransfer(request);
    setShowTransferModal(true);
  };

  const handleCloseTransferModal = () => {
    setShowTransferModal(false);
    setSelectedRequestForTransfer(null);
    // 清除錯誤狀態
    setUpdateError(null);
  };

  // --- 👇 新增：Toast 通知處理函式 ---
  const showToastNotification = (message, type = 'info', errorType = '') => {
    setToastMessage(message);
    setToastType(type);
    setToastErrorType(errorType);
    setShowToast(true);
  };

  const hideToastNotification = () => {
    setShowToast(false);
    setTimeout(() => {
      setToastMessage('');
      setToastType('info');
      setToastErrorType('');
    }, 300);
  };

  const handleTransferComplete = async (updatedRequirement) => {
    try {
      // 更新 requests 列表中的資料
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === updatedRequirement.id ? updatedRequirement : req
        )
      );

      // 如果是已購買狀態，也要更新 purchaseRecords
      if (updatedRequirement.status === 'purchased') {
        setPurchaseRecords(prevRecords =>
          prevRecords.map(record =>
            record.id === updatedRequirement.id
              ? {
                ...record,
                reimbursementerId: updatedRequirement.reimbursementerId,
                reimbursementerName: updatedRequirement.reimbursementerName
              }
              : record
          )
        );
      }

      // 如果詳情彈窗正在顯示同一個需求，也要更新它
      if (selectedRequestForDetail && selectedRequestForDetail.id === updatedRequirement.id) {
        setSelectedRequestForDetail(updatedRequirement);
      }

      // 顯示成功提示訊息
      showToastNotification(
        `報帳責任已成功轉交給「${updatedRequirement.reimbursementerName}」`,
        'success'
      );
    } catch (error) {
      console.error('處理轉交完成時發生錯誤:', error);
      // 顯示錯誤提示訊息
      showToastNotification(
        '更新資料時發生錯誤，正在重新載入...',
        'error',
        'unknown'
      );
      // 如果更新失敗，重新載入資料以確保一致性
      fetchRequests();
    }
  };

  // 檢查當前使用者是否為指定需求的報帳負責人
  const isCurrentUserReimburser = (request) => {
    if (!currentUser || !request) {
      console.log('isCurrentUserReimburser: 缺少 currentUser 或 request', { currentUser: !!currentUser, request: !!request });
      return false;
    }

    // 如果有明確指定的報帳負責人，檢查是否為當前使用者
    if (request.reimbursementerId) {
      const isReimburser = request.reimbursementerId === currentUser.uid;
      console.log('有指定報帳負責人:', { isReimburser });
      return isReimburser;
    }

    // 如果沒有明確指定報帳負責人，則預設為購買者負責報帳
    const isPurchaser = request.purchaserId === currentUser.uid;
    console.log('預設購買者負責報帳:', { isPurchaser });
    return isPurchaser;
  };
  // --- 轉交功能處理函式結束 ---

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        if (isCommentModalOpen) closeCommentModal();
        if (showModal) { setShowModal(false); setSubmitError(null); }
        if (showPurchaseModal) { setShowPurchaseModal(false); setUpdateError(null); setSelectedRequestId(null); }
        if (showRecordsModal) setShowRecordsModal(false);
        if (showRecordDetailModal) handleCloseRecordDetailModal();
        if (showDetailModal) setShowDetailModal(false);
        if (showTransferModal) handleCloseTransferModal();
      }
    };
    document.addEventListener('keydown', handleEscapeKey);
    if (isCommentModalOpen && commenterNameInputRef.current && !commenterName && !currentUser?.displayName) {
      commenterNameInputRef.current.focus();
    }
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [isCommentModalOpen, showModal, showPurchaseModal, showRecordsModal, showRecordDetailModal, showDetailModal, showTransferModal, closeCommentModal, commenterName, currentUser]);

  const exportPurchaseRecordsToCSV = () => {
    if (filteredPurchaseRecords.length === 0) { alert("沒有可匯出的購買記錄。"); return; }
    const escapeCSVField = (field) => `"${String(field === null || field === undefined ? '' : field).replace(/"/g, '""')}"`;
    const headers = ["項目名稱", "提出者", "購買金額", "需求日期", "購買日期", "購買人", "會計類別"];
    let csvContent = "\uFEFF" + headers.map(escapeCSVField).join(',') + '\r\n';
    filteredPurchaseRecords.forEach(record => {
      const row = [
        record.title, record.requester, record.purchaseAmount,
        record.requestDate ? new Date(record.requestDate).toLocaleDateString() : '',
        record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : '',
        record.purchaserName || "", record.accountingCategory || ""
      ];
      csvContent += row.map(escapeCSVField).join(',') + '\r\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'purchase-records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredRequests = useMemo(() => requests.filter(req => filter === 'all' || req.status === filter), [requests, filter]);

  const sortedRequests = useMemo(() => {
    const priorityValues = { 'urgent': 2, 'general': 1 };

    return [...filteredRequests].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'oldest':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'priority_desc': {
          const priorityBValue = priorityValues[b.priority] || 0;
          const priorityAValue = priorityValues[a.priority] || 0;
          if (priorityBValue !== priorityAValue) {
            return priorityBValue - priorityAValue; // 緊急優先
          }
          // 同優先級則最新的排前面
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        case 'priority_asc': {
          const priorityBValue = priorityValues[b.priority] || 0;
          const priorityAValue = priorityValues[a.priority] || 0;
          if (priorityAValue !== priorityBValue) {
            return priorityAValue - priorityBValue; // 一般優先
          }
          // 同優先級則最新的排前面
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        default:
          // 預設使用最新建立排序
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [filteredRequests, sortBy]);


  const filteredPurchaseRecords = useMemo(() => {
    // 修正日期篩選邏輯，透過將日期轉換為 UTC 時間來避免時區問題
    let sDate = null;
    if (filterStartDate) {
      try {
        // 將 YYYY-MM-DD 輸入視為 UTC 日期的開始
        const temp = new Date(filterStartDate + 'T00:00:00.000Z');
        if (!isNaN(temp.getTime())) sDate = temp;
      } catch (e) { sDate = null; }
    }

    let eDate = null;
    if (filterEndDate) {
      try {
        // 將 YYYY-MM-DD 輸入視為 UTC 日期的結束
        const temp = new Date(filterEndDate + 'T23:59:59.999Z');
        if (!isNaN(temp.getTime())) eDate = temp;
      } catch (e) { eDate = null; }
    }

    return purchaseRecords.filter(record => {
      const matchesPurchaser = filterPurchaserUid
        ? record.purchaserId === filterPurchaserUid
        : true;

      // --- 👇 核心修改：加入對請款人的篩選邏輯 ---
      const matchesReimburser = filterReimburserUid
        ? record.reimbursementerId === filterReimburserUid
        : true;

      if (!record.purchaseDate) return false;

      let rDate = null;
      try {
        rDate = new Date(record.purchaseDate);
        if (isNaN(rDate.getTime())) rDate = null;
      } catch (e) { rDate = null; }

      if (!rDate) return false;

      const matchesStartDate = sDate ? rDate >= sDate : true;
      const matchesEndDate = eDate ? rDate <= eDate : true;

      return matchesPurchaser && matchesReimburser && matchesStartDate && matchesEndDate;
    });
  }, [purchaseRecords, filterPurchaserUid, filterReimburserUid, filterStartDate, filterEndDate]);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const filteredIds = filteredPurchaseRecords.map(r => r.id);
    if (isChecked) {
      setSelectedRecordIds(prev => new Set([...prev, ...filteredIds]));
    } else {
      setSelectedRecordIds(prev => {
        const newSet = new Set(prev);
        filteredIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const { isAllSelected, isIndeterminate } = useMemo(() => {
    if (filteredPurchaseRecords.length === 0) {
      return { isAllSelected: false, isIndeterminate: false };
    }
    const filteredIds = new Set(filteredPurchaseRecords.map(r => r.id));
    const selectedInFilterCount = [...selectedRecordIds].filter(id => filteredIds.has(id)).length;

    const allSelected = selectedInFilterCount === filteredPurchaseRecords.length;
    const someSelected = selectedInFilterCount > 0 && !allSelected;

    return { isAllSelected: allSelected, isIndeterminate: someSelected };
  }, [selectedRecordIds, filteredPurchaseRecords]);

  // --- 新增開始：計算已選中項目的統計資訊 ---
  const selectedRecordsSummary = useMemo(() => {
    // 如果沒有選中任何項目，直接返回初始值
    if (selectedRecordIds.size === 0) {
      return { count: 0, totalAmount: 0 };
    }

    // 從所有購買紀錄中，篩選出 ID 存在於 selectedRecordIds 中的項目
    const selectedRecords = purchaseRecords.filter(record => selectedRecordIds.has(record.id));

    // 使用 reduce 計算總金額
    const totalAmount = selectedRecords.reduce((sum, record) => {
      return sum + (record.purchaseAmount || 0);
    }, 0);

    // 返回包含筆數和總金額的物件
    return {
      count: selectedRecords.length, // 使用篩選後陣列的長度更準確
      totalAmount: totalAmount,
    };
  }, [selectedRecordIds, purchaseRecords]); // 當勾選或購買紀錄列表變化時，重新計算
  // --- 新增結束 ---

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const generalErrorForDisplay = (updateError && !showPurchaseModal && !isCommentModalOpen) || (fetchError && requests.length > 0 && !isLoadingRequests) ? (updateError || fetchError) : null;

  return (
    <>
      <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-sm p-6 mb-6 transition-theme">
        {/* ... (Header and filter UI remains the same) ... */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-text-main dark:text-dark-text-main text-center sm:text-left transition-theme">Purchase Board</h1>
          <div className="flex gap-3 w-full sm:w-auto">
            {/* --- 修改/新增開始 --- */}
            <div className="relative flex-1 group">
              <button
                onClick={() => setShowRecordsModal(true)}
                disabled={!currentUser}
                className="w-full whitespace-nowrap bg-holy-gold-500 dark:bg-dark-accent text-success-500 dark:text-success-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-theme disabled:bg-graphite-400 dark:disabled:bg-graphite-600 disabled:cursor-not-allowed hover:bg-holy-gold-600 dark:hover:bg-dark-accent/90 focus:outline-none focus:ring-2 focus:ring-holy-gold-500 dark:focus:ring-dark-accent focus:ring-offset-2"
                title={currentUser ? "查看所有已購買的記錄" : "請先登入以查看購買記錄"}
                aria-label={currentUser ? "查看所有已購買的記錄" : "請先登入以查看購買記錄"}
              >
                <Receipt size={20} aria-hidden="true" />
                購買記錄
              </button>
              {!currentUser && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  請先登入才能使用此功能
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              )}
            </div>
            {/* --- 修改/新增結束 --- */}
            {/* --- 修改/新增開始 (主操作區按鈕) --- */}
            <div className="relative flex-1 group">
              <button
                onClick={() => {
                  setSubmitError(null);
                  setFormData({
                    title: '',
                    description: '',
                    requester: currentUser?.displayName || '',
                    accountingCategory: '',
                    priority: 'general',
                    isAlreadyPurchased: false,
                    purchaseAmount: ''
                  });
                  setShowModal(true);
                }}
                disabled={!currentUser}
                className="w-full bg-primary dark:bg-dark-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-theme disabled:bg-graphite-400 dark:disabled:bg-graphite-600 disabled:cursor-not-allowed hover:bg-primary/90 dark:hover:bg-dark-primary/90 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2"
                title={currentUser ? "新增一筆採購需求" : "請先登入以新增需求"}
                aria-label={currentUser ? "新增一筆採購需求" : "請先登入以新增需求"}
              >
                <Plus size={20} aria-hidden="true" />
                新增需求
              </button>
              {!currentUser && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1.5 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  請先登入才能使用此功能
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
                </div>
              )}
            </div>
            {/* --- 修改/新增結束 --- */}
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-text-subtle dark:text-dark-text-subtle shrink-0 transition-theme" />
            <div className="flex-grow grid grid-cols-3 gap-2" role="group" aria-labelledby="filter-label">
              {['all', 'pending', 'purchased'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-full text-sm transition-theme text-center focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2 ${filter === f ? 'bg-primary dark:bg-dark-primary text-white' : 'bg-graphite-200 dark:bg-graphite-700 text-text-subtle dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600'}`}
                  aria-pressed={filter === f}
                  aria-label={`篩選${f === 'all' ? '全部' : statusLabels[f]?.text || f}採購需求`}
                >
                  {f === 'all' ? '全部' : statusLabels[f]?.text || f}
                </button>
              ))}
            </div>
          </div>
          
          {/* --- 響應式佈局修改開始 --- */}
          <div className="flex w-full items-center justify-between gap-4 md:w-auto md:justify-start md:gap-4">
            {/* 排序下拉選單 */}
            <div className="flex flex-grow items-center gap-2 md:flex-grow-0">
              <ArrowUpDown size={20} className="text-text-subtle dark:text-dark-text-subtle shrink-0 md:hidden transition-theme" />
              <label htmlFor="sort-select" className="hidden text-text-subtle dark:text-dark-text-subtle font-medium shrink-0 md:inline transition-theme">排序：</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary transition-theme"
                aria-label="選擇採購需求排序方式"
              >
                <option value="newest">最新建立</option>
                <option value="oldest">最舊建立</option>
                <option value="priority_desc">緊急優先</option>
                <option value="priority_asc">一般優先</option>
              </select>
            </div>
            
            {/* 視圖切換器 */}
            <div className="flex items-center gap-2">
              <span className="hidden text-text-subtle dark:text-dark-text-subtle font-medium shrink-0 md:inline transition-theme" id="view-mode-label">檢視：</span>
              <div className="flex items-center rounded-lg bg-graphite-200 dark:bg-graphite-700 p-1 transition-theme" role="tablist" aria-labelledby="view-mode-label">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-theme focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2 ${viewMode === 'list' ? 'bg-surface dark:bg-dark-surface shadow text-text-main dark:text-dark-text-main' : 'text-text-subtle dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600'}`}
                  title="列表模式"
                  role="tab"
                  aria-selected={viewMode === 'list'}
                  aria-controls="requests-content"
                  aria-label="切換到列表檢視模式"
                >
                  <List size={20} aria-hidden="true" />
                  <span className="sr-only">列表模式</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-theme focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2 ${viewMode === 'grid' ? 'bg-surface dark:bg-dark-surface shadow text-text-main dark:text-dark-text-main' : 'text-text-subtle dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600'}`}
                  title="網格模式"
                  role="tab"
                  aria-selected={viewMode === 'grid'}
                  aria-controls="requests-content"
                  aria-label="切換到網格檢視模式"
                >
                  <LayoutGrid size={20} aria-hidden="true" />
                  <span className="sr-only">網格模式</span>
                </button>
              </div>
            </div>
          </div>
          {/* --- 響應式佈局修改結束 --- */}
        </div>
      </div>

      {/* ... (Error, Loading, and Empty states JSX remains the same) ... */}
      {generalErrorForDisplay && (
        <div className="bg-danger-100 dark:bg-danger-900/20 border-l-4 border-danger-500 dark:border-danger-400 text-danger-700 dark:text-danger-300 p-4 mb-4 rounded-md transition-theme" role="alert">
          <p className="font-bold">發生錯誤</p>
          <p>{generalErrorForDisplay}</p>
        </div>
      )}

      {isLoadingRequests && (
        <div className="text-center py-10">
          <SpinnerIcon className="text-primary dark:text-dark-primary h-12 w-12 mx-auto transition-theme" />
          <p className="text-xl mt-4 text-text-subtle dark:text-dark-text-subtle transition-theme">載入需求中...</p>
        </div>
      )}

      {!isLoadingRequests && fetchError && requests.length === 0 && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border-l-4 border-danger-400 dark:border-danger-500 p-6 my-6 rounded-md shadow text-center transition-theme">
          <div className="flex flex-col items-center">
            <svg className="fill-current h-16 w-16 text-danger-500 dark:text-danger-400 mb-4 transition-theme" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z" /></svg>
            <p className="text-xl font-semibold text-danger-700 dark:text-danger-300 transition-theme">錯誤：無法載入採購需求</p>
            <p className="text-md text-danger-600 dark:text-danger-400 mt-1 mb-4 transition-theme">{fetchError}</p>
            <button
              onClick={fetchRequests}
              className="px-6 py-2 bg-primary dark:bg-dark-primary text-white rounded-lg hover:bg-primary/90 dark:hover:bg-dark-primary/90 transition-theme text-sm font-medium flex items-center gap-2"
            >
              <RotateCcw size={16} />
              重新嘗試
            </button>
          </div>
        </div>
      )}

      {!isLoadingRequests && !fetchError && requests.length === 0 && (
        <div className="text-center py-10">
          <svg className="mx-auto h-16 w-16 text-text-subtle dark:text-dark-text-subtle mb-4 transition-theme" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-xl font-medium text-text-main dark:text-dark-text-main transition-theme">目前沒有任何採購需求</h3>
          <p className="mt-1 text-base text-text-subtle dark:text-dark-text-subtle transition-theme">點擊「新增需求」按鈕來建立您的第一個採購單吧！</p>
        </div>
      )}

      {/* ... (Request cards grid JSX remains the same) ... */}
      {/* --- 修改開始：根據 viewMode 條件渲染 --- */}
      {requests.length > 0 && (
        <div id="requests-content" role="tabpanel" aria-label="採購需求內容">
          {viewMode === 'grid' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="網格檢視採購需求">
              {sortedRequests.map((request) => {
                const isExpanded = !!expandedCards[request.id];
                const isLongText = request.description && request.description.length > 50;
                const isUrgent = request.priority === 'urgent';
                return (
                  <div key={request.id} className={`bg-surface dark:bg-dark-surface rounded-lg shadow-sm border overflow-hidden transition-theme ${isUrgent ? 'border-danger-400 dark:border-danger-500' : 'border-graphite-200 dark:border-graphite-600'} ${(isUpdatingRequest || isDeletingRequest) && selectedRequestId === request.id ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="p-4 pb-0 flex justify-between items-start">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusLabels[request.status]?.color || 'bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme'}`}>
                        {statusLabels[request.status]?.text || request.status}
                      </span>
                      {isUrgent && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${priorityLabels.urgent.color}`}>
                          <AlertTriangle size={14} />
                          {priorityLabels.urgent.text}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-text-main dark:text-dark-text-main mb-2 transition-theme">{request.title || request.text}</h3>
                      <p className={`text-text-subtle dark:text-dark-text-subtle text-sm mb-2 whitespace-pre-wrap break-words transition-theme ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        <Linkify componentDecorator={componentDecorator}>
                          {request.description}
                        </Linkify>
                      </p>
                      {isLongText && (
                        <button
                          onClick={() => toggleCardExpansion(request.id)}
                          className="text-sm text-glory-red-600 hover:text-glory-red-800 font-medium mb-3 transition-colors"
                        >
                          {isExpanded ? '收合內容' : '...顯示更多'}
                        </button>
                      )}
                      <div className="flex items-center gap-4 text-sm text-text-subtle dark:text-dark-text-subtle mb-4 transition-theme">
                        <div className="flex items-center gap-1"> <Calendar size={16} /> <span>{new Date(request.createdAt).toLocaleDateString()}</span> </div>
                        {request.comments?.length > 0 && (<div className="flex items-center gap-1"> <MessageCircle size={16} /> <span>{request.comments.length}</span> </div>)}
                      </div>
                      {request.requesterName && (<div className="flex items-center gap-1 text-sm text-text-subtle dark:text-dark-text-subtle mb-2 transition-theme"> <User size={16} /> <span>提出者：{request.requesterName}</span> </div>)}
                      {request.accountingCategory && (<div className="flex items-center gap-1 text-sm text-text-subtle dark:text-dark-text-subtle mb-4 transition-theme">
                        <Tag size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span>會計類別：{request.accountingCategory}</span>
                      </div>
                      )}

                      {request.status === 'purchased' && request.purchaseAmount && (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2 text-success-800">
                            <DollarSign size={16} />
                            <span className="font-medium">金額：NT$ {request.purchaseAmount.toLocaleString()}</span>
                          </div>
                          <div className="text-sm text-success-600 mt-1">
                            購買日期：{request.purchaseDate ? new Date(request.purchaseDate).toLocaleDateString() : 'N/A'}
                          </div>
                          {request.purchaserName && (
                            <div className="text-sm text-success-600 mt-1">
                              購買人：{request.purchaserName}
                            </div>
                          )}
                          {request.purchaseNotes && (
                            <div className="mt-2 pt-2 border-t border-success-200">
                              <p className="text-xs text-success-700 font-medium">備註：</p>
                              <p className="text-sm text-success-800 whitespace-pre-wrap break-words">
                                <Linkify componentDecorator={componentDecorator}>{request.purchaseNotes}</Linkify>
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                      <button
                          onClick={(e) => { e.stopPropagation(); openCommentModal(request); }}
                          className="flex items-center gap-1 p-2 md:px-3 md:py-1 text-holy-gold-600 hover:bg-holy-gold-100 rounded-full md:rounded-lg transition-all text-sm disabled:opacity-50"
                          title={`留言 (${request.comments?.length || 0})`}
                          disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}>
                          <MessageCircle size={16} />
                          <span className="hidden md:inline">留言</span>
                        </button>

                        {request.status === 'pending' && (
                          <button onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'purchased'); }} className="flex items-center gap-1 px-3 py-1 text-glory-red-600 hover:bg-glory-red-100 rounded-lg transition-colors text-sm disabled:opacity-50" disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}>
                            {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'purchased') ? <SpinnerIcon /> : '✓'} 標記為已購買
                          </button>
                        )}

                        {request.status === 'purchased' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'pending'); }}
                              className="flex items-center gap-1 p-2 md:px-3 md:py-1 text-holy-gold-600 hover:bg-holy-gold-100 rounded-full md:rounded-lg transition-all text-sm disabled:opacity-50"
                              title="撤銷購買"
                              disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}>
                              {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'pending') ? <SpinnerIcon /> : <RotateCcw size={16} />}
                              <span className="hidden md:inline">撤銷</span>
                            </button>

                            {isCurrentUserReimburser(request) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenTransferModal(request); }}
                                className="flex items-center gap-1 p-2 md:px-3 md:py-1 text-holy-gold-600 hover:bg-holy-gold-100 rounded-full md:rounded-lg transition-all text-sm disabled:opacity-50"
                                title="轉交報帳責任"
                                disabled={isUpdatingRequest || isDeletingRequest || isAddingComment}
                              >
                                <ArrowRightLeft size={16} />
                                <span className="hidden md:inline">轉交</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRequest(request.id); }}
                          className="flex items-center gap-1 p-2 md:px-3 md:py-1 text-danger-600 hover:bg-danger-100 rounded-full md:rounded-lg transition-all text-sm ml-auto disabled:opacity-50"
                          title="刪除"
                          disabled={(isDeletingRequest && selectedRequestId === request.id) || isUpdatingRequest || isAddingComment}>
                          {(isDeletingRequest && selectedRequestId === request.id) ? <SpinnerIcon /> : <Trash2 size={16} />}
                          <span className="hidden md:inline">刪除</span>
                        </button>
                      </div>
                      {request.comments?.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <h4 className="text-sm font-semibold text-graphite-700 mb-2">留言列表：</h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto"> {request.comments.map((comment) => (
                            <div key={comment.id} className="bg-graphite-50 rounded p-2 group relative">
                              <div className="flex justify-between items-start mb-1">
                                <div>
                                  <span className="font-medium text-sm text-gray-900">{comment.authorName || comment.userId}</span>
                                  <span className="text-xs text-graphite-500 ml-2">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                {currentUser && comment.userId === currentUser.uid && (<button onClick={() => handleDeleteComment(request.id, comment.id)} className="text-graphite-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 -mt-1" title="刪除留言" disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}> <Trash2 size={14} /> </button>)} </div>
                              <p className="text-sm text-graphite-700 whitespace-pre-wrap break-words">
                                <Linkify componentDecorator={componentDecorator}>
                                  {comment.text}
                                </Linkify>
                              </p>
                            </div>))} </div> </div>)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

{viewMode === 'list' && (
            <div className="space-y-2" aria-label="列表檢視採購需求">
              {/* --- New: Header for large screens --- */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-2 text-sm font-semibold text-text-subtle dark:text-dark-text-subtle border-b border-graphite-200 dark:border-graphite-600 transition-theme">
                <div className="col-span-2">狀態</div>
                <div className="col-span-4">品名</div>
                <div className="col-span-2">提出者</div>
                <div className="col-span-2 text-right">操作</div>
                <div className="col-span-2 text-right">提出日期</div>
              </div>

              {/* --- Small screen version (existing layout) --- */}
              <div className="md:hidden space-y-1">
                {sortedRequests.map(request => {
                  const isUrgent = request.priority === 'urgent';
                  return (
                    <button
                      key={request.id}
                      onClick={() => handleShowDetails(request)}
                      className={`w-full text-left bg-surface dark:bg-dark-surface rounded-lg shadow-sm border p-3 transition-theme hover:shadow-md hover:border-primary dark:hover:border-dark-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2 flex items-center justify-between gap-3 ${isUrgent ? 'border-danger-400 dark:border-danger-500' : 'border-graphite-200 dark:border-graphite-600'}`}
                      aria-label={`查看採購需求詳情: ${request.title || request.text}${isUrgent ? ' (緊急)' : ''}`}
                      aria-describedby={`request-status-${request.id} request-date-${request.id}`}
                    >
                      {/* Left-aligned info for small screens */}
                      <div className="flex items-center gap-3 min-w-0 flex-grow">
                        {isUrgent && (
                          <div className="flex-shrink-0" title="緊急需求">
                            <AlertTriangle size={20} className="text-danger-500" />
                          </div>
                        )}
                        <div className="flex-shrink-0">
                          <span
                            id={`request-status-${request.id}`}
                            className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${statusLabels[request.status]?.color || 'bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme'}`}
                          >
                            {statusLabels[request.status]?.shortText || request.status}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-md font-semibold text-graphite-900 dark:text-dark-text-main transition-theme truncate" title={request.title || request.text}>
                            {request.title || request.text}
                          </h3>
                        </div>
                      </div>
                      {/* Right-aligned date for small screens */}
                      <div className="flex-shrink-0 flex items-center gap-1.5 text-sm text-text-subtle dark:text-dark-text-subtle transition-theme" id={`request-date-${request.id}`}>
                        <Calendar size={16} aria-hidden="true" />
                        <span>
                          {(() => {
                            const d = new Date(request.createdAt);
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          })()}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* --- Large screen version (new grid layout) --- */}
              <div className="hidden md:block space-y-2">
                {sortedRequests.map(request => {
                  const isUrgent = request.priority === 'urgent';
                  return (
                    <div
                      key={request.id}
                      onClick={() => handleShowDetails(request)}
                      className={`grid grid-cols-12 gap-3 items-center w-full text-left bg-surface dark:bg-dark-surface rounded-lg shadow-sm border p-3 transition-theme hover:shadow-md hover:border-primary dark:hover:border-dark-primary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:ring-offset-2 cursor-pointer ${isUrgent ? 'border-danger-400 dark:border-danger-500' : 'border-graphite-200 dark:border-graphite-600'}`}
                    >
                      {/* Col 1: Status */}
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium w-20 ${statusLabels[request.status]?.color || 'bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme'}`}>
                          {statusLabels[request.status]?.text || request.status}
                        </span>
                        {isUrgent && (
                          <span className={`inline-flex flex-shrink-0 items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${priorityLabels.urgent.color}`}>
                            <AlertTriangle size={14} aria-hidden="true" />
                            {priorityLabels.urgent.text}
                          </span>
                        )}
                      </div>
                      {/* Col 2: Title */}
                      <div className="col-span-4 min-w-0">
                        <h3 className="text-md font-semibold text-graphite-900 dark:text-dark-text-main transition-theme truncate" title={request.title || request.text}>
                          {request.title || request.text}
                        </h3>
                      </div>
                      {/* Col 3: Requester */}
                      <div className="col-span-2 flex items-center gap-1.5 text-sm text-text-subtle dark:text-dark-text-subtle transition-theme" title={`提出者: ${request.requesterName}`}>
                        <User size={16} />
                        <span className="truncate">{request.requesterName}</span>
                      </div>
                      {/* Col 4: Actions */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); openCommentModal(request); }}
                          className="p-2 text-text-subtle dark:text-dark-text-subtle hover:bg-holy-gold-100 dark:hover:bg-dark-accent/20 hover:text-holy-gold-600 dark:hover:text-dark-accent rounded-full transition-theme disabled:opacity-50"
                          title={`留言 (${request.comments?.length || 0})`}
                          disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}
                        >
                          <MessageCircle size={16} />
                        </button>
                        {request.status === 'pending' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'purchased'); }}
                            className="p-2 text-text-subtle dark:text-dark-text-subtle hover:bg-primary/10 dark:hover:bg-dark-primary/20 hover:text-primary dark:hover:text-dark-primary rounded-full transition-theme disabled:opacity-50"
                            title="標記為已購買"
                            disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}
                          >
                            {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'purchased') ? <SpinnerIcon /> : <CheckSquare size={16} />}
                          </button>
                        )}
                        {request.status === 'purchased' && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateStatus(request.id, 'pending'); }}
                              className="p-2 text-text-subtle dark:text-dark-text-subtle hover:bg-holy-gold-100 dark:hover:bg-dark-accent/20 hover:text-holy-gold-600 dark:hover:text-dark-accent rounded-full transition-theme disabled:opacity-50"
                              title="撤銷購買"
                              disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}
                            >
                              {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'pending') ? <SpinnerIcon /> : <RotateCcw size={16} />}
                            </button>
                            {isCurrentUserReimburser(request) && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenTransferModal(request); }}
                                className="p-2 text-text-subtle dark:text-dark-text-subtle hover:bg-holy-gold-100 dark:hover:bg-dark-accent/20 hover:text-holy-gold-600 dark:hover:text-dark-accent rounded-full transition-theme disabled:opacity-50"
                                title="轉交報帳責任"
                                disabled={isUpdatingRequest || isDeletingRequest || isAddingComment}
                              >
                                <ArrowRightLeft size={16} />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRequest(request.id); }}
                          className="p-2 text-text-subtle dark:text-dark-text-subtle hover:bg-danger-100 dark:hover:bg-danger-900/20 hover:text-danger-600 dark:hover:text-danger-400 rounded-full transition-theme disabled:opacity-50"
                          title="刪除"
                          disabled={(isDeletingRequest && selectedRequestId === request.id) || isUpdatingRequest || isAddingComment}
                        >
                          {(isDeletingRequest && selectedRequestId === request.id) ? <SpinnerIcon /> : <Trash2 size={16} />}
                        </button>
                      </div>
                      {/* Col 5: Date */}
                      <div className="col-span-2 flex items-center justify-end gap-1.5 text-sm text-text-subtle dark:text-dark-text-subtle transition-theme">
                        <Calendar size={16} aria-hidden="true" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
      {/* --- 修改結束 --- */}


      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh] transition-theme">
            {/* --- 固定標頭 --- */}
            <div className="bg-primary dark:bg-dark-primary text-white p-4 rounded-t-lg flex justify-between items-center flex-shrink-0 transition-theme">
              <h2 className="text-lg font-semibold">新增採購需求</h2>
              <button
                onClick={() => { setShowModal(false); setSubmitError(null); }}
                className="text-white hover:bg-glory-red-600 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-glory-red-500"
                aria-label="關閉新增需求對話框"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* --- 可滾動的內容區域 --- */}
            <div className="p-6 space-y-2 overflow-y-auto">
              {submitError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <strong className="font-bold">提交錯誤!</strong>
                  <span className="block sm:inline"> {submitError}</span>
                </div>
              )}
              <div>
                <label htmlFor="formTitle" className="block text-sm font-medium text-graphite-700 mb-2">
                  需求標題*
                </label>
                <input
                  id="formTitle"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="請輸入標題..."
                  className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary transition-theme"
                  required
                />
              </div>
              <div>
                <label htmlFor="formPriority" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  緊急程度
                </label>
                <select
                  id="formPriority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme"
                >
                  <option value="general">一般</option>
                  <option value="urgent">緊急</option>
                </select>
              </div>
              <div>
                <label htmlFor="formDescription" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  詳細描述
                </label>
                <textarea
                  id="formDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="請描述需求的詳細內容：數量、去哪買、可貼連結..."
                  rows="2"
                  className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 resize-none transition-theme"
                />
              </div>
              <div>
                <label htmlFor="formRequester" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  提出者姓名
                </label>
                <input
                  id="formRequester"
                  type="text"
                  value={currentUser?.displayName || formData.requester}
                  onChange={(e) => !currentUser?.displayName && setFormData({ ...formData, requester: e.target.value })}
                  placeholder="您的姓名"
                  className={`w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme ${currentUser?.displayName ? 'bg-graphite-100 dark:bg-graphite-700' : ''}`}
                  readOnly={!!currentUser?.displayName}
                />
              </div>
              <CategorySelector
                value={formData.accountingCategory}
                onChange={(selectedValue) => setFormData({ ...formData, accountingCategory: selectedValue })}
              />
              <div className="mt-4 pt-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
                <div className="flex items-center">
                  <input
                    id="isAlreadyPurchased"
                    type="checkbox"
                    className="h-4 w-4 text-glory-red-600 border-graphite-300 dark:border-graphite-600 rounded focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme"
                    checked={formData.isAlreadyPurchased}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({ ...formData, isAlreadyPurchased: isChecked, purchaseAmount: '' });
                      // 如果取消勾選，也要重設報帳人狀態
                      if (!isChecked) {
                        setIsDifferentReimburser(false);
                        setSelectedReimburserId('');
                      }
                    }}
                  />
                  <label htmlFor="isAlreadyPurchased" className="ml-3 block text-sm font-medium text-graphite-900 dark:text-dark-text-main transition-theme">
                    我已購買此項目 (直接登記為「已購買」)
                  </label>
                </div>
                {formData.isAlreadyPurchased && (
                  <div className="mt-4 pl-2 border-l-2 border-graphite-200 dark:border-graphite-600 transition-theme">
                    <div className="mb-4">
                      <label htmlFor="formPurchaseAmount" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                        購買總金額 (NT$)*
                      </label>
                      <input
                        id="formPurchaseAmount"
                        type="number"
                        value={formData.purchaseAmount}
                        onChange={(e) => setFormData({ ...formData, purchaseAmount: e.target.value })}
                        placeholder="請輸入購買總金額或代墊金額..."
                        className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 transition-theme"
                        required
                      />
                    </div>

                    {/* --- 👇 新增：報帳代理人區塊 --- */}
                    <div className="mb-2 pt-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
                      <div className="flex items-center">
                        <input
                          id="isDifferentReimburser_add"
                          type="checkbox"
                          className="h-4 w-4 text-glory-red-600 border-graphite-300 dark:border-graphite-600 rounded focus:ring-glory-red-500 dark:focus:ring-glory-red-400 disabled:opacity-70 transition-theme"
                          checked={isDifferentReimburser}
                          onChange={(e) => setIsDifferentReimburser(e.target.checked)}
                          disabled={!isReimburser}
                        />
                        <label htmlFor="isDifferentReimburser_add" className="ml-3 block text-sm font-medium text-graphite-900 dark:text-dark-text-main transition-theme">
                          指定他人請款 (非本人報帳)
                        </label>
                      </div>

                      {!isReimburser && (
                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-2 p-2 bg-warning-50 dark:bg-warning-900/20 rounded-md transition-theme">您的帳號無請款權限，請務必指定一位報帳代理人。</p>
                      )}

                      {isDifferentReimburser && (
                        <div className="mt-4">
                          <label htmlFor="reimburserSelect_add" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                            報帳請款人*
                          </label>
                          {isLoadingContacts ? (
                            <div className="flex items-center gap-2 text-graphite-500 dark:text-dark-text-subtle transition-theme">
                              <SpinnerIcon />
                              <span>正在載入人員列表...</span>
                            </div>
                          ) : (
                            <select
                              id="reimburserSelect_add"
                              value={selectedReimburserId}
                              onChange={(e) => setSelectedReimburserId(e.target.value)}
                              className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 transition-theme"
                            >
                              <option value="" disabled>請選擇一位報帳請款人...</option>
                              {reimbursementContacts.map(contact => (
                                <option key={contact.uid} value={contact.uid}>
                                  {contact.displayName}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                    {/* --- 新增區塊結束 --- */}
                  </div>
                )}
              </div>
            </div>

            {/* --- 固定頁腳 (按鈕區) --- */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setSubmitError(null); }}
                  className="flex-1 bg-graphite-300 dark:bg-graphite-600 hover:bg-graphite-400 dark:hover:bg-graphite-500 text-graphite-700 dark:text-dark-text-main py-2 px-4 rounded-lg transition-theme"
                  disabled={isSubmittingRequest}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-primary dark:bg-dark-primary hover:bg-primary/90 dark:hover:bg-dark-primary/90 text-white py-2 px-4 rounded-lg transition-theme disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isSubmittingRequest || (formData.isAlreadyPurchased && isLoadingContacts)}
                >
                  {isSubmittingRequest && <SpinnerIcon />}
                  {isSubmittingRequest ? '提交中...' : '提交需求'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md transition-theme">
            <div className="bg-holy-gold-500 dark:bg-dark-accent text-white p-4 rounded-t-lg flex justify-between items-center transition-theme">
              <h2 className="text-lg font-semibold">
                確認購買
              </h2>
              <button onClick={() => { setShowPurchaseModal(false); setUpdateError(null); setSelectedRequestId(null); }} className="text-white hover:bg-holy-gold-600 p-1 rounded-full transition-colors"> <X size={20} />
              </button>
            </div>
            <div className="p-6"> {updateError && <p
              className="text-danger-500 dark:text-danger-400 text-sm mb-3 bg-danger-100 dark:bg-danger-900/20 p-2 rounded text-center transition-theme">{updateError}</p>} <p
                className="text-graphite-700 dark:text-dark-text-main mb-4 transition-theme">
                請輸入購買金額與購買人以完成採購： </p>
              <div className="mb-4">
                <label htmlFor="purchaseAmount" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  金額 (NT$)*
                </label>
                <input id="purchaseAmount"
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="請輸入金額..." min="0" step="1"
                  className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 transition-theme" />
              </div>
              <div className="mb-4">
                <label htmlFor="purchaserName"
                  className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  購買人*
                </label>
                <input id="purchaserName"
                  type="text"
                  value={purchaserNameInput}
                  readOnly
                  className="w-full border border-graphite-300 dark:border-graphite-600 rounded-lg px-3 py-2 focus:outline-none bg-graphite-100 dark:bg-graphite-700 text-text-main dark:text-dark-text-main cursor-not-allowed transition-theme"
                />
              </div>

              {/* 3. 新增購買備註欄位 */}
              <div className="mb-6">
                <label htmlFor="purchaseNotes" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                  購買備註（選填）
                </label>
                <textarea
                  id="purchaseNotes"
                  value={purchaseNotes}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= MAX_NOTES_LENGTH) {
                      setPurchaseNotes(value);
                      setNotesCharCount(value.length);
                    }
                  }}
                  placeholder="例如：到貨時間、到貨後放置位置或廠商聯絡方式"
                  rows={4}
                  className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 resize-y transition-theme"
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-graphite-500 dark:text-dark-text-subtle transition-theme">
                    可記錄重要採購資訊
                  </p>
                  <span className={`text-xs transition-theme ${notesCharCount > MAX_NOTES_LENGTH * 0.9
                    ? 'text-danger-500 dark:text-danger-400'
                    : 'text-graphite-400 dark:text-dark-text-subtle'
                    }`}>
                    {notesCharCount}/{MAX_NOTES_LENGTH}
                  </span>
                </div>
              </div>

              {/* --- 👇 新增：報帳代理人區塊 --- */}
              <div className="mb-6 pt-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
                <div className="flex items-center">
                  <input
                    id="isDifferentReimburser"
                    type="checkbox"
                    className="h-4 w-4 text-glory-red-600 border-graphite-300 dark:border-graphite-600 rounded focus:ring-glory-red-500 dark:focus:ring-glory-red-400 disabled:opacity-70 transition-theme"
                    checked={isDifferentReimburser}
                    onChange={(e) => setIsDifferentReimburser(e.target.checked)}
                    disabled={!isReimburser}
                  />
                  <label htmlFor="isDifferentReimburser" className="ml-3 block text-sm font-medium text-graphite-900 dark:text-dark-text-main transition-theme">
                    指定他人請款 (非本人報帳)
                  </label>
                </div>

                {!isReimburser && (
                  <p className="text-xs text-warning-600 dark:text-warning-400 mt-2 p-2 bg-warning-50 dark:bg-warning-900/20 rounded-md transition-theme">您的帳號無請款權限，請務必指定一位報帳代理人。</p>
                )}

                {isDifferentReimburser && (
                  <div className="mt-4">
                    <label htmlFor="reimburserSelect" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-2 transition-theme">
                      報帳請款人*
                    </label>
                    {isLoadingContacts ? (
                      <div className="flex items-center gap-2 text-graphite-500 dark:text-dark-text-subtle transition-theme">
                        <SpinnerIcon />
                        <span>正在載入人員列表...</span>
                      </div>
                    ) : (
                      <select
                        id="reimburserSelect"
                        value={selectedReimburserId}
                        onChange={(e) => setSelectedReimburserId(e.target.value)}
                        className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-success-500 dark:focus:ring-success-400 transition-theme"
                      >
                        <option value="" disabled>請選擇一位報帳請款人...</option>
                        {reimbursementContacts.map(contact => (
                          <option key={contact.uid} value={contact.uid}>
                            {contact.displayName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
              {/* --- 新增區塊結束 --- */}

              <div className="flex gap-3">
                <button type="button"
                  onClick={() => { setShowPurchaseModal(false); setUpdateError(null); setSelectedRequestId(null); }}
                  className="flex-1 bg-graphite-300 dark:bg-graphite-600 hover:bg-graphite-400 dark:hover:bg-graphite-500 text-graphite-700 dark:text-dark-text-main py-2 px-4 rounded-lg transition-theme"
                  disabled={isUpdatingRequest}>
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmPurchase}
                  className="flex-1 bg-holy-gold-500 dark:bg-dark-accent hover:bg-holy-gold-600 dark:hover:bg-dark-accent/90 text-white py-2 px-4 rounded-lg transition-theme disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={isUpdatingRequest || (isDifferentReimburser && !selectedReimburserId) || isLoadingContacts}>
                  {isUpdatingRequest && <SpinnerIcon />} {isUpdatingRequest ? '處理中...' : '確認購買'}
                </button>
              </div>
            </div>
          </div>
        </div>)}


      {/* --- 修改/新增開始: 更新購買紀錄彈出視窗的 JSX --- */}
      {showRecordsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col transition-theme">
            <div className="bg-holy-gold-500 dark:bg-dark-accent text-white py-4 pr-3 pl-4 rounded-t-lg flex justify-between items-center transition-theme">
              <div className="flex items-center gap-3 mr-10">
                <button
                  onClick={handleBatchExport}
                  disabled={selectedRecordIds.size === 0}
                  className="flex items-center gap-2 bg-surface dark:bg-dark-surface text-glory-red-700 dark:text-glory-red-400 hover:bg-graphite-100 dark:hover:bg-graphite-700 py-2 px-3 rounded-md text-sm font-medium transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
                  title="將勾選的項目合併成一張轉帳傳票"
                >
                  <Download size={18} />
                  匯出選中傳票 PDF
                </button>
                <button onClick={exportPurchaseRecordsToCSV} className="flex items-center gap-2 bg-surface dark:bg-dark-surface text-holy-gold-700 dark:text-holy-gold-400 hover:bg-graphite-100 dark:hover:bg-graphite-700 py-2 px-3 rounded-md text-sm font-medium transition-theme" title="匯出目前篩選的記錄為 CSV">
                  <Download size={18} />
                  匯出篩選結果 CSV
                </button>
              </div>
              <div> {/* 將關閉按鈕移到這個新的 div 內 */}
                <button onClick={() => setShowRecordsModal(false)} className="text-white hover:bg-holy-gold-600 p-1 rounded-full transition-colors" title="關閉">
                  <X size={30} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-grow">
              {/* --- 新增開始：統一控制列 --- */}
              <div className="mb-2">
                {/* 控制列：篩選按鈕 + 視圖切換按鈕 */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  {/* 左側：篩選控制區 */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsFilterPanelExpanded(!isFilterPanelExpanded)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface dark:bg-dark-surface border border-graphite-300 dark:border-graphite-600 rounded-lg hover:bg-graphite-50 dark:hover:bg-graphite-700 transition-theme focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 focus:ring-offset-2"
                      aria-expanded={isFilterPanelExpanded}
                      aria-controls="filter-panel"
                    >
                      <Filter size={16} className="text-graphite-500" />
                      <span className="text-sm font-medium text-graphite-700">
                        篩選
                        {activeFiltersCount > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-glory-red-100 text-glory-red-700 text-xs rounded-full">
                            {activeFiltersCount}
                          </span>
                        )}
                      </span>
                      {isFilterPanelExpanded ? (
                        <ChevronUp size={16} className="text-graphite-500" />
                      ) : (
                        <ChevronDown size={16} className="text-graphite-500" />
                      )}
                    </button>
                    
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-graphite-500 hover:text-danger-600 transition-colors focus:outline-none focus:ring-2 focus:ring-danger-500 focus:ring-offset-2 rounded px-2 py-1"
                      >
                        清除全部
                      </button>
                    )}
                  </div>

                  {/* 右側：視圖切換按鈕 */}
                  <div className="flex items-center">
                  <div className="flex items-center rounded-lg bg-graphite-200 dark:bg-graphite-700 p-1 transition-theme" role="tablist" aria-label="購買紀錄視圖模式">
                   
                    <button
                      onClick={() => setRecordsViewMode('list')}
                      className={`p-2 rounded-md transition-theme focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 focus:ring-offset-2 ${
                        recordsViewMode === 'list' 
                          ? 'bg-surface dark:bg-dark-surface shadow text-text-main dark:text-dark-text-main' 
                          : 'text-graphite-500 dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600'
                      }`}
                      title="列表視圖"
                      role="tab"
                      aria-selected={recordsViewMode === 'list'}
                      aria-controls="records-content"
                      aria-label="切換到列表檢視模式"
                    >
                      <List size={20} aria-hidden="true" />
                      <span className="sr-only">列表模式</span>
                    </button>
                    <button
                      onClick={() => setRecordsViewMode('grid')}
                      className={`p-2 rounded-md transition-theme focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 focus:ring-offset-2 ${
                        recordsViewMode === 'grid' 
                          ? 'bg-surface dark:bg-dark-surface shadow text-text-main dark:text-dark-text-main' 
                          : 'text-graphite-500 dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600'
                      }`}
                      title="網格視圖"
                      role="tab"
                      aria-selected={recordsViewMode === 'grid'}
                      aria-controls="records-content"
                      aria-label="切換到網格檢視模式"
                    >
                      <LayoutGrid size={20} aria-hidden="true" />
                      <span className="sr-only">網格模式</span>
                    </button>
                  </div>
                </div>
                </div>
                {/* 可摺疊的篩選面板 */}
                <div
                  id="filter-panel"
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isFilterPanelExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  aria-hidden={!isFilterPanelExpanded}
                >
                  <div className="p-4 bg-graphite-50 dark:bg-graphite-800 rounded-lg border border-graphite-200 dark:border-graphite-600 transition-theme">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="filterPurchaser" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-1 transition-theme">購買人</label>
                        <select
                          id="filterPurchaser"
                          value={filterPurchaserUid}
                          onChange={(e) => setFilterPurchaserUid(e.target.value)}
                          className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme"
                        >
                          <option value="">所有購買人</option>
                          {allUsers.map(user => (
                            <option key={user.uid} value={user.uid}>{user.displayName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="filterReimburser" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-1 transition-theme">請款人</label>
                        <select
                          id="filterReimburser"
                          value={filterReimburserUid}
                          onChange={(e) => setFilterReimburserUid(e.target.value)}
                          className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme"
                        >
                          <option value="">所有請款人</option>
                          {reimbursementContacts.map(contact => (
                            <option key={contact.uid} value={contact.uid}>{contact.displayName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="filterSDate" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-1 transition-theme">購買日期 (起)</label>
                        <input 
                          id="filterSDate" 
                          type="date" 
                          value={filterStartDate} 
                          onChange={(e) => setFilterStartDate(e.target.value)} 
                          className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme" 
                        />
                      </div>
                      <div>
                        <label htmlFor="filterEDate" className="block text-sm font-medium text-graphite-700 dark:text-dark-text-main mb-1 transition-theme">購買日期 (迄)</label>
                        <input 
                          id="filterEDate" 
                          type="date" 
                          value={filterEndDate} 
                          onChange={(e) => setFilterEndDate(e.target.value)} 
                          className="w-full border border-graphite-300 dark:border-graphite-600 bg-surface dark:bg-dark-surface text-text-main dark:text-dark-text-main rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* --- 新增結束：統一控制列 --- */}

              {filteredPurchaseRecords.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt size={48} className="mx-auto text-graphite-400 dark:text-dark-text-subtle mb-4 transition-theme" />
                  <p className="text-graphite-500 dark:text-dark-text-subtle transition-theme">無符合條件的購買記錄</p>
                </div>
              ) : (
                <>
                  <div className="bg-success-50 dark:bg-graphite-800/30 border border-success-200 dark:border-success-700/50 rounded-lg p-4 mb-4 transition-theme">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <label htmlFor="select-all-records" className="text-sm font-medium text-graphite-700 dark:text-dark-text-main transition-theme">全選</label>
                        <input id="select-all-records" type="checkbox" className="h-5 w-5 rounded border-graphite-300 dark:border-graphite-600 text-success-600 dark:text-success-500 focus:ring-success-500 dark:focus:ring-success-400 transition-theme" ref={selectAllCheckboxRef} checked={isAllSelected} onChange={handleSelectAll} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-success-700 dark:text-success-400 mb-2 transition-theme">
                          <span className="font-semibold">篩選總計：NT${filteredPurchaseRecords.reduce((total, record) => total + (record.purchaseAmount || 0), 0).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-success-600 dark:text-success-500 transition-theme">共 {filteredPurchaseRecords.length} 筆符合條件的紀錄</p>
                      </div>
                    </div>
                    {/* --- 這是新增的已選項目統計區塊 --- */}
                    {selectedRecordsSummary.count > 0 && (
                      <>
                        <hr className="my-3 border-graphite-300 dark:border-graphite-600 transition-theme" />
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2 text-success-700 dark:text-success-400 font-semibold transition-theme">
                              <CheckSquare size={20} />
                              <span>已勾選總計：NT${selectedRecordsSummary.totalAmount.toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-success-600 dark:text-success-500 mt-1 transition-theme">共勾選 {selectedRecordsSummary.count} 筆紀錄</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* --- 新增開始：根據視圖模式條件渲染 --- */}
                  <div id="records-content" role="tabpanel" aria-label="購買紀錄內容">
                    {recordsViewMode === 'grid' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4" aria-label="網格視圖購買紀錄">
                        {filteredPurchaseRecords.map((record) => (
                          <div key={record.id} className="bg-surface dark:bg-dark-surface border border-graphite-200 dark:border-graphite-600 rounded-lg p-4 shadow-sm hover:shadow-md dark:hover:shadow-lg transition-all flex flex-col h-full">
                            <div className="flex items-start gap-3 mb-3">
                              <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-graphite-300 dark:border-graphite-600 text-glory-red-600 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 mt-1 flex-shrink-0 transition-theme"
                                checked={selectedRecordIds.has(record.id)}
                                onChange={() => handleRecordSelection(record.id)}
                                aria-labelledby={`record-title-${record.id}`}
                              />
                              <div className="flex-grow">
                                <div className="flex justify-between items-start mb-2">
                                  <h3 id={`record-title-${record.id}`} className="text-lg font-semibold text-text-main dark:text-dark-text-main line-clamp-2 transition-theme">{record.title}</h3>
                                  <span className="bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 transition-theme">
                                    已購買
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex-grow">
                              <div className="space-y-2 text-sm">
                                <div><span className="text-text-subtle dark:text-dark-text-subtle transition-theme">提出者：</span><span className="font-medium text-text-main dark:text-dark-text-main transition-theme">{record.requester}</span></div>
                                <div><span className="text-text-subtle dark:text-dark-text-subtle transition-theme">金額：</span><span className="font-medium text-success-600 dark:text-success-400 transition-theme">NT$ {(record.purchaseAmount || 0).toLocaleString()}</span></div>
                                <div><span className="text-text-subtle dark:text-dark-text-subtle transition-theme">需求日期：</span><span className="font-medium text-text-main dark:text-dark-text-main transition-theme">{record.requestDate ? new Date(record.requestDate).toLocaleDateString() : 'N/A'}</span></div>
                                <div><span className="text-text-subtle dark:text-dark-text-subtle transition-theme">購買日期：</span><span className="font-medium text-text-main dark:text-dark-text-main transition-theme">{record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : 'N/A'}</span></div>
                                {record.purchaserName && (<div><span className="text-text-subtle dark:text-dark-text-subtle transition-theme">購買人：</span><span className="font-medium text-text-main dark:text-dark-text-main transition-theme">{record.purchaserName}</span></div>)}
                                {/* --- 👇 修改：顯示請款人 --- */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1">
                                    <span className="text-text-subtle dark:text-dark-text-subtle transition-theme">請款人：</span>
                                    <span className="font-medium text-text-main dark:text-dark-text-main flex items-center gap-1 transition-theme">{record.reimbursementerName || record.purchaserName}
                                      {record.reimbursementerId && record.reimbursementerId !== record.purchaserId && (
                                        <UserCheck size={14} className="text-holy-gold-600 dark:text-holy-gold-400 transition-theme" title={`由 ${record.purchaserName} 指定`} />
                                      )}
                                    </span>
                                  </div>
                                  {isCurrentUserReimburser(record) && (
                                    <button
                                      onClick={() => {
                                        // 在「購買紀錄」列表中，我們只有簡化的 record 物件。
                                        // 但「轉交」彈窗需要完整的 request 物件才能正確運作。
                                        // 因此，我們需要從主資料 `requests` 陣列中，根據 ID 找到對應的完整物件。
                                        const fullRequest = requests.find(r => r.id === record.id);
                                        if (fullRequest) {
                                          handleOpenTransferModal(fullRequest);
                                        } else {
                                          // 如果因故找不到，提供一個安全的備用方案。
                                          console.error('Could not find the full request object for this record:', record.id);
                                          alert('操作失敗：無法找到此紀錄的完整需求資料。');
                                        }
                                      }}
                                      className="p-1 text-gray-400 hover:text-holy-gold-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-holy-gold-500"
                                      title="轉交報帳責任給其他人員"
                                    >
                                      <ArrowRightLeft size={16} />
                                    </button>
                                  )}
                                </div>
                                {record.accountingCategory && (<div><span className="text-graphite-500">會計類別：</span><span className="font-medium">{record.accountingCategory}</span></div>)}
                              </div>
                            </div>
                            {/* 新增：顯示購買備註 */}
                            {record.purchaseNotes && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-graphite-600 transition-theme">
                                <p className="text-sm font-medium text-graphite-900 dark:text-dark-text-main mb-1 transition-theme">購買備註：</p>
                                <p className="text-sm text-graphite-500 dark:text-dark-text-subtle whitespace-pre-wrap bg-gray-50 dark:bg-graphite-700 p-2 rounded-md transition-theme">
                                  {record.purchaseNotes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* --- 新增開始：列表視圖 --- */}
                    {recordsViewMode === 'list' && (
                      <div className="space-y-1" aria-label="列表視圖購買紀錄">
                        {/* 列表標題 - 僅在大螢幕顯示 */}
                        <div className="hidden lg:block bg-graphite-50 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-600 rounded-lg p-2 mb-3 transition-theme">
                          <div className="grid grid-cols-12 gap-3 text-sm font-medium text-graphite-700 dark:text-dark-text-main transition-theme">
                            <div className="col-span-1 flex justify-center">選擇</div>
                            <div className="col-span-2">需求標題</div>
                            <div className="col-span-2">金額</div>
                            <div className="col-span-2">購買日期</div>
                            <div className="col-span-2">購買人</div>
                            <div className="col-span-2">請款人</div>
                            <div className="col-span-1">轉交報帳</div>
                          </div>
                        </div>

                        {/* 列表項目 */}
                        {filteredPurchaseRecords.map((record) => (
                          <div key={record.id} className="bg-surface dark:bg-dark-surface border border-graphite-200 dark:border-graphite-600 rounded-lg hover:shadow-md dark:hover:shadow-lg transition-all">
                            {/* 大螢幕版本 */}
                            <div className="hidden lg:grid lg:grid-cols-12 gap-3 p-1 items-center">
                              {/* 勾選框 */}
                              <div className="col-span-1 flex justify-center">
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded border-graphite-300 dark:border-graphite-600 text-glory-red-600 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 transition-theme"
                                  checked={selectedRecordIds.has(record.id)}
                                  onChange={() => handleRecordSelection(record.id)}
                                  aria-labelledby={`record-title-${record.id}`}
                                />
                              </div>

                              {/* 可點擊的內容區域 */}
                              <div
                                className="col-span-10 grid grid-cols-10 gap-3 cursor-pointer hover:bg-graphite-50 dark:hover:bg-graphite-700 p-2 rounded transition-theme"
                                onClick={() => handleShowRecordDetails(record)}
                              >
                                <div className="col-span-2 font-medium text-text-main dark:text-dark-text-main truncate transition-theme" title={record.title}>
                                  {record.title}
                                </div>
                                <div className="col-span-2 text-sm font-medium text-success-600 dark:text-success-400 transition-theme">
                                  NT$ {(record.purchaseAmount || 0).toLocaleString()}
                                </div>
                                <div className="col-span-2 text-sm text-text-subtle dark:text-dark-text-subtle transition-theme">
                                  {record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : 'N/A'}
                                </div>
                                <div className="col-span-2 text-sm text-text-subtle dark:text-dark-text-subtle truncate transition-theme" title={record.purchaserName || 'N/A'}>
                                  {record.purchaserName || 'N/A'}
                                </div>
                                <div className="col-span-2 text-sm text-text-subtle dark:text-dark-text-subtle truncate transition-theme" title={record.reimbursementerName || record.purchaserName || 'N/A'}>
                                  {record.reimbursementerName || record.purchaserName || 'N/A'}
                                  {record.reimbursementerId && record.reimbursementerId !== record.purchaserId && (
                                    <UserCheck size={12} className="inline ml-1 text-holy-gold-600 dark:text-holy-gold-400 transition-theme" title={`由 ${record.purchaserName} 指定`} />
                                  )}
                                </div>
                              </div>

                              {/* 操作按鈕 */}
                              <div className="col-span-1 flex justify-center">
                                {isCurrentUserReimburser(record) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullRequest = requests.find(r => r.id === record.id);
                                      if (fullRequest) {
                                        handleOpenTransferModal(fullRequest);
                                      } else {
                                        console.error('Could not find the full request object for this record:', record.id);
                                        alert('操作失敗：無法找到此紀錄的完整需求資料。');
                                      }
                                    }}
                                    className="p-2 text-graphite-400 dark:text-dark-text-subtle hover:text-holy-gold-600 dark:hover:text-holy-gold-400 rounded-full transition-theme focus:outline-none focus:ring-2 focus:ring-holy-gold-500 dark:focus:ring-holy-gold-400"
                                    title="轉交報帳責任"
                                  >
                                    <ArrowRightLeft size={16} />
                                  </button>
                                )}
                              </div>
                            </div>

                             {/* 小螢幕版本 */}
                             <div className="lg:hidden">
                              <div className="flex items-start gap-3 p-2">
                                {/* 勾選框 */}
                                <input
                                  type="checkbox"
                                  className="h-5 w-5 rounded border-graphite-300 dark:border-graphite-600 text-glory-red-600 focus:ring-glory-red-500 dark:focus:ring-glory-red-400 mt-1 flex-shrink-0 transition-theme"
                                  checked={selectedRecordIds.has(record.id)}
                                  onChange={() => handleRecordSelection(record.id)}
                                  aria-labelledby={`record-title-mobile-${record.id}`}
                                />

                                {/* 內容區域 (可點擊) */}
                                <div className="flex-grow cursor-pointer" onClick={() => handleShowRecordDetails(record)}>
                                  {/* 第一行: 品名, 日期 */}
                                  <div className="flex justify-between items-baseline gap-2 mb-1.5">
                                    <h4 id={`record-title-mobile-${record.id}`} className="font-medium text-text-main dark:text-dark-text-main truncate pr-2 transition-theme">
                                      {record.title}
                                    </h4>
                                    <div className="text-sm text-text-subtle dark:text-dark-text-subtle flex-shrink-0 transition-theme">
                                      {record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : 'N/A'}
                                    </div>
                                  </div>

                                  {/* 第二行: 金額, 負責人, 轉交按鈕 */}
                                  <div className="flex justify-between items-center text-sm">
                                    <div className="font-semibold text-success-600 dark:text-success-400 transition-theme">NT$ {(record.purchaseAmount || 0).toLocaleString()}</div>
                                    <div className="flex items-center flex-shrink-0 gap-2">
                                      <div className="flex items-center text-xs text-text-subtle dark:text-dark-text-subtle transition-theme" title={`購買人：${record.purchaserName}\n請款人：${record.reimbursementerName || record.purchaserName}`}>
                                        <span className="truncate max-w-[50px]">{record.purchaserName || 'N/A'}</span>
                                        <ArrowRight size={12} className="mx-0.5 flex-shrink-0" />
                                        <span className="truncate max-w-[70px]">{record.reimbursementerName || record.purchaserName || 'N/A'}</span>
                                        {record.reimbursementerId && record.reimbursementerId !== record.purchaserId && (
                                          <UserCheck size={12} className="ml-1 text-holy-gold-600 dark:text-holy-gold-400 flex-shrink-0 transition-theme" title={`由 ${record.purchaserName} 指定`} />
                                        )}
                                      </div>
                                      {isCurrentUserReimburser(record) && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const fullRequest = requests.find(r => r.id === record.id);
                                            if (fullRequest) {
                                              handleOpenTransferModal(fullRequest);
                                            } else {
                                              console.error('Could not find the full request object for this record:', record.id);
                                              alert('操作失敗：無法找到此紀錄的完整需求資料。');
                                            }
                                          }}
                                          className="p-1 text-gray-400 hover:text-holy-gold-600 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-holy-gold-500"
                                          title="轉交報帳責任"
                                        >
                                          <ArrowRightLeft size={16} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* --- 新增結束 --- */}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- 修改/新增結束 --- */}

      {/* --- 新增開始：詳情顯示彈出視窗 --- */}
      {showDetailModal && selectedRequestForDetail && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetailModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-modal-title"
        >
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-theme" onClick={(e) => e.stopPropagation()}>
            <div className="bg-graphite-100 dark:bg-graphite-800 p-4 rounded-t-lg flex justify-between items-center flex-shrink-0 border-b border-graphite-200 dark:border-graphite-600 transition-theme">
              <h2 id="detail-modal-title" className="text-lg font-semibold text-text-main dark:text-dark-text-main transition-theme">需求詳情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-graphite-500 hover:bg-graphite-300 p-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-graphite-500 focus:ring-offset-2"
                aria-label="關閉需求詳情對話框"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto">
              {(() => {
                const request = selectedRequestForDetail;
                const isExpanded = !!expandedCards[request.id];
                const isLongText = request.description && request.description.length > 50;
                const isUrgent = request.priority === 'urgent';
                return (
                  <div className={`bg-surface dark:bg-dark-surface rounded-b-lg overflow-hidden transition-theme`}>
                    <div className="p-5 pb-0 flex justify-between items-start">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusLabels[request.status]?.color || 'bg-graphite-100 text-graphite-800 dark:bg-graphite-700 dark:text-dark-text-main transition-theme'}`}>
                        {statusLabels[request.status]?.text || request.status}
                      </span>
                      {isUrgent && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${priorityLabels.urgent.color}`}>
                          <AlertTriangle size={14} />
                          {priorityLabels.urgent.text}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-text-main dark:text-dark-text-main mb-3 transition-theme">{request.title || request.text}</h3>
                      <p className={`text-text-subtle dark:text-dark-text-subtle text-base mb-3 whitespace-pre-wrap break-words transition-theme`}>
                        <Linkify componentDecorator={componentDecorator}>
                          {request.description}
                        </Linkify>
                      </p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-text-subtle dark:text-dark-text-subtle my-4 py-4 border-t border-b border-graphite-200 dark:border-graphite-600 transition-theme">
                        <div className="flex items-center gap-2"> <Calendar size={16} /> <span><b>提出日期:</b> {new Date(request.createdAt).toLocaleDateString()}</span> </div>
                        <div className="flex items-center gap-2"> <User size={16} /> <span><b>提出者:</b> {request.requesterName}</span> </div>
                        <div className="flex items-center gap-2 col-span-2"> <Tag size={16} className="text-graphite-500 dark:text-dark-text-subtle transition-theme" /> <span><b>會計類別:</b> {request.accountingCategory || '未分類'}</span> </div>
                      </div>

                      {request.status === 'purchased' && request.purchaseAmount && (
                        <div className="bg-success-50 dark:bg-graphite-800/30 border border-success-200 dark:border-success-700/50 rounded-lg p-4 my-4 transition-theme">
                          <div className="flex items-center gap-2 text-success-800 dark:text-success-400 mb-2 transition-theme"> <DollarSign size={18} /> <span className="font-semibold text-lg">金額：NT$ {request.purchaseAmount.toLocaleString()}</span> </div>
                          <div className="text-sm text-success-700 dark:text-success-500 grid grid-cols-2 gap-1 transition-theme">
                            <div>購買日期：{request.purchaseDate ? new Date(request.purchaseDate).toLocaleDateString() : 'N/A'}</div>
                            {request.purchaserName && (<div>購買人：{request.purchaserName}</div>)}
                            {/* 新增報帳負責人資訊 */}
                            <div className="col-span-2 mt-1">
                              報帳負責人：{request.reimbursementerName || request.purchaserName || '未指定'}
                            </div>
                          </div>
                          {/* 2. 在詳細資料彈窗中顯示備註 */}
                          {request.purchaseNotes && (
                            <div className="mt-2 pt-2 border-t border-success-200 dark:border-success-700 transition-theme">
                              <p className="text-xs text-success-700 dark:text-success-400 font-medium transition-theme">備註：</p>
                              <p className="text-sm text-success-800 dark:text-success-300 whitespace-pre-wrap break-words transition-theme">
                                <Linkify componentDecorator={componentDecorator}>{request.purchaseNotes}</Linkify></p>
                            </div>
                          )}
                        </div>
                      )}

<div className="flex gap-2 my-4">
                        <button onClick={() => { setShowDetailModal(false); openCommentModal(request); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-holy-gold-500 text-white hover:bg-holy-gold-600 rounded transition-colors text-sm disabled:opacity-50" disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}> <MessageCircle size={16} /> <span className="hidden sm:inline">留言 ({request.comments?.length || 0})</span> </button>
                        {request.status === 'pending' && (<button onClick={() => { setShowDetailModal(false); updateStatus(request.id, 'purchased'); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-glory-red-500 text-white hover:bg-glory-red-600 rounded transition-colors text-sm disabled:opacity-50" disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}> {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'purchased') ? <SpinnerIcon /> : '✓'} <span className="hidden sm:inline">標記為已購買</span> </button>)}
                        {request.status === 'purchased' && (<button onClick={() => { setShowDetailModal(false); updateStatus(request.id, 'pending'); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-holy-gold-500 text-white hover:bg-holy-gold-600 rounded transition-colors text-sm disabled:opacity-50" disabled={(isUpdatingRequest && selectedRequestId === request.id) || isDeletingRequest || isAddingComment}> {(isUpdatingRequest && selectedRequestId === request.id && newStatusForUpdate === 'pending') ? <SpinnerIcon /> : <RotateCcw size={16} />} <span className="hidden sm:inline">撤銷購買</span> </button>)}
                        {/* 轉交報帳按鈕 - 只對報帳負責人顯示且僅在已購買狀態下 */}
                        {request.status === 'purchased' && isCurrentUserReimburser(request) && (
                          <button
                            onClick={() => { setShowDetailModal(false); handleOpenTransferModal(request); }}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-holy-gold-500 text-white hover:bg-holy-gold-600 rounded transition-colors text-sm disabled:opacity-50"
                            disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}
                            title="轉交報帳責任給其他人員"
                          >
                            <ArrowRightLeft size={16} />
                            <span className="hidden sm:inline">轉交報帳</span>
                          </button>
                        )}
                        <button onClick={() => { setShowDetailModal(false); deleteRequest(request.id); }} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-danger-500 text-white hover:bg-danger-600 rounded transition-colors text-sm disabled:opacity-50" disabled={(isDeletingRequest && selectedRequestId === request.id) || isUpdatingRequest || isAddingComment}> {(isDeletingRequest && selectedRequestId === request.id) ? <SpinnerIcon /> : <Trash2 size={16} />} <span className="hidden sm:inline">刪除</span> </button>
                      </div>

                      {request.comments?.length > 0 && (
                        <div className="border-t border-graphite-200 dark:border-graphite-600 pt-4 mt-4 transition-theme">
                          <h4 className="text-base font-semibold text-text-main dark:text-dark-text-main mb-3 transition-theme">留言列表：</h4>
                          <div className="space-y-3 max-h-40 overflow-y-auto pr-2">
                            {request.comments.map((comment) => (
                              <div key={comment.id} className="bg-graphite-50 dark:bg-graphite-800 rounded-lg p-3 group relative transition-theme">
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <span className="font-medium text-sm text-text-main dark:text-dark-text-main transition-theme">{comment.authorName || comment.userId}</span>
                                    <span className="text-xs text-text-subtle dark:text-dark-text-subtle ml-2 transition-theme">{new Date(comment.createdAt).toLocaleString()}</span>
                                  </div>
                                  {currentUser && comment.userId === currentUser.uid && (<button onClick={() => { setShowDetailModal(false); handleDeleteComment(request.id, comment.id); }} className="text-graphite-400 dark:text-dark-text-subtle hover:text-danger-500 dark:hover:text-danger-400 opacity-0 group-hover:opacity-100 transition-all p-1 -mr-1 -mt-1" title="刪除留言" disabled={isDeletingRequest || isUpdatingRequest || isAddingComment}> <Trash2 size={14} /> </button>)}
                                </div>
                                <p className="text-sm text-text-subtle dark:text-dark-text-subtle whitespace-pre-wrap break-words transition-theme">
                                  <Linkify componentDecorator={componentDecorator}>
                                    {comment.text}
                                  </Linkify>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      {/* --- 新增結束 --- */}

      {/* --- 新增開始：購買紀錄詳情彈出視窗 --- */}
      {showRecordDetailModal && selectedRecordForDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60" onClick={handleCloseRecordDetailModal}>
          <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-theme" onClick={(e) => e.stopPropagation()}>
            <div className="bg-graphite-100 dark:bg-graphite-800 p-4 rounded-t-lg flex justify-between items-center flex-shrink-0 border-b border-graphite-200 dark:border-graphite-600 transition-theme">
              <h2 className="text-lg font-semibold text-text-main dark:text-dark-text-main transition-theme">購買紀錄詳情</h2>
              <button onClick={handleCloseRecordDetailModal} className="text-graphite-500 dark:text-dark-text-subtle hover:bg-graphite-300 dark:hover:bg-graphite-600 p-1 rounded-full transition-theme">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              {(() => {
                const record = selectedRecordForDetail;
                return (
                  <div className="bg-surface dark:bg-dark-surface rounded-lg transition-theme">
                    <div className="mb-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 transition-theme">
                        已購買
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold text-text-main dark:text-dark-text-main mb-4 transition-theme">{record.title}</h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-6">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>提出者:</strong> {record.requester}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>金額:</strong> <span className="text-success-600 dark:text-success-400 font-semibold transition-theme">NT$ {(record.purchaseAmount || 0).toLocaleString()}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>需求日期:</strong> {record.requestDate ? new Date(record.requestDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>購買日期:</strong> {record.purchaseDate ? new Date(record.purchaseDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {record.purchaserName && (
                        <div className="flex items-center gap-2 col-span-2">
                          <User size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                          <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>購買人:</strong> {record.purchaserName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 col-span-2">
                        <UserCheck size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                        <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>請款人:</strong> {record.reimbursementerName || record.purchaserName || '未指定'}
                          {record.reimbursementerId && record.reimbursementerId !== record.purchaserId && (
                            <UserCheck size={14} className="inline ml-1 text-holy-gold-600 dark:text-holy-gold-400 transition-theme" title={`由 ${record.purchaserName} 指定`} />
                          )}
                        </span>
                      </div>
                      {record.accountingCategory && (
                        <div className="flex items-center gap-2 col-span-2">
                          <Tag size={16} className="text-text-subtle dark:text-dark-text-subtle transition-theme" />
                          <span className="text-text-main dark:text-dark-text-main transition-theme"><strong>會計類別:</strong> {record.accountingCategory}</span>
                        </div>
                      )}
                    </div>

                    {/* 購買備註 */}
                    {record.purchaseNotes && (
                      <div className="bg-success-50 dark:bg-graphite-800/30 border border-success-200 dark:border-success-700/50 rounded-lg p-4 mb-4 transition-theme">
                        <h4 className="text-sm font-semibold text-success-800 dark:text-success-400 mb-2 transition-theme">購買備註</h4>
                        <p className="text-sm text-success-700 dark:text-success-500 whitespace-pre-wrap break-words transition-theme">
                          <Linkify componentDecorator={componentDecorator}>
                            {record.purchaseNotes}
                          </Linkify>
                        </p>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 pt-4 border-t border-graphite-200 dark:border-graphite-600 transition-theme">
                      {isCurrentUserReimburser(record) && (
                        <button
                          onClick={() => {
                            handleCloseRecordDetailModal();
                            const fullRequest = requests.find(r => r.id === record.id);
                            if (fullRequest) {
                              handleOpenTransferModal(fullRequest);
                            } else {
                              console.error('Could not find the full request object for this record:', record.id);
                              alert('操作失敗：無法找到此紀錄的完整需求資料。');
                            }
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-holy-gold-500 dark:bg-dark-accent text-white hover:bg-holy-gold-600 dark:hover:bg-dark-accent/90 rounded-lg transition-theme text-sm font-medium"
                          title="轉交報帳責任給其他人員"
                        >
                          <ArrowRightLeft size={16} />
                          轉交報帳
                        </button>
                      )}
                      <button
                        onClick={handleCloseRecordDetailModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-graphite-500 text-white hover:bg-graphite-600 rounded-lg transition-colors text-sm font-medium ml-auto"
                      >
                        關閉
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      {/* --- 新增結束 --- */}

      {/* ... (Other modals JSX remains the same) ... */}
      {isCommentModalOpen && currentRequestForComment && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out" onClick={closeCommentModal} > <div className="bg-surface dark:bg-dark-surface rounded-lg shadow-xl w-full max-w-md p-6 space-y-4 transform transition-all duration-300 ease-in-out scale-100" onClick={(e) => e.stopPropagation()} > <div className="flex justify-between items-center"> <h2 className="text-xl font-semibold text-graphite-900 dark:text-dark-text-main transition-theme"> 發表留言於：<span className="font-bold truncate max-w-xs inline-block align-bottom">{currentRequestForComment?.title || currentRequestForComment?.text || '需求'}</span> </h2> <button onClick={closeCommentModal} className="text-graphite-400 hover:text-graphite-500 p-1 rounded-full transition-colors" title="關閉" > <X size={24} /> </button> </div> {updateError && <p className="text-red-500 text-sm mb-2 bg-red-100 p-2 rounded text-center">{updateError}</p>} <div className="space-y-4"> <div> <label htmlFor="commenterNameModal" className="block text-sm font-medium text-gray-700 dark:text-dark-text-main mb-1 transition-theme">您的姓名*</label> <input id="commenterNameModal" ref={commenterNameInputRef} type="text" value={commenterName} onChange={(e) => setCommenterName(e.target.value)} placeholder="請輸入您的姓名..." className={`w-full border border-gray-300 dark:border-graphite-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:bg-dark-surface dark:text-dark-text-main transition-theme ${currentUser?.displayName ? 'bg-gray-100 dark:bg-graphite-700' : ''}`} readOnly={!!currentUser?.displayName} /> </div> <div> <label htmlFor="newCommentModal" className="block text-sm font-medium text-gray-700 dark:text-dark-text-main mb-1 transition-theme">留言內容*</label> <textarea id="newCommentModal" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="請輸入留言內容..." rows="4" className="w-full border border-gray-300 dark:border-graphite-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-glory-red-500 dark:bg-dark-surface dark:text-dark-text-main resize-none transition-theme" /> </div> </div> <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-graphite-600 mt-4 transition-theme"> <button type="button" onClick={closeCommentModal} className="bg-graphite-200 hover:bg-graphite-300 text-graphite-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium" disabled={isAddingComment}> 取消 </button> <button type="button" onClick={() => { if (currentRequestForComment) { addComment(currentRequestForComment.id); } }} className="bg-glory-red-500 hover:bg-glory-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50" disabled={isAddingComment || !newComment.trim()} > {isAddingComment && <SpinnerIcon />} {isAddingComment ? '傳送中...' : '送出留言'} </button> </div> </div> </div>)}

      {/* 轉交報帳彈窗 */}
      <TransferReimbursementModal
        isOpen={showTransferModal}
        onClose={handleCloseTransferModal}
        currentRequest={selectedRequestForTransfer}
        onTransferComplete={handleTransferComplete}
      />

      {/* Toast 通知 */}
      <ToastNotification
        message={toastMessage}
        type={toastType}
        errorType={toastErrorType}
        isVisible={showToast}
        onClose={hideToastNotification}
        duration={5000}
        showRetry={toastType === 'error' && ['network', 'timeout', 'server'].includes(toastErrorType)}
        onRetry={() => {
          hideToastNotification();
          fetchRequests();
        }}
      />
    </>
  );
};

export default PurchaseRequestBoard;