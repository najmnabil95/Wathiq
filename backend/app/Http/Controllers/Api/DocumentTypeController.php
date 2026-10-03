<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentType;
use App\Models\DocumentTypeField;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DocumentTypeController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $types = DocumentType::with('category')
            ->when($request->input('category_id'), fn($q, $v) => $q->byCategory((int)$v))
            ->when($request->boolean('active_only'), fn($q) => $q->active())
            ->get();

        return response()->json(['success' => true, 'data' => $types]);
    }

    public function show(int $id): JsonResponse
    {
        $type = DocumentType::with(['category', 'activeFields', 'workflows'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $type]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        $validated = $request->validate([
            'category_id'       => ['required', 'exists:categories,id'],
            'name'              => ['required', 'string', 'max:150'],
            'name_ar'           => ['required', 'string', 'max:150'],
            'code'              => ['required', 'string', 'max:30', 'unique:document_types,code'],
            'prefix'            => ['required', 'string', 'max:20'],
            'description'       => ['nullable', 'string'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_active'         => ['sometimes', 'boolean'],
        ]);

        $type = DocumentType::create($validated);
        $this->auditService->log('create', $type, null, $validated, "Document type created: {$type->name}");

        return response()->json(['success' => true, 'data' => $type->load('category')], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        $type = DocumentType::findOrFail($id);

        $validated = $request->validate([
            'category_id'       => ['sometimes', 'exists:categories,id'],
            'name'              => ['sometimes', 'string', 'max:150'],
            'name_ar'           => ['sometimes', 'string', 'max:150'],
            'code'              => ['sometimes', 'string', 'max:30', Rule::unique('document_types', 'code')->ignore($id)],
            'prefix'            => ['sometimes', 'string', 'max:20'],
            'description'       => ['nullable', 'string'],
            'requires_approval' => ['sometimes', 'boolean'],
            'is_active'         => ['sometimes', 'boolean'],
        ]);

        [$old, $new] = $this->auditService->getDiff($type->fill($validated));
        $type->save();
        $this->auditService->log('update', $type, $old, $new);

        return response()->json(['success' => true, 'data' => $type]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        $type = DocumentType::findOrFail($id);

        if ($type->documents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف نوع الوثيقة لأنه مرتبط بوثائق موجودة.',
            ], 422);
        }

        $type->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف نوع الوثيقة.']);
    }

    // ─── Dynamic Fields ─────────────────────────────────────────────

    public function fields(int $id): JsonResponse
    {
        $type   = DocumentType::findOrFail($id);
        $fields = $type->activeFields;
        return response()->json(['success' => true, 'data' => $fields]);
    }

    public function addField(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        DocumentType::findOrFail($id);

        $validated = $request->validate([
            'name'             => ['required', 'string', 'max:100', Rule::unique('document_type_fields', 'name')->where('document_type_id', $id)],
            'label'            => ['required', 'string', 'max:200'],
            'label_ar'         => ['required', 'string', 'max:200'],
            'field_type'       => ['required', 'in:' . implode(',', DocumentTypeField::FIELD_TYPES)],
            'is_required'      => ['sometimes', 'boolean'],
            'default_value'    => ['nullable', 'string'],
            'options'          => ['nullable', 'array'],
            'options.*'        => ['string'],
            'validation_rules' => ['nullable', 'array'],
            'placeholder'      => ['nullable', 'string'],
            'placeholder_ar'   => ['nullable', 'string'],
            'hint'             => ['nullable', 'string'],
            'hint_ar'          => ['nullable', 'string'],
            'sort_order'       => ['nullable', 'integer'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        $field = DocumentTypeField::create(array_merge($validated, ['document_type_id' => $id]));

        return response()->json(['success' => true, 'data' => $field], 201);
    }

    public function updateField(Request $request, int $fieldId): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        $field = DocumentTypeField::findOrFail($fieldId);

        $validated = $request->validate([
            'label'            => ['sometimes', 'string', 'max:200'],
            'label_ar'         => ['sometimes', 'string', 'max:200'],
            'field_type'       => ['sometimes', 'in:' . implode(',', DocumentTypeField::FIELD_TYPES)],
            'is_required'      => ['sometimes', 'boolean'],
            'default_value'    => ['nullable', 'string'],
            'options'          => ['nullable', 'array'],
            'validation_rules' => ['nullable', 'array'],
            'placeholder'      => ['nullable', 'string'],
            'placeholder_ar'   => ['nullable', 'string'],
            'hint'             => ['nullable', 'string'],
            'hint_ar'          => ['nullable', 'string'],
            'sort_order'       => ['nullable', 'integer'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        $field->update($validated);

        return response()->json(['success' => true, 'data' => $field]);
    }

    public function deleteField(int $fieldId): JsonResponse
    {
        $this->checkPermission('document-types.manage');

        $field = DocumentTypeField::findOrFail($fieldId);

        if ($field->fieldValues()->exists()) {
            // Soft disable instead of delete if values exist
            $field->update(['is_active' => false]);
            return response()->json(['success' => true, 'message' => 'تم تعطيل الحقل (لا يمكن حذفه لوجود بيانات مرتبطة).']);
        }

        $field->delete();
        return response()->json(['success' => true, 'message' => 'تم حذف الحقل.']);
    }

    private function checkPermission(string $perm): void
    {
        if (!request()->user()->hasPermission($perm) && !request()->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية.');
        }
    }
}
