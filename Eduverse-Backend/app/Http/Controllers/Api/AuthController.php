<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

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

    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    public function googleCallback()
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect($frontendUrl . '/login?error=' . urlencode('Gagal mengautentikasi akun Google.'));
        }

        $email = $googleUser->getEmail();
        $nama = $googleUser->getName() ?? $googleUser->getNickname() ?? 'Pengguna Google';
        $avatar = $googleUser->getAvatar();
        $googleId = $googleUser->getId();

        $user = User::where('email', $email)->first();
        $isNewUser = false;

        if ($user) {
            if (!$user->google_id) {
                $user->google_id = $googleId;
            }
            if (!$user->profile_photo && $avatar) {
                $user->profile_photo = $avatar;
            }
            $user->save();
        } else {
            $isNewUser = true;
            $prefix = explode('@', $email)[0];
            $cleanUsername = preg_replace('/[^a-z0-9_]/', '', strtolower($prefix));
            if (strlen($cleanUsername) < 3) {
                $cleanUsername = 'user_' . substr(md5(uniqid()), 0, 5);
            }
            $username = $cleanUsername;
            $counter = 1;
            while (User::where('username', $username)->exists()) {
                $username = $cleanUsername . $counter;
                $counter++;
            }

            $user = User::create([
                'name' => $nama,
                'username' => $username,
                'email' => $email,
                'profile_photo' => $avatar,
                'password' => null,
                'google_id' => $googleId,
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return redirect($frontendUrl . '/auth/callback?token=' . $token . '&is_new_user=' . ($isNewUser ? '1' : '0'));
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        if ($user->password !== null) {
            $request->validate([
                'current_password' => 'required|string',
                'password' => 'required|string|min:8|confirmed',
            ], [
                'current_password.required' => 'Kata sandi saat ini wajib diisi.',
                'password.required' => 'Kata sandi baru wajib diisi.',
                'password.min' => 'Kata sandi baru minimal 8 karakter.',
                'password.confirmed' => 'Konfirmasi kata sandi baru tidak sesuai.',
            ]);

            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kata sandi saat ini salah.',
                    'errors' => [
                        'current_password' => ['Kata sandi saat ini yang Anda masukkan salah.'],
                    ],
                ], 422);
            }
        } else {
            $request->validate([
                'password' => 'required|string|min:8|confirmed',
            ], [
                'password.required' => 'Kata sandi baru wajib diisi.',
                'password.min' => 'Kata sandi baru minimal 8 karakter.',
                'password.confirmed' => 'Konfirmasi kata sandi baru tidak sesuai.',
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Kata sandi berhasil diperbarui.',
            'data' => new UserResource($user),
        ], 200);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun Anda telah berhasil dihapus secara permanen.',
            'data' => null,
        ], 200);
    }
}
