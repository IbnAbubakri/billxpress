import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}

export function OptimizedImage({ src, alt, className = '', width, height }: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const isSvg = src.endsWith('.svg');

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
        aria-label={alt}
      >
        <span className="text-gray-400 text-xs">{alt?.charAt(0)?.toUpperCase() || '?'}</span>
      </div>
    );
  }

  if (isSvg) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        className={className}
        onError={() => setError(true)}
      />
    );
  }

  const webpSrc = src.replace(/\.(png|jpg|jpeg)$/i, '.webp');

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        className={className}
        onError={() => setError(true)}
      />
    </picture>
  );
}
