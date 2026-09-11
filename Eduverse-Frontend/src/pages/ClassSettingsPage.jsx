import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, RefreshCcw, Save, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';

export default function ClassSettingsPage({ cls, onUpdateClassInfo, onRegenerateCode, onDeleteClass }) {
  const navigate = useNavigate();
  const { showToast } = useAppState();

  const [name, setName] = useState(cls?.name || '');
  const [description, setDescription] = useState(cls?.description || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [isRegenOpen, setIsRegenOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    if (isSavingInfo) return;
    setIsSavingInfo(true);
    try {
      if (onUpdateClassInfo) await onUpdateClassInfo({ name, description });
      showToast("Informasi kelas berhasil diperbarui!");
    } catch (err) {
      showToast(err.message || "Gagal memperbarui informasi kelas", 'error');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const executeRegenCode = async () => {
    const newCode = onRegenerateCode ? await onRegenerateCode() : '';
    showToast(`Kode kelas baru dibuat: "${newCode}"`);
  };

  const executeDeleteClass = async () => {
    if (onDeleteClass) await onDeleteClass(cls?.id);
    showToast(`Kelas "${cls?.name}" telah dihapus.`);
    navigate('/');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-lg italic flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Pengaturan Kelas (Owner)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola identitas, foto banner, kode akses, dan status kelas.</p>
        </div>
      </div>

      {/* Class Information Form */}
      <form onSubmit={handleSaveInfo} className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <h4 className="font-extrabold text-sm text-foreground">Informasi Utama & Banner Kelas</h4>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Nama Kelas
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Deskripsi Kelas
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary resize-none"
          />
        </div>



        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            loading={isSavingInfo}
            loadingText="Menyimpan Perubahan..."
            icon={Save}
            className="bg-primary text-primary-foreground font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-glow flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>

      {/* Regenerate Access Code Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-extrabold text-sm text-foreground">Kode Akses Kelas</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kode saat ini: <strong className="font-mono text-primary">{cls?.code}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsRegenOpen(true)}
            className="bg-muted text-foreground font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-primary" /> Regenerate Kode
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-danger/5 border border-danger/30 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-danger font-extrabold text-sm">
          <ShieldAlert className="w-5 h-5" />
          <span>Danger Zone</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Menghapus kelas akan menghapus seluruh data pengumuman, materi, kuis, dan data keanggotaan. Tindakan ini tidak dapat dibatalkan.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteOpen(true)}
          className="bg-danger text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md flex items-center gap-2 hover:bg-danger/90 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> Hapus Kelas Permanen
        </button>
      </div>

      <ConfirmModal
        isOpen={isRegenOpen}
        onClose={() => setIsRegenOpen(false)}
        onConfirm={executeRegenCode}
        title="Buat Ulang Kode Kelas?"
        description="Apakah Anda yakin ingin membuat ulang kode kelas? Kode lama tidak akan berlaku lagi untuk siswa yang ingin bergabung."
        confirmText="Ya, Buat Kode Baru"
        loadingText="Membuat Kode Baru..."
        cancelText="Batal"
        variant="primary"
      />

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={executeDeleteClass}
        title="Hapus Kelas Permanen?"
        description={`PERINGATAN: Apakah Anda yakin ingin menghapus kelas "${cls?.name}" secara permanen? Seluruh data pengumuman, materi, kuis, dan data keanggotaan akan hilang.`}
        confirmText="Ya, Hapus Kelas"
        loadingText="Menghapus Kelas..."
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
