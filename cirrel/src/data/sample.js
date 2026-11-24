// بيانات تجريبية لمتجر «كِلن آند ليف». كل شيء محلي داخل المتصفح.

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
})

const compactNumber = (value, divisor) => {
  const abs = Math.abs(value)
  const digits = abs >= divisor * 100 ? 0 : 1
  return Number((value / divisor).toFixed(digits))
}

export const money = (value, compact = false) => {
  const n = Number(value) || 0
  if (compact) {
    const abs = Math.abs(n)
    if (abs >= 1_000_000) return `$${compactNumber(n, 1_000_000)} مليون`
    if (abs >= 1_000) return `$${compactNumber(n, 1_000)} ألف`
    return `$${Math.round(n)}`
  }
  return `$${numberFormatter.format(n)}`
}

export const number = (value) => new Intl.NumberFormat('en-US').format(value)

export const dateLabel = (d = new Date()) =>
  new Intl.DateTimeFormat('ar', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    numberingSystem: 'latn',
  }).format(d)

export const timeGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'صباح الخير، نور'
  return 'مساء الخير، نور'
}

export const orders = [
  {
    id: 'KL-49537', customer: 'صوفيا مورينو', initials: 'صم', color: '#3d86ff',
    items: ['ماتشا احتفالية ×2', 'خفاقة ماتشا ×1'], total: 94, status: 'paid',
    channel: 'المتجر الإلكتروني', time: 'اليوم، 09:42', city: 'لشبونة', email: 'sofia.m@hey.com',
  },
  {
    id: 'KL-49538', customer: 'يارا مورينو', initials: 'يم', color: '#9b7bff',
    items: ['إيرل غراي بالبرغموت ×1', 'كوب حجري ×2'], total: 62.05, status: 'paid',
    channel: 'إنستغرام', time: 'اليوم، 09:18', city: 'بورتو', email: 'yara@hey.com',
  },
  {
    id: 'KL-49539', customer: 'جون هارت', initials: 'جه', color: '#ffab5e',
    items: ['أولونغ بالحليب ×1'], total: 33.5, status: 'paid',
    channel: 'المتجر الإلكتروني', time: 'اليوم، 08:55', city: 'برايتون', email: 'june@hey.com',
  },
  {
    id: 'KL-49540', customer: 'آدا لين', initials: 'آل', color: '#44d19d',
    items: ['طقم هدايا رقم 3 ×1'], total: 148.4, status: 'packed',
    channel: 'المتجر الإلكتروني', time: 'اليوم، 08:12', city: 'لندن', email: 'ada@hey.com',
  },
  {
    id: 'KL-49541', customer: 'ميلو فريزر', initials: 'مف', color: '#ff7a85',
    items: ['هوجيتشا محمصة ×2', 'صينية أرز ×1'], total: 78.9, status: 'packed',
    channel: 'السوق المحلي', time: 'اليوم، 07:44', city: 'بريستول', email: 'milo@hey.com',
  },
  {
    id: 'KL-49542', customer: 'إينيس دوارتي', initials: 'إد', color: '#38c7d8',
    items: ['سينشا أسا ×1', 'دورق زجاجي ×1'], total: 60, status: 'shipped',
    channel: 'المتجر الإلكتروني', time: 'أمس، 18:20', city: 'مدريد', email: 'ines@hey.com',
  },
  {
    id: 'KL-49543', customer: 'ثيو بارك', initials: 'ثب', color: '#b7c4d6',
    items: ['حديقة الأعشاب ×3'], total: 63, status: 'shipped',
    channel: 'البيع بالجملة', time: 'أمس، 16:03', city: 'سيول', email: 'theo@hey.com',
  },
  {
    id: 'KL-49544', customer: 'لينا أوكافور', initials: 'لأ', color: '#ef7ad8',
    items: ['حقيبة كتان ×2', 'ماتشا احتفالية ×1'], total: 70, status: 'delivered',
    channel: 'إنستغرام', time: 'أمس، 11:28', city: 'لاغوس', email: 'lina@hey.com',
  },
  {
    id: 'KL-49545', customer: 'رافي شاه', initials: 'رش', color: '#ffcf5c',
    items: ['كوب حجري ×4'], total: 112, status: 'delivered',
    channel: 'المتجر الإلكتروني', time: '19 نوفمبر، 14:52', city: 'مومباي', email: 'ravi@hey.com',
  },
  {
    id: 'KL-49546', customer: 'إيلينا بتروفا', initials: 'إب', color: '#8fb8ff',
    items: ['إيرل غراي بالبرغموت ×2'], total: 36, status: 'delivered',
    channel: 'المتجر الإلكتروني', time: '19 نوفمبر، 10:15', city: 'صوفيا', email: 'elena@hey.com',
  },
  {
    id: 'KL-49547', customer: 'سام ويتيكر', initials: 'سو', color: '#6fe3b7',
    items: ['صينية أرز ×1'], total: 42, status: 'returned',
    channel: 'السوق المحلي', time: '18 نوفمبر، 17:09', city: 'ليدز', email: 'sam@hey.com',
  },
  {
    id: 'KL-49548', customer: 'نور حداد', initials: 'نح', color: '#3d86ff',
    items: ['دورق زجاجي ×1', 'سينشا أسا ×1'], total: 60, status: 'pending',
    channel: 'المتجر الإلكتروني', time: '18 نوفمبر، 12:31', city: 'عمّان', email: 'noor@hey.com',
  },
  {
    id: 'KL-49549', customer: 'مايا روسي', initials: 'مر', color: '#ff9d6e',
    items: ['طقم هدايا رقم 3 ×2'], total: 144, status: 'delivered',
    channel: 'البيع بالجملة', time: '17 نوفمبر، 09:20', city: 'ميلانو', email: 'maya@hey.com',
  },
  {
    id: 'KL-49550', customer: 'يوناس فيبر', initials: 'يو', color: '#7d9cff',
    items: ['خفاقة ماتشا ×1', 'ماتشا احتفالية ×1'], total: 60, status: 'returned',
    channel: 'إنستغرام', time: '16 نوفمبر، 19:44', city: 'برلين', email: 'jonas@hey.com',
  },
  {
    id: 'KL-49551', customer: 'بريا ناير', initials: 'بن', color: '#89e0a0',
    items: ['هوجيتشا محمصة ×2', 'حقيبة كتان ×1'], total: 54, status: 'delivered',
    channel: 'المتجر الإلكتروني', time: '15 نوفمبر، 13:37', city: 'كوتشي', email: 'priya@hey.com',
  },
  {
    id: 'KL-49552', customer: 'أوين كلارك', initials: 'أك', color: '#f2a1b8',
    items: ['أولونغ بالحليب ×2', 'حديقة الأعشاب ×1'], total: 69, status: 'shipped',
    channel: 'السوق المحلي', time: '15 نوفمبر، 09:03', city: 'دبلن', email: 'owen@hey.com',
  },
]

export const products = [
  { id: 'P-01', name: 'ماتشا احتفالية', collection: 'الشاي', price: 34, stock: 42, reorder: 25, sold: 128, tone: 'matcha', note: 'أوجي، اليابان · 30غ', emoji: '🍵' },
  { id: 'P-02', name: 'إيرل غراي بالبرغموت', collection: 'الشاي', price: 18, stock: 0, reorder: 40, sold: 96, tone: 'bergamot', note: 'برغموت صقلي · 50غ', emoji: '🍂' },
  { id: 'P-03', name: 'أولونغ بالحليب', collection: 'الشاي', price: 24, stock: 9, reorder: 20, sold: 84, tone: 'oolong', note: 'نانتو، تايوان · 40غ', emoji: '🌿' },
  { id: 'P-04', name: 'حديقة الأعشاب', collection: 'الشاي', price: 21, stock: 32, reorder: 30, sold: 73, tone: 'garden', note: 'خلطة البيت · 60غ', emoji: '🌼' },
  { id: 'P-05', name: 'هوجيتشا محمصة', collection: 'الشاي', price: 19, stock: 3, reorder: 20, sold: 61, tone: 'hojicha', note: 'كيوتو، اليابان · 60غ', emoji: '🍁' },
  { id: 'P-06', name: 'سينشا أسا', collection: 'الشاي', price: 22, stock: 42, reorder: 25, sold: 58, tone: 'sencha', note: 'شيزوكا، اليابان · 50غ', emoji: '🌱' },
  { id: 'P-07', name: 'كوب حجري', collection: 'الخزف', price: 28, stock: 18, reorder: 12, sold: 45, tone: 'clay', note: 'مصنوع يدويًا · 180مل', emoji: '🏺' },
  { id: 'P-08', name: 'صينية أرز', collection: 'الخزف', price: 42, stock: 6, reorder: 10, sold: 31, tone: 'cedar', note: 'خشب أرز ياباني · 24سم', emoji: '🪵' },
  { id: 'P-09', name: 'حقيبة كتان', collection: 'مستلزمات', price: 16, stock: 55, reorder: 20, sold: 88, tone: 'linen', note: 'كتان مغسول · صغيرة', emoji: '👝' },
  { id: 'P-10', name: 'خفاقة ماتشا', collection: 'الأدوات', price: 26, stock: 11, reorder: 15, sold: 52, tone: 'bamboo', note: 'تشاسن · 80 شعبة', emoji: '🎋' },
  { id: 'P-11', name: 'دورق زجاجي', collection: 'الخزف', price: 38, stock: 7, reorder: 10, sold: 27, tone: 'glass', note: 'بوروسيليكات · 700مل', emoji: '🫗' },
  { id: 'P-12', name: 'طقم هدايا رقم 3', collection: 'الأطقم', price: 72, stock: 21, reorder: 15, sold: 39, tone: 'gift', note: 'شاي وكوب وحقيبة', emoji: '🎁' },
]

export const customers = [
  { id: 'C-01', name: 'صوفيا مورينو', initials: 'صم', color: '#3d86ff', email: 'sofia.m@hey.com', city: 'لشبونة', segment: 'منتظم', orders: 14, spend: 682, lastOrder: 'اليوم', joined: 'فبراير 2024', reviews: [{ rating: 5, text: 'الماتشا ناعمة بشكل لا يصدق. أصبحت طقس يوم الأحد.', product: 'ماتشا احتفالية', date: '12 نوفمبر' }] },
  { id: 'C-02', name: 'يارا مورينو', initials: 'يم', color: '#9b7bff', email: 'yara@hey.com', city: 'بورتو', segment: 'جديد', orders: 1, spend: 62, lastOrder: 'اليوم', joined: 'نوفمبر 2026', reviews: [] },
  { id: 'C-03', name: 'جون هارت', initials: 'جه', color: '#ffab5e', email: 'june@hey.com', city: 'برايتون', segment: 'منتظم', orders: 6, spend: 214, lastOrder: 'اليوم', joined: 'يونيو 2025', reviews: [{ rating: 4, text: 'الأولونغ جميل، لكن أتمنى لو كانت العلبة أكبر.', product: 'أولونغ بالحليب', date: '28 أكتوبر' }] },
  { id: 'C-04', name: 'آدا لين', initials: 'آل', color: '#44d19d', email: 'ada@hey.com', city: 'لندن', segment: 'VIP', orders: 21, spend: 1490, lastOrder: 'اليوم', joined: 'سبتمبر 2023', reviews: [{ rating: 5, text: 'اشتريت طقم الهدايا لأمي. التغليف رائع.', product: 'طقم هدايا رقم 3', date: '02 نوفمبر' }] },
  { id: 'C-05', name: 'ميلو فريزر', initials: 'مف', color: '#ff7a85', email: 'milo@hey.com', city: 'بريستول', segment: 'بالجملة', orders: 9, spend: 2260, lastOrder: 'اليوم', joined: 'يناير 2024', reviews: [] },
  { id: 'C-06', name: 'إينيس دوارتي', initials: 'إد', color: '#38c7d8', email: 'ines@hey.com', city: 'مدريد', segment: 'منتظم', orders: 8, spend: 388, lastOrder: 'أمس', joined: 'مارس 2025', reviews: [{ rating: 5, text: 'وصل السينشا في يومين وطعمه كالربيع.', product: 'سينشا أسا', date: '18 نوفمبر' }] },
  { id: 'C-07', name: 'ثيو بارك', initials: 'ثب', color: '#b7c4d6', email: 'theo@hey.com', city: 'سيول', segment: 'بالجملة', orders: 12, spend: 3180, lastOrder: 'أمس', joined: 'نوفمبر 2023', reviews: [] },
  { id: 'C-08', name: 'لينا أوكافور', initials: 'لأ', color: '#ef7ad8', email: 'lina@hey.com', city: 'لاغوس', segment: 'VIP', orders: 17, spend: 960, lastOrder: 'أمس', joined: 'يوليو 2024', reviews: [{ rating: 5, text: 'ثالث طلب هذا العام. لا يخيب أبدًا.', product: 'ماتشا احتفالية', date: '30 أكتوبر' }] },
  { id: 'C-09', name: 'رافي شاه', initials: 'رش', color: '#ffcf5c', email: 'ravi@hey.com', city: 'مومباي', segment: 'منتظم', orders: 5, spend: 312, lastOrder: '19 نوفمبر', joined: 'أغسطس 2025', reviews: [] },
  { id: 'C-10', name: 'إيلينا بتروفا', initials: 'إب', color: '#8fb8ff', email: 'elena@hey.com', city: 'صوفيا', segment: 'جديد', orders: 2, spend: 88, lastOrder: '19 نوفمبر', joined: 'أكتوبر 2026', reviews: [{ rating: 4, text: 'البرغموت لطيف، وخفيف قليلًا على ذوقي.', product: 'إيرل غراي بالبرغموت', date: '20 نوفمبر' }] },
  { id: 'C-11', name: 'سام ويتيكر', initials: 'سو', color: '#6fe3b7', email: 'sam@hey.com', city: 'ليدز', segment: 'معرّض للفقد', orders: 4, spend: 190, lastOrder: '18 نوفمبر', joined: 'فبراير 2025', reviews: [] },
  { id: 'C-12', name: 'مايا روسي', initials: 'مر', color: '#ff9d6e', email: 'maya@hey.com', city: 'ميلانو', segment: 'بالجملة', orders: 6, spend: 1740, lastOrder: '17 نوفمبر', joined: 'أبريل 2024', reviews: [{ rating: 5, text: 'زبائن المقهى يطلبون هذه الماتشا بالاسم.', product: 'طقم هدايا رقم 3', date: '05 نوفمبر' }] },
]

export const revenueSeries = {
  '7D': {
    labels: ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
    current: [640, 780, 920, 610, 1130, 1470, 1290],
    previous: [580, 690, 810, 700, 980, 1210, 1080],
  },
  '30D': {
    labels: ['24 أكتوبر', '', '', '', '', '30 أكتوبر', '', '', '', '', '5 نوفمبر', '', '', '', '', '11 نوفمبر', '', '', '', '', '17 نوفمبر', '', '', '', '', '22 نوفمبر', '', '', '', ''],
    current: [820, 910, 760, 1120, 980, 1340, 1210, 690, 1040, 1180, 1420, 1310, 890, 1120, 1560, 1290, 1080, 1420, 1680, 1510, 1190, 1380, 1720, 1460, 1590, 1410, 1780, 1620, 1890, 1640],
    previous: [740, 820, 790, 940, 880, 1120, 1010, 640, 920, 1010, 1180, 1130, 820, 960, 1280, 1120, 980, 1180, 1390, 1290, 1050, 1190, 1420, 1260, 1340, 1220, 1480, 1390, 1520, 1380],
  },
  '6M': {
    labels: ['يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر'],
    current: [11800, 13400, 12900, 15200, 18100, 21200],
    previous: [9800, 11200, 11800, 12600, 14100, 16300],
  },
  '12M': {
    labels: ['ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر'],
    current: [11200, 12800, 12100, 10400, 11800, 13200, 12700, 14500, 15100, 16800, 18400, 21200],
    previous: [9400, 10100, 9800, 9200, 10300, 11000, 10800, 11600, 12100, 13000, 14200, 15400],
  },
}

export const visitorsToday = [8, 12, 9, 14, 11, 17, 15, 21, 18, 24, 19, 28, 22, 26, 31, 27, 34, 29, 36, 32, 38, 30, 35, 38]

export const salesSources = [
  { label: 'المتجر الإلكتروني', value: 15007, share: 64, color: '#3d86ff' },
  { label: 'إنستغرام', value: 4218, share: 18, color: '#ffab5e' },
  { label: 'السوق المحلي', value: 938, share: 4, color: '#44d19d' },
  { label: 'البيع بالجملة', value: 3282, share: 14, color: '#9b7bff' },
]

export const packingQueue = orders.filter((o) => o.status === 'paid').slice(0, 3)

export const stockAlerts = products.filter((p) => p.stock <= p.reorder).slice(0, 4)

export const invoices = [
  { id: 'INV-2041', customer: 'ميلو فريزر', initials: 'مف', color: '#ff7a85', total: 1280, issued: '01 نوفمبر', due: '15 نوفمبر', status: 'overdue' },
  { id: 'INV-2042', customer: 'ثيو بارك', initials: 'ثب', color: '#b7c4d6', total: 940, issued: '08 نوفمبر', due: '22 نوفمبر', status: 'due' },
  { id: 'INV-2043', customer: 'مايا روسي', initials: 'مر', color: '#ff9d6e', total: 620, issued: '12 نوفمبر', due: '26 نوفمبر', status: 'due' },
  { id: 'INV-2044', customer: 'آدا لين', initials: 'آل', color: '#44d19d', total: 148, issued: '14 نوفمبر', due: '28 نوفمبر', status: 'paid' },
  { id: 'INV-2045', customer: 'رافي شاه', initials: 'رش', color: '#ffcf5c', total: 312, issued: '16 نوفمبر', due: '30 نوفمبر', status: 'paid' },
  { id: 'INV-2046', customer: 'بالجملة — مقهى أستر', initials: 'أك', color: '#9b7bff', total: 2140, issued: '19 نوفمبر', due: '03 ديسمبر', status: 'draft' },
]

export const discounts = [
  { code: 'FIRSTSIP', type: 'percent', value: 15, uses: 84, limit: 200, status: 'active', campaign: 'رسالة الترحيب', ends: '31 ديسمبر' },
  { code: 'MATCHA10', type: 'percent', value: 10, uses: 132, limit: 250, status: 'active', campaign: 'أسبوع الماتشا', ends: '30 نوفمبر' },
  { code: 'FREESHIP', type: 'shipping', value: 0, uses: 48, limit: 100, status: 'active', campaign: 'السلة المتروكة', ends: '15 ديسمبر' },
  { code: 'WINTER5', type: 'fixed', value: 5, uses: 0, limit: 500, status: 'scheduled', campaign: 'تشكيلة الشتاء', ends: '31 يناير' },
  { code: 'SUMMER20', type: 'percent', value: 20, uses: 218, limit: 218, status: 'expired', campaign: 'تخفيضات الصيف', ends: '31 أغسطس' },
]

export const chats = [
  {
    id: 'CH-1', channel: 'site', name: 'صوفيا مورينو', initials: 'صم', color: '#3d86ff', online: true, unread: 2, time: '2د',
    last: 'هل سيعود الماتشا للمخزون قريبًا؟',
    messages: [
      { from: 'them', text: 'مرحبًا! طلبت طقم الماتشا للتو — هل يمكنني إضافة خفاقة إلى نفس الطلب؟', time: '09:38' },
      { from: 'me', text: 'صباح الخير صوفيا! نعم، يمكننا إضافتها قبل الشحن. سأرسل رابط الدفع الآن.', time: '09:41' },
      { from: 'them', text: 'ممتاز، شكرًا! هل سيعود الماتشا للمخزون قريبًا؟', time: '09:43' },
      { from: 'them', text: 'وأيضًا، هل لديكم الأكواب الحجرية باللون الكريمي؟', time: '09:43' },
    ],
  },
  {
    id: 'CH-2', channel: 'instagram', name: 'جون هارت', initials: 'جه', color: '#ffab5e', online: false, unread: 1, time: '18د',
    last: 'أحببت الأولونغ — سأشاركه اليوم 🌿',
    messages: [
      { from: 'them', text: 'أحببت الأولونغ — سأشاركه اليوم 🌿', time: '09:22' },
      { from: 'them', text: 'هل لديكم كود إحالة لأصدقائي؟', time: '09:25' },
    ],
  },
  {
    id: 'CH-3', channel: 'sms', name: 'ميلو فريزر', initials: 'مف', color: '#ff7a85', online: true, unread: 0, time: '42د',
    last: 'وصلت الفاتورة، سأدفع بعد الظهر.',
    messages: [
      { from: 'them', text: 'وصلت الفاتورة، سأدفع بعد الظهر.', time: '08:57' },
      { from: 'me', text: 'لا عجلة إطلاقًا — طلب الجملة مُغلّف وجاهز.', time: '09:02' },
    ],
  },
  {
    id: 'CH-4', channel: 'site', name: 'آدا لين', initials: 'آل', color: '#44d19d', online: false, unread: 0, time: '1س',
    last: 'هل يمكن تغليف طقمين بشكل منفصل؟',
    messages: [
      { from: 'them', text: 'هل يمكن تغليف طقمين بشكل منفصل؟', time: '08:11' },
      { from: 'me', text: 'بالتأكيد. سيخرج كل طقم في حقيبته الكتانية مع بطاقة مكتوبة بخط اليد.', time: '08:19' },
    ],
  },
  {
    id: 'CH-5', channel: 'instagram', name: 'لينا أوكافور', initials: 'لأ', color: '#ef7ad8', online: false, unread: 0, time: '3س',
    last: 'الدورق يبدو جميلًا جدًا على الرف.',
    messages: [{ from: 'them', text: 'الدورق يبدو جميلًا جدًا على الرف.', time: '06:40' }],
  },
]

export const emails = [
  {
    id: 'EM-1', from: 'ميلو فريزر', initials: 'مف', color: '#ff7a85', subject: 'فاتورة الجملة INV-2041',
    preview: 'مرحبًا نور — هل يمكن تأجيل موعد الدفع إلى 18؟',
    body: 'مرحبًا نور،\n\nهل يمكن تأجيل موعد دفع الفاتورة INV-2041 إلى 18؟ فواتيرنا تصل يوم 15 والتوقيت ضيق قليلًا هذا الشهر.\n\nالهوجيتشا الجديد يُباع جيدًا بالمناسبة. نودّ 3 كغ أخرى قبل ديسمبر.\n\nشكرًا،\nميلو',
    time: '09:30', unread: true, starred: false, label: 'بالجملة',
  },
  {
    id: 'EM-2', from: 'مقهى أستر', initials: 'أك', color: '#9b7bff', subject: 'رد: طلب الجملة لشهر نوفمبر',
    preview: 'نؤكد 12 كغ ماتشا و40 كوبًا.',
    body: 'مرحبًا نور،\n\nنؤكد 12 كغ ماتشا و40 كوبًا حجريًا للأسبوع الأول من ديسمبر. نفس عنوان التوصيل السابق.\n\nهل يمكن إرفاق بطاقة صغيرة تحمل اسم المزرعة؟ زبائننا يحبون هذه التفصيلة.\n\nمقهى أستر',
    time: '08:54', unread: true, starred: true, label: 'بالجملة',
  },
  {
    id: 'EM-3', from: 'Stripe', initials: 'ST', color: '#6f86ff', subject: 'دفعة بقيمة 3,412.88$ في الطريق',
    preview: 'من المتوقع وصولها إلى حسابك يوم 23 نوفمبر.',
    body: 'دفعة بقيمة 3,412.88$ في الطريق إلى حسابك البنكي.\n\nالوصول المتوقع: 23 نوفمبر 2026\nوصف كشف الحساب: سيريل / كِلن آند ليف\n\nStripe',
    time: '07:12', unread: false, starred: false, label: 'المالية',
  },
  {
    id: 'EM-4', from: 'كاميل من Notion', initials: 'كن', color: '#b7c4d6', subject: 'ملخص مساحة عملك',
    preview: 'تغيّرت 3 صفحات في «المخزون والموردون» هذا الأسبوع.',
    body: 'إليك ما تغيّر في مساحة عملك هذا الأسبوع: المخزون والموردون، ملاحظات التغليف، وخطة الربع الأول. افتح Notion للمتابعة.',
    time: 'أمس', unread: false, starred: false, label: 'الفريق',
  },
  {
    id: 'EM-5', from: 'إينيس دوارتي', initials: 'إد', color: '#38c7d8', subject: 'كوب مكسور في طلبي',
    preview: 'أحد الكوبين وصل بشق شعري قرب المقبض.',
    body: 'مرحبًا نور،\n\nأحد الكوبين الحجريين وصل بشق شعري قرب المقبض. أرفقت صورة. هل يمكنكم إرسال بديل؟\n\nيسعدني الاحتفاظ بالباقي — الشاي نفسه رائع.\n\nإينيس',
    time: 'أمس', unread: false, starred: true, label: 'الدعم',
  },
  {
    id: 'EM-6', from: 'موردو كِلن آند ليف', initials: 'كم', color: '#44d19d', subject: 'الطلب المسبق لحصاد الربيع يفتح الجمعة',
    preview: 'احجز الشينشا قبل إغلاق التخصيص.',
    body: 'يفتح الطلب المسبق لحصاد الربيع يوم الجمعة. تخصيصك من العام الماضي نفد في ست ساعات، لذلك نحتفظ لك بـ 8 كغ شينشا حتى مساء الجمعة.',
    time: '20 نوفمبر', unread: false, starred: false, label: 'الموردون',
  },
]

export const apps = [
  { id: 'A-1', name: 'Instagram Shop', description: 'زامن المنتجات واسحب الرسائل المباشرة إلى المحادثات.', glyph: '◎', color: '#ef7ad8', connected: true, category: 'المبيعات' },
  { id: 'A-2', name: 'Stripe', description: 'المدفوعات والتحويلات والاستردادات في مكان واحد.', glyph: 'S', color: '#7d9cff', connected: true, category: 'المدفوعات' },
  { id: 'A-3', name: 'Klaviyo', description: 'مسارات بريد للترحيب واستعادة العملاء والإطلاق.', glyph: 'K', color: '#ffcf5c', connected: true, category: 'التسويق' },
  { id: 'A-4', name: 'Royal Mail', description: 'اطبع الملصقات وتابع الشحنات تلقائيًا.', glyph: 'R', color: '#ff7a85', connected: true, category: 'الشحن' },
  { id: 'A-5', name: 'Xero', description: 'أرسل الفواتير والمصروفات إلى دفاترك.', glyph: 'X', color: '#38c7d8', connected: false, category: 'المالية' },
  { id: 'A-6', name: 'Google Analytics', description: 'اعرف من أين يأتي الزوار قبل الدفع.', glyph: 'G', color: '#ffab5e', connected: true, category: 'التحليلات' },
  { id: 'A-7', name: 'Notion', description: 'احتفظ بملاحظات التوريد والإجراءات بجوار المتجر.', glyph: 'N', color: '#b7c4d6', connected: false, category: 'الفريق' },
  { id: 'A-8', name: 'Slack', description: 'أرسل الطلبات الجديدة وتنبيهات المخزون إلى قناة.', glyph: '#', color: '#9b7bff', connected: false, category: 'الفريق' },
]

export const expenses = [
  { id: 'EX-01', vendor: 'مجمّع أوجي للشاي', category: 'المخزون', date: '20 نوفمبر', amount: 1840, status: 'paid' },
  { id: 'EX-02', vendor: 'نورثفيلد للسيراميك', category: 'المخزون', date: '18 نوفمبر', amount: 960, status: 'paid' },
  { id: 'EX-03', vendor: 'Royal Mail', category: 'الشحن', date: '17 نوفمبر', amount: 412.6, status: 'paid' },
  { id: 'EX-04', vendor: 'إيجار الاستوديو', category: 'التشغيل', date: '15 نوفمبر', amount: 1250, status: 'paid' },
  { id: 'EX-05', vendor: 'Klaviyo', category: 'البرمجيات', date: '12 نوفمبر', amount: 68, status: 'paid' },
  { id: 'EX-06', vendor: 'شركة التغليف', category: 'التغليف', date: '10 نوفمبر', amount: 286.4, status: 'due' },
  { id: 'EX-07', vendor: 'إعلانات ميتا', category: 'التسويق', date: '08 نوفمبر', amount: 520, status: 'paid' },
]

export const payouts = [
  { id: 'PO-8821', date: '23 نوفمبر', amount: 3412.88, method: 'سترايب · •••• 4412', status: 'scheduled' },
  { id: 'PO-8820', date: '16 نوفمبر', amount: 2986.4, method: 'سترايب · •••• 4412', status: 'paid' },
  { id: 'PO-8819', date: '09 نوفمبر', amount: 3140.12, method: 'سترايب · •••• 4412', status: 'paid' },
  { id: 'PO-8818', date: '02 نوفمبر', amount: 2648.9, method: 'سترايب · •••• 4412', status: 'paid' },
]

export const notifications = [
  { id: 'N-1', title: 'مخزون منخفض: إيرل غراي بالبرغموت', detail: '0 متبقٍ · حد إعادة الطلب 40', time: '12د', tone: 'warn' },
  { id: 'N-2', title: 'دفعت فاتورة جملة جديدة', detail: 'مقهى أستر · 2,140.00$', time: '48د', tone: 'good' },
  { id: 'N-3', title: 'رسالتان جديدتان في المتجر', detail: 'صوفيا وجون بانتظار الرد', time: '2س', tone: 'info' },
  { id: 'N-4', title: 'هدف نوفمبر تجاوز 103%', detail: 'تجاوزت 24 ألف دولار — عمل رائع', time: '5س', tone: 'good' },
]

export const faqs = [
  { q: 'كيف أربط متجري الخاص؟', a: 'افتح الإعدادات ← واجهة المتجر، وألصق رابط الـ API والرمز. يحتفظ سيريل بالبيانات التجريبية حتى ينجح اختبار الاتصال، لتستكشف بأمان.' },
  { q: 'أين تُحفظ البيانات التجريبية؟', a: 'بالكامل في ذاكرة المتصفح المحلية تحت cirrel:state:v2. مسح بيانات الموقع يعيد العرض الأصلي، ولا يغادر أي شيء هذا الجهاز.' },
  { q: 'كيف تعمل الاستردادات والمرتجعات؟', a: 'انقل الطلب إلى «مرتجع» من صفحة الطلبات. يُضاف المبلغ إلى إجمالي المرتجعات ويظهر تلقائيًا في ملف العميل.' },
  { q: 'هل يمكنني تغيير هدف الشهر؟', a: 'نعم — أيقونة القلم في بطاقة هدف نوفمبر تفتح محررًا صغيرًا. تتحدث الحلقة والوتيرة والتوقع فورًا.' },
  { q: 'هل تحفظ لوحة التغليف سحبي للبطاقات؟', a: 'كل بطاقة تحركها تُحفظ في التخزين المحلي مباشرة. أعد تحميل الصفحة وستجد اللوحة كما تركتها تمامًا.' },
  { q: 'هل هناك اختصار للبحث؟', a: 'اضغط Cmd+K أو Ctrl+K في أي مكان، واكتب اسم صفحة أو طلب أو منتج أو عميل ثم Enter.' },
]

export const analytics = {
  visitors: [820, 940, 880, 1120, 1040, 1320, 1190, 760, 980, 1210, 1380, 1290, 910, 1080, 1460, 1330, 1160, 1390, 1620, 1480, 1210, 1420, 1710, 1500, 1580, 1390, 1740, 1610, 1860, 1650],
  funnel: [
    { label: 'زيارات المتجر', value: 48210, color: '#3d86ff' },
    { label: 'مشاهدات المنتج', value: 22460, color: '#54a0ff' },
    { label: 'أُضيف إلى السلة', value: 6820, color: '#7d9cff' },
    { label: 'وصل إلى الدفع', value: 2940, color: '#9b7bff' },
    { label: 'تم الشراء', value: 1208, color: '#44d19d' },
  ],
  collections: [
    { label: 'الشاي', value: 12240, color: '#3d86ff' },
    { label: 'الخزف', value: 6280, color: '#44d19d' },
    { label: 'الأطقم', value: 3840, color: '#ffab5e' },
    { label: 'الأدوات', value: 1980, color: '#9b7bff' },
    { label: 'مستلزمات', value: 960, color: '#ef7ad8' },
  ],
  devices: [
    { label: 'الجوال', value: 62, color: '#3d86ff' },
    { label: 'سطح المكتب', value: 31, color: '#44d19d' },
    { label: 'الجهاز اللوحي', value: 7, color: '#ffab5e' },
  ],
}

export const reviews = [
  { id: 'R-1', customer: 'آدا لين', initials: 'آل', color: '#44d19d', rating: 5, product: 'طقم هدايا رقم 3', date: '02 نوفمبر', text: 'اشتريت طقم الهدايا لأمي. التغليف رائع.' },
  { id: 'R-2', customer: 'إينيس دوارتي', initials: 'إد', color: '#38c7d8', rating: 5, product: 'سينشا أسا', date: '18 نوفمبر', text: 'وصل في يومين وطعمه كالربيع.' },
  { id: 'R-3', customer: 'مايا روسي', initials: 'مر', color: '#ff9d6e', rating: 5, product: 'طقم هدايا رقم 3', date: '05 نوفمبر', text: 'زبائن المقهى يطلبون هذه الماتشا بالاسم.' },
  { id: 'R-4', customer: 'جون هارت', initials: 'جه', color: '#ffab5e', rating: 4, product: 'أولونغ بالحليب', date: '28 أكتوبر', text: 'الأولونغ جميل، لكن أتمنى لو كانت العلبة أكبر.' },
  { id: 'R-5', customer: 'إيلينا بتروفا', initials: 'إب', color: '#8fb8ff', rating: 4, product: 'إيرل غراي بالبرغموت', date: '20 نوفمبر', text: 'البرغموت لطيف، وخفيف قليلًا على ذوقي.' },
  { id: 'R-6', customer: 'صوفيا مورينو', initials: 'صم', color: '#3d86ff', rating: 5, product: 'ماتشا احتفالية', date: '12 نوفمبر', text: 'ناعمة بشكل لا يصدق. أصبحت طقس يوم الأحد.' },
]

export const settingsDefaults = {
  storeName: 'كِلن آند ليف',
  owner: 'نور حداد',
  email: 'noor@kilnandleaf.co',
  currency: 'USD',
  timezone: 'Europe/Lisbon',
  lowStock: 15,
  ordersEmail: true,
  stockEmail: true,
  weeklyDigest: false,
  autoArchive: true,
  compactRows: false,
}

export const recentActivity = [
  { who: 'نور', action: 'نقل KL-49540 إلى مُغلّف', time: '6د' },
  { who: 'مقهى أستر', action: 'دفع INV-2046', time: '24د' },
  { who: 'النظام', action: 'نبّه إلى نفاد إيرل غراي', time: '38د' },
  { who: 'نور', action: 'أنشأ كود WINTER5', time: '2س' },
]
