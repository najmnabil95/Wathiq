<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Services\AttachmentService;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function __construct(
        private readonly AttachmentService $attachmentService,
        private readonly AuditService      $auditService,
    ) {}

    public function index(int $id): JsonResponse
    {
        $this->checkPermission('documents.view');

        $document    = Document::findOrFail($id);
        $attachments = $document->attachments()->with('uploader')->get();

        return response()->json(['success' => true, 'data' => $attachments]);
    }

    public function store(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('attachments.upload');

        $document = Document::findOrFail($id);

        $request->validate([
            'files'   => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['required', 'file', 'max:20480'], // 20MB
        ]);

        $uploaded = [];

        foreach ($request->file('files') as $file) {
            try {
                $attachment = $this->attachmentService->store($document, $file, $request->user()->id);
                $this->auditService->logDownload($document, $file->getClientOriginalName());
                $uploaded[] = $attachment;
            } catch (\InvalidArgumentException $e) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 422);
            }
        }

        $this->auditService->log(
            'upload',
            $document,
            null,
            ['files_count' => count($uploaded)],
            count($uploaded) . ' file(s) uploaded to document ' . $document->document_number
        );

        return response()->json([
            'success' => true,
            'message' => 'تم رفع ' . count($uploaded) . ' ملف بنجاح.',
            'data'    => $uploaded,
        ], 201);
    }

    /**
     * Secure file download — always goes through authorization.
     * NEVER expose file paths to client.
     */
    public function download(Request $request, int $docId, int $attId): mixed
    {
        $this->checkPermission('attachments.download');

        $document   = Document::findOrFail($docId);
        $attachment = DocumentAttachment::where('document_id', $docId)->findOrFail($attId);

        // Check file exists on disk
        if (!Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            return response()->json(['success' => false, 'message' => 'الملف غير موجود.'], 404);
        }

        $this->auditService->log(
            'download',
            $document,
            null,
            ['file' => $attachment->original_name],
            "File downloaded: {$attachment->original_name}"
        );

        return Storage::disk($attachment->disk)->download(
            $attachment->file_path,
            $attachment->original_name
        );
    }

    /**
     * Secure file preview — streams file inline.
     */
    public function preview(Request $request, int $docId, int $attId): mixed
    {
        $this->checkPermission('documents.view');

        $attachment = DocumentAttachment::where('document_id', $docId)->findOrFail($attId);

        if (!$attachment->is_previewable) {
            return response()->json([
                'success' => false,
                'message' => 'هذا النوع من الملفات لا يدعم المعاينة المباشرة.',
            ], 422);
        }

        if (!Storage::disk($attachment->disk)->exists($attachment->file_path)) {
            return response()->json(['success' => false, 'message' => 'الملف غير موجود.'], 404);
        }

        $fileContents = Storage::disk($attachment->disk)->get($attachment->file_path);

        return response($fileContents, 200)
            ->header('Content-Type', $attachment->mime_type)
            ->header('Content-Disposition', 'inline; filename="' . $attachment->original_name . '"')
            ->header('Content-Length', strlen($fileContents))
            ->header('Cache-Control', 'private, no-cache');
    }

    public function destroy(Request $request, int $docId, int $attId): JsonResponse
    {
        $this->checkPermission('attachments.delete');

        $document   = Document::findOrFail($docId);
        $attachment = DocumentAttachment::where('document_id', $docId)->findOrFail($attId);

        $this->auditService->log('delete', $document, ['file' => $attachment->original_name], null);
        $this->attachmentService->delete($attachment);

        return response()->json(['success' => true, 'message' => 'تم حذف الملف.']);
    }

    private function checkPermission(string $perm): void
    {
        if (!request()->user()->hasPermission($perm) && !request()->user()->isSuperAdmin()) {
            abort(403);
        }
    }
}
