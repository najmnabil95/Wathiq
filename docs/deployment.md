# دليل النشر والتشغيل

هذا الدليل يشرح نشر Wathiq (IT-EDMS) على خادم واحد، وتأمينه، وترقيته لاحقاً.

الفرضية الأساسية: **الخلفية هي التطبيق الكامل**. الواجهة تُبنى إلى `backend/public`، لذلك لا يحتاج الخادم إلى Node.js ولا إلى إعداد CORS.

---

## 1. قبل النشر

```bash
# على جهاز البناء
npm run build                     # ينتج الأصول في backend/public
cd backend
composer install --no-dev --optimize-autoloader
php artisan test                  # يجب أن ينجح قبل أي نشر
```

جهّز على الخادم:

- PHP >= 8.2 مع `pdo_mysql`, `mbstring`, `openssl`, `zip`, `gd`, `fileinfo`
- MySQL/MariaDB مع قاعدة `it_edms_db` بترميز `utf8mb4_unicode_ci`
- مستخدم قاعدة بيانات مخصص بأقل صلاحيات (لا تستخدم root)
- Document Root يشير إلى `backend/public` **حصراً** (وليس `backend/`)

### معاينة ملفات Office (اختياري لكن موصى به)

تحويل Word/Excel/PowerPoint إلى PDF للمعاينة داخل المتصفح يعتمد على LibreOffice headless:

- ثبّت LibreOffice على الخادم (Windows: `C:/Program Files/LibreOffice/program/soffice.exe`، Linux: حزمة `libreoffice`).
- إن لم يكن في المسار الافتراضي اضبط `EDMS_SOFFICE_PATH` في `.env` ثم `php artisan config:cache`.
- ثبّت خطوطاً عربية على الخادم (مثل Noto Naskh Arabic) وإلا ظهر النص العربي غير مقروء في الـ PDF المحوّل.
- النسخ المحوّلة تُخزَّن في `backend/storage/framework/cache/office-previews` وعند حذفها تُعاد في أول معاينة تالية.
- عند غياب LibreOffice أو فشل التحويل يعرض النظام رسالة ويقدّم التنزيل بدلاً من المعاينة.
- مستخدم خدمة الويب يجب أن يملك صلاحية تنفيذ `soffice` والكتابة في `storage/framework/cache`.

---

## 2. إعداد البيئة

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://edms.example.com
APP_TIMEZONE=UTC

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=it_edms_db
DB_USERNAME=edms_app
DB_PASSWORD=<كلمة-مرور-قوية>

FILESYSTEM_DISK=public
SANCTUM_EXPIRATION=43200
```

ثم:

```bash
cd backend
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan optimize          # config + route + view cache
```

> `php artisan key:generate` مرة واحدة لكل بيئة. حفظ `APP_KEY` ضروري لاستعادة النسخ الاحتياطية؛ بدونه لا تفك الجلسات/البيانات المشفرة.

تحقق: `php artisan edms:check` يجب أن يظهر جميع البنود سليمة مع `production (Debug: OFF)`.

---

## 3. Apache (Windows/XAMPP أو Linux)

مثال vhost (Windows):

```apache
<VirtualHost *:443>
    ServerName edms.local
    DocumentRoot "C:/path/to/IT-EDMS/backend/public"

    SSLEngine on
    SSLCertificateFile      "C:/path/to/certs/edms.crt"
    SSLCertificateKeyFile   "C:/path/to/certs/edms.key"

    <Directory "C:/path/to/IT-EDMS/backend/public">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

قائمة تحقق Apache:

- `mod_rewrite` و`mod_ssl` مفعّلان.
- `AllowOverride All` حتى يعمل `public/.htaccess`.
- Document Root هو `public/` وليس جذر المشروع.
- لا تُفعّل استعراض المجلدات (`Options -Indexes`).
- بورت 80 يعيد التوجيه إلى HTTPS.

### شهادة محلية (تجربة)

```bash
openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout edms.key -out edms.crt -subj "/CN=edms.local"
```

أضف `127.0.0.1 edms.local` إلى ملف hosts، أعد تشغيل Apache، ثم استورد `edms.crt` في نظام العميل لتجنّب تحذير المتصفح. للتجربة السريعة عبر الإنترنت يمكن استخدام نفق Cloudflare المؤقت (انظر القسم 5).

---

## 4. Nginx + PHP-FPM (Linux)

استخدم [nginx.conf.example](../nginx.conf.example) كأساس:

- `root /var/www/it-edms/backend/public;`
- `client_max_body_size 25M;` (بحد أقصى 20MB للمرفق في الخلفية)
- تمرير PHP إلى PHP-FPM وتثبيت `SCRIPT_FILENAME`.
- كاش سنة كاملة للأصول (`assets/*`) لأن أسماءها تحمل hash.
- التوجيه الموحّد عبر `try_files $uri $uri/ /index.php?$query_string`.

```bash
sudo ln -s /etc/nginx/sites-available/it-edms.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

يمكن إضافة HTTPS عبر Let's Encrypt:

```bash
sudo certbot --nginx -d edms.example.com
```

---

## 5. HTTPS على الإنترنت

### أ) نفق Cloudflare سريع (تجربة فقط)

```bash
cloudflared tunnel --url http://localhost:8000
```

يعطيك رابط `https://<random>.trycloudflare.com` صالحاً للعرض التجريبي، لكنه **يتغير كل إعادة تشغيل** ولا يصلح للإنتاج.

### ب) نفق Cloudflare دائم مع نطاق

1. اشترِ نطاقاً واجعل Cloudflare يدير DNS له.
2. `cloudflared tunnel login` ثم `cloudflared tunnel create edms`.
3. `cloudflared tunnel route dns edms edms.example.com`.
4. اضبط `config.yml` ليشير إلى `http://localhost:80` (أو منفذ Apache).
5. ثبّت النفق كخدمة: `cloudflared service install` (Windows) أو systemd (Linux).

النتيجة: رابط ثابت بشهادة موثوقة دون فتح منافذ على الشبكة.

### ج) VPS بنطاق مباشر

سجّل A record للنطاق إلى عنوان الخادم، فعّل المنافذ 80/443، ثم أصدر شهادة عبر certbot.

---

## 6. الاستضافة المشتركة / cPanel

1. ارفع محتويات `backend` إلى الخادم (يفضّل خارج `public_html` إن أمكن).
2. اجعل Document Root للموقع: `.../backend/public` (أو ضع محتوى `public` في `public_html` مع تعديل مسارات `index.php`).
3. أنشئ القاعدة والمستخدم من cPanel، وارفع `.env` بمعلومات الاتصال.
4. من Terminal (إن توفر): `composer install --no-dev` ثم `php artisan key:generate && php artisan migrate --force && php artisan storage:link`.
5. بدون Terminal: ارفع `vendor/` و`storage/` جاهزة من جهاز البناء، وأنشئ الرابط يدوياً أو استخدم مسار تخزين مباشر.
6. فعّل AutoSSL/Let's Encrypt من cPanel.

في الاستضافة المشتركة تجنّب `QUEUE_CONNECTION=database` بدون عامل تشغيل مجدول، لأن المهام لن تُستهلك.

---

## 7. Docker

الملفان `Dockerfile` و`docker-compose.yml` قالب بداية وليسا إعداداً إنتاجياً مكتملاً:

- يجب تمرير `APP_KEY` وبيانات القاعدة وقت التشغيل.
- يجب تنفيذ `php artisan migrate --force` عند أول تشغيل.
- يجب توفير إعداد Nginx (الملف المرفق لا ينسخ [nginx.conf.example](../nginx.conf.example) تلقائياً).
- الأسرار في `docker-compose.yml` أمثلة تطوير؛ لا تستخدمها في الإنتاج.

---

## 8. التصلّب الأمني (قائمة تحقق)

- [ ] `APP_ENV=production` و`APP_DEBUG=false`
- [ ] `APP_KEY` فريد لكل بيئة ومحفوظ بأمان
- [ ] HTTPS إلزامي وإعادة توجيه من HTTP
- [ ] مستخدم قاعدة بيانات بأقل صلاحيات، وليس root
- [ ] Document Root = `backend/public`، و`.env` و`storage` و`vendor` خارج الوصول العام
- [ ] `php artisan optimize` بعد كل نشر
- [ ] نسخ احتياطي مجدول يومياً ومختبَر استرجاعه
- [ ] تغيير كلمات مرور الحسابات التجريبية أو حذف الحسابات غير المستخدمة
- [ ] مراجعة `SANCTUM_EXPIRATION` حسب سياسة المؤسسة
- [ ] مراقبة `storage/logs/laravel.log` ودوران السجلات

---

## 9. الترقية

```bash
# نسخة احتياطية أولاً
php artisan edms:backup

# سحب الكود
git pull origin main

# الخلفية
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize

# الواجهة: ابنِ على جهاز البناء ثم ارفع backend/public
npm run build
```

بعد الترقية: `php artisan edms:check`، ثم فحص تسجيل الدخول، رفع مرفق، معاينة، و`GET /api/v1/audit-logs/verify`.

---

## 10. الجدولة

### Windows (Task Scheduler)

- مهمة يومية 02:00 تشغّل `backend/scripts/backup-daily.bat`.
- السجل: `backend/storage/logs/backup-task.log` و`backup.log`.

### Linux (cron)

```cron
0 2 * * * cd /var/www/it-edms/backend && php artisan edms:backup >> storage/logs/backup-cron.log 2>&1
```

للفهرسة النصية للمرفقات (إن فُعّلت Tesseract):

```cron
30 2 * * * cd /var/www/it-edms/backend && php artisan edms:ocr-index >> storage/logs/ocr-cron.log 2>&1
```

---

## 11. استكشاف أخطاء النشر

| العرض | الفحص |
|---|---|
| 500 بعد الرفع | `storage/` و`bootstrap/cache` قابلة للكتابة؟ `APP_KEY` موجود؟ امسح `php artisan optimize:clear` |
| صفحة بيضاء | `public/index.html` موجود؟ `public/assets` مرفوعة؟ |
| 404 لكل API | `mod_rewrite`/`try_files` غير مضبوط أو Document Root خاطئ |
| المرفقات 404 | `php artisan storage:link` ورابط `public/storage` |
| فشل النسخ الاحتياطي | `EDMS_MYSQLDUMP` صحيح وإضافة `zip` مفعّلة |
| ملفات Word/Excel لا تُعرض PDF | LibreOffice غير مثبت أو `EDMS_SOFFICE_PATH` خاطئ؛ راجع `storage/logs/laravel.log` |
| تسجيل خروج متكرر | مدة `SANCTUM_EXPIRATION` قصيرة أو ساعة الخادم غير متزامنة |
