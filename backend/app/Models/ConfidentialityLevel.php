<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConfidentialityLevel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'label',
        'label_ar',
        'color',
        'level_order',
        'description',
    ];

    protected $casts = [
        'level_order' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeOrdered($query)
    {
        return $query->orderBy('level_order');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    /**
     * Check if this level is accessible to user based on their max level.
     */
    public function isAccessibleByLevel(int $userMaxLevel): bool
    {
        return $this->level_order <= $userMaxLevel;
    }
}
