<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'color'];

    // ─── Relationships ────────────────────────────────────────────

    public function documents()
    {
        return $this->belongsToMany(Document::class, 'document_tag');
    }

    // ─── Boot ─────────────────────────────────────────────────────

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($tag) {
            if (empty($tag->slug)) {
                $tag->slug = \Illuminate\Support\Str::slug($tag->name);
            }
        });
    }
}
