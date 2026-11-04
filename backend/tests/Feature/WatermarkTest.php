<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\User;
use App\Services\WatermarkService;
use setasign\Fpdi\Fpdi;
use Tests\TestCase;

class WatermarkTest extends TestCase
{
    public function test_image_gets_watermarked_copy(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'edms_src_') . '.png';
        $image = imagecreatetruecolor(420, 300);
        imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
        imagepng($image, $path);
        imagedestroy($image);

        $service = new WatermarkService();
        $output = $service->apply(
            $path,
            'image/png',
            new Document(['document_number' => 'TST-2026-0001']),
            new User(['email' => 'tester@edms.local'])
        );

        $this->assertNotNull($output);
        $this->assertFileExists($output);
        $this->assertNotSame(md5_file($path), md5_file($output));

        @unlink($path);
        @unlink($output);
    }

    public function test_pdf_gets_watermarked_copy(): void
    {
        $source = tempnam(sys_get_temp_dir(), 'edms_src_') . '.pdf';
        $pdf = new Fpdi();
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->Cell(0, 10, 'Sample document body');
        $pdf->Output('F', $source);

        $service = new WatermarkService();
        $output = $service->apply(
            $source,
            'application/pdf',
            new Document(['document_number' => 'TST-2026-0002']),
            new User(['email' => 'tester@edms.local'])
        );

        $this->assertNotNull($output);
        $this->assertFileExists($output);
        $this->assertStringStartsWith('%PDF', (string) file_get_contents($output));
        $this->assertNotSame(md5_file($source), md5_file($output));

        @unlink($source);
        @unlink($output);
    }

    public function test_pdf_with_broken_cross_reference_is_repaired_and_watermarked(): void
    {
        $source = tempnam(sys_get_temp_dir(), 'edms_src_') . '.pdf';
        $pdf = new Fpdi();
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', '', 12);
        $pdf->Cell(0, 10, 'Damaged cross-reference');
        $pdf->Output('F', $source);

        $content = (string) file_get_contents($source);
        file_put_contents($source, (string) preg_replace('/startxref\s+\d+/', "startxref\n0", $content));

        $service = new WatermarkService();
        $output = $service->apply(
            $source,
            'application/pdf',
            new Document(['document_number' => 'TST-2026-0003']),
            new User(['email' => 'tester@edms.local'])
        );

        $this->assertNotNull($output);
        $this->assertFileExists($output);
        $this->assertStringStartsWith('%PDF', (string) file_get_contents($output));

        $check = new Fpdi();
        $this->assertSame(1, $check->setSourceFile($output));

        @unlink($source);
        @unlink($output);
    }
}
