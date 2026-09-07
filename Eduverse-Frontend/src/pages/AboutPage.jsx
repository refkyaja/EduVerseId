import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LogIn, Sparkles, Shield, BookOpen, Users, HelpCircle, ChevronRight, 
  CheckCircle2, Award, Zap, ChevronDown, BarChart3, ShieldCheck, Flame, 
  Trophy, ArrowRight, Layers, Star, MessageSquare, Heart, GraduationCap, Check, Globe
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';

export default function AboutPage() {
  const { currentUser, logoutUser } = useAppState();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(prev => prev === index ? null : index);
  };

  const faqList = [
    {
      q: "Apa itu EduVerse dan siapa saja yang dapat menggunakannya?",
      a: "EduVerse adalah platform pembelajaran digital berbasis gamifikasi yang dirancang untuk sekolah, pengajar, dan siswa. Platform ini memungkinkan pengguna membuat ruang kelas digital, mengunggah materi pelajaran bermultiversi, menyusun kuis interaktif berkonsep Boss Battle, serta memantau progres akademik secara real-time."
    },
    {
      q: "Apakah EduVerse gratis untuk digunakan oleh sekolah dan siswa?",
      a: "Ya! EduVerse sepenuhnya bebas biaya untuk digunakan oleh guru, siswa, dan sekolah. Semua fitur utama seperti pembuatan ruang kelas, pengelolaan materi, kuis RPG Boss Battle, dan papan peringkat dapat diakses tanpa biaya berlangganan dasar."
    },
    {
      q: "Bagaimana cara bergabung ke kelas atau membuat ruang kelas baru?",
      a: "Setelah mendaftar dan masuk ke akun EduVerse Anda, di Halaman Utama (Beranda) klik tombol '+' atau 'Opsi Kelas'. Pilih 'Buat Kelas' untuk membuat ruang kelas baru sebagai Owner, atau pilih 'Gabung Kelas' lalu masukkan 6-karakter Kode Kelas unik yang diberikan oleh pengajar Anda."
    },
    {
      q: "Bagaimana alur verifikasi materi antara Admin dan Owner bekerja?",
      a: "EduVerse menerapkan sistem kontrol kualitas bertingkat. Ketika seorang Admin mengajukan atau mengedit materi pelajaran, materi tersebut tidak langsung tayang umum melainkan masuk ke tab 'Verifikasi Materi Admin' di akun Owner. Owner dapat meninjau perbandingan versi baru vs versi lama sebelum menyetujui (Approve) atau menolak (Reject) perubahan tersebut."
    },
    {
      q: "Apa itu sistem Gamifikasi, XP, Level, dan Boss Battle Quiz?",
      a: "Sistem gamifikasi EduVerse mengubah latihan soal biasa menjadi pertarungan melawan Boss RPG. Setiap jawaban benar memberikan poin XP (Experience Points), meningkatkan Level pengguna (dari Pelajar hingga Master), dan memberikan bantuan Power-Ups seperti Hint, Shield, dan Freeze Timer untuk meningkatkan semangat belajar siswa."
    },
    {
      q: "Apakah data siswa, materi, dan rekap nilai terjamin keamanannya?",
      a: "Ya, EduVerse menggunakan arsitektur backend Laravel modern yang dilengkapi dengan otentikasi token berbasis API (Laravel Sanctum), isolasi data antar-kelas, dan audit log aktivitas terenkripsi sehingga seluruh rekap nilai dan informasi pribadi siswa tersimpan dengan aman."
    }
  ];

  const featuresList = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      bg: "bg-primary/10",
      title: "Ruang Kelas Multi-Role",
      desc: "Mendukung peran Owner (Pemilik Kelas), Admin (Pengelola Konten), dan Member (Siswa) dengan hak akses terisolasi yang aman."
    },
    {
      icon: <Zap className="w-6 h-6 text-warning" />,
      bg: "bg-warning/10",
      title: "Boss Battle Quiz RPG",
      desc: "Ujian interaktif berkonsep pertarungan boss dengan HP bar, batas waktu, dan bantuan power-up (Hint, Shield, Combo)."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-success" />,
      bg: "bg-success/10",
      title: "Versi & Verifikasi Materi",
      desc: "Setiap pembaruan materi oleh Admin memerlukan persetujuan Owner melalui modal perbandingan versi yang transparan."
    },
    {
      icon: <Trophy className="w-6 h-6 text-xp-gold" />,
      bg: "bg-amber-500/10",
      title: "Hall of Fame & Leaderboard",
      desc: "Papan peringkat kompetitif real-time berdasarkan perolehan XP dan akurasi kuis untuk memotivasi prestasi siswa."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-purple-500" />,
      bg: "bg-purple-500/10",
      title: "Analitik & Rekap Nilai",
      desc: "Laporan evaluasi statistik akurasi, riwayat percobaan kuis, dan pencatatan audit log aktivitas secara otomatis."
    },
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      bg: "bg-blue-500/10",
      title: "Keamanan Laravel Sanctum",
      desc: "Integrasi otentikasi token API backend yang tangguh untuk menjamin privasi data dan keandalan sistem."
    }
  ];

  const statsList = [
    { number: "10.000+", label: "Siswa & Pengajar Aktif" },
    { number: "500+", label: "Ruang Kelas Digital" },
    { number: "1.000.000+", label: "Soal Kuis Selesai" },
    { number: "99.8%", label: "Tingkat Kepuasan" }
  ];

  const testimonialsList = [
    {
      name: "Dra. Hajah Sumarni",
      role: "Guru Fisika SMA Negeri 1",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
      quote: "EduVerse mengubah suasana kelas fisika kami! Anak-anak yang tadinya takut kuis sekarang malah minta ujian Boss Battle setiap minggu."
    },
    {
      name: "Bagas Pratama",
      role: "Siswa Kelas XII (Peringkat #1 Leaderboard)",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      quote: "Berasa main game RPG online padahal lagi ngerjain soal latihan. Fitur power-up dan naik level bikin ketagihan belajar!"
    },
    {
      name: "Ir. Hendra Kusuma",
      role: "Kepala Laboratorium Komputer",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
      quote: "Fitur verifikasi materi Admin oleh Owner sangat berguna. Rekap nilai dan riwayat versi materi rapi dan mudah diaudit."
    }
  ];

  return (
    <div className="w-full min-h-screen text-slate-100 animate-fade-in flex flex-col" style={{ backgroundColor: '#25222D' }}>
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#454052] shadow-md" style={{ backgroundColor: 'rgba(52, 48, 62, 0.95)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/about" className="flex items-center gap-2.5 group">
              <img src="/assets/companion.png" alt="EduVerse Logo" className="h-9 w-auto object-contain group-hover:scale-105 transition-transform" />
              <span className="font-extrabold text-xl tracking-tight text-white">
                EduVerse<span className="text-[#f9bf29]">.</span>
              </span>
            </Link>

            {/* Sub-nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-extrabold text-slate-300">
              <a href="#fitur" className="hover:text-indigo-400 transition-colors">Fitur Utama</a>
              <a href="#misi" className="hover:text-indigo-400 transition-colors">Misi &amp; Nilai</a>
              <a href="#faq" className="hover:text-indigo-400 transition-colors">FAQ</a>
              <a href="#ulasan" className="hover:text-indigo-400 transition-colors">Ulasan</a>
            </nav>
          </div>

          {/* Top Right Action Buttons */}
          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <>
                <button
                  onClick={() => logoutUser()}
                  className="bg-red-500/15 text-red-300 border border-red-500/30 font-extrabold px-3.5 py-2 rounded-xl text-xs hover:bg-red-500/25 transition-all cursor-pointer"
                  title="Logout Akun"
                >
                  Logout ({currentUser.name.split(' ')[0]})
                </button>
                <Link
                  to="/"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 hover:scale-105 transition-all"
                >
                  <span>Buka Dashboard</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="bg-[#272430] hover:bg-[#3d394a] border border-[#454052] rounded-xl px-4 py-2 text-xs font-extrabold text-white transition-all shadow-sm"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:scale-105 rounded-xl px-4 py-2 text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                >
                  <span>Daftar Gratis</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body Container */}
      <main className="flex-1 space-y-20 pb-20">

        {/* 2. HERO SECTION */}
        <section className="relative pt-12 md:pt-20 px-4 md:px-8 max-w-7xl mx-auto w-full overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/25 rounded-full blur-3xl pointer-events-none -z-10"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                Ubah Kegiatan Belajar Menjadi <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-[#f9bf29] bg-clip-text text-transparent italic">Petualangan RPG</span> yang Seru.
              </h1>

              <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                EduVerse memadukan manajemen kelas digital modern dengan mekanik ujian Boss Battle RPG, papan peringkat real-time, dan alur verifikasi materi bertingkat untuk pengalaman belajar yang interaktif dan terukur.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                {currentUser ? (
                  <Link
                    to="/"
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold px-7 py-3.5 rounded-2xl text-xs md:text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                  >
                    <span>Masuk ke Ruang Kelas</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold px-7 py-3.5 rounded-2xl text-xs md:text-sm shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
                    >
                      <span>Mulai Gratis Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#fitur"
                      className="bg-[#34303E] hover:bg-[#3d394a] border border-[#454052] text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs md:text-sm transition-all inline-flex items-center gap-2 shadow-sm"
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Pelajari Fitur</span>
                    </a>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-bold text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>100% Gratis Tanpa Iklan</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Akses Browser Mobile &amp; Desktop</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Integrasi Backend API Laravel</span>
                </div>
              </div>
            </div>

            {/* Right Hero Column: Interactive Graphic Card Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-2xl space-y-5 backdrop-blur-xl">
                {/* Header Banner Preview */}
                <div className="flex items-center justify-between border-b border-[#454052] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#f9bf29]/15 text-[#f9bf29] flex items-center justify-center font-extrabold">
                      👑
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Kelas Fisika Lanjutan</h4>
                      <p className="text-[10px] font-bold text-slate-400">Kode: FSK999 · Role: Owner</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                    ● Live Active
                  </span>
                </div>

                {/* Leveling XP Preview */}
                <div className="bg-[#272430] border border-[#454052] rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400">Peringkat &amp; Progres XP</span>
                    <span className="text-[#f9bf29] font-extrabold">Lv. 5 Cendikiawan</span>
                  </div>
                  <div className="w-full bg-[#1e1c26] h-3 rounded-full overflow-hidden p-0.5 border border-[#454052]">
                    <div className="bg-gradient-to-r from-amber-400 to-[#f9bf29] h-full rounded-full w-[78%] transition-all"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-extrabold text-slate-400">
                    <span>1,250 XP</span>
                    <span>1,500 XP (Master)</span>
                  </div>
                </div>

                {/* Boss Battle Quiz Card Preview */}
                <div className="bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-red-950/50 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#f9bf29]" />
                      <span className="font-extrabold text-xs text-white">Ujian Akhir: Boss Titan Aljabar</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-red-500/25 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30">
                      HP 100/100
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-semibold">
                    "Selesaikan 10 soal aljabar linear untuk mengalahkan Boss dan membuka Badge Master!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. METRICS & IMPACT BAR */}
        <section className="bg-[#34303E] border-y border-[#454052] py-10 px-4 md:px-8">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statsList.map((stat, idx) => (
              <div key={idx} className="space-y-1 p-3">
                <p className="text-3xl md:text-4xl font-extrabold italic bg-gradient-to-r from-indigo-400 via-purple-400 to-[#f9bf29] bg-clip-text text-transparent tracking-tight">
                  {stat.number}
                </p>
                <p className="text-xs md:text-sm font-extrabold text-slate-300">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. MISI & NILA UTAMA */}
        <section id="misi" className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Misi Utama EduVerse
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              Kami percaya bahwa proses belajar menjadi jauh lebih efektif ketika dikemas secara menyenangkan, transparan, dan dapat diakses oleh siapa saja tanpa hambatan teknis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-md hover:border-indigo-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Gamifikasi Interaktif</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Mengubah latihan soal membosankan menjadi mode pertarungan RPG Boss Battle yang melatih fokus, kecepatan, dan pemahaman konsep.
              </p>
            </div>

            <div className="bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-md hover:border-indigo-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f9bf29]/20 text-[#f9bf29] flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Transparansi Konten</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Alur verifikasi multi-versi memastikan seluruh materi dan kuis diaudit dengan cermat oleh Pemilik Kelas sebelum disajikan kepada siswa.
              </p>
            </div>

            <div className="bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-md hover:border-indigo-500/50 transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Aksesibilitas Tanpa Batas</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Dapat diakses secara penuh melalui peramban ponsel, tablet, maupun komputer tanpa perlu memasang aplikasi tambahan yang berat.
              </p>
            </div>
          </div>
        </section>

        {/* 5. FITUR UNGGULAN GRID */}
        <section id="fitur" className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-wider border border-indigo-500/30">
              Ekosistem Terlengkap
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Fitur Unggulan EduVerse
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              Semua alat yang dibutuhkan oleh pengajar dan siswa dalam satu platform EdTech yang ramah pengguna.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((feat, idx) => (
              <div key={idx} className="bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-md hover:border-indigo-500/50 hover:shadow-indigo-500/10 transition-all space-y-3">
                <div className={`w-12 h-12 rounded-2xl ${feat.bg} flex items-center justify-center shrink-0`}>
                  {feat.icon}
                </div>
                <h3 className="font-extrabold text-base text-white">{feat.title}</h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. FAQ ACCORDION SECTION */}
        <section id="faq" className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-extrabold border border-indigo-500/30">
              <HelpCircle className="w-4 h-4" />
              <span>Pusat Bantuan &amp; Informasi</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Pertanyaan Yang Sering Diajukan (FAQ)
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              Temukan jawaban atas pertanyaan paling umum seputar cara kerja, penggunaan, dan keamanan EduVerse.
            </p>
          </div>

          {/* FAQ Accordion Item List */}
          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#34303E] border border-[#454052] rounded-2xl overflow-hidden shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-extrabold text-sm md:text-base flex items-center justify-between gap-4 cursor-pointer hover:bg-[#3d394a] transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs flex items-center justify-center font-extrabold shrink-0 border border-indigo-500/30">
                        Q{idx + 1}
                      </span>
                      <span className="text-white">{item.q}</span>
                    </span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#f9bf29]' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-[#454052] text-xs md:text-sm text-slate-300 font-medium leading-relaxed bg-[#272430] animate-fade-in pl-15">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. ULASAN & TESTIMONI */}
        <section id="ulasan" className="max-w-7xl mx-auto px-4 md:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="px-3 py-1 rounded-full bg-[#f9bf29]/20 text-[#f9bf29] text-xs font-extrabold uppercase tracking-wider border border-[#f9bf29]/30">
              Kata Mereka
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
              Ulasan Pengguna EduVerse
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonialsList.map((t, idx) => (
              <div key={idx} className="bg-[#34303E] border border-[#454052] rounded-3xl p-6 shadow-md flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-300 font-medium italic leading-relaxed">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3 border-t border-[#454052] pt-4">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-indigo-500/30 shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">{t.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. CALL TO ACTION BANNER */}
        <section className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl text-center space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <h2 className="text-2xl md:text-4xl font-extrabold italic tracking-tight">
              Mulai Petualangan Belajar EduVerse Sekarang!
            </h2>
            <p className="text-xs md:text-sm text-slate-100 max-w-xl mx-auto font-medium leading-relaxed">
              Bergabunglah bersama ribuan siswa dan pengajar lainnya. Buat kelas digital Anda dalam kurang dari 1 menit.
            </p>

            <div className="pt-2 flex justify-center gap-3 flex-wrap">
              {currentUser ? (
                <Link
                  to="/"
                  className="bg-white text-indigo-700 font-extrabold px-8 py-3.5 rounded-2xl text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Buka Dashboard Kelas</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-white/20 text-white font-extrabold px-6 py-3.5 rounded-2xl text-xs md:text-sm hover:bg-white/30 transition-all inline-flex items-center gap-2 border border-white/30"
                  >
                    <LogIn className="w-4 h-4" /> Masuk Akun
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-indigo-700 font-extrabold px-7 py-3.5 rounded-2xl text-xs md:text-sm shadow-lg hover:scale-105 transition-transform inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Daftar Akun Gratis</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

      </main>

      {/* 9. PROFESSIONAL FOOTER */}
      <footer className="w-full bg-[#1d1b24] border-t border-[#454052] text-slate-400 pt-12 pb-8 px-4 md:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img src="/assets/companion.png" alt="EduVerse Logo" className="h-8 w-auto object-contain" />
              <span className="font-extrabold text-lg text-white tracking-tight">
                EduVerse<span className="text-[#f9bf29]">.</span>
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed text-slate-400">
              Platform EdTech gamifikasi interaktif terintegrasi Laravel API Sanctum untuk sekolah modern di Indonesia.
            </p>
          </div>

          {/* Col 2: Navigasi Platform */}
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">Platform</h4>
            <ul className="space-y-1.5 font-semibold text-slate-300">
              <li><Link to="/" className="hover:text-indigo-400 transition-colors">Beranda Ruang Kelas</Link></li>
              <li><a href="#fitur" className="hover:text-indigo-400 transition-colors">Fitur Unggulan</a></li>
              <li><a href="#misi" className="hover:text-indigo-400 transition-colors">Misi &amp; Nilai Utama</a></li>
              <li><a href="#faq" className="hover:text-indigo-400 transition-colors">Pusat Bantuan (FAQ)</a></li>
            </ul>
          </div>

          {/* Col 3: Solusi Sekolah */}
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">Solusi Edukasi</h4>
            <ul className="space-y-1.5 font-semibold text-slate-400">
              <li><span>Manajemen Kelas Digital</span></li>
              <li><span>Kuis Boss Battle RPG</span></li>
              <li><span>Verifikasi &amp; Multi-Versi</span></li>
              <li><span>Leaderboard &amp; Hall of Fame</span></li>
            </ul>
          </div>

          {/* Col 4: Hak Cipta & Informasi */}
          <div className="space-y-2 text-xs">
            <h4 className="font-extrabold text-white uppercase tracking-wider text-[11px]">Teknologi</h4>
            <p className="font-semibold text-slate-400 leading-relaxed">
              Dikembangkan dengan standar React, TailwindCSS, Lucide Icons, dan Backend Laravel API Framework.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#454052] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs font-bold gap-3 text-slate-400">
          <p>© {new Date().getFullYear()} EduVerse Inc. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Kebijakan Privasi</span>
            <span>·</span>
            <span className="hover:text-indigo-400 transition-colors cursor-pointer">Syarat &amp; Ketentuan</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
