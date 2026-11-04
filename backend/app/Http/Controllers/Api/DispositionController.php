<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Setting;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DispositionController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function eligible(Request $request): JsonResponse
    {
        $this->authorizeDisposition($request);

        $documents = Document::with(['category', 'department', 'status', 'confidentialityLevel'])
            ->where('disposition_status', 'active')
            ->whereNotNull('retention_until')
            ->whereDate('retention_until', '<=', now()->toDateString())
            ->where('legal_hold', false)
            ->when($request->input('q'), fn ($query, $value) => $query->where(function ($inner) use ($value) {
                $inner->where('document_number', 'like', "%{$value}%")
                      ->orWhere('title', 'like', "%{$value}%");
            }))
            ->orderBy('retention_until')
            ->paginate((int) $request->input('per_page', 15));

        return response()->json(['success' => true, 'data' => $documents]);
    }

    public function updateRetention(Request $request, int $id): JsonResponse
    {
        $this->authorizeDisposition($request);

        $document = Document::findVisibleOrFail($id, $request->user());

        $validated = $request->validate([
            'retention_years' => ['nullable', 'integer', 'in:1,3,5,7,10,15,25,99'],
            'retention_until' => ['nullable', 'date', 'after:today'],
            'reason'          => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        if (empty($validated['retention_years']) && empty($validated['retention_until'])) {
            return response()->json([
                'success' => false,
                'message' => 'يجب تحديد مدة الاحتفاظ بالسنوات أو تاريخ انتهاء صريح.',
            ], 422);
        }

        $old = [
            'retention_years' => $document->retention_years,
            'retention_until' => $document->retention_until?->toDateString(),
        ];

        $years = $validated['retention_years'] ?? null;
        $until = $validated['retention_until'] ?? null;

        if ($until === null) {
            $until = $years >= 99
                ? null
                : $document->retention_until?->copy()->max(Carbon::today())->addYears($years)->toDateString();
        }

        $document->update([
            'retention_years' => $years ?? $document->retention_years,
            'retention_until' => $until,
            'disposition_status' => 'active',
        ]);

        $this->auditService->log(
            'retention.update',
            $document,
            $old,
            [
                'retention_years' => $document->retention_years,
                'retention_until' => $document->retention_until?->toDateString(),
                'reason'          => $validated['reason'],
            ],
            "Retention schedule updated for document {$document->document_number}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث سياسة الاحتفاظ بالوثيقة.',
            'data'    => $document->fresh(['category', 'department', 'status', 'confidentialityLevel']),
        ]);
    }

    public function dispose(Request $request, int $id): JsonResponse
    {
        $this->authorizeDisposition($request);

        $document = Document::findVisibleOrFail($id, $request->user());

        if ($document->hasActiveLegalHold()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن استبعاد وثيقة خاضعة لحجز قانوني. يجب رفع الحجز أولاً.',
            ], 422);
        }

        if ($document->disposition_status === 'disposed') {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة مستبعدة مسبقاً وفق جدول الاستبقاء.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $document->update([
            'disposition_status' => 'disposed',
            'disposed_at'        => now(),
            'disposed_by'        => $request->user()->id,
            'is_archived'        => true,
            'archived_at'        => $document->archived_at ?? now(),
        ]);

        $this->auditService->log(
            'disposition.dispose',
            $document,
            ['disposition_status' => 'active', 'is_archived' => false],
            [
                'disposition_status' => 'disposed',
                'is_archived'        => true,
                'reason'             => $validated['reason'],
            ],
            "Document {$document->document_number} disposed at end of retention period"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم استبعاد الوثيقة وفق سياسة الاحتفاظ المعتمدة.',
            'data'    => $document->fresh(['category', 'department', 'status', 'confidentialityLevel']),
        ]);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $this->authorizeDisposition($request);

        $document = Document::findVisibleOrFail($id, $request->user());

        if ($document->disposition_status !== 'disposed') {
            return response()->json([
                'success' => false,
                'message' => 'الوثيقة ليست مستبعدة حالياً.',
            ], 422);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:1000'],
        ]);

        $document->update([
            'disposition_status' => 'active',
            'disposed_at'        => null,
            'disposed_by'        => null,
        ]);

        $this->auditService->log(
            'disposition.restore',
            $document,
            ['disposition_status' => 'disposed'],
            ['disposition_status' => 'active', 'reason' => $validated['reason']],
            "Disposition reversed for document {$document->document_number}"
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء استبعاد الوثيقة وإعادتها للدورة النشطة.',
            'data'    => $document->fresh(['category', 'department', 'status', 'confidentialityLevel']),
        ]);
    }

    private function authorizeDisposition(Request $request): void
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'غير مصرح.');
        }

        if (!$user->isSuperAdmin() && !$user->hasPermission('disposition.manage')) {
            abort(403, 'ليس لديك صلاحية إدارة الاستبعاد وجداول الاستبقاء.');
        }
    }
}
