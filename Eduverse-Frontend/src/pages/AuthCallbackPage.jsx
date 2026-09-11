import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import companionImg from '../assets/companion.png';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleAuthTokenSuccess } = useAppState();
  const [errorMessage, setErrorMessage] = useState('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const token = searchParams.get('token');
    const isNew = searchParams.get('is_new_user') === '1';
    const error = searchParams.get('error');

    if (error) {
      setErrorMessage(decodeURIComponent(error));
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      return;
    }

    if (token) {
      handleAuthTokenSuccess(token)
        .then(() => {
          if (isNew) {
            navigate('/set-username', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        })
        .catch((err) => {
          setErrorMessage(err.message || 'Gagal memverifikasi login Google.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        });
    } else {
      setErrorMessage('Token autentikasi tidak ditemukan.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#17151d',
      color: '#f1f5f9',
      fontFamily: 'inherit',
      padding: '1.5rem',
      textAlign: 'center'
    }}>
      <div style={{
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2rem',
        borderRadius: '1.25rem',
        backgroundColor: '#201d29',
        border: '1.5px solid #383446',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
      }}>
        <img
          src={companionImg}
          alt="EduVerse"
          style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
        />

        {errorMessage ? (
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              marginBottom: '0.75rem'
            }}>
              <i className="bx bx-error-circle" style={{ fontSize: '2rem' }}></i>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>
              Autentikasi Gagal
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              {errorMessage}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>
              Mengalihkan kembali ke halaman login...
            </p>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 92, 246, 0.15)',
              color: '#8b5cf6',
              marginBottom: '0.75rem'
            }}>
              <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.2rem' }}></i>
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Menghubungkan Akun Google
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Mohon tunggu sebentar, kami sedang menyiapkan sesi EduVerse Anda...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
