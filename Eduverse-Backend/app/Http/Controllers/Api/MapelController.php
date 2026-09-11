<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\Mapel;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;

class MapelController extends Controller
{
    public function index(Request $request, $classId)
    {
        $user = $request->user();
        $class = ClassModel::find($classId);
        if (!$class || !$class->hasUser($user)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak memiliki akses ke mata pelajaran kelas ini.'
            ], 403);
        }

        $mapel = Mapel::where('kelas_id', $classId)->withCount('materi')->get();

        return response()->json([
            'status' => 'success',
            'data' => $mapel
        ]);
    }

    public function store(Request $request, $classId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        // Check if user is Owner or Admin using getRoleForUser
        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat menambah Mata Pelajaran.'], 403);
        }

        $validated = $request->validate([
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:255',
            'warna' => 'nullable|string|max:100',
        ]);

        $namaClean = trim($validated['nama']);
        $kodeClean = strtoupper(trim($validated['kode']));

        // Check duplicate mapel in class (by name or code)
        $existingMapel = Mapel::where('kelas_id', $classId)
            ->where(function ($q) use ($namaClean, $kodeClean) {
                $q->whereRaw('LOWER(nama) = ?', [mb_strtolower($namaClean)])
                  ->orWhereRaw('UPPER(kode) = ?', [$kodeClean]);
            })
            ->first();

        if ($existingMapel) {
            return response()->json([
                'status' => 'error',
                'message' => "Mata pelajaran \"{$namaClean}\" atau kode \"{$kodeClean}\" sudah ada di kelas ini."
            ], 422);
        }

        $mapel = Mapel::create([
            'kelas_id' => $classId,
            'kode' => $kodeClean,
            'nama' => $namaClean,
            'warna' => $validated['warna'] ?? 'from-indigo-500 to-purple-600',
        ]);

        // Record log
        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => strtoupper($role),
            'deskripsi_aksi' => "Menambahkan Mata Pelajaran Baru \"{$mapel->nama}\" ({$mapel->kode})",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Mata Pelajaran \"{$mapel->nama}\" berhasil ditambahkan!",
            'data' => $mapel
        ], 201);
    }

    public function update(Request $request, $classId, $mapelId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat memperbarui Mata Pelajaran.'], 403);
        }

        $validated = $request->validate([
            'kode' => 'required|string|max:10',
            'nama' => 'required|string|max:255',
            'warna' => 'nullable|string|max:100',
        ]);

        $namaClean = trim($validated['nama']);
        $kodeClean = strtoupper(trim($validated['kode']));

        $mapel = Mapel::where('kelas_id', $classId)
            ->where(function($q) use ($mapelId) {
                $q->where('id', $mapelId)
                  ->orWhere('kode', $mapelId);
            })->first();

        if ($mapel) {
            // Check duplicate excluding current mapel
            $existingDuplicate = Mapel::where('kelas_id', $classId)
                ->where('id', '!=', $mapel->id)
                ->where(function ($q) use ($namaClean, $kodeClean) {
                    $q->whereRaw('LOWER(nama) = ?', [mb_strtolower($namaClean)])
                      ->orWhereRaw('UPPER(kode) = ?', [$kodeClean]);
                })
                ->first();

            if ($existingDuplicate) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Mata pelajaran \"{$namaClean}\" atau kode \"{$kodeClean}\" sudah ada di kelas ini."
                ], 422);
            }

            $mapel->update([
                'kode' => $kodeClean,
                'nama' => $namaClean,
                'warna' => $validated['warna'] ?? $mapel->warna,
            ]);
        } else {
            // Check duplicate if creating
            $existingDuplicate = Mapel::where('kelas_id', $classId)
                ->where(function ($q) use ($namaClean, $kodeClean) {
                    $q->whereRaw('LOWER(nama) = ?', [mb_strtolower($namaClean)])
                      ->orWhereRaw('UPPER(kode) = ?', [$kodeClean]);
                })
                ->first();

            if ($existingDuplicate) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Mata pelajaran \"{$namaClean}\" atau kode \"{$kodeClean}\" sudah ada di kelas ini."
                ], 422);
            }

            $mapel = Mapel::create([
                'kelas_id' => $classId,
                'kode' => $kodeClean,
                'nama' => $namaClean,
                'warna' => $validated['warna'] ?? 'from-indigo-500 to-purple-600',
            ]);
        }

        LogAktivitas::create([
            'kelas_id' => $classId,
            'user_id' => $user->id,
            'peran_user' => strtoupper($role),
            'deskripsi_aksi' => "Memperbarui Mata Pelajaran \"{$mapel->nama}\" ({$mapel->kode})",
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Mata Pelajaran \"{$mapel->nama}\" berhasil diperbarui!",
            'data' => $mapel
        ]);
    }

    public function destroy(Request $request, $classId, $mapelId)
    {
        $user = $request->user();
        $class = ClassModel::findOrFail($classId);

        $role = $class->getRoleForUser($user);
        if (!$role || !in_array($role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Hanya Owner atau Admin yang dapat menghapus Mata Pelajaran.'], 403);
        }

        $mapel = Mapel::where('kelas_id', $classId)
            ->where(function($q) use ($mapelId) {
                $q->where('id', $mapelId)
                  ->orWhere('kode', $mapelId);
            })->first();

        if ($mapel) {
            $namaMapel = $mapel->nama;
            $mapel->delete();

            LogAktivitas::create([
                'kelas_id' => $classId,
                'user_id' => $user->id,
                'peran_user' => strtoupper($role),
                'deskripsi_aksi' => "Menghapus Mata Pelajaran \"{$namaMapel}\"",
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => "Mata Pelajaran berhasil dihapus!"
        ]);
    }
}
