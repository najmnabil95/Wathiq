<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => Organization::when($request->input('type'), fn ($q, $v) => $q->ofType($v))
                ->when($request->boolean('active_only'), fn ($q) => $q->active())
                ->get(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(['success' => true, 'data' => Organization::findOrFail($id)]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('organizations.manage');

        $validated = $request->validate([
            'name'           => ['required', 'string', 'max:200'],
            'name_ar'        => ['nullable', 'string', 'max:200'],
            'type'           => ['required', 'in:internal,external,vendor,government'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email'],
            'address'        => ['nullable', 'string'],
            'notes'          => ['nullable', 'string'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        $org = Organization::create($validated);
        $this->auditService->log('create', $org, null, $validated);

        return response()->json(['success' => true, 'data' => $org], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('organizations.manage');

        $org = Organization::findOrFail($id);

        $validated = $request->validate([
            'name'           => ['sometimes', 'string', 'max:200'],
            'name_ar'        => ['nullable', 'string', 'max:200'],
            'type'           => ['sometimes', 'in:internal,external,vendor,government'],
            'contact_person' => ['nullable', 'string', 'max:150'],
            'phone'          => ['nullable', 'string', 'max:30'],
            'email'          => ['nullable', 'email'],
            'address'        => ['nullable', 'string'],
            'notes'          => ['nullable', 'string'],
            'is_active'      => ['sometimes', 'boolean'],
        ]);

        [$old, $new] = $this->auditService->getDiff($org->fill($validated));
        $org->save();
        $this->auditService->log('update', $org, $old, $new);

        return response()->json(['success' => true, 'data' => $org]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->checkPermission('organizations.manage');

        $org = Organization::findOrFail($id);

        if ($org->documents()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف الجهة لأنها مرتبطة بوثائق.',
            ], 422);
        }

        $this->auditService->log('delete', $org, $org->toArray(), null);
        $org->delete();

        return response()->json(['success' => true, 'message' => 'تم حذف الجهة.']);
    }

    private function checkPermission(string $perm): void
    {
        if (!request()->user()->hasPermission($perm) && !request()->user()->isSuperAdmin()) {
            abort(403);
        }
    }
}
