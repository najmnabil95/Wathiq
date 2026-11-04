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
use Tests\TestCase;

class LegalHoldTest extends TestCase
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

    private function makeDocument(User $creator, array $overrides = []): Document
    {
        return Document::create(array_merge([
            'document_number'          => 'HOLD-' . uniqid(),
            'title'                    => 'وثيقة اختبار الحجز القانوني',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ], $overrides));
    }

    public function test_placing_legal_hold_requires_permission_and_reason(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/legal-hold", [
                'legal_hold' => true,
                'reason' => 'قضية قضائية',
            ])
            ->assertStatus(403);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/legal-hold", [
                'legal_hold' => true,
                'reason' => '',
            ])
            ->assertStatus(422);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/legal-hold", [
                'legal_hold' => true,
                'reason' => 'قضية قضائية مرجع 2026/44',
            ])
            ->assertOk()
            ->assertJsonPath('data.legal_hold', true);

        $doc->refresh();
        $this->assertTrue($doc->legal_hold);
        $this->assertSame($manager->id, $doc->legal_hold_by);
        $this->assertNotNull($doc->legal_hold_at);
    }

    public function test_legal_hold_blocks_soft_delete_until_released(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager, [
            'legal_hold' => true,
            'legal_hold_reason' => 'تحقيق داخلي',
            'legal_hold_at' => now(),
            'legal_hold_by' => $manager->id,
        ]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('documents', ['id' => $doc->id, 'deleted_at' => null]);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/legal-hold", ['legal_hold' => false])
            ->assertOk()
            ->assertJsonPath('data.legal_hold', false);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}")
            ->assertOk();

        $this->assertSoftDeleted('documents', ['id' => $doc->id]);
    }

    public function test_force_delete_requires_permission_and_trashed_document(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $admin   = $this->userWithRole('super_admin');
        $doc = $this->makeDocument($manager);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/force")
            ->assertStatus(422);

        $doc->delete();

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/force")
            ->assertStatus(403);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/force")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('documents', ['id' => $doc->id]);
    }

    public function test_force_delete_is_blocked_for_held_document(): void
    {
        $this->seed();

        $admin = $this->userWithRole('super_admin');
        $doc = $this->makeDocument($admin, [
            'legal_hold' => true,
            'legal_hold_reason' => 'حجز دائم',
            'legal_hold_at' => now(),
            'legal_hold_by' => $admin->id,
        ]);

        $doc->delete();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/force")
            ->assertStatus(422);

        $this->assertDatabaseHas('documents', ['id' => $doc->id]);
    }
}
