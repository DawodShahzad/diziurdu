import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MediaImage } from './MediaImage';

export type AdBadgePosition = 'top_left' | 'bottom_left';
export type AdTileContentPosition = 'center' | 'bottom_left' | 'bottom_right';

interface AdTileBannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  imageUrl?: string;
  logoImageUrl?: string;
  containerMode?: 'contained' | 'full_bleed';
  aspectHeight?: 'default' | 'tall' | 'narrow';
  imageGlare?: boolean;
  badgePosition?: AdBadgePosition;
  textPosition?: AdTileContentPosition;
  buttonPosition?: AdTileContentPosition;
  showCloseButton?: boolean;
  /** Optional override for container padding when rendered inside More Info page */
  insideMoreInfo?: boolean;
  onNavigateInternal?: (path: string) => void;
}

export const AdTileBanner: React.FC<AdTileBannerProps> = ({
  title,
  subtitle,
  buttonText,
  buttonUrl,
  imageUrl,
  logoImageUrl,
  containerMode = 'contained',
  aspectHeight = 'default',
  imageGlare = true,
  badgePosition = 'bottom_left',
  textPosition = 'center',
  buttonPosition = 'center',
  showCloseButton = false,
  insideMoreInfo = false,
  onNavigateInternal
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const isFullBleed = containerMode === 'full_bleed';
  const trimmedTitle = (title || '').trim();
  const trimmedSubtitle = (subtitle || '').trim();
  const trimmedButton = (buttonText || '').trim();
  const trimmedUrl = (buttonUrl || '').trim();
  const trimmedLogo = (logoImageUrl || '').trim();
  const hasImage = Boolean((imageUrl || '').trim());
  const hasTextBlock = Boolean(trimmedLogo || trimmedTitle || trimmedSubtitle);
  const hasAnyContent = Boolean(hasTextBlock || trimmedButton);

  if (!hasImage && !hasAnyContent) {
    return null;
  }

  const heightClasses =
    aspectHeight === 'tall'
      ? 'min-h-[260px] sm:min-h-[310px] md:min-h-[365px]'
      : aspectHeight === 'narrow'
      ? 'min-h-[135px] sm:min-h-[160px] md:min-h-[190px]'
      : 'min-h-[200px] sm:min-h-[240px] md:min-h-[280px]';

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trimmedUrl) return;
    if (trimmedUrl.startsWith('/') && onNavigateInternal) {
      onNavigateInternal(trimmedUrl);
    } else if (/^https?:\/\//i.test(trimmedUrl)) {
      window.open(trimmedUrl, '_blank', 'noopener,noreferrer');
    } else if (trimmedUrl.startsWith('/')) {
      window.location.assign(trimmedUrl);
    } else {
      window.open(`https://${trimmedUrl}`, '_blank', 'noopener,noreferrer');
    }
  };

  // If no button is provided, allow clicking the tile itself if a URL is configured
  const isWholeTileClickable = !trimmedButton && Boolean(trimmedUrl);

  const outerSpacing = insideMoreInfo
    ? isFullBleed
      ? '-mx-6 sm:-mx-8 lg:-mx-12 py-2'
      : 'pr-6 sm:pr-8 lg:pr-12 py-2'
    : isFullBleed
    ? 'w-full px-0 py-1 sm:py-2'
    : 'w-full px-3 sm:px-6 md:px-10 lg:px-14 py-2 sm:py-3';

  const badgePosClass =
    badgePosition === 'top_left'
      ? 'top-3 left-3'
      : 'bottom-3 left-3';

  const isSameSlot = textPosition === buttonPosition;

  const getSlotClasses = (pos: AdTileContentPosition, isStandaloneButton = false): string => {
    if (pos === 'bottom_left') {
      const bottomPad = badgePosition === 'bottom_left' ? 'bottom-9 sm:bottom-10' : 'bottom-4 sm:bottom-6';
      return `absolute ${bottomPad} left-4 sm:left-6 md:left-8 flex flex-col items-start text-left max-w-[78%] sm:max-w-lg`;
    }
    if (pos === 'bottom_right') {
      return `absolute bottom-4 sm:bottom-6 right-4 sm:right-6 md:right-8 flex flex-col items-end text-right ${
        isStandaloneButton ? '' : 'max-w-[78%] sm:max-w-lg'
      }`;
    }
    return 'relative flex flex-col items-center text-center px-6 py-6 sm:py-8 max-w-xl mx-auto';
  };

  const renderTextAndLogo = (align: AdTileContentPosition) => (
    <>
      {trimmedLogo && (
        <img
          src={trimmedLogo}
          alt={trimmedTitle || 'Sponsor Logo'}
          referrerPolicy="no-referrer"
          className={`max-h-10 sm:max-h-12 md:max-h-14 w-auto max-w-[180px] sm:max-w-[220px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] ${
            trimmedTitle || trimmedSubtitle ? 'mb-2 sm:mb-2.5' : ''
          } ${align === 'bottom_left' ? 'self-start' : align === 'bottom_right' ? 'self-end' : 'self-center'}`}
        />
      )}

      {trimmedTitle && (
        <h2 className="text-xl sm:text-2xl md:text-[30px] font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_3px_14px_rgba(0,0,0,0.85)]">
          {trimmedTitle}
        </h2>
      )}

      {trimmedSubtitle && (
        <p className="mt-1.5 text-xs sm:text-sm md:text-[15px] text-zinc-200 font-medium leading-relaxed max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
          {trimmedSubtitle}
        </p>
      )}
    </>
  );

  const renderCtaButton = (withTopMargin: boolean) =>
    trimmedButton ? (
      <button
        type="button"
        onClick={handleOpenLink}
        className={`${
          withTopMargin ? 'mt-3.5 sm:mt-4' : ''
        } px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm tracking-tight shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all active:scale-95 cursor-pointer`}
      >
        {trimmedButton}
      </button>
    ) : null;

  return (
    <section className={outerSpacing}>
      <div
        onClick={isWholeTileClickable ? handleOpenLink : undefined}
        className={`relative w-full overflow-hidden bg-[#101014] select-none ${heightClasses} flex items-center justify-center ${
          isFullBleed
            ? 'rounded-none border-0 shadow-none'
            : 'rounded-2xl sm:rounded-[22px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.65)]'
        } ${isWholeTileClickable ? 'cursor-pointer' : ''}`}
      >
        {/* Background Artwork */}
        {hasImage ? (
          <MediaImage
            src={imageUrl!.trim()}
            fallbackTitle={trimmedTitle || 'Sponsored'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1b1c26] via-[#121218] to-[#0b0b0f]" />
        )}

        {/* Optional Image Glare & Top/Bottom Merge Scrim (can be turned OFF for both padded and zero-padding tiles) */}
        {imageGlare && (
          <>
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background:
                  'radial-gradient(circle at center, rgba(8,8,12,0.52) 0%, rgba(8,8,12,0.72) 65%, rgba(8,8,12,0.86) 100%)'
              }}
            />
            {isFullBleed && hasImage && (
              <>
                <div
                  className="absolute inset-x-0 top-0 h-14 sm:h-16 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to bottom, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0.32) 55%, rgba(20,20,20,0) 100%)'
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-14 sm:h-16 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(20,20,20,0.85) 0%, rgba(20,20,20,0.32) 55%, rgba(20,20,20,0) 100%)'
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Configurable Yellow "AD" Badge (equal top/bottom & left/right container inset) */}
        <div className={`absolute ${badgePosClass} z-30 pointer-events-none`}>
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans shadow-sm">
            AD
          </span>
        </div>

        {/* Optional Top-Right Cross Dismiss Button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            aria-label="Close ad"
            className="absolute top-3 right-3 z-30 w-7 h-7 rounded-full bg-black/45 hover:bg-black/75 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}

        {/* Content & Action Button (either stacked together in same slot or positioned independently) */}
        {isSameSlot ? (
          hasAnyContent && (
            <div className={`z-20 ${getSlotClasses(textPosition)}`}>
              {renderTextAndLogo(textPosition)}
              {renderCtaButton(hasTextBlock)}
            </div>
          )
        ) : (
          <>
            {hasTextBlock && (
              <div className={`z-20 ${getSlotClasses(textPosition)}`}>
                {renderTextAndLogo(textPosition)}
              </div>
            )}
            {trimmedButton && (
              <div className={`z-20 ${getSlotClasses(buttonPosition, true)}`}>
                {renderCtaButton(false)}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
