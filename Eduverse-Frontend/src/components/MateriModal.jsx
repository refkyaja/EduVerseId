import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Languages, Maximize2, Minimize2, History } from 'lucide-react';
import { MATERI_DATA } from '../data/materiData';
import { apiService } from '../services/apiService';

export default function MateriModal({ materi, materiId, onClose }) {
  const [fullMateri, setFullMateri] = useState(null);

  useEffect(() => {
    setFullMateri(null);
    const targetClassId = materi?.classId;
    const targetId = materi?.id || materiId;
    if (targetClassId && targetId && (!materi?.versi || materi.versi.length === 0)) {
      apiService.getMateriDetail(targetClassId, targetId)
        .then(data => {
          if (data) setFullMateri(data);
        })
        .catch(() => {});
    }
  }, [materi, materiId]);

  const activeMateri = fullMateri || materi;
  const mockData = (materiId && MATERI_DATA && MATERI_DATA[materiId]) ? MATERI_DATA[materiId] : null;

  const title = activeMateri?.title || activeMateri?.judul || mockData?.title || 'Detail Materi';

  const versionsList = (activeMateri?.versi || activeMateri?.versions || []).filter(Boolean);
  
  const hasMultipleVersions = Boolean(
    versionsList.length > 1 ||
    (activeMateri?.version && activeMateri.version > 1) ||
    (activeMateri?.activeVersion && activeMateri.activeVersion > 1) ||
    activeMateri?.prevVersion ||
    activeMateri?.contentV1 ||
    mockData?.contentV1
  );

  const activeVerNum = (() => {
    if (versionsList.length > 0) {
      const nums = versionsList.map(v => Number(v.nomor_versi || v.version || 1));
      return Math.max(...nums);
    }
    if (activeMateri?.version) return Number(activeMateri.version);
    if (activeMateri?.activeVersion) return Number(activeMateri.activeVersion);
    if (hasMultipleVersions) return 2;
    return 1;
  })();

  const defaultVersionStr = `v${activeVerNum}`;

  const [lang, setLang] = useState('id');
  const [version, setVersion] = useState(defaultVersionStr);
  const [isMaximized, setIsMaximized] = useState(false);
  const [maxHeightVh, setMaxHeightVh] = useState(55);
  const handleRef = useRef(null);

  // Lock body scroll on mobile & desktop
  useEffect(() => {
    setLang('id');
    setVersion(defaultVersionStr);
    setIsMaximized(false);
    setMaxHeightVh(55);

    if (materi || materiId) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [materi, materiId, defaultVersionStr]);

  // Non-passive Touch Drag Listener for Mobile Sheet Handle Bar
  useEffect(() => {
    const handleEl = handleRef.current;
    if (!handleEl) return;

    let dragging = false;
    let startY = 0;
    let startH = maxHeightVh;

    const onTouchStart = (e) => {
      if (isMaximized) return;
      dragging = true;
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      startH = maxHeightVh;
    };

    const onTouchMove = (e) => {
      if (!dragging || isMaximized) return;
      if (e.cancelable) e.preventDefault();
      const currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = startY - currentY;
      const deltaVh = (deltaY / window.innerHeight) * 100;
      const newVh = Math.min(88, Math.max(55, startH + deltaVh));
      setMaxHeightVh(newVh);
    };

    const onTouchEnd = () => {
      if (!dragging || isMaximized) return;
      dragging = false;
      setMaxHeightVh(prev => (prev >= 71.5 ? 88 : 55));
    };

    handleEl.addEventListener('touchstart', onTouchStart, { passive: false });
    handleEl.addEventListener('touchmove', onTouchMove, { passive: false });
    handleEl.addEventListener('touchend', onTouchEnd);
    handleEl.addEventListener('mousedown', onTouchStart);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);

    return () => {
      handleEl.removeEventListener('touchstart', onTouchStart);
      handleEl.removeEventListener('touchmove', onTouchMove);
      handleEl.removeEventListener('touchend', onTouchEnd);
      handleEl.removeEventListener('mousedown', onTouchStart);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
    };
  }, [materiId, isMaximized, maxHeightVh]);

  if (!materiId && !materi) return null;

  const hasEnglish = Boolean(mockData?.contentEn || activeMateri?.contentEn);

  const getVersionContent = (verStr) => {
    const verNum = parseInt(verStr.replace('v', ''), 10) || 1;

    const verList = activeMateri?.versi || activeMateri?.versions;
    if (Array.isArray(verList) && verList.length > 0) {
      const match = verList.find(v => Number(v.nomor_versi || v.version) === verNum);
      if (match) {
        return match.isi || match.content || '';
      }
    }

    if (verNum === 1) {
      if (activeMateri?.contentV1) return activeMateri.contentV1;
      if (activeMateri?.prevVersion?.content) return activeMateri.prevVersion.content;
      if (activeMateri?.prevVersion?.isi) return activeMateri.prevVersion.isi;
      if (mockData?.contentV1) return mockData.contentV1;
    }

    if (lang === 'en' && hasEnglish) {
      return mockData?.contentEn || activeMateri?.contentEn || '';
    }

    return activeMateri?.content || activeMateri?.isi || mockData?.contentId || mockData?.content || '';
  };

  let rawContent = getVersionContent(version);

  let formattedContent = '';
  if (!rawContent || !rawContent.trim()) {
    formattedContent = '<p class="text-muted-foreground p-4 text-center">Isi materi belum diisi.</p>';
  } else {
    const isHtml = /<[a-z][\s\S]*>/i.test(rawContent);
    if (isHtml) {
      formattedContent = rawContent;
    } else {
      formattedContent = rawContent
        .trim()
        .split(/\n\n+/)
        .map(p => `<p class="mb-3 text-foreground leading-relaxed">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
    }
  }

  const modalClass = isMaximized
    ? "fixed inset-0 w-full h-full max-w-none max-h-none rounded-none z-[60] bg-card flex flex-col overflow-hidden shadow-2xl transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]"
    : "fixed bottom-0 left-0 right-0 w-full md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl lg:max-w-3xl bg-card rounded-t-3xl md:rounded-3xl z-[60] flex flex-col max-h-[88vh] overflow-hidden shadow-2xl border border-border animate-slide-up-bottom md:animate-scale-in transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]";

  const renderVersionOptions = () => {
    if (versionsList.length > 0) {
      const sorted = [...versionsList].sort((a, b) => {
        const numA = Number(a.nomor_versi || a.version || 1);
        const numB = Number(b.nomor_versi || b.version || 1);
        return numB - numA;
      });
      return sorted.map((vObj) => {
        const num = Number(vObj.nomor_versi || vObj.version || 1);
        const isLatest = num === activeVerNum;
        return (
          <option key={`ver-${num}`} value={`v${num}`} className="bg-card text-foreground">
            v{num}.0 {isLatest ? '(Revisi Terbaru)' : '(Versi Sebelumnya)'}
          </option>
        );
      });
    }
    return (
      <>
        <option value={`v${activeVerNum}`} className="bg-card text-foreground">v{activeVerNum}.0 (Revisi Terbaru)</option>
        <option value="v1" className="bg-card text-foreground">v1.0 (Sebelum Revisi)</option>
      </>
    );
  };

  return createPortal(
    <>
      {/* Backdrop with touchmove prevention */}
      <div
        onClick={onClose}
        onTouchMove={(e) => e.preventDefault()}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] animate-fade-in touch-none"
      />

      {/* Modal Dialog */}
      <div className={modalClass}>
        {/* Handle bar (mobile drag to expand 55vh -> 88vh) */}
        {!isMaximized && (
          <div
            ref={handleRef}
            className="flex justify-center pt-3.5 pb-2 shrink-0 md:hidden cursor-grab active:cursor-grabbing touch-none select-none"
          >
            <div className="w-12 h-1.5 rounded-full bg-border hover:bg-muted-foreground/40 transition-colors"></div>
          </div>
        )}

        {/* Modal Header with Title & Controls */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-border shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="font-extrabold text-base md:text-lg truncate">{title}</h3>

            {/* Dropdown / Badge Versi Materi */}
            {hasMultipleVersions ? (
              <div className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-xl border border-border/80 shrink-0">
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="bg-transparent text-[11px] font-bold text-foreground focus:outline-none cursor-pointer border-none"
                >
                  {renderVersionOptions()}
                </select>
              </div>
            ) : (
              <span className="text-[11px] font-extrabold text-muted-foreground bg-muted px-2.5 py-1 rounded-xl border border-border/80 shrink-0">
                v1.0
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title={isMaximized ? "Kecilkan Window" : "Perlebar ke Full Screen (1 Layar)"}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Language Selector Bar */}
        {hasEnglish && (
          <div className="px-5 py-2.5 border-b border-border bg-muted/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Bahasa / Language</span>
            </div>
            <div className="flex bg-muted dark:bg-[#121016] rounded-xl p-0.5 border border-border/40 gap-0.5 shrink-0">
              <button
                onClick={() => setLang('id')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  lang === 'id'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div
          className="px-5 py-4 space-y-4 overflow-y-auto flex-1 text-sm leading-relaxed transition-all duration-300 ease-in-out"
          style={!isMaximized ? { maxHeight: `${maxHeightVh}vh` } : {}}
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      </div>
    </>,
    document.body
  );
}
