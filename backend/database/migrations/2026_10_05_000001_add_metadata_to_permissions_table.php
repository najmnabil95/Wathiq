<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('risk_level', 20)->default('normal')->after('group');
            $table->string('subgroup', 50)->nullable()->after('group');
            $table->text('description_ar')->nullable()->after('display_name_ar');
        });
    }

    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn(['risk_level', 'subgroup', 'description_ar']);
        });
    }
};
