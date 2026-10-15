<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthProfileTest extends TestCase
{
    use RefreshDatabase;

    private function createTestUser(): User
    {
        return User::create([
            'name'            => 'مدير الاختبار',
            'username'        => 'test_admin',
            'email'           => 'test@edms.local',
            'employee_number' => 'EMP-TEST-01',
            'password'        => bcrypt('Password@123'),
            'status'          => 'active',
        ]);
    }

    public function test_user_can_view_own_profile(): void
    {
        $user = $this->createTestUser();

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.username', 'test_admin');
    }

    public function test_user_can_update_profile(): void
    {
        $user = $this->createTestUser();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/profile', [
                'name'  => 'مدير النظام المطور',
                'phone' => '0555555555',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'مدير النظام المطور')
            ->assertJsonPath('data.phone', '0555555555');

        $this->assertDatabaseHas('users', [
            'id'    => $user->id,
            'name'  => 'مدير النظام المطور',
            'phone' => '0555555555',
        ]);
    }

    public function test_user_can_change_password(): void
    {
        $user = $this->createTestUser();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/auth/password', [
                'current_password'          => 'Password@123',
                'new_password'              => 'NewSecurePass@456',
                'new_password_confirmation' => 'NewSecurePass@456',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}
