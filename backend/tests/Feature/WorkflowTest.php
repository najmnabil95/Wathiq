<?php

namespace Tests\Feature;

use App\Models\DocumentType;
use App\Models\Role;
use App\Models\User;
use App\Models\Workflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_workflow_templates_and_steps(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $documentType = DocumentType::first();
        $itManagerRole = Role::where('name', 'it_manager')->first();

        $this->assertNotNull($admin);
        $this->assertNotNull($documentType);

        // 1. List seeded templates
        $listResponse = $this->actingAs($admin, 'sanctum')->getJson('/api/v1/workflows');
        $listResponse->assertStatus(200)->assertJsonPath('success', true);
        $this->assertNotEmpty($listResponse->json('data'));

        // 2. Create template with steps
        $createResponse = $this->actingAs($admin, 'sanctum')->postJson('/api/v1/workflows', [
            'document_type_id' => $documentType->id,
            'name'             => 'Test Approval Route',
            'name_ar'          => 'مسار اعتماد تجريبي',
            'description'      => 'قالب اختباري',
            'is_active'        => true,
            'steps'            => [
                ['name' => 'First Review', 'name_ar' => 'المراجعة الأولى', 'action_type' => 'review'],
                ['name' => 'Final Approval', 'name_ar' => 'الاعتماد النهائي', 'role_id' => $itManagerRole?->id],
            ],
        ]);

        $createResponse->assertStatus(201);
        $workflowId = $createResponse->json('data.id');
        $this->assertCount(2, $createResponse->json('data.steps'));

        // 3. Add a step
        $stepResponse = $this->actingAs($admin, 'sanctum')->postJson("/api/v1/workflows/{$workflowId}/steps", [
            'name'        => 'Audit Check',
            'name_ar'     => 'التحقق الرقابي',
            'action_type' => 'acknowledge',
        ]);
        $stepResponse->assertStatus(201);
        $stepId = $stepResponse->json('data.id');
        $this->assertEquals(3, $stepResponse->json('data.step_order'));

        // 4. Update the step
        $updateStepResponse = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/workflows/{$workflowId}/steps/{$stepId}", [
                'name_ar' => 'التحقق الرقابي النهائي',
            ]);
        $updateStepResponse->assertStatus(200);
        $this->assertEquals('التحقق الرقابي النهائي', $updateStepResponse->json('data.name_ar'));

        // 5. Update the template
        $updateResponse = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/workflows/{$workflowId}", ['is_active' => false]);
        $updateResponse->assertStatus(200);
        $this->assertFalse($updateResponse->json('data.is_active'));

        // 6. Delete the step then the template
        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/workflows/{$workflowId}/steps/{$stepId}")
            ->assertStatus(200);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/workflows/{$workflowId}")
            ->assertStatus(200);

        $this->assertNull(Workflow::find($workflowId));
    }

    public function test_workflow_viewer_without_roles_permission_can_fetch_assignable_roles(): void
    {
        $this->seed();

        $staff = User::whereHas('roles', fn ($q) => $q->where('name', 'it_staff'))->first();
        $this->assertNotNull($staff);
        $this->assertFalse($staff->hasPermission('roles.view'));

        $response = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/workflows/options/roles');

        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->assertNotEmpty($response->json('data'));
        $this->assertArrayHasKey('display_name_ar', $response->json('data.0'));
    }

    public function test_user_without_manage_permission_cannot_create_workflow(): void
    {
        $this->seed();

        $viewerRole = Role::where('name', 'viewer')->first();
        $documentType = DocumentType::first();

        $viewer = User::factory()->create(['status' => 'active']);
        if ($viewerRole) {
            $viewer->roles()->attach($viewerRole->id);
        }

        $response = $this->actingAs($viewer, 'sanctum')->postJson('/api/v1/workflows', [
            'document_type_id' => $documentType->id,
            'name'             => 'Unauthorized Template',
            'name_ar'          => 'قالب غير مصرح',
        ]);

        $response->assertStatus(403);
    }
}
