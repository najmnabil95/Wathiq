import { useEffect, useId, useRef, useState } from 'react'
import { money } from '../data/sample'

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => {
      const next = el.clientWidth
      setWidth((prev) => (prev === next ? prev : next))
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

function smooth(points, tension = 0.18) {
  if (points.length < 2) return ''
  const line = (p, i) => {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = p
    const p2 = points[i + 1] || p1
    const p3 = points[Math.min(points.length - 1, i + 2)] || p2
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return points.reduce((acc, p, i) => (i === 0 ? `M ${p.x},${p.y}` : `${acc} ${line(p, i)}`), '')
}

export function AreaChart({
  labels = [],
  data = [],
  compare = [],
  height = 250,
  yTicks = 4,
  currency = true,
  compactY = true,
  showLabels = true,
  accent = '#3d86ff',
  className = '',
}) {
  const [wrapRef, width] = useWidth()
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState(null)
  const max = Math.max(...data, ...compare, 1) * 1.12
  const pad = { top: 16, right: showLabels ? 24 : 10, bottom: showLabels ? 30 : 10, left: currency ? 64 : 8 }
  const w = Math.max(width, 320)
  const h = height
  const innerW = w - pad.left - pad.right
  const innerH = h - pad.top - pad.bottom
  const xFor = (i) => pad.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW)
  const yFor = (v) => pad.top + innerH - (v / max) * innerH

  const points = data.map((v, i) => ({ x: xFor(i), y: yFor(v) }))
  const prevPoints = compare.map((v, i) => ({ x: xFor(i), y: yFor(v) }))
  const line = smooth(points)
  const area = `${line} L ${xFor(data.length - 1)},${pad.top + innerH} L ${pad.left},${pad.top + innerH} Z`

  const ticks = Array.from({ length: yTicks }, (_, i) => (max / (yTicks - 1)) * i)
  const gridYs = ticks.map((t) => yFor(t))
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w
    const ratio = (x - pad.left) / innerW
    const idx = Math.round(ratio * (data.length - 1))
    if (idx >= 0 && idx < data.length) setHover(idx)
  }

  return (
    <div ref={wrapRef} className={`area-chart ${className}`}>
      {width > 0 ? (
        <svg
          viewBox={`0 0 ${w} ${h}`}
          width="100%"
          height={h}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label="المبيعات عبر الوقت"
        >
          <defs>
            <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
              <stop offset="70%" stopColor={accent} stopOpacity="0.06" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7d9cff" />
              <stop offset="55%" stopColor={accent} />
              <stop offset="100%" stopColor="#54d9e8" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => (
            <g key={t}>
              <line
                x1={pad.left}
                x2={w - pad.right}
                y1={gridYs[i]}
                y2={gridYs[i]}
                stroke="currentColor"
                className="chart-grid"
              />
              {currency ? (
                <text x={pad.left - 10} y={gridYs[i] + 4} textAnchor="end" className="chart-axis">
                  {compactY ? money(t, true) : money(t)}
                </text>
              ) : null}
            </g>
          ))}

          {prevPoints.length ? (
            <path d={smooth(prevPoints)} fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 6" className="chart-compare" />
          ) : null}

          <path d={area} fill={`url(#fill-${uid})`} />
          <path d={line} fill="none" stroke={`url(#stroke-${uid})`} strokeWidth="2.4" strokeLinecap="round" />

          {labels
            .map((label, i) => ({ label, i }))
            .filter((x) => x.label)
            .map((x, pos, arr) => {
              const step = Math.ceil(arr.length / 7)
              if (step > 1 && pos % step !== 0 && pos !== arr.length - 1) return null
              return (
                <text key={`${x.label}-${x.i}`} x={xFor(x.i)} y={h - 8} textAnchor="middle" className="chart-axis">
                  {x.label}
                </text>
              )
            })}

          {hover != null ? (
            <g className="chart-hover">
              <line x1={xFor(hover)} x2={xFor(hover)} y1={pad.top} y2={pad.top + innerH} stroke="currentColor" className="chart-cursor" />
              <circle cx={xFor(hover)} cy={yFor(data[hover])} r="4.5" fill={accent} stroke="#fff" strokeWidth="2" />
            </g>
          ) : null}
        </svg>
      ) : (
        <div style={{ height }} />
      )}
      {hover != null && width > 0 ? (
        <div
          className="chart-tip"
          style={{ left: `${(xFor(hover) / w) * 100}%`, top: 2 }}
        >
          <span className="chart-tip-label">{labels[hover] || `النقطة ${hover + 1}`}</span>
          <strong>{money(data[hover], true)}</strong>
        </div>
      ) : null}
    </div>
  )
}

export function Sparkline({ data = [], color = '#3d86ff', width = 96, height = 34, fill = true }) {
  const uid = useId().replace(/:/g, '')
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const pts = data.map((v, i) => ({
    x: (i / Math.max(1, data.length - 1)) * width,
    y: height - 3 - ((v - min) / Math.max(1, max - min)) * (height - 6),
  }))
  const line = smooth(pts, 0.22)
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="sparkline" aria-hidden="true">
      <defs>
        <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.34" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={`${line} L ${width},${height} L 0,${height} Z`} fill={`url(#sp-${uid})`} /> : null}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function MiniBars({ data = [], height = 78, color = '#4f8cff', highlightLast = true }) {
  const max = Math.max(...data, 1)
  return (
    <div className="mini-bars" style={{ height }} aria-hidden="true">
      {data.map((v, i) => (
        <span
          key={i}
          className={`mini-bar ${highlightLast && i === data.length - 1 ? 'is-last' : ''}`}
          style={{
            height: `${Math.max(10, (v / max) * 100)}%`,
            background: i === data.length - 1 && highlightLast ? 'linear-gradient(180deg,#9dc4ff,#3d86ff)' : color,
            opacity: 0.32 + (v / max) * 0.68,
          }}
        />
      ))}
    </div>
  )
}

export function RadialProgress({ value = 0, size = 108, stroke = 10, children, accent = '#4f8cff', track = 'rgba(255,255,255,.07)' }) {
  const uid = useId().replace(/:/g, '')
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(value, 100))
  return (
    <div className="radial" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8fb8ff" />
            <stop offset="60%" stopColor={accent} />
            <stop offset="100%" stopColor="#37c8d8" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${uid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="radial-fill"
        />
        {clamped > 2 ? (
          <circle
            cx={size / 2 + r * Math.cos(((clamped / 100) * 360 - 90) * (Math.PI / 180))}
            cy={size / 2 + r * Math.sin(((clamped / 100) * 360 - 90) * (Math.PI / 180))}
            r={stroke * 0.42}
            fill="#fff"
            className="radial-knob"
          />
        ) : null}
      </svg>
      <div className="radial-center">{children}</div>
    </div>
  )
}

export function Donut({ segments = [], size = 140, stroke = 16, center }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={stroke} />
        {segments.map((s) => {
          const len = (s.value / total) * c
          const dash = `${Math.max(0, len - 4)} ${c}`
          const el = (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += len
          return el
        })}
      </svg>
      {center ? <div className="donut-center">{center}</div> : null}
    </div>
  )
}

export function SparkArea({ data = [], labels = [], color = '#3d86ff' }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const width = 620
  const height = 160
  const pts = data.map((v, i) => ({
    x: (i / Math.max(1, data.length - 1)) * width,
    y: height - 12 - ((v - min) / Math.max(1, max - min)) * (height - 26),
  }))
  const line = smooth(pts, 0.2)
  const uid = useId().replace(/:/g, '')
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" className="spark-area" aria-hidden="true">
      <defs>
        <linearGradient id={`sa-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${width},${height} L 0,${height} Z`} fill={`url(#sa-${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
