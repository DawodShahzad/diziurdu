import React from 'react';
import { Show } from '../types';
import { DiziLogo } from './DiziLogo';

interface ShowTitleLogoProps {
  show: Show;
  className?: string;
  isSmall?: boolean;
  /** When true, prefers show.centralLogoUrl and falls back to show.titleLogoUrl (used on 2:3 Recommendation & Modern Rank) */
  useCentralLogo?: boolean;
  /** Horizontal alignment inside the 2.5:1 logo box */
  align?: 'left' | 'center';
  /** When true, fills parent fixed-aspect (2.5:1) container with w-full h-full object-contain */
  fillContainer?: boolean;
}

export const ShowTitleLogo: React.FC<ShowTitleLogoProps> = ({
  show,
  className = '',
  isSmall = false,
  useCentralLogo = false,
  align = 'left',
  fillContainer = false
}) => {
  const hasCustomMaxHeight = className.includes('max-h-') || className.includes('h-');
  const hasCustomMaxWidth = className.includes('max-w-') || className.includes('w-');

  const resolvedLogoUrl = useCentralLogo
    ? (show.centralLogoUrl || show.titleLogoUrl)
    : show.titleLogoUrl;

  // If user provided a custom PNG logo URL, use it directly
  if (resolvedLogoUrl) {
    if (fillContainer) {
      return (
        <img
          src={resolvedLogoUrl}
          alt={show.title}
          loading="eager"
          decoding="async"
          {...({ fetchPriority: 'high' } as any)}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 block w-full h-full max-w-full max-h-full object-contain ${
            align === 'center' ? 'object-bottom' : 'object-bottom-left'
          } select-none drop-shadow-2xl ${className}`}
        />
      );
    }

    const defaultSizes = `${hasCustomMaxHeight ? '' : 'max-h-20 sm:max-h-24 md:max-h-28 lg:max-h-32 xl:max-h-36'} ${hasCustomMaxWidth ? '' : 'max-w-[260px] sm:max-w-[320px] md:max-w-[380px] xl:max-w-[420px]'}`;
    return (
      <img
        src={resolvedLogoUrl}
        alt={show.title}
        loading="eager"
        decoding="async"
        {...({ fetchPriority: 'high' } as any)}
        referrerPolicy="no-referrer"
        className={`block ${defaultSizes} object-contain ${
          align === 'center' ? 'object-bottom' : 'object-bottom-left'
        } select-none drop-shadow-2xl origin-bottom-left ${className}`}
      />
    );
  }

  // High-fidelity PNG-style graphic logo with Dizi brand marker for each show
  return (
    <div
      className={`flex flex-col ${
        align === 'center' ? 'items-center text-center justify-end' : 'items-start text-left justify-end'
      } ${fillContainer ? 'absolute inset-0 w-full h-full' : ''} select-none drop-shadow-2xl origin-bottom-left ${className}`}
    >
      {/* Dizi brand prefix */}
      <div className={`flex items-center gap-1.5 ${isSmall ? 'mb-0.5' : 'mb-1'}`}>
        <DiziLogo variant="red" size="sm" />
      </div>

      {/* Main Stylized Title Graphics */}
      <div className="leading-none origin-bottom-left">
        <h1
          className={`font-black uppercase tracking-tighter font-display text-white ${
            isSmall
              ? 'text-xs sm:text-sm'
              : hasCustomMaxHeight
              ? 'text-lg sm:text-xl md:text-2xl'
              : 'text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl'
          }`}
          style={{
            textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)',
            letterSpacing: '-0.03em'
          }}
        >
          {show.logoText || show.title}
        </h1>
        {show.logoSubtext && !isSmall && (
          <p className="font-black tracking-[0.25em] text-zinc-300 uppercase mt-0.5 font-display text-xs md:text-sm">
            {show.logoSubtext}
          </p>
        )}
      </div>
    </div>
  );
};
