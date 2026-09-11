import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Lightbulb, Target, Shield, Snowflake, BookOpen, ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import PowerUpModal from '../components/PowerUpModal';
import MateriModal from '../components/MateriModal';
import { apiService } from '../services/apiService';

const DEFAULT_HOMEPAGE_MATERI = [
  {
    id: 'mat-demo-1',
    subject: 'PWP',
    subjectName: 'PWP (Pemrograman Web)',
    title: 'Pengenalan HTML5 & CSS3',
    content: 'Materi dasar mengenai elemen struktur HTML5 dan penataan tampilan dengan selektor CSS3.',
    status: 'verified',
    version: 1
  },
  {
    id: 'mat-demo-2',
    subject: 'IND',
    subjectName: 'Bahasa Indonesia',
    title: 'Tata Bahasa & Kalimat Efektif',
    content: 'Panduan tata bahasa Indonesia, aturan PUEBI, dan perancangan penulisan kalimat efektif.',
    status: 'verified',
    version: 1
  },
  {
    id: 'mat-demo-3',
    subject: 'MTK',
    subjectName: 'Matematika',
    title: 'Aljabar & Persamaan Linear',
    content: 'Pembahasan konsep dasar variabel aljabar dan penyelesaian persamaan linear dua variabel.',
    status: 'verified',
    version: 1
  }
];

export default function HomePage() {
  const { classId } = useParams();
  const { appState, getLevelInfo, findClass, getClassXp, materiList } = useAppState();
  const [isPowerUpOpen, setIsPowerUpOpen] = useState(false);
  const [dbMapelList, setDbMapelList] = useState([]);
  const [dbMateriList, setDbMateriList] = useState([]);
  const [selectedMateriId, setSelectedMateriId] = useState(null);
  const [selectedMateriObj, setSelectedMateriObj] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(classId));

  const activeClass = classId && findClass ? findClass(classId) : null;
  const isApiClass = Boolean(classId && !String(classId).startsWith('cls-') && !isNaN(Number(classId)));

  useEffect(() => {
    if (classId) {
      setIsLoading(true);
      if (isApiClass) {
        Promise.all([
          apiService.getMapel(classId).catch(() => []),
          apiService.getMateri(classId).catch(() => [])
        ]).then(([mapels, materis]) => {
          if (Array.isArray(mapels)) setDbMapelList(mapels);
          if (Array.isArray(materis)) setDbMateriList(materis);
        }).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }
  }, [classId, isApiClass]);

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

  const classXp = classId && getClassXp ? getClassXp(classId) : appState.xp;
  const levelInfo = getLevelInfo(classXp);
  const progressPercent = levelInfo.percent;

  const formattedApiMaterials = dbMateriList.map(item => {
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
      title: item.judul || item.title || 'Materi Pembelajaran',
      content: item.isi || item.versi_aktif?.isi || item.content || '',
      status: rawStatus,
      version: item.versi_aktif?.nomor_versi || item.versi_aktif?.versi || item.version || 1
    };
  });

  const rawMaterials = isApiClass ? formattedApiMaterials : [...formattedApiMaterials, ...(materiList || [])];
  const verifiedMaterials = rawMaterials.filter(m => {
    return m.status === 'terverifikasi' || m.status === 'verified' || m.status === 'Terverifikasi';
  });
  const displayMaterials = (verifiedMaterials.length > 0 ? verifiedMaterials : DEFAULT_HOMEPAGE_MATERI).slice(0, 3);

  return (
    <section className="px-4 md:px-8 pt-6 space-y-6 animate-fade-in flex flex-col max-w-7xl mx-auto w-full pb-24">
      {/* Grid for Hero Card & Status - 2 columns side-by-side even on mobile */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 items-stretch">
        {/* Hero Level Card */}
        <div className="bg-gradient-to-br from-primary via-primary to-primary-glow rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 text-primary-foreground shadow-glow relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-4 -bottom-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-primary-foreground/80 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest">Peringkat Saat Ini</p>
            <h2 className="text-sm sm:text-xl md:text-2xl font-extrabold mt-0.5 sm:mt-1 italic leading-tight">
              {levelInfo.level >= 10 ? 'Master Akademik' : levelInfo.level >= 5 ? 'Cendikiawan EduVerse' : levelInfo.level >= 1 ? 'Pelajar EduVerse' : 'Pemula EduVerse'}
            </h2>
          </div>
          <div className="relative z-10 mt-2 sm:mt-3 md:mt-4">
            <div className="flex justify-between text-[9px] sm:text-[10px] md:text-xs mb-1 font-bold italic">
              <span id="home-level-label">LEVEL {levelInfo.level}</span>
              <span id="home-xp-label" className="tabular-nums">{levelInfo.progress} / {levelInfo.max} XP</span>
            </div>
            <div className="w-full h-2 md:h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                id="home-level-progress-bar"
                className="h-full bg-gradient-to-r from-xp-gold to-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-card rounded-2xl md:rounded-3xl p-3.5 sm:p-4 md:p-5 border border-border flex flex-col justify-center items-center text-center space-y-1 sm:space-y-1.5 shadow-sm">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-muted-foreground" />
          <h4 className="font-extrabold text-xs sm:text-sm leading-snug">Status Kelas Active</h4>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground max-w-xs leading-tight">
            {activeClass ? activeClass.name : 'Ruang Pembelajaran EduVerse'}
          </p>
        </div>
      </div>

      {/* Power-Up Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Power Up</h3>
          <button onClick={() => setIsPowerUpOpen(true)} className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline">
            Lihat Semua <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 md:gap-4">
          <button onClick={() => setIsPowerUpOpen(true)} className="p-4 md:py-6 bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:scale-105 transition-all">
            <Lightbulb className="w-6 h-6 text-warning" strokeWidth={2.2} />
            <span className="text-[9px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Hint</span>
          </button>
          <button onClick={() => setIsPowerUpOpen(true)} className="p-4 md:py-6 bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:scale-105 transition-all">
            <Target className="w-6 h-6 text-brand-blue" strokeWidth={2.2} />
            <span className="text-[9px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">50:50</span>
          </button>
          <button onClick={() => setIsPowerUpOpen(true)} className="p-4 md:py-6 bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:scale-105 transition-all">
            <Shield className="w-6 h-6 text-success" strokeWidth={2.2} />
            <span className="text-[9px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Shield</span>
          </button>
          <button onClick={() => setIsPowerUpOpen(true)} className="p-4 md:py-6 bg-card rounded-2xl border border-border flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:scale-105 transition-all">
            <Snowflake className="w-6 h-6 text-sky-500" strokeWidth={2.2} />
            <span className="text-[9px] md:text-xs font-extrabold text-muted-foreground uppercase tracking-wider">Freeze</span>
          </button>
        </div>
      </div>

      {/* Materials Showcase */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-lg">Materi Pelajaran Baru</h3>
          <Link to={classId ? `/class/${classId}/materi` : '/materi'} className="text-primary text-xs font-bold flex items-center gap-0.5 hover:underline">
            Lihat Semua Materi <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-card rounded-3xl p-8 border border-border flex flex-col items-center justify-center text-center space-y-2 shadow-sm animate-pulse">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="font-extrabold text-xs text-foreground">Memuat Materi Pelajaran Kelas...</p>
          </div>
        ) : displayMaterials.length === 0 ? (
          <div className="bg-card rounded-3xl p-8 md:p-10 border border-border flex flex-col items-center justify-center text-center space-y-2 shadow-sm">
            <BookOpen className="w-8 h-8 text-muted-foreground/60" />
            <p className="font-extrabold text-sm text-foreground">Tidak Ada Materi Pelajaran</p>
            <p className="text-xs text-muted-foreground max-w-xs">Materi pelajaran belum ditambahkan di kelas ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayMaterials.map((materi, idx) => {
              const subjectCode = (materi.subject || 'MATERI').toUpperCase();
              const subjectName = materi.subjectName || subjectCode;
              const isV2 = (materi.version || 1) > 1;

              return (
                <div
                  key={materi.id || idx}
                  onClick={() => {
                    setSelectedMateriId(materi.id);
                    setSelectedMateriObj(materi);
                  }}
                  className="bg-card border border-border hover:border-primary/40 rounded-2xl p-4 shadow-sm transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 grid place-items-center text-primary font-extrabold text-xs shadow-sm shrink-0">
                      {subjectCode.slice(0, 4)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider block truncate">
                        {subjectName}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <h4 className="font-extrabold text-sm text-foreground truncate">{materi.title}</h4>
                        {isV2 && (
                          <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-primary/20 shrink-0 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> v{materi.version}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className="bg-muted group-hover:bg-primary/10 group-hover:text-primary text-muted-foreground p-2 rounded-xl transition-colors shrink-0"
                    title="Baca Materi Ini"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PowerUpModal isOpen={isPowerUpOpen} onClose={() => setIsPowerUpOpen(false)} />

      <MateriModal
        materi={selectedMateriObj}
        materiId={selectedMateriId}
        onClose={() => {
          setSelectedMateriId(null);
          setSelectedMateriObj(null);
        }}
      />
    </section>
  );
}
