<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
        return $this->record([
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
        $this->record([
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
        $this->record([
            'user_id'     => $userId,
            'action'      => AuditLog::ACTION_LOGOUT,
            'ip_address'  => RequestFacade::ip(),
            'user_agent'  => RequestFacade::userAgent(),
            'description' => 'User logged out',
            'created_at'  => now(),
        ]);
    }

    /**
     * Insert an audit entry and link it into the tamper-evident hash chain.
     */
    private function record(array $attributes): AuditLog
    {
        return DB::transaction(function () use ($attributes) {
            $previous     = AuditLog::orderByDesc('id')->lockForUpdate()->first();
            $previousHash = $previous?->hash;

            $attributes['created_at']    = $attributes['created_at'] ?? now();
            $attributes['previous_hash'] = $previousHash;
            $attributes['hash']          = $this->computeHash($attributes, $previousHash);

            return AuditLog::create($attributes);
        });
    }

    /**
     * Deterministic SHA-256 over the entry payload and its predecessor hash.
     * Must stay stable because verification recomputes it from stored columns.
     */
    public function computeHash(array $attributes, ?string $previousHash): string
    {
        $createdAt = $attributes['created_at'] ?? null;
        $createdAt = $createdAt instanceof \DateTimeInterface
            ? $createdAt->format('Y-m-d H:i:s')
            : (string) ($createdAt ?? '');

        $payload = implode("\x1F", [
            $previousHash ?? '',
            (string) ($attributes['user_id'] ?? ''),
            (string) ($attributes['action'] ?? ''),
            (string) ($attributes['auditable_type'] ?? ''),
            (string) ($attributes['auditable_id'] ?? ''),
            $this->encodeValue($attributes['old_values'] ?? null),
            $this->encodeValue($attributes['new_values'] ?? null),
            (string) ($attributes['ip_address'] ?? ''),
            (string) ($attributes['user_agent'] ?? ''),
            (string) ($attributes['description'] ?? ''),
            $createdAt,
        ]);

        return hash('sha256', $payload);
    }

    private function encodeValue(mixed $value): string
    {
        if ($value === null) {
            return 'null';
        }
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $value = $decoded;
            }
        }

        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: 'null';
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
