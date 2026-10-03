<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentNumberSequence extends Model
{
    use HasFactory;

    protected $fillable = [
        'prefix',
        'year',
        'last_number',
    ];

    protected $casts = [
        'year'        => 'integer',
        'last_number' => 'integer',
    ];
}
