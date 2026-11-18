import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Episode, Show, DetailsOriginMeta } from '../types';
import { ShowCard } from './ShowCard';

interface StartFromFirstEpisodeRowProps {
  shows: Show[];
  selectedShowIds?: string[];
  onPlayEpisode: (show: Show, episode: Episode) => void;
  onOpenDetails?: (show: Show, originMeta?: DetailsOriginMeta) => void;
  watchlist?: string[];
  onToggleWatchlist?: (showId: string) => void;
  onIncrementPoints?: (showId: string) => void;
  desktopPopoutStyle?: 'classic' | 'overlay_red' | 'immersive_fade';
  deferInitialLoad?: boolean;
}

const getFirstEpisode = (show: Show): Episode | null => {
  if (!show.seasons || show.seasons.length === 0) return null;
  const s1 =
    show.seasons.find((s) => s.seasonNumber === 1 && s.episodes && s.episodes.length > 0) ||
    show.seasons.find((s) => s.episodes && s.episodes.length > 0);
  if (!s1 || !s1.episodes || s1.episodes.length === 0) return null;
  return (
    s1.episodes.find((ep) => ep.episodeNumber === 1) ||
    s1.episodes[0] ||
    null
  );
};

export const StartFromFirstEpisodeRow: React.FC<StartFromFirstEpisodeRowProps> = ({
  shows,
  selectedShowIds,
  onPlayEpisode,
  onOpenDetails,
  watchlist = [],
  onToggleWatchlist,
  onIncrementPoints,
  desktopPopoutStyle = 'classic',
  deferInitialLoad = true
}) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isRowInViewport, setIsRowInViewport] = useState(!deferInitialLoad);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4]));

  const items = useMemo(() => {
    const episodic = shows.filter((s) => {
      const ep1 = getFirstEpisode(s);
      return Boolean(ep1);
    });

    let ordered: Show[] = [];
    if (selectedShowIds && selectedShowIds.length > 0) {
      ordered = selectedShowIds
        .map((id) => episodic.find((s) => s.id === id))
        .filter((s): s is Show => Boolean(s));
    }
    if (ordered.length === 0) {
      ordered = episodic;
    }

    return ordered
      .map((show) => {
        const ep = getFirstEpisode(show);
        if (!ep) return null;
        return { show, episode: ep };
      })
      .filter((item): item is { show: Show; episode: Episode } => Boolean(item));
  }, [shows, selectedShowIds]);

  // Feed-by-feed vertical gating
  useEffect(() => {
    const el = rowRef.current;
    if (!el || isRowInViewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRowInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isRowInViewport]);

  // Horizontal in-view card loading gating
  useEffect(() => {
    if (!isRowInViewport) return;
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setLoadedIndices((prev) => {
          let changed = false;
          const next = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const rawIdx = (entry.target as HTMLElement).dataset.epCardIndex;
              if (rawIdx !== undefined) {
                const idx = Number(rawIdx);
                if (!next.has(idx)) {
                  next.add(idx);
                  changed = true;
                }
              }
            }
          });
          return changed ? next : prev;
        });
      },
      { root: container, rootMargin: '0px 120px 0px 120px', threshold: 0.01 }
    );

    const nodes = container.querySelectorAll('[data-ep-card-index]');
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [isRowInViewport, items.length]);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const rafId = requestAnimationFrame(checkScroll);
    const el = scrollRef.current;
    if (!el) return () => cancelAnimationFrame(rafId);

    const handleWheel = (e: WheelEvent) => {
      const firstCard = (el.querySelector('[data-card-thumb="true"]') || el.querySelector('[data-show-card="true"]')) as HTMLElement | null;
      if (!firstCard) return;
      const cardRect = firstCard.getBoundingClientRect();
      const y = e.clientY;
      if (y < cardRect.top || y > cardRect.bottom) {
        e.preventDefault();
        if (Math.abs(e.deltaY) > 0) {
          window.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
        }
      }
    };

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    el.addEventListener('scroll', checkScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
    };
  }, [items.length, isRowInViewport]);

  const handleScroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.78;
    el.scrollBy({ left: dir === 'left' ? -step : step, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section
      ref={rowRef}
      data-feed-strip="true"
      className="hidden md:block relative group/epstrip w-full select-none my-2 sm:my-3 z-0"
    >
      {/* Title tightly above row */}
      <div className="relative z-20 w-full pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-2.5 sm:pr-4 md:pr-8 xl:pr-12 mb-1 sm:mb-1.5">
        {!isRowInViewport ? (
          <div className="w-52 h-5 sm:h-6 rounded skeleton-wave" />
        ) : (
          <h3 className="text-[15px] sm:text-base md:text-[17px] font-semibold text-white/95 tracking-tight">
            Start from the 1st Episode
          </h3>
        )}
      </div>

      {!isRowInViewport ? (
        <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-hidden pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-3.5 sm:pr-4 md:pr-8 xl:pr-12 py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`ep-skel-${i}`}
              className="shrink-0 w-[calc((100vw-20px)/2.12)] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]"
            >
              <div
                className="w-full aspect-video rounded-[6px] md:rounded-[10px] skeleton-wave"
                style={{ animationDelay: `${i * 150}ms` }}
              />
              <div
                className="mt-2 w-2/3 h-4 rounded skeleton-wave"
                style={{ animationDelay: `${i * 150}ms` }}
              />
              <div
                className="mt-1.5 w-1/3 h-3 rounded skeleton-wave"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-full">
          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              className="group/nav absolute left-0 top-1 h-[calc(((100vw-112px)/4.05)*0.5625)] max-h-[192px] z-30 w-11 sm:w-12 md:w-14 rounded-r-xl rounded-l-none bg-black/35 text-white flex items-center justify-center cursor-pointer border-0 opacity-0 group-hover/epstrip:opacity-100 transition-opacity duration-200"
            >
              <ChevronLeft className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              className="group/nav absolute right-0 top-1 h-[calc(((100vw-112px)/4.05)*0.5625)] max-h-[192px] z-30 w-11 sm:w-12 md:w-14 rounded-l-xl rounded-r-none bg-black/35 text-white flex items-center justify-center cursor-pointer border-0 opacity-0 group-hover/epstrip:opacity-100 transition-opacity duration-200"
            >
              <ChevronRight className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-3.5 sm:pr-4 md:pr-8 xl:pr-12 py-1"
          >
            {items.map(({ show, episode }, index) => {
              const epThumb = episode.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl || '';
              const primaryGenre = show.genres?.[0] || 'Drama';
              const maturity = show.maturityRating || '16+';
              const epDuration = episode.duration || '45m';
              const deferImage = !loadedIndices.has(index);

              return (
                <div
                  key={`ep1-${show.id}-${episode.id}`}
                  data-ep-card-index={index}
                  className="shrink-0"
                >
                  <ShowCard
                    show={show}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    isInWatchlist={watchlist.includes(show.id)}
                    onToggleWatchlist={(id) => onToggleWatchlist?.(id)}
                    onOpenDetails={(s, meta) => {
                      if (onOpenDetails) {
                        onOpenDetails(s, meta);
                      } else {
                        onPlayEpisode(s, episode);
                      }
                    }}
                    onPlay={(s) => onPlayEpisode(s, episode)}
                    onIncrementPoints={(id) => onIncrementPoints?.(id)}
                    disableVideoPreview={true}
                    popoutStyle={desktopPopoutStyle}
                    customPosterUrl={epThumb}
                    durationChip={epDuration}
                    episodeTitle={episode.title || 'Episode 1'}
                    episodeSublabel={`${primaryGenre} • ${maturity}`}
                    showOverlayLogoOnCard={true}
                    deferImageLoad={deferImage}
                    skeletonDelayMs={index * 150}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
