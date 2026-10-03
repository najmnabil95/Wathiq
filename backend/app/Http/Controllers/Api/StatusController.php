<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConfidentialityLevel;
use App\Models\Status;
use Illuminate\Http\JsonResponse;

class StatusController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => Status::ordered()->get(),
        ]);
    }
}
