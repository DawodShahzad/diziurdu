import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Show, FeedConfig } from '../types';
import { ShowCard, triggerGlobalScroll, getGlobalMousePos } from './ShowCard';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { attachHlsVideo } from '../utils/hlsHelper';

interface FeedStripProps {
  feed: FeedConfig;
  shows: Show[];
  customShows?: Show[];
  watchlist: string[];
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
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
}

// Global Active Feed Strip tracking:
// Guarantees that STRICTLY ONLY 1 ROW shows left/right navigation badges at a time, never ever 2 at a time.
let globalActiveFeedId: string | null = null;
const globalFeedListeners = new Set<(activeId: string | null) => void>();

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
  showTop10Badges = true
}) => {
  const isContinueWatchingFeed =
    feed.id.includes('continue-watching') ||
    feed.title.toLowerCase().includes('continue watching');
  
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
  const [isAnyCardHovered, setIsAnyCardHovered] = useState<boolean>(false);
  const [isBtnHovered, setIsBtnHovered] = useState<boolean>(false);

  const activeFeedId = useActiveFeedId();
  const isThisStripActive = activeFeedId === feed.id;

  // Pixel-perfect chevron centering:
  // Dynamically measures the actual card thumbnail center Y relative to the parent container,
  // fixing any vertical displacement caused by container padding across all card aspect ratios.
  const [navButtonTop, setNavButtonTop] = useState<number | null>(null);

  const updateNavPosition = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const firstCard = scrollContainerRef.current.querySelector('[data-show-card="true"]') as HTMLElement | null;
    const parentEl = scrollContainerRef.current.parentElement;
    if (firstCard && parentEl) {
      const parentRect = parentEl.getBoundingClientRect();
      const cardRect = firstCard.getBoundingClientRect();
      const cardCenterY = (cardRect.top - parentRect.top) + (cardRect.height / 2);
      setNavButtonTop(Math.round(cardCenterY));
    }
  }, []);

  useEffect(() => {
    updateNavPosition();
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const ro = new ResizeObserver(() => {
      updateNavPosition();
    });
    ro.observe(sc);
    window.addEventListener('resize', updateNavPosition, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateNavPosition);
    };
  }, [updateNavPosition]);

  // Active cursor tracking: STRICTLY ONLY 1 row active across entire page at a time
  // Left/right navigation badges only appear when cursor/pointer is strictly on the rows of titles (not above or below)
  useEffect(() => {
    const handleCheckPointer = (e?: MouseEvent) => {
      if (!feedStripRef.current || !scrollContainerRef.current) return;
      const { x, y } = e ? { x: e.clientX, y: e.clientY } : getGlobalMousePos();
      
      const firstCard = scrollContainerRef.current.querySelector('[data-show-card="true"]') as HTMLElement | null;
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
          const fc = sc?.querySelector('[data-show-card="true"]') as HTMLElement | null;
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

    window.addEventListener('scroll', () => handleCheckPointer(), { passive: true, capture: true });
    window.addEventListener('mousemove', handleCheckPointer, { passive: true });
    return () => {
      window.removeEventListener('scroll', () => handleCheckPointer(), { capture: true });
      window.removeEventListener('mousemove', handleCheckPointer);
    };
  }, [feed.id]);

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
    const frameId = requestAnimationFrame(updateScrollButtons);
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
      const firstCard = el.querySelector('[data-show-card="true"]') as HTMLElement | null;
      if (!firstCard) return;
      const cardRect = firstCard.getBoundingClientRect();
      const y = e.clientY;

      // The feed does NOT scroll when the cursor or pointer is not in the line row of feed cards:
      // Don't scroll any row when cursor pointer is on top or bottom
      if (y < cardRect.top || y > cardRect.bottom) {
        e.preventDefault();
        // Forward vertical scrolling to the window so page scrolls vertically as normal
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
  }, [updateScrollButtons, filteredShows.length]);

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
  }, [isAnyCardHovered, filteredShows.length, updateScrollButtons]);

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
  const [isPosterCountdownDone, setIsPosterCountdownDone] = useState<boolean>(false);
  const [previewProgressPercent, setPreviewProgressPercent] = useState<number>(0);
  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const [isStripInViewport, setIsStripInViewport] = useState<boolean>(true);
  const posterCountdownTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const boundaryResetTimerRef = useRef<number | null>(null);

  // Active show mapped from virtual index
  const realActiveIndex = isMobileSpecialFeedCyclic ? mobileVirtualIndex % showCount : mobileVirtualIndex;
  const activeMobileShow = filteredShows[realActiveIndex] || filteredShows[0];

  // Initial scroll positioning to center Set 1's first card without smooth animation
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
        container.classList.remove('scroll-smooth');
        container.scrollLeft = elCenter - container.clientWidth / 2;
        requestAnimationFrame(() => {
          container.classList.add('scroll-smooth');
        });
      }
    };

    centerCard();
    const timer = setTimeout(centerCard, 50);
    return () => clearTimeout(timer);
  }, [isMobileSpecialFeedCyclic, showCount]);

  // Monitor viewport intersection for this strip
  useEffect(() => {
    if (!feed.isSpecialFeed || !isMobile) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsStripInViewport(entry.isIntersecting);
        if (!entry.isIntersecting && mobileVideoRef.current && !mobileVideoRef.current.paused) {
          mobileVideoRef.current.pause();
          setIsMobileVideoPlaying(false);
        }
      },
      { threshold: 0.2 }
    );
    if (feedStripRef.current) {
      observer.observe(feedStripRef.current);
    }
    return () => observer.disconnect();
  }, [feed.isSpecialFeed, isMobile]);

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

  // 3-second poster display before playing preview video
  useEffect(() => {
    if (!feed.isSpecialFeed || !isMobile || !isStripInViewport || isModalOpen) {
      setIsPosterCountdownDone(false);
      setPreviewProgressPercent(0);
      return;
    }

    setIsPosterCountdownDone(false);
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
    }, 3000);

    return () => {
      if (posterCountdownTimerRef.current) window.clearTimeout(posterCountdownTimerRef.current);
      if (progressIntervalRef.current) window.clearInterval(progressIntervalRef.current);
    };
  }, [mobileVirtualIndex, feed.isSpecialFeed, isMobile, isStripInViewport, isModalOpen]);

  // Video attachment effect for active mobile special feed card (starts ONLY after 3s poster countdown)
  useEffect(() => {
    if (
      !feed.isSpecialFeed ||
      !isMobile ||
      !activeMobileShow?.trailerUrl ||
      !isStripInViewport ||
      isModalOpen ||
      !isPosterCountdownDone
    ) {
      setIsMobileVideoPlaying(false);
      return;
    }

    const video = mobileVideoRef.current;
    if (!video) return;

    setIsMobileVideoPlaying(false);
    const cleanup = attachHlsVideo(video, activeMobileShow.trailerUrl, {
      autoPlay: true,
      muted: Boolean(isGlobalMuted)
    });

    return () => {
      setIsMobileVideoPlaying(false);
      if (cleanup) cleanup();
    };
  }, [
    feed.isSpecialFeed,
    isMobile,
    mobileVirtualIndex,
    activeMobileShow?.trailerUrl,
    isStripInViewport,
    isModalOpen,
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

      // If next card advanced past middle set (into Set 2), normalize smoothly back to Set 1 once scroll lands (~450ms)
      if (nextVirtual >= 2 * showCount) {
        window.setTimeout(() => {
          const normalizedVirtual = showCount + (nextVirtual % showCount);
          const normEl = mobileCardRefs.current[normalizedVirtual];
          const container = mobileCarouselRef.current;
          if (normEl && container) {
            container.classList.remove('scroll-smooth');
            const elCenter = normEl.offsetLeft + normEl.clientWidth / 2;
            container.scrollLeft = elCenter - container.clientWidth / 2;
            setMobileVirtualIndex(normalizedVirtual);
            requestAnimationFrame(() => {
              container.classList.add('scroll-smooth');
            });
          }
        }, 500);
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

  const handleMobileCarouselScroll = () => {
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

    if (closestVirtual !== mobileVirtualIndex) {
      setMobileVirtualIndex(closestVirtual);
      setIsPosterCountdownDone(false);
      setPreviewProgressPercent(0);
    }

    // Silent cyclic boundary normalization when scrolling comes to a stop in Set 0 or Set 2
    if (isMobileSpecialFeedCyclic) {
      if (boundaryResetTimerRef.current) {
        window.clearTimeout(boundaryResetTimerRef.current);
      }
      boundaryResetTimerRef.current = window.setTimeout(() => {
        if (closestVirtual < showCount || closestVirtual >= 2 * showCount) {
          const normalizedVirtual = showCount + (closestVirtual % showCount);
          const targetEl = mobileCardRefs.current[normalizedVirtual];
          if (targetEl && mobileCarouselRef.current) {
            const elCenter = targetEl.offsetLeft + targetEl.clientWidth / 2;
            const scrollContainer = mobileCarouselRef.current;
            scrollContainer.classList.remove('scroll-smooth');
            scrollContainer.scrollLeft = elCenter - scrollContainer.clientWidth / 2;
            setMobileVirtualIndex(normalizedVirtual);
            requestAnimationFrame(() => {
              scrollContainer.classList.add('scroll-smooth');
            });
          }
        }
      }, 160);
    }
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
    const bgPicture = feed.specialBgImageUrl || (filteredShows[0]?.backdropUrl || filteredShows[0]?.posterLandscapeUrl || 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1920&q=80');
    // Only apply darkness if configured by admin, do not add darkness ourselves
    const darknessPercent = typeof feed.specialBgDarkness === 'number' ? feed.specialBgDarkness : 0;

    return (
      <div
        ref={feedStripRef}
        data-feed-strip="true"
        data-feed-id={feed.id}
        className={`relative group/strip transition-all my-5 sm:my-6 w-full min-h-[440px] sm:min-h-[375px] md:min-h-[412px] lg:min-h-[435px] flex items-center justify-center pb-8 sm:pb-4 ${
          isAnyCardHovered || isAnyCardExpanded ? 'z-[100]' : 'z-0'
        }`}
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
          <img
            src={bgPicture}
            alt=""
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
                      top: navButtonTop !== null ? `${navButtonTop}px` : '50%',
                      transform: 'translateY(-50%)'
                    }}
                    className="absolute left-0 z-40 w-6 sm:w-6.5 md:w-7 h-16 sm:h-20 rounded-r-lg bg-black/75 hover:bg-black/95 text-white/90 hover:text-white active:bg-black/90 flex items-center justify-center cursor-pointer shadow-none border-0 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
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
                      top: navButtonTop !== null ? `${navButtonTop}px` : '50%',
                      transform: 'translateY(-50%)'
                    }}
                    className="absolute right-0 z-40 w-5 sm:w-5.5 md:w-6 h-16 sm:h-20 rounded-l-lg bg-black/50 hover:bg-black/80 text-white/90 hover:text-white active:bg-black/60 flex items-center justify-center cursor-pointer shadow-md border-0 transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
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
                  className="flex items-center overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar pl-2 pr-6 gap-2.5 py-1 select-none w-full"
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
                        ref={(el) => {
                          mobileCardRefs.current[item.virtualIdx] = el;
                        }}
                        onClick={() => onOpenDetails(show)}
                        className={`w-[80vw] max-w-[340px] shrink-0 snap-center aspect-[16/9] rounded-xl overflow-hidden relative shadow-none bg-[#16171d] border-0 transition-transform duration-300 cursor-pointer ${
                          isActive ? 'scale-100' : 'scale-95 opacity-80'
                        }`}
                      >
                        {/* 1px inner border overlay with exact same opacity as in recommendation */}
                        <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border border-zinc-400/[0.09]" />

                        {/* Base Artwork Image */}
                        <img
                          src={backdrop}
                          alt={show.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        {/* Video preview overlay on active card (shows ONLY after 3s poster countdown, fills container without black bars) */}
                        {isActive && isPosterCountdownDone && show.trailerUrl && isStripInViewport && !isModalOpen && (
                          <video
                            ref={mobileVideoRef}
                            poster={backdrop}
                            autoPlay
                            muted={Boolean(isGlobalMuted)}
                            playsInline
                            onPlaying={() => {
                              setIsMobileVideoPlaying(true);
                            }}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleMobilePreviewEnded}
                            className={`absolute inset-0 w-full h-full object-cover scale-[1.01] transition-opacity duration-500 ${
                              isMobileVideoPlaying ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        )}

                        {/* Subtle bottom glare matching popout view */}
                        <div
                          className="absolute inset-0 pointer-events-none z-10"
                          style={{
                            background:
                              'radial-gradient(ellipse 75% 65% at 0% 100%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 35%, rgba(0,0,0,0.05) 60%, transparent 80%)'
                          }}
                        />

                        {/* Top-Right Mute / Unmute Button on active card */}
                        {isActive && onToggleGlobalMute && isMobileVideoPlaying && (
                          <div className="absolute top-2.5 right-2.5 z-30">
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
                              className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer shadow backdrop-blur-sm"
                              aria-label="Toggle mute"
                            >
                              {isGlobalMuted ? (
                                <VolumeX className="w-3.5 h-3.5 text-white" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>
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
                className="flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar pt-1 pb-1 md:pt-24 md:-mt-24 md:pb-48 md:-mb-48 pl-1 pr-0 w-full"
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
                      disablePopout={disablePopout}
                      isStretchable={isStretchableFeed}
                      onLongPress={onLongPressShow}
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

  return (
    <div
      ref={feedStripRef}
      data-feed-strip="true"
      data-feed-id={feed.id}
      className={`relative group/strip transition-all ${
        isAnyCardHovered || isAnyCardExpanded ? 'z-[100]' : 'z-0'
      }`}
    >
      {/* Header Container */}
      <div className="relative z-30 w-full pl-2 sm:pl-4 md:pl-8 xl:pl-12 pr-4 md:pr-8 xl:pr-12 mb-3 flex items-end justify-between">
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
            {feed.title}
          </h3>
        </div>
      </div>

      {/* Horizontal Cards Row */}
      <div
        onMouseEnter={() => setGlobalActiveFeedId(feed.id)}
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
                  top: navButtonTop !== null ? `${navButtonTop}px` : 'calc(5rem + 5rem)',
                  transform: 'translateY(-50%)'
                }}
                className="absolute left-0 z-40 w-5 sm:w-5.5 md:w-6 h-20 sm:h-24 rounded-r-lg bg-black/40 hover:bg-black/75 text-white/90 hover:text-white active:bg-black/60 flex items-center justify-center cursor-pointer shadow-xl border-0 transition-all"
              >
                <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
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
                  top: navButtonTop !== null ? `${navButtonTop}px` : 'calc(5rem + 5rem)',
                  transform: 'translateY(-50%)'
                }}
                className="absolute right-0 z-40 w-5 sm:w-5.5 md:w-6 h-20 sm:h-24 rounded-l-lg bg-black/40 hover:bg-black/75 text-white/90 hover:text-white active:bg-black/60 flex items-center justify-center cursor-pointer shadow-xl border-0 transition-all"
              >
                <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
              </button>
            )}
          </>
        )}

        <div
          ref={scrollContainerRef}
          className={`flex items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 overflow-x-auto no-scrollbar ${
            isStretchableFeed ? 'pt-1 pb-1 md:pt-2 md:pb-6' : 'pt-1 pb-1 md:pt-24 md:-mt-24 md:pb-48 md:-mb-48'
          } pl-2 sm:pl-4 md:pl-8 xl:pl-12 pr-4 md:pr-8 xl:pr-12`}
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
              disablePopout={disablePopout}
              isStretchable={isStretchableFeed}
              onLongPress={onLongPressShow}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

