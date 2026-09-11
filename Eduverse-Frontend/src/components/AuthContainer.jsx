import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { authService } from '../services/authService';
import companionImg from '../assets/companion.png';

export default function AuthContainer({ initialMode = 'login' }) {
  const navigate = useNavigate();
  const { loginUser, registerUser } = useAppState();

  const [activeClass, setActiveClass] = useState('');

  // Form State Sign-In
  const [emailMasuk, setEmailMasuk] = useState('');
  const [passwordMasuk, setPasswordMasuk] = useState('');
  const [showPasswordMasuk, setShowPasswordMasuk] = useState(false);
  const [loadingMasuk, setLoadingMasuk] = useState(false);
  const [pesanMasuk, setPesanMasuk] = useState(null); // { text, tipe }

  // Form State Sign-Up
  const [namaDaftar, setNamaDaftar] = useState('');
  const [usernameDaftar, setUsernameDaftar] = useState('');
  const [emailDaftar, setEmailDaftar] = useState('');
  const [passwordDaftar, setPasswordDaftar] = useState('');
  const [ulangiDaftar, setUlangiDaftar] = useState('');
  const [showPasswordDaftar, setShowPasswordDaftar] = useState(false);
  const [showUlangiDaftar, setShowUlangiDaftar] = useState(false);
  const [loadingDaftar, setLoadingDaftar] = useState(false);
  const [pesanDaftar, setPesanDaftar] = useState(null);
  const [feedbackUsername, setFeedbackUsername] = useState(null);
  const [usernameDisentuh, setUsernameDisentuh] = useState(false);

  // Toast System State
  const [toasts, setToasts] = useState([]);

  // Canvas Reference
  const canvasRef = useRef(null);

  useEffect(() => {
    const targetClass = initialMode === 'register' ? 'sign-up' : 'sign-in';
    const timer = setTimeout(() => {
      setActiveClass(targetClass);
    }, 150);
    return () => clearTimeout(timer);
  }, [initialMode]);

  useEffect(() => {
    let aktif = true;
    const nilai = usernameDaftar.trim();

    if (!nilai) {
      if (usernameDisentuh) {
        setFeedbackUsername({
          tipe: 'error',
          teks: 'Username wajib diisi.'
        });
      } else {
        setFeedbackUsername(null);
      }
      return () => {
        aktif = false;
      };
    }

    if (nilai.length < 3) {
      setFeedbackUsername({
        tipe: 'error',
        teks: 'Username minimal 3 karakter.'
      });
      return () => {
        aktif = false;
      };
    }

    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(nilai)) {
      setFeedbackUsername({
        tipe: 'error',
        teks: 'Username hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.'
      });
      return () => {
        aktif = false;
      };
    }

    setFeedbackUsername({
      tipe: 'loading',
      teks: 'Memeriksa ketersediaan...'
    });

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(nilai);
        if (!aktif) return;
        if (usernameDaftar.trim() !== nilai) return;
        if (res && res.available) {
          setFeedbackUsername({
            tipe: 'tersedia',
            teks: 'Username tersedia'
          });
        } else {
          setFeedbackUsername({
            tipe: 'error',
            teks: res?.message || 'Username sudah digunakan, coba yang lain.'
          });
        }
      } catch (err) {
        if (!aktif) return;
        setFeedbackUsername(null);
      }
    }, 450);

    return () => {
      aktif = false;
      clearTimeout(timer);
    };
  }, [usernameDaftar, usernameDisentuh]);

  // Particle Canvas Background Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buatPartikel();
    };

    class Partikel {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1.2;
        this.speedX = (Math.random() - 0.5) * 0.7;
        this.speedY = (Math.random() - 0.5) * 0.7;
        this.warna = Math.random() > 0.35 ? 'rgba(139, 92, 246, 0.4)' : 'rgba(249, 191, 41, 0.6)';
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        if (mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let jarak = Math.sqrt(dx * dx + dy * dy);
          if (jarak < 120) {
            let gaya = (120 - jarak) / 120;
            let sudut = Math.atan2(dy, dx);
            this.x -= Math.cos(sudut) * gaya * 2;
            this.y -= Math.sin(sudut) * gaya * 2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.warna;
        ctx.fill();
      }
    }

    function buatPartikel() {
      particles = [];
      const jumlah = Math.min(70, Math.floor((canvas.width * canvas.height) / 18000));
      for (let i = 0; i < jumlah; i++) {
        particles.push(new Partikel());
      }
    }

    function hubungkanPartikel() {
      const maxJarak = 125;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let jarak = Math.sqrt(dx * dx + dy * dy);

          if (jarak < maxJarak) {
            let opasitas = (1 - jarak / maxJarak) * 0.22;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(139, 92, 246, ${opasitas})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    }

    function animateCanvas() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      hubungkanPartikel();
      animationFrameId = requestAnimationFrame(animateCanvas);
    }

    resizeCanvas();
    animateCanvas();

    const handleResize = () => resizeCanvas();
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };
    const handleTouchEnd = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  const addToast = (judul, deskripsi, tipe = 'sukses') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, judul, deskripsi, tipe, muncul: false }]);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, muncul: true } : t)));
    }, 30);

    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, muncul: false } : t)));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 350);
    }, 3500);
  };

  const toggle = () => {
    const nextMode = activeClass === 'sign-in' ? 'sign-up' : 'sign-in';
    setActiveClass(nextMode);
    setPesanMasuk(null);
    setPesanDaftar(null);
    setFeedbackUsername(null);
    setUsernameDisentuh(false);
    if (nextMode === 'sign-up') {
      window.history.pushState({}, '', '/register');
    } else {
      window.history.pushState({}, '', '/login');
    }
  };

  const handleMasukSubmit = async (e) => {
    if (e) e.preventDefault();
    setPesanMasuk(null);

    if (!emailMasuk.trim()) {
      setPesanMasuk({ text: 'Alamat email wajib diisi.', tipe: 'gagal' });
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(emailMasuk.trim())) {
      setPesanMasuk({ text: 'Format email tidak valid.', tipe: 'gagal' });
      return;
    }
    if (!passwordMasuk) {
      setPesanMasuk({ text: 'Kata sandi wajib diisi.', tipe: 'gagal' });
      return;
    }

    setLoadingMasuk(true);

    try {
      await loginUser({ email: emailMasuk, password: passwordMasuk });
      setPesanMasuk({ text: 'Berhasil masuk! Mengalihkan ke beranda...', tipe: 'berhasil' });
      addToast('Berhasil Masuk', `Selamat datang kembali, ${emailMasuk.split('@')[0]}!`, 'sukses');

      setTimeout(() => {
        navigate('/');
      }, 1200);
    } catch (err) {
      const errorMsg = err.message || 'Login gagal. Periksa kembali email dan password Anda.';
      setPesanMasuk({ text: errorMsg, tipe: 'gagal' });
      addToast('Gagal Masuk', errorMsg, 'peringatan');
    } finally {
      setLoadingMasuk(false);
    }
  };

  const handleDaftarSubmit = async (e) => {
    if (e) e.preventDefault();
    setPesanDaftar(null);

    if (!namaDaftar.trim()) {
      setPesanDaftar({ text: 'Nama lengkap wajib diisi.', tipe: 'gagal' });
      return;
    }
    if (!usernameDaftar.trim()) {
      setUsernameDisentuh(true);
      setFeedbackUsername({
        tipe: 'error',
        teks: 'Username wajib diisi.'
      });
      setPesanDaftar({ text: 'Username wajib diisi.', tipe: 'gagal' });
      return;
    }
    if (feedbackUsername && feedbackUsername.tipe === 'error') {
      setPesanDaftar({ text: feedbackUsername.teks, tipe: 'gagal' });
      return;
    }
    if (!emailDaftar.trim()) {
      setPesanDaftar({ text: 'Email wajib diisi.', tipe: 'gagal' });
      return;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(emailDaftar.trim())) {
      setPesanDaftar({ text: 'Format email tidak valid.', tipe: 'gagal' });
      return;
    }
    if (passwordDaftar.length < 8) {
      setPesanDaftar({ text: 'Password minimal 8 karakter.', tipe: 'gagal' });
      return;
    }
    if (passwordDaftar !== ulangiDaftar) {
      setPesanDaftar({ text: 'Konfirmasi password tidak sesuai.', tipe: 'gagal' });
      return;
    }

    setLoadingDaftar(true);

    const finalUsername = usernameDaftar.trim();

    try {
      await registerUser({
        name: namaDaftar.trim(),
        username: finalUsername,
        email: emailDaftar.trim(),
        password: passwordDaftar,
        password_confirmation: ulangiDaftar,
      });
      setPesanDaftar({ text: 'Akun berhasil dibuat! Silakan masuk.', tipe: 'berhasil' });
      addToast('Akun Dibuat', 'Pendaftaran sukses. Beralih ke form masuk...', 'sukses');

      setTimeout(() => {
        toggle();
        setEmailMasuk(emailDaftar);
      }, 1100);
    } catch (err) {
      if (err.errors && err.errors.username && err.errors.username.length > 0) {
        setFeedbackUsername({
          tipe: 'error',
          teks: err.errors.username[0]
        });
      }
      const errorMsg = err.message || 'Pendaftaran gagal. Periksa kembali data yang dimasukkan.';
      setPesanDaftar({ text: errorMsg, tipe: 'gagal' });
      addToast('Gagal Mendaftar', errorMsg, 'peringatan');
    } finally {
      setLoadingDaftar(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Canvas Interactive Background */}
      <canvas id="bgCanvas" ref={canvasRef}></canvas>

      {/* Toast Container */}
      <div id="toastContainer" className="toast-box">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-item ${toast.tipe} ${toast.muncul ? 'muncul' : ''}`}
          >
            <i
              className={`bx ${toast.tipe === 'sukses' ? 'bx-check-circle' : 'bx-info-circle'}`}
              style={{ fontSize: '1.3rem', color: toast.tipe === 'sukses' ? '#10b981' : '#ef4444' }}
            ></i>
            <div>
              <strong style={{ fontSize: '0.86rem', color: '#222', display: 'block' }}>
                {toast.judul}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#666' }}>{toast.deskripsi}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Auth Container */}
      <div id="container" className={`container ${activeClass}`}>
        <div className="row">
          {/* ================= SIGN UP FORM (Left Col) ================= */}
          <div className="col align-items-center flex-col sign-up">
            <div className="form-wrapper align-items-center">
              <div className="form sign-up">
                <div className="brand-logo-wrap">
                  <Link to="/about" className="brand-link">
                    <img src={companionImg} alt="EduVerse Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                    <span className="brand-text">
                      EduVerse<span>.</span>
                    </span>
                  </Link>
                </div>

                <form id="formDaftar" onSubmit={handleDaftarSubmit}>
                  <div className="input-group">
                    <i className="bx bxs-user field-icon"></i>
                    <input
                      type="text"
                      id="namaDaftar"
                      placeholder="Nama lengkap"
                      autoComplete="name"
                      value={namaDaftar}
                      onChange={(e) => setNamaDaftar(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <i className="bx bx-at field-icon"></i>
                    <input
                      type="text"
                      id="usernameDaftar"
                      placeholder="Username"
                      autoComplete="username"
                      value={usernameDaftar}
                      onBlur={() => {
                        setUsernameDisentuh(true);
                        if (!usernameDaftar.trim()) {
                          setFeedbackUsername({
                            tipe: 'error',
                            teks: 'Username wajib diisi.'
                          });
                        }
                      }}
                      onChange={(e) => {
                        setUsernameDisentuh(true);
                        setUsernameDaftar(e.target.value);
                      }}
                      className={
                        feedbackUsername
                          ? feedbackUsername.tipe === 'error'
                            ? 'has-error'
                            : feedbackUsername.tipe === 'tersedia'
                            ? 'has-success'
                            : ''
                          : ''
                      }
                    />
                  </div>
                  {feedbackUsername && (
                    <div
                      id="pesanValidasiUsername"
                      className={`field-feedback ${feedbackUsername.tipe}`}
                    >
                      <i
                        className={`bx ${
                          feedbackUsername.tipe === 'tersedia'
                            ? 'bx-check-circle'
                            : feedbackUsername.tipe === 'loading'
                            ? 'bx-loader-alt bx-spin'
                            : 'bx-x-circle'
                        }`}
                      ></i>
                      <span>{feedbackUsername.teks}</span>
                    </div>
                  )}
                  <div className="input-group">
                    <i className="bx bx-envelope field-icon"></i>
                    <input
                      type="email"
                      id="emailDaftar"
                      placeholder="Email aktif"
                      autoComplete="email"
                      value={emailDaftar}
                      onChange={(e) => setEmailDaftar(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <i className="bx bxs-lock-alt field-icon"></i>
                    <input
                      type={showPasswordDaftar ? 'text' : 'password'}
                      id="passwordDaftar"
                      placeholder="Password minimal 8 karakter"
                      autoComplete="new-password"
                      value={passwordDaftar}
                      onChange={(e) => setPasswordDaftar(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPasswordDaftar(!showPasswordDaftar)}
                      aria-label="Toggle password"
                    >
                      <i className={`bx ${showPasswordDaftar ? 'bx-hide' : 'bx-show'}`}></i>
                    </button>
                  </div>
                  <div className="input-group">
                    <i className="bx bxs-check-shield field-icon"></i>
                    <input
                      type={showUlangiDaftar ? 'text' : 'password'}
                      id="ulangiDaftar"
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      value={ulangiDaftar}
                      onChange={(e) => setUlangiDaftar(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowUlangiDaftar(!showUlangiDaftar)}
                      aria-label="Toggle password"
                    >
                      <i className={`bx ${showUlangiDaftar ? 'bx-hide' : 'bx-show'}`}></i>
                    </button>
                  </div>

                  {pesanDaftar && (
                    <div className={`pesan muncul ${pesanDaftar.tipe}`} id="pesanDaftar">
                      <i
                        className={`bx ${pesanDaftar.tipe === 'berhasil' ? 'bxs-check-circle' : 'bxs-error-circle'}`}
                        style={{ fontSize: '1.15rem' }}
                      ></i>
                      <span>{pesanDaftar.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="tombolDaftar"
                    className="btn-action"
                    disabled={loadingDaftar}
                  >
                    {loadingDaftar ? (
                      <>
                        <i className="bx bx-loader-alt bx-spin"></i>
                        <span>Mendaftarkan Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Daftar Sekarang</span>
                        <i className="bx bx-right-arrow-alt"></i>
                      </>
                    )}
                  </button>
                </form>

                <p>
                  <span>Sudah punya akun? </span>
                  <b onClick={toggle} className="pointer">
                    Masuk di sini
                  </b>
                </p>

                <p>
                  <Link className="tautan-beranda" to="/about">
                    <i className="bx bx-home-alt"></i> Kembali ke Beranda
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* ================= SIGN IN FORM (Right Col) ================= */}
          <div className="col align-items-center flex-col sign-in">
            <div className="form-wrapper align-items-center">
              <div className="form sign-in">
                <div className="brand-logo-wrap">
                  <Link to="/about" className="brand-link">
                    <img src={companionImg} alt="EduVerse Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                    <span className="brand-text">
                      EduVerse<span>.</span>
                    </span>
                  </Link>
                </div>

                <form id="formMasuk" onSubmit={handleMasukSubmit}>
                  <div className="input-group">
                    <i className="bx bx-envelope field-icon"></i>
                    <input
                      type="email"
                      id="emailMasuk"
                      placeholder="Email terdaftar"
                      autoComplete="email"
                      value={emailMasuk}
                      onChange={(e) => setEmailMasuk(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <i className="bx bxs-lock-alt field-icon"></i>
                    <input
                      type={showPasswordMasuk ? 'text' : 'password'}
                      id="passwordMasuk"
                      placeholder="Kata sandi"
                      autoComplete="current-password"
                      value={passwordMasuk}
                      onChange={(e) => setPasswordMasuk(e.target.value)}
                    />
                    <button
                      type="button"
                      className="toggle-pass"
                      onClick={() => setShowPasswordMasuk(!showPasswordMasuk)}
                      aria-label="Toggle password"
                    >
                      <i className={`bx ${showPasswordMasuk ? 'bx-hide' : 'bx-show'}`}></i>
                    </button>
                  </div>

                  {pesanMasuk && (
                    <div className={`pesan muncul ${pesanMasuk.tipe}`} id="pesanMasuk">
                      <i
                        className={`bx ${pesanMasuk.tipe === 'berhasil' ? 'bxs-check-circle' : 'bxs-error-circle'}`}
                        style={{ fontSize: '1.15rem' }}
                      ></i>
                      <span>{pesanMasuk.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="tombolMasuk"
                    className="btn-action"
                    disabled={loadingMasuk}
                  >
                    {loadingMasuk ? (
                      <>
                        <i className="bx bx-loader-alt bx-spin"></i>
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <i className="bx bx-log-in-circle"></i>
                      </>
                    )}
                  </button>
                </form>

                <p>
                  <span>Belum punya akun? </span>
                  <b onClick={toggle} className="pointer">
                    Daftar sekarang
                  </b>
                </p>

                <p>
                  <Link className="tautan-beranda" to="/about">
                    <i className="bx bx-home-alt"></i> Kembali ke Beranda
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CONTENT OVERLAY (SLIDING TEXT & GRAPHICS) ================= */}
        <div className="row content-row">
          {/* Sign In Panel Text (Left Side during Sign-In) */}
          <div className="col align-items-center flex-col">
            <div className="text sign-in">
              <div className="text-badge">
                <i className="bx bxs-invader"></i> Ruang Kelas &amp; Gamifikasi
              </div>
              <h2>Selamat datang kembali!</h2>
              <p>
                Akses materi pembelajaran interaktif, taklukkan Kuis Boss Battle, naikkan Level XP,
                dan pantau papan peringkat di EduVerse.
              </p>
            </div>
            <div className="img sign-in">
              {/* Vector Book & Cap SVG Illustration */}
              <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M100 45 C75 35 35 38 20 44 V95 C35 89 75 86 100 96 C125 86 165 89 180 95 V44 C165 38 125 35 100 45 Z"
                  fill="#ffffff"
                  fillOpacity="0.95"
                />
                <path d="M100 45 V96" stroke="#4f46e5" strokeWidth="3" strokeLinecap="round" />
                <path d="M100 20 L55 35 L100 50 L145 35 Z" fill="#f9bf29" />
                <path d="M145 35 V55" stroke="#f9bf29" strokeWidth="3" strokeLinecap="round" />
                <circle cx="145" cy="58" r="4" fill="#f9bf29" />
              </svg>
            </div>
          </div>

          {/* Sign Up Panel Text (Right Side during Sign-Up) */}
          <div className="col align-items-center flex-col">
            <div className="img sign-up">
              {/* Vector Certificate SVG Illustration */}
              <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="45" y="24" width="110" height="78" rx="10" fill="#ffffff" fillOpacity="0.95" />
                <rect x="60" y="38" width="80" height="6" rx="3" fill="#4f46e5" fillOpacity="0.8" />
                <rect x="60" y="50" width="55" height="5" rx="2.5" fill="#4f46e5" fillOpacity="0.4" />
                <rect x="60" y="60" width="65" height="5" rx="2.5" fill="#4f46e5" fillOpacity="0.4" />
                <circle cx="130" cy="74" r="14" fill="#f9bf29" />
                <polygon points="126,88 130,78 134,88 130,85" fill="#f9bf29" />
              </svg>
            </div>
            <div className="text sign-up">
              <div className="text-badge">
                <i className="bx bxs-trophy"></i> Boss Battle &amp; Leaderboard
              </div>
              <h2>Mulai petualangan belajar!</h2>
              <p>
                Gabung di EduVerse untuk mengelola ruang kelas digital, menyusun kuis RPG interaktif,
                serta raih prestasi di Hall of Fame.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

