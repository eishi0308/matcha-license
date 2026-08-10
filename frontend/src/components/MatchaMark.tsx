/**
 * MatchaScope brand mark — a chawan (matcha bowl) with rising steam, set in a
 * matcha gradient disc. Drawn as inline SVG rather than the 🍵 emoji so it
 * renders identically on every platform and can be tinted and sized freely.
 */
interface Props {
  size?: number;
  className?: string;
}

export default function MatchaMark({ size = 32, className = "" }: Props) {
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(140deg, #3c7a32 0%, #2e6027 45%, #6eb35c 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 2px 8px rgba(46,96,39,0.28)",
      }}
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <g transform="translate(0 0.9)">
          {/* Steam */}
          <path
            d="M9.4 2.2c-1.1 1.1-1.1 2 0 3.1s1.1 2 0 3.1"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M14.6 3.3c-.85.85-.85 1.55 0 2.4s.85 1.55 0 2.4"
            stroke="#ffffff"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Bowl body */}
          <path d="M2.9 11.2a9.1 8.1 0 0 0 18.2 0z" fill="#ffffff" />
          {/* Rim, seen at an angle */}
          <ellipse cx="12" cy="11.2" rx="9.4" ry="2.4" fill="#ffffff" />
          {/* The matcha itself */}
          <ellipse cx="12" cy="11.2" rx="7.4" ry="1.5" fill="#2e6027" />
        </g>
      </svg>
    </div>
  );
}
