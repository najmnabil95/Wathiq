<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentAccessControlTest extends TestCase
{
    use RefreshDatabase;

    private function makeDocument(User $creator, array $overrides = []): Document
    {
        $type = DocumentType::firstOrFail();
        $category = Category::firstOrFail();
        $status = Status::where('name', 'new')->firstOrFail();

        return Document::create(array_merge([
            'document_number'          => 'TEST-' . uniqid(),
            'title'                    => 'وثيقة اختبار صلاحيات الوصول',
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
                'name'         => "Test {$role}",
                'username'     => "test_{$role}_" . uniqid(),
                'email'        => "test_{$role}_" . uniqid() . '@edms.local',
                'password'     => 'Secret@12345',
                'status'       => 'active',
                'department_id' => Department::firstOrFail()->id,
            ]);
            $user->roles()->attach(\App\Models\Role::where('name', $role)->firstOrFail());
        }

        return $user;
    }

    public function test_staff_cannot_view_confidential_document_from_other_department(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $staff = $this->userWithRole('it_staff');
        $otherDept = Department::where('id', '!=', $staff->department_id)->firstOrFail();

        $doc = $this->makeDocument($admin, [
            'department_id'            => $otherDept->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'confidential')->firstOrFail()->id,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}")
            ->assertStatus(404);

        $list = $this->actingAs($staff, 'sanctum')->getJson('/api/v1/documents');
        $list->assertStatus(200);
        $this->assertNotContains($doc->id, collect($list->json('data.data'))->pluck('id')->all());
    }

    public function test_staff_cannot_view_internal_document_from_other_department(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $staff = $this->userWithRole('it_staff');
        $otherDept = Department::where('id', '!=', $staff->department_id)->firstOrFail();

        $doc = $this->makeDocument($admin, ['department_id' => $otherDept->id]);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}")
            ->assertStatus(404);
    }

    public function test_staff_retains_access_to_own_confidential_document(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');
        $doc = $this->makeDocument($staff, [
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'confidential')->firstOrFail()->id,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $doc->id);
    }

    public function test_manager_and_auditor_see_confidential_documents_across_departments(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $otherDept = Department::where('id', '!=', $admin->department_id)->firstOrFail();

        $doc = $this->makeDocument($admin, [
            'department_id'            => $otherDept->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'confidential')->firstOrFail()->id,
        ]);

        foreach (['it_manager', 'auditor'] as $role) {
            $this->actingAs($this->userWithRole($role), 'sanctum')
                ->getJson("/api/v1/documents/{$doc->id}")
                ->assertStatus(200);
        }
    }

    public function test_staff_without_assign_permission_cannot_create_confidential_document(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');

        $basePayload = [
            'title'                    => 'وثيقة سرية غير مصرح بإنشائها',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $staff->department_id,
            'document_date'            => now()->toDateString(),
        ];

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents', array_merge($basePayload, [
                'confidentiality_level_id' => ConfidentialityLevel::where('name', 'confidential')->firstOrFail()->id,
            ]))
            ->assertStatus(403);

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents', array_merge($basePayload, [
                'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            ]))
            ->assertStatus(201);
    }

    public function test_staff_cannot_escalate_document_confidentiality_without_permission(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');
        $doc = $this->makeDocument($staff);

        $this->actingAs($staff, 'sanctum')
            ->putJson("/api/v1/documents/{$doc->id}", [
                'confidentiality_level_id' => ConfidentialityLevel::where('name', 'highly_confidential')->firstOrFail()->id,
            ])
            ->assertStatus(403);

        $this->assertEquals('internal', $doc->fresh()->confidentialityLevel->name);
    }

    public function test_staff_cannot_read_attachments_of_inaccessible_document(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $staff = $this->userWithRole('it_staff');
        $otherDept = Department::where('id', '!=', $staff->department_id)->firstOrFail();

        $doc = $this->makeDocument($admin, ['department_id' => $otherDept->id]);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/attachments")
            ->assertStatus(404);

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/approvals")
            ->assertStatus(404);
    }
}
