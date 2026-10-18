<?php

namespace App\Services;

use App\Models\DocumentAttachment;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class TextExtractionService
{
    /**
     * Extract text from a document attachment and update its OCR fields.
     */
    public function extractAndStore(DocumentAttachment $attachment): bool
    {
        try {
            $attachment->update(['ocr_status' => 'processing']);

            $disk = Storage::disk($attachment->disk);
            if (!$disk->exists($attachment->file_path)) {
                $attachment->update([
                    'ocr_status' => 'failed',
                    'ocr_text'   => null,
                ]);
                return false;
            }

            $absolutePath = $disk->path($attachment->file_path);
            $mimeType = strtolower($attachment->mime_type ?? '');
            $extension = strtolower($attachment->extension ?? pathinfo($attachment->original_name, PATHINFO_EXTENSION));

            $extractedText = $this->extractFromFile($absolutePath, $mimeType, $extension);

            if ($extractedText !== null && trim($extractedText) !== '') {
                $cleaned = $this->cleanText($extractedText);
                $attachment->update([
                    'ocr_text'   => $cleaned,
                    'ocr_status' => 'done',
                ]);
                return true;
            }

            // If image without server-side tesseract
            if (str_starts_with($mimeType, 'image/')) {
                $attachment->update([
                    'ocr_status' => 'pending_client',
                    'ocr_text'   => null,
                ]);
                return false;
            }

            $attachment->update([
                'ocr_status' => 'done',
                'ocr_text'   => '',
            ]);
            return true;
        } catch (\Throwable $e) {
            Log::warning("TextExtractionService error for attachment {$attachment->id}: " . $e->getMessage());
            $attachment->update([
                'ocr_status' => 'failed',
                'ocr_text'   => null,
            ]);
            return false;
        }
    }

    /**
     * Extract text based on file format.
     */
    public function extractFromFile(string $filePath, string $mimeType, string $extension): ?string
    {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            return null;
        }

        // 1. Plain text formats (.txt, .csv, .json, .xml, .log, .sql)
        if (
            str_starts_with($mimeType, 'text/') ||
            in_array($extension, ['txt', 'csv', 'json', 'xml', 'log', 'sql', 'md', 'env'])
        ) {
            return $this->extractPlainText($filePath);
        }

        // 2. Microsoft Word Document (.docx)
        if (
            $extension === 'docx' ||
            $mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            return $this->extractFromDocx($filePath);
        }

        // 3. Microsoft Excel Spreadsheet (.xlsx)
        if (
            $extension === 'xlsx' ||
            $mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            return $this->extractFromXlsx($filePath);
        }

        // 4. PDF (.pdf)
        if ($extension === 'pdf' || $mimeType === 'application/pdf') {
            return $this->extractFromPdf($filePath);
        }

        // 5. Images (.png, .jpg, .jpeg, .webp, .tiff, .bmp)
        if (
            str_starts_with($mimeType, 'image/') ||
            in_array($extension, ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'])
        ) {
            return $this->extractFromImage($filePath);
        }

        return null;
    }

    /**
     * Extract text from plain text files with automatic encoding detection.
     */
    private function extractPlainText(string $filePath): ?string
    {
        $content = @file_get_contents($filePath);
        if ($content === false) {
            return null;
        }

        // If already valid UTF-8, return directly
        if (mb_check_encoding($content, 'UTF-8')) {
            return $content;
        }

        // Try detecting standard encodings supported by mbstring
        $encoding = @mb_detect_encoding($content, ['UTF-8', 'ISO-8859-6', 'Windows-1252', 'ISO-8859-1', 'ASCII'], true);
        if ($encoding && $encoding !== 'UTF-8') {
            $converted = @mb_convert_encoding($content, 'UTF-8', $encoding);
            if ($converted !== false && !empty($converted)) {
                return $converted;
            }
        }

        // Fallback to iconv for Windows-1256 Arabic if present
        if (function_exists('iconv')) {
            $converted = @iconv('WINDOWS-1256', 'UTF-8//IGNORE', $content);
            if ($converted !== false && !empty($converted)) {
                return $converted;
            }
        }

        return $content;
    }

    /**
     * Extract text from Microsoft Word (.docx) by reading word/document.xml inside ZIP.
     */
    private function extractFromDocx(string $filePath): ?string
    {
        if (!class_exists('ZipArchive')) {
            return null;
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return null;
        }

        $xmlIndex = $zip->locateName('word/document.xml');
        if ($xmlIndex === false) {
            $zip->close();
            return null;
        }

        $xmlData = $zip->getFromIndex($xmlIndex);
        $zip->close();

        if (empty($xmlData)) {
            return null;
        }

        // Replace paragraph and break tags with spaces/newlines
        $xmlData = str_replace(['</w:p>', '<w:br/>', '<w:br></w:br>'], ["\n", "\n", "\n"], $xmlData);
        $text = strip_tags($xmlData);
        return html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    /**
     * Extract text from Microsoft Excel (.xlsx) by parsing xl/sharedStrings.xml inside ZIP.
     */
    private function extractFromXlsx(string $filePath): ?string
    {
        if (!class_exists('ZipArchive')) {
            return null;
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return null;
        }

        $stringsIndex = $zip->locateName('xl/sharedStrings.xml');
        if ($stringsIndex === false) {
            $zip->close();
            return null;
        }

        $xmlData = $zip->getFromIndex($stringsIndex);
        $zip->close();

        if (empty($xmlData)) {
            return null;
        }

        $xmlData = str_replace(['</si>', '</t>'], ["\n", " "], $xmlData);
        $text = strip_tags($xmlData);
        return html_entity_decode($text, ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    /**
     * Extract text from PDF files.
     * Tries pdftotext CLI first, then pure PHP decompressed stream parser.
     */
    private function extractFromPdf(string $filePath): ?string
    {
        // 1. Try pdftotext CLI if available on the server
        $cliText = $this->tryPdftotextCli($filePath);
        if (!empty($cliText) && strlen(trim($cliText)) > 20) {
            return $cliText;
        }

        // 2. Pure PHP stream and object parser
        return $this->extractPdfPurePhp($filePath);
    }

    /**
     * Pure PHP stream extraction for PDFs without external dependencies.
     */
    private function extractPdfPurePhp(string $filePath): ?string
    {
        $content = @file_get_contents($filePath);
        if ($content === false) {
            return null;
        }

        $extracted = [];

        // Match all stream objects: stream ... endstream
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                // Try FlateDecode decompress
                $uncompressed = @gzuncompress($stream);
                if ($uncompressed === false) {
                    // Try with gzinflate or raw if already uncompressed
                    $uncompressed = @gzinflate($stream);
                    if ($uncompressed === false) {
                        $uncompressed = $stream;
                    }
                }

                // Check if this stream has PDF text operators
                if (str_contains($uncompressed, 'BT') && str_contains($uncompressed, 'ET')) {
                    $streamText = $this->parsePdfTextOperators($uncompressed);
                    if (!empty($streamText)) {
                        $extracted[] = $streamText;
                    }
                }
            }
        }

        $fullText = implode("\n", $extracted);
        return !empty(trim($fullText)) ? $fullText : null;
    }

    /**
     * Parse text operators within PDF text blocks (BT ... ET).
     */
    private function parsePdfTextOperators(string $stream): string
    {
        $textParts = [];

        // Find blocks between BT (Begin Text) and ET (End Text)
        if (preg_match_all('/BT\s*(.*?)\s*ET/s', $stream, $textBlocks)) {
            foreach ($textBlocks[1] as $block) {
                // 1. Match Tj operator: (text) Tj or <hex> Tj
                if (preg_match_all('/\((.*?)\)\s*Tj/s', $block, $tjMatches)) {
                    foreach ($tjMatches[1] as $str) {
                        $textParts[] = $this->decodePdfString($str);
                    }
                }

                // 2. Match hex string Tj: <hex> Tj
                if (preg_match_all('/<([0-9A-Fa-f]+)>\s*Tj/', $block, $hexMatches)) {
                    foreach ($hexMatches[1] as $hex) {
                        $textParts[] = $this->decodeHexPdfString($hex);
                    }
                }

                // 3. Match TJ array operator: [ (text1) -10 (text2) ... ] TJ
                if (preg_match_all('/\[(.*?)\]\s*TJ/s', $block, $tjArrayMatches)) {
                    foreach ($tjArrayMatches[1] as $arrayContent) {
                        if (preg_match_all('/\((.*?)\)/s', $arrayContent, $arrayStrings)) {
                            $joined = '';
                            foreach ($arrayStrings[1] as $part) {
                                $joined .= $this->decodePdfString($part);
                            }
                            if (!empty($joined)) {
                                $textParts[] = $joined;
                            }
                        }
                    }
                }

                // 4. Match ' (apostrophe) operator: (text) '
                if (preg_match_all('/\((.*?)\)\s*\'/s', $block, $apostropheMatches)) {
                    foreach ($apostropheMatches[1] as $str) {
                        $textParts[] = $this->decodePdfString($str);
                    }
                }
            }
        }

        return implode(' ', array_filter($textParts));
    }

    /**
     * Decode standard PDF string escapes.
     */
    private function decodePdfString(string $str): string
    {
        // Handle common escape sequences
        $str = str_replace(['\\\\', '\(', '\)', '\n', '\r', '\t'], ['\\', '(', ')', "\n", "\r", "\t"], $str);

        // Handle octal escapes: \ddd
        $str = preg_replace_callback('/\\\([0-7]{1,3})/', function ($m) {
            return chr(octdec($m[1]));
        }, $str);

        // UTF-16BE BOM check (\xFE\xFF)
        if (str_starts_with($str, "\xFE\xFF")) {
            $converted = @mb_convert_encoding(substr($str, 2), 'UTF-8', 'UTF-16BE');
            if ($converted !== false) {
                return $converted;
            }
        }

        return $str;
    }

    /**
     * Decode hex string from PDF.
     */
    private function decodeHexPdfString(string $hex): string
    {
        $bin = @hex2bin($hex);
        if ($bin === false) {
            return '';
        }

        if (str_starts_with($bin, "\xFE\xFF")) {
            $converted = @mb_convert_encoding(substr($bin, 2), 'UTF-8', 'UTF-16BE');
            if ($converted !== false) {
                return $converted;
            }
        }

        return $bin;
    }

    /**
     * Extract text from image via Tesseract OCR if available.
     */
    private function extractFromImage(string $filePath): ?string
    {
        $tesseractBinary = config('edms.tesseract_path') ?: env('TESSERACT_PATH');

        // Check if tesseract binary is specified or in PATH
        if (!$tesseractBinary) {
            $output = [];
            $code = 1;
            @exec('where tesseract 2>nul', $output, $code);
            if ($code === 0 && !empty($output[0])) {
                $tesseractBinary = $output[0];
            }
        }

        if (!$tesseractBinary || !file_exists($tesseractBinary)) {
            return null;
        }

        $tempOutput = storage_path('app/temp_ocr_' . Str::random(10));
        $cmd = sprintf(
            '"%s" "%s" "%s" -l ara+eng --oem 1 --psm 3 2>nul',
            $tesseractBinary,
            $filePath,
            $tempOutput
        );

        @exec($cmd);

        $resultFile = "{$tempOutput}.txt";
        if (file_exists($resultFile)) {
            $text = @file_get_contents($resultFile);
            @unlink($resultFile);
            return !empty($text) ? $text : null;
        }

        return null;
    }

    /**
     * Try extracting PDF text via pdftotext CLI if installed.
     */
    private function tryPdftotextCli(string $filePath): ?string
    {
        $output = [];
        $code = 1;
        @exec('where pdftotext 2>nul', $output, $code);
        if ($code !== 0 || empty($output[0])) {
            return null;
        }

        $tempTxt = storage_path('app/temp_pdf_' . Str::random(10) . '.txt');
        $cmd = sprintf('pdftotext -enc UTF-8 "%s" "%s" 2>nul', $filePath, $tempTxt);
        @exec($cmd);

        if (file_exists($tempTxt)) {
            $text = @file_get_contents($tempTxt);
            @unlink($tempTxt);
            return !empty($text) ? $text : null;
        }

        return null;
    }

    /**
     * Clean and normalize extracted text for indexing and search.
     */
    public function cleanText(string $text): string
    {
        // Strip null bytes and non-printable control characters except whitespace
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', ' ', $text);

        // Normalize multiple spaces and newlines
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace('/[\r\n]{3,}/', "\n\n", $text);

        return trim($text);
    }

    /**
     * Generate a contextual snippet (highlight) showing where a query term appears in text.
     */
    public function generateSnippet(?string $text, string $query, int $radius = 70): ?string
    {
        if (empty($text) || empty($query)) {
            return null;
        }

        $pos = mb_stripos($text, $query, 0, 'UTF-8');
        if ($pos === false) {
            // Also try normalized Arabic query
            $normalizedText = $this->normalizeArabic($text);
            $normalizedQuery = $this->normalizeArabic($query);
            $pos = mb_stripos($normalizedText, $normalizedQuery, 0, 'UTF-8');
            if ($pos === false) {
                return null;
            }
        }

        $start = max(0, $pos - $radius);
        $length = mb_strlen($query, 'UTF-8') + ($radius * 2);
        $snippet = mb_substr($text, $start, $length, 'UTF-8');

        $prefix = $start > 0 ? '...' : '';
        $suffix = ($start + $length) < mb_strlen($text, 'UTF-8') ? '...' : '';

        return $prefix . trim($snippet) . $suffix;
    }

    /**
     * Normalize Arabic characters for resilient search matching (Alef, Taa Marbuta, etc.).
     */
    public function normalizeArabic(string $str): string
    {
        // Remove Tashkeel (diacritics)
        $str = preg_replace('/[\x{064B}-\x{0652}]/u', '', $str);

        // Normalize Alef variations
        $str = preg_replace('/[إأآا]/u', 'ا', $str);

        // Normalize Taa Marbuta to Haa
        $str = preg_replace('/ة/u', 'ه', $str);

        // Normalize Yaa variations
        $str = preg_replace('/[ىي]/u', 'ي', $str);

        return $str;
    }
}
