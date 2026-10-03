<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Organization;
use Illuminate\Database\Seeder;

class DepartmentBranchSeeder extends Seeder
{
    public function run(): void
    {
        $org = Organization::first();

        $branches = [
            // ── فروع تقنية المعلومات والأنظمة (IT & Systems Branches) ──
            'IT' => [
                [
                    'code'        => 'IT-DEV',
                    'name'        => 'Systems & Software Development',
                    'name_ar'     => 'فرع تطوير الأنظمة والبرمجيات',
                    'description' => 'إدارة وتطوير المنظومات وقواعد البيانات والتطبيقات الداخلية.',
                ],
                [
                    'code'        => 'IT-NET',
                    'name'        => 'Networks & Telecommunications',
                    'name_ar'     => 'فرع الشبكات والاتصالات',
                    'description' => 'إدارة البنية التحتية للشبكات والربط السحابي ومقاسم الاتصالات.',
                ],
                [
                    'code'        => 'IT-SUPP',
                    'name'        => 'Technical Support & Helpdesk',
                    'name_ar'     => 'فرع الدعم الفني وصيانة الأجهزة',
                    'description' => 'خدمات الدعم المباشر ومكتب المساعدة وصيانة أجهزة الموظفين.',
                ],
                [
                    'code'        => 'IT-SEC',
                    'name'        => 'Cybersecurity & Data Protection',
                    'name_ar'     => 'فرع الأمن السيبراني وحماية البيانات',
                    'description' => 'مراقبة الثغرات والامتثال لضوابط الأمن السيبراني والتحقيقات الرقمية.',
                ],
                [
                    'code'        => 'IT-DB',
                    'name'        => 'Databases & Cloud Storage',
                    'name_ar'     => 'فرع قواعد البيانات والنسخ الاحتياطي',
                    'description' => 'إدارة خوادم قواعد البيانات المركزية وخطط التعافي من الكوارث.',
                ],
            ],

            // ── فروع الإدارة المالية والمحاسبة ──
            'FIN' => [
                [
                    'code'        => 'FIN-ACC',
                    'name'        => 'General Accounting',
                    'name_ar'     => 'فرع الحسابات العامة والقيود',
                    'description' => 'إعداد القوائم المالية والقيود اليومية والتسويات البنكية.',
                ],
                [
                    'code'        => 'FIN-PROC',
                    'name'        => 'Procurement & Tenders',
                    'name_ar'     => 'فرع المشتريات والمناقصات',
                    'description' => 'عقود التوريد وأوامر الشراء ومناقصات الأجهزة التقنية.',
                ],
                [
                    'code'        => 'FIN-AUD',
                    'name'        => 'Internal Financial Audit',
                    'name_ar'     => 'فرع الرقابة والتدقيق المالي',
                    'description' => 'مطابقة المصروفات والفواتير والتحقق من المعايير المحاسبية.',
                ],
            ],

            // ── فروع الموارد البشرية ──
            'HR' => [
                [
                    'code'        => 'HR-REC',
                    'name'        => 'Recruitment & Talent Acquisition',
                    'name_ar'     => 'فرع التوظيف واستقطاب الكفاءات',
                    'description' => 'الإعلانات الوظيفية والمقابلات الفنية وعقود العمل.',
                ],
                [
                    'code'        => 'HR-OPS',
                    'name'        => 'Personnel & Payroll',
                    'name_ar'     => 'فرع شؤون الموظفين والرواتب',
                    'description' => 'مسيرات الرواتب والإجازات والتأمينات والعهد الإدارية.',
                ],
            ],

            // ── فروع إدارة العمليات والتشغيل ──
            'OPS' => [
                [
                    'code'        => 'OPS-HQ',
                    'name'        => 'Headquarters Operations',
                    'name_ar'     => 'فرع تشغيل المركز الرئيسي',
                    'description' => 'الإشراف على العمليات الميدانية للمبنى الرئيسي والمرافق.',
                ],
                [
                    'code'        => 'OPS-RYD',
                    'name'        => 'Riyadh Regional Operations',
                    'name_ar'     => 'فرع العمليات — الرياض',
                    'description' => 'متابعة تشغيل المستودعات والخدمات الميدانية بمنطقة الرياض.',
                ],
                [
                    'code'        => 'OPS-JED',
                    'name'        => 'Jeddah Regional Operations',
                    'name_ar'     => 'فرع العمليات — جدة',
                    'description' => 'متابعة المرافق والخدمات الميدانية في المنطقة الغربية.',
                ],
            ],
        ];

        foreach ($branches as $parentCode => $branchList) {
            $parent = Department::where('code', $parentCode)->first();
            if (!$parent) continue;

            foreach ($branchList as $branchData) {
                Department::updateOrCreate(
                    ['code' => $branchData['code']],
                    [
                        'name'            => $branchData['name'],
                        'name_ar'         => $branchData['name_ar'],
                        'description'     => $branchData['description'],
                        'parent_id'       => $parent->id,
                        'organization_id' => $parent->organization_id ?? $org?->id,
                        'is_active'       => true,
                    ]
                );
            }
        }

        // Link sample documents to specific branches
        $docMappings = [
            'SYS-2026-0001' => 'IT-DEV',
            'SYS-2026-0002' => 'IT-NET',
            'SYS-2026-0003' => 'IT-SUPP',
            'SYS-2026-0004' => 'IT-SEC',
            'SYS-2026-0005' => 'IT-DB',
            'SYS-2026-0006' => 'IT-DEV',
            'SYS-2026-0007' => 'FIN-PROC',
            'SYS-2026-0008' => 'OPS-HQ',
            'SYS-2026-0009' => 'IT-SEC',
            'SYS-2026-0010' => 'IT-NET',
            'DIR-2025-0044' => 'IT-SEC',
        ];

        foreach ($docMappings as $docNum => $branchCode) {
            $branch = Department::where('code', $branchCode)->first();
            if ($branch) {
                \App\Models\Document::where('document_number', $docNum)->update([
                    'department_id' => $branch->id,
                ]);
            }
        }
    }
}
