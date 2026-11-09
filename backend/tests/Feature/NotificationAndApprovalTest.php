<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\Status;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationAndApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function makeDocument(User $creator, array $overrides = []): Document
    {
        return Document::create(array_merge([
            'document_number'          => 'APPR-' . uniqid(),
            'title'                    => 'وثيقة اختبار التوجيه التلقائي',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ], $overrides));
    }

    public function test_user_can_list_and_read_notifications(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $this->assertNotNull($admin);

        $doc = Document::first();
        $this->assertNotNull($doc);

        // Send a notification using NotificationService
        $service = app(NotificationService::class);
        $service->notifyApprovalRequested($doc, $admin, $admin);

        // 1. List notifications
        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertGreaterThanOrEqual(1, $response->json('unread_count'));

        $notifId = $data[0]['id'];

        // 2. Mark specific notification as read
        $readResponse = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/notifications/{$notifId}/read");

        $readResponse->assertStatus(200);

        // 3. Mark all as read
        $markAllResponse = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/notifications/mark-all-read');

        $markAllResponse->assertStatus(200);
        $this->assertEquals(0, $markAllResponse->json('unread_count'));
    }

    public function test_approval_workflow_request_and_decision(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $approver = User::whereHas('roles', fn($q) => $q->where('name', 'approver'))->first()
            ?? User::factory()->create();

        $doc = Document::first();
        $this->assertNotNull($doc);

        // 1. Request approval for document
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/approvals", [
                'approver_id' => $approver->id,
                'comments'    => 'يرجى مراجعة البنود المالية والتوقيع عليها',
            ]);

        $response->assertStatus(201);
        $this->assertTrue($response->json('success'));
        $approvalData = $response->json('data');
        $this->assertEquals('pending', $approvalData['status']);
        $this->assertEquals($approver->id, $approvalData['approver_id']);

        // Check approver received notification
        $this->assertGreaterThan(0, $approver->unreadNotifications()->count());

        // 2. Approver gets pending list
        $pendingResponse = $this->actingAs($approver, 'sanctum')
            ->getJson('/api/v1/approvals/pending');

        $pendingResponse->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $pendingResponse->json('count'));

        // 3. Approver decides (approves) the request
        $decisionResponse = $this->actingAs($approver, 'sanctum')
            ->putJson("/api/v1/documents/{$doc->id}/approvals/{$approvalData['id']}", [
                'decision' => 'approved',
                'comments' => 'تمت المراجعة والاعتماد وفق اللوائح',
            ]);

        $decisionResponse->assertStatus(200);
        $this->assertTrue($decisionResponse->json('success'));
        $this->assertEquals('approved', $decisionResponse->json('data.status'));

        // Verify approval model updated
        $this->assertEquals('approved', Approval::find($approvalData['id'])->status);
    }

    public function test_approval_request_auto_routes_to_department_manager(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $manager = User::whereHas('roles', fn ($q) => $q->where('name', 'it_manager'))->firstOrFail();
        $itDept = Department::where('code', 'IT')->firstOrFail();

        $this->assertEquals($manager->id, $itDept->manager_id);

        $doc = $this->makeDocument($admin, ['department_id' => $itDept->id]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/approvals/target")
            ->assertStatus(200)
            ->assertJsonPath('data.manager.id', $manager->id)
            ->assertJsonPath('data.document_department.id', $itDept->id);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/approvals", [
                'comments' => 'إحالة تلقائية لمدير القسم',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('auto_routed', true)
            ->assertJsonPath('data.approver_id', $manager->id);

        $this->assertEquals($manager->id, Approval::where('document_id', $doc->id)->firstOrFail()->approver_id);
        $this->assertEquals('pending_approval', $doc->fresh()->status->name);
        $this->assertGreaterThan(0, $manager->unreadNotifications()->count());
    }

    public function test_approval_request_falls_back_to_parent_department_manager(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $manager = User::whereHas('roles', fn ($q) => $q->where('name', 'it_manager'))->firstOrFail();
        $itDept = Department::where('code', 'IT')->firstOrFail();

        $branch = Department::create([
            'code'            => 'IT-TEST-BRANCH',
            'name'            => 'Test Branch',
            'name_ar'         => 'فرع اختبار التوجيه',
            'organization_id' => $itDept->organization_id,
            'parent_id'       => $itDept->id,
            'manager_id'      => null,
            'is_active'       => true,
        ]);

        $doc = $this->makeDocument($admin, ['department_id' => $branch->id]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/approvals/target")
            ->assertStatus(200)
            ->assertJsonPath('data.manager.id', $manager->id);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/approvals", [])
            ->assertStatus(201)
            ->assertJsonPath('auto_routed', true)
            ->assertJsonPath('data.approver_id', $manager->id);
    }

    public function test_approval_request_requires_manager_when_none_configured(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $itDept = Department::where('code', 'IT')->firstOrFail();

        $rootDept = Department::create([
            'code'            => 'NO-MGR',
            'name'            => 'No Manager Department',
            'name_ar'         => 'قسم بلا مدير',
            'organization_id' => $itDept->organization_id,
            'parent_id'       => null,
            'manager_id'      => null,
            'is_active'       => true,
        ]);

        $doc = $this->makeDocument($admin, ['department_id' => $rootDept->id]);

        $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/approvals/target")
            ->assertStatus(200)
            ->assertJsonPath('data.manager', null);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/approvals", [])
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertEquals(0, Approval::where('document_id', $doc->id)->count());
    }
}
