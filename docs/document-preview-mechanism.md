# آلية معاينة الوثائق الآمنة (قابلة لإعادة الاستخدام)

ملف مستقل يصف آلية معاينة الملفات داخل المتصفح دون كشف روابط مباشرة أو عامة للملفات.
يمكن نسخ هذا الملف إلى أي مشروع آخر (Laravel / Node / Django … مع React / Vue / أي واجهة).

---

## 1. الفكرة في سطر واحد

الملف **لا يُعرض عبر رابط عام**، بل يُجلب عبر طلب API موثّق (Token) على شكل `Blob`،
ثم تُنشأ له `Object URL` مؤقتة داخل المتصفح وتُعرض في `<iframe>` أو `<img>`،
وتُحرَّر الذاكرة فور الإغلاق.

```
المتصفح                          الخادم
   │  GET /api/files/{id}/preview
   │  Authorization: Bearer <token>
   │ ─────────────────────────────►  تحقّق من الصلاحية + رؤية السجل
   │                                 أعد الملف كـ stream
   │ ◄─────────────────────────────  Content-Disposition: inline
   │                                 Cache-Control: private, no-cache
   │                                 X-Content-Type-Options: nosniff
   │
   ├─ responseType: 'blob'  →  Blob
   ├─ URL.createObjectURL(blob)  →  blob:https://app/…
   ├─ <iframe src="blob:…">  أو  <img src="blob:…">
   └─ عند الإغلاق: URL.revokeObjectURL(url)
```

**لماذا لا نستخدم رابطاً مباشراً؟**
- الرابط المباشر يمكن نسخه ومشاركته وتجاوز الصلاحيات.
- `objectURL` صالح فقط في نفس سياق المتصفح، ولا يُخزَّن، ويُبطَل بمجرد `revoke`.

---

## 2. المتطلبات قبل البدء

| العنصر | الشرط |
|---|---|
| المصادقة | كل طلب معاينة يحمل توكن المستخدم (Bearer / Cookie) |
| الصلاحية | تحقّق من صلاحية العرض **و** من رؤية السجل نفسه (ملكية/قسم/سرّية) |
| التخزين | الملفات محفوظة على قرص خاص (غير `public`) |
| النوع | قائمة بيضاء للأنواع القابلة للمعاينة (PDF، صور، نص) |
| الاستجابة | `inline` + `private, no-cache` + `nosniff` |

---

## 3. الخادم — نقاط النهاية المطلوبة

نقطتان فقط:

1. **`GET /api/files/{id}/preview`** — يعيد محتوى الملف للمعاينة (inline).
2. **`GET /api/files/{id}/download`** — يعيد الملف للتنزيل (attachment)، وهنا تُطبَّق العلامة المائية إن وُجدت.

فصل النقطتين ضروري: المعاينة قد تكون بدون علامة مائية مرئية على الملف نفسه،
أما النسخة المنزّلة فتكون موسومة ومُسجَّلة.

### 3.1 منطق نقطة المعاينة (Pseudocode عام)

```text
handler preview(request, id):
    user = authenticate(request)            // 401 إن لم يوجد
    assert user.can("files.view")           // 403
    file = find_file_or_404(id)

    assert can_see(user, file)              // صلاحية الصف: قسم/سرّية/ملكية
    assert file.is_previewable              // نوع ضمن القائمة البيضاء

    if not storage.exists(file.path):
        return 404 "الملف غير موجود على التخزين"

    return stream(
        path          = file.path,
        mime          = file.mime_type,
        disposition   = "inline",
        cache_control = "private, no-cache, must-revalidate",
        extra_headers = { "X-Content-Type-Options": "nosniff" },
    )
```

قواعد مهمة:
- **لا تعتمد على امتداد الملف فقط**؛ استخدم `mime_type` المخزَّن + الامتداد كاحتياط.
- **افحص وجود الملف على القرص** قبل الإرجاع، وأعد 404 واضحاً بدل خطأ 500.
- إذا كان النوع غير قابل للمعاينة: أعد **422 / 415** برسالة تشرح أن التنزيل متاح.

### 3.2 مرجع Laravel

```php
public function preview(int $id): Response
{
    $user = request()->user();
    abort_unless($user->can('files.view'), 403);

    $file = FileRecord::findOrFail($id);
    abort_unless($file->isVisibleTo($user), 403);
    abort_unless($file->is_previewable, 415, 'هذا النوع غير قابل للمعاينة المباشرة.');

    $disk = Storage::disk($file->disk ?: 'local');
    abort_unless($disk->exists($file->path), 404, 'الملف غير موجود على التخزين.');

    // response()->file يبثّ الملف دون تحميله كاملاً في الذاكرة
    return response()->file($disk->path($file->path), [
        'Content-Type'           => $file->mime_type ?: 'application/octet-stream',
        'Content-Disposition'    => 'inline; filename="' . addslashes($file->original_name) . '"',
        'Cache-Control'          => 'private, no-cache, must-revalidate',
        'X-Content-Type-Options' => 'nosniff',
    ]);
}
```

### 3.3 القائمة البيضاء للأنواع

```php
public function getIsPreviewableAttribute(): bool
{
    $mime = strtolower($this->mime_type ?? '');
    $ext  = strtolower(pathinfo($this->file_name ?? '', PATHINFO_EXTENSION));

    if (in_array($mime, [
        'application/pdf',
        'image/png', 'image/jpeg', 'image/gif', 'image/webp',
        'text/plain', 'text/csv',
    ], true)) {
        return true;
    }

    // بعض المتصفحات ترسل أنواعاً غير دقيقة؛ الامتداد احتياط
    return $ext === 'pdf';
}
```

> **لا تُعاين** `svg` من مصادر غير موثوقة إن كنت تسمح بـ `image/svg+xml`،
> لأن SVG قد يحمل سكربتات. إما منعه، أو تقديمه عبر `Content-Disposition: attachment`.

---

## 4. الواجهة — المكوّن العام

### 4.1 المبدأ

1. عند فتح المعاينة: `axios.get(url, { responseType: 'blob' })`.
2. `const blob = new Blob([res.data], { type: res.headers['content-type'] })`.
3. `const objectUrl = URL.createObjectURL(blob)`.
4. اعرضه حسب النوع:
   - PDF → `<iframe src={objectUrl}>`
   - صورة → `<img src={objectUrl}>`
   - نص/CSV → `<iframe>` أو `<pre>` بعد قراءة النص
   - أي شيء آخر → أظهر بطاقة "تنزيل الملف".
5. عند الإغلاق أو تغيير الملف: `URL.revokeObjectURL(objectUrl)` **وأفرغ الحالة**.

### 4.2 مرجع React (مستقل عن أي مشروع)

```jsx
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

function FilePreview({ fileId, fileName, mimeType, onClose }) {
  const [url, setUrl]         = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);
  const urlRef = useRef(null);

  const release = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    setUrl(null);
  };

  useEffect(() => {
    if (!fileId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    release();

    axios
      .get(`/api/files/${fileId}/preview`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((res) => {
        if (cancelled) return;
        const type = res.headers['content-type'] || mimeType || 'application/octet-stream';
        const blob = new Blob([res.data], { type });
        const objectUrl = URL.createObjectURL(blob);
        urlRef.current = objectUrl;
        setUrl(objectUrl);
      })
      .catch(async (err) => {
        if (cancelled) return;
        // قراءة رسالة الخطأ إن جاءت JSON داخل Blob
        let message = 'تعذر تجهيز الملف للمعاينة.';
        const data = err.response?.data;
        if (data instanceof Blob) {
          try {
            const parsed = JSON.parse(await data.text());
            message = parsed.message || message;
          } catch { /* تجاهل */ }
        } else if (data?.message) {
          message = data.message;
        }
        setError(message);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
      release(); // تحرير الذاكرة عند إغلاق المكوّن أو تغيير الملف
    };
  }, [fileId]);

  if (loading) return <div>جاري تجهيز الملف…</div>;
  if (error)   return <div>{error}</div>;
  if (!url)    return null;

  const isPdf   = (mimeType || '').includes('pdf');
  const isImage = (mimeType || '').startsWith('image/');

  if (isPdf)   return <iframe src={url} title={fileName} style={{ width: '100%', height: '75vh', border: 0 }} />;
  if (isImage) return <img src={url} alt={fileName} style={{ maxWidth: '100%', maxHeight: '75vh' }} />;

  return <a href={url} download={fileName}>تنزيل الملف</a>;
}

export default FilePreview;
```

### 4.3 ملاحظات لا تُهمَل

- **دورة الحياة**: كل `createObjectURL` يجب أن يقابله `revokeObjectURL`. بدون ذلك تتسرّب الذاكرة مع كل معاينة.
- **`cancelled` flag**: يمنع `setState` بعد إلغاء التحميل أو تبديل الملف بسرعة.
- **رسالة الخطأ JSON داخل Blob**: عند `responseType: 'blob'` تُعيد أخطاء الـ API لوباً يحوي JSON؛ فُكّه بـ `.text()` ثم `JSON.parse`.
- **إعادة التحميل**: لا تخزّن `objectURL` في `localStorage` أو `sessionStorage` — غير صالح خارج الجلسة الحالية.
- **النافذة المستقلة**: `window.open(objectUrl, '_blank')` يعمل، لأن الـ blob مرتبط بنفس الأصل (نفس الـ Origin).

---

## 5. قواعد الأمان الخمس

| # | القاعدة | السبب |
|---|---|---|
| 1 | كل طلب معاينة يمرّ عبر المصادقة | لا رابط عام قابل للمشاركة |
| 2 | التحقق من صلاحية العرض **و** رؤية السجل | الصلاحية العامة لا تكفي |
| 3 | `Content-Disposition: inline` + `nosniff` | منع المتصفح من تفسير الملف كنوع آخر |
| 4 | `Cache-Control: private, no-cache` | منع كاش الوسطاء من تخزين الملف |
| 5 | قائمة بيضاء للأنواع + رفض الباقي بوضوح | منع XSS عبر SVG/HTML |

---

## 6. الملفات المكتبية والعملية

### Word / Excel / PowerPoint / Archives
المتصفح لا يعرضها بشكل موثوق. الخيارات:

| الخيار | الوصف | الكلفة |
|---|---|---|
| تنزيل للملف | أبسط وأأمن: زر "تنزيل وفتح محلياً" | صفر |
| تحويل إلى PDF على الخادم | LibreOffice headless / OnlyOffice | متوسطة |
| Office Online / Google Docs Viewer | يتطلب رابطاً عاماً (غير مناسب للوثائق الحساسة) | مخالف للأمان |

الأنسب في الأنظمة الحساسة: **تنزيل مع علامة مائية** بدل المعاينة.

---

## 7. الملفات الكبيرة — بدائل أفضل من تحميل كامل الـ Blob

تحميل ملف 200MB كـ Blob دفعة واحدة يستهلك ذاكرة المتصفح كاملة.
البدائل:

### 7.1 رابط موقّع قصير الصلاحية (Signed URL)
- الخادم يولّد رابطاً صالحاً 2–5 دقائق.
- الرابط يحمل توقيعاً (HMAC) لا يمكن تزويره.
- المُعاينة تطلب الرابط أولاً ثم تفتحه مباشرة (يدعم Range تلقائياً).

```php
// توقيع بسيط عبر URL::temporarySignedRoute
$url = URL::temporarySignedRoute('files.stream', now()->addMinutes(5), ['id' => $file->id]);
// الواجهة: <iframe src={signedUrl}> بعد جلبه
```

### 7.2 PDF.js مع Range Requests
- تصفّح الصفحات عند الطلب بدل تحميل كل الملف.
- مناسب للوثائق الكبيرة جداً وذات الصفحات المتعددة.
- يتطلب أن يدعم الخادم ترويسة `Accept-Ranges` و`206 Partial Content`.

### 7.3 معاينة مصغّرة مسبقة
- خزّن نسخة thumbnail/PDF مضغوطة عند الرفع.
- اعرض المصغّرة للمعاينة السريعة، والملف الكامل عند التنزيل.

---

## 8. العلامة المائية (Watermark)

فرِّق بين:

- **Watermark مرئية في المعاينة**: طبقة HTML/CSS فوق العارض (`position: absolute`, `pointer-events: none`).
  لا تغيّر الملف، ويمكن للمستخدم ذي الخبرة تجاوزها.
- **Watermark حقيقية عند التنزيل**: تُطبَّق على الملف نفسه قبل إرساله (PDF stamp / إعادة توليد).
  هذه هي الحماية الفعلية.

للأنظمة المشدّدة: اعرض المعاينة بخفض الجودة **و** اطبع العلامة على نسخة التنزيل.

---

## 9. قائمة تحقق سريعة عند النقل لمشروع آخر

- [ ] الملفات على قرص خاص (خارج `public/`).
- [ ] نقطة `preview` تتحقق من: المصادقة → الصلاحية → رؤية السجل → وجود الملف.
- [ ] الترويسات: `inline`, `private, no-cache`, `nosniff`, `Content-Type` صحيح.
- [ ] قائمة بيضاء للأنواع، ورفض صريح للباقي.
- [ ] الواجهة تستخدم `responseType: 'blob'`.
- [ ] `createObjectURL` يقابله `revokeObjectURL` (وفي `cleanup` أيضاً).
- [ ] إلغاء الطلب (`cancelled`) عند إغلاق/تبديل الملف.
- [ ] فكّ رسائل الخطأ JSON من Blob.
- [ ] مسار بديل "تنزيل" للملفات غير المدعومة.
- [ ] للملفات الكبيرة: Signed URL أو Range Requests/PDF.js.

---

## 10. الخلاصة

المعادلة الأساسية:

> **مصادقة + صلاحية على السجل + بثّ with inline/no-cache/nosniff + Blob/ObjectURL في الواجهة + تحرير الذاكرة.**

هذه الآلية لا تعتمد على تقنية خادم معيّنة، وتعمل مع أي واجهة حديثة،
وتحقق التوازن بين تجربة المعاينة السلسة وأمان الوثائق الحساسة.
