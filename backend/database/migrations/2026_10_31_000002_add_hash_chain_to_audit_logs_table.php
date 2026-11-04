<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->string('previous_hash', 64)->nullable()->after('description');
            $table->string('hash', 64)->nullable()->after('previous_hash');

            $table->index('hash');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex(['hash']);
            $table->dropColumn(['previous_hash', 'hash']);
        });
    }
};
