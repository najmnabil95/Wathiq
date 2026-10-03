<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (request()->wantsJson()) {
        return response()->json([
            'service'      => 'IT-EDMS Backend API',
            'status'       => 'healthy',
            'version'      => '1.0',
            'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
        ]);
    }

    return redirect(env('FRONTEND_URL', 'http://localhost:5173'));
});

