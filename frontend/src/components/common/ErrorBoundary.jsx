import React from 'react';
import { AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 animate-fade-in" style={{ direction: 'rtl' }}>
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">عذراً، حدث خطأ غير متوقع أثناء عرض هذه الصفحة</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              تم تسجيل الخطأ البرمجي وسنعمل على معالجته فوراً. يمكنك الرجوع للصفحة السابقة أو إعادة تحميل الصفحة.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.href = '/documents'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <ArrowRight className="w-4 h-4" />
                العودة للوثائق
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/20"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
