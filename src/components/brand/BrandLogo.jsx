/*
 * Logo PLACEHOLDER. Reemplazar por el logo real de Importadora Precios Bajos
 * (idealmente un SVG). Mantener la prop `className` para el tamaño.
 */
export function BrandLogo({ className, showText = true }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}
    >
      <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="11" fill="var(--color-primary)" />
        <path
          d="M11 27V13h3.4v14H11Zm6.1 0V13h5.7c2.9 0 4.7 1.7 4.7 4.3 0 2.6-1.8 4.3-4.7 4.3h-2.3V27h-3.4Zm3.4-8.1h1.9c1.1 0 1.8-.6 1.8-1.6s-.7-1.6-1.8-1.6h-1.9v3.2Z"
          fill="#fff"
        />
      </svg>
      {showText && (
        <span
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.05,
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.01em',
          }}
        >
          <span style={{ fontSize: '0.9rem' }}>Importadora</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)' }}>Precios Bajos</span>
        </span>
      )}
    </span>
  );
}
