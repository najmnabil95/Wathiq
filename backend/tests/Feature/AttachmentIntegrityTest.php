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

class AttachmentIntegrityTest extends TestCase
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

    private function makeDocument(User $creator): Document
    {
        return Document::create([
            'document_number'          => 'ATT-' . uniqid(),
            'title'                    => 'وثيقة اختبار المرفقات',
            'document_type_id'         => DocumentType::firstOrFail()->id,
            'category_id'              => Category::firstOrFail()->id,
            'department_id'            => $creator->department_id,
            'created_by'               => $creator->id,
            'status_id'                => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date'            => now()->toDateString(),
        ]);
    }

    public function test_upload_is_audited_as_upload_not_download(): void
    {
        $this->seed();
        Storage::fake('local');

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/attachments", [
                'file' => UploadedFile::fake()->createWithContent('note.txt', 'hello world'),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('audit_logs', [
            'action'         => 'upload',
            'auditable_type' => Document::class,
            'auditable_id'   => $doc->id,
        ]);
        $this->assertDatabaseMissing('audit_logs', [
            'action'         => 'download',
            'auditable_type' => Document::class,
            'auditable_id'   => $doc->id,
        ]);
    }

    public function test_legal_hold_blocks_attachment_deletion(): void
    {
        $this->seed();
        Storage::fake('local');

        $manager = $this->userWithRole('it_manager');
        $doc = $this->makeDocument($manager);

        $upload = $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/attachments", [
                'file' => UploadedFile::fake()->createWithContent('note.txt', 'hello world'),
            ])
            ->assertCreated();

        $attachmentId = $upload->json('data.0.id');

        $doc->update([
            'legal_hold'        => true,
            'legal_hold_reason' => 'قضية قضائية',
            'legal_hold_at'     => now(),
            'legal_hold_by'     => $manager->id,
        ]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/attachments/{$attachmentId}")
            ->assertStatus(422);

        $this->assertDatabaseHas('document_attachments', [
            'id' => $attachmentId,
            'deleted_at' => null,
        ]);

        $doc->update(['legal_hold' => false]);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/documents/{$doc->id}/attachments/{$attachmentId}")
            ->assertOk();

        $this->assertSoftDeleted('document_attachments', ['id' => $attachmentId]);
    }
}
