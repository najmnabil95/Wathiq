import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // ── Login ───────────────────────────────────────────────
      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true, error: null });
        try {
          const res = await authAPI.login({ email, password, remember_me: rememberMe });
          const { token, user } = res.data.data;

          localStorage.setItem('edms_token', token);
          localStorage.setItem('edms_user', JSON.stringify(user));

          set({ user, token, isLoading: false, error: null });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'فشل تسجيل الدخول. تحقق من بياناتك.';
          const errors = err.response?.data?.errors || null;
          set({ isLoading: false, error: msg });
          return { success: false, message: msg, errors };
        }
      },

      // ── Logout ─────────────────────────────────────────────
      logout: async () => {
        try { await authAPI.logout(); } catch (_) {}
        localStorage.removeItem('edms_token');
        localStorage.removeItem('edms_user');
        set({ user: null, token: null });
      },

      // ── Fetch Me ───────────────────────────────────────────
      fetchMe: async () => {
        try {
          const res = await authAPI.me();
          set({ user: res.data.data });
        } catch (_) {
          get().logout();
        }
      },

      // ── RBAC Helpers ───────────────────────────────────────
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.is_super_admin) return true;
        return user.permissions?.includes(permission) ?? false;
      },

      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return user.roles?.some(r => r.name === role) ?? false;
      },

      isAuthenticated: () => {
        return !!(get().token && get().user);
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'edms-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
