<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RolesPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // ─── International Standardized EDMS Permissions Tree ──────────────
        // Fully aligned with ISO 15489-1:2016, ISO 16175 / MoReq2010, and ISO/IEC 27001:2022
        $permissions = [
            // ── 1. Document Ingestion, Registration & Authoring [ISO 15489 §9.2] ──
            [
                'name'            => 'documents.create',
                'display_name'    => 'Register & Capture Documents',
                'display_name_ar' => 'تسجيل والتقاط وثائق جديدة',
                'description_ar'  => 'إنشاء قيد وثيقة رسمية وتوليد الرقم التعريفي الموحد وفق معيار الالتقاط الأرشيفي',
                'group'           => 'documents',
                'subgroup'        => 'authoring',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.2',
            ],
            [
                'name'            => 'documents.update',
                'display_name'    => 'Update Draft Document & Metadata',
                'display_name_ar' => 'تعديل مسودات الوثائق والبيانات الوصفية',
                'description_ar'  => 'تحديث محتوى وبيانات الوثائق في مرحلة المسودة قبل الاعتماد الرسمي والتجميد',
                'group'           => 'documents',
                'subgroup'        => 'authoring',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 16175-2',
            ],
            [
                'name'            => 'documents.change_status',
                'display_name'    => 'Change Document Lifecycle Status',
                'display_name_ar' => 'تعديل حالة دورة حياة الوثيقة',
                'description_ar'  => 'تغيير الحالة الإجرائية للوثيقة (مسودة، مراجعة، معتمدة، ملغاة)',
                'group'           => 'documents',
                'subgroup'        => 'authoring',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'documents.approve',
                'display_name'    => 'Approve Document Officially',
                'display_name_ar' => 'المصادقة والاعتماد الرسمي للوثيقة',
                'description_ar'  => 'منح الاعتماد النهائي للوثيقة وتحويلها إلى سجل رسمي ملزم غير قابل للتعديل',
                'group'           => 'documents',
                'subgroup'        => 'approval',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 15489 §9.4',
            ],
            [
                'name'            => 'documents.reject',
                'display_name'    => 'Reject Document with Stated Reason',
                'display_name_ar' => 'رفض الوثيقة وإعادتها مع الأسباب',
                'description_ar'  => 'رفض اعتماد الوثيقة وإعادتها لمنشئها مع توثيق أسباب عدم المطابقة في سجل الأنشطة',
                'group'           => 'documents',
                'subgroup'        => 'approval',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],

            // ── 2. Access Control & Security Classification [ISO 27001 A.5.15 & ISO 16175] ──
            [
                'name'            => 'documents.view',
                'display_name'    => 'View Department Records',
                'display_name_ar' => 'عرض سجلات الوحدة الإدارية',
                'description_ar'  => 'الاطلاع على الوثائق والمستندات المصرح بها والتابعة للقسم وفق مبدأ الحاجة إلى المعرفة',
                'group'           => 'documents',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 27001 A.5.15',
            ],
            [
                'name'            => 'documents.view_all_departments',
                'display_name'    => 'View Cross-Department Records',
                'display_name_ar' => 'استعراض وثائق الأقسام المشتركة',
                'description_ar'  => 'تجاوز حدود العزل الإداري واستعراض الوثائق العامة لجميع فروع ومؤسسات المنشأة',
                'group'           => 'documents',
                'subgroup'        => 'view',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 16175-1',
            ],
            [
                'name'            => 'documents.view_confidential',
                'display_name'    => 'Access Classified & Confidential Records',
                'display_name_ar' => 'الوصول إلى الوثائق السرية والمقيدة',
                'description_ar'  => 'الاطلاع على السجلات المصنفة بدرجة أمان عالية (سري / سري للغاية / خاضع لاتفاقيات عدم الإفصاح)',
                'group'           => 'documents',
                'subgroup'        => 'view',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.12',
            ],
            [
                'name'            => 'confidentiality.assign',
                'display_name'    => 'Assign Security & Confidentiality Level',
                'display_name_ar' => 'تصنيف وتعيين المستويات الأمنية',
                'description_ar'  => 'تحديد ووسم درجة سريّة الوثيقة (عام، داخلي، سري، سري للغاية) وإعادة تقييمها',
                'group'           => 'settings',
                'subgroup'        => 'security',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.12',
            ],

            // ── 3. Retention, Disposition & Legal Hold [ISO 15489 §9.9 & MoReq2010] ──
            [
                'name'            => 'documents.archive',
                'display_name'    => 'Transfer to Semi-Active / Permanent Archive',
                'display_name_ar' => 'الترحيل للأرشيف الوسيط والدائم',
                'description_ar'  => 'ترحيل الوثائق غير النشطة إلى بيئة الحفظ طويل الأجل وفق جدول فترات الاستبقاء',
                'group'           => 'documents',
                'subgroup'        => 'lifecycle',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 15489 §9.9',
            ],
            [
                'name'            => 'documents.restore',
                'display_name'    => 'Recall & Restore Archived Records',
                'display_name_ar' => 'استرجاع السجلات المؤرشفة',
                'description_ar'  => 'إعادة تفعيل الوثائق المؤرشفة وسحبها للأرشيف الجاري لحاجة العمل الرسمية',
                'group'           => 'documents',
                'subgroup'        => 'lifecycle',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 15489 §9.9',
            ],
            [
                'name'            => 'documents.delete',
                'display_name'    => 'Quarantine Document (Soft Delete)',
                'display_name_ar' => 'حذف منطقي وعزل الوثيقة مؤقتاً',
                'description_ar'  => 'نقل الوثيقة لسلة المحذوفات المؤقتة مع إبقاء أثر التدقيق دون حذف الملف الحقيقي',
                'group'           => 'documents',
                'subgroup'        => 'lifecycle',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 16175-2',
            ],
            [
                'name'            => 'documents.force_delete',
                'display_name'    => 'Definitive Document Destruction',
                'display_name_ar' => 'الإتلاف النهائي الدائم للوثيقة',
                'description_ar'  => 'المحو الفيزيائي النهائي والتام للملف وسجلاته وفق سياسة الإتلاف الآمن للبيانات',
                'group'           => 'documents',
                'subgroup'        => 'lifecycle',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.8.10',
            ],
            [
                'name'            => 'records.legal_hold',
                'display_name'    => 'Apply / Release Legal Hold',
                'display_name_ar' => 'تطبيق ورفع الحجز القانوني (Legal Hold)',
                'description_ar'  => 'تجميد وحظر إتلاف أو تعديل أي وثيقة أثناء النزاعات القضائية أو عمليات التفتيش الرقابي',
                'group'           => 'documents',
                'subgroup'        => 'lifecycle',
                'risk_level'      => 'critical',
                'standard_ref'    => 'MoReq2010 §R.5.1',
            ],
            [
                'name'            => 'disposition.manage',
                'display_name'    => 'Manage Retention Schedules & Disposition Authorities',
                'display_name_ar' => 'إدارة جداول الاستبقاء ومحاضر الإتلاف',
                'description_ar'  => 'تحديد مدد الحفظ النظامية واعتماد محاضر إتلاف الوثائق المنتهية الصلاحية وفق اللوائح',
                'group'           => 'settings',
                'subgroup'        => 'admin',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 15489 §9.9',
            ],

            // ── 4. Digital Assets, Media & DLP Protection [ISO 27001 A.8.12] ──
            [
                'name'            => 'attachments.view',
                'display_name'    => 'Preview Digital Attachments Online',
                'display_name_ar' => 'معاينة المرفقات الرقمية أونلاين',
                'description_ar'  => 'استعراض المستندات والملفات المرفقة ضمن بيئة العرض الآمنة دون تنزيل محلي',
                'group'           => 'attachments',
                'subgroup'        => 'access',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 16175-2',
            ],
            [
                'name'            => 'attachments.download',
                'display_name'    => 'Download Original Digital Master',
                'display_name_ar' => 'تحميل النسخة الرقمية الأصلية',
                'description_ar'  => 'تنزيل الملف الرقمي الأصلي مع تسجيل الحدث في سجل العمليات لمنع التسريب',
                'group'           => 'attachments',
                'subgroup'        => 'access',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 27001 A.8.12',
            ],
            [
                'name'            => 'attachments.upload',
                'display_name'    => 'Upload Supporting Digital Files',
                'display_name_ar' => 'رفع وإرفاق الملفات الرقمية',
                'description_ar'  => 'إرفاق المستندات الممسوحة ضوئياً والملفات الإلكترونية وحفظها في التخزين المأمون',
                'group'           => 'attachments',
                'subgroup'        => 'manage',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.2',
            ],
            [
                'name'            => 'attachments.delete',
                'display_name'    => 'Delete Digital Attachments',
                'display_name_ar' => 'حذف المرفقات الرقمية',
                'description_ar'  => 'إزالة ملفات ملحقة خاطئة قبل تجميد الوثيقة الرسمية',
                'group'           => 'attachments',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'attachments.watermark',
                'display_name'    => 'Export with Dynamic Security Watermark',
                'display_name_ar' => 'التصدير بعلامة مائية أمنية ديناميكية',
                'description_ar'  => 'وسم الملفات المطبوعة أو المصدرة بختم رقمي يحمل اسم المستخدم والتاريخ لمنع التسريب',
                'group'           => 'attachments',
                'subgroup'        => 'access',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.8.12',
            ],

            // ── 5. Versioning, Integrity & Checksums [ISO 15489 §9.5 & ISO 27001 A.8.15] ──
            [
                'name'            => 'versions.view',
                'display_name'    => 'Audit Historical Version Trail',
                'display_name_ar' => 'استعراض سجل الإصدارات التاريخية',
                'description_ar'  => 'مقارنة الإصدارات المتتالية وتتبع تطور محتوى الوثيقة عبر الزمن',
                'group'           => 'versions',
                'subgroup'        => 'history',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.5',
            ],
            [
                'name'            => 'versions.create',
                'display_name'    => 'Promote & Check-in New Revision',
                'display_name_ar' => 'ترقية وإيداع إصدار جديد',
                'description_ar'  => 'رفع مراجعة جديدة وتحديث رقم الإصدار الرئيسي/الفرعي للوثيقة',
                'group'           => 'versions',
                'subgroup'        => 'manage',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 16175-2',
            ],
            [
                'name'            => 'versions.revert',
                'display_name'    => 'Rollback to Prior Baseline Version',
                'display_name_ar' => 'استرجاع نسخة أساسية سابقة',
                'description_ar'  => 'إعادة تعيين إصدار تاريخي معتمد كنسخة نشطة مع تدوين مبررات الرجوع',
                'group'           => 'versions',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'records.verify_hash',
                'display_name'    => 'Verify Cryptographic Integrity (SHA-256)',
                'display_name_ar' => 'التحقق من البصمة الرقمية والتكامل الرياضي',
                'description_ar'  => 'فحص ومطابقة الهاش الرقمي المشفر للوثيقة لضمان عدم تعرضها للتعديل أو التلف الفيزيائي',
                'group'           => 'versions',
                'subgroup'        => 'security',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.8.15',
            ],

            // ── 6. Comments, Notes & Annotations [ISO 16175] ──
            [
                'name'            => 'comments.view',
                'display_name'    => 'Read Routing Notes & Comments',
                'display_name_ar' => 'قراءة التوجيهات والملاحظات الإدارية',
                'description_ar'  => 'الاطلاع على ملاحظات المراجعين والتوجيهات المرفقة بملف المعاملة',
                'group'           => 'comments',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 16175-2',
            ],
            [
                'name'            => 'comments.create',
                'display_name'    => 'Add Official Annotation / Note',
                'display_name_ar' => 'إضافة توجيه وملاحظة رسمية',
                'description_ar'  => 'كتابة إفادة أو توجيه إداري مثبت على سجل المعاملة',
                'group'           => 'comments',
                'subgroup'        => 'manage',
                'risk_level'      => 'normal',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'comments.delete',
                'display_name'    => 'Purge Inappropriate Comments',
                'display_name_ar' => 'شطب وحذف الملاحظات الخاطئة',
                'description_ar'  => 'حذف تعليقات مسودة أو مخالفة لسياسات التوثيق',
                'group'           => 'comments',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],

            // ── 7. Workflow Routing, Delegation & Approvals [ISO 15489 §9.4 / MoReq2010] ──
            [
                'name'            => 'workflows.view',
                'display_name'    => 'Monitor Workflow Stages & Status',
                'display_name_ar' => 'متابعة تدفق مسارات العمل والإنجاز',
                'description_ar'  => 'متابعة مكان المعاملة الحالي وسرعة إنجاز الخطوات المعلقة بين الأقسام',
                'group'           => 'workflows',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.4',
            ],
            [
                'name'            => 'workflows.submit',
                'display_name'    => 'Initiate Workflow Routing',
                'display_name_ar' => 'بدء وإحالة مسار الاعتماد والمراجعة',
                'description_ar'  => 'إرسال الوثيقة في مسار عمل مخصص وفق مصفوفة الصلاحيات وسلاسل الإجراءات',
                'group'           => 'workflows',
                'subgroup'        => 'action',
                'risk_level'      => 'normal',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'workflows.approve',
                'display_name'    => 'Approve Assigned Workflow Step',
                'display_name_ar' => 'اعتماد الخطوة الموكلة في مسار العمل',
                'description_ar'  => 'إقرار وموافقة المسؤول على المعاملة والانتقال للمرحلة الإجرائية التالية',
                'group'           => 'workflows',
                'subgroup'        => 'action',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'workflows.reject',
                'display_name'    => 'Reject Workflow Step',
                'display_name_ar' => 'رفض المعاملة في المسار مع الإفادة',
                'description_ar'  => 'إيقاف مسار المعاملة وإعادتها مع توثيق ملاحظات الرفض',
                'group'           => 'workflows',
                'subgroup'        => 'action',
                'risk_level'      => 'warning',
                'standard_ref'    => 'MoReq2010',
            ],
            [
                'name'            => 'workflows.delegate',
                'display_name'    => 'Delegate Action Authority',
                'display_name_ar' => 'تفويض صلاحية اتخاذ القرار',
                'description_ar'  => 'تفويض صلاحية الاعتماد والمراجعة رسمياً لموظف بديل أثناء فترات الانتداب أو الإجازة',
                'group'           => 'workflows',
                'subgroup'        => 'action',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],
            [
                'name'            => 'workflows.manage',
                'display_name'    => 'Design & Configure Workflow Templates',
                'display_name_ar' => 'تصميم وتخصيص قوالب مسارات العمل',
                'description_ar'  => 'بناء هياكل مسارات المعاملات، تحديد الشروط التلقائية، وتعيين المعتمدين الافتراضيين',
                'group'           => 'workflows',
                'subgroup'        => 'admin',
                'risk_level'      => 'critical',
                'standard_ref'    => 'MoReq2010',
            ],

            // ── 8. Classification Scheme & Metadata Governance [ISO 15489 §9.3 & ISO 23081] ──
            [
                'name'            => 'categories.view',
                'display_name'    => 'Browse File Classification Tree',
                'display_name_ar' => 'تصفح شجرة التصنيف الأرشيفي',
                'description_ar'  => 'الاطلاع على الهيكل الوظيفي الهرمي لتصنيفات وملفات المنشأة',
                'group'           => 'categories',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.3',
            ],
            [
                'name'            => 'categories.manage',
                'display_name'    => 'Maintain Classification Scheme',
                'display_name_ar' => 'إدارة وهيكلة خطة التصنيف الأرشيفية',
                'description_ar'  => 'إنشاء وتعديل فروع التصنيف ورموزها المرجعية وربطها بجداول الحفظ',
                'group'           => 'categories',
                'subgroup'        => 'admin',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 15489 §9.3',
            ],
            [
                'name'            => 'document-types.view',
                'display_name'    => 'View Document Typology & Schemas',
                'display_name_ar' => 'عرض أنواع الوثائق ونماذجها',
                'description_ar'  => 'استعراض النماذج المعيارية المعتمدة للوثائق وقوالب البيانات الوصفية',
                'group'           => 'document-types',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 23081',
            ],
            [
                'name'            => 'document-types.manage',
                'display_name'    => 'Configure Document Schemas & Custom Fields',
                'display_name_ar' => 'إدارة قوالب السجلات وتصميم الحقول الوصفية',
                'description_ar'  => 'تعريف الحقول الإلزامية والاختيارية للبيانات الوصفية (Metadata Schema) وفق معايير Dublin Core',
                'group'           => 'document-types',
                'subgroup'        => 'admin',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 23081-1',
            ],

            // ── 9. Organizational Structure & External Parties [ISO 27001 A.5.3] ──
            [
                'name'            => 'departments.view',
                'display_name'    => 'View Organizational Hierarchy',
                'display_name_ar' => 'استعراض الهيكل الإداري والمكاتب',
                'description_ar'  => 'الاطلاع على الهيكل التنظيمي، الإدارات، الأقسام، والمراكز التابعة',
                'group'           => 'departments',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 27001 A.5.3',
            ],
            [
                'name'            => 'departments.manage',
                'display_name'    => 'Configure Organizational Units',
                'display_name_ar' => 'إدارة وهيكلة الأقسام والفروع',
                'description_ar'  => 'استحداث وتعديل الإدارات وتعيين مدراء الوحدات الإدارية ورموزها الرسمية',
                'group'           => 'departments',
                'subgroup'        => 'admin',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.5.3',
            ],
            [
                'name'            => 'organizations.view',
                'display_name'    => 'View External Correspondence Registry',
                'display_name_ar' => 'عرض سجل الجهات والمؤسسات الخارجية',
                'description_ar'  => 'استعراض دليل الشركات والمؤسسات الحكومية والخاصة المرتبطة بالصادر والوارد',
                'group'           => 'organizations',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.2',
            ],
            [
                'name'            => 'organizations.manage',
                'display_name'    => 'Manage External Parties Directory',
                'display_name_ar' => 'إدارة وتحديث بيانات الجهات الخارجية',
                'description_ar'  => 'إضافة وتصنيف وتوثيق بيانات الاتصال الرسمية للجهات الخارجية',
                'group'           => 'organizations',
                'subgroup'        => 'admin',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 15489 §9.2',
            ],

            // ── 10. Identity & Access Management (IAM) [ISO 27001 A.5.15 - A.5.18] ──
            [
                'name'            => 'users.view',
                'display_name'    => 'View Personnel Directory',
                'display_name_ar' => 'استعراض سجل المستخدمين والموظفين',
                'description_ar'  => 'الاطلاع على قائمة مستخدمي النظام والحسابات النشطة والموقوفة',
                'group'           => 'users',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 27001 A.5.16',
            ],
            [
                'name'            => 'users.create',
                'display_name'    => 'Provision New User Accounts',
                'display_name_ar' => 'إنشاء وتهيئة حسابات الموظفين',
                'description_ar'  => 'إصدار حساب مستخدم جديد وربطه بالرقم الوظيفي والقسم والبريد المؤسسي',
                'group'           => 'users',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.5.16',
            ],
            [
                'name'            => 'users.update',
                'display_name'    => 'Update User Account Attributes',
                'display_name_ar' => 'تحديث بيانات الحسابات والملفات الشخصية',
                'description_ar'  => 'تعديل البيانات الأساسية، المسمى الوظيفي، وتوزيع الموظف الإداري',
                'group'           => 'users',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.5.16',
            ],
            [
                'name'            => 'users.change_status',
                'display_name'    => 'Suspend / Reactivate User Accounts',
                'display_name_ar' => 'تجميد وتعليق وتنشيط الحسابات',
                'description_ar'  => 'حظر فوري لحساب الموظف عند انتهاء الخدمة أو تعليقه مؤقتاً لدواعي أمنية',
                'group'           => 'users',
                'subgroup'        => 'manage',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.5.16',
            ],
            [
                'name'            => 'users.reset_password',
                'display_name'    => 'Enforce Credential Reset',
                'display_name_ar' => 'إلزام إعادة تعيين كلمات المرور',
                'description_ar'  => 'توليد رابط آمن لإعادة تعيين بيانات الاعتماد وفق سياسات التعقيد المعتمدة',
                'group'           => 'users',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.17',
            ],
            [
                'name'            => 'users.delete',
                'display_name'    => 'Deprovision User Account Permanently',
                'display_name_ar' => 'إلغاء وحذف حساب المستخدم نهائياً',
                'description_ar'  => 'إلغاء الحساب نهائياً مع المحافظة على نزاهة سجلات العمليات السابقة (Non-repudiation)',
                'group'           => 'users',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],

            // ── 11. Role Governance & Segregation of Duties (SoD) [ISO 27001 A.5.3] ──
            [
                'name'            => 'roles.view',
                'display_name'    => 'Audit Role Matrix & Permissions Tree',
                'display_name_ar' => 'فحص مصفوفة الأدوار وشجرة الصلاحيات',
                'description_ar'  => 'الاطلاع على خريطة توزيع الصلاحيات والامتيازات الممنوحة للأدوار الوظيفية',
                'group'           => 'roles',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],
            [
                'name'            => 'roles.manage',
                'display_name'    => 'General Role Administration (Legacy)',
                'display_name_ar' => 'الإدارة العامة للأدوار والامتيازات',
                'description_ar'  => 'صلاحية عامة لإدارة وضبط قواعد الأدوار الوظيفية',
                'group'           => 'roles',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],
            [
                'name'            => 'roles.create',
                'display_name'    => 'Author New Organizational Role',
                'display_name_ar' => 'إنشاء دور أمني ووظيفي جديد',
                'description_ar'  => 'تعريف دور وظيفي جديد وفق مصفوفة الامتيازات ومبدأ الامتياز الأقل (Least Privilege)',
                'group'           => 'roles',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],
            [
                'name'            => 'roles.update',
                'display_name'    => 'Modify Role Permissions Tree',
                'display_name_ar' => 'تخصيص وتعديل شجرة صلاحيات الدور',
                'description_ar'  => 'إسناد وسحب الصلاحيات الدقيقة من الدور الوظيفي مع مراعاة فصل المهام الرقابية',
                'group'           => 'roles',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.3',
            ],
            [
                'name'            => 'roles.delete',
                'display_name'    => 'Decommission Custom Role',
                'display_name_ar' => 'حذف وإلغاء الأدوار المخصصة',
                'description_ar'  => 'إزالة الأدوار المخصصة غير الأساسية بعد تفريغ المستخدمين المسندين لها',
                'group'           => 'roles',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],
            [
                'name'            => 'roles.assign',
                'display_name'    => 'Assign / Revoke User Roles',
                'display_name_ar' => 'إسناد وسحب الأدوار من الموظفين',
                'description_ar'  => 'منح الصلاحيات للموظفين عبر ربطهم بالأدوار الوظيفية المعتمدة وفق المهام الموكلة',
                'group'           => 'roles',
                'subgroup'        => 'manage',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.5.18',
            ],

            // ── 12. Immutable Audit Logging & Non-Repudiation [ISO 27001 A.8.15 & ISO 15489 §9.6] ──
            [
                'name'            => 'audit.view',
                'display_name'    => 'Inspect Tamper-Evident Audit Trails',
                'display_name_ar' => 'فحص ومراقبة سجل العمليات والرقابة',
                'description_ar'  => 'الاطلاع على السجل الأمني الموثق لكافة الأنشطة (المستخدم، الحدث، الوقت، عنوان IP، والتفاصيل)',
                'group'           => 'audit',
                'subgroup'        => 'view',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 27001 A.8.15',
            ],
            [
                'name'            => 'audit.export',
                'display_name'    => 'Extract Audit Logs for External Review',
                'display_name_ar' => 'تصدير سجلات الرقابة للجهات التفتيشية',
                'description_ar'  => 'تصدير سجلات التدقيق بصيغ معتمدة للأجهزة القضائية والرقابية وهيئات الامتثال',
                'group'           => 'audit',
                'subgroup'        => 'export',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.8.15',
            ],
            [
                'name'            => 'audit.verify_integrity',
                'display_name'    => 'Verify Audit Log Chain Integrity',
                'display_name_ar' => 'التحقق من عدم التلاعب بسجلات العمليات',
                'description_ar'  => 'إجراء فحص سلامة وتكامل تسلسلي لسجلات الرقابة لضمان عدم تعرضها للحذف أو التعديل',
                'group'           => 'audit',
                'subgroup'        => 'security',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.8.15',
            ],

            // ── 13. Regulatory Reporting & Business Intelligence [ISO 15489 §9.7] ──
            [
                'name'            => 'reports.view',
                'display_name'    => 'Access Operational Analytics & KPI Dashboards',
                'display_name_ar' => 'استعراض لوحات المؤشرات التشغيلية',
                'description_ar'  => 'متابعة مؤشرات أداء الأرشفة، أحجام التخزين، ومعدلات تدفق المعاملات اليومية',
                'group'           => 'reports',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.7',
            ],
            [
                'name'            => 'reports.export',
                'display_name'    => 'Export Statistical Compliance Reports',
                'display_name_ar' => 'تصدير التقارير الإحصائية المعتمدة',
                'description_ar'  => 'تصدير بيانات وجداول الأداء ومؤشرات الأرشفة بصيغ Excel و PDF الموثقة',
                'group'           => 'reports',
                'subgroup'        => 'export',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.7',
            ],
            [
                'name'            => 'reports.advanced',
                'display_name'    => 'Generate Advanced Retention & Storage Analytics',
                'display_name_ar' => 'استخراج تحليلات الاستبقاء والامتثال المتقدمة',
                'description_ar'  => 'توليد تقارير استشرافية لمدد الاستبقاء القريبة من الإتلاف ومعدلات نمو السجلات الرقمية',
                'group'           => 'reports',
                'subgroup'        => 'export',
                'risk_level'      => 'warning',
                'standard_ref'    => 'ISO 16175-1',
            ],

            // ── 14. System Configuration & Archive Preservation [ISO 27001 A.8.13 & ISO 15489 §9.8] ──
            [
                'name'            => 'settings.view',
                'display_name'    => 'Review Governance & Archiving Policies',
                'display_name_ar' => 'الاطلاع على سياسات الحفظ والترميز',
                'description_ar'  => 'مراجعة الإعدادات العامة لسياسات الأرشفة ومعايير التشفير وأنماط الترقيم التلقائي',
                'group'           => 'settings',
                'subgroup'        => 'view',
                'risk_level'      => 'normal',
                'standard_ref'    => 'ISO 15489 §9.8',
            ],
            [
                'name'            => 'settings.manage',
                'display_name'    => 'Configure Archival Policies & Standards',
                'display_name_ar' => 'إدارة وضبط سياسات الأرشفة والترميز',
                'description_ar'  => 'تخصيص قواعد ترقيم الوثائق التلقائي، ضبط مدد الاستبقاء الافتراضية، وسياسات الأمان',
                'group'           => 'settings',
                'subgroup'        => 'admin',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 15489 §9.8',
            ],
            [
                'name'            => 'settings.backup',
                'display_name'    => 'Execute Encrypted Archive Backup & Disaster Recovery',
                'display_name_ar' => 'النسخ الاحتياطي المشفر والتعافي من الكوارث',
                'description_ar'  => 'توليد واسترجاع النسخ الاحتياطية المشفرة الكاملة لقاعدة البيانات ومخزن الملفات الرقمي',
                'group'           => 'settings',
                'subgroup'        => 'admin',
                'risk_level'      => 'critical',
                'standard_ref'    => 'ISO 27001 A.8.13',
            ],
        ];

        // Upsert all standardized permissions
        foreach ($permissions as $perm) {
            Permission::updateOrCreate(
                ['name' => $perm['name']],
                $perm
            );
        }

        // ─── Standardized Global Roles Definition ─────────────────────
        // Fully segregated roles according to ISO 15489, ISO 16175, and ISO 27001
        $allPermissions = Permission::pluck('name')->toArray();

        // 1. System & Security Administrator [ISO 27001]
        // Responsible for technical infrastructure, security, and IAM (Principle of Separation from Content Manipulation)
        $superAdmin = Role::firstOrCreate(
            ['name' => 'super_admin'],
            [
                'display_name'    => 'System & Security Administrator',
                'display_name_ar' => 'مدير النظام والمسؤول التقني',
                'description'     => 'الإشراف التقني الشامل، إدارة البنية التحتية، إعدادات الأمان، النسخ الاحتياطي، وحوكمة الهويات وفق ISO 27001.',
                'is_system'       => true,
            ]
        );
        $superAdmin->syncPermissions($allPermissions);

        // 2. Records Manager / Archiving Officer [ISO 15489 / ISO 16175]
        // Responsible for the lifecycle, disposition schedules, legal holds, and archiving governance
        $itManager = Role::firstOrCreate(
            ['name' => 'it_manager'],
            [
                'display_name'    => 'Records Manager / Archiving Officer',
                'display_name_ar' => 'مدير الأرشيف والحفظ القانوني',
                'description'     => 'المسؤول المعتمد عن دورة حياة الوثائق، تطبيق جداول الاستبقاء، الحجز القانوني (Legal Hold)، وإجراءات الترحيل والإتلاف وفق ISO 15489.',
                'is_system'       => true,
            ]
        );
        $itManager->syncPermissions([
            'documents.create', 'documents.update', 'documents.change_status', 'documents.approve', 'documents.reject',
            'documents.view', 'documents.view_all_departments', 'documents.view_confidential',
            'documents.archive', 'documents.restore', 'documents.delete',
            'records.legal_hold', 'disposition.manage',
            'attachments.view', 'attachments.download', 'attachments.upload', 'attachments.delete', 'attachments.watermark',
            'versions.view', 'versions.create', 'versions.revert', 'records.verify_hash',
            'comments.view', 'comments.create', 'comments.delete',
            'workflows.view', 'workflows.submit', 'workflows.approve', 'workflows.reject', 'workflows.delegate', 'workflows.manage',
            'categories.view', 'categories.manage',
            'document-types.view', 'document-types.manage',
            'departments.view', 'departments.manage',
            'organizations.view', 'organizations.manage',
            'users.view',
            'roles.view',
            'audit.view', 'audit.export',
            'reports.view', 'reports.export', 'reports.advanced',
            'settings.view', 'settings.manage', 'settings.backup',
            'confidentiality.assign',
        ]);

        // 3. Records Specialist / Archiving Operator [ISO 15489 §9.2]
        // Daily capture, scanning, indexing, metadata entry, and workflow submission
        $itStaff = Role::firstOrCreate(
            ['name' => 'it_staff'],
            [
                'display_name'    => 'Records Specialist / Archivist',
                'display_name_ar' => 'أخصائي التوثيق والأرشفة الرقمية',
                'description'     => 'التقاط وتسجيل الوثائق اليومية، إدخال البيانات الوصفية والفهرسة، رفع المرفقات، وإحالة المعاملات للمراجعة وفق المعايير.',
                'is_system'       => true,
            ]
        );
        $itStaff->syncPermissions([
            'documents.create', 'documents.update', 'documents.change_status',
            'documents.view',
            'attachments.view', 'attachments.download', 'attachments.upload', 'attachments.watermark',
            'versions.view', 'versions.create', 'records.verify_hash',
            'comments.view', 'comments.create',
            'workflows.view', 'workflows.submit',
            'categories.view',
            'document-types.view',
            'departments.view',
            'organizations.view',
            'reports.view',
        ]);

        // 4. Action Officer / Document Approver [MoReq2010 / ISO 15489 §9.4]
        // Business unit head responsible for reviewing, endorsing, and delegating approvals
        $approver = Role::firstOrCreate(
            ['name' => 'approver'],
            [
                'display_name'    => 'Document Approver / Action Officer',
                'display_name_ar' => 'المعتمد ورئيس جهة العمل',
                'description'     => 'مراجعة المعاملات والوثائق المحالة، المصادقة الرسمية والاعتماد أو الرفض، وتفويض المهام وفق مصفوفة التفويض المالي والإداري.',
                'is_system'       => true,
            ]
        );
        $approver->syncPermissions([
            'documents.view', 'documents.approve', 'documents.reject',
            'attachments.view', 'attachments.download', 'attachments.watermark',
            'versions.view',
            'comments.view', 'comments.create',
            'workflows.view', 'workflows.approve', 'workflows.reject', 'workflows.delegate',
            'categories.view',
            'departments.view',
            'reports.view',
        ]);

        // 5. Compliance & Legal Auditor [ISO 19011 / ISO 27001 A.8.15]
        // Independent reviewer with read-only scrutiny of records, security trails, and verification
        $auditor = Role::firstOrCreate(
            ['name' => 'auditor'],
            [
                'display_name'    => 'Compliance & Legal Auditor',
                'display_name_ar' => 'مدقق الامتثال والرقابة القانونية',
                'description'     => 'التدقيق والتحقق الرقابي المستقل من نزاهة السجلات وسجلات العمليات المشفرة ومطابقة إجراءات الحفظ للأنظمة واللوائح الدولية.',
                'is_system'       => true,
            ]
        );
        $auditor->syncPermissions([
            'documents.view', 'documents.view_all_departments', 'documents.view_confidential',
            'attachments.view', 'attachments.download', 'attachments.watermark',
            'versions.view', 'records.verify_hash',
            'comments.view',
            'workflows.view',
            'categories.view',
            'document-types.view',
            'departments.view',
            'organizations.view',
            'audit.view', 'audit.export', 'audit.verify_integrity',
            'reports.view', 'reports.export', 'reports.advanced',
            'settings.view',
        ]);

        // 6. Authorized Consumer / Viewer [ISO 15489 §9.7]
        // Read-only access to permitted departmental records
        $viewer = Role::firstOrCreate(
            ['name' => 'viewer'],
            [
                'display_name'    => 'Authorized Consumer / Viewer',
                'display_name_ar' => 'المستعرض المصرّح له (اطلاع فقط)',
                'description'     => 'الاطلاع والبحث والاسترجاع للمستندات والملفات المصرح بها فقط لقسم المستخدم دون أي صلاحيات تعديل أو ترحيل.',
                'is_system'       => true,
            ]
        );
        $viewer->syncPermissions([
            'documents.view',
            'attachments.view', 'attachments.download',
            'versions.view',
            'comments.view',
            'categories.view',
            'document-types.view',
            'departments.view',
        ]);
    }
}
