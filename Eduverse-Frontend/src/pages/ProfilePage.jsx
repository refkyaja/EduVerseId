import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Settings, ChevronRight, ChevronDown, ShieldCheck, Users, Swords, Flame, Trophy, Award, Zap, CheckCircle2, TrendingUp, AlertCircle, BookOpen, Target, Calendar, Plus, FolderPlus, FileText, Sparkles, RefreshCcw, History, Clock, UserCheck, KeyRound, Save, Trash2, Pencil, X, XCircle, ShieldAlert, BarChart3, Copy, Check, Eye, Loader2, Search } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { INITIAL_CLASSES } from '../data/mockData';
import ClassSettingsModal from '../components/ClassSettingsModal';
import ClassAnggotaPage from './ClassAnggotaPage';
import ConfirmModal from '../components/ConfirmModal';
import MaterialVersionDropdown from '../components/MaterialVersionDropdown';
import { apiService } from '../services/apiService';

export default function ProfilePage({ initialTab }) {
  const { classId: routeClassId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { appState, userProfile, getLevelInfo, showToast, currentUser, findClass, updateClassInfo, addMateri, updateMateriInState, addQuiz, isLoadingClasses } = useAppState();

  const getTabFromPath = () => {
    if (initialTab) return initialTab;
    const path = location.pathname;
    if (path.includes('/edit-info')) return 'settings';
    if (path.includes('/add-subject')) return 'add_subject';
    if (path.includes('/add-material')) return 'add_material';
    if (path.includes('/add-quiz')) return 'add_quiz';
    if (path.includes('/verification')) return 'verification';
    if (path.includes('/members')) return 'members';
    if (path.includes('/anggota')) return 'members_view';
    if (path.includes('/audit-log')) return 'audit_log';
    return searchParams.get('tab') || 'overview';
  };

  const activeClass = routeClassId && findClass ? findClass(routeClassId) : null;
  const isApiClass = Boolean(routeClassId && !String(routeClassId).startsWith('cls-') && !isNaN(Number(routeClassId)));
  const isDemoClass = !isApiClass;

  const getActiveRole = () => {
    if (activeClass?.role) return activeClass.role.toLowerCase();
    if (isApiClass && isLoadingClasses) return null;
    if (currentUser?.activeRole) return String(currentUser.activeRole).toLowerCase();
    if (currentUser?.role && currentUser.role !== 'user') return String(currentUser.role).toLowerCase();
    if (!isLoadingClasses && isApiClass && !activeClass) return 'member';
    if (isDemoClass) return 'owner';
    return null;
  };

  const activeRole = getActiveRole();
  const isRoleLoading = activeRole === null;
  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [isManagementOpen, setIsManagementOpen] = useState(true);
  const [userRank, setUserRank] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const fetchRank = async () => {
      const targetClassId = routeClassId || activeClass?.id;
      if (targetClassId && !String(targetClassId).startsWith('cls-') && !isNaN(Number(targetClassId))) {
        try {
          const lbData = await apiService.getLeaderboard(targetClassId);
          if (isMounted && Array.isArray(lbData) && lbData.length > 0) {
            const myEntry = lbData.find(m => String(m.user_id || m.id) === String(currentUser?.id) || m.is_current_user);
            if (myEntry && (myEntry.rank || myEntry.rank === 0)) {
              setUserRank(myEntry.rank);
              return;
            }
          }
        } catch (e) {
          console.warn("Failed to fetch user rank from leaderboard:", e);
        }
      }
      if (isMounted) {
        setUserRank(1);
      }
    };

    fetchRank();
    return () => { isMounted = false; };
  }, [routeClassId, activeClass?.id, currentUser?.id]);

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname, searchParams, initialTab]);

  const handleTabClick = (tabName, routePath) => {
    setActiveTab(tabName);
    const targetClassId = routeClassId || activeClass?.id;
    if (targetClassId) {
      const targetUrl = routePath ? `/class/${targetClassId}/${routePath}` : `/class/${targetClassId}/profile`;
      window.history.replaceState(null, '', targetUrl);
    } else {
      window.history.replaceState(null, '', '/profile');
    }
  };

  // Class Info Edit State
  const [className, setClassName] = useState(activeClass?.name || 'Kelas Baru');
  const [classDesc, setClassDesc] = useState(activeClass?.description || '');
  const [classCode, setClassCode] = useState(activeClass?.code || 'EDU123');

  useEffect(() => {
    if (activeClass) {
      setClassName(activeClass.name || 'Kelas Baru');
      setClassDesc(activeClass.description || '');
      if (activeClass.code) {
        setClassCode(activeClass.code);
      }
    }
  }, [activeClass?.id, activeClass?.name, activeClass?.description, activeClass?.code]);

  // DB Mapel & Materi Dynamic States
  const [dbMapelList, setDbMapelList] = useState([]);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);

  const [dbMateriList, setDbMateriList] = useState([]);
  const [isCreateMaterialOpen, setIsCreateMaterialOpen] = useState(false);

  // Edit Material State (Creating v2, v3...)
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editMaterialTitle, setEditMaterialTitle] = useState('');
  const [editMaterialSubject, setEditMaterialSubject] = useState('');
  const [editMaterialContent, setEditMaterialContent] = useState('');

  // Side-by-side Verification Preview State
  const [verifyingMaterial, setVerifyingMaterial] = useState(null);

  // Form States
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectGradient, setNewSubjectGradient] = useState('from-indigo-500 to-purple-600');
  const [editingMapel, setEditingMapel] = useState(null);
  const [editMapelCode, setEditMapelCode] = useState('');
  const [editMapelName, setEditMapelName] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);
  const [isUpdatingSubject, setIsUpdatingSubject] = useState(false);
  const [isLoadingMapel, setIsLoadingMapel] = useState(Boolean(isApiClass && routeClassId));
  const [isLoadingMateri, setIsLoadingMateri] = useState(Boolean(isApiClass && routeClassId));
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(Boolean(isApiClass && routeClassId));
  const [isLoadingMembers, setIsLoadingMembers] = useState(Boolean(isApiClass && routeClassId));

  const [dbQuizList, setDbQuizList] = useState([]);
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isUpdatingQuiz, setIsUpdatingQuiz] = useState(false);

  const [selectedMaterialMapelFilter, setSelectedMaterialMapelFilter] = useState('ALL');
  const [selectedQuizMapelFilter, setSelectedQuizMapelFilter] = useState('ALL');
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [quizSearchQuery, setQuizSearchQuery] = useState('');

  const filteredMateriList = (dbMateriList || []).filter(materi => {
    const matchesMapel = selectedMaterialMapelFilter === 'ALL' ||
      String(materi.subject || '').toUpperCase() === String(selectedMaterialMapelFilter).toUpperCase() ||
      String(materi.subjectName || '').toUpperCase().includes(String(selectedMaterialMapelFilter).toUpperCase());
    const qLower = materialSearchQuery.trim().toLowerCase();
    const matchesSearch = !qLower ||
      String(materi.title || '').toLowerCase().includes(qLower) ||
      String(materi.subject || '').toLowerCase().includes(qLower) ||
      String(materi.subjectName || '').toLowerCase().includes(qLower);
    return matchesMapel && matchesSearch;
  });

  const filteredQuizList = (dbQuizList || []).filter(quiz => {
    const matchesMapel = selectedQuizMapelFilter === 'ALL' ||
      String(quiz.subject || '').toUpperCase() === String(selectedQuizMapelFilter).toUpperCase() ||
      String(quiz.subjectName || '').toUpperCase().includes(String(selectedQuizMapelFilter).toUpperCase());
    const qLower = quizSearchQuery.trim().toLowerCase();
    const matchesSearch = !qLower ||
      String(quiz.title || '').toLowerCase().includes(qLower) ||
      String(quiz.subject || '').toLowerCase().includes(qLower) ||
      String(quiz.subjectName || '').toLowerCase().includes(qLower);
    return matchesMapel && matchesSearch;
  });

  const [confirmModalState, setConfirmModalState] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Hapus',
    variant: 'danger',
    onConfirm: () => {}
  });

  const triggerConfirmModal = ({ title, description, confirmText = 'Hapus', variant = 'danger', onConfirm }) => {
    setConfirmModalState({
      isOpen: true,
      title,
      description,
      confirmText,
      variant,
      onConfirm
    });
  };

  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialSubject, setNewMaterialSubject] = useState('');
  const [newMaterialContent, setNewMaterialContent] = useState('');

  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDesc, setNewQuizDesc] = useState('');
  const [newQuizSubject, setNewQuizSubject] = useState('');
  const [quizInputMode, setQuizInputMode] = useState('manual');
  const [acakSoal, setAcakSoal] = useState(false);
  const [acakOpsi, setAcakOpsi] = useState(false);

  const PROMPT_TEMPLATE = `Buatkan [jumlah] soal pilihan ganda tentang [topik] (bisa opsi A hingga E), masing-masing dengan format persis seperti contoh ini:

1. Apa ibu kota Indonesia?
A. Bandung
B. Jakarta
C. Surabaya
D. Medan
E. Yogyakarta
Jawaban: B
Pembahasan: Jakarta adalah ibu kota Indonesia

Pisahkan tiap soal dengan baris kosong. Jangan pakai markdown (bold/italic), jangan kasih judul atau intro di awal, dan jangan tambahkan teks lain di luar format itu.`;
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Load Mapel from DB
  useEffect(() => {
    if (isApiClass && routeClassId) {
      setIsLoadingMapel(true);
      apiService.getMapel(routeClassId)
        .then(list => {
          if (Array.isArray(list)) {
            setDbMapelList(list.map(m => ({
              id: m.id,
              kode: m.kode || 'MAPEL',
              nama: m.nama || 'Mata Pelajaran',
              warna: m.warna || 'from-indigo-500 to-purple-600'
            })));
            if (list.length > 0) {
              setNewMaterialSubject(list[0].kode);
              setNewQuizSubject(list[0].kode);
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingMapel(false);
        });
    } else {
      setIsLoadingMapel(false);
    }
  }, [isApiClass, routeClassId]);

  // Load Materi from DB
  useEffect(() => {
    if (isApiClass && routeClassId) {
      setIsLoadingMateri(true);
      apiService.getMateri(routeClassId)
        .then(list => {
          if (Array.isArray(list)) {
            setDbMateriList(list.map(m => {
              const matchedMapel = (dbMapelList || []).find(mp => String(mp.id) === String(m.mapel_id) || mp.kode === m.mapel_id) || m.mapel;
              const rawKode = m.mapel?.kode || matchedMapel?.kode || (typeof m.mapel_id === 'string' && isNaN(Number(m.mapel_id)) ? m.mapel_id : null);
              const rawNama = m.mapel?.nama || matchedMapel?.nama;
              const cleanKode = (rawKode || 'UMUM').toUpperCase();
              const cleanNama = (rawNama && rawNama !== 'Mata Pelajaran') ? rawNama : (cleanKode !== 'UMUM' ? cleanKode : 'Materi Umum');

              return {
                id: m.id,
                subject: cleanKode,
                subjectName: cleanNama,
                title: m.judul,
                content: m.versi_aktif?.isi || m.isi || '',
                version: m.versi_aktif?.nomor_versi || (m.versi && m.versi.length > 0 ? m.versi[m.versi.length - 1].nomor_versi : 1),
                status: m.versi_aktif?.status || (m.versi && m.versi.length > 0 ? m.versi[m.versi.length - 1].status : (m.status || 'menunggu_verifikasi')),
                createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Hari ini',
                author: m.creator?.name || 'Owner',
                versions: m.versi || []
              };
            }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingMateri(false);
        });
    } else {
      setIsLoadingMateri(false);
    }
  }, [isApiClass, routeClassId, dbMapelList]);

  // Load Quiz from DB
  useEffect(() => {
    if (isApiClass && routeClassId) {
      setIsLoadingQuiz(true);
      apiService.getKuis(routeClassId)
        .then(list => {
          if (Array.isArray(list)) {
            setDbQuizList(list.map(q => {
              const matchedMapel = (dbMapelList || []).find(mp => String(mp.id) === String(q.mapel_id) || mp.kode === q.mapel_id) || q.mapel;
              const rawKode = q.mapel?.kode || matchedMapel?.kode || (typeof q.mapel_id === 'string' && isNaN(Number(q.mapel_id)) ? q.mapel_id : null);
              const rawNama = q.mapel?.nama || matchedMapel?.nama;
              const cleanKode = (rawKode || 'UMUM').toUpperCase();
              const cleanNama = (rawNama && rawNama !== 'Mata Pelajaran') ? rawNama : (cleanKode !== 'UMUM' ? cleanKode : 'Kuis & Ujian Umum');

              return {
                id: q.id,
                title: q.judul || q.title || 'Ujian / Kuis',
                description: q.deskripsi || '',
                subject: cleanKode,
                subjectName: cleanNama,
                questionsCount: q.soal_count ?? q.jumlah_soal ?? (q.soal ? q.soal.length : 0),
                acak_soal: Boolean(q.acak_soal),
                acak_opsi: Boolean(q.acak_opsi),
                mapelId: q.mapel_id
              };
            }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoadingQuiz(false);
        });
    } else {
      setIsLoadingQuiz(false);
    }
  }, [isApiClass, routeClassId, dbMapelList]);

  // Load Members from DB
  const [dbMemberList, setDbMemberList] = useState([]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (isApiClass && routeClassId) {
        setIsLoadingMembers(true);
        try {
          const list = await apiService.getMembers(routeClassId);
          if (Array.isArray(list)) {
            setDbMemberList(list.map(m => ({
              id: m.id || m.user_id,
              name: m.name || m.user?.name || 'Anggota Kelas',
              username: m.username ? (m.username.startsWith('@') ? m.username : `@${m.username}`) : (m.email ? `@${m.email.split('@')[0]}` : '@user'),
              email: m.email || m.user?.email,
              role: m.role || 'member',
              avatar: m.profile_photo || m.user?.avatar || m.avatar
            })));
            return;
          }
        } catch (e) {
          console.error("Failed to load members from API:", e);
        } finally {
          setIsLoadingMembers(false);
        }
      }
      // Real member data from active class or API only (NO DUMMY DATA!)
      if (activeClass && Array.isArray(activeClass.members) && activeClass.members.length > 0) {
        setDbMemberList(activeClass.members);
      } else {
        setDbMemberList(currentUser ? [{
          id: currentUser.id || 'usr-owner',
          name: currentUser.name || activeClass?.ownerName || 'Pembuat Kelas',
          username: currentUser.email ? `@${currentUser.email.split('@')[0]}` : `@${currentUser.username || 'owner'}`,
          email: currentUser.email,
          role: activeRole || 'owner',
          avatar: currentUser.avatar
        }] : []);
      }
      setIsLoadingMembers(false);
    };
    fetchMembers();
  }, [isApiClass, routeClassId, activeClass, currentUser, activeRole]);

  const handleToggleAdminMember = async (userId, newRole) => {
    try {
      if (isApiClass && routeClassId) {
        if (newRole === 'Admin' || newRole === 'admin') {
          await apiService.promoteMember(routeClassId, userId);
        } else {
          await apiService.demoteAdmin(routeClassId, userId);
        }
      }
      setDbMemberList(prev => prev.map(mem => String(mem.id) === String(userId) ? { ...mem, role: String(newRole).toLowerCase() } : mem));
      showToast(`Role anggota berhasil diubah menjadi ${newRole}`);
    } catch (err) {
      showToast(err.message || 'Gagal mengubah role anggota', 'error');
    }
  };

  const handleKickMemberItem = async (userId) => {
    try {
      if (isApiClass && routeClassId) {
        await apiService.kickMember(routeClassId, userId);
      }
      setDbMemberList(prev => prev.filter(mem => String(mem.id) !== String(userId)));
      showToast('Anggota berhasil dikeluarkan dari kelas.');
    } catch (err) {
      showToast(err.message || 'Gagal mengeluarkan anggota', 'error');
    }
  };

  const [rawSoalText, setRawSoalText] = useState('');
  const [parsedSoalList, setParsedSoalList] = useState([]);
  const [isParsingSoal, setIsParsingSoal] = useState(false);

  // Edit parsed soal state
  const [editingSoalId, setEditingSoalId] = useState(null);
  const [editPertanyaan, setEditPertanyaan] = useState('');
  const [editOpsi, setEditOpsi] = useState([]);
  const [editJawabanHuruf, setEditJawabanHuruf] = useState('A');
  const [editPembahasan, setEditPembahasan] = useState('');

  const [manualPertanyaan, setManualPertanyaan] = useState('');
  const [manualOpsiList, setManualOpsiList] = useState([
    { huruf: 'A', teks_opsi: '' },
    { huruf: 'B', teks_opsi: '' }
  ]);
  const [manualJawaban, setManualJawaban] = useState('A');
  const [manualPembahasan, setManualPembahasan] = useState('');

  // Manual questions list state
  const [manualSoalList, setManualSoalList] = useState([]);
  const [editingManualIdx, setEditingManualIdx] = useState(null);

  // Pending materials for Owner verification
  const [pendingMaterials, setPendingMaterials] = useState([]);

  // Audit Trail Logs
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: activeClass?.ownerName || 'Pemilik Kelas', role: 'OWNER', action: `Membuat Ruang Kelas "${activeClass?.name || 'Kelas Baru'}"`, time: 'Awal Pembuatan' }
  ]);

  // Load backend log_aktivitas on mount if available
  useEffect(() => {
    if (isApiClass && routeClassId) {
      apiService.getLogAktivitas(routeClassId)
        .then(logs => {
          if (Array.isArray(logs) && logs.length > 0) {
            setAuditLogs(logs.map(l => ({
              id: l.id,
              user: l.user?.name || l.user?.username || 'User',
              role: l.peran_user || 'OWNER',
              action: l.deskripsi_aksi,
              time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
          }
        })
        .catch(err => console.warn("Notice: Log aktivitas backend tidak dimuat:", err.message));
    }
  }, [isApiClass, routeClassId]);

  // Load backend pending materials for verification tab
  useEffect(() => {
    if (isApiClass && routeClassId) {
      apiService.getMateri(routeClassId)
        .then(list => {
          if (Array.isArray(list)) {
            const pendingItems = [];
            list.forEach(m => {
              const pendingVersi = (m.versi || []).find(v => v.status === 'menunggu_verifikasi') || 
                                   (m.versi_aktif?.status === 'menunggu_verifikasi' ? m.versi_aktif : null);
              if (pendingVersi) {
                const prevV = (m.versi || []).find(v => v.nomor_versi === pendingVersi.nomor_versi - 1 || (v.status === 'terverifikasi' && String(v.id) !== String(pendingVersi.id))) || m.versi_aktif;
                pendingItems.push({
                  id: m.id,
                  versiId: pendingVersi.id,
                  subject: m.mapel?.kode || 'MATERI',
                  title: m.judul,
                  author: pendingVersi.creator?.name || pendingVersi.creator?.username || m.creator?.name || 'Admin',
                  createdAt: pendingVersi.created_at ? new Date(pendingVersi.created_at).toLocaleDateString('id-ID') : 'Hari ini',
                  prevVersion: (prevV && String(prevV.id) !== String(pendingVersi.id)) ? {
                    version: prevV.nomor_versi || 1,
                    title: m.judul,
                    content: prevV.isi || '',
                    status: prevV.status || 'terverifikasi',
                    author: prevV.creator?.name || 'Owner'
                  } : null,
                  newVersion: {
                    version: pendingVersi.nomor_versi || 1,
                    title: m.judul,
                    content: pendingVersi.isi || '',
                    status: 'menunggu_verifikasi',
                    author: pendingVersi.creator?.name || pendingVersi.creator?.username || m.creator?.name || 'Admin'
                  }
                });
              }
            });
            setPendingMaterials(pendingItems);
          }
        })
        .catch(() => {});
    }
  }, [isApiClass, routeClassId]);

  const handleApprovePending = async (materiId, versiId, title) => {
    try {
      if (isApiClass && routeClassId && versiId) {
        await apiService.verifyMateriVersi(routeClassId, versiId, { status: 'terverifikasi' });
      }
      setPendingMaterials(prev => prev.filter(m => String(m.versiId) !== String(versiId) && String(m.id) !== String(materiId)));
      setDbMateriList(prev => prev.map(m => (String(m.id) === String(materiId)) ? { ...m, status: 'terverifikasi' } : m));
      if (isApiClass && routeClassId) {
        apiService.getMateri(routeClassId).then(list => {
          if (Array.isArray(list)) {
            setDbMateriList(list.map(m => ({
              id: m.id,
              subject: (m.mapel?.kode || 'UMUM').toUpperCase(),
              subjectName: m.mapel?.nama || 'Materi Umum',
              title: m.judul,
              content: m.versi_aktif?.isi || m.isi || '',
              version: m.versi_aktif?.nomor_versi || 1,
              status: m.versi_aktif?.status || 'terverifikasi',
              createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Hari ini',
              author: m.creator?.name || 'Owner',
              versions: m.versi || []
            })));
          }
        });
      }
      showToast(`Materi "${title}" berhasil diverifikasi & diterbitkan!`);
    } catch (err) {
      showToast(err.message || "Gagal memverifikasi materi");
    }
  };

  const handleRejectPending = async (materiId, versiId, title) => {
    try {
      if (isApiClass && routeClassId && versiId) {
        await apiService.verifyMateriVersi(routeClassId, versiId, { status: 'ditolak' });
      }
      setPendingMaterials(prev => prev.filter(m => String(m.versiId) !== String(versiId) && String(m.id) !== String(materiId)));
      setDbMateriList(prev => prev.map(m => (String(m.id) === String(materiId)) ? { ...m, status: 'ditolak' } : m));
      showToast(`Materi "${title}" ditolak.`);
    } catch (err) {
      showToast(err.message || "Gagal menolak materi");
    }
  };

  const displayXp = currentUser?.xp ?? appState.xp ?? 0;
  const displayExams = currentUser?.exams_completed ?? appState.examsCompleted ?? 0;
  const correctAnswers = appState.correctAnswers || 0;
  const totalQuestionsAttempted = appState.totalQuestionsAttempted || (displayExams > 0 ? displayExams * 5 : 0);

  const displayAccuracy = totalQuestionsAttempted > 0
    ? Math.min(100, Math.round((correctAnswers / totalQuestionsAttempted) * 100))
    : 0;

  const displayStreak = currentUser?.streak ?? appState.streak ?? 0;
  const levelInfo = getLevelInfo(displayXp);

  // Subject Performance Analysis
  const subjectStats = appState.subjectStats || {};
  const MAPEL_NAME_MAP = {
    IND: 'Bahasa Indonesia',
    BIND: 'Bahasa Indonesia',
    MTK: 'Matematika',
    PWP: 'Pemrograman Web',
    WEB: 'Pemrograman Web',
    PPAN: 'Pendidikan Pancasila',
    PKN: 'Pendidikan Pancasila',
    ING: 'Bahasa Inggris',
    BING: 'Bahasa Inggris',
    PABP: 'Pendidikan Agama & Budi Pekerti',
    IPA: 'Ilmu Pengetahuan Alam',
    IPS: 'Ilmu Pengetahuan Sosial',
    UMUM: 'Umum'
  };

  const subjectPerformanceList = Object.entries(subjectStats)
    .filter(([_, stat]) => stat && stat.total > 0)
    .map(([code, stat]) => {
      const acc = Math.round((stat.correct / stat.total) * 100);
      const name = MAPEL_NAME_MAP[code.toUpperCase()] || code.toUpperCase();
      return { code, name, accuracy: acc, correct: stat.correct, total: stat.total };
    });

  const sortedSubjects = [...subjectPerformanceList].sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return b.correct - a.correct;
  });

  const topSubjects = sortedSubjects.filter(s => s.accuracy >= 50);
  const weakSubjects = [...sortedSubjects].filter(s => s.accuracy < 80).reverse();

  // Streak tracking calendar (last 7 days simulation)
  const streakDays = [
    { day: 'SEN', active: displayStreak >= 1 },
    { day: 'SEL', active: displayStreak >= 2 },
    { day: 'RAB', active: displayStreak >= 3 },
    { day: 'KAM', active: displayStreak >= 4 },
    { day: 'JUM', active: displayStreak >= 5 },
    { day: 'SAB', active: displayStreak >= 6 },
    { day: 'MIN', active: displayStreak >= 7 },
  ];

  // Badges unlock based on user stats
  const badges = [
    { icon: Trophy, title: 'Kuis Pertama', desc: 'Selesaikan 1 kuis ujian', unlocked: displayExams >= 1, color: 'bg-amber-500/10 text-amber-500' },
    { icon: Flame, title: 'Streak 3 Hari', desc: 'Belajar 3 hari berturut-turut', unlocked: displayStreak >= 3, color: 'bg-rose-500/10 text-rose-500' },
    { icon: Target, title: 'Akurasi Tinggi', desc: 'Mencapai akurasi di atas 80%', unlocked: displayAccuracy >= 80 && displayExams >= 1, color: 'bg-emerald-500/10 text-emerald-500' },
    { icon: Award, title: 'XP Hunter', desc: 'Kumpulkan 500 Total XP', unlocked: displayXp >= 500, color: 'bg-purple-500/10 text-purple-500' },
  ];

  const recentActivity = [];

  const handleSaveClassInfo = async (e) => {
    e.preventDefault();
    try {
      let updatedRes;
      if (isApiClass && routeClassId) {
        updatedRes = await apiService.updateClass(routeClassId, { name: className, description: classDesc });
      }
      const finalName = updatedRes?.name || className;
      const finalDesc = updatedRes?.description || classDesc;
      const finalCode = updatedRes?.code || classCode;

      setClassName(finalName);
      setClassDesc(finalDesc);
      if (updatedRes?.code) setClassCode(updatedRes.code);

      if (updateClassInfo) {
        updateClassInfo(routeClassId || activeClass?.id, { name: finalName, description: finalDesc, code: finalCode });
      }
      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Owner',
        role: activeRole.toUpperCase(),
        action: `Memperbarui nama kelas menjadi "${finalName}"`,
        time: 'Baru saja'
      };
      setAuditLogs([newLog, ...auditLogs]);
      showToast("Informasi kelas berhasil diperbarui!");
    } catch (err) {
      if (updateClassInfo) {
        updateClassInfo(routeClassId || activeClass?.id, { name: className, description: classDesc, code: classCode });
      }
      showToast(err.message || "Gagal memperbarui kelas", 'error');
    }
  };

  const [copiedClassCode, setCopiedClassCode] = useState(false);

  const handleCopyClassCode = () => {
    if (!classCode) return;
    navigator.clipboard.writeText(classCode);
    setCopiedClassCode(true);
    showToast(`Kode kelas "${classCode}" berhasil disalin!`);
    setTimeout(() => setCopiedClassCode(false), 2000);
  };

  const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false);

  const executeRegenCode = async () => {
    try {
      let newC = Math.random().toString(36).substring(2, 8).toUpperCase();
      if (isApiClass && routeClassId) {
        const res = await apiService.regenerateClassCode(routeClassId);
        if (res?.code) newC = res.code;
      }
      setClassCode(newC);
      if (updateClassInfo) {
        updateClassInfo(routeClassId || activeClass?.id, { code: newC, name: className, description: classDesc });
      }
      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Owner',
        role: 'OWNER',
        action: `Membuat Ulang Kode Kelas menjadi "${newC}"`,
        time: 'Baru saja'
      };
      setAuditLogs([newLog, ...auditLogs]);
      showToast(`Kode kelas baru berhasil dibuat: "${newC}"`);
    } catch (err) {
      showToast(err.message || "Gagal meregenerasi kode kelas", 'error');
    }
  };

  const handleRegenCode = () => {
    setIsRegenConfirmOpen(true);
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (isSavingSubject) return;

    const trimmedName = newSubjectName.trim();
    const trimmedCode = newSubjectCode.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) return;

    // Check duplicate locally first
    const isDuplicate = dbMapelList.some(
      m => (m.kode && m.kode.toUpperCase() === trimmedCode) ||
           (m.nama && m.nama.trim().toLowerCase() === trimmedName.toLowerCase())
    );

    if (isDuplicate) {
      showToast(`Mata pelajaran "${trimmedName}" atau kode "${trimmedCode}" sudah ada di kelas ini!`, 'error');
      return;
    }

    setIsSavingSubject(true);
    try {
      let created;
      if (isApiClass && routeClassId) {
        created = await apiService.createMapel(routeClassId, {
          nama: trimmedName,
          kode: trimmedCode,
          warna: newSubjectGradient
        });
      }
      const newMapelObj = created ? {
        id: created.id,
        kode: created.kode || trimmedCode,
        nama: created.nama || trimmedName,
        warna: created.warna || newSubjectGradient
      } : {
        id: `mapel-${Date.now()}`,
        nama: trimmedName,
        kode: trimmedCode,
        warna: newSubjectGradient
      };

      setDbMapelList(prev => [...prev, newMapelObj]);

      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Refky Satria',
        role: activeRole.toUpperCase(),
        action: `Menambahkan Mata Pelajaran Baru "${trimmedName}" (${trimmedCode})`,
        time: 'Baru saja'
      };

      setAuditLogs(prev => [newLog, ...prev]);
      showToast(`Mata Pelajaran "${trimmedName}" berhasil ditambahkan!`);
      setNewSubjectName('');
      setNewSubjectCode('');
      setIsCreateSubjectOpen(false);
    } catch (err) {
      showToast(err.message || "Gagal menambahkan mata pelajaran", 'error');
    } finally {
      setIsSavingSubject(false);
    }
  };

  const handleOpenEditMapel = (mapel) => {
    setEditingMapel(mapel);
    setEditMapelCode(mapel.kode || '');
    setEditMapelName(mapel.nama || '');
  };

  const handleUpdateMapel = async (e) => {
    e.preventDefault();
    if (isUpdatingSubject) return;

    const trimmedName = editMapelName.trim();
    const trimmedCode = editMapelCode.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) return;

    // Check duplicate excluding current mapel
    const isDuplicate = dbMapelList.some(
      m => m.id !== editingMapel?.id && (
        (m.kode && m.kode.toUpperCase() === trimmedCode) ||
        (m.nama && m.nama.trim().toLowerCase() === trimmedName.toLowerCase())
      )
    );

    if (isDuplicate) {
      showToast(`Mata pelajaran "${trimmedName}" atau kode "${trimmedCode}" sudah ada di kelas ini!`, 'error');
      return;
    }

    setIsUpdatingSubject(true);
    try {
      if (isApiClass && routeClassId && editingMapel?.id) {
        await apiService.updateMapel(routeClassId, editingMapel.id, {
          kode: trimmedCode,
          nama: trimmedName,
        });
      }
      setDbMapelList(prev => prev.map(m => m.id === editingMapel.id ? { ...m, kode: trimmedCode, nama: trimmedName } : m));
      setEditingMapel(null);
      showToast(`Mata Pelajaran "${trimmedName}" berhasil diperbarui!`);
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui mata pelajaran', 'error');
    } finally {
      setIsUpdatingSubject(false);
    }
  };

  const handleDeleteMapel = (mapelId, mapelNama) => {
    triggerConfirmModal({
      title: 'Hapus Mata Pelajaran',
      description: `Apakah Anda yakin ingin menghapus Mata Pelajaran "${mapelNama}"? Data yang sudah dihapus tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus Mapel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (isApiClass && routeClassId && mapelId) {
            await apiService.deleteMapel(routeClassId, mapelId);
          }
          setDbMapelList(prev => prev.filter(m => m.id !== mapelId));
          if (editingMapel && String(editingMapel.id) === String(mapelId)) {
            setEditingMapel(null);
            setNewSubjectName('');
            setNewSubjectCode('');
          }
          showToast(`Mapel "${mapelNama}" berhasil dihapus!`);
        } catch (err) {
          showToast(err.message || 'Gagal menghapus mata pelajaran', 'error');
        }
      }
    });
  };

  const handleDeleteMateri = (materiId, materiTitle) => {
    triggerConfirmModal({
      title: 'Hapus Materi Pembelajaran',
      description: `Apakah Anda yakin ingin menghapus Materi "${materiTitle}"? Data yang sudah dihapus tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus Materi',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (isApiClass && routeClassId && materiId) {
            await apiService.deleteMateri(routeClassId, materiId);
          }
          setDbMateriList(prev => prev.filter(m => m.id !== materiId));
          if (editingMaterial && String(editingMaterial.id) === String(materiId)) {
            setEditingMaterial(null);
            setEditMaterialTitle('');
            setEditMaterialContent('');
          }
          showToast(`Materi "${materiTitle}" berhasil dihapus!`);
        } catch (err) {
          showToast(err.message || 'Gagal menghapus materi', 'error');
        }
      }
    });
  };

  const handleDeleteMateriVersion = (materiObj, versionObj) => {
    const verNum = Number(versionObj.nomor_versi || versionObj.version || 1);
    const versiId = versionObj.id;

    triggerConfirmModal({
      title: `Hapus Versi v${verNum}`,
      description: `Apakah Anda yakin ingin menghapus Versi v${verNum} dari materi "${materiObj.title || materiObj.judul}"?`,
      confirmText: 'Ya, Hapus Versi',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (isApiClass && routeClassId && versiId) {
            await apiService.deleteMateriVersion(routeClassId, versiId);
          }

          setDbMateriList(prev => prev.map(m => {
            if (m.id === materiObj.id || String(m.id) === String(materiObj.id)) {
              const filterFn = v => (versiId && v.id ? String(v.id) !== String(versiId) : Number(v.nomor_versi || v.version) !== verNum);
              const newVersi = (m.versi || []).filter(filterFn);
              const newVersions = (m.versions || []).filter(filterFn);

              return {
                ...m,
                versi: newVersi,
                versions: newVersions
              };
            }
            return m;
          }));

          showToast(`Versi v${verNum} berhasil dihapus!`);
        } catch (err) {
          showToast(err.message || 'Gagal menghapus versi materi', 'error');
        }
      }
    });
  };

  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialTitle.trim() || !newMaterialContent.trim()) return;

    const isOwner = activeRole === 'owner';
    const selectedMapelObj = dbMapelList.find(m => m.kode === newMaterialSubject || String(m.id) === String(newMaterialSubject)) || dbMapelList[0];
    const cleanKode = selectedMapelObj?.kode || (typeof newMaterialSubject === 'string' && isNaN(Number(newMaterialSubject)) ? newMaterialSubject : 'UMUM');
    const cleanNama = selectedMapelObj?.nama || cleanKode;

    try {
      let createdApi;
      if (isApiClass && routeClassId) {
        createdApi = await apiService.createMateri(routeClassId, {
          judul: newMaterialTitle,
          isi: newMaterialContent,
          mapel_id: selectedMapelObj?.id || null,
          mapel_kode: cleanKode,
          mapel_nama: cleanNama
        });
      }

      const createdContent = newMaterialContent.trim();
      const materiObject = {
        id: createdApi?.id || `mat-${Date.now()}`,
        classId: routeClassId || activeClass?.id || 'global',
        subject: cleanKode,
        subjectName: cleanNama,
        title: newMaterialTitle.trim(),
        content: createdContent,
        contentV1: createdContent,
        num: '01',
        status: isOwner ? 'terverifikasi' : 'menunggu_verifikasi',
        version: 1,
        author: currentUser?.name || 'Owner',
        createdAt: 'Baru saja',
        versions: [{ version: 1, content: createdContent, isi: createdContent, nomor_versi: 1 }],
        versi: [{ version: 1, content: createdContent, isi: createdContent, nomor_versi: 1 }]
      };

      if (addMateri) {
        addMateri(materiObject);
      }
      setDbMateriList(prev => [materiObject, ...prev]);

      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Owner',
        role: activeRole.toUpperCase(),
        action: isOwner
          ? `Membuat & menerbitkan materi "${newMaterialTitle}" (Terverifikasi)`
          : `Mengajukan materi baru "${newMaterialTitle}" (Menunggu Verifikasi)`,
        time: 'Baru saja'
      };

      setAuditLogs([newLog, ...auditLogs]);
      showToast(
        isOwner
          ? `Materi "${newMaterialTitle}" berhasil dipublikasikan!`
          : `Materi "${newMaterialTitle}" diajukan! Menunggu Verifikasi Owner.`
      );

      setNewMaterialTitle('');
      setNewMaterialContent('');
      setIsCreateMaterialOpen(false);
    } catch (err) {
      showToast(err.message || "Gagal membuat materi");
    }
  };

  const handleOpenEditMaterial = (materi) => {
    setEditingMaterial(materi);
    setEditMaterialTitle(materi.title || materi.judul || '');
    setEditMaterialSubject(materi.subject || materi.mapel?.kode || 'PWP');
    setEditMaterialContent(materi.content || materi.isi || '');
    setIsCreateMaterialOpen(false);
  };

  const handleUpdateExistingMaterial = async (e) => {
    e.preventDefault();
    if (!editingMaterial || !editMaterialTitle.trim() || !editMaterialContent.trim()) return;

    const isOwner = activeRole === 'owner';
    const originalContent = (editingMaterial.contentV1 || editingMaterial.content || editingMaterial.isi || '').trim();
    const newContent = editMaterialContent.trim();
    const isContentChanged = originalContent !== newContent;

    const currentVersionNum = editingMaterial.version || 1;
    const nextVer = isContentChanged ? currentVersionNum + 1 : currentVersionNum;
    const newStatus = isOwner ? 'terverifikasi' : 'menunggu_verifikasi';

    const selectedMapelObj = dbMapelList.find(m => m.kode === editMaterialSubject || String(m.id) === String(editMaterialSubject));
    const cleanKode = selectedMapelObj?.kode || (typeof editMaterialSubject === 'string' && isNaN(Number(editMaterialSubject)) ? editMaterialSubject : 'UMUM');
    const cleanNama = selectedMapelObj?.nama || cleanKode;

    try {
      if (isApiClass && routeClassId) {
        await apiService.updateMateri(routeClassId, editingMaterial.id, {
          judul: editMaterialTitle,
          isi: editMaterialContent,
          mapel_id: selectedMapelObj?.id || null,
          mapel_kode: cleanKode,
          mapel_nama: cleanNama
        });
      }

      const prevVersions = editingMaterial.versions || editingMaterial.versi || [
        { version: 1, nomor_versi: 1, content: originalContent, isi: originalContent, creator: { name: currentUser?.name || 'Owner' } }
      ];

      const updatedContentV1 = editingMaterial.contentV1 || originalContent;
      let newVersions = prevVersions;
      if (isContentChanged) {
        const hasV1 = prevVersions.some(v => Number(v.version || v.nomor_versi) === 1);
        const filtered = prevVersions.filter(v => Number(v.version || v.nomor_versi) !== nextVer);
        const nextVerObj = {
          id: 'v' + nextVer + '-' + Date.now(),
          version: nextVer,
          nomor_versi: nextVer,
          content: newContent,
          isi: newContent,
          status: newStatus,
          creator: { name: currentUser?.name || 'Owner' },
          created_at: new Date().toISOString()
        };
        newVersions = [...filtered, nextVerObj];
        if (!hasV1) {
          newVersions.unshift({
            id: 'v1-' + Date.now(),
            version: 1,
            nomor_versi: 1,
            content: updatedContentV1,
            isi: updatedContentV1,
            status: 'terverifikasi',
            creator: { name: currentUser?.name || 'Owner' },
            created_at: new Date().toISOString()
          });
        }
        newVersions.sort((a, b) => Number(a.nomor_versi || a.version || 0) - Number(b.nomor_versi || b.version || 0));
      }

      const updatedFields = {
        title: editMaterialTitle.trim(),
        subject: cleanKode,
        subjectName: cleanNama,
        content: (isOwner || !isContentChanged) ? newContent : editingMaterial.content,
        version: isOwner && isContentChanged ? nextVer : editingMaterial.version,
        status: isOwner ? (isContentChanged ? 'terverifikasi' : editingMaterial.status) : editingMaterial.status,
        contentV1: updatedContentV1,
        versions: newVersions,
        versi: newVersions
      };

      setDbMateriList(prev => prev.map(m => {
        if (m.id === editingMaterial.id) {
          return { ...m, ...updatedFields };
        }
        return m;
      }));

      if (isApiClass && routeClassId) {
        apiService.getMateri(routeClassId).then(list => {
          if (Array.isArray(list)) {
            setDbMateriList(list.map(m => {
              const matchedMapel = (dbMapelList || []).find(mp => String(mp.id) === String(m.mapel_id) || mp.kode === m.mapel_id) || m.mapel;
              const rawKode = m.mapel?.kode || matchedMapel?.kode || (typeof m.mapel_id === 'string' && isNaN(Number(m.mapel_id)) ? m.mapel_id : null);
              const rawNama = m.mapel?.nama || matchedMapel?.nama;
              const cleanKodeStr = (rawKode || 'UMUM').toUpperCase();
              const cleanNamaStr = (rawNama && rawNama !== 'Mata Pelajaran') ? rawNama : (cleanKodeStr !== 'UMUM' ? cleanKodeStr : 'Materi Umum');

              return {
                id: m.id,
                subject: cleanKodeStr,
                subjectName: cleanNamaStr,
                title: m.judul,
                content: m.versi_aktif?.isi || m.isi || '',
                version: m.versi_aktif?.nomor_versi || (m.versi && m.versi.length > 0 ? m.versi[m.versi.length - 1].nomor_versi : 1),
                status: m.versi_aktif?.status || (m.versi && m.versi.length > 0 ? m.versi[m.versi.length - 1].status : (m.status || 'menunggu_verifikasi')),
                createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Hari ini',
                author: m.creator?.name || 'Owner',
                versions: m.versi || []
              };
            }));
          }
        });
      }

      if (updateMateriInState) {
        updateMateriInState(editingMaterial.id, updatedFields);
      }

      if (!isOwner && isContentChanged) {
        setPendingMaterials(prev => [
          {
            id: editingMaterial.id,
            materiId: editingMaterial.id,
            subject: editMaterialSubject,
            title: editMaterialTitle.trim(),
            author: currentUser?.name || 'Admin',
            createdAt: 'Baru saja',
            prevVersion: {
              version: currentVersionNum,
              title: editingMaterial.title,
              content: editingMaterial.content,
              status: 'terverifikasi',
              author: editingMaterial.author || 'Owner'
            },
            newVersion: {
              version: nextVer,
              title: editMaterialTitle.trim(),
              content: editMaterialContent.trim(),
              status: 'menunggu_verifikasi',
              author: currentUser?.name || 'Admin'
            }
          },
          ...prev
        ]);
      }

      const actionText = isContentChanged
        ? (isOwner
          ? `Memperbarui materi "${editMaterialTitle}" ke v${nextVer} (Terverifikasi)`
          : `Mengajukan pembaruan versi v${nextVer} untuk materi "${editMaterialTitle}" (Menunggu Verifikasi)`)
        : `Memperbarui informasi materi "${editMaterialTitle}" (Tanpa perubahan versi)`;

      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Admin',
        role: activeRole.toUpperCase(),
        action: actionText,
        time: 'Baru saja'
      };

      setAuditLogs([newLog, ...auditLogs]);

      const toastText = isContentChanged
        ? (isOwner
          ? `Materi "${editMaterialTitle}" berhasil diperbarui ke v${nextVer}!`
          : `Versi v${nextVer} materi "${editMaterialTitle}" diajukan! Menunggu Verifikasi Owner.`)
        : `Informasi materi "${editMaterialTitle}" berhasil diperbarui!`;

      showToast(toastText);

      setEditingMaterial(null);
      setIsCreateMaterialOpen(false);
    } catch (err) {
      showToast(err.message || "Gagal memperbarui materi");
    }
  };

  const parseLocally = (rawText) => {
    if (!rawText.trim()) return [];
    const blocks = rawText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
    return blocks.map(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let pertanyaan = '';
      const opsi = [];
      let jawabanHuruf = '';
      let pembahasan = '';
      let status = 'valid';
      let errorMessage = '';

      lines.forEach(line => {
        const matchOpsi = line.match(/^([A-E])[\.\)]\s*(.*)/i);
        const matchKunci = line.match(/^(jawaban|kunci):\s*([A-E])/i);
        const matchBahas = line.match(/^pembahasan:\s*(.*)/i);

        if (matchOpsi) {
          const huruf = matchOpsi[1].toUpperCase();
          opsi.push({ huruf, teks_opsi: matchOpsi[2], benar: false });
        } else if (matchKunci) {
          jawabanHuruf = matchKunci[2].toUpperCase();
        } else if (matchBahas) {
          pembahasan = matchBahas[1];
        } else {
          if (opsi.length === 0 && !jawabanHuruf && !pembahasan) {
            pertanyaan += (pertanyaan ? ' ' : '') + line;
          } else if (pembahasan) {
            pembahasan += ' ' + line;
          }
        }
      });

      pertanyaan = pertanyaan.replace(/^\d+[\.\)]\s*/, '');

      if (jawabanHuruf) {
        opsi.forEach(opt => {
          if (opt.huruf === jawabanHuruf) opt.benar = true;
        });
      }

      if (!pertanyaan) {
        status = 'error';
        errorMessage = 'Pertanyaan tidak ditemukan';
      } else if (opsi.length < 2) {
        status = 'error';
        errorMessage = 'Opsi pilihan ganda minimal 2 (A, B, ...)';
      } else if (!jawabanHuruf) {
        status = 'error';
        errorMessage = 'Jawaban benar belum ditentukan (contoh: Jawaban: B)';
      } else if (!opsi.some(o => o.huruf === jawabanHuruf)) {
        status = 'error';
        errorMessage = `Kunci jawaban (${jawabanHuruf}) tidak cocok dengan opsi yang ada`;
      }

      return {
        id: Date.now() + Math.random(),
        status,
        error_message: errorMessage,
        pertanyaan,
        jenis_soal: 'pilihan_ganda',
        pembahasan,
        jawaban_benar: jawabanHuruf,
        opsi,
      };
    });
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    showToast('Prompt AI berhasil disalin!');
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleParseSoal = async (isAppend = true) => {
    if (!rawSoalText.trim()) {
      showToast('Masukkan teks soal yang akan diparse');
      return;
    }
    setIsParsingSoal(true);
    try {
      let hasil = [];
      if (isApiClass && routeClassId) {
        hasil = await apiService.parseSoalTeks(routeClassId, rawSoalText);
      } else {
        hasil = parseLocally(rawSoalText);
      }

      if (!hasil || hasil.length === 0) {
        showToast('Tidak ada soal yang berhasil terdeteksi dari teks');
        return;
      }

      const formattedHasil = hasil.map((item, idx) => ({
        ...item,
        id: item.id || (Date.now() + Math.random() + idx)
      }));

      if (isAppend && parsedSoalList.length > 0) {
        setParsedSoalList(prev => [...prev, ...formattedHasil]);
        showToast(`${formattedHasil.length} soal baru ditambahkan! Total preview: ${parsedSoalList.length + formattedHasil.length} soal`);
      } else {
        setParsedSoalList(formattedHasil);
        showToast(`${formattedHasil.length} soal berhasil diparse! Periksa preview di bawah`);
      }
      setRawSoalText('');
    } catch (err) {
      const fallback = parseLocally(rawSoalText);
      const formattedFallback = fallback.map((item, idx) => ({
        ...item,
        id: item.id || (Date.now() + Math.random() + idx)
      }));

      if (isAppend && parsedSoalList.length > 0) {
        setParsedSoalList(prev => [...prev, ...formattedFallback]);
        showToast(`${formattedFallback.length} soal baru ditambahkan via parser lokal!`);
      } else {
        setParsedSoalList(formattedFallback);
        showToast(`${formattedFallback.length} soal diparse via parser lokal`);
      }
      setRawSoalText('');
    } finally {
      setIsParsingSoal(false);
    }
  };

  const handleRemoveParsedSoal = (id) => {
    setParsedSoalList(prev => prev.filter(item => item.id !== id));
    if (editingSoalId === id) setEditingSoalId(null);
  };

  const handleStartEditParsedSoal = (item) => {
    if (!item) return;
    setEditingSoalId(item.id);
    setEditPertanyaan(item.pertanyaan || '');
    let defaultOpsi = [];
    if (Array.isArray(item.opsi) && item.opsi.length > 0) {
      defaultOpsi = item.opsi.map((o, i) => {
        if (typeof o === 'string') {
          return { huruf: String.fromCharCode(65 + i), teks_opsi: o, benar: i === 0 };
        }
        return {
          huruf: o.huruf || String.fromCharCode(65 + i),
          teks_opsi: o.teks_opsi || o.teks || '',
          benar: Boolean(o.benar)
        };
      });
    } else {
      defaultOpsi = [
        { huruf: 'A', teks_opsi: '', benar: true },
        { huruf: 'B', teks_opsi: '', benar: false },
        { huruf: 'C', teks_opsi: '', benar: false },
        { huruf: 'D', teks_opsi: '', benar: false }
      ];
    }
    setEditOpsi(defaultOpsi);
    const correctOpt = defaultOpsi.find(o => o.benar);
    setEditJawabanHuruf(correctOpt ? correctOpt.huruf : (item.jawaban_benar || 'A'));
    setEditPembahasan(item.pembahasan || '');
  };

  const handleSaveEditParsedSoal = (id) => {
    if (!editPertanyaan.trim()) {
      showToast('Pertanyaan soal tidak boleh kosong');
      return;
    }
    if (editOpsi.length < 2 || editOpsi.length > 5) {
      showToast('Opsi pilihan ganda harus 2 hingga 5 pilihan');
      return;
    }
    for (let i = 0; i < editOpsi.length; i++) {
      if (!editOpsi[i].teks_opsi.trim()) {
        const h = editOpsi[i].huruf || String.fromCharCode(65 + i);
        showToast(`Teks Opsi ${h} tidak boleh kosong`);
        return;
      }
    }
    if (!editJawabanHuruf || !editOpsi.some((o, i) => (o.huruf || String.fromCharCode(65 + i)) === editJawabanHuruf)) {
      showToast('Jawaban benar belum dipilih');
      return;
    }

    const updatedOpsi = editOpsi.map((o, idx) => {
      const huruf = o.huruf || String.fromCharCode(65 + idx);
      return {
        huruf,
        teks_opsi: o.teks_opsi.trim(),
        benar: huruf === editJawabanHuruf
      };
    });

    setParsedSoalList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'valid',
          error_message: '',
          pertanyaan: editPertanyaan.trim(),
          opsi: updatedOpsi,
          jawaban_benar: editJawabanHuruf,
          pembahasan: editPembahasan.trim()
        };
      }
      return item;
    }));

    setManualSoalList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'valid',
          error_message: '',
          pertanyaan: editPertanyaan.trim(),
          opsi: updatedOpsi,
          jawaban_benar: editJawabanHuruf,
          pembahasan: editPembahasan.trim()
        };
      }
      return item;
    }));

    setEditingSoalId(null);
    showToast('Soal berhasil diperbarui!');
  };

  const handleCancelEditParsedSoal = () => {
    setEditingSoalId(null);
  };

  const handleAddNewBlankParsedSoal = () => {
    const newId = Date.now() + Math.random();
    const newBlankItem = {
      id: newId,
      status: 'valid',
      error_message: '',
      pertanyaan: '',
      jenis_soal: 'pilihan_ganda',
      pembahasan: '',
      jawaban_benar: 'A',
      opsi: [
        { huruf: 'A', teks_opsi: '', benar: true },
        { huruf: 'B', teks_opsi: '', benar: false }
      ]
    };
    setParsedSoalList(prev => [...prev, newBlankItem]);
    handleStartEditParsedSoal(newBlankItem);
    showToast(`Soal #${parsedSoalList.length + 1} ditambahkan di paling bawah! Silakan isi pertanyaan.`);
  };

  const handleAddEditOption = () => {
    if (editOpsi.length >= 5) {
      showToast('Maksimal 5 opsi pilihan ganda');
      return;
    }
    const nextHuruf = String.fromCharCode(65 + editOpsi.length);
    setEditOpsi([...editOpsi, { huruf: nextHuruf, teks_opsi: '', benar: false }]);
  };

  const handleRemoveEditOption = () => {
    if (editOpsi.length <= 2) {
      showToast('Minimal 2 opsi pilihan ganda');
      return;
    }
    const lastOption = editOpsi[editOpsi.length - 1];
    const filtered = editOpsi.slice(0, -1);
    setEditOpsi(filtered);
    if (editJawabanHuruf === lastOption.huruf) {
      setEditJawabanHuruf(filtered[filtered.length - 1]?.huruf || 'A');
    }
  };

  const handleAddManualOption = () => {
    if (manualOpsiList.length >= 5) {
      showToast('Maksimal 5 opsi pilihan ganda');
      return;
    }
    const nextHuruf = String.fromCharCode(65 + manualOpsiList.length);
    setManualOpsiList(prev => [...prev, { huruf: nextHuruf, teks_opsi: '' }]);
  };

  const handleRemoveManualOption = () => {
    if (manualOpsiList.length <= 2) {
      showToast('Minimal 2 opsi pilihan ganda');
      return;
    }
    const lastOption = manualOpsiList[manualOpsiList.length - 1];
    const newList = manualOpsiList.slice(0, -1);
    setManualOpsiList(newList);
    if (manualJawaban === lastOption.huruf) {
      setManualJawaban('');
    }
  };

  const handleManualOptionChange = (idx, text) => {
    setManualOpsiList(prev => prev.map((o, i) => i === idx ? { ...o, teks_opsi: text } : o));
  };

  const handleResetManualForm = () => {
    setEditingManualIdx(null);
    setManualPertanyaan('');
    setManualOpsiList([
      { huruf: 'A', teks_opsi: '' },
      { huruf: 'B', teks_opsi: '' }
    ]);
    setManualJawaban('A');
    setManualPembahasan('');
  };

  const handleAddManualSoal = () => {
    if (!manualPertanyaan.trim()) {
      showToast('Pertanyaan soal harus diisi');
      return;
    }
    if (manualOpsiList.length < 2 || manualOpsiList.length > 5) {
      showToast('Jumlah opsi harus antara 2 hingga 5 opsi');
      return;
    }
    for (let i = 0; i < manualOpsiList.length; i++) {
      if (!manualOpsiList[i].teks_opsi.trim()) {
        showToast(`Teks Opsi ${manualOpsiList[i].huruf} tidak boleh kosong`);
        return;
      }
    }
    if (!manualJawaban || !manualOpsiList.some(o => o.huruf === manualJawaban)) {
      showToast('Jawaban benar belum dipilih');
      return;
    }

    const opsiArr = manualOpsiList.map(o => ({
      huruf: o.huruf,
      teks_opsi: o.teks_opsi.trim(),
      benar: o.huruf === manualJawaban
    }));

    const newSoalObj = {
      id: Date.now() + Math.random(),
      status: 'valid',
      error_message: '',
      pertanyaan: manualPertanyaan.trim(),
      jenis_soal: 'pilihan_ganda',
      pembahasan: manualPembahasan.trim() || null,
      jawaban_benar: manualJawaban,
      opsi: opsiArr
    };

    if (editingManualIdx !== null) {
      setManualSoalList(prev => prev.map((item, idx) => idx === editingManualIdx ? newSoalObj : item));
      showToast(`Soal #${editingManualIdx + 1} berhasil diperbarui!`);
      setEditingManualIdx(null);
    } else {
      setManualSoalList(prev => [...prev, newSoalObj]);
      showToast(`Soal #${manualSoalList.length + 1} berhasil ditambahkan ke daftar!`);
    }

    handleResetManualForm();
  };

  const handleEditManualSoal = (index) => {
    const target = manualSoalList[index];
    if (!target) return;
    setEditingManualIdx(index);
    setManualPertanyaan(target.pertanyaan || '');
    let opts = [];
    if (Array.isArray(target.opsi) && target.opsi.length > 0) {
      opts = target.opsi.map((o, i) => ({
        huruf: o.huruf || String.fromCharCode(65 + i),
        teks_opsi: o.teks_opsi || o.teks || ''
      }));
    } else {
      opts = [
        { huruf: 'A', teks_opsi: '' },
        { huruf: 'B', teks_opsi: '' }
      ];
    }
    setManualOpsiList(opts);
    const correctLetter = target.jawaban_benar || (target.opsi ? target.opsi.find(o => o.benar)?.huruf : 'A');
    if (opts.some(o => o.huruf === correctLetter)) {
      setManualJawaban(correctLetter);
    } else {
      setManualJawaban('');
    }
    setManualPembahasan(target.pembahasan || '');
  };

  const handleRemoveManualSoal = (index) => {
    setManualSoalList(prev => prev.filter((_, i) => i !== index));
    if (editingManualIdx === index) {
      handleResetManualForm();
    }
    showToast('Soal dihapus dari daftar');
  };

  const handleCancelEditManualSoal = () => {
    handleResetManualForm();
  };

  const handleOpenEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setNewQuizTitle(quiz.title || '');
    setNewQuizDesc(quiz.description || '');
    setNewQuizSubject(quiz.subject || 'PWP');
    setAcakSoal(Boolean(quiz.acak_soal));
    setAcakOpsi(Boolean(quiz.acak_opsi));
    setIsCreateQuizOpen(true);
  };

  const handleDeleteQuiz = (quizId, quizTitle) => {
    triggerConfirmModal({
      title: 'Hapus Quiz',
      description: `Apakah Anda yakin ingin menghapus Quiz "${quizTitle}"? Data yang sudah dihapus tidak dapat dikembalikan.`,
      confirmText: 'Ya, Hapus Quiz',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (isApiClass && routeClassId && quizId) {
            await apiService.deleteKuis(routeClassId, quizId);
          }
          setDbQuizList(prev => prev.filter(q => q.id !== quizId));
          if (editingQuiz && String(editingQuiz.id) === String(quizId)) {
            setEditingQuiz(null);
            setIsCreateQuizOpen(false);
            setNewQuizTitle('');
            setNewQuizDesc('');
            setAcakSoal(false);
            setAcakOpsi(false);
          }
          showToast(`Quiz "${quizTitle}" berhasil dihapus!`);
        } catch (err) {
          showToast(err.message || 'Gagal menghapus quiz', 'error');
        }
      }
    });
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) {
      showToast('Judul Quiz harus diisi');
      return;
    }

    if (editingQuiz) {
      const selectedMapelObj = dbMapelList.find(m => m.kode === newQuizSubject || String(m.id) === String(newQuizSubject));
      setIsUpdatingQuiz(true);
      try {
        if (isApiClass && routeClassId) {
          await apiService.updateKuis(routeClassId, editingQuiz.id, {
            judul: newQuizTitle.trim(),
            deskripsi: newQuizDesc || '',
            acak_soal: acakSoal,
            acak_opsi: acakOpsi
          });
        }
        setDbQuizList(prev => prev.map(q => q.id === editingQuiz.id ? {
          ...q,
          title: newQuizTitle.trim(),
          description: newQuizDesc || '',
          subject: selectedMapelObj?.kode || newQuizSubject,
          subjectName: selectedMapelObj?.nama || newQuizSubject,
          acak_soal: acakSoal,
          acak_opsi: acakOpsi
        } : q));
        showToast(`Quiz "${newQuizTitle}" berhasil diperbarui!`);
        setEditingQuiz(null);
        setIsCreateQuizOpen(false);
      } catch (err) {
        showToast(err.message || 'Gagal memperbarui quiz', 'error');
      } finally {
        setIsUpdatingQuiz(false);
      }
      return;
    }

    let soalPayload = [];
    if (quizInputMode === 'paste') {
      const validSoal = parsedSoalList.filter(s => s.status === 'valid');
      if (validSoal.length === 0) {
        showToast('Belum ada soal valid hasil parse untuk diterbitkan');
        return;
      }
      soalPayload = validSoal.map(s => ({
        pertanyaan: s.pertanyaan,
        jenis_soal: 'pilihan_ganda',
        pembahasan: s.pembahasan || null,
        opsi: s.opsi.map(o => ({ teks_opsi: o.teks_opsi, benar: o.benar }))
      }));
    } else {
      let finalManualList = [...manualSoalList];
      if (manualPertanyaan.trim()) {
        let isOpsiValid = manualOpsiList.length >= 2 && manualOpsiList.every(o => o.teks_opsi.trim() !== '');
        if (!isOpsiValid) {
          showToast('Teks opsi pada form soal saat ini tidak boleh ada yang kosong');
          return;
        }
        if (!manualJawaban || !manualOpsiList.some(o => o.huruf === manualJawaban)) {
          showToast('Jawaban benar pada form soal saat ini belum dipilih');
          return;
        }
        const currentSoalObj = {
          pertanyaan: manualPertanyaan.trim(),
          jenis_soal: 'pilihan_ganda',
          pembahasan: manualPembahasan.trim() || null,
          jawaban_benar: manualJawaban,
          opsi: manualOpsiList.map(o => ({
            huruf: o.huruf,
            teks_opsi: o.teks_opsi.trim(),
            benar: o.huruf === manualJawaban
          }))
        };

        if (editingManualIdx !== null) {
          finalManualList[editingManualIdx] = currentSoalObj;
        } else {
          finalManualList.push(currentSoalObj);
        }
      }

      if (finalManualList.length === 0) {
        showToast('Minimal tambahkan 1 soal manual ke dalam daftar');
        return;
      }

      soalPayload = finalManualList;
    }

    setIsSavingQuiz(true);
    try {
      let createdKuis;
      if (isApiClass && routeClassId) {
        const imporRes = await apiService.imporSoalBatch(routeClassId, soalPayload);
        const createdSoalList = (imporRes && imporRes.data) || [];
        const soalIds = createdSoalList.map(s => s.id).filter(Boolean);
        const selectedMapelObj = dbMapelList.find(m => m.kode === newQuizSubject || String(m.id) === String(newQuizSubject));
        createdKuis = await apiService.createKuis(routeClassId, {
          judul: newQuizTitle,
          deskripsi: newQuizDesc || 'Kuis Baru',
          acak_soal: acakSoal,
          acak_opsi: acakOpsi,
          soal_ids: soalIds,
          mapel_id: selectedMapelObj?.id || null
        });
      }

      const selectedMapelObj = dbMapelList.find(m => m.kode === newQuizSubject || String(m.id) === String(newQuizSubject));
      const quizObject = {
        id: createdKuis?.id || `quiz-${Date.now()}`,
        classId: routeClassId || activeClass?.id || 'global',
        title: newQuizTitle.trim(),
        description: newQuizDesc || 'Kuis Baru',
        code: newQuizSubject,
        subject: selectedMapelObj?.kode || newQuizSubject,
        subjectName: selectedMapelObj?.nama || newQuizSubject,
        questionsCount: soalPayload.length,
        attemptsCount: 0,
        active: true,
        acak_soal: acakSoal,
        acak_opsi: acakOpsi,
        questions: soalPayload.map(s => ({
          q: s.pertanyaan,
          options: s.opsi.map(o => o.teks_opsi),
          correct: s.opsi.findIndex(o => o.benar) >= 0 ? s.opsi.findIndex(o => o.benar) : 0,
          hint: s.pembahasan || ''
        }))
      };

      if (addQuiz) {
        addQuiz(quizObject);
      }
      setDbQuizList(prev => [quizObject, ...prev]);

      const newLog = {
        id: Date.now(),
        user: currentUser?.name || 'Refky Satria',
        role: activeRole.toUpperCase(),
        action: `Menerbitkan Kuis Baru "${newQuizTitle}" dengan ${soalPayload.length} Soal`,
        time: 'Baru saja'
      };

      setAuditLogs([newLog, ...auditLogs]);
      showToast(`Kuis "${newQuizTitle}" berhasil diterbitkan!`);
      setNewQuizTitle('');
      setNewQuizDesc('');
      setAcakSoal(false);
      setAcakOpsi(false);
      setRawSoalText('');
      setParsedSoalList([]);
      setManualSoalList([]);
      handleResetManualForm();
      setIsCreateQuizOpen(false);
      setEditingQuiz(null);
    } catch (err) {
      showToast(err.message || 'Gagal menerbitkan kuis');
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const isOwner = activeRole === 'owner';
  const isAdmin = activeRole === 'admin';
  const canManage = isOwner || isAdmin;

  // Security Protection 0: Role Loading State (Avoid flashing access denied screens)
  if (isRoleLoading && isApiClass) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-pulse max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Memuat Profil &amp; Hak Akses...</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mohon tunggu sebentar, sedang mengonfirmasi status keanggotaan kelas.
          </p>
        </div>
      </div>
    );
  }

  // Security Protection 1: Class Not Found / Not Enrolled Check
  if (routeClassId && !activeClass && !isApiClass) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-danger/10 text-danger flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Akses Ditolak / Kelas Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ruang kelas dengan ID <code className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded">{routeClassId}</code> tidak ditemukan atau Anda tidak terdaftar sebagai anggota di kelas ini.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-glow hover:scale-105 transition-all"
          >
            <span>Kembali ke Beranda</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Security Protection 2: Owner/Admin Role Protection
  if (activeTab !== 'overview' && activeTab !== 'members_view' && activeRole !== 'owner' && activeRole !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-warning/10 text-warning flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Akses Terbatas (Owner &amp; Admin Only)</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anda terdaftar sebagai anggota biasa di kelas ini. Hanya Owner atau Admin yang diizinkan mengelola materi, kuis, dan verifikasi kelas.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-glow hover:scale-105 transition-all cursor-pointer"
          >
            <span>Kembali ke Ringkasan Kelas</span>
          </button>
        </div>
      </div>
    );
  }

  // Security Protection 3: Kelola Admin & Anggota (Owner Only)
  if (activeTab === 'members' && !isOwner) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-warning/10 text-warning flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Akses Terbatas (Owner Only)</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Menu Kelola Admin &amp; Anggota hanya dapat diakses oleh Pemilik (Owner) Kelas.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-glow hover:scale-105 transition-all cursor-pointer"
          >
            <span>Kembali ke Ringkasan Kelas</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="px-4 md:px-8 pt-6 space-y-6 animate-fade-in flex flex-col max-w-7xl mx-auto w-full pb-24">
      {/* Header Banner Identity (Twitter/X Style Cover Banner & Round Profile - Ultra Flattened Mobile Landscape) */}
      <div className="bg-card border border-border rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl">
        {/* 1. Banner Belakang (Gambar Banner Custom EduVerse - Landscape Ultra Gepeng di Mobile) */}
        <div className="relative w-full h-20 sm:h-32 md:h-48 bg-background select-none overflow-hidden">
          <img
            src="/assets/banner_eduverse2.png"
            alt="Banner EduVerse"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10 pointer-events-none"></div>
        </div>

        {/* 2. Area Bawah (Foto Profil Bulat, Nama, Centang Emas & Badges) */}
        <div className="px-3.5 sm:px-6 pb-3.5 sm:pb-6 pt-0 relative bg-card">
          <div className="flex flex-wrap items-end justify-between gap-2.5 sm:gap-4">
            {/* FOTO PROFIL BULAT (Menggunakan <img> asli bulat sempurna menumpuk di atas banner) */}
            <div className="relative -mt-8 sm:-mt-12 md:-mt-18 z-20 shrink-0">
              <img 
                src={
                  (currentUser?.profile_photo || currentUser?.avatar) && !String(currentUser?.profile_photo || currentUser?.avatar).includes('unsplash')
                    ? (currentUser.profile_photo || currentUser.avatar)
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || currentUser?.username || 'User')}&background=8b5cf6&color=ffffff&bold=true&size=256`
                } 
                alt="Foto Profil" 
                className="w-16 h-16 sm:w-24 sm:h-24 md:w-34 md:h-34 rounded-full object-cover border-4 border-card bg-muted shadow-2xl block hover:opacity-95 transition cursor-pointer"
              />
              {isOwner && (
                <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-gradient-to-br from-amber-300 via-xp-gold to-amber-500 text-black w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] sm:text-xs shadow-lg border-2 border-card shrink-0" title="Pemilik Kelas (Owner)">
                  👑
                </div>
              )}
              {isAdmin && (
                <div className="absolute bottom-0 right-0 sm:bottom-1 sm:right-1 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 text-white w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] sm:text-xs shadow-lg border-2 border-card shrink-0" title="Pengelola Kelas (Admin)">
                  🛡️
                </div>
              )}
            </div>

            {/* Badges Role & Pangkat Level di Sebelah Kanan */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 pt-1">
              {isRoleLoading ? (
                <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[8px] sm:text-xs font-extrabold uppercase tracking-wider animate-pulse border border-border shrink-0">
                  MEMUAT ROLE...
                </span>
              ) : (
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 text-primary text-[8px] sm:text-xs font-extrabold uppercase tracking-wider border border-primary/20 shrink-0">
                  ROLE: {activeRole}
                </span>
              )}
              <div className="bg-background border border-border px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-sm shrink-0">
                <div>
                  <p className="text-[7px] sm:text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground leading-none">Peringkat Saat Ini</p>
                  <p className="text-[10px] sm:text-sm font-extrabold italic text-xp-gold mt-0.5">
                    Lv. {levelInfo.level} {levelInfo.level >= 10 ? 'Master' : levelInfo.level >= 5 ? 'Cendikiawan' : levelInfo.level >= 1 ? 'Pelajar' : 'Pemula'}
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-300 via-xp-gold to-amber-500 text-black flex items-center justify-center font-extrabold text-[10px] sm:text-sm shadow-md border border-white/40 shrink-0">
                  #{userRank}
                </div>
              </div>
            </div>
          </div>

          {/* Nama Akun & Username (Tanpa Email) */}
          <div className="mt-3 space-y-0.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {currentUser?.name || 'Refky Satria'}
            </h1>
            {currentUser?.username && (
              <p className="text-muted-foreground text-xs sm:text-sm font-semibold">
                @{currentUser.username}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column Sidebar & Dynamic Content View Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SIDEBAR NAVIGATION MENU */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4 md:sticky md:top-20">
          


          {/* DYNAMIC SIDEBAR MENU */}
          <div className="bg-card border border-border rounded-3xl p-3 shadow-sm space-y-1">
            <span className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground block">
              Menu Navigasi
            </span>

            {/* Menu 1: Ringkasan & Statistik */}
            <button
              onClick={() => handleTabClick('overview', '')}
              className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span className="flex-1">Ringkasan &amp; Statistik</span>
            </button>

            {/* Menu 2: Anggota (Khusus untuk semua role) */}
            <button
              onClick={() => handleTabClick('members_view', 'anggota')}
              className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                activeTab === 'members_view'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="flex-1">Anggota Kelas</span>
            </button>

            {/* Owner & Admin Management Menu List */}
            {isRoleLoading ? (
              <div className="pt-2 border-t border-border space-y-2 animate-pulse px-1">
                <div className="h-3 w-28 bg-muted rounded my-2"></div>
                <div className="h-9 w-full bg-muted/60 rounded-xl"></div>
                <div className="h-9 w-full bg-muted/60 rounded-xl"></div>
              </div>
            ) : canManage ? (
              <div className="space-y-1">
                <button
                  onClick={() => setIsManagementOpen(!isManagementOpen)}
                  className="w-full pt-3 pb-1 px-3 border-t border-border flex items-center justify-between cursor-pointer group text-left"
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary group-hover:opacity-90">
                    {isOwner ? 'Manajemen Owner' : 'Manajemen Admin'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-primary transition-transform duration-200 ${isManagementOpen ? 'rotate-180' : 'rotate-0'}`} />
                </button>

                {isManagementOpen && (
                  <div className="space-y-1 animate-fade-in">
                    {isOwner && (
                      <button
                        onClick={() => handleTabClick('settings', 'edit-info')}
                        className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                          activeTab === 'settings'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        <Settings className="w-4 h-4 shrink-0" />
                        <span className="flex-1">Edit Info &amp; Kode Kelas</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTabClick('add_subject', 'add-subject')}
                      className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                        activeTab === 'add_subject'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      <FolderPlus className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Mapel</span>
                    </button>

                    <button
                      onClick={() => handleTabClick('add_material', 'add-material')}
                      className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                        activeTab === 'add_material'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      <FileText className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Materi</span>
                    </button>

                    <button
                      onClick={() => handleTabClick('add_quiz', 'add-quiz')}
                      className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                        activeTab === 'add_quiz'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      <Swords className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Quiz</span>
                    </button>

                    {isOwner && (
                      <button
                        onClick={() => handleTabClick('verification', 'verification')}
                        className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                          activeTab === 'verification'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="flex-1">Verifikasi Materi Admin</span>
                        {pendingMaterials.length > 0 && (
                          <span className="bg-warning text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {pendingMaterials.length}
                          </span>
                        )}
                      </button>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => handleTabClick('members', 'members')}
                        className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                          activeTab === 'members'
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'bg-background hover:bg-muted text-foreground'
                        }`}
                      >
                        <Users className="w-4 h-4 shrink-0" />
                        <span className="flex-1">Kelola Admin &amp; Anggota</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleTabClick('audit_log', 'audit-log')}
                      className={`w-full p-3 rounded-2xl font-extrabold text-xs flex items-center gap-3 transition-all cursor-pointer text-left ${
                        activeTab === 'audit_log'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      <History className="w-4 h-4 shrink-0" />
                      <span className="flex-1">Riwayat Perubahan Log</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT MAIN CONTENT VIEW (CHANGES 100% BASED ON SIDEBAR SELECTION) */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6" id="management-content-area">
          
          {/* Breadcrumb Header Bar for Management Navigation */}
          {activeTab !== 'overview' && (
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground flex-wrap">
                <Link to="/" className="hover:text-primary transition-colors">EduVerse</Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground">{activeClass?.name || 'Ruang Kelas'}</span>
                <ChevronRight className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-extrabold uppercase tracking-wider">
                  {activeTab === 'add_quiz' && 'Quiz & Bank Soal'}
                  {activeTab === 'add_material' && 'Materi Pembelajaran'}
                  {activeTab === 'add_subject' && 'Mata Pelajaran (Mapel)'}
                  {activeTab === 'settings' && 'Edit Informasi & Kode Kelas'}
                  {activeTab === 'members_view' && 'Anggota Kelas'}
                  {activeTab === 'members' && 'Kelola Admin & Anggota'}
                  {activeTab === 'verification' && 'Verifikasi Materi Admin'}
                  {activeTab === 'audit_log' && 'Riwayat Log Aktivitas'}
                </span>
              </div>
            </div>
          )}
          
          {/* VIEW 1: OVERVIEW & STATISTIK (ALL STATS WIDGETS) */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              {/* 4 Quick Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-extrabold italic tabular-nums text-foreground">{displayXp.toLocaleString()}</p>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-1">Total XP (Lv. {levelInfo.level})</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-extrabold italic tabular-nums text-foreground">{displayExams}</p>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-1">Ujian Selesai</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-extrabold italic tabular-nums text-foreground">{displayAccuracy}%</p>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-1">Akurasi Jawaban</p>
                </div>
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-extrabold italic tabular-nums text-foreground flex items-center justify-center gap-1">
                    🔥 {displayStreak}
                  </p>
                  <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mt-1">Streak Hari Ini</p>
                </div>
              </div>

              {/* Progressive Level XP Bar Widget */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-2.5">
                <div className="flex justify-between items-center text-xs font-extrabold flex-wrap gap-1">
                  <span className="text-foreground italic flex items-center gap-1.5">
                    Progress Level {levelInfo.level} → Level {levelInfo.level + 1}
                  </span>
                  <span className="text-xp-gold font-mono">{levelInfo.progress} / {levelInfo.max} XP ({levelInfo.percent}%)</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border border-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-xp-gold to-amber-500 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${levelInfo.percent}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Setiap naik level, kebutuhan XP bertambah +50 XP dari level sebelumnya. Butuh <span className="font-bold text-foreground font-mono">{levelInfo.max - levelInfo.progress} XP</span> lagi untuk mencapai Level {levelInfo.level + 1}.
                </p>
              </div>

              {/* Streak Calendar */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" /> Tracking Belajar Mingguan
                  </h3>
                  <span className="text-xs text-muted-foreground font-bold">🔥 {displayStreak} Hari Berturut-turut</span>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center pt-1">
                  {streakDays.map((s, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm border ${
                        s.active
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-amber-300 shadow-md'
                          : 'bg-muted/40 text-muted-foreground border-border'
                      }`}>
                        {s.active ? '🔥' : '✓'}
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Weakness Analysis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-success">
                    <TrendingUp className="w-5 h-5" />
                    <h4 className="font-extrabold text-sm">Mata Pelajaran Terkuat</h4>
                  </div>
                  <div className="space-y-2">
                    {topSubjects.length > 0 ? (
                      topSubjects.map((sub, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>{sub.name}</span>
                            <span className="text-success">{sub.accuracy}% Akurasi</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-success rounded-full" style={{ width: `${sub.accuracy}%` }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">Belum ada analisis mata pelajaran terkuat.</p>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="font-extrabold text-sm">Perlu Ditingkatkan</h4>
                  </div>
                  <div className="space-y-2">
                    {weakSubjects.length > 0 ? (
                      weakSubjects.map((sub, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-bold mb-1">
                            <span>{sub.name}</span>
                            <span className="text-warning">{sub.accuracy}% Akurasi</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-warning rounded-full" style={{ width: `${sub.accuracy}%` }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">Belum ada data mata pelajaran yang perlu ditingkatkan.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-xp-gold" /> Lencana Pencapaian
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((b, idx) => {
                    const IconComp = b.icon;
                    return (
                      <div key={idx} className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                        b.unlocked
                          ? 'bg-background border-border shadow-sm'
                          : 'bg-muted/30 border-border opacity-50'
                      }`}>
                        <div className={`w-11 h-11 rounded-xl ${b.color} grid place-items-center shrink-0`}>
                          <IconComp className="w-5 h-5" strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-extrabold text-sm truncate">{b.title}</p>
                            {b.unlocked && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{b.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Activity Log */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base">Riwayat Aktivitas Terbaru</h3>
                <div className="space-y-2.5">
                  {recentActivity.map((act, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-background rounded-2xl border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                          {act.type === 'Ujian' ? '⚔' : act.type === 'Materi' ? '📚' : '🎁'}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm">{act.title}</p>
                          <p className="text-xs text-muted-foreground">{act.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-primary">{act.xp}</span>
                        <p className="text-[10px] font-bold text-muted-foreground">{act.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: EDIT INFO & KODE KELAS (OWNER) */}
          {activeTab === 'settings' && isOwner && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-border pb-4">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Pengaturan Identitas &amp; Kode Kelas
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Ubah nama kelas, deskripsi, serta buat ulang kode masuk kelas privat.</p>
              </div>

              <form onSubmit={handleSaveClassInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Nama Kelas</label>
                  <input
                    type="text"
                    required
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground mb-1">Deskripsi Kelas</label>
                  <textarea
                    rows={3}
                    value={classDesc}
                    onChange={(e) => setClassDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all"
                >
                  <Save className="w-4 h-4" /> Simpan Perubahan Info Kelas
                </button>
              </form>

              {/* Kode Masuk Box */}
              <div className="bg-background border border-border rounded-2xl p-5 space-y-3">
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-xp-gold" /> Kode Masuk Kelas Privasi
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-3xl font-mono font-extrabold text-xp-gold tracking-widest">{classCode}</p>
                    <p className="text-xs text-muted-foreground mt-1">Bagikan kode ini kepada siswa agar bisa bergabung ke kelas ini.</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyClassCode}
                      className="bg-muted text-foreground font-extrabold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-muted/80 transition-all cursor-pointer shadow-xs"
                      title="Salin Kode Kelas ke Clipboard"
                    >
                      {copiedClassCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-primary" />}
                      <span>{copiedClassCode ? 'Tersalin!' : 'Salin Kode'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRegenCode}
                      className="bg-primary/10 text-primary font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 hover:bg-primary/20 transition-all shrink-0 cursor-pointer"
                    >
                      <RefreshCcw className="w-4 h-4" /> Regenerate Kode Baru
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: DAFTAR MAPEL & FORM TAMBAH MAPEL */}
          {activeTab === 'add_subject' && canManage && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Bar Mapel */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
                    <FolderPlus className="w-5 h-5 text-primary" /> Daftar Mata Pelajaran (Mapel)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kelola daftar mata pelajaran di kelas {className}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateSubjectOpen(!isCreateSubjectOpen)}
                  className="bg-primary text-primary-foreground font-extrabold px-3.5 sm:px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer whitespace-nowrap shrink-0 h-[42px]"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{isCreateSubjectOpen ? 'Tutup Form' : 'Tambah Mapel Baru'}</span>
                </button>
              </div>

              {/* Form Tambah Mapel (Toggleable) */}
              {isCreateSubjectOpen && (
                <form onSubmit={handleCreateSubject} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="border-b border-border pb-3">
                    <h4 className="font-extrabold text-sm flex items-center gap-2 text-primary">
                      Form Tambah Mata Pelajaran Baru
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Nama Mata Pelajaran</label>
                      <input
                        type="text"
                        required
                        disabled={isSavingSubject}
                        placeholder="Contoh: Fisika Terapan"
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Singkatan Kode Mapel</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        disabled={isSavingSubject}
                        placeholder="Contoh: FIS"
                        value={newSubjectCode}
                        onChange={(e) => setNewSubjectCode(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm uppercase font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isSavingSubject}
                      onClick={() => setIsCreateSubjectOpen(false)}
                      className="bg-muted text-muted-foreground font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingSubject}
                      className="bg-primary text-primary-foreground font-extrabold px-6 py-2 rounded-xl text-xs shadow-glow flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isSavingSubject ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <span>Simpan Mapel Baru</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Form Edit Mapel (Toggleable) */}
              {editingMapel && (
                <form onSubmit={handleUpdateMapel} className="bg-card border border-amber-500/40 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
                  <div className="border-b border-border pb-3 flex items-center justify-between">
                    <h4 className="font-extrabold text-sm flex items-center gap-2 text-amber-500">
                      <Pencil className="w-4 h-4" /> Form Edit Mata Pelajaran: {editingMapel.nama}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Nama Mata Pelajaran</label>
                      <input
                        type="text"
                        required
                        disabled={isUpdatingSubject}
                        value={editMapelName}
                        onChange={(e) => setEditMapelName(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Singkatan Kode Mapel</label>
                      <input
                        type="text"
                        required
                        maxLength="5"
                        disabled={isUpdatingSubject}
                        value={editMapelCode}
                        onChange={(e) => setEditMapelCode(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm uppercase font-mono focus:outline-none focus:border-primary disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isUpdatingSubject}
                      onClick={() => setEditingMapel(null)}
                      className="bg-muted text-muted-foreground font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingSubject}
                      className="bg-primary text-primary-foreground font-extrabold px-6 py-2 rounded-xl text-xs shadow-glow flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {isUpdatingSubject ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memperbarui...</span>
                        </>
                      ) : (
                        <span>Simpan Perubahan Mapel</span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Tabel Daftar Mapel */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Kode Mapel</th>
                        <th className="pb-3 px-3">Nama Mata Pelajaran</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingMapel ? (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                              <span className="font-extrabold text-xs">Memuat daftar mata pelajaran...</span>
                            </div>
                          </td>
                        </tr>
                      ) : dbMapelList.length > 0 ? (
                        dbMapelList.map((mapel, idx) => (
                          <tr key={mapel.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-extrabold bg-primary/10 text-primary px-2.5 py-1 rounded-lg">
                                {mapel.kode}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-foreground text-sm">
                              {mapel.nama}
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-success/15 text-success font-extrabold text-[10px] px-2.5 py-0.5 rounded-full">
                                Aktif
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMapel(mapel)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Edit Mapel"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMapel(mapel.id, mapel.nama)}
                                  className="bg-muted hover:bg-danger/20 hover:text-danger text-muted-foreground font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Hapus Mapel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-8 text-center text-muted-foreground italic">
                            Belum ada mata pelajaran di kelas ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: DAFTAR MATERI & KELOLA VERSI MATERI */}
          {activeTab === 'add_material' && canManage && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Bar Materi */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
                    <FileText className="w-5 h-5 text-primary" /> Daftar Materi Pembelajaran
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kelola materi pembelajaran dan sistem versioning (v1, v2, v3...).
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari materi..."
                        value={materialSearchQuery}
                        onChange={(e) => setMaterialSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary transition-all h-[42px]"
                      />
                      {materialSearchQuery && (
                        <button
                          onClick={() => setMaterialSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-extrabold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="relative bg-background border border-border rounded-xl px-3 text-xs font-bold flex items-center h-[42px] shadow-xs shrink-0">
                      <select
                        value={selectedMaterialMapelFilter}
                        onChange={(e) => setSelectedMaterialMapelFilter(e.target.value)}
                        className="bg-transparent appearance-none text-foreground font-bold text-xs focus:outline-none cursor-pointer pr-6 truncate"
                      >
                        <option value="ALL" className="bg-card text-foreground font-normal text-xs">Semua Mapel</option>
                        {dbMapelList.map(m => (
                          <option key={m.id || m.kode} value={m.kode} className="bg-card text-foreground font-normal text-xs">
                            {m.kode} - {m.nama}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingMaterial(null);
                      setIsCreateMaterialOpen(!isCreateMaterialOpen);
                    }}
                    className="bg-primary text-primary-foreground font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer whitespace-nowrap shrink-0 h-[42px] sm:w-auto w-full"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{isCreateMaterialOpen ? 'Tutup Form' : 'Tambah Materi Baru'}</span>
                  </button>
                </div>
              </div>

              {/* Form Create / Edit Material */}
              {(isCreateMaterialOpen || editingMaterial) && (() => {
                const isContentChanged = editingMaterial && editMaterialContent.trim() !== (editingMaterial.content || editingMaterial.isi || '').trim();
                const nextVer = editingMaterial ? ((editingMaterial.version || 1) + 1) : 1;

                return (
                  <form
                    onSubmit={editingMaterial ? handleUpdateExistingMaterial : handleCreateMaterial}
                    className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in"
                  >
                    <div className="border-b border-border pb-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-sm text-primary flex items-center gap-2">
                          {editingMaterial ? (
                            <span className="flex items-center gap-1.5 text-amber-500">
                              <Pencil className="w-4 h-4" /> Edit Materi: {editingMaterial.title} {isContentChanged ? `(Versi Baru v${nextVer})` : `(v${editingMaterial.version || 1})`}
                            </span>
                          ) : (
                            <span>Form Tambah Materi Pembelajaran (Versi v1)</span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {editingMaterial
                            ? (isContentChanged
                              ? (isOwner ? `Perubahan isi akan langsung diterbitkan (v${nextVer})` : `Perubahan isi akan diajukan ke Owner untuk verifikasi (v${nextVer})`)
                              : 'Perubahan mata pelajaran & judul akan disimpan tanpa mengubah versi.')
                            : (isOwner ? 'Materi baru langsung terverifikasi.' : 'Materi baru memerlukan verifikasi Owner.')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Pilih Mata Pelajaran</label>
                        <div className="relative">
                          <select
                            value={editingMaterial ? editMaterialSubject : newMaterialSubject}
                            onChange={(e) => editingMaterial ? setEditMaterialSubject(e.target.value) : setNewMaterialSubject(e.target.value)}
                            className="w-full appearance-none bg-background text-foreground border border-border rounded-xl pl-4 pr-10 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-primary cursor-pointer shadow-sm"
                          >
                            {dbMapelList.map(m => (
                              <option key={m.id || m.kode} value={m.id || m.kode} className="bg-card text-foreground font-medium text-xs py-1">
                                {m.kode} - {m.nama}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Judul Bab Materi</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Arsitektur MVC pada Framework Laravel"
                          value={editingMaterial ? editMaterialTitle : newMaterialTitle}
                          onChange={(e) => editingMaterial ? setEditMaterialTitle(e.target.value) : setNewMaterialTitle(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-muted-foreground mb-1">Isi Rangkuman / Poin Materi</label>
                      <textarea
                        rows={5}
                        required
                        placeholder="Tuliskan rangkuman poin-poin materi di sini..."
                        value={editingMaterial ? editMaterialContent : newMaterialContent}
                        onChange={(e) => editingMaterial ? setEditMaterialContent(e.target.value) : setNewMaterialContent(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateMaterialOpen(false);
                          setEditingMaterial(null);
                        }}
                        className="bg-muted text-muted-foreground font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="bg-primary text-primary-foreground font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-glow flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                      >
                        {editingMaterial
                          ? (isContentChanged
                            ? (isOwner ? `Simpan & Terbitkan v${nextVer}` : `Ajukan Pembaruan v${nextVer}`)
                            : 'Simpan Perubahan')
                          : (isOwner ? 'Publikasikan (Terverifikasi)' : 'Ajukan (Menunggu Verifikasi)')}
                      </button>
                    </div>
                  </form>
                );
              })()}

              {/* Tabel Daftar Materi */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Mapel</th>
                        <th className="pb-3 px-3">Judul Materi</th>
                        <th className="pb-3 px-3">Versi</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingMateri ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                              <span className="font-extrabold text-xs">Memuat daftar materi pembelajaran...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredMateriList.length > 0 ? (
                        filteredMateriList.map((materi, idx) => (
                          <tr key={materi.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[11px]">
                                {materi.subject}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-foreground text-sm">{materi.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{materi.content}</p>
                            </td>
                            <td className="py-3 px-3">
                              <MaterialVersionDropdown
                                versions={
                                  (materi.versi && materi.versi.length > 0)
                                    ? materi.versi
                                    : ((materi.versions && materi.versions.length > 0)
                                      ? materi.versions
                                      : [{ version: materi.version || 1, nomor_versi: materi.version || 1, content: materi.content, isi: materi.content, status: materi.status }])
                                }
                                activeVersion={materi.version || 1}
                                activeVersionId={materi.versi_aktif_id}
                                onSelectVersion={() => {}}
                                onDeleteVersion={(vObj) => handleDeleteMateriVersion(materi, vObj)}
                                isOwner={activeRole === 'owner'}
                              />
                            </td>
                            <td className="py-3 px-3">
                              {materi.status === 'terverifikasi' || materi.status === 'verified' ? (
                                <span className="bg-success/15 text-success font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                                </span>
                              ) : materi.status === 'ditolak' || materi.status === 'rejected' ? (
                                <span className="bg-danger/15 text-danger font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <XCircle className="w-3 h-3" /> Ditolak
                                </span>
                              ) : (
                                <span className="bg-warning/20 text-warning font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit">
                                  <Clock className="w-3 h-3" /> Menunggu Verifikasi
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditMaterial(materi)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Edit Materi"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMateri(materi.id, materi.title)}
                                  className="bg-muted hover:bg-danger/20 hover:text-danger text-muted-foreground font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Hapus Materi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : dbMateriList.length > 0 && filteredMateriList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-muted-foreground italic">
                            Tidak ada materi pembelajaran untuk mata pelajaran "{selectedMaterialMapelFilter}".
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-6 text-center text-muted-foreground italic">
                            Belum ada materi pembelajaran di kelas ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: DAFTAR QUIZ & BANK SOAL */}
          {activeTab === 'add_quiz' && canManage && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Bar Quiz */}
              <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
                    <Swords className="w-5 h-5 text-primary" /> Daftar Quiz &amp; Bank Soal
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kelola daftar quiz, buat bank soal manual, atau impor batch dari AI.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Cari quiz..."
                        value={quizSearchQuery}
                        onChange={(e) => setQuizSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary transition-all h-[42px]"
                      />
                      {quizSearchQuery && (
                        <button
                          onClick={() => setQuizSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-extrabold cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="bg-background border border-border rounded-xl px-3 text-xs font-bold flex items-center h-[42px] shadow-xs shrink-0">
                      <select
                        value={selectedQuizMapelFilter}
                        onChange={(e) => setSelectedQuizMapelFilter(e.target.value)}
                        className="bg-transparent text-foreground font-bold text-xs focus:outline-none cursor-pointer pr-1 truncate"
                      >
                        <option value="ALL" className="bg-card text-foreground font-normal text-xs">Semua Mapel</option>
                        {dbMapelList.map(m => (
                          <option key={m.id || m.kode} value={m.kode} className="bg-card text-foreground font-normal text-xs">
                            {m.kode} - {m.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isCreateQuizOpen || editingQuiz) {
                        setIsCreateQuizOpen(false);
                        setEditingQuiz(null);
                      } else {
                        setEditingQuiz(null);
                        setNewQuizTitle('');
                        setNewQuizDesc('');
                        setRawSoalText('');
                        setParsedSoalList([]);
                        setManualSoalList([]);
                        handleResetManualForm();
                        setIsCreateQuizOpen(true);
                      }
                    }}
                    className="bg-primary text-primary-foreground font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:scale-105 transition-all cursor-pointer whitespace-nowrap shrink-0 h-[42px] sm:w-auto w-full"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{(isCreateQuizOpen || editingQuiz) ? 'Tutup Form' : 'Tambah Quiz Baru'}</span>
                  </button>
                </div>
              </div>

              {/* Form Create / Edit Quiz */}
              {(isCreateQuizOpen || editingQuiz) && (
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
                  <div className="border-b border-border pb-4 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-extrabold text-lg flex items-center gap-2">
                        {editingQuiz ? (
                          <span className="flex items-center gap-1.5 text-amber-500">
                            <Pencil className="w-5 h-5" /> Edit Quiz: {editingQuiz.title}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Swords className="w-5 h-5 text-primary" /> Form Tambah Quiz &amp; Bank Soal
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {editingQuiz ? 'Perbarui informasi dan pengaturan quiz.' : 'Terbitkan quiz baru dan impor soal ke Bank Soal kelas.'}
                      </p>
                    </div>
                    {!editingQuiz && (
                      <div className="flex items-center gap-1.5 bg-muted p-1 rounded-2xl border border-border">
                        <button
                          type="button"
                          onClick={() => setQuizInputMode('manual')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                            quizInputMode === 'manual' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Input Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizInputMode('paste')}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                            quizInputMode === 'paste' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Tempel Teks (AI)
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleCreateQuiz} className="space-y-5">
                    {/* General Quiz Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-background p-4 rounded-2xl border border-border">
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Judul Quiz / Ujian</label>
                        <input
                          type="text"
                          required
                          placeholder="Contoh: Ulangan Harian Negosiasi"
                          value={newQuizTitle}
                          onChange={(e) => setNewQuizTitle(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Mata Pelajaran</label>
                        <div className="relative">
                          <select
                            value={newQuizSubject}
                            onChange={(e) => setNewQuizSubject(e.target.value)}
                            className="w-full appearance-none bg-card border border-border rounded-xl pl-4 pr-10 py-2 text-sm focus:outline-none focus:border-primary cursor-pointer shadow-sm"
                          >
                            {dbMapelList.map(m => (
                              <option key={m.id || m.kode} value={m.kode}>
                                {m.kode} - {m.nama}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-muted-foreground pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-1">Deskripsi / Petunjuk (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Contoh: Kerjakan dengan jujur, 10 soal."
                          value={newQuizDesc}
                          onChange={(e) => setNewQuizDesc(e.target.value)}
                          className="w-full bg-card border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Setting Acak Soal & Acak Opsi */}
                    <div className="flex items-center gap-6 bg-background p-4 rounded-2xl border border-border flex-wrap">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-extrabold text-foreground">
                        <input
                          type="checkbox"
                          checked={acakSoal}
                          onChange={(e) => setAcakSoal(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>Acak Urutan Soal</span>
                      </label>
                      <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-extrabold text-foreground">
                        <input
                          type="checkbox"
                          checked={acakOpsi}
                          onChange={(e) => setAcakOpsi(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <span>Acak Urutan Opsi Jawaban</span>
                      </label>
                    </div>

                    {/* MODE QUESTIONS ONLY IF CREATING NEW QUIZ */}
                    {!editingQuiz && (
                      <>
                        {/* MODE 1: TEMPEL TEKS AI */}
                        {quizInputMode === 'paste' && (
                          <div className="space-y-4">
                            {/* Prompt Template Box for AI */}
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-2.5">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2 text-primary font-extrabold text-xs">
                                  Belum punya soal? Salin prompt ini untuk AI
                                </div>
                                <button
                                  type="button"
                                  onClick={handleCopyPrompt}
                                  className="bg-primary text-primary-foreground font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer shadow-xs"
                                >
                                  {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedPrompt ? 'Tersalin!' : 'Salin Prompt'}
                                </button>
                              </div>
                              <textarea
                                readOnly
                                rows={9}
                                value={PROMPT_TEMPLATE}
                                className="w-full text-xs font-mono bg-card/70 p-3 rounded-xl border border-border text-foreground leading-relaxed focus:outline-none resize-none"
                              />
                              <p className="text-[11px] text-muted-foreground font-medium">
                                💡 <span className="font-bold text-foreground">Tips:</span> Ganti <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono font-bold">[jumlah]</code> dan <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono font-bold">[topik]</code> sebelum dikirim ke ChatGPT / Claude.
                              </p>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-muted-foreground mb-1">Tempelkan Teks Hasil Generate AI (ChatGPT / Claude)</label>
                              <textarea
                                rows={7}
                                placeholder="Paste teks daftar soal di sini..."
                                value={rawSoalText}
                                onChange={(e) => setRawSoalText(e.target.value)}
                                className="w-full bg-background border border-border rounded-xl p-3.5 text-xs font-mono focus:outline-none focus:border-primary resize-y"
                              />
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleParseSoal(true)}
                                disabled={isParsingSoal || !rawSoalText.trim()}
                                className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                <Plus className="w-4 h-4" />
                                {isParsingSoal
                                  ? 'Memproses Parsing...'
                                  : (parsedSoalList.length > 0
                                      ? `+ Parse & Tambah ke Daftar (Soal #${parsedSoalList.length + 1} dst.)`
                                      : 'Parse Teks Soal')}
                              </button>

                              {parsedSoalList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setParsedSoalList([]);
                                    setEditingSoalId(null);
                                    showToast('Daftar preview soal dibersihkan');
                                  }}
                                  className="bg-muted text-muted-foreground font-extrabold px-4 py-2.5 rounded-xl text-xs hover:bg-danger/10 hover:text-danger transition-all cursor-pointer"
                                >
                                  Reset / Bersihkan Preview
                                </button>
                              )}
                            </div>

                            {/* Preview List Soal Hasil Parsing */}
                            {parsedSoalList.length > 0 && (
                              <div className="space-y-3 pt-3 border-t border-border">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                                    Preview Soal ({parsedSoalList.filter(s => s.status === 'valid').length} Valid, {parsedSoalList.filter(s => s.status === 'error').length} Error)
                                  </h4>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                  {parsedSoalList.map((item, index) => (
                                    <div
                                      key={item.id || index}
                                      className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                                        item.status === 'valid'
                                          ? 'bg-card border-success/30'
                                          : 'bg-danger/10 border-danger/40'
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-extrabold text-foreground">Soal #{index + 1}</span>
                                          {item.status === 'valid' ? (
                                            <span className="bg-success/20 text-success font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <CheckCircle2 className="w-3 h-3" /> Valid
                                            </span>
                                          ) : (
                                            <span className="bg-danger text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" /> Error: {item.error_message}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditParsedSoal(item)}
                                            className="text-muted-foreground hover:text-primary p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Soal Ini"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveParsedSoal(item.id)}
                                            className="text-muted-foreground hover:text-danger p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Hapus Soal dari Preview"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {editingSoalId === item.id ? (
                                        <div className="space-y-3 pt-2 bg-background/80 p-4 rounded-xl border border-primary/40 text-left">
                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-muted-foreground">Pertanyaan Soal #{index + 1}</label>
                                            <textarea
                                              rows={2}
                                              value={editPertanyaan}
                                              onChange={(e) => setEditPertanyaan(e.target.value)}
                                              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-primary text-foreground font-semibold resize-y"
                                              placeholder="Tuliskan pertanyaan..."
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <label className="block text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                Opsi Pilihan Ganda ({editOpsi.length} Opsi)
                                                {!editJawabanHuruf && (
                                                  <span className="text-[10px] font-extrabold text-danger bg-danger/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Jawaban belum dipilih
                                                  </span>
                                                )}
                                              </label>
                                              <div className="flex items-center gap-2">
                                                {(editOpsi || []).length > 2 && (
                                                  <button
                                                    type="button"
                                                    onClick={handleRemoveEditOption}
                                                    className="text-xs font-extrabold text-danger bg-danger/10 hover:bg-danger/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                                    title={`Hapus Opsi Terakhir (${editOpsi[editOpsi.length - 1]?.huruf || String.fromCharCode(64 + editOpsi.length)})`}
                                                  >
                                                    <Trash2 className="w-3 h-3" /> Hapus Opsi {editOpsi[editOpsi.length - 1]?.huruf || String.fromCharCode(64 + editOpsi.length)}
                                                  </button>
                                                )}
                                                {(editOpsi || []).length < 5 && (
                                                  <button
                                                    type="button"
                                                    onClick={handleAddEditOption}
                                                    className="text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                                    title="Tambah Opsi Berikutnya"
                                                  >
                                                    <Plus className="w-3 h-3" /> Tambah Opsi {String.fromCharCode(65 + editOpsi.length)}
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              {(editOpsi || []).map((opt, oIdx) => {
                                                const huruf = opt.huruf || String.fromCharCode(65 + oIdx);
                                                const isCorrect = editJawabanHuruf === huruf;
                                                const isLast = oIdx === editOpsi.length - 1;
                                                return (
                                                  <div key={oIdx} className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditJawabanHuruf(huruf)}
                                                      className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                                        isCorrect
                                                          ? 'bg-success text-white border-success shadow-xs'
                                                          : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                                                      }`}
                                                      title={isCorrect ? 'Kunci Jawaban Benar' : 'Klik untuk jadikan Kunci Jawaban'}
                                                    >
                                                      {huruf}
                                                    </button>
                                                    <input
                                                      type="text"
                                                      value={opt.teks_opsi || ''}
                                                      onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditOpsi(prev => (prev || []).map((o, i) => i === oIdx ? { ...o, teks_opsi: val } : o));
                                                      }}
                                                      placeholder={`Pilihan ${huruf}...`}
                                                      className={`flex-1 bg-card border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary ${
                                                        isCorrect ? 'border-success/60 text-success font-bold bg-success/5' : 'border-border text-foreground'
                                                      }`}
                                                    />
                                                    {isCorrect && (
                                                      <span className="text-[10px] font-extrabold text-success bg-success/15 px-2 py-0.5 rounded-full shrink-0">
                                                        Kunci
                                                      </span>
                                                    )}
                                                    {isLast && (editOpsi || []).length > 2 && (
                                                      <button
                                                        type="button"
                                                        onClick={handleRemoveEditOption}
                                                        className="text-muted-foreground hover:text-danger p-1 rounded-lg shrink-0 cursor-pointer"
                                                        title={`Hapus Opsi ${huruf}`}
                                                      >
                                                        <X className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-muted-foreground">Pilih Jawaban Benar (Menyesuaikan {editOpsi.length} Opsi)</label>
                                            <select
                                              value={editJawabanHuruf}
                                              onChange={(e) => setEditJawabanHuruf(e.target.value)}
                                              className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground font-extrabold cursor-pointer"
                                            >
                                              <option value="" disabled>-- Pilih Jawaban Benar --</option>
                                              {(editOpsi || []).map((o, i) => {
                                                const h = o.huruf || String.fromCharCode(65 + i);
                                                return (
                                                  <option key={h} value={h}>Opsi {h}</option>
                                                );
                                              })}
                                            </select>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-muted-foreground">Pembahasan (Opsional)</label>
                                            <input
                                              type="text"
                                              value={editPembahasan}
                                              onChange={(e) => setEditPembahasan(e.target.value)}
                                              className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground"
                                              placeholder="Penjelasan pembahasan..."
                                            />
                                          </div>

                                          <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                            <button
                                              type="button"
                                              onClick={handleCancelEditParsedSoal}
                                              className="px-3 py-1.5 bg-muted text-muted-foreground font-extrabold text-xs rounded-xl hover:bg-muted/80 transition-all cursor-pointer"
                                            >
                                              Batal
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveEditParsedSoal(item.id)}
                                              className="px-4 py-1.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl hover:scale-105 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                                            >
                                              <Save className="w-3.5 h-3.5" /> Simpan
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="font-bold text-foreground text-sm">{item.pertanyaan || '(Pertanyaan kosong)'}</p>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                            {item.opsi.map((opt, oIdx) => (
                                              <div
                                                key={oIdx}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                                  opt.benar
                                                    ? 'bg-success/15 border-success text-success font-bold'
                                                    : 'bg-background border-border text-foreground'
                                                }`}
                                              >
                                                <span className="font-extrabold">{opt.huruf}.</span>
                                                <span>{opt.teks_opsi}</span>
                                              </div>
                                            ))}
                                          </div>

                                          {item.pembahasan && (
                                            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                              <span className="font-bold text-foreground">Pembahasan:</span> {item.pembahasan}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Button at the bottom to add a new blank question directly */}
                                <button
                                  type="button"
                                  onClick={handleAddNewBlankParsedSoal}
                                  className="w-full py-3 bg-card border-2 border-dashed border-primary/40 hover:border-primary text-primary font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/5 active:scale-[0.99] transition-all cursor-pointer shadow-xs"
                                >
                                  <Plus className="w-4 h-4 text-primary" />
                                  <span>Tambah Soal Baru di Paling Bawah (Soal #{parsedSoalList.length + 1})</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* MODE 2: INPUT MANUAL SATU-SATU BERTAHAP */}
                        {quizInputMode === 'manual' && (
                          <div className="space-y-5">
                            {/* Form Question Box */}
                            <div className="space-y-4 bg-background p-4 md:p-5 rounded-2xl border border-border">
                              <div className="flex items-center justify-between gap-2 border-b border-border pb-3 flex-wrap">
                                <h4 className="font-extrabold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                                  {editingManualIdx !== null ? (
                                    <span className="flex items-center gap-1.5 text-amber-500">
                                      <Pencil className="w-3.5 h-3.5" /> Edit Pertanyaan Soal #{editingManualIdx + 1}
                                    </span>
                                  ) : (
                                    <span>Form Input Pertanyaan — Soal #{manualSoalList.length + 1}</span>
                                  )}
                                </h4>
                                <span className="text-[11px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                  Total Soal Tersimpan: {manualSoalList.length}
                                </span>
                              </div>

                              <div>
                                <label className="block text-xs font-bold text-muted-foreground mb-1">
                                  Pertanyaan Soal #{editingManualIdx !== null ? editingManualIdx + 1 : manualSoalList.length + 1}
                                </label>
                                <textarea
                                  rows={3}
                                  placeholder="Tuliskan pertanyaan soal..."
                                  value={manualPertanyaan}
                                  onChange={(e) => setManualPertanyaan(e.target.value)}
                                  className="w-full bg-card border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-primary text-foreground font-semibold"
                                />
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <label className="block text-xs font-bold text-muted-foreground">
                                    Opsi Pilihan Ganda ({manualOpsiList.length} Opsi)
                                  </label>
                                  <div className="flex items-center gap-2">
                                    {manualOpsiList.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={handleRemoveManualOption}
                                        className="text-xs font-extrabold text-danger bg-danger/10 hover:bg-danger/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                        title={`Hapus Opsi Terakhir (${manualOpsiList[manualOpsiList.length - 1].huruf})`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus Opsi {manualOpsiList[manualOpsiList.length - 1].huruf}
                                      </button>
                                    )}
                                    {manualOpsiList.length < 5 && (
                                      <button
                                        type="button"
                                        onClick={handleAddManualOption}
                                        className="text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                                        title="Tambah Opsi Berikutnya"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Tambah Opsi {String.fromCharCode(65 + manualOpsiList.length)}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {manualOpsiList.map((opt, idx) => (
                                    <div key={opt.huruf}>
                                      <label className="block text-xs font-bold text-muted-foreground mb-1">
                                        Opsi {opt.huruf} {idx < 2 ? '(Wajib)' : '(Opsional)'}
                                      </label>
                                      <input
                                        type="text"
                                        placeholder={`Pilihan ${opt.huruf}`}
                                        value={opt.teks_opsi}
                                        onChange={(e) => handleManualOptionChange(idx, e.target.value)}
                                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-muted-foreground">Jawaban Benar</label>
                                    {!manualJawaban && (
                                      <span className="text-[10px] font-extrabold text-danger bg-danger/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Belum dipilih
                                      </span>
                                    )}
                                  </div>
                                  <select
                                    value={manualJawaban}
                                    onChange={(e) => setManualJawaban(e.target.value)}
                                    className={`w-full bg-card text-foreground border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary cursor-pointer ${
                                      !manualJawaban ? 'border-danger/60 bg-danger/5' : 'border-border'
                                    }`}
                                  >
                                    <option value="" disabled className="bg-card text-foreground">-- Pilih Jawaban Benar --</option>
                                    {manualOpsiList.map(opt => (
                                      <option key={opt.huruf} value={opt.huruf} className="bg-card text-foreground">
                                        Opsi {opt.huruf}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-muted-foreground mb-1">Pembahasan (Opsional)</label>
                                  <input
                                    type="text"
                                    placeholder="Penjelasan jawaban..."
                                    value={manualPembahasan}
                                    onChange={(e) => setManualPembahasan(e.target.value)}
                                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-foreground"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                {editingManualIdx !== null && (
                                  <button
                                    type="button"
                                    onClick={handleCancelEditManualSoal}
                                    className="bg-muted text-muted-foreground font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-all cursor-pointer"
                                  >
                                    Batal Edit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={handleAddManualSoal}
                                  className="bg-primary/10 text-primary border border-primary/30 font-extrabold px-5 py-2 rounded-xl text-xs hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  {editingManualIdx !== null
                                    ? `Simpan Perubahan Soal #${editingManualIdx + 1}`
                                    : `Tambah Soal #${manualSoalList.length + 1} ke Daftar`}
                                </button>
                              </div>
                            </div>

                            {/* List Preview of Manual Questions Added */}
                            {manualSoalList.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-extrabold text-sm flex items-center gap-2">
                                    Daftar Soal Manual Terbuat ({manualSoalList.length} Soal)
                                  </h4>
                                </div>

                                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                  {manualSoalList.map((item, index) => (
                                    <div key={item.id || index} className="p-4 rounded-2xl border border-border bg-card text-xs space-y-2 transition-all">
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="font-extrabold text-foreground text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                          Soal #{index + 1}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => handleStartEditParsedSoal(item)}
                                            className="text-muted-foreground hover:text-primary p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Edit Soal Ini"
                                          >
                                            <Pencil className="w-4 h-4" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRemoveManualSoal(index)}
                                            className="text-muted-foreground hover:text-danger p-1.5 rounded-lg transition-colors cursor-pointer"
                                            title="Hapus Soal Ini"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>

                                      {editingSoalId === item.id ? (
                                        <div className="space-y-3 pt-2 bg-background/80 p-4 rounded-xl border border-primary/40 text-left">
                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-muted-foreground">Pertanyaan Soal #{index + 1}</label>
                                            <textarea
                                              rows={2}
                                              value={editPertanyaan}
                                              onChange={(e) => setEditPertanyaan(e.target.value)}
                                              className="w-full bg-card border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-primary text-foreground font-semibold resize-y"
                                              placeholder="Tuliskan pertanyaan..."
                                            />
                                          </div>

                                          <div className="space-y-2">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                              <label className="block text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                                Opsi Pilihan Ganda ({editOpsi.length} Opsi)
                                                {!editJawabanHuruf && (
                                                  <span className="text-[10px] font-extrabold text-danger bg-danger/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Jawaban belum dipilih
                                                  </span>
                                                )}
                                              </label>
                                              <div className="flex items-center gap-2">
                                                {(editOpsi || []).length > 2 && (
                                                  <button
                                                    type="button"
                                                    onClick={handleRemoveEditOption}
                                                    className="text-xs font-extrabold text-danger bg-danger/10 hover:bg-danger/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                                    title={`Hapus Opsi Terakhir (${editOpsi[editOpsi.length - 1]?.huruf || String.fromCharCode(64 + editOpsi.length)})`}
                                                  >
                                                    <Trash2 className="w-3 h-3" /> Hapus Opsi {editOpsi[editOpsi.length - 1]?.huruf || String.fromCharCode(64 + editOpsi.length)}
                                                  </button>
                                                )}
                                                {(editOpsi || []).length < 5 && (
                                                  <button
                                                    type="button"
                                                    onClick={handleAddEditOption}
                                                    className="text-xs font-extrabold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                                                    title="Tambah Opsi Berikutnya"
                                                  >
                                                    <Plus className="w-3 h-3" /> Tambah Opsi {String.fromCharCode(65 + editOpsi.length)}
                                                  </button>
                                                )}
                                              </div>
                                            </div>

                                            <div className="space-y-2">
                                              {(editOpsi || []).map((opt, oIdx) => {
                                                const huruf = opt.huruf || String.fromCharCode(65 + oIdx);
                                                const isCorrect = editJawabanHuruf === huruf;
                                                const isLast = oIdx === editOpsi.length - 1;
                                                return (
                                                  <div key={oIdx} className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => setEditJawabanHuruf(huruf)}
                                                      className={`w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                                                        isCorrect
                                                          ? 'bg-success text-white border-success shadow-xs'
                                                          : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                                                      }`}
                                                      title={isCorrect ? 'Kunci Jawaban Benar' : 'Klik untuk jadikan Kunci Jawaban'}
                                                    >
                                                      {huruf}
                                                    </button>
                                                    <input
                                                      type="text"
                                                      value={opt.teks_opsi || ''}
                                                      onChange={(e) => {
                                                        const val = e.target.value;
                                                        setEditOpsi(prev => (prev || []).map((o, i) => i === oIdx ? { ...o, teks_opsi: val } : o));
                                                      }}
                                                      placeholder={`Pilihan ${huruf}...`}
                                                      className={`flex-1 bg-card border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary ${
                                                        isCorrect ? 'border-success/60 text-success font-bold bg-success/5' : 'border-border text-foreground'
                                                      }`}
                                                    />
                                                    {isCorrect && (
                                                      <span className="text-[10px] font-extrabold text-success bg-success/15 px-2 py-0.5 rounded-full shrink-0">
                                                        Kunci
                                                      </span>
                                                    )}
                                                    {isLast && (editOpsi || []).length > 2 && (
                                                      <button
                                                        type="button"
                                                        onClick={handleRemoveEditOption}
                                                        className="text-muted-foreground hover:text-danger p-1 rounded-lg shrink-0 cursor-pointer"
                                                        title={`Hapus Opsi ${huruf}`}
                                                      >
                                                        <X className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="block text-[11px] font-bold text-muted-foreground">Pembahasan (Opsional)</label>
                                            <input
                                              type="text"
                                              value={editPembahasan}
                                              onChange={(e) => setEditPembahasan(e.target.value)}
                                              className="w-full bg-card border border-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-primary text-foreground"
                                              placeholder="Penjelasan pembahasan..."
                                            />
                                          </div>

                                          <div className="flex justify-end gap-2 pt-2 border-t border-border">
                                            <button
                                              type="button"
                                              onClick={handleCancelEditParsedSoal}
                                              className="px-3 py-1.5 bg-muted text-muted-foreground font-extrabold text-xs rounded-xl hover:bg-muted/80 transition-all cursor-pointer"
                                            >
                                              Batal
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSaveEditParsedSoal(item.id)}
                                              className="px-4 py-1.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl hover:scale-105 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                                            >
                                              <Save className="w-3.5 h-3.5" /> Simpan
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="font-bold text-foreground text-sm">{item.pertanyaan}</p>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                                            {item.opsi.map((opt, oIdx) => (
                                              <div
                                                key={oIdx}
                                                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                                                  opt.benar
                                                    ? 'bg-success/15 border-success text-success font-bold'
                                                    : 'bg-background border-border text-foreground'
                                                }`}
                                              >
                                                <span className="font-extrabold">{opt.huruf}.</span>
                                                <span>{opt.teks_opsi}</span>
                                                {opt.benar && <span className="text-[10px] ml-auto bg-success text-white px-1.5 py-0.5 rounded font-extrabold">Kunci</span>}
                                              </div>
                                            ))}
                                          </div>

                                          {item.pembahasan && (
                                            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                              <span className="font-bold text-foreground">Pembahasan:</span> {item.pembahasan}
                                            </p>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateQuizOpen(false);
                          setEditingQuiz(null);
                        }}
                        className="bg-muted text-muted-foreground font-extrabold px-4 py-2 rounded-xl text-xs hover:bg-muted/80 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingQuiz || isUpdatingQuiz}
                        className="bg-primary text-primary-foreground font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-glow flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {editingQuiz ? 'Simpan Perubahan Quiz' : 'Simpan Soal & Terbitkan Quiz'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tabel Daftar Quiz */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 px-3">Mapel</th>
                        <th className="pb-3 px-3">Judul Quiz</th>
                        <th className="pb-3 px-3">Deskripsi</th>
                        <th className="pb-3 px-3">Jumlah Soal</th>
                        <th className="pb-3 px-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {isLoadingQuiz ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-muted-foreground">
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                              <span className="font-extrabold text-xs">Memuat daftar quiz...</span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredQuizList.length > 0 ? (
                        filteredQuizList.map((quiz, idx) => (
                          <tr key={quiz.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-3">
                              <span className="font-mono font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md text-[11px]">
                                {quiz.subject || 'PWP'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-foreground text-sm">{quiz.title}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="text-[11px] text-muted-foreground line-clamp-1">{quiz.description || '-'}</p>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-muted text-foreground font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-border">
                                {quiz.questionsCount || 0} Soal
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditQuiz(quiz)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Edit Quiz"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                  className="bg-muted hover:bg-danger/20 hover:text-danger text-muted-foreground font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer inline-flex items-center gap-1"
                                  title="Hapus Quiz"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : dbQuizList.length > 0 && filteredQuizList.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-muted-foreground italic">
                            Tidak ada quiz untuk mata pelajaran "{selectedQuizMapelFilter}".
                          </td>
                        </tr>
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-muted-foreground italic">
                            Belum ada quiz di kelas ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: PANEL VERIFIKASI MATERI ADMIN (KHUSUS OWNER) */}
          {activeTab === 'verification' && isOwner && (
            <div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-fade-in">
              {/* Header Title with Gold/Purple Badge */}
              <div className="flex items-start sm:items-center gap-3.5 border-b border-border/60 pb-5">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs shrink-0">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg tracking-tight text-foreground">Panel Verifikasi Materi Admin</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Review, setujui, atau minta perbaikan materi yang diajukan oleh Admin kelas.
                  </p>
                </div>
              </div>

              {/* Preview & Verification Modal / Box */}
              {verifyingMaterial && (() => {
                const hasPrevVersion = Boolean(verifyingMaterial.prevVersion?.content);
                return (
                  <div className="bg-background border border-border rounded-3xl p-6 shadow-xl space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-2.5 py-1 rounded-md uppercase">
                          {verifyingMaterial.subject}
                        </span>
                        <h4 className="font-extrabold text-base text-foreground mt-1">{verifyingMaterial.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {hasPrevVersion 
                            ? "Perbandingan Versi Sebelumnya vs Versi Baru Pengajuan Admin" 
                            : "Pengajuan Materi Baru oleh Admin"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setVerifyingMaterial(null)}
                        className="p-1.5 rounded-xl bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Comparison or Single View Grid */}
                    <div className={`grid grid-cols-1 ${hasPrevVersion ? 'md:grid-cols-2' : ''} gap-4`}>
                      {/* LEFT COLUMN: Versi Sebelumnya (Hanya jika ada versi sebelumnya) */}
                      {hasPrevVersion && (
                        <div className="p-4 rounded-2xl border border-border bg-card space-y-3">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <span className="font-extrabold text-xs text-muted-foreground flex items-center gap-1.5">
                              <History className="w-4 h-4 text-muted-foreground" />
                              Versi Sebelumnya ({verifyingMaterial.prevVersion?.version ? `v${verifyingMaterial.prevVersion.version}` : 'v1'})
                            </span>
                            <span className="bg-success/15 text-success font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                              Terverifikasi
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p className="font-semibold">Pembuat: <strong>{verifyingMaterial.prevVersion?.author || 'Owner'}</strong></p>
                          </div>
                          <div className="p-3 rounded-xl bg-background border border-border/50 text-xs leading-relaxed text-foreground min-h-[120px]">
                            <div dangerouslySetInnerHTML={{ __html: verifyingMaterial.prevVersion.content }} />
                          </div>
                        </div>
                      )}

                      {/* RIGHT / MAIN COLUMN: Versi Baru (Pengajuan Admin) */}
                      <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                          <span className="font-extrabold text-xs text-amber-500 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-amber-500" />
                            {hasPrevVersion ? `Versi Baru (v${verifyingMaterial.newVersion?.version || 2})` : 'Detail Materi Baru (v1)'}
                          </span>
                          <span className="bg-amber-500/20 text-amber-500 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                            Menunggu Verifikasi
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p className="font-semibold">Diajukan Oleh Admin: <strong>{verifyingMaterial.author}</strong></p>
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-amber-500/30 text-xs leading-relaxed text-foreground min-h-[120px]">
                          {verifyingMaterial.newVersion?.content || verifyingMaterial.content ? (
                            <div dangerouslySetInnerHTML={{ __html: verifyingMaterial.newVersion?.content || verifyingMaterial.content }} />
                          ) : (
                            <p className="italic text-muted-foreground">(Isi rangkuman baru kosong)</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions inside Preview */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-border">
                      <button
                        onClick={() => {
                          handleRejectPending(verifyingMaterial.id, verifyingMaterial.versiId, verifyingMaterial.title);
                          setVerifyingMaterial(null);
                        }}
                        className="bg-muted hover:bg-danger/20 hover:text-danger text-muted-foreground font-bold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Tolak Pengajuan
                      </button>
                      <button
                        onClick={() => {
                          handleApprovePending(verifyingMaterial.id, verifyingMaterial.versiId, verifyingMaterial.title);
                          setVerifyingMaterial(null);
                        }}
                        className="bg-success text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Verifikasi &amp; Terbitkan (Setujui)
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Pending List */}
              {pendingMaterials.length > 0 ? (
                <div className="space-y-3">
                  {pendingMaterials.map(item => (
                    <div key={item.id} className="bg-background border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-primary/40 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{item.subject}</span>
                          <h4 className="font-extrabold text-sm text-foreground">{item.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Diajukan oleh: <strong>{item.author}</strong> · {item.createdAt}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => setVerifyingMaterial(item)}
                          className="bg-primary/10 text-primary font-extrabold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> {Boolean(item.prevVersion?.content) ? 'Pratinjau & Bandingkan Versi' : 'Pratinjau Materi'}
                        </button>
                        <button
                          onClick={() => handleRejectPending(item.id, item.versiId, item.title)}
                          className="bg-muted hover:bg-danger/20 hover:text-danger text-muted-foreground font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => handleApprovePending(item.id, item.versiId, item.title)}
                          className="bg-success text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-sm hover:scale-105 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Verifikasi &amp; Terbitkan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="font-extrabold text-sm text-foreground">Semua Materi Telah Terverifikasi</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tidak ada pengajuan materi yang menunggu verifikasi saat ini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 7: RIWAYAT PERUBAHAN LOG (AUDIT TRAIL LOG SAKRAL) */}
          {activeTab === 'audit_log' && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="border-b border-border pb-3">
                <h3 className="font-extrabold text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" /> Riwayat Perubahan Kelas (Audit Trail Log)
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Catatan kronologis siapa mengubah apa di dalam kelas {className}.</p>
              </div>

              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-4 bg-background rounded-2xl border border-border flex items-start justify-between gap-4 shadow-xs">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 mt-0.5">
                        <Clock className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-foreground">{log.user}</span>
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                            {log.role}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">{log.action}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 8: ANGGOTA KELAS & KELOLA ADMIN */}
          {activeTab === 'members_view' && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <ClassAnggotaPage
                members={dbMemberList}
                currentRole={activeRole}
                isManagementMode={false}
                isLoading={isLoadingMembers}
              />
            </div>
          )}

          {activeTab === 'members' && (
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
              <ClassAnggotaPage
                members={dbMemberList}
                currentRole={activeRole}
                isManagementMode={true}
                isLoading={isLoadingMembers}
                onToggleAdmin={handleToggleAdminMember}
                onKickMember={handleKickMemberItem}
              />
            </div>
          )}

        </div>

      </div>

      <ClassSettingsModal
        isOpen={false}
        onClose={() => {}}
        cls={activeClass}
        currentRole="owner"
      />

      <ConfirmModal
        isOpen={isRegenConfirmOpen}
        onClose={() => setIsRegenConfirmOpen(false)}
        onConfirm={executeRegenCode}
        title="Buat Ulang Kode Kelas?"
        description="Apakah Anda yakin ingin membuat ulang kode kelas? Kode lama tidak akan berlaku lagi untuk siswa yang ingin bergabung."
        confirmText="Ya, Buat Kode Baru"
        cancelText="Batal"
        variant="primary"
      />

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        description={confirmModalState.description}
        confirmText={confirmModalState.confirmText}
        cancelText="Batal"
        variant={confirmModalState.variant}
      />
    </section>
  );
}
