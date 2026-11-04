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

            $out = tempnam(sys_get_temp_dir(), 'edms_wm_') . '.pdf';
            $pdf->Output('F', $out);

            return $out;
        } catch (\Throwable) {
            return null;
        }
    }
}
