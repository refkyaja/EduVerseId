import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { apiService } from '../services/apiService';
import { INITIAL_CLASSES, INITIAL_QUIZZES } from '../data/mockData';

const AppStateContext = createContext();

const INITIAL_STATE = {
  xp: 0,
  streak: 0,
  examsCompleted: 0,
  correctAnswers: 0,
  totalQuestionsAttempted: 0,
  subjectStats: {},
  powerUps: { hint: 3, shield: 2, freeze: 1, combo: 5 },
  darkMode: true
};

/**
 * Calculates user Level, XP progress, and max XP for current level.
 * Level starts at Level 0 (0 XP).
 * Cost to level up increases progressively (+50 XP per level).
 * Level 0 -> 1: 100 XP
 * Level 1 -> 2: 150 XP
 * Level 2 -> 3: 200 XP ...
 */
export function getLevelInfo(totalXp = 0) {
  let xp = Math.max(0, Number(totalXp) || 0);
  let level = 0;
  let costForNextLevel = 100;

  while (xp >= costForNextLevel) {
    xp -= costForNextLevel;
    level += 1;
    costForNextLevel += 50;
  }

  const percent = Math.min(100, Math.round((xp / costForNextLevel) * 100));

  return {
    level,
    progress: xp,
    max: costForNextLevel,
    percent,
    totalXp: Number(totalXp) || 0
  };
}

function migrateLegacyStorage() {
  try {
    const legacyGlobal = localStorage.getItem('eduquest_state');
    if (legacyGlobal) {
      if (!localStorage.getItem('eduverse_state')) {
        localStorage.setItem('eduverse_state', legacyGlobal);
      }
      localStorage.removeItem('eduquest_state');
    }

    const legacyKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf('eduquest_') === 0) {
        legacyKeys.push(key);
      }
    }

    for (let i = 0; i < legacyKeys.length; i++) {
      const oldKey = legacyKeys[i];
      const newKey = oldKey.replace('eduquest_', 'eduverse_');
      const oldValue = localStorage.getItem(oldKey);
      if (!localStorage.getItem(newKey) && oldValue) {
        localStorage.setItem(newKey, oldValue);
      }
      localStorage.removeItem(oldKey);
    }
  } catch (e) {
    console.error("Migrasi storage gagal:", e);
  }
}

migrateLegacyStorage();

export function AppStateProvider({ children }) {
  const loadStateForUser = (user) => {
    if (!user || !user.id) return INITIAL_STATE;
    const userKey = `eduverse_state_${user.id}`;
    const legacyUserKey = `eduquest_state_${user.id}`;
    try {
      let stored = localStorage.getItem(userKey);
      if (!stored) {
        stored = localStorage.getItem(legacyUserKey) || localStorage.getItem('eduverse_state') || localStorage.getItem('eduquest_state');
        if (stored) {
          localStorage.setItem(userKey, stored);
          localStorage.removeItem(legacyUserKey);
        }
      }
      if (stored) {
        return { ...INITIAL_STATE, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error("Failed to parse user state:", e);
    }
    return {
      ...INITIAL_STATE,
      xp: Number(user.xp ?? user.totalXp ?? 0),
      streak: Number(user.streak ?? 0),
      examsCompleted: Number(user.exams_completed ?? 0),
      correctAnswers: 0,
      totalQuestionsAttempted: 0,
      subjectStats: {}
    };
  };

  const [currentUser, setCurrentUser] = useState(() => authService.getStoredUser());
  const [appState, setAppState] = useState(() => loadStateForUser(currentUser));
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    try {
      const key = currentUser?.id ? `eduverse_state_${currentUser.id}` : 'eduverse_state';
      localStorage.setItem(key, JSON.stringify(appState));
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [appState, currentUser?.id]);

  // Sync dark mode class to html element
  useEffect(() => {
    if (appState.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appState.darkMode]);

  // Sync user profile & user classes on mount or token change
  useEffect(() => {
    if (authService.getToken()) {
      authService.getProfile()
        .then(user => {
          if (user) {
            setCurrentUser(user);
            setAppState(loadStateForUser(user));
          }
        })
        .catch(err => {
          console.warn('Auto profile fetch failed:', err);
        });
      fetchUserClasses();
    } else {
      setClassList([]);
      setAppState(INITIAL_STATE);
    }
  }, []);

  const [classList, setClassList] = useState([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(Boolean(authService.getToken()));

  const fetchUserClasses = async () => {
    if (!authService.getToken()) {
      setClassList([]);
      setIsLoadingClasses(false);
      return [];
    }
    setIsLoadingClasses(true);
    try {
      const classes = await apiService.getClasses();
      setClassList(classes);
      return classes;
    } catch (e) {
      console.warn("Failed to fetch user classes from API:", e);
      setClassList([]);
      return [];
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const toggleDarkMode = () => {
    setAppState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2300);
  };

  const recordExamResult = (earnedXp = 0, correctCount = 0, totalQuestions = 0, subjectCode = 'UMUM', classId = null) => {
    if (classId) {
      addClassXp(classId, earnedXp);
    }
    setAppState(prev => {
      const prevTotalQ = prev.totalQuestionsAttempted || (prev.correctAnswers ? prev.correctAnswers : 0);
      const newTotalQ = prevTotalQ + (totalQuestions || 0);
      const newCorrect = (prev.correctAnswers || 0) + (correctCount || 0);
      const newXp = (prev.xp || 0) + (earnedXp || 0);
      const newExams = (prev.examsCompleted || 0) + 1;
      const newStreak = (prev.streak || 0) + 1;

      const sCode = (subjectCode || 'UMUM').toUpperCase();
      const currentSub = prev.subjectStats?.[sCode] || { correct: 0, total: 0 };
      const updatedSub = {
        ...(prev.subjectStats || {}),
        [sCode]: {
          correct: currentSub.correct + (correctCount || 0),
          total: currentSub.total + (totalQuestions || 0)
        }
      };

      return {
        ...prev,
        xp: newXp,
        examsCompleted: newExams,
        correctAnswers: newCorrect,
        totalQuestionsAttempted: newTotalQ,
        subjectStats: updatedSub,
        streak: newStreak
      };
    });

    setCurrentUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        xp: (prev.xp || 0) + earnedXp,
        exams_completed: (prev.exams_completed || 0) + 1,
        streak: (prev.streak || 0) + 1,
      };
    });
  };

  const loginUser = async (credentials) => {
    const res = await authService.login(credentials);
    if (res.data?.user) {
      setCurrentUser(res.data.user);
      setAppState(loadStateForUser(res.data.user));
      await fetchUserClasses();
      showToast(`Selamat datang kembali, ${res.data.user.name}!`);
    }
    return res;
  };

  const registerUser = async (data) => {
    const res = await authService.register(data);
    if (res.data?.user) {
      setCurrentUser(res.data.user);
      setAppState(loadStateForUser(res.data.user));
      await fetchUserClasses();
      showToast(`Akun ${res.data.user.name} berhasil terdaftar di database!`);
    }
    return res;
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updated = await authService.updateProfile(profileData);
      setCurrentUser(prev => ({ ...prev, ...updated }));
      return updated;
    } catch (err) {
      console.warn("Backend profile sync notice:", err);
      const newObj = { ...(currentUser || {}), ...profileData };
      setCurrentUser(newObj);
      localStorage.setItem('eduverse_user', JSON.stringify(newObj));
      return newObj;
    }
  };

  const logoutUser = async () => {
    await authService.logout();
    setCurrentUser(null);
    setClassList([]);
    setAppState(INITIAL_STATE);
    setMateriList([]);
    setQuizList(INITIAL_QUIZZES);
    localStorage.removeItem('eduverse_classes');
    localStorage.removeItem('eduverse_user_classes');
    localStorage.removeItem('eduverse_materi');
    localStorage.removeItem('eduverse_quizzes');
    localStorage.removeItem('eduverse_state');
    localStorage.removeItem('eduquest_state');
    if (currentUser && currentUser.id) {
      localStorage.removeItem(`eduverse_state_${currentUser.id}`);
      localStorage.removeItem(`eduquest_state_${currentUser.id}`);
    }
    localStorage.removeItem('eduverse_user');
    localStorage.removeItem('eduverse_token');
    showToast("Anda telah keluar dari akun.");
  };

  const [classXpMap, setClassXpMap] = useState({
    'cls-101': 1250,
    'cls-102': 850,
    'cls-103': 450,
  });

  const getClassXp = (classId) => {
    if (!classId) return currentUser?.xp || appState?.xp || 0;
    if (classXpMap[classId] !== undefined) {
      return classXpMap[classId];
    }
    return currentUser?.xp || appState?.xp || 0;
  };

  const addClassXp = (classId, amount) => {
    if (!classId) return;
    setClassXpMap(prev => ({
      ...prev,
      [classId]: (prev[classId] || 0) + amount,
    }));
  };

  const registerClass = (newCls) => {
    setClassList(prev => {
      const exists = prev.some(c => c.id === newCls.id);
      if (exists) return prev;
      return [newCls, ...prev];
    });
  };

  const findClass = (classId) => {
    if (!classId) return null;
    const found = classList.find(c => String(c.id) === String(classId) || c.code === String(classId));
    if (found) return found;
    if (String(classId).startsWith('cls-')) {
      return {
        id: classId,
        name: "Kelas Saya",
        description: "Ruang kelas digital EduVerse",
        code: String(classId).slice(-6).toUpperCase(),
        memberCount: 1,
        role: currentUser?.activeRole || "member",
      };
    }
    return null;
  };

  const updateClassInfo = (classId, newDetails) => {
    if (!classId) return;
    setClassList(prev => {
      const existingIdx = prev.findIndex(c => String(c.id) === String(classId));
      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        const existingCode = updated[existingIdx].code;
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...newDetails,
          code: newDetails.code || existingCode || String(classId).slice(-6).toUpperCase()
        };
      } else {
        const fallbackClass = {
          id: classId,
          name: newDetails.name || "Kelas Saya",
          description: newDetails.description || "Ruang kelas digital EduVerse",
          code: newDetails.code || String(classId).slice(-6).toUpperCase(),
          memberCount: 1,
          role: "owner",
          ...newDetails
        };
        updated = [fallbackClass, ...prev];
      }
      try {
        localStorage.setItem('eduverse_classes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [materiList, setMateriList] = useState(() => {
    try {
      const stored = localStorage.getItem('eduverse_materi');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  const addMateri = (newMateri) => {
    setMateriList(prev => {
      const updated = [newMateri, ...prev];
      try {
        localStorage.setItem('eduverse_materi', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const updateMateriInState = (materiId, updatedFields) => {
    setMateriList(prev => {
      const updated = prev.map(m => {
        if (String(m.id) === String(materiId)) {
          return { ...m, ...updatedFields };
        }
        return m;
      });
      try {
        localStorage.setItem('eduverse_materi', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const [quizList, setQuizList] = useState(() => {
    try {
      const stored = localStorage.getItem('eduverse_quizzes');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_QUIZZES;
  });

  const addQuiz = (newQuiz) => {
    setQuizList(prev => {
      const updated = [newQuiz, ...prev];
      try {
        localStorage.setItem('eduverse_quizzes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  return (
    <AppStateContext.Provider value={{
      appState,
      setAppState,
      currentUser,
      setCurrentUser,
      classList,
      isLoadingClasses,
      fetchUserClasses,
      registerClass,
      findClass,
      updateClassInfo,
      materiList,
      addMateri,
      updateMateriInState,
      quizList,
      addQuiz,
      classXpMap,
      getClassXp,
      addClassXp,
      loginUser,
      registerUser,
      updateUserProfile,
      logoutUser,
      toggleDarkMode,
      showToast,
      toastMessage,
      recordExamResult,
      getLevelInfo
    }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
