<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request as RequestFacade;

class AuditService
{
    /**
     * Log an audit event for a specific model.
     */
    public function log(
        string $action,
        ?Model $auditable = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $description = null
    ): AuditLog {
        return AuditLog::create([
            'user_id'        => Auth::id(),
            'action'         => $action,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id'   => $auditable?->getKey(),
            'old_values'     => $oldValues,
            'new_values'     => $newValues,
            'ip_address'     => RequestFacade::ip(),
            'user_agent'     => RequestFacade::userAgent(),
            'description'    => $description,
            'created_at'     => now(),
        ]);
    }

    /**
     * Log a login event.
     */
    public function logLogin(int $userId, string $ip, string $userAgent): void
    {
        AuditLog::create([
            'user_id'     => $userId,
            'action'      => AuditLog::ACTION_LOGIN,
            'ip_address'  => $ip,
            'user_agent'  => $userAgent,
            'description' => 'User logged in',
            'created_at'  => now(),
        ]);
    }

    /**
     * Log a logout event.
     */
    public function logLogout(int $userId): void
    {
        AuditLog::create([
            'user_id'     => $userId,
            'action'      => AuditLog::ACTION_LOGOUT,
            'ip_address'  => RequestFacade::ip(),
            'user_agent'  => RequestFacade::userAgent(),
            'description' => 'User logged out',
            'created_at'  => now(),
        ]);
    }

    /**
     * Log a file download event.
     */
    public function logDownload(Model $auditable, string $fileName): void
    {
        $this->log(
            AuditLog::ACTION_DOWNLOAD,
            $auditable,
            null,
            null,
            "Downloaded file: {$fileName}"
        );
    }

    /**
     * Log a document view event.
     */
    public function logView(Model $auditable): void
    {
        $this->log(
            AuditLog::ACTION_VIEW,
            $auditable,
            null,
            null,
            'Document viewed'
        );
    }

    /**
     * Get diff between old and new model attributes.
     */
    public function getDiff(Model $model): array
    {
        $dirty = $model->getDirty();
        $old   = [];
        $new   = [];

        foreach ($dirty as $key => $newValue) {
            $old[$key] = $model->getOriginal($key);
            $new[$key] = $newValue;
        }

        // Never log sensitive fields
        $sensitive = ['password', 'remember_token'];
        foreach ($sensitive as $field) {
            unset($old[$field], $new[$field]);
        }

        return [$old, $new];
    }
}
