<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    // Audit logs are immutable — no updated_at
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    // Action constants
    public const ACTION_CREATE   = 'create';
    public const ACTION_VIEW     = 'view';
    public const ACTION_UPDATE   = 'update';
    public const ACTION_DELETE   = 'delete';
    public const ACTION_RESTORE  = 'restore';
    public const ACTION_ARCHIVE  = 'archive';
    public const ACTION_DOWNLOAD = 'download';
    public const ACTION_UPLOAD   = 'upload';
    public const ACTION_APPROVE  = 'approve';
    public const ACTION_REJECT   = 'reject';
    public const ACTION_LOGIN    = 'login';
    public const ACTION_LOGOUT   = 'logout';

    // ─── Relationships ────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function auditable()
    {
        return $this->morphTo();
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    public function scopeForDocument($query, int $documentId)
    {
        return $query->where('auditable_type', Document::class)
                     ->where('auditable_id', $documentId);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to) {
            $query->whereDate('created_at', '<=', $to);
        }
        return $query;
    }
}
