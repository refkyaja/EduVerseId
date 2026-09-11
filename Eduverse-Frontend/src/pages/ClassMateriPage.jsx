import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, ChevronRight, Sparkles, CheckCircle2, Clock, AlertCircle, XCircle, FileText, Loader2 } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';
import Button from '../components/Button';

const statusBadgeMap = {
  'Terverifikasi': { color: 'bg-success/15 text-success border-success/30', Icon: CheckCircle2 },
  'terverifikasi': { color: 'bg-success/15 text-success border-success/30', Icon: CheckCircle2 },
  'Menunggu Verifikasi': { color: 'bg-warning/15 text-warning border-warning/30', Icon: Clock },
  'menunggu_verifikasi': { color: 'bg-warning/15 text-warning border-warning/30', Icon: Clock },
  'Perlu Perbaikan': { color: 'bg-amber-500/15 text-amber-500 border-amber-500/30', Icon: AlertCircle },
  'perlu_perbaikan': { color: 'bg-amber-500/15 text-amber-500 border-amber-500/30', Icon: AlertCircle },
  'Ditolak': { color: 'bg-danger/15 text-danger border-danger/30', Icon: XCircle },
  'ditolak': { color: 'bg-danger/15 text-danger border-danger/30', Icon: XCircle },
};

export default function ClassMateriPage({ cls, materials, currentRole, onCreateMaterial }) {
  const { showToast } = useAppState();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingMateri, setIsCreatingMateri] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [apiMaterials, setApiMaterials] = useState([]);
  const [loading, setLoading] = useState(false);

  const canCreate = currentRole === 'owner' || currentRole === 'admin';

  const fetchMaterials = async () => {
    if (cls?.id) {
      try {
        setLoading(true);
        const data = await apiService.getMateri(cls.id);
        if (Array.isArray(data)) {
          setApiMaterials(data);
        }
      } catch (err) {
        console.warn("Failed to fetch materi from API:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [cls?.id]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isCreatingMateri) return;
    setIsCreatingMateri(true);

    const initialStatus = currentRole === 'owner' ? 'Terverifikasi' : 'Menunggu Verifikasi';

    try {
      if (cls?.id) {
        await apiService.createMateri(cls.id, {
          judul: title.trim(),
          ringkasan: summary.trim() || 'Ringkasan materi baru',
          isi: content.trim() || '<p>Isi materi pembelajaran baru.</p>',
        });
        await fetchMaterials();
      }

      if (onCreateMaterial) {
        onCreateMaterial({
          title: title.trim(),
          summary: summary.trim() || 'Ringkasan materi baru',
          content: content.trim() || '<p>Isi materi pembelajaran baru.</p>',
          status: initialStatus,
          createdBy: currentRole === 'owner' ? 'Refky Satria (Owner)' : 'Budi Santoso (Admin)',
          creatorRole: currentRole,
        });
      }

      showToast(`Materi "${title}" berhasil dibuat! Status: ${initialStatus}`);
      setTitle('');
      setSummary('');
      setContent('');
      setIsCreating(false);
    } catch (err) {
      console.warn("API createMateri fallback:", err);
    } finally {
      setIsCreatingMateri(false);
    }
  };

  const formattedApiMaterials = apiMaterials.map(m => {
    const rawStatus = m.versi_aktif?.status || (m.versi && m.versi.length > 0 ? m.versi[m.versi.length - 1].status : (m.status || 'menunggu_verifikasi'));
    const cleanStatus = (rawStatus === 'terverifikasi' || rawStatus === 'verified') ? 'Terverifikasi' : (rawStatus === 'ditolak' ? 'Ditolak' : 'Menunggu Verifikasi');
    return {
      id: m.id,
      classId: cls?.id,
      title: m.judul || m.title,
      summary: m.ringkasan || m.summary || 'Ringkasan materi pembelajaran',
      content: m.versi_aktif?.isi || m.isi || m.content || '',
      status: cleanStatus,
      createdBy: m.creator?.name || m.createdBy || 'Pemilik Kelas',
      activeVersion: m.versi_aktif?.nomor_versi || m.activeVersion || 1,
      versi: m.versi || m.versions || [],
      versions: m.versi || m.versions || []
    };
  });

  const localMaterials = materials?.filter(m => String(m.classId) === String(cls?.id)) || [];

  const rawClassMaterials = [...formattedApiMaterials];
  localMaterials.forEach(lm => {
    if (!rawClassMaterials.some(am => String(am.id) === String(lm.id))) {
      rawClassMaterials.push(lm);
    }
  });

  const classMaterials = rawClassMaterials.filter(m => m.status === 'Terverifikasi' || m.status === 'terverifikasi' || m.status === 'verified');

  return (
    <div className="space-y-6">
      {/* Create Material Section */}
      {canCreate && (
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-extrabold text-sm">
              <BookOpen className="w-4 h-4" />
              <span>Manajemen Materi Kelas</span>
            </div>

            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-primary text-primary-foreground font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Buat Materi Baru
              </button>
            )}
          </div>

          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Judul Materi <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengenalan OOP & Class"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Ringkasan Singkat
                </label>
                <input
                  type="text"
                  placeholder="Ringkasan poin-poin utama materi..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Isi Materi (HTML / Teks)
                </label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan konten materi pembelajaran..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="bg-muted text-muted-foreground font-bold px-4 py-2 rounded-xl text-xs hover:bg-muted/80"
                >
                  Batal
                </button>
                <Button
                  type="submit"
                  loading={isCreatingMateri}
                  loadingText="Menyimpan Materi..."
                  className="bg-gradient-to-r from-primary to-primary-glow text-white font-extrabold px-5 py-2 rounded-xl text-xs shadow-glow flex items-center gap-1 cursor-pointer"
                >
                  Simpan Materi
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-lg italic flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> Daftar Materi Pembelajaran
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-border rounded-3xl">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-bold">Memuat materi...</span>
          </div>
        ) : classMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {classMaterials.map((mat, idx) => {
              const badge = statusBadgeMap[mat.status] || statusBadgeMap['Draft'];
              const numStr = String(idx + 1).padStart(2, '0');

              return (
                <Link
                  key={mat.id}
                  to={`/class/${cls.id}/materi/${mat.id}`}
                  className="w-full text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3.5 hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-muted grid place-items-center text-xs font-extrabold text-muted-foreground shrink-0">
                    {numStr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground truncate">{mat.title}</p>
                      {mat.activeVersion && mat.activeVersion > 1 && (
                        <span className="bg-primary/10 text-primary text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
                          v{mat.activeVersion}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{mat.summary || mat.description || 'Ringkasan · Materi'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground text-xs font-bold">
            Belum Ada Materi Pelajaran
          </div>
        )}
      </div>
    </div>
  );
}

