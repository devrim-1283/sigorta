<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles  Allowed role names
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $user = $request->user();

        // Check if user has an active account
        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Hesabınız aktif değil. Lütfen yönetici ile iletişime geçin.'
            ], 403);
        }

        // Check if user has a role
        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Kullanıcı rolü tanımlı değil.'
            ], 403);
        }

        // If no specific roles required, just check if user has any role
        if (empty($roles)) {
            return $next($request);
        }

        // Check if user has one of the required roles
        if ($user->hasAnyRole($roles)) {
            return $next($request);
        }

        // User doesn't have required role
        return response()->json([
            'success' => false,
            'message' => 'Bu işlem için yetkiniz bulunmamaktadır.',
            'required_roles' => $roles,
            'user_role' => $user->role->name
        ], 403);
    }
}

