<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Services\AuditService;
use App\Services\NotificationService;
use App\Services\WatermarkService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentVersionController extends Controller
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
        private readonly WatermarkService $watermarkService,
    ) {}

    public function index(Request $request, int $docId): JsonResponse
    {
        $this->checkPermission('versions.view');

        $document = Document::findVisibleOrFail($docId, $request->user());
        $versions = $document->versions()
            ->with('uploader:id,name,email')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $versions,
        ]);
    }

    public function store(Request $request, int $docId): JsonResponse
    {
        $this->checkPermission('versions.create');

        $document = Document::findVisibleOrFail($docId, $request->user());

        $validated = $request->validate([
            'version_number' => ['required', 'string', 'max:20'],
            'change_summary' => ['required', 'string', 'min:3', 'max:1000'],
            'file'           => ['nullable', 'file', 'max:20480'], // max 20MB
        ]);

        // Check if version_number already exists for this document
        $exists = DocumentVersion::where('document_id', $docId)
            ->where('version_number', $validated['version_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'رقم الإصدار هذا مسجل مسبقاً لهذه الوثيقة.',
            ], 422);
        }

        $filePath = null;
        $fileName = null;
        $originalName = null;
        $fileSize = null;
        $checksum = null;
        $disk = 'local';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $year = now()->year;
            $uuid = Str::uuid()->toString();
            $ext  = $file->getClientOriginalExtension();
            $fileName = "v_{$uuid}.{$ext}";
            $originalName = $file->getClientOriginalName();
            $storageFolder = "private/documents/{$year}/{$document->id}/versions";

            $file->storeAs($storageFolder, $fileName, $disk);
            $filePath = "{$storageFolder}/{$fileName}";
            $fileSize = $file->getSize();
            $checksum = hash_file('sha256', $file->getRealPath());
        }

        $version = DocumentVersion::create([
            'document_id'    => $document->id,
            'version_number' => $validated['version_number'],
            'file_name'      => $fileName,
            'original_name'  => $originalName,
            'file_path'      => $filePath,
            'disk'           => $disk,
            'file_size'      => $fileSize,
            'checksum'       => $checksum,
            'change_summary' => $validated['change_summary'],
            'uploaded_by'    => $request->user()->id,
        ]);

        $this->auditService->log(
            'version.create',
            $document,
            null,
            ['version' => $version->version_number],
            "New version {$version->version_number} created for document {$document->document_number}"
        );

        if ($document->creator && $document->creator_id !== $request->user()->id) {
            $this->notificationService->notifyNewVersion(
                $document,
                $document->creator,
                $request->user(),
                $version->version_number
            );
        }

        $version->load('uploader:id,name,email');

        return response()->json([
            'success' => true,
            'message' => "تم تسجيل وتوثيق الإصدار {$version->version_number} بنجاح.",
            'data'    => $version,
        ], 201);
    }

    public function revert(Request $request, int $docId, int $versionId): JsonResponse
    {
        $this->checkPermission('versions.revert');

        $document = Document::findVisibleOrFail($docId, $request->user());

        if ($document->is_archived) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن استرجاع إصدار لوثيقة مؤرشفة نهائياً.',
            ], 422);
        }

        $source = DocumentVersion::where('document_id', $docId)->findOrFail($versionId);

        $validated = $request->validate([
            'change_summary' => ['nullable', 'string', 'min:3', 'max:1000'],
        ]);

        $existingNumbers = DocumentVersion::where('document_id', $docId)->pluck('version_number')->all();
        $versionNumber = $this->nextVersionNumber($existingNumbers);

        $filePath = null;
        $fileName = null;
        $fileSize = null;
        $checksum = null;

        if ($source->file_path) {
            $content = $this->readVersionFile($source);
            if ($content !== null) {
                $ext = pathinfo($source->file_path, PATHINFO_EXTENSION);
                $fileName = 'v_' . Str::uuid()->toString() . ($ext ? ".{$ext}" : '');
                $storageFolder = 'private/documents/' . now()->year . "/{$document->id}/versions";
                Storage::disk('local')->put("{$storageFolder}/{$fileName}", $content);
                $filePath = "{$storageFolder}/{$fileName}";
                $fileSize = strlen($content);
                $checksum = hash('sha256', $content);
            }
        }

        $version = DocumentVersion::create([
            'document_id'    => $document->id,
            'version_number' => $versionNumber,
            'file_name'      => $fileName,
            'original_name'  => $source->original_name,
            'file_path'      => $filePath,
            'disk'           => 'local',
            'file_size'      => $fileSize,
            'checksum'       => $checksum,
            'change_summary' => $validated['change_summary'] ?? "استرجاع محتوى الإصدار {$source->version_number}",
            'uploaded_by'    => $request->user()->id,
        ]);

        $this->auditService->log(
            'version.revert',
            $document,
            ['version' => $source->version_number],
            ['version' => $version->version_number],
            "Document {$document->document_number} reverted from version {$source->version_number} to new version {$version->version_number}"
        );

        if ($document->creator && $document->creator_id !== $request->user()->id) {
            $this->notificationService->notifyNewVersion(
                $document,
                $document->creator,
                $request->user(),
                $version->version_number
            );
        }

        $version->load('uploader:id,name,email');

        return response()->json([
            'success' => true,
            'message' => "تم استرجاع الإصدار {$source->version_number} وتسجيله كإصدار جديد {$version->version_number}.",
            'data'    => $version,
        ], 201);
    }

    private function nextVersionNumber(array $existingNumbers): string
    {
        $major = 1;
        $minor = 0;

        foreach ($existingNumbers as $number) {
            if (preg_match('/^v?(\d+)(?:\.(\d+))?$/i', $number, $m)) {
                $candidateMajor = (int) $m[1];
                $candidateMinor = isset($m[2]) ? (int) $m[2] : 0;
                if ($candidateMajor > $major || ($candidateMajor === $major && $candidateMinor >= $minor)) {
                    $major = $candidateMajor;
                    $minor = $candidateMinor;
                }
            }
        }

        do {
            $minor++;
            $candidate = "v{$major}.{$minor}";
        } while (in_array($candidate, $existingNumbers, true));

        return $candidate;
    }

    private function readVersionFile(DocumentVersion $version): ?string
    {
        $diskName = $version->disk ?: 'local';
        $disk = Storage::disk($diskName);

        if ($disk->exists($version->file_path)) {
            return $disk->get($version->file_path);
        }

        $fallbackName = $diskName === 'private' ? 'local' : 'private';
        $fallback = Storage::disk($fallbackName);
        if ($fallback->exists($version->file_path)) {
            return $fallback->get($version->file_path);
        }

        $absolute = storage_path('app/' . $version->file_path);
        if (file_exists($absolute)) {
            return file_get_contents($absolute);
        }

        return null;
    }

    public function download(Request $request, int $docId, int $versionId): mixed
    {
        $this->checkPermission('versions.view');

        $document = Document::findVisibleOrFail($docId, $request->user());
        $version  = DocumentVersion::where('document_id', $docId)->findOrFail($versionId);

        if (!$version->file_path) {
            return response()->json([
                'success' => false,
                'message' => 'هذا الإصدار لا يحتوي على ملف مرفق مستقل (تعديل بيانات فقط).',
            ], 404);
        }

        $diskName = $version->disk ?: 'local';
        $disk = Storage::disk($diskName);
        $filePath = $version->file_path;

        if (!$disk->exists($filePath)) {
            $fallback = ($diskName === 'private') ? 'local' : 'private';
            if (Storage::disk($fallback)->exists($filePath)) {
                $disk = Storage::disk($fallback);
            } else if (file_exists(storage_path('app/' . $filePath))) {
                $disk = Storage::disk('local');
            } else {
                return response()->json(['success' => false, 'message' => 'ملف الإصدار غير موجود على الخادم.'], 404);
            }
        }

        $downloadName = "{$document->document_number}_{$version->version_number}_" . ($version->original_name ?: $version->file_name ?: 'document.pdf');
        $safeAscii = preg_replace('/[^\x20-\x7E]/', '_', $downloadName);
        $encodedName = rawurlencode($downloadName);
        $headers = [
            'Content-Disposition' => "attachment; filename=\"{$safeAscii}\"; filename*=UTF-8''{$encodedName}",
        ];

        if (WatermarkService::enabled() && method_exists($disk, 'path')) {
            try {
                $watermarked = $this->watermarkService->apply(
                    $disk->path($filePath),
                    $disk->mimeType($filePath),
                    $document,
                    $request->user()
                );
            } catch (\Throwable) {
                $watermarked = null;
            }

            if ($watermarked) {
                return response()->download($watermarked, $safeAscii, $headers)->deleteFileAfterSend(true);
            }
        }

        return $disk->download($filePath, $safeAscii, $headers);
    }

    private function checkPermission(string $perm): void
    {
        $user = auth()->user() ?? request()->user();
        if (!$user) {
            abort(401, 'غير مصرح.');
        }
        if (!$user->hasPermission($perm) && !$user->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
