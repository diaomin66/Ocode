export function HomeMascotLogo() {
  return (
    <span
      className="home-mascot-logo"
      data-testid="home-mascot-logo"
      aria-hidden="true"
    >
      <span className="home-mascot-motion">
        <svg
          viewBox="0 0 1024 1024"
          width={100}
          height={100}
          fill="none"
          stroke="currentColor"
          focusable="false"
        >
          {/* make-brand.py draws its 90-unit outline inward; SVG strokes are centered. */}
          <rect x="255" y="245" width="514" height="534" rx="145" strokeWidth="90" />
          <path d="M440 650 584 374" strokeWidth="70" strokeLinecap="round" />
        </svg>
      </span>
    </span>
  );
}
