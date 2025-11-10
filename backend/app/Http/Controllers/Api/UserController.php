<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with(['role', 'dealer'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:users',
            'phone' => 'nullable|string|max:20|unique:users',
            'tc_no' => 'nullable|string|size:11|unique:users',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id',
            'dealer_id' => 'nullable|exists:dealers,id',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $user->load(['role', 'dealer']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Kullanıcı başarıyla oluşturuldu.'
        ], 201);
    }

    public function show(string $id)
    {
        $user = User::with(['role', 'dealer'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'phone' => 'nullable|string|max:20|unique:users,phone,' . $id,
            'tc_no' => 'nullable|string|size:11|unique:users,tc_no,' . $id,
            'password' => 'nullable|string|min:6',
            'role_id' => 'sometimes|exists:roles,id',
            'dealer_id' => 'nullable|exists:dealers,id',
            'is_active' => 'nullable|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);
        $user->load(['role', 'dealer']);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Kullanıcı başarıyla güncellendi.'
        ]);
    }

    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting self
        if ($user->id === auth()->id()) {
            return response()->json([
                'success' => false,
                'message' => 'Kendi hesabınızı silemezsiniz.'
            ], 400);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kullanıcı başarıyla silindi.'
        ]);
    }
}

