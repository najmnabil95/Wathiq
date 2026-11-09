<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;

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
    $env = (string) config('app.env');
    $debug = (bool) config('app.debug');
    $rows[] = [
        'Environment',
        $env . ' (Debug: ' . ($debug ? 'ON — exposes error details' : 'OFF') . ')',
    ];

    $environmentSafe = $env === 'production' && !$debug;

    $this->table(['Check Item', 'Status'], $rows);

    $systemReady = $hasKey && $dbOk && $storageWritable && $hasIndex && $hasAssets;

    if ($systemReady && $environmentSafe) {
        $this->info("\n [ALL SYSTEMS GO] Your IT-EDMS deployment is ready for production!");
    } elseif ($systemReady) {
        $this->warn("\n [ATTENTION] The system is functional, but set APP_ENV=production and APP_DEBUG=false before exposing it to users.");
    } else {
        $this->warn("\n [ATTENTION] Please review the items marked above before opening to users.");
    }
})->purpose('Verify IT-EDMS system status and deployment readiness');

/**
 * Batch OCR indexing command for attachments
 */
Artisan::command('edms:ocr-index {--force : Re-index already processed attachments}', function () {
    $this->info("=================================================");
    $this->info(" IT-EDMS: Full-Text OCR & Attachment Indexing");
    $this->info("=================================================");

    $force = $this->option('force');
    $query = \App\Models\DocumentAttachment::query();

    if (!$force) {
        $query->where(function ($q) {
            $q->whereNull('ocr_text')
              ->orWhere('ocr_status', 'pending');
        });
    }

    $attachments = $query->get();
    $total = $attachments->count();

    if ($total === 0) {
        $this->info("All attachments are already indexed. Use --force to re-index.");
        return;
    }

    $this->info("Found {$total} attachment(s) to process...\n");
    $bar = $this->output->createProgressBar($total);
    $bar->start();

    $extractor = new \App\Services\TextExtractionService();
    $success = 0;
    $failed = 0;

    foreach ($attachments as $att) {
        $res = $extractor->extractAndStore($att);
        if ($res) {
            $success++;
        } else {
            $failed++;
        }
        $bar->advance();
    }

    $bar->finish();
    $this->info("\n\n [INDEXING COMPLETE]");
    $this->table(
        ['Metric', 'Value'],
        [
            ['Total Processed', $total],
            ['Successfully Extracted', $success],
            ['Pending / Not Text-Based', $failed],
        ]
    );
})->purpose('Extract text and index attachments for smart full-text search');

/**
 * Full backup: MySQL dump + stored files + .env, with retention pruning
 */
Artisan::command('edms:backup {--keep= : Number of archives to retain}', function () {
    $this->info("=================================================");
    $this->info(" IT-EDMS: Full Backup");
    $this->info("=================================================");

    $keep = max(1, (int) ($this->option('keep') ?: config('edms.backup_keep', 14)));
    $path = rtrim((string) config('edms.backup_path'), '/\\');
    $dumpExe = (string) config('edms.mysqldump');

    if (!class_exists(\ZipArchive::class)) {
        $this->error('PHP zip extension is required.');
        return 1;
    }

    if (!is_file($dumpExe)) {
        $this->error("mysqldump not found at {$dumpExe}");
        return 1;
    }

    if (!is_dir($path) && !mkdir($path, 0775, true) && !is_dir($path)) {
        $this->error("Unable to create backup directory: {$path}");
        return 1;
    }

    $connection = config('database.connections.mysql');
    $database = (string) $connection['database'];

    $tmpBase = tempnam(sys_get_temp_dir(), 'edms_backup_');
    if ($tmpBase === false) {
        $this->error('Unable to create a temporary file for the database dump.');
        return 1;
    }

    $tmpSql = $tmpBase . '.sql';
    @unlink($tmpBase);

    $args = [
        $dumpExe,
        '--host=' . ($connection['host'] ?? '127.0.0.1'),
        '--port=' . ($connection['port'] ?? 3306),
        '--user=' . ($connection['username'] ?? 'root'),
        '--single-transaction',
        '--routines',
        '--triggers',
        '--events',
        '--default-character-set=utf8mb4',
        $database,
        '--result-file=' . $tmpSql,
    ];

    $env = [];
    if (!empty($connection['password'])) {
        $env['MYSQL_PWD'] = $connection['password'];
    }

    $process = new Process($args, base_path(), $env ?: null, null, 300);
    $process->run();

    if (!$process->isSuccessful() || !is_file($tmpSql) || filesize($tmpSql) === 0) {
        @unlink($tmpSql);
        $this->error('Database dump failed: ' . trim($process->getErrorOutput() ?: $process->getOutput()));
        return 1;
    }

    $stamp = now()->format('Y-m-d_His');
    $archive = $path . DIRECTORY_SEPARATOR . "edms-backup-{$stamp}.zip";
    $zip = new \ZipArchive();

    if ($zip->open($archive, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
        @unlink($tmpSql);
        $this->error("Unable to create archive: {$archive}");
        return 1;
    }

    $zip->addFile($tmpSql, 'database.sql');

    if (is_file(base_path('.env'))) {
        $zip->addFile(base_path('.env'), 'config/.env');
    }

    $fileCount = 0;
    $storageRoot = storage_path('app');
    $iterator = new \RecursiveIteratorIterator(
        new \RecursiveDirectoryIterator($storageRoot, \FilesystemIterator::SKIP_DOTS),
        \RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isLink() || !$file->isFile()) {
            continue;
        }

        $relative = str_replace('\\', '/', substr($file->getPathname(), strlen($storageRoot) + 1));
        $zip->addFile($file->getPathname(), 'storage/app/' . $relative);
        $fileCount++;
    }

    $zip->addFromString('manifest.json', json_encode([
        'generated_at'  => now()->toIso8601String(),
        'database'      => $database,
        'documents'     => DB::table('documents')->count(),
        'users'         => DB::table('users')->count(),
        'audit_logs'    => DB::table('audit_logs')->count(),
        'storage_files' => $fileCount,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    $zip->close();
    @unlink($tmpSql);

    $archives = glob($path . DIRECTORY_SEPARATOR . 'edms-backup-*.zip') ?: [];
    rsort($archives);
    $removed = 0;

    foreach (array_slice($archives, $keep) as $old) {
        if (@unlink($old)) {
            $removed++;
        }
    }

    $sizeMb = round(filesize($archive) / 1048576, 2);

    @file_put_contents(
        storage_path('logs/backup.log'),
        sprintf("[%s] archive=%s size_mb=%s files=%d pruned=%d\n", now()->toDateTimeString(), $archive, $sizeMb, $fileCount, $removed),
        FILE_APPEND
    );

    $this->table(['Item', 'Value'], [
        ['Archive', $archive],
        ['Size', $sizeMb . ' MB'],
        ['Database', $database],
        ['Storage files', $fileCount],
        ['Retention', $keep . ' archives'],
        ['Pruned', $removed],
    ]);

    $this->info("\n [BACKUP COMPLETE]");
    return 0;
})->purpose('Back up the database, stored files, and env configuration');
