import React from 'react';

/**
 * WatermarkOverlay component
 * Renders a crisp, tiled diagonal watermark pattern across any previewable document.
 */
export default function WatermarkOverlay({
  userName = 'المستخدم الحالي',
  documentNumber = '',
  confidentialityLevel = 'سري للغاية',
  opacity = 0.18,
  isActive = true,
  customText = ''
}) {
  if (!isActive) return null;

  const nowStr = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const watermarkLine1 = customText || `${confidentialityLevel.toUpperCase()} · نسخة رسمية مصرح بالاطلاع فقط`;
  const watermarkLine2 = `الموظف: ${userName} | وثيقة: ${documentNumber || 'IT-DOC'} | ${nowStr}`;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-30 flex flex-col justify-around py-4"
      aria-hidden="true"
    >
      {[...Array(6)].map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex justify-around items-center w-[160%] -mr-[30%] rotate-[-26deg] whitespace-nowrap"
          style={{ opacity }}
        >
          {[...Array(3)].map((_, colIdx) => (
            <div key={colIdx} className="text-center px-8 py-4">
              <div className="font-extrabold text-sm sm:text-base tracking-widest text-red-500 uppercase drop-shadow-sm font-sans">
                {watermarkLine1}
              </div>
              <div className="text-[10px] sm:text-xs font-mono font-semibold text-slate-400 mt-0.5">
                {watermarkLine2}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
