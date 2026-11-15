# الواجهة — React 19 SPA

واجهة عربية RTL كاملة تُبنى إلى `backend/public` وتُقدَّم من نفس تطبيق Laravel.

اقرأ الدليل العام أولاً: [../README.md](../README.md).

---

## 1. التقنيات

- React 19 + Vite 8 + React Router 7
- Tailwind CSS 4 (بدون ملف إعداد؛ المتغيرات والثيم في `src/index.css`)
- Zustand 5 لإدارة الجلسة
- Axios + اعتراضات، `react-hot-toast`، `lucide-react`، `date-fns`
- oxlint للفحص الساكن

---

## 2. البنية

```
src/
├── App.jsx                 # المسارات + حارس الصلاحيات + ErrorBoundary
├── main.jsx
├── index.css               # Tailwind + متغيّرات الثيم الفاتح
├── components/
│   ├── layout/AppLayout.jsx    # الشريط الجانبي، الترويسة، الإشعارات، تبديل الثيم
│   └── common/                 # Can, ErrorBoundary, UnauthorizedPage,
│                               # WatermarkOverlay, DocumentScannerModal, DigitalSignatureModal
├── pages/                  # صفحة لكل وحدة (17 صفحة)
├── services/api.js         # Axios + Bearer token + معالجة 401
└── store/authStore.js      # Zustand: user, token, hasPermission, can
```

### المسارات

| المسار | الصفحة |
|---|---|
| `/login` | تسجيل الدخول |
| `/` | لوحة التحكم |
| `/documents`, `/documents/create`, `/documents/:id` | الوثائق |
| `/disposition` | الاستبعاد والاستبقاء |
| `/categories`, `/document-types` | البنية الأرشيفية |
| `/departments`, `/organizations` | الهيكل التنظيمي والجهات |
| `/users`, `/roles` | الإدارة والصلاحيات |
| `/audit`, `/workflows`, `/settings` | الحوكمة والإعدادات |
| `/profile`, `/system-flow` | الملف الشخصي وسير النظام |

مسارات القوائم المحمية ملفوفة بـ `RequirePermission` وتعيد التوجيه عند غياب الصلاحية.

---

## 3. الاتصال بالـ API

`src/services/api.js`:

- التطوير: `http://127.0.0.1:8000/api/v1`
- الإنتاج: `/api/v1` (نفس النطاق)
- التثبيت اليدوي: `VITE_API_BASE_URL`
- يضيف `Authorization: Bearer` من `localStorage.edms_token`
- عند `401` (عدا محاولة الدخول) يمسح الجلسة ويعيد إلى تسجيل الدخول

مفاتيح التخزين المحلي: `edms_token`, `edms_user`, `edms-auth` (Zustand persist), `edms_theme`.

---

## 4. الصلاحيات في الواجهة

```jsx
const { hasPermission } = useAuthStore();
{hasPermission('documents.create') && <button>إنشاء وثيقة</button>}
```

أو بمكوّن `Can`:

```jsx
<Can permission="categories.manage">...</Can>
```

الصلاحيات تأتي من حمولة تسجيل الدخول/`auth/me` بعد تطبيق تجاوزات المستخدم (`grant`/`deny`). هذا للعرض فقط؛ الخلفية تتحقق دائماً.

---

## 5. الثيم وRTL

- الوضع الافتراضي داكن؛ يُحفظ الاختيار في `localStorage.edms_theme`.
- الوضع الفاتح يعمل بإضافة `html.light-theme` وخرائط الألوان في `src/index.css`.
- **قاعدة:** استخدم أصناف Tailwind القياسية (`bg-slate-900`, `text-white` ...) ولا تكتب ألواناً صلبة (hex/inline) حتى يتبع الثيمان تلقائياً.
- استخدم الخصائص المنطقية للاتجاه: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `border-s`.
- كل صفحة جديدة يجب فحصها في الوضعين الداكن والفاتح، عند ~390px و~1440px.

---

## 6. أنماط واجهة متبعة

- النوافذ المنبثقة تُعرض عبر `createPortal` إلى `document.body` مع `role="dialog"`/`alertdialog`، إغلاق بـ Escape، وحبس تركيز (focus trap) وإعادة التركيز للزر الفاتح.
- الأخطاء تُعرض بـ `react-hot-toast`؛ رسائل الخلفية (`message`/`errors`) تُعرض كما هي.
- الحذف يؤكد بنافذة منفصلة، وتُعرض رسالة المنع القادمة من الخلفية داخل النافذة نفسها.
- لا تُستخدم روابط ملفات مباشرة؛ التحميل/المعاينة تمرّ عبر API ثم Blob/Object URL (انظر [docs/document-preview-mechanism.md](../docs/document-preview-mechanism.md)).
- حالات التحميل: هياكل هيكلية (skeleton)، وحالات فارغة مع إجراء واضح.

---

## 7. الأوامر

```bash
npm install
npm run dev      # تطوير على 5173
npm run lint     # oxlint (يجب أن تكون النتيجة 0)
npm run build    # يبني إلى ../backend/public (مع تنظيف الأصول القديمة أولاً)
```

`prebuild` يشغّل `scripts/clean-assets.mjs` لمسح الأصول القديمة من `backend/public/assets` قبل البناء، مع الحفاظ على بقية ملفات Laravel العامة.

الأصول المبنية متعقَّبة في Git؛ أي تغيير في `src/` يجب أن يُتبَع بـ `npm run build` قبل الـ commit.

---

## 8. إضافة صفحة

1. أنشئ `src/pages/XPage.jsx` بنفس أنماط الصفحات القائمة (ترويسة، بطاقات، حالات تحميل/فراغ).
2. أضف المسار في `App.jsx` مع صلاحية العرض إن كانت الصفحة إدارية.
3. أضف عنصر التنقل في `AppLayout` مع فحص `hasPermission`.
4. أضف دوال النداء في `services/api.js` (مجموعة واحدة لكل وحدة).
5. تحقق يدوياً: الوضعان، المقاسان، الأخطاء، والصلاحية بحساب بلا إذن.

---

## 9. القيود المعروفة

- لا توجد اختبارات وحدة للواجهة بعد؛ الاعتماد على oxlint + build + الفحص الحي (headless Chrome/CDP).
- لا تستخدم `localStorage` لتخزين أسرار إضافية؛ التوكن فقط كما هو معمول به حالياً.
