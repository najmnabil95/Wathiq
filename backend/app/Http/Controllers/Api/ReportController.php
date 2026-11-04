<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    /**
     * GET /api/v1/reports/documents/export
     * Streams a UTF-8 CSV of documents matching the current filters.
     * `bulk=1` exports the full filtered result set and requires reports.advanced.
     */
    public function exportDocuments(Request $request): StreamedResponse
    {
        $this->checkPermission('reports.export');

        $bulk = $request->boolean('bulk');

        if ($bulk) {
            $this->checkPermission('reports.advanced');
        }

        $user = $request->user();

        $query = Document::with(['category', 'department', 'status', 'confidentialityLevel', 'creator'])
            ->visibleTo($user)
            ->search($request->input('q'))
            ->byCategory($request->input('category_id') ? (int) $request->input('category_id') : null)
            ->byDocumentType($request->input('document_type_id') ? (int) $request->input('document_type_id') : null)
            ->byDepartment($request->input('department_id') ? (int) $request->input('department_id') : null)
            ->byStatus($request->input('status_id') ? (int) $request->input('status_id') : null)
            ->byConfidentialityLevel($request->input('confidentiality_level_id') ? (int) $request->input('confidentiality_level_id') : null)
            ->dateRange($request->input('date_from'), $request->input('date_to'))
            ->when($request->boolean('archived'), fn ($q) => $q->archived(), fn ($q) => $q->notArchived())
            ->when($request->boolean('pending'), fn ($q) => $q->whereHas('status', fn ($sq) => $sq->where('name', 'pending_approval')))
            ->when($request->filled('status'), fn ($q) => $q->whereHas('status', fn ($sq) => $sq->where('name', $request->input('status'))))
            ->when($request->filled('category_code'), fn ($q) => $q->whereHas('category', fn ($cq) => $cq->where('code', $request->input('category_code'))))
            ->orderByDesc('created_at');

        $documents = $query->limit($bulk ? 5000 : 500)->get();

        $this->auditService->log(
            'reports.export',
            null,
            null,
            ['count' => $documents->count(), 'bulk' => $bulk, 'filters' => $request->only([
                'q', 'category_id', 'document_type_id', 'department_id', 'status_id',
                'confidentiality_level_id', 'date_from', 'date_to', 'archived', 'status', 'category_code',
            ])],
            'Documents CSV report exported by ' . $user->name
        );

        $filename = 'edms_documents_' . now()->format('Y-m-d_His') . '.csv';

        return response()->streamDownload(function () use ($documents) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                '#', 'رقم الوثيقة', 'العنوان', 'التصنيف', 'القسم / الإدارة',
                'الحالة', 'مستوى السرية', 'تاريخ الوثيقة', 'تاريخ الإنشاء',
                'المُنشئ', 'الموقع الفيزيائي للأرشيف',
            ]);

            foreach ($documents as $index => $doc) {
                fputcsv($out, [
                    $index + 1,
                    $doc->document_number,
                    $doc->title,
                    $doc->category?->name_ar ?: $doc->category?->name ?: '—',
                    $doc->department?->name_ar ?: $doc->department?->name ?: '—',
                    $doc->status?->label_ar ?: $doc->status?->name ?: '—',
                    $doc->confidentialityLevel?->label_ar ?: $doc->confidentialityLevel?->name ?: '—',
                    optional($doc->document_date)->format('Y-m-d') ?: '—',
                    optional($doc->created_at)->format('Y-m-d') ?: '—',
                    $doc->creator?->name ?: '—',
                    $doc->physical_location ?: '—',
                ]);
            }

            fclose($out);
        }, $filename, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'X-Exported-Count'    => (string) $documents->count(),
            'X-Export-Scope'      => $bulk ? 'bulk' : 'filtered',
        ]);
    }

    private function checkPermission(string $perm): void
    {
        $user = request()->user();

        if (!$user) {
            abort(401, 'غير مصرح.');
        }

        if (!$user->hasPermission($perm) && !$user->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية للقيام بهذه العملية.');
        }
    }
}
