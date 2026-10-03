<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workflow extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_type_id',
        'name',
        'name_ar',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function documentType()
    {
        return $this->belongsTo(DocumentType::class);
    }

    public function steps()
    {
        return $this->hasMany(WorkflowStep::class)->orderBy('step_order');
    }
}
