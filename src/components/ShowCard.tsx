import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Show } from '../types';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Volume2, VolumeX, Info } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { getActiveArtwork } from '../utils/artworkRotator';
import { attachHlsVideo, isHlsSource } from '../utils/hlsHelper';

interface ShowCardProps {
  show: Show;
  rankNumber?: number;
  isInWatchlist: boolean;
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlay: (show: Show) => void;
  onIncrementPoints: (showId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  showTop10Badge?: boolean;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (forcedValue?: boolean) => void;
  onHoverPreviewStart?: () => void;
  onHoverPreviewEnd?: () => void;
  onPopoutViewOpen?: () => void;
  onPopoutViewClose?: () => void;
  cardSize?: 'default' | 'small' | 'full' | 'special';
  aspectRatio?: '2:3' | '16:9' | '9:16';
  isContinueWatching?: boolean;
  disablePopout?: boolean;
  isStretchable?: boolean;
  onLongPress?: (show: Show) => void;
}

// Track scrolling state so pointer changes to arrow cursor and cards don't pop out when scrolling
let isGlobalPageScrolling = false;
let globalScrollCooldownTimer: number | null = null;
const globalScrollSubscribers = new Set<(isScrolling: boolean) => void>();

// Global map of callbacks to collapse other stretched cards keyed by unique instance ID
const globalStretchCollapseMap = new Map<
  string,
  (immediate?: boolean, isSwitchingToAnother?: boolean, keepRightEdgeFixed?: boolean, deltaW?: number) => void
>();

// Global map of callbacks to cancel pending stretch hover timers keyed by unique instance ID
const globalCancelStretchHoverMap = new Map<string, () => void>();

// Track currently active stretched card instance ID and index in stretchable feed
let globalActiveStretchedCardId: string | null = null;
let globalActiveStretchedIndex: number | null = null;
let globalLastStretchedSide: 'left' | 'right' | null = null;

// Track previous hovered card index in stretchable feed to detect movement from left-side titles
let globalLastHoveredStretchIndex: number | null = null;
let globalLastHoveredStretchTime = 0;

let globalMouseX = -1000;
let globalMouseY = -1000;

export const getGlobalMousePos = () => ({ x: globalMouseX, y: globalMouseY });

export const triggerGlobalScroll = () => {
  if (!isGlobalPageScrolling) {
    isGlobalPageScrolling = true;
    globalScrollSubscribers.forEach((cb) => cb(true));
  }
  if (globalScrollCooldownTimer) {
    window.clearTimeout(globalScrollCooldownTimer);
  }
  globalScrollCooldownTimer = window.setTimeout(() => {
    isGlobalPageScrolling = false;
    globalScrollSubscribers.forEach((cb) => cb(false));
  }, 220);
};

if (typeof window !== 'undefined') {
  window.addEventListener(
    'mousemove',
    (e) => {
      globalMouseX = e.clientX;
      globalMouseY = e.clientY;
    },
    { passive: true }
  );

  const handleAnyScroll = () => {
    triggerGlobalScroll();
  };

  // Capture all scroll events across window, document, and horizontal feed strip scroll containers
  window.addEventListener('scroll', handleAnyScroll, { passive: true, capture: true });

  // Trackpad / wheel horizontal and vertical gestures immediately switch cursor to default
  window.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) > 1 || Math.abs(e.deltaY) > 1) {
        triggerGlobalScroll();
      }
    },
    { passive: true, capture: true }
  );
}

// Smooth scroll coordinator for stretchable feed:
// Uses symmetric ease-in-out curve with exact matching velocity and duration,
// preventing racing loops, corrupted origins, or sudden jerks/rushes.
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const animateStretchScroll = (
  container: HTMLElement,
  targetScrollLeft: number,
  duration = 500,
  onComplete?: () => void
) => {
  const customContainer = container as any;

  if (customContainer.__stretchScrollAnimId) {
    cancelAnimationFrame(customContainer.__stretchScrollAnimId);
    customContainer.__stretchScrollAnimId = null;
  }

  // Record the true base scrollLeft before any title was stretched
  if (customContainer.__stretchBaseScrollLeft === undefined) {
    customContainer.__stretchBaseScrollLeft = container.scrollLeft;
  }

  const startScrollLeft = container.scrollLeft;
  const distance = targetScrollLeft - startScrollLeft;

  if (Math.abs(distance) < 2) {
    container.scrollLeft = targetScrollLeft;
    if (onComplete) onComplete();
    return;
  }

  const startTime = performance.now();

  const step = (now: number) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const ease = easeInOutCubic(progress);
    container.scrollLeft = Math.round(startScrollLeft + distance * ease);

    if (progress < 1) {
      customContainer.__stretchScrollAnimId = requestAnimationFrame(step);
    } else {
      customContainer.__stretchScrollAnimId = null;
      container.scrollLeft = targetScrollLeft;
      if (onComplete) onComplete();
    }
  };

  customContainer.__stretchScrollAnimId = requestAnimationFrame(step);
};

export const ShowCard: React.FC<ShowCardProps> = ({
  show,
  rankNumber,
  isInWatchlist,
  onToggleWatchlist,
  onOpenDetails,
  onPlay,
  onIncrementPoints,
  isFirst = false,
  isLast = false,
  showTop10Badge = false,
  isGlobalMuted = false,
  onToggleGlobalMute,
  onHoverPreviewStart,
  onHoverPreviewEnd,
  onPopoutViewOpen,
  onPopoutViewClose,
  cardSize = 'default',
  aspectRatio,
  isContinueWatching = false,
  disablePopout = false,
  isStretchable = false,
  onLongPress
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [localMuted, setLocalMuted] = useState<boolean>(false);
  const isMuted = onToggleGlobalMute ? isGlobalMuted : localMuted;
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [arePreviewOverlaysHidden, setArePreviewOverlaysHidden] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isPageScrolling, setIsPageScrolling] = useState<boolean>(isGlobalPageScrolling);
  const [isPopoutPosterPhase, setIsPopoutPosterPhase] = useState<boolean>(true);
  const [isRightEdgeCard, setIsRightEdgeCard] = useState<boolean>(false);
  const [rightEdgeExpansionShift, setRightEdgeExpansionShift] = useState<number>(0);
  const [expandedWidth, setExpandedWidth] = useState<number | null>(null);

  // Popout positioning and sizing states
  const [popoutWidth, setPopoutWidth] = useState<number>(454);
  const [popoutTop, setPopoutTop] = useState<number>(-35);
  const [popoutAlign, setPopoutAlign] = useState<'left' | 'center' | 'right'>('center');
  const [popoutLeftOffset, setPopoutLeftOffset] = useState<number>(0);
  const [isClosingPopout, setIsClosingPopout] = useState<boolean>(false);
  const [isCollapsingStretch, setIsCollapsingStretch] = useState<boolean>(false);
  const [isStretchPointerActive, setIsStretchPointerActive] = useState<boolean>(false);

  const activeArtwork = getActiveArtwork(show);
  const posterLandscapeUrl = activeArtwork.posterLandscapeUrl || show.posterLandscapeUrl;
  const popoutVideoSrc = useMemo(() => {
    const isDirect = (url?: string) =>
      Boolean(
        url &&
        !url.includes('youtube.com') &&
        !url.includes('youtu.be') &&
        !url.includes('dailymotion.com') &&
        !url.includes('dai.ly')
      );
    if (isDirect(show.popoutPreviewUrl)) return show.popoutPreviewUrl!;
    if (isDirect(show.hoverPreviewUrl)) return show.hoverPreviewUrl!;
    if (isDirect(show.trailerUrl)) return show.trailerUrl!;
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }, [show.popoutPreviewUrl, show.hoverPreviewUrl, show.trailerUrl]);

  const isPreviewActivelyPlaying = isVideoPlaying && shouldLoadVideo && Boolean(popoutVideoSrc) && !isPopoutPosterPhase;

  const baseCardRef = useRef<HTMLDivElement>(null);
  const stretchCardInnerRef = useRef<HTMLDivElement>(null);
  const popoutRef = useRef<HTMLDivElement>(null);
  const popoutVideoRef = useRef<HTMLVideoElement>(null);
  const stretchVideoRef = useRef<HTMLVideoElement>(null);
  const shiftedCardsRef = useRef<HTMLElement[]>([]);
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const inactivityTimer = useRef<number | null>(null);
  const hoverTimer = useRef<number | null>(null);
  const videoTimer = useRef<number | null>(null);
  const popoutPosterTimerRef = useRef<number | null>(null);
  const stretchVideoTimerRef = useRef<number | null>(null);
  const popoutCloseTimerRef = useRef<number | null>(null);
  const stretchCollapseTimerRef = useRef<number | null>(null);
  const stretchPointerTimerRef = useRef<number | null>(null);
  const stretchHoverTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const cardInstanceId = useRef<string>(`card-${Math.random().toString(36).slice(2, 9)}`).current;
  const isHoveredRef = useRef<boolean>(false);
  const isCollapsingStretchRef = useRef<boolean>(false);

  const cancelStretchHover = useCallback(() => {
    if (stretchHoverTimerRef.current) {
      window.clearTimeout(stretchHoverTimerRef.current);
      stretchHoverTimerRef.current = null;
    }
  }, []);

  // Continuously track mouse coordinates for stationary pointer detection on scroll
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleScrollStatus = (scrolling: boolean) => {
      setIsPageScrolling(scrolling);
      if (scrolling && hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    };
    globalScrollSubscribers.add(handleScrollStatus);
    return () => {
      globalScrollSubscribers.delete(handleScrollStatus);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (popoutCloseTimerRef.current) {
        window.clearTimeout(popoutCloseTimerRef.current);
      }
      if (stretchCollapseTimerRef.current) {
        window.clearTimeout(stretchCollapseTimerRef.current);
      }
      if (stretchPointerTimerRef.current) {
        window.clearTimeout(stretchPointerTimerRef.current);
      }
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
      }
      if (popoutPosterTimerRef.current) {
        window.clearTimeout(popoutPosterTimerRef.current);
      }
      if (stretchVideoTimerRef.current) {
        window.clearTimeout(stretchVideoTimerRef.current);
      }
      if (shiftedCardsRef.current.length > 0) {
        shiftedCardsRef.current.forEach((card) => {
          card.style.transform = '';
          card.style.transition = '';
        });
        shiftedCardsRef.current = [];
      }
      if (stretchCardInnerRef.current) {
        stretchCardInnerRef.current.style.marginLeft = '';
        stretchCardInnerRef.current.style.width = '';
        stretchCardInnerRef.current.style.transition = '';
        stretchCardInnerRef.current.style.transform = '';
      }
      if (baseCardRef.current) {
        baseCardRef.current.style.marginLeft = '';
        baseCardRef.current.style.transition = '';
        baseCardRef.current.style.transform = '';
      }
    };
  }, []);

  // Video attachment effect supporting .m3u8 HLS and direct video playback
  useEffect(() => {
    if ((!isHovered && !isClosingPopout) || !popoutVideoSrc) {
      setIsVideoPlaying(false);
      return;
    }
    const video = popoutVideoRef.current || stretchVideoRef.current;
    if (!video) return;

    if (isHlsSource(popoutVideoSrc)) {
      const cleanup = attachHlsVideo(video, popoutVideoSrc, {
        autoPlay: true,
        muted: isMuted,
        onLoaded: () => setIsVideoPlaying(true)
      });

      return () => {
        setIsVideoPlaying(false);
        if (cleanup) cleanup();
      };
    } else {
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            video.muted = true;
            video.play()
              .then(() => setIsVideoPlaying(true))
              .catch(() => {});
          });
      }
      return () => {
        setIsVideoPlaying(false);
      };
    }
  }, [isHovered, popoutVideoSrc]);

  // Sync mute state on popout/stretch preview without restarting video playback
  useEffect(() => {
    const video = popoutVideoRef.current || stretchVideoRef.current;
    if (video) {
      video.muted = isMuted;
      if (!isMuted) {
        video.volume = 1.0;
      }
    }
  }, [isMuted]);

  const startLongPress = () => {
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (onLongPress) {
        onLongPress(show);
      }
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // 5-second inactivity timer over popout view card while video is playing
  const resetInactivityTimer = useCallback(() => {
    setArePreviewOverlaysHidden(false);
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (isVideoPlaying) {
      inactivityTimer.current = window.setTimeout(() => {
        setArePreviewOverlaysHidden(true);
      }, 5000);
    }
  }, [isVideoPlaying]);

  useEffect(() => {
    if (isVideoPlaying) {
      resetInactivityTimer();
    } else {
      setArePreviewOverlaysHidden(false);
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
        inactivityTimer.current = null;
      }
    }
    return () => {
      if (inactivityTimer.current) {
        window.clearTimeout(inactivityTimer.current);
      }
    };
  }, [isVideoPlaying, resetInactivityTimer]);

  useEffect(() => {
    if (popoutVideoRef.current) {
      popoutVideoRef.current.muted = isMuted;
    }
    if (stretchVideoRef.current) {
      stretchVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Popout view sizing: reduces proportionally as screen width reduces, but cannot go below 80% of original size (454px * 0.8 = 363px)
  const getPopoutDimensions = () => {
    const originalWidth = 454;
    const minWidth = Math.round(originalWidth * 0.8); // 363px (strictly min 80%)
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const scale = Math.max(0.8, Math.min(1.0, screenWidth / 1366));
    const targetWidth = Math.max(minWidth, Math.round(originalWidth * scale));
    const targetHeight = Math.round((targetWidth / originalWidth) * 390);
    return { targetWidth, targetHeight };
  };

  const getUnexpWidth = () => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    if (screenWidth >= 1024) {
      return Math.min(340, Math.round((screenWidth - 112) / 4.05));
    } else if (screenWidth >= 768) {
      return 290;
    } else if (screenWidth >= 640) {
      return 265;
    }
    return 235;
  };

  const isOnlyEdgeUnderNavigation = useCallback(() => {
    if (!baseCardRef.current) return false;
    const rect = baseCardRef.current.getBoundingClientRect();
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;

    const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
    const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
    const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;

    const leftBoundary = containerRect ? Math.max(0, containerRect.left) : 0;
    const rightBoundary = containerRect ? Math.min(screenWidth, containerRect.right) : screenWidth;

    const visibleLeft = Math.max(leftBoundary, rect.left);
    const visibleRight = Math.min(rightBoundary, rect.right);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);

    // In stretchable feed: only titles that are mostly hidden/scrolled past edge
    // (less than 65% visible) are blocked from stretching
    if (isStretchable) {
      if (visibleWidth < rect.width * 0.65) {
        return true;
      }
      return false;
    }

    // Only disabled when the card is substantially cut off (past boundary)
    // AND only a small edge/sliver is showing under the navigation badge!
    const isCutOffAtLeft = rect.left < leftBoundary - 4;
    const isCutOffAtRight = rect.right > rightBoundary + 4;

    if (isCutOffAtLeft && (visibleWidth < 120 || visibleWidth < rect.width * 0.7)) {
      return true;
    }
    if (isCutOffAtRight && (visibleWidth < 120 || visibleWidth < rect.width * 0.7)) {
      return true;
    }

    return false;
  }, [isStretchable]);

  const isFarRightVisibleCard = useCallback((): boolean => {
    if (!baseCardRef.current) return false;
    const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
    if (!feedStrip) return false;

    const allCards = Array.from(feedStrip.querySelectorAll('[data-show-card="true"]')) as HTMLElement[];
    const myIndex = allCards.indexOf(baseCardRef.current);
    if (myIndex === -1) return false;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const rect = baseCardRef.current.getBoundingClientRect();

    if (rect.right < 0 || rect.left > screenWidth) return false;

    // If this is the absolute last card in the feed:
    if (myIndex === allCards.length - 1) return true;

    // Check the next card to the right:
    const nextCard = allCards[myIndex + 1];
    if (!nextCard) return true;

    const nextRect = nextCard.getBoundingClientRect();
    const nextVisibleWidth = Math.max(0, Math.min(screenWidth, nextRect.right) - Math.max(0, nextRect.left));

    // If nextCard is past the right edge or peeking as an edge under the right navigation badge:
    // THIS card is the far-right visible title in the row!
    // For Card 3, Card 4 is fully on screen (nextRect.left ~ 1000px < screenWidth - 100 and nextVisibleWidth > 200), so Card 3 returns false!
    const isNextCardOffscreenOrEdge =
      nextRect.left >= screenWidth - 100 ||
      nextVisibleWidth < 120 ||
      (nextRect.right > screenWidth && screenWidth - nextRect.left < 100);

    return isNextCardOffscreenOrEdge;
  }, []);

  const openPopout = () => {
    if (disablePopout) return;
    if (isGlobalPageScrolling) return;
    if (!baseCardRef.current) return;
    if (isOnlyEdgeUnderNavigation()) return;

    if (popoutCloseTimerRef.current) {
      window.clearTimeout(popoutCloseTimerRef.current);
      popoutCloseTimerRef.current = null;
    }
    setIsClosingPopout(false);

    // Calculate dimensions matching the original sizing (originalWidth: 454px, min 80% = 363px)
    // For smaller special feed cards, scale popout width proportionally so it matches the smaller card thumbnail
    const baseDimensions = getPopoutDimensions();
    const targetWidth = cardSize === 'special' ? Math.round(baseDimensions.targetWidth * 0.78) : baseDimensions.targetWidth;
    const targetHeight = Math.round((targetWidth / 454) * 390);
    setPopoutWidth(targetWidth);

    // Calculate positioning relative to the base thumbnail so the preview video sits right over the thumbnail
    const rect = baseCardRef.current.getBoundingClientRect();
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const thumbEl = (baseCardRef.current.querySelector('.aspect-video') as HTMLElement) || baseCardRef.current;
    const thumbRect = thumbEl.getBoundingClientRect();
    let thumbOffsetLeft = Math.max(0, Math.round(thumbRect.left - rect.left));

    // Center popout view in the vertical center of the card thumbnail,
    // clamped against the top navbar (70px) so popout view is never cut off from top or bottom
    const rawTopOffset = Math.round((thumbRect.height - targetHeight) / 2);
    const maxSafeUpward = -(Math.max(10, Math.round(thumbRect.top - 70)));
    const topOffset = Math.max(Math.min(-15, rawTopOffset), Math.min(-15, maxSafeUpward));
    setPopoutTop(topOffset);

    // Calculate alignment relative to the scroll container's visible bounds
    // In Special Feed, the scroll container starts after the pinned column (~300px), not at 0!
    const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
    const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
    const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
    const leftBoundary = containerRect ? Math.max(0, containerRect.left) : 0;
    const rightBoundary = containerRect ? Math.min(screenWidth, containerRect.right) : screenWidth;

    const halfWidth = targetWidth / 2;
    const cardCenter = thumbRect.left + thumbRect.width / 2;

    const leftLimit = leftBoundary + 16;
    const rightLimit = rightBoundary - 16;

    if (isFirst || cardCenter - halfWidth < leftLimit || thumbRect.left < leftLimit) {
      setPopoutAlign('left');
      // If card thumbnail is slightly shifted to the left of the container boundary, adjust offset so popout never cuts off on the left
      const edgeShift = Math.max(0, Math.round(leftBoundary - thumbRect.left));
      thumbOffsetLeft += edgeShift;
    } else if (isLast || cardCenter + halfWidth > rightLimit || thumbRect.right > rightLimit) {
      setPopoutAlign('right');
    } else {
      setPopoutAlign('center');
    }
    setPopoutLeftOffset(thumbOffsetLeft);

    setIsHovered(true);
    setIsPopoutPosterPhase(true);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    setArePreviewOverlaysHidden(false);

    // When popout view opens, remain showing the poster for 1 second, then show the preview
    if (popoutPosterTimerRef.current) window.clearTimeout(popoutPosterTimerRef.current);
    popoutPosterTimerRef.current = window.setTimeout(() => {
      setIsPopoutPosterPhase(false);
      setShouldLoadVideo(true);
    }, 1000);

    onHoverPreviewStart?.();
    onPopoutViewOpen?.();
  };

  // Collapse handler for stretchable cards: smoothly transitions back with same speed as expanding
  const triggerStretchCollapse = useCallback(
    (
      immediate = false,
      isSwitchingToAnother = false,
      keepRightEdgeFixed = false,
      prevDeltaW = 0
    ) => {
      cancelStretchHover();
      if (stretchPointerTimerRef.current) {
        window.clearTimeout(stretchPointerTimerRef.current);
        stretchPointerTimerRef.current = null;
      }
      setIsStretchPointerActive(false);

      if (stretchVideoTimerRef.current) {
        window.clearTimeout(stretchVideoTimerRef.current);
        stretchVideoTimerRef.current = null;
      }
      if (stretchCollapseTimerRef.current) {
        window.clearTimeout(stretchCollapseTimerRef.current);
        stretchCollapseTimerRef.current = null;
      }

      // Immediately stop and reset preview video
      setShouldLoadVideo(false);
      setIsVideoPlaying(false);
      if (stretchVideoRef.current) {
        try {
          stretchVideoRef.current.pause();
          stretchVideoRef.current.currentTime = 0;
        } catch {}
      }

      if (globalActiveStretchedCardId === cardInstanceId) {
        globalActiveStretchedCardId = null;
        globalActiveStretchedIndex = null;
      }

      // If this card is not actually hovered/stretched or collapsing, do nothing
      if (!isHoveredRef.current && !isCollapsingStretchRef.current) {
        return;
      }

      // Scroll container smoothly returns with exact same speed (500ms) without rushing
      // Only return to base scroll when NOT switching to another expanding card
      const feedStrip = baseCardRef.current?.closest('[data-feed-strip="true"]');
      const scrollContainer = feedStrip?.querySelector('.overflow-x-auto') as HTMLElement | null;
      if (scrollContainer && !isSwitchingToAnother) {
        const customContainer = scrollContainer as any;
        if (customContainer.__stretchBaseScrollLeft !== undefined) {
          const base = customContainer.__stretchBaseScrollLeft;
          animateStretchScroll(scrollContainer, base, 500, () => {
            delete customContainer.__stretchBaseScrollLeft;
          });
        }
      }

      // Collapsing title immediately turns into its original space and poster (no zoom-out on collapsing card)
      // Strictly clear any transform so cards NEVER overlap or clutter!
      if (stretchCardInnerRef.current) {
        stretchCardInnerRef.current.style.transition = 'none';
        stretchCardInnerRef.current.style.transform = 'none';
        stretchCardInnerRef.current.style.marginLeft = '0px';
        stretchCardInnerRef.current.style.width = '';
      }

      if (baseCardRef.current) {
        baseCardRef.current.style.transform = 'none';
        if (keepRightEdgeFixed && prevDeltaW > 0) {
          // Keep right edge fixed when switching right-to-left:
          // Collapse card instantly, hold the position via marginLeft, and transition marginLeft to 0 over 500ms
          baseCardRef.current.style.transition = 'none';
          baseCardRef.current.style.marginLeft = `${prevDeltaW}px`;
          void baseCardRef.current.offsetHeight;
          baseCardRef.current.style.transition = 'margin-left 500ms cubic-bezier(0.25, 1, 0.5, 1)';
          baseCardRef.current.style.marginLeft = '0px';
        } else {
          baseCardRef.current.style.transition = 'none';
          baseCardRef.current.style.marginLeft = '0px';
        }
      }

      isHoveredRef.current = false;
      setIsHovered(false);
      setIsCollapsingStretch(false);
      setIsRightEdgeCard(false);
      setRightEdgeExpansionShift(0);
      setExpandedWidth(null);
      onHoverPreviewEnd?.();
    },
    [cancelStretchHover, cardInstanceId, onHoverPreviewEnd]
  );

  useEffect(() => {
    if (isStretchable) {
      globalStretchCollapseMap.set(cardInstanceId, triggerStretchCollapse);
      globalCancelStretchHoverMap.set(cardInstanceId, cancelStretchHover);
      return () => {
        globalStretchCollapseMap.delete(cardInstanceId);
        globalCancelStretchHoverMap.delete(cardInstanceId);
      };
    }
  }, [isStretchable, cardInstanceId, triggerStretchCollapse, cancelStretchHover]);

  // Execute stretching after hover delay, smoothly collapsing any other active stretch in sync
  const executeStretch = useCallback(() => {
    if (!baseCardRef.current) return;

    const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
    const scrollContainer = feedStrip?.querySelector('.overflow-x-auto') as HTMLElement | null;
    const allCards = Array.from(feedStrip?.querySelectorAll('[data-show-card="true"]') || []) as HTMLElement[];
    const myIndex = allCards.indexOf(baseCardRef.current);
    const prevStretchedIndex = globalActiveStretchedIndex;

    // Moving from left-side stretched title to this right-side title?
    const isMovingLeftToRight = prevStretchedIndex !== null && myIndex > prevStretchedIndex;
    // Moving from right-side stretched title to this left-side title?
    const isMovingRightToLeft = prevStretchedIndex !== null && myIndex < prevStretchedIndex;

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const cardEl = stretchCardInnerRef.current || baseCardRef.current;
    const cardRect = cardEl ? cardEl.getBoundingClientRect() : null;
    const cardH = cardRect ? cardRect.height : 435;
    const normalW = cardRect ? cardRect.width : 290;
    // Exactly 16:9 aspect ratio width based on rendered height:
    const expW = Math.round(cardH * (16 / 9));
    const deltaW = Math.max(0, expW - normalW);
    setExpandedWidth(expW);

    // Smoothly collapse any previously stretched card in sync (immediately turns into original space & poster)
    globalStretchCollapseMap.forEach((collapseFn, id) => {
      if (id !== cardInstanceId) {
        collapseFn(false, true, isMovingRightToLeft, deltaW);
      }
    });

    globalActiveStretchedCardId = cardInstanceId;
    globalActiveStretchedIndex = myIndex;
    isHoveredRef.current = true;
    isCollapsingStretchRef.current = false;
    setIsHovered(true);
    setIsCollapsingStretch(false);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    setIsStretchPointerActive(true);

    // Show backdrop directly for 1.5 seconds, then show preview
    if (stretchVideoTimerRef.current) window.clearTimeout(stretchVideoTimerRef.current);
    stretchVideoTimerRef.current = window.setTimeout(() => {
      setShouldLoadVideo(true);
    }, 1500);

    const baseEl = baseCardRef.current;
    const innerEl = stretchCardInnerRef.current;

    if (innerEl && baseEl) {
      // Clear all transforms to ensure cards NEVER overlap or clash
      innerEl.style.transform = 'none';
      baseEl.style.transform = 'none';

      if (isMovingLeftToRight) {
        // Moving from left to right title:
        // Keep the RIGHT EDGE of this title FIXED at its current position!
        // Start baseEl with marginLeft = deltaW (so its right edge does not move by 1px),
        // and innerEl with normal width.
        // Then smoothly transition baseEl.marginLeft from deltaW to 0,
        // and innerEl.width from normalW to expW over 500ms!
        // At every frame: Right Edge = Left + marginLeft + width = CONSTANT!
        baseEl.style.transition = 'none';
        baseEl.style.marginLeft = `${deltaW}px`;
        innerEl.style.transition = 'none';
        innerEl.style.width = `${normalW}px`;

        void baseEl.offsetHeight;

        baseEl.style.transition = 'margin-left 500ms cubic-bezier(0.25, 1, 0.5, 1)';
        baseEl.style.marginLeft = '0px';

        innerEl.style.transition = 'width 500ms cubic-bezier(0.25, 1, 0.5, 1)';
        innerEl.style.width = `${expW}px`;
      } else {
        // Moving right to left title or first hover:
        // Keep the LEFT EDGE of this title FIXED!
        // Left edge remains fixed at current position, expands rightward.
        baseEl.style.transition = 'none';
        baseEl.style.marginLeft = '0px';
        innerEl.style.transition = 'none';
        innerEl.style.width = `${normalW}px`;

        void baseEl.offsetHeight;

        innerEl.style.transition = 'width 500ms cubic-bezier(0.25, 1, 0.5, 1)';
        innerEl.style.width = `${expW}px`;
      }
    }

    // Scroll coordination:
    // Symmetrical speed, exact duration (500ms) and easeInOutCubic curve.
    // Scroll and scroll-back strictly match 1:1.
    if (scrollContainer && cardRect) {
      const customContainer = scrollContainer as any;
      if (customContainer.__stretchBaseScrollLeft === undefined) {
        customContainer.__stretchBaseScrollLeft = scrollContainer.scrollLeft;
      }
      const baseScroll = customContainer.__stretchBaseScrollLeft;
      const containerRect = scrollContainer.getBoundingClientRect();
      const rightBoundary = Math.min(screenWidth, containerRect.right);

      const currentScrollOffset = scrollContainer.scrollLeft - baseScroll;
      const cardBaseLeft = cardRect.left + currentScrollOffset;

      // Card right edge position relative to base scroll:
      const projectedRightAtBase = cardBaseLeft + expW;

      const rightLimit = rightBoundary - 36;
      const scrollNeeded = Math.max(0, Math.round(projectedRightAtBase - rightLimit));
      const targetScrollLeft = baseScroll + scrollNeeded;

      // Animate container to targetScrollLeft using symmetric easeInOutCubic (500ms)
      // Exactly matching the card's 500ms expansion duration and speed!
      animateStretchScroll(scrollContainer, targetScrollLeft, 500);
    }

    globalActiveStretchedIndex = myIndex;
  }, [cardInstanceId]);

  const closePopout = (immediate = false) => {
    if (isStretchable) return;

    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (popoutPosterTimerRef.current) {
      window.clearTimeout(popoutPosterTimerRef.current);
      popoutPosterTimerRef.current = null;
    }
    if (inactivityTimer.current) {
      window.clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (popoutCloseTimerRef.current) {
      window.clearTimeout(popoutCloseTimerRef.current);
      popoutCloseTimerRef.current = null;
    }

    // Stop video preview immediately and reset to poster phase so re-hover strictly starts from poster
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    setIsPopoutPosterPhase(true);
    if (popoutVideoRef.current) {
      try {
        popoutVideoRef.current.pause();
        popoutVideoRef.current.currentTime = 0;
      } catch {}
    }

    onPopoutViewClose?.();

    if (immediate || !isHovered) {
      setIsHovered(false);
      setIsClosingPopout(false);
      setArePreviewOverlaysHidden(false);
      onHoverPreviewEnd?.();
      return;
    }

    // Smooth Netflix popout collapse animation (350ms)
    setIsClosingPopout(true);
    popoutCloseTimerRef.current = window.setTimeout(() => {
      setIsHovered(false);
      setIsClosingPopout(false);
      setIsPopoutPosterPhase(true);
      setShouldLoadVideo(false);
      setIsVideoPlaying(false);
      setArePreviewOverlaysHidden(false);
      onHoverPreviewEnd?.();
      popoutCloseTimerRef.current = null;
    }, 350);
  };

  // When cursor or pointer goes away from base card or popout view, collapse immediately
  useEffect(() => {
    if (!isHovered && !isClosingPopout) return;

    const handleCheckPointerAway = (e: MouseEvent) => {
      if (!isHovered) return;

      if (isStretchable) {
        const feedStrip = baseCardRef.current?.closest('[data-feed-strip="true"]');
        const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
        const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
        const el = stretchCardInnerRef.current || baseCardRef.current;
        if (!el) return;
        const cardRect = el.getBoundingClientRect();

        const rowTop = cardRect.top;
        const rowBottom = cardRect.bottom;
        const leftBoundary = containerRect ? containerRect.left : 0;
        const rightBoundary = containerRect ? containerRect.right : window.innerWidth;

        // When user cursor leaves from top of title card, bottom, left side of first, or right side of last title: collapse
        if (
          e.clientY < rowTop ||
          e.clientY > rowBottom ||
          e.clientX < leftBoundary ||
          e.clientX > rightBoundary
        ) {
          cancelStretchHover();
          triggerStretchCollapse(true);
        }
        return;
      }

      const baseEl = baseCardRef.current;
      const popoutEl = popoutRef.current;
      if (!baseEl && !popoutEl) return;

      const baseRect = baseEl?.getBoundingClientRect();
      const popoutRect = popoutEl?.getBoundingClientRect();

      const inBase =
        baseRect &&
        e.clientX >= baseRect.left &&
        e.clientX <= baseRect.right &&
        e.clientY >= baseRect.top &&
        e.clientY <= baseRect.bottom;

      const inPopout =
        popoutRect &&
        e.clientX >= popoutRect.left &&
        e.clientX <= popoutRect.right &&
        e.clientY >= popoutRect.top &&
        e.clientY <= popoutRect.bottom;

      if (!inBase && !inPopout) {
        closePopout();
      }
    };

    window.addEventListener('mousemove', handleCheckPointerAway, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleCheckPointerAway);
    };
  }, [isHovered, isClosingPopout, isStretchable, cancelStretchHover, triggerStretchCollapse]);

  // Collapse popout view or stretchable card when card leaves stationary pointer on scroll,
  // or when popout view goes 50% or more past the left or right edge
  useEffect(() => {
    if (!isHovered && !isClosingPopout && !isCollapsingStretch) return;

    const checkEdgeOrPointerCollapse = () => {
      if (!isHovered || !baseCardRef.current) return;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;

      const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
      const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
      const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;

      const leftBound = containerRect ? Math.max(0, containerRect.left) : 0;
      const rightBound = containerRect ? Math.min(screenWidth, containerRect.right) : screenWidth;

      // 1. Stationary pointer check on scroll:
      // When user is not moving their pointer and scrolling up/down or left/right,
      // and popout view or stretchable card leaves the pointer, it collapses.
      if (mousePosRef.current && mousePosRef.current.x >= 0 && mousePosRef.current.y >= 0) {
        const { x, y } = mousePosRef.current;
        if (isStretchable) {
          const cardEl = stretchCardInnerRef.current || baseCardRef.current;
          const sRect = cardEl.getBoundingClientRect();
          if (
            y < sRect.top ||
            y > sRect.bottom ||
            x < leftBound ||
            x > rightBound
          ) {
            cancelStretchHover();
            triggerStretchCollapse(true);
            return;
          }
        } else {
          const baseRect = baseCardRef.current.getBoundingClientRect();
          const popoutRect = popoutRef.current?.getBoundingClientRect();

          const inBase = x >= baseRect.left && x <= baseRect.right && y >= baseRect.top && y <= baseRect.bottom;
          const inPopout = popoutRect && x >= popoutRect.left && x <= popoutRect.right && y >= popoutRect.top && y <= popoutRect.bottom;

          if (!inBase && !inPopout) {
            closePopout();
            return;
          }
        }
      }

      // 2. 50% Edge Collapse:
      // Popout view only collapses when it goes 50% or more to left or right edge.
      // Stretchable cards do NOT collapse on edge bounds as they expand inline and shift cards smoothly.
      if (!isStretchable) {
        const targetEl = popoutRef.current || baseCardRef.current;
        const targetRect = targetEl.getBoundingClientRect();
        const vLeft = Math.max(leftBound, targetRect.left);
        const vRight = Math.min(rightBound, targetRect.right);
        const vWidth = Math.max(0, vRight - vLeft);

        // Only collapse when 50% or more has gone beyond the container edge
        if (vWidth < targetRect.width * 0.5) {
          closePopout();
          return;
        }
      }
    };

    window.addEventListener('scroll', checkEdgeOrPointerCollapse, { passive: true, capture: true });
    const feedStrip = baseCardRef.current?.closest('[data-feed-strip="true"]');
    const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkEdgeOrPointerCollapse, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', checkEdgeOrPointerCollapse, { capture: true });
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', checkEdgeOrPointerCollapse);
      }
    };
  }, [isHovered, isClosingPopout, isCollapsingStretch, isStretchable, triggerStretchCollapse]);

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (isGlobalPageScrolling) return;
    mousePosRef.current = { x: e.clientX, y: e.clientY };

    if (!baseCardRef.current) return;

    // Only titles that are ONLY just showing as edges under the left/right navigation badges don't pop out
    if (isOnlyEdgeUnderNavigation()) {
      return;
    }

    if (popoutCloseTimerRef.current) {
      window.clearTimeout(popoutCloseTimerRef.current);
      popoutCloseTimerRef.current = null;
      setIsClosingPopout(false);
      setIsHovered(true);
    }

    if (stretchCollapseTimerRef.current) {
      window.clearTimeout(stretchCollapseTimerRef.current);
      stretchCollapseTimerRef.current = null;
      setIsCollapsingStretch(false);
    }

    // Hovering feed card stops scroll
    onHoverPreviewStart?.();

    if (isStretchable) {
      // If this card is already hovered and stretched, keep it as-is
      if (isHovered && !isCollapsingStretch) {
        return;
      }

      // Cancel any other card's pending stretch hover timer
      globalCancelStretchHoverMap.forEach((cancelFn, id) => {
        if (id !== cardInstanceId) {
          cancelFn();
        }
      });

      cancelStretchHover();

      // Reduce hover to stretch time to 0.5 second (500ms).
      // Hover from 1 stretched to left/right title stretch time is 0.3 second (300ms).
      const isSwitchingFromStretched = Boolean(
        globalActiveStretchedCardId && globalActiveStretchedCardId !== cardInstanceId
      );
      const stretchDelay = isSwitchingFromStretched ? 300 : 500;

      stretchHoverTimerRef.current = window.setTimeout(() => {
        stretchHoverTimerRef.current = null;
        executeStretch();
      }, stretchDelay);

      return;
    }

    // Normal feed card: always reset to poster phase so video is never shown prematurely on re-hover
    setIsPopoutPosterPhase(true);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    if (popoutVideoRef.current) {
      try {
        popoutVideoRef.current.pause();
        popoutVideoRef.current.currentTime = 0;
      } catch {}
    }

    // Normal feed card: wait 0.5 second before opening popout view
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      openPopout();
    }, 500);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }

    if (isStretchable) {
      if (!isHovered) {
        cancelStretchHover();
      }
      const feedStrip = baseCardRef.current?.closest('[data-feed-strip="true"]');
      const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
      const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
      const el = stretchCardInnerRef.current || baseCardRef.current;
      if (el) {
        const cardRect = el.getBoundingClientRect();
        const y = e.clientY;
        const x = e.clientX;
        const leftBoundary = containerRect ? containerRect.left : 0;
        const rightBoundary = containerRect ? containerRect.right : window.innerWidth;

        // When user cursor leaves top, bottom, left side of first, or right side of last title: collapse
        if (
          y < cardRect.top - 4 ||
          y > cardRect.bottom + 4 ||
          x < leftBoundary - 4 ||
          x > rightBoundary + 4
        ) {
          cancelStretchHover();
          triggerStretchCollapse(true);
          return;
        }
        // If moving left or right (into spaces between titles within the row), DO NOT collapse!
        return;
      }
    }

    closePopout();
  };

  // When user switches tab in browser, popout view goes back as card immediately
  useEffect(() => {
    const handleTabSwitch = () => {
      if (document.hidden) {
        if (isStretchable) {
          triggerStretchCollapse(true);
        } else {
          closePopout(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleTabSwitch);
    return () => {
      document.removeEventListener('visibilitychange', handleTabSwitch);
    };
  }, [isStretchable, triggerStretchCollapse]);

  const handleCardClick = (e?: React.MouseEvent) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
    }
    if (isOnlyEdgeUnderNavigation()) {
      return;
    }
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    cancelStretchHover();
    onIncrementPoints(show.id);
    // When the user clicks on the feed card before the popout is shown, open the more info page immediately!
    closePopout(true);
    onOpenDetails(show);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrementPoints(show.id);
    closePopout(true);
    onPlay(show);
  };

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatchlist(show.id);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrementPoints(show.id);
    closePopout(true);
    onOpenDetails(show);
  };

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    if (popoutVideoRef.current) {
      popoutVideoRef.current.muted = nextMuted;
    }
    if (stretchVideoRef.current) {
      stretchVideoRef.current.muted = nextMuted;
    }
    if (onToggleGlobalMute) {
      onToggleGlobalMute();
    } else {
      setLocalMuted(nextMuted);
    }
  };

  const verticalPosterSrc =
    (isStretchable || aspectRatio === '9:16')
      ? show.poster9x16Url || show.poster9x16Urls?.[0] || show.poster1x2Url || show.posterVerticalUrl || show.posterLandscapeUrl || show.backdropUrl
      : show.posterVerticalUrl || show.posterLandscapeUrl || show.backdropUrl;

  return (
    /* Base Card in the horizontal list: direct click opens details, long-press opens bottom sheet options on mobile */
    <div
      ref={baseCardRef}
      data-show-card="true"
      tabIndex={0}
      role="button"
      aria-label={`View ${show.title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sessionStorage.setItem('dizi_focus_play_on_next_tab', 'true');
          onIncrementPoints(show.id);
          onOpenDetails(show);
        } else if (e.key === ' ') {
          e.preventDefault();
          if (!disablePopout) openPopout();
        }
      }}
      className={`card-item relative ${cardSize === 'full' ? 'w-full' : 'shrink-0'} select-none py-1 group/item ${
        isHovered || isClosingPopout ? 'z-[110]' : 'z-[1]'
      } ${
        isPageScrolling
          ? 'cursor-default'
          : isStretchable
          ? isStretchPointerActive
            ? 'cursor-pointer'
            : 'cursor-default'
          : 'cursor-pointer'
      } focus:outline-none focus-visible:outline-none`}
      style={{
        zIndex: isHovered || isClosingPopout ? 110 : 1
      }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        onTouchStart={startLongPress}
        onTouchEnd={cancelLongPress}
        onTouchMove={cancelLongPress}
        onContextMenu={(e) => {
          if (onLongPress) {
            e.preventDefault();
            onLongPress(show);
          }
        }}
      >
        <div className={`flex items-center ${cardSize === 'full' ? 'w-full' : ''}`}>
          {/* Top 10 Rank Number if configured */}
          {rankNumber !== undefined && (
            <div className="relative -mr-3 sm:-mr-4 md:-mr-6 z-10 pointer-events-none select-none">
              <span
                className="text-6xl sm:text-7xl md:text-8xl font-black font-display tracking-tighter"
                style={{
                  color: '#101411',
                  WebkitTextStroke: '3px #52525b',
                  textShadow: '0 10px 20px rgba(0,0,0,0.8)'
                }}
              >
                {rankNumber}
              </span>
            </div>
          )}

          {/* 1. Stretchable Feed Card on Desktop: 4 cards at 100% zoom with edges under navigation badges */}
          {isStretchable ? (
            <div
              ref={stretchCardInnerRef}
              style={{
                marginLeft: '0px',
                width:
                  isHovered
                    ? expandedWidth
                      ? `${expandedWidth}px`
                      : undefined
                    : undefined,
                transition:
                  isHovered
                    ? 'width 500ms cubic-bezier(0.25, 1, 0.5, 1)'
                    : 'none'
              }}
              className={`relative ${
                isPageScrolling
                  ? 'cursor-default'
                  : isStretchPointerActive
                  ? 'cursor-pointer'
                  : 'cursor-default'
              } ${
                isHovered
                  ? 'w-[622px] sm:w-[702px] md:w-[773px] lg:w-[calc(((100vw-112px)/4.05)*2.6667)] max-w-[907px] z-30 shadow-none'
                  : 'w-[235px] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px] z-10 shadow-none'
              } h-[350px] sm:h-[395px] md:h-[435px] lg:h-[calc(((100vw-112px)/4.05)*1.5)] max-h-[510px] origin-left rounded-[6px] overflow-hidden bg-[#181818] border-0 shrink-0`}
            >
              {/* Layer 1: Vertical Poster (strictly unexpanded width, direct hide with NO stretch or zoom-out) */}
              <img
                src={verticalPosterSrc}
                alt={show.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className={`absolute top-0 bottom-0 left-0 w-full object-cover select-none ${
                  isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{
                  display: isHovered ? 'none' : 'block'
                }}
              />

              {/* Layer 2: 16:9 Backdrop media container directly showing backdrop on stretch */}
              <div
                className={`absolute inset-0 overflow-hidden ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  display: isHovered ? 'block' : 'none'
                }}
              >
                <img
                  src={show.backdropUrl || posterLandscapeUrl}
                  alt={show.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover ${
                    isVideoPlaying ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Video preview for stretchable feed (shown after 1.5s backdrop display) */}
                {isStretchable && shouldLoadVideo && popoutVideoSrc && (
                  <video
                    ref={stretchVideoRef}
                    src={popoutVideoSrc}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    onCanPlay={() => {
                      const v = stretchVideoRef.current;
                      if (v) {
                        v.muted = isMuted;
                        const p = v.play();
                        if (p !== undefined) {
                          p.catch(() => {
                            v.muted = true;
                            v.play().catch(() => {});
                          });
                        }
                      }
                      setIsVideoPlaying(true);
                    }}
                    onLoadedData={() => {
                      const v = stretchVideoRef.current;
                      if (v) {
                        v.muted = isMuted;
                        const p = v.play();
                        if (p !== undefined) {
                          p.catch(() => {
                            v.muted = true;
                            v.play().catch(() => {});
                          });
                        }
                      }
                      setIsVideoPlaying(true);
                    }}
                    onPlaying={() => setIsVideoPlaying(true)}
                    onEnded={() => {
                      setIsVideoPlaying(false);
                      setShouldLoadVideo(false);
                    }}
                    onError={() => setIsVideoPlaying(false)}
                    className={`absolute -inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)] object-cover z-10 transition-opacity duration-300 ${
                      isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    } ${isRightEdgeCard ? 'object-right' : 'object-left'}`}
                  />
                )}

                {/* Slight glare from bottom-left side */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'radial-gradient(ellipse 95% 85% at 0% 100%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.65) 45%, rgba(0,0,0,0.15) 75%, transparent 100%)'
                  }}
                />

                {/* Bottom-left Content */}
                <div className="absolute left-3.5 bottom-3.5 right-14 z-20 flex flex-col items-start select-none">
                  {/* Title Logo overlay: PNG logo in bottom-left at 250% increased size */}
                  <div className="mb-2 pointer-events-none transition-opacity duration-300">
                    <ShowTitleLogo show={show} className="max-h-[65px] sm:max-h-[72px] md:max-h-[80px] max-w-[260px] sm:max-w-[300px] w-auto h-auto object-contain drop-shadow-md" />
                  </div>

                  {/* Action Buttons: Play, Add to List, Info (animations removed) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayClick}
                      className="px-3.5 py-1.5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-[13px] flex items-center gap-1.5 shadow-md cursor-pointer"
                      aria-label="Play"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Play</span>
                    </button>
                    <button
                      onClick={handleWatchlistClick}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/30 flex items-center justify-center shadow-md cursor-pointer"
                      aria-label="Watchlist"
                    >
                      {isInWatchlist ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={handleInfoClick}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/30 flex items-center justify-center shadow-md cursor-pointer"
                      aria-label="Details"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Info Row: same info as recommendation (maturity rating, genre, duration/seasons, year) */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-white/90 mt-2">
                    <span className="px-1 py-0.5 rounded border border-white/40 text-[9px] font-bold text-white uppercase leading-none">
                      {show.maturityRating}
                    </span>
                    <span>{show.genres[0] || 'Drama'}</span>
                    <span className="text-white/60 font-bold">•</span>
                    <span>{show.durationOrSeasons}</span>
                    <span className="text-white/60 font-bold">•</span>
                    <span className="text-zinc-400">{show.releaseYear.split('-')[0]}</span>
                  </div>
                </div>

                {/* Bottom right mute button in stretchable feed */}
                {isStretchable && isHovered && isVideoPlaying && shouldLoadVideo && (
                  <button
                    onClick={toggleSound}
                    className="absolute bottom-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-md backdrop-blur-none transition-colors"
                    aria-label="Toggle mute"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Top 10 badge */}
              {showTop10Badge && (
                <div
                  className={`absolute top-0 left-0 z-30 pointer-events-none transition-opacity duration-300 ${
                    isHovered ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <div className="bg-[#e50914] text-white w-6 pt-0.5 pb-0.5 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                    <span className="text-[7.5px] font-black uppercase tracking-tight font-sans">TOP</span>
                    <span className="text-[12px] font-black leading-none font-sans mt-0.5">10</span>
                  </div>
                </div>
              )}
            </div>
          ) : aspectRatio === '9:16' ? (
            /* Feed Card in 1:2 aspect ratio (on mobile & tablet for stretchable feed) */
            <div className="relative w-[calc((100vw-32px)/2.14)] sm:w-[185px] md:w-[218px] aspect-[1/2] rounded-[6px] overflow-hidden bg-[#181818] border-0 shadow-none transition-all duration-300">
              <img
                src={verticalPosterSrc}
                alt={show.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
              {showTop10Badge && (
                <div className="absolute top-0 left-0 z-10 pointer-events-none">
                  <div className="bg-[#e50914] text-white w-6 pt-0.5 pb-0.5 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                    <span className="text-[7.5px] font-black uppercase tracking-tight font-sans">TOP</span>
                    <span className="text-[12px] font-black leading-none font-sans mt-0.5">10</span>
                  </div>
                </div>
              )}
            </div>
          ) : aspectRatio === '2:3' ? (
            /* 2. Feed Card in 2:3 aspect ratio - shows 3 full cards in normal mobile display */
            <div className="relative w-[calc((100vw-34px)/3.12)] sm:w-[145px] md:w-[175px] aspect-[2/3] rounded-[6px] overflow-hidden bg-[#181818] border-0 shadow-none transition-all duration-300">
              <img
                src={verticalPosterSrc}
                alt={show.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
              {/* No text over feed posters as specified */}
              {showTop10Badge && (
                <div className="absolute top-0 left-0 z-10 pointer-events-none">
                  <div className="bg-[#e50914] text-white w-6 pt-0.5 pb-0.5 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                    <span className="text-[7.5px] font-black uppercase tracking-tight font-sans">TOP</span>
                    <span className="text-[12px] font-black leading-none font-sans mt-0.5">10</span>
                  </div>
                </div>
              )}
            </div>
          ) : isContinueWatching ? (
            /* 3. Continue Watching: 16:9 aspect ratio poster showing 1 full card and edge of next title (smaller than 80vw special feed) */
            <div className="relative w-[68vw] max-w-[295px] sm:w-[260px] md:w-[290px] aspect-video rounded-[6px] overflow-hidden bg-[#181818] border-0 shadow-none transition-all duration-300">
              <img
                src={posterLandscapeUrl}
                alt={show.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            /* 4. Default Desktop Card: 16:9 aspect ratio (shows 2 full cards and edge of 3rd on mobile; 4 cards per row on desktop) */
            <div className={`relative ${
              cardSize === 'full' || cardSize === 'special'
                ? 'w-full'
                : cardSize === 'small'
                ? 'w-[calc((100vw-20px)/2.12)] sm:w-[245px] md:w-[270px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]'
                : 'w-[calc((100vw-20px)/2.12)] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]'
            } aspect-video rounded-[6px] overflow-hidden bg-[#181818] border-0 shadow-none group-focus-visible/item:ring-2 group-focus-visible/item:ring-red-600 group-focus-visible/item:ring-offset-2 group-focus-visible/item:ring-offset-[#141414] transition-all duration-300`}>
              {imageError || !posterLandscapeUrl ? (
                <div className="w-full h-full bg-[#181818] border-0 rounded-[6px] flex items-center justify-center p-4 text-center select-none">
                  <span className="text-white font-medium text-sm sm:text-base leading-snug drop-shadow-sm font-sans">
                    {show.title}
                  </span>
                </div>
              ) : (
                <img
                  src={posterLandscapeUrl}
                  alt={show.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              )}

              {/* Red TOP 10 Badge on poster (Left side, Netflix red, stacked TOP 10) */}
              {showTop10Badge && (
                <div className="absolute top-0 left-0 z-10 pointer-events-none">
                  <div className="bg-[#e50914] text-white w-7 pt-1 pb-1 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                    <span className="text-[8.5px] font-black uppercase tracking-tight font-sans">TOP</span>
                    <span className="text-[14px] font-black leading-none font-sans mt-0.5">10</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 
          EXPANDED PREVIEW CARD:
          Rendered directly inside the card-item in the DOM hierarchy.
          Pure CSS positioning with GPU compositor hardware acceleration (zero scroll delay).
          Sized with original responsive dimensions (min 80% = 363px, max 454px) and aligned directly over the base thumbnail.
          Strictly NO border color or ring outline.
        */}
        {!disablePopout && (isHovered || isClosingPopout) && (
          <div
            ref={popoutRef}
            onMouseMove={resetInactivityTimer}
            onClick={handleCardClick}
            className={`preview-popup absolute z-[120] rounded-xl overflow-hidden bg-[#181818] shadow-[0_8px_20px_rgba(0,0,0,0.32),0_2px_6px_rgba(0,0,0,0.2)] border-0 ring-0 outline-none cursor-pointer select-none ${
              isClosingPopout ? 'animate-card-pop-out' : 'animate-card-pop'
            } ${
              popoutAlign === 'left'
                ? 'origin-left'
                : popoutAlign === 'right'
                ? 'origin-right'
                : 'origin-center'
            }`}
            style={{
              zIndex: 120,
              top: `${popoutTop}px`,
              width: `${popoutWidth}px`,
              left:
                popoutAlign === 'left'
                  ? `${popoutLeftOffset}px`
                  : popoutAlign === 'right'
                  ? 'auto'
                  : `calc(${popoutLeftOffset}px + 50%)`,
              right: popoutAlign === 'right' ? '0px' : 'auto',
              transform:
                popoutAlign === 'center'
                  ? 'translate3d(-50%, 0, 0)'
                  : 'translate3d(0, 0, 0)',
              willChange: 'transform, opacity'
            }}
          >
            {/* Top Preview: Poster stays 1 second, then preview video buffers/plays */}
            <div className="relative aspect-video w-full bg-black overflow-hidden border-0">
            {imageError || !posterLandscapeUrl ? (
              <div className="w-full h-full bg-[#0a0a0c] border-0 rounded-lg flex items-center justify-center p-4 text-center select-none">
                <span className="text-white font-medium text-sm sm:text-base leading-snug drop-shadow-sm font-sans">
                  {show.title}
                </span>
              </div>
            ) : (
              <img
                src={posterLandscapeUrl}
                alt={show.title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover border-0 transition-opacity duration-300 ${
                  !isPopoutPosterPhase && isVideoPlaying ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            {/* Video preview: Mounted with zero latency, fills preview container with zero edge gap */}
            {shouldLoadVideo && popoutVideoSrc && (
              <video
                ref={popoutVideoRef}
                src={popoutVideoSrc}
                autoPlay
                muted={isMuted}
                playsInline
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onCanPlay={() => {
                  const v = popoutVideoRef.current;
                  if (v) {
                    v.muted = isMuted;
                    const p = v.play();
                    if (p !== undefined) {
                      p.catch(() => {
                        v.muted = true;
                        v.play().catch(() => {});
                      });
                    }
                  }
                  setIsVideoPlaying(true);
                }}
                onLoadedData={() => {
                  const v = popoutVideoRef.current;
                  if (v) {
                    v.muted = isMuted;
                    const p = v.play();
                    if (p !== undefined) {
                      p.catch(() => {
                        v.muted = true;
                        v.play().catch(() => {});
                      });
                    }
                  }
                  setIsVideoPlaying(true);
                }}
                onPlaying={() => setIsVideoPlaying(true)}
                onEnded={() => {
                  setIsVideoPlaying(false);
                  setShouldLoadVideo(false);
                  setIsPopoutPosterPhase(true);
                }}
                onError={() => setIsVideoPlaying(false)}
                className={`absolute -inset-[1px] w-[calc(100%+2px)] h-[calc(100%+2px)] object-cover border-0 z-10 transition-opacity duration-300 ${
                  !isPopoutPosterPhase && isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
            )}

            {/* Red TOP 10 Badge: on LEFT side, shown till the poster is shown on popout view (gone when video preview plays) */}
            {!isPreviewActivelyPlaying && showTop10Badge && (
              <div className="absolute top-0 left-0 z-10 pointer-events-none">
                <div className="bg-[#e50914] text-white w-7.5 pt-1.5 pb-1 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                  <span className="text-[9px] font-black uppercase tracking-tight font-sans">TOP</span>
                  <span className="text-[15px] font-black leading-none font-sans mt-0.5">10</span>
                </div>
              </div>
            )}

            {/* Subtle, light corner glare with zero harsh edges on screen for title contrast */}
            {isPreviewActivelyPlaying && (
              <div
                className={`absolute inset-0 pointer-events-none z-10 transition-opacity duration-300 ${
                  arePreviewOverlaysHidden ? 'opacity-0' : 'opacity-100'
                }`}
                style={{
                  background: 'radial-gradient(ellipse 65% 55% at 0% 100%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0.02) 65%, transparent 80%)'
                }}
              />
            )}

            {/* Top-Right Source Watermark (visible ONLY with video preview, appears & hides alongside title logo PNG / 5s pointer stay) */}
            {isPreviewActivelyPlaying && show.sourceWatermarkUrl && (
              <div
                className={`absolute top-2.5 right-3 z-20 pointer-events-none transition-opacity duration-300 ${
                  arePreviewOverlaysHidden ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <img
                  src={show.sourceWatermarkUrl}
                  alt="Source Watermark"
                  referrerPolicy="no-referrer"
                  className="max-h-6 sm:max-h-7.5 w-auto object-contain opacity-85 drop-shadow select-none"
                />
              </div>
            )}

            {/* Show Title Logo PNG: visible ONLY during video previews (never over posters), perfectly normalized for both boxy and wide logos without drop-shadow */}
            {isPreviewActivelyPlaying && (
              <div
                className={`absolute bottom-2.5 left-3 z-20 pointer-events-none transition-opacity duration-300 overflow-hidden flex items-end max-w-[65%] max-h-14 ${
                  arePreviewOverlaysHidden ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {show.titleLogoUrl ? (
                  <img
                    src={show.titleLogoUrl}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="max-h-12 sm:max-h-14 max-w-[190px] w-auto h-auto min-h-[38px] object-contain object-left-bottom select-none"
                  />
                ) : (
                  <ShowTitleLogo show={show} isSmall={true} />
                )}
              </div>
            )}

            {/* Sound Toggle Button - strictly hidden on poster, only visible when video is actively playing, autohides after 5s of pointer inactivity, NO tooltip */}
            {isPreviewActivelyPlaying && (
              <button
                onClick={toggleSound}
                className={`absolute bottom-2.5 right-2.5 w-7.5 h-7.5 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-opacity duration-300 cursor-pointer z-20 backdrop-blur-sm border-0 ${
                  arePreviewOverlaysHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                }`}
                aria-label="Toggle sound"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* Body: Action Buttons, Metadata, Genres */}
          <div className="p-3.5 bg-[#181818] space-y-2.5 border-0">
            {/* Action Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Play Button - NO animation, NO tooltip, keyboard tab-accessible */}
                <button
                  onClick={handlePlayClick}
                  tabIndex={0}
                  className="w-8.5 h-8.5 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-colors shadow cursor-pointer border-0 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  aria-label={`Play ${show.title}`}
                >
                  <svg className="w-4 h-4 ml-0.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                </button>

                {/* Watchlist Button - converts to tick icon with white color (never turns green) */}
                <button
                  onClick={handleWatchlistClick}
                  tabIndex={0}
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/40 bg-zinc-800/80 hover:bg-zinc-700 hover:border-white text-white focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  data-tooltip={isInWatchlist ? 'Remove from list' : 'Add to list'}
                  aria-label="Watchlist"
                >
                  {isInWatchlist ? <Check className="w-4 h-4 text-white stroke-[2.5]" /> : <Plus className="w-4 h-4 text-white" />}
                </button>

                {/* Like Button - icon fills with white color (never turns red) */}
                <button
                  onClick={handleLikeClick}
                  tabIndex={0}
                  className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/40 bg-zinc-800/80 hover:bg-zinc-700 hover:border-white text-white focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                  data-tooltip="Like"
                  aria-label="Like"
                >
                  <ThumbsUp className={`w-4 h-4 text-white ${isLiked ? 'fill-white' : ''}`} />
                </button>
              </div>

              {/* More Info Dropdown Chevron - NO animation */}
              <button
                onClick={handleInfoClick}
                tabIndex={0}
                className="w-8.5 h-8.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border-0 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                data-tooltip="More info"
                aria-label="More Info"
              >
                <ChevronDown className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Metadata Line - clear larger font matching prompt */}
            <div className="flex items-center gap-2.5 text-[14px] sm:text-[14.5px] font-semibold">
              <span className="text-[#46d369] font-bold">{show.imdbRating ? `${show.imdbRating}` : `${show.matchScore}% Match`}</span>
              <span className="text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-700 text-[12px] leading-none">
                {show.maturityRating}
              </span>
              <span className="text-zinc-200 font-bold">{show.durationOrSeasons}</span>
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-bold leading-none">HD</span>
            </div>

            {/* Short Genres - larger font */}
            <div className="flex flex-wrap gap-1.5 text-[13px] sm:text-[13.5px] text-zinc-300 font-medium">
              {show.genres.slice(0, 3).map((g, i) => (
                <span key={g} className="flex items-center gap-1.5">
                  <span>{g}</span>
                  {i < Math.min(show.genres.length - 1, 2) && (
                    <span className="text-zinc-600 font-bold">•</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
