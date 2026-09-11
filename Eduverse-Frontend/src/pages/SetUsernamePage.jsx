import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { authService } from '../services/authService';
import companionImg from '../assets/companion.png';

export default function SetUsernamePage() {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile } = useAppState();

  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [touched, setTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live validation for username availability
  useEffect(() => {
    let active = true;
    const val = username.trim();

    if (!val) {
      if (touched) {
        setFeedback({ tipe: 'error', text: 'Username wajib diisi.' });
      } else {
        setFeedback(null);
      }
      return () => { active = false; };
    }

    if (val.length < 3) {
      setFeedback({ tipe: 'error', text: 'Username minimal 3 karakter.' });
      return () => { active = false; };
    }

    const regex = /^[a-zA-Z0-9_-]+$/;
    if (!regex.test(val)) {
      setFeedback({ tipe: 'error', text: 'Hanya boleh huruf, angka, garis bawah (_), dan strip (-).' });
      return () => { active = false; };
    }

    setFeedback({ tipe: 'loading', text: 'Memeriksa ketersediaan...' });

    const timer = setTimeout(async () => {
      try {
        const res = await authService.checkUsername(val);
        if (!active) return;
        if (username.trim() !== val) return;

        if (res && res.available) {
          setFeedback({ tipe: 'sukses', text: 'Username tersedia' });
        } else {
          setFeedback({ tipe: 'error', text: res?.message || 'Username sudah digunakan, coba yang lain.' });
        }
      } catch (err) {
        if (!active) return;
        setFeedback(null);
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [username, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const val = username.trim();
    if (!val) {
      setErrorMsg('Silakan masukkan username yang Anda inginkan.');
      return;
    }

    if (feedback && feedback.tipe === 'error') {
      setErrorMsg(feedback.text);
      return;
    }

    setLoading(true);

    try {
      await updateUserProfile({ username: val });
      navigate('/', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan username.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/', { replace: true });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#17151d',
      color: '#f1f5f9',
      fontFamily: 'inherit',
      padding: '1.5rem'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2rem',
        borderRadius: '1.25rem',
        backgroundColor: '#201d29',
        border: '1.5px solid #383446',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={companionImg}
            alt="EduVerse Logo"
            style={{ height: '46px', width: 'auto', objectFit: 'contain', marginBottom: '0.75rem' }}
          />
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Tentukan Username Anda
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Halo <b>{currentUser?.name || 'Sobat EduVerse'}</b>! Silakan tentukan nama pengguna (username) unik yang ingin Anda gunakan.
          </p>
        </div>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.82rem'
          }}>
            <i className="bx bx-error-circle" style={{ fontSize: '1.1rem' }}></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#272433',
              border: `1.5px solid ${feedback?.tipe === 'error' ? '#ef4444' : feedback?.tipe === 'sukses' ? '#10b981' : '#454055'}`,
              borderRadius: '0.75rem',
              padding: '0 0.85rem',
              height: '46px',
              transition: 'border-color 0.2s'
            }}>
              <i className="bx bx-at" style={{ color: '#94a3b8', fontSize: '1.2rem', marginRight: '0.65rem' }}></i>
              <input
                type="text"
                placeholder="misal: refky_satria"
                value={username}
                onChange={(e) => {
                  setTouched(true);
                  setUsername(e.target.value);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f1f5f9',
                  fontSize: '0.9rem'
                }}
                autoFocus
              />
            </div>

            {feedback && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78rem',
                marginTop: '0.4rem',
                color: feedback.tipe === 'sukses' ? '#34d399' : feedback.tipe === 'loading' ? '#94a3b8' : '#f87171'
              }}>
                <i className={`bx ${feedback.tipe === 'sukses' ? 'bx-check-circle' : feedback.tipe === 'loading' ? 'bx-loader-alt bx-spin' : 'bx-x-circle'}`}></i>
                <span>{feedback.text}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (feedback && feedback.tipe === 'error')}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '0.75rem',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: loading || (feedback && feedback.tipe === 'error') ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(109, 40, 217, 0.35)',
              opacity: loading || (feedback && feedback.tipe === 'error') ? 0.7 : 1,
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <i className="bx bx-loader-alt bx-spin"></i>
                <span>Menyimpan Username...</span>
              </>
            ) : (
              <>
                <span>Simpan &amp; Mulai Belajar</span>
                <i className="bx bx-right-arrow-alt"></i>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleSkip}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.78rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Gunakan username acak bawaan &amp; lewati
          </button>
        </div>
      </div>
    </div>
  );
}
