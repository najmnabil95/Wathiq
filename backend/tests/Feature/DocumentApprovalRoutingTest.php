<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DocumentApprovalRoutingTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role, ?Department $department = null): User
    {
        $user = User::create([
            'name'          => "Test {$role}",
            'username'      => "route_{$role}_" . uniqid(),
            'email'         => "route_{$role}_" . uniqid() . '@edms.local',
            'password'      => 'Secret@12345',
            'status'        => 'active',
            'department_id' => ($department ?? Department::firstOrFail())->id,
        ]);
        $user->roles()->attach(Role::where('name', $role)->firstOrFail());

        return $user;
    }

    private function documentPayload(int $departmentId): array
    {
        return [
            'title'                    => 'وثيقة توجيه تلقائي ' . uniqid(),
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $departmentId,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ];
    }

    public function test_document_creation_routes_to_department_manager(): void
    {
        $this->seed();

        $department = Department::whereNull('parent_id')->firstOrFail();
        $manager    = $this->userWithRole('it_manager', $department);
        $staff      = $this->userWithRole('it_staff', $department);

        $department->update(['manager_id' => $manager->id]);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents', $this->documentPayload($department->id))
            ->assertCreated()
            ->assertJsonPath('auto_routed', true);

        $documentId = $response->json('data.id');

        $approval = Approval::where('document_id', $documentId)->where('status', 'pending')->first();
        $this->assertNotNull($approval, 'Expected a pending approval to be created automatically.');
        $this->assertSame($manager->id, $approval->approver_id);
        $this->assertSame('pending_approval', Document::find($documentId)->status->name);
    }

    public function test_document_creation_falls_back_to_parent_department_manager(): void
    {
        $this->seed();

        $parent  = Department::whereNull('parent_id')->firstOrFail();
        $manager = $this->userWithRole('it_manager', $parent);

        $child = Department::create([
            'code'      => 'CHILD-' . uniqid(),
            'name'      => 'Child ' . uniqid(),
            'name_ar'   => 'فرع اختبار',
            'parent_id' => $parent->id,
            'is_active' => true,
        ]);

        $parent->update(['manager_id' => $manager->id]);

        $staff = $this->userWithRole('it_staff', $child);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents', $this->documentPayload($child->id))
            ->assertCreated()
            ->assertJsonPath('auto_routed', true);

        $approval = Approval::where('document_id', $response->json('data.id'))
            ->where('status', 'pending')
            ->first();

        $this->assertNotNull($approval);
        $this->assertSame($manager->id, $approval->approver_id);
    }

    public function test_document_creation_without_manager_does_not_fail(): void
    {
        $this->seed();

        $orphan = Department::create([
            'code'      => 'ORPH-' . uniqid(),
            'name'      => 'Orphan ' . uniqid(),
            'name_ar'   => 'قسم بلا مدير',
            'is_active' => true,
        ]);

        $staff = $this->userWithRole('it_staff', $orphan);

        $response = $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/documents', $this->documentPayload($orphan->id))
            ->assertCreated()
            ->assertJsonPath('auto_routed', false);

        $this->assertSame(
            0,
            Approval::where('document_id', $response->json('data.id'))->count(),
            'No approval should be created when no department manager resolves.'
        );
    }
}
