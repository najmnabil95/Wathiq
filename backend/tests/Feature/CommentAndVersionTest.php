<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Comment;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentType;
use App\Models\DocumentVersion;
use App\Models\Role;
use App\Models\Status;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommentAndVersionTest extends TestCase
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
            'document_number'          => 'CMT-' . uniqid(),
            'title'                    => 'وثيقة اختبار التعليقات والإصدارات',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ], $overrides));
    }

    public function test_comment_deletion_requires_comments_delete_permission(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $comment = Comment::create([
            'document_id' => $doc->id,
            'user_id'     => $staff->id,
            'comment'     => 'ملاحظة قابلة للحذف',
        ]);

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/comments/{$comment->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('comments', ['id' => $comment->id, 'deleted_at' => null]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/comments/{$comment->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('comments', ['id' => $comment->id]);
    }

    public function test_comment_deletion_cascades_to_replies(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $parent = Comment::create([
            'document_id' => $doc->id,
            'user_id'     => $manager->id,
            'comment'     => 'تعليق رئيسي',
        ]);

        $reply = Comment::create([
            'document_id' => $doc->id,
            'user_id'     => $manager->id,
            'parent_id'   => $parent->id,
            'comment'     => 'رد تابع',
        ]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/comments/{$parent->id}")
            ->assertOk();

        $this->assertSoftDeleted('comments', ['id' => $parent->id]);
        $this->assertSoftDeleted('comments', ['id' => $reply->id]);
    }

    public function test_version_revert_requires_versions_revert_permission(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $source = DocumentVersion::create([
            'document_id'    => $doc->id,
            'version_number' => 'v1.0',
            'change_summary' => 'الإصدار الأول',
            'disk'           => 'local',
            'uploaded_by'    => $manager->id,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/versions/{$source->id}/revert")
            ->assertStatus(403);

        $response = $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/versions/{$source->id}/revert")
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $newVersionNumber = $response->json('data.version_number');
        $this->assertSame('v1.1', $newVersionNumber);

        $this->assertDatabaseHas('document_versions', [
            'document_id'    => $doc->id,
            'version_number' => 'v1.1',
        ]);
    }

    public function test_revert_is_blocked_for_archived_documents(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager, ['is_archived' => true, 'archived_at' => now()]);

        $source = DocumentVersion::create([
            'document_id'    => $doc->id,
            'version_number' => 'v1.0',
            'change_summary' => 'الإصدار الأول',
            'disk'           => 'local',
            'uploaded_by'    => $manager->id,
        ]);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/versions/{$source->id}/revert")
            ->assertStatus(422);
    }
}
