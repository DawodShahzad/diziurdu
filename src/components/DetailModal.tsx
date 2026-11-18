import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { Show, Episode, AdminSettings, CastMember, TrailerItem, DetailsOriginMeta } from '../types';
import { ShowTitleLogo } from './ShowTitleLogo';
import { ShareModal } from './ShareModal';
import { ShareArrowIcon } from './ShareArrowIcon';
import { MobileReactionButton } from './MobileReactionButton';
import { normalizeActorKey } from '../utils/actorIndex';
import { attachHlsVideo } from '../utils/hlsHelper';
import { MediaImage } from './MediaImage';
import {
  X,
  Plus,
  Check,
  ThumbsUp,
  Volume2,
  VolumeX,
  ChevronDown,
  Tv,
  Film,
  Sparkles,
  ExternalLink,
  Clock,
  Calendar,
  Subtitles,
  Filter,
  Bookmark,
  ChevronLeft,
  RotateCcw,
  Download,
  Info
} from 'lucide-react';

import { WatchProgressItem, formatProgressTime } from '../utils/watchProgress';
import { parseTimeToSeconds } from './EmbedPlayerModal';

interface DetailModalProps {
  show: Show | null;
  allShows?: Show[];
  adminSettings: AdminSettings;
  isInWatchlist: boolean;
  watchlist?: string[];
  watchProgress?: WatchProgressItem;
  onToggleWatchlist: (showId: string) => void;
  onClose: (skipHistoryPush?: boolean) => void;
  onSelectShow?: (show: Show) => void;
  onSelectActor?: (actor: CastMember) => void;
  onSelectGenre?: (genre: string) => void;
  onUpdateShowBlog?: (showId: string, updatedBlog: Show['blog']) => void;
  onWatchInFullPlayer?: (show: Show, episode?: Episode | null, trailer?: TrailerItem | null, initialSeekTime?: number) => void;
  onPlayShow?: (show: Show) => void;
  initialVideoMode?: 'trailer' | 'episode';
  initialEpisodeId?: string | null;
  initialTrailerId?: string | null;
  initialSubView?: 'main' | 'cast' | 'blog';
  onSubViewChange?: (view: 'main' | 'cast' | 'blog', meta?: { episode?: Episode | null; trailer?: TrailerItem | null }) => void;
  top10ShowIds?: string[];
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: () => void;
  isFullPlayerOpen?: boolean;
  onMobileSeasonSheetChange?: (isOpen: boolean) => void;
  onMobileInfoSheetChange?: (isOpen: boolean) => void;
  likedShowIds?: string[];
  onToggleLike?: (showId: string) => void;
  originMeta?: DetailsOriginMeta | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  show,
  allShows = [],
  adminSettings,
  isInWatchlist,
  watchlist = [],
  watchProgress,
  onToggleWatchlist,
  onClose,
  onSelectShow,
  onSelectActor,
  onSelectGenre,
  onUpdateShowBlog,
  onWatchInFullPlayer,
  onPlayShow,
  initialVideoMode = 'trailer',
  initialEpisodeId = null,
  initialTrailerId = null,
  initialSubView = 'main',
  onSubViewChange,
  top10ShowIds = [],
  isGlobalMuted = false,
  onToggleGlobalMute,
  isFullPlayerOpen = false,
  onMobileSeasonSheetChange,
  onMobileInfoSheetChange,
  likedShowIds,
  onToggleLike,
  originMeta
}) => {
  if (!show) return null;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Local watchlist state synced with watchlist prop for instantaneous responsive UI feedback
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(watchlist || []);
  const [watchlistToast, setWatchlistToast] = useState<{ id: string; message: string } | null>(null);

  useEffect(() => {
    setLocalWatchlist(watchlist || []);
  }, [watchlist]);

  // Find initial episode if provided in deep link
  const initialFoundEpisode = useMemo(() => {
    if (initialEpisodeId && show.seasons) {
      for (const sea of show.seasons) {
        const found = sea.episodes.find((e) => e.id === initialEpisodeId);
        if (found) return found;
      }
    }
    return show.seasons && show.seasons[0]?.episodes[0] ? show.seasons[0].episodes[0] : null;
  }, [show, initialEpisodeId]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    initialFoundEpisode?.seasonNumber || 1
  );
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(initialFoundEpisode);
  const [activePlaybackSource, setActivePlaybackSource] = useState<'trailer' | 'episode' | 'clip'>(
    initialVideoMode === 'episode' && initialFoundEpisode ? 'episode' : 'trailer'
  );

  // Mobile layout detection: on mobile, desktop preview video is never loaded or played in background
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Find initial trailer if provided in deep link
  const initialFoundTrailer = useMemo(() => {
    if (initialTrailerId && show.trailersAndMore) {
      return show.trailersAndMore.find((t) => t.id === initialTrailerId) || null;
    }
    return null;
  }, [show, initialTrailerId]);

  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(
    initialFoundTrailer ? initialFoundTrailer.videoUrl : null
  );

  // Audio & Like states
  const [localMuted, setLocalMuted] = useState<boolean>(false);
  const isMuted = onToggleGlobalMute ? isGlobalMuted : localMuted;
  const [localLiked, setLocalLiked] = useState<boolean>(false);
  const isLiked = likedShowIds ? likedShowIds.includes(show.id) : localLiked;
  const handleLikeAction = () => {
    if (onToggleLike) {
      onToggleLike(show.id);
    } else {
      setLocalLiked((prev) => !prev);
    }
  };
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const [isTitleShrunk, setIsTitleShrunk] = useState<boolean>(false);
  const desktopBackdrop = show.moreInfoBackdropUrl || show.backdropUrl || show.posterLandscapeUrl || '';
  const mobileBackdrop = show.mobileMoreInfoBackdropUrl || show.moreInfoBackdropUrl || show.backdropUrl || show.posterLandscapeUrl || '';
  const [modalBackdropSrc, setModalBackdropSrc] = useState<string>(
    isMobileLayout ? mobileBackdrop : desktopBackdrop
  );

  useEffect(() => {
    setModalBackdropSrc(isMobileLayout ? mobileBackdrop : desktopBackdrop);
  }, [isMobileLayout, mobileBackdrop, desktopBackdrop]);

  const [shouldLoadPreview, setShouldLoadPreview] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isPreviewEnded, setIsPreviewEnded] = useState<boolean>(false);
  const [isPausedByScroll, setIsPausedByScroll] = useState<boolean>(false);
  const isPausedByScrollRef = useRef<boolean>(false);
  const isPreviewEndedRef = useRef<boolean>(false);

  // More Like This expanded state (matches Netflix circular dropdown button in screenshot)
  const [isMoreLikeThisExpanded, setIsMoreLikeThisExpanded] = useState<boolean>(false);
  // Cast view expanded state for multiple appearances actors
  const [isCastExpanded, setIsCastExpanded] = useState<boolean>(false);
  // Synopsis clamped/expanded state
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState<boolean>(false);

  // Secondary sub-views (Cast Pool & Blog) initialized from deep link if tab is specified
  const [isCastViewOpen, setIsCastViewOpen] = useState<boolean>(initialSubView === 'cast');
  const [isBlogViewOpen, setIsBlogViewOpen] = useState<boolean>(initialSubView === 'blog');
  const [selectedActorForBio, setSelectedActorForBio] = useState<CastMember | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const blogContainerRef = useRef<HTMLDivElement>(null);
  const castContainerRef = useRef<HTMLDivElement>(null);
  const heroLogoRef = useRef<HTMLDivElement>(null);
  const playButtonRef = useRef<HTMLButtonElement>(null);

  // Seasons info
  const seasons = show.seasons || [];
  const currentSeason =
    seasons.find((s) => s.seasonNumber === selectedSeasonNumber) || seasons[0] || {
      seasonNumber: 1,
      title: 'Season 1',
      episodes: []
    };

  const shrinkTimerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const hasTriggeredShrinkRef = useRef<boolean>(false);

  // Mobile layout state & controls
  const hasEpisodes =
    show.type === 'series' &&
    show.hasEpisodicContent !== false &&
    seasons.length > 0 &&
    seasons[0].episodes.length > 0;

  const hasWhereToWatch = Boolean(
    adminSettings.enableWhereToWatch &&
      show.whereToWatchEnabled !== false &&
      show.whereToWatch &&
      show.whereToWatch.length > 0
  );

  const [mobileActiveTab, setMobileActiveTab] = useState<'episodes' | 'trailers' | 'moreLikeThis'>(
    hasEpisodes ? 'episodes' : 'trailers'
  );
  const [isMobileInfoPageOpen, setIsMobileInfoPageOpen] = useState<boolean>(false);
  const [isMobileSeasonDropdownOpen, setIsMobileSeasonDropdownOpen] = useState<boolean>(false);
  const [seasonSheetDragY, setSeasonSheetDragY] = useState<number>(0);
  const [isSeasonSheetDragging, setIsSeasonSheetDragging] = useState<boolean>(false);
  const seasonTouchStartYRef = useRef<number>(0);

  const handleSeasonTouchStart = (e: React.TouchEvent) => {
    seasonTouchStartYRef.current = e.touches[0].clientY;
    setIsSeasonSheetDragging(true);
  };
  const handleSeasonTouchMove = (e: React.TouchEvent) => {
    if (!isSeasonSheetDragging) return;
    const delta = e.touches[0].clientY - seasonTouchStartYRef.current;
    if (delta > 0) {
      setSeasonSheetDragY(delta);
    } else {
      setSeasonSheetDragY(0);
    }
  };
  const handleSeasonTouchEnd = () => {
    setIsSeasonSheetDragging(false);
    if (seasonSheetDragY > 60) {
      setIsMobileSeasonDropdownOpen(false);
    }
    setSeasonSheetDragY(0);
  };

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  useEffect(() => {
    onMobileSeasonSheetChange?.(isMobileSeasonDropdownOpen);
    return () => {
      onMobileSeasonSheetChange?.(false);
    };
  }, [isMobileSeasonDropdownOpen, onMobileSeasonSheetChange]);

  useEffect(() => {
    onMobileInfoSheetChange?.(isMobileInfoPageOpen);
    return () => {
      onMobileInfoSheetChange?.(false);
    };
  }, [isMobileInfoPageOpen, onMobileInfoSheetChange]);

  // Mobile trailer player state: does NOT autoplay; bottom-right small Play/Pause/Reload button controls playback
  const [hasStartedTrailer, setHasStartedTrailer] = useState<boolean>(false);
  const [isMobileTrailerPlaying, setIsMobileTrailerPlaying] = useState<boolean>(false);
  const [isMobileTrailerLoading, setIsMobileTrailerLoading] = useState<boolean>(false);
  const [isMobileTrailerEnded, setIsMobileTrailerEnded] = useState<boolean>(false);
  const [isMobileTrailerControlsVisible, setIsMobileTrailerControlsVisible] = useState<boolean>(true);
  const [mobileTrailerCurrentTime, setMobileTrailerCurrentTime] = useState<number>(0);
  const [mobileTrailerDuration, setMobileTrailerDuration] = useState<number>(0);
  const [isMobileTrailerMuted, setIsMobileTrailerMuted] = useState<boolean>(isMuted);
  const [showPosterAfterPause, setShowPosterAfterPause] = useState<boolean>(false);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const mobileSavedTimeRef = useRef<number>(0);

  const mobileControlsTimerRef = useRef<number | null>(null);
  const mobilePausePosterTimerRef = useRef<number | null>(null);

  const clearMobileControlsTimer = () => {
    if (mobileControlsTimerRef.current) {
      window.clearTimeout(mobileControlsTimerRef.current);
      mobileControlsTimerRef.current = null;
    }
  };

  const clearMobilePausePosterTimer = () => {
    if (mobilePausePosterTimerRef.current) {
      window.clearTimeout(mobilePausePosterTimerRef.current);
      mobilePausePosterTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearMobileControlsTimer();
      clearMobilePausePosterTimer();
    };
  }, []);

  // Mobile Swipe/Drag-to-Dismiss & Collapse-to-Card Animation Handler
  const [mobileDragY, setMobileDragY] = useState<number>(0);
  const [isMobileDragging, setIsMobileDragging] = useState<boolean>(false);
  const [mobileCollapseTransform, setMobileCollapseTransform] = useState<{
    dx: number;
    dy: number;
    scale: number;
    opacity: number;
    animType?: 'slide_down' | 'slide_right' | 'fade_fast';
  } | null>(null);
  const [flyingPosterState, setFlyingPosterState] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
    opacity: number;
    borderRadius: string;
    cardPosterUrl: string;
    bannerPosterUrl: string;
    showBannerLayer: boolean;
    transitionMs: number;
  } | null>(null);
  const [isMobileOpeningHidingContent, setIsMobileOpeningHidingContent] = useState<boolean>(false);
  const [mobileLowerContentStyle, setMobileLowerContentStyle] = useState<{
    opacity: number;
    transform: string;
    transition: string;
  } | null>(null);
  const [desktopModalTransform, setDesktopModalTransform] = useState<{
    transform: string;
    opacity: number;
    transition: string;
    borderRadius?: string;
  } | null>(null);
  const [isClosingDesktop, setIsClosingDesktop] = useState<boolean>(false);
  const desktopCardRef = useRef<HTMLDivElement>(null);
  const mobileTouchStartPosRef = useRef<{ x: number; y: number; locked: 'x' | 'y' | null } | null>(null);
  const mobileTouchSamplesRef = useRef<Array<{ y: number; t: number }>>([]);
  const mobileModalContainerRef = useRef<HTMLDivElement>(null);
  const mobileHeroBannerRef = useRef<HTMLDivElement>(null);
  const isClosingMobileRef = useRef<boolean>(false);
  const mobileDragYRef = useRef<number>(0);
  const isNormalFeedOrigin = originMeta?.sourceFeedType === 'normal' && Boolean(originMeta.element?.isConnected);

  // Mobile Opening Animation:
  // Normal feed: card leaves exact slot -> glides to top 16:9 hero banner while crossfading midway -> lower content enters seamlessly.
  // Non-normal feed: clean slide/rise over transparent background.
  useLayoutEffect(() => {
    isClosingMobileRef.current = false;
    setMobileCollapseTransform(null);
    setFlyingPosterState(null);
    setMobileDragY(0);
    mobileDragYRef.current = 0;

    if (!isMobileLayout) {
      setIsMobileOpeningHidingContent(false);
      setMobileLowerContentStyle(null);
      return;
    }

    const vw = typeof window !== 'undefined' ? window.innerWidth : 390;
    const targetH = Math.round(vw * (9 / 16));
    const bannerSrc = mobileBackdrop || desktopBackdrop;
    const cardSrc =
      originMeta?.posterUrl ||
      show.posterVerticalUrl ||
      show.posterUrl ||
      show.posterLandscapeUrl ||
      bannerSrc;

    if (isNormalFeedOrigin && originMeta?.element) {
      const originRect = originMeta.element.getBoundingClientRect();
      if (originRect.width > 12 && originRect.height > 12) {
        setIsMobileOpeningHidingContent(true);
        setMobileLowerContentStyle({
          opacity: 0,
          transform: 'translate3d(0, 32px, 0)',
          transition: 'none'
        });
        setFlyingPosterState({
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          opacity: 1,
          borderRadius: '7px',
          cardPosterUrl: cardSrc,
          bannerPosterUrl: bannerSrc,
          showBannerLayer: false,
          transitionMs: 320
        });

        let innerRaf = 0;
        let midTimer: number | null = null;
        let doneTimer: number | null = null;

        const outerRaf = requestAnimationFrame(() => {
          innerRaf = requestAnimationFrame(() => {
            setFlyingPosterState((prev) =>
              prev
                ? {
                    ...prev,
                    left: 0,
                    top: 0,
                    width: vw,
                    height: targetH,
                    borderRadius: '0px',
                    showBannerLayer: true,
                    transitionMs: 320
                  }
                : null
            );
            setMobileLowerContentStyle({
              opacity: 1,
              transform: 'translate3d(0, 0, 0)',
              transition: 'opacity 180ms ease-out 160ms, transform 240ms cubic-bezier(0.22, 1, 0.36, 1) 140ms'
            });
          });
        });

        midTimer = window.setTimeout(() => {
          setIsMobileOpeningHidingContent(false);
        }, 315);

        doneTimer = window.setTimeout(() => {
          setFlyingPosterState(null);
          setMobileLowerContentStyle(null);
        }, 355);

        return () => {
          cancelAnimationFrame(outerRaf);
          cancelAnimationFrame(innerRaf);
          if (midTimer) window.clearTimeout(midTimer);
          if (doneTimer) window.clearTimeout(doneTimer);
        };
      }
    }

    // Non-normal feed on mobile: clean subtle rise-up over transparent background
    setIsMobileOpeningHidingContent(false);
    setMobileLowerContentStyle({
      opacity: 0,
      transform: 'translate3d(0, 26px, 0)',
      transition: 'none'
    });
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        setMobileLowerContentStyle({
          opacity: 1,
          transform: 'translate3d(0, 0, 0)',
          transition: 'opacity 200ms ease-out, transform 240ms cubic-bezier(0.22, 1, 0.36, 1)'
        });
      });
    });
    const clearTimer = window.setTimeout(() => {
      setMobileLowerContentStyle(null);
    }, 260);
    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      window.clearTimeout(clearTimer);
    };
  }, [show.id, isMobileLayout, isNormalFeedOrigin]);

  // Desktop: Shared-element flying poster from clicked card for normal feeds (matching mobile normal card animation); subtle slide/fade for other feeds
  useLayoutEffect(() => {
    if (isMobileLayout) return;
    setIsClosingDesktop(false);
    const cardEl = desktopCardRef.current;
    const bannerEl = heroBannerRef.current;
    if (!cardEl) return;

    if (isNormalFeedOrigin && originMeta?.element && bannerEl) {
      const originRect = originMeta.element.getBoundingClientRect();
      const targetBannerRect = bannerEl.getBoundingClientRect();
      const bannerSrc = desktopBackdrop || mobileBackdrop;

      if (
        originRect.width > 12 &&
        originRect.height > 12 &&
        targetBannerRect.width > 12 &&
        targetBannerRect.height > 12
      ) {
        setDesktopModalTransform({
          transform: 'translate3d(0, 14px, 0) scale(0.985)',
          opacity: 0,
          transition: 'none'
        });
        setFlyingPosterState({
          left: originRect.left,
          top: originRect.top,
          width: originRect.width,
          height: originRect.height,
          opacity: 0.92,
          borderRadius: '10px',
          cardPosterUrl: bannerSrc,
          bannerPosterUrl: bannerSrc,
          showBannerLayer: true,
          transitionMs: 280
        });

        let innerRaf = 0;
        let settleFadeTimer: number | null = null;
        let doneTimer: number | null = null;
        const outerRaf = requestAnimationFrame(() => {
          innerRaf = requestAnimationFrame(() => {
            setFlyingPosterState((prev) =>
              prev
                ? {
                    ...prev,
                    left: targetBannerRect.left,
                    top: targetBannerRect.top,
                    width: targetBannerRect.width,
                    height: targetBannerRect.height,
                    opacity: 1,
                    borderRadius: '16px 16px 0px 0px',
                    showBannerLayer: true,
                    transitionMs: 280
                  }
                : null
            );
            setDesktopModalTransform({
              transform: 'translate3d(0, 0, 0) scale(1)',
              opacity: 1,
              transition: 'opacity 220ms ease-out 60ms, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)'
            });
          });
        });

        settleFadeTimer = window.setTimeout(() => {
          setFlyingPosterState((prev) =>
            prev ? { ...prev, opacity: 0, transitionMs: 110 } : null
          );
        }, 285);

        doneTimer = window.setTimeout(() => {
          setFlyingPosterState(null);
        }, 405);

        return () => {
          cancelAnimationFrame(outerRaf);
          cancelAnimationFrame(innerRaf);
          if (settleFadeTimer) window.clearTimeout(settleFadeTimer);
          if (doneTimer) window.clearTimeout(doneTimer);
        };
      }
    }

    setDesktopModalTransform({
      transform: 'translate3d(0, 28px, 0) scale(0.98)',
      opacity: 0,
      transition: 'none'
    });
    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => {
        setDesktopModalTransform({
          transform: 'translate3d(0, 0, 0) scale(1)',
          opacity: 1,
          transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out'
        });
      });
    });
    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
    };
  }, [show.id, isMobileLayout, isNormalFeedOrigin]);

  const triggerMobileClose = (
    mode: 'back_button' | 'swipe_off_bottom' | 'fast_swipe' | 'slow_swipe',
    skipHistoryPush = false,
    vy = 0
  ) => {
    if (isClosingMobileRef.current) return;
    isClosingMobileRef.current = true;
    setIsMobileDragging(false);

    if (mobileVideoRef.current && !mobileVideoRef.current.paused) {
      mobileVideoRef.current.pause();
    }

    if (!isMobileLayout) {
      isClosingMobileRef.current = false;
      triggerDesktopClose(skipHistoryPush);
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const clickedEl = originMeta?.element;
    const isClickedValid = Boolean(originMeta?.sourceFeedType === 'normal' && clickedEl && clickedEl.isConnected);

    // Non-normal feed OR dragged >= 75% down screen: slide out cleanly over transparent background
    if (!isClickedValid || !clickedEl || mode === 'swipe_off_bottom') {
      if (mode === 'back_button' && !isClickedValid) {
        // Non-normal feed Back button or System Back -> swipe/slide right
        setMobileCollapseTransform({
          dx: vw,
          dy: mobileDragYRef.current,
          scale: 1,
          opacity: 0.96,
          animType: 'slide_right'
        });
        window.setTimeout(() => onClose(skipHistoryPush), 245);
      } else {
        // Swipe down or non-normal swipe -> continue straight down off bottom
        setMobileCollapseTransform({
          dx: 0,
          dy: vh,
          scale: 1,
          opacity: 1,
          animType: 'slide_down'
        });
        window.setTimeout(() => onClose(skipHistoryPush), 235);
      }
      return;
    }

    // Normal feed: direct hero-to-card morph back to exact origin card (NO center stop!)
    const targetRect = clickedEl.getBoundingClientRect();
    const heroRect = mobileHeroBannerRef.current?.getBoundingClientRect();
    const startLeft = heroRect ? heroRect.left : 0;
    const startTop = heroRect ? heroRect.top : mobileDragYRef.current;
    const startW = heroRect && heroRect.width > 20 ? heroRect.width : vw;
    const startH = heroRect && heroRect.height > 20 ? heroRect.height : Math.round(vw * (9 / 16));
    const bannerSrc = mobileBackdrop || desktopBackdrop;
    const posterUrl =
      originMeta?.posterUrl ||
      show.posterVerticalUrl ||
      show.posterUrl ||
      show.posterLandscapeUrl ||
      bannerSrc;

    setMobileCollapseTransform({
      dx: 0,
      dy: startTop,
      scale: 1,
      opacity: 0,
      animType: 'fade_fast'
    });

    const isFastSwipe = mode === 'fast_swipe' && vy > 0.65;
    const inertialDip = isFastSwipe ? Math.min(72, Math.max(24, Math.round(vy * 36))) : 0;

    setFlyingPosterState({
      left: startLeft,
      top: startTop,
      width: startW,
      height: startH,
      opacity: 1,
      borderRadius: mobileDragYRef.current > 8 ? '12px' : '0px',
      cardPosterUrl: posterUrl,
      bannerPosterUrl: bannerSrc,
      showBannerLayer: true,
      transitionMs: isFastSwipe ? 85 : 270
    });

    const flyToCard = () => {
      const liveRect = clickedEl.isConnected ? clickedEl.getBoundingClientRect() : targetRect;
      setFlyingPosterState((prev) =>
        prev
          ? {
              ...prev,
              left: liveRect.left,
              top: liveRect.top,
              width: liveRect.width,
              height: liveRect.height,
              opacity: 0.96,
              borderRadius: '7px',
              showBannerLayer: false,
              transitionMs: 265
            }
          : null
      );
      window.setTimeout(() => {
        onClose(skipHistoryPush);
      }, 275);
    };

    if (isFastSwipe) {
      requestAnimationFrame(() => {
        setFlyingPosterState((prev) =>
          prev
            ? {
                ...prev,
                top: startTop + inertialDip,
                borderRadius: '14px',
                transitionMs: 85
              }
            : null
        );
      });
      window.setTimeout(flyToCard, 85);
    } else {
      // Back button, system back, or slow drag -> NO downward dip, fly straight to clicked card
      requestAnimationFrame(() => {
        requestAnimationFrame(flyToCard);
      });
    }
  };

  const triggerDesktopClose = (skipHistoryPush = false) => {
    if (isClosingDesktop) return;
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    if (isMobileLayout) {
      triggerMobileClose('back_button', skipHistoryPush);
      return;
    }
    setIsClosingDesktop(true);
    const clickedEl = originMeta?.element;
    const bannerEl = heroBannerRef.current;
    if (isNormalFeedOrigin && clickedEl && clickedEl.isConnected && bannerEl) {
      const liveOriginRect = clickedEl.getBoundingClientRect();
      const bannerRect = bannerEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (
        liveOriginRect.width > 12 &&
        liveOriginRect.height > 12 &&
        liveOriginRect.bottom > -80 &&
        liveOriginRect.top < vh + 80 &&
        liveOriginRect.right > -40 &&
        liveOriginRect.left < vw + 40 &&
        bannerRect.width > 12 &&
        bannerRect.height > 12
      ) {
        const bannerSrc = desktopBackdrop || mobileBackdrop;
        const posterUrl =
          originMeta?.posterUrl ||
          show.posterLandscapeUrl ||
          show.backdropUrl ||
          bannerSrc;

        setDesktopModalTransform({
          transform: 'translate3d(0, 0, 0) scale(1)',
          opacity: 0,
          transition: 'opacity 130ms ease-out'
        });

        setFlyingPosterState({
          left: bannerRect.left,
          top: bannerRect.top,
          width: bannerRect.width,
          height: bannerRect.height,
          opacity: 1,
          borderRadius: '16px 16px 0px 0px',
          cardPosterUrl: posterUrl,
          bannerPosterUrl: bannerSrc,
          showBannerLayer: true,
          transitionMs: 265
        });

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const targetRect = clickedEl.isConnected ? clickedEl.getBoundingClientRect() : liveOriginRect;
            setFlyingPosterState((prev) =>
              prev
                ? {
                    ...prev,
                    left: targetRect.left,
                    top: targetRect.top,
                    width: targetRect.width,
                    height: targetRect.height,
                    opacity: 0.96,
                    borderRadius: '10px',
                    showBannerLayer: false,
                    transitionMs: 265
                  }
                : null
            );
          });
        });

        window.setTimeout(() => onClose(skipHistoryPush), 275);
        return;
      }
    }

    setDesktopModalTransform({
      transform: 'translate3d(0, 36px, 0) scale(0.97)',
      opacity: 0,
      transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-in'
    });
    window.setTimeout(() => onClose(skipHistoryPush), 205);
  };

  // Keyboard Escape and System Back (popstate) trigger exact animated collapse instead of instant unmount
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        triggerDesktopClose(false);
      }
    };
    const onSystemBack = (e: Event) => {
      e.preventDefault();
      if (isMobileLayout) {
        triggerMobileClose('back_button', true);
      } else {
        triggerDesktopClose(true);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('dizi-detail-system-back', onSystemBack);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('dizi-detail-system-back', onSystemBack);
    };
  });

  const handleMobilePageTouchStart = (e: React.TouchEvent) => {
    if (!isMobileLayout || e.touches.length !== 1 || mobileCollapseTransform || isClosingMobileRef.current) return;
    if (isMobileInfoPageOpen || isMobileSeasonDropdownOpen) return;
    const sc = scrollContainerRef.current;
    if (!sc || sc.scrollTop > 2) {
      mobileTouchStartPosRef.current = null;
      return;
    }
    const y = e.touches[0].clientY;
    mobileTouchStartPosRef.current = {
      x: e.touches[0].clientX,
      y,
      locked: null
    };
    mobileTouchSamplesRef.current = [{ y, t: performance.now() }];
  };

  const handleMobilePageTouchMove = (e: React.TouchEvent) => {
    const start = mobileTouchStartPosRef.current;
    if (!start || e.touches.length !== 1 || mobileCollapseTransform || isClosingMobileRef.current) return;
    const y = e.touches[0].clientY;
    const dx = e.touches[0].clientX - start.x;
    const dy = y - start.y;

    if (start.locked === null) {
      if (Math.hypot(dx, dy) < 10) return;
      if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.15 && (scrollContainerRef.current?.scrollTop || 0) <= 2) {
        start.locked = 'y';
        setIsMobileDragging(true);
      } else {
        start.locked = 'x';
        return;
      }
    }

    if (start.locked === 'y') {
      const nextDrag = dy > 0 ? dy * 0.94 : 0;
      mobileDragYRef.current = nextDrag;
      setMobileDragY(nextDrag);
      mobileTouchSamplesRef.current.push({ y, t: performance.now() });
      if (mobileTouchSamplesRef.current.length > 6) {
        mobileTouchSamplesRef.current.shift();
      }
    }
  };

  const handleMobilePageTouchEnd = () => {
    const start = mobileTouchStartPosRef.current;
    if (!start) return;
    if (start.locked === 'y') {
      const samples = mobileTouchSamplesRef.current;
      let vy = 0;
      if (samples.length >= 2) {
        const last = samples[samples.length - 1];
        const recent = samples.find((s) => last.t - s.t <= 95) || samples[0];
        const dt = Math.max(1, last.t - recent.t);
        vy = Math.max(0, (last.y - recent.y) / dt);
      }
      const dragY = mobileDragYRef.current;
      const vh = window.innerHeight || 800;
      mobileTouchStartPosRef.current = null;

      if (dragY >= vh * 0.75) {
        triggerMobileClose('swipe_off_bottom', false, vy);
        return;
      }
      if (dragY > 88 || (vy > 0.55 && dragY > 36)) {
        triggerMobileClose(vy > 0.65 ? 'fast_swipe' : 'slow_swipe', false, vy);
        return;
      }
    }
    mobileDragYRef.current = 0;
    setMobileDragY(0);
    setIsMobileDragging(false);
    mobileTouchStartPosRef.current = null;
  };

  // Info Page Drag-to-Dismiss Handler
  const [infoPageDragY, setInfoPageDragY] = useState<number>(0);
  const [isInfoPageDragging, setIsInfoPageDragging] = useState<boolean>(false);
  const infoPageTouchStartYRef = useRef<number | null>(null);
  const infoPageContainerRef = useRef<HTMLDivElement>(null);

  const handleInfoPageTouchStart = (e: React.TouchEvent) => {
    infoPageTouchStartYRef.current = e.touches[0].clientY;
    setIsInfoPageDragging(true);
  };

  const handleInfoPageTouchMove = (e: React.TouchEvent) => {
    if (infoPageTouchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - infoPageTouchStartYRef.current;
    if (deltaY > 0) {
      setInfoPageDragY(deltaY);
    } else {
      setInfoPageDragY(0);
    }
  };

  const handleInfoPageTouchEnd = () => {
    if (infoPageTouchStartYRef.current === null) return;
    const sheetHeight = infoPageContainerRef.current?.offsetHeight || 400;
    if (infoPageDragY > sheetHeight * 0.3) {
      setIsMobileInfoPageOpen(false);
    }
    setInfoPageDragY(0);
    setIsInfoPageDragging(false);
    infoPageTouchStartYRef.current = null;
  };

  const handleStartMobileTrailer = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentVideoSrc) return;
    clearMobilePausePosterTimer();
    setShowPosterAfterPause(false);
    setHasStartedTrailer(true);
    setIsMobileTrailerEnded(false);
    setIsMobileTrailerLoading(true);
    setIsMobileTrailerControlsVisible(true);
    const v = mobileVideoRef.current;
    if (v) {
      if (mobileSavedTimeRef.current > 0 && Math.abs(v.currentTime - mobileSavedTimeRef.current) > 0.25) {
        try {
          v.currentTime = mobileSavedTimeRef.current;
        } catch {}
      }
      v.muted = isMobileTrailerMuted;
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
        setIsMobileTrailerPlaying(true);
      }).catch(() => {
        v.muted = true;
        setIsMobileTrailerMuted(true);
        v.play().then(() => {
          setIsMobileTrailerLoading(false);
          setIsMobileTrailerPlaying(true);
        }).catch(() => {
          setIsMobileTrailerLoading(false);
          setIsMobileTrailerPlaying(false);
        });
      });
    }
  };

  const handleToggleMobileTrailerPlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentVideoSrc) return;
    const v = mobileVideoRef.current;
    if (!v) return;
    if (!hasStartedTrailer || isMobileTrailerEnded) {
      if (isMobileTrailerEnded) {
        handleMobileTrailerReplay(e);
      } else {
        handleStartMobileTrailer(e);
      }
      return;
    }
    if (v.paused) {
      clearMobilePausePosterTimer();
      setShowPosterAfterPause(false);
      setIsMobileTrailerLoading(true);
      if (mobileSavedTimeRef.current > 0 && Math.abs(v.currentTime - mobileSavedTimeRef.current) > 0.25) {
        try {
          v.currentTime = mobileSavedTimeRef.current;
        } catch {}
      }
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
        setIsMobileTrailerPlaying(true);
        setIsMobileTrailerControlsVisible(true);
      }).catch(() => {
        setIsMobileTrailerLoading(false);
        setIsMobileTrailerPlaying(false);
      });
    } else {
      clearMobilePausePosterTimer();
      setShowPosterAfterPause(false);
      mobileSavedTimeRef.current = v.currentTime;
      v.pause();
      setIsMobileTrailerPlaying(false);
      setIsMobileTrailerLoading(false);
      setIsMobileTrailerControlsVisible(true);
      mobilePausePosterTimerRef.current = window.setTimeout(() => {
        setShowPosterAfterPause(true);
        mobilePausePosterTimerRef.current = null;
      }, 2000);
    }
  };

  const handleMobileTrailerReplay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!currentVideoSrc) return;
    clearMobilePausePosterTimer();
    setShowPosterAfterPause(false);
    mobileSavedTimeRef.current = 0;
    setIsMobileTrailerEnded(false);
    setHasStartedTrailer(true);
    setIsMobileTrailerLoading(true);
    setIsMobileTrailerControlsVisible(true);
    const v = mobileVideoRef.current;
    if (v) {
      v.currentTime = 0;
      v.muted = isMobileTrailerMuted;
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
        setIsMobileTrailerPlaying(true);
      }).catch(() => {
        v.muted = true;
        setIsMobileTrailerMuted(true);
        v.play().then(() => {
          setIsMobileTrailerLoading(false);
          setIsMobileTrailerPlaying(true);
        }).catch(() => {
          setIsMobileTrailerLoading(false);
          setIsMobileTrailerPlaying(false);
        });
      });
    }
  };

  const handleMobilePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only play/toggle preview when user clicks
    handleToggleMobileTrailerPlay(e);
  };

  const handleToggleMobileMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextMuted = !isMobileTrailerMuted;
    setIsMobileTrailerMuted(nextMuted);
    if (mobileVideoRef.current) {
      mobileVideoRef.current.muted = nextMuted;
    }
    if (onToggleGlobalMute) {
      onToggleGlobalMute();
    }
  };

  const mobileTabs = useMemo(() => {
    if (hasEpisodes) {
      return [
        { id: 'episodes' as const, label: 'Episodes' },
        { id: 'trailers' as const, label: 'Trailers' },
        { id: 'moreLikeThis' as const, label: 'More Like This' },
      ];
    } else {
      return [
        { id: 'trailers' as const, label: 'Trailers' },
        { id: 'moreLikeThis' as const, label: 'More Like This' },
      ];
    }
  }, [hasEpisodes]);

  // Smooth horizontal touch-swipe switching across mobile tabs (Episodes <-> Trailers <-> More Like This)
  const [mobileTabSwipeOffset, setMobileTabSwipeOffset] = useState<number>(0);
  const [isSwipingMobileTab, setIsSwipingMobileTab] = useState<boolean>(false);
  const tabSwipeStartRef = useRef<{ x: number; y: number; locked: 'x' | 'y' | null } | null>(null);

  const activeMobileTabIdx = useMemo(() => {
    const idx = mobileTabs.findIndex((t) => t.id === mobileActiveTab);
    return idx >= 0 ? idx : 0;
  }, [mobileTabs, mobileActiveTab]);

  const handleMobileTabTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const target = e.target as HTMLElement | null;
    if (target) {
      const hScroll = target.closest('.overflow-x-auto') as HTMLElement | null;
      if (hScroll && hScroll.scrollWidth > hScroll.clientWidth + 4) {
        return;
      }
    }
    tabSwipeStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      locked: null
    };
  };

  const handleMobileTabTouchMove = (e: React.TouchEvent) => {
    const start = tabSwipeStartRef.current;
    if (!start || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = e.touches[0].clientY - start.y;

    if (start.locked === null) {
      if (Math.hypot(dx, dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.15) {
        start.locked = 'x';
        setIsSwipingMobileTab(true);
      } else {
        start.locked = 'y';
        return;
      }
    }

    if (start.locked === 'x') {
      const atStartEdge = activeMobileTabIdx === 0 && dx > 0;
      const atEndEdge = activeMobileTabIdx === mobileTabs.length - 1 && dx < 0;
      setMobileTabSwipeOffset(atStartEdge || atEndEdge ? dx * 0.22 : dx);
    }
  };

  const handleMobileTabTouchEnd = () => {
    const start = tabSwipeStartRef.current;
    if (start && start.locked === 'x') {
      const threshold = 48;
      if (mobileTabSwipeOffset < -threshold && activeMobileTabIdx < mobileTabs.length - 1) {
        setMobileActiveTab(mobileTabs[activeMobileTabIdx + 1].id as any);
      } else if (mobileTabSwipeOffset > threshold && activeMobileTabIdx > 0) {
        setMobileActiveTab(mobileTabs[activeMobileTabIdx - 1].id as any);
      }
    }
    tabSwipeStartRef.current = null;
    setIsSwipingMobileTab(false);
    setMobileTabSwipeOffset(0);
  };

  const ratingScore = show.imdbRating || (show.points ? Math.min(9.8, Math.max(6.5, show.points / 10)).toFixed(1) : '7.8');
  const reviewVotesText = show.imdbVotes ? `${show.imdbVotes} ratings` : `${Math.floor((show.points || 85) * 3500).toLocaleString()} ratings`;
  const directorName = show.director || 'Serdar Akar';
  const directorProfileUrl = show.directorProfileUrl || (show.cast && show.cast[0] ? show.cast[0].profileUrl : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80');
  const top10Rank = top10ShowIds.includes(show.id) ? top10ShowIds.indexOf(show.id) + 1 : null;

  // Strictly lock background body scroll while modal is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.setAttribute('data-modal-open', 'true');
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.removeAttribute('data-modal-open');
    };
  }, [isFullPlayerOpen]);

  // When cast view or blog view opens: ensure it opens from the very top and NO preview or video plays in the background
  useEffect(() => {
    if (isCastViewOpen || isBlogViewOpen) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      }
      if (castContainerRef.current) {
        castContainerRef.current.scrollTop = 0;
      }
      if (blogContainerRef.current) {
        blogContainerRef.current.scrollTop = 0;
      }
      // Strictly stop preview and video playback
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsVideoPlaying(false);
      setShouldLoadPreview(false);
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current);
        previewTimerRef.current = null;
      }
    }
  }, [isCastViewOpen, isBlogViewOpen]);

  const handleOpenCastView = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setShouldLoadPreview(false);
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsCastViewOpen(true);
    onSubViewChange?.('cast');
  };

  const handleOpenBlogView = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);
    setShouldLoadPreview(false);
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }
    setIsBlogViewOpen(true);
    onSubViewChange?.('blog');
  };

  // When scrolling down the more info page: pause preview when 40% of poster/video is under navigation bar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleContainerScroll = () => {
      // Mobile: pause preview playback when user scrolls down, saving currentTime for manual resume
      if (window.innerWidth <= 768) {
        if (container.scrollTop > 40 && mobileVideoRef.current && !mobileVideoRef.current.paused) {
          clearMobilePausePosterTimer();
          setShowPosterAfterPause(false);
          mobileSavedTimeRef.current = mobileVideoRef.current.currentTime;
          mobileVideoRef.current.pause();
          setIsMobileTrailerPlaying(false);
          setIsMobileTrailerLoading(false);
          mobilePausePosterTimerRef.current = window.setTimeout(() => {
            setShowPosterAfterPause(true);
            mobilePausePosterTimerRef.current = null;
          }, 2000);
        }
        return;
      }

      const banner = heroBannerRef.current;
      if (!banner) return;

      const rect = banner.getBoundingClientRect();
      const navEl = document.querySelector('header') || document.querySelector('nav');
      const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 68;

      // Amount of the hero banner that has scrolled under the navigation bar
      const amountUnderNav = Math.max(0, navBottom - rect.top);
      const isFortyPercentUnderNav = rect.height > 0 && amountUnderNav >= rect.height * 0.40;
      const isCompletelyOutOfView = rect.bottom <= 0;
      const shouldPause = isFortyPercentUnderNav || isCompletelyOutOfView;

      if (shouldPause) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          isPausedByScrollRef.current = true;
          setIsPausedByScroll(true);
        }
      } else {
        // Scrolled back up (less than 40% under nav): instantly resume preview
        if (isPausedByScrollRef.current && videoRef.current && !isPreviewEndedRef.current) {
          isPausedByScrollRef.current = false;
          setIsPausedByScroll(false);
          videoRef.current.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(() => {});
        }
      }
    };

    container.addEventListener('scroll', handleContainerScroll, { passive: true });
    window.addEventListener('resize', handleContainerScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleContainerScroll);
      window.removeEventListener('resize', handleContainerScroll);
    };
  }, []);

  const prevFullPlayerOpenRef = useRef(isFullPlayerOpen);
  const isPausedByTabRef = useRef<boolean>(false);

  // When fullscreen player opens, immediately stop video preview in background.
  // When coming back from fullscreen player to more info page, again show the preview!
  useEffect(() => {
    if (isFullPlayerOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsVideoPlaying(false);
    } else if (prevFullPlayerOpenRef.current && !isFullPlayerOpen) {
      // User clicked play and came back to more info page: show the preview again
      setIsPreviewEnded(false);
      isPreviewEndedRef.current = false;
      setShouldLoadPreview(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(() => {});
      }
    }
    prevFullPlayerOpenRef.current = isFullPlayerOpen;
  }, [isFullPlayerOpen]);

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // When user switches tab in browser, pause more info preview video; when tab is reopened, resume where left off!
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          isPausedByTabRef.current = true;
          setIsVideoPlaying(false);
        }
      } else {
        if (isPausedByTabRef.current && videoRef.current && !isPreviewEndedRef.current && !isFullPlayerOpen && !isPausedByScrollRef.current) {
          isPausedByTabRef.current = false;
          videoRef.current.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullPlayerOpen]);

  // When modal is opened via Tab navigation from feed card, focus modal wrapper initially
  // and pressing the next Tab key moves focus directly to the Play button!
  useEffect(() => {
    const isOpenedViaTab = sessionStorage.getItem('dizi_focus_play_on_next_tab');
    if (isOpenedViaTab) {
      sessionStorage.removeItem('dizi_focus_play_on_next_tab');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.focus();
      }

      const handleNextTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          const playBtn = document.getElementById('modal-main-play-button');
          if (playBtn) {
            playBtn.focus();
          }
          window.removeEventListener('keydown', handleNextTab, true);
        }
      };

      window.addEventListener('keydown', handleNextTab, true);
      return () => window.removeEventListener('keydown', handleNextTab, true);
    }
  }, [show.id]);

  // Sync state when show changes & ensure container scrolls immediately to top
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    setSelectedSeasonNumber(1);
    setSelectedEpisode(show.seasons && show.seasons[0]?.episodes[0] ? show.seasons[0].episodes[0] : null);
    setActivePlaybackSource(initialVideoMode === 'episode' ? 'episode' : 'trailer');
    setCustomVideoUrl(null);
    setIsCastViewOpen(false);
    setIsBlogViewOpen(false);
    setIsTitleShrunk(false);
    hasTriggeredShrinkRef.current = false;
    setIsMoreLikeThisExpanded(false);
    setModalBackdropSrc(show.backdropUrl || show.posterLandscapeUrl || '');
    setIsVideoPlaying(false);
    setVideoError(false);
    setShouldLoadPreview(false);
    setIsPreviewEnded(false);
    isPreviewEndedRef.current = false;
    setIsPausedByScroll(false);
    isPausedByScrollRef.current = false;
    clearMobilePausePosterTimer();
    setShowPosterAfterPause(false);
    mobileSavedTimeRef.current = 0;
    setHasStartedTrailer(false);
    setIsMobileTrailerPlaying(false);
    setIsMobileTrailerEnded(false);
    setIsMobileTrailerLoading(false);

    if (shrinkTimerRef.current) {
      window.clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    // On mobile: NEVER autoplay trailer or preview in background
    if (isMobileLayout) {
      setShouldLoadPreview(false);
      setIsVideoPlaying(false);
      return;
    }

    // Keep backdrop showing for 2 seconds before preview video loads on desktop
    setShouldLoadPreview(false);
    setIsVideoPlaying(false);

    previewTimerRef.current = window.setTimeout(() => {
      setShouldLoadPreview(true);
    }, 2000);

    return () => {
      if (shrinkTimerRef.current) window.clearTimeout(shrinkTimerRef.current);
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [show.id, show.backdropUrl, show.posterLandscapeUrl, initialVideoMode, isMobileLayout]);

  // When preview video autoplays: delay 2200ms, then shrink takes 300ms ease in out (only once!)
  const handleAutoplayStarted = () => {
    if (!hasTriggeredShrinkRef.current) {
      hasTriggeredShrinkRef.current = true;
      if (shrinkTimerRef.current) window.clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = window.setTimeout(() => {
        setIsTitleShrunk(true);
      }, 2200);
    }
  };

  const toggleSound = () => {
    if (onToggleGlobalMute) {
      onToggleGlobalMute();
    } else {
      if (!videoRef.current) return;
      const nextMuted = !localMuted;
      videoRef.current.muted = nextMuted;
      setLocalMuted(nextMuted);
    }
  };

  const handleShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsShareModalOpen(true);
  };

  // Core play execution logic
  const executePlayShow = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);

    // If watch progress exists (including next episode prompt after 90% watched), resume that episode
    if (watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) && onWatchInFullPlayer) {
      let resumeEp: Episode | null = null;
      if (show.seasons && show.seasons.length > 0) {
        for (const sea of show.seasons) {
          const match = sea.episodes.find(
            (e) =>
              (watchProgress.episodeId && e.id === watchProgress.episodeId) ||
              (watchProgress.episodeNumber && e.episodeNumber === watchProgress.episodeNumber && (!watchProgress.seasonNumber || sea.seasonNumber === watchProgress.seasonNumber))
          );
          if (match) {
            resumeEp = match;
            break;
          }
        }
      }
      const startSec = parseTimeToSeconds(resumeEp?.startTime) || 0;
      const epKey = resumeEp?.id || (resumeEp?.episodeNumber !== undefined ? `s${resumeEp?.seasonNumber || 1}e${resumeEp?.episodeNumber}` : 'movie');
      const epProg = watchProgress.episodesProgress?.[epKey];
      const seekPos =
        epProg?.rawVideoTime !== undefined && epProg.rawVideoTime > 0
          ? epProg.rawVideoTime
          : watchProgress.rawVideoTime !== undefined && watchProgress.rawVideoTime > 0
          ? watchProgress.rawVideoTime
          : (epProg?.currentTime !== undefined ? startSec + epProg.currentTime : startSec + (watchProgress.currentTime || 0));

      onWatchInFullPlayer(show, resumeEp, null, seekPos);
      return;
    }

    // If an episode other than episode 1 is explicitly selected, play that episode
    if (selectedEpisode && selectedEpisode.episodeNumber > 1 && onWatchInFullPlayer) {
      const epKey = selectedEpisode.id || `s${selectedEpisode.seasonNumber || 1}e${selectedEpisode.episodeNumber}`;
      const epProg = watchProgress?.episodesProgress?.[epKey];
      const startSec = parseTimeToSeconds(selectedEpisode.startTime) || 0;
      const seek =
        epProg?.rawVideoTime !== undefined && epProg.rawVideoTime > 0
          ? epProg.rawVideoTime
          : epProg?.currentTime !== undefined && epProg.currentTime > 0
          ? startSec + epProg.currentTime
          : startSec;
      onWatchInFullPlayer(show, selectedEpisode, null, seek);
      return;
    }

    // Direct invocation of onPlayShow guarantees seamless fullscreen playback
    if (onPlayShow) {
      onPlayShow(show);
      return;
    }

    const hasEpisodes =
      show.type === 'series' &&
      show.hasEpisodicContent !== false &&
      show.seasons &&
      show.seasons.length > 0 &&
      show.seasons[0].episodes.length > 0;
    const epToPlay = hasEpisodes ? (selectedEpisode || show.seasons![0].episodes[0]) : null;

    if (onWatchInFullPlayer) {
      onWatchInFullPlayer(show, epToPlay);
    } else if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handlePlayButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    executePlayShow();
  };

  // Main backdrop play handler (clicking anywhere on the top backdrop plays the movie/episode)
  const handlePlayMain = (e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
    }
    executePlayShow();
  };

  const handlePlayEpisode = (ep: Episode) => {
    onSubViewChange?.('main', { episode: ep });
    if (ep.videoSourceType === 'external') {
      window.open(ep.videoUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    setSelectedEpisode(ep);
    // Pause background trailer preview immediately
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);

    if (onWatchInFullPlayer) {
      const epKey = ep.id || `s${ep.seasonNumber || 1}e${ep.episodeNumber}`;
      const epProg = watchProgress?.episodesProgress?.[epKey];
      const startSec = parseTimeToSeconds(ep.startTime) || 0;
      const seek =
        epProg?.rawVideoTime !== undefined && epProg.rawVideoTime > 0
          ? epProg.rawVideoTime
          : epProg?.currentTime !== undefined && epProg.currentTime > 0
          ? startSec + epProg.currentTime
          : startSec;
      onWatchInFullPlayer(show, ep, null, seek);
    } else {
      setActivePlaybackSource('episode');
      setCustomVideoUrl(null);
      setShouldLoadPreview(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // When clicking on a trailer in "Trailers & More": open directly in full player or popup!
  const handlePlayClip = (trailer: TrailerItem) => {
    onSubViewChange?.('main', { trailer });
    if (trailer.videoSourceType === 'external') {
      window.open(trailer.videoUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Pause background trailer preview immediately
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsVideoPlaying(false);

    if (onWatchInFullPlayer) {
      onWatchInFullPlayer(show, null, trailer);
    } else {
      setActivePlaybackSource('clip');
      setCustomVideoUrl(trailer.videoUrl);
      setShouldLoadPreview(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Watchlist toggle on cards in "More Like This" with instant feedback
  const handleToggleCardWatchlist = (e: React.MouseEvent, targetShowId: string) => {
    e.stopPropagation();
    setLocalWatchlist((prev) =>
      prev.includes(targetShowId) ? prev.filter((id) => id !== targetShowId) : [...prev, targetShowId]
    );
    onToggleWatchlist(targetShowId);
  };

  // When clicking on a card in "More Like This": scroll to top and open with first available section (episodes or trailers)
  const handleSelectRelatedShow = (relShow: Show) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    const hasEp =
      relShow.type === 'series' &&
      relShow.hasEpisodicContent !== false &&
      relShow.seasons &&
      relShow.seasons.length > 0 &&
      relShow.seasons[0].episodes &&
      relShow.seasons[0].episodes.length > 0;
    setMobileActiveTab(hasEp ? 'episodes' : 'trailers');
    setHasStartedTrailer(false);
    setIsMobileTrailerPlaying(false);
    setIsMobileTrailerLoading(false);
    setIsMobileTrailerEnded(false);
    setMobileTrailerCurrentTime(0);
    setIsMobileInfoPageOpen(false);

    if (onSelectShow) {
      onSelectShow(relShow);
    }
  };

  // Always reset mobile active tab to first available section when show changes
  useEffect(() => {
    const hasEp =
      show.type === 'series' &&
      show.hasEpisodicContent !== false &&
      show.seasons &&
      show.seasons.length > 0 &&
      show.seasons[0].episodes &&
      show.seasons[0].episodes.length > 0;
    setMobileActiveTab(hasEp ? 'episodes' : 'trailers');
    setHasStartedTrailer(false);
    setIsMobileTrailerPlaying(false);
    setIsMobileTrailerLoading(false);
    setIsMobileTrailerEnded(false);
    setMobileTrailerCurrentTime(0);
    setIsMobileInfoPageOpen(false);
  }, [show.id]);

  // Video URL to play in top hero preview:
  // The preview of movies (and series) in more info page works the same as always regardless of movie source!
  // Previews always play the official trailer / preview video (show.trailerUrl || show.hoverPreviewUrl).
  const currentVideoSrc = useMemo(() => {
    if (customVideoUrl) return customVideoUrl;
    if (activePlaybackSource === 'episode' && selectedEpisode) return selectedEpisode.videoUrl;

    const isValidDirectVideo = (url?: string) =>
      Boolean(
        url &&
        !url.includes('youtube.com') &&
        !url.includes('youtu.be') &&
        !url.includes('dailymotion.com') &&
        !url.includes('dai.ly')
      );

    if (isValidDirectVideo(show.detailPreviewUrl)) {
      return show.detailPreviewUrl;
    }
    if (isValidDirectVideo(show.trailerUrl)) {
      return show.trailerUrl;
    }
    if (isValidDirectVideo(show.hoverPreviewUrl)) {
      return show.hoverPreviewUrl;
    }
    if (show.trailerUrl) {
      return show.trailerUrl;
    }
    return 'https://vjs.zencdn.net/v/oceans.mp4';
  }, [customVideoUrl, activePlaybackSource, selectedEpisode, show.detailPreviewUrl, show.trailerUrl, show.hoverPreviewUrl]);

  // Attach video stream (handles MP4, WebM, and .m3u8 HLS preview seamlessly)
  useEffect(() => {
    if (!shouldLoadPreview || !currentVideoSrc || isPreviewEnded) {
      setIsVideoPlaying(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    const cleanup = attachHlsVideo(video, currentVideoSrc, {
      autoPlay: true,
      muted: isMuted,
      onLoaded: () => {
        setIsVideoPlaying(true);
        handleAutoplayStarted();
      }
    });

    return () => {
      setIsVideoPlaying(false);
      if (cleanup) cleanup();
    };
  }, [shouldLoadPreview, currentVideoSrc, isPreviewEnded]);

  // Attach mobile video trailer stream (persists across pause/play, does NOT reset to beginning on pause)
  useEffect(() => {
    if (!hasStartedTrailer || !currentVideoSrc || isMobileTrailerEnded) {
      return;
    }
    const video = mobileVideoRef.current;
    if (!video) return;

    setIsMobileTrailerLoading(true);

    const cleanup = attachHlsVideo(video, currentVideoSrc, {
      autoPlay: true,
      muted: isMobileTrailerMuted,
      onLoaded: () => {
        setIsMobileTrailerLoading(false);
        video.play().then(() => {
          setIsMobileTrailerPlaying(true);
        }).catch(() => {
          video.muted = true;
          setIsMobileTrailerMuted(true);
          video.play().then(() => {
            setIsMobileTrailerPlaying(true);
          }).catch(() => {});
        });
      }
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [hasStartedTrailer, currentVideoSrc, isMobileTrailerEnded]);

  // Is this show in top 10? (Only shows or movies that are ranking in top 10 have top 10 badge)
  const isTop10 = (adminSettings.showTop10Badges !== false) && top10ShowIds.includes(show.id);

  // Duration or season text: strictly what the admin writes in the form (e.g. "2 Season", "2 Seasons", "2h 10m")
  const seasonsCount = show.seasons ? show.seasons.length : 1;
  const durationOrSeasonText =
    show.durationOrSeasons ||
    (show.type === 'movie'
      ? '2h 10m'
      : seasonsCount > 1
      ? `${seasonsCount} Seasons`
      : '1 Season');

  // Catalogue database actor analysis:
  // Find all actors across allShows and identify those with more than 1 appearance
  const { multiAppearanceActors, currentShowCastWithStats } = useMemo(() => {
    const actorAppearanceMap = new Map<string, { count: number; shows: Show[]; actor: CastMember }>();

    // Count appearances across the entire catalogue database
    (allShows || []).forEach((s) => {
      (s.cast || []).forEach((c) => {
        const key = c.name.trim().toLowerCase();
        if (!actorAppearanceMap.has(key)) {
          actorAppearanceMap.set(key, { count: 0, shows: [], actor: c });
        }
        const record = actorAppearanceMap.get(key)!;
        record.count += 1;
        if (!record.shows.some((sh) => sh.id === s.id)) {
          record.shows.push(s);
        }
      });
    });

    // Notable actors in the catalogue who have more than 1 appearance
    const multiActors: Array<{ actor: CastMember; count: number; otherShows: Show[] }> = [];
    actorAppearanceMap.forEach((rec) => {
      if (rec.count > 1) {
        multiActors.push({
          actor: rec.actor,
          count: rec.count,
          otherShows: rec.shows.filter((s) => s.id !== show.id)
        });
      }
    });

    // Current show cast with their appearance stats in the catalogue
    const castWithStats = (show.cast || []).map((c) => {
      const key = c.name.trim().toLowerCase();
      const rec = actorAppearanceMap.get(key);
      const appearances = rec ? rec.count : 1;
      const otherShows = rec ? rec.shows.filter((s) => s.id !== show.id) : [];
      return {
        ...c,
        totalAppearances: appearances,
        otherShows
      };
    });

    return {
      multiAppearanceActors: multiActors,
      currentShowCastWithStats: castWithStats
    };
  }, [allShows, show]);

  // Filter & rank shows strictly matching same genres or categories, maximum 9 titles
  const matchingRelatedShows = useMemo(() => {
    // Current show normalized genres & categories
    const targetGenres = (show.genres || []).map((g) => g.trim().toLowerCase());
    const targetCats = (show.categories || []).map((c) => c.trim().toLowerCase());

    const otherShows = allShows.filter((s) => s.id !== show.id);

    // Only titles from the same category or genre
    const sameGenreOrCategoryShows = otherShows.filter((s) => {
      const sGenres = (s.genres || []).map((g) => g.trim().toLowerCase());
      const sCats = (s.categories || []).map((c) => c.trim().toLowerCase());

      const sharesGenre = sGenres.some((sg) =>
        targetGenres.some((tg) => tg === sg || tg.includes(sg) || sg.includes(tg))
      );
      if (sharesGenre) return true;

      const sharesCategory = sCats.some((sc) =>
        targetCats.some((tc) => tc === sc || tc.includes(sc) || sc.includes(tc))
      );
      if (sharesCategory) return true;

      const crossMatches =
        sCats.some((sc) => targetGenres.some((tg) => tg.includes(sc) || sc.includes(tg))) ||
        sGenres.some((sg) => targetCats.some((tc) => tc.includes(sg) || sg.includes(tc)));
      if (crossMatches) return true;

      return false;
    });

    // Relational Indexing: Build lookup of current show's cast weights
    // Main Lead: 12 pts, Supporting Lead: 6 pts, Recurring/Minor: 2 pts
    const targetActorWeights = new Map<string, number>();
    (show.cast || []).forEach((c, idx) => {
      const key = normalizeActorKey(c.name, c.id, c.tmdbId);
      const ord = c.order !== undefined ? c.order : idx;
      targetActorWeights.set(key, ord <= 1 ? 12 : ord <= 4 ? 6 : 2);
    });

    // Calculate score based on shared genres, categories, and relational actor connections
    const scored = sameGenreOrCategoryShows.map((s) => {
      const sGenres = (s.genres || []).map((g) => g.trim().toLowerCase());
      const sCats = (s.categories || []).map((c) => c.trim().toLowerCase());

      const matchingGenresCount = sGenres.filter((sg) =>
        targetGenres.some((tg) => tg === sg || tg.includes(sg) || sg.includes(tg))
      ).length;

      const matchingCatsCount = sCats.filter((sc) =>
        targetCats.some((tc) => tc === sc || tc.includes(sc) || sc.includes(tc))
      ).length;

      const isSameType = s.type === show.type;
      const vibeMatches = (s.thisSeriesIs || []).filter((v) =>
        (show.thisSeriesIs || []).includes(v)
      ).length;

      // Calculate shared cast overlap bonus:
      let castScore = 0;
      (s.cast || []).forEach((otherC, i) => {
        const otherKey = normalizeActorKey(otherC.name, otherC.id, otherC.tmdbId);
        if (targetActorWeights.has(otherKey)) {
          const baseWeight = targetActorWeights.get(otherKey)!;
          const otherOrd = otherC.order !== undefined ? otherC.order : i;
          const otherWeight = otherOrd <= 1 ? 12 : otherOrd <= 4 ? 6 : 2;
          castScore += baseWeight * 0.7 + otherWeight * 0.3;
        }
      });

      // Score: 5 pts per shared genre, 5 pts per shared category, 2 pts for same type + vibes and cast
      const score =
        matchingGenresCount * 5 +
        matchingCatsCount * 5 +
        (isSameType ? 2 : 0) +
        vibeMatches +
        castScore;

      return {
        show: s,
        score
      };
    });

    // Sort highest score first, then by popularity/points
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.show.points || 0) - (a.show.points || 0);
    });

    // Maximum 9 titles allowed in total for More Like This section
    return scored.slice(0, 9).map((item) => item.show);
  }, [allShows, show.id, show.cast, show.genres, show.categories, show.type, show.thisSeriesIs]);

  // Fallback trailers if show doesn't have custom trailers
  const trailersList =
    show.trailersAndMore && show.trailersAndMore.length > 0
      ? show.trailersAndMore
      : [
          {
            id: `${show.id}-trailer-1`,
            title: `Official 4K Trailer: ${show.title}`,
            thumbnailUrl: show.posterLandscapeUrl,
            videoUrl: show.trailerUrl,
            duration: '2m 15s'
          },
          {
            id: `${show.id}-trailer-2`,
            title: `Behind the Scenes & Teaser: ${show.title}`,
            thumbnailUrl: show.backdropUrl,
            videoUrl: show.trailerUrl,
            duration: '3m 10s'
          }
        ];

  return (
    <>
      <div
        data-modal-open="true"
        ref={scrollContainerRef}
      tabIndex={-1}
      style={
        isMobileLayout
          ? { backgroundColor: 'rgba(0, 0, 0, 0)' }
          : undefined
      }
      className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden custom-scrollbar outline-none transition-colors duration-250 ${
        isMobileLayout
          ? 'bg-transparent'
          : isClosingDesktop
          ? 'bg-black/0'
          : 'bg-black/50 animate-modal-backdrop'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) triggerDesktopClose(false);
      }}
    >
      <div className="min-h-full flex items-start justify-center py-0 md:py-8 px-0 md:px-4 pointer-events-none">
        <div
          ref={desktopCardRef}
          className={`relative w-full md:max-w-[780px] ${
            isMobileLayout ? 'bg-transparent' : 'bg-[#181818]'
          } border-0 rounded-none md:rounded-2xl overflow-hidden shadow-2xl select-none pointer-events-auto min-h-screen md:min-h-0 pb-0 flex flex-col will-change-transform`}
          style={{
            boxShadow: isMobileLayout ? 'none' : '0 25px 60px -15px rgba(0,0,0,0.95)',
            ...(!isMobileLayout && desktopModalTransform
              ? {
                  transform: desktopModalTransform.transform,
                  opacity: desktopModalTransform.opacity,
                  transition: desktopModalTransform.transition
                }
              : {})
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===================== DESKTOP & TABLET LAYOUT (100% UNCHANGED) ===================== */}
          <div className="hidden md:block">
            {/* Floating Top-Right Controls (Close X Button) - Hidden when Cast or Blog view is active so no collision with their close buttons */}
            {!isCastViewOpen && !isBlogViewOpen && (
              <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
                <button
                  onClick={() => triggerDesktopClose(false)}
                  className="w-9 h-9 rounded-full bg-[#181818]/80 hover:bg-[#282828] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer shadow-lg"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

          {/* Modal Content - When Cast View is open, render Cast directly so container ends where actors list ends with NO empty space */}
          <div className="bg-[#181818]">
            {isCastViewOpen ? (
              <div
                ref={castContainerRef}
                className="p-6 md:p-10 animate-modal-content"
              >
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    {/* Title is just "Cast" with exact font, look, and size of Episodes heading */}
                    <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-display">
                      Cast
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsCastViewOpen(false);
                      onSubViewChange?.('main');
                    }}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cast Grid: profile picture on top, full actor name and character below with no truncation */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 mt-6">
                  {((isCastExpanded ? show.cast : show.cast?.slice(0, 5)) || []).map((actor) => {
                    return (
                      <div
                        key={actor.id}
                        onClick={() => {
                          setIsCastViewOpen(false);
                          if (onSelectActor) {
                            onSelectActor(actor);
                          }
                        }}
                        className="bg-[#202020] hover:bg-[#282828] rounded-xl overflow-hidden border border-white/10 hover:border-white/25 p-3.5 sm:p-4 flex flex-col items-center text-center transition-all duration-200 cursor-pointer group shadow-md"
                        aria-label={actor.name}
                      >
                        {/* Profile icon has corner radius matching user profile icon */}
                        <img
                          src={actor.profileUrl}
                          alt={actor.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-[6px] object-cover ring-1 ring-white/10 group-hover:scale-105 transition-transform shrink-0"
                        />
                        {/* Name moved below profile picture so it shows fully on screen without truncation */}
                        <div className="mt-3 w-full">
                          <h4 className="text-sm md:text-base font-bold text-white group-hover:text-white transition-colors leading-snug break-words">
                            {actor.name}
                          </h4>
                          {/* Small character name */}
                          <p className="text-xs text-zinc-400 font-medium mt-1 leading-snug break-words">
                            {actor.character}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Same style circular dropdown button centered on divider to toggle other cast from TMDB */}
                {show.cast && show.cast.length > 5 && (
                  <div className="relative my-8 flex items-center justify-center">
                    <div className="w-full h-px bg-white/20" />
                    <button
                      onClick={() => setIsCastExpanded((prev) => !prev)}
                      className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white/40 hover:border-white bg-[#181818] text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                      aria-label={isCastExpanded ? "Show less" : "Show more actors"}
                    >
                      <ChevronDown
                        className={`w-5 h-5 text-white transition-transform duration-300 ${
                          isCastExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            ) : isBlogViewOpen ? (
              <div
                ref={blogContainerRef}
                className="p-6 md:p-10 animate-modal-content"
              >
                <div className="flex items-center justify-between pb-6 border-b border-white/10">
                  <div>
                    <span className="text-xs text-red-500 font-bold uppercase tracking-widest font-display">
                      {adminSettings?.platformName || 'Dizi Urdu'} Deep-Dive & Editorial
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-white font-display mt-0.5 tracking-tight">
                      {show.blog.heading}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      By {show.blog.author} • {show.blog.publishedDate} • {show.blog.readTime}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsBlogViewOpen(false);
                        onSubViewChange?.('main');
                      }}
                      className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
                      aria-label="Close article"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Editorial Content - natural document flow so container ends when writings end */}
                <div className="max-w-3xl mx-auto py-8 space-y-6">
                  {/* Hero Editorial Image */}
                  <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
                    <MediaImage
                      src={show.blog.heroImage}
                      fallbackTitle={show.title}
                      fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-4 text-center select-none"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Static Editorial Blog Content (Configured and managed via Admin Panel) */}
                  <div className="space-y-6">
                    {show.blog.sections.map((section, idx) => (
                      <div key={idx} className="space-y-3">
                        <h4 className="text-xl font-bold text-white">{section.title}</h4>
                        <p className="text-sm md:text-base text-zinc-300 leading-relaxed">
                          {section.content}
                        </p>
                        {section.quote && (
                          <blockquote className="p-4 rounded-xl bg-white/5 border-l-4 border-red-500 italic text-sm md:text-base text-white/90">
                            {section.quote}
                          </blockquote>
                        )}
                      </div>
                    ))}

                    {/* Trivia Highlights */}
                    {show.blog.trivia && show.blog.trivia.length > 0 && (
                      <div className="mt-8 p-6 rounded-2xl bg-[#202020] border border-white/10">
                        <h5 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>Behind-the-Scenes Trivia & Production Secrets</span>
                        </h5>
                        <ul className="space-y-2 text-xs md:text-sm text-zinc-300 list-disc list-inside">
                          {show.blog.trivia.map((t, tidx) => (
                            <li key={tidx}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* 1. TOP VIDEO HERO BANNER (Shorted to match Netflix exact content height and placement) */}
            <div
              ref={heroBannerRef}
              onClick={handlePlayMain}
              className="relative w-full aspect-[16/9] bg-[#181818] md:rounded-t-2xl overflow-hidden isolate [transform:translateZ(0)] cursor-pointer select-none"
              data-no-tooltip="true"
            >
            {/* Primary Base Layer: Backdrop Image (Guaranteed visible immediately upon opening modal) */}
            <MediaImage
              src={modalBackdropSrc}
              fallbackTitle={show.title}
              hideFallback={isVideoPlaying && !isPausedByScroll && !isPreviewEnded}
              fallbackClassName="absolute inset-0 w-full h-full bg-[#181818] flex items-center justify-center p-6 text-center select-none"
              fallbackTextClassName="text-white/85 font-bold text-xl sm:text-2xl font-sans"
              data-no-tooltip="true"
              onError={() => {
                if (show.posterLandscapeUrl && modalBackdropSrc !== show.posterLandscapeUrl) {
                  setModalBackdropSrc(show.posterLandscapeUrl);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover md:rounded-t-2xl"
            />

            {/* Optional Background Video Overlay (loads after backdrop display, desktop/tablet only) */}
            {!isMobileLayout && shouldLoadPreview && !videoError && !isPreviewEnded && currentVideoSrc && (
              <video
                ref={videoRef}
                src={currentVideoSrc}
                poster={modalBackdropSrc}
                autoPlay
                muted={isMuted}
                playsInline
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onCanPlay={(e) => {
                  try {
                    const v = e.target as HTMLVideoElement;
                    v.muted = isMuted;
                    const p = v.play();
                    if (p !== undefined) {
                      p.catch(() => {
                        v.muted = true;
                        v.play().catch(() => {});
                      });
                    }
                  } catch {}
                  setIsVideoPlaying(true);
                  handleAutoplayStarted();
                }}
                onLoadedData={() => {
                  setIsVideoPlaying(true);
                  handleAutoplayStarted();
                }}
                onPlaying={() => {
                  setIsVideoPlaying(true);
                  handleAutoplayStarted();
                }}
                onPause={() => {
                  if (!isPausedByTabRef.current && !isPausedByScrollRef.current) {
                    setIsVideoPlaying(false);
                  }
                }}
                onEnded={() => {
                  isPreviewEndedRef.current = true;
                  setIsPreviewEnded(true);
                  setIsVideoPlaying(false);
                  setShouldLoadPreview(false);
                  setIsTitleShrunk(false);
                }}
                onError={(e) => {
                  console.warn('DetailModal preview playback error:', e);
                }}
                className={`absolute inset-0 w-full h-full object-cover md:rounded-t-2xl scale-[1.03] z-10 transition-opacity duration-500 ${
                  isVideoPlaying && !isPausedByScroll ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Uniform smooth bottom glare matching Netflix - zero visible divider between hero preview and content */}
            <div className="absolute inset-x-0 bottom-0 h-40 sm:h-48 md:h-56 bg-gradient-to-t from-[#181818] via-[#181818]/80 via-35% via-[#181818]/20 to-transparent pointer-events-none z-[12]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent pointer-events-none z-[12] md:rounded-t-2xl" />

            {/* Top-Left Source Watermark (visible ONLY with video preview, hides when video pauses or ends) */}
            {shouldLoadPreview && !videoError && isVideoPlaying && !isPreviewEnded && !isPausedByScroll && show.sourceWatermarkUrl && (
              <div className="absolute top-4 left-5 sm:top-5 sm:left-6 md:top-6 md:left-8 z-30 pointer-events-none transition-opacity duration-300">
                <img
                  src={show.sourceWatermarkUrl}
                  alt="Source Watermark"
                  referrerPolicy="no-referrer"
                  className="max-h-7 sm:max-h-9 md:max-h-10 w-auto object-contain opacity-85 drop-shadow-md select-none"
                />
              </div>
            )}

            {/* Bottom-Right Audio Mute/Unmute Circular Button (Clean outline matching recommendation, removed when preview ends) */}
            {shouldLoadPreview && !videoError && !isPreviewEnded && isVideoPlaying && !isPausedByScroll && (
              <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30">
                <button
                  onClick={toggleSound}
                  className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/25 hover:bg-black/45 text-white border border-white/20 flex items-center justify-center transition-colors cursor-pointer backdrop-blur-none shadow-md"
                  aria-label="Toggle audio"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Bottom-Left: Title PNG Logo + Action Buttons (Play, Add to List, Like) */}
            <div className="absolute bottom-5 left-6 md:bottom-7 md:left-10 z-30 max-w-xl flex flex-col items-start origin-bottom-left">
              {/* Show Title PNG Logo: loads at max size, only shrinks and never grows */}
              <div
                ref={heroLogoRef}
                style={{
                  transform: isTitleShrunk ? 'scale(0.88)' : 'scale(1)',
                  transformOrigin: 'bottom left',
                  transition: isTitleShrunk ? 'transform 1500ms linear' : 'none',
                  willChange: 'transform'
                }}
                className="mb-3.5 self-start origin-bottom-left"
              >
                <ShowTitleLogo show={show} />
              </div>

              {/* Watch Progress Indicator above Resume Button (Matching Image 3) */}
              {watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) && (
                <div className="w-full max-w-sm mb-3 select-none">
                  {watchProgress.episodeNumber && (
                    <div className="text-white/90 text-xs sm:text-sm font-semibold mb-1 truncate">
                      S{watchProgress.seasonNumber || 1}:E{watchProgress.episodeNumber} {watchProgress.episodeTitle ? `"${watchProgress.episodeTitle}"` : ''}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-[2.5px] sm:h-[3px] bg-white/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#e50914] rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, watchProgress.progressPercent))}%` }}
                      />
                    </div>
                    <span className="text-zinc-300 font-medium text-xs sm:text-[13px] whitespace-nowrap leading-none">
                      {formatProgressTime(watchProgress.currentTime, watchProgress.duration)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3">
                {/* Big White Play / Resume Button: Immediately stops preview trailer in background */}
                <button
                  id="modal-main-play-button"
                  ref={playButtonRef}
                  onClick={handlePlayButton}
                  className="pl-4 pr-5 sm:pl-5 sm:pr-6 py-2 sm:py-2.5 xl:py-3 rounded-full bg-white hover:bg-white/90 text-black font-bold text-[16px] sm:text-[18px] flex items-center gap-1.5 shadow-xl cursor-pointer tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {/* Rounded Play symbol */}
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span className="tracking-wide">{watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) ? 'Resume' : 'Play'}</span>
                </button>

                {/* Add to List Circular Button: reduced opacity, non-blur */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(show.id);
                  }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 backdrop-blur-none text-white flex items-center justify-center transition-colors cursor-pointer"
                  data-tooltip={isInWatchlist ? 'Remove from List' : 'Add to List'}
                  aria-label="Add to List"
                >
                  {isInWatchlist ? <Check className="w-4.5 h-4.5 text-white stroke-[2.5]" /> : <Plus className="w-4.5 h-4.5 text-white" />}
                </button>

                {/* Like Button: reduced opacity, non-blur */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeAction();
                  }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 backdrop-blur-none text-white flex items-center justify-center transition-colors cursor-pointer"
                  data-tooltip="Like"
                  aria-label="Like"
                >
                  <ThumbsUp className={`w-4.5 h-4.5 text-white ${isLiked ? 'fill-white' : ''}`} />
                </button>

                {/* Share Button: opens Share Page modal */}
                <button
                  onClick={handleShare}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 backdrop-blur-none text-white flex items-center justify-center transition-colors cursor-pointer"
                  data-tooltip="Share"
                  aria-label="Share"
                >
                  <ShareArrowIcon className="w-4.5 h-4.5 text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* 2. FULL-WIDTH METADATA & DETAILS AREA */}
          <div className="px-6 md:px-10 pt-4 pb-8 bg-[#181818] relative z-20 space-y-4">
            {/* Line 1: Year, Duration, HD, Maturity Rating, Top 10 Badge, Single Genre, Cast, Blog */}
            <div className="flex flex-wrap items-center gap-2.5 text-sm md:text-base font-semibold text-white/90">
              <span>{show.releaseYear.split('-')[0].trim()}</span>
              <span>{durationOrSeasonText}</span>

              {/* HD border badge */}
              <span className="px-1.5 py-0.5 rounded border border-white/40 text-[10px] font-bold text-zinc-300 uppercase leading-none">
                HD
              </span>

              {/* Age rating border pill */}
              <span className="h-5 px-1.5 rounded border border-white/40 font-bold text-white text-xs inline-flex items-center justify-center leading-none">
                {show.maturityRating}
              </span>

              {/* Red Top 10 badge on info line matching height and corner radius */}
              {isTop10 && (
                <span className="h-5 bg-[#b81d24] text-white text-[11px] font-black px-2 rounded uppercase font-display leading-none tracking-tight shadow-sm inline-flex items-center justify-center">
                  TOP 10
                </span>
              )}

              {/* Single genre on top line (no violence, historical warfare, tense sequences) */}
              <span className="text-zinc-300 font-medium text-xs md:text-sm ml-0.5 mr-1">
                {show.genres[0] || 'Drama'}
              </span>

              {/* Cast button on first line - subtle and clean, no tooltip */}
              {show.cast && show.cast.length > 0 && (
                <button
                  onClick={handleOpenCastView}
                  className="h-5 px-2 rounded border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-xs font-normal text-zinc-300 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer select-none"
                  aria-label="Cast"
                >
                  <span>Cast</span>
                  <span className="text-zinc-500 text-[10px]">&gt;</span>
                </button>
              )}

              {/* Blog button on first line - subtle and clean, no tooltip */}
              {show.blog && show.blog.heading && (
                <button
                  onClick={handleOpenBlogView}
                  className="h-5 px-2 rounded border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 text-xs font-normal text-zinc-300 hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer select-none"
                  aria-label="Blog"
                >
                  <span>Blog</span>
                  <span className="text-zinc-500 text-[10px]">&gt;</span>
                </button>
              )}
            </div>

            {/* Line 2: Full-width stretched synopsis clamped to 2 lines, trailing words dull, click to expand, NO tooltip */}
            <div
              onClick={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
              className="w-full cursor-pointer group/synopsis pt-1 select-none"
            >
              <p
                className={`w-full text-sm md:text-base leading-relaxed font-normal transition-all ${
                  isSynopsisExpanded ? 'text-zinc-200' : 'line-clamp-2 text-zinc-200'
                } group-hover/synopsis:text-white`}
                style={
                  !isSynopsisExpanded
                    ? {
                        maskImage: 'linear-gradient(to right, #fff 0%, #fff 88%, rgba(255,255,255,0.45) 96%, rgba(255,255,255,0.2) 100%)',
                        WebkitMaskImage: 'linear-gradient(to right, #fff 0%, #fff 88%, rgba(255,255,255,0.45) 96%, rgba(255,255,255,0.2) 100%)'
                      }
                    : undefined
                }
              >
                {show.synopsis || show.shortDescription}
              </p>
            </div>
          </div>

          {/* WHERE TO WATCH SECTION (Visible before episode section when enabled) */}
          {adminSettings.enableWhereToWatch && (show.whereToWatchEnabled !== false) && show.whereToWatch && show.whereToWatch.length > 0 && (
            <div className="px-6 md:px-10 py-6 bg-[#181818] border-b border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Heading same looking and size as Episodes heading (no official sources or providers label) */}
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-display">
                  Where to Watch
                </h3>

                {/* Where to Watch buttons: text before, logo matching height, text after, reduced gap, no external link icon */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {show.whereToWatch.map((item, idx) => {
                    const customBg = item.bgColor || 'rgba(255, 255, 255, 0.12)';
                    const customText = item.textColor || '#ffffff';
                    const prefix = item.textBefore !== undefined ? item.textBefore : 'Watch on';
                    const suffix = item.textAfter !== undefined ? item.textAfter : (item.name || item.provider);

                    return (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: customBg,
                          color: customText
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[6px] text-sm md:text-base font-bold tracking-normal transition-all duration-200 hover:scale-105 hover:brightness-110 shadow-lg cursor-pointer border-0"
                      >
                        {/* Text before image */}
                        {prefix && (
                          <span className="whitespace-nowrap font-bold tracking-tight">
                            {prefix}
                          </span>
                        )}

                        {/* Image link: fixed height matching text (h-5), auto width matching aspect ratio, no cutting */}
                        {item.logoUrl ? (
                          <img
                            src={item.logoUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-5 w-auto max-w-[80px] object-contain shrink-0"
                          />
                        ) : item.provider === 'youtube' ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0" />
                        ) : item.provider === 'netflix' ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0" />
                        ) : item.provider === 'prime' ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-blue-500 shrink-0" />
                        ) : item.provider === 'tabii' ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : null}

                        {/* Text after image */}
                        {suffix && (
                          <span className="whitespace-nowrap font-bold tracking-tight">
                            {suffix}
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. EPISODES SECTION (Exact Copy of Screenshot 2) */}
          {show.type === 'series' && show.hasEpisodicContent !== false && seasons.length > 0 && (
            <div className="px-6 md:px-10 py-8 bg-[#181818] border-b border-white/10">
              {/* Header: "Episodes" on left + Season Selector Dropdown on right */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight font-display">
                  Episodes
                </h3>

                {/* Season Dropdown */}
                {seasons.length > 1 ? (
                  <div className="relative">
                    <button
                      onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                      className="bg-[#242424] hover:bg-[#2e2e2e] border border-white/20 text-white font-semibold text-sm px-4 py-2 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Season {selectedSeasonNumber}</span>
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {isSeasonDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-[#242424] border border-white/20 rounded-md shadow-2xl py-1 z-50">
                        {seasons.map((s) => (
                          <button
                            key={s.seasonNumber}
                            onClick={() => {
                              setSelectedSeasonNumber(s.seasonNumber);
                              setIsSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer flex items-center justify-between ${
                              s.seasonNumber === selectedSeasonNumber
                                ? 'bg-white/10 text-white font-bold'
                                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span>Season {s.seasonNumber}</span>
                            <span className="text-xs text-zinc-500">
                              ({s.episodes.length} Ep)
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#242424] border border-white/15 text-white font-semibold text-sm px-4 py-2 rounded-md">
                    <span>Season 1</span>
                  </div>
                )}
              </div>

              {/* Episodes List Rows (Exact Copy of Screenshot 2) */}
              <div className="space-y-3">
                {currentSeason.episodes.map((ep) => {
                  const isCurrent =
                    activePlaybackSource === 'episode' &&
                    selectedEpisode?.id === ep.id;

                  return (
                    <div
                      key={ep.id}
                      onClick={() => handlePlayEpisode(ep)}
                      className={`p-3.5 sm:p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all border ${
                        isCurrent
                          ? 'bg-[#2a2a2a] border-white/25 shadow-lg'
                          : 'bg-transparent border-transparent hover:bg-[#222222] hover:border-white/10'
                      }`}
                    >
                      {/* Large Episode Number on Left */}
                      <span className="text-xl md:text-2xl font-bold text-zinc-400 w-6 text-center shrink-0">
                        {ep.episodeNumber}
                      </span>

                      {/* Episode Thumbnail */}
                      <div className="w-28 sm:w-36 md:w-44 aspect-video rounded-md overflow-hidden relative shrink-0 bg-black shadow-md group/thumb">
                        <MediaImage
                          src={ep.thumbnailUrl}
                          fallbackTitle={ep.title || `Episode ${ep.episodeNumber}`}
                          fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-2 text-center select-none"
                          fallbackTextClassName="text-white/95 font-semibold text-xs leading-tight line-clamp-2 break-words font-sans"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-black/70 border border-white/60 flex items-center justify-center">
                            <svg className="w-4 h-4 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                              <polygon points="6,4 20,12 6,20" />
                            </svg>
                          </div>
                        </div>

                        {/* Red progress line under watched episode thumbnail (Matching Image 4) */}
                        {(() => {
                          const epKey = ep.id || `s${ep.seasonNumber || 1}e${ep.episodeNumber}`;
                          const epProg = watchProgress?.episodesProgress?.[epKey];
                          const percent = epProg?.progressPercent || (watchProgress?.episodeNumber === ep.episodeNumber && watchProgress?.seasonNumber === (ep.seasonNumber || 1) ? watchProgress.progressPercent : 0);
                          if (percent > 0) {
                            return (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#404040]/80 z-20">
                                <div
                                  className="h-full bg-[#e50914]"
                                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                />
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Title, Duration on right, and Synopsis */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm md:text-base font-bold text-white truncate">
                              {ep.title}
                            </h4>
                            {ep.subheading && (
                              <p className="text-xs text-zinc-400 font-medium truncate mt-0.5">
                                {ep.subheading}
                              </p>
                            )}
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-zinc-400 shrink-0">
                            {ep.duration}
                          </span>
                        </div>
                        {ep.synopsis && (
                          <p className="text-xs md:text-sm text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                            {ep.synopsis}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. TRAILERS & MORE SECTION (Placed BEFORE More Like This as requested) */}
          <div className="px-6 md:px-10 py-6 bg-[#181818] border-b border-white/10">
            <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight font-display">
              Trailers & More
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {trailersList.map((trailer) => (
                <div
                  key={trailer.id}
                  onClick={() => handlePlayClip(trailer)}
                  className="cursor-pointer group space-y-2"
                >
                  <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative shadow-md">
                    {/* Poster thumbnail without zoom */}
                    <MediaImage
                      src={trailer.thumbnailUrl}
                      fallbackTitle={trailer.title}
                      fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none"
                      className="w-full h-full object-cover"
                    />
                    {/* Centered Circular White Ring Play Button */}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-black/60 flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                          <polygon points="6,4 20,12 6,20" />
                        </svg>
                      </div>
                    </div>
                    {/* Time duration badge: reduced dark background, 75% transparency (25% opacity), zero blur */}
                    {trailer.duration && (
                      <span className="absolute bottom-2 right-2 bg-black/25 px-2 py-0.5 rounded text-[11px] font-semibold text-white shadow-sm border border-white/10">
                        {trailer.duration}
                      </span>
                    )}
                  </div>
                  {/* Clean white title - never red on hover */}
                  <h5 className="text-sm md:text-base font-bold text-white group-hover:text-white leading-snug">
                    {trailer.title}
                  </h5>
                </div>
              ))}
            </div>
          </div>

          {/* 5. MORE LIKE THIS SECTION (Exact UI matching screenshot, after Trailers & More) */}
          {matchingRelatedShows.length > 0 && (
            <div className="px-6 md:px-10 pt-8 pb-4 bg-[#181818]">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight font-display">
                More Like This
              </h3>

              {/* Cards Grid: 3 columns matching screenshot (1 on mobile, 2 on tablet, 3 on desktop) - max 9 titles when expanded */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(isMoreLikeThisExpanded ? matchingRelatedShows.slice(0, 9) : matchingRelatedShows.slice(0, 3)).map((relShow) => {
                  const isSaved = localWatchlist.includes(relShow.id);

                  return (
                    <div
                      key={relShow.id}
                      onClick={() => handleSelectRelatedShow(relShow)}
                      className="bg-[#2f2f2f] hover:bg-[#383838] rounded-md overflow-hidden flex flex-col shadow-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer group/card"
                    >
                      {/* Card Thumbnail - No hover zoom, no title PNG/text overlaid */}
                      <div className="aspect-video w-full bg-black relative overflow-hidden">
                        <MediaImage
                          src={relShow.posterLandscapeUrl || relShow.backdropUrl}
                          fallbackTitle={relShow.title}
                          fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none"
                          className="w-full h-full object-cover"
                        />
                        {/* Season / episode / duration badge: increased font size, reduced boldness, zero blur */}
                        <span className="absolute top-2.5 right-2.5 text-sm sm:text-[14.5px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                          {relShow.durationOrSeasons}
                        </span>
                      </div>

                      {/* Card Body & Metadata row (Exact matching screenshot) */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                              <span className="border border-white/40 px-1 py-0.2 rounded text-[11px] font-bold text-white">
                                {relShow.maturityRating}
                              </span>
                              <span className="border border-white/40 px-1 py-0.2 rounded text-[10px] font-bold text-white">
                                HD
                              </span>
                              <span className="text-xs text-zinc-300 ml-0.5">
                                {relShow.releaseYear.split('-')[0].trim()}
                              </span>
                            </div>

                            {/* Circular Watchlist Save button (+) / (✓) - No animation */}
                            <button
                              onClick={(e) => handleToggleCardWatchlist(e, relShow.id)}
                              className="w-9 h-9 rounded-full border-2 border-white/40 hover:border-white bg-[#181818]/60 text-white flex items-center justify-center cursor-pointer"
                              aria-label={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                            >
                              {isSaved ? (
                                <Check className="w-5 h-5 text-white stroke-[2.5]" />
                              ) : (
                                <Plus className="w-5 h-5 text-white" />
                              )}
                            </button>
                          </div>

                          {/* Synopsis text (3 lines truncated, gray) */}
                          <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-snug mt-2">
                            {relShow.synopsis || relShow.shortDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Centered Divider with Circular Dropdown Button (Exact matching screenshot) */}
              {matchingRelatedShows.length > 3 && (
                <div className="relative mt-8 mb-2 flex items-center justify-center">
                  {/* Subtle horizontal line */}
                  <div className="w-full h-px bg-white/20" />

                  {/* Circular chevron button centered on the line */}
                  <button
                    onClick={() => setIsMoreLikeThisExpanded((prev) => !prev)}
                    className="absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-white/40 hover:border-white bg-[#181818] text-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                    aria-label={isMoreLikeThisExpanded ? "Show less" : "Show more"}
                  >
                    <ChevronDown
                      className={`w-5 h-5 text-white transition-transform duration-300 ${
                        isMoreLikeThisExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
              </>
            )}
          </div>
          </div> {/* End desktop/tablet hidden md:block */}

          {/* ===================== MOBILE LAYOUT (REDESIGNED FOR MOBILE ONLY) ===================== */}
          <div
            ref={mobileModalContainerRef}
            onTouchStart={handleMobilePageTouchStart}
            onTouchMove={handleMobilePageTouchMove}
            onTouchEnd={handleMobilePageTouchEnd}
            onTouchCancel={handleMobilePageTouchEnd}
            style={{
              transform: mobileCollapseTransform
                ? `translate3d(${mobileCollapseTransform.dx}px, ${mobileCollapseTransform.dy}px, 0) scale(${mobileCollapseTransform.scale})`
                : mobileDragY > 0
                ? `translate3d(0, ${mobileDragY}px, 0)`
                : undefined,
              opacity: mobileCollapseTransform
                ? mobileCollapseTransform.opacity
                : isMobileOpeningHidingContent
                ? 0
                : 1,
              borderRadius: mobileCollapseTransform
                ? mobileCollapseTransform.animType === 'slide_right'
                  ? '0px'
                  : '14px'
                : mobileDragY > 0
                ? `${Math.min(20, mobileDragY / 6)}px`
                : '0px',
              overflow: mobileCollapseTransform || mobileDragY > 0 ? 'hidden' : undefined,
              transformOrigin: 'center top',
              transition: isMobileDragging
                ? 'none'
                : mobileCollapseTransform?.animType === 'slide_right'
                ? 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease-out'
                : mobileCollapseTransform?.animType === 'slide_down'
                ? 'transform 230ms cubic-bezier(0.22, 1, 0.36, 1)'
                : mobileCollapseTransform?.animType === 'fade_fast'
                ? 'opacity 90ms ease-out'
                : isMobileOpeningHidingContent
                ? 'opacity 140ms ease-out 180ms'
                : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), border-radius 200ms ease, opacity 140ms ease-out'
            }}
            className="block md:hidden bg-black min-h-[100dvh] pb-14 relative flex flex-col flex-1"
          >
            {/* 1. Mobile Trailer Video Player Container (Starts at top of screen) */}
            <div
              ref={mobileHeroBannerRef}
              onClick={handleMobilePlayerTap}
              className="relative aspect-video w-full bg-black overflow-hidden select-none cursor-pointer shrink-0"
            >
              {/* Back button: unified clean white borderless chevron, triggers direct collapse/slide-right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerMobileClose('back_button', false);
                }}
                className="absolute top-3 left-2.5 z-30 p-1 bg-transparent hover:bg-transparent shadow-none text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                aria-label="Back"
              >
                <ChevronLeft className="w-7 h-7 stroke-[2.2] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
              </button>

              {/* Top-Right Mute Button: reduced opacity, no container border */}
              {currentVideoSrc && hasStartedTrailer && !isMobileTrailerEnded && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMobileMute(e);
                  }}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 border-0 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  aria-label="Toggle mute"
                >
                  {isMobileTrailerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Mobile Trailer Video Element */}
              <video
                ref={mobileVideoRef}
                src={currentVideoSrc}
                poster={modalBackdropSrc}
                playsInline
                muted={isMobileTrailerMuted}
                onWaiting={() => setIsMobileTrailerLoading(true)}
                onPlaying={() => {
                  setIsMobileTrailerLoading(false);
                  setIsMobileTrailerPlaying(true);
                }}
                onSeeking={() => setIsMobileTrailerLoading(true)}
                onSeeked={() => setIsMobileTrailerLoading(false)}
                onTimeUpdate={() => {
                  if (mobileVideoRef.current) {
                    mobileSavedTimeRef.current = mobileVideoRef.current.currentTime;
                    setMobileTrailerCurrentTime(mobileVideoRef.current.currentTime);
                    if (!mobileTrailerDuration && mobileVideoRef.current.duration) {
                      setMobileTrailerDuration(mobileVideoRef.current.duration);
                    }
                  }
                }}
                onLoadedMetadata={() => {
                  if (mobileVideoRef.current) {
                    setMobileTrailerDuration(mobileVideoRef.current.duration);
                  }
                }}
                onEnded={() => {
                  clearMobileControlsTimer();
                  clearMobilePausePosterTimer();
                  setShowPosterAfterPause(false);
                  mobileSavedTimeRef.current = 0;
                  setIsMobileTrailerEnded(true);
                  setIsMobileTrailerPlaying(false);
                  setIsMobileTrailerControlsVisible(true);
                  setIsMobileTrailerLoading(false);
                }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  hasStartedTrailer && !isMobileTrailerEnded && !showPosterAfterPause ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Poster Layer when preview has not started, after preview ended, or 2s after pausing */}
              {(!hasStartedTrailer || isMobileTrailerEnded || showPosterAfterPause) && (
                <div className={`absolute inset-0 w-full h-full z-10 pointer-events-none ${showPosterAfterPause ? 'animate-in fade-in duration-300' : ''}`}>
                  <MediaImage
                    src={modalBackdropSrc}
                    fallbackTitle={show.title}
                    fallbackClassName="w-full h-full bg-black flex items-center justify-center p-4 text-center select-none"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Persistent Seamless Bottom Merge Glare into pure black page base (taller upper feather, softer bottom density) */}
              <div
                className="absolute inset-x-0 bottom-0 h-28 pointer-events-none z-20"
                style={{
                  background:
                    'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.72) 12%, rgba(0,0,0,0.44) 32%, rgba(0,0,0,0.22) 56%, rgba(0,0,0,0.07) 80%, transparent 100%)'
                }}
              />

              {/* Bottom-Left Title Logo (parallel to bottom-right Play button, bounded away from controls) */}
              <div className="absolute bottom-2.5 left-4 z-30 pointer-events-none max-w-[calc(100%-78px)] flex items-end">
                {show.titleLogoUrl ? (
                  <img
                    src={show.titleLogoUrl}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="min-h-[34px] h-10 sm:h-12 max-h-12 max-w-[235px] sm:max-w-[280px] w-auto object-contain object-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] select-none"
                  />
                ) : (
                  <h1 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                    {show.title}
                  </h1>
                )}
              </div>

              {/* Compact Bottom-Right Preview Control: Reduced opacity Play / Pause / Reload */}
              {currentVideoSrc && (
                <div className="absolute bottom-3 right-3 z-30 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMobileTrailerEnded) {
                        handleMobileTrailerReplay(e);
                      } else if (!hasStartedTrailer) {
                        handleStartMobileTrailer(e);
                      } else {
                        handleToggleMobileTrailerPlay(e);
                      }
                    }}
                    className="w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white border border-white/15 flex items-center justify-center cursor-pointer shadow-md active:scale-95 transition-transform"
                    aria-label={
                      isMobileTrailerEnded
                        ? 'Replay preview'
                        : isMobileTrailerPlaying
                        ? 'Pause preview'
                        : 'Play preview'
                    }
                  >
                    {isMobileTrailerLoading ? (
                      <div className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                    ) : isMobileTrailerEnded ? (
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                    ) : isMobileTrailerPlaying ? (
                      <svg className="w-3.5 h-3.5 fill-white text-white" viewBox="0 0 24 24">
                        <rect x="5" y="4" width="4.8" height="16" rx="1" />
                        <rect x="14.2" y="4" width="4.8" height="16" rx="1" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                        <polygon points="6,4 20,12 6,20" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* 2. Metadata & Badges + Mobile Lower Sections (animate smoothly below flying top image during opening) */}
            <div
              style={
                mobileLowerContentStyle
                  ? {
                      opacity: mobileLowerContentStyle.opacity,
                      transform: mobileLowerContentStyle.transform,
                      transition: mobileLowerContentStyle.transition
                    }
                  : undefined
              }
              className="flex flex-col flex-1 bg-black"
            >
            <div className="px-4 pt-1.5 pb-1">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-white/90 mt-2 mb-2">
                <span>{show.releaseYear.split('-')[0].trim()}</span>
                <span className="px-1.5 py-0.5 rounded border border-white/40 text-[10px] font-bold text-white leading-none">
                  {show.maturityRating}
                </span>
                <span>{durationOrSeasonText}</span>
                {isTop10 && (
                  <div className="inline-flex items-center gap-1.5">
                    <div className="bg-[#e50914] text-white text-[8px] font-black px-1 py-0.5 rounded-xs leading-none flex flex-col items-center justify-center font-display">
                      <span>TOP</span>
                      <span>10</span>
                    </div>
                    <span className="text-white text-xs font-bold font-display">
                      {top10Rank
                        ? `No. ${top10Rank} in ${show.type === 'movie' ? 'Movies' : 'Series'} Today`
                        : `Top 10 in ${show.type === 'movie' ? 'Movies' : 'Series'} Today`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Watch Progress Line Indicator above Resume Button on Mobile */}
            {watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) && (
              <div className="w-full px-4 pt-1 pb-1 flex flex-col gap-1 select-none">
                {watchProgress.episodeNumber && (
                  <div className="text-white/90 text-xs font-semibold truncate">
                    S{watchProgress.seasonNumber || 1}:E{watchProgress.episodeNumber} {watchProgress.episodeTitle ? `"${watchProgress.episodeTitle}"` : ''}
                  </div>
                )}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 h-[2.5px] bg-white/25 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#e50914] rounded-full"
                      style={{ width: `${Math.min(100, Math.max(0, watchProgress.progressPercent))}%` }}
                    />
                  </div>
                  <span className="text-zinc-300 font-medium text-xs whitespace-nowrap leading-none">
                    {formatProgressTime(watchProgress.currentTime, watchProgress.duration)}
                  </span>
                </div>
              </div>
            )}

            {/* 3. Action Buttons Row: Fixed gap & icon spacing so "Resume" never squeezes Like, My List, Share, Info */}
            <div className="w-full px-4 py-2.5 overflow-x-auto no-scrollbar touch-pan-x">
              <div className="flex items-center justify-between gap-4 w-max min-w-full">
                <button
                  onClick={handlePlayButton}
                  className="pl-4 pr-5 sm:pl-5 sm:pr-6 py-2.5 sm:py-3 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black font-bold text-base flex items-center gap-1.5 shadow-xl cursor-pointer transition-transform shrink-0"
                  aria-label={`${watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) ? 'Resume' : 'Play'} ${show.title}`}
                >
                  <svg className="w-6 h-6 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span className="tracking-wide whitespace-nowrap">
                    {watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt) ? 'Resume' : 'Play'}
                  </span>
                </button>

                {/* Like, My List, Share, Info keep identical fixed gap & slot width; compact larger icons when labels hidden */}
                {(() => {
                  const hideActionLabels = Boolean(adminSettings.hideMobileDetailActionLabels);
                  return (
                    <div className={`flex items-center shrink-0 ${hideActionLabels ? 'gap-2.5 sm:gap-3.5' : 'gap-4 sm:gap-5'}`}>
                      {/* Reaction Button (Thumbs or Animated Emoji + Hold Pill) */}
                      <MobileReactionButton
                        showId={show.id}
                        styleMode={adminSettings.mobileLikeButtonStyle || 'thumbs'}
                        isLiked={isLiked}
                        onToggleLike={handleLikeAction}
                        hideLabel={hideActionLabels}
                      />

                      {/* Add to List */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(show.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer shrink-0 py-1 ${
                          hideActionLabels ? 'w-9' : 'w-11'
                        }`}
                        aria-label="My List"
                      >
                        {isInWatchlist ? (
                          <Check className={`${hideActionLabels ? 'w-6 h-6' : 'w-5 h-5'} text-emerald-400 stroke-[2.5]`} />
                        ) : (
                          <Plus className={`${hideActionLabels ? 'w-6 h-6' : 'w-5 h-5'} text-white stroke-[2]`} />
                        )}
                        {!hideActionLabels && <span className="text-[10px] font-medium text-zinc-300">My List</span>}
                      </button>

                      {/* Share */}
                      <button
                        onClick={handleShare}
                        className={`flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer shrink-0 py-1 ${
                          hideActionLabels ? 'w-9' : 'w-11'
                        }`}
                        aria-label="Share"
                      >
                        {copyFeedback ? (
                          <Check className={`${hideActionLabels ? 'w-6 h-6' : 'w-5 h-5'} text-emerald-400 stroke-[2.5]`} />
                        ) : (
                          <ShareArrowIcon className={`${hideActionLabels ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
                        )}
                        {!hideActionLabels && <span className="text-[10px] font-medium text-zinc-300">Share</span>}
                      </button>

                      {/* More Info */}
                      <button
                        onClick={() => {
                          if (mobileVideoRef.current && !mobileVideoRef.current.paused) {
                            clearMobilePausePosterTimer();
                            setShowPosterAfterPause(false);
                            mobileSavedTimeRef.current = mobileVideoRef.current.currentTime;
                            mobileVideoRef.current.pause();
                            setIsMobileTrailerPlaying(false);
                            mobilePausePosterTimerRef.current = window.setTimeout(() => {
                              setShowPosterAfterPause(true);
                              mobilePausePosterTimerRef.current = null;
                            }, 2000);
                          }
                          setIsMobileInfoPageOpen(true);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer shrink-0 py-1 ${
                          hideActionLabels ? 'w-9' : 'w-11'
                        }`}
                        aria-label="More Info"
                      >
                        <Info className={`${hideActionLabels ? 'w-6 h-6' : 'w-5 h-5'} text-white stroke-[2]`} />
                        {!hideActionLabels && <span className="text-[10px] font-medium text-zinc-300">Info</span>}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Where to Watch below Action Buttons Row for series with episode section turned off */}
            {hasWhereToWatch && show.type === 'series' && !hasEpisodes && show.whereToWatch && (
              <div className="px-4 pt-1 pb-2 space-y-2">
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Where to Watch</p>
                <div className="flex flex-wrap items-center gap-2">
                  {show.whereToWatch.map((item, idx) => {
                    const customBg = item.bgColor || 'rgba(255, 255, 255, 0.12)';
                    const customText = item.textColor || '#ffffff';
                    const prefix = item.textBefore !== undefined ? item.textBefore : 'Watch on';
                    const suffix = item.textAfter !== undefined ? item.textAfter : (item.name || item.provider);
                    return (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ backgroundColor: customBg, color: customText }}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-transform"
                      >
                        {prefix && <span className="whitespace-nowrap font-bold">{prefix}</span>}
                        {item.logoUrl && (
                          <img src={item.logoUrl} alt="" referrerPolicy="no-referrer" className="h-4 w-auto max-w-[68px] object-contain shrink-0" />
                        )}
                        {suffix && <span className="whitespace-nowrap font-bold">{suffix}</span>}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Page Navigator / Tabs Strip */}
            <div className="px-4 flex items-center border-b border-white/10 mt-2">
              {mobileTabs.map((tab) => {
                const isActive = mobileActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setMobileActiveTab(tab.id as any)}
                    className={`relative py-3 px-3 text-xs sm:text-sm font-bold tracking-tight transition-colors cursor-pointer mr-2 ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute inset-x-0 bottom-0 h-0.75 bg-red-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 5. Horizontal Swipeable Tab Content Track */}
            <div
              className="w-full overflow-hidden touch-pan-y"
              onTouchStart={handleMobileTabTouchStart}
              onTouchMove={handleMobileTabTouchMove}
              onTouchEnd={handleMobileTabTouchEnd}
              onTouchCancel={handleMobileTabTouchEnd}
            >
              <div
                className="flex items-start w-full will-change-transform"
                style={{
                  transform: `translate3d(calc(-${activeMobileTabIdx * 100}% + ${mobileTabSwipeOffset}px), 0, 0)`,
                  transition: isSwipingMobileTab ? 'none' : 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {mobileTabs.map((tab) => {
                  const isActivePanel = tab.id === mobileActiveTab;
                  const isPanelCollapsed = !isActivePanel && !isSwipingMobileTab;
                  const slideClass = isPanelCollapsed
                    ? 'w-full shrink-0 h-0 overflow-hidden pointer-events-none'
                    : !isActivePanel && isSwipingMobileTab
                    ? 'w-full shrink-0 max-h-[75vh] overflow-hidden'
                    : 'w-full shrink-0';

                  if (tab.id === 'episodes' && hasEpisodes) {
                    return (
                      <div key="panel-episodes" className={`${slideClass} px-4 py-4 space-y-4`}>
                        {/* Season selector on left, episode count on right */}
                        <div className="flex items-center justify-between">
                          {seasons.length > 1 ? (
                            <button
                              onClick={() => setIsMobileSeasonDropdownOpen(true)}
                              className="bg-[#242424] hover:bg-[#2c2c2c] border border-white/15 text-white font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors active:scale-95"
                            >
                              <span>Season {selectedSeasonNumber}</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="bg-[#242424] border border-white/15 text-white font-semibold text-xs px-3 py-1.5 rounded-md">
                              <span>Season 1</span>
                            </div>
                          )}

                          <span className="text-xs font-semibold text-zinc-400">
                            {currentSeason.episodes.length} Episodes
                          </span>
                        </div>

                        <div className="space-y-3">
                          {currentSeason.episodes.map((ep) => {
                            const isCurrent = activePlaybackSource === 'episode' && selectedEpisode?.id === ep.id;
                            return (
                              <div
                                key={ep.id}
                                onClick={() => handlePlayEpisode(ep)}
                                className={`p-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all border ${
                                  isCurrent
                                    ? 'bg-[#252525] border-white/20 shadow-md'
                                    : 'bg-transparent border-transparent hover:bg-white/5'
                                }`}
                              >
                                <span className="text-lg font-bold text-zinc-400 w-5 text-center shrink-0">
                                  {ep.episodeNumber}
                                </span>

                                <div className="w-[141px] sm:w-[158px] aspect-video rounded-md overflow-hidden relative shrink-0 bg-black shadow-md">
                                  <MediaImage
                                    src={ep.thumbnailUrl}
                                    fallbackTitle={ep.title || `Episode ${ep.episodeNumber}`}
                                    fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-2 text-center select-none"
                                    fallbackTextClassName="text-white/95 font-semibold text-xs leading-tight line-clamp-2 break-words font-sans"
                                    className="w-full h-full object-cover"
                                  />
                                  {(() => {
                                    const epKey = ep.id || `s${ep.seasonNumber || 1}e${ep.episodeNumber}`;
                                    const epProg = watchProgress?.episodesProgress?.[epKey];
                                    const percent = epProg?.progressPercent || (watchProgress?.episodeNumber === ep.episodeNumber && watchProgress?.seasonNumber === (ep.seasonNumber || 1) ? watchProgress.progressPercent : 0);
                                    if (percent > 0) {
                                      return (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#404040]/80 z-20">
                                          <div
                                            className="h-full bg-[#e50914]"
                                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                          />
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>

                                <div className="flex-1 min-w-0 pr-1">
                                  <h4 className="text-sm font-bold text-white leading-snug break-words">
                                    {ep.title}
                                  </h4>
                                  <p className="text-xs text-zinc-400 font-medium mt-1">
                                    {ep.duration}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (tab.id === 'trailers') {
                    return (
                      <div key="panel-trailers" className={`${slideClass} px-4 py-4 space-y-4`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {trailersList.map((trailer) => (
                            <div
                              key={trailer.id}
                              onClick={() => handlePlayClip(trailer)}
                              className="cursor-pointer space-y-2 group"
                            >
                              <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative shadow-md">
                                <MediaImage
                                  src={trailer.thumbnailUrl}
                                  fallbackTitle={trailer.title}
                                  fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-3 text-center select-none"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                                  <div className="w-10 h-10 rounded-full border-2 border-white bg-black/60 flex items-center justify-center shadow-lg">
                                    <svg className="w-4 h-4 fill-white text-white ml-0.5" viewBox="0 0 24 24">
                                      <polygon points="6,4 20,12 6,20" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <h4 className="font-bold text-white truncate max-w-[220px]">{trailer.title}</h4>
                                <span className="text-zinc-400 font-medium">{trailer.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key="panel-more" className={`${slideClass} px-2.5 sm:px-4 py-4`}>
                      <h3 className="text-lg font-bold text-white font-display mb-3">More Like This</h3>
                      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                        {matchingRelatedShows.map((relShow) => (
                          <div
                            key={relShow.id}
                            data-show-id={relShow.id}
                            onClick={() => handleSelectRelatedShow(relShow)}
                            className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                          >
                            <MediaImage
                              src={relShow.posterVerticalUrl || relShow.posterUrl || relShow.posterLandscapeUrl}
                              fallbackTitle={relShow.title}
                              fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-2.5 text-center select-none"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    {/* 6. Info Page Modal / Sheet at Root Level (Triggered by (i) button, covers 75% of screen with slick dark overlay without needing to scroll) */}
    {isMobileInfoPageOpen && (
      <div
        className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end p-0 animate-in fade-in duration-200"
        onClick={() => setIsMobileInfoPageOpen(false)}
      >
        <div
          ref={infoPageContainerRef}
          style={{
            transform: infoPageDragY > 0 ? `translateY(${infoPageDragY}px)` : undefined,
            transition: isInfoPageDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="bg-[#181818] border-t border-white/15 rounded-t-2xl px-5 pt-1.5 h-[75vh] max-h-[75vh] overflow-y-auto space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-14 custom-scrollbar relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Swiping bar does NOT stick (moves naturally with content when user scrolls down) */}
          <div
            className="pt-1 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleInfoPageTouchStart}
            onTouchMove={handleInfoPageTouchMove}
            onTouchEnd={handleInfoPageTouchEnd}
            onTouchCancel={handleInfoPageTouchEnd}
          >
            <div className="w-10 h-1 bg-white/70 hover:bg-white/90 rounded-full shadow-sm" />
          </div>

          {/* ONLY cross button sticks to top right with NO background strip */}
          <div className="sticky top-2 z-40 pointer-events-none flex justify-end -mb-8">
            <button
              onClick={() => setIsMobileInfoPageOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white flex items-center justify-center cursor-pointer transition-colors pointer-events-auto shadow-md"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Title */}
          <div className="pt-2 pb-1 border-b border-white/10 pr-8">
            <h3 className="text-base font-bold text-white font-display">About {show.title}</h3>
          </div>

          {/* Review Ratings (exact match to image_3157a629.png) */}
          <div className="space-y-1">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Review ratings</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white font-display">{ratingScore}</span>
              <span className="text-sm text-zinc-400 font-medium">out of</span>
              <span className="text-2xl font-black text-white font-display">10</span>
            </div>
            <div className="text-xs font-black text-amber-400 tracking-wider">IMDb</div>
            <div className="text-xs text-zinc-400">{reviewVotesText}</div>
          </div>

          {/* Where to Watch inside Info sheet ABOVE Cast row for series with episode section OR movies */}
          {hasWhereToWatch && (hasEpisodes || show.type === 'movie') && show.whereToWatch && (
            <div className="space-y-2 pt-1 border-t border-white/10">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Where to Watch</p>
              <div className="flex flex-wrap items-center gap-2">
                {show.whereToWatch.map((item, idx) => {
                  const customBg = item.bgColor || 'rgba(255, 255, 255, 0.12)';
                  const customText = item.textColor || '#ffffff';
                  const prefix = item.textBefore !== undefined ? item.textBefore : 'Watch on';
                  const suffix = item.textAfter !== undefined ? item.textAfter : (item.name || item.provider);
                  return (
                    <a
                      key={idx}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: customBg, color: customText }}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-transform"
                    >
                      {prefix && <span className="whitespace-nowrap font-bold">{prefix}</span>}
                      {item.logoUrl && (
                        <img src={item.logoUrl} alt="" referrerPolicy="no-referrer" className="h-4 w-auto max-w-[68px] object-contain shrink-0" />
                      )}
                      {suffix && <span className="whitespace-nowrap font-bold">{suffix}</span>}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cast (circular avatars matching image_3157a629.png) */}
          {show.cast && show.cast.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Cast</p>
              <div className="flex items-start gap-3 overflow-x-auto no-scrollbar py-1">
                {show.cast.map((actor) => (
                  <div
                    key={actor.id}
                    onClick={() => {
                      setIsMobileInfoPageOpen(false);
                      onSelectActor?.(actor);
                    }}
                    className="flex flex-col items-center text-center w-[calc((100vw-3rem)/3.42)] max-w-[105px] shrink-0 cursor-pointer group"
                  >
                    <img
                      src={actor.profileUrl}
                      alt={actor.name}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-full object-cover shadow-md active:scale-95 transition-transform"
                    />
                    <span className="text-xs font-bold text-white mt-1.5 leading-tight line-clamp-2 px-1">
                      {actor.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {show.categories && show.categories.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Categories</p>
              <div className="flex flex-wrap gap-2">
                {show.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/10"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Genres */}
          {show.genres && show.genres.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Genres</p>
              <div className="flex flex-wrap gap-2">
                {show.genres.map((g, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/10 text-white border border-white/10"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* In This Series / This Series Is */}
          {show.thisSeriesIs && show.thisSeriesIs.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                {show.type === 'movie' ? 'This Movie Is' : 'This Series Is'}
              </p>
              <div className="flex flex-wrap gap-2">
                {show.thisSeriesIs.map((trait, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-600/20 text-red-300 border border-red-500/30"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Synopsis */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Synopsis</p>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {show.synopsis || show.description || show.shortDescription}
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Mobile Season Selector Bottom Sheet Popup (Matching Image 4) */}
    {isMobileSeasonDropdownOpen && (
      <div
        className="fixed inset-0 z-[200] bg-black/40 flex flex-col justify-end animate-in fade-in duration-200"
        onClick={() => setIsMobileSeasonDropdownOpen(false)}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: seasonSheetDragY > 0 ? `translateY(${seasonSheetDragY}px)` : undefined,
            transition: isSeasonSheetDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          className="w-full bg-[#181818] border-t border-white/10 rounded-t-3xl px-6 pt-2 pb-[max(env(safe-area-inset-bottom),28px)] shadow-2xl animate-in slide-in-from-bottom duration-250 select-none max-h-[75vh] flex flex-col"
        >
          {/* Top swipeable pill handle */}
          <div
            className="w-full py-2 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleSeasonTouchStart}
            onTouchMove={handleSeasonTouchMove}
            onTouchEnd={handleSeasonTouchEnd}
            onTouchCancel={handleSeasonTouchEnd}
          >
            <div className="w-10 h-1 bg-zinc-500 hover:bg-zinc-400 rounded-full shrink-0" />
          </div>

          {/* Header: Title + Circular X Close button */}
          <div className="flex items-center justify-between pb-3 shrink-0">
            <h3 className="text-xl font-bold text-white tracking-tight">Select season</h3>
            <button
              onClick={() => setIsMobileSeasonDropdownOpen(false)}
              className="w-8 h-8 rounded-full bg-[#2c2c2c] hover:bg-[#383838] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Season List */}
          <div className="divide-y divide-white/[0.08] overflow-y-auto custom-scrollbar -mx-2 px-2">
            {seasons.map((s) => {
              const isSelected = s.seasonNumber === selectedSeasonNumber;
              return (
                <button
                  key={s.seasonNumber}
                  onClick={() => {
                    setSelectedSeasonNumber(s.seasonNumber);
                    setIsMobileSeasonDropdownOpen(false);
                  }}
                  className="w-full py-4 flex items-center justify-between text-left cursor-pointer group transition-colors"
                >
                  <div>
                    <p className="text-base font-semibold text-white group-hover:text-red-400 transition-colors">
                      Season {s.seasonNumber}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {s.episodes?.length || 0} episodes
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-white stroke-[2.5] shrink-0 ml-4" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* Dedicated Share Page / Modal */}
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      show={show}
      platformName={adminSettings?.platformName}
    />

    {/* Mobile Normal Feed Flying Poster Overlay (Opening & Direct-to-Card Collapse) */}
    {flyingPosterState && (
      <div
        className="fixed z-[95] overflow-hidden shadow-2xl pointer-events-none bg-black"
        style={{
          left: `${flyingPosterState.left}px`,
          top: `${flyingPosterState.top}px`,
          width: `${flyingPosterState.width}px`,
          height: `${flyingPosterState.height}px`,
          opacity: flyingPosterState.opacity,
          borderRadius: flyingPosterState.borderRadius,
          transition: `left ${flyingPosterState.transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), top ${flyingPosterState.transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), width ${flyingPosterState.transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), height ${flyingPosterState.transitionMs}ms cubic-bezier(0.22, 1, 0.36, 1), border-radius ${flyingPosterState.transitionMs}ms ease, opacity ${flyingPosterState.transitionMs}ms ease`
        }}
      >
        {flyingPosterState.cardPosterUrl && (
          <img
            src={flyingPosterState.cardPosterUrl}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {flyingPosterState.bannerPosterUrl && (
          <img
            src={flyingPosterState.bannerPosterUrl}
            alt={show.title}
            referrerPolicy="no-referrer"
            style={{
              opacity: flyingPosterState.showBannerLayer ? 1 : 0,
              transition: `opacity ${Math.round(flyingPosterState.transitionMs * 0.55)}ms ease ${flyingPosterState.showBannerLayer ? Math.round(flyingPosterState.transitionMs * 0.32) : 0}ms`
            }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </div>
    )}
  </>
);
};
