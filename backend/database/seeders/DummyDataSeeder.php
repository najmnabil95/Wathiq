<?php

namespace Database\Seeders;

use App\Models\Approval;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\ConfidentialityLevel;
use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentAttachment;
use App\Models\DocumentType;
use App\Models\Organization;
use App\Models\Status;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@edms.local')->first() ?? User::first();
        $manager = User::where('email', 'manager@edms.local')->first() ?? $admin;
        $staff = User::where('email', 'staff@edms.local')->first() ?? $admin;

        $itDept = Department::where('code', 'IT')->first();
        $finDept = Department::where('code', 'FIN')->first();
        $secDept = Department::where('code', 'SEC')->first();
        $infraDept = Department::where('code', 'INFRA')->first();

        $org = Organization::first();

        // Confidentiality Levels
        $cPublic = ConfidentialityLevel::where('name', 'public')->first();
        $cInternal = ConfidentialityLevel::where('name', 'internal')->first();
        $cConfidential = ConfidentialityLevel::where('name', 'confidential')->first();
        $cTopSecret = ConfidentialityLevel::where('name', 'highly_confidential')->first();

        // Statuses
        $sNew = Status::where('name', 'new')->first();
        $sInProgress = Status::where('name', 'in_progress')->first();
        $sPending = Status::where('name', 'pending_approval')->first();
        $sApproved = Status::where('name', 'approved')->first();
        $sCompleted = Status::where('name', 'completed')->first();
        $sArchived = Status::where('name', 'archived')->first();

        // Categories
        $catSys = Category::where('code', 'SYS_MOD')->first();
        $catAccess = Category::where('code', 'ACCESS')->first();
        $catUser = Category::where('code', 'USER_MGMT')->first();
        $catCctv = Category::where('code', 'CCTV')->first();
        $catDir = Category::where('code', 'DIRECTIVES')->first();
        $catNet = Category::where('code', 'NETWORKS')->first();
        $catHw = Category::where('code', 'HARDWARE')->first();
        $catRfc = Category::where('code', 'CHANGE_REQ')->first();
        $catCorr = Category::where('code', 'CORRESPONDENCE')->first();

        $docsData = [
            [
                'document_number' => 'SYS-2026-0001',
                'title' => 'ترقية نظام تخطيط الموارد ERP v14 ونقل قاعدة البيانات للسحابة',
                'category_id' => $catSys?->id,
                'document_type_id' => DocumentType::where('code', 'SYS_UPG')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $infraDept?->id ?? $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sApproved?->id,
                'confidentiality_level_id' => $cConfidential?->id,
                'document_date' => Carbon::now()->subDays(12)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(12),
                'description' => "خطة تفصيلية مكتملة وموقعة لترقية خوادم ونظام ERP المؤسسي، متضمنة اختبارات التراجع (Rollback plan) وتوثيق زمن التوقف المجدول خلال عطلة نهاية الأسبوع.",
                'physical_location' => 'مستودع الأرشيف المركزي — الرف R-01، الصندوق BOX-04',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'ERP_Upgrade_Architecture_Plan_v14.pdf',
                        'file_size' => 4582100,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ],
                    [
                        'original_name' => 'Database_Migration_Checklist_Signed.pdf',
                        'file_size' => 1240000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'ACC-2026-0002',
                'title' => 'طلب منح صلاحية وصول متميزة (Root / Privileged) لخوادم الإنتاج',
                'category_id' => $catAccess?->id,
                'document_type_id' => DocumentType::where('code', 'ACC_GRANT')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sPending?->id,
                'confidentiality_level_id' => $cTopSecret?->id,
                'document_date' => Carbon::now()->subDays(1)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(1),
                'description' => "طلب رسمي لمنح مهندس أمن الشبكات صلاحية الوصول إلى خوادم الإنتاج الرئيسية لتركيب التحديثات الأمنية لشهر أكتوبر مع تفعيل التسجيل عبر PAM.",
                'physical_location' => 'خزنة الوثائق السرية — الخزينة الفولاذية S-01، الملف M-02',
                'is_archived' => false,
                'needs_approval' => true,
                'attachments' => [
                    [
                        'original_name' => 'PAM_Access_Request_Form_Signed.pdf',
                        'file_size' => 840500,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'RFC-2026-0003',
                'title' => 'طلب تغيير طارئ (Emergency RFC): تحديث شهادات SSL لخدمات الويب',
                'category_id' => $catRfc?->id,
                'document_type_id' => DocumentType::where('code', 'RFC_EMG')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sPending?->id,
                'confidentiality_level_id' => $cConfidential?->id,
                'document_date' => Carbon::now()->subHours(8)->format('Y-m-d'),
                'received_at' => Carbon::now()->subHours(8),
                'description' => "استبدال شهادات التشفير الرقمية SSL/TLS لمنع توقف بوابات الدفع الإلكتروني وتطبيقات الموظفين قبل موعد الانتهاء.",
                'physical_location' => 'مستودع IT — الرف R-01، الصندوق BOX-06',
                'is_archived' => false,
                'needs_approval' => true,
                'attachments' => [
                    [
                        'original_name' => 'Emergency_RFC_Change_Summary.pdf',
                        'file_size' => 620000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'DIR-2026-0004',
                'title' => 'سياسة تقنية المعلومات الموحدة لضوابط الأمن السيبراني والمصادقة MFA',
                'category_id' => $catDir?->id,
                'document_type_id' => DocumentType::where('code', 'DIR_POL')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $admin?->id,
                'assigned_to' => $staff?->id,
                'status_id' => $sApproved?->id,
                'confidentiality_level_id' => $cInternal?->id,
                'document_date' => Carbon::now()->subDays(20)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(20),
                'description' => "السياسة الرسمية المعتمدة لضوابط الأمن السيبراني الأساسية (ECC) الصادرة عن الإدارة العليا والمتوافقة مع متطلبات الهيئة الوطنية للأمن السيبراني.",
                'physical_location' => 'مستودع الأرشيف — الرف R-02، الصندوق BOX-01',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'IT_Cybersecurity_Policy_2026_Approved.pdf',
                        'file_size' => 3120000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'CCTV-2026-0005',
                'title' => 'محضر تفريغ ومراجعة تسجيلات كاميرات مراقبة مركز البيانات الرئيسي',
                'category_id' => $catCctv?->id,
                'document_type_id' => DocumentType::where('code', 'CCTV_REV')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $secDept?->id ?? $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sApproved?->id,
                'confidentiality_level_id' => $cConfidential?->id,
                'document_date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(5),
                'description' => "محضر تفريغ كاميرا المدخل رقم CAM-DC-02 بناءً على طلب إدارة الأمن والتحقق من حركة الدخول خارج أوقات الدوام الرسمي.",
                'physical_location' => 'مستودع الأرشيف — الرف R-03، الصندوق BOX-05',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'CCTV_Review_Report_DC_Incident.pdf',
                        'file_size' => 1890000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'HW-2026-0006',
                'title' => 'محضر فحص واستلام شحنة خوادم SAN Storage الجديدة لموقع التعافي',
                'category_id' => $catHw?->id,
                'document_type_id' => DocumentType::where('code', 'HW_REC')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $infraDept?->id ?? $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sCompleted?->id,
                'confidentiality_level_id' => $cInternal?->id,
                'document_date' => Carbon::now()->subDays(15)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(15),
                'description' => "محضر الاستلام الفني والتسليم النهائي لعدد 4 وحدات تخزين مصفوفة SAN Storage من المورد الرسمي متضمنة شهادات الضمان الممتد لـ 5 سنوات.",
                'physical_location' => 'مستودع الأرشيف — الرف R-02، الصندوق BOX-03',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'SAN_Storage_Receiving_Inspection_Report.pdf',
                        'file_size' => 2450000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ],
                    [
                        'original_name' => 'Vendor_Warranty_Certificate_5Y.pdf',
                        'file_size' => 950000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'NET-2026-0007',
                'title' => 'مخطط ومعايرة شبكة الفايبر والمسارات الاحتياطية (Redundant Links)',
                'category_id' => $catNet?->id,
                'document_type_id' => DocumentType::where('code', 'NET_RPT')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $infraDept?->id ?? $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $admin?->id,
                'status_id' => $sCompleted?->id,
                'confidentiality_level_id' => $cInternal?->id,
                'document_date' => Carbon::now()->subDays(25)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(25),
                'description' => "مخطط البنية التحتية لشبكة الألياف الضوئية ونتائج اختبارات التبديل التلقائي Failover على مسارات الاتصال الاحتياطية لمباني الإدارة.",
                'physical_location' => 'مستودع الأرشيف — الرف R-04، الصندوق BOX-01',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'Fiber_Topology_Diagram_2026.pdf',
                        'file_size' => 5200000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'USER-2026-0008',
                'title' => 'كشف إيقاف حسابات وبطاقات الوصول للموظفين المغادرين لشهر سبتمبر',
                'category_id' => $catUser?->id,
                'document_type_id' => DocumentType::where('code', 'USR_SUS')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $admin?->id,
                'status_id' => $sCompleted?->id,
                'confidentiality_level_id' => $cConfidential?->id,
                'document_date' => Carbon::now()->subDays(3)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(3),
                'description' => "محضر دوري شهري بالتعاون مع الموارد البشرية لتأكيد تعطيل حسابات البريد الإلكتروني والـ Active Directory ومفاتيح VPN لكافة المنتهية خدماتهم.",
                'physical_location' => 'مستودع الأرشيف — الرف R-02، الصندوق BOX-08',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'Offboarding_IT_Signoff_September_2026.pdf',
                        'file_size' => 780000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'CORR-2026-0009',
                'title' => 'خطاب موجه لمزود خدمة الإنترنت ISP لترقية سعة خط الربط الدولي',
                'category_id' => $catCorr?->id,
                'document_type_id' => DocumentType::where('code', 'CORR_OUT')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $admin?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sApproved?->id,
                'confidentiality_level_id' => $cInternal?->id,
                'document_date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(7),
                'description' => "مراسلة رسمية صادرة للمزود لطلب مضاعفة سرعة النطاق العريض للإنترنت المخصص لمقر الشركة الرئيسي إلى 1Gbps مع اتفاقية مستوى الخدمة SLA.",
                'physical_location' => 'مستودع الأرشيف — الرف R-03، الصندوق BOX-02',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'Official_Letter_ISP_Bandwidth_Upgrade.pdf',
                        'file_size' => 610000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ],
            [
                'document_number' => 'SYS-2026-0010',
                'title' => 'وثيقة المتطلبات الفنية (SRS) لمشروع نظام إدارة الأصول الرقمية',
                'category_id' => $catSys?->id,
                'document_type_id' => DocumentType::where('code', 'SYS_MOD')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $staff?->id,
                'assigned_to' => $manager?->id,
                'status_id' => $sNew?->id,
                'confidentiality_level_id' => $cPublic?->id,
                'document_date' => Carbon::now()->subDays(2)->format('Y-m-d'),
                'received_at' => Carbon::now()->subDays(2),
                'description' => "المسودة الأولى لتوثيق المتطلبات الفنية وتكامل الأنظمة لنظام إدارة الأصول والأجهزة ومسح الباركود الذكي في كافة الفروع.",
                'physical_location' => 'مستودع الأرشيف — الرف R-01، الصندوق BOX-02',
                'is_archived' => false,
                'attachments' => [
                    [
                        'original_name' => 'Asset_Management_SRS_Draft_v1.0.docx',
                        'file_size' => 1430000,
                        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'extension' => 'docx',
                    ]
                ]
            ],
            [
                'document_number' => 'DIR-2025-0044',
                'title' => 'دليل إجراءات الصيانة السنوية لأجهزة النسخ الاحتياطي القديمة LTO-6',
                'category_id' => $catDir?->id,
                'document_type_id' => DocumentType::where('code', 'DIR_POL')->value('id') ?? DocumentType::first()?->id,
                'department_id' => $itDept?->id,
                'organization_id' => $org?->id,
                'created_by' => $admin?->id,
                'assigned_to' => $staff?->id,
                'status_id' => $sArchived?->id,
                'confidentiality_level_id' => $cInternal?->id,
                'document_date' => Carbon::now()->subYears(1)->format('Y-m-d'),
                'received_at' => Carbon::now()->subYears(1),
                'description' => "دليل تشغيلي سابق تم إيقاف العمل به بعد الانتقال للنسخ الاحتياطي السحابي Immutable Cloud Backups وتمت أرشفته نهائياً للرجوع التاريخي.",
                'physical_location' => 'مستودع الأرشيف القديم — الرف R-05، الصندوق BOX-10',
                'is_archived' => true,
                'archived_at' => Carbon::now()->subMonths(3),
                'attachments' => [
                    [
                        'original_name' => 'LTO6_Tape_Maintenance_Procedure_Archived.pdf',
                        'file_size' => 2100000,
                        'mime_type' => 'application/pdf',
                        'extension' => 'pdf',
                    ]
                ]
            ]
        ];

        foreach ($docsData as $data) {
            $attachments = $data['attachments'] ?? [];
            $needsApproval = $data['needs_approval'] ?? false;
            unset($data['attachments'], $data['needs_approval']);

            $doc = Document::firstOrCreate(
                ['document_number' => $data['document_number']],
                $data
            );

            // Add attachments
            foreach ($attachments as $att) {
                DocumentAttachment::firstOrCreate(
                    [
                        'document_id' => $doc->id,
                        'original_name' => $att['original_name'],
                    ],
                    [
                        'file_name' => md5($att['original_name'] . time()) . '.' . $att['extension'],
                        'file_path' => 'documents/' . $doc->id . '/' . $att['original_name'],
                        'disk' => 'private',
                        'mime_type' => $att['mime_type'],
                        'extension' => $att['extension'],
                        'file_size' => $att['file_size'],
                        'checksum' => hash('sha256', $att['original_name']),
                        'uploaded_by' => $doc->created_by,
                    ]
                );
            }

            // Add pending approvals if needed
            if ($needsApproval) {
                Approval::firstOrCreate(
                    [
                        'document_id' => $doc->id,
                        'approver_id' => $manager?->id,
                    ],
                    [
                        'status' => 'pending',
                        'comments' => 'بانتظار المراجعة والاعتماد من قبل مدير إدارة تقنية المعلومات.',
                        'created_at' => Carbon::now()->subHours(4),
                    ]
                );
            }

            // Create initial Audit Logs
            AuditLog::firstOrCreate(
                [
                    'auditable_type' => Document::class,
                    'auditable_id' => $doc->id,
                    'action' => 'document_created',
                ],
                [
                    'user_id' => $doc->created_by,
                    'ip_address' => '127.0.0.1',
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                    'description' => "إنشاء وأرشفة الوثيقة برقم {$doc->document_number} بعنوان: {$doc->title}",
                    'new_values' => [
                        'title' => $doc->title,
                        'document_number' => $doc->document_number,
                        'status' => $doc->status_id,
                        'physical_location' => $doc->physical_location,
                    ],
                    'created_at' => $doc->created_at ?? Carbon::now(),
                ]
            );

            if ($doc->status_id == $sApproved?->id) {
                AuditLog::firstOrCreate(
                    [
                        'auditable_type' => Document::class,
                        'auditable_id' => $doc->id,
                        'action' => 'document_approved',
                    ],
                    [
                        'user_id' => $manager?->id,
                        'ip_address' => '127.0.0.1',
                        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'description' => "تم اعتماد الوثيقة {$doc->document_number} رسمياً من قبل مدير الإدارة",
                        'new_values' => ['status' => 'approved'],
                        'created_at' => Carbon::now()->subDays(1),
                    ]
                );
            }
        }
    }
}
