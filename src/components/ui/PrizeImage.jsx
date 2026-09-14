import { useState } from 'react';
import clsx from 'clsx';
import styles from './PrizeImage.module.css';

/**
 * Imagen del premio con placeholder elegante cuando no hay foto (o falla).
 * ratio: '4/3' | '16/9' | '1/1' | 'auto'
 */
export function PrizeImage({ src, alt = '', ratio = '4/3', className }) {
  const [failed, setFailed] = useState(false);
  const show = src && !failed;
  // 'auto' + imagen real -> se muestra a su relación de aspecto original (sin
  // recortar ni deformar). Sin imagen todavía no hay nada que medir, así que
  // el placeholder cae a un recuadro 4/3 en vez de colapsar a alto 0.
  const natural = ratio === 'auto' && show;

  return (
    <div
      className={clsx(styles.wrap, className)}
      style={{ aspectRatio: natural ? undefined : ratio === 'auto' ? '4 / 3' : ratio }}
      data-empty={!show || undefined}
    >
      {show ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={clsx(styles.img, natural && styles.imgNatural)}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className={styles.placeholder} aria-hidden="true">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3 3 8v8l9 5 9-5V8l-9-5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M3 8l9 5 9-5M12 13v8" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
      )}
    </div>
  );
}
