<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Atomic document number sequences to prevent race conditions
        Schema::create('document_number_sequences', function (Blueprint $table) {
            $table->id();
            $table->string('prefix', 20);     // e.g. ACCESS, CCTV, USER
            $table->smallInteger('year');     // e.g. 2026
            $table->unsignedInteger('last_number')->default(0);
            $table->timestamps();

            $table->unique(['prefix', 'year']);
            $table->index('prefix');
            $table->index('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_number_sequences');
    }
};
