<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

/**
 * Diagnostic command to verify unified deployment readiness
 */
Artisan::command('edms:check', function () {
    $this->info("=================================================");
    $this->info(" IT-EDMS: Production Deployment Readiness Check");
    $this->info("=================================================");

    $rows = [];

    // 1. App Key Check
    $hasKey = !empty(config('app.key'));
    $rows[] = ['Application Key (APP_KEY)', $hasKey ? 'OK' : 'MISSING (Run php artisan key:generate)'];

    // 2. Database Connection
    $dbOk = false;
    try {
        DB::connection()->getPdo();
        $dbOk = true;
        $dbStatus = 'Connected (' . DB::connection()->getDatabaseName() . ')';
    } catch (\Throwable $e) {
        $dbStatus = 'FAILED: ' . $e->getMessage();
    }
    $rows[] = ['Database Connection', $dbStatus];

    // 3. Storage Permissions
    $storageWritable = is_writable(storage_path('app')) && is_writable(storage_path('framework'));
    $rows[] = ['Storage Writable', $storageWritable ? 'OK (storage/app & storage/framework)' : 'PERMISSION ERROR'];

    // 4. Frontend SPA Build Check
    $indexPath = public_path('index.html');
    $hasIndex = file_exists($indexPath);
    $assetsDir = public_path('assets');
    $hasAssets = is_dir($assetsDir) && count(File::files($assetsDir)) > 0;

    if ($hasIndex && $hasAssets) {
        $frontendStatus = 'Built & Ready (' . count(File::files($assetsDir)) . ' asset files)';
    } else {
        $frontendStatus = 'NOT BUILT (Run "npm run build" in frontend or build.bat)';
    }
    $rows[] = ['Frontend SPA Integration', $frontendStatus];

    // 5. Environment
    $rows[] = ['Environment', config('app.env') . ' (Debug: ' . (config('app.debug') ? 'ON' : 'OFF') . ')'];

    $this->table(['Check Item', 'Status'], $rows);

    if ($hasKey && $dbOk && $storageWritable && $hasIndex && $hasAssets) {
        $this->info("\n [ALL SYSTEMS GO] Your IT-EDMS deployment is ready for production!");
    } else {
        $this->warn("\n [ATTENTION] Please review the items marked above before opening to users.");
    }
})->purpose('Verify IT-EDMS system status and deployment readiness');
