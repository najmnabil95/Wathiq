export const initialCategories = [
  { id: 1, code: "SYS_MOD", name_ar: "تعديلات الأنظمة", name_en: "System Modifications", icon: "Code", color: "blue", count: 18 },
  { id: 2, code: "ACCESS_REQ", name_ar: "طلبات الصلاحيات", name_en: "Access & Permissions", icon: "KeyRound", color: "emerald", count: 42 },
  { id: 3, code: "USER_MGMT", name_ar: "إدارة المستخدمين", name_en: "User Management", icon: "UserCheck", color: "violet", count: 35 },
  { id: 4, code: "CCTV_REV", name_ar: "مراجعة الكاميرات", name_en: "CCTV Surveillance", icon: "Video", color: "rose", count: 12 },
  { id: 5, code: "DIRECTIVES", name_ar: "التوجيهات والتعليمات", name_en: "Directives & Instructions", icon: "BookOpenCheck", color: "amber", count: 9 },
  { id: 6, code: "TECH_SUP", name_ar: "الدعم الفني", name_en: "Technical Support", icon: "LifeBuoy", color: "cyan", count: 27 },
  { id: 7, code: "NETWORKS", name_ar: "الشبكات والبنية التحتية", name_en: "Networks & Infra", icon: "Network", color: "indigo", count: 16 },
  { id: 8, code: "HARDWARE", name_ar: "الأجهزة والمعدات", name_en: "Hardware & Assets", icon: "Cpu", color: "teal", count: 21 },
  { id: 9, code: "CORRESPONDENCE", name_ar: "المراسلات والخطابات", name_en: "IT Correspondence", icon: "Mail", color: "sky", count: 14 },
  { id: 10, code: "CHANGE_REQ", name_ar: "طلبات التغيير (RFC)", name_en: "Change Requests (RFC)", icon: "GitPullRequest", color: "purple", count: 19 },
  { id: 11, code: "REPORTS", name_ar: "التقارير الفنية والدورية", name_en: "Technical Reports", icon: "FileSpreadsheet", color: "green", count: 25 },
  { id: 12, code: "OTHER", name_ar: "أخرى وأرشيف عام", name_en: "General Archive", icon: "Archive", color: "slate", count: 8 },
];

export const initialDocumentTypes = [
  {
    id: 1,
    categoryId: 2,
    codePrefix: "ACCESS",
    name_ar: "طلب صلاحية نظام تخطيط الموارد (ERP)",
    name_en: "ERP System Access Request",
    confidentiality: "confidential",
    fields: [
      { id: "emp_name", label_ar: "اسم الموظف المستفيد", label_en: "Employee Name", type: "text", required: true },
      { id: "emp_id", label_ar: "الرقم الوظيفي", label_en: "Employee ID", type: "text", required: true },
      { id: "department", label_ar: "القسم / الإدارة", label_en: "Department", type: "select", options: ["المالية", "الموارد البشرية", "المستودعات والمشتريات", "التسويق والمبيعات", "الإدارة التنفيذية"], required: true },
      { id: "system_name", label_ar: "النظام المستهدف", label_en: "Target System", type: "select", options: ["SAP S/4HANA", "Oracle ERP", "HR Portal", "WMS Warehouse"], required: true },
      { id: "role_type", label_ar: "نوع الصلاحية المطلوبة", label_en: "Permission Scope", type: "select", options: ["قراءة فقط (Read-only)", "إدخال وترحيل (Data Entry)", "اعتماد وإلغاء (Approval & Supervise)", "مدير وحدة (Module Admin)"], required: true },
      { id: "reason", label_ar: "مبررات منح الصلاحية", label_en: "Business Justification", type: "textarea", required: true },
    ]
  },
  {
    id: 2,
    categoryId: 4,
    codePrefix: "CCTV",
    name_ar: "طلب مراجعة وتسجيل كاميرات المراقبة",
    name_en: "CCTV Surveillance Footage Review",
    confidentiality: "highly_confidential",
    fields: [
      { id: "cctv_location", label_ar: "موقع الكاميرا / المبنى", label_en: "Camera Location", type: "text", required: true },
      { id: "cam_numbers", label_ar: "أرقام الكاميرات المعنية", label_en: "Camera Identifiers", type: "text", required: true },
      { id: "review_date", label_ar: "تاريخ الواقعة المطلوب مراجعتها", label_en: "Incident Date", type: "date", required: true },
      { id: "time_from", label_ar: "الوقت من", label_en: "Time From", type: "time", required: true },
      { id: "time_to", label_ar: "الوقت إلى", label_en: "Time To", type: "time", required: true },
      { id: "incident_reason", label_ar: "سبب المراجعة والبلاغ الأمني", label_en: "Reason for Review", type: "textarea", required: true },
      { id: "findings", label_ar: "نتيجة المراجعة الفنية لقسم IT", label_en: "Security Findings", type: "textarea", required: false },
    ]
  },
  {
    id: 3,
    categoryId: 3,
    codePrefix: "USER",
    name_ar: "إنشاء / ترقية حساب مستخدم في الدومين",
    name_en: "Active Directory User Provisioning",
    confidentiality: "internal",
    fields: [
      { id: "full_name", label_ar: "الاسم الكامل للمستخدم", label_en: "Full Name", type: "text", required: true },
      { id: "job_title", label_ar: "المسمى الوظيفي", label_en: "Job Title", type: "text", required: true },
      { id: "corp_email", label_ar: "البريد الإلكتروني المؤسسي المقترح", label_en: "Requested Email", type: "email", required: true },
      { id: "dept_name", label_ar: "الإدارة التابع لها", label_en: "Department", type: "select", options: ["تقنية المعلومات", "الشؤون القانونية", "المبيعات", "المحاسبة", "المستودعات"], required: true },
      { id: "direct_manager", label_ar: "المدير المباشر", label_en: "Direct Manager", type: "text", required: true },
      { id: "vpn_required", label_ar: "تفعيل الوصول عن بعد (VPN)", label_en: "Require VPN Access", type: "select", options: ["نعم", "لا"], required: true },
    ]
  },
  {
    id: 4,
    categoryId: 10,
    codePrefix: "RFC",
    name_ar: "طلب إدارة وتغيير برمجي (RFC - Change Request)",
    name_en: "System Change Request (RFC)",
    confidentiality: "confidential",
    fields: [
      { id: "target_app", label_ar: "النظام أو التطبيق المتأثر", label_en: "Affected System", type: "text", required: true },
      { id: "change_type", label_ar: "نوع التغيير", label_en: "Change Type", type: "select", options: ["ترقية إصدار (Version Upgrade)", "إصلاح ثغرة (Security Patch)", "تعديل إعدادات (Config Change)", "ترحيل سيرفر (Migration)"], required: true },
      { id: "risk_level", label_ar: "مستوى الخطورة على الخدمة", label_en: "Risk Level", type: "select", options: ["منخفض (Low)", "متوسط (Medium)", "عالي (High)", "حرج (Critical)"], required: true },
      { id: "planned_downtime", label_ar: "مدة التوقف المخطط لها (ساعات)", label_en: "Planned Downtime (Hours)", type: "number", required: true },
      { id: "rollback_plan", label_ar: "خطة التراجع في حال الفشل (Rollback Plan)", label_en: "Rollback Strategy", type: "textarea", required: true },
    ]
  },
  {
    id: 5,
    categoryId: 5,
    codePrefix: "DIR",
    name_ar: "تعميم وتوجيه إداري أمني وتقني",
    name_en: "Administrative & Cybersecurity Directive",
    confidentiality: "internal",
    fields: [
      { id: "directive_num", label_ar: "رقم التوجيه الصادر", label_en: "Directive Ref Number", type: "text", required: true },
      { id: "issuing_body", label_ar: "الجهة المصدرة للتوجيه", label_en: "Issuing Entity", type: "text", required: true },
      { id: "effective_date", label_ar: "تاريخ سريان التوجيه", label_en: "Effective Date", type: "date", required: true },
      { id: "target_audience", label_ar: "الفئات المستهدفة بالتنفيذ", label_en: "Target Audience", type: "select", options: ["كافة منسوبي المؤسسة", "قسم IT فقط", "مدراء الإدارات", "مسؤولو الأنظمة المالية"], required: true },
      { id: "compliance_deadline", label_ar: "آخر موعد للامتثال والتطبيق", label_en: "Compliance Deadline", type: "date", required: true },
    ]
  }
];

export const initialDepartments = [
  { id: 1, code: "IT", name_ar: "تقنية المعلومات والأنظمة", name_en: "IT & Systems" },
  { id: 2, code: "FIN", name_ar: "الإدارة المالية والمحاسبة", name_en: "Finance & Accounting" },
  { id: 3, code: "HR", name_ar: "الموارد البشرية", name_en: "Human Resources" },
  { id: 4, code: "OPS", name_ar: "إدارة العمليات والتشغيل", name_en: "Operations" },
  { id: 5, code: "SEC", name_ar: "الأمن والسلامة المؤسسية", name_en: "Corporate Security" },
  { id: 6, code: "EXEC", name_ar: "الإدارة العليا والتنفيذية", name_en: "Executive Office" },
];

export const initialDocuments = [
  {
    id: 1,
    document_number: "ACCESS-2026-00042",
    title: "طلب منح صلاحية مدير مالي وترحيل قيود في نظام SAP S/4HANA",
    document_type_id: 1,
    category_id: 2,
    department_id: 2,
    organization: "الإدارة المالية المركزية",
    created_by: "سارة المنصور (مدير حسابات)",
    assigned_to: "م. أحمد الغامدي (مسؤول أنظمة ERP)",
    document_date: "2026-03-24",
    received_at: "2026-03-24 09:30",
    status: "pending_approval",
    confidentiality: "confidential",
    description: "طلب ترقية صلاحيات الموظف في قسم الخزينة ليتمكن من ترحيل قيود الإقفال الشهري ومطابقة الحسابات البنكية بعد صدور قرار ترقيته.",
    notes: "تمت مراجعة الهيكل التنظيمي وصحة التكليف من قبل الشؤون القانونية والموارد البشرية.",
    is_archived: false,
    tags: ["ERP", "SAP", "المالية", "صلاحيات"],
    field_values: {
      emp_name: "خالد بن عبدالعزيز الراشد",
      emp_id: "EMP-4982",
      department: "المالية",
      system_name: "SAP S/4HANA",
      role_type: "اعتماد وإلغاء (Approval & Supervise)",
      reason: "ترقية إلى نائب المدير المالي وتولي مهام إقفال الفترات المحاسبية وفق الهيكل المعتمد."
    },
    attachments: [
      {
        id: 101,
        original_name: "SAP_Access_Request_Signed_Form.pdf",
        file_size: "2.4 MB",
        mime_type: "application/pdf",
        uploaded_by: "سارة المنصور",
        checksum: "8f3b2a9e4d51c72834b6791d2938a1ef24a0d9b43c68e1a53907cbf4e1098231",
        created_at: "2026-03-24 09:35",
        preview_type: "pdf"
      },
      {
        id: 102,
        original_name: "Approval_HR_Letter_2026.docx",
        file_size: "840 KB",
        mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploaded_by: "سارة المنصور",
        checksum: "d128394afbe821739c90481bdf9340a6b472e391c8340d826723cfa0183bda49",
        created_at: "2026-03-24 09:36",
        preview_type: "doc"
      }
    ],
    versions: [
      {
        version_number: "v1.1",
        file_name: "SAP_Access_Request_Signed_v1.1.pdf",
        uploaded_by: "م. أحمد الغامدي",
        change_summary: "إضافة توقيع مسؤول أمن المعلومات والتأكد من عدم وجود تعارض مصالح (SOD Matrix).",
        created_at: "2026-03-25 11:15"
      },
      {
        version_number: "v1.0",
        file_name: "SAP_Access_Request_Initial.pdf",
        uploaded_by: "سارة المنصور",
        change_summary: "النسخة الأصلية المرفوعة من مقدم الطلب عبر النموذج الموحد.",
        created_at: "2026-03-24 09:35"
      }
    ],
    workflow: {
      current_step: 3,
      total_steps: 4,
      steps: [
        { step_order: 1, name: "استلام وتدقيق الطلب (IT Helpdesk)", role: "IT Staff", status: "approved", approver: "م. ريان القحطاني", timestamp: "2026-03-24 10:15", comment: "تم استيفاء النماذج والتأكد من مطابقة الرقم الوظيفي." },
        { step_order: 2, name: "فحص تعارض الصلاحيات (InfoSec SOD Review)", role: "Security Officer", status: "approved", approver: "د. هيفاء الشهري", timestamp: "2026-03-25 11:20", comment: "تم فحص الصلاحية بواسطة مصفوفة الصلاحيات (SoD) ولا يوجد أي تضارب مهام." },
        { step_order: 3, name: "اعتماد مدير إدارة IT (IT Director Approval)", role: "IT Manager", status: "pending", approver: "م. فهد السليمان (مطلوب اعتماده الآن)", timestamp: null, comment: null },
        { step_order: 4, name: "التنفيذ الفني والربط في SAP Basis", role: "Basis Admin", status: "waiting", approver: "فريق SAP Basis", timestamp: null, comment: null }
      ]
    },
    comments: [
      { id: 1, user: "م. ريان القحطاني", role: "IT Staff", time: "2026-03-24 10:18", is_internal: false, text: "تم التحقق من بيانات الموظف في نظام الموارد البشرية وتجهيز الملف للفحص الأمني." },
      { id: 2, user: "د. هيفاء الشهري", role: "Cybersecurity", time: "2026-03-25 11:22", is_internal: true, text: "تمت مراجعة صلاحيات الترحيل والاعتماد، الصلاحية تمنحه صلاحية الإقفال للمكتب الإقليمي فقط ولا تشمل الصناديق الرئيسية." }
    ],
    audit_logs: [
      { id: 1, action: "create", user: "سارة المنصور", ip: "192.168.10.45", date: "2026-03-24 09:35", details: "إنشاء الوثيقة برقم ACCESS-2026-00042 ورفع مرفقين" },
      { id: 2, action: "view", user: "م. ريان القحطاني", ip: "192.168.20.12", date: "2026-03-24 10:05", details: "معاينة الوثيقة والمرفق PDF" },
      { id: 3, action: "approve", user: "د. هيفاء الشهري", ip: "192.168.20.88", date: "2026-03-25 11:20", details: "الموافقة على خطوة فحص تعارض الصلاحيات SoD" },
      { id: 4, action: "download", user: "د. هيفاء الشهري", ip: "192.168.20.88", date: "2026-03-25 11:10", details: "تحميل الملف: SAP_Access_Request_Signed_Form.pdf" }
    ]
  },
  {
    id: 2,
    document_number: "CCTV-2026-00018",
    title: "مراجعة وتفريغ تسجيلات كاميرات مستودع السيرفرات الرئيسي (Data Center Zone A)",
    document_type_id: 2,
    category_id: 4,
    department_id: 5,
    organization: "إدارة الأمن الصناعي والسلامة",
    created_by: "عبدالله الشمري (مشرف أمن)",
    assigned_to: "م. فيصل الدوسري (مهندس شبكات وأنظمة)",
    document_date: "2026-03-22",
    received_at: "2026-03-22 14:10",
    status: "completed",
    confidentiality: "highly_confidential",
    description: "بناء على بلاغ دخول غير مصرح به في غرفة خوادم مركز البيانات الرئيسي تم تفريغ وحفظ المقاطع المؤرخة من الساعة 02:00 صباحاً حتى 03:30 صباحاً.",
    notes: "سري للغاية. يحظر تداول أو نشر أي لقطات خارج اللجنة الأمنية المشتركة وقسم تكنولوجيا المعلومات.",
    is_archived: false,
    tags: ["CCTV", "DataCenter", "أمن", "تحقيق"],
    field_values: {
      cctv_location: "مبنى الإدارة الرئيسي - الطابق الأرضي - مركز البيانات Zone A",
      cam_numbers: "CAM-DC-04, CAM-DC-05, CAM-DC-CORRIDOR-02",
      review_date: "2026-03-22",
      time_from: "02:00:00",
      time_to: "03:30:00",
      incident_reason: "إنذار صوتي بحساس الحركة وتواجد بطاقة دخول لمهندس صيانة التكييف المجدول.",
      findings: "تمت مراجعة التسجيل بالكامل: تبين أن الدخول كان مصرحاً به برفقة الحارس المناوب لإصلاح تسريب مياه وحدة تبريد Precision AC #2."
    },
    attachments: [
      {
        id: 201,
        original_name: "CCTV_Investigation_Report_ZoneA.pdf",
        file_size: "4.8 MB",
        mime_type: "application/pdf",
        uploaded_by: "عبدالله الشمري",
        checksum: "5a2190f84bc1928374d9e018a72b490c812d4839201bc83274910ebca9182371",
        created_at: "2026-03-22 14:20",
        preview_type: "pdf"
      },
      {
        id: 202,
        original_name: "ServerRoom_Snapshot_0245AM.png",
        file_size: "1.9 MB",
        mime_type: "image/png",
        uploaded_by: "م. فيصل الدوسري",
        checksum: "3948bcae9182049182049baef8291048bce9102839401bcae8291049281048ca",
        created_at: "2026-03-22 15:45",
        preview_type: "image"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "CCTV_Investigation_Report_ZoneA.pdf",
        uploaded_by: "عبدالله الشمري",
        change_summary: "التقرير النهائي المعتمد والموقع من اللجنة الأمنية وقسم البنية التحتية.",
        created_at: "2026-03-22 14:20"
      }
    ],
    workflow: {
      current_step: 3,
      total_steps: 3,
      steps: [
        { step_order: 1, name: "طلب التفريغ من الأمن المؤسسي", role: "Security Supervisor", status: "approved", approver: "عبدالله الشمري", timestamp: "2026-03-22 14:15", comment: "طلب رسمي مستعجل." },
        { step_order: 2, name: "استخراج التسجيل وفحصه تقنياً", role: "IT Systems Engineer", status: "approved", approver: "م. فيصل الدوسري", timestamp: "2026-03-22 16:30", comment: "تم استخراج 90 دقيقة تسجيل عالية الدقة والتحقق من الهوية." },
        { step_order: 3, name: "إغلاق التقرير وحفظ الأرشيف الأمني", role: "IT Director", status: "approved", approver: "م. فهد السليمان", timestamp: "2026-03-22 17:00", comment: "معتمد ومحفوظ في الأرشيف المشفر الخاص." }
      ]
    },
    comments: [
      { id: 10, user: "م. فيصل الدوسري", role: "IT Staff", time: "2026-03-22 16:35", is_internal: true, text: "تم نسخ المقاطع إلى وحدة التخزين الآمنة المشفرة وتوليد البصمة الرقمية." }
    ],
    audit_logs: [
      { id: 10, action: "create", user: "عبدالله الشمري", ip: "192.168.30.15", date: "2026-03-22 14:20", details: "إنشاء طلب مراجعة كاميرا وتخصيص درجة سرية فائقة" },
      { id: 11, action: "approve", user: "م. فيصل الدوسري", ip: "192.168.20.19", date: "2026-03-22 16:30", details: "اعتماد واستكمال الفحص التقني" },
      { id: 12, action: "approve", user: "م. فهد السليمان", ip: "192.168.20.5", date: "2026-03-22 17:00", details: "إغلاق وأرشفة الوثيقة بنجاح" }
    ]
  },
  {
    id: 3,
    document_number: "USER-2026-00105",
    title: "إنشاء حساب مهندس برمجيات جديد في الدومين والبريد الإلكتروني وتجهيز الأذونات",
    document_type_id: 3,
    category_id: 3,
    department_id: 1,
    organization: "قسم تقنية المعلومات",
    created_by: "م. طارق العتيبي (رئيس فريق التطوير)",
    assigned_to: "م. تركي الحربي (مسؤول الأنظمة والدومين)",
    document_date: "2026-03-26",
    received_at: "2026-03-26 08:30",
    status: "in_progress",
    confidentiality: "internal",
    description: "طلب انضمام موظف جديد (مهندس برمجيات أول) يتطلب إنشاء بريد إلكتروني، حساب Active Directory، صلاحيات Gitlab، ومنح وصول VPN للعمل عن بعد.",
    notes: "تاريخ مباشرة العمل المحدد هو الأحد القادم. يرجى تجهيز الجهاز المحمول والحسابات مسبقاً.",
    is_archived: false,
    tags: ["مستخدم", "ActiveDirectory", "تطوير", "Onboarding"],
    field_values: {
      full_name: "م. عمر بن خالد الشهري",
      job_title: "Senior Full-Stack Software Engineer",
      corp_email: "o.alshehri@company.com",
      dept_name: "تقنية المعلومات",
      direct_manager: "م. طارق العتيبي",
      vpn_required: "نعم"
    },
    attachments: [
      {
        id: 301,
        original_name: "Employee_Onboarding_Checklist_Signed.pdf",
        file_size: "1.2 MB",
        mime_type: "application/pdf",
        uploaded_by: "م. طارق العتيبي",
        checksum: "48201948bcaef102839401bcae8291049281048ca3948bcae9182049182049ba",
        created_at: "2026-03-26 08:35",
        preview_type: "pdf"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "Employee_Onboarding_Checklist_Signed.pdf",
        uploaded_by: "م. طارق العتيبي",
        change_summary: "نموذج تهيئة الموظف الجديد المعتمد من الموارد البشرية وإدارة IT.",
        created_at: "2026-03-26 08:35"
      }
    ],
    workflow: {
      current_step: 2,
      total_steps: 3,
      steps: [
        { step_order: 1, name: "موافقة مدير القسم والموارد البشرية", role: "Team Lead", status: "approved", approver: "م. طارق العتيبي", timestamp: "2026-03-26 08:40", comment: "معتمد مع توفير كافة بيئات التطوير المطلوبة." },
        { step_order: 2, name: "إنشاء الحسابات في الدومين والبريد وتكوين الصلاحيات", role: "SysAdmin", status: "in_progress", approver: "م. تركي الحربي", timestamp: null, comment: "تم إنشاء حساب Office 365 وجاري ضبط مجموعات الأمان Security Groups." },
        { step_order: 3, name: "تسليم الجهاز والبيانات للموظف وتوقيع الاستلام", role: "IT Support", status: "waiting", approver: "مكتب الدعم الفني", timestamp: null, comment: null }
      ]
    },
    comments: [
      { id: 21, user: "م. تركي الحربي", role: "SysAdmin", time: "2026-03-26 09:15", is_internal: false, text: "تم توليد البريد وإرسال بيانات التهيئة الأولية إلى الموارد البشرية." }
    ],
    audit_logs: [
      { id: 21, action: "create", user: "م. طارق العتيبي", ip: "192.168.20.44", date: "2026-03-26 08:35", details: "إنشاء وثيقة تهيئة مستخدم جديد" }
    ]
  },
  {
    id: 4,
    document_number: "RFC-2026-00031",
    title: "طلب تغيير طارئ (RFC): ترقية وتحديث ترقيعات الأمان لقواعد بيانات Oracle Production",
    document_type_id: 4,
    category_id: 10,
    department_id: 1,
    organization: "قسم البنية التحتية وقواعد البيانات",
    created_by: "م. ماجد الزهراني (Lead DBA)",
    assigned_to: "م. فهد السليمان (مدير القسم)",
    document_date: "2026-03-27",
    received_at: "2026-03-27 11:00",
    status: "pending_approval",
    confidentiality: "confidential",
    description: "تطبيق الترقيع الأمني الفصلي Critical Patch Update (CPU) على كلاستر قواعد بيانات Oracle RAC الرئيسي لسد ثغرات Zero-Day حرجة تم الإبلاغ عنها من هيئة الأمن السيبراني.",
    notes: "التنفيذ سيتطلب توقفاً مجدولاً لمدة 90 دقيقة فجر يوم السبت القادم من الساعة 02:00 وحتى 03:30 صباحاً مع إرسال إشعار للمستفيدين.",
    is_archived: false,
    tags: ["Oracle", "RFC", "قواعد_بيانات", "أمن_سيبراني", "Critical"],
    field_values: {
      target_app: "Oracle RAC 19c Enterprise Database Cluster (Node 1 & 2)",
      change_type: "إصلاح ثغرة (Security Patch)",
      risk_level: "حرج (Critical)",
      planned_downtime: 1.5,
      rollback_plan: "أخذ نسخة احتياطية كاملة Full RMAN Cold Backup قبل بدء الترقيع، بالإضافة إلى Snapshot لمصفوفة التخزين SAN LUNs مع القدرة على الرجوع خلال 25 دقيقة."
    },
    attachments: [
      {
        id: 401,
        original_name: "RFC_Oracle_Security_Patch_Plan_v2.pdf",
        file_size: "3.1 MB",
        mime_type: "application/pdf",
        uploaded_by: "م. ماجد الزهراني",
        checksum: "9182049baef8291048bce9102839401bcae8291049281048ca3948bcae918204",
        created_at: "2026-03-27 11:05",
        preview_type: "pdf"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "RFC_Oracle_Security_Patch_Plan_v2.pdf",
        uploaded_by: "م. ماجد الزهراني",
        change_summary: "خطة الترقيع التفصيلية مع اختبار التراجع في بيئة الـ Staging بنجاح بنسبة 100%.",
        created_at: "2026-03-27 11:05"
      }
    ],
    workflow: {
      current_step: 2,
      total_steps: 3,
      steps: [
        { step_order: 1, name: "مراجعة لجنة إدارة التغيير (CAB Review)", role: "CAB Committee", status: "approved", approver: "لجنة التغيير CAB", timestamp: "2026-03-27 13:00", comment: "تم اعتماد توقيت الصيانة وخطة التراجع المرفقة." },
        { step_order: 2, name: "اعتماد مدير IT ورئيس قطاع العمليات", role: "IT Manager", status: "pending", approver: "م. فهد السليمان (مطلوب اعتماده الآن)", timestamp: null, comment: null },
        { step_order: 3, name: "التنفيذ الفني واختبار ما بعد الترقيع (Post-Check)", role: "DBA Team", status: "waiting", approver: "فريق DBA", timestamp: null, comment: null }
      ]
    },
    comments: [
      { id: 31, user: "م. ماجد الزهراني", role: "DBA", time: "2026-03-27 11:10", is_internal: true, text: "تم اختبار الترقيع في بيئة الاختبار Staging واستغرق التنفيذ 42 دقيقة دون أخطاء." }
    ],
    audit_logs: [
      { id: 31, action: "create", user: "م. ماجد الزهراني", ip: "192.168.20.70", date: "2026-03-27 11:05", details: "إنشاء وثيقة طلب تغيير حرج RFC" },
      { id: 32, action: "approve", user: "لجنة التغيير CAB", ip: "192.168.20.1", date: "2026-03-27 13:00", details: "موافقة لجنة التغيير وتمرير الاعتماد النهائي لمدير IT" }
    ]
  },
  {
    id: 5,
    document_number: "DIR-2026-00007",
    title: "تعميم أمني ملزم: تفعيل المصادقة متعددة العوامل (MFA) وإيقاف كلمات المرور البسيطة",
    document_type_id: 5,
    category_id: 5,
    department_id: 1,
    organization: "الإدارة العامة لتقنية المعلومات والأمن السيبراني",
    created_by: "م. فهد السليمان (مدير إدارة IT)",
    assigned_to: "كافة منسوبي الشركة ورؤساء الأقسام",
    document_date: "2026-03-15",
    received_at: "2026-03-15 08:00",
    status: "completed",
    confidentiality: "internal",
    description: "بناء على المتطلبات التنظيمية الصادرة عن الهيئة الوطنية للأمن السيبراني ECC-1:2018، يعمم على كافة الموظفين تفعيل تطبيق Microsoft Authenticator للدخول على كافة الأنظمة السحابية والداخلية.",
    notes: "سيتم تطبيق العزل التلقائي للحسابات غير الممتثلة بنهاية التاريخ المحدد في التعميم.",
    is_archived: false,
    tags: ["تعميم", "أمن_سيبراني", "MFA", "امتثال"],
    field_values: {
      directive_num: "IT-SEC-2026/089",
      issuing_body: "إدارة الأمن السيبراني بالتعاون مع مكتب إدارة تقنية المعلومات",
      effective_date: "2026-03-15",
      target_audience: "كافة منسوبي المؤسسة",
      compliance_deadline: "2026-04-01"
    },
    attachments: [
      {
        id: 501,
        original_name: "MFA_Enforcement_Policy_Directive_Signed.pdf",
        file_size: "1.8 MB",
        mime_type: "application/pdf",
        uploaded_by: "م. فهد السليمان",
        checksum: "82049baef8291048bce9102839401bcae8291049281048ca3948bcae91820491",
        created_at: "2026-03-15 08:05",
        preview_type: "pdf"
      },
      {
        id: 502,
        original_name: "MFA_Setup_User_Guide_Ar.pdf",
        file_size: "3.4 MB",
        mime_type: "application/pdf",
        uploaded_by: "م. فهد السليمان",
        checksum: "102839401bcae8291049281048ca3948bcae9182049182049baef8291048bce9",
        created_at: "2026-03-15 08:07",
        preview_type: "pdf"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "MFA_Enforcement_Policy_Directive_Signed.pdf",
        uploaded_by: "م. فهد السليمان",
        change_summary: "التعميم الرسمي المعتمد الصادر لجميع إدارات الشركة وفروعها.",
        created_at: "2026-03-15 08:05"
      }
    ],
    workflow: {
      current_step: 2,
      total_steps: 2,
      steps: [
        { step_order: 1, name: "صياغة وتدقيق التوجيه والسياسات", role: "CISO", status: "approved", approver: "د. هيفاء الشهري", timestamp: "2026-03-14 16:00", comment: "تمت مواءمة البنود مع متطلبات الامتثال الرسمية." },
        { step_order: 2, name: "الاعتماد والنشر والتعميم الرسمي", role: "IT Director", status: "approved", approver: "م. فهد السليمان", timestamp: "2026-03-15 08:00", comment: "معتمد للنشر لكافة المستخدمين وإلزام كافة الأقسام." }
      ]
    },
    comments: [
      { id: 41, user: "م. ريان القحطاني", role: "Helpdesk", time: "2026-03-16 10:00", is_internal: false, text: "فريق الدعم الفني مستعد لاستقبال أي استفسارات تخص خطوات ربط التطبيق على الهواتف." }
    ],
    audit_logs: [
      { id: 41, action: "create", user: "م. فهد السليمان", ip: "192.168.20.5", date: "2026-03-15 08:05", details: "إنشاء وثيقة تعميم وتوزيعها لجميع الأقسام" }
    ]
  },
  {
    id: 6,
    document_number: "NET-2026-00022",
    title: "تقرير الفحص واختبار الاختراق السنوي (Penetration Testing) للبنية التحتية والشبكة",
    document_type_id: 4,
    category_id: 7,
    department_id: 1,
    organization: "شركة الأمن المتقدم للاستشارات السيبرانية",
    created_by: "د. هيفاء الشهري (مدير الأمن السيبراني)",
    assigned_to: "م. فهد السليمان (مدير IT)",
    document_date: "2026-03-10",
    received_at: "2026-03-10 15:00",
    status: "completed",
    confidentiality: "highly_confidential",
    description: "التقرير الختامي لعملية محاكاة الهجوم والاختبار الأخلاقي الشامل للشبكات الداخلية والخارجية والأنظمة السحابية وبوابات الدفع الإلكتروني.",
    notes: "يحتوي على ثغرات فنية تم سد 95% منها بنجاح وجاري إغلاق الملاحظات المتبقية.",
    is_archived: false,
    tags: ["اختبار_اختراق", "شبكات", "Security", "تقرير_سري"],
    field_values: {
      target_app: "Core Network, Firewalls, Web Portals & VPN Gateways",
      change_type: "إصلاح ثغرة (Security Patch)",
      risk_level: "عالي (High)",
      planned_downtime: 0,
      rollback_plan: "تم توثيق خطة معالجة الثغرات Remediation Plan في ملحق التقرير رقم 3."
    },
    attachments: [
      {
        id: 601,
        original_name: "Annual_Penetration_Test_Executive_Summary_2026.pdf",
        file_size: "5.6 MB",
        mime_type: "application/pdf",
        uploaded_by: "د. هيفاء الشهري",
        checksum: "39481bcae8291049281048ca3948bcae9182049182049baef8291048bce91028",
        created_at: "2026-03-10 15:10",
        preview_type: "pdf"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "Annual_Penetration_Test_Executive_Summary_2026.pdf",
        uploaded_by: "د. هيفاء الشهري",
        change_summary: "النسخة النهائية المسلمة من الشركة الاستشارية المعتمدة.",
        created_at: "2026-03-10 15:10"
      }
    ],
    workflow: {
      current_step: 2,
      total_steps: 2,
      steps: [
        { step_order: 1, name: "استلام ومراجعة التقرير والنتائج", role: "Cybersecurity Lead", status: "approved", approver: "د. هيفاء الشهري", timestamp: "2026-03-11 09:00", comment: "تم استلام التقرير وبناء خطة سد الثغرات الفورية." },
        { step_order: 2, name: "عرض النتائج على الإدارة التنفيذية والاعتماد", role: "IT Director", status: "approved", approver: "م. فهد السليمان", timestamp: "2026-03-12 11:30", comment: "تم عرض التقرير والاعتماد بنجاح." }
      ]
    },
    comments: [],
    audit_logs: [
      { id: 51, action: "create", user: "د. هيفاء الشهري", ip: "192.168.20.88", date: "2026-03-10 15:10", details: "أرشفة تقرير اختبار الاختراق السري للغاية" }
    ]
  },
  {
    id: 7,
    document_number: "HW-2026-00054",
    title: "محضر فحص واستلام شحنة محولات الشبكة الموزعة (Cisco Catalyst 9300 Switches)",
    document_type_id: 1,
    category_id: 8,
    department_id: 1,
    organization: "شركة التقنية المتقدمة للمعدات (المورد المعتمد)",
    created_by: "م. فيصل الدوسري (مهندس شبكات)",
    assigned_to: "مستودع أصول تقنية المعلومات",
    document_date: "2026-03-18",
    received_at: "2026-03-18 10:45",
    status: "completed",
    confidentiality: "internal",
    description: "محضر الاستلام الفني والترقيم للأصول لعدد 8 سويتشات Cisco 48-port PoE+ لمشروع توسعة فرع المنطقة الشرقية.",
    notes: "تم تسجيل الأرقام التسلسلية Serial Numbers في نظام إدارة الأصول Asset Management وتوليد باركود لكل جهاز.",
    is_archived: false,
    tags: ["سويتشات", "Cisco", "أجهزة", "استلام_فني"],
    field_values: {
      emp_name: "م. فيصل الدوسري",
      emp_id: "EMP-3109",
      department: "تقنية المعلومات",
      system_name: "Cisco Infrastructure Assets",
      role_type: "مدير وحدة (Module Admin)",
      reason: "توسعة البنية التحتية لشبكة فرع المنطقة الشرقية الجديد."
    },
    attachments: [
      {
        id: 701,
        original_name: "Hardware_Inspection_Delivery_Report.pdf",
        file_size: "1.7 MB",
        mime_type: "application/pdf",
        uploaded_by: "م. فيصل الدوسري",
        checksum: "8291049281048ca3948bcae9182049182049baef8291048bce9102839481bcae",
        created_at: "2026-03-18 10:50",
        preview_type: "pdf"
      }
    ],
    versions: [
      {
        version_number: "v1.0",
        file_name: "Hardware_Inspection_Delivery_Report.pdf",
        uploaded_by: "م. فيصل الدوسري",
        change_summary: "محضر الفحص الفني المبدئي ومطابقة المواصفات.",
        created_at: "2026-03-18 10:50"
      }
    ],
    workflow: {
      current_step: 2,
      total_steps: 2,
      steps: [
        { step_order: 1, name: "فحص المواصفات والأرقام التسلسلية", role: "Network Engineer", status: "approved", approver: "م. فيصل الدوسري", timestamp: "2026-03-18 11:30", comment: "الأجهزة مطابقة للعقد بالكامل وتم اختبار تشغيلها Power-On Test." },
        { step_order: 2, name: "إيداع في مستودع الأصول وإغلاق المحضر", role: "Asset Officer", status: "approved", approver: "بندر الناصر", timestamp: "2026-03-18 14:00", comment: "تم الترقيم وإصدار ملصقات الباركود." }
      ]
    },
    comments: [],
    audit_logs: [
      { id: 61, action: "create", user: "م. فيصل الدوسري", ip: "192.168.20.19", date: "2026-03-18 10:50", details: "أرشفة محضر استلام أجهزة شبكة جديدة" }
    ]
  }
];

export const initialAuditLogs = [
  { id: 101, action: "approve", user: "م. فهد السليمان", role: "IT Manager", ip: "192.168.20.5", entity: "وثيقة: CCT-2026-00018", date: "2026-03-29 09:12:44", details: "اعتماد الخطوة النهائية وإغلاق ملف مراجعة تسجيلات مركز البيانات" },
  { id: 102, action: "download", user: "د. هيفاء الشهري", role: "Cybersecurity Lead", ip: "192.168.20.88", entity: "مرفق: SAP_Access_Request_Signed_Form.pdf", date: "2026-03-29 08:45:11", details: "تحميل الملف من Private Storage المشفر بعد اجتياز التدقيق الأمني" },
  { id: 103, action: "create", user: "م. ماجد الزهراني", role: "Lead DBA", ip: "192.168.20.70", entity: "وثيقة: RFC-2026-00031", date: "2026-03-27 11:05:00", details: "إنشاء وثيقة طلب تغيير برمجي وترقيع أمني حرج لقواعد بيانات Oracle" },
  { id: 104, action: "login", user: "م. فهد السليمان", role: "IT Manager", ip: "192.168.20.5", entity: "جلسة مصادقة (Session Auth)", date: "2026-03-29 08:30:19", details: "تسجيل دخول ناجح عبر المصادقة الثنائية 2FA" },
  { id: 105, action: "update", user: "م. ريان القحطاني", role: "IT Staff", ip: "192.168.20.12", entity: "وثيقة: USER-2026-00105", date: "2026-03-26 09:15:22", details: "تحديث حالة الحساب وإضافة ملاحظات الإنجاز الفني" },
  { id: 106, action: "view", user: "سارة المنصور", role: "Finance Officer", ip: "192.168.10.45", entity: "وثيقة: ACCESS-2026-00042", date: "2026-03-25 14:10:05", details: "استعراض مسار الاعتمادات ومتابعة حالة الطلب" },
  { id: 107, action: "archive", user: "م. فهد السليمان", role: "IT Manager", ip: "192.168.20.5", entity: "وثيقة: DIR-2026-00007", date: "2026-03-20 16:00:00", details: "تحديث حالة التعميم الأمني إلى مكتمل ومنشور" }
];
