import React, { useEffect, useState, useRef } from 'react';
import { Show } from '../types';
import { X, Play, Film, Plus, Check, Info } from 'lucide-react';

interface MobilePosterActionSheetProps {
  show: Show | null;
  isOpen: boolean;
  onClose: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (showId: string) => void;
  onPlayShow: (show: Show) => void;
  onWatchTrailer: (show: Show) => void;
  onOpenDetails: (show: Show) => void;
}

export const MobilePosterActionSheet: React.FC<MobilePosterActionSheetProps> = ({
  show,
  isOpen,
  onClose,
  isInWatchlist,
  onToggleWatchlist,
  onPlayShow,
  onWatchTrailer,
  onOpenDetails
}) => {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;
    const sheetHeight = sheetRef.current?.offsetHeight || 320;
    if (dragY > sheetHeight * 0.3) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
    touchStartYRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartYRef.current = e.clientY;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (touchStartYRef.current === null) return;
      const deltaY = moveEvent.clientY - touchStartYRef.current;
      setDragY(deltaY > 0 ? deltaY : 0);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (touchStartYRef.current !== null) {
        const deltaY = upEvent.clientY - touchStartYRef.current;
        const sheetHeight = sheetRef.current?.offsetHeight || 320;
        if (deltaY > sheetHeight * 0.3) {
          onClose();
        }
      }
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isOpen || !show) return null;

  // Extract maturity number
  const maturityNumber = show.maturityRating?.replace(/[^0-9]/g, '') || '16';
  const isSeries = show.type === 'series';
  const playLabel = isSeries ? 'Play Episode 1' : 'Play Movie';

  // Release year (clean 4-digit or range)
  const releaseYearBadge = show.releaseYear ? show.releaseYear.split('-')[0].trim() : '';

  // Only show what admin sets in durationOrSeasons (no dual episodes + seasons display)
  const adminDurationOrSeasons = show.durationOrSeasons?.trim() || '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Bottom Sheet Menu: halved passing padding pb-14 / 56px */}
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="w-full max-h-[85vh] overflow-y-auto bg-[#0d0e14] border-t border-white/10 rounded-t-3xl px-5 pt-1.5 pb-[max(env(safe-area-inset-bottom),56px)] shadow-2xl animate-in slide-in-from-bottom duration-250 select-none custom-scrollbar relative"
      >
        {/* Swiping bar does NOT stick (it moves naturally when user scrolls down) */}
        <div
          className="pt-1.5 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onMouseDown={handleMouseDown}
        >
          <div className="w-10 h-1 bg-white/60 hover:bg-white/80 rounded-full shadow-sm" />
        </div>

        {/* ONLY cross button sticks to top right with no background behind it */}
        <div className="sticky top-2 z-40 pointer-events-none flex justify-end -mb-8">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors pointer-events-auto shadow-md"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Show Title */}
        <div className="pt-2 pb-0.5 pr-8">
          <h3 className="text-lg font-bold text-white tracking-tight truncate">
            {show.title}
          </h3>
        </div>

        {/* Badges: Age Maturity, Release Year, and ONLY what admin set (never both episodes and seasons) */}
        <div className="my-1.5 flex items-center gap-1.5 flex-wrap select-none">
          {/* Maturity Rating Badge */}
          <span className="inline-flex items-center justify-center min-w-5.5 px-1.5 h-5.5 rounded bg-[#0071eb] text-white text-[11px] font-bold shadow-sm">
            {maturityNumber}
          </span>

          {/* Release Year */}
          {releaseYearBadge && (
            <span className="inline-flex items-center justify-center px-1.5 h-5.5 rounded bg-zinc-800 text-zinc-200 text-[11px] font-semibold shadow-sm border border-white/10">
              {releaseYearBadge}
            </span>
          )}

          {/* Only Admin Duration / Seasons */}
          {adminDurationOrSeasons && (
            <span className="inline-flex items-center justify-center px-2 h-5.5 rounded bg-zinc-800 text-zinc-200 text-[11px] font-semibold shadow-sm border border-white/10">
              {adminDurationOrSeasons}
            </span>
          )}
        </div>

        {/* Actions List: compact spacing */}
        <div className="space-y-0.5 pt-0.5">
          {/* 1. Watch trailer */}
          <button
            onClick={() => {
              onClose();
              onWatchTrailer(show);
            }}
            className="w-full flex items-center gap-3.5 py-2 px-2 rounded-lg text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left"
          >
            <div className="w-5 flex items-center justify-center">
              <Film className="w-4.5 h-4.5 text-white/90" />
            </div>
            <span className="text-sm font-semibold">Watch trailer</span>
          </button>

          {/* 2. Play Episode 1 / Play Movie */}
          <button
            onClick={() => {
              onClose();
              onPlayShow(show);
            }}
            className="w-full flex items-center gap-3.5 py-2 px-2 rounded-lg text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left"
          >
            <div className="w-5 flex items-center justify-center">
              <Play className="w-4.5 h-4.5 fill-white text-white" />
            </div>
            <span className="text-sm font-semibold">{playLabel}</span>
          </button>

          {/* 3. Watchlist */}
          <button
            onClick={() => {
              onToggleWatchlist(show.id);
            }}
            className="w-full flex items-center gap-3.5 py-2 px-2 rounded-lg text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left"
          >
            <div className="w-5 flex items-center justify-center">
              {isInWatchlist ? (
                <Check className="w-4.5 h-4.5 text-emerald-400" />
              ) : (
                <Plus className="w-4.5 h-4.5 text-white/90" />
              )}
            </div>
            <span className="text-sm font-semibold">
              {isInWatchlist ? 'In Watchlist' : 'Watchlist'}
            </span>
          </button>

          {/* 4. More details */}
          <button
            onClick={() => {
              onClose();
              onOpenDetails(show);
            }}
            className="w-full flex items-center gap-3.5 py-2 px-2 rounded-lg text-white hover:bg-white/10 active:bg-white/15 transition-colors cursor-pointer text-left"
          >
            <div className="w-5 flex items-center justify-center">
              <Info className="w-4.5 h-4.5 text-white/90" />
            </div>
            <span className="text-sm font-semibold">More details</span>
          </button>
        </div>
      </div>
    </div>
  );
};
