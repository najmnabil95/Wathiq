<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConfidentialityLevel;
use Illuminate\Http\JsonResponse;

class ConfidentialityLevelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => ConfidentialityLevel::ordered()->get(),
        ]);
    }
}
