import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Show, FeedConfig, DetailsOriginMeta } from '../types';
import { ShowCard, triggerGlobalScroll, getGlobalMousePos } from './ShowCard';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Plus, Check, Loader2 } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { attachHlsVideo } from '../utils/hlsHelper';
import { WatchProgressItem } from '../utils/watchProgress';
import { MediaImage } from './MediaImage';
import { ModernRankNumber } from './ModernRankNumber';
import { useDeviceLayout } from '../utils/deviceLayout';
import { useTopmostAutoPreview } from '../utils/autoPreviewCoordinator';

interface FeedStripProps {
  feed: FeedConfig;
  shows: Show[];
  customShows?: Show[];
  watchlist: string[];
  watchHistory?: Record<string, WatchProgressItem>;
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show, originMeta?: DetailsOriginMeta) => void;
  onPlayShow: (show: Show) => void;
  onIncrementPoints: (showId: string) => void;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (forcedValue?: boolean) => void;
  onHoverCardStart?: () => void;
  onHoverCardEnd?: () => void;
  onExploreSpecialFeed?: (feed: FeedConfig, shows: Show[]) => void;
  onEditFeed?: (feedId: string) => void;
  isMobile?: boolean;
  isTablet?: boolean;
  onLongPressShow?: (show: Show) => void;
  enableStretchableCards?: boolean;
  showTop10Badges?: boolean;
  modernTop10RankList?: boolean;
  top10RankStyle?: 'classic' | 'modern' | 'inside_card';
  likedShowIds?: string[];
  onToggleLike?: (showId: string) => void;
  feedIndex?: number;
  isPaused?: boolean;
  desktopPopoutStyle?: 'classic' | 'overlay_red' | 'immersive_fade';
  onOpenTop10Page?: (mode: 'series' | 'movies') => void;
}

// Global Active Feed Strip tracking:
// Guarantees that STRICTLY ONLY 1 ROW shows left/right navigation badges at a time, never ever 2 at a time.
let globalActiveFeedId: string | null = null;
const globalFeedListeners = new Set<(activeId: string | null) => void>();

// Persistent session cache so once a feed row has loaded, moving back and forth between tabs/pages never flashes skeletons
const loadedFeedRowIdsCache = new Set<string>();
const loadedFeedCardIndicesCache = new Map<string, Set<number>>();

export const setGlobalActiveFeedId = (feedId: string | null) => {
  if (globalActiveFeedId !== feedId) {
    globalActiveFeedId = feedId;
    globalFeedListeners.forEach((fn) => fn(feedId));
  }
};

export const useActiveFeedId = () => {
  const [activeId, setActiveId] = useState<string | null>(globalActiveFeedId);
  useEffect(() => {
    const fn = (newId: string | null) => setActiveId(newId);
    globalFeedListeners.add(fn);
    return () => {
      globalFeedListeners.delete(fn);
    };
  }, []);
  return activeId;
};

export const FeedStrip: React.FC<FeedStripProps> = ({
  feed,
  shows,
  customShows,
  watchlist,
  watchHistory,
  onToggleWatchlist,
  onOpenDetails,
  onPlayShow,
  onIncrementPoints,
  isGlobalMuted,
  onToggleGlobalMute,
  onHoverCardStart,
  onHoverCardEnd,
  onExploreSpecialFeed,
  onEditFeed,
  isMobile = false,
  isTablet = false,
  onLongPressShow,
  enableStretchableCards = false,
  showTop10Badges = true,
  modernTop10RankList = false,
  top10RankStyle,
  likedShowIds,
  onToggleLike,
  feedIndex = 0,
  isPaused = false,
  desktopPopoutStyle = 'classic',
  onOpenTop10Page
}) => {
  const { isMobile: detectedMobile, isLandscape, height: viewportHeight } = useDeviceLayout();
  const isShortLandscape = Boolean((isMobile || detectedMobile) && isLandscape && viewportHeight <= 560);
  const [userBiggerCards, setUserBiggerCards] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cineflix_bigger_cards') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const syncBiggerCards = () => {
      try {
        setUserBiggerCards(localStorage.getItem('cineflix_bigger_cards') === 'true');
      } catch {
        setUserBiggerCards(false);
      }
    };
    window.addEventListener('cineflix_bigger_cards_changed', syncBiggerCards);
    window.addEventListener('storage', syncBiggerCards);
    return () => {
      window.removeEventListener('cineflix_bigger_cards_changed', syncBiggerCards);
      window.removeEventListener('storage', syncBiggerCards);
    };
  }, []);

  // Bigger feed cards ONLY apply in mobile vertical/portrait orientation (never landscape, never desktop)
  const isMobileLandscapeLayout = Boolean((isMobile || detectedMobile) && isLandscape);
  const effectiveBiggerCards = Boolean((isMobile || detectedMobile) && !isLandscape && userBiggerCards);

  const effectiveTop10Style: 'classic' | 'modern' | 'inside_card' =
    top10RankStyle || (modernTop10RankList === false ? 'classic' : 'modern');
  const isContinueWatchingFeed =
    feed.id.includes('continue-watching') ||
    feed.title.toLowerCase().includes('continue watching') ||
    feed.title.toLowerCase().includes('keep watching');

  const isWatchlistFeed =
    feed.id === 'watchlist' ||
    feed.id.includes('watchlist') ||
    feed.categoryKey === 'watchlist' ||
    feed.title.toLowerCase().includes('my list') ||
    feed.title.toLowerCase().includes('watchlist');
  
  // Only feeds explicitly marked by admin as stretchable (feed.isStretchableFeed) stretch on desktop.
  // Normal desktop feeds stay landscape 16:9 with popout preview.
  const isStretchableFeed = Boolean(
    feed.isStretchableFeed &&
      !isMobile &&
      !isTablet &&
      !isContinueWatchingFeed
  );

  // In tablet view or mobile view, the titles in the special feed are ALWAYS in landscape 16:9 as in desktop view.
  // In mobile and tablet layout, stretch feed uses aspect ratio 9:16.
  // In mobile layout, My List feed uses normal 2:3 poster cards (3 cards + edge of 4th).
  // Standard feeds on mobile use 2:3.
  // Normal desktop and tablet feeds use landscape 16:9.
  const cardAspectRatio = isContinueWatchingFeed
    ? '16:9'
    : feed.isSpecialFeed
    ? '16:9'
    : feed.isStretchableFeed
    ? '9:16'
    : isMobile
    ? '2:3'
    : '16:9';

  // Normal landscape feeds on desktop keep their preview popout.
  const disablePopout = Boolean(isMobile || isTablet || isStretchableFeed);

  const feedStripRef = useRef<HTMLDivElement>(null);
  const [isRowInViewport, setIsRowInViewport] = useState<boolean>(
    () =>
      loadedFeedRowIdsCache.has(feed.id) ||
      feedIndex === 0 ||
      isContinueWatchingFeed ||
      isWatchlistFeed ||
      feed.id.startsWith('my-list')
  );
  const [isAnyCardHovered, setIsAnyCardHovered] = useState<boolean>(false);
  const [isBtnHovered, setIsBtnHovered] = useState<boolean>(false);

  const activeFeedId = useActiveFeedId();
  const isThisStripActive = activeFeedId === feed.id;

  // Pixel-perfect chevron centering:
  // Dynamically measures the actual card thumbnail center Y relative to the parent container,
  // fixing any vertical displacement caused by container padding across all card aspect ratios.
  const [navButtonTop, setNavButtonTop] = useState<number | null>(null);
  const [navButtonHeight, setNavButtonHeight] = useState<number | null>(null);

  const updateNavPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const thumbEl = (scrollContainerRef.current.querySelector('[data-card-thumb="true"]') ||
      scrollContainerRef.current.querySelector('[data-top10-card="true"]') ||
      scrollContainerRef.current.querySelector('[data-show-card="true"]')) as HTMLElement | null;
    const parentEl = scrollContainerRef.current.parentElement;
    if (thumbEl && parentEl) {
      const parentRect = parentEl.getBoundingClientRect();
      const thumbRect = thumbEl.getBoundingClientRect();
      const thumbTop = Math.round(thumbRect.top - parentRect.top);
      const thumbHeight = Math.round(thumbRect.height);
      if (thumbHeight > 0) {
        setNavButtonTop(thumbTop);
        setNavButtonHeight(thumbHeight);
      }
    }
  }, []);

  useEffect(() => {
    updateNavPosition();
    const rafId = window.requestAnimationFrame(updateNavPosition);
    const sc = scrollContainerRef.current;
    if (!sc) return () => window.cancelAnimationFrame(rafId);
    const ro = new ResizeObserver(() => {
      updateNavPosition();
      updateScrollButtons();
    });
    ro.observe(sc);
    const firstCard = (sc.querySelector('[data-card-thumb="true"]') ||
      sc.querySelector('[data-top10-card="true"]') ||
      sc.querySelector('[data-show-card="true"]')) as HTMLElement | null;
    if (firstCard) ro.observe(firstCard);
    window.addEventListener('resize', updateNavPosition, { passive: true });
    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', updateNavPosition);
    };
  }, [updateNavPosition, feed.isSpecialFeed, isRowInViewport, isMobile, isTablet]);

  // Active cursor tracking: STRICTLY ONLY 1 row active across entire page at a time
  // Left/right navigation badges only appear when cursor/pointer is strictly on the rows of titles (not above or below)
  useEffect(() => {
    const handleCheckPointer = (e?: MouseEvent) => {
      if (!feedStripRef.current || !scrollContainerRef.current) return;
      const { x, y } = e ? { x: e.clientX, y: e.clientY } : getGlobalMousePos();

      const firstCard = (scrollContainerRef.current.querySelector('[data-card-thumb="true"]') ||
        scrollContainerRef.current.querySelector('[data-top10-card="true"]') ||
        scrollContainerRef.current.querySelector('[data-show-card="true"]')) as HTMLElement | null;
      let isInside = false;
      if (firstCard) {
        const cardRect = firstCard.getBoundingClientRect();
        // Navigation buttons appear ONLY when cursor/pointer is strictly on the row of titles
        isInside = x >= 0 && x <= window.innerWidth && y >= cardRect.top && y <= cardRect.bottom;
      }

      if (isInside) {
        setGlobalActiveFeedId(feed.id);
      } else if (globalActiveFeedId === feed.id) {
        const allStrips = document.querySelectorAll<HTMLElement>('[data-feed-strip="true"]');
        let inAnyCardRow = false;
        allStrips.forEach((strip) => {
          const sc = strip.querySelector('.overflow-x-auto');
          const fc = (sc?.querySelector('[data-card-thumb="true"]') ||
            sc?.querySelector('[data-top10-card="true"]') ||
            sc?.querySelector('[data-show-card="true"]')) as HTMLElement | null;
          if (fc) {
            const cr = fc.getBoundingClientRect();
            if (x >= 0 && x <= window.innerWidth && y >= cr.top && y <= cr.bottom) {
              inAnyCardRow = true;
            }
          }
        });
        if (!inAnyCardRow) {
          setGlobalActiveFeedId(null);
        }
      }
    };

    const handleScrollCheck = () => handleCheckPointer();
    window.addEventListener('scroll', handleScrollCheck, { passive: true, capture: true });
    window.addEventListener('mousemove', handleCheckPointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScrollCheck, { capture: true });
      window.removeEventListener('mousemove', handleCheckPointer);
    };
  }, [feed.id, isRowInViewport, isMobile, isTablet]);

  const [isAnyCardExpanded, setIsAnyCardExpanded] = useState<boolean>(false);
  const [isPopoutHideNav, setIsPopoutHideNav] = useState<boolean>(false);
  const popoutNavHideTimerRef = useRef<number | null>(null);

  const handlePopoutOpen = useCallback(() => {
    setIsAnyCardExpanded(true);
    if (popoutNavHideTimerRef.current) {
      window.clearTimeout(popoutNavHideTimerRef.current);
    }
    // Only hide navigation for this row after 1 second of popout view open
    popoutNavHideTimerRef.current = window.setTimeout(() => {
      setIsPopoutHideNav(true);
    }, 1000);
  }, []);

  const handlePopoutClose = useCallback(() => {
    setIsAnyCardExpanded(false);
    if (popoutNavHideTimerRef.current) {
      window.clearTimeout(popoutNavHideTimerRef.current);
      popoutNavHideTimerRef.current = null;
    }
    // Show again as soon as popout view is collapsed
    setIsPopoutHideNav(false);
  }, []);

  useEffect(() => {
    return () => {
      if (popoutNavHideTimerRef.current) {
        window.clearTimeout(popoutNavHideTimerRef.current);
      }
    };
  }, []);

  const handleCardHoverStart = () => {
    setIsAnyCardHovered(true);
    if (scrollContainerRef.current) {
      // Freeze active scroll immediately on exact place when a card is hovered
      const curLeft = scrollContainerRef.current.scrollLeft;
      scrollContainerRef.current.scrollTo({ left: curLeft, behavior: 'instant' as ScrollBehavior });
    }
    onHoverCardStart?.();
  };

  const handleCardHoverEnd = () => {
    setIsAnyCardHovered(false);
    onHoverCardEnd?.();
  };

  // Filter shows based on feed configuration or use explicit customShows
  const filteredShows: Show[] = useMemo(() => {
    let list: Show[] = customShows ? [...customShows] : [...shows];

    if (!customShows) {
      if (feed.showIds && feed.showIds.length > 0) {
        list = feed.showIds
          .map((id) => shows.find((s) => s.id === id))
          .filter((s): s is Show => Boolean(s));
      } else if (feed.categoryKey === 'as_you_watch_dirilis') {
        list = shows.filter(
          (s) => s.id === 'dirilis-ertugrul' || s.id === 'barbaroslar'
        );
      } else if (feed.categoryKey === 'best_of_engin_altan') {
        list = shows.filter((s) =>
          s.cast.some((c) => c.name.toLowerCase().includes('engin altan'))
        );
      } else if (feed.categoryKey === 'best_of_kivanc') {
        list = shows.filter((s) =>
          s.cast.some(
            (c) =>
              c.name.toLowerCase().includes('kıvanç') ||
              c.name.toLowerCase().includes('kivanc')
          )
        );
      } else if (feed.filterType) {
        list = shows.filter((s) => s.type === feed.filterType);
      } else if (feed.filterGenre) {
        list = shows.filter((s) =>
          s.genres.some((g) => g.toLowerCase().includes(feed.filterGenre!.toLowerCase()))
        );
      }

      // Dynamic 24-Hour Top 10 Algorithm: calculate rolling 24h play count (now - 24h)
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
      const get24hScore = (s: Show) => {
        const recentPlays = (s.play_events || []).filter((e) => e.timestamp >= twentyFourHoursAgo).length;
        return recentPlays > 0 ? recentPlays : s.points;
      };

      if (
        feed.showRankNumbers ||
        feed.title.toLowerCase().includes('top 10') ||
        feed.categoryKey === 'top_10_series' ||
        feed.categoryKey === 'top_10_movies' ||
        feed.categoryKey === 'top_10_24h'
      ) {
        list.sort((a, b) => get24hScore(b) - get24hScore(a));
        list = list.slice(0, 10);
      }

      if (list.length === 0) {
        list = shows;
      }
    }

    const isTop10FeedLocal = Boolean(
      feed.showRankNumbers ||
      feed.title.toLowerCase().includes('top 10') ||
      feed.categoryKey === 'top_10_series' ||
      feed.categoryKey === 'top_10_movies' ||
      feed.categoryKey === 'top_10_24h'
    );

    if (isTop10FeedLocal) {
      list = list.slice(0, 10);
    }

    return list;
  }, [customShows, shows, feed]);

  // Strictly clamp any Top 10 feed to maximum 10 items
  const isTop10Feed = Boolean(
    feed.showRankNumbers ||
    feed.title.toLowerCase().includes('top 10') ||
    feed.categoryKey === 'top_10_series' ||
    feed.categoryKey === 'top_10_movies' ||
    feed.categoryKey === 'top_10_24h'
  );

  // Determine top 10 shows globally so other feeds can display the badge
  const top10ShowIds = [...shows].sort((a, b) => b.points - a.points).slice(0, 10).map((s) => s.id);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(false);

  // Progressive feed-by-feed vertical gating & horizontal in-view card gating (cached once loaded)
  const [loadedCardIndices, setLoadedCardIndices] = useState<Set<number>>(() => {
    const cached = loadedFeedCardIndicesCache.get(feed.id);
    if (cached && cached.size > 0) return new Set(cached);
    return new Set([0, 1, 2, 3, 4, 5]);
  });

  useEffect(() => {
    if (isRowInViewport) {
      loadedFeedRowIdsCache.add(feed.id);
    }
  }, [isRowInViewport, feed.id]);

  useEffect(() => {
    const el = feedStripRef.current;
    if (!el || isRowInViewport) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadedFeedRowIdsCache.add(feed.id);
          setIsRowInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '140px 0px', threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isRowInViewport, feed.id]);

  useEffect(() => {
    if (!isRowInViewport) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, idx) => {
      child.dataset.cardIndex = String(idx);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        setLoadedCardIndices((prev) => {
          let changed = false;
          const next = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const rawIdx = (entry.target as HTMLElement).dataset.cardIndex;
              if (rawIdx !== undefined) {
                const idx = Number(rawIdx);
                if (!next.has(idx)) {
                  next.add(idx);
                  changed = true;
                }
              }
            }
          });
          if (changed) {
            loadedFeedCardIndicesCache.set(feed.id, new Set(next));
            return next;
          }
          return prev;
        });
      },
      { root: container, rootMargin: '0px 140px 0px 140px', threshold: 0.01 }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [isRowInViewport, filteredShows.length, isMobile]);

  // Check if More Info page or any modal is currently open
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    return Boolean(
      document.body.getAttribute('data-modal-open') === 'true' ||
      document.querySelector('[data-modal-open="true"]')
    );
  });

  useEffect(() => {
    const checkModal = () => {
      const modalOpen = Boolean(
        document.body.getAttribute('data-modal-open') === 'true' ||
        document.querySelector('[data-modal-open="true"]')
      );
      setIsModalOpen(modalOpen);
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    updateNavPosition();
    const frameId = requestAnimationFrame(() => {
      updateScrollButtons();
      updateNavPosition();
    });
    const el = scrollContainerRef.current;
    if (!el) return () => cancelAnimationFrame(frameId);

    const handleContainerScroll = () => {
      if (el.scrollTop !== 0) {
        el.scrollTop = 0;
      }
      updateScrollButtons();
    };

    const handleContainerWheel = (e: WheelEvent) => {
      if (el.scrollTop !== 0) {
        el.scrollTop = 0;
      }
      const firstCard = (el.querySelector('[data-card-thumb="true"]') ||
        el.querySelector('[data-top10-card="true"]') ||
        el.querySelector('[data-show-card="true"]')) as HTMLElement | null;
      if (!firstCard) return;
      const cardRect = firstCard.getBoundingClientRect();
      const y = e.clientY;

      // The feed row does NOT scroll horizontally when the cursor pointer is outside the vertical bounds of the cards
      if (y < cardRect.top || y > cardRect.bottom) {
        e.preventDefault();
        if (Math.abs(e.deltaY) > 0) {
          window.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
        }
      }
    };

    el.addEventListener('scroll', handleContainerScroll, { passive: false });
    el.addEventListener('wheel', handleContainerWheel, { passive: false });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener('scroll', handleContainerScroll);
      el.removeEventListener('wheel', handleContainerWheel);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, updateNavPosition, filteredShows.length, isRowInViewport, isMobile, isTablet, feed.isSpecialFeed]);

  // Gentle scroll settling: smoothly glides to nearest card boundary without any jerk
  const settleTimeoutRef = useRef<number | null>(null);
  const settleAnimRef = useRef<number | null>(null);
  const isSettlingRef = useRef<boolean>(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || feed.isStretchableFeed || isMobile || isTablet) return;

    const smoothGlideTo = (target: number) => {
      if (settleAnimRef.current) cancelAnimationFrame(settleAnimRef.current);
      const startPos = container.scrollLeft;
      const distance = target - startPos;
      if (Math.abs(distance) <= 3) return;

      isSettlingRef.current = true;
      const startTime = performance.now();
      const duration = Math.min(320, Math.max(160, Math.abs(distance) * 1.5));

      const animateGlide = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        // Cubic ease-out: natural, gentle deceleration to stop, zero jerk
        const ease = 1 - Math.pow(1 - progress, 3);
        container.scrollLeft = Math.round(startPos + distance * ease);
        triggerGlobalScroll();

        if (progress < 1) {
          settleAnimRef.current = requestAnimationFrame(animateGlide);
        } else {
          isSettlingRef.current = false;
          settleAnimRef.current = null;
          updateScrollButtons();
        }
      };

      settleAnimRef.current = requestAnimationFrame(animateGlide);
    };

    const handleSettle = () => {
      triggerGlobalScroll();
      if (isSettlingRef.current) return;
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
      }
      settleTimeoutRef.current = window.setTimeout(() => {
        if (isAnyCardHovered) return;

        const cardElements = Array.from(
          container.querySelectorAll('[data-show-card="true"]')
        ) as HTMLElement[];
        if (cardElements.length === 0) return;

        const firstRect = cardElements[0].getBoundingClientRect();
        let gap = 16;
        if (cardElements.length > 1) {
          const secondRect = cardElements[1].getBoundingClientRect();
          gap = Math.max(8, Math.round(secondRect.left - firstRect.right));
        }
        const cardStride = firstRect.width + gap;
        if (cardStride <= 0) return;

        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft <= 8 || container.scrollLeft >= maxScrollLeft - 8) {
          return;
        }

        // Spot on exact card boundary so 1 or 2 card trackpad scrolls are preserved and aligned
        const nearestCard = Math.round(container.scrollLeft / cardStride);
        const targetScrollLeft = Math.min(maxScrollLeft, Math.max(0, nearestCard * cardStride));

        if (Math.abs(container.scrollLeft - targetScrollLeft) > 4) {
          smoothGlideTo(targetScrollLeft);
        }
      }, 260);
    };

    const handleContainerScroll = () => {
      triggerGlobalScroll();
      handleSettle();
    };

    const handleWheelActivity = () => {
      triggerGlobalScroll();
    };

    container.addEventListener('scroll', handleContainerScroll, { passive: true });
    container.addEventListener('scrollend', handleSettle, { passive: true });

    // Cancel glide immediately if user starts interacting with trackpad/wheel/touch
    const cancelGlide = () => {
      triggerGlobalScroll();
      if (settleAnimRef.current) {
        cancelAnimationFrame(settleAnimRef.current);
        settleAnimRef.current = null;
        isSettlingRef.current = false;
      }
    };
    container.addEventListener('wheel', cancelGlide, { passive: true });
    container.addEventListener('touchstart', cancelGlide, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      container.removeEventListener('scrollend', handleSettle);
      container.removeEventListener('wheel', cancelGlide);
      container.removeEventListener('touchstart', cancelGlide);
      if (settleTimeoutRef.current) {
        window.clearTimeout(settleTimeoutRef.current);
      }
      if (settleAnimRef.current) {
        cancelAnimationFrame(settleAnimRef.current);
      }
    };
  }, [isAnyCardHovered, filteredShows.length, updateScrollButtons, isRowInViewport, isMobile, isTablet, feed.isStretchableFeed]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    triggerGlobalScroll();
    
    // Find all rendered cards in this container
    const cardElements = Array.from(
      container.querySelectorAll('[data-show-card="true"]')
    ) as HTMLElement[];
    
    let cardStride = 320;
    if (cardElements.length > 0) {
      const firstRect = cardElements[0].getBoundingClientRect();
      let gap = 16;
      if (cardElements.length > 1) {
        const secondRect = cardElements[1].getBoundingClientRect();
        gap = Math.max(8, Math.round(secondRect.left - firstRect.right));
      }
      cardStride = firstRect.width + gap;
    }

    // Number of full cards displayed across the viewport (e.g. 4 cards at 100% zoom)
    const visibleCardsCount = Math.max(1, Math.floor((container.clientWidth - 48) / cardStride));
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    if (maxScrollLeft <= 0) return;

    // Advance by full visible cards (e.g. 4 cards) from current card offset
    const currentCardIndex = Math.round(container.scrollLeft / cardStride);
    const targetCardIndex = direction === 'right'
      ? currentCardIndex + visibleCardsCount
      : Math.max(0, currentCardIndex - visibleCardsCount);
    const targetScrollLeft = Math.min(maxScrollLeft, Math.max(0, targetCardIndex * cardStride));

    container.scrollTo({
      left: targetScrollLeft,
      behavior: 'smooth'
    });

    // Zero-delay continuous RAF updates across smooth scroll duration
    const startTime = performance.now();
    const animScroll = () => {
      triggerGlobalScroll();
      updateScrollButtons();
      if (performance.now() - startTime < 450) {
        requestAnimationFrame(animScroll);
      }
    };
    requestAnimationFrame(animScroll);
  };

  // Mobile Special Feed Cyclic Carousel State & Auto-scroll Preview
  const isMobileSpecialFeedCyclic = Boolean(isMobile && feed.isSpecialFeed && filteredShows.length > 1);
  const showCount = filteredShows.length;

  // We start in the middle set (Set 1, index showCount)
  const [mobileVirtualIndex, setMobileVirtualIndex] = useState<number>(() =>
    isMobileSpecialFeedCyclic ? showCount : 0
  );
  const [isMobileVideoPlaying, setIsMobileVideoPlaying] = useState<boolean>(false);
  const [isMobileVideoLoading, setIsMobileVideoLoading] = useState<boolean>(false);
  const [isPosterCountdownDone, setIsPosterCountdownDone] = useState<boolean>(false);
  const [previewProgressPercent, setPreviewProgressPercent] = useState<number>(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isStripInViewport, setIsStripInViewport] = useState<boolean>(true);
  const [isMobileCardClearBetweenNavbars, setIsMobileCardClearBetweenNavbars] = useState<boolean>(false);
  const posterCountdownTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const boundaryResetTimerRef = useRef<number | null>(null);
  const isMobileTouchingRef = useRef<boolean>(false);
  const mobileScrollSyncTimerRef = useRef<number | null>(null);

  // Active show mapped from virtual index
  const realActiveIndex = isMobileSpecialFeedCyclic ? mobileVirtualIndex % showCount : mobileVirtualIndex;
  const activeMobileShow = filteredShows[realActiveIndex] || filteredShows[0];

  // Initial scroll positioning to center Set 1's first card cleanly without smooth conflict
  useEffect(() => {
    if (!isMobileSpecialFeedCyclic) return;
    const container = mobileCarouselRef.current;
    if (!container) return;

    const initialIdx = showCount;
    setMobileVirtualIndex(initialIdx);

    const centerCard = () => {
      const targetEl = mobileCardRefs.current[initialIdx];
      if (targetEl && container) {
        const elCenter = targetEl.offsetLeft + targetEl.clientWidth / 2;
        container.scrollLeft = elCenter - container.clientWidth / 2;
      }
    };

    centerCard();
    const timer = setTimeout(centerCard, 50);
    return () => clearTimeout(timer);
  }, [isMobileSpecialFeedCyclic, showCount]);

  const isMobileSpecialPreviewEligible = Boolean(
    feed.isSpecialFeed &&
      isMobile &&
      activeMobileShow?.trailerUrl &&
      isStripInViewport &&
      isMobileCardClearBetweenNavbars &&
      !isModalOpen &&
      !isPaused
  );
  const isTopmostMobileSpecialPreview = useTopmostAutoPreview(
    `feed-strip-special-${feed.id}`,
    feedStripRef,
    isMobileSpecialPreviewEligible
  );

  // Strict check: full active card must sit cleanly between top and bottom navbars (and ignore left landscape sidebar for vertical bounds)
  const evaluateMobileSpecialCardClearance = useCallback(() => {
    if (!feed.isSpecialFeed || !isMobile) {
      setIsMobileCardClearBetweenNavbars(true);
      return;
    }
    const cardEl = mobileCardRefs.current[mobileVirtualIndex];
    if (!cardEl) {
      setIsMobileCardClearBetweenNavbars(false);
      return;
    }

    const rect = cardEl.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let topLimit = 0;
    document.querySelectorAll<HTMLElement>('[data-mobile-top-navbar="true"]').forEach((navEl) => {
      const nr = navEl.getBoundingClientRect();
      if (nr.width > 0 && nr.height > 0 && nr.bottom > 0 && nr.top < vh / 2) {
        topLimit = Math.max(topLimit, nr.bottom);
      }
    });

    let bottomLimit = vh;
    let leftLimit = 0;
    document.querySelectorAll<HTMLElement>('[data-mobile-bottom-navbar="true"]').forEach((navEl) => {
      if (navEl.hasAttribute('data-mobile-landscape-sidebar')) {
        const sr = navEl.getBoundingClientRect();
        if (sr.width > 0 && sr.right > 0) {
          leftLimit = Math.max(leftLimit, sr.right);
        }
        return;
      }
      const nr = navEl.getBoundingClientRect();
      if (nr.width > 0 && nr.height > 0 && nr.top < vh && nr.bottom > vh / 2) {
        bottomLimit = Math.min(bottomLimit, nr.top);
      }
    });

    let isClear = false;
    if (isLandscape) {
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, vh);
      const visibleH = Math.max(0, visibleBottom - visibleTop);
      const visibleLeft = Math.max(rect.left, leftLimit);
      const visibleRight = Math.min(rect.right, vw);
      const visibleW = Math.max(0, visibleRight - visibleLeft);
      isClear =
        rect.width > 0 &&
        rect.height > 0 &&
        visibleH / rect.height >= 0.5 &&
        visibleW / rect.width >= 0.5;
    } else {
      const clearance = 2;
      isClear =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top > topLimit + clearance &&
        rect.bottom < bottomLimit - clearance &&
        rect.left >= leftLimit &&
        rect.right <= vw;
    }

    setIsMobileCardClearBetweenNavbars(isClear);
    if (!isClear) {
      if (posterCountdownTimerRef.current) {
        window.clearTimeout(posterCountdownTimerRef.current);
        posterCountdownTimerRef.current = null;
      }
      setIsPosterCountdownDone(false);
      setIsMobileVideoLoading(false);
      setIsMobileVideoPlaying(false);
      setPreviewProgressPercent(0);
      if (mobileVideoRef.current && !mobileVideoRef.current.paused) {
        mobileVideoRef.current.pause();
      }
    }
  }, [feed.isSpecialFeed, isMobile, isLandscape, mobileVirtualIndex]);

  // Monitor viewport intersection & scroll position between mobile navbars
  useEffect(() => {
    if (!feed.isSpecialFeed || !isMobile) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStripInViewport(entry.isIntersecting);
        evaluateMobileSpecialCardClearance();
        if (!entry.isIntersecting && mobileVideoRef.current && !mobileVideoRef.current.paused) {
          mobileVideoRef.current.pause();
          setIsMobileVideoPlaying(false);
        }
      },
      { threshold: [0, 0.2, 0.5, 0.85, 1] }
    );
    if (feedStripRef.current) {
      observer.observe(feedStripRef.current);
    }
    evaluateMobileSpecialCardClearance();
    window.addEventListener('scroll', evaluateMobileSpecialCardClearance, { passive: true, capture: true });
    window.addEventListener('resize', evaluateMobileSpecialCardClearance, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', evaluateMobileSpecialCardClearance, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', evaluateMobileSpecialCardClearance);
    };
  }, [feed.isSpecialFeed, isMobile, evaluateMobileSpecialCardClearance]);

  // Tab switch or page blur: pause mobile special feed preview
  useEffect(() => {
    const handlePauseAnyPreview = () => {
      if (document.hidden) {
        if (mobileVideoRef.current && !mobileVideoRef.current.paused) {
          mobileVideoRef.current.pause();
          setIsMobileVideoPlaying(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handlePauseAnyPreview);
    window.addEventListener('blur', handlePauseAnyPreview);
    return () => {
      document.removeEventListener('visibilitychange', handlePauseAnyPreview);
      window.removeEventListener('blur', handlePauseAnyPreview);
    };
  }, []);

  // 1.5-second poster display before starting preview + loading indicator (only when topmost auto-preview row)
  useEffect(() => {
    if (!feed.isSpecialFeed || !isMobile || !isStripInViewport || !isMobileCardClearBetweenNavbars || !isTopmostMobileSpecialPreview || isModalOpen || isPaused) {
      setIsPosterCountdownDone(false);
      setIsMobileVideoLoading(false);
      setPreviewProgressPercent(0);
      return;
    }

    setIsPosterCountdownDone(false);
    setIsMobileVideoLoading(false);
    setPreviewProgressPercent(0);

    if (posterCountdownTimerRef.current) {
      window.clearTimeout(posterCountdownTimerRef.current);
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    posterCountdownTimerRef.current = window.setTimeout(() => {
      setIsPosterCountdownDone(true);
    }, 1500);

    return () => {
      if (posterCountdownTimerRef.current) window.clearTimeout(posterCountdownTimerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    };
  }, [mobileVirtualIndex, feed.isSpecialFeed, isMobile, isStripInViewport, isMobileCardClearBetweenNavbars, isTopmostMobileSpecialPreview, isModalOpen, isPaused]);

  // Video attachment effect for active mobile special feed card (starts ONLY after 1.5s poster countdown + topmost priority)
  useEffect(() => {
    if (
      !feed.isSpecialFeed ||
      !isMobile ||
      !activeMobileShow?.trailerUrl ||
      !isStripInViewport ||
      !isMobileCardClearBetweenNavbars ||
      !isTopmostMobileSpecialPreview ||
      isModalOpen ||
      isPaused ||
      !isPosterCountdownDone
    ) {
      setIsMobileVideoPlaying(false);
      setIsMobileVideoLoading(false);
      return;
    }

    const video = mobileVideoRef.current;
    if (!video) return;

    setIsMobileVideoPlaying(false);
    setIsMobileVideoLoading(true);
    const cleanup = attachHlsVideo(video, activeMobileShow.trailerUrl, {
      autoPlay: true,
      muted: Boolean(isGlobalMuted)
    });

    return () => {
      setIsMobileVideoPlaying(false);
      setIsMobileVideoLoading(false);
      if (cleanup) cleanup();
    };
  }, [
    feed.isSpecialFeed,
    isMobile,
    mobileVirtualIndex,
    activeMobileShow?.trailerUrl,
    isStripInViewport,
    isMobileCardClearBetweenNavbars,
    isTopmostMobileSpecialPreview,
    isModalOpen,
    isPaused,
    isPosterCountdownDone
  ]);

  // Sync mute state on mobile special feed without restarting video stream
  useEffect(() => {
    if (mobileVideoRef.current) {
      mobileVideoRef.current.muted = Boolean(isGlobalMuted);
      if (!isGlobalMuted) {
        mobileVideoRef.current.volume = 1.0;
      }
    }
  }, [isGlobalMuted]);

  // Track video elapsed time to animate carousel indicator from 0% to 100% when preview starts
  const handleVideoTimeUpdate = () => {
    const video = mobileVideoRef.current;
    if (!video || !video.duration || isNaN(video.duration)) return;
    const progress = (video.currentTime / video.duration) * 100;
    setPreviewProgressPercent(Math.min(100, Math.round(progress)));
  };

  // Auto-scroll to next card cyclically when trailer ends
  const handleMobilePreviewEnded = () => {
    setIsMobileVideoPlaying(false);
    setIsPosterCountdownDone(false);
    setPreviewProgressPercent(0);
    if (filteredShows.length <= 1) return;

    if (isMobileSpecialFeedCyclic) {
      const nextVirtual = mobileVirtualIndex + 1;
      setMobileVirtualIndex(nextVirtual);
      const targetEl = mobileCardRefs.current[nextVirtual];
      if (targetEl && mobileCarouselRef.current) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }

      // If next card advanced past middle set (into Set 2), normalize silently back to Set 1 once scroll lands (~480ms)
      if (nextVirtual >= 2 * showCount) {
        window.setTimeout(() => {
          const normalizedVirtual = showCount + (nextVirtual % showCount);
          const normEl = mobileCardRefs.current[normalizedVirtual];
          const container = mobileCarouselRef.current;
          if (normEl && container) {
            const elCenter = normEl.offsetLeft + normEl.clientWidth / 2;
            container.scrollLeft = elCenter - container.clientWidth / 2;
            setMobileVirtualIndex(normalizedVirtual);
          }
        }, 480);
      }
    } else {
      const nextIdx = (mobileVirtualIndex + 1) % filteredShows.length;
      setMobileVirtualIndex(nextIdx);
      const targetEl = mobileCardRefs.current[nextIdx];
      if (targetEl && mobileCarouselRef.current) {
        targetEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  };

  // Jutter-free native CSS snap scroll synchronization (debounced so it never fights touch inertia)
  const syncMobileCarouselAfterSettle = () => {
    if (mobileScrollSyncTimerRef.current) {
      window.clearTimeout(mobileScrollSyncTimerRef.current);
    }
    mobileScrollSyncTimerRef.current = window.setTimeout(() => {
      if (isMobileTouchingRef.current) return;
      const container = mobileCarouselRef.current;
      if (!container) return;
      const center = container.scrollLeft + container.clientWidth / 2;
      let closestVirtual = 0;
      let minDist = Infinity;
      mobileCardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const elCenter = el.offsetLeft + el.clientWidth / 2;
        const dist = Math.abs(center - elCenter);
        if (dist < minDist) {
          minDist = dist;
          closestVirtual = idx;
        }
      });

      if (isMobileSpecialFeedCyclic && (closestVirtual < showCount || closestVirtual >= 2 * showCount)) {
        const normalizedVirtual = showCount + (closestVirtual % showCount);
        const targetEl = mobileCardRefs.current[normalizedVirtual];
        if (targetEl) {
          const elCenter = targetEl.offsetLeft + targetEl.clientWidth / 2;
          container.scrollLeft = elCenter - container.clientWidth / 2;
          setMobileVirtualIndex(normalizedVirtual);
          setIsPosterCountdownDone(false);
          setIsMobileVideoLoading(false);
          setPreviewProgressPercent(0);
          return;
        }
      }

      if (closestVirtual !== mobileVirtualIndex) {
        setMobileVirtualIndex(closestVirtual);
        setIsPosterCountdownDone(false);
        setIsMobileVideoLoading(false);
        setPreviewProgressPercent(0);
      }
    }, 120);
  };

  const handleMobileCarouselScroll = () => {
    evaluateMobileSpecialCardClearance();
    syncMobileCarouselAfterSettle();
  };

  const handleSpecialFeedTouchStart = () => {
    isMobileTouchingRef.current = true;
    if (boundaryResetTimerRef.current) {
      window.clearTimeout(boundaryResetTimerRef.current);
    }
  };

  const handleSpecialFeedTouchEnd = () => {
    isMobileTouchingRef.current = false;
    syncMobileCarouselAfterSettle();
  };

  // If customShows was explicitly passed and is empty (e.g. cleared watchlist or cleared history), hide feed strip completely
  if (customShows !== undefined && customShows.length === 0) {
    return null;
  }

  // Special Feed Custom Layout:
  // - No container (unboxed, merges seamlessly into page directly below top feed)
  // - Background picture with darkness controlled strictly by admin (no forced extra darkness or black bars)
  // - Explore All button has exact CSS style of Play button
  // - Pinned left column (large logo, tagline, subtitle, explore button), cards scroll to the right
  if (feed.isSpecialFeed) {
    if (!filteredShows || filteredShows.length === 0) return null;
    const bgPicture = feed.specialBgImageUrl || (filteredShows[0]?.backdropUrl || filteredShows[0]?.posterLandscapeUrl || 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1920&q=80');
    const darknessPercent = typeof feed.specialBgDarkness === 'number' ? feed.specialBgDarkness : 45;

    // Desktop & Tablet Layout:
    // Left centered logo + tagline (+ optional action button) over backdrop controlled by admin darkness slider; Right horizontal strip of 2:3 vertical poster cards with classic left/right nav arrows
    if (!isMobile) {
      return (
        <div
          ref={feedStripRef}
          data-feed-strip="true"
          data-feed-id={feed.id}
          className="relative group/strip transition-all my-6 w-full min-h-[340px] lg:min-h-[385px] flex items-center overflow-visible bg-[#141414] z-0"
        >
          {/* Backdrop Picture & Admin-Controlled Darkness Overlay (No yellow glare, seamless top/bottom #141414 fade) */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 14%, #000 28%, #000 72%, rgba(0,0,0,0.45) 86%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 14%, #000 28%, #000 72%, rgba(0,0,0,0.45) 86%, transparent 100%)'
            }}
          >
            <MediaImage
              src={bgPicture}
              fallbackTitle=""
              hideFallback={true}
              aria-hidden="true"
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {darknessPercent > 0 && (
              <div
                className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
                style={{ opacity: darknessPercent / 100 }}
              />
            )}
          </div>

          {/* Foreground Row: Left Logo & Tagline + Right 2:3 Poster Cards */}
          <div className="relative z-10 w-full max-w-[1920px] mx-auto pl-6 md:pl-8 xl:pl-12 pr-0 py-7 lg:py-9 flex items-center gap-6 lg:gap-10">
            {/* Left Section: Centered Logo + Tagline/Subtitle + Optional Action Button */}
            <div
              onClick={() => {
                if (onExploreSpecialFeed) {
                  onExploreSpecialFeed(feed, filteredShows);
                } else if (filteredShows.length > 0) {
                  onOpenDetails(filteredShows[0]);
                }
              }}
              className="relative z-20 w-[32%] lg:w-[30%] shrink-0 px-4 lg:px-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer select-none"
            >
              {feed.specialLogoUrl ? (
                <img
                  src={feed.specialLogoUrl}
                  alt={feed.title}
                  referrerPolicy="no-referrer"
                  className="max-h-20 lg:max-h-28 max-w-[260px] lg:max-w-[320px] w-auto object-contain mx-auto"
                />
              ) : (
                <h3 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white uppercase tracking-wide leading-[0.95] text-center max-w-[300px]">
                  {feed.title}
                </h3>
              )}

              {(feed.specialTagline || feed.subtitle) && (
                <p className="text-xs sm:text-sm lg:text-[15px] text-zinc-200 font-medium leading-snug line-clamp-2 max-w-[300px]">
                  {feed.specialTagline || feed.subtitle}
                </p>
              )}

              {feed.specialShowActionButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onExploreSpecialFeed) {
                      onExploreSpecialFeed(feed, filteredShows);
                    } else if (filteredShows.length > 0) {
                      onOpenDetails(filteredShows[0]);
                    }
                  }}
                  className="mt-1 px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs tracking-tight shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  {feed.specialExploreText || 'Explore All'}
                </button>
              )}
            </div>

            {/* Right Section: Horizontal 2:3 Poster Cards Carousel with Classic Hover Navigation Arrows */}
            <div
              onMouseEnter={() => {
                setGlobalActiveFeedId(feed.id);
                updateNavPosition();
                updateScrollButtons();
              }}
              className="relative flex-1 min-w-0 group/specialdesktop"
            >
              {!isModalOpen && canScrollLeft && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('left');
                  }}
                  aria-label="Scroll left"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : '8px',
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : 'calc(100% - 16px)',
                    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute left-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 select-none opacity-0 group-hover/strip:opacity-100 transition-opacity duration-200"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              {!isModalOpen && canScrollRight && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('right');
                  }}
                  aria-label="Scroll right"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : '8px',
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : 'calc(100% - 16px)',
                    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute right-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 select-none opacity-0 group-hover/strip:opacity-100 transition-opacity duration-200"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="flex items-center gap-3.5 lg:gap-4 overflow-x-auto no-scrollbar py-2 pr-6 md:pr-10 scroll-smooth"
              >
                {filteredShows.map((show, sIdx) => {
                  const poster2x3 =
                    show.desktopTop10Image2x3Url ||
                    show.posterVerticalUrl ||
                    show.poster9x16Url ||
                    show.posterUrl ||
                    show.posterLandscapeUrl;

                  return (
                    <div
                      key={`${feed.id}-2x3-${show.id}`}
                      data-show-card="true"
                      data-card-thumb="true"
                      onClick={(e) => onOpenDetails(show, { element: e.currentTarget, sourceFeedType: 'other', posterUrl: poster2x3 })}
                      className="relative w-[calc((100vw-100px)/4.5)] md:w-[calc((100vw-128px)/6.22)] lg:w-[calc((100vw-128px)/6.22)] xl:w-[calc((100vw-144px)/6.22)] min-w-[140px] aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-[#14151b] cursor-pointer shadow-2xl transition-transform duration-200 hover:scale-[1.03] group/spcard"
                    >
                      <MediaImage
                        src={poster2x3}
                        fallbackTitle={show.title}
                        deferLoad={!isRowInViewport || !loadedCardIndices.has(sIdx)}
                        skeletonDelayMs={sIdx * 150}
                        fallbackClassName="w-full h-full bg-[#14151b] flex items-center justify-center p-3 text-center select-none"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/spcard:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={feedStripRef}
        data-feed-strip="true"
        data-feed-id={feed.id}
        className="relative group/strip transition-all my-5 sm:my-6 w-full min-h-[440px] sm:min-h-[375px] md:min-h-[412px] lg:min-h-[435px] flex items-center justify-center pb-8 sm:pb-4 z-0"
      >
        {/* 1. Full-bleed Background Picture seamlessly starting right below top feed */}
        <div
          className="absolute inset-x-0 -top-8 -bottom-8 pointer-events-none select-none overflow-hidden"
          style={{
            maskImage:
              'linear-gradient(to bottom, transparent 0px, transparent 35px, rgba(0,0,0,0.3) 65px, #000 105px, #000 calc(100% - 105px), rgba(0,0,0,0.3) calc(100% - 65px), transparent calc(100% - 35px), transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0px, transparent 35px, rgba(0,0,0,0.3) 65px, #000 105px, #000 calc(100% - 105px), rgba(0,0,0,0.3) calc(100% - 65px), transparent calc(100% - 35px), transparent 100%)'
          }}
        >
          <MediaImage
            src={bgPicture}
            fallbackTitle=""
            hideFallback={true}
            aria-hidden="true"
            className="w-full h-full object-cover object-center"
          />

          {/* Backdrop Darkness Overlay - strictly controlled by admin slider, no extra darkness added */}
          {darknessPercent > 0 && (
            <div
              className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
              style={{ opacity: darknessPercent / 100 }}
            />
          )}
        </div>

        {/* 2. Foreground content: centered in special feed, cards row stretched to far right edge */}
        <div className="relative z-10 w-full pl-0 md:pl-6 lg:pl-8 xl:pl-12 pr-0 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 lg:gap-6 py-4 my-auto">
          {/* Pinned Left Section: Centered Logo, Subtitle below logo, Tagline, Explore all button with plenty of room on left and right */}
          <div className="relative z-20 flex-1 min-w-0 w-full md:w-auto flex flex-col justify-center items-center text-center space-y-2.5 py-3 px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 my-auto">
            {/* Logo: Constrained to match section scale with generous horizontal room */}
            {feed.specialLogoUrl ? (
              <div className="w-full flex justify-center px-4 sm:px-6">
                <img
                  src={feed.specialLogoUrl}
                  alt={feed.title}
                  className="max-h-16 sm:max-h-20 md:max-h-24 max-w-[220px] w-auto object-contain object-center drop-shadow-2xl mx-auto"
                />
              </div>
            ) : (
              <div className="text-2xl sm:text-3xl md:text-4xl font-black text-red-600 uppercase tracking-tighter drop-shadow-2xl font-cinematic text-center leading-[0.95] max-w-[240px] mx-auto px-4">
                {feed.title.includes('&') ? (
                  <>
                    <div>{feed.title.split('&')[0].trim()}</div>
                    <div className="text-xl sm:text-2xl md:text-3xl">& {feed.title.split('&')[1].trim()}</div>
                  </>
                ) : (
                  feed.title
                )}
              </div>
            )}

            {/* Subtitle / Description directly below the logo */}
            {feed.subtitle && (
              <p className="text-[11px] sm:text-xs text-zinc-300 leading-relaxed font-normal drop-shadow max-w-[240px] text-center mx-auto line-clamp-2 px-3">
                {feed.subtitle}
              </p>
            )}

            {/* Tagline Capsule (e.g. HALLOWEEN COLLECTION) */}
            {feed.specialTagline && (
              <div className="inline-block px-2.5 py-0.5 border-y border-white/25 text-[9px] sm:text-[10px] font-bold tracking-widest text-white/90 uppercase drop-shadow my-0.5">
                {feed.specialTagline}
              </div>
            )}

            {/* Explore All Button */}
            <div className="pt-1 flex justify-center w-full">
              <button
                onClick={() => {
                  if (onExploreSpecialFeed) {
                    onExploreSpecialFeed(feed, filteredShows);
                  } else if (filteredShows.length > 0) {
                    onOpenDetails(filteredShows[0]);
                  }
                }}
                className="px-4 py-1 sm:px-5 sm:py-1.5 rounded-full bg-white hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none text-black font-semibold text-xs tracking-tight shadow-md cursor-pointer transition-all active:scale-95"
                aria-label={feed.specialExploreText || 'Explore all'}
              >
                <span>{feed.specialExploreText || 'Explore all'}</span>
              </button>
            </div>
          </div>

          {/* Cards Carousel Area: sized to show exactly 2 old-sized cards and edge of 3rd on desktop without clipping popout */}
          <div
            onMouseEnter={() => setGlobalActiveFeedId(feed.id)}
            className={`relative shrink-0 w-full md:w-[500px] lg:w-[540px] xl:w-[570px] overflow-visible flex flex-col justify-center pr-0 group/cards ${
              isAnyCardHovered || isAnyCardExpanded ? 'z-30' : 'z-10'
            }`}
          >
            {/* Native CSS Navigation Chevrons: ONLY show for the single active feed the user cursor/pointer is on */}
            {!isModalOpen && !isMobile && !isTablet && isThisStripActive && !isPopoutHideNav && (
              <>
                {canScrollLeft && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScroll('left');
                    }}
                    aria-label="Scroll left"
                    style={{
                      top: navButtonTop !== null ? `${navButtonTop}px` : undefined,
                      height: navButtonHeight !== null ? `${navButtonHeight}px` : undefined,
                      background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                    }}
                    className="group/nav absolute left-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 select-none"
                  >
                    <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                  </button>
                )}

                {canScrollRight && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScroll('right');
                    }}
                    aria-label="Scroll right"
                    style={{
                      top: navButtonTop !== null ? `${navButtonTop}px` : undefined,
                      height: navButtonHeight !== null ? `${navButtonHeight}px` : undefined,
                      background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                    }}
                    className="group/nav absolute right-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 select-none"
                  >
                    <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                  </button>
                )}
              </>
            )}

            {/* Mobile Layout: 16:9 preview cards showing 1 card and edge of other on both sides with video preview */}
            {isMobile ? (
              <div className="w-full">
                <div
                  ref={mobileCarouselRef}
                  onScroll={handleMobileCarouselScroll}
                  onTouchStart={handleSpecialFeedTouchStart}
                  onTouchEnd={handleSpecialFeedTouchEnd}
                  onTouchCancel={handleSpecialFeedTouchEnd}
                  style={{ touchAction: 'pan-x pan-y' }}
                  className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar pl-2 pr-6 gap-2.5 py-1 select-none w-full [scroll-snap-stop:always]"
                >
                  {(isMobileSpecialFeedCyclic
                    ? [0, 1, 2].flatMap((setNum) =>
                        filteredShows.map((show, originalIdx) => ({
                          show,
                          originalIdx,
                          virtualIdx: setNum * showCount + originalIdx,
                          key: `cycle-${setNum}-${show.id}-${originalIdx}`
                        }))
                      )
                    : filteredShows.map((show, originalIdx) => ({
                        show,
                        originalIdx,
                        virtualIdx: originalIdx,
                        key: `${show.id}-${originalIdx}`
                      }))
                  ).map((item) => {
                    const isActive = item.virtualIdx === mobileVirtualIndex;
                    const show = item.show;
                    const backdrop = show.posterLandscapeUrl || show.backdropUrl || show.posterVerticalUrl || '';
                    return (
                      <div
                        key={item.key}
                        data-show-id={show.id}
                        ref={(el) => {
                          mobileCardRefs.current[item.virtualIdx] = el;
                        }}
                        onClick={(e) => onOpenDetails(show, { element: e.currentTarget, sourceFeedType: 'other', posterUrl: backdrop })}
                        className={`w-[80vw] max-w-[340px] shrink-0 snap-center snap-always aspect-[16/9] rounded-xl overflow-hidden relative shadow-none bg-black border-0 transition-transform duration-300 cursor-pointer opacity-100 ${
                          isActive ? 'scale-100' : 'scale-95'
                        }`}
                      >
                        {/* 1px inner border overlay with exact same opacity as in recommendation */}
                        <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border border-zinc-400/[0.09]" />

                        {/* Base Artwork Image */}
                        <MediaImage
                          src={backdrop}
                          fallbackTitle={show.title}
                          deferLoad={!isRowInViewport}
                          hideFallback={isActive && isMobileVideoPlaying}
                          fallbackClassName="absolute inset-0 w-full h-full bg-[#16171d] flex items-center justify-center p-4 text-center select-none"
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Video preview overlay on active card (shows ONLY after 1.5s poster countdown & navbar clearance) */}
                        {isActive && isPosterCountdownDone && show.trailerUrl && isStripInViewport && isMobileCardClearBetweenNavbars && !isModalOpen && !isPaused && (
                          <video
                            ref={mobileVideoRef}
                            poster={backdrop}
                            autoPlay
                            muted={Boolean(isGlobalMuted)}
                            playsInline
                            onWaiting={() => setIsMobileVideoLoading(true)}
                            onPlaying={() => {
                              setIsMobileVideoLoading(false);
                              setIsMobileVideoPlaying(true);
                            }}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleMobilePreviewEnded}
                            className={`absolute inset-0 w-full h-full object-cover scale-[1.01] transition-opacity duration-500 ${
                              isMobileVideoPlaying ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        )}

                        {/* Top-Right Loading Spinner (after 1.5s poster while preview loads) -> Mute / Unmute Button once playing */}
                        {isActive && show.trailerUrl && isPosterCountdownDone && isStripInViewport && isMobileCardClearBetweenNavbars && !isModalOpen && !isPaused && (
                          <div
                            className="absolute top-2.5 right-2.5 z-30"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            {isMobileVideoLoading || !isMobileVideoPlaying ? (
                              <div className="w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center border border-white/10">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              </div>
                            ) : onToggleGlobalMute ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextMuted = !isGlobalMuted;
                                  if (mobileVideoRef.current) {
                                    mobileVideoRef.current.muted = nextMuted;
                                    if (!nextMuted) {
                                      mobileVideoRef.current.volume = 1.0;
                                    }
                                  }
                                  onToggleGlobalMute(nextMuted);
                                }}
                                onPointerDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="relative before:content-[''] before:absolute before:-inset-3 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer transition-colors"
                                aria-label="Toggle mute"
                              >
                                {isGlobalMuted ? (
                                  <VolumeX className="w-3.5 h-3.5 text-white" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5 text-white" />
                                )}
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Carousel Indicators / Buttons beneath the cards showing time left of preview */}
                <div className="flex items-center justify-center gap-1.5 mt-3 select-none">
                  {filteredShows.map((s, idx) => {
                    const isActive = idx === (mobileVirtualIndex % showCount);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          const targetVirtual = isMobileSpecialFeedCyclic ? showCount + idx : idx;
                          setMobileVirtualIndex(targetVirtual);
                          setIsPosterCountdownDone(false);
                          setPreviewProgressPercent(0);
                          const targetEl = mobileCardRefs.current[targetVirtual];
                          if (targetEl && mobileCarouselRef.current) {
                            targetEl.scrollIntoView({
                              behavior: 'smooth',
                              inline: 'center',
                              block: 'nearest'
                            });
                          }
                        }}
                        className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                          isActive ? 'w-8 bg-white/20' : 'w-2 bg-white/30'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      >
                        {isActive && (
                          <div
                            className="absolute inset-0 bg-white rounded-full transition-all duration-100 ease-linear"
                            style={{
                              width: `${previewProgressPercent}%`
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Tablet and Desktop: Standard row track showing only 2 cards and edge of 3rd at old card size */
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar pt-1 pb-1 pl-1 pr-0 w-full"
              >
                {filteredShows.map((show, index) => (
                  <div
                    key={`${feed.id}-${show.id}`}
                    className="shrink-0 w-[185px] sm:w-[205px] md:w-[225px] lg:w-[245px]"
                  >
                    <ShowCard
                      show={show}
                      cardSize="special"
                      rankNumber={feed.showRankNumbers ? index + 1 : undefined}
                      showTop10Badge={showTop10Badges !== false && !isTop10Feed && top10ShowIds.includes(show.id)}
                      isFirst={index === 0}
                      isLast={index === filteredShows.length - 1}
                      isInWatchlist={watchlist.includes(show.id)}
                      onToggleWatchlist={onToggleWatchlist}
                      onOpenDetails={(item, meta) =>
                        onOpenDetails(item, meta ? { ...meta, sourceFeedType: 'other' } : { sourceFeedType: 'other' })
                      }
                      onPlay={onPlayShow}
                      onIncrementPoints={onIncrementPoints}
                      isGlobalMuted={isGlobalMuted}
                      onToggleGlobalMute={onToggleGlobalMute}
                      onHoverPreviewStart={handleCardHoverStart}
                      onHoverPreviewEnd={handleCardHoverEnd}
                      onPopoutViewOpen={handlePopoutOpen}
                      onPopoutViewClose={handlePopoutClose}
                      aspectRatio={cardAspectRatio}
                      isContinueWatching={isContinueWatchingFeed}
                      watchProgress={watchHistory?.[show.id]}
                      disablePopout={disablePopout}
                      isStretchable={isStretchableFeed}
                      onLongPress={onLongPressShow}
                      popoutStyle={desktopPopoutStyle}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If Top 10 style is 'modern' (side outlined number) or 'inside_card' (solid number top-left inside 2:3 card), render 2:3 portrait rank row
  if (
    (effectiveTop10Style === 'modern' || effectiveTop10Style === 'inside_card') &&
    isTop10Feed &&
    filteredShows &&
    filteredShows.length > 0
  ) {
    const isInsideCardStyle = effectiveTop10Style === 'inside_card';

    return (
      <div
        ref={feedStripRef}
        data-feed-strip="true"
        data-feed-id={feed.id}
        className="relative group/modernstrip transition-all my-2 sm:my-3 select-none overflow-visible"
      >
        {/* Header Container */}
        <div className="relative z-30 w-full pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-2.5 sm:pr-4 md:pr-8 xl:pr-12 mb-1 sm:mb-1.5">
          {!isMobile && onOpenTop10Page ? (
            <button
              type="button"
              onClick={() =>
                onOpenTop10Page(
                  feed.categoryKey === 'top_10_movies' || feed.title.toLowerCase().includes('movie')
                    ? 'movies'
                    : 'series'
                )
              }
              className="group/t10 inline-flex items-center gap-1.5 text-[15px] sm:text-base md:text-[17px] font-semibold text-white/95 hover:text-white tracking-tight cursor-pointer"
            >
              <span>{feed.title}</span>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover/t10:text-white group-hover/t10:translate-x-0.5 transition-all" />
            </button>
          ) : (
            <h3
              className={`text-white/95 tracking-tight ${
                isMobileLandscapeLayout
                  ? 'text-[13.5px] font-normal'
                  : 'text-[15px] sm:text-base md:text-[17px] font-semibold'
              }`}
            >
              {feed.title}
            </h3>
          )}
        </div>

        {/* Row Container */}
        <div
          onMouseEnter={() => setGlobalActiveFeedId(feed.id)}
          className="relative w-full"
        >
          {/* Desktop Left/Right Navigation Chevrons: appear on row hover, height EXACTLY matches title card */}
          {!isModalOpen && !isMobile && !isTablet && (
            <>
              {canScrollLeft && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('left');
                  }}
                  aria-label="Scroll left"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : undefined,
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : undefined,
                    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute left-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 select-none opacity-0 group-hover/modernstrip:opacity-100 transition-opacity duration-200"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('right');
                  }}
                  aria-label="Scroll right"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : undefined,
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : undefined,
                    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute right-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 select-none opacity-0 group-hover/modernstrip:opacity-100 transition-opacity duration-200"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}
            </>
          )}

          {/* Cards Track */}
          <div
            ref={scrollContainerRef}
            className={`flex items-center ${
              isInsideCardStyle ? 'gap-2.5 sm:gap-3.5 md:gap-4' : 'gap-3 sm:gap-4 md:gap-5 lg:gap-6'
            } overflow-x-auto no-scrollbar pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-4 sm:pr-6 md:pr-12 pt-10 -mt-10 pb-16 -mb-16 overflow-y-visible`}
          >
            {filteredShows.map((show, index) => {
              const rankNum = index + 1;
              const rankStr = String(rankNum);
              const posterArtwork =
                show.desktopTop10Image2x3Url ||
                show.posterVerticalUrl ||
                show.poster9x16Url ||
                show.posterUrl ||
                show.posterLandscapeUrl;
              const ambientColor = show.desktopTop10Image2x3Ambiance || '#b45309';
              const isInWatchlist = watchlist.includes(show.id);

              return (
                <div
                  key={`modern-top10-${feed.id}-${show.id}`}
                  data-show-card="true"
                  data-show-id={show.id}
                  className={`relative shrink-0 flex items-center select-none group/top10item ${
                    isInsideCardStyle
                      ? 'w-[calc((100vw-38px)/2.55)] sm:w-[calc((100vw-56px)/3.5)] md:w-[calc((100vw-128px)/6.22)] lg:w-[calc((100vw-128px)/6.22)] xl:w-[calc((100vw-144px)/6.22)]'
                      : 'w-[calc((100vw-44px)*0.44)] sm:w-[calc((100vw-56px)*0.36)] md:w-[calc((100vw-120px)/4.5)] xl:w-[calc((100vw-160px)/4.5)]'
                  }`}
                >
                  {/* Outlined Rank Number on Left (only in 'modern' mode) */}
                  {!isInsideCardStyle && (
                    <div className="relative z-0 pointer-events-none select-none shrink-0 flex items-center justify-end leading-none w-10 sm:w-12 md:w-15 lg:w-18 overflow-visible">
                      <ModernRankNumber
                        rank={rankNum}
                        fillColor={isMobile ? '#000000' : '#141414'}
                        strokeColor="rgba(255, 255, 255, 0.44)"
                        strokeWidth={4.5}
                        className={`${
                          rankNum >= 10
                            ? 'w-[74px] sm:w-[90px] md:w-[112px] lg:w-[132px] -mr-1.5 sm:-mr-2.5'
                            : 'w-[54px] sm:w-[68px] md:w-[86px] lg:w-[100px] -mr-1 sm:-mr-1.5'
                        } h-[95px] sm:h-[115px] md:h-[145px] lg:h-[168px]`}
                      />
                    </div>
                  )}

                  {/* Poster Card */}
                  <div
                    data-top10-card="true"
                    onClick={(e) => onOpenDetails(show, { element: e.currentTarget, sourceFeedType: 'other', posterUrl: posterArtwork })}
                    className={`${
                      isInsideCardStyle ? 'ml-0' : '-ml-2 sm:-ml-2.5 md:-ml-3 lg:-ml-3.5'
                    } relative z-10 flex-1 aspect-[2/3] shrink-0 rounded-xl overflow-visible cursor-pointer transition-transform duration-300 ease-out ${
                      !isMobile ? 'group-hover/top10item:scale-[1.05]' : ''
                    }`}
                  >
                    {/* Glowing Ambiance Halo on Hover */}
                    {!isMobile && (
                      <div
                        className="absolute -inset-y-8 -inset-x-6 rounded-3xl pointer-events-none -z-10 blur-2xl opacity-0 group-hover/top10item:opacity-100 transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle at 50% 50%, ${ambientColor}88 0%, ${ambientColor}40 45%, ${ambientColor}10 70%, transparent 85%)`
                        }}
                      />
                    )}

                    {/* Card Inner Wrapper with rounded-xl corners (NO border) */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#14151b] border-0 outline-none shadow-xl">
                      {/* Vertical Poster Artwork */}
                      <MediaImage
                        src={posterArtwork}
                        fallbackTitle={show.title}
                        deferLoad={!isRowInViewport || !loadedCardIndices.has(index)}
                        fallbackClassName="absolute inset-0 w-full h-full bg-[#14151b] flex items-center justify-center p-3 text-center select-none"
                        className="absolute inset-0 w-full h-full object-cover"
                      />

                      {/* 3rd Style ('inside_card'): Solid vertical-gradient rank number top-left INSIDE card (hides on desktop hover) */}
                      {isInsideCardStyle && (
                        <div className={`absolute top-2 left-3 z-20 pointer-events-none select-none transition-opacity duration-200 ${
                          !isMobile ? 'group-hover/top10item:opacity-0' : ''
                        }`}>
                          <span
                            className="text-3xl sm:text-4xl md:text-[42px] font-black leading-none tracking-tight inline-block"
                            style={{
                              backgroundImage:
                                'linear-gradient(180deg, #ffffff 35%, #a1a1aa 100%)',
                              WebkitBackgroundClip: 'text',
                              color: 'transparent',
                              filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.72))'
                            }}
                          >
                            {rankStr}
                          </span>
                        </div>
                      )}

                      {/* Bottom Dark Gradient Scrim */}
                      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

                      {/* Central PNG Logo at Bottom Center (uses Central Logo with fallback to Standard Logo):
                          Smoothly translates up on desktop hover */}
                      <div className={`absolute inset-x-2 bottom-3.5 z-20 flex flex-col items-center justify-end pointer-events-none transition-transform duration-300 ease-out ${
                        !isMobile ? 'group-hover/top10item:-translate-y-12' : ''
                      }`}>
                        {(show.centralLogoUrl || show.titleLogoUrl) ? (
                          <div className="relative w-[78%] aspect-[2.5/1] overflow-hidden shrink-0">
                            <img
                              src={show.centralLogoUrl || show.titleLogoUrl}
                              alt={show.title}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                            />
                          </div>
                        ) : (
                          <span className="text-white font-extrabold text-xs sm:text-sm text-center tracking-tight drop-shadow-md px-1">
                            {show.title}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons on Desktop Hover (Image 4 Card 2):
                          - White Pill Button: ▶ Play
                          - Circular Button: (+) or (✓) */}
                      {!isMobile && (
                      <div className="flex absolute inset-x-2 bottom-3 z-30 items-center justify-center gap-2 opacity-0 group-hover/top10item:opacity-100 transition-opacity duration-200 pointer-events-auto">
                        {/* Play Pill Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayShow(show);
                          }}
                          className="px-4 py-1.5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-transform cursor-pointer"
                          aria-label={`Play ${show.title}`}
                        >
                          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                            <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                          </svg>
                          <span>Play</span>
                        </button>

                        {/* Add to List Circular Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatchlist(show.id);
                          }}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/60 flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform"
                          aria-label={isInWatchlist ? `Remove from list` : `Add to list`}
                        >
                          {isInWatchlist ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : (
                            <Plus className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!filteredShows || filteredShows.length === 0) return null;

  return (
    <div
      ref={feedStripRef}
      data-feed-strip="true"
      data-feed-id={feed.id}
      className="relative group/strip transition-all z-0"
    >
      {/* Header Container */}
      <div className="relative z-30 w-full pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-2.5 sm:pr-4 md:pr-8 xl:pr-12 mb-1 sm:mb-1.5 flex items-end justify-between">
        <div>
          {!isRowInViewport ? (
            <div className="w-36 sm:w-44 h-5 sm:h-6 rounded skeleton-wave" />
          ) : (
            <h3
              className={`text-white/95 tracking-tight ${
                isMobileLandscapeLayout
                  ? 'text-[13.5px] font-normal'
                  : 'text-[15px] sm:text-base md:text-[17px] font-semibold'
              }`}
            >
              {feed.title}
            </h3>
          )}
        </div>
      </div>

      {!isRowInViewport ? (
        /* Feed-by-feed staggered wave loading skeleton UI */
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-hidden pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-3.5 sm:pr-4 md:pr-8 xl:pr-12 py-1">
          {Array.from({ length: isMobile ? 4 : 5 }).map((_, skIdx) => (
            <div
              key={`feed-skel-${feed.id}-${skIdx}`}
              style={{ animationDelay: `${skIdx * 150}ms` }}
              className={`shrink-0 skeleton-wave ${
                cardAspectRatio === '2:3'
                  ? 'w-[calc((100vw-24px)/3.22)] sm:w-[140px] aspect-[2/3] rounded-[6px] md:rounded-[10px]'
                  : cardAspectRatio === '9:16'
                  ? isShortLandscape
                    ? 'w-[210px] aspect-video rounded-[6px] md:rounded-[10px]'
                    : 'w-[calc((100vw-24px)/2.5)] sm:w-[180px] md:w-[calc((100vw-112px)/4.05)] md:aspect-video aspect-[9/16] rounded-[6px] md:rounded-[10px]'
                  : 'w-[calc((100vw-20px)/2.12)] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px] aspect-video rounded-[6px] md:rounded-[10px]'
              }`}
            />
          ))}
        </div>
      ) : (
        /* Horizontal Cards Row */
        <div
          onMouseEnter={() => {
            setGlobalActiveFeedId(feed.id);
            updateNavPosition();
            updateScrollButtons();
          }}
          className="relative w-full"
        >
          {/* Native CSS Navigation Chevrons: ONLY show for the single active feed the user cursor/pointer is on */}
          {!isModalOpen && !isMobile && !isTablet && isThisStripActive && !isPopoutHideNav && (
            <>
              {canScrollLeft && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('left');
                  }}
                  aria-label="Scroll left"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : '0px',
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : '100%',
                    background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute left-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 select-none"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScroll('right');
                  }}
                  aria-label="Scroll right"
                  style={{
                    top: navButtonTop !== null ? `${navButtonTop}px` : '0px',
                    height: navButtonHeight !== null ? `${navButtonHeight}px` : '100%',
                    background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
                  }}
                  className="group/nav absolute right-0 z-40 w-12 sm:w-14 md:w-16 rounded-none text-white flex items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 select-none"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}
            </>
          )}

          <div
            ref={scrollContainerRef}
            className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar ${
              isStretchableFeed ? 'pt-1 pb-1 md:pt-2 md:pb-6' : 'pt-1 pb-1'
            } pl-2.5 sm:pl-4 md:pl-8 xl:pl-12 pr-3.5 sm:pr-4 md:pr-8 xl:pr-12`}
          >
            {filteredShows.map((show, index) => (
              <ShowCard
                key={`${feed.id}-${show.id}`}
                show={show}
                rankNumber={feed.showRankNumbers ? index + 1 : undefined}
                showTop10Badge={showTop10Badges !== false && !isTop10Feed && top10ShowIds.includes(show.id)}
                isFirst={index === 0}
                isLast={index === filteredShows.length - 1}
                isInWatchlist={watchlist.includes(show.id)}
                onToggleWatchlist={onToggleWatchlist}
                onOpenDetails={onOpenDetails}
                onPlay={onPlayShow}
                onIncrementPoints={onIncrementPoints}
                isGlobalMuted={isGlobalMuted}
                onToggleGlobalMute={onToggleGlobalMute}
                onHoverPreviewStart={handleCardHoverStart}
                onHoverPreviewEnd={handleCardHoverEnd}
                onPopoutViewOpen={handlePopoutOpen}
                onPopoutViewClose={handlePopoutClose}
                aspectRatio={cardAspectRatio}
                isContinueWatching={isContinueWatchingFeed}
                isWatchlistLandscape={false}
                watchProgress={watchHistory?.[show.id]}
                disablePopout={disablePopout}
                isStretchable={isStretchableFeed}
                onLongPress={onLongPressShow}
                isLiked={likedShowIds ? likedShowIds.includes(show.id) : false}
                onToggleLike={onToggleLike}
                deferImageLoad={!loadedCardIndices.has(index)}
                skeletonDelayMs={index * 150}
                popoutStyle={desktopPopoutStyle}
                biggerCards={effectiveBiggerCards}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

