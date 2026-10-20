<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Document;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationAndApprovalTest extends TestCase
{
    use RefreshDatabase;

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
        $approver = User::where('id', '!=', $admin->id)->first() ?? User::factory()->create();

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
}
