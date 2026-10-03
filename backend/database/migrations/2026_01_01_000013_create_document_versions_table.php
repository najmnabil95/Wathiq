<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->string('version_number', 20);          // e.g. v1.0, v1.1, v2.0
            $table->string('file_name')->nullable();
            $table->string('file_path')->nullable();
            $table->string('disk', 50)->default('local');
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->text('change_summary');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('document_id');
            $table->unique(['document_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_versions');
    }
};
