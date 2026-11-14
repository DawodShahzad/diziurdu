import React, { useEffect, useRef, useState } from 'react';

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackTitle: string;
  fallbackClassName?: string;
  fallbackTextClassName?: string;
  hideFallback?: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  fallbackTitle,
  alt,
  className = 'w-full h-full object-cover',
  fallbackClassName,
  fallbackTextClassName,
  hideFallback = false,
  imageRef,
  referrerPolicy = 'no-referrer',
  onError,
  onLoad,
  style,
  ...rest
}) => {
  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const [hasError, setHasError] = useState(false);
  const internalRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
  }, [cleanSrc]);

  useEffect(() => {
    const el = internalRef.current;
    if (el && el.complete && el.naturalWidth === 0) {
      setHasError(true);
    }
  }, [cleanSrc]);

  const showFallback = !cleanSrc || hasError;

  if (showFallback) {
    if (hideFallback) {
      return null;
    }

    const baseFallback =
      fallbackClassName ||
      `${className.includes('absolute') ? 'absolute inset-0 ' : ''}w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none`;

    return (
      <div className={baseFallback} style={style}>
        <span
          className={
            fallbackTextClassName ||
            'text-white/95 font-semibold text-xs sm:text-sm md:text-base leading-snug line-clamp-3 break-words font-sans drop-shadow-sm'
          }
        >
          {fallbackTitle}
        </span>
      </div>
    );
  }

  return (
    <img
      ref={(node) => {
        (internalRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
        if (imageRef) {
          (imageRef as React.MutableRefObject<HTMLImageElement | null>).current = node;
        }
      }}
      src={cleanSrc}
      alt={alt ?? fallbackTitle}
      referrerPolicy={referrerPolicy}
      className={className}
      style={style}
      onLoad={(e) => {
        if (e.currentTarget.naturalWidth === 0) {
          setHasError(true);
        }
        onLoad?.(e);
      }}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
};
