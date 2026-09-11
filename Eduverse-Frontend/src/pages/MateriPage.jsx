import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, FileText, Plus, BookOpen, Library, BookOpenCheck, ShieldAlert, Loader2, Search } from 'lucide-react';
import MateriModal from '../components/MateriModal';
import VerificationBadge from '../components/VerificationBadge';
import MaterialVersionDropdown from '../components/MaterialVersionDropdown';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';

export default function MateriPage({ currentRole }) {
  const { classId } = useParams();
  const { findClass, materiList, currentUser, isLoadingClasses } = useAppState();
  const [selectedMateriId, setSelectedMateriId] = useState(null);
  const [apiMaterials, setApiMaterials] = useState([]);
  const [dbMapelList, setDbMapelList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapelFilter, setSelectedMapelFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(Boolean(classId));

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

  useEffect(() => {
    if (isApiClass && classId) {
      setIsLoading(true);
      Promise.all([
        apiService.getMapel(classId).catch(() => []),
        apiService.getMateri(classId).catch(() => [])
      ]).then(([mapels, materis]) => {
        if (Array.isArray(mapels)) setDbMapelList(mapels);
        if (Array.isArray(materis)) setApiMaterials(materis);
      }).finally(() => {
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

  // Filter materials for current class or global + combine API materials
  const localFiltered = isApiClass ? [] : (materiList || []).filter(m => {
    if (!classId) return true;
    return m.classId === classId || m.classId === 'global';
  });

  const formattedApiMaterials = apiMaterials.map(item => {
    const mapelObj = (dbMapelList || []).find(
      mp => String(mp.id) === String(item.mapel_id) || mp.kode === item.mapel_id || String(mp.id) === String(item.mapel?.id)
    ) || item.mapel;

    const rawKode = item.mapel?.kode || mapelObj?.kode || (typeof item.subject === 'string' && isNaN(Number(item.subject)) ? item.subject : null);
    const rawNama = item.mapel?.nama || mapelObj?.nama || item.subjectName;

    const cleanKode = (rawKode || 'UMUM').toUpperCase();
    const cleanNama = (rawNama && rawNama !== 'Mata Pelajaran' && rawNama !== cleanKode) ? rawNama : (cleanKode !== 'UMUM' ? cleanKode : 'Materi Umum');

    const rawStatus = item.versi_aktif?.status || (item.versi && item.versi.length > 0 ? item.versi[item.versi.length - 1].status : (item.status || 'menunggu_verifikasi'));

    return {
      id: item.id,
      classId: classId,
      subject: cleanKode,
      subjectName: cleanNama,
      title: item.judul || item.title,
      content: item.isi || item.versi_aktif?.isi || item.content || '',
      num: '01',
      status: rawStatus,
      version: item.versi_aktif?.nomor_versi || item.versi_aktif?.versi || item.version || 1,
      versi: item.versi || item.versions || [],
      versions: item.versi || item.versions || []
    };
  });

  const rawMaterials = isApiClass ? formattedApiMaterials : [...formattedApiMaterials, ...localFiltered];

  const filteredMaterials = rawMaterials.filter(m => {
    const isVerified = m.status === 'terverifikasi' || m.status === 'verified' || m.status === 'Terverifikasi';
    if (!isVerified) return false;

    const matchesMapel = selectedMapelFilter === 'ALL' || m.subject === selectedMapelFilter;
    const qLower = searchQuery.trim().toLowerCase();
    const matchesSearch = !qLower ||
      m.title?.toLowerCase().includes(qLower) ||
      m.subjectName?.toLowerCase().includes(qLower) ||
      m.subject?.toLowerCase().includes(qLower);
    return matchesMapel && matchesSearch;
  });

  const allMapelOptions = dbMapelList.length > 0
    ? dbMapelList
    : Array.from(new Set(rawMaterials.map(m => m.subject).filter(Boolean))).map(subj => ({
        id: subj,
        kode: subj,
        nama: subj
      }));

  const subjectsMap = {};
  filteredMaterials.forEach((m) => {
    const mapelObj = (dbMapelList || []).find(
      mp => String(mp.id) === String(m.subject) || mp.kode === m.subject || String(mp.id) === String(m.mapel_id)
    ) || dbMapelList[0];

    const rawKode = mapelObj?.kode || (isNaN(Number(m.subject)) && m.subject !== 'UMUM' ? m.subject : null) || 'MAPEL';
    const rawNama = mapelObj?.nama || (m.subjectName && isNaN(Number(m.subjectName)) && m.subjectName !== 'Mata Pelajaran' && m.subjectName !== 'Materi Umum' ? m.subjectName : null) || rawKode;

    const code = rawKode.toUpperCase();
    const name = rawNama;

    if (!subjectsMap[code]) {
      subjectsMap[code] = {
        code: code,
        name: name,
        gradient: 'from-indigo-500 to-purple-600',
        chapters: []
      };
    }
    subjectsMap[code].chapters.push({
      id: m.id,
      num: String(subjectsMap[code].chapters.length + 1).padStart(2, '0'),
      title: m.title,
      desc: 'Ringkasan · Materi Belajar',
      content: m.content,
      status: m.status || 'verified',
      version: m.version || 1
    });
  });

  const subjects = Object.values(subjectsMap);
  const totalMaterials = subjects.reduce((acc, s) => acc + (s.chapters?.length || 0), 0);
  const selectedMateriObj = rawMaterials.find(m => m.id === selectedMateriId) || null;

  return (
    <section className="px-4 md:px-8 pt-6 space-y-6 animate-fade-in flex flex-col max-w-7xl mx-auto w-full pb-24">
      {/* Header Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-card via-card to-primary/10 border border-border rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-6 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0 shadow-sm">
            <BookOpenCheck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div>
          <div>
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest border border-primary/20">Pusat Pembelajaran</span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-tight text-foreground mt-0.5 leading-tight">Materi Belajar</h1>
            <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 leading-tight">Rangkuman terstruktur &amp; materi pembelajaran interaktif per mata pelajaran.</p>
          </div>
        </div>
      </div>

      {/* 2 Metrics Showcase Grid - 2 columns side-by-side even on mobile */}
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
          <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-brand-blue/10 border border-brand-blue/30 grid place-items-center text-brand-blue shrink-0 group-hover:scale-110 transition-transform">
            <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tabular-nums text-foreground tracking-tight leading-none">{totalMaterials}</p>
            <p className="text-[9px] sm:text-[10px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider mt-1 leading-tight truncate">Total Materi Belajar</p>
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
            placeholder="Cari materi pembelajaran..."
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

      {/* Subject Chapters with Verification Badges & Version Dropdown or Loading / Empty State */}
      {isLoading ? (
        <div className="bg-card rounded-3xl p-12 text-center space-y-3 shadow-sm border border-border flex flex-col items-center justify-center animate-pulse">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
          <h3 className="font-extrabold text-sm text-foreground">Memuat Materi Kelas...</h3>
          <p className="text-xs text-muted-foreground">Mohon tunggu sebentar, sedang mengambil data materi pembelajaran.</p>
        </div>
      ) : subjects.length > 0 ? (
        <div className="space-y-8">
          {subjects.map(s => (
            <section key={s.code} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} grid place-items-center text-white font-extrabold text-[10px] shadow-md`}>
                  {s.code}
                </div>
                <h3 className="font-extrabold text-base">{s.name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {s.chapters.map((ch, idx) => (
                  <button
                    key={ch.id || idx}
                    type="button"
                    onClick={() => setSelectedMateriId(ch.id)}
                    className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-xs font-extrabold text-muted-foreground shrink-0">
                      {ch.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-foreground truncate">{ch.title}</p>
                        {ch.version && ch.version > 1 && (
                          <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                            v{ch.version}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{ch.desc || 'Ringkasan · Materi'}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-3xl p-10 text-center space-y-3 shadow-sm border border-border">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-extrabold text-lg">
            {(searchQuery || selectedMapelFilter !== 'ALL') ? 'Materi Tidak Ditemukan' : 'Belum Ada Materi Pelajaran'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {(searchQuery || selectedMapelFilter !== 'ALL')
              ? `Tidak ada materi yang sesuai dengan pencarian "${searchQuery}" atau filter yang dipilih.`
              : 'Owner atau Admin belum menambahkan materi pelajaran untuk kelas ini.'
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
                  to={classId ? `/class/${classId}/profile` : "/profile"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-extrabold text-xs rounded-2xl shadow-glow hover:scale-105 transition-all"
                >
                  <span>Kelola &amp; Tambah Materi</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )
          )}
        </div>
      )}

      <MateriModal
        materi={selectedMateriObj}
        materiId={selectedMateriId}
        onClose={() => setSelectedMateriId(null)}
      />
    </section>
  );
}
