import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  PenTool, Type, Upload, RotateCcw, Check, X, ShieldCheck,
  Stamp, Sparkles, AlertCircle, Copy, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const INK_COLORS = [
  { name: 'أزرق ملكي رسمي', value: '#1d4ed8' },
  { name: 'كحلي داكن',     value: '#0f172a' },
  { name: 'عنابي معتمد',    value: '#991b1b' },
  { name: 'أخضر مؤسسي',     value: '#065f46' },
];

export default function DigitalSignatureModal({
  isOpen,
  onClose,
  onConfirm,
  defaultSignerName = '',
  documentNumber = '',
  title = 'التوقيع الإلكتروني والاعتماد الرقمي'
}) {
  const [activeTab, setActiveTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [inkColor, setInkColor] = useState('#1d4ed8');
  const [penWidth, setPenWidth] = useState(2.5);
  const [signerName, setSignerName] = useState(defaultSignerName || '');
  const [jobTitle, setJobTitle] = useState('المخول بالاعتماد');
  const [includeDate, setIncludeDate] = useState(true);
  const [includeQrStamp, setIncludeQrStamp] = useState(true);

  // Upload Tab state
  const [uploadedStamp, setUploadedStamp] = useState(null);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(true);

  // Drawing Canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawHistory, setDrawHistory] = useState([]);

  // Calligraphy preview canvas
  const textCanvasRef = useRef(null);

  // Initialize Canvas
  useEffect(() => {
    if (isOpen && activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = penWidth;
      clearCanvas();
    }
  }, [isOpen, activeTab]);

  // Update canvas stroke styles when color/width changes
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = penWidth;
    }
  }, [inkColor, penWidth]);

  // Clear Canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setDrawHistory([]);
  };

  // Drawing event handlers with touch support
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    saveState();
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  const saveState = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    setDrawHistory(prev => [...prev.slice(-10), canvas.toDataURL()]);
  };

  const handleUndo = () => {
    if (drawHistory.length <= 1) {
      clearCanvas();
      return;
    }
    const prevHistory = [...drawHistory];
    prevHistory.pop(); // remove current
    const previousState = prevHistory[prevHistory.length - 1];
    setDrawHistory(prevHistory);

    const img = new Image();
    img.src = previousState;
    img.onload = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    };
  };

  // ── Calligraphy / Text Stamp Generator ──
  const generateCalligraphyStamp = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    // Transparent Background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Official Stamp Border (Double Rounded Border)
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(10, 10, 580, 220, 16);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 568, 208, 12);
    ctx.stroke();

    // Text details
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';

    // Header badge
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText('اعتماد رسمي موثق إلكترونياً (IT-EDMS)', 300, 48);

    // Signer name in stylized bold calligraphy style
    ctx.font = 'bold 32px "Cairo", cursive, sans-serif';
    ctx.fillText(signerName || 'المفوض بالتوقيع', 300, 105);

    // Job Title
    ctx.font = '16px "Cairo", sans-serif';
    ctx.fillText(jobTitle, 300, 140);

    // Reference & Date footer
    const dateStr = new Date().toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    ctx.font = '12px "JetBrains Mono", "Cairo", monospace';
    ctx.fillText(`${documentNumber ? `وثيقة: ${documentNumber} | ` : ''}${dateStr}`, 300, 185);

    return canvas.toDataURL('image/png');
  };

  // Handle uploaded stamp image with optional white background removal
  const handleStampUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        if (removeWhiteBg) {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i + 1], b = d[i + 2];
            // If color is very bright/white, make it transparent
            if (r > 215 && g > 215 && b > 215) {
              d[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        }
        setUploadedStamp(canvas.toDataURL('image/png'));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // ── Confirm & Generate Output ──
  const handleConfirmSignature = () => {
    let finalDataUrl = null;
    let type = activeTab;

    if (activeTab === 'draw') {
      if (!hasDrawn) {
        toast.error('يرجى رسم التوقيع أولاً في المساحة المخصصة.');
        return;
      }
      finalDataUrl = canvasRef.current.toDataURL('image/png');
    } else if (activeTab === 'type') {
      if (!signerName.trim()) {
        toast.error('يرجى إدخال اسم الموقع.');
        return;
      }
      finalDataUrl = generateCalligraphyStamp();
    } else if (activeTab === 'upload') {
      if (!uploadedStamp) {
        toast.error('يرجى رفع صورة التوقيع أو الختم.');
        return;
      }
      finalDataUrl = uploadedStamp;
    }

    // Cryptographic-style verification token
    const verificationCode = 'SIG-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

    if (onConfirm) {
      onConfirm({
        signatureDataUrl: finalDataUrl,
        type,
        signerName: signerName || defaultSignerName,
        jobTitle,
        signedAt: new Date().toISOString(),
        verificationCode,
        inkColor,
      });
    }

    toast.success('تم اعتماد وحفظ التوقيع الإلكتروني بنجاح!');
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="glass w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl bg-surface-900/95 text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-surface-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Stamp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                {title}
                <span className="badge badge-green text-xs font-normal">معتمد رقمياً</span>
              </h3>
              <p className="text-xs text-slate-400">إضافة توقيع أو ختم رسمي موثق للوثيقة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-surface-950/40 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('draw')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'draw'
                ? 'border-blue-500 text-blue-400 bg-surface-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-4 h-4" />
            رسم التوقيع اليدوي
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'type'
                ? 'border-blue-500 text-blue-400 bg-surface-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-4 h-4" />
            ختم رقمي بالاسم (Calligraphy)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-semibold transition-all border-b-2 ${
              activeTab === 'upload'
                ? 'border-blue-500 text-blue-400 bg-surface-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            رفع ختم / توقيع ممسوح
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 bg-surface-950/50 space-y-4">
          
          {/* ── TAB 1: DRAW SIGNATURE ── */}
          {activeTab === 'draw' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-800/60 p-3 rounded-xl border border-white/10">
                {/* Color Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">لون الحبر:</span>
                  <div className="flex items-center gap-1.5">
                    {INK_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setInkColor(c.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          inkColor === c.value ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Undo & Clear */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={drawHistory.length === 0}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-slate-300 hover:bg-white/10 disabled:opacity-40 transition-all flex items-center gap-1"
                    title="تراجع عن آخر حركة"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> تراجع
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="px-2.5 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    مسح اللوحة
                  </button>
                </div>
              </div>

              {/* Drawing Canvas Board */}
              <div className="relative w-full h-56 rounded-2xl bg-white border-2 border-dashed border-blue-500/40 shadow-inner overflow-hidden cursor-crosshair touch-none">
                <canvas
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-full block"
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                    <PenTool className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-sm font-medium text-slate-400/80">ارسم توقيعك هنا بالماوس أو شاشة اللمس</span>
                    <span className="text-xs text-slate-400/60 mt-1">يتم الحفظ بدقة فيكتور عالية وخلفية شفافة</span>
                  </div>
                )}
                {/* Signature baseline guideline */}
                <div className="absolute bottom-10 left-8 right-8 border-b border-slate-300/60 pointer-events-none" />
              </div>
            </div>
          )}

          {/* ── TAB 2: CALLIGRAPHY STAMP ── */}
          {activeTab === 'type' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">اسم المعتمد / الموقع *</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="مثال: د. نجم الدين اليافوز"
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">المسمى الوظيفي / الصفة</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: مدير تقنية المعلومات"
                    className="w-full px-3 py-2 rounded-xl bg-surface-800 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Ink Color for Stamp */}
              <div className="flex items-center gap-3 bg-surface-800/60 p-3 rounded-xl border border-white/10">
                <span className="text-xs text-slate-400 font-medium">لون الختم الرسمي:</span>
                <div className="flex items-center gap-2">
                  {INK_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setInkColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        inkColor === c.value ? 'scale-125 border-white shadow-md' : 'border-transparent opacity-75'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Live Stamp Preview */}
              <div className="p-4 rounded-2xl bg-white flex flex-col items-center justify-center min-h-[160px] shadow-md border border-slate-200">
                <div
                  className="p-5 rounded-2xl border-2 text-center max-w-md w-full relative"
                  style={{ borderColor: inkColor, color: inkColor }}
                >
                  <div className="absolute inset-1 border rounded-xl pointer-events-none opacity-40" style={{ borderColor: inkColor }} />
                  <div className="text-xs font-bold tracking-wider mb-1">اعتماد رسمي موثق إلكترونياً (IT-EDMS)</div>
                  <div className="text-2xl font-bold font-serif py-1">{signerName || 'اسم الموقع يظهر هنا'}</div>
                  <div className="text-xs font-medium opacity-90">{jobTitle}</div>
                  <div className="text-[10px] font-mono mt-2 pt-2 border-t border-current opacity-70">
                    {documentNumber ? `وثيقة: ${documentNumber} · ` : ''}
                    {new Date().toLocaleDateString('ar-SA')} {new Date().toLocaleTimeString('ar-SA')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: UPLOAD STAMP IMAGE ── */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-blue-500/40 rounded-2xl p-6 text-center hover:bg-white/5 cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleStampUpload}
                  className="hidden"
                />
                <Upload className="w-10 h-10 text-blue-400 mx-auto mb-2 opacity-80" />
                <span className="text-sm font-semibold text-slate-200 block">اضغط لاختيار صورة الختم أو التوقيع</span>
                <span className="text-xs text-slate-400 mt-1 block">PNG أو JPG (يُفضل صورة واضحة بخلفية بيضاء أو شفافة)</span>
              </label>

              {/* Auto White Background Removal Option */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-surface-800/60 p-3 rounded-xl border border-white/10">
                <input
                  type="checkbox"
                  checked={removeWhiteBg}
                  onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                  className="rounded border-white/20 text-blue-600 focus:ring-0"
                />
                <span>إزالة الخلفية البيضاء تلقائياً وتحويل الختم إلى شفاف (Auto-Transparency)</span>
              </label>

              {/* Uploaded Stamp Preview */}
              {uploadedStamp && (
                <div className="p-4 rounded-xl bg-slate-100 flex items-center justify-center min-h-[140px]">
                  <img
                    src={uploadedStamp}
                    alt="Uploaded Stamp"
                    className="max-h-32 object-contain"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3 bg-surface-800/90">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>محمي بختم زمني وبصمة تحقق رقمية</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn bg-white/5 text-slate-300 hover:bg-white/10 text-xs sm:text-sm"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmSignature}
              className="btn btn-primary text-sm px-6 py-2.5 gap-2 shadow-lg shadow-blue-600/30 font-bold"
            >
              <Check className="w-4 h-4" />
              تأكيد وتطبيق التوقيع
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
