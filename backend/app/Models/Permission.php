<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'display_name_ar',
        'group',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permission');
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeOfGroup($query, string $group)
    {
        return $query->where('group', $group);
    }
}
