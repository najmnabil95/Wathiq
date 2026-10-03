<?php

namespace Database\Seeders;

use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Organization;
use App\Models\Status;
use Illuminate\Database\Seeder;

class CoreDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedOrganizations();
        $this->seedDepartments();
        $this->seedConfidentialityLevels();
        $this->seedStatuses();
    }

    private function seedOrganizations(): void
    {
        $orgs = [
            ['name' => 'IT & Systems Division',          'name_ar' => 'إدارة تقنية المعلومات والأنظمة', 'type' => 'internal'],
            ['name' => 'Finance & Accounting',            'name_ar' => 'الإدارة المالية والمحاسبة',       'type' => 'internal'],
            ['name' => 'Human Resources',                 'name_ar' => 'الموارد البشرية',                  'type' => 'internal'],
            ['name' => 'Operations',                      'name_ar' => 'إدارة العمليات والتشغيل',          'type' => 'internal'],
            ['name' => 'Corporate Security',              'name_ar' => 'الأمن والسلامة المؤسسية',          'type' => 'internal'],
            ['name' => 'Executive Office',                'name_ar' => 'الإدارة العليا والتنفيذية',         'type' => 'internal'],
            ['name' => 'National Cybersecurity Authority','name_ar' => 'الهيئة الوطنية للأمن السيبراني',   'type' => 'government'],
        ];

        foreach ($orgs as $org) {
            Organization::firstOrCreate(['name' => $org['name']], $org);
        }
    }

    private function seedDepartments(): void
    {
        $depts = [
            ['code' => 'IT',   'name' => 'IT & Systems',                'name_ar' => 'تقنية المعلومات والأنظمة'],
            ['code' => 'FIN',  'name' => 'Finance & Accounting',         'name_ar' => 'الإدارة المالية والمحاسبة'],
            ['code' => 'HR',   'name' => 'Human Resources',              'name_ar' => 'الموارد البشرية'],
            ['code' => 'OPS',  'name' => 'Operations',                   'name_ar' => 'إدارة العمليات والتشغيل'],
            ['code' => 'SEC',  'name' => 'Corporate Security',           'name_ar' => 'الأمن والسلامة المؤسسية'],
            ['code' => 'EXEC', 'name' => 'Executive Office',             'name_ar' => 'الإدارة العليا والتنفيذية'],
            ['code' => 'INFRA','name' => 'Infrastructure & Databases',   'name_ar' => 'البنية التحتية وقواعد البيانات'],
        ];

        foreach ($depts as $dept) {
            Department::firstOrCreate(['code' => $dept['code']], $dept);
        }
    }

    private function seedConfidentialityLevels(): void
    {
        $levels = [
            ['name' => 'public',           'name_ar' => 'عام',         'label' => 'Public',           'label_ar' => 'عام',         'color' => 'green',  'level_order' => 0],
            ['name' => 'internal',         'name_ar' => 'داخلي',       'label' => 'Internal',         'label_ar' => 'داخلي',       'color' => 'blue',   'level_order' => 1],
            ['name' => 'confidential',     'name_ar' => 'سري',         'label' => 'Confidential',     'label_ar' => 'سري',         'color' => 'orange', 'level_order' => 2],
            ['name' => 'highly_confidential','name_ar' => 'سري للغاية','label' => 'Highly Confidential','label_ar' => 'سري للغاية','color' => 'red',    'level_order' => 3],
        ];

        foreach ($levels as $level) {
            ConfidentialityLevel::firstOrCreate(['name' => $level['name']], $level);
        }
    }

    private function seedStatuses(): void
    {
        $statuses = [
            ['name' => 'new',              'name_ar' => 'جديد',              'label' => 'New',              'label_ar' => 'جديد',              'color' => 'blue',   'icon' => 'FilePlus',        'is_default' => true,  'is_final' => false, 'sort_order' => 1],
            ['name' => 'in_progress',      'name_ar' => 'قيد التنفيذ',       'label' => 'In Progress',      'label_ar' => 'قيد التنفيذ',       'color' => 'amber',  'icon' => 'RefreshCw',       'is_default' => false, 'is_final' => false, 'sort_order' => 2],
            ['name' => 'pending_approval', 'name_ar' => 'بانتظار الاعتماد',  'label' => 'Pending Approval', 'label_ar' => 'بانتظار الاعتماد',  'color' => 'yellow', 'icon' => 'Clock',           'is_default' => false, 'is_final' => false, 'sort_order' => 3],
            ['name' => 'approved',         'name_ar' => 'معتمد',             'label' => 'Approved',         'label_ar' => 'معتمد',             'color' => 'green',  'icon' => 'CheckCircle',     'is_default' => false, 'is_final' => false, 'sort_order' => 4],
            ['name' => 'completed',        'name_ar' => 'مكتمل',             'label' => 'Completed',        'label_ar' => 'مكتمل',             'color' => 'emerald','icon' => 'CheckCheck',      'is_default' => false, 'is_final' => true,  'sort_order' => 5],
            ['name' => 'rejected',         'name_ar' => 'مرفوض',             'label' => 'Rejected',         'label_ar' => 'مرفوض',             'color' => 'red',    'icon' => 'XCircle',         'is_default' => false, 'is_final' => true,  'sort_order' => 6],
            ['name' => 'cancelled',        'name_ar' => 'ملغي',              'label' => 'Cancelled',        'label_ar' => 'ملغي',              'color' => 'gray',   'icon' => 'Ban',             'is_default' => false, 'is_final' => true,  'sort_order' => 7],
            ['name' => 'archived',         'name_ar' => 'مؤرشف',             'label' => 'Archived',         'label_ar' => 'مؤرشف',             'color' => 'slate',  'icon' => 'Archive',         'is_default' => false, 'is_final' => true,  'sort_order' => 8],
        ];

        foreach ($statuses as $status) {
            Status::firstOrCreate(['name' => $status['name']], $status);
        }
    }
}
