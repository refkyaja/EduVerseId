import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';

export default function ClassMemberGuard({ children }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { classList, isLoadingClasses, fetchUserClasses, showToast } = useAppState();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const isRedirectingRef = useRef(false);

  const handleKicked = async (message) => {
    if (isRedirectingRef.current) return;
    isRedirectingRef.current = true;
    showToast(message || "Anda telah dikeluarkan dari kelas ini oleh pengelola kelas.");
    try {
      await fetchUserClasses();
    } catch (e) {}
    navigate('/', { replace: true });
  };

  useEffect(() => {
    isRedirectingRef.current = false;
    if (!classId) {
      navigate('/', { replace: true });
      return;
    }

    if (String(classId).startsWith('cls-')) {
      setHasAccess(true);
      setIsVerifying(false);
      return;
    }

    if (isLoadingClasses) {
      setIsVerifying(true);
      return;
    }

    let isMounted = true;

    const verifyAccess = async () => {
      const inList = classList.some(c => String(c.id) === String(classId));
      if (inList) {
        if (isMounted) {
          setHasAccess(true);
          setIsVerifying(false);
        }
        return;
      }

      try {
        const cls = await apiService.getClass(classId);
        if (!isMounted) return;
        if (cls) {
          setHasAccess(true);
          setIsVerifying(false);
        } else {
          handleKicked("Akses ditolak: Anda tidak terdaftar atau telah dikeluarkan dari kelas ini.");
        }
      } catch (err) {
        if (!isMounted) return;
        handleKicked("Akses ditolak: Anda tidak terdaftar atau telah dikeluarkan dari kelas ini.");
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, [classId, isLoadingClasses, classList]);

  useEffect(() => {
    if (!classId || String(classId).startsWith('cls-') || !hasAccess) return;

    let isMounted = true;

    const checkHeartbeat = async () => {
      if (isRedirectingRef.current) return;
      try {
        const cls = await apiService.getClass(classId);
        if (!isMounted) return;
        if (!cls) {
          handleKicked("Anda telah dikeluarkan dari kelas ini oleh pengelola kelas.");
        }
      } catch (err) {
        if (!isMounted) return;
        handleKicked("Anda telah dikeluarkan dari kelas ini oleh pengelola kelas.");
      }
    };

    const intervalId = setInterval(checkHeartbeat, 4000);

    const onAccessDenied = (e) => {
      if (!isMounted) return;
      const targetId = e.detail?.classId;
      if (!targetId || String(targetId) === String(classId)) {
        handleKicked("Anda telah dikeluarkan dari kelas ini oleh pengelola kelas.");
      }
    };

    window.addEventListener('eduverse-class-access-denied', onAccessDenied);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('eduverse-class-access-denied', onAccessDenied);
    };
  }, [classId, hasAccess]);

  if (isVerifying) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Memverifikasi keanggotaan kelas...</span>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return children;
}
