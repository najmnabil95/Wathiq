<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'username',
        'email',
        'employee_number',
        'department_id',
        'password',
        'avatar',
        'phone',
        'status',
        'last_login_at',
        'last_login_ip',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at'     => 'datetime',
    ];

    /**
     * Automatically hash plain text passwords while preserving already-hashed strings.
     */
    public function setPasswordAttribute($value): void
    {
        $this->attributes['password'] = !empty($value) && password_get_info($value)['algo'] !== null
            ? $value
            : Hash::make($value);
    }

    // ─── Relationships ────────────────────────────────────────────

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_user');
    }

    public function permissionOverrides()
    {
        return $this->belongsToMany(Permission::class, 'permission_user')
            ->withPivot('effect')
            ->withTimestamps();
    }

    public function createdDocuments()
    {
        return $this->hasMany(Document::class, 'created_by');
    }

    public function assignedDocuments()
    {
        return $this->hasMany(Document::class, 'assigned_to');
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class, 'approver_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }

    // ─── RBAC Helpers ─────────────────────────────────────────────

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains('name', $role);
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return $this->roles->whereIn('name', $roles)->isNotEmpty();
    }

    /**
     * Check if user is super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    /**
     * Check if user has a specific permission (directly or via role).
     * Explicit per-user overrides win over role bundles; deny always wins.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $override = $this->permissionOverrides->firstWhere('name', $permission);
        if ($override) {
            return $override->pivot->effect === 'grant';
        }

        foreach ($this->roles as $role) {
            if ($role->permissions->contains('name', $permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Effective per-user exception for a permission: 'grant', 'deny', or null.
     */
    public function permissionOverrideEffect(string $permission): ?string
    {
        $override = $this->permissionOverrides->firstWhere('name', $permission);

        return $override?->pivot->effect;
    }

    /**
     * Whether the permission is granted by one of the user's roles (ignoring overrides).
     */
    public function hasRolePermission(string $permission): bool
    {
        foreach ($this->roles as $role) {
            if ($role->permissions->contains('name', $permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has at least one of the specified permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the specified permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // ─── Accessors ────────────────────────────────────────────────

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }
}
