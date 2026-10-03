<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ─── Define all permissions ───────────────────────────────
        $permissions = [
            // Documents
            ['name' => 'documents.view',     'display_name' => 'View Documents',     'display_name_ar' => 'عرض الوثائق',          'group' => 'documents'],
            ['name' => 'documents.create',   'display_name' => 'Create Documents',   'display_name_ar' => 'إنشاء وثائق',          'group' => 'documents'],
            ['name' => 'documents.update',   'display_name' => 'Update Documents',   'display_name_ar' => 'تعديل وثائق',          'group' => 'documents'],
            ['name' => 'documents.delete',   'display_name' => 'Delete Documents',   'display_name_ar' => 'حذف وثائق',            'group' => 'documents'],
            ['name' => 'documents.archive',  'display_name' => 'Archive Documents',  'display_name_ar' => 'أرشفة وثائق',          'group' => 'documents'],
            ['name' => 'documents.restore',  'display_name' => 'Restore Documents',  'display_name_ar' => 'استعادة وثائق',        'group' => 'documents'],
            ['name' => 'documents.approve',  'display_name' => 'Approve Documents',  'display_name_ar' => 'اعتماد وثائق',         'group' => 'documents'],
            ['name' => 'documents.reject',   'display_name' => 'Reject Documents',   'display_name_ar' => 'رفض وثائق',            'group' => 'documents'],

            // Attachments
            ['name' => 'attachments.upload',   'display_name' => 'Upload Attachments',   'display_name_ar' => 'رفع مرفقات',        'group' => 'attachments'],
            ['name' => 'attachments.download', 'display_name' => 'Download Attachments', 'display_name_ar' => 'تحميل مرفقات',      'group' => 'attachments'],
            ['name' => 'attachments.delete',   'display_name' => 'Delete Attachments',   'display_name_ar' => 'حذف مرفقات',        'group' => 'attachments'],

            // Versions
            ['name' => 'versions.view',   'display_name' => 'View Versions',   'display_name_ar' => 'عرض الإصدارات',             'group' => 'versions'],
            ['name' => 'versions.create', 'display_name' => 'Create Versions', 'display_name_ar' => 'إنشاء إصدارات',             'group' => 'versions'],

            // Comments
            ['name' => 'comments.view',   'display_name' => 'View Comments',   'display_name_ar' => 'عرض التعليقات',             'group' => 'comments'],
            ['name' => 'comments.create', 'display_name' => 'Add Comments',    'display_name_ar' => 'إضافة تعليقات',             'group' => 'comments'],
            ['name' => 'comments.delete', 'display_name' => 'Delete Comments', 'display_name_ar' => 'حذف تعليقات',               'group' => 'comments'],

            // Users
            ['name' => 'users.view',   'display_name' => 'View Users',   'display_name_ar' => 'عرض المستخدمين',                  'group' => 'users'],
            ['name' => 'users.create', 'display_name' => 'Create Users', 'display_name_ar' => 'إنشاء مستخدمين',                  'group' => 'users'],
            ['name' => 'users.update', 'display_name' => 'Update Users', 'display_name_ar' => 'تعديل مستخدمين',                  'group' => 'users'],
            ['name' => 'users.delete', 'display_name' => 'Delete Users', 'display_name_ar' => 'حذف مستخدمين',                   'group' => 'users'],

            // Roles
            ['name' => 'roles.view',   'display_name' => 'View Roles',   'display_name_ar' => 'عرض الأدوار',                     'group' => 'roles'],
            ['name' => 'roles.manage', 'display_name' => 'Manage Roles', 'display_name_ar' => 'إدارة الأدوار والصلاحيات',        'group' => 'roles'],

            // Categories
            ['name' => 'categories.view',   'display_name' => 'View Categories',   'display_name_ar' => 'عرض التصنيفات',         'group' => 'categories'],
            ['name' => 'categories.manage', 'display_name' => 'Manage Categories', 'display_name_ar' => 'إدارة التصنيفات',        'group' => 'categories'],

            // Document Types
            ['name' => 'document-types.view',   'display_name' => 'View Document Types',   'display_name_ar' => 'عرض أنواع الوثائق',  'group' => 'document-types'],
            ['name' => 'document-types.manage', 'display_name' => 'Manage Document Types', 'display_name_ar' => 'إدارة أنواع الوثائق', 'group' => 'document-types'],

            // Departments & Organizations
            ['name' => 'departments.view',    'display_name' => 'View Departments',    'display_name_ar' => 'عرض الأقسام',        'group' => 'departments'],
            ['name' => 'departments.manage',  'display_name' => 'Manage Departments',  'display_name_ar' => 'إدارة الأقسام',       'group' => 'departments'],
            ['name' => 'organizations.view',  'display_name' => 'View Organizations',  'display_name_ar' => 'عرض الجهات',         'group' => 'organizations'],
            ['name' => 'organizations.manage','display_name' => 'Manage Organizations','display_name_ar' => 'إدارة الجهات',        'group' => 'organizations'],

            // Workflows
            ['name' => 'workflows.view',   'display_name' => 'View Workflows',   'display_name_ar' => 'عرض سير العمل',            'group' => 'workflows'],
            ['name' => 'workflows.manage', 'display_name' => 'Manage Workflows', 'display_name_ar' => 'إدارة سير العمل',          'group' => 'workflows'],

            // Reports
            ['name' => 'reports.view',   'display_name' => 'View Reports',   'display_name_ar' => 'عرض التقارير',                 'group' => 'reports'],
            ['name' => 'reports.export', 'display_name' => 'Export Reports', 'display_name_ar' => 'تصدير التقارير',               'group' => 'reports'],

            // Audit
            ['name' => 'audit.view', 'display_name' => 'View Audit Logs', 'display_name_ar' => 'عرض سجل العمليات',               'group' => 'audit'],

            // Settings
            ['name' => 'settings.view',   'display_name' => 'View Settings',   'display_name_ar' => 'عرض الإعدادات',              'group' => 'settings'],
            ['name' => 'settings.manage', 'display_name' => 'Manage Settings', 'display_name_ar' => 'إدارة الإعدادات',            'group' => 'settings'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // ─── Define Roles ─────────────────────────────────────────
        $allPermissionNames = Permission::pluck('name')->toArray();

        // Super Admin — all permissions
        $superAdmin = Role::firstOrCreate(
            ['name' => 'super_admin'],
            [
                'display_name'    => 'Super Administrator',
                'display_name_ar' => 'مدير النظام الكامل',
                'description'     => 'Full system access. Cannot be deleted.',
                'is_system'       => true,
            ]
        );
        $superAdmin->givePermissionTo($allPermissionNames);

        // IT Manager
        $itManager = Role::firstOrCreate(
            ['name' => 'it_manager'],
            [
                'display_name'    => 'IT Manager',
                'display_name_ar' => 'مدير تقنية المعلومات',
                'description'     => 'Manages and approves IT documents.',
                'is_system'       => true,
            ]
        );
        $itManager->givePermissionTo([
            'documents.view', 'documents.create', 'documents.update',
            'documents.archive', 'documents.approve', 'documents.reject',
            'attachments.upload', 'attachments.download', 'attachments.delete',
            'versions.view', 'versions.create',
            'comments.view', 'comments.create', 'comments.delete',
            'users.view',
            'categories.view',
            'document-types.view',
            'departments.view',
            'organizations.view',
            'workflows.view',
            'reports.view', 'reports.export',
            'audit.view',
            'settings.view',
        ]);

        // IT Staff
        $itStaff = Role::firstOrCreate(
            ['name' => 'it_staff'],
            [
                'display_name'    => 'IT Staff',
                'display_name_ar' => 'موظف تقنية المعلومات',
                'description'     => 'Creates and manages assigned documents.',
                'is_system'       => true,
            ]
        );
        $itStaff->givePermissionTo([
            'documents.view', 'documents.create', 'documents.update',
            'attachments.upload', 'attachments.download',
            'versions.view', 'versions.create',
            'comments.view', 'comments.create',
            'categories.view',
            'document-types.view',
            'departments.view',
            'organizations.view',
            'reports.view',
        ]);

        // Viewer
        $viewer = Role::firstOrCreate(
            ['name' => 'viewer'],
            [
                'display_name'    => 'Viewer',
                'display_name_ar' => 'مشاهد',
                'description'     => 'Read-only access to permitted documents.',
                'is_system'       => true,
            ]
        );
        $viewer->givePermissionTo([
            'documents.view',
            'attachments.download',
            'versions.view',
            'comments.view',
            'categories.view',
            'document-types.view',
            'departments.view',
        ]);
    }
}
