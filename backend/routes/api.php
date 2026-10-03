<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\ConfidentialityLevelController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| IT-EDMS API Routes — v1
|--------------------------------------------------------------------------
*/

// Health Check (public)
Route::get('/health', fn () => response()->json([
    'success'   => true,
    'service'   => 'IT-EDMS API',
    'version'   => '1.0',
    'timestamp' => now()->toIso8601String(),
]));

// ─── Authentication Routes (Public) ────────────────────────────────────
Route::prefix('v1/auth')->group(function () {
    Route::post('/login',  [AuthController::class, 'login'])
         ->middleware('throttle:5,1'); // 5 attempts per minute

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me',      [AuthController::class, 'me']);
    });
});

// ─── Protected Routes ───────────────────────────────────────────────────
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {

    // Dashboard
    Route::get('/dashboard/stats',           [DashboardController::class, 'stats']);
    Route::get('/dashboard/recent-documents',[DashboardController::class, 'recentDocuments']);
    Route::get('/dashboard/pending-approvals',[DashboardController::class, 'pendingApprovals']);
    Route::get('/dashboard/activity',        [DashboardController::class, 'activity']);

    // Documents
    Route::get   ('/documents',              [DocumentController::class, 'index']);
    Route::post  ('/documents',              [DocumentController::class, 'store']);
    Route::get   ('/documents/{id}',         [DocumentController::class, 'show']);
    Route::put   ('/documents/{id}',         [DocumentController::class, 'update']);
    Route::delete('/documents/{id}',         [DocumentController::class, 'destroy']);
    Route::post  ('/documents/{id}/archive', [DocumentController::class, 'archive']);
    Route::post  ('/documents/{id}/restore', [DocumentController::class, 'restore']);
    Route::post  ('/documents/{id}/approve', [DocumentController::class, 'approve']);
    Route::post  ('/documents/{id}/reject',  [DocumentController::class, 'reject']);

    // Attachments
    Route::post  ('/documents/{id}/attachments',               [AttachmentController::class, 'store']);
    Route::get   ('/documents/{id}/attachments',               [AttachmentController::class, 'index']);
    Route::delete('/documents/{id}/attachments/{attId}',       [AttachmentController::class, 'destroy']);
    Route::get   ('/documents/{id}/attachments/{attId}/download', [AttachmentController::class, 'download']);
    Route::get   ('/documents/{id}/attachments/{attId}/preview',  [AttachmentController::class, 'preview']);

    // Audit Logs
    Route::get('/audit-logs',                    [AuditLogController::class, 'index']);
    Route::get('/documents/{id}/audit-logs',     [AuditLogController::class, 'forDocument']);

    // Search
    Route::get('/search', [DocumentController::class, 'search']);

    // Categories (read is open to all, write requires permission)
    Route::get   ('/categories',       [CategoryController::class, 'index']);
    Route::post  ('/categories',       [CategoryController::class, 'store']);
    Route::get   ('/categories/{id}',  [CategoryController::class, 'show']);
    Route::put   ('/categories/{id}',  [CategoryController::class, 'update']);
    Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

    // Document Types
    Route::get   ('/document-types',              [DocumentTypeController::class, 'index']);
    Route::post  ('/document-types',              [DocumentTypeController::class, 'store']);
    Route::get   ('/document-types/{id}',         [DocumentTypeController::class, 'show']);
    Route::put   ('/document-types/{id}',         [DocumentTypeController::class, 'update']);
    Route::delete('/document-types/{id}',         [DocumentTypeController::class, 'destroy']);
    Route::get   ('/document-types/{id}/fields',  [DocumentTypeController::class, 'fields']);
    Route::post  ('/document-types/{id}/fields',  [DocumentTypeController::class, 'addField']);
    Route::put   ('/document-type-fields/{id}',   [DocumentTypeController::class, 'updateField']);
    Route::delete('/document-type-fields/{id}',   [DocumentTypeController::class, 'deleteField']);

    // Users
    Route::get   ('/users',        [UserController::class, 'index']);
    Route::post  ('/users',        [UserController::class, 'store']);
    Route::get   ('/users/{id}',   [UserController::class, 'show']);
    Route::put   ('/users/{id}',   [UserController::class, 'update']);
    Route::delete('/users/{id}',   [UserController::class, 'destroy']);
    Route::put   ('/users/{id}/roles', [UserController::class, 'updateRoles']);

    // Roles & Permissions
    Route::get('/roles',       [RoleController::class, 'index']);
    Route::get('/permissions', [RoleController::class, 'permissions']);

    // Departments
    Route::get   ('/departments',      [DepartmentController::class, 'index']);
    Route::post  ('/departments',      [DepartmentController::class, 'store']);
    Route::get   ('/departments/{id}', [DepartmentController::class, 'show']);
    Route::put   ('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

    // Organizations
    Route::get   ('/organizations',      [OrganizationController::class, 'index']);
    Route::post  ('/organizations',      [OrganizationController::class, 'store']);
    Route::get   ('/organizations/{id}', [OrganizationController::class, 'show']);
    Route::put   ('/organizations/{id}', [OrganizationController::class, 'update']);
    Route::delete('/organizations/{id}', [OrganizationController::class, 'destroy']);

    // Settings
    Route::get('/statuses',               [StatusController::class, 'index']);
    Route::get('/confidentiality-levels', [ConfidentialityLevelController::class, 'index']);
});
