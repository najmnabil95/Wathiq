<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('document_number', 60)->unique();
            $table->string('original_number', 100)->nullable(); // external ref number
            $table->string('title');
            $table->foreignId('document_type_id')->constrained()->restrictOnDelete();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->foreignId('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('status_id')->constrained('statuses')->restrictOnDelete();
            $table->foreignId('confidentiality_level_id')->constrained('confidentiality_levels')->restrictOnDelete();
            $table->date('document_date');
            $table->timestamp('received_at')->nullable();
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->string('physical_location')->nullable(); // Paper archive location
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            // OCR-ready field (populated by future OCR pipeline)
            $table->longText('ocr_text')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for common search/filter operations
            $table->index('document_number');
            $table->index('document_type_id');
            $table->index('category_id');
            $table->index('department_id');
            $table->index('organization_id');
            $table->index('status_id');
            $table->index('confidentiality_level_id');
            $table->index('created_by');
            $table->index('assigned_to');
            $table->index('document_date');
            $table->index('is_archived');
            $table->index('created_at');
            $table->fullText(['title', 'description', 'notes']); // Full-text search
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
