import Link from 'next/link';


export default function Brand({ className = '', compact = false, href = '/' }) {
  return (
    <Link href={href} className={`brand ${className}`} aria-label="Skill For Hire home">
      <svg className="brand-logo" viewBox="0 0 72 64" role="img" aria-label="Skill For Hire graduation cap logo">
        <defs>
          <linearGradient id="sfh-cap" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#123D48" />
            <stop offset="1" stopColor="#061F2A" />
          </linearGradient>
          <linearGradient id="sfh-stack" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#35D6C1" />
            <stop offset="1" stopColor="#079B8D" />
          </linearGradient>
        </defs>
        {/* Graduation-cap board */}
        <path d="M5 20.5 35.5 6 67 20.5 35.5 35 5 20.5Z" fill="url(#sfh-cap)" />
        {/* Cap band and tassel */}
        <path d="M16 26.2v8.1l19.5 9.2 19.5-9.2v-8.1l-19.5 9.1L16 26.2Z" fill="#0A3440" />
        <path d="M64.2 22v16.4" stroke="#082B37" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="64.2" cy="41.2" r="3.1" fill="#082B37" />
        {/* Teal layered pages, matching the selected preview mark */}
        <path d="M14 36.2 35.5 46.4 57 36.2v7.2L35.5 54 14 43.4v-7.2Z" fill="url(#sfh-stack)" />
        <path d="M21 31.8 35.5 38.7 50 31.8v6.8l-14.5 7-14.5-7v-6.8Z" fill="#19BCA9" />
        <path d="m14 36.2 7 3.3v6.8l-7-3.4v-6.7Z" fill="#087D78" />
      </svg>
      {!compact && <span className="brand-name">Skill For <strong>Hire</strong></span>}
    </Link>
  );
}
