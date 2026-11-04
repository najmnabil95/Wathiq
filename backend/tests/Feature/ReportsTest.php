<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Permission;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $user = User::whereHas('roles', fn ($q) => $q->where('name', $role))->first();

        if (!$user) {
            $user = User::create([
                'name'     => "Test {$role}",
                'username' => "test_{$role}_" . uniqid(),
                'email'    => "test_{$role}_" . uniqid() . '@edms.local',
                'password' => 'Secret@12345',
                'status'   => 'active',
                'department_id' => Department::firstOrFail()->id,
            ]);
            $user->roles()->attach(Role::where('name', $role)->firstOrFail());
        }

        return $user;
    }

    private function makeDocument(User $creator, array $overrides = []): Document
    {
        return Document::create(array_merge([
            'document_number'          => 'RPT-' . uniqid(),
            'title'                    => 'وثيقة تقرير اختبار',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ], $overrides));
    }

    public function test_staff_without_export_permission_cannot_export(): void
    {
        $this->seed();

        $this->actingAs($this->userWithRole('it_staff'), 'sanctum')
            ->get('/api/v1/reports/documents/export')
            ->assertStatus(403);
    }

    public function test_bulk_export_requires_advanced_reports_permission(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');
        $staff->roles->first()->permissions()->syncWithoutDetaching([
            Permission::where('name', 'reports.export')->firstOrFail()->id,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->get('/api/v1/reports/documents/export')
            ->assertStatus(200);

        $this->actingAs($staff, 'sanctum')
            ->get('/api/v1/reports/documents/export?bulk=1')
            ->assertStatus(403);
    }

    public function test_export_respects_document_visibility_rules(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');
        $staff->roles->first()->permissions()->syncWithoutDetaching([
            Permission::where('name', 'reports.export')->firstOrFail()->id,
            Permission::where('name', 'reports.advanced')->firstOrFail()->id,
        ]);

        $visible = $this->makeDocument($staff);
        $hidden = $this->makeDocument($staff, [
            'department_id'            => Department::where('id', '!=', $staff->department_id)->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'confidential')->firstOrFail()->id,
            'created_by'               => $this->userWithRole('super_admin')->id,
        ]);

        $response = $this->actingAs($staff, 'sanctum')
            ->get('/api/v1/reports/documents/export?bulk=1');

        $response->assertStatus(200);

        $content = $response->streamedContent();

        $this->assertStringContainsString($visible->document_number, $content);
        $this->assertStringNotContainsString($hidden->document_number, $content);
    }

    public function test_manager_can_bulk_export_documents(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $response = $this->actingAs($manager, 'sanctum')
            ->get('/api/v1/reports/documents/export?bulk=1');

        $response->assertStatus(200);
        $this->assertSame('bulk', $response->headers->get('X-Export-Scope'));
        $this->assertGreaterThanOrEqual(1, (int) $response->headers->get('X-Exported-Count'));
        $this->assertStringContainsString($doc->document_number, $response->streamedContent());
    }
}
