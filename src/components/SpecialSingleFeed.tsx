import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Show, DetailsOriginMeta } from '../types';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2, Play, Plus, Check, Info } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface SpecialSingleFeedProps {
  shows: Show[];
  onPlay: (show: Show) => void;
  onOpenDetails: (show: Show, originMeta?: DetailsOriginMeta) => void;
  watchlist?: string[];
  onToggleWatchlist?: (showId: string) => void;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (muted: boolean) => void;
  className?: string;
  isMobile?: boolean;
  isPaused?: boolean;
  isAnyOtherCardHovered?: boolean;
  isSearchSpotlight?: boolean;
}

export const SpecialSingleFeed: React.FC<SpecialSingleFeedProps> = ({
  shows,
  onPlay,
  onOpenDetails,
  watchlist = [],
  onToggleWatchlist,
  isGlobalMuted = true,
  onToggleGlobalMute,
  className = '',
  isMobile = false,
  isPaused = false,
  isAnyOtherCardHovered = false,
  isSearchSpotlight = false
}) => {
  // Keep up to 4 curated shows in single special feed carousel (memoized for stable effect deps)
  const feedShows = useMemo(
    () => (shows && shows.length > 0 ? shows.slice(0, 4) : []),
    [shows]
  );
  const mobileFeedShows = feedShows;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');

  // Screen width detection to avoid mounting duplicate <video> elements in DOM (prevents echoing)
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return Boolean(isMobile);
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState<boolean>(false);
  const [isDesktopPosterFadedForPreview, setIsDesktopPosterFadedForPreview] = useState<boolean>(false);
  const [isDesktopScrollBlackFade, setIsDesktopScrollBlackFade] = useState<boolean>(false);
  const [desktopNavPhase, setDesktopNavPhase] = useState<'idle' | 'exiting' | 'entering-prepare' | 'entering'>('idle');
  const [isMobileLogoShrunk, setIsMobileLogoShrunk] = useState<boolean>(false);
  const [localMuted, setLocalMuted] = useState<boolean>(isGlobalMuted);
  const [isInViewport, setIsInViewport] = useState<boolean>(true);
  const [isMobileCardFullyExposed, setIsMobileCardFullyExposed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return !isMobile;
  });
  const [desktopMediaAspect, setDesktopMediaAspect] = useState<number>(16 / 9);
  const [desktopShowcaseSize, setDesktopShowcaseSize] = useState<{ w: number; h: number }>({ w: 1200, h: 430 });
  const [isDesktop50Visible, setIsDesktop50Visible] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const desktopShowcaseRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastWheelTimeRef = useRef<number>(0);
  const desktopPosterAspectRef = useRef<Record<string, number>>({});
  const desktopVideoAspectRef = useRef<Record<string, number>>({});
  const isDesktop50VisibleRef = useRef<boolean>(true);
  const feedShowsRef = useRef(feedShows);
  feedShowsRef.current = feedShows;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const readinessRef = useRef({
    isInViewport: true,
    isDesktop50Visible: true,
    isPaused: false,
    isAnyOtherCardHovered: false
  });
  readinessRef.current = {
    isInViewport,
    isDesktop50Visible,
    isPaused,
    isAnyOtherCardHovered
  };
  const desktopPlaybackStateRef = useRef({
    isVideoPlaying: false,
    shouldPlayVideo: false,
    isVideoLoading: false,
    isPosterFaded: false
  });
  desktopPlaybackStateRef.current = {
    isVideoPlaying,
    shouldPlayVideo,
    isVideoLoading,
    isPosterFaded: isDesktopPosterFadedForPreview
  };
  const startPreviewTimerRef = useRef<number | null>(null);
  const desktopPosterFadeTimerRef = useRef<number | null>(null);
  const previewEndedHoldTimerRef = useRef<number | null>(null);
  const previewFadeCleanupTimerRef = useRef<number | null>(null);
  const desktopBlackFadeTimerRef = useRef<number | null>(null);
  const slideAnimTimerRef = useRef<number | null>(null);
  const slideRafRef = useRef<number | null>(null);
  const desktopNavTimerRef = useRef<number | null>(null);
  const desktopNavSettleTimerRef = useRef<number | null>(null);
  const desktopNavRafRef = useRef<number | null>(null);

  const effectiveMuted = onToggleGlobalMute !== undefined ? isGlobalMuted : localMuted;
  const currentShow = mobileFeedShows[currentIndex] || feedShows[0];

  // Keep mute state in sync
  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !effectiveMuted;
    if (onToggleGlobalMute) {
      onToggleGlobalMute(nextMuted);
    } else {
      setLocalMuted(nextMuted);
    }
    videoRefs.current.forEach((v) => {
      if (v) v.muted = nextMuted;
    });
    mobileVideoRefs.current.forEach((v) => {
      if (v) v.muted = nextMuted;
    });
  };

  const clearPreviewEndTimers = useCallback(() => {
    if (desktopPosterFadeTimerRef.current) {
      window.clearTimeout(desktopPosterFadeTimerRef.current);
      desktopPosterFadeTimerRef.current = null;
    }
    if (previewEndedHoldTimerRef.current) {
      window.clearTimeout(previewEndedHoldTimerRef.current);
      previewEndedHoldTimerRef.current = null;
    }
    if (previewFadeCleanupTimerRef.current) {
      window.clearTimeout(previewFadeCleanupTimerRef.current);
      previewFadeCleanupTimerRef.current = null;
    }
    if (desktopBlackFadeTimerRef.current) {
      window.clearTimeout(desktopBlackFadeTimerRef.current);
      desktopBlackFadeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPreviewEndTimers();
      if (slideAnimTimerRef.current) window.clearTimeout(slideAnimTimerRef.current);
      if (slideRafRef.current) cancelAnimationFrame(slideRafRef.current);
      if (desktopNavTimerRef.current) window.clearTimeout(desktopNavTimerRef.current);
      if (desktopNavSettleTimerRef.current) window.clearTimeout(desktopNavSettleTimerRef.current);
      if (desktopNavRafRef.current) cancelAnimationFrame(desktopNavRafRef.current);
    };
  }, [clearPreviewEndTimers]);

  // Measure desktop showcase dimensions so left ambient glow scales down cleanly when poster/video gets more width
  useEffect(() => {
    if (isMobileScreen) return;
    const el = desktopShowcaseRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setDesktopShowcaseSize({ w: r.width, h: r.height });
      }
    };
    measure();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    window.addEventListener('resize', measure, { passive: true });
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isMobileScreen]);

  const startSlideTransition = useCallback(
    (direction: 'next' | 'prev', targetIdx: number) => {
      if (slideAnimTimerRef.current) window.clearTimeout(slideAnimTimerRef.current);
      if (slideRafRef.current) cancelAnimationFrame(slideRafRef.current);
      if (desktopNavTimerRef.current) window.clearTimeout(desktopNavTimerRef.current);
      if (desktopNavSettleTimerRef.current) window.clearTimeout(desktopNavSettleTimerRef.current);
      if (desktopNavRafRef.current) cancelAnimationFrame(desktopNavRafRef.current);

      if (!isMobileScreen) {
        // Desktop: fade & swipe away current picture/preview first to pure black, then slide in new title
        setSlideDirection(direction);
        setDesktopNavPhase('exiting');
        videoRefs.current.forEach((v) => {
          if (v && !v.paused) v.pause();
        });
        desktopNavTimerRef.current = window.setTimeout(() => {
          setShouldPlayVideo(false);
          setIsVideoPlaying(false);
          setIsVideoLoading(false);
          setIsDesktopPosterFadedForPreview(false);
          setIsDesktopScrollBlackFade(false);
          setCurrentIndex(targetIdx);
          setDesktopNavPhase('entering-prepare');
          desktopNavRafRef.current = requestAnimationFrame(() => {
            desktopNavRafRef.current = requestAnimationFrame(() => {
              setDesktopNavPhase('entering');
            });
          });
          desktopNavSettleTimerRef.current = window.setTimeout(() => {
            setDesktopNavPhase('idle');
            desktopNavSettleTimerRef.current = null;
          }, 380);
          desktopNavTimerRef.current = null;
        }, 270);
        return;
      }

      setSlideDirection(direction);
      setCurrentIndex(targetIdx);
    },
    [isMobileScreen]
  );

  // Desktop navigation handlers
  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      clearPreviewEndTimers();
      if (currentIndex <= 0) return;
      startSlideTransition('prev', Math.max(0, currentIndex - 1));
    },
    [currentIndex, clearPreviewEndTimers, startSlideTransition]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      clearPreviewEndTimers();
      if (currentIndex >= feedShows.length - 1) return;
      startSlideTransition('next', Math.min(feedShows.length - 1, currentIndex + 1));
    },
    [currentIndex, feedShows.length, clearPreviewEndTimers, startSlideTransition]
  );

  // Trackpad horizontal swipe navigation on desktop with debounced step
  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 35 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const now = Date.now();
      if (now - lastWheelTimeRef.current > 500) {
        lastWheelTimeRef.current = now;
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  // Restore cached poster aspect ratio immediately when active show changes
  useEffect(() => {
    const activeId = feedShows[currentIndex]?.id;
    setDesktopMediaAspect((activeId && desktopPosterAspectRef.current[activeId]) || 16 / 9);
  }, [currentIndex, shows]);

  // Strict check: full mobile card must sit completely between top and bottom navbars (never touching either)
  const evaluateMobileCardExposure = useCallback(() => {
    if (!isMobileScreen) {
      setIsMobileCardFullyExposed(true);
      return;
    }
    const cardWrapper = mobileCardRefs.current[currentIndex];
    const visualCard =
      (cardWrapper?.querySelector('[data-special-card-inner="true"]') as HTMLElement | null) ||
      cardWrapper;
    if (!visualCard) {
      setIsMobileCardFullyExposed(false);
      return;
    }
    const rect = visualCard.getBoundingClientRect();
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
    document.querySelectorAll<HTMLElement>('[data-mobile-bottom-navbar="true"]').forEach((navEl) => {
      const nr = navEl.getBoundingClientRect();
      if (nr.width > 0 && nr.height > 0 && nr.top < vh && nr.bottom > vh / 2) {
        bottomLimit = Math.min(bottomLimit, nr.top);
      }
    });

    const clearance = 2;
    const fullyExposed =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.left >= 0 &&
      rect.right <= vw &&
      rect.top > topLimit + clearance &&
      rect.bottom < bottomLimit - clearance;

    setIsMobileCardFullyExposed(fullyExposed);
    if (!fullyExposed) {
      if (startPreviewTimerRef.current) {
        window.clearTimeout(startPreviewTimerRef.current);
      }
      clearPreviewEndTimers();
      setShouldPlayVideo(false);
      setIsVideoPlaying(false);
      setIsVideoLoading(false);
      mobileVideoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });
    }
  }, [currentIndex, isMobileScreen, clearPreviewEndTimers]);

  const scheduleDesktopPreviewStart = useCallback(() => {
    if (startPreviewTimerRef.current) {
      window.clearTimeout(startPreviewTimerRef.current);
      startPreviewTimerRef.current = null;
    }
    if (desktopPosterFadeTimerRef.current) {
      window.clearTimeout(desktopPosterFadeTimerRef.current);
      desktopPosterFadeTimerRef.current = null;
    }

    const r = readinessRef.current;
    const isReady = r.isInViewport && isDesktop50VisibleRef.current && !document.hidden && !r.isPaused && !r.isAnyOtherCardHovered;
    if (!isReady) return;

    startPreviewTimerRef.current = window.setTimeout(() => {
      startPreviewTimerRef.current = null;
      // Fade poster out completely to pure black (#000000), hold briefly, then begin preview playback
      setIsDesktopPosterFadedForPreview(true);
      desktopPosterFadeTimerRef.current = window.setTimeout(() => {
        const activeId = feedShowsRef.current[currentIndexRef.current]?.id;
        if (activeId && desktopVideoAspectRef.current[activeId]) {
          setDesktopMediaAspect(desktopVideoAspectRef.current[activeId]);
        }
        setIsVideoLoading(true);
        setShouldPlayVideo(true);
        desktopPosterFadeTimerRef.current = null;
      }, 540);
    }, 1500);
  }, []);

  // Preview timing logic:
  // Show backdrop initially. On desktop: fades poster out completely to black, then preview begins.
  useEffect(() => {
    clearPreviewEndTimers();
    setIsVideoLoading(false);
    setIsVideoPlaying(false);
    setShouldPlayVideo(false);
    setIsDesktopPosterFadedForPreview(false);
    setIsDesktopScrollBlackFade(false);
    setIsMobileLogoShrunk(false);

    if (startPreviewTimerRef.current) {
      window.clearTimeout(startPreviewTimerRef.current);
      startPreviewTimerRef.current = null;
    }

    const isReadyForPreview =
      isInViewport &&
      (isMobileScreen ? isMobileCardFullyExposed : isDesktop50VisibleRef.current) &&
      !document.hidden &&
      !isPaused &&
      (!isAnyOtherCardHovered || isMobileScreen);

    if (isReadyForPreview) {
      if (!isMobileScreen) {
        scheduleDesktopPreviewStart();
      } else {
        startPreviewTimerRef.current = window.setTimeout(() => {
          setIsVideoLoading(true);
          setShouldPlayVideo(true);
        }, 1500);
      }
    }

    return () => {
      if (startPreviewTimerRef.current) {
        window.clearTimeout(startPreviewTimerRef.current);
        startPreviewTimerRef.current = null;
      }
    };
  }, [currentIndex, isInViewport, isMobileScreen, isMobileCardFullyExposed, isPaused, isAnyOtherCardHovered, clearPreviewEndTimers, scheduleDesktopPreviewStart]);

  // Re-schedule preview when card scrolls back above the 50% visibility threshold (do NOT interrupt fade-to-black when scrolling out)
  useEffect(() => {
    if (isMobileScreen || !isDesktop50Visible) return;
    if (!desktopPlaybackStateRef.current.shouldPlayVideo && !desktopPlaybackStateRef.current.isVideoPlaying && !startPreviewTimerRef.current) {
      scheduleDesktopPreviewStart();
    }
  }, [isDesktop50Visible, isMobileScreen, scheduleDesktopPreviewStart]);

  // Desktop page scroll visibility rule:
  // Do NOT pause during normal scrolling; ONLY pause, fade out to pure black, and restore original-size poster
  // when 50% or more of the card sits under the top navbar or below the bottom screen edge.
  const evaluateDesktopExposure = useCallback(() => {
    if (isMobileScreen) return;
    const cardEl = desktopShowcaseRef.current;
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    let navBottom = 0;
    const primaryNavBar = document.querySelector<HTMLElement>('[data-desktop-navbar-bar="true"]');
    if (primaryNavBar) {
      const nr = primaryNavBar.getBoundingClientRect();
      if (nr.width > 0 && nr.height > 0 && nr.bottom > 0 && nr.top < vh / 2) {
        navBottom = Math.max(navBottom, nr.bottom);
      }
    } else {
      const headerEl = document.querySelector<HTMLElement>('header');
      if (headerEl) {
        const hr = headerEl.getBoundingClientRect();
        if (hr.width > 0 && hr.height > 0 && hr.bottom > 0 && hr.top < vh / 2) {
          navBottom = Math.max(navBottom, Math.min(hr.bottom, 76));
        }
      }
    }

    const visibleTop = Math.max(rect.top, navBottom, 0);
    const visibleBottom = Math.min(rect.bottom, vh);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;
    const isExposedOver50 = visibleRatio > 0.5;

    if (isExposedOver50 === isDesktop50VisibleRef.current) {
      return;
    }

    isDesktop50VisibleRef.current = isExposedOver50;
    setIsDesktop50Visible(isExposedOver50);

    if (!isExposedOver50) {
      if (startPreviewTimerRef.current) {
        window.clearTimeout(startPreviewTimerRef.current);
        startPreviewTimerRef.current = null;
      }
      if (desktopPosterFadeTimerRef.current) {
        window.clearTimeout(desktopPosterFadeTimerRef.current);
        desktopPosterFadeTimerRef.current = null;
      }

      const activeId = feedShows[currentIndex]?.id;
      const curState = desktopPlaybackStateRef.current;
      const hadActivePreview =
        curState.isVideoPlaying || curState.shouldPlayVideo || curState.isVideoLoading || curState.isPosterFaded;
      videoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });

      if (hadActivePreview) {
        setIsDesktopScrollBlackFade(true);
        setIsDesktopPosterFadedForPreview(true);
        setIsVideoPlaying(false);
        setIsVideoLoading(false);
        if (desktopBlackFadeTimerRef.current) {
          window.clearTimeout(desktopBlackFadeTimerRef.current);
        }
        desktopBlackFadeTimerRef.current = window.setTimeout(() => {
          // Restore poster's original aspect ratio while everything is pure black
          setShouldPlayVideo(false);
          setDesktopMediaAspect((activeId && desktopPosterAspectRef.current[activeId]) || 16 / 9);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsDesktopScrollBlackFade(false);
              setIsDesktopPosterFadedForPreview(false);
            });
          });
          desktopBlackFadeTimerRef.current = null;
        }, 460);
      }
    }
  }, [isMobileScreen, feedShows, currentIndex]);

  useEffect(() => {
    if (isMobileScreen) return;
    evaluateDesktopExposure();
    window.addEventListener('scroll', evaluateDesktopExposure, { passive: true });
    window.addEventListener('resize', evaluateDesktopExposure, { passive: true });
    return () => {
      window.removeEventListener('scroll', evaluateDesktopExposure);
      window.removeEventListener('resize', evaluateDesktopExposure);
    };
  }, [isMobileScreen, evaluateDesktopExposure]);

  // Mobile layout: PNG logo starts big and shrinks down 10% after 0.5 second of preview start
  useEffect(() => {
    if (!isMobileScreen || !isVideoPlaying) {
      setIsMobileLogoShrunk(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setIsMobileLogoShrunk(true);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [isMobileScreen, isVideoPlaying, currentIndex]);

  // Pause all preview videos immediately when isPaused is true or when user hovers over another card below
  useEffect(() => {
    if (isPaused || isAnyOtherCardHovered) {
      setShouldPlayVideo(false);
      setIsVideoPlaying(false);
      setIsVideoLoading(false);
      setIsDesktopPosterFadedForPreview(false);
      videoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });
      mobileVideoRefs.current.forEach((v) => {
        if (v && !v.paused) v.pause();
      });
    }
  }, [isPaused, isAnyOtherCardHovered]);

  // Mark video as playing once frames start rolling
  const handleVideoPlaying = () => {
    setIsVideoLoading(false);
    setIsVideoPlaying(true);
  };

  // IntersectionObserver & scroll listeners for desktop visibility and strict full mobile card exposure
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = Boolean(entry && entry.isIntersecting);
        setIsInViewport(isVisible);
        if (isMobileScreen) {
          evaluateMobileCardExposure();
        }
        if (!isVisible) {
          videoRefs.current.forEach((v) => {
            if (v && !v.paused) v.pause();
          });
          mobileVideoRefs.current.forEach((v) => {
            if (v && !v.paused) v.pause();
          });
        }
      },
      { threshold: [0, 0.2, 0.5, 0.85, 1] }
    );

    observer.observe(el);

    if (isMobileScreen) {
      evaluateMobileCardExposure();
      window.addEventListener('scroll', evaluateMobileCardExposure, { passive: true, capture: true });
      window.addEventListener('resize', evaluateMobileCardExposure, { passive: true });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', evaluateMobileCardExposure, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', evaluateMobileCardExposure);
    };
  }, [isMobileScreen, evaluateMobileCardExposure]);

  // Pause preview when user leaves page / switches tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        videoRefs.current.forEach((v) => {
          if (v && !v.paused) v.pause();
        });
        mobileVideoRefs.current.forEach((v) => {
          if (v && !v.paused) v.pause();
        });
      } else if (
        isInViewport &&
        (!isMobileScreen || isMobileCardFullyExposed) &&
        shouldPlayVideo &&
        !isPaused
      ) {
        if (!isMobileScreen) {
          const activeDesktopVideo = videoRefs.current[currentIndex];
          if (activeDesktopVideo) activeDesktopVideo.play().catch(() => {});
        } else {
          const activeMobileVideo = mobileVideoRefs.current[currentIndex];
          if (activeMobileVideo) activeMobileVideo.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isInViewport, isMobileCardFullyExposed, shouldPlayVideo, currentIndex, isMobileScreen, isPaused]);

  // Helper to convert any hex color to atmospheric rgba for deep background glow
  const getAtmosphericBg = (hex: string, alpha = 0.22) => {
    let cleanHex = (hex || '#0d9488').replace('#', '');
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map((c) => c + c).join('');
    }
    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return `rgba(13, 20, 24, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // When preview video finishes playing:
  // Desktop: fade video out completely to pure black (#000000) first, restore original poster size while black, then fade poster back in for 2s before advancing.
  const handleVideoEnded = () => {
    clearPreviewEndTimers();
    setIsVideoPlaying(false);
    setIsVideoLoading(false);

    if (!isMobileScreen) {
      const activeId = feedShows[currentIndex]?.id;
      setIsDesktopPosterFadedForPreview(true);
      previewFadeCleanupTimerRef.current = window.setTimeout(() => {
        setShouldPlayVideo(false);
        setDesktopMediaAspect((activeId && desktopPosterAspectRef.current[activeId]) || 16 / 9);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsDesktopPosterFadedForPreview(false);
          });
        });
        previewFadeCleanupTimerRef.current = null;

        if (currentIndex < feedShows.length - 1) {
          previewEndedHoldTimerRef.current = window.setTimeout(() => {
            previewEndedHoldTimerRef.current = null;
            handleNext();
          }, 2000);
        }
      }, 540);
      return;
    }

    setIsDesktopPosterFadedForPreview(false);
    previewFadeCleanupTimerRef.current = window.setTimeout(() => {
      setShouldPlayVideo(false);
      previewFadeCleanupTimerRef.current = null;
    }, 450);

    if (currentIndex < feedShows.length - 1) {
      previewEndedHoldTimerRef.current = window.setTimeout(() => {
        previewEndedHoldTimerRef.current = null;
        handleNext();
      }, 2000);
    }
  };

  // Mobile touch/scroll tracking so auto-scroll never fights manual swipe inertia
  const scrollTimeoutRef = useRef<number | null>(null);
  const isTouchingRef = useRef<boolean>(false);
  const syncedFromScrollRef = useRef<boolean>(false);

  // Auto-advance horizontal scroll ONLY when changed programmatically (reverted old mobile behavior)
  useEffect(() => {
    if (!isMobileScreen) return;
    if (syncedFromScrollRef.current) {
      syncedFromScrollRef.current = false;
      return;
    }
    const targetEl = mobileCardRefs.current[currentIndex];
    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'start',
        block: 'nearest'
      });
    }
  }, [currentIndex, isMobileScreen]);

  const syncMobileIndexAfterSettle = useCallback(() => {
    if (!isMobileScreen || !mobileScrollRef.current) return;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      if (isTouchingRef.current) return;
      const container = mobileScrollRef.current;
      if (!container) return;
      const firstCard = mobileCardRefs.current[0];
      const stepWidth = firstCard ? firstCard.offsetWidth + 10 : Math.min(window.innerWidth - 54, 385) + 10;
      const closestIdx = Math.max(
        0,
        Math.min(mobileFeedShows.length - 1, Math.round(container.scrollLeft / Math.max(1, stepWidth)))
      );
      if (closestIdx !== currentIndex) {
        syncedFromScrollRef.current = true;
        setCurrentIndex(closestIdx);
      }
    }, 160);
  }, [currentIndex, isMobileScreen, mobileFeedShows.length]);

  const handleTouchStart = () => {
    isTouchingRef.current = true;
    setIsVideoPlaying(false);
    setShouldPlayVideo(false);
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    isTouchingRef.current = false;
    syncMobileIndexAfterSettle();
  };

  const handleMobileScroll = useCallback(() => {
    evaluateMobileCardExposure();
    syncMobileIndexAfterSettle();
  }, [evaluateMobileCardExposure, syncMobileIndexAfterSettle]);

  if (!feedShows || feedShows.length === 0 || !currentShow) return null;

  // Use feedShows list for single-show carousel on desktop
  const desktopShow = feedShows[currentIndex] || feedShows[0];
  const desktopBackdrop =
    desktopShow.desktopSpecialSingleFeedUrl ||
    desktopShow.backdropUrl2 ||
    desktopShow.backdropUrl ||
    desktopShow.posterLandscapeUrl;
  const desktopAmbient =
    desktopShow.desktopSpecialSingleFeedAmbiance ||
    desktopShow.ambientColor ||
    '#0d9488';
  const desktopAnnouncement =
    desktopShow.announcementPill ||
    desktopShow.shortDescription ||
    desktopShow.synopsis;
  const desktopIsInWatchlist = watchlist.includes(desktopShow.id);
  const desktopTrailer = desktopShow.trailerUrl || (desktopShow as any).streamUrl;

  const runtimeLabel =
    desktopShow.type === 'series'
      ? `${desktopShow.seasons?.length || 1} ${(desktopShow.seasons?.length || 1) === 1 ? 'Season' : 'Seasons'}`
      : desktopShow.durationOrSeasons || 'Movie';

  const watchLabel =
    desktopShow.type === 'series'
      ? `Watch S1 E1`
      : 'Watch Now';

  return (
    <section
      ref={containerRef}
      onWheel={handleWheel}
      className={`relative w-full my-2 sm:my-3 select-none overflow-visible ${className}`}
    >
      {/* Mobile Ambient Glare (zero blur filter for smooth 60/120fps swipe performance) */}
      <div
        className="md:hidden absolute inset-x-0 -top-6 -bottom-6 pointer-events-none z-0 opacity-30 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse 95% 75% at 50% 50%, ${getAtmosphericBg(currentShow.ambientColor || '#0d9488', 0.45)} 0%, transparent 75%)`
        }}
      />

      {/* Feed Section Title - omitted in Search Spotlight mode, lighter weight elsewhere */}
      {!isSearchSpotlight && (
        <div className="px-3.5 sm:px-4 md:px-8 xl:px-12 mb-1 sm:mb-1.5 relative z-10">
          <h2 className="text-white/95 font-semibold text-[15px] sm:text-base md:text-[17px] tracking-tight">
            Previews for you
          </h2>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT: Original Prime Video Single-Show Horizontal Showcase       */}
      {/* ========================================================================= */}
      {(() => {
        const estimatedMediaW = Math.min(desktopShowcaseSize.w * 0.8, desktopShowcaseSize.h * desktopMediaAspect);
        const leftBlackPx = Math.max(0, desktopShowcaseSize.w - estimatedMediaW);
        const leftBlackRatio = leftBlackPx / Math.max(1, desktopShowcaseSize.w);
        const ambientWidthPx = Math.max(115, Math.round(leftBlackPx * 0.84));
        const ambientOpacity = Math.min(0.22, Math.max(0.08, leftBlackRatio * 0.42));

        return (
      <div className={`hidden md:block relative w-full group/specialsingle ${isSearchSpotlight ? 'px-4 md:px-8 xl:px-12' : 'max-w-[1850px] mx-auto px-8 md:px-12 xl:px-16'}`}>
        <div
          ref={desktopShowcaseRef}
          className="relative w-full rounded-2xl overflow-hidden bg-black shadow-2xl h-[340px] lg:h-[395px] xl:h-[430px] flex items-center"
        >
          {/* Far-Left Atmospheric Glow: shrinks and stays tucked farther left as preview/poster expands */}
          <div
            className="absolute inset-y-0 left-0 pointer-events-none z-10 transition-all duration-700"
            style={{
              width: `${ambientWidthPx}px`,
              opacity: ambientOpacity,
              background: `radial-gradient(ellipse 68% 78% at 0% 50%, ${desktopAmbient} 0%, transparent 74%)`
            }}
          />

          {/* Right Side Backdrop + Video Preview Container: instant swap while pure black, ZERO aspect-ratio transition, max 80% width */}
          <div
            className="absolute top-0 bottom-0 right-0 h-full max-w-[80%] overflow-hidden bg-black pointer-events-none rounded-r-2xl"
            style={{
              aspectRatio: String(desktopMediaAspect),
              width: 'auto'
            }}
          >
            {/* Unified Slide/Fade Transition Stage: exits current picture or video completely before new poster enters */}
            <div
              key={`desktop-stage-${desktopShow.id}`}
              style={{
                opacity:
                  desktopNavPhase === 'exiting' || desktopNavPhase === 'entering-prepare'
                    ? 0
                    : 1,
                transform:
                  desktopNavPhase === 'exiting'
                    ? slideDirection === 'next'
                      ? 'translate3d(-32px, 0, 0)'
                      : 'translate3d(32px, 0, 0)'
                    : desktopNavPhase === 'entering-prepare'
                    ? slideDirection === 'next'
                      ? 'translate3d(42px, 0, 0)'
                      : 'translate3d(-42px, 0, 0)'
                    : 'translate3d(0, 0, 0)',
                transition:
                  desktopNavPhase === 'entering-prepare'
                    ? 'none'
                    : desktopNavPhase === 'exiting'
                    ? 'opacity 230ms ease-out, transform 230ms cubic-bezier(0.22, 1, 0.36, 1)'
                    : 'opacity 360ms ease-out, transform 360ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
              className="absolute inset-0 w-full h-full bg-black will-change-transform"
            >
              {/* Active Poster Image Wrapper: handles clean fade out to pure black before preview begins & fade in from pure black at exact original size */}
              <div
                className={`absolute inset-0 w-full h-full z-[2] bg-black transition-opacity duration-[380ms] ease-out ${
                  isVideoPlaying || isDesktopPosterFadedForPreview ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <MediaImage
                  key={`desktop-backdrop-${desktopShow.id}`}
                  src={desktopBackdrop}
                  fallbackTitle={desktopShow.title}
                  hideFallback={isVideoPlaying || isDesktopPosterFadedForPreview}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                      const ratio = img.naturalWidth / img.naturalHeight;
                      desktopPosterAspectRef.current[desktopShow.id] = ratio;
                      if (!shouldPlayVideo && !isVideoPlaying && !isDesktopPosterFadedForPreview) {
                        setDesktopMediaAspect(ratio);
                      }
                    }
                  }}
                  fallbackClassName="w-full h-full bg-black flex items-center justify-center p-6 text-center select-none"
                  fallbackTextClassName="text-white/80 font-bold text-xl font-sans"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              {/* Preview Video: zero zoom animation, fades cleanly out/in through pure black */}
              {!isMobileScreen && desktopTrailer && shouldPlayVideo && isInViewport && isDesktop50Visible && !isPaused && (
                <video
                  ref={(el) => {
                    videoRefs.current[currentIndex] = el;
                  }}
                  key={`desktop-video-${desktopShow.id}-${desktopTrailer}`}
                  src={desktopTrailer}
                  autoPlay
                  muted={effectiveMuted}
                  playsInline
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    if (vid.videoWidth > 0 && vid.videoHeight > 0) {
                      const vidRatio = vid.videoWidth / vid.videoHeight;
                      desktopVideoAspectRef.current[desktopShow.id] = vidRatio;
                      if (!isVideoPlaying && isDesktopPosterFadedForPreview) {
                        setDesktopMediaAspect(vidRatio);
                      }
                    }
                  }}
                  onWaiting={() => setIsVideoLoading(true)}
                  onPlaying={handleVideoPlaying}
                  onCanPlay={(e) => {
                    setIsVideoLoading(false);
                    if (e.currentTarget.paused) {
                      e.currentTarget.play().catch(() => {});
                    }
                  }}
                  onLoadedData={() => setIsVideoLoading(false)}
                  onEnded={handleVideoEnded}
                  className={`absolute inset-0 w-full h-full object-cover z-[3] transition-opacity duration-[380ms] ease-out ${
                    isVideoPlaying && !isDesktopScrollBlackFade ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              )}
            </div>

            {/* Full Black Fade Layer when >=50% scrolled out pauses desktop preview */}
            <div
              className={`absolute inset-0 bg-black pointer-events-none z-[4] transition-opacity duration-300 ${
                isDesktopScrollBlackFade ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Smooth Left-to-Right Seamless Dissolve */}
            <div
              className="absolute inset-y-0 left-0 w-36 lg:w-44 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(to right, #000000 0%, rgba(0,0,0,0.92) 24%, rgba(0,0,0,0.54) 54%, rgba(0,0,0,0.16) 80%, transparent 100%)'
              }}
            />
          </div>

          {/* Left Column Content without zoom animation */}
          <div
            key={`desktop-info-${desktopShow.id}`}
            style={{
              opacity: desktopNavPhase === 'exiting' || desktopNavPhase === 'entering-prepare' ? 0 : 1,
              transition: 'opacity 220ms ease-out'
            }}
            className="relative z-20 w-[44%] lg:w-[42%] p-8 lg:p-12 flex flex-col items-start gap-3"
          >
            {/* PNG ClearArt Logo (stays full big size, NO zoom out, NO drop shadow) */}
            <div className="origin-left">
              {desktopShow.titleLogoUrl ? (
                <img
                  src={desktopShow.titleLogoUrl}
                  alt={desktopShow.title}
                  referrerPolicy="no-referrer"
                  className="max-h-16 lg:max-h-20 w-auto max-w-[290px] lg:max-w-[340px] object-contain object-left bg-transparent"
                />
              ) : (
                <h3 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {desktopShow.title}
                </h3>
              )}
            </div>

            {/* Metadata Line */}
            <div className="flex items-center gap-2 text-xs lg:text-sm text-zinc-300 font-semibold flex-wrap">
              {desktopShow.maturityRating && (
                <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[11px]">
                  {desktopShow.maturityRating}
                </span>
              )}
              <span>{runtimeLabel}</span>
              {desktopShow.genres && desktopShow.genres.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-zinc-300">{desktopShow.genres.slice(0, 2).join(', ')}</span>
                </>
              )}
            </div>

            {/* Announcement Text */}
            {desktopAnnouncement && (
              <p className="text-xs lg:text-sm text-zinc-200 line-clamp-2 max-w-[380px] leading-relaxed font-medium">
                {desktopAnnouncement}
              </p>
            )}

            {/* Action Buttons: Watch Pill, (+) Watchlist, (i) Info */}
            <div className="mt-1 flex items-center gap-2.5">
              <button
                onClick={() => onPlay(desktopShow)}
                className="px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs lg:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                </svg>
                <span>{watchLabel}</span>
              </button>

              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(desktopShow.id)}
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700/90 text-white border border-white/15 flex items-center justify-center cursor-pointer transition-colors"
                  aria-label={desktopIsInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  title={desktopIsInWatchlist ? 'In My List' : 'Add to My List'}
                >
                  {desktopIsInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </button>
              )}

              <button
                onClick={(e) => onOpenDetails(desktopShow, { element: e.currentTarget, sourceFeedType: 'other', posterUrl: desktopBackdrop })}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700/90 text-white border border-white/15 flex items-center justify-center cursor-pointer transition-colors"
                aria-label="More Info"
                title="More Info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mute / Loading Indicator on Top Right of Desktop Preview */}
          {shouldPlayVideo && desktopTrailer && (
            <div className="absolute top-4 right-4 z-30">
              {isVideoLoading && !isVideoPlaying ? (
                <div className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center border border-white/15">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              ) : (
                <button
                  onClick={handleToggleMute}
                  className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer border border-white/15 transition-colors"
                  aria-label={effectiveMuted ? 'Unmute preview' : 'Mute preview'}
                >
                  {effectiveMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Left / Right Navigation Chevrons OUTSIDE container, NO background, shown only on container hover */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            aria-label="Previous show"
            className="absolute left-1 md:left-2 xl:left-3 top-1/2 -translate-y-1/2 z-30 w-11 h-16 bg-transparent text-white/75 hover:text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/specialsingle:opacity-100 transition-opacity duration-200 select-none"
          >
            <ChevronLeft className="w-9 h-9 stroke-[2.5]" />
          </button>
        )}

        {currentIndex < feedShows.length - 1 && (
          <button
            onClick={handleNext}
            aria-label="Next show"
            className="absolute right-1 md:right-2 xl:right-3 top-1/2 -translate-y-1/2 z-30 w-11 h-16 bg-transparent text-white/75 hover:text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/specialsingle:opacity-100 transition-opacity duration-200 select-none"
          >
            <ChevronRight className="w-9 h-9 stroke-[2.5]" />
          </button>
        )}
      </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT (Reverted to original working behavior)                     */}
      {/* ========================================================================= */}
      <div className="md:hidden relative w-full overflow-hidden z-10">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ scrollPaddingLeft: '14px', WebkitOverflowScrolling: 'touch', willChange: 'scroll-position', touchAction: 'pan-x pan-y' }}
          className="flex items-center overflow-x-auto snap-x overscroll-x-contain no-scrollbar scroll-pl-3.5 sm:scroll-pl-4 pl-3.5 sm:pl-4 pr-10 py-1.5 select-none relative z-10"
        >
          {mobileFeedShows.map((showItem, idx) => {
            const isActive = idx === currentIndex;
            const itemBackdrop = showItem.mobileSpecialSingleFeedUrl || showItem.backdropUrl2 || showItem.backdropUrl || showItem.posterLandscapeUrl;
            const itemTrailer = showItem.trailerUrl || (showItem as any).streamUrl;

            return (
              <div
                key={showItem.id}
                data-show-id={showItem.id}
                ref={(el) => {
                  mobileCardRefs.current[idx] = el;
                }}
                data-special-card="true"
                className="relative shrink-0 snap-start mr-2.5 w-[calc(100vw-54px)] sm:w-[calc(100vw-3rem)] max-w-[385px]"
              >
                {/* The Card: Pure black base, zero bottom background seam beneath preview */}
                <div
                  data-special-card-inner="true"
                  onClick={(e) => onOpenDetails(showItem, { element: e.currentTarget, sourceFeedType: 'other', posterUrl: itemBackdrop })}
                  className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-xl cursor-pointer"
                >
                  {/* Base Backdrop Artwork (fades out once video frames roll) */}
                  <MediaImage
                    src={itemBackdrop}
                    fallbackTitle={showItem.title}
                    hideFallback={isActive && isVideoPlaying}
                    fallbackClassName="absolute inset-0 w-full h-full bg-black flex items-center justify-center p-4 text-center select-none"
                    className={`absolute inset-0 w-full h-full object-cover scale-[1.01] transition-opacity duration-400 ${
                      isActive && isVideoPlaying ? 'opacity-0' : 'opacity-100'
                    }`}
                  />

                  {/* Video Preview: Rendered ONLY on mobile screens for active card when fully exposed */}
                  {isMobileScreen && isActive && itemTrailer && shouldPlayVideo && isInViewport && isMobileCardFullyExposed && !isPaused && (
                    <video
                      ref={(el) => {
                        mobileVideoRefs.current[idx] = el;
                      }}
                      key={`mobile-${showItem.id}-${itemTrailer}`}
                      src={itemTrailer}
                      poster={itemBackdrop}
                      autoPlay
                      muted={effectiveMuted}
                      playsInline
                      onWaiting={() => setIsVideoLoading(true)}
                      onPlaying={handleVideoPlaying}
                      onEnded={handleVideoEnded}
                      className={`absolute inset-0 w-full h-full object-cover scale-[1.02] transition-opacity duration-500 ${
                        isVideoPlaying ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}

                  {/* Top-Right Loading Spinner (after 1.5s poster while preview loads) -> Mute button once playing */}
                  {isActive && shouldPlayVideo && itemTrailer && (
                    <div className="absolute top-3 right-3 z-30 pointer-events-auto">
                      {isVideoLoading || !isVideoPlaying ? (
                        <div className="w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center border border-white/10">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={handleToggleMute}
                          className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-all border border-white/10"
                          aria-label={effectiveMuted ? 'Unmute' : 'Mute'}
                        >
                          {effectiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* PNG Logo Inside Card: Big on start, smoothly shrinks down 10% after 0.5 second of preview start */}
                  <div className="absolute bottom-3 left-3.5 sm:left-4 right-3 z-20 flex items-end justify-between gap-2.5 pointer-events-none">
                    <div
                      className="origin-bottom-left flex-1 min-w-0 transition-transform duration-700 ease-out"
                      style={{
                        transform: isActive && isMobileLogoShrunk ? 'scale(0.9)' : 'scale(1)'
                      }}
                    >
                      {showItem.titleLogoUrl ? (
                        <img
                          src={showItem.titleLogoUrl}
                          alt={showItem.title}
                          referrerPolicy="no-referrer"
                          className="max-h-[50px] sm:max-h-[54px] max-w-[218px] sm:max-w-[263px] w-auto h-auto object-contain object-left-bottom"
                        />
                      ) : (
                        <h4 className="text-white font-extrabold text-sm sm:text-base tracking-tight drop-shadow-md truncate">
                          {showItem.title}
                        </h4>
                      )}
                    </div>

                    {/* Play Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(showItem);
                      }}
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform pointer-events-auto shrink-0"
                      aria-label={`Play ${showItem.title}`}
                    >
                      <svg className="w-4.5 h-4.5 fill-current ml-0.5" viewBox="0 0 24 24">
                        <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
