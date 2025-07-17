import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, 
         signOut as firebaseSignOut, 
         signInWithEmailAndPassword, 
         GoogleAuthProvider, 
         signInWithPopup,
         createUserWithEmailAndPassword, // 用於註冊
         updateProfile, // 用於註冊時更新姓名 & 用戶自行編輯姓名 
         reload // 引入 reload 函式
       }from 'firebase/auth';
import { auth, firestore } from './firebaseConfig'; // Ensure this path is correct
import { doc, getDoc, setDoc } from 'firebase/firestore';



const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // <-- 新增 userProfile 狀態
  const [loading, setLoading] = useState(true);
  const [isReimburser, setIsReimburser] = useState(false);
  const [userRoles, setUserRoles] = useState([]);

  // Example login function (add more like signUp, etc.)
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 👇 2. 新增一個 Google 登入的函式
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };
  
  const logout = () => {
    return firebaseSignOut(auth);
  };

  // --- 註冊功能新增的函式 ---
  const signUp = async (name, email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      // ⭐ 新增：強制刷新 ID Token，確保最新的 displayName 包含在下一個請求中
      await auth.currentUser.getIdToken(true); 
    }
    return userCredential;
  };

  // --- 編輯功能新增的函式 ---
  const updateUserProfile = async (profileData) => {
    if (!auth.currentUser) throw new Error("No user is currently signed in.");
    await updateProfile(auth.currentUser, profileData);
    // ⭐ 關鍵修改：
    // 在更新 profile 後，呼叫 reload() 來強制 Firebase SDK 更新內部狀態的 currentUser
    // 然後再強制刷新 ID Token，確保最新的 displayName 包含在下一個請求中
    await reload(auth.currentUser); // 使用 Firebase SDK 的 reload 函式來更新 auth.currentUser 物件
    await auth.currentUser.getIdToken(true); 

    // 直接使用更新後的 auth.currentUser 來設定狀態，而非自己創建新物件
    setCurrentUser(auth.currentUser); 
  };

// --- ✨✨✨ 新增：一個專門用來更新 Firestore user profile 的函式 ✨✨✨ ---
const updateUserPreferences = async (preferences) => {
  if (!currentUser) throw new Error("User not authenticated");
  const userDocRef = doc(firestore, 'users', currentUser.uid);
  await setDoc(userDocRef, preferences, { merge: true });
  // 更新成功後，同步更新本地的 userProfile 狀態
  setUserProfile(prevProfile => ({ ...prevProfile, ...preferences }));
};

  useEffect(() => {
    // --- 修改開始 ---
    // 3. 將 onAuthStateChanged 的回呼函式改為 async，以便在內部使用 await
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // 4. 如果有使用者登入，就去 Firestore 讀取他的角色文件
      if (user) {
        const userDocRef = doc(firestore, 'users', user.uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUserProfile(userData); // <-- ✨ 設定 userProfile
            const roles = userData.roles || []; // 從文件中取得 roles 陣列
            setUserRoles(roles); // 儲存角色陣列
            
            // 檢查是否包含報帳權限的角色
            setIsReimburser(roles.includes('reimbursementContact'));
          } else {
            // 如果找不到使用者文件，預設為沒有權限
            console.warn("User document not found in Firestore for UID:", user.uid);
            setUserProfile(null); // <-- ✨ 清空 userProfile
            setUserRoles([]);
            setIsReimburser(false);
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setUserProfile(null); // <-- ✨ 清空 userProfile
          setUserRoles([]);
          setIsReimburser(false);
        }
      } else {
        // 5. 如果使用者登出，清除角色狀態
        setUserProfile(null); // <-- ✨ 清空 userProfile
        setUserRoles([]);
        setIsReimburser(false);
      }
      
      // 6. 將 setLoading(false) 移到所有非同步操作完成後，確保權限狀態也已就緒
      setLoading(false);
    });
    // --- 修改結束 ---
    return unsubscribe; // Cleanup subscription on unmount
  }, []);

  const value = {
    currentUser,
    userProfile, // <-- 匯出 userProfile
    login,
    signInWithGoogle, // <--- 3. 將新函式匯出
    logout,
    signUp, // 註冊
    updateUserProfile, // 編輯
    updateUserPreferences, // <-- ✨ 匯出新的偏好設定更新函式
    // 7. 將新的權限狀態和角色列表匯出，供其他元件使用
    isReimburser,
    userRoles
    // --- 修改結束 ---
    // Add other auth functions like signup, passwordReset, etc.
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
