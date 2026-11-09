<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Document;
use App\Models\Status;
use App\Models\User;
use App\Services\AuditService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * List all approvals for a specific document.
     */
    public function index(Request $request, int $documentId): JsonResponse
    {
        $this->checkPermission('documents.view');

        $document = Document::findVisibleOrFail($documentId, $request->user());
        $approvals = $document->approvals()
            ->with(['approver:id,name,email,avatar,employee_number', 'workflowStep'])
            ->orderBy('id', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $approvals,
        ]);
    }

    /**
     * Resolve the default approver for a document (department manager).
     */
    public function target(Request $request, int $documentId): JsonResponse
    {
        $this->checkPermission('documents.view');

        $document = Document::findVisibleOrFail($documentId, $request->user());
        $document->loadMissing('department');

        $manager = $document->department?->resolveApprovalManager();
        $manager?->loadMissing('department:id,name,name_ar,parent_id');

        return response()->json([
            'success' => true,
            'data'    => [
                'manager' => $manager ? [
                    'id'              => $manager->id,
                    'name'            => $manager->name,
                    'email'           => $manager->email,
                    'employee_number' => $manager->employee_number,
                    'department'      => $manager->department
                        ? $manager->department->only(['id', 'name', 'name_ar'])
                        : null,
                ] : null,
                'document_department' => $document->department
                    ? $document->department->only(['id', 'name', 'name_ar'])
                    : null,
            ],
        ]);
    }

    /**
     * Request approval / add approval step for a document.
     */
    public function store(Request $request, int $documentId): JsonResponse
    {
        $this->checkPermission('workflows.submit');

        $document = Document::findVisibleOrFail($documentId, $request->user());
        $document->loadMissing('department');

        $validated = $request->validate([
            'approver_id'      => ['nullable', 'exists:users,id'],
            'workflow_step_id' => ['nullable', 'exists:workflow_steps,id'],
            'comments'         => ['nullable', 'string', 'max:500'],
        ]);

        $autoRouted = empty($validated['approver_id']);

        if ($autoRouted) {
            $approver = $document->department?->resolveApprovalManager();

            if (!$approver) {
                return response()->json([
                    'success' => false,
                    'message' => 'لا يوجد مدير قسم معيّن لهذه الوثيقة (أو لأي قسم أعلى منه) يملك صلاحية الاعتماد. عيّن مدير القسم من صفحة الأقسام أو اختر المعتمد يدوياً.',
                ], 422);
            }
        } else {
            $approver = User::findOrFail($validated['approver_id']);
        }

        // Prevent duplicate pending approval for the same user on this document
        $existingPending = Approval::where('document_id', $document->id)
            ->where('approver_id', $approver->id)
            ->where('status', 'pending')
            ->exists();

        if ($existingPending) {
            return response()->json([
                'success' => false,
                'message' => 'يوجد بالفعل طلب اعتماد معلق لهذا المستخدم على هذه الوثيقة.',
            ], 422);
        }

        $approval = Approval::create([
            'document_id'      => $document->id,
            'workflow_step_id' => $validated['workflow_step_id'] ?? null,
            'approver_id'      => $approver->id,
            'status'           => 'pending',
            'comments'         => $validated['comments'] ?? null,
        ]);

        // Update document status to pending approval if exists
        $pendingStatus = Status::where('name', 'pending_approval')->orWhere('name', 'under_review')->first();
        if ($pendingStatus && $document->status?->name !== 'approved') {
            $document->update(['status_id' => $pendingStatus->id]);
        }

        // Notify approver
        $this->notificationService->notifyApprovalRequested($document, $approver, $request->user());

        // Audit log
        $this->auditService->log(
            'approval_requested',
            $document,
            null,
            [
                'approver_id' => $approver->id,
                'approver_name' => $approver->name,
                'auto_routed' => $autoRouted,
            ],
            "Approval requested from {$approver->name} for document {$document->document_number}"
        );

        $approval->load(['approver:id,name,email,avatar', 'workflowStep']);

        return response()->json([
            'success'     => true,
            'message'     => $autoRouted
                ? "تمت الإحالة تلقائياً إلى مدير القسم: {$approver->name} وإشعاره فورياً."
                : "تم إرسال طلب الاعتماد إلى {$approver->name} بنجاح وإشعاره فورياً.",
            'auto_routed' => $autoRouted,
            'data'        => $approval,
        ], 201);
    }

    /**
     * Decide (Approve or Reject) an approval request.
     */
    public function decide(Request $request, int $documentId, int $approvalId): JsonResponse
    {
        $document = Document::findVisibleOrFail($documentId, $request->user());
        $approval = Approval::where('document_id', $documentId)->findOrFail($approvalId);

        $currentUser = $request->user();

        // Only the designated approver may decide a step; super admin retains override
        $isDesignated = ($currentUser->id === $approval->approver_id);
        $isSuperAdmin = $currentUser->isSuperAdmin();

        if (!$isDesignated && !$isSuperAdmin) {
            return response()->json([
                'success' => false,
                'message' => 'غير مصرح لك باتخاذ قرار بشأن هذا الاعتماد؛ فهو موجه لمعتمد آخر.',
            ], 403);
        }

        if ($approval->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'تم اتخاذ قرار مسبقاً بشأن هذا الطلب.',
            ], 422);
        }

        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:approved,rejected'],
            'comments' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->checkPermission(
            $validated['decision'] === 'approved' ? 'workflows.approve' : 'workflows.reject'
        );

        $decision = $validated['decision'];
        $comments = $validated['comments'] ?? ($decision === 'approved' ? 'تم الاعتماد' : 'تم الرفض');

        $approval->update([
            'status'      => $decision,
            'comments'    => $comments,
            'approved_at' => now(),
        ]);

        if ($decision === 'approved') {
            // Check if any other pending approvals remain on this document
            $remainingPending = Approval::where('document_id', $document->id)
                ->where('status', 'pending')
                ->count();

            if ($remainingPending === 0) {
                $approvedStatus = Status::where('name', 'approved')->first();
                if ($approvedStatus) {
                    $document->update(['status_id' => $approvedStatus->id]);
                }
            }
        } else {
            // Rejected
            $rejectedStatus = Status::where('name', 'rejected')->first();
            if ($rejectedStatus) {
                $document->update(['status_id' => $rejectedStatus->id]);
            }
        }

        // Notify document creator
        if ($document->creator) {
            $this->notificationService->notifyApprovalDecision(
                $document,
                $document->creator,
                $currentUser,
                $decision,
                $comments
            );
        }

        $this->auditService->log(
            $decision === 'approved' ? 'approve' : 'reject',
            $document,
            null,
            ['approval_id' => $approval->id, 'decision' => $decision],
            "Document {$document->document_number} {$decision} by {$currentUser->name}"
        );

        $approval->load(['approver:id,name,email,avatar', 'workflowStep']);

        return response()->json([
            'success' => true,
            'message' => $decision === 'approved' ? 'تم اعتماد الوثيقة بنجاح.' : 'تم تسجيل رفض الوثيقة.',
            'data'    => $approval,
        ]);
    }

    /**
     * Get pending approvals for current user.
     */
    public function pending(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Approval::with([
            'document.documentType',
            'document.category',
            'document.status',
            'document.creator',
            'workflowStep',
        ])->where('status', 'pending');

        if (!$user->isSuperAdmin()) {
            $query->where('approver_id', $user->id);
        }

        $approvals = $query->latest()->limit(20)->get();

        return response()->json([
            'success' => true,
            'count'   => $approvals->count(),
            'data'    => $approvals,
        ]);
    }

    private function checkPermission(string $perm): void
    {
        $user = auth()->user() ?? request()->user();
        if (!$user) {
            abort(401, 'غير مصرح.');
        }
        if (!$user->hasPermission($perm) && !$user->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
