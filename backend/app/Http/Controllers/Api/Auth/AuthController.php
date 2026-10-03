<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    /**
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::with(['roles.permissions', 'department'])
            ->where('email', $request->email)
            ->orWhere('username', $request->email) // support login by username too
            ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => __('auth.account_inactive'),
            ], 403);
        }

        // Revoke old tokens if not remember_me
        if (!$request->boolean('remember_me')) {
            $user->tokens()->delete();
        }

        $token = $user->createToken('edms-api-token')->plainTextToken;

        // Update last login info
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        // Audit log
        $this->auditService->logLogin($user->id, $request->ip(), $request->userAgent());

        return response()->json([
            'success' => true,
            'message' => __('auth.logged_in'),
            'data'    => [
                'token'       => $token,
                'token_type'  => 'Bearer',
                'user'        => $this->formatUser($user),
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        // Revoke current token
        $request->user()->currentAccessToken()->delete();

        $this->auditService->logLogout($userId);

        return response()->json([
            'success' => true,
            'message' => __('auth.logged_out'),
        ]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['roles.permissions', 'department.organization']);

        return response()->json([
            'success' => true,
            'data'    => $this->formatUser($user),
        ]);
    }

    /**
     * Format user response with permissions.
     */
    private function formatUser(User $user): array
    {
        $permissions = collect();

        foreach ($user->roles as $role) {
            $permissions = $permissions->merge($role->permissions->pluck('name'));
        }

        return [
            'id'              => $user->id,
            'name'            => $user->name,
            'username'        => $user->username,
            'email'           => $user->email,
            'employee_number' => $user->employee_number,
            'avatar'          => $user->avatar,
            'phone'           => $user->phone,
            'status'          => $user->status,
            'last_login_at'   => $user->last_login_at?->toIso8601String(),
            'department'      => $user->department ? [
                'id'   => $user->department->id,
                'name' => $user->department->name,
                'name_ar' => $user->department->name_ar,
            ] : null,
            'roles'           => $user->roles->map(fn ($r) => [
                'id'   => $r->id,
                'name' => $r->name,
                'display_name'    => $r->display_name,
                'display_name_ar' => $r->display_name_ar,
            ]),
            'permissions'     => $permissions->unique()->values(),
            'is_super_admin'  => $user->isSuperAdmin(),
        ];
    }
}
