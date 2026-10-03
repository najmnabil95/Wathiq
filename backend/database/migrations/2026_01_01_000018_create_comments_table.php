<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('comments')->nullOnDelete();
            $table->text('comment');
            $table->boolean('is_internal')->default(false); // Internal note vs public comment
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_id');
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
