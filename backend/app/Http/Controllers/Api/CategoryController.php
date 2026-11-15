<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $categories = Category::withCount(['documents', 'children', 'documentTypes'])
            ->when($request->boolean('active_only', false), fn ($q) => $q->active())
            ->when($request->input('parent_id') === 'null', fn ($q) => $q->roots())
            ->ordered()
            ->orderBy('id')
            ->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    public function show(int $id): JsonResponse
    {
        $category = Category::with(['parent', 'children', 'documentTypes'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $category]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensurePermission('categories.manage');

        $validated = $request->validate([
            'code'        => ['required', 'string', 'max:30', 'unique:categories,code'],
            'name'        => ['nullable', 'string', 'max:150'],
            'name_ar'     => ['nullable', 'string', 'max:150'],
            'parent_id'   => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'icon'        => ['nullable', 'string', 'max:50'],
            'color'       => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string'],
            'sort_order'  => ['nullable', 'integer'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        if (empty($validated['name_ar']) && !empty($validated['name'])) {
            $validated['name_ar'] = $validated['name'];
        }
        if (empty($validated['name']) && !empty($validated['name_ar'])) {
            $validated['name'] = $validated['name_ar'];
        }

        if (empty($validated['sort_order'])) {
            $validated['sort_order'] = (int) Category::max('sort_order') + 1;
        }

        $category = Category::create($validated);

        $this->auditService->log('create', $category, null, $validated, "Category created: {$category->name}");

        return response()->json(['success' => true, 'message' => 'تم إنشاء التصنيف بنجاح.', 'data' => $category], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->ensurePermission('categories.manage');

        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'code'        => ['sometimes', 'string', 'max:30', Rule::unique('categories', 'code')->ignore($id)],
            'name'        => ['nullable', 'string', 'max:150'],
            'name_ar'     => ['nullable', 'string', 'max:150'],
            'parent_id'   => ['nullable', 'integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'icon'        => ['nullable', 'string', 'max:50'],
            'color'       => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string'],
            'sort_order'  => ['nullable', 'integer'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('parent_id', $validated) && $validated['parent_id'] !== null) {
            $newParentId = (int) $validated['parent_id'];

            if ($newParentId === $category->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكن أن يكون التصنيف أبًا لنفسه.',
                ], 422);
            }

            if ($this->isSelfOrDescendant($newParentId, $category->id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يمكن نقل التصنيف تحت أحد أبنائه؛ سيؤدي ذلك إلى حلقة في الشجرة.',
                ], 422);
            }
        }

        [$old, $new] = $this->auditService->getDiff($category->fill($validated));
        $category->save();

        $this->auditService->log('update', $category, $old, $new, "Category updated: {$category->name}");

        return response()->json(['success' => true, 'message' => 'تم تحديث التصنيف.', 'data' => $category]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->ensurePermission('categories.manage');

        $category = Category::findOrFail($id);

        if ($category->documents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيف لأنه يحتوي على وثائق.',
            ], 422);
        }

        if ($category->children()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية.',
            ], 422);
        }

        if ($category->documentTypes()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف التصنيف لأنه مرتبط بأنواع وثائق.',
            ], 422);
        }

        $this->auditService->log('delete', $category, $category->toArray(), null, "Category deleted: {$category->name}");
        $category->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف التصنيف.']);
    }

    /**
     * Walk up from $candidateId; true when $categoryId is on that chain.
     */
    private function isSelfOrDescendant(int $candidateId, int $categoryId): bool
    {
        $current = Category::find($candidateId);
        $guard   = 0;

        while ($current && $guard++ < 100) {
            if ((int) $current->id === $categoryId) {
                return true;
            }

            $current = $current->parent_id ? Category::find($current->parent_id) : null;
        }

        return false;
    }

    /**
     * Helper: enforce a named permission.
     */
    private function ensurePermission(string $permission): void
    {
        if (!request()->user()->hasPermission($permission) && !request()->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
