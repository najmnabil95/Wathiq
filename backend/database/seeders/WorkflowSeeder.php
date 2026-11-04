<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use App\Models\Role;
use App\Models\Workflow;
use Illuminate\Database\Seeder;

class WorkflowSeeder extends Seeder
{
    /**
     * Seed standard multi-level approval workflow templates.
     */
    public function run(): void
    {
        $templates = [
            'ACC_GRANT' => [
                'name'        => 'Access Request Approval',
                'name_ar'     => 'مسار اعتماد طلبات الصلاحيات',
                'description' => 'مراجعة فنية، اعتماد مدير الأرشيف، ثم المصادقة النهائية لطلبات منح الصلاحيات.',
                'steps'       => [
                    ['name' => 'Technical Review',   'name_ar' => 'مراجعة فنية للأثر الأمني',  'role' => 'it_staff',   'type' => 'review',   'instructions' => 'التحقق من مبررات الطلب ونطاق الصلاحية المطلوبة.'],
                    ['name' => 'Archiving Approval', 'name_ar' => 'اعتماد مدير الأرشيف',       'role' => 'it_manager', 'type' => 'approve',  'instructions' => 'مطابقة الطلب لسياسة الوصول وتصنيف السرية.'],
                    ['name' => 'Final Authorization','name_ar' => 'المصادقة النهائية',         'role' => 'approver',   'type' => 'approve',  'instructions' => 'الاعتماد الرسمي النهائي وإصدار القرار.'],
                ],
            ],
            'SYS_MOD' => [
                'name'        => 'System Modification Approval',
                'name_ar'     => 'مسار اعتماد تعديلات الأنظمة',
                'description' => 'مسار ثلاثي المستويات لتعديلات الأنظمة يشمل المراجعة الفنية والاعتماد الإداري والمصادقة النهائية.',
                'steps'       => [
                    ['name' => 'Technical Impact Review', 'name_ar' => 'مراجعة الأثر الفني',      'role' => 'it_staff',   'type' => 'review',   'instructions' => 'تقييم الأثر على الأنظمة والخدمات وتوثيق خطة التراجع.'],
                    ['name' => 'Records Manager Approval','name_ar' => 'اعتماد مدير الأرشيف',    'role' => 'it_manager', 'type' => 'approve',  'instructions' => 'التحقق من متطلبات الحفظ والتدقيق.'],
                    ['name' => 'Executive Authorization', 'name_ar' => 'المصادقة التنفيذية',      'role' => 'approver',   'type' => 'approve',  'instructions' => 'الاعتماد النهائي قبل التنفيذ.'],
                ],
            ],
            'RFC_STD' => [
                'name'        => 'Standard Change Approval',
                'name_ar'     => 'مسار اعتماد طلبات التغيير الاعتيادية',
                'description' => 'مراجعة التغيير، اعتماد لجنة التغيير، ثم المصادقة الأمنية النهائية.',
                'steps'       => [
                    ['name' => 'Change Review',       'name_ar' => 'مراجعة طلب التغيير',     'role' => 'it_staff',   'type' => 'review',   'instructions' => 'مراجعة النطاق والجدول الزمني وخطة الاختبار.'],
                    ['name' => 'Change Board Approval','name_ar' => 'اعتماد لجنة التغيير',    'role' => 'it_manager', 'type' => 'approve',  'instructions' => 'اعتماد التغيير وفق سياسة إدارة التغيير.'],
                    ['name' => 'Security Sign-off',   'name_ar' => 'المصادقة الأمنية النهائية','role' => 'auditor',    'type' => 'acknowledge','instructions' => 'التحقق من الالتزام بضوابط الأمن السيبراني.'],
                ],
            ],
        ];

        foreach ($templates as $typeCode => $template) {
            $documentType = DocumentType::where('code', $typeCode)->first();
            if (!$documentType) {
                continue;
            }

            $workflow = Workflow::firstOrCreate(
                [
                    'document_type_id' => $documentType->id,
                    'name'             => $template['name'],
                ],
                [
                    'name_ar'     => $template['name_ar'],
                    'description' => $template['description'],
                    'is_active'   => true,
                ]
            );

            if (!$workflow->wasRecentlyCreated) {
                continue;
            }

            foreach ($template['steps'] as $index => $step) {
                $role = Role::where('name', $step['role'])->first();

                $workflow->steps()->create([
                    'name'         => $step['name'],
                    'name_ar'      => $step['name_ar'],
                    'role_id'      => $role?->id,
                    'step_order'   => $index + 1,
                    'is_required'  => true,
                    'action_type'  => $step['type'],
                    'instructions' => $step['instructions'],
                ]);
            }
        }
    }
}
