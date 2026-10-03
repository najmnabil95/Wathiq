<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepartmentController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Department::with(['parent', 'children', 'organization'])
            ->withCount(['documents', 'users', 'children']);

        if ($request->boolean('roots_only')) {
            $query->whereNull('parent_id');
        }

        if ($request->filled('parent_id')) {
            $query->where('parent_id', $request->input('parent_id'));
        }

        if ($request->has('active')) {
            $query->where('is_active', $request->boolean('active'));
        }

        // Search by name or code
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('name_ar', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'data'    => $query->orderBy('parent_id')->orderBy('name_ar')->get(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => Department::with(['parent', 'children.children', 'organization'])
                ->withCount(['documents', 'users', 'children'])
                ->findOrFail($id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('departments.manage');

        $validated = $request->validate([
            'code'            => ['required', 'string', 'max:30', 'unique:departments,code'],
            'name'            => ['nullable', 'string', 'max:150'],
            'name_ar'         => ['required', 'string', 'max:150'],
            'description'     => ['nullable', 'string'],
            'organization_id' => ['nullable', 'exists:organizations,id'],
            'parent_id'       => ['nullable', 'exists:departments,id'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        if (empty($validated['name'])) {
            $validated['name'] = $validated['name_ar'];
        }

        $dept = Department::create($validated);
        $dept->load(['parent', 'children', 'organization']);
        $this->auditService->log('create', $dept, null, $validated, "Department/Branch created: {$dept->name_ar} ({$dept->code})");

        return response()->json(['success' => true, 'data' => $dept], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('departments.manage');

        $dept = Department::findOrFail($id);

        $validated = $request->validate([
            'code'            => ['sometimes', 'string', 'max:30', Rule::unique('departments', 'code')->ignore($id)],
            'name'            => ['nullable', 'string', 'max:150'],
            'name_ar'         => ['sometimes', 'string', 'max:150'],
            'description'     => ['nullable', 'string'],
            'organization_id' => ['nullable', 'exists:organizations,id'],
            'parent_id'       => ['nullable', 'exists:departments,id'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name_ar']) && empty($validated['name'])) {
            $validated['name'] = $validated['name_ar'];
        }

        // Prevent setting self as parent
        if (isset($validated['parent_id']) && $validated['parent_id'] == $id) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن تعيين القسم كفرع تابع لنفسه.',
            ], 422);
        }

        [$old, $new] = $this->auditService->getDiff($dept->fill($validated));
        $dept->save();
        $dept->load(['parent', 'children', 'organization']);

        $this->auditService->log('update', $dept, $old, $new);

        return response()->json(['success' => true, 'data' => $dept]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->checkPermission('departments.manage');

        $dept = Department::findOrFail($id);

        if ($dept->users()->exists() || $dept->documents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف القسم لأنه يحتوي على مستخدمين أو وثائق.',
            ], 422);
        }

        $this->auditService->log('delete', $dept, $dept->toArray(), null);
        $dept->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف القسم.']);
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
}
