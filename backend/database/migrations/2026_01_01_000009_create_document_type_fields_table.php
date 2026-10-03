<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_type_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_type_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);           // internal field key
            $table->string('label');               // English label
            $table->string('label_ar');            // Arabic label
            $table->string('field_type', 30);      // text|textarea|number|date|datetime|time|select|multiselect|checkbox|radio|email|phone
            $table->boolean('is_required')->default(false);
            $table->text('default_value')->nullable();
            $table->json('options')->nullable();               // for select/radio/checkbox options
            $table->json('validation_rules')->nullable();      // e.g. {"min": 3, "max": 255}
            $table->string('placeholder')->nullable();
            $table->string('placeholder_ar')->nullable();
            $table->string('hint')->nullable();
            $table->string('hint_ar')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['document_type_id', 'name']);
            $table->index('document_type_id');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_type_fields');
    }
};
