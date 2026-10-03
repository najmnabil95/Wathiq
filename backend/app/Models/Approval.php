<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'workflow_step_id',
        'approver_id',
        'status',
        'comments',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    // Status constants
    public const STATUS_PENDING  = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    // ─── Relationships ────────────────────────────────────────────

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function workflowStep()
    {
        return $this->belongsTo(WorkflowStep::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }
}
