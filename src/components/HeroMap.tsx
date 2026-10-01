import type { CSSProperties } from "react";

// [x, y, delay in seconds]: five reports landing inside one hotspot.
const PINS: [number, number, number][] = [[392, 118, 0.4], [498, 140, 0.75], [520, 238, 1.1], [430, 286, 1.45], [348, 206, 1.8]];

/** A stylised Pune street map where five reports land, a hotspot ring opens and the count appears. Plays once. */
export function HeroMap({ count = 5, className = "", style }: { count?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" className={className} style={style} aria-hidden>
      <g fill="none" stroke="#fff" strokeLinecap="round">
        <path d="M-10 310 C120 280 220 330 330 300 S560 250 660 280" strokeOpacity=".11" strokeWidth="9" />
        <path d="M120 -10 C150 90 110 180 170 250 S230 360 210 420" strokeOpacity=".11" strokeWidth="9" />
        <path d="M-10 120 C100 140 200 90 320 130 S520 60 660 110" strokeOpacity=".09" strokeWidth="6" />
        <path d="M300 -10 L360 140 L330 300 L380 420" strokeOpacity=".09" strokeWidth="6" />
        <path d="M470 -10 C480 80 540 160 520 260 S560 380 600 420" strokeOpacity=".09" strokeWidth="6" />
        <path d="M-10 215 H660 M250 -10 V420 M570 -10 V420 M-10 60 H660" strokeOpacity=".05" strokeWidth="3" />
      </g>
      <path d="M-10 385 C120 335 260 385 380 345 S560 325 660 355" fill="none" stroke="#2f7fb8" strokeOpacity=".35" strokeWidth="26" strokeLinecap="round" />

      <circle className="hm-expand" cx="440" cy="200" r="104" fill="#ffc83d" fillOpacity=".09" stroke="#ffc83d" strokeWidth="2.5" strokeDasharray="8 8" style={{ animationDelay: "2.1s" }} />

      {PINS.map(([x, y, delay]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <g className="hm-drop" style={{ animationDelay: `${delay}s` }}>
            <path d="M0 -14c-6 0-10 4.4-10 10 0 7 10 16 10 16s10-9 10-16c0-5.6-4-10-10-10z" fill="#fff" />
            <circle cy="-4" r="3.6" fill="#0c2340" />
          </g>
        </g>
      ))}

      <g transform="translate(440 200)">
        <g className="hm-pop" style={{ animationDelay: "2.5s" }}>
          <circle r="31" fill="#ffc83d" stroke="#0c2340" strokeWidth="6" />
          <text y="10.5" textAnchor="middle" fontSize="31" fontWeight="700" fill="#0c2340" style={{ fontFamily: "var(--nf-display), sans-serif" }}>{count}</text>
        </g>
      </g>
    </svg>
  );
}