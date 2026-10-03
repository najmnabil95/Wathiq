<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\DocumentType;
use Illuminate\Database\Seeder;

class CategoryDocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'code' => 'SYS_MOD', 'name' => 'System Modifications', 'name_ar' => 'تعديلات الأنظمة',
                'icon' => 'Code2', 'color' => 'blue', 'sort_order' => 1,
                'types' => [
                    ['name' => 'System Modification',   'name_ar' => 'تعديل نظام',   'code' => 'SYS_MOD',   'prefix' => 'SYS',    'requires_approval' => true],
                    ['name' => 'System Upgrade',        'name_ar' => 'ترقية نظام',   'code' => 'SYS_UPG',   'prefix' => 'SYS',    'requires_approval' => true],
                    ['name' => 'System Configuration',  'name_ar' => 'إعداد نظام',   'code' => 'SYS_CFG',   'prefix' => 'SYS',    'requires_approval' => false],
                ],
            ],
            [
                'code' => 'ACCESS', 'name' => 'Access Requests', 'name_ar' => 'طلبات الصلاحيات',
                'icon' => 'KeyRound', 'color' => 'emerald', 'sort_order' => 2,
                'types' => [
                    ['name' => 'Permission Grant',    'name_ar' => 'طلب صلاحية',    'code' => 'ACC_GRANT',   'prefix' => 'ACCESS',  'requires_approval' => true],
                    ['name' => 'Permission Revoke',   'name_ar' => 'إلغاء صلاحية',  'code' => 'ACC_REVOKE',  'prefix' => 'ACCESS',  'requires_approval' => true],
                    ['name' => 'Permission Modify',   'name_ar' => 'تعديل صلاحية',  'code' => 'ACC_MOD',     'prefix' => 'ACCESS',  'requires_approval' => true],
                ],
            ],
            [
                'code' => 'USER_MGMT', 'name' => 'User Management', 'name_ar' => 'إدارة المستخدمين',
                'icon' => 'UserCheck', 'color' => 'violet', 'sort_order' => 3,
                'types' => [
                    ['name' => 'Create User',   'name_ar' => 'إنشاء مستخدم',   'code' => 'USR_CREATE',  'prefix' => 'USER',  'requires_approval' => false],
                    ['name' => 'Modify User',   'name_ar' => 'تعديل مستخدم',   'code' => 'USR_MOD',     'prefix' => 'USER',  'requires_approval' => false],
                    ['name' => 'Suspend User',  'name_ar' => 'إيقاف مستخدم',   'code' => 'USR_SUS',     'prefix' => 'USER',  'requires_approval' => true],
                    ['name' => 'Delete User',   'name_ar' => 'حذف مستخدم',     'code' => 'USR_DEL',     'prefix' => 'USER',  'requires_approval' => true],
                ],
            ],
            [
                'code' => 'CCTV', 'name' => 'CCTV Reviews', 'name_ar' => 'مراجعة الكاميرات',
                'icon' => 'Video', 'color' => 'rose', 'sort_order' => 4,
                'types' => [
                    ['name' => 'CCTV Review Request', 'name_ar' => 'طلب مراجعة كاميرا', 'code' => 'CCTV_REV', 'prefix' => 'CCTV', 'requires_approval' => true],
                    ['name' => 'CCTV Investigation',  'name_ar' => 'تحقيق مراقبة',       'code' => 'CCTV_INV', 'prefix' => 'CCTV', 'requires_approval' => true],
                ],
            ],
            [
                'code' => 'DIRECTIVES', 'name' => 'Directives & Instructions', 'name_ar' => 'التوجيهات والتعليمات',
                'icon' => 'BookOpenCheck', 'color' => 'amber', 'sort_order' => 5,
                'types' => [
                    ['name' => 'Administrative Directive', 'name_ar' => 'توجيه إداري',    'code' => 'DIR_ADM',  'prefix' => 'DIR', 'requires_approval' => false],
                    ['name' => 'Security Directive',       'name_ar' => 'توجيه أمني',      'code' => 'DIR_SEC',  'prefix' => 'DIR', 'requires_approval' => false],
                    ['name' => 'IT Policy',                'name_ar' => 'سياسة تقنية',     'code' => 'DIR_POL',  'prefix' => 'DIR', 'requires_approval' => true],
                ],
            ],
            [
                'code' => 'TECH_SUP', 'name' => 'Technical Support', 'name_ar' => 'الدعم الفني',
                'icon' => 'LifeBuoy', 'color' => 'cyan', 'sort_order' => 6,
                'types' => [
                    ['name' => 'Support Request', 'name_ar' => 'طلب دعم فني', 'code' => 'SUP_REQ', 'prefix' => 'SUP', 'requires_approval' => false],
                    ['name' => 'Support Report',  'name_ar' => 'تقرير دعم فني','code' => 'SUP_RPT', 'prefix' => 'SUP', 'requires_approval' => false],
                ],
            ],
            [
                'code' => 'NETWORKS', 'name' => 'Networks & Infrastructure', 'name_ar' => 'الشبكات والبنية التحتية',
                'icon' => 'Network', 'color' => 'indigo', 'sort_order' => 7,
                'types' => [
                    ['name' => 'Network Issue',  'name_ar' => 'مشكلة شبكة',  'code' => 'NET_ISS', 'prefix' => 'NET', 'requires_approval' => false],
                    ['name' => 'Network Change', 'name_ar' => 'تغيير شبكة',  'code' => 'NET_CHG', 'prefix' => 'NET', 'requires_approval' => true],
                    ['name' => 'Network Report', 'name_ar' => 'تقرير شبكة',  'code' => 'NET_RPT', 'prefix' => 'NET', 'requires_approval' => false],
                ],
            ],
            [
                'code' => 'HARDWARE', 'name' => 'Hardware & Assets', 'name_ar' => 'الأجهزة والمعدات',
                'icon' => 'Cpu', 'color' => 'teal', 'sort_order' => 8,
                'types' => [
                    ['name' => 'Hardware Receipt',    'name_ar' => 'استلام معدات',   'code' => 'HW_REC', 'prefix' => 'HW', 'requires_approval' => false],
                    ['name' => 'Hardware Disposal',   'name_ar' => 'إتلاف معدات',    'code' => 'HW_DIS', 'prefix' => 'HW', 'requires_approval' => true],
                    ['name' => 'Hardware Maintenance','name_ar' => 'صيانة معدات',    'code' => 'HW_MNT', 'prefix' => 'HW', 'requires_approval' => false],
                ],
            ],
            [
                'code' => 'CORRESPONDENCE', 'name' => 'IT Correspondence', 'name_ar' => 'المراسلات والخطابات',
                'icon' => 'Mail', 'color' => 'sky', 'sort_order' => 9,
                'types' => [
                    ['name' => 'Incoming Letter', 'name_ar' => 'خطاب وارد',   'code' => 'CORR_IN',  'prefix' => 'CORR', 'requires_approval' => false],
                    ['name' => 'Outgoing Letter', 'name_ar' => 'خطاب صادر',   'code' => 'CORR_OUT', 'prefix' => 'CORR', 'requires_approval' => false],
                    ['name' => 'Internal Memo',   'name_ar' => 'مذكرة داخلية','code' => 'CORR_MEM', 'prefix' => 'CORR', 'requires_approval' => false],
                ],
            ],
            [
                'code' => 'CHANGE_REQ', 'name' => 'Change Requests (RFC)', 'name_ar' => 'طلبات التغيير',
                'icon' => 'GitPullRequest', 'color' => 'purple', 'sort_order' => 10,
                'types' => [
                    ['name' => 'Standard Change',   'name_ar' => 'تغيير اعتيادي',  'code' => 'RFC_STD',  'prefix' => 'RFC', 'requires_approval' => true],
                    ['name' => 'Emergency Change',  'name_ar' => 'تغيير طارئ',     'code' => 'RFC_EMG',  'prefix' => 'RFC', 'requires_approval' => true],
                    ['name' => 'Major Change',      'name_ar' => 'تغيير جوهري',    'code' => 'RFC_MAJ',  'prefix' => 'RFC', 'requires_approval' => true],
                ],
            ],
            [
                'code' => 'REPORTS', 'name' => 'Technical Reports', 'name_ar' => 'التقارير الفنية',
                'icon' => 'FileSpreadsheet', 'color' => 'green', 'sort_order' => 11,
                'types' => [
                    ['name' => 'Security Report',  'name_ar' => 'تقرير أمني',    'code' => 'RPT_SEC',  'prefix' => 'RPT', 'requires_approval' => false],
                    ['name' => 'Monthly Report',   'name_ar' => 'تقرير شهري',    'code' => 'RPT_MON',  'prefix' => 'RPT', 'requires_approval' => false],
                    ['name' => 'Audit Report',     'name_ar' => 'تقرير تدقيق',   'code' => 'RPT_AUD',  'prefix' => 'RPT', 'requires_approval' => false],
                    ['name' => 'Pentest Report',   'name_ar' => 'تقرير اختراق',  'code' => 'RPT_PEN',  'prefix' => 'RPT', 'requires_approval' => false],
                ],
            ],
            [
                'code' => 'OTHER', 'name' => 'General Archive', 'name_ar' => 'أخرى وأرشيف عام',
                'icon' => 'Archive', 'color' => 'slate', 'sort_order' => 12,
                'types' => [
                    ['name' => 'General Document', 'name_ar' => 'وثيقة عامة', 'code' => 'GEN', 'prefix' => 'IT', 'requires_approval' => false],
                ],
            ],
        ];

        foreach ($categories as $catData) {
            $types = $catData['types'] ?? [];
            unset($catData['types']);

            $category = Category::firstOrCreate(
                ['code' => $catData['code']],
                $catData
            );

            foreach ($types as $type) {
                DocumentType::firstOrCreate(
                    ['code' => $type['code']],
                    array_merge($type, ['category_id' => $category->id])
                );
            }
        }
    }
}
