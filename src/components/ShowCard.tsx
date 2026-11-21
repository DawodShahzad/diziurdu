import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Show, DetailsOriginMeta } from '../types';
import { Play, Plus, Check, ThumbsUp, ChevronDown, Volume2, VolumeX, Info, MoreVertical, MoreHorizontal, Star } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { getActiveArtwork } from '../utils/artworkRotator';
import { attachHlsVideo, isHlsSource } from '../utils/hlsHelper';
import { WatchProgressItem, formatProgressTime } from '../utils/watchProgress';
import { ResumeButtonProgress } from './ResumeButtonProgress';
import { MediaImage } from './MediaImage';
import { ModernRankNumber } from './ModernRankNumber';
import {
  recordCardPreviewTime,
  notifyPreviewStarted,
  clearCardPreviewTime,
  getResumableCardPreviewTime
} from '../utils/previewResumeTracker';

interface ShowCardProps {
  show: Show;
  rankNumber?: number;
  isInWatchlist: boolean;
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show, originMeta?: DetailsOriginMeta) => void;
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
  isWatchlistLandscape?: boolean;
  watchProgress?: WatchProgressItem;
  disablePopout?: boolean;
  disableVideoPreview?: boolean;
  popoutStyle?: 'classic' | 'overlay_red' | 'immersive_fade';
  isStretchable?: boolean;
  onLongPress?: (show: Show) => void;
  biggerCards?: boolean;
  isLiked?: boolean;
  onToggleLike?: (showId: string) => void;
  deferImageLoad?: boolean;
  skeletonDelayMs?: number;
  customPosterUrl?: string;
  durationChip?: string;
  episodeTitle?: string;
  episodeSublabel?: string;
  showOverlayLogoOnCard?: boolean;
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
  isWatchlistLandscape = false,
  watchProgress,
  disablePopout = false,
  disableVideoPreview = false,
  popoutStyle = 'classic',
  isStretchable = false,
  onLongPress,
  biggerCards = false,
  isLiked: isLikedProp,
  onToggleLike,
  deferImageLoad = false,
  skeletonDelayMs = 0,
  customPosterUrl,
  durationChip,
  episodeTitle,
  episodeSublabel,
  showOverlayLogoOnCard = false
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [localMuted, setLocalMuted] = useState<boolean>(false);
  const isMuted = onToggleGlobalMute ? isGlobalMuted : localMuted;
  const [localLiked, setLocalLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`dizi_liked_${show.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const isLiked = isLikedProp !== undefined ? isLikedProp : localLiked;
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
  const [popoutFixedPos, setPopoutFixedPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popoutFixedPosRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const popoutAnchorTopRef = useRef<number>(0);
  const popoutTopOffsetRef = useRef<number>(0);
  const popoutLeftOffsetRef = useRef<number>(0);
  const popoutEmergeRafRef = useRef<{ outer: number | null; inner: number | null }>({ outer: null, inner: null });
  const [popoutMotionStyle, setPopoutMotionStyle] = useState<{
    transform: string;
    opacity: number;
    borderRadius: string;
    transition: string;
  }>({
    transform: 'translate3d(0px, 0px, 0) scale(1)',
    opacity: 1,
    borderRadius: '12px',
    transition: 'none'
  });
  const [isEmergingPopout, setIsEmergingPopout] = useState<boolean>(false);
  const [isClosingPopout, setIsClosingPopout] = useState<boolean>(false);
  const [isCollapsingStretch, setIsCollapsingStretch] = useState<boolean>(false);
  const [isStretchPointerActive, setIsStretchPointerActive] = useState<boolean>(false);

  const activeArtwork = getActiveArtwork(show);
  const posterLandscapeUrl = customPosterUrl || activeArtwork.posterLandscapeUrl || show.posterLandscapeUrl;
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

  const isPreviewActivelyPlaying = !disableVideoPreview && isVideoPlaying && shouldLoadVideo && Boolean(popoutVideoSrc) && !isPopoutPosterPhase;

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
  const popoutEmergeTimerRef = useRef<number | null>(null);
  const stretchVideoTimerRef = useRef<number | null>(null);
  const popoutCloseTimerRef = useRef<number | null>(null);
  const stretchCollapseTimerRef = useRef<number | null>(null);
  const stretchPointerTimerRef = useRef<number | null>(null);
  const stretchHoverTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const cardInstanceId = useRef<string>(`card-${Math.random().toString(36).slice(2, 9)}`).current;
  const previewCardKey = useMemo(
    () => `${cardInstanceId}::${show.id}::${popoutVideoSrc}`,
    [cardInstanceId, show.id, popoutVideoSrc]
  );
  const hasAppliedResumeSeekRef = useRef<boolean>(false);
  const isHoveredRef = useRef<boolean>(false);
  const isCollapsingStretchRef = useRef<boolean>(false);

  const applyResumeSeekIfAvailable = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video || hasAppliedResumeSeekRef.current) return;
      const resumeSec = getResumableCardPreviewTime(previewCardKey);
      if (resumeSec > 0.25) {
        if (video.readyState >= 1) {
          const maxTarget =
            Number.isFinite(video.duration) && video.duration > 1
              ? Math.max(0, video.duration - 0.5)
              : resumeSec;
          const target = Math.min(resumeSec, maxTarget);
          if (target > 0.25) {
            try {
              video.currentTime = target;
            } catch {}
          }
          hasAppliedResumeSeekRef.current = true;
        }
      } else {
        hasAppliedResumeSeekRef.current = true;
      }
    },
    [previewCardKey]
  );

  const saveCurrentPreviewTime = useCallback(
    (video: HTMLVideoElement | null) => {
      if (!video) return;
      const cur = video.currentTime;
      if (
        Number.isFinite(cur) &&
        cur > 0.25 &&
        (!Number.isFinite(video.duration) || cur < video.duration - 0.5)
      ) {
        recordCardPreviewTime(previewCardKey, cur);
      }
    },
    [previewCardKey]
  );

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
    if (disableVideoPreview || !shouldLoadVideo || (!isHovered && !isClosingPopout) || !popoutVideoSrc) {
      setIsVideoPlaying(false);
      return;
    }
    const video = popoutVideoRef.current || stretchVideoRef.current;
    if (!video) return;

    hasAppliedResumeSeekRef.current = false;

    if (isHlsSource(popoutVideoSrc)) {
      const cleanup = attachHlsVideo(video, popoutVideoSrc, {
        autoPlay: true,
        muted: isMuted,
        onLoaded: () => {
          applyResumeSeekIfAvailable(video);
          setIsVideoPlaying(true);
        }
      });

      return () => {
        saveCurrentPreviewTime(video);
        setIsVideoPlaying(false);
        if (cleanup) cleanup();
      };
    } else {
      video.muted = isMuted;
      applyResumeSeekIfAvailable(video);
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            applyResumeSeekIfAvailable(video);
            setIsVideoPlaying(true);
          })
          .catch(() => {
            video.muted = true;
            video.play()
              .then(() => {
                applyResumeSeekIfAvailable(video);
                setIsVideoPlaying(true);
              })
              .catch(() => {});
          });
      }
      return () => {
        saveCurrentPreviewTime(video);
        setIsVideoPlaying(false);
      };
    }
  }, [isHovered, shouldLoadVideo, popoutVideoSrc, disableVideoPreview, applyResumeSeekIfAvailable, saveCurrentPreviewTime]);

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
    const targetHeight =
      popoutStyle === 'immersive_fade'
        ? Math.round(targetWidth * (9 / 16))
        : Math.round((targetWidth / originalWidth) * 390);
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
    // Never replay emergence animation if this card's popout is already open
    if (isHoveredRef.current && !isClosingPopout) return;

    if (popoutCloseTimerRef.current) {
      window.clearTimeout(popoutCloseTimerRef.current);
      popoutCloseTimerRef.current = null;
    }
    if (popoutEmergeTimerRef.current) {
      window.clearTimeout(popoutEmergeTimerRef.current);
      popoutEmergeTimerRef.current = null;
    }
    if (popoutEmergeRafRef.current.outer) cancelAnimationFrame(popoutEmergeRafRef.current.outer);
    if (popoutEmergeRafRef.current.inner) cancelAnimationFrame(popoutEmergeRafRef.current.inner);

    setIsClosingPopout(false);
    setIsEmergingPopout(true);
    popoutEmergeTimerRef.current = window.setTimeout(() => {
      setIsEmergingPopout(false);
      popoutEmergeTimerRef.current = null;
    }, 265);

    const baseDimensions = getPopoutDimensions();
    const targetWidth = cardSize === 'special' ? Math.round(baseDimensions.targetWidth * 0.78) : baseDimensions.targetWidth;
    const targetHeight =
      popoutStyle === 'immersive_fade'
        ? Math.round(targetWidth * (9 / 16))
        : Math.round((targetWidth / 454) * 390);
    setPopoutWidth(targetWidth);

    // Measure card thumbnail rect in viewport coordinates, then convert to document coordinates
    // so the portaled absolute popout moves in 100% GPU-compositor lockstep during vertical scroll (0ms lag).
    const rect = baseCardRef.current.getBoundingClientRect();
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const scrollX = typeof window !== 'undefined' ? window.scrollX || window.pageXOffset || 0 : 0;
    const scrollY = typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;
    const thumbEl =
      (baseCardRef.current.querySelector('[data-card-thumb="true"]') as HTMLElement) ||
      (baseCardRef.current.querySelector('.aspect-video') as HTMLElement) ||
      baseCardRef.current;
    const thumbRect = thumbEl.getBoundingClientRect();
    popoutAnchorTopRef.current = thumbRect.top;

    // Center popout vertically over the base thumbnail; float cleanly above Navbar when near top
    const rawViewportTop = Math.round(thumbRect.top + (thumbRect.height - targetHeight) / 2);
    const viewportTop = Math.max(12, rawViewportTop);
    popoutTopOffsetRef.current = viewportTop - thumbRect.top;
    const topOffset = Math.round(viewportTop - rect.top);
    setPopoutTop(topOffset);

    // Calculate alignment relative to the scroll container's visible bounds
    const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
    const scrollContainer = feedStrip?.querySelector('.overflow-x-auto');
    const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
    const leftBoundary = containerRect ? Math.max(0, containerRect.left) : 0;
    const rightBoundary = containerRect ? Math.min(screenWidth, containerRect.right) : screenWidth;

    const halfWidth = targetWidth / 2;
    const cardCenter = thumbRect.left + thumbRect.width / 2;

    const leftLimit = leftBoundary + 16;
    const rightLimit = rightBoundary - 16;

    let viewportLeft = 0;
    if (isFirst || cardCenter - halfWidth < leftLimit || thumbRect.left < leftLimit) {
      setPopoutAlign('left');
      viewportLeft = Math.max(12, Math.round(Math.max(leftBoundary, thumbRect.left)));
      setPopoutLeftOffset(Math.max(0, Math.round(viewportLeft - rect.left)));
    } else if (isLast || cardCenter + halfWidth > rightLimit || thumbRect.right > rightLimit) {
      setPopoutAlign('right');
      const clampedRight = Math.max(12, Math.round(screenWidth - Math.min(rightBoundary, thumbRect.right)));
      viewportLeft = Math.max(12, Math.round(screenWidth - clampedRight - targetWidth));
      setPopoutLeftOffset(0);
    } else {
      setPopoutAlign('center');
      viewportLeft = Math.max(12, Math.round(cardCenter - halfWidth));
      setPopoutLeftOffset(Math.max(0, Math.round(thumbRect.left - rect.left)));
    }

    popoutLeftOffsetRef.current = viewportLeft - thumbRect.left;
    const docTop = viewportTop + scrollY;
    const docLeft = viewportLeft + scrollX;
    popoutFixedPosRef.current = { top: docTop, left: docLeft };
    setPopoutFixedPos({ top: docTop, left: docLeft });

    // Start FLIP emergence from the exact underlying card thumbnail rectangle (top-left origin = zero offset drift)
    const initScale = Math.max(0.35, Math.min(0.96, thumbRect.width / Math.max(1, targetWidth)));
    const initDx = Math.round(thumbRect.left - viewportLeft);
    const initDy = Math.round(thumbRect.top - viewportTop);
    setPopoutMotionStyle({
      transform: `translate3d(${initDx}px, ${initDy}px, 0) scale(${initScale.toFixed(4)})`,
      opacity: 0.65,
      borderRadius: '10px',
      transition: 'none'
    });

    popoutEmergeRafRef.current.outer = requestAnimationFrame(() => {
      popoutEmergeRafRef.current.inner = requestAnimationFrame(() => {
        setPopoutMotionStyle({
          transform: 'translate3d(0px, 0px, 0) scale(1)',
          opacity: 1,
          borderRadius: '12px',
          transition:
            'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out, border-radius 240ms ease'
        });
      });
    });

    isHoveredRef.current = true;
    hasAppliedResumeSeekRef.current = false;
    setIsHovered(true);
    setIsPopoutPosterPhase(true);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    setArePreviewOverlaysHidden(false);

    // When popout view opens, remain showing the poster for 1 second, then show the preview (unless disabled)
    if (popoutPosterTimerRef.current) window.clearTimeout(popoutPosterTimerRef.current);
    if (!disableVideoPreview) {
      popoutPosterTimerRef.current = window.setTimeout(() => {
        setIsPopoutPosterPhase(false);
        setShouldLoadVideo(true);
      }, 1000);
    }

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

      // Save playback position before pausing so immediate re-hover resumes where left off
      saveCurrentPreviewTime(stretchVideoRef.current);
      setShouldLoadVideo(false);
      setIsVideoPlaying(false);
      if (stretchVideoRef.current) {
        try {
          stretchVideoRef.current.pause();
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
    [cancelStretchHover, cardInstanceId, onHoverPreviewEnd, saveCurrentPreviewTime]
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
    // Do not restart an in-flight collapse animation on duplicate mousemove/mouseleave events
    if (!immediate && popoutCloseTimerRef.current) return;

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
    if (popoutEmergeTimerRef.current) {
      window.clearTimeout(popoutEmergeTimerRef.current);
      popoutEmergeTimerRef.current = null;
    }
    if (popoutEmergeRafRef.current.outer) cancelAnimationFrame(popoutEmergeRafRef.current.outer);
    if (popoutEmergeRafRef.current.inner) cancelAnimationFrame(popoutEmergeRafRef.current.inner);
    setIsEmergingPopout(false);

    // Save playback progress before pausing so re-hovering this same card resumes where it left off
    saveCurrentPreviewTime(popoutVideoRef.current);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    setIsPopoutPosterPhase(true);
    if (popoutVideoRef.current) {
      try {
        popoutVideoRef.current.pause();
      } catch {}
    }

    onPopoutViewClose?.();

    if (immediate || !isHovered) {
      isHoveredRef.current = false;
      setIsHovered(false);
      setIsClosingPopout(false);
      setIsEmergingPopout(false);
      setArePreviewOverlaysHidden(false);
      onHoverPreviewEnd?.();
      return;
    }

    // Measure exact live base card coordinates relative to current document-anchored popout position
    let endScale = 0.68;
    let endDx = 0;
    let endDy = 36;
    if (baseCardRef.current) {
      const thumbEl =
        (baseCardRef.current.querySelector('[data-card-thumb="true"]') as HTMLElement) ||
        (baseCardRef.current.querySelector('.aspect-video') as HTMLElement) ||
        baseCardRef.current;
      const thumbRect = thumbEl.getBoundingClientRect();
      const scrollX = typeof window !== 'undefined' ? window.scrollX || window.pageXOffset || 0 : 0;
      const scrollY = typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;
      const curViewportLeft = popoutFixedPosRef.current.left - scrollX;
      const curViewportTop = popoutFixedPosRef.current.top - scrollY;
      if (thumbRect.width > 10) {
        endScale = Math.max(0.35, Math.min(0.98, thumbRect.width / Math.max(1, popoutWidth)));
        endDx = Math.round(thumbRect.left - curViewportLeft);
        endDy = Math.round(thumbRect.top - curViewportTop);
      }
    }

    // Continuous smooth GPU collapse straight back onto exact base card rectangle (no upward jump, no height snap)
    setIsClosingPopout(true);
    setPopoutMotionStyle({
      transform: `translate3d(${endDx}px, ${endDy}px, 0) scale(${endScale.toFixed(4)})`,
      opacity: 0,
      borderRadius: '10px',
      transition: 'transform 210ms cubic-bezier(0.22, 1, 0.36, 1), opacity 130ms ease-in 75ms, border-radius 180ms ease'
    });

    popoutCloseTimerRef.current = window.setTimeout(() => {
      isHoveredRef.current = false;
      setIsHovered(false);
      setIsClosingPopout(false);
      setIsEmergingPopout(false);
      setIsPopoutPosterPhase(true);
      setShouldLoadVideo(false);
      setIsVideoPlaying(false);
      setArePreviewOverlaysHidden(false);
      onHoverPreviewEnd?.();
      popoutCloseTimerRef.current = null;
    }, 215);
  };

  // When cursor or pointer goes away from base card or popout view, collapse immediately
  useEffect(() => {
    if (!isHovered && !isClosingPopout) return;

    const handleCheckPointerAway = (e: MouseEvent) => {
      if (!isHovered || isClosingPopout) return;

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

  // Track any scroll direction (vertical + horizontal) instantaneously with zero React-render lag.
  // Popout moves 1:1 with its base card and collapses cleanly when >= 50% crosses left/right/vertical screen edges
  // or when the card scrolls away from the stationary cursor pointer.
  useEffect(() => {
    if (!isHovered && !isClosingPopout && !isCollapsingStretch) return;

    const getScrollContainer = (): HTMLElement | null => {
      if (!baseCardRef.current) return null;
      const direct = baseCardRef.current.closest('.overflow-x-auto') as HTMLElement | null;
      if (direct) return direct;
      const feedStrip = baseCardRef.current.closest('[data-feed-strip="true"]');
      return (feedStrip?.querySelector('.overflow-x-auto') as HTMLElement | null) || null;
    };

    const syncPositionAndCheckCollapse = (checkCollapse: boolean) => {
      if (!baseCardRef.current) return;
      const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 720;

      const scrollContainer = getScrollContainer();
      const containerRect = scrollContainer ? scrollContainer.getBoundingClientRect() : null;
      const leftBound = containerRect ? Math.max(0, containerRect.left) : 0;
      const rightBound = containerRect ? Math.min(screenWidth, containerRect.right) : screenWidth;

      if (isStretchable) {
        if (checkCollapse && isHovered && mousePosRef.current && mousePosRef.current.x >= 0 && mousePosRef.current.y >= 0) {
          const { x, y } = mousePosRef.current;
          const cardEl = stretchCardInnerRef.current || baseCardRef.current;
          const sRect = cardEl.getBoundingClientRect();
          if (y < sRect.top || y > sRect.bottom || x < leftBound || x > rightBound) {
            cancelStretchHover();
            triggerStretchCollapse(true);
          }
        }
        return;
      }

      const thumbEl =
        (baseCardRef.current.querySelector('[data-card-thumb="true"]') as HTMLElement) ||
        (baseCardRef.current.querySelector('.aspect-video') as HTMLElement) ||
        baseCardRef.current;
      const thumbRect = thumbEl.getBoundingClientRect();
      const scrollX = typeof window !== 'undefined' ? window.scrollX || window.pageXOffset || 0 : 0;
      const scrollY = typeof window !== 'undefined' ? window.scrollY || window.pageYOffset || 0 : 0;

      // Live viewport coordinates for edge/pointer checks, and document coordinates for 0ms GPU-locked absolute positioning
      const nextViewportTop = thumbRect.top + popoutTopOffsetRef.current;
      const nextViewportLeft = thumbRect.left + popoutLeftOffsetRef.current;
      const nextDocTop = nextViewportTop + scrollY;
      const nextDocLeft = nextViewportLeft + scrollX;

      if (
        Math.abs(popoutFixedPosRef.current.top - nextDocTop) > 0.25 ||
        Math.abs(popoutFixedPosRef.current.left - nextDocLeft) > 0.25
      ) {
        popoutFixedPosRef.current = { top: nextDocTop, left: nextDocLeft };
        if (popoutRef.current) {
          popoutRef.current.style.top = `${nextDocTop}px`;
          popoutRef.current.style.left = `${nextDocLeft}px`;
        }
      }

      if (!checkCollapse || !isHovered || isClosingPopout) return;

      const baseRect = baseCardRef.current.getBoundingClientRect();
      const popRect = popoutRef.current?.getBoundingClientRect();
      const popH =
        popRect?.height ||
        (popoutStyle === 'immersive_fade'
          ? Math.round(popoutWidth * (9 / 16))
          : Math.round((popoutWidth / 454) * 390));

      // 1. 50% Edge Collapse: collapse immediately when >= 50% goes past left/right edge of screen (or row/vertical viewport)
      const screenVisLeft = Math.max(0, nextViewportLeft);
      const screenVisRight = Math.min(screenWidth, nextViewportLeft + popoutWidth);
      const screenVisWidth = Math.max(0, screenVisRight - screenVisLeft);

      const containerVisLeft = Math.max(leftBound, nextViewportLeft);
      const containerVisRight = Math.min(rightBound, nextViewportLeft + popoutWidth);
      const containerVisWidth = Math.max(0, containerVisRight - containerVisLeft);

      const vTop = Math.max(0, nextViewportTop);
      const vBottom = Math.min(screenHeight, nextViewportTop + popH);
      const vHeight = Math.max(0, vBottom - vTop);

      if (
        screenVisWidth < popoutWidth * 0.5 ||
        containerVisWidth < popoutWidth * 0.5 ||
        vHeight < popH * 0.5
      ) {
        closePopout();
        return;
      }

      // 2. Stationary pointer check on scroll: collapse if popout moves completely off stationary cursor
      if (mousePosRef.current && mousePosRef.current.x >= 0 && mousePosRef.current.y >= 0) {
        const { x, y } = mousePosRef.current;
        const inBase = x >= baseRect.left && x <= baseRect.right && y >= baseRect.top && y <= baseRect.bottom;
        const inProjectedPopout =
          x >= nextViewportLeft &&
          x <= nextViewportLeft + popoutWidth &&
          y >= nextViewportTop &&
          y <= nextViewportTop + popH;
        const inPopout =
          popRect &&
          x >= popRect.left &&
          x <= popRect.right &&
          y >= popRect.top &&
          y <= popRect.bottom;

        if (!inBase && !inProjectedPopout && !inPopout) {
          closePopout();
        }
      }
    };

    const handleScrollEvent = () => {
      syncPositionAndCheckCollapse(true);
    };

    const scrollContainer = getScrollContainer();

    // Forward horizontal wheel/trackpad scroll through the fixed portaled popout to the row beneath it
    const handlePopoutWheel = (e: WheelEvent) => {
      if (!scrollContainer || isStretchable || !isHovered || isClosingPopout) return;
      const horizDelta =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY)
          ? e.deltaX
          : e.shiftKey && Math.abs(e.deltaY) > 0
          ? e.deltaY
          : 0;
      if (Math.abs(horizDelta) > 0.5) {
        e.preventDefault();
        scrollContainer.scrollLeft += horizDelta;
        syncPositionAndCheckCollapse(true);
        triggerGlobalScroll();
      }
    };

    // Continuous per-frame DOM sync while hovered/closing so smooth scroll, wheel inertia, and row arrows have 0ms lag
    let rafId = 0;
    const rafTick = () => {
      syncPositionAndCheckCollapse(true);
      rafId = window.requestAnimationFrame(rafTick);
    };
    if (!isStretchable) {
      rafId = window.requestAnimationFrame(rafTick);
    }

    const popoutEl = popoutRef.current;
    window.addEventListener('scroll', handleScrollEvent, { passive: true, capture: true });
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScrollEvent, { passive: true });
    }
    if (popoutEl && !isStretchable) {
      popoutEl.addEventListener('wheel', handlePopoutWheel, { passive: false });
    }

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScrollEvent, { capture: true });
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScrollEvent);
      }
      if (popoutEl) {
        popoutEl.removeEventListener('wheel', handlePopoutWheel);
      }
    };
  }, [isHovered, isClosingPopout, isCollapsingStretch, isStretchable, popoutWidth, popoutStyle, triggerStretchCollapse]);

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
      if (hoverTimer.current) {
        window.clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
      isHoveredRef.current = true;
      setIsClosingPopout(false);
      setIsHovered(true);
      setPopoutMotionStyle({
        transform: 'translate3d(0px, 0px, 0) scale(1)',
        opacity: 1,
        borderRadius: '12px',
        transition: 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 160ms ease-out'
      });

      // Re-arm preview timer cleanly without scheduling a duplicate popout emergence
      if (popoutPosterTimerRef.current) window.clearTimeout(popoutPosterTimerRef.current);
      if (!disableVideoPreview) {
        setIsPopoutPosterPhase(true);
        setShouldLoadVideo(false);
        setIsVideoPlaying(false);
        popoutPosterTimerRef.current = window.setTimeout(() => {
          setIsPopoutPosterPhase(false);
          setShouldLoadVideo(true);
        }, 1000);
      }

      onHoverPreviewStart?.();
      onPopoutViewOpen?.();
      return;
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

    // If popout is already open for this card, never trigger a second popout animation
    if (isHoveredRef.current && !isClosingPopout) {
      return;
    }

    // Normal feed card: reset to poster phase before opening popout (saved resume time is kept in previewResumeTracker)
    setIsPopoutPosterPhase(true);
    setShouldLoadVideo(false);
    setIsVideoPlaying(false);
    if (popoutVideoRef.current) {
      try {
        popoutVideoRef.current.pause();
      } catch {}
    }

    // Normal feed card: wait 0.5 second before opening popout view
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null;
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

    // Do not close if pointer moved directly onto the portaled popout card
    const related = e.relatedTarget as Node | null;
    if (related && popoutRef.current && popoutRef.current.contains(related)) {
      return;
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

  const verticalPosterSrc =
    (isStretchable || aspectRatio === '9:16')
      ? show.poster9x16Url || show.poster9x16Urls?.[0] || show.poster1x2Url || show.posterVerticalUrl || show.posterLandscapeUrl || show.backdropUrl
      : show.posterVerticalUrl || show.posterLandscapeUrl || show.backdropUrl;

  const buildOriginMeta = useCallback((): DetailsOriginMeta => {
    const thumbEl =
      (baseCardRef.current?.querySelector('[data-card-thumb="true"]') as HTMLElement | null) ||
      baseCardRef.current;
    const isPortraitCard = aspectRatio === '2:3' || aspectRatio === '9:16' || isStretchable;
    return {
      element: thumbEl,
      sourceFeedType: isStretchable ? 'other' : 'normal',
      posterUrl: isPortraitCard ? verticalPosterSrc : posterLandscapeUrl
    };
  }, [aspectRatio, isStretchable, verticalPosterSrc, posterLandscapeUrl]);

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
    const meta = buildOriginMeta();
    // When the user clicks on the feed card before the popout is shown, open the more info page immediately!
    closePopout(true);
    onOpenDetails(show, meta);
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
    const next = !isLiked;
    setLocalLiked(next);
    try {
      localStorage.setItem(`dizi_liked_${show.id}`, String(next));
    } catch {}
    onToggleLike?.(show.id);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onIncrementPoints(show.id);
    const meta = buildOriginMeta();
    closePopout(true);
    onOpenDetails(show, meta);
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
          onOpenDetails(show, buildOriginMeta());
        } else if (e.key === ' ') {
          e.preventDefault();
          if (!disablePopout) openPopout();
        }
      }}
      data-show-id={show.id}
      className={`card-item relative ${cardSize === 'full' ? 'w-full' : 'shrink-0'} select-none py-1 group/item ${
        isStretchable && isHovered ? 'z-[30]' : 'z-[1]'
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
        zIndex: isStretchable && isHovered ? 30 : 1
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
          {/* Top 10 Rank Number if configured (exact silver-gray outline, dark fill, smooth right fade behind card) */}
          {rankNumber !== undefined && (
            <div className="relative -mr-3 sm:-mr-4 md:-mr-5 z-0 pointer-events-none select-none flex items-center">
              <ModernRankNumber
                rank={rankNumber}
                fillColor="#111111"
                strokeColor="#8c8c8c"
                strokeWidth={3.8}
                strokeLinejoin="miter"
                fadeRight={true}
                className={`${
                  rankNumber >= 10
                    ? 'w-[80px] sm:w-[98px] md:w-[122px]'
                    : 'w-[56px] sm:w-[70px] md:w-[88px]'
                } h-[88px] sm:h-[112px] md:h-[138px]`}
              />
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
              } h-[350px] sm:h-[395px] md:h-[435px] lg:h-[calc(((100vw-112px)/4.05)*1.5)] max-h-[510px] origin-left rounded-[6px] md:rounded-[10px] overflow-hidden bg-[#181818] border-0 shrink-0`}
              data-card-thumb="true"
            >
              {/* Layer 1: Vertical Poster (strictly unexpanded width, direct hide with NO stretch or zoom-out) */}
              <div className={isHovered ? 'hidden' : 'absolute inset-0'}>
                <MediaImage
                  src={verticalPosterSrc}
                  fallbackTitle={show.title}
                  deferLoad={deferImageLoad}
                  skeletonDelayMs={skeletonDelayMs}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover select-none"
                />
              </div>

              {/* Layer 2: 16:9 Backdrop media container directly showing backdrop on stretch */}
              <div
                className={`absolute inset-0 overflow-hidden ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                style={{
                  display: isHovered ? 'block' : 'none'
                }}
              >
                <MediaImage
                  src={show.stretchableFeedBackdropUrl || show.backdropUrl || posterLandscapeUrl}
                  fallbackTitle={show.title}
                  hideFallback={isVideoPlaying}
                  deferLoad={!isHovered && deferImageLoad}
                  className={`w-full h-full object-cover ${
                    isVideoPlaying ? 'opacity-0' : 'opacity-100'
                  }`}
                />

                {/* Video preview for stretchable feed (fills 100% of container edge-to-edge) */}
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
                    onLoadedMetadata={() => {
                      applyResumeSeekIfAvailable(stretchVideoRef.current);
                    }}
                    onCanPlay={() => {
                      const v = stretchVideoRef.current;
                      if (v) {
                        applyResumeSeekIfAvailable(v);
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
                        applyResumeSeekIfAvailable(v);
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
                    onPlaying={() => {
                      notifyPreviewStarted(previewCardKey);
                      setIsVideoPlaying(true);
                    }}
                    onTimeUpdate={() => {
                      const v = stretchVideoRef.current;
                      if (v && !v.paused && v.currentTime > 0.25) {
                        recordCardPreviewTime(previewCardKey, v.currentTime);
                      }
                    }}
                    onEnded={() => {
                      clearCardPreviewTime(previewCardKey);
                      setIsVideoPlaying(false);
                      setShouldLoadVideo(false);
                    }}
                    onError={() => setIsVideoPlaying(false)}
                    className={`absolute inset-0 w-full h-full max-w-none max-h-none object-cover object-center z-10 transition-opacity duration-300 ${
                      isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                )}

                {/* Subtle, smaller & lighter glare from bottom-left side */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background:
                      'radial-gradient(ellipse 52% 45% at 0% 100%, rgba(0,0,0,0.52) 0%, rgba(0,0,0,0.22) 40%, rgba(0,0,0,0.04) 70%, transparent 90%)'
                  }}
                />

                {/* Bottom-left Content */}
                <div className="absolute left-3.5 bottom-3.5 right-14 z-20 flex flex-col items-start select-none">
                  {/* Fixed Netflix 2.5:1 Title Logo overlay (40% of 16:9 expanded card width minus 10px) */}
                  <div
                    style={{
                      width: expandedWidth ? `${Math.max(80, Math.round(expandedWidth * 0.4) - 10)}px` : 'calc(40% - 10px)'
                    }}
                    className="relative aspect-[2.5/1] overflow-hidden shrink-0 mb-2 pointer-events-none transition-opacity duration-300"
                  >
                    <ShowTitleLogo show={show} fillContainer={true} align="left" className="drop-shadow-md" />
                  </div>

                  {/* Action Buttons: Play / Resume with progress underline, Add to List, Info (matching image_f72bd3ca.png) */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayClick}
                      className="px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg cursor-pointer"
                      aria-label={watchProgress && watchProgress.progressPercent > 0 ? 'Resume' : 'Play'}
                    >
                      <Play className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-black" />
                      <ResumeButtonProgress
                        label={
                          watchProgress && watchProgress.progressPercent > 0
                            ? show.type === 'series'
                              ? `Resume S${watchProgress.seasonNumber || 1} E${watchProgress.episodeNumber || 1}`
                              : 'Resume'
                            : 'Play'
                        }
                        progressPercent={watchProgress?.progressPercent}
                        textClassName="text-xs sm:text-sm font-bold"
                      />
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

                {/* Bottom right mute button in stretchable feed (low opacity background) */}
                {isStretchable && isHovered && isVideoPlaying && shouldLoadVideo && (
                  <button
                    onClick={toggleSound}
                    onPointerDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="absolute bottom-3.5 right-3.5 z-30 before:content-[''] before:absolute before:-inset-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white border border-white/15 flex items-center justify-center cursor-pointer transition-colors"
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
            <div data-card-thumb="true" className="relative z-10 w-[calc((100vw-32px)/2.14)] sm:w-[185px] md:w-[218px] aspect-[1/2] rounded-[6px] overflow-hidden bg-[#181818] border-0 shadow-none transition-all duration-300">
              <MediaImage
                src={verticalPosterSrc}
                fallbackTitle={show.title}
                deferLoad={deferImageLoad}
                skeletonDelayMs={skeletonDelayMs}
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
            /* 2. Feed Card in 2:3 aspect ratio - shows 3 full cards + edge of 4th card in mobile layout */
            <div data-card-thumb="true" className={`relative z-10 ${
              biggerCards
                ? 'w-[calc((100vw-24px)/2.25)] sm:w-[185px] md:w-[220px]'
                : 'w-[calc((100vw-24px)/3.22)] sm:w-[155px] md:w-[185px]'
            } aspect-[2/3] rounded-[6px] overflow-hidden bg-[#181818] border-0 ${
              rankNumber !== undefined ? 'shadow-[-14px_0_26px_rgba(0,0,0,0.9)]' : 'shadow-none'
            } transition-all duration-300`}>
              <MediaImage
                src={verticalPosterSrc}
                fallbackTitle={show.title}
                deferLoad={deferImageLoad}
                skeletonDelayMs={skeletonDelayMs}
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
          ) : isWatchlistLandscape ? (
            /* My List in Mobile layout (fallback landscape if explicitly requested) */
            <div className="relative w-[calc((100vw-24px)/2.18)] sm:w-[260px] md:w-[290px] flex flex-col shrink-0">
              <div data-card-thumb="true" className="relative w-full aspect-video rounded-[7px] sm:rounded-[6px] md:rounded-[10px] overflow-hidden bg-[#111] sm:bg-[#181818] border-0 shadow-none transition-all duration-300">
                <MediaImage
                  src={posterLandscapeUrl}
                  fallbackTitle={show.title}
                  deferLoad={deferImageLoad}
                  skeletonDelayMs={skeletonDelayMs}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : isContinueWatching ? (
            /* 3. Keep Watching:
               - On Mobile: 2 full cards + edge of 3rd, progress bar inside card at bottom, subtle rounded-[7px] corners,
                 and below card: S1 E1  24 min left + 3 vertical dots menu button
               - On Desktop & Tablet: Progress bar below card
            */
            <div className={`relative ${
              biggerCards
                ? 'w-[calc((100vw-20px)/2.12)] sm:w-[295px] md:w-[340px] lg:w-[calc((100vw-112px)/3.35)] max-w-[420px]'
                : 'w-[calc((100vw-20px)/2.12)] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]'
            } flex flex-col shrink-0`}>
              <div data-card-thumb="true" className="relative w-full aspect-video rounded-[7px] sm:rounded-[6px] md:rounded-[10px] overflow-hidden bg-[#111] sm:bg-[#181818] border-0 shadow-none transition-all duration-300">
                <MediaImage
                  src={posterLandscapeUrl}
                  fallbackTitle={show.title}
                  deferLoad={deferImageLoad}
                  skeletonDelayMs={skeletonDelayMs}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />
                {/* Progress bar inside card at bottom (matching image_c2ddc79a.png) */}
                {watchProgress && watchProgress.progressPercent > 0 && !watchProgress.isNextEpisodePrompt && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-600/70 overflow-hidden z-20 pointer-events-none">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, watchProgress.progressPercent))}%`
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Mobile layout beneath card: S1 E1  24m left  ⋮ */}
              <div className="sm:hidden flex items-center justify-between pt-1.5 px-0.5 select-none">
                <div className="flex items-center gap-2 min-w-0">
                  {(show.type === 'series' || (show.seasons && show.seasons.length > 0)) && (
                    <span className="font-bold text-white text-[13px] tracking-tight shrink-0">
                      S{watchProgress?.seasonNumber || 1} E{watchProgress?.episodeNumber || 1}
                    </span>
                  )}
                  <span className="text-zinc-400 font-normal text-[13px] truncate">
                    {watchProgress?.duration && watchProgress?.currentTime !== undefined && watchProgress.duration > watchProgress.currentTime
                      ? formatProgressTime(watchProgress.currentTime, watchProgress.duration)
                      : '24m left'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onLongPress) {
                      onLongPress(show);
                    }
                  }}
                  className="p-1 -mr-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  aria-label="More options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* 4. Default Desktop Card: 16:9 aspect ratio */
            <div className={`relative z-10 flex flex-col ${
              cardSize === 'full' || cardSize === 'special'
                ? 'w-full'
                : cardSize === 'small'
                ? biggerCards
                  ? 'w-[calc((100vw-20px)/2.12)] sm:w-[285px] md:w-[320px] lg:w-[calc((100vw-112px)/3.35)] max-w-[420px]'
                  : 'w-[calc((100vw-20px)/2.12)] sm:w-[245px] md:w-[270px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]'
                : biggerCards
                ? 'w-[calc((100vw-20px)/2.12)] sm:w-[295px] md:w-[340px] lg:w-[calc((100vw-112px)/3.35)] max-w-[420px]'
                : 'w-[calc((100vw-20px)/2.12)] sm:w-[265px] md:w-[290px] lg:w-[calc((100vw-112px)/4.05)] max-w-[340px]'
            }`}>
              <div data-card-thumb="true" className="relative w-full aspect-video rounded-[6px] md:rounded-[10px] overflow-hidden bg-[#181818] border-0 shadow-none group-focus-visible/item:ring-2 group-focus-visible/item:ring-red-600 group-focus-visible/item:ring-offset-2 group-focus-visible/item:ring-offset-[#141414] transition-all duration-300">
                <MediaImage
                  src={posterLandscapeUrl}
                  fallbackTitle={episodeTitle || show.title}
                  deferLoad={deferImageLoad}
                  skeletonDelayMs={skeletonDelayMs}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover"
                />

                {/* Optional Episode 1 Card Overlay (Logo + Duration chip) */}
                {showOverlayLogoOnCard && (
                  <>
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
                    <div className="absolute bottom-2.5 left-3 z-20 pointer-events-none w-[40%] aspect-[2.5/1] overflow-hidden flex items-end">
                      {show.titleLogoUrl ? (
                        <img
                          src={show.titleLogoUrl}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                        />
                      ) : (
                        <span className="text-white font-black text-xs sm:text-sm uppercase tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] line-clamp-1">
                          {show.title}
                        </span>
                      )}
                    </div>
                    {durationChip && (
                      <div className="absolute bottom-2.5 right-2.5 z-20 px-1.5 py-0.5 rounded-[5px] bg-black/75 text-white text-[11px] font-bold tracking-tight leading-tight pointer-events-none">
                        {durationChip}
                      </div>
                    )}
                  </>
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

              {episodeTitle && (
                <div className="mt-2 px-0.5">
                  <h4 className="text-white font-bold text-sm leading-snug truncate group-hover/item:text-white/90">
                    {episodeTitle}
                  </h4>
                  {episodeSublabel && (
                    <p className="text-zinc-400 text-xs font-medium mt-0.5 truncate">
                      {episodeSublabel}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 
          EXPANDED PREVIEW CARD (Portaled to document.body at position: absolute z-[120]):
          Moves in 100% GPU-composited lockstep with vertical scroll (zero vertical lag) and floats cleanly over Top Navbar.
          Supports 'classic', 'overlay_red', and 'immersive_fade' styles.
        */}
        {!disablePopout && (isHovered || isClosingPopout) && typeof document !== 'undefined' && createPortal(
          <div
            ref={popoutRef}
            onMouseMove={resetInactivityTimer}
            onClick={handleCardClick}
            className={`preview-popup absolute z-[120] overflow-hidden outline-none cursor-pointer select-none origin-top-left isolate ${
              isClosingPopout ? 'pointer-events-none' : 'pointer-events-auto'
            } ${
              popoutStyle === 'overlay_red'
                ? 'bg-[#0b0b0d] border-0 shadow-[0_14px_38px_rgba(0,0,0,0.82)]'
                : popoutStyle === 'immersive_fade'
                ? 'bg-black border-0 shadow-[0_14px_38px_rgba(0,0,0,0.82)]'
                : 'bg-[#181818] border-0 shadow-[0_8px_20px_rgba(0,0,0,0.32),0_2px_6px_rgba(0,0,0,0.2)]'
            }`}
            style={{
              zIndex: 120,
              top: `${popoutFixedPosRef.current.top}px`,
              left: `${popoutFixedPosRef.current.left}px`,
              width: `${popoutWidth}px`,
              transformOrigin: '0 0',
              transform: popoutMotionStyle.transform,
              opacity: popoutMotionStyle.opacity,
              borderRadius: popoutMotionStyle.borderRadius,
              transition: popoutMotionStyle.transition,
              willChange: 'transform, opacity'
            }}
          >
            {/* Top Preview: Edge-to-edge fill with slight overscan so poster never peeks around rounded corners */}
            <div
              className={`relative aspect-video w-full bg-black overflow-hidden border-0 isolate [transform:translateZ(0)] ${
                isEmergingPopout || isClosingPopout || popoutStyle === 'immersive_fade'
                  ? 'rounded-xl'
                  : 'rounded-t-xl rounded-b-none'
              }`}
            >
              <MediaImage
                src={posterLandscapeUrl}
                fallbackTitle={episodeTitle || show.title}
                hideFallback={!isPopoutPosterPhase && isVideoPlaying}
                onError={() => setImageError(true)}
                className={`w-full h-full object-cover scale-[1.01] border-0 transition-opacity duration-300 ${
                  !isPopoutPosterPhase && isVideoPlaying ? 'opacity-0 invisible' : 'opacity-100 visible'
                }`}
              />

              {/* Video preview (skipped when disableVideoPreview is enabled) */}
              {!disableVideoPreview && shouldLoadVideo && popoutVideoSrc && (
                <video
                  ref={popoutVideoRef}
                  src={popoutVideoSrc}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onLoadedMetadata={() => {
                    applyResumeSeekIfAvailable(popoutVideoRef.current);
                  }}
                  onCanPlay={() => {
                    const v = popoutVideoRef.current;
                    if (v) {
                      applyResumeSeekIfAvailable(v);
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
                      applyResumeSeekIfAvailable(v);
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
                  onPlaying={() => {
                    notifyPreviewStarted(previewCardKey);
                    setIsVideoPlaying(true);
                  }}
                  onTimeUpdate={() => {
                    const v = popoutVideoRef.current;
                    if (v && !v.paused && v.currentTime > 0.25) {
                      recordCardPreviewTime(previewCardKey, v.currentTime);
                    }
                  }}
                  onEnded={() => {
                    clearCardPreviewTime(previewCardKey);
                    setIsVideoPlaying(false);
                    setShouldLoadVideo(false);
                    setIsPopoutPosterPhase(true);
                  }}
                  onError={() => setIsVideoPlaying(false)}
                  className={`absolute inset-0 w-full h-full max-w-none max-h-none object-cover object-center scale-[1.03] border-0 z-10 transition-opacity duration-300 ${
                    !isPopoutPosterPhase && isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />
              )}

              {/* Classic Style Top-10 Badge & Classic Video Overlays */}
              {popoutStyle === 'classic' && (
                <>
                  {!isPreviewActivelyPlaying && showTop10Badge && (
                    <div className="absolute top-0 left-0 z-10 pointer-events-none">
                      <div className="bg-[#e50914] text-white w-7.5 pt-1.5 pb-1 rounded-br-[4px] shadow-md flex flex-col items-center justify-center leading-none select-none">
                        <span className="text-[9px] font-black uppercase tracking-tight font-sans">TOP</span>
                        <span className="text-[15px] font-black leading-none font-sans mt-0.5">10</span>
                      </div>
                    </div>
                  )}

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

                  {isPreviewActivelyPlaying && (
                    <div
                      style={{ width: `${Math.round(popoutWidth * 0.4)}px` }}
                      className={`absolute bottom-2.5 left-3 z-20 pointer-events-none transition-opacity duration-300 aspect-[2.5/1] overflow-hidden flex items-end ${
                        arePreviewOverlaysHidden ? 'opacity-0' : 'opacity-100'
                      }`}
                    >
                      {show.titleLogoUrl ? (
                        <img
                          src={show.titleLogoUrl}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left select-none"
                        />
                      ) : (
                        <ShowTitleLogo show={show} isSmall={true} fillContainer={true} align="left" />
                      )}
                    </div>
                  )}

                  {isPreviewActivelyPlaying && (
                    <button
                      onClick={toggleSound}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`absolute bottom-2.5 right-2.5 before:content-[''] before:absolute before:-inset-3 w-7.5 h-7.5 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-all duration-300 cursor-pointer z-20 border-0 ${
                        arePreviewOverlaysHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                      }`}
                      aria-label="Toggle sound"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </>
              )}

              {/* Style 1: Modern Style ('overlay_red') — borderless, no top-left badge, mute ONLY when preview plays */}
              {popoutStyle === 'overlay_red' && !isClosingPopout && (
                <>
                  {/* Top-Right Source Watermark + Mute Toggle ONLY while preview video is actively playing */}
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
                    {show.sourceWatermarkUrl && (
                      <img
                        src={show.sourceWatermarkUrl}
                        alt="Source"
                        referrerPolicy="no-referrer"
                        className="max-h-7 w-auto object-contain drop-shadow pointer-events-none"
                      />
                    )}
                    {isPreviewActivelyPlaying && (
                      <button
                        onClick={toggleSound}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="relative before:content-[''] before:absolute before:-inset-3 w-7.5 h-7.5 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer border-0 transition-colors"
                        aria-label="Toggle sound"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Smooth bottom dark merge into #0b0b0d card body */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-24 pointer-events-none z-10"
                    style={{
                      background: 'linear-gradient(to top, #0b0b0d 0%, rgba(11,11,13,0.75) 45%, transparent 100%)'
                    }}
                  />
                </>
              )}

              {/* Style 2: Immersive Fade ('immersive_fade') — Pure 16:9 container ONLY, 3 dot-separated info items (or S/E + time left for Keep Watching), sharp Play, hover button scale */}
              {popoutStyle === 'immersive_fade' && !isClosingPopout && (() => {
                const isImmersiveStarted = disableVideoPreview || !popoutVideoSrc ? true : isPreviewActivelyPlaying;
                const isImmersiveIdle = arePreviewOverlaysHidden && isPreviewActivelyPlaying;
                const hasCommonGlare = isImmersiveStarted && !isImmersiveIdle;
                const hasLogoOnlyGlare = isImmersiveStarted && isImmersiveIdle;
                const showButtonShadow = !hasCommonGlare;

                const isKeepWatchingCard = isContinueWatching && Boolean(watchProgress);
                let keepWatchingTimeLeft = '';
                if (isKeepWatchingCard && watchProgress) {
                  if (watchProgress.duration && watchProgress.duration > (watchProgress.currentTime || 0)) {
                    const remSec = Math.max(0, Math.floor(watchProgress.duration - (watchProgress.currentTime || 0)));
                    const remTotalMins = Math.max(1, Math.round(remSec / 60));
                    const remH = Math.floor(remTotalMins / 60);
                    const remM = remTotalMins % 60;
                    keepWatchingTimeLeft = remH > 0 ? (remM > 0 ? `${remH}h ${remM}m left` : `${remH}h left`) : `${remM}m left`;
                  } else {
                    keepWatchingTimeLeft = '24m left';
                  }
                }
                const isSeriesShow = show.type === 'series' || Boolean(show.seasons && show.seasons.length > 0);

                return (
                  <>
                    {/* Taller Smooth Common Bottom Glare: seamlessly feathers upward without any heavy divider line; slides down on 5s idle */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none z-10 transition-all duration-500 ease-out"
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.56) 0%, rgba(0,0,0,0.36) 26%, rgba(0,0,0,0.16) 52%, rgba(0,0,0,0.04) 78%, transparent 100%)',
                        opacity: hasCommonGlare ? 1 : 0,
                        transform: isImmersiveIdle ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)'
                      }}
                    />

                    {/* Individual PNG Logo Glare during 5s inactivity: matches split (classic) popout model glare */}
                    <div
                      className="absolute inset-0 pointer-events-none z-10 transition-opacity duration-500 ease-out"
                      style={{
                        background:
                          'radial-gradient(ellipse 65% 55% at 0% 100%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 35%, rgba(0,0,0,0.02) 65%, transparent 80%)',
                        opacity: hasLogoOnlyGlare ? 1 : 0
                      }}
                    />

                    {/* Top-Right Low-Opacity Mute Button (hides after 5s inactivity during playback) */}
                    {isPreviewActivelyPlaying && (
                      <button
                        onClick={toggleSound}
                        onPointerDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className={`absolute top-3 right-3 z-20 before:content-[''] before:absolute before:-inset-3 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center cursor-pointer border-0 transition-all duration-300 ${
                          isImmersiveIdle ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
                        }`}
                        aria-label="Toggle sound"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Bottom overlay: Left Logo + Keep Watching S/E & time left OR 3 compact dot-separated items; logo stays visible when idle while info/buttons slide down */}
                    <div className="absolute inset-x-0 bottom-2.5 px-3.5 z-20 flex items-end justify-between gap-2">
                      <div className="flex flex-col items-start min-w-0 pointer-events-none">
                        <div
                          className="relative aspect-[2.5/1] overflow-hidden shrink-0 flex items-end transition-all duration-400 ease-out"
                          style={{
                            width: `${Math.round(popoutWidth * 0.4)}px`,
                            opacity: isImmersiveStarted ? 1 : 0,
                            transform: isImmersiveIdle ? 'translate3d(0, 16px, 0)' : 'translate3d(0, 0, 0)'
                          }}
                        >
                          {show.titleLogoUrl ? (
                            <img
                              src={show.titleLogoUrl}
                              alt={show.title}
                              referrerPolicy="no-referrer"
                              className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left select-none"
                            />
                          ) : (
                            <ShowTitleLogo show={show} isSmall={true} fillContainer={true} align="left" />
                          )}
                        </div>

                        {isKeepWatchingCard ? (
                          <div
                            className="flex items-center gap-2 text-[11.5px] text-white/95 font-medium mt-1 transition-all duration-300 ease-out"
                            style={{
                              opacity: hasCommonGlare ? 1 : 0,
                              transform: isImmersiveIdle ? 'translate3d(0, 18px, 0)' : 'translate3d(0, 0, 0)'
                            }}
                          >
                            {isSeriesShow && (
                              <span className="font-bold text-white">
                                S{watchProgress?.seasonNumber || 1} E{watchProgress?.episodeNumber || 1}
                              </span>
                            )}
                            <span className="text-white/90">{keepWatchingTimeLeft}</span>
                          </div>
                        ) : (
                          /* Strictly 3 items (1. Genre • 2. Year • 3. Season/Episode) separated by smaller divider dots */
                          <div
                            className="flex items-center gap-1.5 text-[11.5px] text-white/95 font-medium mt-1 transition-all duration-300 ease-out"
                            style={{
                              opacity: hasCommonGlare ? 1 : 0,
                              transform: isImmersiveIdle ? 'translate3d(0, 18px, 0)' : 'translate3d(0, 0, 0)'
                            }}
                          >
                            <span>{show.genres?.[0] || 'Drama'}</span>
                            <span className="inline-block w-1 h-1 rounded-full bg-white/55 shrink-0" />
                            <span>{(show.releaseYear || '').split('-')[0] || '2025'}</span>
                            {(durationChip || show.durationOrSeasons) && (
                              <>
                                <span className="inline-block w-1 h-1 rounded-full bg-white/55 shrink-0" />
                                <span>{durationChip || show.durationOrSeasons}</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Transparent icon-only Play (sharp edges), Add to List, Like buttons in bottom-right:
                          slight shadow when poster shows (hover start or preview ended), NO shadow when common glare is shown */}
                      <div
                        className={`flex items-center gap-1.5 shrink-0 transition-all duration-500 ease-out ${
                          isImmersiveIdle ? 'pointer-events-none' : 'pointer-events-auto'
                        } ${showButtonShadow ? 'drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]' : ''}`}
                        style={{
                          opacity: isImmersiveIdle ? 0 : 1,
                          transform: isImmersiveIdle ? 'translate3d(0, 18px, 0)' : 'translate3d(0, 0, 0)'
                        }}
                      >
                        <button
                          onClick={handlePlayClick}
                          className="p-1.5 bg-transparent border-0 text-white hover:scale-125 active:scale-95 transition-transform duration-150 ease-out cursor-pointer"
                          aria-label={`Play ${show.title}`}
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current shrink-0" aria-hidden="true">
                            <polygon points="5,3 20,12 5,21" />
                          </svg>
                        </button>
                        <button
                          onClick={handleWatchlistClick}
                          className="p-1.5 bg-transparent border-0 text-white hover:scale-125 active:scale-95 transition-transform duration-150 ease-out cursor-pointer"
                          aria-label="Watchlist"
                        >
                          {isInWatchlist ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={handleLikeClick}
                          className="p-1.5 bg-transparent border-0 text-white hover:scale-125 active:scale-95 transition-transform duration-150 ease-out cursor-pointer"
                          aria-label="Like"
                        >
                          <ThumbsUp className={`w-4.5 h-4.5 ${isLiked ? 'fill-white' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Progress bar between poster and below section on hover (skipped in immersive_fade pure 16:9 card) */}
            {popoutStyle !== 'immersive_fade' && isContinueWatching && watchProgress && watchProgress.progressPercent > 0 && (
              <div
                className="w-full h-1 bg-zinc-600/70 overflow-hidden z-30 transition-opacity duration-100"
                style={{ opacity: isClosingPopout ? 0 : 1 }}
              >
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, watchProgress.progressPercent))}%` }}
                />
              </div>
            )}

            {/* Lower Card Body for Modern Style ('overlay_red'): PNG Logo & circular buttons sit right on the seam */}
            {popoutStyle === 'overlay_red' && (
              <div
                className="px-4 pb-4 pt-0 bg-[#0b0b0d] space-y-2 border-0 transition-opacity duration-100"
                style={{ opacity: isClosingPopout ? 0 : 1 }}
              >
                {/* Seam Row: Left PNG Logo + Right Circular Play, Like, Add to List */}
                <div className="-mt-7 relative z-30 flex items-center justify-between gap-2 pb-1">
                  <div
                    style={{ width: `${Math.round(popoutWidth * 0.4)}px` }}
                    className="relative aspect-[2.5/1] overflow-hidden shrink-0 flex items-end"
                  >
                    {show.titleLogoUrl ? (
                      <img
                        src={show.titleLogoUrl}
                        alt={show.title}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
                      />
                    ) : (
                      <ShowTitleLogo show={show} isSmall={true} fillContainer={true} align="left" />
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handlePlayClick}
                      tabIndex={0}
                      className="w-8.5 h-8.5 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition-colors shadow-md cursor-pointer border-0"
                      aria-label={`Play ${show.title}`}
                    >
                      <svg className="w-4 h-4 ml-0.5 fill-current" viewBox="0 0 24 24">
                        <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                      </svg>
                    </button>

                    <button
                      onClick={handleLikeClick}
                      className="w-8.5 h-8.5 rounded-full border border-white/40 bg-black/55 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Like"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
                    </button>

                    <button
                      onClick={handleWatchlistClick}
                      className="w-8.5 h-8.5 rounded-full border border-white/40 bg-black/55 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Watchlist"
                    >
                      {isInWatchlist ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Metadata Line: Film | 13+ | 2h 27m | HD */}
                <div className="flex items-center gap-2 text-[12px] text-zinc-200 font-medium">
                  <span>{show.type === 'series' ? 'Series' : 'Film'}</span>
                  <span className="text-zinc-600">|</span>
                  <span className="px-1.5 py-0.5 rounded border border-zinc-600 text-[10.5px] font-bold leading-none text-zinc-100">
                    {show.maturityRating || '13+'}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span>{durationChip || show.durationOrSeasons}</span>
                  <span className="px-1.5 py-0.5 rounded border border-zinc-600 text-[10px] font-bold leading-none text-zinc-200">
                    HD
                  </span>
                </div>

                {/* Short 2-line Description */}
                {(show.shortDescription || show.synopsis) && (
                  <p className="text-[12px] text-zinc-400 leading-snug line-clamp-2">
                    {show.shortDescription || show.synopsis}
                  </p>
                )}
              </div>
            )}

            {popoutStyle === 'classic' && (
              <div
                className="p-3.5 bg-[#181818] space-y-2.5 border-0 transition-opacity duration-100"
                style={{ opacity: isClosingPopout ? 0 : 1 }}
              >
                {/* Action Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {watchProgress && watchProgress.progressPercent > 0 ? (
                      <button
                        onClick={handlePlayClick}
                        tabIndex={0}
                        className="h-8.5 px-3.5 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center gap-1.5 transition-colors shadow cursor-pointer border-0 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                        aria-label={`Resume ${show.title}`}
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                        </svg>
                        <span className="text-xs font-bold">
                          {show.type === 'series' || (show.seasons && show.seasons.length > 0)
                            ? `Resume S${watchProgress.seasonNumber || 1} E${watchProgress.episodeNumber || 1}`
                            : 'Resume'}
                        </span>
                      </button>
                    ) : (
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
                    )}

                    <button
                      onClick={handleWatchlistClick}
                      tabIndex={0}
                      className="w-8.5 h-8.5 rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/40 bg-zinc-800/80 hover:bg-zinc-700 hover:border-white text-white focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                      data-tooltip={isInWatchlist ? 'Remove from list' : 'Add to list'}
                      aria-label="Watchlist"
                    >
                      {isInWatchlist ? <Check className="w-4 h-4 text-white stroke-[2.5]" /> : <Plus className="w-4 h-4 text-white" />}
                    </button>

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

                {/* Standard Metadata Line */}
                <div className="flex items-center gap-2.5 text-[14px] sm:text-[14.5px] font-semibold">
                  <span className="text-[#46d369] font-bold">{show.imdbRating ? `${show.imdbRating}` : `${show.matchScore}% Match`}</span>
                  <span className="text-zinc-200 px-1.5 py-0.5 rounded border border-zinc-700 text-[12px] leading-none">
                    {show.maturityRating || '16+'}
                  </span>
                  <span className="text-zinc-200 font-bold">{durationChip || show.durationOrSeasons}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-bold leading-none">HD</span>
                </div>

                {/* Short Genres */}
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
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
