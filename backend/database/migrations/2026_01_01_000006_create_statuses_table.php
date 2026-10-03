<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();     // e.g. new, in_progress
            $table->string('name_ar', 100);            // e.g. جديد, قيد التنفيذ
            $table->string('label');
            $table->string('label_ar');
            $table->string('color', 30)->default('gray'); // Tailwind color
            $table->string('icon', 50)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_final')->default(false);  // terminal state
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('statuses');
    }
};
