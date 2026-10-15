import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  User, Mail, Phone, Shield, Building2, KeyRound,
  CheckCircle2, AlertCircle, Save, Eye, EyeOff, Sparkles,
  Calendar, Lock, BadgeCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuthStore();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [employeeNumber, setEmployeeNumber] = useState(user?.employee_number || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('الرجاء إدخال الاسم الكامل');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        employee_number: employeeNumber.trim() || null,
      });
      toast.success('تم حفظ التغييرات على الملف الشخصي بنجاح');
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تحديث البيانات. يرجى المحاولة لاحقاً.';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('الرجاء إدخال كلمة المرور الحالية');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('يجب أن تكون كلمة المرور الجديدة 8 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      toast.success('تم تحديث كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.errors?.current_password?.[0]
        || err.response?.data?.message
        || 'فشل تغيير كلمة المرور';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0c1427] p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">الملف الشخصي والحساب</h1>
          </div>
          <p className="text-xs text-slate-400">
            إدارة بياناتك الشخصية، كلمة المرور، واستعراض الصلاحيات الممنوحة لك في نظام وثيق
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            حساب نشط
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Summary Card (Left/Col 1) */}
        <div className="space-y-6">
          <div className="bg-[#0c1427] rounded-2xl border border-slate-800 p-6 shadow-xl text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-500/25 mx-auto">
                {user?.name?.[0] || 'م'}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#070d1a] border border-slate-700 rounded-xl text-blue-400 shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">{user?.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5 dir-ltr text-center">@{user?.username || 'user'}</p>
            </div>

            <div className="pt-2 border-t border-slate-800 flex flex-wrap justify-center gap-1.5">
              {user?.roles?.map((role) => (
                <span
                  key={role.id || role.name}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/15 text-blue-300 border border-blue-500/25"
                >
                  {role.display_name_ar || role.display_name || role.name}
                </span>
              ))}
              {user?.is_super_admin && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/25">
                  مدير أعلى للنظام
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3 text-xs text-right">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  البريد الإلكتروني:
                </span>
                <span className="text-slate-200 font-mono text-[11px] truncate max-w-[160px]">{user?.email}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  القسم التابع له:
                </span>
                <span className="text-slate-200">{user?.department?.name_ar || user?.department?.name || 'غير محدد'}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  آخر تسجيل دخول:
                </span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {user?.last_login_at ? new Date(user.last_login_at).toLocaleDateString('ar-SA') : 'اليوم'}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions Overview Card */}
          <div className="bg-[#0c1427] rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              ملخص الصلاحيات
            </h3>
            <p className="text-xs text-slate-400">
              يمتلك حسابك <span className="text-blue-400 font-bold font-mono">{user?.permissions?.length || 0}</span> صلاحية تشغيلية فعالة في النظام.
            </p>
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1.5 pt-1">
              {user?.permissions?.slice(0, 10).map((perm, idx) => (
                <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-300 bg-[#070d1a] px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-300">{perm}</span>
                </div>
              ))}
              {(user?.permissions?.length || 0) > 10 && (
                <div className="text-center text-[10px] text-slate-500 pt-1">
                  + {(user?.permissions?.length || 0) - 10} صلاحيات أخرى
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Profile & Password Cards (Cols 2-3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile Form */}
          <form onSubmit={handleUpdateProfile} className="bg-[#0c1427] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                المعلومات الشخصية
              </h2>
              <span className="text-xs text-slate-500">تعديل الاسم وبيانات الاتصال</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الاسم الكامل <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-[#070d1a]/60 border border-slate-800/80 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">يتم تعديل البريد من قبل مدير النظام فقط</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الهاتف / الجوال
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الرقم الوظيفي (Employee Number)
                </label>
                <input
                  type="text"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition font-mono"
                  placeholder="EMP-001"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/60">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingProfile ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handleChangePassword} className="bg-[#0c1427] rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                تغيير كلمة المرور
              </h2>
              <span className="text-xs text-slate-500">حماية وتأمين الحساب</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كلمة المرور الحالية <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    كلمة المرور الجديدة <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                      placeholder="8 أحرف كحد أدنى"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    تأكيد كلمة المرور الجديدة <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition"
                      placeholder="إعادة إدخال كلمة المرور"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800/60">
              <button
                type="submit"
                disabled={savingPassword}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-lg shadow-amber-600/25 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
