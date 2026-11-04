<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_number',
        'original_number',
        'title',
        'document_type_id',
        'category_id',
        'department_id',
        'organization_id',
        'created_by',
        'assigned_to',
        'status_id',
        'confidentiality_level_id',
        'document_date',
        'received_at',
        'description',
        'notes',
        'physical_location',
        'is_archived',
        'archived_at',
        'legal_hold',
        'legal_hold_reason',
        'legal_hold_at',
        'legal_hold_by',
        'legal_hold_released_at',
        'retention_years',
        'retention_until',
        'disposition_status',
        'disposed_at',
        'disposed_by',
        'ocr_text',
    ];

    protected $casts = [
        'document_date'          => 'date:Y-m-d',
        'received_at'            => 'datetime',
        'archived_at'            => 'datetime',
        'is_archived'            => 'boolean',
        'legal_hold'             => 'boolean',
        'legal_hold_at'          => 'datetime',
        'legal_hold_released_at' => 'datetime',
        'retention_years'        => 'integer',
        'retention_until'        => 'date:Y-m-d',
        'disposed_at'            => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }

    public function confidentialityLevel()
    {
        return $this->belongsTo(ConfidentialityLevel::class);
    }

    public function legalHoldBy()
    {
        return $this->belongsTo(User::class, 'legal_hold_by');
    }

    public function fieldValues()
    {
        return $this->hasMany(DocumentFieldValue::class);
    }

    public function attachments()
    {
        return $this->hasMany(DocumentAttachment::class)->whereNull('deleted_at');
    }

    public function versions()
    {
        return $this->hasMany(DocumentVersion::class)->orderByDesc('id');
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class)->orderBy('created_at');
    }

    public function pendingApprovals()
    {
        return $this->hasMany(Approval::class)->where('status', 'pending');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class)->whereNull('parent_id')->orderBy('created_at');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'document_tag');
    }

    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable')->orderByDesc('created_at');
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeSearch($query, ?string $term)
    {
        if (empty($term)) {
            return $query;
        }

        return $query->where(function ($q) use ($term) {
            $q->where('document_number', 'LIKE', "%{$term}%")
              ->orWhere('original_number', 'LIKE', "%{$term}%")
              ->orWhere('title', 'LIKE', "%{$term}%")
              ->orWhere('description', 'LIKE', "%{$term}%")
              ->orWhereHas('tags', fn ($tq) => $tq->where('name', 'LIKE', "%{$term}%"))
              ->orWhereHas('creator', fn ($uq) => $uq->where('name', 'LIKE', "%{$term}%"))
              ->orWhereHas('attachments', fn ($aq) => $aq->where('ocr_text', 'LIKE', "%{$term}%")
                                                        ->orWhere('original_name', 'LIKE', "%{$term}%"));
        });
    }

    public function scopeByCategory($query, ?int $categoryId)
    {
        return $categoryId ? $query->where('category_id', $categoryId) : $query;
    }

    public function scopeByDocumentType($query, ?int $typeId)
    {
        return $typeId ? $query->where('document_type_id', $typeId) : $query;
    }

    public function scopeByDepartment($query, ?int $deptId)
    {
        return $deptId ? $query->where('department_id', $deptId) : $query;
    }

    public function scopeByStatus($query, ?int $statusId)
    {
        return $statusId ? $query->where('status_id', $statusId) : $query;
    }

    public function scopeByConfidentialityLevel($query, ?int $levelId)
    {
        return $levelId ? $query->where('confidentiality_level_id', $levelId) : $query;
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeNotArchived($query)
    {
        return $query->where('is_archived', false);
    }

    public function scopeDateRange($query, ?string $from, ?string $to)
    {
        if ($from) {
            $query->whereDate('document_date', '>=', $from);
        }
        if ($to) {
            $query->whereDate('document_date', '<=', $to);
        }
        return $query;
    }

    /**
     * Restrict the query to documents the given user is allowed to see:
     * department scope (documents.view_all_departments) and confidentiality
     * clearance (documents.view_confidential). Creators, assignees and
     * designated approvers always retain access to their own documents.
     */
    public function scopeVisibleTo($query, User $user)
    {
        if (!$user->isSuperAdmin() && !$user->hasPermission('documents.view_all_departments')) {
            $query->where(function ($q) use ($user) {
                $q->where('department_id', $user->department_id)
                  ->orWhere('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id)
                  ->orWhereHas('approvals', fn ($aq) => $aq->where('approver_id', $user->id));
            });
        }

        if (!$user->isSuperAdmin() && !$user->hasPermission('documents.view_confidential')) {
            $query->where(function ($q) use ($user) {
                $q->whereDoesntHave('confidentialityLevel', fn ($lq) => $lq->where('level_order', '>=', self::CONFIDENTIAL_LEVEL_ORDER))
                  ->orWhere('created_by', $user->id)
                  ->orWhere('assigned_to', $user->id)
                  ->orWhereHas('approvals', fn ($aq) => $aq->where('approver_id', $user->id));
            });
        }

        return $query;
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public const CONFIDENTIAL_LEVEL_ORDER = 2;

    public function isParticipant(User $user): bool
    {
        return $this->created_by === $user->id
            || $this->assigned_to === $user->id
            || $this->approvals()->where('approver_id', $user->id)->exists();
    }

    public function hasActiveLegalHold(): bool
    {
        return (bool) $this->legal_hold;
    }

    public function isConfidential(): bool
    {
        return $this->confidentialityLevel !== null
            && $this->confidentialityLevel->level_order >= self::CONFIDENTIAL_LEVEL_ORDER;
    }

    public function isVisibleTo(User $user): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        $participant = $this->isParticipant($user);

        if (!$user->hasPermission('documents.view_all_departments') && !$participant
            && $this->department_id !== $user->department_id) {
            return false;
        }

        if (!$user->hasPermission('documents.view_confidential') && !$participant
            && $this->isConfidential()) {
            return false;
        }

        return true;
    }

    public function ensureVisibleTo(User $user): void
    {
        abort_unless($this->isVisibleTo($user), 403, 'ليس لديك صلاحية للوصول إلى هذه الوثيقة.');
    }

    public static function findVisibleOrFail(int $id, User $user, bool $withTrashed = false): self
    {
        $query = static::visibleTo($user);

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->findOrFail($id);
    }

    public static function requiresConfidentialityClearanceFor(?int $levelId): bool
    {
        if (!$levelId) {
            return false;
        }

        $level = ConfidentialityLevel::find($levelId);

        return $level !== null && $level->level_order >= self::CONFIDENTIAL_LEVEL_ORDER;
    }

    public function getFieldValue(string $fieldName): mixed
    {
        return $this->fieldValues
            ->first(fn ($fv) => $fv->field->name === $fieldName)
            ?->value;
    }
}
