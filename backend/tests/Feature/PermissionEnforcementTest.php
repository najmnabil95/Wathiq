<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PermissionEnforcementTest extends TestCase
{
    use RefreshDatabase;

    private function makeDocument(User $creator, array $overrides = []): Document
    {
        $type = DocumentType::firstOrFail();
        $category = Category::firstOrFail();
        $status = Status::where('name', 'new')->firstOrFail();

        return Document::create(array_merge([
            'document_number'          => 'PERM-' . uniqid(),
            'title'                    => 'وثيقة اختبار الصلاحيات',
            'document_type_id'         => $type->id,
            'category_id'              => $category->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => $status->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ], $overrides));
    }

    private function userWithRole(string $role): User
    {
        $user = User::whereHas('roles', fn ($q) => $q->where('name', $role))->first();

        if (!$user) {
            $user = User::create([
                'name'          => "Test {$role}",
                'username'      => "test_{$role}_" . uniqid(),
                'email'         => "test_{$role}_" . uniqid() . '@edms.local',
                'password'      => 'Secret@12345',
                'status'        => 'active',
                'department_id' => Department::firstOrFail()->id,
            ]);
            $user->roles()->attach(Role::where('name', $role)->firstOrFail());
        }

        return $user;
    }

    public function test_attachment_listing_requires_attachments_view(): void
    {
        Storage::fake('local');
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $doc = $this->makeDocument($viewer);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/attachments")
            ->assertStatus(200);

        $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/attachments", [
                'file' => UploadedFile::fake()->create('note.txt', 1, 'text/plain'),
            ])
            ->assertStatus(403);

        $staff = $this->userWithRole('it_staff');
        $staffDoc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$staffDoc->id}/attachments", [
                'file' => UploadedFile::fake()->create('note.txt', 1, 'text/plain'),
            ])
            ->assertStatus(201);
    }

    public function test_version_listing_and_creation_require_version_permissions(): void
    {
        Storage::fake('local');
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $doc = $this->makeDocument($viewer);

        $this->actingAs($viewer, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/versions")
            ->assertStatus(200);

        $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/versions", [
                'version_number' => '2.0',
                'change_summary' => 'محاولة إنشاء إصدار بدون صلاحية',
            ])
            ->assertStatus(403);

        $staff = $this->userWithRole('it_staff');
        $staffDoc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$staffDoc->id}/versions", [
                'file'           => UploadedFile::fake()->create('v2.pdf', 100, 'application/pdf'),
                'version_number' => '2.0',
                'change_summary' => 'تحديث موثق للنسخة الثانية',
            ])
            ->assertStatus(201);
    }

    public function test_comment_creation_requires_comments_create(): void
    {
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $doc = $this->makeDocument($viewer);

        $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/comments", ['comment' => 'ملاحظة غير مصرح بها'])
            ->assertStatus(403);

        $staff = $this->userWithRole('it_staff');
        $staffDoc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$staffDoc->id}/comments", ['comment' => 'ملاحظة إدارية موثقة'])
            ->assertStatus(200);

        $this->assertDatabaseHas('comments', [
            'document_id' => $staffDoc->id,
            'user_id'     => $staff->id,
            'comment'     => 'ملاحظة إدارية موثقة',
        ]);
    }

    public function test_batch_status_change_requires_change_status_permission(): void
    {
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $doc = $this->makeDocument($viewer);
        $target = Status::where('name', 'in_progress')->firstOrFail();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/v1/documents/batch', [
                'action'    => 'change_status',
                'ids'       => [$doc->id],
                'status_id' => $target->id,
            ])
            ->assertStatus(403);

        $staff = $this->userWithRole('it_staff');
        $staffDoc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents/batch', [
                'action'    => 'change_status',
                'ids'       => [$staffDoc->id],
                'status_id' => $target->id,
            ])
            ->assertStatus(200);

        $this->assertEquals($target->id, $staffDoc->fresh()->status_id);
    }

    public function test_workflow_submission_requires_workflows_submit(): void
    {
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $approver = $this->userWithRole('approver');
        $doc = $this->makeDocument($viewer);

        $this->actingAs($viewer, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/approvals", ['approver_id' => $approver->id])
            ->assertStatus(403);

        $staff = $this->userWithRole('it_staff');
        $staffDoc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$staffDoc->id}/approvals", [
                'approver_id' => $approver->id,
                'comments'    => 'إحالة للاعتماد',
            ])
            ->assertStatus(201);
    }

    public function test_workflow_decision_requires_approve_or_reject_permission(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $approver = $this->userWithRole('approver');
        $staff = $this->userWithRole('it_staff');

        // Staff is the designated approver here but lacks workflows.approve
        $docA = $this->makeDocument($admin);
        $requestA = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$docA->id}/approvals", ['approver_id' => $staff->id])
            ->assertStatus(201);

        $this->actingAs($staff, 'sanctum')
            ->putJson("/api/v1/documents/{$docA->id}/approvals/{$requestA->json('data.id')}", ['decision' => 'approved'])
            ->assertStatus(403);

        // Designated approver with workflows.approve can decide
        $docB = $this->makeDocument($admin);
        $requestB = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$docB->id}/approvals", ['approver_id' => $approver->id])
            ->assertStatus(201);

        $this->actingAs($approver, 'sanctum')
            ->putJson("/api/v1/documents/{$docB->id}/approvals/{$requestB->json('data.id')}", ['decision' => 'approved'])
            ->assertStatus(200);

        // Staff is again the designated approver but lacks workflows.reject
        $docC = $this->makeDocument($admin);
        $requestC = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$docC->id}/approvals", ['approver_id' => $staff->id])
            ->assertStatus(201);

        $this->actingAs($staff, 'sanctum')
            ->putJson("/api/v1/documents/{$docC->id}/approvals/{$requestC->json('data.id')}", ['decision' => 'rejected'])
            ->assertStatus(403);

        // Designated approver with workflows.reject can decide
        $docD = $this->makeDocument($admin);
        $requestD = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$docD->id}/approvals", ['approver_id' => $approver->id])
            ->assertStatus(201);

        $this->actingAs($approver, 'sanctum')
            ->putJson("/api/v1/documents/{$docD->id}/approvals/{$requestD->json('data.id')}", ['decision' => 'rejected'])
            ->assertStatus(200);
    }

    public function test_audit_export_requires_audit_export_permission(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/audit-logs/export')
            ->assertStatus(403);

        $auditor = $this->userWithRole('auditor');

        $response = $this->actingAs($auditor, 'sanctum')
            ->get('/api/v1/audit-logs/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('X-Exported-Count');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('التاريخ والوقت', $csv);
        $this->assertStringContainsString('نوع العملية', $csv);
    }
}
