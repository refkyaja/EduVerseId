<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\Materi;
use App\Models\MateriVersi;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;

class MateriController extends Controller
{
    public function index(Request $request, $classId)
    {
        $user = $request->user();
        $class = ClassModel::find($classId);
        if (!$class || !$class->hasUser($user)) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki akses ke materi kelas ini.'], 403);
        }

        $materi = Materi::where('kelas_id', $classId)
            ->with(['versiAktif', 'versi.creator', 'versi.reviewer', 'mapel', 'creator'])
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $materi
        ]);
    }

    public function store(Request $request, $classId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat membuat materi.'], 403);
        }

        $validated = $request->validate([
            'judul' => 'required|string|max:255',
            'ringkasan' => 'nullable|string',
            'isi' => 'required|string',
            'mapel_id' => 'nullable',
            'mapel_nama' => 'nullable|string',
            'mapel_kode' => 'nullable|string',
        ]);

        $mapelId = null;
        $reqMapel = $validated['mapel_id'] ?? $request->input('mapel_kode') ?? $request->input('mapel_nama');

        if (!empty($reqMapel)) {
            $mapelObj = is_numeric($reqMapel) ? \App\Models\Mapel::find($reqMapel) : null;
            if (!$mapelObj) {
                $mapelObj = \App\Models\Mapel::where('kelas_id', $classId)
                    ->where(function($q) use ($reqMapel) {
                        $q->where('id', $reqMapel)
                          ->orWhere('kode', $reqMapel)
                          ->orWhere('nama', $reqMapel);
                    })->first();
            }
            if (!$mapelObj && is_string($reqMapel) && !str_contains($reqMapel, 'mat-')) {
                $kodeStr = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $reqMapel), 0, 5)) ?: 'MAPEL';
                $mapelObj = \App\Models\Mapel::create([
                    'kelas_id' => $classId,
                    'kode' => $request->input('mapel_kode') ? strtoupper($request->input('mapel_kode')) : $kodeStr,
                    'nama' => $request->input('mapel_nama') ?: $reqMapel,
                    'warna' => 'from-indigo-500 to-purple-600'
                ]);
            }
            if ($mapelObj) {
                $mapelId = $mapelObj->id;
            }
        }

        if (!$mapelId) {
            $firstMapel = \App\Models\Mapel::where('kelas_id', $classId)->first();
            if ($firstMapel) {
                $mapelId = $firstMapel->id;
            }
        }

        $status = ($role === 'owner') ? 'terverifikasi' : 'menunggu_verifikasi';

        $materi = Materi::create([
            'kelas_id' => $classId,
            'mapel_id' => $mapelId,
            'judul' => $validated['judul'],
            'ringkasan' => $validated['ringkasan'] ?? null,
            'dibuat_oleh' => $user->id,
        ]);

        $versi = MateriVersi::create([
            'materi_id' => $materi->id,
            'nomor_versi' => 1,
            'isi' => $validated['isi'],
            'status' => $status,
            'dibuat_oleh' => $user->id,
            'ditinjau_oleh' => ($role === 'owner') ? $user->id : null,
            'ditinjau_pada' => ($role === 'owner') ? now() : null,
        ]);

        $materi->update(['versi_aktif_id' => $versi->id]);

        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => strtoupper($role),
            'deskripsi_aksi' => ($role === 'owner')
                ? "Membuat & menerbitkan materi \"{$materi->judul}\" (Terverifikasi)"
                : "Mengajukan materi baru \"{$materi->judul}\" (Menunggu Verifikasi)",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => ($role === 'owner')
                ? "Materi \"{$materi->judul}\" berhasil diterbitkan!"
                : "Materi \"{$materi->judul}\" diajukan! Menunggu Verifikasi Owner.",
            'data' => $materi->load('versiAktif')
        ], 201);
    }

    public function show(Request $request, $classId, $id)
    {
        $user = $request->user();
        $class = ClassModel::find($classId);
        if (!$class || !$class->hasUser($user)) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki akses ke materi kelas ini.'], 403);
        }

        $materi = Materi::where('kelas_id', $classId)
            ->where('id', $id)
            ->with(['versiAktif', 'versi.creator', 'versi.reviewer', 'mapel', 'creator'])
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data' => $materi
        ]);
    }

    public function verifyVersion(Request $request, $classId, $versiId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || $role !== 'owner') {
            return response()->json(['message' => 'Hanya Owner kelas yang dapat memverifikasi materi.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:terverifikasi,perlu_perbaikan,ditolak',
            'catatan_review' => 'nullable|string',
        ]);

        $versi = MateriVersi::findOrFail($versiId);
        $versi->update([
            'status' => $validated['status'],
            'ditinjau_oleh' => $user->id,
            'ditinjau_pada' => now(),
            'catatan_review' => $validated['catatan_review'] ?? null,
        ]);

        if ($validated['status'] === 'terverifikasi') {
            $versi->materi->update(['versi_aktif_id' => $versi->id]);
        }

        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => 'OWNER',
            'deskripsi_aksi' => "Memverifikasi versi materi \"{$versi->materi->judul}\" (Status: {$validated['status']})",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Status versi materi berhasil diperbarui menjadi {$validated['status']}.",
            'data' => $versi
        ]);
    }

    public function deleteVersion(Request $request, $classId, $versiId)
    {
        $user = $request->user();
        $class = ClassModel::find($classId);
        if (!$class || !$class->hasUser($user)) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki akses ke kelas ini.'], 403);
        }

        $role = $class->getRoleForUser($user);
        if (!$role || $role !== 'owner') {
            return response()->json(['status' => 'error', 'message' => 'Hanya Owner kelas yang dapat menghapus versi materi.'], 403);
        }

        $versi = MateriVersi::whereHas('materi', function($q) use ($classId) {
            $q->where('kelas_id', $classId);
        })->where('id', $versiId)->first();

        if (!$versi) {
            return response()->json(['status' => 'error', 'message' => 'Versi materi tidak ditemukan.'], 404);
        }

        $materi = $versi->materi;

        // Validasi 1: Tidak boleh menghapus satu-satunya versi
        $totalVersions = MateriVersi::where('materi_id', $materi->id)->count();
        if ($totalVersions <= 1) {
            return response()->json([
                'status' => 'error',
                'message' => 'Materi harus memiliki minimal 1 versi. Versi terakhir tidak dapat dihapus.'
            ], 422);
        }

        // Validasi 2: Versi yang dihapus tidak boleh versi aktif/tayang
        if ($materi->versi_aktif_id && (string)$materi->versi_aktif_id === (string)$versi->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Versi aktif tidak bisa dihapus, aktifkan versi lain dulu.'
            ], 422);
        }

        $nomorVersi = $versi->nomor_versi;
        $versi->delete();

        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => 'OWNER',
            'deskripsi_aksi' => "Menghapus Versi {$nomorVersi} dari materi \"{$materi->judul}\"",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Versi v{$nomorVersi} berhasil dihapus dari materi \"{$materi->judul}\"."
        ]);
    }

    public function update(Request $request, $classId, $materiId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat memperbarui materi.'], 403);
        }

        $materi = Materi::where('kelas_id', $classId)->where('id', $materiId)->firstOrFail();

        $validated = $request->validate([
            'judul' => 'sometimes|required|string|max:255',
            'ringkasan' => 'nullable|string',
            'isi' => 'required|string',
            'mapel_id' => 'nullable',
            'mapel_nama' => 'nullable|string',
            'mapel_kode' => 'nullable|string',
        ]);

        if (isset($validated['judul'])) {
            $materi->judul = $validated['judul'];
        }
        if (array_key_exists('ringkasan', $validated)) {
            $materi->ringkasan = $validated['ringkasan'];
        }

        $reqMapel = $validated['mapel_id'] ?? $request->input('mapel_kode') ?? $request->input('mapel_nama');
        if (!empty($reqMapel)) {
            $mapelObj = is_numeric($reqMapel) ? \App\Models\Mapel::find($reqMapel) : null;
            if (!$mapelObj) {
                $mapelObj = \App\Models\Mapel::where('kelas_id', $classId)
                    ->where(function($q) use ($reqMapel) {
                        $q->where('id', $reqMapel)
                          ->orWhere('kode', $reqMapel)
                          ->orWhere('nama', $reqMapel);
                    })->first();
            }
            if (!$mapelObj && is_string($reqMapel) && !str_contains($reqMapel, 'mat-')) {
                $kodeStr = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $reqMapel), 0, 5)) ?: 'MAPEL';
                $mapelObj = \App\Models\Mapel::create([
                    'kelas_id' => $classId,
                    'kode' => $request->input('mapel_kode') ? strtoupper($request->input('mapel_kode')) : $kodeStr,
                    'nama' => $request->input('mapel_nama') ?: $reqMapel,
                    'warna' => 'from-indigo-500 to-purple-600'
                ]);
            }
            if ($mapelObj) {
                $materi->mapel_id = $mapelObj->id;
            }
        }
        $materi->save();

        // Check if content ('isi') has changed compared to current active version or latest version
        $currentVersi = $materi->versiAktif ?? MateriVersi::where('materi_id', $materi->id)->latest('nomor_versi')->first();
        $currentIsi = $currentVersi ? trim($currentVersi->isi) : '';
        $newIsi = trim($validated['isi']);
        $isContentChanged = ($currentIsi !== $newIsi);

        if (!$isContentChanged) {
            LogAktivitas::create([
                'kelas_id' => $classId,
                'user_id' => $user->id,
                'peran_user' => strtoupper($role),
                'deskripsi_aksi' => "Memperbarui informasi materi \"{$materi->judul}\" (Tanpa perubahan versi)",
            ]);

            return response()->json([
                'status' => 'success',
                'message' => "Informasi materi \"{$materi->judul}\" berhasil diperbarui.",
                'data' => $materi->load(['versiAktif', 'versi.creator'])
            ]);
        }

        $maxVersi = MateriVersi::where('materi_id', $materi->id)->max('nomor_versi') ?: 1;
        $nextVersi = $maxVersi + 1;

        $status = ($role === 'owner') ? 'terverifikasi' : 'menunggu_verifikasi';

        $versi = MateriVersi::create([
            'materi_id' => $materi->id,
            'nomor_versi' => $nextVersi,
            'isi' => $validated['isi'],
            'status' => $status,
            'dibuat_oleh' => $user->id,
            'ditinjau_oleh' => ($role === 'owner') ? $user->id : null,
            'ditinjau_pada' => ($role === 'owner') ? now() : null,
        ]);

        if ($role === 'owner') {
            $materi->update(['versi_aktif_id' => $versi->id]);
        }

        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => strtoupper($role),
            'deskripsi_aksi' => ($role === 'owner')
                ? "Memperbarui materi \"{$materi->judul}\" ke versi {$nextVersi} (Terverifikasi)"
                : "Mengajukan pembaruan materi \"{$materi->judul}\" ke versi {$nextVersi} (Menunggu Verifikasi)",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => ($role === 'owner')
                ? "Materi \"{$materi->judul}\" berhasil diperbarui ke versi {$nextVersi}!"
                : "Pembaruan materi \"{$materi->judul}\" versi {$nextVersi} diajukan! Menunggu Verifikasi Owner.",
            'data' => $materi->load(['versiAktif', 'versi.creator'])
        ]);
    }

    public function destroy(Request $request, $classId, $materiId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat menghapus materi.'], 403);
        }

        $materi = Materi::where('kelas_id', $classId)->where('id', $materiId)->first();
        if ($materi) {
            $judulMateri = $materi->judul;
            MateriVersi::where('materi_id', $materi->id)->delete();
            $materi->delete();

            LogAktivitas::create([
                'kelas_id' => $classId,
                'user_id' => $user->id,
                'peran_user' => strtoupper($role),
                'deskripsi_aksi' => "Menghapus materi \"{$judulMateri}\"",
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Materi berhasil dihapus!"
        ]);
    }
}
