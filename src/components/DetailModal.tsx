import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Show, Episode, AdminSettings, CastMember, TrailerItem } from '../types';
import { ShowTitleLogo } from './ShowTitleLogo';
import { ShareModal } from './ShareModal';
import { normalizeActorKey } from '../utils/actorIndex';
import { attachHlsVideo } from '../utils/hlsHelper';
import {
  X,
  Play,
  Plus,
  Check,
  ThumbsUp,
  Volume2,
  VolumeX,
  ChevronDown,
  Share2,
  Tv,
  Film,
  Sparkles,
  ExternalLink,
  Clock,
  Calendar,
  Subtitles,
  Filter,
  Bookmark,
  ArrowLeft,
  Pause,
  RotateCcw,
  Download,
  Info
} from 'lucide-react';

interface DetailModalProps {
  show: Show | null;
  allShows?: Show[];
  adminSettings: AdminSettings;
  isInWatchlist: boolean;
  watchlist?: string[];
  onToggleWatchlist: (showId: string) => void;
  onClose: () => void;
  onSelectShow?: (show: Show) => void;
  onSelectActor?: (actor: CastMember) => void;
  onSelectGenre?: (genre: string) => void;
  onUpdateShowBlog?: (showId: string, updatedBlog: Show['blog']) => void;
  onWatchInFullPlayer?: (show: Show, episode?: Episode | null, trailer?: TrailerItem | null) => void;
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
}

export const DetailModal: React.FC<DetailModalProps> = ({
  show,
  allShows = [],
  adminSettings,
  isInWatchlist,
  watchlist = [],
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
  isFullPlayerOpen = false
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
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const [isTitleShrunk, setIsTitleShrunk] = useState<boolean>(false);
  const [modalBackdropSrc, setModalBackdropSrc] = useState<string>(
    show.backdropUrl || show.posterLandscapeUrl || ''
  );
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

  const [mobileActiveTab, setMobileActiveTab] = useState<'episodes' | 'trailers' | 'whereToWatch' | 'moreLikeThis'>(
    hasEpisodes ? 'episodes' : 'trailers'
  );
  const [isMobileInfoPageOpen, setIsMobileInfoPageOpen] = useState<boolean>(false);
  const [isMobileSeasonDropdownOpen, setIsMobileSeasonDropdownOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // Mobile trailer player state: does NOT autoplay, shows thumbnail with centered play button, replay on end
  const [hasStartedTrailer, setHasStartedTrailer] = useState<boolean>(false);
  const [isMobileTrailerPlaying, setIsMobileTrailerPlaying] = useState<boolean>(false);
  const [isMobileTrailerLoading, setIsMobileTrailerLoading] = useState<boolean>(false);
  const [isMobileTrailerEnded, setIsMobileTrailerEnded] = useState<boolean>(false);
  const [isMobileTrailerControlsVisible, setIsMobileTrailerControlsVisible] = useState<boolean>(true);
  const [mobileTrailerCurrentTime, setMobileTrailerCurrentTime] = useState<number>(0);
  const [mobileTrailerDuration, setMobileTrailerDuration] = useState<number>(0);
  const [isMobileTrailerMuted, setIsMobileTrailerMuted] = useState<boolean>(isMuted);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);

  const mobileControlsTimerRef = useRef<number | null>(null);

  const formatMobileTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const clearMobileControlsTimer = () => {
    if (mobileControlsTimerRef.current) {
      window.clearTimeout(mobileControlsTimerRef.current);
      mobileControlsTimerRef.current = null;
    }
  };

  const resetMobileControlsTimer = () => {
    clearMobileControlsTimer();
    mobileControlsTimerRef.current = window.setTimeout(() => {
      setIsMobileTrailerControlsVisible(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      clearMobileControlsTimer();
    };
  }, []);

  // Mobile Swipe/Drag-to-Dismiss Handler (Swiping down 30% of page height closes page)
  const [mobileDragY, setMobileDragY] = useState<number>(0);
  const [isMobileDragging, setIsMobileDragging] = useState<boolean>(false);
  const mobileTouchStartYRef = useRef<number | null>(null);
  const mobileModalContainerRef = useRef<HTMLDivElement>(null);

  const handleMobileTouchStart = (e: React.TouchEvent) => {
    mobileTouchStartYRef.current = e.touches[0].clientY;
    setIsMobileDragging(true);
  };

  const handleMobileTouchMove = (e: React.TouchEvent) => {
    if (mobileTouchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - mobileTouchStartYRef.current;
    if (deltaY > 0) {
      setMobileDragY(deltaY);
    } else {
      setMobileDragY(0);
    }
  };

  const handleMobileTouchEnd = () => {
    if (mobileTouchStartYRef.current === null) return;
    const modalHeight = mobileModalContainerRef.current?.offsetHeight || window.innerHeight;
    if (mobileDragY > modalHeight * 0.3) {
      onClose();
    }
    setMobileDragY(0);
    setIsMobileDragging(false);
    mobileTouchStartYRef.current = null;
  };

  const handleMobileMouseDown = (e: React.MouseEvent) => {
    mobileTouchStartYRef.current = e.clientY;
    setIsMobileDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (mobileTouchStartYRef.current === null) return;
      const deltaY = moveEvent.clientY - mobileTouchStartYRef.current;
      setMobileDragY(deltaY > 0 ? deltaY : 0);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (mobileTouchStartYRef.current !== null) {
        const deltaY = upEvent.clientY - mobileTouchStartYRef.current;
        const modalHeight = mobileModalContainerRef.current?.offsetHeight || window.innerHeight;
        if (deltaY > modalHeight * 0.3) {
          onClose();
        }
      }
      setMobileDragY(0);
      setIsMobileDragging(false);
      mobileTouchStartYRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
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
    setHasStartedTrailer(true);
    setIsMobileTrailerEnded(false);
    setIsMobileTrailerPlaying(true);
    setIsMobileTrailerLoading(true);
    setIsMobileTrailerControlsVisible(true);
    resetMobileControlsTimer();
    const v = mobileVideoRef.current;
    if (v) {
      v.muted = isMobileTrailerMuted;
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
      }).catch(() => {
        v.muted = true;
        setIsMobileTrailerMuted(true);
        v.play().then(() => {
          setIsMobileTrailerLoading(false);
        }).catch(() => {
          setIsMobileTrailerLoading(false);
        });
      });
    }
  };

  const handleToggleMobileTrailerPlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const v = mobileVideoRef.current;
    if (!v) return;
    if (!hasStartedTrailer) {
      handleStartMobileTrailer(e);
      return;
    }
    if (v.paused) {
      setIsMobileTrailerLoading(true);
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
        setIsMobileTrailerPlaying(true);
        setIsMobileTrailerControlsVisible(true);
        resetMobileControlsTimer();
      }).catch(() => {
        setIsMobileTrailerLoading(false);
      });
    } else {
      v.pause();
      setIsMobileTrailerPlaying(false);
      setIsMobileTrailerControlsVisible(true);
      resetMobileControlsTimer(); // Other controls hide after 2 seconds; progress bar and play button remain
    }
  };

  const handleMobileTrailerReplay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsMobileTrailerEnded(false);
    setHasStartedTrailer(true);
    setIsMobileTrailerPlaying(true);
    setIsMobileTrailerLoading(true);
    setIsMobileTrailerControlsVisible(true);
    resetMobileControlsTimer();
    const v = mobileVideoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().then(() => {
        setIsMobileTrailerLoading(false);
      }).catch(() => {
        setIsMobileTrailerLoading(false);
      });
    }
  };

  const handleMobilePlayerTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobileTrailerEnded) return;
    if (!isMobileTrailerControlsVisible) {
      setIsMobileTrailerControlsVisible(true);
      resetMobileControlsTimer();
    } else {
      handleToggleMobileTrailerPlay(e);
    }
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

  const handleMobileScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const v = mobileVideoRef.current;
    if (!v || !mobileTrailerDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pos * mobileTrailerDuration;
    setMobileTrailerCurrentTime(v.currentTime);
  };

  const mobileTabs = useMemo(() => {
    if (hasEpisodes) {
      return [
        { id: 'episodes' as const, label: 'Episodes' },
        { id: 'trailers' as const, label: 'Trailers' },
        { id: 'moreLikeThis' as const, label: 'More Like This' },
      ];
    } else {
      const list: Array<{ id: 'trailers' | 'whereToWatch' | 'moreLikeThis'; label: string }> = [
        { id: 'trailers', label: 'Trailers' },
      ];
      if (adminSettings.enableWhereToWatch && (show.whereToWatchEnabled !== false) && show.whereToWatch && show.whereToWatch.length > 0) {
        list.push({ id: 'whereToWatch', label: 'Where to Watch' });
      }
      list.push({ id: 'moreLikeThis', label: 'More Like This' });
      return list;
    }
  }, [hasEpisodes, adminSettings.enableWhereToWatch, show.whereToWatchEnabled, show.whereToWatch]);

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

    // If an episode other than episode 1 is explicitly selected, play that episode
    if (selectedEpisode && selectedEpisode.episodeNumber > 1 && onWatchInFullPlayer) {
      onWatchInFullPlayer(show, selectedEpisode);
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
      onWatchInFullPlayer(show, ep);
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
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-black/85 backdrop-blur-md animate-modal-backdrop custom-scrollbar outline-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center py-0 md:py-8 px-0 md:px-4 pointer-events-none">
        <div
          className="relative w-full md:max-w-[780px] bg-[#181818] border-0 rounded-none md:rounded-2xl overflow-hidden shadow-2xl animate-modal-content select-none pointer-events-auto min-h-0 pb-0"
          style={{
            boxShadow: `0 25px 60px -15px rgba(0,0,0,0.95), 0 0 40px ${show.ambientColor}35`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ===================== DESKTOP & TABLET LAYOUT (100% UNCHANGED) ===================== */}
          <div className="hidden md:block">
            {/* Floating Top-Right Controls (Close X Button) - Hidden when Cast or Blog view is active so no collision with their close buttons */}
            {!isCastViewOpen && !isBlogViewOpen && (
              <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-[#181818]/80 hover:bg-[#282828] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer shadow-lg backdrop-blur-md"
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
                    <img
                      src={show.blog.heroImage}
                      alt={show.title}
                      referrerPolicy="no-referrer"
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
              className="relative w-full aspect-[16/9] bg-[#181818] overflow-hidden cursor-pointer select-none"
              data-no-tooltip="true"
            >
            {/* Primary Base Layer: Backdrop Image (Guaranteed visible immediately upon opening modal) */}
            <img
              src={modalBackdropSrc}
              alt={show.title}
              referrerPolicy="no-referrer"
              data-no-tooltip="true"
              onError={() => {
                if (show.posterLandscapeUrl && modalBackdropSrc !== show.posterLandscapeUrl) {
                  setModalBackdropSrc(show.posterLandscapeUrl);
                }
              }}
              className="absolute inset-0 w-full h-full object-cover"
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
                className={`absolute inset-0 w-full h-full object-cover scale-102 z-10 transition-opacity duration-500 ${
                  isVideoPlaying && !isPausedByScroll ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Uniform smooth bottom glare matching Netflix - zero visible divider between hero preview and content */}
            <div className="absolute inset-x-0 bottom-0 h-40 sm:h-48 md:h-56 bg-gradient-to-t from-[#181818] via-[#181818]/80 via-35% via-[#181818]/20 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent pointer-events-none" />

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

              {/* Action Buttons Row */}
              <div className="flex items-center gap-3">
                {/* Big White Play Button: Immediately stops preview trailer in background, respects target link */}
                <button
                  id="modal-main-play-button"
                  ref={playButtonRef}
                  onClick={handlePlayButton}
                  className="pl-2.5 pr-3 sm:pl-3 sm:pr-3.5 py-1.5 sm:py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-[15px] sm:text-[17px] flex items-center gap-1 shadow-lg cursor-pointer tracking-wide transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  {/* Rounded Play symbol */}
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span className="tracking-wide">Play</span>
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
                    setIsLiked(!isLiked);
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
                  <Share2 className="w-4.5 h-4.5 text-white stroke-[2]" />
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
                        <img
                          src={ep.thumbnailUrl}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full bg-black/70 border border-white/60 flex items-center justify-center">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
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
                    <img
                      src={trailer.thumbnailUrl}
                      alt={trailer.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    {/* Centered Circular White Ring Play Button */}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-white bg-black/60 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-white text-white ml-0.5" />
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
                        <img
                          src={relShow.posterLandscapeUrl}
                          alt={relShow.title}
                          referrerPolicy="no-referrer"
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
            style={{
              transform: mobileDragY > 0 ? `translateY(${mobileDragY}px)` : undefined,
              transition: isMobileDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="block md:hidden bg-[#181818] min-h-0 pb-14 relative"
          >
            {/* Top Floating Controls: transparent back button with no border, transparent bar, no cross button */}
            <div className="sticky top-0 z-40 w-full bg-transparent pointer-events-none flex items-center justify-between px-3 pt-3 pb-1 select-none">
              {/* Left: Back button with transparent background and NO border */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-transparent hover:bg-white/10 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform border-0 pointer-events-auto"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-white drop-shadow" />
              </button>

              {/* Center: Transparent grab bar */}
              <div
                className="py-1 px-8 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none pointer-events-auto"
                onTouchStart={handleMobileTouchStart}
                onTouchMove={handleMobileTouchMove}
                onTouchEnd={handleMobileTouchEnd}
                onTouchCancel={handleMobileTouchEnd}
                onMouseDown={handleMobileMouseDown}
              >
                <div className="w-10 h-1 bg-transparent rounded-full" />
              </div>

              {/* Right: empty spacer (cross button removed as requested) */}
              <div className="w-9 h-9" />
            </div>

            {/* 1. Mobile Trailer Video Player Container */}
            <div
              onClick={handleMobilePlayerTap}
              className="relative aspect-video w-full bg-black overflow-hidden select-none cursor-pointer"
            >
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
                onCanPlay={() => setIsMobileTrailerLoading(false)}
                onSeeking={() => setIsMobileTrailerLoading(true)}
                onSeeked={() => setIsMobileTrailerLoading(false)}
                onTimeUpdate={() => {
                  if (mobileVideoRef.current) {
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
                  setIsMobileTrailerEnded(true);
                  setIsMobileTrailerPlaying(false);
                  setIsMobileTrailerControlsVisible(false);
                  setIsMobileTrailerLoading(false);
                }}
                className={`w-full h-full object-cover ${
                  hasStartedTrailer && !isMobileTrailerEnded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* State A: Initial Trailer Thumbnail with Centered Play Button (when trailer not yet started) */}
              {!hasStartedTrailer && !isMobileTrailerEnded && (
                <div
                  onClick={handleStartMobileTrailer}
                  className="absolute inset-0 w-full h-full cursor-pointer z-10"
                >
                  <img
                    src={modalBackdropSrc}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  {/* Clean white play button with exact recommendation cinema play symbol - shadow removed, reduced glare */}
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                    <svg className="w-13 h-13 fill-white text-white ml-1.5" viewBox="0 0 24 24">
                      <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Loading Spinner while video is buffering / loading */}
              {hasStartedTrailer && !isMobileTrailerEnded && isMobileTrailerLoading && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin shadow-lg" />
                </div>
              )}

              {/* State B: Centered Replay Button when trailer video ends (Over landscape poster, NOT black section) */}
              {isMobileTrailerEnded && (
                <div
                  onClick={handleMobileTrailerReplay}
                  className="absolute inset-0 w-full h-full cursor-pointer z-20"
                >
                  <img
                    src={modalBackdropSrc}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                    <RotateCcw className="w-10 h-10 text-white" />
                  </div>
                </div>
              )}

              {/* Centered Play / Pause Button (No shadow, no animation):
                  - When trailer is playing: disappears after 2 seconds when controls hide
                  - When trailer is paused: controls hide after 2 seconds, but play button still appears */}
              {hasStartedTrailer && !isMobileTrailerEnded && !isMobileTrailerLoading && (!isMobileTrailerPlaying || isMobileTrailerControlsVisible) && (
                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleMobileTrailerPlay(e);
                    }}
                    className="p-4 flex items-center justify-center text-white cursor-pointer pointer-events-auto"
                    aria-label="Pause or Play trailer"
                  >
                    {mobileVideoRef.current && !mobileVideoRef.current.paused ? (
                      <svg className="w-10 h-10 fill-white text-white" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="3.5" height="16" rx="0.5" fill="currentColor" />
                        <rect x="14.5" y="4" width="3.5" height="16" rx="0.5" fill="currentColor" />
                      </svg>
                    ) : (
                      <svg className="w-12 h-12 fill-white text-white ml-1" viewBox="0 0 24 24">
                        <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" fill="currentColor" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* Always-on bottom thin progress line when controls are hidden (pushed to bottom of player, WITHOUT knob) */}
              {!isMobileTrailerControlsVisible && hasStartedTrailer && !isMobileTrailerEnded && (
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 pointer-events-none z-20">
                  <div
                    className="h-full bg-red-600 transition-all duration-100"
                    style={{
                      width: `${
                        mobileTrailerDuration > 0
                          ? Math.min(100, Math.max(0, (mobileTrailerCurrentTime / mobileTrailerDuration) * 100))
                          : 0
                      }%`
                    }}
                  />
                </div>
              )}

              {/* State C: Controls Overlay while trailer is playing/paused & controls are visible (reduced glare) */}
              {hasStartedTrailer && !isMobileTrailerEnded && isMobileTrailerControlsVisible && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleMobileTrailerPlay(e);
                  }}
                  className="absolute inset-0 z-10 flex flex-col justify-end bg-black/15 pointer-events-auto"
                >
                  {/* Bottom Controls Area: Mute button pushed ABOVE progress bar, Scrubber bar + time info (reduced glare) */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 pb-2 pt-6 bg-gradient-to-t from-black/60 via-black/15 to-transparent relative"
                  >
                    {/* Mute/Unmute button: NO white border, NO animation */}
                    <div className="flex items-center justify-end mb-2 pr-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMobileMute(e);
                          resetMobileControlsTimer();
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 text-white hover:text-white/80 flex items-center justify-center cursor-pointer shadow"
                        aria-label="Toggle mute"
                      >
                        {isMobileTrailerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Red scrub line with circular handle & elapsed timestamp on right (matching screenshot 00:38) */}
                    <div className="flex items-center gap-3">
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMobileScrub(e);
                          resetMobileControlsTimer();
                        }}
                        className="relative flex-1 h-4 flex items-center cursor-pointer group/scrub"
                      >
                        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-600 rounded-full"
                            style={{
                              width: `${
                                mobileTrailerDuration > 0
                                  ? Math.min(100, Math.max(0, (mobileTrailerCurrentTime / mobileTrailerDuration) * 100))
                                  : 0
                              }%`
                            }}
                          />
                        </div>
                        <div
                          className="w-3.5 h-3.5 bg-red-600 rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-md pointer-events-none"
                          style={{
                            left: `${
                              mobileTrailerDuration > 0
                                ? Math.min(100, Math.max(0, (mobileTrailerCurrentTime / mobileTrailerDuration) * 100))
                                : 0
                            }%`
                          }}
                        />
                      </div>

                      {/* Time display on right: e.g. 00:38 */}
                      <span className="text-xs font-semibold text-white/95 shrink-0 select-none">
                        {formatMobileTime(mobileTrailerCurrentTime)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Title & First Line Badges (No HD or Spatial Audio badges, all badges in first line) */}
            <div className="px-4 pt-3 pb-1">
              <h1 className="text-2xl font-black text-white font-display tracking-tight leading-tight">
                {show.title}
              </h1>
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

            {/* 3. Action Buttons Row: Play on left; Like, Add to List, Share, Info spread across screen width (matching image_cb4b0d49.png) */}
            <div className="w-full px-4 py-2.5 overflow-x-auto no-scrollbar">
              <div className="flex items-center justify-between w-full min-w-[330px] gap-2.5 sm:gap-4">
                <button
                  onClick={handlePlayButton}
                  className="pl-4 pr-5 py-2 rounded-full bg-white hover:bg-white/90 active:scale-95 text-black font-bold text-sm flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform shrink-0"
                  aria-label={`Play ${show.title}`}
                >
                  <svg className="w-4.5 h-4.5 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span className="tracking-wide">Play</span>
                </button>

                {/* Like, My List, Share, Info spread with equal spacing across screen width */}
                <div className="flex-1 flex items-center justify-around gap-1 sm:gap-3">
                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLiked(!isLiked);
                    }}
                    className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer flex-1 py-1"
                    aria-label="Like"
                  >
                    <ThumbsUp
                      className={`w-5 h-5 transition-colors ${
                        isLiked ? 'text-red-500 fill-red-500 stroke-red-500' : 'text-white stroke-[2]'
                      }`}
                    />
                    <span className="text-[10px] font-medium text-zinc-300">Like</span>
                  </button>

                  {/* Add to List */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(show.id);
                    }}
                    className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer flex-1 py-1"
                    aria-label="My List"
                  >
                    {isInWatchlist ? (
                      <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                    ) : (
                      <Plus className="w-5 h-5 text-white stroke-[2]" />
                    )}
                    <span className="text-[10px] font-medium text-zinc-300">My List</span>
                  </button>

                  {/* Share */}
                  <button
                    onClick={handleShare}
                    className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer flex-1 py-1"
                    aria-label="Share"
                  >
                    {copyFeedback ? (
                      <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                    ) : (
                      <Share2 className="w-5 h-5 text-white stroke-[2]" />
                    )}
                    <span className="text-[10px] font-medium text-zinc-300">Share</span>
                  </button>

                  {/* More Info */}
                  <button
                    onClick={() => {
                      if (mobileVideoRef.current && !mobileVideoRef.current.paused) {
                        mobileVideoRef.current.pause();
                        setIsMobileTrailerPlaying(false);
                      }
                      setIsMobileInfoPageOpen(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer flex-1 py-1"
                    aria-label="More Info"
                  >
                    <Info className="w-5 h-5 text-white stroke-[2]" />
                    <span className="text-[10px] font-medium text-zinc-300">Info</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Page Navigator / Tabs Strip (Order: Episodes -> Trailers -> More Like This or Trailers -> Where to Watch -> More Like This) */}
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

            {/* 5. Tab Content: Episodes */}
            {mobileActiveTab === 'episodes' && hasEpisodes && (
              <div className="px-4 py-4 space-y-4">
                {/* Season selector on left, episode count on right */}
                <div className="flex items-center justify-between">
                  {seasons.length > 1 ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsMobileSeasonDropdownOpen(!isMobileSeasonDropdownOpen)}
                        className="bg-[#242424] hover:bg-[#2c2c2c] border border-white/15 text-white font-semibold text-xs px-3 py-1.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <span>Season {selectedSeasonNumber}</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {isMobileSeasonDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-40 bg-[#242424] border border-white/20 rounded-md shadow-2xl py-1 z-50">
                          {seasons.map((s) => (
                            <button
                              key={s.seasonNumber}
                              onClick={() => {
                                setSelectedSeasonNumber(s.seasonNumber);
                                setIsMobileSeasonDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                s.seasonNumber === selectedSeasonNumber
                                  ? 'bg-white/10 text-white font-bold'
                                  : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <span>Season {s.seasonNumber}</span>
                              <span className="text-[10px] text-zinc-500">({s.episodes.length} Ep)</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-[#242424] border border-white/15 text-white font-semibold text-xs px-3 py-1.5 rounded-md">
                      <span>Season 1</span>
                    </div>
                  )}

                  {/* Number of episodes in this season replaces info button */}
                  <span className="text-xs font-semibold text-zinc-400">
                    {currentSeason.episodes.length} Episodes
                  </span>
                </div>

                {/* Episodes List: Old episode number, increased thumbnail, full title & duration, NO download icon, NO play overlay, NO progress line, NO synopsis */}
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
                        {/* Old layout episode number to left side of thumbnail */}
                        <span className="text-lg font-bold text-zinc-400 w-5 text-center shrink-0">
                          {ep.episodeNumber}
                        </span>

                        {/* Increased size thumbnail, NO play button icon overlay, NO progress line */}
                        <div className="w-32 sm:w-36 aspect-video rounded-md overflow-hidden relative shrink-0 bg-black shadow-md">
                          <img
                            src={ep.thumbnailUrl}
                            alt={ep.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Full Title (NO truncation) & Duration (NO synopsis) */}
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
            )}

            {/* 5. Tab Content: Trailers */}
            {mobileActiveTab === 'trailers' && (
              <div className="px-4 py-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trailersList.map((trailer) => (
                    <div
                      key={trailer.id}
                      onClick={() => handlePlayClip(trailer)}
                      className="cursor-pointer space-y-2 group"
                    >
                      <div className="aspect-video w-full rounded-md overflow-hidden bg-black relative shadow-md">
                        <img
                          src={trailer.thumbnailUrl}
                          alt={trailer.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full border-2 border-white bg-black/60 flex items-center justify-center shadow-lg">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
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
            )}

            {/* 5. Tab Content: Where to Watch */}
            {mobileActiveTab === 'whereToWatch' && (
              <div className="px-4 py-4 space-y-3">
                <h3 className="text-lg font-bold text-white font-display mb-3">Where to Watch</h3>
                {show.whereToWatch && show.whereToWatch.length > 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {show.whereToWatch.map((item, idx) => (
                      <a
                        key={idx}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: item.bgColor || 'rgba(255, 255, 255, 0.1)',
                          color: item.textColor || '#ffffff'
                        }}
                        className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold shadow-md cursor-pointer"
                      >
                        <span>{item.textBefore || 'Watch on'} {item.name || item.provider}</span>
                        {item.logoUrl && (
                          <img src={item.logoUrl} alt="" className="h-5 w-auto object-contain" />
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-400">Available exclusively on {adminSettings.platformName || 'Dizi Urdu'}.</p>
                )}
              </div>
            )}

            {/* 5. Tab Content: More Like This */}
            {mobileActiveTab === 'moreLikeThis' && (
              <div className="px-4 py-4">
                <h3 className="text-lg font-bold text-white font-display mb-3">More Like This</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  {matchingRelatedShows.map((relShow) => (
                    <div
                      key={relShow.id}
                      onClick={() => handleSelectRelatedShow(relShow)}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                    >
                      <img
                        src={relShow.posterVerticalUrl || relShow.posterUrl || relShow.posterLandscapeUrl}
                        alt={relShow.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>

    {/* 6. Info Page Modal / Sheet at Root Level (Triggered by (i) button, covers 75% of screen with slick dark overlay without needing to scroll) */}
    {isMobileInfoPageOpen && (
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-0 animate-in fade-in duration-200"
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

          {/* Cast (circular avatars matching image_3157a629.png) */}
          {show.cast && show.cast.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Cast</p>
              <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-1">
                {show.cast.map((actor) => (
                  <div
                    key={actor.id}
                    onClick={() => {
                      setIsMobileInfoPageOpen(false);
                      onSelectActor?.(actor);
                    }}
                    className="flex flex-col items-center text-center w-16 shrink-0 cursor-pointer group"
                  >
                    <img
                      src={actor.profileUrl}
                      alt={actor.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-white/40 transition-all shadow-md"
                    />
                    <span className="text-[11px] font-bold text-white mt-1.5 leading-tight line-clamp-2">
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

    {/* Dedicated Share Page / Modal */}
    <ShareModal
      isOpen={isShareModalOpen}
      onClose={() => setIsShareModalOpen(false)}
      show={show}
      platformName={adminSettings?.platformName}
    />
  </>
);
};
