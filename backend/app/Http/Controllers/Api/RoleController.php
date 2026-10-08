<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    /**
     * Module definitions with Arabic labels and metadata
     */
    private const MODULE_METADATA = [
        'documents' => [
            'label_ar'       => 'إدارة الوثائق والأرشيف',
            'label_en'       => 'Documents & Archiving',
            'icon'           => 'FileText',
            'description_ar' => 'صلاحيات دورة حياة الوثيقة والوصول والحفظ النهائي',
        ],
        'attachments' => [
            'label_ar'       => 'المرفقات والملفات الرقمية',
            'label_en'       => 'Attachments & Media',
            'icon'           => 'Paperclip',
            'description_ar' => 'معاينة ورفع وتنزيل وحذف الملفات المرفقة',
        ],
        'versions' => [
            'label_ar'       => 'التحكم بالإصدارات',
            'label_en'       => 'Version Control',
            'icon'           => 'History',
            'description_ar' => 'استعراض سجل الإصدارات التاريخية والترقية والاسترجاع',
        ],
        'comments' => [
            'label_ar'       => 'التعليقات والملاحظات',
            'label_en'       => 'Comments & Notes',
            'icon'           => 'MessageSquare',
            'description_ar' => 'إضافة وقراءة وحذف الملاحظات التوجيهية للوثائق',
        ],
        'workflows' => [
            'label_ar'       => 'مسارات العمل والاعتمادات',
            'label_en'       => 'Workflows & Approvals',
            'icon'           => 'GitMerge',
            'description_ar' => 'إحالة الوثائق للاعتماد واتخاذ قرارات القبول والرفض والتفويض',
        ],
        'categories' => [
            'label_ar'       => 'التصنيفات والملفات',
            'label_en'       => 'Categories & Folders',
            'icon'           => 'FolderTree',
            'description_ar' => 'تنظيم وهيكلة شجرة التصنيفات الأرشيفية',
        ],
        'document-types' => [
            'label_ar'       => 'أنواع الوثائق والحقول المخصصة',
            'label_en'       => 'Document Types & Fields',
            'icon'           => 'Layers',
            'description_ar' => 'تعريف قوالب الوثائق وتصميم الحقول الوصفية الديناميكية',
        ],
        'departments' => [
            'label_ar'       => 'الأقسام والهيكل الإداري',
            'label_en'       => 'Departments & Structure',
            'icon'           => 'Building2',
            'description_ar' => 'إدارة الهيكل التنظيمي والفروع وتوزيع الإدارات',
        ],
        'organizations' => [
            'label_ar'       => 'الجهات الخارجية',
            'label_en'       => 'External Organizations',
            'icon'           => 'Globe',
            'description_ar' => 'إدارة الشركات والجهات الخارجية المرتبطة بالصادر والوارد',
        ],
        'users' => [
            'label_ar'       => 'المستخدمون وحسابات الموظفين',
            'label_en'       => 'Users & Accounts',
            'icon'           => 'Users',
            'description_ar' => 'إدارة حسابات الموظفين وتعيين الأقسام وحالة النشاط',
        ],
        'roles' => [
            'label_ar'       => 'شجرة الصلاحيات والأدوار',
            'label_en'       => 'Roles & Permissions Matrix',
            'icon'           => 'ShieldCheck',
            'description_ar' => 'التحكم الكامل في مصفوفة الصلاحيات وتخصيص الأدوار',
        ],
        'reports' => [
            'label_ar'       => 'التقارير والمؤشرات الإحصائية',
            'label_en'       => 'Reports & Analytics',
            'icon'           => 'BarChart3',
            'description_ar' => 'استعراض لوحات المؤشرات وتصدير التقارير الإحصائية',
        ],
        'audit' => [
            'label_ar'       => 'سجل الرقابة والتدقيق الأمني',
            'label_en'       => 'Audit Trails & Security',
            'icon'           => 'Activity',
            'description_ar' => 'مراقبة سجل الأحداث وتتبع كافة العمليات في النظام',
        ],
        'settings' => [
            'label_ar'       => 'إعدادات النظام والنسخ الاحتياطي',
            'label_en'       => 'System Settings & Backup',
            'icon'           => 'Settings',
            'description_ar' => 'قواعد الترقيم التلقائي وسياسات الاستبقاء والنسخ الاحتياطي',
        ],
    ];

    /**
     * GET /api/v1/roles
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAccess($request);

        $roles = Role::withCount(['permissions', 'users'])
            ->with('permissions:id,name,display_name,display_name_ar,group,risk_level')
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $roles,
        ]);
    }

    /**
     * GET /api/v1/roles/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $this->authorizeAccess($request);

        $role = Role::withCount('users')
            ->with('permissions')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $role,
        ]);
    }

    /**
     * POST /api/v1/roles
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeAccess($request);

        // Sanitize machine name if supplied
        if ($request->filled('name')) {
            $cleaned = strtolower(trim(preg_replace('/[^a-zA-Z0-9_]/', '_', $request->input('name')), '_'));
            $request->merge(['name' => $cleaned]);
        }

        $validated = $request->validate([
            'name'            => 'nullable|string|max:100|unique:roles,name',
            'display_name'    => 'nullable|string|max:255',
            'display_name_ar' => 'required|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'permissions'     => 'nullable|array',
            'permissions.*'   => 'string|exists:permissions,name',
            'clone_from_id'   => 'nullable|exists:roles,id',
        ], [
            'display_name_ar.required' => 'يرجى إدخال مسمى الدور الوظيفي بالعربية',
            'name.unique'             => 'الرمز البرمجي للدور مستخدم مسبقاً، يرجى اختيار رمز آخر',
        ]);

        $displayNameAr = trim($validated['display_name_ar']);
        $displayName   = !empty($validated['display_name']) ? trim($validated['display_name']) : $displayNameAr;

        // Auto-generate unique machine name if not supplied
        $machineName = !empty($validated['name']) ? $validated['name'] : null;
        if (empty($machineName)) {
            $candidateBase = Str::slug($displayName, '_');
            if (empty($candidateBase)) {
                $candidateBase = 'role_' . strtolower(Str::random(6));
            }
            $candidate = $candidateBase;
            $counter = 1;
            while (Role::where('name', $candidate)->exists()) {
                $candidate = $candidateBase . '_' . $counter++;
            }
            $machineName = $candidate;
        }

        $role = Role::create([
            'name'            => $machineName,
            'display_name'    => $displayName,
            'display_name_ar' => $displayNameAr,
            'description'     => $validated['description'] ?? null,
            'is_system'       => false,
        ]);

        // Copy permissions if cloning from an existing role or if array provided
        if (!empty($validated['clone_from_id'])) {
            $sourceRole = Role::with('permissions')->find($validated['clone_from_id']);
            if ($sourceRole && $sourceRole->permissions->isNotEmpty()) {
                $role->permissions()->sync($sourceRole->permissions->pluck('id'));
            }
        } elseif (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        $this->auditService->log(
            'role.create',
            $role,
            [],
            $role->toArray(),
            "إنشاء دور وظيفي جديد: {$role->display_name_ar}"
        );

        $role->loadCount(['permissions', 'users'])->load('permissions');

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الدور الوظيفي بنجاح',
            'data'    => $role,
        ], 201);
    }

    /**
     * PUT /api/v1/roles/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorizeAccess($request);

        $role = Role::findOrFail($id);

        $validated = $request->validate([
            'name'            => ['nullable', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role->id)],
            'display_name'    => 'sometimes|string|max:255',
            'display_name_ar' => 'sometimes|string|max:255',
            'description'     => 'nullable|string|max:1000',
            'permissions'     => 'nullable|array',
            'permissions.*'   => 'string|exists:permissions,name',
        ]);

        $oldValues = $role->toArray();

        // System roles cannot have their machine name changed
        if ($role->is_system) {
            unset($validated['name']);
        }

        $role->update(array_filter([
            'name'            => $validated['name'] ?? null,
            'display_name'    => $validated['display_name'] ?? null,
            'display_name_ar' => $validated['display_name_ar'] ?? null,
            'description'     => $validated['description'] ?? null,
        ]));

        // Sync permissions if provided
        if (array_key_exists('permissions', $validated)) {
            // Super Admin always maintains full permissions
            if ($role->name === 'super_admin') {
                $allPerms = Permission::pluck('name')->toArray();
                $role->syncPermissions($allPerms);
            } else {
                $role->syncPermissions($validated['permissions'] ?? []);
            }
        }

        $this->auditService->log(
            'role.update',
            $role,
            $oldValues,
            $role->toArray(),
            "تحديث بيانات وصلاحيات الدور: {$role->display_name_ar}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الدور وصلاحياته بنجاح',
            'data'    => $role->loadCount(['permissions', 'users'])->load('permissions'),
        ]);
    }

    /**
     * DELETE /api/v1/roles/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->authorizeAccess($request);

        $role = Role::withCount('users')->findOrFail($id);

        if ($role->is_system) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف الأدوار الأساسية للنظام',
            ], 422);
        }

        if ($role->users_count > 0) {
            return response()->json([
                'success' => false,
                'message' => "لا يمكن حذف الدور لوجود ({$role->users_count}) مستخدمين مرتبطين به",
            ], 422);
        }

        $old = $role->toArray();
        $role->permissions()->detach();
        $role->delete();

        $this->auditService->log(
            'role.delete',
            null,
            $old,
            [],
            "حذف الدور الوظيفي: {$role->display_name_ar}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الدور بنجاح',
        ]);
    }

    /**
     * GET /api/v1/permissions/tree
     * Returns structured permissions tree grouped by modules
     */
    public function tree(Request $request): JsonResponse
    {
        $this->authorizeAccess($request);

        $allPermissions = Permission::orderBy('group')
            ->orderBy('id')
            ->get();

        $grouped = $allPermissions->groupBy('group');

        $tree = [];
        foreach ($grouped as $groupKey => $perms) {
            $meta = self::MODULE_METADATA[$groupKey] ?? [
                'label_ar'       => $groupKey,
                'label_en'       => ucfirst(str_replace('-', ' ', $groupKey)),
                'icon'           => 'Folder',
                'description_ar' => '',
            ];

            $tree[] = [
                'key'            => $groupKey,
                'label_ar'       => $meta['label_ar'],
                'label_en'       => $meta['label_en'],
                'icon'           => $meta['icon'],
                'standard_ref'   => $meta['standard_ref'] ?? 'ISO 15489',
                'description_ar' => $meta['description_ar'],
                'total_count'    => $perms->count(),
                'permissions'    => $perms->map(fn ($p) => [
                    'id'              => $p->id,
                    'name'            => $p->name,
                    'display_name'    => $p->display_name,
                    'display_name_ar' => $p->display_name_ar,
                    'description_ar'  => $p->description_ar,
                    'subgroup'        => $p->subgroup ?? 'general',
                    'risk_level'      => $p->risk_level ?? 'normal',
                    'standard_ref'    => $p->standard_ref ?? ($meta['standard_ref'] ?? 'ISO 15489'),
                ])->values(),
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'total_modules'     => count($tree),
                'total_permissions' => $allPermissions->count(),
                'modules'           => $tree,
            ],
        ]);
    }

    /**
     * GET /api/v1/permissions (Legacy format)
     */
    public function permissions(Request $request): JsonResponse
    {
        $this->authorizeAccess($request);

        return response()->json([
            'success' => true,
            'data'    => Permission::all()->groupBy('group'),
        ]);
    }

    private function authorizeAccess(Request $request): void
    {
        $user = $request->user();
        if (!$user->hasPermission('roles.view') && !$user->hasPermission('roles.manage') && !$user->isSuperAdmin()) {
            abort(403, 'غير مصرح لك بالوصول لإدارة شجرة الصلاحيات والأدوار');
        }
    }
}
