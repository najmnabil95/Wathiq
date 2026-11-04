<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    // ─── Static Helpers ───────────────────────────────────────────

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();

        if (!$setting || $setting->value === null) {
            return $default;
        }

        $decoded = json_decode($setting->value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
    }

    public static function put(string $key, mixed $value, string $group = 'general'): self
    {
        return static::updateOrCreate(
            ['key' => $key],
            ['value' => json_encode($value, JSON_UNESCAPED_UNICODE), 'group' => $group]
        );
    }

    /**
     * All settings as a flat key => decoded value map.
     */
    public static function allAsMap(): array
    {
        return static::query()->get()->mapWithKeys(function (self $setting) {
            $decoded = json_decode($setting->value, true);
            return [$setting->key => json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value];
        })->all();
    }
}
