<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Organization;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class OrganizationsTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_listing_requires_organizations_view_permission(): void
    {
        $this->seed();

        $viewer = $this->userWithRole('viewer');
        $staff  = $this->userWithRole('it_staff');

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/organizations')
            ->assertStatus(403);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/organizations')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_management_requires_organizations_manage_permission(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $manager = $this->userWithRole('it_manager');

        $payload = [
            'name' => 'Ministry of Finance',
            'name_ar' => 'وزارة المالية',
            'type' => 'government',
            'is_active' => true,
        ];

        $this->actingAs($staff, 'sanctum')
            ->postJson('/api/v1/organizations', $payload)
            ->assertStatus(403);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/organizations', $payload)
            ->assertStatus(201)
            ->assertJsonPath('data.type', 'government');

        $orgId = $response->json('data.id');

        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/v1/organizations/{$orgId}", ['contact_person' => 'Ahmed'])
            ->assertOk()
            ->assertJsonPath('data.contact_person', 'Ahmed');

        $this->actingAs($manager, 'sanctum')
            ->getJson("/api/v1/organizations/{$orgId}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Ministry of Finance');
    }

    public function test_cannot_delete_organization_linked_to_documents(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $org = Organization::create([
            'name' => 'Linked Org',
            'type' => 'external',
            'is_active' => true,
        ]);

        Document::create([
            'document_number'          => 'ORG-' . Str::upper(Str::random(8)),
            'title'                    => 'وثيقة مرتبطة بجهة',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $manager->department_id,
            'organization_id'          => $org->id,
            'created_by'               => $manager->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/organizations/{$org->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('organizations', ['id' => $org->id, 'deleted_at' => null]);
    }
}
