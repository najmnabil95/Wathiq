# الخلفية — Laravel 12 API

هذا المجلد هو التطبيق الكامل القابل للنشر: يقدّم REST API تحت `/api/v1` ويخدم واجهة React SPA من `public/`.

اقرأ الدليل العام أولاً: [../README.md](../README.md).

---

## 1. نقاط الدخول

| الملف | الدور |
|---|---|
| `routes/api.php` | كل مسارات API تحت `v1`؛ ما عدا `/health` و`/auth/login` محمي بـ `auth:sanctum` |
| `routes/web.php` | يخدم `public/index.html` لأي مسار غير API (SPA deep links)، ويرد JSON 404 لمسارات `api/*` غير الموجودة |
| `routes/console.php` | أوامر Artisan المخصصة: `edms:check`, `edms:backup`, `edms:ocr-index` |
| `public/index.html` | أصول الواجهة المبنية (يُنتجها Vite) |

---

## 2. خريطة الكود

```
app/
├── Http/Controllers/Api/
│   ├── Auth/AuthController.php        # login/logout/me/profile/password
│   ├── DocumentController.php         # CRUD + بحث + أرشفة/استرجاع + حجز قانوني + اعتماد + تعليقات
│   ├── DocumentVersionController.php
│   ├── AttachmentController.php       # رفع/تحميل/معاينة/OCR
│   ├── ApprovalController.php
│   ├── DispositionController.php      # الاستبقاء والإتلاف
│   ├── CategoryController.php         # شجرة التصنيفات + حراسة الحلقات
│   ├── DocumentTypeController.php     # الأنواع + الحقول الديناميكية
│   ├── DepartmentController.php
│   ├── OrganizationController.php
│   ├── UserController.php             # يشمل الأدوار وتجاوزات الصلاحيات
│   ├── RoleController.php
│   ├── AuditLogController.php
│   ├── WorkflowController.php
│   ├── NotificationController.php
│   ├── ReportController.php
│   ├── SettingController.php
│   ├── DashboardController.php
│   └── StatusController.php / ConfidentialityLevelController.php
├── Models/                            # Eloquent (Document, Category, AuditLog, ...)
├── Services/
│   ├── AuditService.php               # سلسلة التجزئة + diff + logLogin/logLogout
│   ├── DocumentNumberService.php      # ترقيم تسلسلي آمن من التزامن
│   ├── ApprovalRoutingService.php     # توجيه الاعتماد لمدير القسم
│   ├── AttachmentService.php          # تخزين + SHA-256
│   ├── TextExtractionService.php      # OCR واستخراج نص
│   ├── WatermarkService.php           # علامة مائية على الخلفية
│   └── NotificationService.php
└── ...
```

---

## 3. اتفاقيات API

- الغلاف الموحّد: `{"success": bool, "message": "...", "data": ...}`.
- القوائم المرقّمة تُرجع كائن Laravel paginator داخل `data` (`data.data`, `data.current_page`, ...).
- أخطاء التحقق: `422` مع `errors.<field>[0]` بالعربية.
- الصلاحيات: `403` برسالة عربية موحّدة.
- المصادقة: `Authorization: Bearer <token>` (Sanctum PAT). مدة الصلاحية من `SANCTUM_EXPIRATION` (ثوانٍ).
- تسجيل الدخول يقبل البريد أو اسم المستخدم في الحقل `email`.
- التواريخ تُخزَّن UTC وتُعاد ISO 8601.

---

## 4. أنماط يجب اتباعها

### الصلاحيات

- كل عملية كتابة تبدأ بفحص صريح:
  ```php
  $this->ensurePermission('categories.manage');
  ```
  (استخدم اسماً غير `authorize` حتى لا يتعارض مع دالة إطار Laravel القياسية.)
- قراءة الوثائق عبر `Document::findVisibleOrFail($id, $user)` لضمان قواعد القسم والسرية.
- تجاوزات المستخدم (`grant`/`deny`) تُحسب في `AuthController::formatUser()` وتظهر في الواجهة، لكن الخلفية تتحقق مستقلة دائماً.
- لا تعتمد على إخفاء الواجهة كوسيلة حماية.

### التدقيق

- سجّل كل تغيير حساس:
  ```php
  [$old, $new] = $auditService->getDiff($model->fill($validated));
  $model->save();
  $auditService->log('update', $model, $old, $new, 'وصف مختصر');
  ```
- سجل التدقيق **ملحق فقط**: لا update/delete على صفوفه؛ سلامة السلسلة تُفحص عبر `GET /api/v1/audit-logs/verify`.
- الحجز القانوني يمنع الحذف/الإتلاف/الأرشفة ويُسجَّل في التدقيق.

### الترقيم

- `DocumentNumberService::generate()` ينشئ `PREFIX-YEAR-00001` داخل معاملة مع `lockForUpdate` على `document_number_sequences`؛ لا تولّد الأرقام يدوياً.

### الملفات

- التخزين على قرص `public` عبر `AttachmentService` مع بصمة SHA-256.
- التحميل/المعاينة تمرّ بمسارات API موثّقة، والعلامة المائية تُطبَّق عند تفعيل `watermark_downloads`.

### الاعتماد

- عند إنشاء وثيقة يستدعي `DocumentController` خدمة `ApprovalRoutingService::autoSubmit` لتحويلها لمدير قسم المُنشئ إن توفرت الصلاحية والمدير؛ وإلا تبقى بالمسار اليدوي.

---

## 5. قاعدة البيانات والبذور

```bash
php artisan migrate --seed
```

ترتيب `DatabaseSeeder` مهم:

1. `CoreDataSeeder` — الحالات ومستويات السرية
2. `DepartmentBranchSeeder` — الأقسام والفروع (20 قسماً)
3. `RolesPermissionsSeeder` — 6 أدوار و62 صلاحية
4. `CategoryDocumentTypeSeeder` — التصنيفات وأنواع الوثائق
5. `WorkflowSeeder` — قوالب سير العمل الافتراضية
6. `AdminUserSeeder` — الحسابات التجريبية (كلمات المرور من `ADMIN_*` و`DEMO_PASSWORD`)
7. `DummyDataSeeder` — بيانات وثائق تجريبية
8. `SettingsSeeder` — `numbering_pattern`, `retention_years`, `require_mfa`, `sha_check_enabled`, `watermark_downloads`

لا تعدّل migration تم دفعها؛ أضف migration جديدة. ولا تشغّل `migrate:fresh` على بيانات حقيقية.

---

## 6. الاختبارات

```bash
php artisan test                 # كامل الحزمة
php artisan test --filter=CategoryManagementTest
```

البيئة: SQLite in-memory (`phpunit.xml`)، بذور كاملة لكل اختبار Feature.

تغطية الوحدات الحساسة:

| الملف | يغطي |
|---|---|
| `AuditIntegrityTest` | سلسلة التجزئة والتحقق، منع التعديل |
| `LegalHoldTest` | منع الحذف/الإتلاف تحت الحجز |
| `DispositionTest` | الاستحقاق والإتلاف والاسترجاع |
| `DocumentAccessControlTest` | قيود القسم والسرية |
| `DocumentApprovalRoutingTest` | التوجيه التلقائي للمدير |
| `PermissionEnforcementTest`, `RolePermissionsTest`, `UserPermissionOverrideTest` | صلاحيات الأدوار والتجاوزات |
| `CategoryManagementTest` | العدّادات، الحلقات، حراسة الحذف، الأب المحذوف |
| `AttachmentIntegrityTest`, `WatermarkTest` | البصمة والعلامة المائية |
| `DocumentSearchOcrTest`, `TextExtractionServiceTest` | البحث واستخراج النص |
| `WorkflowTest`, `NotificationAndApprovalTest`, `CommentAndVersionTest` | سير العمل والتعليقات والإصدارات |
| `AuthProfileTest`, `UserManagementTest`, `OrganizationsTest`, `ReportsTest`, `SettingsTest` | بقية العمليات |

القاعدة: أي إصلاح أو ميزة جديدة تأتي مع اختبار يعيد إنتاج الحالة.

---

## 7. التنسيق والاصطلاحات

- `vendor/bin/pint` قبل الـ commit.
- الكود والأسماء بالإنجليزية، ورسائل المستخدم بالعربية.
- لا أسرار في الكود أو البذور؛ استخدم متغيرات البيئة.
- استخدم `Model::query()` وربط المتغيرات دائماً؛ لا SQL خام بمدخلات المستخدم.

---

## 8. فحص الجاهزية

```bash
php artisan edms:check
```

يفحص: `APP_KEY`، اتصال القاعدة، صلاحية الكتابة في `storage`، وجود بناء SPA، ووضع البيئة (`production` مع `APP_DEBUG=false`).
