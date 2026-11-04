<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->unsignedSmallInteger('retention_years')->nullable()->after('legal_hold_released_at');
            $table->date('retention_until')->nullable()->after('retention_years');
            $table->string('disposition_status', 20)->default('active')->after('retention_until');
            $table->timestamp('disposed_at')->nullable()->after('disposition_status');
            $table->foreignId('disposed_by')->nullable()->after('disposed_at')->constrained('users')->nullOnDelete();

            $table->index('retention_until');
            $table->index('disposition_status');
        });

        $years = 7;
        $setting = DB::table('settings')->where('key', 'retention_years')->first();
        if ($setting) {
            $decoded = json_decode($setting->value, true);
            $years = (int) (json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value);
        }

        DB::table('documents')->orderBy('id')->chunkById(200, function ($documents) use ($years) {
            foreach ($documents as $document) {
                $base = $document->document_date ?: $document->created_at ?: now();

                DB::table('documents')->where('id', $document->id)->update([
                    'retention_years' => $years,
                    'retention_until' => $years >= 99 ? null : Carbon::parse($base)->addYears($years)->toDateString(),
                ]);
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['disposed_by']);
            $table->dropIndex(['retention_until']);
            $table->dropIndex(['disposition_status']);
            $table->dropColumn(['retention_years', 'retention_until', 'disposition_status', 'disposed_at', 'disposed_by']);
        });
    }
};
