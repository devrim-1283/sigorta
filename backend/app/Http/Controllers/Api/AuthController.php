<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login user and create token
     */
    public function login(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Find user by email, phone, or tc_no
        $user = null;
        if ($request->has('email') && $request->email) {
            $user = User::where('email', $request->email)->first();
        } elseif ($request->has('phone') && $request->phone) {
            $user = User::where('phone', $request->phone)->first();
        } elseif ($request->has('tc_no') && $request->tc_no) {
            $user = User::where('tc_no', $request->tc_no)->first();
        }

        // Check if user exists and password is correct
        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Check if user is active
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.'
            ], 403);
        }

        // Load relationships
        $user->load(['role', 'dealer']);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Logout user (revoke token)
     */
    public function logout(Request $request)
    {
        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Çıkış yapıldı.'
        ]);
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        $user = $request->user()->load(['role', 'dealer']);

        return response()->json([
            'success' => true,
            'user' => $user,
        ]);
    }
}

