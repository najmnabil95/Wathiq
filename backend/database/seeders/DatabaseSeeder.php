<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Order matters — run in dependency order.
     */
    public function run(): void
    {
        $this->call([
            // 1. Core lookup data (no dependencies)
            CoreDataSeeder::class,

            // 2. Department Branches & Structure
            DepartmentBranchSeeder::class,

            // 3. RBAC
            RolesPermissionsSeeder::class,

            // 4. Categories & Document Types
            CategoryDocumentTypeSeeder::class,

            // 4.1 Default Workflow Templates (depends on Types + Roles)
            WorkflowSeeder::class,

            // 5. Admin Users (depends on Roles + Departments)
            AdminUserSeeder::class,

            // 6. Rich IT Sample Documents & Approvals
            DummyDataSeeder::class,

            // 7. System settings defaults
            SettingsSeeder::class,
        ]);
    }
}