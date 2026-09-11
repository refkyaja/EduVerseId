import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, BookOpen, ShieldAlert, Loader2, Search, Library, Trophy, Swords } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';

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
  UMUM: 'Kuis & Ujian Umum'
};

const MAPEL_GRADIENTS = {
  IND: 'from-indigo-500 to-purple-600',
  BIND: 'from-indigo-500 to-purple-600',
  MTK: 'from-rose-500 to-red-600',
  PWP: 'from-violet-500 to-fuchsia-600',
  WEB: 'from-violet-500 to-fuchsia-600',
  PPAN: 'from-amber-500 to-orange-600',
  PKN: 'from-amber-500 to-orange-600',
  ING: 'from-sky-500 to-blue-600',
  BING: 'from-sky-500 to-blue-600',
  PABP: 'from-emerald-500 to-teal-600',
  UMUM: 'from-primary to-primary-glow'
};

export function resolveSubjectCode(q) {
  if (q.subject && q.subject !== 'UMUM' && q.subject !== 'KUIS') {
    return q.subject.toUpperCase();
  }
  const title = (q.title || '').toLowerCase();
  if (title.includes('laravel') || title.includes('web') || title.includes('pwp') || title.includes('html')) return 'PWP';
  if (title.includes('matriks') || title.includes('matematika') || title.includes('persamaan') || title.includes('mtk')) return 'MTK';
  if (title.includes('inggris') || title.includes('english')) return 'ING';
  if (title.includes('indonesia') || title.includes('negosiasi') || title.includes('puisi') || title.includes('teks')) return 'BIND';
  if (title.includes('pancasila') || title.includes('pkn') || title.includes('ppan')) return 'PPAN';
  if (title.includes('pabp') || title.includes('agama')) return 'PABP';
  return 'UMUM';
}

export default function QuizPickerPage({ currentRole }) {
  const { classId } = useParams();
  const { findClass, quizList, currentUser, isLoadingClasses } = useAppState();
  const [apiQuizzes, setApiQuizzes] = useState([]);
  const [dbMapelList, setDbMapelList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState('ALL');

  const activeClass = classId && findClass ? findClass(classId) : null;
  const isApiClass = Boolean(classId && !String(classId).startsWith('cls-') && !isNaN(Number(classId)));

  const getRole = () => {
    if (currentRole) return String(currentRole).toLowerCase();
    if (activeClass?.role) return String(activeClass.role).toLowerCase();
    if (isApiClass && isLoadingClasses) return null;
    if (currentUser?.activeRole) return String(currentUser.activeRole).toLowerCase();
    if (currentUser?.role && currentUser.role !== 'user') return String(currentUser.role).toLowerCase();
    if (!isLoadingClasses && isApiClass && !activeClass) return null;
    return 'member';
  };

  const userRole = getRole();
  const isRoleLoading = userRole === null;
  const canManage = userRole === 'owner' || userRole === 'admin';

  const [isLoading, setIsLoading] = useState(Boolean(isApiClass && classId));

  useEffect(() => {
    if (isApiClass && classId) {
      setIsLoading(true);
      Promise.all([
        apiService.getMapel(classId).catch(() => []),
        apiService.getKuis(classId).catch(() => [])
      ]).then(([mapels, kuisRes]) => {
        if (Array.isArray(mapels)) setDbMapelList(mapels);
        const kList = kuisRes?.data || kuisRes || [];
        if (Array.isArray(kList)) setApiQuizzes(kList);
      }).catch(err => console.warn("Backend quizzes fetch notice:", err))
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [isApiClass, classId]);

  if (classId && !activeClass) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 space-y-4 animate-fade-in max-w-md mx-auto py-12">
        <div className="w-16 h-16 rounded-3xl bg-danger/10 text-danger flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold italic text-foreground">Akses Ditolak / Kelas Tidak Ditemukan</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Ruang kelas dengan ID <code className="text-primary font-mono bg-muted px-1.5 py-0.5 rounded">{classId}</code> tidak ditemukan atau Anda tidak terdaftar sebagai anggota di kelas ini.
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

  const formattedApiQuizzes = apiQuizzes.map(q => {
    const mapelObj = (dbMapelList || []).find(mp => String(mp.id) === String(q.mapel_id) || mp.kode === q.mapel_id) || q.mapel;
    const rawKode = q.mapel?.kode || mapelObj?.kode || (typeof q.subject === 'string' && isNaN(Number(q.subject)) ? q.subject : null);
    const rawNama = q.mapel?.nama || mapelObj?.nama || q.subjectName;

    const cleanKode = (rawKode || resolveSubjectCode(q)).toUpperCase();
    const cleanNama = (rawNama && rawNama !== 'Mata Pelajaran') ? rawNama : (MAPEL_NAME_MAP[cleanKode] || cleanKode);

    return {
      id: q.id,
      classId: classId,
      subject: cleanKode,
      subjectName: cleanNama,
      title: q.judul || q.title || 'Ujian / Kuis',
      timeLimit: q.batas_waktu || q.timeLimit || 30,
      questionsCount: q.soal_count ?? q.jumlah_soal ?? (Array.isArray(q.soal) ? q.soal.length : (Array.isArray(q.questions) ? q.questions.length : 0)),
      attemptsCount: 0,
      questions: q.soal || q.questions || []
    };
  });

  const localQuizzes = (quizList || []).filter(q => {
    if (!classId) return true;
    return q.classId === classId;
  }).map(q => {
    const mapelObj = (dbMapelList || []).find(mp => String(mp.id) === String(q.mapel_id) || mp.kode === q.subject || String(mp.id) === String(q.subject));
    const code = mapelObj?.kode || (q.subject && q.subject !== 'KUIS' ? q.subject : resolveSubjectCode(q));
    const name = mapelObj?.nama || MAPEL_NAME_MAP[code] || q.subjectName || code;
    return {
      ...q,
      subject: code,
      subjectName: name
    };
  });

  const allQuizzes = isApiClass
    ? formattedApiQuizzes
    : (formattedApiQuizzes.length > 0 ? formattedApiQuizzes : localQuizzes);

  const allMapelOptions = dbMapelList.length > 0
    ? dbMapelList
    : Array.from(new Set(allQuizzes.map(q => q.subject).filter(Boolean))).map(subj => ({
        id: subj,
        kode: subj,
        nama: MAPEL_NAME_MAP[subj] || subj
      }));

  const filteredQuizzes = allQuizzes.filter(q => {
    const matchesMapel = selectedMapelFilter === 'ALL' || q.subject === selectedMapelFilter;
    const qLower = searchQuery.trim().toLowerCase();
    const matchesSearch = !qLower ||
      q.title?.toLowerCase().includes(qLower) ||
      q.subjectName?.toLowerCase().includes(qLower) ||
      q.subject?.toLowerCase().includes(qLower);
    return matchesMapel && matchesSearch;
  });

  // Group Quizzes per Subject (Mapel)
  const subjectsMap = {};
  filteredQuizzes.forEach((quiz) => {
    const mapelObj = (dbMapelList || []).find(
      mp => String(mp.id) === String(quiz.subject) || mp.kode === quiz.subject
    );

    const code = (mapelObj?.kode || quiz.subject || 'UMUM').toUpperCase();
    const name = mapelObj?.nama || MAPEL_NAME_MAP[code] || quiz.subjectName || code;
    const gradient = MAPEL_GRADIENTS[code] || 'from-indigo-500 to-purple-600';

    if (!subjectsMap[code]) {
      subjectsMap[code] = {
        code,
        name,
        gradient,
        quizzes: []
      };
    }
    subjectsMap[code].quizzes.push(quiz);
  });

  const subjects = Object.values(subjectsMap);

  return (
    <section className="px-4 md:px-8 pt-6 space-y-6 animate-fade-in flex flex-col max-w-7xl mx-auto w-full pb-24">
      {/* Header Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-card via-card to-primary/10 border border-border rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0 shadow-sm">
            <Swords className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest border border-primary/20">Arena Ujian &amp; Kuis</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-tight text-foreground mt-0.5 leading-tight">Pilih Ujian &amp; Kuis</h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 leading-tight">Kerjakan ulangan untuk dapatkan XP, naik level, dan tingkatkan pemahaman.</p>
          </div>
        </div>
      </div>

      {/* Showcase Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 items-stretch">
        <div className="bg-card border border-border hover:border-primary/40 rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-sm transition-all flex items-center gap-3 md:gap-4 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0 group-hover:scale-110 transition-transform">
            <Library className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tabular-nums text-foreground tracking-tight leading-none">{subjects.length}</p>
            <p className="text-[9px] sm:text-[10px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider mt-1 leading-tight truncate">Mata Pelajaran</p>
          </div>
        </div>

        <div className="bg-card border border-border hover:border-primary/40 rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 shadow-sm transition-all flex items-center gap-3 md:gap-4 group min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 grid place-items-center text-amber-500 shrink-0 group-hover:scale-110 transition-transform">
            <Trophy className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tabular-nums text-foreground tracking-tight leading-none">{filteredQuizzes.length}</p>
            <p className="text-[9px] sm:text-[10px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider mt-1 leading-tight truncate">Total Ujian Diterbitkan</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kuis atau ujian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-background border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-primary transition-all h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-extrabold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Mapel Dropdown */}
        <div className="relative bg-background border border-border rounded-xl px-3 text-xs font-bold flex items-center h-[42px] shadow-xs shrink-0 max-w-[160px] sm:max-w-none">
          <select
            value={selectedMapelFilter}
            onChange={(e) => setSelectedMapelFilter(e.target.value)}
            className="bg-transparent appearance-none text-foreground font-bold text-xs focus:outline-none cursor-pointer pr-6 truncate w-full"
          >
            <option value="ALL" className="bg-card text-foreground font-normal text-xs">Semua Mapel</option>
            {allMapelOptions.map(m => (
              <option key={m.id || m.kode} value={m.kode} className="bg-card text-foreground font-normal text-xs">
                {m.kode} - {m.nama}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Quizzes Grouped by Subject (Mapel) */}
      {isLoading ? (
        <div className="bg-card rounded-3xl p-12 text-center space-y-3 shadow-sm border border-border flex flex-col items-center justify-center animate-pulse">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
          <h3 className="font-extrabold text-sm text-foreground">Memuat Kuis &amp; Ujian Kelas...</h3>
          <p className="text-xs text-muted-foreground">Mohon tunggu sebentar, sedang mengambil daftar kuis yang diterbitkan.</p>
        </div>
      ) : subjects.length > 0 ? (
        <div className="space-y-8">
          {subjects.map(s => (
            <section key={s.code} className="space-y-3">
              {/* Subject Group Header */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} grid place-items-center text-white font-extrabold text-[10px] shadow-md`}>
                  {s.code}
                </div>
                <h3 className="font-extrabold text-base text-foreground">{s.name}</h3>
              </div>

              {/* Quiz Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {s.quizzes.map((quiz, idx) => {
                  const num = String(idx + 1).padStart(2, '0');
                  const questionsCount = quiz.questionsCount || quiz.questions?.length || 5;
                  const effectiveClassId = classId || quiz.classId;
                  const playUrl = effectiveClassId
                    ? `/quiz/play?quizId=${quiz.id}&classId=${effectiveClassId}`
                    : `/quiz/play?quizId=${quiz.id}`;

                  return (
                    <Link
                      key={quiz.id || idx}
                      to={playUrl}
                      className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-xs font-extrabold text-muted-foreground shrink-0">
                        {num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {quiz.title}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {questionsCount} Soal · Ulangan / Kuis
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-3xl p-10 text-center space-y-3 shadow-sm border border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-extrabold text-lg">
            {(searchQuery || selectedMapelFilter !== 'ALL') ? 'Kuis Tidak Ditemukan' : 'Belum Ada Kuis di Kelas Ini'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {(searchQuery || selectedMapelFilter !== 'ALL')
              ? `Tidak ada kuis yang sesuai dengan pencarian "${searchQuery}" atau filter yang dipilih.`
              : 'Owner atau Admin belum membuat kuis atau ujian harian untuk kelas ini.'
            }
          </p>
          {(searchQuery || selectedMapelFilter !== 'ALL') ? (
            <div className="pt-2">
              <button
                onClick={() => { setSearchQuery(''); setSelectedMapelFilter('ALL'); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-2xl shadow-glow hover:scale-105 transition-all cursor-pointer"
              >
                <span>Reset Filter &amp; Pencarian</span>
              </button>
            </div>
          ) : (
            canManage && (
              <div className="pt-2">
                <Link
                  to={classId ? `/class/${classId}/add-quiz` : "/profile"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-2xl shadow-glow hover:scale-105 transition-all"
                >
                  <span>Kelola &amp; Buat Kuis Baru</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
