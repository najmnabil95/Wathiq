<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Document;
use App\Models\Status;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/v1/dashboard/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        // Base query — super admin sees all, others see based on dept
        $baseQuery = Document::query();
        if (!$user->isSuperAdmin() && !$user->hasRole('it_manager')) {
            $baseQuery->where('department_id', $user->department_id);
        }

        $currentMonth = now()->startOfMonth();

        $stats = [
            'total_documents'       => (clone $baseQuery)->count(),
            'this_month_documents'  => (clone $baseQuery)->where('created_at', '>=', $currentMonth)->count(),
            'new_documents'         => (clone $baseQuery)->whereHas('status', fn($q) => $q->where('name', 'new'))->count(),
            'in_progress_documents' => (clone $baseQuery)->whereHas('status', fn($q) => $q->where('name', 'in_progress'))->count(),
            'pending_approval'      => (clone $baseQuery)->whereHas('status', fn($q) => $q->where('name', 'pending_approval'))->count(),
            'completed_documents'   => (clone $baseQuery)->whereHas('status', fn($q) => $q->where('name', 'completed'))->count(),
            'archived_documents'    => (clone $baseQuery)->where('is_archived', true)->count(),

            // Category-specific stats
            'access_requests'       => (clone $baseQuery)->whereHas('category', fn($q) => $q->where('code', 'ACCESS'))->count(),
            'user_requests'         => (clone $baseQuery)->whereHas('category', fn($q) => $q->where('code', 'USER_MGMT'))->count(),
            'cctv_reviews'          => (clone $baseQuery)->whereHas('category', fn($q) => $q->where('code', 'CCTV'))->count(),

            // By confidentiality
            'highly_confidential'   => (clone $baseQuery)->whereHas('confidentialityLevel', fn($q) => $q->where('name', 'highly_confidential'))->count(),

            // Pending approvals for current user
            'my_pending_approvals'  => Approval::where('approver_id', $user->id)->where('status', 'pending')->count(),
        ];

        // Documents by category
        $byCategory = (clone $baseQuery)
            ->join('categories', 'documents.category_id', '=', 'categories.id')
            ->select('categories.name_ar', 'categories.name', 'categories.color', 'categories.icon', DB::raw('count(*) as total'))
            ->groupBy('categories.id', 'categories.name_ar', 'categories.name', 'categories.color', 'categories.icon')
            ->orderByDesc('total')
            ->limit(8)
            ->get();

        // Documents by month (last 12 months)
        $byMonth = DB::table('documents')
            ->select(
                DB::raw('DATE_FORMAT(document_date, "%Y-%m") as month'),
                DB::raw('count(*) as total')
            )
            ->whereNull('deleted_at')
            ->where('document_date', '>=', now()->subMonths(11)->startOfMonth())
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'stats'      => $stats,
                'by_category'=> $byCategory,
                'by_month'   => $byMonth,
            ],
        ]);
    }

    /**
     * GET /api/v1/dashboard/recent-documents
     */
    public function recentDocuments(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Document::with(['category', 'status', 'creator', 'department', 'confidentialityLevel'])
            ->notArchived()
            ->orderByDesc('created_at')
            ->limit(10);

        if (!$user->isSuperAdmin() && !$user->hasRole('it_manager')) {
            $query->where('department_id', $user->department_id);
        }

        return response()->json([
            'success' => true,
            'data'    => $query->get(),
        ]);
    }

    /**
     * GET /api/v1/dashboard/pending-approvals
     */
    public function pendingApprovals(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Approval::with(['document.category', 'document.status', 'workflowStep'])
            ->where('status', 'pending');

        if (!$user->isSuperAdmin() && !$user->hasRole('it_manager')) {
            $query->where('approver_id', $user->id);
        }

        $approvals = $query->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $approvals,
        ]);
    }

    /**
     * GET /api/v1/dashboard/activity
     */
    public function activity(Request $request): JsonResponse
    {
        $logs = \App\Models\AuditLog::with(['user'])
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $logs,
        ]);
    }
}
