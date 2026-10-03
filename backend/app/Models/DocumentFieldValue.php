<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentFieldValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'document_id',
        'document_type_field_id',
        'value',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function field()
    {
        return $this->belongsTo(DocumentTypeField::class, 'document_type_field_id');
    }

    // ─── Accessors ────────────────────────────────────────────────

    /**
     * Parse JSON values for multi-select fields automatically.
     */
    public function getParsedValueAttribute(): mixed
    {
        if ($this->field && $this->field->isMultiValue()) {
            $decoded = json_decode($this->value, true);
            return $decoded !== null ? $decoded : $this->value;
        }
        return $this->value;
    }
}
