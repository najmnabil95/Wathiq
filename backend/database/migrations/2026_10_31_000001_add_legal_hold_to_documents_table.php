<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->boolean('legal_hold')->default(false)->after('is_archived');
            $table->text('legal_hold_reason')->nullable()->after('legal_hold');
            $table->timestamp('legal_hold_at')->nullable()->after('legal_hold_reason');
            $table->foreignId('legal_hold_by')->nullable()->after('legal_hold_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('legal_hold_released_at')->nullable()->after('legal_hold_by');

            $table->index('legal_hold');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['legal_hold_by']);
            $table->dropIndex(['legal_hold']);
            $table->dropColumn([
                'legal_hold',
                'legal_hold_reason',
                'legal_hold_at',
                'legal_hold_by',
                'legal_hold_released_at',
            ]);
        });
    }
};
