<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\Document;
use App\Models\Status;
use App\Models\User;

class ApprovalRoutingService
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * The department manager that owns approvals for this document,
     * falling back to the nearest ancestor department with one.
     */
    public function resolveApprover(Document $document): ?User
    {
        $document->loadMissing('department');

        return $document->department?->resolveApprovalManager();
    }

    public function hasPendingApprovalFor(Document $document, User $approver): bool
    {
        return Approval::where('document_id', $document->id)
            ->where('approver_id', $approver->id)
            ->where('status', 'pending')
            ->exists();
    }

    public function request(
        Document $document,
        User $approver,
        ?User $initiator,
        bool $autoRouted,
        ?int $workflowStepId = null,
        ?string $comments = null,
    ): Approval {
        $approval = Approval::create([
            'document_id'      => $document->id,
            'workflow_step_id' => $workflowStepId,
            'approver_id'      => $approver->id,
            'status'           => 'pending',
            'comments'         => $comments,
        ]);

        $pendingStatus = Status::where('name', 'pending_approval')->orWhere('name', 'under_review')->first();
        if ($pendingStatus && $document->status?->name !== 'approved') {
            $document->update(['status_id' => $pendingStatus->id]);
        }

        $this->notificationService->notifyApprovalRequested($document, $approver, $initiator);

        $this->auditService->log(
            'approval_requested',
            $document,
            null,
            [
                'approver_id'   => $approver->id,
                'approver_name' => $approver->name,
                'auto_routed'   => $autoRouted,
            ],
            "Approval requested from {$approver->name} for document {$document->document_number}"
        );

        return $approval;
    }

    /**
     * Route a freshly created document to its department manager.
     * Returns null when the creator cannot submit approvals, no manager
     * resolves, or a pending request already exists.
     */
    public function autoSubmit(Document $document, User $initiator): ?Approval
    {
        if (!$initiator->hasPermission('workflows.submit')) {
            return null;
        }

        $approver = $this->resolveApprover($document);

        if (!$approver || $this->hasPendingApprovalFor($document, $approver)) {
            return null;
        }

        return $this->request($document, $approver, $initiator, true);
    }
}
