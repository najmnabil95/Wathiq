<?php

namespace App\Services;

use App\Models\DocumentAttachment;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;

class OfficePreviewService
{
    private const CONVERTIBLE_EXTENSIONS = [
        'doc', 'docx', 'odt', 'rtf',
        'xls', 'xlsx', 'ods',
        'ppt', 'pptx', 'odp',
    ];

    private ?string $resolvedBinary = null;

    private bool $binaryResolved = false;

    public function isConvertible(?string $extension): bool
    {
        return in_array(strtolower(trim((string) $extension, '.')), self::CONVERTIBLE_EXTENSIONS, true);
    }

    public function isAvailable(): bool
    {
        return $this->binaryPath() !== null;
    }

    /**
     * Convert an office file to PDF and return the cached PDF path, or null on failure.
     */
    public function convertFor(DocumentAttachment $attachment, ?string $sourcePath): ?string
    {
        if (! $sourcePath || ! is_file($sourcePath)) {
            return null;
        }

        $extension = $this->extensionFor($attachment);
        if (! $this->isConvertible($extension)) {
            return null;
        }

        $binary = $this->binaryPath();
        if (! $binary) {
            Log::warning('Office preview skipped: LibreOffice binary not found.');

            return null;
        }

        $cacheDir = storage_path('framework/cache/office-previews');
        $cachePath = $cacheDir.DIRECTORY_SEPARATOR.$this->cacheKey($attachment, $extension).'.pdf';

        if (is_file($cachePath) && filesize($cachePath) > 0) {
            return $cachePath;
        }

        File::ensureDirectoryExists($cacheDir);
        $workDir = $cacheDir.DIRECTORY_SEPARATOR.'tmp-'.Str::uuid()->toString();

        try {
            File::ensureDirectoryExists($workDir);
            $inputPath = $workDir.DIRECTORY_SEPARATOR.'input.'.$extension;
            if (! @copy($sourcePath, $inputPath)) {
                Log::warning('Office preview failed: cannot copy source file.', ['attachment_id' => $attachment->id]);

                return null;
            }

            $profileDir = $workDir.DIRECTORY_SEPARATOR.'profile';
            File::ensureDirectoryExists($profileDir);
            $profileUri = 'file:///'.ltrim(str_replace('\\', '/', $profileDir), '/');

            $process = new Process([
                $binary,
                '--headless',
                '--nologo',
                '--norestore',
                '--nolockcheck',
                '--nodefault',
                "-env:UserInstallation={$profileUri}",
                '--convert-to',
                'pdf',
                '--outdir',
                $workDir,
                $inputPath,
            ]);
            $process->setTimeout((int) config('edms.office_timeout', 60));
            $process->disableOutput();
            $process->run();

            $outputPath = $workDir.DIRECTORY_SEPARATOR.'input.pdf';

            if (! $process->isSuccessful() || ! is_file($outputPath) || filesize($outputPath) === 0) {
                Log::warning('Office preview conversion failed.', [
                    'attachment_id' => $attachment->id,
                    'exit_code' => $process->getExitCode(),
                ]);

                return null;
            }

            if (! @rename($outputPath, $cachePath)) {
                if (! @copy($outputPath, $cachePath)) {
                    return null;
                }
            }

            return is_file($cachePath) ? $cachePath : null;
        } catch (\Throwable $e) {
            Log::warning('Office preview conversion error: '.$e->getMessage(), [
                'attachment_id' => $attachment->id,
            ]);

            return null;
        } finally {
            if (is_dir($workDir)) {
                File::deleteDirectory($workDir);
            }
        }
    }

    public function extensionFor(DocumentAttachment $attachment): string
    {
        $extension = strtolower((string) $attachment->extension);

        if ($extension === '') {
            $extension = strtolower(pathinfo((string) $attachment->original_name, PATHINFO_EXTENSION));
        }

        return $extension;
    }

    private function cacheKey(DocumentAttachment $attachment, string $extension): string
    {
        $fingerprint = implode('|', [
            $attachment->id,
            $extension,
            (string) $attachment->checksum,
            (string) $attachment->file_size,
            (string) $attachment->updated_at,
        ]);

        return 'att-'.$attachment->id.'-'.substr(sha1($fingerprint), 0, 16);
    }

    private function binaryPath(): ?string
    {
        if ($this->binaryResolved) {
            return $this->resolvedBinary;
        }

        $this->binaryResolved = true;

        $configured = trim((string) config('edms.soffice', ''));
        if ($configured !== '' && is_file($configured)) {
            return $this->resolvedBinary = $this->preferConsoleVariant($configured);
        }

        $candidates = [
            'C:/Program Files/LibreOffice/program/soffice.com',
            'C:/Program Files/LibreOffice/program/soffice.exe',
            'C:/Program Files (x86)/LibreOffice/program/soffice.com',
            'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
            '/usr/bin/soffice',
            '/usr/local/bin/soffice',
            '/opt/libreoffice/program/soffice',
            '/Applications/LibreOffice.app/Contents/MacOS/soffice',
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $this->resolvedBinary = $this->preferConsoleVariant($candidate);
            }
        }

        $pathDirs = explode(PATH_SEPARATOR, (string) getenv('PATH'));
        foreach ($pathDirs as $dir) {
            $dir = trim($dir);
            if ($dir === '') {
                continue;
            }
            foreach (['soffice.com', 'soffice.exe', 'soffice'] as $name) {
                $candidate = rtrim($dir, '\\/').DIRECTORY_SEPARATOR.$name;
                if (is_file($candidate)) {
                    return $this->resolvedBinary = $candidate;
                }
            }
        }

        return $this->resolvedBinary = null;
    }

    /**
     * soffice.exe detaches from the process pipes on Windows and can hang the caller;
     * soffice.com is the console launcher that waits for the conversion to finish.
     */
    private function preferConsoleVariant(string $binary): string
    {
        if (str_ends_with(strtolower($binary), '.exe')) {
            $console = substr($binary, 0, -4).'.com';
            if (is_file($console)) {
                return $console;
            }
        }

        return $binary;
    }
}
