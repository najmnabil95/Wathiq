<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $user = User::whereHas('roles', fn ($q) => $q->where('name', $role))->first();

        if (!$user) {
            $user = User::create([
                'name'          => "Test {$role}",
                'username'      => "test_{$role}_" . uniqid(),
                'email'         => "test_{$role}_" . uniqid() . '@edms.local',
                'password'      => 'Secret@12345',
                'status'        => 'active',
                'department_id' => Department::firstOrFail()->id,
            ]);
            $user->roles()->attach(Role::where('name', $role)->firstOrFail());
        }

        return $user;
    }

    private function makeTargetUser(): User
    {
        return User::create([
            'name'          => 'Target User',
            'username'      => 'target_' . uniqid(),
            'email'         => 'target_' . uniqid() . '@edms.local',
            'password'      => 'Secret@12345',
            'status'        => 'active',
            'department_id' => Department::firstOrFail()->id,
        ]);
    }

    public function test_status_change_requires_users_change_status_permission(): void
    {
        $this->seed();

        $staff  = $this->userWithRole('it_staff');
        $admin  = $this->userWithRole('super_admin');
        $target = $this->makeTargetUser();

        $this->actingAs($staff, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/status", ['status' => 'inactive'])
            ->assertStatus(403);

        $this->assertSame('active', $target->fresh()->status);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/status", ['status' => 'inactive'])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame('inactive', $target->fresh()->status);
    }

    public function test_deactivating_user_revokes_tokens_and_cannot_target_self(): void
    {
        $this->seed();

        $admin  = $this->userWithRole('super_admin');
        $target = $this->makeTargetUser();
        $target->createToken('web')->plainTextToken;

        $this->assertSame(1, $target->tokens()->count());

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$admin->id}/status", ['status' => 'inactive'])
            ->assertStatus(422);

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/status", ['status' => 'inactive'])
            ->assertOk();

        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_password_reset_requires_permission_and_revokes_sessions(): void
    {
        $this->seed();

        $staff  = $this->userWithRole('it_staff');
        $admin  = $this->userWithRole('super_admin');
        $target = $this->makeTargetUser();
        $target->createToken('web')->plainTextToken;

        $this->actingAs($staff, 'sanctum')
            ->postJson("/api/v1/users/{$target->id}/reset-password", [
                'password'              => 'NewSecret@123',
                'password_confirmation' => 'NewSecret@123',
            ])
            ->assertStatus(403);

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/users/{$target->id}/reset-password", [
                'password'              => 'NewSecret@123',
                'password_confirmation' => 'NewSecret@123',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('NewSecret@123', $target->fresh()->password));
        $this->assertSame(0, $target->tokens()->count());
    }

    public function test_password_reset_validates_confirmation_and_length(): void
    {
        $this->seed();

        $admin  = $this->userWithRole('super_admin');
        $target = $this->makeTargetUser();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/users/{$target->id}/reset-password", [
                'password'              => 'short',
                'password_confirmation' => 'different',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['password']);
    }

    public function test_it_manager_can_manage_non_super_admin_accounts(): void
    {
        $this->seed();

        $manager = $this->userWithRole('it_manager');
        $target  = $this->makeTargetUser();

        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/status", ['status' => 'inactive'])
            ->assertOk();

        $this->assertSame('inactive', $target->fresh()->status);

        $this->actingAs($manager, 'sanctum')
            ->postJson("/api/v1/users/{$target->id}/reset-password", [
                'password'              => 'NewSecret@123',
                'password_confirmation' => 'NewSecret@123',
            ])
            ->assertOk();

        $this->assertTrue(Hash::check('NewSecret@123', $target->fresh()->password));

        $superAdmin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();

        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/v1/users/{$superAdmin->id}/status", ['status' => 'inactive'])
            ->assertStatus(422);
    }

    public function test_user_creation_requires_department(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();

        $payload = [
            'name'                  => 'No Department User',
            'username'              => 'no_dept_' . uniqid(),
            'email'                 => 'no_dept_' . uniqid() . '@edms.local',
            'password'              => 'Secret@12345',
            'password_confirmation' => 'Secret@12345',
        ];

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/users', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('department_id');

        $this->assertDatabaseMissing('users', ['username' => $payload['username']]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/users', $payload + ['department_id' => Department::firstOrFail()->id])
            ->assertCreated();

        $this->assertDatabaseHas('users', ['username' => $payload['username']]);
    }
}
