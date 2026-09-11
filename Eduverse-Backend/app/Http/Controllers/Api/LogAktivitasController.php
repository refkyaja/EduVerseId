<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassModel;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;

class LogAktivitasController extends Controller
{
    public function index(Request $request, $classId)
    {
        $user = $request->user();
        $class = ClassModel::find($classId);
        if (!$class || !$class->hasUser($user)) {
            return response()->json(['status' => 'error', 'message' => 'Anda tidak memiliki akses ke log aktivitas kelas ini.'], 403);
        }

        $query = LogAktivitas::where('kelas_id', $classId)->with('user');

        if ($request->filled('role') && strtolower($request->input('role')) !== 'all') {
            $query->where('peran_user', strtoupper($request->input('role')));
        }

        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        $perPage = (int)$request->input('per_page', 10);
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 10;
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'status' => 'success',
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
