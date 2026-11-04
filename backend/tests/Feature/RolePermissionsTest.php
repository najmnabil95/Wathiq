<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RolePermissionsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithPermissions(array $permissions): User
    {
        static $seq = 0;
        $seq++;

        $role = Role::create([
            'name'            => "test_role_{$seq}_" . uniqid(),
            'display_name'    => "Test Role {$seq}",
            'display_name_ar' => "دور اختبار {$seq}",
            'is_system'       => false,
        ]);
        $role->syncPermissions($permissions);

        $user = User::create([
            'name'          => "Test User {$seq}",
            'username'      => "test_user_{$seq}_" . uniqid(),
            'email'         => "test_user_{$seq}_" . uniqid() . '@edms.local',
            'password'      => 'Secret@12345',
            'status'        => 'active',
            'department_id' => Department::firstOrFail()->id,
        ]);
        $user->roles()->attach($role);

        return $user;
    }

    private function makeTargetRole(string $suffix): Role
    {
        return Role::create([
            'name'            => "target_role_{$suffix}",
            'display_name'    => "Target Role {$suffix}",
            'display_name_ar' => "دور مستهدف {$suffix}",
            'is_system'       => false,
        ]);
    }

    public function test_roles_create_does_not_grant_update_or_delete(): void
    {
        $this->seed();

        $creator = $this->userWithPermissions(['roles.create']);
        $target  = $this->makeTargetRole('a');

        $this->actingAs($creator, 'sanctum')
            ->postJson('/api/v1/roles', [
                'display_name_ar' => 'دور جديد من المختبر',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('roles', ['display_name_ar' => 'دور جديد من المختبر']);

        $this->actingAs($creator, 'sanctum')
            ->putJson("/api/v1/roles/{$target->id}", ['display_name_ar' => 'محاولة تعديل'])
            ->assertStatus(403);

        $this->actingAs($creator, 'sanctum')
            ->deleteJson("/api/v1/roles/{$target->id}")
            ->assertStatus(403);

        $this->assertDatabaseHas('roles', ['id' => $target->id]);
    }

    public function test_roles_manage_still_allows_full_role_lifecycle(): void
    {
        $this->seed();

        $manager = $this->userWithPermissions(['roles.manage']);
        $target  = $this->makeTargetRole('b');

        $this->actingAs($manager, 'sanctum')
            ->postJson('/api/v1/roles', ['display_name_ar' => 'دور مدير الصلاحيات'])
            ->assertCreated();

        $this->actingAs($manager, 'sanctum')
            ->putJson("/api/v1/roles/{$target->id}", ['display_name_ar' => 'دور معاد تسميته'])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSame('دور معاد تسميته', $target->fresh()->display_name_ar);

        $this->actingAs($manager, 'sanctum')
            ->deleteJson("/api/v1/roles/{$target->id}")
            ->assertOk();

        $this->assertDatabaseMissing('roles', ['id' => $target->id]);
    }

    public function test_roles_assign_allows_role_assignment_without_users_update(): void
    {
        $this->seed();

        $assigner = $this->userWithPermissions(['roles.assign']);
        $updater  = $this->userWithPermissions(['users.update']);
        $target   = $this->userWithPermissions([]);
        $newRole  = $this->makeTargetRole('c');

        $this->actingAs($updater, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/roles", ['roles' => [$newRole->id]])
            ->assertStatus(403);

        $this->actingAs($assigner, 'sanctum')
            ->putJson("/api/v1/users/{$target->id}/roles", ['roles' => [$newRole->id]])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue($target->fresh()->roles->contains('id', $newRole->id));
    }

    public function test_super_admin_bypasses_granular_role_permissions(): void
    {
        $this->seed();

        $admin  = User::whereHas('roles', fn ($q) => $q->where('name', 'super_admin'))->firstOrFail();
        $target = $this->makeTargetRole('d');

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/roles/{$target->id}", ['display_name_ar' => 'تعديل مدير النظام'])
            ->assertOk();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/roles/{$target->id}")
            ->assertOk();
    }
}
