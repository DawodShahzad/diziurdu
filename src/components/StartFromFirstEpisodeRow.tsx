import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Episode, Show, DetailsOriginMeta } from '../types';
import { ShowCard } from './ShowCard';
import { useDeviceLayout } from '../utils/deviceLayout';

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

const FIRST_EP_SHUFFLE_STORAGE_KEY = 'cineflix_first_ep_random_10_v1';
const TEN_MINUTES_MS = 10 * 60 * 1000;

const fisherYatesShuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

let hasStartEp1RowLoaded = false;
const cachedStartEp1Indices = new Set<number>([0, 1, 2, 3, 4]);

export const StartFromFirstEpisodeRow: React.FC<StartFromFirstEpisodeRowProps> = ({
  shows,
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
  const { isMobile } = useDeviceLayout();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [navBox, setNavBox] = useState<{ top: number; height: number } | null>(null);
  const [isRowInViewport, setIsRowInViewport] = useState(hasStartEp1RowLoaded || !deferInitialLoad);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(() => new Set(cachedStartEp1Indices));

  // Show 10 random series in shuffled order; refreshes with a new random 10 shuffle after 10 minutes on page refresh
  const items = useMemo(() => {
    const eligibleSeries = shows.filter((s) => {
      if (s.type !== 'series') return false;
      return Boolean(getFirstEpisode(s));
    });

    if (eligibleSeries.length === 0) return [];

    const byId = new Map<string, Show>(eligibleSeries.map((s) => [s.id, s]));
    let selectedShows: Show[] = [];

    try {
      const raw = localStorage.getItem(FIRST_EP_SHUFFLE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { timestamp?: number; ids?: string[] };
        if (
          typeof parsed.timestamp === 'number' &&
          Array.isArray(parsed.ids) &&
          Date.now() - parsed.timestamp < TEN_MINUTES_MS
        ) {
          const validFromCache = parsed.ids
            .map((id) => byId.get(id))
            .filter((s): s is Show => Boolean(s));
          if (validFromCache.length > 0) {
            selectedShows = validFromCache.slice(0, 10);
            if (selectedShows.length < 10 && eligibleSeries.length > selectedShows.length) {
              const existingIds = new Set(selectedShows.map((s) => s.id));
              const remaining = fisherYatesShuffle(
                eligibleSeries.filter((s) => !existingIds.has(s.id))
              );
              selectedShows = [...selectedShows, ...remaining].slice(0, 10);
            }
          }
        }
      }
    } catch {
      // Ignore storage read errors
    }

    if (selectedShows.length === 0) {
      selectedShows = fisherYatesShuffle(eligibleSeries).slice(0, 10);
      try {
        localStorage.setItem(
          FIRST_EP_SHUFFLE_STORAGE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            ids: selectedShows.map((s) => s.id)
          })
        );
      } catch {
        // Ignore storage write errors
      }
    }

    return selectedShows
      .map((show) => {
        const ep = getFirstEpisode(show);
        if (!ep) return null;
        return { show, episode: ep };
      })
      .filter((item): item is { show: Show; episode: Episode } => Boolean(item));
  }, [shows]);

  // Feed-by-feed vertical gating (cached once loaded)
  useEffect(() => {
    if (isRowInViewport) {
      hasStartEp1RowLoaded = true;
      return;
    }
    const el = rowRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          hasStartEp1RowLoaded = true;
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
                  cachedStartEp1Indices.add(idx);
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

  const updateNavBox = () => {
    const el = scrollRef.current;
    const parentEl = el?.parentElement;
    if (!el || !parentEl) return;
    const thumbEl = (el.querySelector('[data-card-thumb="true"]') ||
      el.querySelector('[data-show-card="true"]')) as HTMLElement | null;
    if (!thumbEl) return;
    const parentRect = parentEl.getBoundingClientRect();
    const thumbRect = thumbEl.getBoundingClientRect();
    const height = Math.round(thumbRect.height);
    if (height > 0) {
      setNavBox({ top: Math.round(thumbRect.top - parentRect.top), height });
    }
  };

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    updateNavBox();
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
    const firstThumb = (el.querySelector('[data-card-thumb="true"]') || el.querySelector('[data-show-card="true"]')) as HTMLElement | null;
    if (firstThumb) ro.observe(firstThumb);
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

  if (isMobile || items.length === 0) return null;

  return (
    <section
      ref={rowRef}
      data-feed-strip="true"
      className="relative group/epstrip w-full select-none my-2 sm:my-3 z-0"
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
            </div>
          ))}
        </div>
      ) : (
        <div className="relative w-full">
          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              aria-label="Scroll left"
              style={{
                top: navBox ? `${navBox.top}px` : '4px',
                height: navBox ? `${navBox.height}px` : 'calc(100% - 8px)',
                background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
              }}
              className="group/nav absolute left-0 z-30 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 opacity-0 group-hover/epstrip:opacity-100 transition-opacity duration-200 select-none"
            >
              <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              aria-label="Scroll right"
              style={{
                top: navBox ? `${navBox.top}px` : '4px',
                height: navBox ? `${navBox.height}px` : 'calc(100% - 8px)',
                background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
              }}
              className="group/nav absolute right-0 z-30 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 opacity-0 group-hover/epstrip:opacity-100 transition-opacity duration-200 select-none"
            >
              <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex items-start gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-3.5 sm:pr-4 md:pr-8 xl:pr-12 py-1"
          >
            {items.map(({ show, episode }, index) => {
              const epThumb = episode.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl || '';
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
