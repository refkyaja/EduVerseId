import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, ChevronDown, CheckCircle2, Clock, Trash2 } from 'lucide-react';

export default function MaterialVersionDropdown({
  versions,
  activeVersion,
  activeVersionId,
  onSelectVersion,
  onDeleteVersion,
  isOwner = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

  if (!versions || versions.length === 0) return null;

  const sortedVersions = [...versions].sort((a, b) => Number(a.nomor_versi || a.version || 0) - Number(b.nomor_versi || b.version || 0));

  const currentVerObj = sortedVersions.find(v => Number(v.version || v.nomor_versi) === Number(activeVersion)) || sortedVersions[0];
  const currentVerNum = Number(currentVerObj?.version || currentVerObj?.nomor_versi || 1);
  const maxVersionNum = Math.max(...sortedVersions.map(v => Number(v.version || v.nomor_versi || 1)));

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = Math.min(320, window.innerWidth - 32);
      
      let left = rect.right - dropdownWidth;
      if (left < 16) left = Math.max(16, rect.left);

      let top = rect.bottom + 6;
      const estimatedHeight = Math.min(320, versions.length * 52 + 40);
      if (top + estimatedHeight > window.innerHeight && rect.top > estimatedHeight) {
        top = rect.top - estimatedHeight - 6;
      }

      setCoords({ top, left, width: dropdownWidth });
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleScrollOrResize = () => setIsOpen(false);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-bold flex items-center justify-between gap-2 hover:border-primary/40 transition-all cursor-pointer shadow-xs"
      >
        <div className="flex items-center gap-1.5 text-primary">
          <History className="w-3.5 h-3.5" />
          <span>v{currentVerNum}.0</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && createPortal(
        <>
          <div onClick={() => setIsOpen(false)} className="fixed inset-0 z-[9998]" />
          <div
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`
            }}
            className="bg-card border border-border rounded-2xl shadow-2xl z-[9999] p-2 space-y-1 animate-scale-in max-h-80 overflow-y-auto"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground px-3 py-1">
              Riwayat Versi Materi ({sortedVersions.length} Versi)
            </p>
            {sortedVersions.map(v => {
              const verNum = Number(v.version || v.nomor_versi || 1);
              const isSelected = verNum === Number(activeVersion);

              const isActiveVersion = Boolean(
                (activeVersionId && String(v.id) === String(activeVersionId)) ||
                (v.status === 'terverifikasi' && verNum === maxVersionNum) ||
                (v.is_active || v.isActive)
              );

              const isOnlyVersion = versions.length <= 1;
              const canDelete = isOwner && onDeleteVersion && !isActiveVersion && !isOnlyVersion;

              return (
                <div
                  key={v.id || verNum}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors gap-2 ${
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectVersion) onSelectVersion(verNum);
                      setIsOpen(false);
                    }}
                    className="flex-1 min-w-0 text-left cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <p className="font-extrabold">Versi {verNum}</p>
                        {isActiveVersion && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {v.updatedAt || (v.created_at ? new Date(v.created_at).toLocaleDateString('id-ID') : 'Hari ini')} · {v.reviewer?.name || v.reviewer?.username || v.creator?.name || v.creator?.username || v.updatedBy || 'Kontributor'}
                      </p>
                    </div>
                    {v.status === 'Terverifikasi' || v.status === 'terverifikasi' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-warning shrink-0" />
                    )}
                  </button>

                  {/* Tombol Hapus Versi (Khusus Owner) */}
                  {isOwner && onDeleteVersion && (
                    <div className="shrink-0">
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteVersion(v);
                            setIsOpen(false);
                          }}
                          className="w-7 h-7 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger flex items-center justify-center transition-colors cursor-pointer"
                          title={`Hapus Versi ${verNum}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-7 h-7 rounded-lg bg-muted text-muted-foreground/40 flex items-center justify-center cursor-not-allowed opacity-50"
                          title={
                            isActiveVersion
                              ? "Versi aktif tidak bisa dihapus, aktifkan versi lain dulu"
                              : "Materi harus memiliki minimal 1 versi"
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
