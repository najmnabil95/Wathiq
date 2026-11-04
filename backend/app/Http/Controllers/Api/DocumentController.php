<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Document;
use App\Models\DocumentFieldValue;
use App\Models\DocumentType;
use App\Models\Setting;
use App\Models\Status;
use App\Services\AuditService;
use App\Services\DocumentNumberService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function __construct(
        private readonly DocumentNumberService $numberService,
        private readonly AuditService          $auditService,
        private readonly NotificationService   $notificationService,
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

        // Department scope + confidentiality clearance are enforced centrally
        $query->visibleTo($user);

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

        $perPage   = min((int)$request->input('per_page', 15), 500);
        $documents = $query->paginate($perPage);

        // When searching, append OCR full-text match snippets
        if ($request->filled('q')) {
            $term = trim($request->input('q'));
            $extractor = new \App\Services\TextExtractionService();

            $documents->getCollection()->transform(function ($doc) use ($term, $extractor) {
                $matchingAttachments = $doc->attachments()
                    ->where(function ($aq) use ($term) {
                        $aq->where('ocr_text', 'LIKE', "%{$term}%")
                           ->orWhere('original_name', 'LIKE', "%{$term}%");
                    })
                    ->get(['id', 'original_name', 'file_name', 'ocr_status', 'ocr_text']);

                $matches = [];
                foreach ($matchingAttachments as $att) {
                    $snippet = $extractor->generateSnippet($att->ocr_text, $term, 65);
                    $matches[] = [
                        'attachment_id' => $att->id,
                        'file_name'     => $att->original_name,
                        'snippet'       => $snippet,
                        'matched_in'    => !empty($snippet) ? 'ocr_content' : 'filename',
                    ];
                }

                $doc->setAttribute('search_matches', $matches);
                return $doc;
            });
        }

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
            'legalHoldBy:id,name',
            'fieldValues.field',
            'attachments.uploader',
            'versions.uploader',
            'approvals.approver',
            'approvals.workflowStep',
            'comments.user',
            'comments.replies.user',
            'tags',
        ])->visibleTo($request->user())->findOrFail($id);

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

        $this->ensureCanAssignConfidentiality($request, (int) $validated['confidentiality_level_id']);

        $document = DB::transaction(function () use ($validated, $request) {
            $documentType = DocumentType::findOrFail($validated['document_type_id']);

            // Auto-generate document number
            $documentNumber = $this->numberService->generate($documentType);

            // Default status if not provided
            if (empty($validated['status_id'])) {
                $validated['status_id'] = Status::getDefault()?->id;
            }

            $retentionYears = (int) Setting::get('retention_years', 7);

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
                'retention_years'          => $retentionYears,
                'retention_until'          => $retentionYears >= 99
                    ? null
                    : Carbon::parse($validated['document_date'])->addYears($retentionYears)->toDateString(),
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

        $document = Document::findVisibleOrFail($id, $request->user());

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

        if (array_key_exists('document_date', $validated)) {
            $years = $document->retention_years ?? (int) Setting::get('retention_years', 7);
            $validated['retention_years'] = $years;
            $validated['retention_until'] = $years >= 99
                ? null
                : Carbon::parse($validated['document_date'])->addYears($years)->toDateString();
        }

        $newLevelId = array_key_exists('confidentiality_level_id', $validated)
            ? (int) $validated['confidentiality_level_id']
            : null;

        if ($newLevelId !== null && $newLevelId !== (int) $document->confidentiality_level_id
            && ($document->isConfidential() || Document::requiresConfidentialityClearanceFor($newLevelId))) {
            $this->ensureCanAssignConfidentiality($request, $newLevelId);
        }

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

        $document = Document::findVisibleOrFail($id, $request->user());

        if ($document->hasActiveLegalHold()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف وثيقة خاضعة للحجز القانوني (Legal Hold). يجب رفع الحجز أولاً.',
            ], 422);
        }

        $this->auditService->log('delete', $document, $document->toArray(), null, "Document soft-deleted: {$document->document_number}");
        $document->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف الوثيقة.']);
    }

    // ─── Legal Hold (Records Retention) ───────────────────────────

    public function legalHold(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('records.legal_hold');

        $document = Document::findVisibleOrFail($id, $request->user(), withTrashed: true);

        $validated = $request->validate([
            'legal_hold' => ['required', 'boolean'],
            'reason'     => ['nullable', 'string', 'max:1000'],
        ]);

        $holding = (bool) $validated['legal_hold'];
        $reason  = trim((string) ($validated['reason'] ?? ''));

        if ($holding && $reason === '') {
            return response()->json([
                'success' => false,
                'message' => 'يرجى إدخال سبب فرض الحجز القانوني.',
            ], 422);
        }

        if (!$holding && !$document->hasActiveLegalHold()) {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة غير خاضعة لحجز قانوني حالياً.',
            ], 422);
        }

        $old = [
            'legal_hold'        => $document->legal_hold,
            'legal_hold_reason' => $document->legal_hold_reason,
        ];

        if ($holding) {
            $document->update([
                'legal_hold'             => true,
                'legal_hold_reason'      => $reason,
                'legal_hold_at'          => now(),
                'legal_hold_by'          => $request->user()->id,
                'legal_hold_released_at' => null,
            ]);
            $action  = 'legal_hold.place';
            $message = 'تم فرض الحجز القانوني على الوثيقة ومنع حذفها.';
        } else {
            $document->update([
                'legal_hold'             => false,
                'legal_hold_released_at' => now(),
            ]);
            $action  = 'legal_hold.release';
            $message = 'تم رفع الحجز القانوني عن الوثيقة.';
        }

        $this->auditService->log(
            $action,
            $document,
            $old,
            [
                'legal_hold'        => $document->legal_hold,
                'legal_hold_reason' => $document->legal_hold_reason,
                'legal_hold_by'     => $document->legal_hold_by,
            ],
            $holding
                ? "Legal hold placed on document {$document->document_number}: {$reason}"
                : "Legal hold released for document {$document->document_number}"
        );

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $document->fresh(['legalHoldBy:id,name']),
        ]);
    }

    // ─── Force Delete (Purge) ─────────────────────────────────────

    public function forceDelete(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.force_delete');

        $document = Document::withTrashed()
            ->visibleTo($request->user())
            ->findOrFail($id);

        if (!$document->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'يجب حذف الوثيقة (نقلها لسلة المحذوفات) قبل الحذف النهائي.',
            ], 422);
        }

        if ($document->hasActiveLegalHold()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن الحذف النهائي لوثيقة خاضعة للحجز القانوني (Legal Hold).',
            ], 422);
        }

        $this->auditService->log(
            'force_delete',
            null,
            ['id' => $document->id, 'document_number' => $document->document_number, 'title' => $document->title],
            null,
            "Document permanently deleted: {$document->document_number}"
        );

        $document->forceDelete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الوثيقة نهائياً من النظام.',
        ]);
    }

    // ─── Archive ──────────────────────────────────────────────────

    public function archive(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.archive');

        $document = Document::findVisibleOrFail($id, $request->user());
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

        $document = Document::findVisibleOrFail($id, $request->user(), withTrashed: true);

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

        $document = Document::findVisibleOrFail($id, $request->user());
        $user     = $request->user();

        $validated = $request->validate([
            'comment'  => ['nullable', 'string'],
            'comments' => ['nullable', 'string'],
        ]);
        $comment = $validated['comment'] ?? $validated['comments'] ?? null;

        $pendingApprovals = $document->pendingApprovals()->get();

        if ($pendingApprovals->isNotEmpty()) {
            $myApproval = $pendingApprovals->firstWhere('approver_id', $user->id);

            if (!$myApproval) {
                if (!$user->isSuperAdmin()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لا يوجد طلب اعتماد معلق موجه إليك على هذه الوثيقة.',
                    ], 403);
                }
                $myApproval = $pendingApprovals->first();
            }

            $myApproval->update([
                'status'      => 'approved',
                'comments'    => $comment,
                'approved_at' => now(),
            ]);

            if ($user->isSuperAdmin()) {
                // Final sign-off: resolve any remaining pending steps as well
                $document->pendingApprovals()->update([
                    'status'      => 'approved',
                    'comments'    => $comment,
                    'approved_at' => now(),
                ]);
            }

            // Final approval only when no other approval step is still pending
            if ($document->pendingApprovals()->count() === 0) {
                $approvedStatus = Status::where('name', 'approved')->first();
                if ($approvedStatus) {
                    $document->update(['status_id' => $approvedStatus->id]);
                }
            }

            if ($document->creator && $document->creator->id !== $user->id) {
                $this->notificationService->notifyApprovalDecision(
                    $document,
                    $document->creator,
                    $user,
                    'approved',
                    $comment
                );
            }
        } else {
            $approvedStatus = Status::where('name', 'approved')->first();
            if ($approvedStatus) {
                $document->update(['status_id' => $approvedStatus->id]);
            }
        }

        $this->auditService->log('approve', $document, null, null, "Document approved: {$document->document_number}");

        return response()->json(['success' => true, 'message' => 'تم اعتماد الوثيقة.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('documents.reject');

        $document = Document::findVisibleOrFail($id, $request->user());
        $user     = $request->user();

        $validated = $request->validate([
            'comment'  => ['required_without:comments', 'nullable', 'string', 'min:5'],
            'comments' => ['required_without:comment', 'nullable', 'string', 'min:5'],
        ]);
        $comment = $validated['comment'] ?? $validated['comments'] ?? null;

        $pendingApprovals = $document->pendingApprovals()->get();

        if ($pendingApprovals->isNotEmpty()) {
            $myApproval = $pendingApprovals->firstWhere('approver_id', $user->id);

            if (!$myApproval) {
                if (!$user->isSuperAdmin()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'لا يوجد طلب اعتماد معلق موجه إليك على هذه الوثيقة.',
                    ], 403);
                }
                $myApproval = $pendingApprovals->first();
            }

            $myApproval->update([
                'status'   => 'rejected',
                'comments' => $comment,
            ]);

            // A rejection ends the whole chain — cancel remaining pending steps
            $document->pendingApprovals()
                ->where('id', '!=', $myApproval->id)
                ->update([
                    'status'   => 'rejected',
                    'comments' => 'أُلغي هذا الطلب تلقائياً بعد رفض الوثيقة من مرحلة أخرى.',
                ]);

            if ($document->creator && $document->creator->id !== $user->id) {
                $this->notificationService->notifyApprovalDecision(
                    $document,
                    $document->creator,
                    $user,
                    'rejected',
                    $comment
                );
            }
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

    // ─── Comments ─────────────────────────────────────────────────

    public function addComment(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('comments.create');

        $validated = $request->validate([
            'comment'   => ['required', 'string', 'max:2000'],
            'parent_id' => ['nullable', 'integer', 'exists:comments,id'],
        ]);

        $document = Document::findVisibleOrFail($id, $request->user());
        $comment = $document->comments()->create([
            'user_id'     => $request->user()->id,
            'parent_id'   => $validated['parent_id'] ?? null,
            'comment'     => $validated['comment'],
            'is_internal' => true,
        ]);

        $this->auditService->log('comment', $document, null, ['comment_id' => $comment->id], "Added comment to document {$document->document_number}");

        if ($document->creator && $document->creator_id !== $request->user()->id) {
            $this->notificationService->notifyNewComment(
                $document,
                $document->creator,
                $request->user(),
                $validated['comment']
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة التعليق بنجاح.',
            'data'    => $comment->load('user'),
        ]);
    }

    public function deleteComment(Request $request, int $id, int $commentId): JsonResponse
    {
        $this->checkPermission('comments.delete');

        $document = Document::findVisibleOrFail($id, $request->user());
        $comment  = Comment::where('document_id', $document->id)->findOrFail($commentId);

        $comment->delete();

        if ($comment->parent_id === null) {
            Comment::where('document_id', $document->id)->where('parent_id', $comment->id)->delete();
        }

        $this->auditService->log(
            'comment.delete',
            $document,
            ['comment_id' => $comment->id, 'comment' => $comment->comment],
            null,
            "Deleted comment #{$comment->id} from document {$document->document_number}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التعليق بنجاح.',
        ]);
    }

    // ─── Batch Operations ─────────────────────────────────────────

    public function batch(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids'       => ['required', 'array', 'min:1'],
            'ids.*'     => ['integer'],
            'action'    => ['required', 'string', 'in:approve,reject,archive,restore,delete,change_status'],
            'status_id' => ['nullable', 'exists:statuses,id'],
            'comment'   => ['nullable', 'string', 'max:500'],
        ]);

        $action = $validated['action'];
        $ids    = $validated['ids'];
        $count  = 0;
        $user   = $request->user();

        switch ($action) {
            case 'approve':
                $this->checkPermission('documents.approve');
                $approvedStatus = Status::where('name', 'approved')->first();
                $docs = Document::whereIn('id', $ids)->visibleTo($user)->get();
                foreach ($docs as $doc) {
                    $pendingApprovals = $doc->pendingApprovals()->get();

                    if ($pendingApprovals->isNotEmpty()) {
                        if ($user->isSuperAdmin()) {
                            // Bulk override: resolve every pending step at once
                            foreach ($pendingApprovals as $step) {
                                $step->update([
                                    'status'      => 'approved',
                                    'comments'    => $request->input('comment', 'اعتماد جماعي آلي'),
                                    'approved_at' => now(),
                                ]);
                            }
                        } else {
                            $myApproval = $pendingApprovals->firstWhere('approver_id', $user->id);
                            if (!$myApproval) {
                                continue; // Not this user's approval step
                            }
                            $myApproval->update([
                                'status'      => 'approved',
                                'comments'    => $request->input('comment', 'اعتماد جماعي آلي'),
                                'approved_at' => now(),
                            ]);
                        }
                    }

                    // Keep the document pending until every approval step is resolved
                    if ($doc->pendingApprovals()->count() === 0 && $approvedStatus) {
                        $doc->update(['status_id' => $approvedStatus->id]);
                    }

                    if ($doc->creator && $doc->creator->id !== $user->id) {
                        $this->notificationService->notifyApprovalDecision(
                            $doc,
                            $doc->creator,
                            $user,
                            'approved',
                            $request->input('comment')
                        );
                    }

                    $this->auditService->log('approve', $doc, null, null, "Batch approved: {$doc->document_number}");
                    $count++;
                }
                break;

            case 'reject':
                $this->checkPermission('documents.reject');
                $rejectedStatus = Status::where('name', 'rejected')->first();
                $docs = Document::whereIn('id', $ids)->visibleTo($user)->get();
                foreach ($docs as $doc) {
                    $pendingApprovals = $doc->pendingApprovals()->get();
                    $myApproval = $pendingApprovals->firstWhere('approver_id', $user->id);

                    if ($pendingApprovals->isNotEmpty() && !$myApproval && !$user->isSuperAdmin()) {
                        continue;
                    }

                    if (!$myApproval && $user->isSuperAdmin() && $pendingApprovals->isNotEmpty()) {
                        $myApproval = $pendingApprovals->first();
                    }

                    if ($myApproval) {
                        $myApproval->update([
                            'status'   => 'rejected',
                            'comments' => $request->input('comment', 'رفض جماعي'),
                        ]);

                        $doc->pendingApprovals()
                            ->where('id', '!=', $myApproval->id)
                            ->update([
                                'status'   => 'rejected',
                                'comments' => 'أُلغي هذا الطلب تلقائياً بعد رفض الوثيقة من مرحلة أخرى.',
                            ]);
                    }

                    if ($rejectedStatus) {
                        $doc->update(['status_id' => $rejectedStatus->id]);
                    }

                    if ($doc->creator && $doc->creator->id !== $user->id) {
                        $this->notificationService->notifyApprovalDecision(
                            $doc,
                            $doc->creator,
                            $user,
                            'rejected',
                            $request->input('comment')
                        );
                    }

                    $this->auditService->log('reject', $doc, null, null, "Batch rejected: {$doc->document_number}");
                    $count++;
                }
                break;

            case 'archive':
                $this->checkPermission('documents.archive');
                $archivedStatus = Status::where('name', 'archived')->first();
                $docs = Document::whereIn('id', $ids)->visibleTo($user)->where('is_archived', false)->get();
                foreach ($docs as $doc) {
                    $doc->update([
                        'is_archived' => true,
                        'archived_at' => now(),
                        'status_id'   => $archivedStatus ? $archivedStatus->id : $doc->status_id,
                    ]);
                    $this->auditService->log('archive', $doc, null, null, "Batch archived: {$doc->document_number}");
                    $count++;
                }
                break;

            case 'restore':
                $this->checkPermission('documents.restore');
                $docs = Document::withTrashed()->whereIn('id', $ids)->visibleTo($user)->get();
                foreach ($docs as $doc) {
                    if ($doc->trashed()) {
                        $doc->restore();
                    }
                    $doc->update(['is_archived' => false, 'archived_at' => null]);
                    $this->auditService->log('restore', $doc, null, null, "Batch restored: {$doc->document_number}");
                    $count++;
                }
                break;

            case 'delete':
                $this->checkPermission('documents.delete');
                $docs = Document::whereIn('id', $ids)->visibleTo($user)->where('legal_hold', false)->get();
                foreach ($docs as $doc) {
                    $this->auditService->log('delete', $doc, ['title' => $doc->title], null, "Batch deleted: {$doc->document_number}");
                    $doc->delete();
                    $count++;
                }
                break;

            case 'change_status':
                $this->checkPermission('documents.change_status');
                if (!$request->filled('status_id')) {
                    return response()->json(['success' => false, 'message' => 'الحالة الجديدة مطلوبة.'], 422);
                }
                $docs = Document::whereIn('id', $ids)->visibleTo($user)->get();
                foreach ($docs as $doc) {
                    $oldStatus = $doc->status_id;
                    $doc->update(['status_id' => $validated['status_id']]);
                    $this->auditService->log('update_status', $doc, ['old_status_id' => $oldStatus], ['new_status_id' => $validated['status_id']], "Batch status changed: {$doc->document_number}");
                    $count++;
                }
                break;
        }

        $actionArabic = [
            'approve'       => 'اعتماد',
            'reject'        => 'رفض',
            'archive'       => 'أرشفة',
            'restore'       => 'استعادة',
            'delete'        => 'حذف',
            'change_status' => 'تحديث حالة',
        ][$action] ?? 'معالجة';

        return response()->json([
            'success'         => true,
            'message'         => "تم بنجاح {$actionArabic} {$count} وثيقة.",
            'processed_count' => $count,
        ]);
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

    private function ensureCanAssignConfidentiality(Request $request, int $levelId): void
    {
        $user = $request->user();

        if (Document::requiresConfidentialityClearanceFor($levelId)
            && !$user->isSuperAdmin()
            && !$user->hasPermission('confidentiality.assign')) {
            abort(403, 'ليس لديك صلاحية لتصنيف الوثائق بدرجة "سري" أو أعلى.');
        }
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
