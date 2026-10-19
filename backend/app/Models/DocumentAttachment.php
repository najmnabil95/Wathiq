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
        $previewableMimes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'image/bmp',
            'text/plain',
            'text/csv',
            'text/html',
            'application/json',
            'text/markdown',
            'text/xml',
            'application/xml',
        ];

        $previewableExtensions = [
            'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp',
            'txt', 'csv', 'json', 'log', 'xml', 'md',
        ];

        $mime = strtolower((string)$this->mime_type);
        $ext = strtolower((string)($this->extension ?: pathinfo($this->file_path, PATHINFO_EXTENSION)));

        if (in_array($mime, $previewableMimes) || in_array($ext, $previewableExtensions)) {
            return true;
        }

        if (str_starts_with($mime, 'image/') || str_starts_with($mime, 'text/')) {
            return true;
        }

        return false;
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
