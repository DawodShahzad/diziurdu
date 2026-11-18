import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface AlertPosterModalProps {
  isOpen: boolean;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonAction?: 'close' | 'link' | 'login';
  buttonUrl?: string;
  onClose: () => void;
  onOpenLogin: () => void;
  onNavigateInternal?: (url: string) => void;
}

export const AlertPosterModal: React.FC<AlertPosterModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Traveling',
  subtitle = "Your access to movies, TV, and add-on subscriptions vary while you're abroad",
  buttonText = 'Close',
  buttonAction = 'close',
  buttonUrl,
  onClose,
  onOpenLogin,
  onNavigateInternal
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleActionClick = () => {
    if (buttonAction === 'login') {
      onClose();
      onOpenLogin();
      return;
    }
    if (buttonAction === 'link' && buttonUrl && buttonUrl.trim()) {
      const target = buttonUrl.trim();
      onClose();
      if (target.startsWith('/') && onNavigateInternal) {
        onNavigateInternal(target);
      } else {
        window.location.assign(target);
      }
      return;
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[220] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[780px] aspect-[4/3] sm:aspect-[16/9] rounded-2xl md:rounded-[22px] overflow-hidden bg-[#141418] border-0 shadow-[0_28px_90px_rgba(0,0,0,0.92)] flex flex-col justify-end animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top-Right Close X Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close alert"
          className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
        >
          <X className="w-4.5 h-4.5 stroke-[2.4]" />
        </button>

        {/* Full-Bleed Poster Image (zero dark glare gradient overlay) */}
        {imageUrl && imageUrl.trim() ? (
          <MediaImage
            src={imageUrl.trim()}
            fallbackTitle={title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              background:
                'radial-gradient(circle at 75% 30%, rgba(225,29,72,0.45) 0%, rgba(20,20,28,0.95) 60%, #09090b 100%)'
            }}
          />
        )}

        {/* Bottom-Left Overlay Content + Recommendation-Style White Pill Button */}
        <div className="relative z-20 p-6 sm:p-8 md:p-10 max-w-lg text-left">
          {title && title.trim() && (
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
              {title}
            </h2>
          )}

          {subtitle && subtitle.trim() && (
            <p className="text-xs sm:text-sm md:text-[15px] text-zinc-100 font-medium leading-snug mt-2 drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)]">
              {subtitle}
            </p>
          )}

          <button
            type="button"
            onClick={handleActionClick}
            className="mt-4 sm:mt-5 px-7 py-2.5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            {buttonText || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
