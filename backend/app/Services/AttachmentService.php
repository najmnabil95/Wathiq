<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AttachmentService
{
    // Allowed MIME types
    private const ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ];

    private const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

    private string $disk = 'local';
    private string $basePath = 'private/documents';

    /**
     * Store a file attachment for a document.
     */
    public function store(Document $document, UploadedFile $file, int $uploadedBy): DocumentAttachment
    {
        // Validate MIME type server-side
        $this->validateFile($file);

        $year       = now()->year;
        $uuid       = Str::uuid()->toString();
        $extension  = $file->getClientOriginalExtension();
        $fileName   = "{$uuid}.{$extension}";
        $storagePath = "{$this->basePath}/{$year}/{$document->id}";

        // Store in private disk
        $file->storeAs($storagePath, $fileName, $this->disk);

        return DocumentAttachment::create([
            'document_id'   => $document->id,
            'original_name' => $file->getClientOriginalName(),
            'file_name'     => $fileName,
            'file_path'     => "{$storagePath}/{$fileName}",
            'disk'          => $this->disk,
            'mime_type'     => $file->getMimeType(),
            'extension'     => strtolower($extension),
            'file_size'     => $file->getSize(),
            'checksum'      => hash_file('sha256', $file->getRealPath()),
            'uploaded_by'   => $uploadedBy,
        ]);
    }

    /**
     * Serve a file for download/preview — always goes through authorization.
     */
    public function getStoragePath(DocumentAttachment $attachment): string
    {
        return $attachment->file_path;
    }

    /**
     * Delete a file from disk and mark as soft-deleted.
     */
    public function delete(DocumentAttachment $attachment): void
    {
        Storage::disk($this->disk)->delete($attachment->file_path);
        $attachment->delete(); // soft delete
    }

    /**
     * Validate file before storing.
     *
     * @throws \InvalidArgumentException
     */
    private function validateFile(UploadedFile $file): void
    {
        // MIME validation (server-side, not just extension)
        $mime = $file->getMimeType();

        if (!in_array($mime, self::ALLOWED_MIMES)) {
            throw new \InvalidArgumentException(
                "File type '{$mime}' is not allowed."
            );
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException(
                'File size exceeds the maximum allowed limit of 20MB.'
            );
        }
    }
}
