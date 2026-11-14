import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Show, Episode, AdminSettings, WhereToWatch, TrailerItem, CastMember } from '../types';
import {
  Plus,
  Check,
  ThumbsUp,
  Share2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Play,
  X
} from 'lucide-react';
import { ShareModal } from './ShareModal';
import { WatchProgressItem } from '../utils/watchProgress';
import { MediaImage } from './MediaImage';

interface ShareTitleDesktopPageProps {
  show: Show;
  allShows: Show[];
  adminSettings: AdminSettings;
  isInWatchlist: boolean;
  watchlist: string[];
  watchProgress?: WatchProgressItem;
  onToggleWatchlist: (showId: string) => void;
  onPlayShow: (show: Show, episode?: Episode | null) => void;
  onPlayTrailer?: (show: Show, trailer: TrailerItem) => void;
  onOpenDetails: (show: Show) => void;
  onSelectActor?: (actor: CastMember) => void;
  onBackToBrowse: () => void;
  platformName?: string;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: () => void;
}

export const ShareTitleDesktopPage: React.FC<ShareTitleDesktopPageProps> = ({
  show,
  allShows = [],
  adminSettings,
  isInWatchlist,
  watchlist,
  watchProgress,
  onToggleWatchlist,
  onPlayShow,
  onPlayTrailer,
  onOpenDetails,
  onSelectActor,
  platformName = 'Dizi Urdu',
  isGlobalMuted = true,
  onToggleGlobalMute
}) => {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`dizi_liked_${show.id}`) === 'true';
    } catch {
      return false;
    }
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);

  // Reset season / modal / preview state when navigating to a different show
  useEffect(() => {
    setSelectedSeasonNumber(1);
    setIsSeasonDropdownOpen(false);
    setIsAboutModalOpen(false);
    setShouldStartPreview(false);
    setIsVideoPlaying(false);
    setIsPreviewEnded(false);
    isPreviewEndedRef.current = false;
    setIsPausedByScroll(false);
    isPausedByScrollRef.current = false;
    setIsInactive(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [show.id]);

  // 4-Second Preview Autoplay & Inactivity Transition State
  // Poster stays visible until <video> actually triggers onPlaying (isVideoPlaying === true)
  const [shouldStartPreview, setShouldStartPreview] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isPreviewEnded, setIsPreviewEnded] = useState<boolean>(false);
  const [isPausedByScroll, setIsPausedByScroll] = useState<boolean>(false);
  const [isInactive, setIsInactive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(isGlobalMuted);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inactivityTimerRef = useRef<number | null>(null);
  const isPausedByScrollRef = useRef<boolean>(false);
  const isPreviewEndedRef = useRef<boolean>(false);

  const episodesRowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  const trailersRowRef = useRef<HTMLDivElement>(null);
  const [canScrollTrailersLeft, setCanScrollTrailersLeft] = useState<boolean>(false);
  const [canScrollTrailersRight, setCanScrollTrailersRight] = useState<boolean>(false);

  const relatedRowRef = useRef<HTMLDivElement>(null);
  const [canScrollRelatedLeft, setCanScrollRelatedLeft] = useState<boolean>(false);
  const [canScrollRelatedRight, setCanScrollRelatedRight] = useState<boolean>(true);

  const castRowRef = useRef<HTMLDivElement>(null);
  const [canScrollCastLeft, setCanScrollCastLeft] = useState<boolean>(false);
  const [canScrollCastRight, setCanScrollCastRight] = useState<boolean>(false);

  const isSeries = show.type === 'series';
  const seasons = show.seasons || [];
  const currentSeason =
    seasons.find((s) => s.seasonNumber === selectedSeasonNumber) ||
    seasons[0] || {
      seasonNumber: 1,
      title: 'Season 1',
      episodes: []
    };
  const episodes = currentSeason?.episodes || [];

  // Backdrop source: prioritize desktop more info backdrop
  const backdropSrc =
    show.moreInfoBackdropUrl ||
    show.desktopRecommendationBackdropUrl ||
    show.backdropUrl ||
    show.posterLandscapeUrl ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80';

  // Preview video source
  const previewVideoUrl =
    show.detailPreviewUrl || show.popoutPreviewUrl || show.trailerUrl || show.hoverPreviewUrl;

  const maturity = show.maturityRating || '16+';
  const durationOrSeasonText = isSeries
    ? `${seasons.length} Season${seasons.length > 1 ? 's' : ''}`
    : show.durationOrSeasons || 'Feature Film';
  const releaseYear = show.releaseYear ? show.releaseYear.split('-')[0].trim() : '2025';
  const genresStr =
    Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.join(', ') : 'Drama';
  const primaryGenreUpper =
    Array.isArray(show.genres) && show.genres.length > 0 ? show.genres[0].toUpperCase() : 'DRAMA';

  // Announcement text to show below metadata line
  const announcementText =
    show.announcementPill?.trim() ||
    show.shortDescription?.trim() ||
    show.synopsis?.trim() ||
    `${platformName.toUpperCase()} EXCLUSIVE`;

  // Start loading preview after 4 seconds stay on backdrop page; poster stays up until onPlaying fires
  useEffect(() => {
    if (!previewVideoUrl || isPreviewEndedRef.current) return;
    const previewTimer = window.setTimeout(() => {
      if (!isPreviewEndedRef.current && window.scrollY <= 150) {
        setShouldStartPreview(true);
      }
    }, 4000);

    return () => {
      window.clearTimeout(previewTimer);
    };
  }, [previewVideoUrl, show.id]);

  // Handle user activity / cursor pointer movement:
  // Inactivity countdown ONLY runs while preview video is actively playing at top of page!
  const handleUserActivity = () => {
    const canSettleNow =
      isVideoPlaying &&
      !isPausedByScrollRef.current &&
      !isPreviewEndedRef.current &&
      window.scrollY <= 150 &&
      Boolean(videoRef.current && !videoRef.current.paused && !videoRef.current.ended);

    if (!canSettleNow) {
      if (isInactive) setIsInactive(false);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      return;
    }
    if (isInactive) {
      setIsInactive(false);
    }
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      const stillActivelyPlaying = Boolean(
        videoRef.current &&
          !videoRef.current.paused &&
          !videoRef.current.ended &&
          !isPausedByScrollRef.current &&
          !isPreviewEndedRef.current &&
          window.scrollY <= 150
      );
      if (stillActivelyPlaying) {
        setIsInactive(true);
      } else {
        setIsInactive(false);
      }
    }, 2000);
  };

  useEffect(() => {
    if (isVideoPlaying && !isPausedByScroll && !isPreviewEnded && window.scrollY <= 150) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = window.setTimeout(() => {
        const stillActivelyPlaying = Boolean(
          videoRef.current &&
            !videoRef.current.paused &&
            !videoRef.current.ended &&
            !isPausedByScrollRef.current &&
            !isPreviewEndedRef.current &&
            window.scrollY <= 150
        );
        if (stillActivelyPlaying) {
          setIsInactive(true);
        } else {
          setIsInactive(false);
        }
      }, 2000);
    } else {
      setIsInactive(false);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    }
    return () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isVideoPlaying, isPausedByScroll, isPreviewEnded]);

  // Pause preview when user scrolls down; keep info unsettled when paused or ended
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsInactive(false);
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
        if (videoRef.current && !videoRef.current.paused) {
          isPausedByScrollRef.current = true;
          setIsPausedByScroll(true);
          videoRef.current.pause();
          setIsVideoPlaying(false);
        }
      } else {
        // Scrolling back up: clear settled state; only resume if paused by scroll & preview hasn't ended
        setIsInactive(false);
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
        }
        if (
          isPausedByScrollRef.current &&
          videoRef.current &&
          videoRef.current.paused &&
          shouldStartPreview &&
          !isPreviewEndedRef.current
        ) {
          isPausedByScrollRef.current = false;
          setIsPausedByScroll(false);
          videoRef.current.play().catch(() => {});
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldStartPreview]);

  // Pause preview when tab or document is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        videoRef.current?.pause();
        setIsVideoPlaying(false);
        setIsInactive(false);
      } else if (
        shouldStartPreview &&
        !isPreviewEndedRef.current &&
        !isPausedByScrollRef.current &&
        window.scrollY <= 150
      ) {
        videoRef.current?.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [shouldStartPreview]);

  // Scroll helpers for horizontal rows
  const checkRowScroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    setLeft: (v: boolean) => void,
    setRight: (v: boolean) => void
  ) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setLeft(scrollLeft > 10);
      setRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkRowScroll(episodesRowRef, setCanScrollLeft, setCanScrollRight);
    checkRowScroll(trailersRowRef, setCanScrollTrailersLeft, setCanScrollTrailersRight);
    checkRowScroll(relatedRowRef, setCanScrollRelatedLeft, setCanScrollRelatedRight);
    checkRowScroll(castRowRef, setCanScrollCastLeft, setCanScrollCastRight);
  }, [episodes.length, show.id]);

  // Scroll episodes horizontal row by 4 episode cards (Homepage-style navigation)
  const scrollRowByCards = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: 'left' | 'right',
    cardSelector: string,
    cardsCount = 4
  ) => {
    if (ref.current) {
      const cardEl = ref.current.querySelector(cardSelector) as HTMLElement | null;
      const cardWidth = cardEl ? cardEl.offsetWidth + 14 : 280;
      const scrollAmount = cardWidth * cardsCount;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleToggleLike = () => {
    const next = !isLiked;
    setIsLiked(next);
    try {
      localStorage.setItem(`dizi_liked_${show.id}`, String(next));
    } catch {}
  };

  // Trailers & More list (custom trailersAndMore or fallback from trailerUrl)
  const trailersList: TrailerItem[] = useMemo(() => {
    if (show.trailersAndMore && show.trailersAndMore.length > 0) {
      return show.trailersAndMore;
    }
    const baseList: TrailerItem[] = [];
    if (show.trailerUrl) {
      baseList.push({
        id: `${show.id}-trailer-1`,
        title: `Official Trailer: ${show.title}`,
        thumbnailUrl: show.posterLandscapeUrl || show.backdropUrl,
        videoUrl: show.trailerUrl,
        duration: '2m 15s'
      });
    }
    if (show.detailPreviewUrl && show.detailPreviewUrl !== show.trailerUrl) {
      baseList.push({
        id: `${show.id}-trailer-2`,
        title: `First Look & Preview: ${show.title}`,
        thumbnailUrl: show.backdropUrl || show.posterLandscapeUrl,
        videoUrl: show.detailPreviewUrl,
        duration: '1m 30s'
      });
    }
    return baseList;
  }, [show]);

  // Related titles ("More Like This"): scored by matching genres and categories, max 12 titles
  const similarShows = useMemo(() => {
    const targetGenres = new Set(show.genres || []);
    const targetCategories = new Set(show.categories || []);
    const targetTraits = new Set(show.thisSeriesIs || []);

    const scored = allShows
      .filter((s) => s.id !== show.id)
      .map((s) => {
        let score = 0;
        (s.genres || []).forEach((g) => {
          if (targetGenres.has(g)) score += 3;
        });
        (s.categories || []).forEach((c) => {
          if (targetCategories.has(c)) score += 2;
        });
        (s.thisSeriesIs || []).forEach((t) => {
          if (targetTraits.has(t)) score += 1;
        });
        if (s.type === show.type) score += 0.5;
        return { show: s, score };
      })
      .filter((item) => item.score >= 1);

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.show.points || 0) - (a.show.points || 0);
    });

    return scored.slice(0, 12).map((item) => item.show);
  }, [allShows, show]);

  // Rating score calculation
  const ratingScore = show.imdbRating || (show as any).rating || '8.9';
  const reviewVotesText = show.imdbVotes ? `${show.imdbVotes} reviews` : '142K reviews';

  // Watch progress for Resume button and episode progress lines
  const hasWatchProgress = Boolean(
    watchProgress && (watchProgress.progressPercent > 0 || watchProgress.isNextEpisodePrompt)
  );

  // Info, announcement, and season selector hide ONLY when preview is actively playing AND cursor is inactive
  const shouldHideInfo = isVideoPlaying && !isPausedByScroll && !isPreviewEnded && isInactive;

  useEffect(() => {
    if (shouldHideInfo && isSeasonDropdownOpen) {
      setIsSeasonDropdownOpen(false);
    }
  }, [shouldHideInfo, isSeasonDropdownOpen]);

  // Where to watch providers list for Where to Watch section
  const whereToWatchItems: WhereToWatch[] =
    show.whereToWatch && show.whereToWatch.length > 0
      ? show.whereToWatch
      : [
          {
            provider: 'youtube',
            name: 'YouTube',
            url: 'https://youtube.com',
            bgColor: '#FF0000',
            textColor: '#ffffff',
            textBefore: 'Watch on',
            textAfter: 'YouTube',
            logoUrl:
              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=120&q=80',
            squareLogoUrl:
              'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=120&q=80',
            freeOrSub: 'Official Channel'
          }
        ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      onMouseMove={handleUserActivity}
      className="relative w-full min-h-screen bg-[#181818] text-white select-none overflow-x-hidden font-sans"
    >
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Ends 0.2cm (8px) above screen bottom edge where glare    */}
      {/* reaches 100% #181818 maturity; glare begins 0.7cm (26px) above episode    */}
      {/* top edges, while episode tops peek strictly 0.7cm (26px) above bottom     */}
      {/* ========================================================================= */}
      <section className="relative w-full h-screen min-h-[480px] flex flex-col justify-end overflow-hidden bg-black">
        {/* Left-side pure black ambient backdrop (revealed when fixed-width poster/video is active) */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0 bg-black" />

        {/* Full-bleed or Height-Matched 16:9 Fixed-Width Backdrop Container */}
        <div
          className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-[1] transition-opacity duration-700 ease-in-out ${
            isVideoPlaying ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {show.fullSizeMoreInfoFixedWidthPoster ? (
            <div
              className="absolute top-0 bottom-0 right-0 h-full overflow-hidden"
              style={{
                width: 'min(100%, calc(100vh * 16 / 9))',
                maskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.28) 42px, rgba(0,0,0,0.68) 98px, black 160px)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.28) 42px, rgba(0,0,0,0.68) 98px, black 160px)'
              }}
            >
              <MediaImage
                src={backdropSrc}
                fallbackTitle={show.title}
                fallbackClassName="w-full h-full bg-black flex items-center justify-center p-6 text-center select-none"
                fallbackTextClassName="text-white/80 font-bold text-xl sm:text-2xl font-sans"
                hideFallback={isVideoPlaying}
                className="w-full h-full object-cover object-center"
              />
            </div>
          ) : (
            <MediaImage
              src={backdropSrc}
              fallbackTitle={show.title}
              fallbackClassName="w-full h-full bg-black flex items-center justify-center p-6 text-center select-none"
              fallbackTextClassName="text-white/80 font-bold text-xl sm:text-2xl font-sans"
              hideFallback={isVideoPlaying}
              className="w-full h-full object-cover object-center"
            />
          )}
        </div>

        {/* 4-Second Preview Video: Hidden underneath poster while buffering, fades in onPlaying */}
        {previewVideoUrl && shouldStartPreview && !isPreviewEnded && (
          <div
            className={`absolute inset-0 w-full h-full pointer-events-none z-[2] transition-opacity duration-700 ${
              isVideoPlaying && !isPausedByScroll ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className={
                show.fullSizeMoreInfoFixedWidthVideo
                  ? 'absolute top-0 bottom-0 right-0 h-full overflow-hidden'
                  : 'absolute inset-0 w-full h-full overflow-hidden'
              }
              style={
                show.fullSizeMoreInfoFixedWidthVideo
                  ? {
                      width: 'min(100%, calc(100vh * 16 / 9))',
                      maskImage:
                        'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.28) 42px, rgba(0,0,0,0.68) 98px, black 160px)',
                      WebkitMaskImage:
                        'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.28) 42px, rgba(0,0,0,0.68) 98px, black 160px)'
                    }
                  : undefined
              }
            >
              <video
                ref={videoRef}
                src={previewVideoUrl}
                autoPlay
                playsInline
                loop={false}
                onPlaying={() => {
                  if (!isPausedByScrollRef.current && !isPreviewEndedRef.current) {
                    setIsVideoPlaying(true);
                  }
                }}
                onPause={() => {
                  setIsVideoPlaying(false);
                  setIsInactive(false);
                }}
                onEnded={() => {
                  isPreviewEndedRef.current = true;
                  isPausedByScrollRef.current = false;
                  setIsPreviewEnded(true);
                  setIsPausedByScroll(false);
                  setIsVideoPlaying(false);
                  setIsInactive(false);
                  setShouldStartPreview(false);
                }}
                onError={() => {
                  setIsVideoPlaying(false);
                  setIsInactive(false);
                  setShouldStartPreview(false);
                }}
                muted={isMuted}
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        )}

        {/* Unified Bottom Merge Overlay: Reaches 100% pure black (#000000) strictly at the bottom edge of the screen (100vh), never before */}
        <div
          className="absolute inset-x-0 bottom-0 h-[140px] pointer-events-none z-[15]"
          style={{
            background:
              'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.03) 20%, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.32) 60%, rgba(0,0,0,0.62) 80%, rgba(0,0,0,0.88) 93%, #000000 100%)'
          }}
        />

        {/* Smaller Circular Mute Button in Bottom Right (visible only when video is actively playing) */}
        {isVideoPlaying && !isPausedByScroll && !isPreviewEnded && Boolean(previewVideoUrl) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (videoRef.current) {
                videoRef.current.muted = nextMuted;
              }
              onToggleGlobalMute?.();
            }}
            className="absolute bottom-[82px] right-8 md:right-12 z-30 w-8 h-8 rounded-full border border-white/45 hover:border-white bg-black/45 hover:bg-black/65 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs active:scale-95 animate-in fade-in duration-300"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>
        )}

        {/* Hero Left Content Column: positioned cleanly above transparent Season selector */}
        <div className="relative z-20 w-full h-full max-w-[1780px] mx-auto px-6 sm:px-8 lg:px-12 flex flex-col justify-end pb-[90px] sm:pb-[94px] pointer-events-none">
          <div className="w-full max-w-[440px] lg:max-w-[480px] pointer-events-auto space-y-3 bg-transparent">
            <div
              className={`space-y-3 transition-transform duration-500 ease-out ${
                shouldHideInfo ? 'translate-y-6 sm:translate-y-7' : 'translate-y-0'
              }`}
            >
              {/* 1. Title ClearArt PNG Logo (NO shadow) */}
              <div className="max-w-[320px] sm:max-w-[370px] bg-transparent">
                {show.titleLogoUrl ? (
                  <img
                    src={show.titleLogoUrl}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="max-h-16 sm:max-h-20 lg:max-h-22 w-auto object-contain bg-transparent"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-display">
                    {show.title}
                  </h1>
                )}
              </div>

              {/* 2. Action Buttons Line: Play / Resume, Add to List, Like, Share */}
              <div className="flex items-center gap-3 pt-0.5 flex-wrap">
                {/* Main Play / Resume Button: calls onPlayShow(show) so it resumes correctly */}
                <button
                  onClick={() => onPlayShow(show)}
                  className="relative px-4.5 py-1.5 sm:px-5 sm:py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm sm:text-[15px] flex items-center gap-1.5 shadow-md cursor-pointer tracking-wide transition-colors overflow-hidden select-none"
                  aria-label={hasWatchProgress ? 'Resume' : 'Play'}
                >
                  <svg className="w-5 h-5 shrink-0 fill-current" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span>{hasWatchProgress ? 'Resume' : 'Play'}</span>

                  {/* Progress bar inside Resume button matching normal more info */}
                  {hasWatchProgress && watchProgress && watchProgress.progressPercent > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/20">
                      <div
                        className="h-full bg-[#e50914]"
                        style={{
                          width: `${Math.min(100, Math.max(0, watchProgress.progressPercent))}%`
                        }}
                      />
                    </div>
                  )}
                </button>

                {/* Circular Add to List Button */}
                <button
                  onClick={() => onToggleWatchlist(show.id)}
                  className="w-9 h-9 md:w-9.5 md:h-9.5 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-colors cursor-pointer select-none"
                  aria-label={isInWatchlist ? 'Remove from List' : 'Add to List'}
                  title={isInWatchlist ? 'Remove from List' : 'Add to List'}
                >
                  {isInWatchlist ? (
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                </button>

                {/* Circular Like Button */}
                <button
                  onClick={handleToggleLike}
                  className="w-9 h-9 md:w-9.5 md:h-9.5 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-colors cursor-pointer select-none"
                  aria-label="Like"
                  title="Like"
                >
                  <ThumbsUp className={`w-4 h-4 text-white ${isLiked ? 'fill-white' : ''}`} />
                </button>

                {/* Circular Share Button */}
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-9 h-9 md:w-9.5 md:h-9.5 rounded-full border-2 border-white/40 hover:border-white bg-black/25 hover:bg-black/45 text-white flex items-center justify-center transition-colors cursor-pointer select-none"
                  aria-label="Share"
                  title="Share"
                >
                  <Share2 className="w-4 h-4 text-white stroke-[2]" />
                </button>
              </div>
            </div>

            {/* 3. Metadata & Announcement container */}
            <div
              className={`space-y-1.5 transition-all duration-500 ease-out select-none ${
                shouldHideInfo
                  ? 'opacity-0 pointer-events-none max-h-0 overflow-hidden m-0 p-0'
                  : 'opacity-100 pointer-events-auto max-h-40'
              }`}
            >
              {/* Metadata line: Year, Duration, HD, Maturity Rating, Genres */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-semibold text-white/90">
                <span>{releaseYear}</span>
                <span>{durationOrSeasonText}</span>

                {/* HD border badge */}
                <span className="px-1.5 py-0.5 rounded border border-white/40 text-[10px] font-bold text-zinc-300 uppercase leading-none">
                  HD
                </span>

                {/* Maturity rating pill */}
                <span className="h-5 px-1.5 rounded border border-white/40 font-bold text-white text-xs inline-flex items-center justify-center leading-none">
                  {maturity}
                </span>

                {/* Genres inside infos line */}
                <span className="text-zinc-300 font-medium text-xs sm:text-sm ml-1">
                  {genresStr}
                </span>
              </div>

              {/* Announcement text line below metadata */}
              <p className="text-xs sm:text-sm font-semibold text-zinc-300 tracking-wide line-clamp-2 drop-shadow">
                {announcementText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smooth Black-to-Grey (#181818) Merge Band: Transitions gradually from pure #000000 at screen bottom into #181818 */}
      <div
        className="relative z-10 w-full h-[120px] pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, #000000 0%, #050505 22%, #0b0b0b 48%, #121212 74%, #161616 90%, #181818 100%)'
        }}
      />

      {/* ========================================================================= */}
      {/* 2. CONTINUOUS SCROLL SECTIONS (Pulls transparent Season selector up so    */}
      {/* strictly 0.7cm / ~26px of episode top edges peek above screen bottom)     */}
      {/* ========================================================================= */}
      <div
        className={`relative z-20 w-full max-w-[1780px] mx-auto px-6 sm:px-8 lg:px-12 pb-6 space-y-10 ${
          isSeries && episodes.length > 0 ? '-mt-[192px]' : '-mt-[168px]'
        }`}
      >
        {/* SECTION 1: EPISODES (Always shows transparent Season dropdown button, */}
        {/* Episode count shown ONLY inside the dropdown menu) */}
        {isSeries && episodes.length > 0 && (
          <section className="space-y-3">
            {/* Left-side Transparent Season Dropdown Selector (hides cleanly when preview hides info, preserving episode edge height) */}
            <div
              className={`flex items-center justify-start transition-opacity duration-500 ease-out ${
                shouldHideInfo ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
              }`}
            >
              <div className="relative">
                <button
                  onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-transparent hover:bg-white/10 border border-white/25 hover:border-white/50 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  <span>Season {selectedSeasonNumber}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-white/80 transition-transform ${
                      isSeasonDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isSeasonDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-zinc-700 p-1.5 shadow-2xl z-30 space-y-1">
                    {seasons.map((s) => (
                      <button
                        key={s.seasonNumber}
                        onClick={() => {
                          setSelectedSeasonNumber(s.seasonNumber);
                          setIsSeasonDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center justify-between ${
                          s.seasonNumber === selectedSeasonNumber
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-zinc-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span>Season {s.seasonNumber}</span>
                        <span className="text-zinc-400 text-[11px]">
                          {s.episodes.length} {s.episodes.length === 1 ? 'Episode' : 'Episodes'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Episodes Row: exact homepage style (rounded-[6px], NO border, 4 cards + edge of 5th) */}
            <div className="relative group/episodes">
              {canScrollLeft && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollRowByCards(episodesRowRef, 'left', '[data-episode-card="true"]', 4);
                  }}
                  aria-label="Scroll left"
                  className="group/nav absolute left-0 top-0 z-40 w-11 sm:w-12 md:w-14 h-[142px] sm:h-[154px] rounded-r-xl rounded-l-none bg-black/40 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer border-0 select-none opacity-0 group-hover/episodes:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    scrollRowByCards(episodesRowRef, 'right', '[data-episode-card="true"]', 4);
                  }}
                  aria-label="Scroll right"
                  className="group/nav absolute right-0 top-0 z-40 w-11 sm:w-12 md:w-14 h-[142px] sm:h-[154px] rounded-l-xl rounded-r-none bg-black/40 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer border-0 select-none opacity-0 group-hover/episodes:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
                </button>
              )}

              <div
                ref={episodesRowRef}
                onScroll={() =>
                  checkRowScroll(episodesRowRef, setCanScrollLeft, setCanScrollRight)
                }
                className="flex items-start gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 select-none"
              >
                {episodes.map((ep) => {
                  const epKey = ep.id || `s${ep.seasonNumber || 1}e${ep.episodeNumber}`;
                  const epProg = watchProgress?.episodesProgress?.[epKey];
                  const progressPct =
                    epProg?.progressPercent ||
                    (watchProgress?.episodeNumber === ep.episodeNumber &&
                    watchProgress?.seasonNumber === (ep.seasonNumber || 1)
                      ? watchProgress.progressPercent
                      : 0);

                  return (
                    <div
                      key={ep.id}
                      data-episode-card="true"
                      onClick={() => onPlayShow(show, ep)}
                      className="w-[calc((100%-42px)/4.32)] shrink-0 min-w-[240px] max-w-[360px] cursor-pointer flex flex-col gap-2 rounded-[6px] border-0 select-none"
                    >
                      <div className="relative aspect-video w-full rounded-[6px] overflow-hidden bg-zinc-900 border-0">
                        <MediaImage
                          src={ep.thumbnailUrl}
                          fallbackTitle={ep.title || `Episode ${ep.episodeNumber}`}
                          fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2.5 left-2.5 z-20 pointer-events-none flex items-center justify-center">
                          <svg
                            className="w-4 h-4 fill-white text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                            viewBox="0 0 24 24"
                          >
                            <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                          </svg>
                        </div>

                        {progressPct > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#404040]/80 z-20">
                            <div
                              className="h-full bg-[#e50914]"
                              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-white gap-2 px-0.5">
                        <span className="line-clamp-1">
                          {ep.episodeNumber}. {ep.title}
                        </span>
                        <span className="text-zinc-400 font-semibold text-xs shrink-0">
                          {ep.duration || '48m'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: TRAILERS & MORE */}
        {trailersList.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Trailers & More
            </h2>

            <div className="relative group/trailers">
              {canScrollTrailersLeft && (
                <button
                  onClick={() =>
                    scrollRowByCards(trailersRowRef, 'left', '[data-trailer-card="true"]', 3)
                  }
                  aria-label="Scroll trailers left"
                  className="group/nav absolute left-0 top-0 z-40 w-11 sm:w-12 h-[142px] sm:h-[154px] rounded-r-xl bg-black/40 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/trailers:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5]" />
                </button>
              )}

              {canScrollTrailersRight && (
                <button
                  onClick={() =>
                    scrollRowByCards(trailersRowRef, 'right', '[data-trailer-card="true"]', 3)
                  }
                  aria-label="Scroll trailers right"
                  className="group/nav absolute right-0 top-0 z-40 w-11 sm:w-12 h-[142px] sm:h-[154px] rounded-l-xl bg-black/40 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/trailers:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5]" />
                </button>
              )}

              <div
                ref={trailersRowRef}
                onScroll={() =>
                  checkRowScroll(
                    trailersRowRef,
                    setCanScrollTrailersLeft,
                    setCanScrollTrailersRight
                  )
                }
                className="flex items-start gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 select-none"
              >
                {trailersList.map((trailer) => (
                  <div
                    key={trailer.id}
                    data-trailer-card="true"
                    onClick={() =>
                      onPlayTrailer ? onPlayTrailer(show, trailer) : onPlayShow(show)
                    }
                    className="w-[calc((100%-42px)/4.32)] shrink-0 min-w-[240px] max-w-[360px] cursor-pointer flex flex-col gap-2 rounded-[6px]"
                  >
                    <div className="relative aspect-video w-full rounded-[6px] overflow-hidden bg-zinc-900">
                      <MediaImage
                        src={trailer.thumbnailUrl}
                        fallbackTitle={trailer.title}
                        fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-11 h-11 rounded-full border-2 border-white bg-black/55 flex items-center justify-center shadow-lg">
                          <Play className="w-4.5 h-4.5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      {trailer.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/50 px-2 py-0.5 rounded text-[11px] font-semibold text-white">
                          {trailer.duration}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 px-0.5">
                      {trailer.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 3: MORE LIKE THIS (Horizontal Row Feed, max 12 titles of related genre/category) */}
        {similarShows.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                More Like This
              </h2>
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </div>

            <div className="relative group/related">
              {canScrollRelatedLeft && (
                <button
                  onClick={() =>
                    scrollRowByCards(relatedRowRef, 'left', '[data-related-card="true"]', 5)
                  }
                  aria-label="Scroll related left"
                  className="group/nav absolute left-0 top-0 bottom-2 z-40 w-11 sm:w-12 rounded-r-xl bg-black/45 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/related:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronLeft className="w-8 h-8 stroke-[2.5]" />
                </button>
              )}

              {canScrollRelatedRight && (
                <button
                  onClick={() =>
                    scrollRowByCards(relatedRowRef, 'right', '[data-related-card="true"]', 5)
                  }
                  aria-label="Scroll related right"
                  className="group/nav absolute right-0 top-0 bottom-2 z-40 w-11 sm:w-12 rounded-l-xl bg-black/45 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/related:opacity-100 transition-opacity duration-200 shadow-xl"
                >
                  <ChevronRight className="w-8 h-8 stroke-[2.5]" />
                </button>
              )}

              <div
                ref={relatedRowRef}
                onScroll={() =>
                  checkRowScroll(
                    relatedRowRef,
                    setCanScrollRelatedLeft,
                    setCanScrollRelatedRight
                  )
                }
                className="flex items-start gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2 select-none"
              >
                {similarShows.map((item) => (
                  <div
                    key={item.id}
                    data-related-card="true"
                    onClick={() => onOpenDetails(item)}
                    className="w-[165px] sm:w-[185px] md:w-[200px] lg:w-[calc((100%-70px)/6)] shrink-0 cursor-pointer rounded-xl overflow-hidden aspect-[2/3] bg-zinc-900 border-0"
                  >
                    <MediaImage
                      src={
                        item.posterVerticalUrl ||
                        item.posterUrl ||
                        item.posterLandscapeUrl ||
                        item.backdropUrl
                      }
                      fallbackTitle={item.title}
                      fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-3 text-center select-none"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: WHERE TO WATCH (Square Logo Card Style matching image_16b38785.png) */}
        {whereToWatchItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Where to Watch
            </h2>

            <div className="flex flex-wrap items-center gap-4">
              {whereToWatchItems.map((item, idx) => {
                const prefix = item.textBefore !== undefined ? item.textBefore : 'Watch on';
                const suffix =
                  item.textAfter !== undefined
                    ? item.textAfter
                    : item.name || item.provider || 'Source';
                const labelText = [prefix, suffix].filter(Boolean).join(' ');
                const squareLogo = item.squareLogoUrl || item.logoUrl;

                return (
                  <a
                    key={idx}
                    href={item.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#262628] hover:bg-[#323236] rounded-2xl p-3.5 pr-7 flex items-center gap-4 transition-colors min-w-[260px] max-w-[360px] cursor-pointer shadow-lg select-none"
                  >
                    {/* Square Logo on Left matching image_16b38785.png */}
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-black"
                      style={!squareLogo && item.bgColor ? { backgroundColor: item.bgColor } : undefined}
                    >
                      {squareLogo ? (
                        <img
                          src={squareLogo}
                          alt={item.name || 'Provider'}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-base font-black text-white">
                          {getInitials(item.name || item.provider || 'TV')}
                        </span>
                      )}
                    </div>

                    {/* Text & Subscription/Access Subtext */}
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-bold text-white truncate">
                        {labelText}
                      </p>
                      {item.freeOrSub && (
                        <p className="text-xs text-zinc-400 font-medium mt-0.5 truncate">
                          {item.freeOrSub}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 5: CAST & CREW HORIZONTAL ROW + ABOUT & INFORMATION SECTION */}
        <section className="space-y-10 pt-2">
          {/* Cast & Crew Row matching image_0fb6cc57.png */}
          {show.cast && show.cast.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Cast & Crew
                </h2>
                <ChevronRight className="w-5 h-5 text-zinc-400" />
              </div>

              <div className="relative group/cast">
                {canScrollCastLeft && (
                  <button
                    onClick={() =>
                      scrollRowByCards(castRowRef, 'left', '[data-cast-card="true"]', 5)
                    }
                    aria-label="Scroll cast left"
                    className="group/nav absolute left-0 top-0 bottom-6 z-40 w-10 rounded-r-xl bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/cast:opacity-100 transition-opacity duration-200"
                  >
                    <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                  </button>
                )}

                {canScrollCastRight && (
                  <button
                    onClick={() =>
                      scrollRowByCards(castRowRef, 'right', '[data-cast-card="true"]', 5)
                    }
                    aria-label="Scroll cast right"
                    className="group/nav absolute right-0 top-0 bottom-6 z-40 w-10 rounded-l-xl bg-black/50 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer opacity-0 group-hover/cast:opacity-100 transition-opacity duration-200"
                  >
                    <ChevronRight className="w-7 h-7 stroke-[2.5]" />
                  </button>
                )}

                <div
                  ref={castRowRef}
                  onScroll={() =>
                    checkRowScroll(castRowRef, setCanScrollCastLeft, setCanScrollCastRight)
                  }
                  className="flex items-start gap-5 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-2 select-none"
                >
                  {show.cast.map((actor) => {
                    const imgSrc = actor.profileUrl || (actor as any).imageUrl;
                    return (
                      <button
                        type="button"
                        key={actor.id}
                        data-cast-card="true"
                        onClick={() => onSelectActor?.(actor)}
                        aria-label={`View ${actor.name}'s appearances`}
                        className="group/actor flex flex-col items-center text-center w-[112px] sm:w-[126px] shrink-0 cursor-pointer focus:outline-none"
                      >
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#2b2b2f] flex items-center justify-center shadow-md ring-2 ring-transparent group-hover/actor:ring-white/80 transition-all duration-200">
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={actor.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover/actor:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <span className="text-2xl sm:text-3xl font-bold text-white tracking-wider">
                              {getInitials(actor.name)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-white/90 group-hover/actor:text-white mt-2.5 leading-tight line-clamp-1 transition-colors">
                          {actor.name}
                        </span>
                        {actor.character && (
                          <span className="text-[11px] sm:text-xs text-zinc-400 line-clamp-1 mt-0.5">
                            {actor.character}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* About Card & Information Section matching image_eec75954.png */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* About Box */}
            <div className="lg:col-span-5 space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">About</h2>
              <div className="relative bg-[#262628] rounded-2xl p-5 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {show.title}
                </h3>
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 mt-0.5 mb-2.5">
                  {primaryGenreUpper}
                </p>
                <div className="relative">
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-3 pr-10">
                    {show.synopsis || show.description || show.shortDescription}
                  </p>
                  <button
                    onClick={() => setIsAboutModalOpen(true)}
                    className="mt-1 text-sky-400 hover:text-sky-300 text-xs font-bold uppercase tracking-wide cursor-pointer inline-block"
                  >
                    MORE
                  </button>
                </div>
              </div>
            </div>

            {/* Information Details Column */}
            <div className="lg:col-span-7 space-y-3.5">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Information
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5 pt-1">
                <div>
                  <p className="text-xs font-bold text-white">Released</p>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{releaseYear}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-white">Rated</p>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{maturity}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-white">IMDb Rating</p>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                    {ratingScore} / 10 ({reviewVotesText})
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-white">Genres</p>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">{genresStr}</p>
                </div>

                {show.categories && show.categories.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-white">Categories</p>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      {show.categories.join(', ')}
                    </p>
                  </div>
                )}

                {show.thisSeriesIs && show.thisSeriesIs.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-white">
                      {isSeries ? 'This Series Is' : 'This Movie Is'}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                      {show.thisSeriesIs.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Expanded About Synopsis Modal matching image_946e39aa.png */}
      {isAboutModalOpen && (
        <div
          onClick={() => setIsAboutModalOpen(false)}
          className="fixed inset-0 z-[220] bg-black/70 flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#262628] rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10 relative space-y-4"
          >
            <button
              onClick={() => setIsAboutModalOpen(false)}
              className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close about dialog"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{show.title}</h3>
              <p className="text-xs sm:text-sm font-medium text-zinc-400 mt-0.5">
                {genresStr}
              </p>
            </div>

            <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
              {show.synopsis || show.description || show.shortDescription}
            </p>
          </div>
        </div>
      )}

      {/* Share Modal Dialog */}
      <ShareModal
        show={show}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        platformName={platformName}
      />
    </div>
  );
};
