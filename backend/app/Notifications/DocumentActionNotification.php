<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DocumentActionNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected array $payload
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title'       => $this->payload['title'] ?? 'إشعار جديد',
            'message'     => $this->payload['message'] ?? '',
            'type'        => $this->payload['type'] ?? 'info', // approval_request, approved, rejected, comment, version, system
            'document_id' => $this->payload['document_id'] ?? null,
            'doc_number'  => $this->payload['doc_number'] ?? null,
            'action_url'  => $this->payload['action_url'] ?? null,
            'actor_name'  => $this->payload['actor_name'] ?? null,
            'icon'        => $this->payload['icon'] ?? 'Bell',
            'created_at'  => now()->toISOString(),
        ];
    }
}
