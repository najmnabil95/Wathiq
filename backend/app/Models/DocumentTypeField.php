<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentTypeField extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_type_id',
        'name',
        'label',
        'label_ar',
        'field_type',
        'is_required',
        'default_value',
        'options',
        'validation_rules',
        'placeholder',
        'placeholder_ar',
        'hint',
        'hint_ar',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_required'      => 'boolean',
        'is_active'        => 'boolean',
        'sort_order'       => 'integer',
        'options'          => 'array',
        'validation_rules' => 'array',
    ];

    // Supported field types
    public const FIELD_TYPES = [
        'text', 'textarea', 'number', 'date', 'datetime',
        'time', 'select', 'multiselect', 'checkbox', 'radio',
        'email', 'phone',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function fieldValues()
    {
        return $this->hasMany(DocumentFieldValue::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function isSelectType(): bool
    {
        return in_array($this->field_type, ['select', 'multiselect', 'radio', 'checkbox']);
    }

    public function isMultiValue(): bool
    {
        return in_array($this->field_type, ['multiselect', 'checkbox']);
    }
}
