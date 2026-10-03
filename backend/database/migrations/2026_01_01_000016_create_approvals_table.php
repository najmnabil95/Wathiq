<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('workflow_step_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('approver_id')->constrained('users')->restrictOnDelete();
            $table->string('status', 30)->default('pending'); // pending, approved, rejected
            $table->text('comments')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->index('document_id');
            $table->index('approver_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
