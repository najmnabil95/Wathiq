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
        'ocr_text',
    ];

    protected $casts = [
        'document_date' => 'date:Y-m-d',
        'received_at'   => 'datetime',
        'archived_at'   => 'datetime',
        'is_archived'   => 'boolean',
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
              ->orWhereHas('creator', fn ($uq) => $uq->where('name', 'LIKE', "%{$term}%"));
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

    // ─── Helpers ─────────────────────────────────────────────────

    public function getFieldValue(string $fieldName): mixed
    {
        return $this->fieldValues
            ->first(fn ($fv) => $fv->field->name === $fieldName)
            ?->value;
    }
}
