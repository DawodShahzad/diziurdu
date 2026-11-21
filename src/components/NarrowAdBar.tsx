import React from 'react';
import { X } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface NarrowAdBarProps {
  imageUrl?: string;
  logoImageUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  placement?: 'bottom_floating' | 'top_banner';
  badgePosition?: 'top_left' | 'bottom_left';
  textPosition?: 'left' | 'center' | 'right';
  buttonPosition?: 'left' | 'center' | 'right';
  showCloseButton?: boolean;
  isMobile?: boolean;
  onDismiss: () => void;
  onNavigateInternal?: (path: string) => void;
}

export const NarrowAdBar: React.FC<NarrowAdBarProps> = ({
  imageUrl,
  logoImageUrl = '',
  title = '',
  subtitle = '',
  buttonText = '',
  buttonUrl = '',
  placement = 'bottom_floating',
  badgePosition = 'top_left',
  textPosition = 'left',
  buttonPosition = 'right',
  showCloseButton = true,
  isMobile = false,
  onDismiss,
  onNavigateInternal
}) => {
  const trimmedTitle = title.trim();
  const trimmedSubtitle = subtitle.trim();
  const trimmedButton = buttonText.trim();
  const trimmedUrl = buttonUrl.trim();
  const trimmedLogo = logoImageUrl.trim();
  const hasImage = Boolean((imageUrl || '').trim());
  const hasTextOrLogo = Boolean(trimmedLogo || trimmedTitle || trimmedSubtitle);

  if (!hasImage && !hasTextOrLogo && !trimmedButton) {
    return null;
  }

  const openDestination = () => {
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

  const handleBarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If admin did NOT type button text: clicking the whole bar opens link if present, otherwise dismisses it
    if (!trimmedButton) {
      if (trimmedUrl) {
        openDestination();
      } else {
        onDismiss();
      }
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (trimmedUrl) {
      openDestination();
    } else {
      onDismiss();
    }
  };

  const positionClass =
    placement === 'top_banner'
      ? isMobile
        ? 'fixed top-14 left-3 right-3 z-[48]'
        : 'fixed top-[72px] left-1/2 -translate-x-1/2 w-[min(94vw,1080px)] z-[48]'
      : isMobile
      ? 'fixed bottom-[78px] left-3 right-3 z-[48]'
      : 'fixed bottom-4 left-1/2 -translate-x-1/2 w-[min(94vw,1080px)] z-[48]';

  const badgePosClass =
    badgePosition === 'bottom_left' ? 'bottom-2.5 left-2.5' : 'top-2.5 left-2.5';

  const renderTextBlock = () =>
    hasTextOrLogo ? (
      <div
        className={`flex items-center gap-2 sm:gap-3 min-w-0 ${
          textPosition === 'center'
            ? 'justify-center text-center'
            : textPosition === 'right'
            ? 'justify-end text-right'
            : 'justify-start text-left'
        }`}
      >
        {trimmedLogo && (
          <img
            src={trimmedLogo}
            alt={trimmedTitle || 'Sponsor Logo'}
            referrerPolicy="no-referrer"
            className="h-7 sm:h-9 md:h-10 w-auto max-w-[110px] sm:max-w-[140px] object-contain shrink-0 drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)]"
          />
        )}
        {(trimmedTitle || trimmedSubtitle) && (
          <div className="min-w-0 flex flex-col">
            {trimmedTitle && (
              <span className="text-xs sm:text-base md:text-lg font-extrabold text-white tracking-tight truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                {trimmedTitle}
              </span>
            )}
            {trimmedSubtitle && (
              <span className="text-[11px] sm:text-xs text-white/85 font-medium truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                {trimmedSubtitle}
              </span>
            )}
          </div>
        )}
      </div>
    ) : null;

  const renderCta = () =>
    trimmedButton ? (
      <button
        type="button"
        onClick={handleButtonClick}
        className="shrink-0 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] sm:text-sm tracking-tight shadow-lg transition-all active:scale-95 cursor-pointer"
      >
        {trimmedButton}
      </button>
    ) : null;

  const isWholeBarClickable = !trimmedButton;

  return (
    <div className={`${positionClass} animate-in fade-in slide-in-from-bottom-2 duration-250`}>
      <div
        onClick={isWholeBarClickable ? handleBarClick : undefined}
        role={isWholeBarClickable ? 'button' : undefined}
        className={`relative w-full h-[58px] sm:h-[68px] md:h-[76px] rounded-[8px] sm:rounded-[10px] overflow-hidden bg-[#0b0d14] border-0 shadow-[0_14px_40px_rgba(0,0,0,0.72)] flex items-center select-none ${
          isWholeBarClickable ? 'cursor-pointer' : ''
        }`}
      >
        {/* Exact Recommendation Container Border Style, Color & Opacity */}
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border-[1.8px] md:border-[2.5px] border-zinc-400/[0.09]" />

        {/* Background Artwork */}
        {hasImage ? (
          <MediaImage
            src={imageUrl!.trim()}
            fallbackTitle={trimmedTitle || 'Sponsored'}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1224] via-[#131d38] to-[#0a0e1b]" />
        )}

        {/* Subtle legibility gradient only when text or logo is shown */}
        {hasTextOrLogo && (
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to right, rgba(4,8,20,0.68) 0%, rgba(4,8,20,0.34) 55%, rgba(4,8,20,0.5) 100%)'
            }}
          />
        )}

        {/* Configurable Yellow "AD" Badge (equal top/bottom & left/right container inset) */}
        <div className={`absolute ${badgePosClass} z-30 pointer-events-none`}>
          <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans shadow-sm">
            AD
          </span>
        </div>

        {/* 3-Slot Content Layout: Left / Center / Right */}
        <div
          className={`relative z-20 w-full h-full grid grid-cols-3 items-center gap-2 pl-10 sm:pl-11 ${
            showCloseButton ? 'pr-9 sm:pr-11' : 'pr-4 sm:pr-6'
          }`}
        >
          {/* Left Slot */}
          <div className="flex items-center justify-start gap-2.5 min-w-0">
            {textPosition === 'left' && renderTextBlock()}
            {buttonPosition === 'left' && renderCta()}
          </div>

          {/* Center Slot */}
          <div className="flex items-center justify-center gap-2.5 min-w-0">
            {textPosition === 'center' && renderTextBlock()}
            {buttonPosition === 'center' && renderCta()}
          </div>

          {/* Right Slot */}
          <div className="flex items-center justify-end gap-2.5 min-w-0">
            {textPosition === 'right' && renderTextBlock()}
            {buttonPosition === 'right' && renderCta()}
          </div>
        </div>

        {/* Optional Top-Right Cross Dismiss Button (matching top/right inset) */}
        {showCloseButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            aria-label="Close ad bar"
            className="absolute top-2.5 right-2.5 z-40 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/55 hover:bg-black/80 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </div>
  );
};
