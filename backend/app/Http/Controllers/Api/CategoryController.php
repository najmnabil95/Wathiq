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
        $categories = Category::with(['parent', 'children'])
            ->when($request->boolean('active_only', false), fn ($q) => $q->active())
            ->when($request->input('parent_id') === 'null', fn ($q) => $q->roots())
            ->ordered()
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
        $this->authorize('categories.manage');

        $validated = $request->validate([
            'code'        => ['required', 'string', 'max:30', 'unique:categories,code'],
            'name'        => ['nullable', 'string', 'max:150'],
            'name_ar'     => ['nullable', 'string', 'max:150'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
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

        $category = Category::create($validated);

        $this->auditService->log('create', $category, null, $validated, "Category created: {$category->name}");

        return response()->json(['success' => true, 'message' => 'تم إنشاء التصنيف بنجاح.', 'data' => $category], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->authorize('categories.manage');

        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'code'        => ['sometimes', 'string', 'max:30', Rule::unique('categories', 'code')->ignore($id)],
            'name'        => ['nullable', 'string', 'max:150'],
            'name_ar'     => ['nullable', 'string', 'max:150'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'color'       => ['nullable', 'string', 'max:30'],
            'description' => ['nullable', 'string'],
            'sort_order'  => ['nullable', 'integer'],
            'is_active'   => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['name']) && empty($validated['name_ar'])) {
            $validated['name_ar'] = $validated['name'];
        }
        if (isset($validated['name_ar']) && empty($validated['name'])) {
            $validated['name'] = $validated['name_ar'];
        }

        [$old, $new] = $this->auditService->getDiff($category->fill($validated));
        $category->save();

        $this->auditService->log('update', $category, $old, $new, "Category updated: {$category->name}");

        return response()->json(['success' => true, 'message' => 'تم تحديث التصنيف.', 'data' => $category]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->authorize('categories.manage');

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

        $this->auditService->log('delete', $category, $category->toArray(), null, "Category deleted: {$category->name}");
        $category->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف التصنيف.']);
    }

    /**
     * Helper: authorize by permission name.
     */
    private function authorize(string $permission): void
    {
        if (!request()->user()->hasPermission($permission) && !request()->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
