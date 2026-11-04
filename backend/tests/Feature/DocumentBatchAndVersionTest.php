<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentBatchAndVersionTest extends TestCase
{
    use RefreshDatabase;

    public function test_batch_operations_approve_and_archive(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $this->assertNotNull($admin, 'A user must exist in the database.');

        $docs = Document::take(2)->get();
        $this->assertGreaterThanOrEqual(2, $docs->count(), 'At least two documents needed for batch test.');

        $ids = $docs->pluck('id')->toArray();

        // 1. Batch approve
        $response = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/documents/batch', [
                'action' => 'approve',
                'ids' => $ids,
            ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        foreach ($ids as $id) {
            $this->assertEquals('approved', Document::find($id)->status->name);
        }

        // 2. Batch archive
        $archiveResponse = $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/documents/batch', [
                'action' => 'archive',
                'ids' => $ids,
            ]);

        $archiveResponse->assertStatus(200);
        foreach ($ids as $id) {
            $this->assertTrue((bool) Document::find($id)->is_archived);
        }
    }

    public function test_document_version_creation_and_listing(): void
    {
        Storage::fake('local');
        $this->seed();

        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $doc = Document::first();
        $this->assertNotNull($doc);

        // Upload a new version file
        $file = UploadedFile::fake()->create('contract_v2.pdf', 150, 'application/pdf');

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$doc->id}/versions", [
                'file' => $file,
                'version_number' => '2.0',
                'change_summary' => 'تحديث البنود المالية للنسخة الثانية',
            ]);

        $response->assertStatus(201);
        $data = $response->json('data');
        $this->assertEquals('2.0', $data['version_number']);
        $this->assertNotEmpty($data['file_name']);
        $this->assertEquals('contract_v2.pdf', $data['original_name']);
        $this->assertNotEquals('contract_v2.pdf', $data['file_name']);
        $this->assertSame('contract_v2.pdf', DocumentVersion::find($data['id'])->original_name);

        // Check versions listing
        $listResponse = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/versions");

        $listResponse->assertStatus(200);
        $versions = $listResponse->json('data');
        $this->assertNotEmpty($versions);
        $this->assertEquals('2.0', $versions[0]['version_number']);

        // Check download version
        $downloadResponse = $this->actingAs($admin, 'sanctum')
            ->get("/api/v1/documents/{$doc->id}/versions/{$data['id']}/download");

        $downloadResponse->assertStatus(200);
    }
}
