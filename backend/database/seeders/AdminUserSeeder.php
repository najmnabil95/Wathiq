<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $itDept = Department::where('code', 'IT')->first();

        // Super Admin — password from ENV or fallback (CHANGE IN PRODUCTION)
        $admin = User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'admin@edms.local')],
            [
                'name'            => env('ADMIN_NAME', 'مدير النظام'),
                'username'        => env('ADMIN_USERNAME', 'admin'),
                'email'           => env('ADMIN_EMAIL', 'admin@edms.local'),
                'employee_number' => 'EMP-001',
                'department_id'   => $itDept?->id,
                'password'        => Hash::make(env('ADMIN_PASSWORD', 'ChangeMe@123')),
                'status'          => 'active',
            ]
        );

        $superAdminRole = Role::where('name', 'super_admin')->first();
        if ($superAdminRole && !$admin->hasRole('super_admin')) {
            $admin->roles()->attach($superAdminRole->id);
        }

        // IT Manager demo user
        $manager = User::firstOrCreate(
            ['email' => 'manager@edms.local'],
            [
                'name'            => 'مدير تقنية المعلومات',
                'username'        => 'it_manager',
                'email'           => 'manager@edms.local',
                'employee_number' => 'EMP-002',
                'department_id'   => $itDept?->id,
                'password'        => Hash::make(env('DEMO_PASSWORD', 'Demo@123456')),
                'status'          => 'active',
            ]
        );

        $managerRole = Role::where('name', 'it_manager')->first();
        if ($managerRole && !$manager->hasRole('it_manager')) {
            $manager->roles()->attach($managerRole->id);
        }

        // IT Staff demo user
        $staff = User::firstOrCreate(
            ['email' => 'staff@edms.local'],
            [
                'name'            => 'موظف تقنية المعلومات',
                'username'        => 'it_staff',
                'email'           => 'staff@edms.local',
                'employee_number' => 'EMP-003',
                'department_id'   => $itDept?->id,
                'password'        => Hash::make(env('DEMO_PASSWORD', 'Demo@123456')),
                'status'          => 'active',
            ]
        );

        $staffRole = Role::where('name', 'it_staff')->first();
        if ($staffRole && !$staff->hasRole('it_staff')) {
            $staff->roles()->attach($staffRole->id);
        }
    }
}
