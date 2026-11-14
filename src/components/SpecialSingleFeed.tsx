import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Show } from '../types';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Loader2, Play, Plus, Check, Info } from 'lucide-react';
import { MediaImage } from './MediaImage';

interface SpecialSingleFeedProps {
  shows: Show[];
  onPlay: (show: Show) => void;
  onOpenDetails: (show: Show) => void;
  watchlist?: string[];
  onToggleWatchlist?: (showId: string) => void;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (muted: boolean) => void;
  className?: string;
  isMobile?: boolean;
  isPaused?: boolean;
  isAnyOtherCardHovered?: boolean;
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
  isAnyOtherCardHovered = false
}) => {
  // Keep up to 4 curated shows in single special feed carousel
  const feedShows = shows && shows.length > 0 ? shows.slice(0, 4) : [];
  const mobileFeedShows = feedShows;
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [prevIndex, setPrevIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isAnimatingSlide, setIsAnimatingSlide] = useState<boolean>(false);

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
  const [localMuted, setLocalMuted] = useState<boolean>(isGlobalMuted);
  const [isInViewport, setIsInViewport] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const mobileCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastWheelTimeRef = useRef<number>(0);
  const startPreviewTimerRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartTimeRef = useRef<number>(0);

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

  // Desktop navigation handlers with slide transition:
  // "in desktop swiping animatino new poster swip current poster don't swip out and new info and button show pop out animation"
  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentIndex <= 0) return;
      setPrevIndex(currentIndex);
      setSlideDirection('prev');
      setIsAnimatingSlide(true);
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    },
    [currentIndex]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (currentIndex >= feedShows.length - 1) return;
      setPrevIndex(currentIndex);
      setSlideDirection('next');
      setIsAnimatingSlide(true);
      setCurrentIndex((prev) => Math.min(feedShows.length - 1, prev + 1));
    },
    [currentIndex, feedShows.length]
  );

  // Clear animation flag after slide transition completes
  useEffect(() => {
    if (isAnimatingSlide) {
      const timer = window.setTimeout(() => {
        setIsAnimatingSlide(false);
      }, 550);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, isAnimatingSlide]);

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

  // Preview timing logic:
  // Show backdrop initially. Preview starts after 1.5s stay time. Logo stays big without zooming out.
  useEffect(() => {
    setIsVideoLoading(false);
    setIsVideoPlaying(false);
    setShouldPlayVideo(false);

    if (startPreviewTimerRef.current) {
      window.clearTimeout(startPreviewTimerRef.current);
    }

    if (isInViewport && !document.hidden && !isPaused) {
      startPreviewTimerRef.current = window.setTimeout(() => {
        setShouldPlayVideo(true);
      }, 1500);
    }

    return () => {
      if (startPreviewTimerRef.current) {
        window.clearTimeout(startPreviewTimerRef.current);
      }
    };
  }, [currentIndex, isInViewport, isPaused]);

  // Pause all preview videos immediately when isPaused is true or when user hovers over another card below
  useEffect(() => {
    if (isPaused || isAnyOtherCardHovered) {
      setShouldPlayVideo(false);
      setIsVideoPlaying(false);
      setIsVideoLoading(false);
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

  // IntersectionObserver to pause preview when out of viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = Boolean(entry && entry.isIntersecting);
        setIsInViewport(isVisible);
        if (!isVisible) {
          videoRefs.current.forEach((v) => {
            if (v && !v.paused) v.pause();
          });
          mobileVideoRefs.current.forEach((v) => {
            if (v && !v.paused) v.pause();
          });
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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
      } else if (isInViewport && shouldPlayVideo && !isPaused) {
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
  }, [isInViewport, shouldPlayVideo, currentIndex, isMobileScreen, isPaused]);

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
  // "the tile slide to next time when current tile preview ends , for last tile end means end no reload and no shiftiting to next title."
  const handleVideoEnded = () => {
    if (currentIndex < feedShows.length - 1) {
      handleNext();
    } else {
      setIsVideoPlaying(false);
      setShouldPlayVideo(false);
    }
  };

  // Mobile: Scroll active card into view with steady left padding
  useEffect(() => {
    if (!isMobileScreen) return;
    const targetEl = mobileCardRefs.current[currentIndex];
    const container = mobileScrollRef.current;
    if (targetEl && container) {
      const padLeft = window.innerWidth < 640 ? 14 : 16;
      const containerRect = container.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      const currentDiff = elRect.left - containerRect.left - padLeft;
      if (Math.abs(currentDiff) > 2) {
        container.scrollBy({
          left: currentDiff,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, isMobileScreen]);

  // Mobile Single-Swipe Touch Handlers: strictly advances 1 card per swipe ("swiping only scroll 1 card no more")
  const scrollTimeoutRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const deltaTime = Date.now() - touchStartTimeRef.current;

    // Must be a predominantly horizontal swipe
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 600) {
      if (deltaX < 0) {
        // Swipe left -> advance strictly 1 card forward
        if (currentIndex < feedShows.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        }
      } else {
        // Swipe right -> advance strictly 1 card backward
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    }
  };

  // Mobile: Update active card when user scrolls, ensuring preview ONLY plays for card currently in view
  const handleMobileScroll = useCallback(() => {
    if (!isMobileScreen || !mobileScrollRef.current) return;
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      const container = mobileScrollRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const padLeft = window.innerWidth < 640 ? 14 : 16;
      let closestIdx = currentIndex;
      let minDiff = Infinity;
      mobileCardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const elRect = el.getBoundingClientRect();
        const diff = Math.abs(elRect.left - containerRect.left - padLeft);
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });
      if (closestIdx !== currentIndex && minDiff < 140) {
        setCurrentIndex(closestIdx);
      }
    }, 80);
  }, [currentIndex, isMobileScreen]);

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
      className={`relative w-full my-5 sm:my-7 select-none overflow-visible ${className}`}
    >
      {/* Mobile Ambient Glare: smoothly radiates up to top feed title ("Previews for you") and down to bottom feed title ("My List") without clear dividing lines */}
      <div
        className="md:hidden absolute inset-x-0 -top-7 -bottom-7 pointer-events-none z-0 opacity-35 transition-colors duration-700"
        style={{
          background: `radial-gradient(ellipse 95% 72% at 50% 50%, ${currentShow.ambientColor || '#0d9488'} 0%, ${getAtmosphericBg(currentShow.ambientColor || '#0d9488', 0.5)} 38%, transparent 78%)`,
          filter: 'blur(36px)'
        }}
      />

      {/* Feed Section Title - matches normal feed left padding */}
      <div className="px-3.5 sm:px-4 md:px-8 xl:px-12 mb-2.5 sm:mb-3 relative z-10">
        <h2 className="text-white font-extrabold text-base sm:text-lg md:text-xl tracking-tight">
          Previews for you
        </h2>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP LAYOUT: Original Prime Video Single-Show Horizontal Showcase       */}
      {/* ========================================================================= */}
      <div className="hidden md:block relative w-full max-w-[1850px] mx-auto px-8 md:px-12 xl:px-16 group/specialsingle">
        <div className="relative w-full rounded-2xl overflow-hidden bg-[#090b10] shadow-2xl min-h-[340px] lg:min-h-[395px] xl:min-h-[430px] flex items-center">
          {/* Far-Left Atmospheric Glow (subtle reduced ambiance) */}
          <div
            className="absolute inset-y-0 left-0 w-[40%] pointer-events-none z-10 opacity-20 transition-all duration-700"
            style={{
              background: `radial-gradient(ellipse 75% 90% at 5% 50%, ${desktopAmbient} 0%, transparent 80%)`
            }}
          />

          {/* Right Side Backdrop + Video Preview Container (Strictly Right 58%) */}
          <div className="absolute top-0 bottom-0 right-0 w-[58%] overflow-hidden bg-[#090b10] pointer-events-none rounded-r-2xl">
            {/* Previous Poster Layer during slide */}
            {isAnimatingSlide && feedShows[prevIndex] && (
              <MediaImage
                src={
                  feedShows[prevIndex].desktopSpecialSingleFeedUrl ||
                  feedShows[prevIndex].backdropUrl2 ||
                  feedShows[prevIndex].backdropUrl ||
                  feedShows[prevIndex].posterLandscapeUrl
                }
                fallbackTitle={feedShows[prevIndex].title}
                fallbackClassName="absolute inset-0 w-full h-full bg-[#090b10] flex items-center justify-center p-6 text-center select-none"
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
            )}

            {/* Active Poster Image */}
            <MediaImage
              key={`desktop-backdrop-${desktopShow.id}`}
              src={desktopBackdrop}
              fallbackTitle={desktopShow.title}
              hideFallback={isVideoPlaying}
              fallbackClassName="absolute inset-0 w-full h-full bg-[#090b10] flex items-center justify-center p-6 text-center select-none"
              fallbackTextClassName="text-white/80 font-bold text-xl font-sans"
              className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ${
                isAnimatingSlide
                  ? slideDirection === 'next'
                    ? 'animate-in slide-in-from-right-8 fade-in duration-500'
                    : 'animate-in slide-in-from-left-8 fade-in duration-500'
                  : ''
              }`}
            />

            {/* Preview Video */}
            {!isMobileScreen && desktopTrailer && shouldPlayVideo && isInViewport && !isPaused && (
              <video
                ref={(el) => {
                  videoRefs.current[currentIndex] = el;
                }}
                key={`desktop-video-${desktopShow.id}-${desktopTrailer}`}
                src={desktopTrailer}
                poster={desktopBackdrop}
                autoPlay
                muted={effectiveMuted}
                playsInline
                onWaiting={() => setIsVideoLoading(true)}
                onPlaying={handleVideoPlaying}
                onCanPlay={() => setIsVideoLoading(false)}
                onLoadedData={() => setIsVideoLoading(false)}
                onEnded={handleVideoEnded}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  isVideoPlaying ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Smooth Left-to-Right Seamless Dissolve */}
            <div
              className="absolute inset-y-0 left-0 w-40 pointer-events-none z-10"
              style={{
                background:
                  'linear-gradient(to right, #090b10 0%, rgba(9,11,16,0.94) 22%, rgba(9,11,16,0.58) 52%, rgba(9,11,16,0.18) 78%, transparent 100%)'
              }}
            />
          </div>

          {/* Left Column Content with pop-out animation on change */}
          <div
            key={`desktop-info-${desktopShow.id}`}
            className="relative z-20 w-[44%] lg:w-[42%] p-8 lg:p-12 flex flex-col items-start gap-3 animate-in zoom-in-95 fade-in duration-300"
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
                onClick={() => onOpenDetails(desktopShow)}
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
                <div className="w-8 h-8 rounded-full bg-black/55 text-white flex items-center justify-center border border-white/15">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              ) : (
                <button
                  onClick={handleToggleMute}
                  className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer border border-white/20 transition-colors"
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

      {/* ========================================================================= */}
      {/* MOBILE LAYOUT                                                             */}
      {/* - Swiping strictly scrolls 1 card no more                                 */}
      {/* - No loading indicator during poster stay time; shows only if buffering   */}
      {/* - Only mounts mobile video when on mobile screen (zero audio echo)        */}
      {/* ========================================================================= */}
      <div className="md:hidden relative w-full overflow-hidden z-10">
        <div
          ref={mobileScrollRef}
          onScroll={handleMobileScroll}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ scrollPaddingLeft: '14px' }}
          className="flex items-center overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar scroll-pl-3.5 sm:scroll-pl-4 pl-3.5 sm:pl-4 pr-10 py-3 select-none relative z-10"
        >
          {mobileFeedShows.map((showItem, idx) => {
            const isActive = idx === currentIndex;
            const itemBackdrop = showItem.mobileSpecialSingleFeedUrl || showItem.backdropUrl2 || showItem.backdropUrl || showItem.posterLandscapeUrl;
            const itemTrailer = showItem.trailerUrl || (showItem as any).streamUrl;

            return (
              <div
                key={showItem.id}
                ref={(el) => {
                  mobileCardRefs.current[idx] = el;
                }}
                data-special-card="true"
                className="relative shrink-0 snap-start snap-always mr-2.5 w-[calc(100vw-36px)] sm:w-[calc(100vw-3rem)] max-w-[420px]"
              >
                {/* The Card: No border, smooth rounded corners */}
                <div
                  onClick={() => onOpenDetails(showItem)}
                  className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#14151b] shadow-xl cursor-pointer"
                >
                  {/* Base Backdrop Artwork */}
                  <MediaImage
                    src={itemBackdrop}
                    fallbackTitle={showItem.title}
                    hideFallback={isActive && isVideoPlaying}
                    fallbackClassName="absolute inset-0 w-full h-full bg-[#14151b] flex items-center justify-center p-4 text-center select-none"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Video Preview:
                      Rendered ONLY on mobile screens for active card, preventing duplicate audio echo */}
                  {isMobileScreen && isActive && itemTrailer && shouldPlayVideo && isInViewport && !isPaused && (
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
                      onCanPlay={() => setIsVideoLoading(false)}
                      onLoadedData={() => setIsVideoLoading(false)}
                      onEnded={handleVideoEnded}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        isVideoPlaying ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}

                  {/* Top-Right Mute / Loading Icon:
                      "in mobile layout it not show loading between the time of poster to preview as it is stay time loading show if the video actually waiting to load"
                      During the 1.5s stay time (shouldPlayVideo = false), this container is not rendered at all.
                      When preview starts, loader only renders if genuinely buffering/waiting! */}
                  {isActive && shouldPlayVideo && (
                    <div className="absolute top-3 right-3 z-30 pointer-events-auto">
                      {isVideoLoading && !isVideoPlaying ? (
                        <div className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/10">
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                        </div>
                      ) : (
                        <button
                          onClick={handleToggleMute}
                          className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-90 transition-transform border border-white/10"
                          aria-label={effectiveMuted ? 'Unmute' : 'Mute'}
                        >
                          {effectiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}

                  {/* PNG Logo Inside Card over backdrop - stays full big size without zooming out */}
                  <div className="absolute bottom-3.5 left-4 sm:left-5 right-3.5 z-20 flex items-end justify-between gap-2 pointer-events-none transition-all duration-300">
                    <div className="origin-bottom-left">
                      {showItem.titleLogoUrl ? (
                        <img
                          src={showItem.titleLogoUrl}
                          alt={showItem.title}
                          referrerPolicy="no-referrer"
                          className="h-16 sm:h-20 w-auto max-h-20 max-w-[260px] sm:max-w-[320px] object-contain object-left"
                        />
                      ) : (
                        <h4 className="text-white font-extrabold text-base sm:text-lg tracking-tight drop-shadow-md">
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
