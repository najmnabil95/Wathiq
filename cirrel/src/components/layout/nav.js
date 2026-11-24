export const navGroups = [
  {
    label: 'المتجر',
    items: [
      { to: '/', label: 'لوحة التحكم', icon: 'dashboard', end: true },
      { to: '/orders', label: 'الطلبات', icon: 'bag', badge: 'orders' },
      { to: '/products', label: 'المنتجات', icon: 'box', badge: 'stock' },
      { to: '/analytics', label: 'التحليلات', icon: 'chart' },
      { to: '/customers', label: 'العملاء', icon: 'users' },
    ],
  },
  {
    label: 'المال',
    items: [
      { to: '/finances', label: 'المالية', icon: 'wallet' },
      { to: '/invoices', label: 'الفواتير', icon: 'file' },
      { to: '/discounts', label: 'الخصومات', icon: 'tag' },
    ],
  },
  {
    label: 'التواصل',
    items: [
      { to: '/chats', label: 'المحادثات', icon: 'chat', badge: 'chats' },
      { to: '/email', label: 'البريد', icon: 'mail', badge: 'email' },
      { to: '/apps', label: 'التطبيقات', icon: 'grid' },
    ],
  },
]

export const utilItems = [
  { to: '/settings', label: 'الإعدادات', icon: 'settings' },
  { to: '/help', label: 'مركز المساعدة', icon: 'help' },
]

export const pageMeta = {
  '/': { title: 'لوحة التحكم', crumb: 'لوحة التحكم' },
  '/orders': { title: 'الطلبات', crumb: 'الطلبات' },
  '/products': { title: 'المنتجات', crumb: 'المنتجات' },
  '/analytics': { title: 'التحليلات', crumb: 'التحليلات' },
  '/customers': { title: 'العملاء', crumb: 'العملاء' },
  '/finances': { title: 'المالية', crumb: 'المالية' },
  '/invoices': { title: 'الفواتير', crumb: 'الفواتير' },
  '/discounts': { title: 'الخصومات', crumb: 'الخصومات' },
  '/chats': { title: 'المحادثات', crumb: 'المحادثات' },
  '/email': { title: 'البريد', crumb: 'البريد' },
  '/apps': { title: 'التطبيقات', crumb: 'التطبيقات' },
  '/settings': { title: 'الإعدادات', crumb: 'الإعدادات' },
  '/help': { title: 'مركز المساعدة', crumb: 'مركز المساعدة' },
}

export const allPages = [
  { to: '/', label: 'لوحة التحكم', icon: 'dashboard', hint: 'النظرة العامة والهدف والمتجر المباشر' },
  { to: '/orders', label: 'الطلبات', icon: 'bag', hint: 'لوحة التغليف والمرتجعات وCSV' },
  { to: '/products', label: 'المنتجات', icon: 'box', hint: 'الكتالوج والمخزون والتصنيفات' },
  { to: '/analytics', label: 'التحليلات', icon: 'chart', hint: 'المبيعات والزوار وقمع الدفع' },
  { to: '/customers', label: 'العملاء', icon: 'users', hint: 'الملفات والشرائح والتقييمات' },
  { to: '/finances', label: 'المالية', icon: 'wallet', hint: 'الأرباح والمدفوعات والمصروفات' },
  { to: '/invoices', label: 'الفواتير', icon: 'file', hint: 'أرسل وتابع وعلّم كمدفوعة' },
  { to: '/discounts', label: 'الخصومات', icon: 'tag', hint: 'الأكواد والحملات' },
  { to: '/chats', label: 'المحادثات', icon: 'chat', hint: 'الموقع وإنستغرام والرسائل' },
  { to: '/email', label: 'البريد', icon: 'mail', hint: 'الوارد والردود' },
  { to: '/apps', label: 'التطبيقات', icon: 'grid', hint: 'التكاملات' },
  { to: '/settings', label: 'الإعدادات', icon: 'settings', hint: 'المتجر والتنبيهات والمظهر' },
  { to: '/help', label: 'مركز المساعدة', icon: 'help', hint: 'الأسئلة الشائعة والتذاكر' },
]
