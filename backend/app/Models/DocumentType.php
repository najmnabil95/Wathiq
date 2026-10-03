<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'name_ar',
        'code',
        'prefix',
        'description',
        'requires_approval',
        'is_active',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'is_active'         => 'boolean',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function fields()
    {
        return $this->hasMany(DocumentTypeField::class)->orderBy('sort_order');
    }

    public function activeFields()
    {
        return $this->hasMany(DocumentTypeField::class)
            ->where('is_active', true)
            ->orderBy('sort_order');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function workflows()
    {
        return $this->hasMany(Workflow::class);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }
}
