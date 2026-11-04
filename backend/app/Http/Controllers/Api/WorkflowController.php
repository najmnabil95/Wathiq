<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Role;
use App\Models\Workflow;
use App\Models\WorkflowStep;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkflowController extends Controller
{
    public function __construct(private readonly AuditService $auditService) {}

    /**
     * List workflow templates (optionally filtered by document type).
     */
    public function index(Request $request): JsonResponse
    {
        $this->checkPermission('workflows.view');

        $workflows = Workflow::with([
            'documentType:id,name,name_ar,code',
            'steps.role:id,name,display_name,display_name_ar',
        ])
            ->when($request->input('document_type_id'), fn ($q, $v) => $q->where('document_type_id', (int) $v))
            ->when($request->boolean('active_only'), fn ($q) => $q->where('is_active', true))
            ->orderBy('document_type_id')
            ->orderBy('id')
            ->get();

        return response()->json(['success' => true, 'data' => $workflows]);
    }

    /**
     * Lightweight role list for workflow step assignment.
     * Available to anyone who can view workflows (not just roles.view holders).
     */
    public function roles(): JsonResponse
    {
        $this->checkPermission('workflows.view');

        return response()->json([
            'success' => true,
            'data'    => Role::orderBy('id')->get(['id', 'name', 'display_name', 'display_name_ar']),
        ]);
    }

    public function show(int $id): JsonResponse
    {        $this->checkPermission('workflows.view');

        $workflow = Workflow::with([
            'documentType:id,name,name_ar,code',
            'steps.role:id,name,display_name,display_name_ar',
        ])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $workflow]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $validated = $request->validate([
            'document_type_id'      => ['required', 'exists:document_types,id'],
            'name'                  => ['required', 'string', 'max:150'],
            'name_ar'               => ['required', 'string', 'max:150'],
            'description'           => ['nullable', 'string', 'max:1000'],
            'is_active'             => ['sometimes', 'boolean'],
            'steps'                 => ['nullable', 'array'],
            'steps.*.name'          => ['required_with:steps', 'string', 'max:150'],
            'steps.*.name_ar'       => ['required_with:steps', 'string', 'max:150'],
            'steps.*.role_id'       => ['nullable', 'exists:roles,id'],
            'steps.*.step_order'    => ['nullable', 'integer', 'min:1'],
            'steps.*.is_required'   => ['sometimes', 'boolean'],
            'steps.*.action_type'   => ['sometimes', 'string', 'in:approve,review,acknowledge'],
            'steps.*.instructions'  => ['nullable', 'string', 'max:1000'],
        ]);

        $workflow = DB::transaction(function () use ($validated) {
            $workflow = Workflow::create([
                'document_type_id' => $validated['document_type_id'],
                'name'             => $validated['name'],
                'name_ar'          => $validated['name_ar'],
                'description'      => $validated['description'] ?? null,
                'is_active'        => $validated['is_active'] ?? true,
            ]);

            foreach ($validated['steps'] ?? [] as $index => $step) {
                $workflow->steps()->create([
                    'name'         => $step['name'],
                    'name_ar'      => $step['name_ar'],
                    'role_id'      => $step['role_id'] ?? null,
                    'step_order'   => $step['step_order'] ?? ($index + 1),
                    'is_required'  => $step['is_required'] ?? true,
                    'action_type'  => $step['action_type'] ?? 'approve',
                    'instructions' => $step['instructions'] ?? null,
                ]);
            }

            return $workflow;
        });

        $this->auditService->log('workflow.create', $workflow, null, [
            'name' => $workflow->name,
            'steps' => $workflow->steps()->count(),
        ], "Workflow template created: {$workflow->name}");

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء قالب سير العمل بنجاح.',
            'data'    => $workflow->load(['documentType:id,name,name_ar,code', 'steps.role']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $workflow = Workflow::findOrFail($id);

        $validated = $request->validate([
            'document_type_id' => ['sometimes', 'exists:document_types,id'],
            'name'             => ['sometimes', 'string', 'max:150'],
            'name_ar'          => ['sometimes', 'string', 'max:150'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'is_active'        => ['sometimes', 'boolean'],
        ]);

        [$old, $new] = $this->auditService->getDiff($workflow->fill($validated));
        $workflow->save();
        $this->auditService->log('workflow.update', $workflow, $old, $new);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث قالب سير العمل بنجاح.',
            'data'    => $workflow->load(['documentType:id,name,name_ar,code', 'steps.role']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $workflow = Workflow::with('steps')->findOrFail($id);
        $stepIds = $workflow->steps->pluck('id');

        if ($stepIds->isNotEmpty() && Approval::whereIn('workflow_step_id', $stepIds)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف القالب لوجود اعتمادات مرتبطة بمراحله. يمكنك تعطيله بدلاً من ذلك.',
            ], 422);
        }

        DB::transaction(function () use ($workflow) {
            $workflow->steps()->delete();
            $workflow->delete();
        });

        $this->auditService->log('workflow.delete', $workflow, ['name' => $workflow->name], null, "Workflow template deleted: {$workflow->name}");

        return response()->json(['success' => true, 'message' => 'تم حذف قالب سير العمل.']);
    }

    // ─── Steps ─────────────────────────────────────────────────────

    public function storeStep(Request $request, int $workflowId): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $workflow = Workflow::findOrFail($workflowId);

        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:150'],
            'name_ar'      => ['required', 'string', 'max:150'],
            'role_id'      => ['nullable', 'exists:roles,id'],
            'step_order'   => ['nullable', 'integer', 'min:1'],
            'is_required'  => ['sometimes', 'boolean'],
            'action_type'  => ['sometimes', 'string', 'in:approve,review,acknowledge'],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        $step = $workflow->steps()->create([
            'name'         => $validated['name'],
            'name_ar'      => $validated['name_ar'],
            'role_id'      => $validated['role_id'] ?? null,
            'step_order'   => $validated['step_order'] ?? ((int) $workflow->steps()->max('step_order') + 1),
            'is_required'  => $validated['is_required'] ?? true,
            'action_type'  => $validated['action_type'] ?? 'approve',
            'instructions' => $validated['instructions'] ?? null,
        ]);

        $this->auditService->log('workflow_step.create', $workflow, null, ['step' => $step->name], "Workflow step added: {$step->name}");

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المرحلة بنجاح.',
            'data'    => $step->load('role:id,name,display_name,display_name_ar'),
        ], 201);
    }

    public function updateStep(Request $request, int $workflowId, int $stepId): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $workflow = Workflow::findOrFail($workflowId);
        $step = WorkflowStep::where('workflow_id', $workflow->id)->findOrFail($stepId);

        $validated = $request->validate([
            'name'         => ['sometimes', 'string', 'max:150'],
            'name_ar'      => ['sometimes', 'string', 'max:150'],
            'role_id'      => ['nullable', 'exists:roles,id'],
            'step_order'   => ['sometimes', 'integer', 'min:1'],
            'is_required'  => ['sometimes', 'boolean'],
            'action_type'  => ['sometimes', 'string', 'in:approve,review,acknowledge'],
            'instructions' => ['nullable', 'string', 'max:1000'],
        ]);

        $step->update($validated);

        $this->auditService->log('workflow_step.update', $workflow, null, ['step' => $step->name], "Workflow step updated: {$step->name}");

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث المرحلة بنجاح.',
            'data'    => $step->load('role:id,name,display_name,display_name_ar'),
        ]);
    }

    public function destroyStep(int $workflowId, int $stepId): JsonResponse
    {
        $this->checkPermission('workflows.manage');

        $workflow = Workflow::findOrFail($workflowId);
        $step = WorkflowStep::where('workflow_id', $workflow->id)->findOrFail($stepId);

        if (Approval::where('workflow_step_id', $step->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف هذه المرحلة لوجود اعتمادات مرتبطة بها.',
            ], 422);
        }

        $stepName = $step->name;
        $step->delete();

        $this->auditService->log('workflow_step.delete', $workflow, ['step' => $stepName], null, "Workflow step deleted: {$stepName}");

        return response()->json(['success' => true, 'message' => 'تم حذف المرحلة.']);
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
