<?php

namespace App\Services;

use App\Models\DocumentNumberSequence;
use App\Models\DocumentType;
use Illuminate\Support\Facades\DB;

class DocumentNumberService
{
    /**
     * Generate a unique, sequential document number.
     * Uses DB transaction + SELECT FOR UPDATE to prevent race conditions.
     *
     * Format: {PREFIX}-{YEAR}-{SEQUENCE:5}
     * Example: ACCESS-2026-00001
     */
    public function generate(DocumentType $documentType): string
    {
        $prefix = strtoupper($documentType->prefix);
        $year   = now()->year;

        $number = DB::transaction(function () use ($prefix, $year) {
            // Lock the row to prevent concurrent access
            $sequence = DocumentNumberSequence::lockForUpdate()
                ->where('prefix', $prefix)
                ->where('year', $year)
                ->first();

            if ($sequence) {
                $sequence->increment('last_number');
                $sequence->refresh();
                return $sequence->last_number;
            } else {
                DocumentNumberSequence::create([
                    'prefix'      => $prefix,
                    'year'        => $year,
                    'last_number' => 1,
                ]);
                return 1;
            }
        });

        return sprintf('%s-%d-%05d', $prefix, $year, $number);
    }

    /**
     * Preview the next number without incrementing (for display only).
     */
    public function peek(DocumentType $documentType): string
    {
        $prefix = strtoupper($documentType->prefix);
        $year   = now()->year;

        $sequence = DocumentNumberSequence::where('prefix', $prefix)
            ->where('year', $year)
            ->first();

        $next = $sequence ? $sequence->last_number + 1 : 1;

        return sprintf('%s-%d-%05d', $prefix, $year, $next);
    }
}
