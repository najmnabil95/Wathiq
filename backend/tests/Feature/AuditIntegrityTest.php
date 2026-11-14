<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuditIntegrityTest extends TestCase
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

    public function test_verification_requires_audit_verify_integrity_permission(): void
    {
        $this->seed();

        $staff   = $this->userWithRole('it_staff');
        $auditor = $this->userWithRole('auditor');

        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/audit-logs/verify')
            ->assertStatus(403);

        $this->actingAs($auditor, 'sanctum')
            ->getJson('/api/v1/audit-logs/verify')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_audit_entries_are_linked_into_a_valid_hash_chain(): void
    {
        $this->seed();
        DB::table('audit_logs')->delete();

        $auditor = $this->userWithRole('auditor');
        $service = app(AuditService::class);

        $service->log('create', null, null, ['ref' => 1], 'First entry');
        $service->log('update', null, ['ref' => 1], ['ref' => 2], 'Second entry');
        $service->log('delete', null, ['ref' => 2], null, 'Third entry');

        $entries = AuditLog::orderBy('id')->get();
        $this->assertCount(3, $entries);
        $this->assertNull($entries[0]->previous_hash);
        $this->assertSame($entries[0]->hash, $entries[1]->previous_hash);
        $this->assertSame($entries[1]->hash, $entries[2]->previous_hash);
        $this->assertNotNull($entries[2]->hash);

        $response = $this->actingAs($auditor, 'sanctum')
            ->getJson('/api/v1/audit-logs/verify')
            ->assertOk()
            ->assertJsonPath('data.valid', true);

        $this->assertSame(3, $response->json('data.verified_entries'));
        $this->assertSame(0, $response->json('data.legacy_entries'));
    }

    public function test_tampered_audit_entry_breaks_the_chain(): void
    {
        $this->seed();
        DB::table('audit_logs')->delete();

        $auditor = $this->userWithRole('auditor');
        $service = app(AuditService::class);

        $service->log('create', null, null, ['ref' => 1], 'First entry');
        $service->log('update', null, ['ref' => 1], ['ref' => 2], 'Second entry');
        $service->log('delete', null, ['ref' => 2], null, 'Third entry');

        $second = AuditLog::orderBy('id')->skip(1)->firstOrFail();

        DB::table('audit_logs')
            ->where('id', $second->id)
            ->update(['description' => 'بيان معدّل بعد التسجيل']);

        $response = $this->actingAs($auditor, 'sanctum')
            ->getJson('/api/v1/audit-logs/verify')
            ->assertOk()
            ->assertJsonPath('data.valid', false);

        $this->assertSame($second->id, $response->json('data.broken_at'));
    }

    public function test_legacy_entries_without_hash_do_not_invalidate_the_chain(): void
    {
        $this->seed();
        DB::table('audit_logs')->delete();

        $auditor = $this->userWithRole('auditor');

        DB::table('audit_logs')->insert([
            'action'     => 'legacy',
            'created_at' => now()->subDay(),
            'hash'       => null,
            'previous_hash' => null,
        ]);

        app(AuditService::class)->log('create', null, null, ['ref' => 1], 'Post-migration entry');

        $response = $this->actingAs($auditor, 'sanctum')
            ->getJson('/api/v1/audit-logs/verify')
            ->assertOk()
            ->assertJsonPath('data.valid', true);

        $this->assertSame(1, $response->json('data.legacy_entries'));
        $this->assertSame(1, $response->json('data.verified_entries'));
    }

    public function test_audit_entry_cannot_be_updated_through_the_model(): void
    {
        $log = app(AuditService::class)->log('create', null, null, ['ref' => 1], 'Immutable entry');

        $this->expectException(\RuntimeException::class);

        $log->update(['description' => 'tampered']);
    }

    public function test_audit_entry_cannot_be_deleted_through_the_model(): void
    {
        $log = app(AuditService::class)->log('create', null, null, ['ref' => 1], 'Immutable entry');

        $this->expectException(\RuntimeException::class);

        $log->delete();
    }

    public function test_created_at_is_not_rewritten_by_a_raw_update(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->markTestSkipped('MariaDB TIMESTAMP ON UPDATE behaviour is MySQL-specific.');
        }

        $log = app(AuditService::class)->log('create', null, null, ['ref' => 1], 'Immutable entry');
        $createdAt = $log->created_at->format('Y-m-d H:i:s');

        DB::table('audit_logs')->where('id', $log->id)->update(['ip_address' => '10.0.0.1']);

        $this->assertSame($createdAt, DB::table('audit_logs')->where('id', $log->id)->value('created_at'));
    }
}
