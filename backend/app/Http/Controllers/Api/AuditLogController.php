<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('audit.view') && !$request->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية لعرض سجل العمليات.');
        }

        $logs = $this->filteredQuery($request)
            ->with(['user:id,name', 'auditable'])
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 25));

        return response()->json(['success' => true, 'data' => $logs]);
    }

    /**
     * GET /api/v1/audit-logs/export
     * Streams a UTF-8 CSV of the tamper-evident audit trail matching the filters.
     */
    public function export(Request $request): StreamedResponse
    {
        if (!$request->user()->hasPermission('audit.export') && !$request->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية لتصدير سجل العمليات.');
        }

        $logs = $this->filteredQuery($request)
            ->with(['user:id,name', 'auditable'])
            ->orderByDesc('created_at')
            ->limit(5000)
            ->get();

        $this->auditService->log(
            'audit.export',
            null,
            null,
            ['count' => $logs->count(), 'filters' => $request->only(['user_id', 'action', 'from', 'to'])],
            'Audit trail CSV exported by ' . $request->user()->name
        );

        $filename = 'edms_audit_logs_' . now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($logs) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                '#', 'التاريخ والوقت', 'المستخدم', 'نوع العملية', 'البيان والوصف',
                'رقم الوثيقة', 'عنوان IP', 'المتصفح',
            ]);

            foreach ($logs as $index => $log) {
                $documentNumber = $log->auditable instanceof Document
                    ? $log->auditable->document_number
                    : '—';

                fputcsv($out, [
                    $index + 1,
                    $log->created_at?->format('Y-m-d H:i:s') ?: '—',
                    $log->user?->name ?: 'النظام التلقائي',
                    $log->action,
                    $log->description ?: '—',
                    $documentNumber,
                    $log->ip_address ?: '—',
                    $log->user_agent ?: '—',
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type'     => 'text/csv; charset=UTF-8',
            'X-Exported-Count' => (string) $logs->count(),
        ]);
    }

    /**
     * GET /api/v1/audit-logs/verify
     * Recomputes the SHA-256 hash chain over every audit entry.
     */
    public function verifyIntegrity(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('audit.verify_integrity') && !$request->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية التحقق من نزاهة سجل العمليات.');
        }

        $expectedPrevious = null;
        $scanned = 0;
        $verified = 0;
        $legacy = 0;
        $brokenAt = null;
        $reason = null;

        foreach (AuditLog::orderBy('id')->cursor() as $log) {
            $scanned++;

            if ($log->hash === null) {
                $legacy++;
                $expectedPrevious = null;
                continue;
            }

            if ($log->previous_hash !== $expectedPrevious) {
                $brokenAt = $log->id;
                $reason = 'سلسلة التجزئة مقطوعة: رابط previous_hash لا يطابق السجل السابق.';
                break;
            }

            $recomputed = $this->auditService->computeHash([
                'user_id'        => $log->user_id,
                'action'         => $log->action,
                'auditable_type' => $log->auditable_type,
                'auditable_id'   => $log->auditable_id,
                'old_values'     => $log->old_values,
                'new_values'     => $log->new_values,
                'ip_address'     => $log->ip_address,
                'user_agent'     => $log->user_agent,
                'description'    => $log->description,
                'created_at'     => $log->created_at?->format('Y-m-d H:i:s'),
            ], $log->previous_hash);

            if (!hash_equals($log->hash, $recomputed)) {
                $brokenAt = $log->id;
                $reason = 'بصمة السجل لا تطابق محتواه: تم تعديل بيانات السجل بعد تسجيله.';
                break;
            }

            $expectedPrevious = $log->hash;
            $verified++;
        }

        $valid = $brokenAt === null;

        $this->auditService->log(
            'audit.verify',
            null,
            null,
            [
                'scanned'  => $scanned,
                'verified' => $verified,
                'legacy'   => $legacy,
                'valid'    => $valid,
                'broken_at' => $brokenAt,
            ],
            $valid
                ? 'Audit hash-chain integrity verified'
                : "Audit hash-chain integrity FAILED at entry #{$brokenAt}"
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'valid'             => $valid,
                'scanned_entries'   => $scanned,
                'verified_entries'  => $verified,
                'legacy_entries'    => $legacy,
                'broken_at'         => $brokenAt,
                'reason'            => $reason,
                'algorithm'         => 'SHA-256',
                'verified_at'       => now()->toIso8601String(),
                'verified_by'       => $request->user()->name,
            ],
        ]);
    }

    public function forDocument(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->hasPermission('documents.view') && !$request->user()->isSuperAdmin()) {
            abort(403);
        }

        Document::findVisibleOrFail($id, $request->user());

        $logs = AuditLog::with(['user'])
            ->where('auditable_type', Document::class)
            ->where('auditable_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $logs]);
    }

    private function filteredQuery(Request $request)
    {
        return AuditLog::query()
            ->when($request->input('user_id'), fn ($q, $v) => $q->where('user_id', $v))
            ->when($request->input('action'), fn ($q, $v) => $q->where('action', $v))
            ->when($request->input('from'), fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('to'), fn ($q, $v) => $q->whereDate('created_at', '<=', $v));
    }
}
