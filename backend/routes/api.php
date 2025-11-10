<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('v1')->group(function () {
    // Authentication routes
    Route::post('/auth/login', [App\Http\Controllers\Api\AuthController::class, 'login']);
    Route::post('/auth/logout', [App\Http\Controllers\Api\AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/auth/me', [App\Http\Controllers\Api\AuthController::class, 'me'])->middleware('auth:sanctum');

    // Protected routes
    Route::middleware('auth:sanctum')->group(function () {
        // Customers
        Route::apiResource('customers', App\Http\Controllers\Api\CustomerController::class);
        Route::post('customers/{customer}/close', [App\Http\Controllers\Api\CustomerController::class, 'closeFile']);
        Route::post('customers/{customer}/notes', [App\Http\Controllers\Api\CustomerController::class, 'addNote']);

        // Dealers
        Route::apiResource('dealers', App\Http\Controllers\Api\DealerController::class);

        // Documents
        Route::apiResource('documents', App\Http\Controllers\Api\DocumentController::class);
        Route::post('documents/upload', [App\Http\Controllers\Api\DocumentController::class, 'upload']);
        Route::get('documents/{document}/download', [App\Http\Controllers\Api\DocumentController::class, 'download']);
        // View
        Route::get('documents/{document}/view', [App\Http\Controllers\Api\DocumentController::class, 'view']);

        // Payments
        Route::apiResource('payments', App\Http\Controllers\Api\PaymentController::class);

        // Notifications
        Route::get('notifications', [App\Http\Controllers\Api\NotificationController::class, 'index']);
        Route::put('notifications/{notification}/read', [App\Http\Controllers\Api\NotificationController::class, 'markAsRead']);
        Route::put('notifications/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);

        // Dashboard
        Route::get('dashboard/stats', [App\Http\Controllers\Api\DashboardController::class, 'stats']);

        // File Types
        Route::get('file-types', [App\Http\Controllers\Api\FileTypeController::class, 'index']);

        // Users
        Route::apiResource('users', App\Http\Controllers\Api\UserController::class)->middleware('role:superadmin');

        // Policies
        Route::apiResource('policies', App\Http\Controllers\Api\PolicyController::class);
        Route::get('policies/recent', [App\Http\Controllers\Api\PolicyController::class, 'getRecent']);

        // Claims
        Route::apiResource('claims', App\Http\Controllers\Api\ClaimController::class);
        Route::get('claims/pending', [App\Http\Controllers\Api\ClaimController::class, 'getPending']);

        // Accounting
        Route::get('accounting/transactions', [App\Http\Controllers\Api\AccountingController::class, 'getTransactions']);
        Route::get('accounting/invoices', [App\Http\Controllers\Api\AccountingController::class, 'getInvoices']);
        Route::post('accounting/transactions', [App\Http\Controllers\Api\AccountingController::class, 'createTransaction']);
        Route::get('accounting/stats', [App\Http\Controllers\Api\AccountingController::class, 'getStats']);

        // Reports
        Route::get('reports/stats', [App\Http\Controllers\Api\ReportController::class, 'getStats']);
        Route::get('reports/file-types', [App\Http\Controllers\Api\ReportController::class, 'getFileTypeStats']);
        Route::post('reports/generate', [App\Http\Controllers\Api\ReportController::class, 'generateReport']);
        Route::get('reports', [App\Http\Controllers\Api\ReportController::class, 'getReports']);
    });
});

