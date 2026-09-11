import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, ShieldCheck, UserCheck, UserX, Loader2, Search, X, Crown } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { apiService } from '../services/apiService';
import ConfirmModal from '../components/ConfirmModal';
import Button from '../components/Button';

export default function ClassAnggotaPage({ members = [], currentRole = 'member', isManagementMode = false, onToggleAdmin, onKickMember, onTransferOwner, isLoading = false }) {
  const { classId } = useParams();
  const { currentUser, showToast } = useAppState();
  const [memberToKick, setMemberToKick] = useState(null);
  const [memberToTransfer, setMemberToTransfer] = useState(null);
  const [internalMembers, setInternalMembers] = useState(members);
  const [loading, setLoading] = useState(isLoading);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingMemberId, setUpdatingMemberId] = useState(null);

  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'admin';
  const canManageMembers = isOwner || isAdmin;

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (members && members.length > 0) {
      setInternalMembers(members);
      setLoading(false);
      return;
    }

    if (classId && (!members || members.length === 0)) {
      setLoading(true);
      apiService.getMembers(classId)
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setInternalMembers(res.map(m => ({
              id: m.id || m.user_id,
              name: m.name || m.user?.name || 'Anggota Kelas',
              username: m.username ? `@${m.username}` : (m.email ? `@${m.email.split('@')[0]}` : '@user'),
              email: m.email || m.user?.email,
              role: m.role || 'member',
              avatar: m.profile_photo || m.user?.avatar || m.avatar
            })));
          } else {
            setInternalMembers(currentUser ? [{
              id: currentUser.id || 'usr-me',
              name: currentUser.name || 'Anggota Kelas',
              username: currentUser.email ? `@${currentUser.email.split('@')[0]}` : `@${currentUser.username || 'user'}`,
              email: currentUser.email,
              role: currentRole || 'owner',
              avatar: currentUser.avatar
            }] : []);
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
        });
    }
  }, [classId, members, currentUser, currentRole]);

  const handleAdminToggle = async (mem) => {
    if (!isOwner || updatingMemberId) return;
    const newRole = mem.role === 'Admin' || mem.role === 'admin' ? 'Member' : 'Admin';
    setUpdatingMemberId(mem.id);
    try {
      if (onToggleAdmin) {
        await onToggleAdmin(mem.id, newRole);
      } else if (classId) {
        if (newRole === 'Admin' || newRole === 'admin') {
          await apiService.promoteMember(classId, mem.id);
        } else {
          await apiService.demoteAdmin(classId, mem.id);
        }
        setInternalMembers(prev => prev.map(m => m.id === mem.id ? { ...m, role: newRole } : m));
        showToast(`Role ${mem.name} diperbarui menjadi ${newRole}`);
      }
    } catch (err) {
      showToast(err.message || 'Gagal mengubah role', 'error');
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleKickClick = (mem) => {
    if (!canManageMembers) return;
    setMemberToKick(mem);
  };

  const confirmKick = async () => {
    if (memberToKick) {
      try {
        if (onKickMember) {
          await onKickMember(memberToKick.id);
        } else if (classId) {
          await apiService.kickMember(classId, memberToKick.id);
          setInternalMembers(prev => prev.filter(m => m.id !== memberToKick.id));
          showToast(`${memberToKick.name} berhasil dikeluarkan dari kelas.`);
        }
      } catch (err) {
        showToast(err.message || 'Gagal mengeluarkan anggota', 'error');
      } finally {
        setMemberToKick(null);
      }
    }
  };

  const handleTransferClick = (mem) => {
    setMemberToTransfer(mem);
  };

  const confirmTransfer = async () => {
    if (!memberToTransfer) return;
    try {
      if (onTransferOwner) {
        await onTransferOwner(memberToTransfer);
      } else if (classId) {
        const targetUserId = memberToTransfer.user_id || memberToTransfer.userId || memberToTransfer.id;
        await apiService.transferOwnership(classId, targetUserId);
        showToast(`Kepemilikan kelas berhasil dipindahkan ke ${memberToTransfer.name || 'anggota'}.`);
        setInternalMembers(prev => prev.map(m => {
          if ((m.user_id || m.userId || m.id) === targetUserId) {
            return { ...m, role: 'owner' };
          }
          if (m.role === 'owner') {
            return { ...m, role: 'admin' };
          }
          return m;
        }));
      }
    } catch (err) {
      showToast(err.message || 'Gagal mentransfer kepemilikan', 'error');
    } finally {
      setMemberToTransfer(null);
    }
  };

  const list = internalMembers.length > 0 ? internalMembers : (members || []);
  const filteredList = list.filter(mem => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (mem.name && mem.name.toLowerCase().includes(q)) ||
      (mem.username && mem.username.toLowerCase().includes(q)) ||
      (mem.email && mem.email.toLowerCase().includes(q)) ||
      (mem.role && mem.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-primary shrink-0" />
            {isManagementMode ? 'Kelola Admin & Anggota Kelas' : 'Daftar Anggota Kelas'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isManagementMode
              ? `Kelola hak akses admin dan status anggota (${list.length} anggota).`
              : `Total ${list.length} anggota terdaftar dalam kelas ini.`}
          </p>
        </div>

        {/* Live Search Input Bar */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari anggota kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border focus:border-primary rounded-xl pl-9 pr-8 py-1.5 text-xs font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none transition-colors shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {loading || isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 bg-card border border-border rounded-3xl">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground font-bold">Memuat anggota kelas...</span>
          </div>
        ) : filteredList.length > 0 ? (
          filteredList.map(mem => {
            const isMemOwner = mem.role === 'Owner' || mem.role === 'owner';
            const isMemAdmin = mem.role === 'Admin' || mem.role === 'admin';

            return (
              <div
                key={mem.id || mem.username}
                className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-primary/30 transition-all overflow-hidden"
              >
                {/* Member Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                    <img
                      src={
                        (mem.avatar || mem.profile_photo) && !String(mem.avatar || mem.profile_photo).includes('unsplash')
                          ? (mem.avatar || mem.profile_photo)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(mem.name || mem.username || 'User')}&background=8b5cf6&color=ffffff&bold=true&size=256`
                      }
                      alt={mem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-sm text-foreground truncate">{mem.name}</p>
                      {isMemOwner && (
                        <span className="bg-primary/15 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3 h-3" /> Owner
                        </span>
                      )}
                      {isMemAdmin && (
                        <span className="bg-brand-blue/15 text-brand-blue text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shrink-0">
                          <UserCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                      {!isMemOwner && !isMemAdmin && (
                        <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                          Siswa / Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5 truncate">{mem.username || mem.email}</p>
                  </div>
                </div>

                {/* Management Action Column (ONLY shown in isManagementMode for Owner/Admin) */}
                {isManagementMode && canManageMembers && !isMemOwner && (
                  <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border/50">
                    {isOwner && (
                      <Button
                        onClick={() => handleAdminToggle(mem)}
                        loading={updatingMemberId === mem.id}
                        loadingText="Menyimpan Perubahan..."
                        className={`font-bold px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer ${
                          isMemAdmin
                            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {isMemAdmin ? 'Jadikan Member' : 'Jadikan Admin'}
                      </Button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleTransferClick(mem)}
                        className="font-bold px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer bg-gradient-to-r from-amber-500/15 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-amber-500 border border-amber-500/30 flex items-center gap-1.5"
                        title="Transfer Kepemilikan Kelas ke Anggota Ini"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Transfer Owner</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleKickClick(mem)}
                      className="w-8 h-8 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                      title="Keluarkan Anggota dari Kelas"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground italic bg-background/50 rounded-2xl border border-dashed border-border">
            {searchQuery ? `Tidak ada anggota yang cocok dengan "${searchQuery}"` : 'Belum ada data anggota kelas yang dapat ditampilkan.'}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(memberToKick)}
        onClose={() => setMemberToKick(null)}
        onConfirm={confirmKick}
        title="Keluarkan Anggota?"
        description={`Apakah Anda yakin ingin mengeluarkan "${memberToKick?.name}" dari kelas ini?`}
        confirmText="Ya, Keluarkan"
        loadingText="Mengeluarkan Anggota..."
        cancelText="Batal"
        variant="danger"
      />

      <ConfirmModal
        isOpen={Boolean(memberToTransfer)}
        onClose={() => setMemberToTransfer(null)}
        onConfirm={confirmTransfer}
        title="Transfer Kepemilikan Kelas?"
        description={`Apakah Anda yakin ingin memindahkan kepemilikan kelas ini ke "${memberToTransfer?.name}"? Anda akan diturunkan menjadi Admin dan kehilangan kendali penuh atas kelas ini.`}
        confirmText="Ya, Transfer Kepemilikan"
        loadingText="Mentransfer..."
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}

