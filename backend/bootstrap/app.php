<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Enable CORS for API
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // ─── Unified API Error Response ─────────────────────────
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->is('api/*') && !$request->expectsJson()) {
                return null; // Let default handler deal with non-API
            }

            // Validation errors
            if ($e instanceof ValidationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'البيانات المدخلة غير صحيحة.',
                    'errors'  => $e->errors(),
                ], 422);
            }

            // Unauthenticated
            if ($e instanceof AuthenticationException) {
                return response()->json([
                    'success' => false,
                    'message' => 'غير مصادق. يرجى تسجيل الدخول.',
                ], 401);
            }

            // 403 Forbidden
            if ($e instanceof HttpException && $e->getStatusCode() === 403) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'ليس لديك صلاحية للقيام بهذه العملية.',
                ], 403);
            }

            // 404 Not Found
            if ($e instanceof NotFoundHttpException || $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'success' => false,
                    'message' => 'السجل المطلوب غير موجود.',
                ], 404);
            }

            // Generic HTTP Exception
            if ($e instanceof HttpException) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'خطأ في الطلب.',
                ], $e->getStatusCode());
            }

            // Server error (500) — never expose internals in production
            $message = config('app.debug')
                ? $e->getMessage()
                : 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.';

            return response()->json([
                'success' => false,
                'message' => $message,
            ], 500);
        });
    })->create();
