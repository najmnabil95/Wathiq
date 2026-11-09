<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'name_ar',
        'description',
        'organization_id',
        'parent_id',
        'manager_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeRoots($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * The approver for documents filed under this department: its active
     * manager, otherwise the nearest ancestor department that has one.
     */
    public function resolveApprovalManager(): ?User
    {
        $department = $this;
        $visited = [];

        while ($department && !isset($visited[$department->id])) {
            $visited[$department->id] = true;

            $manager = $department->manager()
                ->where('status', 'active')
                ->first();

            if ($manager && $manager->hasPermission('workflows.approve')) {
                return $manager;
            }

            $department = $department->parent()->first();
        }

        return null;
    }
}
