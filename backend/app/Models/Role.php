<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'display_name_ar',
        'description',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permission');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'role_user');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public function givePermissionTo(string|array $permissions): void
    {
        $ids = Permission::whereIn('name', (array) $permissions)->pluck('id');
        $this->permissions()->syncWithoutDetaching($ids);
    }

    public function revokePermissionTo(string $permission): void
    {
        $perm = Permission::where('name', $permission)->first();
        if ($perm) {
            $this->permissions()->detach($perm->id);
        }
    }

    public function hasPermission(string $permission): bool
    {
        return $this->permissions->contains('name', $permission);
    }
}
