import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

export default function VerificationBadge({ status }) {
  switch (status) {
    case 'Terverifikasi':
    case 'terverifikasi':
    case 'verified':
      return (
        <span className="badge badge-verified flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Terverifikasi</span>
        </span>
      );
    case 'Menunggu Verifikasi':
    case 'menunggu_verifikasi':
    case 'pending':
      return (
        <span className="badge badge-pending pulse-badge flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu</span>
        </span>
      );
    case 'Perlu Perbaikan':
    case 'perlu_perbaikan':
      return (
        <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Perlu Perbaikan</span>
        </span>
      );
    case 'Ditolak':
    case 'ditolak':
      return (
        <span className="badge badge-rejected flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30">
          <XCircle className="w-3.5 h-3.5" />
          <span>Ditolak</span>
        </span>
      );
    default:
      return null;
  }
}
