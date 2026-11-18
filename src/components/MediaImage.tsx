import React, { useEffect, useRef, useState } from 'react';

interface MediaImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null;
  fallbackTitle: string;
  fallbackClassName?: string;
  fallbackTextClassName?: string;
  hideFallback?: boolean;
  imageRef?: React.RefObject<HTMLImageElement | null>;
  deferLoad?: boolean;
  skeletonClassName?: string;
  skeletonDelayMs?: number;
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
  deferLoad = false,
  skeletonClassName,
  skeletonDelayMs,
  referrerPolicy = 'no-referrer',
  onError,
  onLoad,
  style,
  ...rest
}) => {
  const cleanSrc = typeof src === 'string' ? src.trim() : '';
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const internalRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [cleanSrc, deferLoad]);

  useEffect(() => {
    if (deferLoad || !cleanSrc) return;
    const el = internalRef.current;
    if (el && el.complete) {
      if (el.naturalWidth === 0) {
        setHasError(true);
      } else {
        setIsLoaded(true);
      }
    }
  }, [cleanSrc, deferLoad]);

  const showFallback = !cleanSrc || hasError;

  if (deferLoad) {
    return (
      <div
        className={
          skeletonClassName ||
          'w-full h-full skeleton-wave rounded-[inherit]'
        }
        style={{
          ...style,
          animationDelay: skeletonDelayMs ? `${skeletonDelayMs}ms` : undefined
        }}
      />
    );
  }

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

  const revealImage = (img: HTMLImageElement, event: React.SyntheticEvent<HTMLImageElement>) => {
    if (img.naturalWidth === 0) {
      setHasError(true);
      return;
    }
    if (typeof img.decode === 'function') {
      img
        .decode()
        .then(() => setIsLoaded(true))
        .catch(() => setIsLoaded(true));
    } else {
      setIsLoaded(true);
    }
    onLoad?.(event);
  };

  return (
    <>
      {!isLoaded && (
        <div
          className={
            skeletonClassName ||
            'absolute inset-0 w-full h-full skeleton-wave pointer-events-none'
          }
          style={{
            animationDelay: skeletonDelayMs ? `${skeletonDelayMs}ms` : undefined
          }}
        />
      )}
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
        decoding="async"
        className={className}
        style={{
          ...style,
          opacity: isLoaded ? (style?.opacity ?? 1) : 0,
          transition: style?.transition ? `${style.transition}, opacity 200ms ease-out` : 'opacity 200ms ease-out'
        }}
        onLoad={(e) => revealImage(e.currentTarget, e)}
        onError={(e) => {
          setHasError(true);
          onError?.(e);
        }}
        {...rest}
      />
    </>
  );
};
