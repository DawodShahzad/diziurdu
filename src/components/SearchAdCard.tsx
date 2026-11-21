import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface SearchAdCardProps {
  imageUrl?: string;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  onNavigateInternal?: (path: string) => void;
  /** 'mobile_row' matches Mobile Search Recommended For You row; 'desktop_card' matches Desktop Search grid card */
  variant?: 'mobile_row' | 'desktop_card';
  compact?: boolean;
}

export const SearchAdCard: React.FC<SearchAdCardProps> = ({
  imageUrl,
  badgeText = 'AD',
  title = '',
  subtitle = '',
  buttonUrl = '',
  onNavigateInternal,
  variant,
  compact = false
}) => {
  const resolvedVariant = variant || (compact ? 'mobile_row' : 'desktop_card');
  const trimmedTitle = title.trim();
  const trimmedSubtitle = subtitle.trim();
  const rawBadge = (badgeText || '').trim();
  const trimmedBadge = !rawBadge || rawBadge.toLowerCase() === 'ad' ? 'AD' : rawBadge.toUpperCase();
  const trimmedUrl = buttonUrl.trim();
  const hasImage = Boolean((imageUrl || '').trim());

  if (!trimmedTitle && !trimmedSubtitle && !hasImage) {
    return null;
  }

  const handleOpen = (e: React.MouseEvent) => {
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

  if (resolvedVariant === 'mobile_row') {
    // Exact Mobile "Recommended For You" row card UI: Title on top, yellow Ad badge right below
    return (
      <div
        onClick={handleOpen}
        role="button"
        className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-all active:scale-[0.99] select-none"
      >
        <div className="w-24 h-14 rounded-md overflow-hidden shrink-0 bg-zinc-900">
          {hasImage ? (
            <MediaImage
              src={imageUrl!.trim()}
              fallbackTitle={trimmedTitle || 'Ad'}
              fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-1.5 text-center select-none"
              fallbackTextClassName="text-white/95 font-semibold text-[11px] leading-tight line-clamp-2 break-words font-sans"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center text-[11px] font-bold text-white/70">
              {trimmedBadge}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {trimmedTitle && (
            <p className="text-sm font-semibold text-white truncate">{trimmedTitle}</p>
          )}
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans shrink-0">
              {trimmedBadge}
            </span>
            {trimmedSubtitle && (
              <span className="text-xs text-zinc-400 truncate">{trimmedSubtitle}</span>
            )}
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-zinc-500 mr-1 shrink-0" />
      </div>
    );
  }

  // Desktop "Recommended For You" Card UI: landscape 16:9 card matching ShowCard grid, title on top & yellow Ad badge right below
  return (
    <div
      onClick={handleOpen}
      role="button"
      className="group relative flex flex-col cursor-pointer select-none"
    >
      <div className="relative w-full aspect-video rounded-[8px] md:rounded-[10px] overflow-hidden bg-[#181818] shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
        {hasImage ? (
          <MediaImage
            src={imageUrl!.trim()}
            fallbackTitle={trimmedTitle || 'Ad'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1b1c26] via-[#14141a] to-[#0a0a0e]" />
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)'
          }}
        />
        <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col items-start min-w-0">
          {trimmedTitle && (
            <p className="text-sm font-bold text-white leading-snug truncate w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {trimmedTitle}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-1 min-w-0 max-w-full">
            <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans shrink-0 shadow-sm">
              {trimmedBadge}
            </span>
            {trimmedSubtitle && (
              <span className="text-[11px] text-zinc-300 font-medium truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                {trimmedSubtitle}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
