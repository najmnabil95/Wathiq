export function LogoMark({ size = 36 }) {
  return (
    <span className="logo-mark" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7db2ff" />
            <stop offset="45%" stopColor="#3d86ff" />
            <stop offset="100%" stopColor="#1d5fe0" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="13" fill="url(#logo-bg)" />
        <rect x="1" y="1" width="38" height="38" rx="12" fill="none" stroke="rgba(255,255,255,.25)" />
        <path
          d="M20 9.5c4.6 0 8.5 3.7 8.5 8.4 0 4.9-3.9 8.8-8.7 8.8-3.5 0-6.5-2-7.9-4.9"
          fill="none"
          stroke="#fff"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path d="M20 30.5v-5.2M20 25.3c-2.5 0-4.6-1.9-4.9-4.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="15.1" cy="16.4" r="2.2" fill="#fff" opacity=".92" />
      </svg>
    </span>
  )
}
