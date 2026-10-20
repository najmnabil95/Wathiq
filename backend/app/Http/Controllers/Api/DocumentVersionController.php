<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Services\AuditService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentVersionController extends Controller
{
    public function __construct(
        private readonly AuditService $auditService,
        private readonly NotificationService $notificationService,
    ) {}

    public function index(int $docId): JsonResponse
    {
        $this->checkPermission('documents.view');

        $document = Document::findOrFail($docId);
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
        $this->checkPermission('documents.update');

        $document = Document::findOrFail($docId);

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
        $fileSize = null;
        $checksum = null;
        $disk = 'local';

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $year = now()->year;
            $uuid = Str::uuid()->toString();
            $ext  = $file->getClientOriginalExtension();
            $fileName = "v_{$uuid}.{$ext}";
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

    public function download(Request $request, int $docId, int $versionId): mixed
    {
        $this->checkPermission('documents.view');

        $document = Document::findOrFail($docId);
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

        $downloadName = "{$document->document_number}_{$version->version_number}_" . ($version->file_name ?: 'document.pdf');
        $safeAscii = preg_replace('/[^\x20-\x7E]/', '_', $downloadName);
        $encodedName = rawurlencode($downloadName);

        return $disk->download(
            $filePath,
            $safeAscii,
            [
                'Content-Disposition' => "attachment; filename=\"{$safeAscii}\"; filename*=UTF-8''{$encodedName}",
            ]
        );
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
