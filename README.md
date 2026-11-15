# Wathiq — نظام إدارة الوثائق والأرشفة الإلكترونية (IT-EDMS)

[![CI](https://github.com/najmnabil95/Wathiq/actions/workflows/ci.yml/badge.svg)](https://github.com/najmnabil95/Wathiq/actions/workflows/ci.yml)

نظام أرشفة مؤسسي متكامل لإدارة دورة حياة الوثائق من الإنشاء حتى الإتلاف، مبني كتطبيق واحد (Laravel + React SPA) يقدّم الواجهة والـ API من نفس النطاق، ويعمل بواجهة عربية RTL كاملة في وضعي داكن وفاتح.

الخلفية مطابقة لأساسيات ISO 15489 (إدارة السجلات) وMoReq2010 وISO/IEC 27001 في تقسيم الصلاحيات وسجل التدقيق.

---

## 1. نظرة عامة

| العنصر | القيمة |
|---|---|
| نوع التطبيق | Single-artifact monolith: Laravel يخدم React SPA |
| الواجهة | React 19 + Vite 8 + Tailwind CSS 4 (RTL، وضع داكن/فاتح) |
| الخلفية | Laravel 12 + Sanctum (Bearer tokens) |
| قاعدة البيانات | MySQL / MariaDB — `utf8mb4` |
| الاختبارات | PHPUnit على SQLite in-memory |
| CI | GitHub Actions (اختبارات الخلفية + lint وbuild للواجهة) |

---

## 2. الوحدات الرئيسية

| الوحدة | المسار في الواجهة | الوصف |
|---|---|---|
| لوحة التحكم | `/` | إحصاءات، وثائق حديثة، اعتمادات معلقة، نشاط |
| الوثائق | `/documents` | بحث وفلترة، إنشاء، تفاصيل، مرفقات، إصدارات، تعليقات، اعتماد، حجز قانوني، أرشفة/استرجاع، حذف ناعم ونهائي |
| الاستبعاد والاستبقاء | `/disposition` | جداول استبقاء، الوثائق المستحقة للإتلاف، تنفيذ الإتلاف والاسترجاع |
| التصنيفات | `/categories` | شجرة هرمية بعدّادات، أيقونة/لون/ترتيب/تفعيل، حماية من الحلقات |
| أنواع الوثائق | `/document-types` | قوالب أنواع مع حقول وصفية ديناميكية وبادئات ترقيم |
| الأقسام والفروع | `/departments` | هيكل تنظيمي هرمي وتعيين مدير القسم |
| الجهات الخارجية | `/organizations` | جهات مراسلة/تعامل خارجي |
| المستخدمون | `/users` | إنشاء وتفعيل/تعطيل، إعادة تعيين كلمة مرور، أدوار، تجاوزات صلاحيات |
| الأدوار والصلاحيات | `/roles` | مصفوفة 62 صلاحية وربطها بالأدوار |
| سير العمل | `/workflows` | قوالب مراحل الاعتماد لكل نوع وثيقة |
| سجل العمليات | `/audit` | سلسلة تجزئة (hash chain) غير قابلة للتعديل + تحقق + تصدير |
| الإعدادات | `/settings` | خيارات النظام والنسخ الاحتياطي |
| سير النظام | `/system-flow` | مخطط توضيحي مختصر لست مراحل العمل |

---

## 3. دورة حياة الوثيقة

```
الإنشاء → التجهيز → الاعتماد → الإغلاق → الأرشفة → الاستبعاد
```

- **الإنشاء:** إنشاء قيد وثيقة ورقم تسلسلي `PREFIX-YEAR-00001` (بادئة نوع الوثيقة + السنة + تسلسل خماسي) داخل معاملة مع قفل صف لمنع التكرار.
- **التجهيز:** رفع المرفقات (SHA-256)، بيانات وصفية، تعليقات، إصدارات.
- **الاعتماد:** تُوجَّه الوثيقة تلقائياً إلى مدير القسم الذي ينتمي إليه المُنشئ عند توفر صلاحية `workflows.submit`؛ وإلا يبقى الاعتماد يدوياً.
- **الإغلاق:** الحالات النهائية `approved` وتجميد المحتوى.
- **الأرشفة:** `archived` + إعادة أرشفة/استرجاع، مع منع الحذف النهائي تحت الحجز القانوني.
- **الاستبعاد:** `retention_until` مستحق، ثم إتلاف نهائي من شاشة الاستبعاد.

الحالات: `new`, `in_progress`, `pending_approval`, `approved`, `rejected`, `completed`, `archived`, `cancelled`.
مستويات السرية: `public`, `internal`, `confidential`, `highly_confidential`.

---

## 4. البنية التقنية

**الخلفية** (`backend/`)

- Laravel 12.72 (PHP ^8.2)، Laravel Sanctum 4.3
- MySQL/MariaDB + Eloquent
- FPDF/FPDI لتوليد الاستمارات والعلامة المائية
- Tesseract (اختياري) لاستخراج نص المرفقات والبحث فيها
- LibreOffice (اختياري) لتحويل ملفات Office إلى PDF للمعاينة داخل المتصفح

**الواجهة** (`frontend/`)

- React 19، Vite 8، React Router 7
- Tailwind CSS 4 (بدون plugins؛ متغيّرات الثيم في `src/index.css`)
- Zustand 5 للحالة والمصادقة
- Axios، react-hot-toast، lucide-react، date-fns
- oxlint للـ lint

**البناء:** `vite build` يكتب الأصول مباشرة إلى `backend/public` (لا يفصل بين الواجهة والـ API)، فيكفي رفع مجلد `backend` للإنتاج دون Node.js.

---

## 5. بنية المستودع

```
IT-EDMS/
├── backend/                 # تطبيق Laravel + الأصول المبنية في public/
│   ├── app/
│   │   ├── Http/Controllers/Api/   # متحكمات REST مقسّمة بالوحدات
│   │   ├── Models/                 # Document, Category, AuditLog, ...
│   │   ├── Services/               # AuditService, WatermarkService, ApprovalRoutingService,
│   │   │                           # DocumentNumberService, AttachmentService, TextExtractionService
│   │   └── ...
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/                # بيانات مرجعية + أدوار + مستخدمون تجريبيون
│   ├── routes/{api,web,console}.php
│   ├── scripts/backup-daily.bat
│   ├── tests/{Feature,Unit}
│   └── public/                     # Document Root (index.html + assets المبنية)
├── frontend/                # React SPA
│   ├── src/pages/           # صفحة لكل وحدة
│   ├── src/services/api.js  # عميل Axios + اعتراضات التوكن
│   ├── src/store/           # Zustand (auth)
│   └── vite.config.js       # outDir = ../backend/public
├── docs/                    # أدلة تفصيلية
├── .github/workflows/ci.yml # CI
├── Dockerfile / docker-compose.yml
├── run.bat / build.bat / build.sh
└── README.md
```

---

## 6. التشغيل السريع

### المتطلبات

- PHP >= 8.2 مع `pdo_mysql`, `mbstring`, `openssl`, `zip`, `gd`
- Composer 2
- Node.js >= 20 وnpm
- MySQL 8 أو MariaDB 10.6+

### 1) قاعدة البيانات

```bash
mysql -u root -e "CREATE DATABASE it_edms_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2) الخلفية

```bash
cd backend
composer install
cp .env.example .env        # Windows: copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link    # روابط المرفقات العامة
php artisan serve --port=8000
```

API تعمل على `http://127.0.0.1:8000/api/v1` (فحص سريع: `GET /api/v1/health`).

### 3) الواجهة للتطوير

```bash
cd frontend
npm install
npm run dev
```

تفتح على `http://localhost:5173` وتتصل بالـ API على `127.0.0.1:8000` تلقائياً في وضع التطوير (يمكن تثبيت العنوان عبر `VITE_API_BASE_URL`).

### 4) بناء الإنتاج الموحّد

```bash
npm run build        # من الجذر: يستدعي build الواجهة
# أو: cd frontend && npm run build
```

تنتقل الأصول إلى `backend/public/assets` ويصبح كل شيء جاهزاً للرفع.

### سكربتات جاهزة (Windows)

| الملف | الوظيفة |
|---|---|
| `run.bat` | يتحقق من PHP وMySQL ثم يشغّل `artisan serve` على المنفذ 8000 |
| `build.bat` / `build.sh` | بناء الواجهة ودمجها في `backend/public` |
| `backend/scripts/backup-daily.bat` | تشغيل `edms:backup` (يُجدول يومياً عبر Task Scheduler) |

---

## 7. متغيرات البيئة المهمة

| المتغير | الافتراضي | ملاحظات |
|---|---|---|
| `APP_ENV` / `APP_DEBUG` | `local` / `true` | للإنتاج: `production` و`false` إلزاماً |
| `APP_KEY` | — | يُولَّد بـ `php artisan key:generate` |
| `APP_URL` | `http://localhost:8000` | عنوان النظام المعتمد |
| `APP_TIMEZONE` | `UTC` | تُعرض التواريخ محلياً في الواجهة |
| `DB_*` | `it_edms_db` | اتصال MySQL |
| `SANCTUM_EXPIRATION` | `43200` | عمر التوكن بالثواني (12 ساعة؛ إن فُقد المتغير يرجع الإطار لـ30 يوماً) |
| `FILESYSTEM_DISK` | `public` | تخزين المرفقات |
| `EDMS_BACKUP_PATH` | `D:/IT-EDMS-Backups` | مجلد أرشيفات النسخ |
| `EDMS_BACKUP_KEEP` | `14` | عدد الأرشيفات المحفوظة |
| `EDMS_MYSQLDUMP` | `C:/xampp/mysql/bin/mysqldump.exe` | مسار أداة التصدير |
| `TESSERACT_PATH` | — | مسار `tesseract` لاستخراج النص (اختياري) |
| `EDMS_SOFFICE_PATH` | — | مسار `soffice` لتحويل Office إلى PDF (اختياري؛ يُكتشف تلقائياً عند التثبيت) |
| `EDMS_OFFICE_TIMEOUT` | `120` | مهلة تحويل Office→PDF بالثواني |
| `ADMIN_NAME/EMAIL/USERNAME/PASSWORD` | قيم افتراضية في Seeder | حساب المدير الأول عند `migrate --seed` |
| `DEMO_PASSWORD` | قيمة افتراضية في Seeder | كلمة مرور الحسابات التجريبية |
| `FRONTEND_URL` | `http://localhost:5173` | يُستخدم فقط عندما لا يوجد بناء SPA |
| `VITE_API_BASE_URL` | — | تثبيت عنوان API عند الحاجة |

> لا تُرفع ملفات `.env` إلى Git أبداً — `.gitignore` يستثنيها.

---

## 8. الحسابات والصلاحيات

### الأدوار المزروعة

| الدور | الاسم | النطاق |
|---|---|---|
| مدير النظام | `super_admin` | كل الصلاحيات |
| مدير الأرشيف | `it_manager` | دورة الحياة الكاملة، الاستبقاء، الحجز، الإعدادات، نسخ احتياطي |
| أخصائي أرشفة | `it_staff` | إنشاء وتحديث ورفع وإحالة، عرض داخل القسم |
| المعتمد | `approver` | اعتماد/رفض المحال إليه |
| المدقق | `auditor` | سجل العمليات والتقارير |
| المشاهد | `viewer` | عرض فقط |

### الحسابات التجريبية (تُنشأ مع `migrate --seed`)

| البريد | اسم المستخدم | الدور |
|---|---|---|
| `admin@edms.local` | `admin` | `super_admin` |
| `manager@edms.local` | `it_manager` | `it_manager` |
| `staff@edms.local` | `it_staff` | `it_staff` |
| `approver@edms.local` | `approver` | `approver` |
| `fahad.dev@edms.local` | `fahad.dev` | `it_staff` |

كلمات المرور تأتي من `ADMIN_PASSWORD` و`DEMO_PASSWORD` أو القيم الافتراضية داخل `AdminUserSeeder`. **غيّرها قبل أي استخدام حقيقي** عبر متغيرات البيئة أو من شاشة المستخدمين/الملف الشخصي.

### نموذج الصلاحيات

- 62 صلاحية مجمّعة: `documents.*`, `attachments.*`, `versions.*`, `comments.*`, `records.*`, `disposition.*`, `confidentiality.assign`, `workflows.*`, `categories.*`, `document-types.*`, `departments.*`, `organizations.*`, `users.*`, `roles.*`, `audit.*`, `reports.*`, `settings.*`.
- صلاحية الدور + **تجاوزات لكل مستخدم** (`grant` / `deny`) تُطبَّق في الحمولة المرجعة عند تسجيل الدخول، وهي مصدر الواجهة للتحقق (`hasPermission`).
- التحقق النهائي دائماً في الخلفية لكل عملية كتابة/حساسة.
- رؤية الوثائق مقيّدة بالقسم افتراضياً وتتوسع بـ `documents.view_all_departments`، والسرية تحتاج `documents.view_confidential`.

---

## 9. حوكمة السجلات

- **سجل تدقيق ملحق فقط:** كل صف يحمل `previous_hash`/`hash` لسلسلة متصلة. لا تُعدَّل صفوف `audit_logs` ولا تُحذف؛ التحقق عبر `GET /api/v1/audit-logs/verify`.
- **الحجز القانوني:** يمنع الحذف والأرشفة والاستبعاد حتى رفعه، ويُسجَّل في التدقيق.
- **حذف المستخدمين:** يُفضَّل التعطيل بدل الحذف النهائي لأن التدقيق يشير إلى المستخدم؛ يوجد مستخدم محجوز يحافظ على سلامة السلسلة.
- **الاستبقاء:** `retention_years`/`retention_until` لكل وثيقة، والإتلاف النهائي لا يتم إلا من شاشة الاستبعاد وبصلاحية `documents.force_delete` ودون حجز قانوني.

---

## 10. المرفقات والمعاينة والبحث

- المرفقات تُخزَّن على قرص `public` الخاص، وتُحمَّل عبر مسارات API موثّقة (لا روابط مباشرة).
- معاينة داخل المتصفح تتم عبر Blob/Object URL مع رؤوس أمان — التفاصيل في [docs/document-preview-mechanism.md](docs/document-preview-mechanism.md).
- ملفات Office (Word وExcel وPowerPoint وODF وRTF) تُحوَّل إلى PDF على الخادم عبر LibreOffice headless عند أول معاينة، وتُخزَّن النسخة الناتجة مؤقتاً في `storage/framework/cache/office-previews`. إذا لم يكن LibreOffice مثبتاً أو فشل التحويل يظهر خيار التنزيل. الملفات المضغوطة (zip/rar/7z) تبقى للتنزيل دائماً.
- عالمة مائية تُضاف على الخلفية عند التحميل/التصدير عند تفعيل `watermark_downloads`.
- فحص سلامة الملفات عبر بصمة SHA-256 (`attachments` + `records.verify_hash`).
- OCR: `php artisan edms:ocr-index` يستخرج النص ويفهرس المرفقات، ويُدرج النص في البحث عبر `GET /api/v1/search`.

---

## 11. الاختبارات والجودة

```bash
# الخلفية
cd backend
php artisan test                 # 101 اختباراً ناجحاً + 1 متخطى (SQLite in-memory)
vendor/bin/pint                  # تنسيق الكود

# الواجهة
cd frontend
npm run lint                     # oxlint (0 أخطاء مطلوب)
npm run build
```

CI في [`.github/workflows/ci.yml`](.github/workflows/ci.yml) يعمل على كل push/PR إلى `main`:
- وظيفة الخلفية: تثبيت Composer ثم `php artisan test`.
- وظيفة الواجهة: `npm ci` ثم lint ثم build.

شروط أي تغيير قبل الدمج: نجاح الاختبارات، lint نظيف، build ناجح، وفحص الواجهة حياً في الوضعين الداكن والفاتح (سطح المكتب والجوال).

---

## 12. النسخ الاحتياطي والاستعادة

### النسخ

```bash
php artisan edms:backup                # احتفاظ افتراضي 14 أرشيفاً
php artisan edms:backup --keep=30      # تخصيص الاحتفاظ
```

ينتج ملف `edms-backup-<date>.zip` يحتوي:
- `database.sql` (mysqldump مع routines/triggers/events)
- `config/.env`
- `storage/app/` (المرفقات)
- `manifest.json` (إحصاءات وتاريخ)

الموقع الافتراضي `D:/IT-EDMS-Backups` (قابل للتغيير بـ `EDMS_BACKUP_PATH`)، والسجل في `storage/logs/backup.log`. للتشغيل اليومي المجدول: `backend/scripts/backup-daily.bat` عبر Task Scheduler.

### الاستعادة

1. فك الأرشيف.
2. أنشئ قاعدة بيانات فارغة واستورد `database.sql`.
3. انسخ محتوى `storage/app/` إلى `backend/storage/app/`.
4. استعد `config/.env` ثم `php artisan config:clear` و`storage:link`.

---

## 13. أوامر Artisan المفيدة

| الأمر | الوظيفة |
|---|---|
| `php artisan edms:check` | فحص جاهزية النشر: المفتاح، القاعدة، الصلاحيات، بناء الواجهة، بيئة الإنتاج |
| `php artisan edms:backup [--keep=N]` | نسخة احتياطية كاملة مع تقليم الأرشيفات |
| `php artisan edms:ocr-index [--force]` | فهرسة نص المرفقات للبحث |
| `php artisan storage:link` | رابط `public/storage` |
| `php artisan config:cache` / `route:cache` / `view:cache` | تحسين الإنتاج |
| `php artisan optimize:clear` | مسح كل أنواع الكاش بعد أي تعديل إعدادات |

---

## 14. النشر

دليل مفصّل في [docs/deployment.md](docs/deployment.md): Apache/Nginx، HTTPS (شهادة محلية أو نطاق عبر Cloudflare)، cPanel، التصلّب الأمني، والترقية.

الخلاصة:

1. `npm run build` لدمج الواجهة في `backend/public`.
2. ارفع مجلد `backend` كاملاً واجعل Document Root هو `backend/public`.
3. اضبط `.env`: `APP_ENV=production`, `APP_DEBUG=false`, بيانات القاعدة، `APP_URL`.
4. `php artisan migrate --force && php artisan storage:link && php artisan optimize`.
5. تحقق بـ `php artisan edms:check`.

ملفات Docker المرفقة (`Dockerfile` و`docker-compose.yml`) قالب بداية: تحتاج تمرير `APP_KEY`، تنفيذ الترحيل والتهيئة، وضبط خادم الويب قبل الاعتماد عليها في الإنتاج.

---

## 15. آلية العمل على المشروع

### سير التغيير

1. أنشئ فرعاً وصفياً: `feat/categories-tree` أو `fix/approval-routing`.
2. نفّذ التغيير مع اختبار يغطيه (خاصة منطق الصلاحيات والتدقيق).
3. قبل الـ commit شغّل: `php artisan test`، `npm run lint`، `npm run build`.
4. رسائل commit بصيغة `type(scope): وصف مختصر` بالإنجليزية (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`).
5. افتح PR؛ يجب أن يمر CI قبل الدمج.

الأصول المبنية في `backend/public/assets` **متعقَّبة في Git عن قصد** حتى لا يحتاج الخادم إلى Node.js. لذلك أي تغيير واجهة يجب أن يتبعه `npm run build` ضمن نفس الـ commit.

### إضافة صفحة جديدة

1. أنشئ الصفحة في `frontend/src/pages/`.
2. أضف المسار في `frontend/src/App.jsx` مع `RequirePermission` عند الحاجة.
3. أضف عنصر التنقل في `AppLayout` (واحترم صلاحية العرض).
4. استخدم `src/services/api.js` للنداءات، وToast للأخطاء.
5. استخدم أصناف Tailwind القياسية فقط (لا ألوان صلبة) ليظهر الثيم الفاتح والداكن تلقائياً، وخصائص RTL المنطقية (`ms-*`, `pe-*`, `start-*`).

### إضافة نقطة API

1. أضف المسار في `backend/routes/api.php` داخل مجموعة `auth:sanctum`.
2. افحص الصلاحية داخل المتحكم (عبر `ensurePermission`/Gate) قبل أي تعديل.
3. سجّل العملية الحساسة في `AuditService` (create/update/delete مع diff).
4. أعد الغلاف الموحّد `{ success, message, data }`.
5. أضف اختبار Feature يغطي الصلاحيات والحالات الحدّية.

### إضافة صلاحية

1. أضفها في `RolesPermissionsSeeder` مع `group` و`display_name_ar`.
2. اربطها بالأدوار المناسبة داخل نفس الـ Seeder.
3. استخدمها في الخلفية والواجهة (`hasPermission`).
4. وثّقها في جدول الصلاحيات في هذا الملف عند تغيّر النطاق.

### قواعد لا تُخترق

- لا تعدّل ولا تحذف صفوف `audit_logs` ولا تعِد حساب التجزئة يدوياً.
- لا تحذف المستخدمين نهائياً إن كان لهم أثر تدقيق؛ عطّل الحساب بدلاً من ذلك.
- لا تشغّل `migrate:fresh` على قاعدة فيها بيانات حقيقية.
- لا تُدرج أسراراً في الكود أو في ملفات تُرفع إلى Git.
- تغييرات المخطط تحتاج migration جديدة (لا تعديل migration قديمة بعد دفعها).

---

## 16. استكشاف الأخطاء

| المشكلة | السبب الشائع | الحل |
|---|---|---|
| `No application encryption key has been specified` | `APP_KEY` فارغ أو كاش إعدادات قديم | `php artisan key:generate` ثم `php artisan optimize:clear` |
| صفحة بيضاء بعد النشر | لم يُبنَ SPA أو `index.html` قديم | `npm run build` وتأكد من `backend/public/index.html` |
| المرفقات لا تفتح | `public/storage` غير موجود | `php artisan storage:link` وتحقق من صلاحيات `storage/` |
| 401 بعد تسجيل الدخول | توكن منتهٍ (`SANCTUM_EXPIRATION`) أو جلسة قديمة | إعادة تسجيل الدخول / مسح كوكيز المتصفح |
| نسخ احتياطي فاشل | مسار `mysqldump` أو `zip` غير متاح | اضبط `EDMS_MYSQLDUMP` وتأكد من إضافة PHP zip |
| تحذير شهادة HTTPS محلي | شهادة ذاتية التوقيع | استورد الشهادة في نظامك أو استخدم نطاقاً موثوقاً |
| بحث لا يجد محتوى المرفقات | OCR لم يعمل | ثبّت Tesseract واضبط `TESSERACT_PATH` ثم `edms:ocr-index` |
| ملفات Word/Excel لا تُعرض | LibreOffice غير مثبت | ثبّت LibreOffice أو اضبط `EDMS_SOFFICE_PATH`؛ وإلا يبقى التنزيل متاحاً |

---

## 17. التوثيق

- [docs/deployment.md](docs/deployment.md) — النشر والتهيئة وHTTPS والترقية.
- [docs/document-preview-mechanism.md](docs/document-preview-mechanism.md) — آلية معاينة الملفات الآمنة (قابلة لإعادة الاستخدام).
- [backend/README.md](backend/README.md) — معمارية الخلفية وأنماط الكود والاختبارات.
- [frontend/README.md](frontend/README.md) — بنية الواجهة والثيم والصلاحيات وبناء الأصول.

---

## 18. الترخيص

كود التطبيق خاص بالمشروع. الإطار (Laravel) والمكتبات التابعة تخضع لتراخيصها الأصلية (MIT وغيرها).
