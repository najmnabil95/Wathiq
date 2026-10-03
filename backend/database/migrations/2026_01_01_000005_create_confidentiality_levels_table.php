<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('confidentiality_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();         // e.g. public
            $table->string('name_ar', 100);                // e.g. عام
            $table->string('label');                       // Display label
            $table->string('label_ar');
            $table->string('color', 30)->default('gray'); // Tailwind color name
            $table->integer('level_order')->default(0);   // 0=public, 3=highly confidential
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('confidentiality_levels');
    }
};
