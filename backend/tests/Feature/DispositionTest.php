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

class DispositionTest extends TestCase
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
            'document_number'          => 'DSP-' . uniqid(),
            'title'                    => 'وثيقة اختبار الاستبعاد والاستبقاء',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->subYears(8)->toDateString(),
            'retention_years'          => 7,
            'retention_until'          => now()->subYear()->toDateString(),
        ], $overrides));
    }

    public function test_eligible_listing_requires_disposition_permission(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $manager = $this->userWithRole('it_manager');
        $this->makeDocument($manager);

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/disposition/eligible')
            ->assertStatus(403);

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/disposition/eligible')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.data');
    }

    public function test_dispose_is_blocked_by_legal_hold_and_succeeds_with_audit(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $held = $this->makeDocument($manager, [
            'legal_hold'        => true,
            'legal_hold_reason' => 'نزاع قضائي قائم',
            'legal_hold_at'     => now(),
            'legal_hold_by'     => $manager->id,
        ]);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$held->id}/dispose", ['reason' => 'انتهاء مدة الاستبقاء'])
            ->assertStatus(422);

        $document = $this->makeDocument($manager);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/dispose", ['reason' => 'انتهاء مدة الاستبقاء'])
            ->assertOk()
            ->assertJsonPath('data.disposition_status', 'disposed');

        $this->assertTrue((bool) $document->fresh()->is_archived);
        $this->assertDatabaseHas('audit_logs', ['action' => 'disposition.dispose']);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/dispose", ['reason' => 'محاولة مكررة'])
            ->assertStatus(422);
    }

    public function test_disposition_can_be_reversed(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $document = $this->makeDocument($manager, [
            'disposition_status' => 'disposed',
            'disposed_at'        => now(),
            'disposed_by'        => $manager->id,
            'is_archived'        => true,
        ]);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/disposition/restore", ['reason' => 'خطأ في التصنيف'])
            ->assertOk()
            ->assertJsonPath('data.disposition_status', 'active');

        $this->assertNull($document->fresh()->disposed_at);
        $this->assertDatabaseHas('audit_logs', ['action' => 'disposition.restore']);
    }

    public function test_retention_can_be_extended(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $document = $this->makeDocument($manager);

        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/v1/documents/{$document->id}/retention", [
                'retention_years' => 10,
                'reason'          => 'قرار لجنة الحفظ بالتمديد',
            ])
            ->assertOk()
            ->assertJsonPath('data.retention_years', 10);

        $this->assertSame(
            now()->addYears(10)->toDateString(),
            $document->fresh()->retention_until->toDateString()
        );
        $this->assertDatabaseHas('audit_logs', ['action' => 'retention.update']);
    }
}
