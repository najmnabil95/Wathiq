<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('audit.view') && !$request->user()->isSuperAdmin()) {
            abort(403, 'ليس لديك صلاحية لعرض سجل العمليات.');
        }

        $logs = AuditLog::with(['user'])
            ->when($request->input('user_id'), fn ($q, $v) => $q->where('user_id', $v))
            ->when($request->input('action'), fn ($q, $v) => $q->where('action', $v))
            ->when($request->input('from'), fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($request->input('to'), fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 25));

        return response()->json(['success' => true, 'data' => $logs]);
    }

    public function forDocument(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->hasPermission('documents.view') && !$request->user()->isSuperAdmin()) {
            abort(403);
        }

        $logs = AuditLog::with(['user'])
            ->where('auditable_type', \App\Models\Document::class)
            ->where('auditable_id', $id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $logs]);
    }
}
