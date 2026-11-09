<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentVersionController;
use App\Http\Controllers\Api\AttachmentController;


use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\DocumentTypeController;
use App\Http\Controllers\Api\ApprovalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\StatusController;
use App\Http\Controllers\Api\ConfidentialityLevelController;
use App\Http\Controllers\Api\WorkflowController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\DispositionController;
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
        Route::post('/logout',   [AuthController::class, 'logout']);
        Route::get('/me',        [AuthController::class, 'me']);
        Route::put('/profile',   [AuthController::class, 'updateProfile']);
        Route::put('/password',  [AuthController::class, 'changePassword']);
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
    Route::post  ('/documents/batch',            [DocumentController::class, 'batch']);
    Route::get   ('/documents',                  [DocumentController::class, 'index']);
    Route::post  ('/documents',                  [DocumentController::class, 'store']);
    Route::get   ('/documents/{id}',             [DocumentController::class, 'show']);
    Route::put   ('/documents/{id}',             [DocumentController::class, 'update']);
    Route::delete('/documents/{id}',             [DocumentController::class, 'destroy']);
    Route::delete('/documents/{id}/force',       [DocumentController::class, 'forceDelete']);
    Route::post  ('/documents/{id}/legal-hold',  [DocumentController::class, 'legalHold']);
    Route::post  ('/documents/{id}/archive',     [DocumentController::class, 'archive']);
    Route::post  ('/documents/{id}/restore',     [DocumentController::class, 'restore']);
    Route::post  ('/documents/{id}/approve',     [DocumentController::class, 'approve']);
    Route::post  ('/documents/{id}/reject',      [DocumentController::class, 'reject']);
    Route::post  ('/documents/{id}/comments',    [DocumentController::class, 'addComment']);
    Route::delete('/documents/{id}/comments/{commentId}', [DocumentController::class, 'deleteComment']);
    Route::get   ('/documents/{id}/versions',    [DocumentVersionController::class, 'index']);
    Route::post  ('/documents/{id}/versions',    [DocumentVersionController::class, 'store']);
    Route::get   ('/documents/{id}/versions/{versionId}/download', [DocumentVersionController::class, 'download']);
    Route::post  ('/documents/{id}/versions/{versionId}/revert',   [DocumentVersionController::class, 'revert']);

    // Approvals & Workflow
    Route::get   ('/approvals/pending',                        [ApprovalController::class, 'pending']);
    Route::get   ('/documents/{id}/approvals',                 [ApprovalController::class, 'index']);
    Route::get   ('/documents/{id}/approvals/target',          [ApprovalController::class, 'target']);
    Route::post  ('/documents/{id}/approvals',                 [ApprovalController::class, 'store']);
    Route::put   ('/documents/{id}/approvals/{approvalId}',    [ApprovalController::class, 'decide']);

    // Retention & Disposition
    Route::get   ('/disposition/eligible',                     [DispositionController::class, 'eligible']);
    Route::put   ('/documents/{id}/retention',                 [DispositionController::class, 'updateRetention']);
    Route::post  ('/documents/{id}/dispose',                   [DispositionController::class, 'dispose']);
    Route::post  ('/documents/{id}/disposition/restore',       [DispositionController::class, 'restore']);

    // Notifications
    Route::get   ('/notifications',              [NotificationController::class, 'index']);
    Route::put   ('/notifications/{id}/read',    [NotificationController::class, 'markAsRead']);
    Route::post  ('/notifications/mark-all-read',[NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}',         [NotificationController::class, 'destroy']);

    // Workflow Templates & Steps
    Route::get   ('/workflows',                                   [WorkflowController::class, 'index']);
    Route::post  ('/workflows',                                   [WorkflowController::class, 'store']);
    Route::get   ('/workflows/options/roles',                     [WorkflowController::class, 'roles']);
    Route::get   ('/workflows/{id}',                              [WorkflowController::class, 'show']);
    Route::put   ('/workflows/{id}',                              [WorkflowController::class, 'update']);
    Route::delete('/workflows/{id}',                              [WorkflowController::class, 'destroy']);
    Route::post  ('/workflows/{id}/steps',                        [WorkflowController::class, 'storeStep']);
    Route::put   ('/workflows/{id}/steps/{stepId}',               [WorkflowController::class, 'updateStep']);
    Route::delete('/workflows/{id}/steps/{stepId}',               [WorkflowController::class, 'destroyStep']);


    // Attachments & OCR
    Route::post  ('/documents/{id}/attachments',               [AttachmentController::class, 'store']);
    Route::get   ('/documents/{id}/attachments',               [AttachmentController::class, 'index']);
    Route::delete('/documents/{id}/attachments/{attId}',       [AttachmentController::class, 'destroy']);
    Route::get   ('/documents/{id}/attachments/{attId}/download', [AttachmentController::class, 'download']);
    Route::get   ('/documents/{id}/attachments/{attId}/preview',  [AttachmentController::class, 'preview']);
    Route::get   ('/documents/{id}/attachments/{attId}/ocr',      [AttachmentController::class, 'getOcr']);
    Route::post  ('/documents/{id}/attachments/{attId}/ocr',      [AttachmentController::class, 'processOcr']);

    // Audit Logs
    Route::get('/audit-logs/export',             [AuditLogController::class, 'export']);
    Route::get('/audit-logs/verify',             [AuditLogController::class, 'verifyIntegrity']);
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
    Route::put   ('/users/{id}/status',         [UserController::class, 'changeStatus']);
    Route::post  ('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::put   ('/users/{id}/roles', [UserController::class, 'updateRoles']);

    // Roles & Permissions Tree
    Route::get   ('/roles',            [RoleController::class, 'index']);
    Route::post  ('/roles',            [RoleController::class, 'store']);
    Route::get   ('/roles/{id}',       [RoleController::class, 'show']);
    Route::put   ('/roles/{id}',       [RoleController::class, 'update']);
    Route::delete('/roles/{id}',       [RoleController::class, 'destroy']);
    Route::get   ('/permissions',      [RoleController::class, 'permissions']);
    Route::get   ('/permissions/tree', [RoleController::class, 'tree']);

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

    // Reports
    Route::get('/reports/documents/export', [ReportController::class, 'exportDocuments']);

    // Settings
    Route::get  ('/settings',             [SettingController::class, 'index']);
    Route::put  ('/settings',             [SettingController::class, 'update']);
    Route::get  ('/settings/backup',      [SettingController::class, 'backup']);
    Route::get('/statuses',               [StatusController::class, 'index']);
    Route::get('/confidentiality-levels', [ConfidentialityLevelController::class, 'index']);
});
