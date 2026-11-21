import React, { useMemo } from 'react';
import { Show } from '../types';
import { DiziLogo } from './DiziLogo';
import { MediaImage } from './MediaImage';

interface SignupTileBannerProps {
  shows: Show[];
  title?: string;
  subtitle?: string;
  buttonText?: string;
  imageUrl?: string;
  platformName?: string;
  customLogoUrl?: string;
  useCustomLogo?: boolean;
  containerMode?: 'contained' | 'full_bleed';
  onActionClick: () => void;
}

export const SignupTileBanner: React.FC<SignupTileBannerProps> = ({
  shows,
  title,
  subtitle = '',
  buttonText = 'Sign Up to Watch',
  imageUrl,
  platformName = 'Dizi Urdu',
  customLogoUrl,
  useCustomLogo = false,
  containerMode = 'contained',
  onActionClick
}) => {
  const collagePosters = useMemo(() => {
    const urls = shows
      .map((s) => s.posterVerticalUrl || s.posterUrl || s.posterLandscapeUrl || s.backdropUrl)
      .filter((u): u is string => Boolean(u && u.trim()));
    if (urls.length === 0) return [];
    const filled: string[] = [];
    for (let i = 0; i < 10; i++) {
      filled.push(urls[i % urls.length]);
    }
    return filled;
  }, [shows]);

  const isFullBleed = containerMode === 'full_bleed';
  const trimmedTitle = title ? title.trim() : '';
  const trimmedSubtitle = subtitle ? subtitle.trim() : '';
  const trimmedButtonText = buttonText ? buttonText.trim() : '';

  return (
    <section
      className={`w-full my-6 sm:my-8 select-none ${
        isFullBleed ? 'px-0' : 'px-2.5 sm:px-4 md:px-8 xl:px-12'
      }`}
    >
      <div
        className={`relative w-full min-h-[210px] sm:min-h-[245px] md:min-h-[275px] overflow-hidden flex items-center ${
          isFullBleed
            ? 'rounded-none border-0 shadow-none bg-black'
            : 'rounded-2xl md:rounded-[22px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.65)] bg-[#18181b]'
        }`}
      >
        {/* Background Artwork: Either Admin Custom Banner Image or Automatic Catalog Collage (no hover zoom) */}
        {imageUrl && imageUrl.trim() ? (
          <MediaImage
            src={imageUrl.trim()}
            fallbackTitle={trimmedTitle || platformName}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : collagePosters.length > 0 ? (
          <div
            className="absolute -right-8 sm:-right-4 -top-8 -bottom-8 w-[68%] sm:w-[64%] md:w-[62%] pointer-events-none overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 18%, black 42%)',
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 18%, black 42%)'
            }}
          >
            <div className="grid grid-cols-5 gap-2.5 sm:gap-3 -rotate-6 scale-110 origin-center">
              {collagePosters.map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-900 shadow-lg border border-white/10"
                >
                  <MediaImage
                    src={src}
                    fallbackTitle={platformName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Top & Bottom subtle merging glare when image is selected (not too tall) */}
        {imageUrl && imageUrl.trim() && (
          <>
            <div
              className="absolute inset-x-0 top-0 h-10 sm:h-14 pointer-events-none z-[1]"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 55%, transparent 100%)'
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-10 sm:h-14 pointer-events-none z-[1]"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.32) 55%, transparent 100%)'
              }}
            />
          </>
        )}

        {/* Left Dark Readability Scrim & Warm Ambient Highlight matching Apple TV tile */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background: imageUrl?.trim()
              ? 'linear-gradient(to right, rgba(16,16,19,0.96) 0%, rgba(16,16,19,0.85) 36%, rgba(16,16,19,0.3) 68%, transparent 100%)'
              : 'linear-gradient(to right, #18181b 0%, rgba(24,24,27,0.94) 34%, rgba(24,24,27,0.45) 56%, transparent 78%)'
          }}
        />
        <div
          className="absolute -left-16 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-[90px] opacity-25 pointer-events-none z-[2]"
          style={{ background: 'radial-gradient(circle, #ef4444 0%, #b45309 55%, transparent 80%)' }}
        />

        {/* Foreground Copy & Rounded White CTA Button (only button is clickable) */}
        <div
          className={`relative z-10 py-7 sm:py-9 max-w-[340px] sm:max-w-[430px] flex flex-col items-start text-left ${
            isFullBleed ? 'px-5 sm:px-10 md:px-14' : 'px-6 sm:px-10 md:px-12'
          }`}
        >
          <div className="mb-3">
            {useCustomLogo && customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt={platformName}
                referrerPolicy="no-referrer"
                className="h-7 sm:h-8 w-auto max-w-[140px] object-contain"
              />
            ) : (
              <DiziLogo variant="red" size="md" className="h-7 sm:h-8 w-auto" />
            )}
          </div>

          {trimmedTitle && (
            <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white tracking-tight leading-snug mb-1">
              {trimmedTitle}
            </h3>
          )}

          {trimmedSubtitle && (
            <p className="text-sm sm:text-[15.5px] font-semibold text-zinc-100 leading-snug">
              {trimmedSubtitle}
            </p>
          )}

          <button
            type="button"
            onClick={onActionClick}
            className="mt-4 sm:mt-5 px-6 sm:px-7 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-black font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            {trimmedButtonText || 'Sign Up to Watch'}
          </button>
        </div>
      </div>
    </section>
  );
};
