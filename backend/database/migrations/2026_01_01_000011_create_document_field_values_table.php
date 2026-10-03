<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_field_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained()->cascadeOnDelete();
            $table->foreignId('document_type_field_id')->constrained()->cascadeOnDelete();
            $table->text('value')->nullable(); // stored as text; JSON for multiselect/checkbox
            $table->timestamps();

            $table->unique(['document_id', 'document_type_field_id']);
            $table->index('document_id');
            $table->index('document_type_field_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_field_values');
    }
};
