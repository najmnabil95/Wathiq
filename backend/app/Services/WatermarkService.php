<?php

namespace App\Services;

use App\Models\Document;
use App\Models\Setting;
use App\Models\User;
use setasign\Fpdi\Fpdi;

class WatermarkService
{
    public const SETTING_KEY = 'watermark_downloads';

    public static function enabled(): bool
    {
        return (bool) Setting::get(self::SETTING_KEY, true);
    }

    /**
     * Returns the path of a temporary watermarked copy, or null when the
     * format is unsupported or the source cannot be parsed.
     */
    public function apply(string $absolutePath, ?string $mimeType, Document $document, User $user): ?string
    {
        $mime = $mimeType ?: (function_exists('mime_content_type') ? @mime_content_type($absolutePath) : null);
        $label = $this->label($document, $user);

        if ($mime && str_starts_with($mime, 'image/')) {
            return $this->watermarkImage($absolutePath, $mime, $label);
        }

        if ($mime === 'application/pdf' || str_ends_with(strtolower($absolutePath), '.pdf')) {
            return $this->watermarkPdf($absolutePath, $label);
        }

        return null;
    }

    public function label(Document $document, User $user): string
    {
        $identity = $user->email ?: $user->username ?: $user->name;

        return trim("{$identity} | {$document->document_number} | " . now()->format('Y-m-d H:i'));
    }

    private function watermarkImage(string $path, string $mime, string $label): ?string
    {
        if (!function_exists('imagecreatefromstring')) {
            return null;
        }

        $data = @file_get_contents($path);
        if ($data === false) {
            return null;
        }

        $image = @imagecreatefromstring($data);
        if (!$image) {
            return null;
        }

        $width  = imagesx($image);
        $height = imagesy($image);

        $color = imagecolorallocatealpha($image, 110, 110, 110, 70);
        $font  = 5;
        $textWidth = imagefontwidth($font) * strlen($label);

        for ($y = 36; $y < $height; $y += 120) {
            for ($x = -$textWidth; $x < $width; $x += $textWidth + 120) {
                imagestring($image, $font, (int) $x, (int) $y, $label, $color);
            }
        }

        $tmp = tempnam(sys_get_temp_dir(), 'edms_wm_');
        if ($tmp === false) {
            imagedestroy($image);
            return null;
        }

        $ok = match ($mime) {
            'image/png'  => imagepng($image, $tmp),
            'image/gif'  => imagegif($image, $tmp),
            'image/webp' => function_exists('imagewebp') ? imagewebp($image, $tmp) : imagejpeg($image, $tmp, 88),
            default      => imagejpeg($image, $tmp, 88),
        };

        imagedestroy($image);

        if (!$ok) {
            @unlink($tmp);
            return null;
        }

        return $tmp;
    }

    private function watermarkPdf(string $path, string $label): ?string
    {
        if (!class_exists(Fpdi::class)) {
            return null;
        }

        try {
            return $this->renderPdfWatermark($path, $label);
        } catch (\Throwable) {
            // Malformed cross-reference tables are common in exported PDFs.
        }

        $repaired = $this->repairCrossReference($path);
        if ($repaired === null) {
            return null;
        }

        try {
            return $this->renderPdfWatermark($repaired, $label);
        } catch (\Throwable) {
            return null;
        } finally {
            @unlink($repaired);
        }
    }

    private function renderPdfWatermark(string $path, string $label): ?string
    {
        $pdf = new Fpdi();
        $pageCount = $pdf->setSourceFile($path);

        for ($page = 1; $page <= $pageCount; $page++) {
            $template = $pdf->importPage($page);
            $size = $pdf->getTemplateSize($template);

            if (!$size) {
                continue;
            }

            $width  = $size['width'];
            $height = $size['height'];
            $pdf->AddPage($width > $height ? 'L' : 'P', [$width, $height]);
            $pdf->useTemplate($template, 0, 0, $width, $height);

            $pdf->SetFont('Helvetica', 'B', 9);
            $pdf->SetTextColor(140, 140, 140);
            $pdf->SetAutoPageBreak(false);

            foreach ([12, ($height / 2) - 4, $height - 20] as $y) {
                $pdf->SetXY(0, $y);
                $pdf->Cell($width, 8, $label, 0, 0, 'C');
            }
        }

        $tmp = tempnam(sys_get_temp_dir(), 'edms_wm_');
        if ($tmp === false) {
            return null;
        }

        $out = $tmp . '.pdf';
        @unlink($tmp);
        $pdf->Output('F', $out);

        return $out;
    }

    /**
     * Rebuilds a damaged cross-reference table from the object headers
     * found in the file, so the PDF can still be parsed by FPDI.
     */
    private function repairCrossReference(string $path): ?string
    {
        $content = @file_get_contents($path);
        if ($content === false || !str_contains($content, '%PDF-')) {
            return null;
        }

        if (stripos($content, '/Encrypt') !== false) {
            return null;
        }

        if (!preg_match_all('/(?:^|[\r\n])(\d{1,10})\s+(\d{1,5})\s+obj\b/', $content, $matches, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        $objects = [];
        foreach ($matches[1] as $i => $number) {
            $header = $matches[0][$i][0];
            $offset = $matches[0][$i][1] + strlen($header) - strlen(ltrim($header, "\r\n"));
            $objects[(int) $number[0]] = $offset;
        }

        if (!$objects) {
            return null;
        }

        $root = null;
        if (preg_match_all('/\/Root\s+(\d+)\s+(\d+)\s+R/', $content, $roots)) {
            $root = (int) end($roots[1]);
        } elseif (preg_match('/\/Type\s*\/Catalog/', $content, $catalog, PREG_OFFSET_CAPTURE)) {
            foreach ($objects as $number => $offset) {
                if ($offset < $catalog[0][1] && ($root === null || $offset > $objects[$root])) {
                    $root = $number;
                }
            }
        }

        if ($root === null || !isset($objects[$root])) {
            return null;
        }

        $size = max(array_keys($objects)) + 1;
        $body = $content;
        if (!str_ends_with($body, "\n")) {
            $body .= "\n";
        }

        $xrefOffset = strlen($body);
        $xref = "xref\n0 {$size}\n0000000000 65535 f \n";
        for ($i = 1; $i < $size; $i++) {
            $xref .= isset($objects[$i])
                ? sprintf("%010d 00000 n \n", $objects[$i])
                : "0000000000 65535 f \n";
        }

        $trailer = "trailer\n<< /Size {$size} /Root {$root} 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF\n";

        $tmp = tempnam(sys_get_temp_dir(), 'edms_wm_fix_');
        if ($tmp === false) {
            return null;
        }

        $repaired = $tmp . '.pdf';
        if (@file_put_contents($repaired, $body . $xref . $trailer) === false) {
            @unlink($tmp);
            return null;
        }

        @unlink($tmp);

        return $repaired;
    }
}
