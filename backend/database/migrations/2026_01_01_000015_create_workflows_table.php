<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workflows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_type_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_ar');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_type_id');
            $table->index('is_active');
        });

        Schema::create('workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('name_ar');
            $table->foreignId('role_id')->nullable()->constrained()->nullOnDelete();
            $table->integer('step_order');
            $table->boolean('is_required')->default(true);
            $table->string('action_type', 50)->default('approve'); // approve, review, acknowledge
            $table->text('instructions')->nullable();
            $table->timestamps();

            $table->index('workflow_id');
            $table->index('step_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workflow_steps');
        Schema::dropIfExists('workflows');
    }
};
