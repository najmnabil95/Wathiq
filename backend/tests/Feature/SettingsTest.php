<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $user = User::whereHas('roles', fn ($q) => $q->where('name', $role))->first();

        if (!$user) {
            $user = User::create([
                'name'     => "Test {$role}",
                'username' => "test_{$role}_" . uniqid(),
                'email'    => "test_{$role}_" . uniqid() . '@edms.local',
                'password' => 'Secret@12345',
                'status'   => 'active',
            ]);
            $user->roles()->attach(Role::where('name', $role)->firstOrFail());
        }

        return $user;
    }

    public function test_settings_are_exposed_with_seeded_defaults(): void
    {
        $this->seed();

        $response = $this->actingAs($this->userWithRole('super_admin'), 'sanctum')
            ->getJson('/api/v1/settings');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.numbering_pattern', '{CAT}-{YEAR}-{SEQ:4}')
            ->assertJsonPath('data.retention_years', '7')
            ->assertJsonPath('data.require_mfa', true)
            ->assertJsonPath('data.sha_check_enabled', true);
    }

    public function test_manager_can_update_settings_and_persist_them(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');

        $response = $this->actingAs($manager, 'sanctum')
            ->putJson('/api/v1/settings', [
                'numbering_pattern'  => '{PREFIX}-{YEAR}-{SEQ:5}',
                'retention_years'    => '10',
                'require_mfa'        => false,
                'sha_check_enabled'  => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.numbering_pattern', '{PREFIX}-{YEAR}-{SEQ:5}')
            ->assertJsonPath('data.retention_years', '10')
            ->assertJsonPath('data.require_mfa', false);

        $this->assertSame('{PREFIX}-{YEAR}-{SEQ:5}', Setting::get('numbering_pattern'));
        $this->assertSame('10', Setting::get('retention_years'));
        $this->assertFalse(Setting::get('require_mfa'));

        $this->actingAs($manager, 'sanctum')
            ->getJson('/api/v1/settings')
            ->assertJsonPath('data.numbering_pattern', '{PREFIX}-{YEAR}-{SEQ:5}');
    }

    public function test_staff_cannot_view_or_update_settings(): void
    {
        $this->seed();

        $staff = $this->userWithRole('it_staff');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/settings')
            ->assertStatus(403);

        $this->actingAs($staff, 'sanctum')
            ->putJson('/api/v1/settings', ['retention_years' => '3'])
            ->assertStatus(403);
    }

    public function test_auditor_without_backup_permission_cannot_generate_backup(): void
    {
        $this->seed();

        $auditor = $this->userWithRole('auditor');

        $this->actingAs($auditor, 'sanctum')
            ->getJson('/api/v1/settings/backup')
            ->assertStatus(403);

        $this->actingAs($this->userWithRole('it_manager'), 'sanctum')
            ->getJson('/api/v1/settings/backup')
            ->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['export_date', 'version', 'settings', 'counts']]);
    }

    public function test_invalid_retention_value_is_rejected(): void
    {
        $this->seed();

        $this->actingAs($this->userWithRole('super_admin'), 'sanctum')
            ->putJson('/api/v1/settings', ['retention_years' => '4'])
            ->assertStatus(422);
    }
}
