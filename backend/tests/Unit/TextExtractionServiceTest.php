<?php

namespace Tests\Unit;

use App\Services\TextExtractionService;
use PHPUnit\Framework\TestCase;
use ZipArchive;

class TextExtractionServiceTest extends TestCase
{
    private TextExtractionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TextExtractionService();
    }

    /**
     * Test Arabic text normalization (Alef, Tashkeel, Taa Marbuta).
     */
    public function test_arabic_normalization(): void
    {
        $input = "إِجْرَاءَاتُ الأَمْنِ وَالسَّلاَمَةِ الْمِهْنِيَّةِ";
        $normalized = $this->service->normalizeArabic($input);

        // Tashkeel should be removed
        $this->assertStringNotContainsString('ِ', $normalized);
        $this->assertStringNotContainsString('َ', $normalized);
        $this->assertStringNotContainsString('ُ', $normalized);

        // Variations of Alef normalized to simple Alef
        $this->assertStringNotContainsString('إ', $normalized);
        $this->assertStringNotContainsString('أ', $normalized);
        $this->assertStringContainsString('ا', $normalized);

        // Taa Marbuta normalized to Haa
        $this->assertStringNotContainsString('ة', $normalized);
        $this->assertStringContainsString('ه', $normalized);
    }

    /**
     * Test contextual snippet generation.
     */
    public function test_snippet_generation(): void
    {
        $longText = "نظام وثيق للأرشفة وإدارة الوثائق الإلكترونية. يحتوي النظام على محرك بحث ذكي متقدم يدعم الفهرسة الضوئية للمستندات والملفات المرفقة بصيغ مختلفة. تم تطوير النظام بأحدث المعايير الأمنية.";
        $query = "الفهرسة الضوئية";

        $snippet = $this->service->generateSnippet($longText, $query, 30);

        $this->assertNotNull($snippet);
        $this->assertStringContainsString('الفهرسة الضوئية', $snippet);
        $this->assertStringStartsWith('...', $snippet);
        $this->assertStringEndsWith('...', $snippet);
    }

    /**
     * Test snippet returns null when query not present.
     */
    public function test_snippet_returns_null_when_query_not_found(): void
    {
        $text = "وثيقة رسمية متعلقة بالموارد البشرية.";
        $snippet = $this->service->generateSnippet($text, "كلمة_غير_موجودة_نهائيا");

        $this->assertNull($snippet);
    }

    /**
     * Test plain text extraction.
     */
    public function test_plain_text_extraction(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'edms_test_') . '.txt';
        $content = "تقرير اجتماع لجنة المراجعة السنوي 2026\nتمت الموافقة بالإجماع على الميزانية.";
        file_put_contents($tempFile, $content);

        try {
            $extracted = $this->service->extractFromFile($tempFile, 'text/plain', 'txt');
            $this->assertNotNull($extracted);
            $this->assertStringContainsString('تقرير اجتماع لجنة المراجعة', $extracted);
            $this->assertStringContainsString('الميزانية', $extracted);
        } finally {
            @unlink($tempFile);
        }
    }

    /**
     * Test DOCX pure-PHP extraction via ZipArchive.
     */
    public function test_docx_text_extraction(): void
    {
        $tempDocx = tempnam(sys_get_temp_dir(), 'edms_docx_') . '.docx';

        $zip = new ZipArchive();
        if ($zip->open($tempDocx, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                <w:body>
                    <w:p><w:r><w:t>عقد تقديم خدمات استشارية وتقنية</w:t></w:r></w:p>
                    <w:p><w:r><w:t>الطرف الأول: وزارة الاتصالات وتقنية المعلومات</w:t></w:r></w:p>
                </w:body>
            </w:document>';
            $zip->addFromString('word/document.xml', $xml);
            $zip->close();
        }

        try {
            $extracted = $this->service->extractFromFile(
                $tempDocx,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'docx'
            );

            $this->assertNotNull($extracted);
            $this->assertStringContainsString('عقد تقديم خدمات استشارية', $extracted);
            $this->assertStringContainsString('وزارة الاتصالات', $extracted);
        } finally {
            @unlink($tempDocx);
        }
    }

    /**
     * Test XLSX sharedStrings extraction.
     */
    public function test_xlsx_text_extraction(): void
    {
        $tempXlsx = tempnam(sys_get_temp_dir(), 'edms_xlsx_') . '.xlsx';

        $zip = new ZipArchive();
        if ($zip->open($tempXlsx, ZipArchive::CREATE | ZipArchive::OVERWRITE) === true) {
            $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="2" uniqueCount="2">
                <si><t>قائمة الأصول الثابتة</t></si>
                <si><t>خادم قاعدة البيانات الرئيسي</t></si>
            </sst>';
            $zip->addFromString('xl/sharedStrings.xml', $xml);
            $zip->close();
        }

        try {
            $extracted = $this->service->extractFromFile(
                $tempXlsx,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'xlsx'
            );

            $this->assertNotNull($extracted);
            $this->assertStringContainsString('قائمة الأصول الثابتة', $extracted);
            $this->assertStringContainsString('خادم قاعدة البيانات الرئيسي', $extracted);
        } finally {
            @unlink($tempXlsx);
        }
    }
}
