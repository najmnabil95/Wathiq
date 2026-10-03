<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkflowStep extends Model
{
    use HasFactory;

    protected $fillable = [
        'workflow_id',
        'name',
        'name_ar',
        'role_id',
        'step_order',
        'is_required',
        'action_type',
        'instructions',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'step_order'  => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function workflow()
    {
        return $this->belongsTo(Workflow::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class);
    }
}
