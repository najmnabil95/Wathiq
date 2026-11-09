import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, X, RefreshCw, Check, RotateCw, Sliders, Image as ImageIcon,
  Zap, ZapOff, Sparkles, AlertCircle, FileText, Download, Scissors
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DocumentScannerModal({
  isOpen,
  onClose,
  onCapture,
  documentTitle = 'مستند جديد'
}) {
  const [stream, setStream] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);
  const [cameraError, setCameraError] = useState(null);
  const [cameraErrorCode, setCameraErrorCode] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Captured snapshot state
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [filterMode, setFilterMode] = useState('bw'); // 'original' | 'bw' | 'grayscale' | 'enhanced'
  const [rotation, setRotation] = useState(0);
  const [isProcessingFilter, setIsProcessingFilter] = useState(false);

  // Quick Client OCR state
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [extractedOcrText, setExtractedOcrText] = useState('');
  const [showOcrBox, setShowOcrBox] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Initialize Camera Stream ──
  const startCamera = useCallback(async (facing = 'environment') => {
    try {
      setCameraError(null);
      setCameraErrorCode(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        setCameraErrorCode('InsecureContext');
        setCameraError('المتصفح يمنع الكاميرا لأن الاتصال غير موثوق. افتح النظام عبر HTTPS بشهادة صالحة، أو اختر صورة من جهازك.');
        return;
      }

      // Check available media devices
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const videoDevices = devices?.filter(d => d.kind === 'videoinput') || [];
      setCameras(videoDevices);

      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      // Check for torch capability
      const track = newStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? track.getCapabilities() : {};
      setHasTorch(Boolean(capabilities.torch));
      setTorchOn(false);
    } catch (err) {
      console.warn('Camera access issue:', err);
      setCameraErrorCode(err.name || 'UnknownError');
      const messages = {
        NotAllowedError: 'تم رفض إذن الوصول إلى الكاميرا. اسمح بالكاميرا لهذا الموقع من إعدادات المتصفح ثم أعد المحاولة، أو اختر صورة من جهازك.',
        PermissionDeniedError: 'تم رفض إذن الوصول إلى الكاميرا. اسمح بالكاميرا لهذا الموقع من إعدادات المتصفح، أو اختر صورة من جهازك.',
        NotFoundError: 'لا توجد كاميرا متاحة على هذا الجهاز. وصّل كاميرا خارجية أو اختر صورة من جهازك.',
        DevicesNotFoundError: 'لا توجد كاميرا متاحة على هذا الجهاز. وصّل كاميرا خارجية أو اختر صورة من جهازك.',
        NotReadableError: 'الكاميرا مستخدمة حالياً من تطبيق آخر أو أوقفها النظام. أغلق التطبيقات التي تستخدم الكاميرا ثم أعد المحاولة.',
        TrackStartError: 'الكاميرا مستخدمة حالياً من تطبيق آخر أو أوقفها النظام. أغلق التطبيقات التي تستخدم الكاميرا ثم أعد المحاولة.',
        AbortError: 'توقف تشغيل الكاميرا. أعد المحاولة بعد لحظات.',
        OverconstrainedError: 'إعدادات الكاميرا المطلوبة غير مدعومة على هذا الجهاز.',
        SecurityError: 'منع المتصفح الوصول إلى الكاميرا لأسباب أمنية (اتصال غير موثوق أو سياسة جهاز).',
      };
      setCameraError(messages[err.name] || `تعذر تشغيل الكاميرا المباشرة على هذا الجهاز (${err.name}). يمكنك اختيار صورة من جهازك.`);
    }
  }, [stream]);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Attach the stream once the <video> is mounted (e.g. after a successful retry)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraError]);

  // Clean stream on unmount or when captured image is set
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Switch Camera
  const handleSwitchCamera = () => {
    if (cameras.length > 1) {
      const nextIndex = (activeCameraIndex + 1) % cameras.length;
      setActiveCameraIndex(nextIndex);
      const nextDeviceId = cameras[nextIndex].deviceId;
      navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: nextDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      }).then(newStream => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        setStream(newStream);
        if (videoRef.current) videoRef.current.srcObject = newStream;
      }).catch(() => startCamera('user'));
    } else {
      startCamera(activeCameraIndex === 0 ? 'user' : 'environment');
      setActiveCameraIndex(prev => (prev === 0 ? 1 : 0));
    }
  };

  // Toggle Torch/Flash
  const handleToggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        await track.applyConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.error('Torch error:', err);
      }
    }
  };

  // Capture frame from video
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopStream();
    setCapturedImage(dataUrl);
    setRotation(0);
    applyFilter(dataUrl, 'bw', 0);
    setIsCapturing(false);
  };

  // File fallback upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      stopStream();
      setCapturedImage(dataUrl);
      setRotation(0);
      applyFilter(dataUrl, 'bw', 0);
    };
    reader.readAsDataURL(file);
  };

  // Apply Document Image Processing Filters (B&W Threshold, Grayscale, Contrast Enhancement)
  const applyFilter = (sourceUrl, filter, rotDeg) => {
    setIsProcessingFilter(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const isRotated = rotDeg % 180 !== 0;
      canvas.width = isRotated ? img.height : img.width;
      canvas.height = isRotated ? img.width : img.height;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotDeg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      if (filter === 'original') {
        setProcessedImage(canvas.toDataURL('image/jpeg', 0.92));
        setIsProcessingFilter(false);
        return;
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      if (filter === 'grayscale') {
        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        }
      } else if (filter === 'enhanced') {
        // High contrast document enhancement
        const contrast = 1.35;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.min(255, Math.max(0, factor * (d[i] - 128) + 128));
          d[i + 1] = Math.min(255, Math.max(0, factor * (d[i + 1] - 128) + 128));
          d[i + 2] = Math.min(255, Math.max(0, factor * (d[i + 2] - 128) + 128));
        }
      } else if (filter === 'bw') {
        // High quality adaptive threshold approximation for crisp paper text
        let sum = 0;
        const total = d.length / 4;
        for (let i = 0; i < d.length; i += 4) {
          sum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
        }
        const avg = sum / total;
        const threshold = Math.max(100, Math.min(160, avg * 0.92));

        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const val = gray > threshold ? 255 : 0;
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/jpeg', 0.92));
      setIsProcessingFilter(false);
    };
    img.src = sourceUrl;
  };

  const handleFilterChange = (filter) => {
    setFilterMode(filter);
    if (capturedImage) {
      applyFilter(capturedImage, filter, rotation);
    }
  };

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (capturedImage) {
      applyFilter(capturedImage, filterMode, nextRot);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setProcessedImage(null);
    setExtractedOcrText('');
    setShowOcrBox(false);
    startCamera();
  };

  // Convert Base64 dataURL to standard File object
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Complete and emit scanned file
  const handleConfirmScan = () => {
    if (!processedImage) {
      toast.error('لا توجد صورة ممسوحة ضوئياً.');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `scanned_doc_${timestamp}.jpg`;
    const file = dataURLtoFile(processedImage, fileName);

    if (onCapture) {
      onCapture(file, {
        previewUrl: processedImage,
        ocrText: extractedOcrText || null,
        filterMode,
      });
    }
    toast.success('تم مسح المستند وتجهيزه بنجاح!');
    handleClose();
  };

  const handleClose = () => {
    stopStream();
    setCapturedImage(null);
    setProcessedImage(null);
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="glass w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl bg-surface-900/95 text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-surface-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                الماسح الضوئي الذكي للمستندات
                <span className="badge badge-blue text-xs font-normal">HD Scanner</span>
              </h3>
              <p className="text-xs text-slate-400">التقاط المستندات الورقية ومعالجتها بفلاتر الأرشفة الرقمية</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[380px] bg-surface-950/50">
          
          {/* ── View 1: Live Camera Stream ── */}
          {!capturedImage && (
            <div className="relative w-full max-w-2xl aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed border-blue-500/40 bg-black flex items-center justify-center shadow-inner group">
              {cameraError ? (
                <div className="text-center p-6 max-w-md">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-sm text-slate-300 mb-1">{cameraError}</p>
                  {cameraErrorCode && (
                    <p className="text-[10px] text-slate-500 mb-4" dir="ltr">{cameraErrorCode}</p>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => startCamera()}
                      className="btn btn-secondary text-sm gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      إعادة المحاولة
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn btn-primary text-sm gap-2"
                    >
                      <ImageIcon className="w-4 h-4" />
                      اختيار صورة من الجهاز
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Document Alignment Frame Overlay */}
                  <div className="absolute inset-6 sm:inset-10 border-2 border-emerald-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1" />
                      <div className="w-6 h-6 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1" />
                    </div>
                    <div className="text-center">
                      <span className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs text-emerald-300 font-medium">
                        قم بمحاذاة المستند داخل الإطار
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1" />
                      <div className="w-6 h-6 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1" />
                    </div>
                  </div>

                  {/* Camera Controls Overlay */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {hasTorch && (
                      <button
                        onClick={handleToggleTorch}
                        className={`p-2.5 rounded-xl backdrop-blur-md transition-all ${
                          torchOn ? 'bg-amber-500 text-black' : 'bg-black/50 text-white hover:bg-black/70'
                        }`}
                        title="تشغيل/إطفاء الفلاش"
                      >
                        {torchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
                      </button>
                    )}
                    <button
                      onClick={handleSwitchCamera}
                      className="p-2.5 rounded-xl bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-all"
                      title="تبديل الكاميرا"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── View 2: Captured & Processed Image Preview ── */}
          {capturedImage && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="relative max-w-2xl max-h-[50vh] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-xl flex items-center justify-center p-2">
                {isProcessingFilter ? (
                  <div className="flex flex-col items-center justify-center p-12 gap-3">
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    <span className="text-xs text-slate-300">جاري معالجة وتصفية المستند...</span>
                  </div>
                ) : (
                  <img
                    src={processedImage || capturedImage}
                    alt="Scanned Document"
                    className="max-h-[46vh] w-auto object-contain rounded-lg shadow-md"
                  />
                )}
              </div>

              {/* Filter & Enhancement Bar */}
              <div className="flex flex-wrap items-center justify-center gap-2 bg-surface-800/80 p-2 rounded-xl border border-white/10 max-w-xl">
                <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> فلاتر الأرشفة:
                </span>
                <button
                  type="button"
                  onClick={() => handleFilterChange('bw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'bw'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  📄 مستند أبيض وأسود (Scan)
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('enhanced')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'enhanced'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  ✨ تباين عالي للألوان
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('grayscale')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'grayscale'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  درجات الرمادي
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('original')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterMode === 'original'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  الصورة الأصلية
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 hover:bg-white/10 flex items-center gap-1"
                  title="تدوير 90 درجة"
                >
                  <RotateCw className="w-3.5 h-3.5" /> تدوير
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Picker Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 bg-surface-800/90">
          {!capturedImage ? (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn bg-white/5 text-slate-300 hover:bg-white/10 text-xs sm:text-sm gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                تحميل صورة من الجهاز
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn bg-white/5 text-slate-300 hover:bg-white/10 text-xs sm:text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCaptureSnapshot}
                  disabled={Boolean(cameraError) || isCapturing}
                  className="btn btn-primary text-sm px-6 py-2.5 gap-2 shadow-lg shadow-blue-600/30 font-bold"
                >
                  <Camera className="w-4 h-4" />
                  التقاط المستند الآن
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="btn bg-white/5 text-slate-300 hover:bg-white/10 text-xs sm:text-sm gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة التقاط
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn bg-white/5 text-slate-300 hover:bg-white/10 text-xs sm:text-sm"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleConfirmScan}
                  className="btn btn-primary text-sm px-6 py-2.5 gap-2 shadow-lg shadow-blue-600/30 font-bold"
                >
                  <Check className="w-4 h-4" />
                  اعتماد وإرفاق المستند الممسوح
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
