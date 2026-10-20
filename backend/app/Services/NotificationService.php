<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Notifications\DocumentActionNotification;

class NotificationService
{
    /**
     * Send notification to a specific user.
     */
    public function sendToUser(User $user, array $data): void
    {
        $user->notify(new DocumentActionNotification($data));
    }

    /**
     * Notify about approval request.
     */
    public function notifyApprovalRequested(Document $document, User $approver, ?User $actor = null): void
    {
        $actorName = $actor ? $actor->name : 'أحد المستخدمين';
        $this->sendToUser($approver, [
            'title'       => 'طلب اعتماد وثيقة جديدة',
            'message'     => "قام {$actorName} بإحالة الوثيقة [{$document->document_number}] بعنوان \"{$document->title}\" لاعتمادك.",
            'type'        => 'approval_request',
            'document_id' => $document->id,
            'doc_number'  => $document->document_number,
            'action_url'  => "/documents/{$document->id}?tab=approvals",
            'actor_name'  => $actorName,
            'icon'        => 'FileCheck',
        ]);
    }

    /**
     * Notify creator about approval decision (approved / rejected).
     */
    public function notifyApprovalDecision(Document $document, User $creator, User $approver, string $status, ?string $comment = null): void
    {
        $isApproved = ($status === 'approved');
        $title = $isApproved ? 'تم اعتماد وثيقتك بنجاح' : 'تم رفض اعتماد الوثيقة';
        $statusText = $isApproved ? 'باعتماد' : 'برفض';
        $commentText = $comment ? " الملاحظات: \"{$comment}\"" : '';

        $this->sendToUser($creator, [
            'title'       => $title,
            'message'     => "قام {$approver->name} {$statusText} الوثيقة [{$document->document_number}].{$commentText}",
            'type'        => $isApproved ? 'approved' : 'rejected',
            'document_id' => $document->id,
            'doc_number'  => $document->document_number,
            'action_url'  => "/documents/{$document->id}",
            'actor_name'  => $approver->name,
            'icon'        => $isApproved ? 'CheckCircle' : 'XCircle',
        ]);
    }

    /**
     * Notify about new comment.
     */
    public function notifyNewComment(Document $document, User $recipient, User $commenter, string $commentSnippet): void
    {
        if ($recipient->id === $commenter->id) {
            return; // Don't notify self
        }

        $snippet = mb_substr($commentSnippet, 0, 80) . (mb_strlen($commentSnippet) > 80 ? '...' : '');

        $this->sendToUser($recipient, [
            'title'       => 'تعليق جديد على الوثيقة',
            'message'     => "أضاف {$commenter->name} تعليقاً على الوثيقة [{$document->document_number}]: \"{$snippet}\"",
            'type'        => 'comment',
            'document_id' => $document->id,
            'doc_number'  => $document->document_number,
            'action_url'  => "/documents/{$document->id}?tab=comments",
            'actor_name'  => $commenter->name,
            'icon'        => 'MessageSquare',
        ]);
    }

    /**
     * Notify about new version.
     */
    public function notifyNewVersion(Document $document, User $recipient, User $actor, string $versionNumber): void
    {
        if ($recipient->id === $actor->id) {
            return;
        }

        $this->sendToUser($recipient, [
            'title'       => "إصدار جديد للوثيقة {$versionNumber}",
            'message'     => "قام {$actor->name} برفع وتوثيق إصدار جديد ({$versionNumber}) للوثيقة [{$document->document_number}].",
            'type'        => 'version',
            'document_id' => $document->id,
            'doc_number'  => $document->document_number,
            'action_url'  => "/documents/{$document->id}?tab=versions",
            'actor_name'  => $actor->name,
            'icon'        => 'GitBranch',
        ]);
    }
}
