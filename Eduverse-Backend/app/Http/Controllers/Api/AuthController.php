<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Register a new user.
     */
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    public function checkUsername(Request $request)
    {
        $username = trim((string) $request->query('username', ''));

        if ($username === '') {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Username tidak boleh kosong.',
            ], 422);
        }

        if (!preg_match('/^[A-Za-z0-9_-]+$/', $username)) {
            return response()->json([
                'success' => false,
                'available' => false,
                'message' => 'Username hanya boleh berisi huruf, angka, tanda hubung, dan garis bawah.',
            ], 422);
        }

        $exists = User::where('username', $username)->exists();

        if ($exists) {
            return response()->json([
                'success' => true,
                'available' => false,
                'message' => 'Username sudah digunakan, coba yang lain.',
            ], 200);
        }

        return response()->json([
            'success' => true,
            'available' => true,
            'message' => 'Username tersedia.',
        ], 200);
    }

    /**
     * Login user and create token.
     */
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Login gagal',
                'errors' => [
                    'auth' => ['Email atau password tidak sesuai.'],
                ],
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 200);
    }

    /**
     * Get authenticated user profile.
     */
    public function user(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Data user berhasil diambil',
            'data' => new UserResource($request->user()),
        ], 200);
    }

    /**
     * Update authenticated user profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'username' => 'sometimes|required|string|max:255|unique:users,username,' . $user->id,
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
            'bio' => 'nullable|string',
            'profile_photo' => 'nullable|string',
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => new UserResource($user),
        ], 200);
    }

    /**
     * Logout user (revoke token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil',
            'data' => null,
        ], 200);
    }
}
