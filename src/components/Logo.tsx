/** Hazard Watch mark: a map pin carrying a warning, standing inside a dashed hotspot ring. */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <ellipse cx="20" cy="33" rx="13" ry="4.2" fill="none" stroke="#ffc83d" strokeWidth="1.6" strokeDasharray="3.2 3" />
      <path d="M20 3.5c-6.3 0-11.2 4.9-11.2 11 0 7.8 11.2 17.6 11.2 17.6S31.2 22.3 31.2 14.5c0-6.1-4.9-11-11.2-11z" fill="#ffc83d" />
      <rect x="18.5" y="9" width="3" height="8" rx="1.5" fill="#0c2340" />
      <circle cx="20" cy="21.4" r="1.9" fill="#0c2340" />
    </svg>
  );
}