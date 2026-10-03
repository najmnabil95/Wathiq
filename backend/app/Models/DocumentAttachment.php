<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DocumentAttachment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'document_id',
        'original_name',
        'file_name',
        'file_path',
        'disk',
        'mime_type',
        'extension',
        'file_size',
        'checksum',
        'ocr_status',
        'ocr_text',
        'uploaded_by',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    // ─── Relationships ────────────────────────────────────────────

    public function document()
    {
        return $this->belongsTo(Document::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ─── Accessors ────────────────────────────────────────────────

    /**
     * Human-readable file size.
     */
    public function getFileSizeHumanAttribute(): string
    {
        $size = $this->file_size;
        if ($size >= 1048576) {
            return round($size / 1048576, 2) . ' MB';
        } elseif ($size >= 1024) {
            return round($size / 1024, 2) . ' KB';
        }
        return $size . ' B';
    }

    /**
     * Is this file previewable in browser?
     */
    public function getIsPreviewableAttribute(): bool
    {
        return in_array($this->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
        ]);
    }

    // ─── Scopes ───────────────────────────────────────────────────

    public function scopeImages($query)
    {
        return $query->where('mime_type', 'LIKE', 'image/%');
    }

    public function scopePdfs($query)
    {
        return $query->where('mime_type', 'application/pdf');
    }
}
