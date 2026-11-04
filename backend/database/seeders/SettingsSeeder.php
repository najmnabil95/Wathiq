<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'numbering_pattern' => '{CAT}-{YEAR}-{SEQ:4}',
            'retention_years'   => '7',
            'require_mfa'       => true,
            'sha_check_enabled' => true,
            'watermark_downloads' => true,
        ];

        foreach ($defaults as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => json_encode($value), 'group' => 'archive']
            );
        }
    }
}
