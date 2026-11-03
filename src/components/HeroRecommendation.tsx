import React, { useState, useRef, useEffect } from 'react';
import { Show } from '../types';
import { Play, Volume2, VolumeX, RotateCcw, Plus, Check, Info } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { getActiveArtwork } from '../utils/artworkRotator';
import { attachHlsVideo } from '../utils/hlsHelper';

interface HeroRecommendationProps {
  show: Show;
  allShows?: Show[];
  isInWatchlist: boolean;
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlay: (show: Show) => void;
  onSelectHeroShow?: (show: Show) => void;
  isPausedByFeedHover?: boolean;
  isPausedByModal?: boolean;
  isPaused?: boolean;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (forcedValue?: boolean) => void;
  isMobile?: boolean;
  mobileRecommendationStyle?: 'portrait' | 'landscape';
}

export const HeroRecommendation: React.FC<HeroRecommendationProps> = ({
  show,
  isInWatchlist = false,
  onToggleWatchlist,
  onOpenDetails,
  onPlay,
  isPausedByFeedHover = false,
  isPausedByModal = false,
  isPaused = false,
  isGlobalMuted = false,
  onToggleGlobalMute,
  isMobile,
  mobileRecommendationStyle = 'portrait'
}) => {
  const isEffectivelyPaused = isPaused || isPausedByModal || isPausedByFeedHover;
  const [shouldLoadPreview, setShouldLoadPreview] = useState<boolean>(false);
  const [localMuted, setLocalMuted] = useState<boolean>(false);
  const isMuted = onToggleGlobalMute ? isGlobalMuted : localMuted;

  const activeArtwork = show ? getActiveArtwork(show) : ({} as any);
  const activeBackdrop = activeArtwork?.backdropUrl || show?.backdropUrl || show?.posterLandscapeUrl || '';

  const [isTitleShrunk, setIsTitleShrunk] = useState<boolean>(false);
  const [backdropSrc, setBackdropSrc] = useState<string>(activeBackdrop);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [isPreviewEnded, setIsPreviewEnded] = useState<boolean>(false);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  // Mobile layout detection:
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileLayout = isMobile !== undefined ? isMobile : windowWidth <= 768;
  const isLandscapeMobile = isMobileLayout && mobileRecommendationStyle === 'landscape';
  const isPortraitMobile = isMobileLayout && mobileRecommendationStyle !== 'landscape';

  // Desktop zoom >= 150% detection (width <= 480px)
  const checkIsZoomed = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 480;
  };

  const [isZoomedMode, setIsZoomedMode] = useState<boolean>(checkIsZoomed);

  useEffect(() => {
    const handleZoomCheck = () => {
      setIsZoomedMode(checkIsZoomed());
    };

    window.addEventListener('resize', handleZoomCheck);
    return () => window.removeEventListener('resize', handleZoomCheck);
  }, []);

  const wasPlayingBeforeTabSwitchRef = useRef<boolean>(false);

  // When user switches tab in browser, pause recommendation preview; when user returns, resume where left off
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          wasPlayingBeforeTabSwitchRef.current = true;
          videoRef.current.pause();
          setIsVideoPlaying(false);
        }
      } else {
        if (wasPlayingBeforeTabSwitchRef.current && videoRef.current && !isPreviewEnded && !isPausedByFeedHover && !isPausedByModal) {
          wasPlayingBeforeTabSwitchRef.current = false;
          videoRef.current.play().then(() => {
            setIsVideoPlaying(true);
          }).catch(() => {});
        }
      }
    };

    const handleBlur = () => {
      if (videoRef.current && !videoRef.current.paused) {
        wasPlayingBeforeTabSwitchRef.current = true;
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    };

    const handleFocus = () => {
      if (wasPlayingBeforeTabSwitchRef.current && videoRef.current && !isPreviewEnded && !isPausedByFeedHover && !isPausedByModal) {
        wasPlayingBeforeTabSwitchRef.current = false;
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isPreviewEnded, isPausedByFeedHover, isPausedByModal]);

  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shrinkTimerRef = useRef<number | null>(null);
  const previewTimerRef = useRef<number | null>(null);
  const hasTriggeredShrinkRef = useRef<boolean>(false);

  // Monitor visibility of recommendation card relative to navigation bar:
  // Preview pauses when 40% of the poster/video gets under the navigation bar
  useEffect(() => {
    const handleScrollCheck = () => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const navEl = document.querySelector('header') || document.querySelector('nav');
      const navBottom = navEl ? navEl.getBoundingClientRect().bottom : 68;

      // Amount of the card that has scrolled under the navigation bar
      const amountUnderNav = Math.max(0, navBottom - rect.top);
      const isFortyPercentUnderNav = rect.height > 0 && amountUnderNav >= rect.height * 0.40;
      const isCompletelyOutOfView = rect.bottom <= 0 || rect.top >= window.innerHeight;

      setIsIntersecting(!(isFortyPercentUnderNav || isCompletelyOutOfView));
    };

    window.addEventListener('scroll', handleScrollCheck, { passive: true });
    window.addEventListener('resize', handleScrollCheck, { passive: true });
    handleScrollCheck();
    return () => {
      window.removeEventListener('scroll', handleScrollCheck);
      window.removeEventListener('resize', handleScrollCheck);
    };
  }, [show.id]);

  const [isBackdropLoaded, setIsBackdropLoaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Reset state when show changes
    setIsTitleShrunk(false);
    hasTriggeredShrinkRef.current = false;
    setBackdropSrc(activeBackdrop);
    setIsVideoPlaying(false);
    setVideoError(false);
    setShouldLoadPreview(false);
    setIsPreviewEnded(false);
    setIsBackdropLoaded(false);

    if (shrinkTimerRef.current) {
      window.clearTimeout(shrinkTimerRef.current);
      shrinkTimerRef.current = null;
    }
    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
      previewTimerRef.current = null;
    }

    return () => {
      if (shrinkTimerRef.current) window.clearTimeout(shrinkTimerRef.current);
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [show.id, activeBackdrop]);

  // Check if image was instantly loaded from cache
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0 && !isBackdropLoaded) {
      setIsBackdropLoaded(true);
    }
  }, [backdropSrc]);

  // The preview on recommendation:
  // 1. Mobile Portrait (2:3 card): NEVER autoplay trailer in background
  // 2. Mobile Landscape (16:9 card): Show backdrop for 3 seconds then play preview
  // 3. Desktop / Tablet: Show backdrop for 2 seconds + loading time
  useEffect(() => {
    if (!isBackdropLoaded) return;

    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current);
    }

    // On mobile portrait mode: do NOT autoplay trailer in background
    if (isPortraitMobile) {
      setShouldLoadPreview(false);
      return;
    }

    // Delay: 3000ms (3 seconds) on mobile landscape, 2000ms on desktop/tablet
    const previewDelay = isLandscapeMobile ? 3000 : 2000;

    previewTimerRef.current = window.setTimeout(() => {
      setShouldLoadPreview(true);
    }, previewDelay);

    return () => {
      if (previewTimerRef.current) window.clearTimeout(previewTimerRef.current);
    };
  }, [isBackdropLoaded, show.id, isPortraitMobile, isLandscapeMobile]);

  // Video attachment effect supporting .m3u8 HLS and direct video
  useEffect(() => {
    if (isPortraitMobile || !shouldLoadPreview || isPreviewEnded || !show.trailerUrl) {
      setIsVideoPlaying(false);
      return;
    }
    const video = videoRef.current;
    if (!video) return;

    const cleanup = attachHlsVideo(video, show.trailerUrl, {
      autoPlay: true,
      muted: isMuted
    });

    return () => {
      setIsVideoPlaying(false);
      if (cleanup) cleanup();
    };
  }, [shouldLoadPreview, isPreviewEnded, show.trailerUrl, isPortraitMobile]);

  // Sync mute state directly without restarting video playback
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1.0;
      }
    }
  }, [isMuted]);

  // Viewport & hover playback coordinator:
  // Automatically plays when visible on screen, pauses when scrolled out of view or feed card hovered or modal open,
  // and resumes from where it left off when visible again!
  const isPausedByTabRef = useRef<boolean>(false);

  useEffect(() => {
    if (!shouldLoadPreview || isPreviewEnded) return;

    const shouldBePlaying = isIntersecting && !isEffectivelyPaused;

    if (shouldBePlaying) {
      if (videoRef.current && videoRef.current.paused && !document.hidden) {
        videoRef.current.play().then(() => {
          setIsVideoPlaying(true);
        }).catch(() => {});
      }
    } else {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  }, [shouldLoadPreview, isPreviewEnded, isIntersecting, isEffectivelyPaused]);

  // Tab switch handler: When user switches browser tab, pause preview; when user reopens tab, resume where left off!
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
          isPausedByTabRef.current = true;
          setIsVideoPlaying(false);
        }
      } else {
        if (isPausedByTabRef.current && videoRef.current && !isPreviewEnded) {
          isPausedByTabRef.current = false;
          const shouldBePlaying = isIntersecting && !isEffectivelyPaused;
          if (shouldBePlaying) {
            videoRef.current.play().then(() => {
              setIsVideoPlaying(true);
            }).catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPreviewEnded, isIntersecting, isEffectivelyPaused]);

  // Attempt audio playback when preview mounts
  useEffect(() => {
    if (!shouldLoadPreview || isPreviewEnded) return;
    const video = videoRef.current;
    if (!video) return;

    // If user has intentionally muted, respect their preference
    if (isMuted) {
      video.muted = true;
      if (isIntersecting && !isEffectivelyPaused) {
        video.play().then(() => setIsVideoPlaying(true)).catch(() => {});
      }
      return;
    }

    // User wants sound: try unmuted playback with full volume
    video.muted = false;
    video.volume = 1.0;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {}

    if (isIntersecting && !isEffectivelyPaused) {
      video
        .play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current
              .play()
              .then(() => {
                setIsVideoPlaying(true);
                if (!isMuted) {
                  const unlockAudio = () => {
                    if (videoRef.current && !isMuted) {
                      try {
                        videoRef.current.muted = false;
                        videoRef.current.volume = 1.0;
                      } catch {}
                    }
                    events.forEach((ev) => window.removeEventListener(ev, unlockAudio, { capture: true }));
                  };
                  const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
                  events.forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, once: true, passive: true }));
                }
              })
              .catch(() => {});
          }
        });
    }
  }, [shouldLoadPreview, isMuted, isPreviewEnded, isIntersecting, isPausedByFeedHover, isPausedByModal]);

  // Sync mute state dynamically when user intentionally toggles
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1.0;
      }
    }
  }, [isMuted]);

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
    const nextMuted = !isMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
      if (!nextMuted) {
        videoRef.current.volume = 1.0;
      }
    }
    if (onToggleGlobalMute) {
      onToggleGlobalMute(nextMuted);
    } else {
      setLocalMuted(nextMuted);
    }
  };

  const handlePreviewEnded = () => {
    setIsPreviewEnded(true);
    setIsVideoPlaying(false);
  };

  const handleReplayPreview = () => {
    setIsPreviewEnded(false);
    setShouldLoadPreview(true);
    setIsVideoPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const getTagline = (s: Show) => {
    if (!s) return '';
    if (s.announcementPill && s.announcementPill.trim()) return s.announcementPill.trim();
    return s.shortDescription || 'Watch Now';
  };

  if (!show) return null;

  const ambientColor = show.recommendationBackdropColor || show.ambientColor || '#b45309';

  return (
    <div className="relative w-full pt-0 pb-3 md:pt-20 md:pb-6 select-none overflow-visible">
      {/* 
        Rich, seamless ambient glow radiating behind the recommendation card
        Contained on mobile so it does not bleed into the top filter strip
      */}
      <div className="absolute -top-4 md:-top-28 sm:-top-36 inset-x-0 -bottom-8 pointer-events-none z-0 flex items-center justify-center overflow-visible">
        {/* Soft diffused wide aura that extends smoothly */}
        <div
          className="w-full max-w-[1680px] h-[115%] rounded-full blur-[120px] md:blur-[180px] transition-colors duration-1000 ease-out"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% 40%, ${ambientColor} 0%, ${ambientColor}65 35%, ${ambientColor}20 65%, transparent 100%)`,
            opacity: 0.72
          }}
        />
      </div>

      {/* Floating Hero Card with ambient shadow reflection matching show theme (reduced side area on mobile: px-2.5) */}
      <div className="w-full px-2.5 sm:px-4 md:px-8 xl:px-12 relative z-10">
        {isPortraitMobile || (!isMobileLayout && isZoomedMode) ? (
          /* ========================================================================= */
          /* VERTICAL RECOMMENDATION (When screen zoom > 125%): NO preview, vertical backdrop, */
          /* PNG title, maturity rating, genre, and side-by-side Play & More Info buttons */
          /* ========================================================================= */
          <div
            ref={cardRef}
            onClick={() => onOpenDetails(show)}
            className="relative w-full max-w-[480px] mx-auto aspect-[2/3] rounded-[14px] sm:rounded-[18px] overflow-hidden bg-[#121319] border-0 transition-shadow duration-1000 select-none shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] cursor-pointer"
            style={{
              boxShadow: `0 30px 80px -15px rgba(0,0,0,0.98), 0 10px 40px rgba(0,0,0,0.85), 0 0 50px ${ambientColor}55`
            }}
          >
            {/* Subtle inner overlay border with grey color, reduced to 1.8px width and 9% opacity */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border-[1.8px] border-zinc-400/[0.09]" />

            {/* Base Vertical Backdrop Image */}
            <img
              src={show.posterVerticalUrl || show.posterLandscapeUrl || backdropSrc}
              alt={show.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />

            {/* Seamless Vignette & Bottom Shadow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Subtle bottom glare matching popout view for enhanced contrast and depth */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'radial-gradient(ellipse 75% 65% at 50% 100%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.04) 60%, transparent 80%)'
              }}
            />

            {/* Vertical Layout Content: Centered with PNG logo, metadata, and Play & My List pill buttons */}
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20 flex flex-col items-center text-center">
              {/* Show Title PNG Logo */}
              <div ref={logoRef} className="mb-2 sm:mb-3 max-w-[220px] sm:max-w-[280px]">
                <ShowTitleLogo show={show} />
              </div>

              {/* Metadata Line */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-white/90 mb-3 sm:mb-4 drop-shadow">
                <span>{show.releaseYear.split('-')[0].trim()}</span>
                <span className="text-white/60 font-bold">•</span>
                <span>{show.maturityRating}</span>
                <span className="text-white/60 font-bold">•</span>
                <span>{show.genres[0] || 'Drama'}</span>
                {show.durationOrSeasons && (
                  <>
                    <span className="text-white/60 font-bold">•</span>
                    <span>{show.durationOrSeasons}</span>
                  </>
                )}
              </div>

              {/* Two Pill Buttons Side-by-Side: Play & Add to My List */}
              <div className="flex items-center gap-2.5 sm:gap-3 w-full max-w-[340px] sm:max-w-[380px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlay(show);
                  }}
                  className="flex-1 py-2 sm:py-2.5 px-4 sm:px-5 rounded-full bg-white hover:bg-white/90 text-black font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-xl cursor-pointer active:scale-95 transition-transform"
                  aria-label={`Play ${show.title}`}
                >
                  <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                  </svg>
                  <span>Play</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(show.id);
                  }}
                  className="flex-1 py-2 sm:py-2.5 px-3.5 sm:px-4 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xl cursor-pointer active:scale-95 transition-transform"
                  aria-label="My List"
                >
                  {isInWatchlist ? (
                    <Check className="w-4 h-4 text-white stroke-[2.5]" />
                  ) : (
                    <Plus className="w-4 h-4 text-white" />
                  )}
                  <span>My List</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* STANDARD LANDSCAPE RECOMMENDATION (Matching Netflix UI in image) */
          /* Exact Netflix horizontal aspect ratio (2.22:1) from 25% to 125% screen size */
          /* ========================================================================= */
          <div
            ref={cardRef}
            onClick={() => {
              if (isLandscapeMobile || (typeof window !== 'undefined' && window.innerWidth <= 768)) {
                onOpenDetails(show);
              }
            }}
            className={`relative w-full ${
              isLandscapeMobile ? 'aspect-[16/9] max-w-full' : 'aspect-[2.22/1]'
            } rounded-[14px] sm:rounded-[18px] md:rounded-[22px] overflow-hidden bg-[#121319] border-0 transition-shadow duration-1000 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.98)] cursor-pointer sm:cursor-default`}
            style={{
              boxShadow: `0 35px 95px -15px rgba(0,0,0,0.98), 0 15px 45px rgba(0,0,0,0.8), 0 0 60px ${ambientColor}65, 0 0 110px ${ambientColor}25`
            }}
          >
            {/* Subtle inner overlay border with grey color, reduced to 2.5px width and 9% opacity */}
            <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border-[2.5px] border-zinc-400/[0.09]" />
            {/* Media: Cinematic Backdrop Image + Optional Video Preview Overlay (zero black screen) */}
            <div className="absolute inset-0 z-0 bg-[#0d0e12]">
              {/* Primary Base Layer: Backdrop Image (Always visible underneath - stays visible if video loading or error) */}
              <img
                ref={imgRef}
                src={backdropSrc}
                alt={show.title}
                loading="eager"
                decoding="async"
                {...({ fetchPriority: 'high' } as any)}
                referrerPolicy="no-referrer"
                onLoad={() => setIsBackdropLoaded(true)}
                onError={() => {
                  setIsBackdropLoaded(true);
                  if (show.posterLandscapeUrl && backdropSrc !== show.posterLandscapeUrl) {
                    setBackdropSrc(show.posterLandscapeUrl);
                  }
                }}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />

              {/* Optional Video Preview Overlay */}
              {shouldLoadPreview && !videoError && !isPreviewEnded && show.trailerUrl && (
                <video
                  ref={videoRef}
                  poster={backdropSrc}
                  autoPlay
                  muted={isMuted}
                  playsInline
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onPlaying={() => {
                    setIsVideoPlaying(true);
                    handleAutoplayStarted();
                  }}
                  onEnded={handlePreviewEnded}
                  onError={() => {
                    setVideoError(true);
                    setShouldLoadPreview(false);
                    setIsVideoPlaying(false);
                  }}
                  className={`absolute inset-0 w-full h-full object-cover object-center scale-102 transition-opacity duration-700 ${
                    isVideoPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />
              )}
            </div>

            {/* Subtle bottom-left corner glare for PNG title contrast (shows on BOTH backdrop & preview video, zero hard edges) */}
            <div
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'radial-gradient(ellipse 75% 65% at 0% 100%, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.25) 35%, rgba(0,0,0,0.04) 60%, transparent 80%)'
              }}
            />

            {/* Top-Left Source Watermark (visible ONLY with video preview, NOT on poster or backdrop) */}
            {shouldLoadPreview && !videoError && isVideoPlaying && !isPreviewEnded && show.sourceWatermarkUrl && (
              <div className="absolute top-4 left-5 sm:top-5 sm:left-6 md:top-6 md:left-8 z-20 pointer-events-none transition-opacity duration-300">
                <img
                  src={show.sourceWatermarkUrl}
                  alt="Source Watermark"
                  referrerPolicy="no-referrer"
                  className="max-h-7 sm:max-h-9 md:max-h-10 w-auto object-contain opacity-85 drop-shadow-md select-none"
                />
              </div>
            )}

            {/* Top-Right Circular Button: Mute/Unmute while playing, or Reload when preview ends */}
            {isPreviewEnded ? (
              <div className="absolute top-4 right-5 sm:top-5 sm:right-6 md:top-6 md:right-8 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReplayPreview();
                  }}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 xl:w-9.5 xl:h-9.5 rounded-full bg-black/40 hover:bg-black/60 text-white border-0 flex items-center justify-center cursor-pointer shadow-md"
                  aria-label="Replay preview"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                </button>
              </div>
            ) : shouldLoadPreview && !videoError && isVideoPlaying && !isPreviewEnded ? (
              <div className="absolute top-4 right-5 sm:top-5 sm:right-6 md:top-6 md:right-8 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSound();
                  }}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 xl:w-9.5 xl:h-9.5 rounded-full bg-black/25 hover:bg-black/40 text-white border-0 flex items-center justify-center cursor-pointer shadow-md"
                  aria-label="Toggle sound"
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  )}
                </button>
              </div>
            ) : null}

            {/* Bottom-Right Tagline Pill (hidden on 16:9 mobile recommendation) */}
            {!isLandscapeMobile && (
              <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 md:bottom-9 md:right-9 xl:bottom-10 xl:right-10 z-20 hidden sm:flex items-center">
                <div className="bg-black/35 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 text-xs md:text-sm font-bold text-white shadow-md border-0 select-none">
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <linearGradient id="megaphoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="40%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#dc2626" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M11 5L6 9H2V15H6L11 19V5Z"
                      fill="url(#megaphoneGrad)"
                    />
                    <path
                      d="M15.54 8.46C16.48 9.4 17 10.66 17 12C17 13.34 16.48 14.6 15.54 15.54M19.07 4.93C20.94 6.8 22 9.33 22 12C22 14.67 20.94 17.2 19.07 19.07"
                      stroke="url(#megaphoneGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="tracking-wide text-xs md:text-[13px] xl:text-[13.5px] font-semibold text-white/95">{getTagline(show)}</span>
                </div>
              </div>
            )}

            {/* Bottom-Left Hero Content (Title PNG Logo, Metadata, and Play/More Info buttons) */}
            <div className="absolute bottom-4 left-4 sm:bottom-7 sm:left-7 md:bottom-9 md:left-9 xl:bottom-10 xl:left-10 z-20 max-w-xl 2xl:max-w-2xl origin-bottom-left flex flex-col items-start">
              {/* Show Title PNG Logo (slightly smaller in 16:9 mobile view as requested) */}
              <div
                ref={logoRef}
                style={{
                  transform: isLandscapeMobile ? 'scale(0.8)' : isTitleShrunk ? 'scale(0.88)' : 'scale(1)',
                  transformOrigin: 'bottom left',
                  transition: isTitleShrunk ? 'transform 1500ms linear' : 'none',
                  willChange: 'transform'
                }}
                className={`mb-2 sm:mb-3 md:mb-3.5 self-start origin-bottom-left ${
                  isLandscapeMobile ? 'max-w-[170px]' : ''
                }`}
              >
                <ShowTitleLogo show={show} />
              </div>

              {/* Metadata Line: On mobile layout, do NOT include year info or series/film info */}
              <div className={`flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs md:text-sm xl:text-[14.5px] font-semibold text-white/90 ${isLandscapeMobile ? 'mb-0' : 'mb-2 sm:mb-4'} drop-shadow`}>
                {!isMobileLayout && (
                  <>
                    <span>{show.type === 'movie' ? 'Film' : 'Series'}</span>
                    <span className="text-white/60 font-bold">•</span>
                  </>
                )}
                <span>{show.genres[0] || 'Drama'}</span>
                {!isMobileLayout && (
                  <>
                    <span className="text-white/60 font-bold">•</span>
                    <span>{show.releaseYear.split('-')[0].trim()}</span>
                  </>
                )}
                <span className="text-white/60 font-bold">•</span>
                <span>{show.durationOrSeasons}</span>
                <span className="text-white/60 font-bold">•</span>
                <span>{show.maturityRating}</span>
              </div>

              {/* Two Pill Buttons: Play & More Info (hidden on 16:9 mobile recommendation - tap anywhere opens details) */}
              {!isLandscapeMobile && (
                <div className="flex items-center gap-2.5 sm:gap-3.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(show);
                    }}
                    className="pl-2.5 pr-3 sm:pl-3.5 sm:pr-4 xl:pl-4 xl:pr-4.5 py-1.5 sm:py-2 xl:py-2.5 rounded-full bg-white hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none text-black font-bold text-[14px] sm:text-[16px] xl:text-[17px] flex items-center gap-1.5 shadow-lg cursor-pointer tracking-wide transition-colors"
                    aria-label={`Play ${show.title}`}
                  >
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 xl:w-5.5 xl:h-5.5 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                    </svg>
                    <span className="tracking-wide">Play</span>
                  </button>

                  {/* More Info button across all views (mobile, tablet, desktop) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetails(show);
                    }}
                    className="px-4 sm:px-5 xl:px-5.5 py-1.5 sm:py-2 xl:py-2.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none text-white font-semibold text-[13px] sm:text-[15px] xl:text-[16px] flex items-center justify-center transition-colors cursor-pointer shadow-md tracking-wide"
                    aria-label={`More info about ${show.title}`}
                  >
                    <span>More Info</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
