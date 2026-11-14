<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\User;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $this->checkPermission('users.view');

        $users = User::with(['roles', 'department'])
            ->withCount('permissionOverrides')
            ->when($request->input('department_id'), fn($q, $v) => $q->where('department_id', $v))
            ->when($request->input('status'), fn($q, $v) => $q->where('status', $v))
            ->when($request->input('q'), fn($q, $v) => $q->where(function ($qq) use ($v) {
                $qq->where('name', 'like', "%{$v}%")
                   ->orWhere('email', 'like', "%{$v}%")
                   ->orWhere('username', 'like', "%{$v}%")
                   ->orWhere('employee_number', 'like', "%{$v}%");
            }))
            ->paginate($request->input('per_page', 20));

        return response()->json(['success' => true, 'data' => $users]);
    }

    public function show(int $id): JsonResponse
    {
        $this->checkPermission('users.view');

        return response()->json([
            'success' => true,
            'data'    => User::with(['roles.permissions', 'department', 'permissionOverrides'])->findOrFail($id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('users.create');

        // Auto-generate username from email if not provided
        if (!$request->filled('username') && $request->filled('email')) {
            $base = preg_replace('/[^a-zA-Z0-9_]/', '', explode('@', $request->input('email'))[0]) ?: 'user';
            $username = $base;
            $c = 1;
            while (User::where('username', $username)->exists()) {
                $username = $base . $c++;
            }
            $request->merge(['username' => $username]);
        }

        // Map is_active to status
        if ($request->has('is_active') && !$request->has('status')) {
            $request->merge(['status' => $request->boolean('is_active') ? 'active' : 'inactive']);
        }

        // Convert role names to role IDs if passed as strings
        if ($request->has('roles')) {
            $rawRoles = (array)$request->input('roles');
            $roleIds = [];
            foreach ($rawRoles as $r) {
                if (is_numeric($r)) {
                    $roleIds[] = (int)$r;
                } else {
                    $normalized = $r === 'admin' ? 'it_manager' : ($r === 'auditor' ? 'viewer' : $r);
                    $found = Role::where('name', $normalized)->value('id');
                    if ($found) $roleIds[] = $found;
                }
            }
            $request->merge(['roles' => $roleIds]);
        }

        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:150'],
            'username'        => ['required', 'string', 'max:50', 'unique:users,username'],
            'email'           => ['required', 'email', 'unique:users,email'],
            'employee_number' => ['nullable', 'string', 'max:50', 'unique:users,employee_number'],
            'department_id'   => ['required', 'exists:departments,id'],
            'password'        => ['required', 'string', 'min:8', 'confirmed'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'status'          => ['sometimes', 'in:active,inactive'],
            'roles'           => ['nullable', 'array'],
            'roles.*'         => ['exists:roles,id'],
        ]);

        $user = User::create([
            'name'            => $validated['name'],
            'username'        => $validated['username'],
            'email'           => $validated['email'],
            'employee_number' => $validated['employee_number'] ?? null,
            'department_id'   => $validated['department_id'] ?? null,
            'password'        => Hash::make($validated['password']),
            'phone'           => $validated['phone'] ?? null,
            'status'          => $validated['status'] ?? 'active',
        ]);

        if (!empty($validated['roles'])) {
            $user->roles()->sync($validated['roles']);
        }

        $this->auditService->log('create', $user, null, ['name' => $user->name, 'email' => $user->email], "User created: {$user->name}");

        return response()->json(['success' => true, 'data' => $user->load('roles'), 'message' => 'تم إنشاء المستخدم.'], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('users.update');

        $user = User::findOrFail($id);

        if ($request->has('is_active') && !$request->has('status')) {
            $request->merge(['status' => $request->boolean('is_active') ? 'active' : 'inactive']);
        }

        $validated = $request->validate([
            'name'            => ['sometimes', 'string', 'max:150'],
            'username'        => ['sometimes', 'string', 'max:50', Rule::unique('users', 'username')->ignore($id)],
            'email'           => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($id)],
            'employee_number' => ['nullable', 'string', 'max:50', Rule::unique('users', 'employee_number')->ignore($id)],
            'department_id'   => ['sometimes', 'required', 'exists:departments,id'],
            'phone'           => ['nullable', 'string', 'max:30'],
            'status'          => ['sometimes', 'in:active,inactive,suspended'],
            'password'        => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        [$old, $new] = $this->auditService->getDiff($user->fill($validated));
        $user->save();

        if ($request->has('roles')) {
            $rawRoles = (array)$request->input('roles');
            $roleIds = [];
            foreach ($rawRoles as $r) {
                if (is_numeric($r)) {
                    $roleIds[] = (int)$r;
                } else {
                    $normalized = $r === 'admin' ? 'it_manager' : ($r === 'auditor' ? 'viewer' : $r);
                    $found = Role::where('name', $normalized)->value('id');
                    if ($found) $roleIds[] = $found;
                }
            }
            if (!empty($roleIds)) {
                $user->roles()->sync($roleIds);
            }
        }

        $this->auditService->log('update', $user, $old, $new, "User updated: {$user->name}");

        return response()->json(['success' => true, 'data' => $user->load('roles')]);
    }

    public function updateRoles(Request $request, int $id): JsonResponse
    {
        $this->checkAnyPermission(['roles.assign', 'roles.manage']);

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['exists:roles,id'],
        ]);

        // Protect super admin from losing role
        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($user->isSuperAdmin() && $superAdminRole && !in_array($superAdminRole->id, $validated['roles'])) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن إزالة دور مدير النظام الكامل.',
            ], 422);
        }

        $user->roles()->sync($validated['roles']);

        $this->auditService->log('update', $user, null, ['roles' => $validated['roles']], "Roles updated for: {$user->name}");

        return response()->json(['success' => true, 'data' => $user->load('roles'), 'message' => 'تم تحديث الأدوار.']);
    }

    /**
     * GET /api/v1/users/{id}/permissions
     * Full permission tree annotated with role inheritance and per-user overrides.
     */
    public function permissions(Request $request, int $id): JsonResponse
    {
        $this->checkAnyPermission(['roles.assign', 'roles.manage']);

        $user = User::with(['roles.permissions', 'permissionOverrides'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->buildPermissionMatrix($user),
        ]);
    }

    /**
     * PUT /api/v1/users/{id}/permissions
     * Replace the user's per-user exceptions (grant / deny) over role bundles.
     */
    public function updatePermissions(Request $request, int $id): JsonResponse
    {
        $this->checkAnyPermission(['roles.assign', 'roles.manage']);

        $user = User::with('permissionOverrides')->findOrFail($id);

        if ($user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'مدير النظام الكامل يمتلك جميع الصلاحيات ولا يمكن تقييدها باستثناءات فردية.',
            ], 422);
        }

        if ($request->user()->id === $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكنك تعديل صلاحياتك الفردية بنفسك. اطلب من مدير نظام آخر.',
            ], 422);
        }

        $validated = $request->validate([
            'overrides'                 => ['present', 'array'],
            'overrides.*.permission_id' => ['required', 'integer', 'exists:permissions,id'],
            'overrides.*.effect'        => ['required', 'in:grant,deny'],
        ]);

        $sync = [];
        foreach ($validated['overrides'] as $override) {
            $sync[$override['permission_id']] = ['effect' => $override['effect']];
        }

        $old = $user->permissionOverrides
            ->mapWithKeys(fn ($p) => [$p->name => $p->pivot->effect])
            ->all();

        $user->permissionOverrides()->sync($sync);

        $new = $user->permissionOverrides()
            ->get()
            ->mapWithKeys(fn ($p) => [$p->name => $p->pivot->effect])
            ->all();

        $this->auditService->log(
            'permission.override',
            $user,
            ['overrides' => $old],
            ['overrides' => $new],
            "تحديث الصلاحيات الفردية للمستخدم: {$user->name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الصلاحيات الفردية للمستخدم بنجاح.',
            'data'    => $this->buildPermissionMatrix(
                $user->fresh(['roles.permissions', 'permissionOverrides'])
            ),
        ]);
    }

    private function buildPermissionMatrix(User $user): array
    {
        $isSuperAdmin = $user->isSuperAdmin();
        $overrides    = $user->permissionOverrides->mapWithKeys(
            fn ($p) => [$p->id => $p->pivot->effect]
        );

        $modules = Permission::orderBy('group')->orderBy('id')->get()
            ->groupBy('group')
            ->map(function ($perms, $groupKey) use ($user, $isSuperAdmin, $overrides) {
                $meta = RoleController::MODULE_METADATA[$groupKey] ?? [
                    'label_ar'       => $groupKey,
                    'label_en'       => ucfirst(str_replace('-', ' ', $groupKey)),
                    'icon'           => 'Folder',
                    'description_ar' => '',
                ];

                $items = $perms->map(function ($perm) use ($user, $isSuperAdmin, $overrides) {
                    $effect    = $overrides[$perm->id] ?? null;
                    $inherited = $user->hasRolePermission($perm->name);
                    $effective = $isSuperAdmin ? true : ($effect !== null ? $effect === 'grant' : $inherited);

                    return [
                        'id'              => $perm->id,
                        'name'            => $perm->name,
                        'display_name'    => $perm->display_name,
                        'display_name_ar' => $perm->display_name_ar,
                        'description_ar'  => $perm->description_ar,
                        'subgroup'        => $perm->subgroup ?? 'general',
                        'risk_level'      => $perm->risk_level ?? 'normal',
                        'standard_ref'    => $perm->standard_ref,
                        'inherited'       => $inherited,
                        'override'        => $effect,
                        'effective'       => $effective,
                    ];
                });

                return [
                    'key'             => $groupKey,
                    'label_ar'        => $meta['label_ar'],
                    'label_en'        => $meta['label_en'],
                    'icon'            => $meta['icon'],
                    'description_ar'  => $meta['description_ar'],
                    'total_count'     => $items->count(),
                    'effective_count' => $items->where('effective', true)->count(),
                    'override_count'  => $items->whereNotNull('override')->count(),
                    'permissions'     => $items->values(),
                ];
            })->values();

        return [
            'user' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'roles'    => $user->roles->map(fn ($r) => [
                    'id'              => $r->id,
                    'name'            => $r->name,
                    'display_name_ar' => $r->display_name_ar,
                ])->values(),
            ],
            'is_super_admin'    => $isSuperAdmin,
            'total_permissions' => $modules->sum('total_count'),
            'effective_count'   => $modules->sum('effective_count'),
            'override_count'    => $modules->sum('override_count'),
            'modules'           => $modules,
        ];
    }

    public function changeStatus(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('users.change_status');

        $user = User::findOrFail($id);

        if ($request->user()->id === $user->id) {
            return response()->json(['success' => false, 'message' => 'لا يمكنك تغيير حالة حسابك الشخصي الحالي.'], 422);
        }

        if ($user->isSuperAdmin() && !$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'لا يمكن تعديل حالة حساب مدير النظام الكامل.'], 422);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:active,inactive,suspended'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $old = ['status' => $user->status];
        $user->update(['status' => $validated['status']]);

        if ($validated['status'] !== 'active') {
            $user->tokens()->delete();
        }

        $labels = ['active' => 'نشط', 'inactive' => 'معطل', 'suspended' => 'موقوف'];
        $this->auditService->log(
            'update_status',
            $user,
            $old,
            ['status' => $user->status, 'reason' => $validated['reason'] ?? null],
            "User status changed to {$labels[$user->status]}: {$user->name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الحساب بنجاح.',
            'data'    => $user->load('roles'),
        ]);
    }

    public function resetPassword(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('users.reset_password');

        $user = User::findOrFail($id);

        if ($user->isSuperAdmin() && !$request->user()->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'لا يمكن إعادة تعيين كلمة مرور مدير النظام الكامل.'], 422);
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);
        $user->tokens()->delete();

        $this->auditService->log(
            'password.reset',
            $user,
            null,
            ['revoked_sessions' => true],
            "Password reset for user: {$user->name}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إعادة تعيين كلمة المرور وإنهاء جلسات المستخدم بنجاح.',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('users.delete');

        // Cannot delete yourself
        if ($request->user()->id === $id) {
            return response()->json(['success' => false, 'message' => 'لا يمكنك حذف حسابك الخاص.'], 422);
        }

        $user = User::findOrFail($id);

        if ($user->isSuperAdmin()) {
            return response()->json(['success' => false, 'message' => 'لا يمكن حذف مدير النظام الكامل.'], 422);
        }

        $this->auditService->log('delete', $user, ['name' => $user->name, 'email' => $user->email], null);
        $user->tokens()->delete(); // Revoke all tokens
        $user->delete();           // Soft delete

        return response()->json(['success' => true, 'message' => 'تم حذف المستخدم.']);
    }

    private function checkPermission(string $perm): void
    {
        $user = request()->user();
        if (!$user) {
            abort(401, 'غير مصرح.');
        }
        if (!$user->hasPermission($perm) && !$user->isSuperAdmin()) {
            abort(403);
        }
    }

    private function checkAnyPermission(array $permissions): void
    {
        $user = request()->user();
        if (!$user) {
            abort(401, 'غير مصرح.');
        }
        if ($user->isSuperAdmin()) {
            return;
        }
        foreach ($permissions as $permission) {
            if ($user->hasPermission($permission)) {
                return;
            }
        }
        abort(403, 'ليس لديك صلاحية لتعيين الأدوار.');
    }
}
