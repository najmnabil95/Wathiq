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

            // 2. RBAC
            RolesPermissionsSeeder::class,

            // 3. Categories & Document Types
            CategoryDocumentTypeSeeder::class,

            // 4. Admin Users (depends on Roles + Departments)
            AdminUserSeeder::class,

            // 5. Rich IT Sample Documents & Approvals
            DummyDataSeeder::class,
        ]);
    }
}
