import React from 'react';
import { Show } from '../types';
import { DiziLogo } from './DiziLogo';

interface ShowTitleLogoProps {
  show: Show;
  className?: string;
  isSmall?: boolean;
}

export const ShowTitleLogo: React.FC<ShowTitleLogoProps> = ({
  show,
  className = '',
  isSmall = false
}) => {
  const hasCustomMaxHeight = className.includes('max-h-') || className.includes('h-');
  const hasCustomMaxWidth = className.includes('max-w-') || className.includes('w-');

  // If user provided a custom PNG logo URL, use it directly
  if (show.titleLogoUrl) {
    const defaultSizes = `${hasCustomMaxHeight ? '' : 'max-h-20 sm:max-h-24 md:max-h-28 lg:max-h-32 xl:max-h-36'} ${hasCustomMaxWidth ? '' : 'max-w-[260px] sm:max-w-[320px] md:max-w-[380px] xl:max-w-[420px]'}`;
    return (
      <img
        src={show.titleLogoUrl}
        alt={show.title}
        loading="eager"
        decoding="async"
        {...({ fetchPriority: 'high' } as any)}
        referrerPolicy="no-referrer"
        className={`${defaultSizes} object-contain select-none drop-shadow-2xl origin-bottom-left ${className}`}
      />
    );
  }

  // High-fidelity PNG-style graphic logo with Dizi brand marker for each show
  return (
    <div
      className={`flex flex-col select-none drop-shadow-2xl origin-bottom-left ${className}`}
    >
      {/* Dizi brand prefix */}
      <div className={`flex items-center gap-1.5 ${isSmall ? 'mb-0.5' : 'mb-1'}`}>
        <DiziLogo variant="red" size={isSmall ? 'sm' : 'sm'} />
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
