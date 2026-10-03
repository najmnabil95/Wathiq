<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'name_ar',
        'label',
        'label_ar',
        'color',
        'icon',
        'is_default',
        'is_final',
        'sort_order',
    ];

    protected $casts = [
        'is_default'  => 'boolean',
        'is_final'    => 'boolean',
        'sort_order'  => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order');
    }

    // ─── Helpers ─────────────────────────────────────────────────

    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->first();
    }
}
