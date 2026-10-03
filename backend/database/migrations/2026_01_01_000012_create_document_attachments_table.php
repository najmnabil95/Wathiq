<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->string('original_name');             // Original filename from user
            $table->string('file_name');                 // Stored filename (UUID-based)
            $table->string('file_path');                 // Relative path on disk
            $table->string('disk', 50)->default('local'); // Filesystem disk
            $table->string('mime_type', 100);
            $table->string('extension', 20);
            $table->unsignedBigInteger('file_size');     // Bytes
            $table->string('checksum', 64);              // SHA-256 hash for integrity
            $table->string('ocr_status', 20)->default('pending'); // pending|processing|done|failed
            $table->longText('ocr_text')->nullable();    // OCR extracted text
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_id');
            $table->index('checksum');
            $table->index('mime_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_attachments');
    }
};
