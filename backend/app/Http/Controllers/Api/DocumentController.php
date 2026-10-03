<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentFieldValue;
use App\Models\DocumentType;
use App\Models\Status;
use App\Services\AuditService;
use App\Services\DocumentNumberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentNumberService $numberService,
        private readonly AuditService          $auditService,
    ) {}

    // ─── Index — List with filters & pagination ───────────────────

    public function index(Request $request): JsonResponse
    {
        $this->checkPermission('documents.view');

        $user = $request->user();

        $query = Document::with([
            'documentType', 'category', 'department', 'organization',
            'creator', 'assignee', 'status', 'confidentialityLevel', 'tags',
        ]);

        // Non-admin users see only their dept's docs
        if (!$user->isSuperAdmin() && !$user->hasRole('it_manager')) {
            $query->where('department_id', $user->department_id);
        }

        // Apply filters
        $query
            ->search($request->input('q'))
            ->byCategory($request->input('category_id') ? (int)$request->input('category_id') : null)
            ->byDocumentType($request->input('document_type_id') ? (int)$request->input('document_type_id') : null)
            ->byDepartment($request->input('department_id') ? (int)$request->input('department_id') : null)
            ->byStatus($request->input('status_id') ? (int)$request->input('status_id') : null)
            ->byConfidentialityLevel($request->input('confidentiality_level_id') ? (int)$request->input('confidentiality_level_id') : null)
            ->dateRange($request->input('date_from'), $request->input('date_to'))
            ->when($request->boolean('archived'), fn($q) => $q->archived(), fn($q) => $q->notArchived())
            ->when($request->filled('category_code'), fn($q) => $q->whereHas('category', fn($cq) => $cq->where('code', $request->input('category_code'))))
            ->when($request->filled('status'), fn($q) => $q->whereHas('status', fn($sq) => $sq->where('name', $request->input('status'))))
            ->when($request->boolean('pending'), fn($q) => $q->whereHas('status', fn($sq) => $sq->where('name', 'pending_approval')))
            ->when($request->input('created_by'), fn($q, $v) => $q->where('created_by', $v))
            ->when($request->input('tag'), fn($q, $v) => $q->whereHas('tags', fn($tq) => $tq->where('slug', $v)));

        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDir   = $request->input('dir', 'desc');
        $allowed   = ['created_at', 'document_date', 'document_number', 'title'];
        if (in_array($sortField, $allowed)) {
            $query->orderBy($sortField, $sortDir === 'asc' ? 'asc' : 'desc');
        }

        $perPage   = min($request->input('per_page', 15), 100);
        $documents = $query->paginate($perPage);

        return response()->json(['success' => true, 'data' => $documents]);
    }

    // ─── Show — Single document ───────────────────────────────────

    public function show(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.view');

        $document = Document::with([
            'documentType.activeFields',
            'category',
            'department',
            'organization',
            'creator',
            'assignee',
            'status',
            'confidentialityLevel',
            'fieldValues.field',
            'attachments.uploader',
            'versions.uploader',
            'approvals.approver',
            'approvals.workflowStep',
            'comments.user',
            'comments.replies.user',
            'tags',
        ])->findOrFail($id);

        // Audit: log view
        $this->auditService->logView($document);

        return response()->json(['success' => true, 'data' => $document]);
    }

    // ─── Store — Create document ───────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('documents.create');

        $validated = $request->validate([
            'title'                    => ['required', 'string', 'max:255'],
            'document_type_id'         => ['required', 'exists:document_types,id'],
            'category_id'              => ['required', 'exists:categories,id'],
            'department_id'            => ['required', 'exists:departments,id'],
            'organization_id'          => ['nullable', 'exists:organizations,id'],
            'assigned_to'              => ['nullable', 'exists:users,id'],
            'status_id'                => ['nullable', 'exists:statuses,id'],
            'confidentiality_level_id' => ['required', 'exists:confidentiality_levels,id'],
            'document_date'            => ['required', 'date'],
            'received_at'              => ['nullable', 'date'],
            'original_number'          => ['nullable', 'string', 'max:100'],
            'description'              => ['nullable', 'string'],
            'notes'                    => ['nullable', 'string'],
            'physical_location'        => ['nullable', 'string', 'max:255'],
            'tags'                     => ['nullable', 'array'],
            'tags.*'                   => ['string'],
            'fields'                   => ['nullable', 'array'],  // dynamic fields
            'fields.*'                 => ['nullable'],
        ]);

        $document = DB::transaction(function () use ($validated, $request) {
            $documentType = DocumentType::findOrFail($validated['document_type_id']);

            // Auto-generate document number
            $documentNumber = $this->numberService->generate($documentType);

            // Default status if not provided
            if (empty($validated['status_id'])) {
                $validated['status_id'] = Status::getDefault()?->id;
            }

            $document = Document::create([
                'document_number'          => $documentNumber,
                'original_number'          => $validated['original_number'] ?? null,
                'title'                    => $validated['title'],
                'document_type_id'         => $validated['document_type_id'],
                'category_id'             => $validated['category_id'],
                'department_id'            => $validated['department_id'],
                'organization_id'          => $validated['organization_id'] ?? null,
                'created_by'               => $request->user()->id,
                'assigned_to'              => $validated['assigned_to'] ?? null,
                'status_id'                => $validated['status_id'],
                'confidentiality_level_id' => $validated['confidentiality_level_id'],
                'document_date'            => $validated['document_date'],
                'received_at'              => $validated['received_at'] ?? null,
                'description'              => $validated['description'] ?? null,
                'notes'                    => $validated['notes'] ?? null,
                'physical_location'        => $validated['physical_location'] ?? null,
            ]);

            // Store dynamic field values
            if (!empty($validated['fields'])) {
                $this->saveFieldValues($document->id, (int)$validated['document_type_id'], $validated['fields']);
            }

            // Sync tags
            if (!empty($validated['tags'])) {
                $this->syncTags($document, $validated['tags']);
            }

            return $document;
        });

        $this->auditService->log('create', $document, null, $document->toArray(), "Document created: {$document->document_number}");

        return response()->json([
            'success' => true,
            'message' => "تم إنشاء الوثيقة بنجاح. رقم الوثيقة: {$document->document_number}",
            'data'    => $document->load(['documentType', 'category', 'status', 'confidentialityLevel']),
        ], 201);
    }

    // ─── Update ───────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.update');

        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'title'                    => ['sometimes', 'string', 'max:255'],
            'department_id'            => ['sometimes', 'exists:departments,id'],
            'organization_id'          => ['nullable', 'exists:organizations,id'],
            'assigned_to'              => ['nullable', 'exists:users,id'],
            'status_id'                => ['sometimes', 'exists:statuses,id'],
            'confidentiality_level_id' => ['sometimes', 'exists:confidentiality_levels,id'],
            'document_date'            => ['sometimes', 'date'],
            'received_at'              => ['nullable', 'date'],
            'original_number'          => ['nullable', 'string', 'max:100'],
            'description'              => ['nullable', 'string'],
            'notes'                    => ['nullable', 'string'],
            'physical_location'        => ['nullable', 'string', 'max:255'],
            'tags'                     => ['nullable', 'array'],
            'fields'                   => ['nullable', 'array'],
        ]);

        DB::transaction(function () use ($document, $validated) {
            [$old, $new] = $this->auditService->getDiff($document->fill($validated));
            $document->save();

            if (array_key_exists('fields', $validated) && $validated['fields']) {
                $this->saveFieldValues($document->id, $document->document_type_id, $validated['fields']);
            }

            if (array_key_exists('tags', $validated)) {
                $this->syncTags($document, $validated['tags'] ?? []);
            }

            $this->auditService->log('update', $document, $old, $new, "Document updated: {$document->document_number}");
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الوثيقة.',
            'data'    => $document->fresh(['documentType', 'category', 'status', 'confidentialityLevel']),
        ]);
    }

    // ─── Delete (Soft) ────────────────────────────────────────────

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.delete');

        $document = Document::findOrFail($id);

        $this->auditService->log('delete', $document, $document->toArray(), null, "Document soft-deleted: {$document->document_number}");
        $document->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف الوثيقة.']);
    }

    // ─── Archive ──────────────────────────────────────────────────

    public function archive(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.archive');

        $document = Document::findOrFail($id);
        $document->update([
            'is_archived' => true,
            'archived_at' => now(),
        ]);

        $archivedStatus = Status::where('name', 'archived')->first();
        if ($archivedStatus) {
            $document->update(['status_id' => $archivedStatus->id]);
        }

        $this->auditService->log('archive', $document, null, null, "Document archived: {$document->document_number}");

        return response()->json(['success' => true, 'message' => 'تم أرشفة الوثيقة.']);
    }

    // ─── Restore ──────────────────────────────────────────────────

    public function restore(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.restore');

        $document = Document::withTrashed()->findOrFail($id);

        if ($document->trashed()) {
            $document->restore();
        }

        $document->update(['is_archived' => false, 'archived_at' => null]);

        $this->auditService->log('restore', $document, null, null, "Document restored: {$document->document_number}");

        return response()->json(['success' => true, 'message' => 'تم استعادة الوثيقة.']);
    }

    // ─── Approve / Reject ─────────────────────────────────────────

    public function approve(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.approve');

        $document = Document::findOrFail($id);

        $request->validate(['comments' => ['nullable', 'string']]);

        $approval = $document->pendingApprovals()->first();

        if ($approval) {
            $approval->update([
                'status'      => 'approved',
                'comments'    => $request->input('comments'),
                'approved_at' => now(),
            ]);
        }

        $approvedStatus = Status::where('name', 'approved')->first();
        if ($approvedStatus) {
            $document->update(['status_id' => $approvedStatus->id]);
        }

        $this->auditService->log('approve', $document, null, null, "Document approved: {$document->document_number}");

        return response()->json(['success' => true, 'message' => 'تم اعتماد الوثيقة.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.reject');

        $document = Document::findOrFail($id);

        $request->validate(['comments' => ['required', 'string', 'min:5']]);

        $approval = $document->pendingApprovals()->first();

        if ($approval) {
            $approval->update([
                'status'   => 'rejected',
                'comments' => $request->input('comments'),
            ]);
        }

        $rejectedStatus = Status::where('name', 'rejected')->first();
        if ($rejectedStatus) {
            $document->update(['status_id' => $rejectedStatus->id]);
        }

        $this->auditService->log('reject', $document, null, null, "Document rejected: {$document->document_number}");

        return response()->json(['success' => true, 'message' => 'تم رفض الوثيقة.']);
    }

    // ─── Search ───────────────────────────────────────────────────

    public function search(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    private function saveFieldValues(int $documentId, int $documentTypeId, array $fields): void
    {
        foreach ($fields as $fieldId => $value) {
            // Convert arrays (multiselect) to JSON
            if (is_array($value)) {
                $value = json_encode($value);
            }

            DocumentFieldValue::updateOrCreate(
                ['document_id' => $documentId, 'document_type_field_id' => $fieldId],
                ['value' => $value]
            );
        }
    }

    private function syncTags(Document $document, array $tagNames): void
    {
        $tagIds = [];
        foreach ($tagNames as $name) {
            $slug  = \Illuminate\Support\Str::slug($name);
            $tag   = \App\Models\Tag::firstOrCreate(['slug' => $slug], ['name' => $name, 'slug' => $slug]);
            $tagIds[] = $tag->id;
        }
        $document->tags()->sync($tagIds);
    }

    private function checkPermission(string $perm): void
    {
        $user = request()->user();
        if (!$user) {
            abort(401, 'غير مصرح.');
        }
        if (!$user->hasPermission($perm) && !$user->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
