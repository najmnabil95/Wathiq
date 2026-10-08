<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — IT-EDMS Unified SPA Delivery
|--------------------------------------------------------------------------
*/

// Root endpoint: Serves the React SPA if built, otherwise JSON API status
Route::get('/', function () {
    if (request()->wantsJson() && !request()->acceptsHtml()) {
        return response()->json([
            'service' => 'IT-EDMS Backend API',
            'status'  => 'healthy',
            'version' => '1.0',
        ]);
    }

    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }

    return redirect(env('FRONTEND_URL', 'http://localhost:5173'));
});

// Named route for login redirect fallback
Route::get('/login', function () {
    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }
    return redirect('/');
})->name('login');

// SPA Catch-All: Enables browser refresh and deep-linking for all React routes
Route::fallback(function () {
    if (request()->is('api/*') || (request()->wantsJson() && !request()->acceptsHtml())) {
        return response()->json([
            'status'  => 'error',
            'message' => 'API endpoint not found',
        ], 404);
    }

    if (file_exists(public_path('index.html'))) {
        return response()->file(public_path('index.html'));
    }

    return response()->json([
        'status'  => 'error',
        'message' => 'Frontend UI not built yet. Run "npm run build" in the frontend directory.',
    ], 404);
});

