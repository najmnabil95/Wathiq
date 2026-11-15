<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\DocumentType;
use App\Models\Status;
use App\Models\User;
use App\Services\OfficePreviewService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OfficePreviewTest extends TestCase
{
    use RefreshDatabase;

    private function manager(): User
    {
        $this->seed();

        return User::whereHas('roles', fn ($q) => $q->where('name', 'it_manager'))->firstOrFail();
    }

    private function documentFor(User $user): Document
    {
        return Document::create([
            'document_number' => 'OFF-'.uniqid(),
            'title' => 'وثيقة اختبار معاينة الملفات المكتبية',
            'document_type_id' => DocumentType::firstOrFail()->id,
            'category_id' => Category::firstOrFail()->id,
            'department_id' => $user->department_id,
            'created_by' => $user->id,
            'status_id' => Status::where('name', 'new')->firstOrFail()->id,
            'confidentiality_level_id' => ConfidentialityLevel::where('name', 'internal')->firstOrFail()->id,
            'document_date' => now()->toDateString(),
        ]);
    }

    private function attachment(Document $document, string $extension, string $mime): DocumentAttachment
    {
        $path = "private/documents/2026/{$document->id}/file.{$extension}";
        Storage::disk('local')->put($path, 'raw office bytes');

        return DocumentAttachment::create([
            'document_id' => $document->id,
            'original_name' => "report.{$extension}",
            'file_name' => "file.{$extension}",
            'file_path' => $path,
            'disk' => 'local',
            'mime_type' => $mime,
            'extension' => $extension,
            'file_size' => 16,
            'checksum' => hash('sha256', 'raw office bytes'),
            'uploaded_by' => $document->created_by,
        ]);
    }

    private function fakeConverter(?string $convertedPath): void
    {
        $this->app->instance(OfficePreviewService::class, new class($convertedPath) extends OfficePreviewService
        {
            public function __construct(private readonly ?string $convertedPath) {}

            public function convertFor(DocumentAttachment $attachment, ?string $sourcePath): ?string
            {
                return $this->convertedPath;
            }
        });
    }

    public function test_office_attachment_preview_returns_converted_pdf(): void
    {
        Storage::fake('local');
        $manager = $this->manager();
        $document = $this->documentFor($manager);
        $attachment = $this->attachment($document, 'docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

        $pdfPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'edms-test-'.uniqid().'.pdf';
        file_put_contents($pdfPath, "%PDF-1.4\nconverted");
        $this->fakeConverter($pdfPath);

        $response = $this->actingAs($manager, 'sanctum')
            ->get("/api/v1/documents/{$document->id}/attachments/{$attachment->id}/preview");

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringContainsString('%PDF-1.4', $response->getContent());
        $this->assertStringContainsString('report.pdf', $response->headers->get('Content-Disposition'));

        @unlink($pdfPath);
    }

    public function test_office_preview_falls_back_to_download_when_conversion_fails(): void
    {
        Storage::fake('local');
        $manager = $this->manager();
        $document = $this->documentFor($manager);
        $attachment = $this->attachment($document, 'xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->fakeConverter(null);

        $this->actingAs($manager, 'sanctum')
            ->getJson("/api/v1/documents/{$document->id}/attachments/{$attachment->id}/preview")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'تعذّر تجهيز نسخة PDF للعرض حالياً. يمكنك تنزيل الملف الأصلي ومراجعته على جهازك.');
    }

    public function test_archive_preview_still_requires_download(): void
    {
        Storage::fake('local');
        $manager = $this->manager();
        $document = $this->documentFor($manager);
        $attachment = $this->attachment($document, 'zip', 'application/zip');

        $this->actingAs($manager, 'sanctum')
            ->getJson("/api/v1/documents/{$document->id}/attachments/{$attachment->id}/preview")
            ->assertStatus(422)
            ->assertJsonPath('message', 'هذا النوع من الملفات مكتبي أو مضغوط ويتطلب التنزيل والتشغيل المكتبي.');
    }

    public function test_convertible_extension_mapping(): void
    {
        $service = new OfficePreviewService;

        foreach (['doc', 'docx', 'odt', 'rtf', 'xls', 'xlsx', 'ods', 'ppt', 'pptx', 'odp', 'DOCX'] as $extension) {
            $this->assertTrue($service->isConvertible($extension), "{$extension} should be convertible");
        }

        foreach (['pdf', 'zip', 'txt', 'png', 'rar', '', null] as $extension) {
            $this->assertFalse($service->isConvertible($extension), var_export($extension, true).' should not be convertible');
        }
    }
}
