<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\User;
use Tests\TestCase;

class DocumentSearchOcrTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'database.default' => 'mysql',
            'database.connections.mysql.database' => 'it_edms_db',
        ]);
    }

    /**
     * Test full-text search matching OCR attachment text.
     */
    public function test_document_search_finds_ocr_content(): void
    {
        $admin = User::whereHas('roles', fn($q) => $q->where('name', 'super_admin'))->first() ?? User::first();
        $this->assertNotNull($admin, 'A user must exist in the database to run API tests.');

        // Find or create an unarchived document
        $uniqueKeyword = 'معيار_تجريبي_خاص_' . rand(1000, 9999);
        $doc = Document::where('is_archived', false)->first();
        if (!$doc) {
            $doc = Document::first();
            $doc->update(['is_archived' => false]);
        }
        $this->assertNotNull($doc, 'At least one document must exist in database.');

        $attachment = DocumentAttachment::firstOrCreate(
            [
                'document_id' => $doc->id,
                'file_name'   => 'test_sample_file.txt',
            ],
            [
                'original_name' => 'test_sample_file.txt',
                'file_path'     => 'attachments/sample.txt',
                'file_size'     => 1024,
                'mime_type'     => 'text/plain',
                'extension'     => 'txt',
                'disk'          => 'local',
                'checksum'      => hash('sha256', 'sample'),
                'created_by'    => $admin->id,
            ]
        );

        $attachment->update([
            'ocr_status' => 'done',
            'ocr_text'   => "هذا مستند اختباري يحتوي على {$uniqueKeyword} للتأكد من نجاح البحث الذكي في المحتوى.",
        ]);

        // Act: Search for the unique keyword
        $response = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents?q={$uniqueKeyword}");

        // Assert: Document is found and search_matches is populated
        $response->assertStatus(200);
        $data = $response->json('data.data');

        $this->assertNotEmpty($data);
        $matchedDoc = collect($data)->firstWhere('id', $doc->id);
        $this->assertNotNull($matchedDoc, 'Document with OCR text was not returned in search results.');
        $this->assertNotEmpty($matchedDoc['search_matches']);

        $firstMatch = $matchedDoc['search_matches'][0];
        $this->assertEquals($attachment->id, $firstMatch['attachment_id']);
        $this->assertStringContainsString($uniqueKeyword, $firstMatch['snippet']);

        // Test GET OCR Endpoint
        $ocrResponse = $this->actingAs($admin, 'sanctum')
            ->getJson("/api/v1/documents/{$doc->id}/attachments/{$attachment->id}/ocr");

        $ocrResponse->assertStatus(200);
        $ocrData = $ocrResponse->json('data');
        $this->assertEquals('done', $ocrData['ocr_status']);
        $this->assertStringContainsString($uniqueKeyword, $ocrData['ocr_text']);
    }
}
