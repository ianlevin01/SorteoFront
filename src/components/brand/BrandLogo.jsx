import logo from '../../assets/logo.jpg';

/**
 * Logo real de Importadora Precios Bajos. Es una imagen cuadrada con el
 * sello circular adentro; se recorta a círculo con CSS para que no se vea
 * el fondo del cuadrado en ningún lado (header oscuro, tarjetas, etc).
 */
export function BrandLogo({ className, showText = true, size = 36 }) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
    >
      <img
        src={logo}
        alt="Importadora Precios Bajos"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          boxShadow: '0 0 0 1px rgba(15, 37, 71, 0.06)',
        }}
      />
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
