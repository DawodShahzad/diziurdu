import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, SkipForward } from 'lucide-react';
import { VideoSourceType } from '../types';

interface EmbedPlayerModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  videoUrl: string;
  videoSourceType?: VideoSourceType;
  startTime?: string;
  endTime?: string;
  playerBgImageUrl?: string;
  titleLogoUrl?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  hasNextEpisode?: boolean;
  onNextEpisode?: () => void;
  onClose: () => void;
  dailymotionScriptUrl?: string;
  backdropDarkness?: number;
  backdropBlur?: number;
}

export function parseTimeToSeconds(timeStr?: string): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();
  if (!trimmed) return null;

  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseFloat(p));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return Math.round(parts[0] * 60 + parts[1]);
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
    }
  }

  const num = parseFloat(trimmed);
  return isNaN(num) ? null : Math.round(num);
}

export function extractDailymotionScriptSrc(raw?: string): string {
  if (!raw) return 'https://geo.dailymotion.com/libs/player/x1o1xe.js';
  const match = raw.match(/src=["']([^"']+)["']/i);
  if (match) return match[1].trim();
  return raw.trim();
}

export function extractDailymotionPlayerId(scriptUrl?: string): string {
  if (!scriptUrl) return 'x1o1xe';
  const clean = extractDailymotionScriptSrc(scriptUrl);
  const match = clean.match(/player\/([a-zA-Z0-9]+)\.js/i);
  return match ? match[1] : 'x1o1xe';
}

export function extractDailymotionVideoId(url: string): string {
  const trimmed = (url || '').trim();
  const match = trimmed.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/|player\/[a-zA-Z0-9]+\.html\?video=)([a-zA-Z0-9]+)/i);
  if (match) return match[1];
  // If it's a raw video ID
  if (!trimmed.includes('/') && /^[a-zA-Z0-9]+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export function isEmbedVideo(url?: string, type?: VideoSourceType): boolean {
  if (!url) return false;
  if (type === 'youtube' || type === 'dailymotion') return true;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('dailymotion.com') ||
    url.includes('dai.ly')
  );
}

export function getEmbedSourceInfo(
  url: string,
  type?: VideoSourceType,
  startTime?: string,
  endTime?: string,
  dailymotionScriptUrl?: string
): { src: string; provider: 'youtube' | 'dailymotion' | 'web'; videoId?: string; playerId?: string } {
  const trimmed = (url || '').trim();
  const startSec = parseTimeToSeconds(startTime);
  const endSec = parseTimeToSeconds(endTime);

  if (type === 'youtube' || trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let id = trimmed;
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) {
      id = match[1];
    }
    const params = new URLSearchParams();
    params.set('autoplay', '1');
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('playsinline', '1');
    if (startSec !== null && startSec >= 0) {
      params.set('start', String(startSec));
    }
    if (endSec !== null && endSec > 0) {
      params.set('end', String(endSec));
    }
    return {
      src: `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`,
      provider: 'youtube',
      videoId: id
    };
  }

  if (type === 'dailymotion' || trimmed.includes('dailymotion.com') || trimmed.includes('dai.ly')) {
    const id = extractDailymotionVideoId(trimmed);
    const playerId = extractDailymotionPlayerId(dailymotionScriptUrl);
    const params = new URLSearchParams();
    params.set('video', id);
    params.set('autoplay', 'true');
    params.set('mute', 'false');
    if (startSec !== null && startSec >= 0) {
      params.set('start', String(startSec));
    }
    return {
      src: `https://geo.dailymotion.com/player/${playerId}.html?${params.toString()}`,
      provider: 'dailymotion',
      videoId: id,
      playerId
    };
  }

  return {
    src: trimmed,
    provider: 'web'
  };
}

export const EmbedPlayerModal: React.FC<EmbedPlayerModalProps> = ({
  isOpen,
  title,
  subtitle,
  videoUrl,
  videoSourceType,
  startTime,
  endTime,
  playerBgImageUrl,
  titleLogoUrl,
  seasonNumber,
  episodeNumber,
  hasNextEpisode,
  onNextEpisode,
  onClose,
  dailymotionScriptUrl = 'https://geo.dailymotion.com/libs/player/x1o1xe.js',
  backdropDarkness,
  backdropBlur
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dailymotionPlayerRef = useRef<any>(null);
  const [sdkFailed, setSdkFailed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [logoAspectCategory, setLogoAspectCategory] = useState<'wide' | 'standard' | 'stacked'>('standard');

  useEffect(() => {
    setLogoAspectCategory('standard');
  }, [titleLogoUrl]);

  const handleLogoLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalHeight > 0) {
      const ratio = naturalWidth / naturalHeight;
      if (ratio >= 2.3) {
        setLogoAspectCategory('wide');
      } else if (ratio < 1.45) {
        setLogoAspectCategory('stacked');
      } else {
        setLogoAspectCategory('standard');
      }
    }
  };

  // Dynamic Dailymotion SDK Player integration
  useEffect(() => {
    if (!isOpen || !videoUrl) return;

    const isDm =
      videoSourceType === 'dailymotion' ||
      videoUrl.includes('dailymotion.com') ||
      videoUrl.includes('dai.ly');

    if (!isDm) return;

    const cleanScriptSrc = extractDailymotionScriptSrc(dailymotionScriptUrl);
    const playerId = extractDailymotionPlayerId(cleanScriptSrc);
    const videoId = extractDailymotionVideoId(videoUrl);
    const startSec = parseTimeToSeconds(startTime);

    if (!videoId) return;

    let isMounted = true;

    const initDmPlayer = () => {
      if (!isMounted) return;
      const dm = (window as any).dailymotion;
      if (dm && dm.createPlayer && containerRef.current) {
        containerRef.current.innerHTML = '';
        dm.createPlayer(containerRef.current, {
          video: videoId,
          player: playerId,
          params: {
            autoplay: true,
            mute: false,
            ...(startSec !== null && startSec >= 0 ? { startTime: startSec } : {})
          }
        })
          .then((playerInstance: any) => {
            if (isMounted) {
              dailymotionPlayerRef.current = playerInstance;
              setSdkFailed(false);
            }
          })
          .catch((err: any) => {
            console.warn('Dailymotion createPlayer error, falling back to iframe', err);
            if (isMounted) setSdkFailed(true);
          });
      } else {
        if (isMounted) setSdkFailed(true);
      }
    };

    // Check if script is already present
    let scriptTag = document.querySelector(`script[src="${cleanScriptSrc}"]`) as HTMLScriptElement;

    if (!(window as any).dailymotion) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.src = cleanScriptSrc;
        scriptTag.async = true;
        scriptTag.onload = initDmPlayer;
        scriptTag.onerror = () => {
          if (isMounted) setSdkFailed(true);
        };
        document.head.appendChild(scriptTag);
      } else {
        scriptTag.addEventListener('load', initDmPlayer);
      }
    } else {
      initDmPlayer();
    }

    return () => {
      isMounted = false;
      if (dailymotionPlayerRef.current && dailymotionPlayerRef.current.destroy) {
        try {
          dailymotionPlayerRef.current.destroy();
        } catch {}
      }
      dailymotionPlayerRef.current = null;
    };
  }, [isOpen, videoUrl, videoSourceType, startTime, endTime, dailymotionScriptUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll and prevent any scrollbars or scrolling while embed player is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    return () => {
      document.body.style.overscrollBehavior = '';
    };
  }, [isOpen]);

  if (!isOpen || !videoUrl) return null;

  const { src, provider } = getEmbedSourceInfo(videoUrl, videoSourceType, startTime, endTime, dailymotionScriptUrl);

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden overscroll-none bg-black select-none animate-in fade-in duration-200 flex flex-col justify-between">
      {/* 1. Fullscreen Background Image with configurable darkness and blur */}
      {playerBgImageUrl ? (
        <img
          src={playerBgImageUrl}
          alt={title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-300"
          style={{
            filter: backdropBlur ? `blur(${backdropBlur}px)` : 'none'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[#0c0d11]" />
      )}

      {/* Darkness overlay managed through admin panel per show */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
        style={{
          opacity: (backdropDarkness ?? 35) / 100
        }}
      />

      {/* 2. Top Navigation Bar: Back on Top-Left + Logo & S:E on Left, Next Episode on Top-Right */}
      <header className="relative z-40 h-20 px-4 sm:px-8 flex items-center justify-between shrink-0 pointer-events-auto">
        {/* Left: Back Button + Logo + S:E label */}
        <div className="flex items-center gap-4 sm:gap-6 min-w-0 flex-1">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-transparent hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer border-0 shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-6 h-6 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]" />
          </button>

          {/* Logo & S:E placed to the left next to back button with optical volume normalization */}
          <div className="flex items-center gap-3 sm:gap-4.5 min-w-0">
            {titleLogoUrl ? (
              <div
                className="inline-flex items-center justify-center shrink-0 max-h-[66px] sm:max-h-[76px] max-w-[240px]"
                data-logo-aspect={logoAspectCategory}
              >
                <img
                  src={titleLogoUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  onLoad={handleLogoLoad}
                  className={`w-auto object-contain shrink-0 filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)] transition-all duration-200 ${
                    logoAspectCategory === 'stacked'
                      ? 'h-12 sm:h-15 max-w-[140px] sm:max-w-[175px]'
                      : logoAspectCategory === 'wide'
                      ? 'h-6 sm:h-7.5 max-w-[170px] sm:max-w-[210px]'
                      : 'h-8 sm:h-9.5 max-w-[160px] sm:max-w-[190px]'
                  }`}
                />
              </div>
            ) : (
              <h2 className="text-sm sm:text-lg font-black text-white tracking-wider uppercase font-display drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] truncate">
                {title}
              </h2>
            )}

            {/* Season and Episode label placed NEXT to PNG logo: no background, slight shadow, font matches Episode heading font */}
            {seasonNumber !== undefined && episodeNumber !== undefined ? (
              <span className="text-sm sm:text-base font-bold text-white tracking-wide font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] whitespace-nowrap select-none">
                S:{seasonNumber} E:{episodeNumber}
              </span>
            ) : subtitle ? (
              <span className="text-xs sm:text-sm font-semibold text-white/90 truncate max-w-xs font-display drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] select-none">
                {subtitle}
              </span>
            ) : null}
          </div>
        </div>

        {/* Top-Right: Next Episode Button - no animation, static clean button */}
        <div className="flex items-center justify-end shrink-0 ml-4">
          {hasNextEpisode && onNextEpisode ? (
            <button
              onClick={onNextEpisode}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white border-0 transition-colors cursor-pointer shadow-md"
              aria-label="Play Next Episode"
            >
              <span className="text-xs sm:text-sm font-bold tracking-wide">Next</span>
              {/* Sharp Next symbol - sharp triangle and sharp bar */}
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <polygon points="5,4 16,12 5,20" />
                <rect x="18" y="4" width="2.5" height="16" />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>

      {/* 3. Center Video Frame: 0 left/right padding on mobile layout */}
      <div className="relative z-30 flex-1 flex items-center justify-center px-0 py-2 sm:p-5 md:p-6 min-h-0 overflow-hidden w-full">
        <div
          className="relative w-full flex items-center justify-center overflow-hidden max-sm:!w-full max-sm:!max-w-none"
          style={{
            width: isMobile ? '100%' : 'min(88vw, calc(68vh * 16 / 9), 792px)',
            maxWidth: isMobile ? '100%' : '792px'
          }}
        >
          <div
            className="relative w-full aspect-[16/9] overflow-hidden rounded-none sm:rounded-[22px] bg-black border-0 shadow-2xl flex items-center justify-center"
            style={{
              clipPath: isMobile ? 'none' : 'inset(0 round 22px)',
              WebkitClipPath: isMobile ? 'none' : 'inset(0 round 22px)',
              borderRadius: isMobile ? '0px' : '22px',
              WebkitMaskImage: isMobile ? 'none' : '-webkit-radial-gradient(white, black)',
              transform: 'translateZ(0)',
              isolation: 'isolate'
            }}
          >
            {provider === 'dailymotion' && !sdkFailed ? (
              <div
                ref={containerRef}
                className="w-full h-full border-0 outline-none overflow-hidden rounded-none sm:rounded-[22px] [&_iframe]:!w-full [&_iframe]:!h-full [&_iframe]:!border-0 [&_iframe]:!block [&_iframe]:!rounded-none sm:[&_iframe]:!rounded-[22px] [&_div]:!w-full [&_div]:!h-full"
                style={{
                  borderRadius: isMobile ? '0px' : '22px',
                  clipPath: isMobile ? 'none' : 'inset(0 round 22px)',
                  WebkitClipPath: isMobile ? 'none' : 'inset(0 round 22px)'
                }}
              />
            ) : (
              <iframe
                key={src}
                src={src}
                aria-label={title}
                data-no-tooltip="true"
                scrolling="no"
                className="w-full h-full border-0 outline-none rounded-none sm:rounded-[22px] block overflow-hidden"
                style={{
                  borderRadius: isMobile ? '0px' : '22px',
                  clipPath: isMobile ? 'none' : 'inset(0 round 22px)',
                  WebkitClipPath: isMobile ? 'none' : 'inset(0 round 22px)',
                  transform: 'translateZ(0)'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
