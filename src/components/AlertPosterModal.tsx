import React, { useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Info } from 'lucide-react';
import { MediaImage } from './MediaImage';
import { attachHlsVideo } from '../utils/hlsHelper';

interface AlertPosterModalProps {
  isOpen: boolean;
  imageUrl?: string;
  videoUrl?: string;
  isAd?: boolean;
  adSkipDelaySeconds?: number;
  adRequireFullWatch?: boolean;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonAction?: 'close' | 'link' | 'login';
  buttonUrl?: string;
  onClose: () => void;
  onActionTriggered?: () => void;
  onOpenLogin: () => void;
  onNavigateInternal?: (url: string) => void;
}

const formatAdCountdown = (secondsRemaining: number): string => {
  const safe = Math.max(0, Math.ceil(secondsRemaining));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const AlertPosterModal: React.FC<AlertPosterModalProps> = ({
  isOpen,
  imageUrl,
  videoUrl,
  isAd = false,
  adSkipDelaySeconds = 5,
  adRequireFullWatch = false,
  title = '',
  subtitle = '',
  buttonText = 'Close',
  buttonAction = 'close',
  buttonUrl,
  onClose,
  onActionTriggered,
  onOpenLogin,
  onNavigateInternal
}) => {
  const trimmedVideoUrl = (videoUrl || '').trim();
  const hasVideo = Boolean(trimmedVideoUrl);
  const isVideoAd = Boolean(isAd && hasVideo);
  const isNonAdVideo = Boolean(!isAd && hasVideo);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);
  const [hasVideoError, setHasVideoError] = useState<boolean>(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isAdMuted, setIsAdMuted] = useState<boolean>(false);
  const [adElapsedSec, setAdElapsedSec] = useState<number>(0);
  const [adDurationSec, setAdDurationSec] = useState<number>(0);
  const [isAdEnded, setIsAdEnded] = useState<boolean>(false);
  const [isAdPosterLeadDone, setIsAdPosterLeadDone] = useState<boolean>(false);
  const [isEntered, setIsEntered] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);
  const isClosingRef = useRef<boolean>(false);

  // Whether user is locked inside mandatory ad playback
  const isAdDismissBlocked = Boolean(isVideoAd && !isAdEnded && !hasVideoError);

  const handleAnimatedClose = (afterClose?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);
    setIsEntered(false);
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      try {
        if (videoRef.current) {
          videoRef.current.pause();
        }
      } catch {}
      onClose();
      afterClose?.();
    }, 230);
  };

  useEffect(() => {
    if (!isOpen) return;
    isClosingRef.current = false;
    setIsClosing(false);
    setIsEntered(false);
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setIsEntered(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    setIsVideoLoaded(false);
    setHasVideoError(false);
    setIsVideoPlaying(false);
    setAdElapsedSec(0);
    setAdDurationSec(0);
    setIsAdEnded(false);
    setIsAdMuted(false);
    setIsAdPosterLeadDone(false);
  }, [trimmedVideoUrl, isVideoAd, isOpen]);

  // Show poster for at least 2 seconds before starting video ad playback
  useEffect(() => {
    if (!isOpen || !isVideoAd) {
      setIsAdPosterLeadDone(false);
      return;
    }
    setIsAdPosterLeadDone(false);
    const timer = window.setTimeout(() => {
      setIsAdPosterLeadDone(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isOpen, isVideoAd, trimmedVideoUrl]);

  // Trigger ad video playback once BOTH the 2s poster hold has finished and the video is ready
  useEffect(() => {
    if (!isOpen || !isVideoAd || !isAdPosterLeadDone || isAdEnded || hasVideoError) return;
    const vid = videoRef.current;
    if (!vid || !vid.paused) return;
    if (vid.readyState >= 2 || isVideoLoaded) {
      vid.muted = false;
      setIsAdMuted(false);
      vid.play().catch(() => {
        vid.muted = true;
        setIsAdMuted(true);
        vid.play().catch(() => {});
      });
    }
  }, [isOpen, isVideoAd, isAdPosterLeadDone, isVideoLoaded, isAdEnded, hasVideoError]);

  // When ad video finishes, show poster again for 2 seconds then auto-dismiss smoothly
  useEffect(() => {
    if (!isOpen || !isVideoAd || !isAdEnded) return;
    const timer = window.setTimeout(() => {
      handleAnimatedClose();
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [isOpen, isVideoAd, isAdEnded]);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Always pause all background preview videos whenever Alert Poster is showing
    const pauseBackgroundVideos = () => {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach((v) => {
          if (!v.closest('[data-alert-poster-modal="true"]') && !v.paused) {
            v.pause();
          }
        });
      } catch {}
    };

    pauseBackgroundVideos();
    const handleAnyVideoPlay = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'VIDEO' && !target.closest('[data-alert-poster-modal="true"]')) {
        try {
          (target as HTMLVideoElement).pause();
        } catch {}
      }
    };
    document.addEventListener('play', handleAnyVideoPlay, true);
    const guardTimer = window.setTimeout(pauseBackgroundVideos, 120);

    return () => {
      window.clearTimeout(guardTimer);
      document.removeEventListener('play', handleAnyVideoPlay, true);
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  // Attach HLS / direct stream when video URL is provided (buffer paused first so 2s poster hold is respected)
  useEffect(() => {
    if (!isOpen || !hasVideo || !videoRef.current) return;
    const videoEl = videoRef.current;
    const detach = attachHlsVideo(videoEl, trimmedVideoUrl, {
      autoPlay: false,
      muted: isNonAdVideo ? false : undefined,
      onLoaded: () => {
        setIsVideoLoaded(true);
        setHasVideoError(false);
        if (isFinite(videoEl.duration) && videoEl.duration > 0) {
          setAdDurationSec(videoEl.duration);
        }
      },
      onError: () => {
        setHasVideoError(true);
        setIsVideoLoaded(false);
        setIsVideoPlaying(false);
      }
    });
    return () => {
      try {
        detach?.();
      } catch {}
    };
  }, [isOpen, hasVideo, trimmedVideoUrl, isVideoAd, isNonAdVideo]);

  // Block Escape key while mandatory Video Ad is active
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAdDismissBlocked) {
          e.preventDefault();
          e.stopPropagation();
        } else {
          handleAnimatedClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, isAdDismissBlocked]);

  if (!isOpen) return null;

  const navigateTargetUrl = (rawUrl?: string) => {
    if (!rawUrl || !rawUrl.trim()) return;
    const target = rawUrl.trim();
    if (onNavigateInternal) {
      if (target.startsWith('/')) {
        handleAnimatedClose(() => onNavigateInternal(target));
        return;
      }
      if (/^(watch|share|series|movies|categories|watchlist|collection|search)\b/i.test(target)) {
        handleAnimatedClose(() => onNavigateInternal(`/${target}`));
        return;
      }
      try {
        const parsed = new URL(target);
        if (
          typeof window !== 'undefined' &&
          parsed.origin === window.location.origin &&
          (parsed.pathname.startsWith('/watch/') || parsed.pathname.startsWith('/share/'))
        ) {
          handleAnimatedClose(() =>
            onNavigateInternal(`${parsed.pathname}${parsed.search}${parsed.hash}`)
          );
          return;
        }
      } catch {}
    }
    const normalizedExternal = /^https?:\/\//i.test(target) ? target : `https://${target}`;
    window.open(normalizedExternal, '_blank', 'noopener,noreferrer');
    handleAnimatedClose();
  };

  const handleActionClick = () => {
    onActionTriggered?.();
    if (buttonAction === 'login') {
      handleAnimatedClose(() => onOpenLogin());
      return;
    }
    if (buttonAction === 'link' && buttonUrl && buttonUrl.trim()) {
      navigateTargetUrl(buttonUrl);
      return;
    }
    handleAnimatedClose();
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoaded(true);
    setHasVideoError(false);
    if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
      setAdDurationSec(videoRef.current.duration);
    }
    if (isVideoAd && isAdPosterLeadDone && videoRef.current && !isAdEnded && videoRef.current.paused) {
      const vid = videoRef.current;
      vid.muted = false;
      setIsAdMuted(false);
      vid.play().catch(() => {
        vid.muted = true;
        setIsAdMuted(true);
        vid.play().catch(() => {});
      });
    }
  };

  const handleToggleNonAdPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid || hasVideoError) return;
    vid.muted = false;
    if (vid.paused) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  };

  const handleToggleAdMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    setIsAdMuted(nextMuted);
  };

  const safeSkipDelay = Math.max(0, Number(adSkipDelaySeconds ?? 5));
  const isSkipVisible = Boolean(
    isVideoAd &&
      !adRequireFullWatch &&
      !isAdEnded &&
      isVideoLoaded &&
      isVideoPlaying &&
      adElapsedSec >= safeSkipDelay
  );
  const remainingSeconds = adDurationSec > 0 ? Math.max(0, adDurationSec - adElapsedSec) : 0;
  const showActiveVideo = Boolean(
    isVideoLoaded &&
      isVideoPlaying &&
      !hasVideoError &&
      (!isVideoAd || isAdPosterLeadDone)
  );
  const showTopAdTimer = Boolean(
    isVideoAd && showActiveVideo && !isAdEnded && adDurationSec > 0
  );

  return (
    <div
      data-alert-poster-modal="true"
      onClick={() => {
        if (!isAdDismissBlocked) {
          handleAnimatedClose();
        }
      }}
      className={`fixed inset-0 z-[220] flex items-center justify-center p-4 sm:p-6 select-none transition-opacity duration-250 ease-out ${
        isEntered && !isClosing ? 'opacity-100 bg-black/60' : 'opacity-0 bg-black/0'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[780px] aspect-[4/3] sm:aspect-[16/9] rounded-2xl md:rounded-[22px] overflow-hidden bg-[#141418] border-0 shadow-[0_28px_90px_rgba(0,0,0,0.92)] flex flex-col justify-end transition-all duration-250 ease-out ${
          isEntered && !isClosing
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-3'
        }`}
      >
        {/* Top-Left Yellow AD Badge (equal top & left container inset; converts into reduced-opacity AD + timer once ad starts) */}
        {isAd && (
          <div className="absolute top-3.5 left-3.5 z-30 pointer-events-none">
            {showTopAdTimer ? (
              <div className="inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-[5px] bg-black/30 text-white text-xs font-medium shadow-sm">
                <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans">
                  AD
                </span>
                <span className="tabular-nums font-semibold tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.75)]">
                  {formatAdCountdown(remainingSeconds)}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans shadow-sm">
                AD
              </span>
            )}
          </div>
        )}

        {/* Top-Right Button: Backgroundless Mute/Unmute ONLY while Video Ad is actively playing (never over poster image), else Close X */}
        {isVideoAd && !isAdEnded && !hasVideoError ? (
          showActiveVideo ? (
            <button
              type="button"
              onClick={handleToggleAdMute}
              aria-label={isAdMuted ? 'Unmute ad' : 'Mute ad'}
              className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-transparent border-0 text-white hover:text-white/90 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
            >
              {isAdMuted ? (
                <VolumeX className="w-4.5 h-4.5 stroke-[2.2] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
              ) : (
                <Volume2 className="w-4.5 h-4.5 stroke-[2.2] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
              )}
            </button>
          ) : null
        ) : (
          <button
            type="button"
            onClick={() => handleAnimatedClose()}
            aria-label="Close alert"
            className="absolute top-3.5 right-3.5 z-30 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 text-white border border-white/15 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <X className="w-4.5 h-4.5 stroke-[2.4]" />
          </button>
        )}

        {/* Video Layer (positioned above poster once playing so video frames render cleanly without poster covering it) */}
        {hasVideo && !hasVideoError && (
          <video
            ref={videoRef}
            playsInline
            preload="auto"
            muted={isNonAdVideo ? false : isAdMuted}
            onCanPlay={handleVideoCanPlay}
            onLoadedMetadata={() => {
              if (videoRef.current && isFinite(videoRef.current.duration)) {
                setAdDurationSec(videoRef.current.duration);
              }
            }}
            onPlay={() => {
              setIsVideoLoaded(true);
              setIsVideoPlaying(true);
            }}
            onPlaying={() => {
              setIsVideoLoaded(true);
              setIsVideoPlaying(true);
            }}
            onPause={() => setIsVideoPlaying(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setAdElapsedSec(videoRef.current.currentTime);
                if (!adDurationSec && isFinite(videoRef.current.duration)) {
                  setAdDurationSec(videoRef.current.duration);
                }
              }
            }}
            onEnded={() => {
              setIsVideoPlaying(false);
              setIsAdEnded(true);
            }}
            onError={() => {
              setHasVideoError(true);
              setIsVideoLoaded(false);
              setIsVideoPlaying(false);
            }}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out ${
              showActiveVideo ? 'opacity-100 z-[15]' : 'opacity-0 z-[5]'
            }`}
          />
        )}

        {/* Primary Poster Image Layer (Shows first for 2s cleanly; fades out once video plays; shows again for 2s on end) */}
        {imageUrl && imageUrl.trim() ? (
          <MediaImage
            src={imageUrl.trim()}
            fallbackTitle={title || ''}
            hideFallback={!title?.trim()}
            style={{
              opacity: showActiveVideo ? 0 : 1,
              transition: 'opacity 500ms ease-out'
            }}
            className="absolute inset-0 w-full h-full object-cover object-center z-10 pointer-events-none"
          />
        ) : (
          <div
            className={`absolute inset-0 w-full h-full z-10 pointer-events-none transition-opacity duration-500 ease-out ${
              showActiveVideo ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              background:
                'radial-gradient(circle at 75% 30%, rgba(225,29,72,0.45) 0%, rgba(20,20,28,0.95) 60%, #09090b 100%)'
            }}
          />
        )}

        {/* Subtle Bottom Glare (matches immersive popout view) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] z-[18]"
          style={{
            background:
              'linear-gradient(to top, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.32) 48%, rgba(0, 0, 0, 0) 100%)'
          }}
        />

        {/* Bottom-Left Info Button for Video-Enabled Ad Alert (moved slightly lower, backgroundless with slight shadow) */}
        {isVideoAd && buttonUrl && buttonUrl.trim() && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActionTriggered?.();
              navigateTargetUrl(buttonUrl);
            }}
            aria-label="Open ad information link"
            className="absolute bottom-2.5 left-3 z-30 w-8 h-8 rounded-full bg-transparent border-0 text-white hover:text-white/90 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          >
            <Info className="w-4.5 h-4.5 stroke-[2.2] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
          </button>
        )}

        {/* Non-Ad Video Alert: Mini Transparent Play/Pause Button in Bottom-Right (Always Unmuted) */}
        {isNonAdVideo && !hasVideoError && (
          <button
            type="button"
            onClick={handleToggleNonAdPlay}
            aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
            className="absolute bottom-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-black/35 hover:bg-black/55 text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all active:scale-95"
          >
            {isVideoPlaying ? (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4.5" y="4" width="5" height="16" rx="1" />
                <rect x="14.5" y="4" width="5" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>
        )}

        {/* Video Ad Bottom-Right Control: Skip Pill Button */}
        {isVideoAd && !isAdEnded && !hasVideoError && isSkipVisible && (
          <div className="absolute bottom-3.5 right-3.5 z-30 flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAnimatedClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white border border-white/20 text-xs sm:text-sm font-semibold shadow-lg cursor-pointer transition-all active:scale-95"
            >
              <span>Skip</span>
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M5 5.2v13.6a.8.8 0 0 0 1.24.67l10.2-6.8a.8.8 0 0 0 0-1.34L6.24 4.53A.8.8 0 0 0 5 5.2z" />
                <rect x="17.5" y="4.5" width="2.2" height="15" rx="0.6" />
              </svg>
            </button>
          </div>
        )}

        {/* Bottom-Left Overlay Content + CTA Pill Button (Never rendered on Video Ad Alerts; hides empty title/subtitle) */}
        {!isVideoAd && (Boolean(title?.trim()) || Boolean(subtitle?.trim()) || Boolean(buttonText?.trim())) && (
          <div
            className={`relative z-20 p-6 sm:p-8 md:p-10 max-w-lg text-left ${
              hasVideo ? 'pb-14 sm:pb-14' : ''
            }`}
          >
            {title && title.trim() && (
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
                {title}
              </h2>
            )}

            {subtitle && subtitle.trim() && (
              <p
                className={`text-xs sm:text-sm md:text-[15px] text-zinc-100 font-medium leading-snug drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] ${
                  title && title.trim() ? 'mt-2' : ''
                }`}
              >
                {subtitle}
              </p>
            )}

            {buttonText && buttonText.trim() && (
              <button
                type="button"
                onClick={handleActionClick}
                className={`${
                  title?.trim() || subtitle?.trim() ? 'mt-4 sm:mt-5' : ''
                } px-7 py-2.5 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition-transform cursor-pointer`}
              >
                {buttonText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
