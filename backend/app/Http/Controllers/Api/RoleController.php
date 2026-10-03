<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('roles.view') && !$request->user()->isSuperAdmin()) {
            abort(403);
        }

        return response()->json([
            'success' => true,
            'data'    => Role::with('permissions')->get(),
        ]);
    }

    public function permissions(Request $request): JsonResponse
    {
        if (!$request->user()->hasPermission('roles.view') && !$request->user()->isSuperAdmin()) {
            abort(403);
        }

        $grouped = Permission::all()->groupBy('group');

        return response()->json([
            'success' => true,
            'data'    => $grouped,
        ]);
    }
}
