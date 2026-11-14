<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserPermissionOverrideTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $roleName): User
    {
        $user = User::create([
            'name'          => "Override {$roleName}",
            'username'      => 'override_' . uniqid(),
            'email'         => 'override_' . uniqid() . '@edms.local',
            'password'      => 'Secret@12345',
            'status'        => 'active',
            'department_id' => Department::firstOrFail()->id,
        ]);
        $user->roles()->attach(Role::where('name', $roleName)->firstOrFail());

        return $user;
    }

    private function matrixPermission(array $data, string $name): array
    {
        foreach ($data['modules'] as $module) {
            foreach ($module['permissions'] as $perm) {
                if ($perm['name'] === $name) {
                    return $perm;
                }
            }
        }

        $this->fail("Permission {$name} not found in matrix.");
    }

    public function test_grant_override_adds_permission_beyond_role_bundle(): void
    {
        $this->seed();

        $user = $this->makeUser('viewer');
        $perm = Permission::where('name', 'reports.export')->firstOrFail();

        $this->assertFalse(User::find($user->id)->hasPermission('reports.export'));

        $user->permissionOverrides()->sync([$perm->id => ['effect' => 'grant']]);

        $this->assertTrue(User::find($user->id)->hasPermission('reports.export'));
    }

    public function test_deny_override_removes_permission_granted_by_role(): void
    {
        $this->seed();

        $user = $this->makeUser('it_staff');
        $perm = Permission::where('name', 'documents.create')->firstOrFail();

        $this->assertTrue(User::find($user->id)->hasPermission('documents.create'));

        $user->permissionOverrides()->sync([$perm->id => ['effect' => 'deny']]);

        $this->assertFalse(User::find($user->id)->hasPermission('documents.create'));
    }

    public function test_super_admin_bypasses_overrides(): void
    {
        $this->seed();

        $admin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $perm  = Permission::where('name', 'audit.verify_integrity')->firstOrFail();

        $admin->permissionOverrides()->sync([$perm->id => ['effect' => 'deny']]);

        $this->assertTrue(User::find($admin->id)->hasPermission('audit.verify_integrity'));
    }

    public function test_permission_endpoints_require_roles_assign(): void
    {
        $this->seed();

        $staff  = $this->makeUser('it_staff');
        $target = $this->makeUser('viewer');

        $this->actingAs($staff, 'sanctum')
            ->getJson("/api/v1/users/{$target->id}/permissions")
            ->assertStatus(403);

        $this->actingAs($staff, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/permissions", ['overrides' => []])
            ->assertStatus(403);
    }

    public function test_super_admin_can_set_overrides_and_audit_is_recorded(): void
    {
        $this->seed();

        $admin  = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $target = $this->makeUser('it_staff');
        $grant  = Permission::where('name', 'reports.export')->firstOrFail();
        $deny   = Permission::where('name', 'documents.create')->firstOrFail();

        $response = $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/permissions", [
                'overrides' => [
                    ['permission_id' => $grant->id, 'effect' => 'grant'],
                    ['permission_id' => $deny->id, 'effect' => 'deny'],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.override_count', 2);

        $data = $response->json('data');

        $denied = $this->matrixPermission($data, 'documents.create');
        $this->assertTrue($denied['inherited']);
        $this->assertSame('deny', $denied['override']);
        $this->assertFalse($denied['effective']);

        $granted = $this->matrixPermission($data, 'reports.export');
        $this->assertFalse($granted['inherited']);
        $this->assertSame('grant', $granted['override']);
        $this->assertTrue($granted['effective']);

        $this->assertDatabaseHas('permission_user', [
            'user_id'       => $target->id,
            'permission_id' => $grant->id,
            'effect'        => 'grant',
        ]);
        $this->assertDatabaseHas('permission_user', [
            'user_id'       => $target->id,
            'permission_id' => $deny->id,
            'effect'        => 'deny',
        ]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'permission.override']);

        $fresh = User::find($target->id);
        $this->assertTrue($fresh->hasPermission('reports.export'));
        $this->assertFalse($fresh->hasPermission('documents.create'));
    }

    public function test_overrides_refuse_self_edit_and_super_admin_target(): void
    {
        $this->seed();

        $adminRole = Role::create([
            'name'            => 'override_assigner_' . uniqid(),
            'display_name'    => 'Override Assigner',
            'display_name_ar' => 'مسند صلاحيات فردية',
            'is_system'       => false,
        ]);
        $adminRole->syncPermissions(['roles.assign']);

        $assigner = User::create([
            'name'          => 'Assigner',
            'username'      => 'assigner_' . uniqid(),
            'email'         => 'assigner_' . uniqid() . '@edms.local',
            'password'      => 'Secret@12345',
            'status'        => 'active',
            'department_id' => Department::firstOrFail()->id,
        ]);
        $assigner->roles()->attach($adminRole);

        $superAdmin = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $perm       = Permission::where('name', 'documents.view')->firstOrFail();

        $this->actingAs($assigner, 'sanctum')
            ->putJson("/api/v1/users/{$assigner->id}/permissions", [
                'overrides' => [['permission_id' => $perm->id, 'effect' => 'deny']],
            ])
            ->assertStatus(422);

        $this->actingAs($assigner, 'sanctum')
            ->putJson("/api/v1/users/{$superAdmin->id}/permissions", ['overrides' => []])
            ->assertStatus(422);

        $this->assertDatabaseCount('permission_user', 0);
    }

    public function test_invalid_override_effect_is_rejected(): void
    {
        $this->seed();

        $admin  = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $target = $this->makeUser('viewer');
        $perm   = Permission::where('name', 'documents.view')->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/permissions", [
                'overrides' => [['permission_id' => $perm->id, 'effect' => 'maybe']],
            ])
            ->assertStatus(422);
    }
}
