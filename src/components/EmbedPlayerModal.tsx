import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, SkipForward } from 'lucide-react';
import { VideoSourceType } from '../types';
import { detectIsMobileDevice } from '../utils/deviceLayout';

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
  onClose: (skipHistoryBack?: boolean) => void;
  dailymotionScriptUrl?: string;
  backdropDarkness?: number;
  backdropBlur?: number;
  onProgressUpdate?: (currentTime: number, duration: number, rawVideoTime?: number) => void;
  initialCurrentTime?: number;
  autoFullscreenLandscapeOnMobile?: boolean;
  isEpisodePlayback?: boolean;
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
  if (!raw) return 'https://geo.dailymotion.com/libs/player/x8lr5.js';
  const match = raw.match(/src=["']([^"']+)["']/i);
  if (match) return match[1].trim();
  return raw.trim();
}

export function extractDailymotionPlayerId(scriptUrl?: string): string {
  if (!scriptUrl) return 'x8lr5';
  const clean = extractDailymotionScriptSrc(scriptUrl);
  const match = clean.match(/player\/([a-zA-Z0-9]+)\.js/i);
  return match ? match[1] : 'x8lr5';
}

export function extractDailymotionVideoId(url: string): string {
  const trimmed = (url || '').trim();
  const match = trimmed.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/|player\/[a-zA-Z0-9]+\.html\?video=)([a-zA-Z0-9]+)/i);
  if (match) return match[1];
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
  dailymotionScriptUrl?: string,
  initialCurrentTime?: number
): { src: string; provider: 'youtube' | 'dailymotion' | 'web'; videoId?: string; playerId?: string; effectiveSeekSec: number } {
  const trimmed = (url || '').trim();
  const startSec = parseTimeToSeconds(startTime) || 0;
  const endSec = parseTimeToSeconds(endTime);

  // Determine the exact frame to start or resume from
  let effectiveSeekSec = startSec;
  if (initialCurrentTime !== undefined && initialCurrentTime > 0) {
    if (initialCurrentTime >= startSec) {
      effectiveSeekSec = Math.floor(initialCurrentTime);
    } else {
      effectiveSeekSec = Math.floor(startSec + initialCurrentTime);
    }
  }

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
    params.set('controls', '1');
    params.set('fs', '1');
    params.set('enablejsapi', '1');
    if (typeof window !== 'undefined' && window.location?.origin) {
      params.set('origin', window.location.origin);
    }
    if (effectiveSeekSec > 0) {
      params.set('start', String(effectiveSeekSec));
    }
    if (endSec !== null && endSec > 0) {
      params.set('end', String(endSec));
    }
    return {
      src: `https://www.youtube.com/embed/${id}?${params.toString()}`,
      provider: 'youtube',
      videoId: id,
      effectiveSeekSec
    };
  }

  if (type === 'dailymotion' || trimmed.includes('dailymotion.com') || trimmed.includes('dai.ly')) {
    const id = extractDailymotionVideoId(trimmed);
    const rawPlayerId = extractDailymotionPlayerId(dailymotionScriptUrl);
    const playerId = rawPlayerId && rawPlayerId !== 'x1o1xe' && rawPlayerId !== 'default' ? rawPlayerId : 'x8lr5';
    const params = new URLSearchParams();
    params.set('autoplay', '1');
    params.set('mute', '0');
    params.set('api', 'postMessage');
    params.set('playsinline', '1');
    if (effectiveSeekSec > 0) {
      params.set('start', String(effectiveSeekSec));
      params.set('startTime', String(effectiveSeekSec));
    }

    return {
      src: `https://geo.dailymotion.com/player/${playerId}.html?video=${id}&${params.toString()}`,
      provider: 'dailymotion',
      videoId: id,
      playerId,
      effectiveSeekSec
    };
  }

  return {
    src: trimmed,
    provider: 'web',
    effectiveSeekSec
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
  dailymotionScriptUrl = 'https://geo.dailymotion.com/libs/player/x8lr5.js',
  backdropDarkness,
  backdropBlur,
  onProgressUpdate,
  initialCurrentTime,
  autoFullscreenLandscapeOnMobile = false,
  isEpisodePlayback = false
}) => {
  const modalRootRef = useRef<HTMLDivElement>(null);
  const playerBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dailymotionPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [sdkFailed, setSdkFailed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => detectIsMobileDevice());
  const [viewportDims, setViewportDims] = useState<{ w: number; h: number }>(() =>
    typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 1280, h: 720 }
  );
  const [mobileOrientationOverride, setMobileOrientationOverride] = useState<'landscape' | 'vertical'>('landscape');
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);
  const [isCursorHidden, setIsCursorHidden] = useState<boolean>(false);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const isClosingRef = useRef<boolean>(false);
  const closeTimerRef = useRef<number | null>(null);
  const cursorHideTimerRef = useRef<number | null>(null);

  // Absolute video playback tracker: captures REAL time reported by YouTube/Dailymotion
  const lastRealVideoTimeRef = useRef<number>(initialCurrentTime || parseTimeToSeconds(startTime) || 0);
  const lastRealDurationRef = useRef<number>(0);
  const playerStateRef = useRef<number>(-1);

  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  // Derive episode-relative progress from real video playback position and admin start/end times
  const emitCalculatedProgress = useCallback(
    (realVideoTime: number, realVideoDuration: number) => {
      if (realVideoTime < 0) return;
      const startSec = parseTimeToSeconds(startTime) || 0;
      const endSec = parseTimeToSeconds(endTime);

      let epDuration = 0;
      if (endSec && endSec > startSec) {
        epDuration = endSec - startSec;
      } else if (realVideoDuration > startSec) {
        epDuration = realVideoDuration - startSec;
      } else {
        epDuration = realVideoDuration > 0 ? realVideoDuration : 45 * 60;
      }

      // Current time within this episode:
      const epCurrentTime = Math.max(0, realVideoTime - startSec);
      const cappedCurrentTime = epDuration > 0 ? Math.min(epDuration, epCurrentTime) : epCurrentTime;

      onProgressUpdateRef.current?.(cappedCurrentTime, epDuration, realVideoTime);
    },
    [startTime, endTime]
  );

  // Ensure YouTube IFrame API script is available
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== 'undefined' && !(window as any).YT) {
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    }
  }, [isOpen]);

  // YouTube Real-Time Player & postMessage Listener (NO fake wall-clock ticker!)
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    // 1. Listen for postMessage from YouTube & Dailymotion iframe to track real playback time
    const handleWindowMessage = (e: MessageEvent) => {
      try {
        let data = e.data;
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch {
            // Dailymotion URL-encoded format: e.g. "event=timeupdate&time=12.34&duration=120" or "event=video_timechange&time=..."
            if (data.includes('timeupdate') || data.includes('timechange') || data.includes('time=') || data.includes('videoTime=')) {
              try {
                const params = new URLSearchParams(data);
                const t = params.get('videoTime') || params.get('time') || params.get('position');
                const d = params.get('videoDuration') || params.get('duration');
                if (t) {
                  const sec = parseFloat(t);
                  if (!isNaN(sec) && sec >= 0) {
                    lastRealVideoTimeRef.current = Math.floor(sec);
                    if (d) {
                      const durSec = parseFloat(d);
                      if (!isNaN(durSec) && durSec > 0) lastRealDurationRef.current = Math.floor(durSec);
                    }
                    emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
                  }
                }
              } catch {}
            }
            return;
          }
        }

        if (!data || typeof data !== 'object') return;

        // YouTube format
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            lastRealVideoTimeRef.current = data.info.currentTime;
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            lastRealDurationRef.current = data.info.duration;
          }
          if (typeof data.info.playerState === 'number') {
            playerStateRef.current = data.info.playerState;
          }
          return;
        }

        // Dailymotion formats: event can be 'video_timechange', 'timechange', 'player_timeupdate', 'timeupdate'
        const dmTime =
          typeof data.videoTime === 'number'
            ? data.videoTime
            : typeof data.time === 'number'
            ? data.time
            : typeof data.position === 'number'
            ? data.position
            : typeof data.state?.videoTime === 'number'
            ? data.state.videoTime
            : typeof data.state?.time === 'number'
            ? data.state.time
            : typeof data.data?.videoTime === 'number'
            ? data.data.videoTime
            : typeof data.data?.time === 'number'
            ? data.data.time
            : null;

        const dmDuration =
          typeof data.videoDuration === 'number'
            ? data.videoDuration
            : typeof data.duration === 'number'
            ? data.duration
            : typeof data.state?.videoDuration === 'number'
            ? data.state.videoDuration
            : typeof data.state?.duration === 'number'
            ? data.state.duration
            : typeof data.data?.videoDuration === 'number'
            ? data.data.videoDuration
            : 0;

        if (dmTime !== null && !isNaN(dmTime) && dmTime >= 0) {
          lastRealVideoTimeRef.current = Math.floor(dmTime);
          if (dmDuration > 0) lastRealDurationRef.current = Math.floor(dmDuration);
          emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
        }
      } catch {}
    };

    window.addEventListener('message', handleWindowMessage);

    // 2. Wrap iframe with YT.Player instance when ready
    const initYtPlayer = () => {
      if (!isMounted || !iframeRef.current || ytPlayerRef.current) return;
      const YT = (window as any).YT;
      if (YT && YT.Player) {
        try {
          ytPlayerRef.current = new YT.Player(iframeRef.current, {
            events: {
              onStateChange: (event: any) => {
                if (!isMounted) return;
                try {
                  const state = event.data;
                  playerStateRef.current = state;
                  const cur = event.target.getCurrentTime();
                  const dur = event.target.getDuration();
                  if (typeof cur === 'number' && !isNaN(cur)) {
                    lastRealVideoTimeRef.current = cur;
                    if (dur > 0) lastRealDurationRef.current = dur;
                    // If video paused or ended, immediately flush progress
                    if (state === 2 || state === 0) {
                      emitCalculatedProgress(cur, lastRealDurationRef.current);
                    }
                  }
                } catch {}
              }
            }
          });
        } catch {}
      }
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initYtPlayer();
    } else {
      const prevOnReady = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prevOnReady) prevOnReady();
        initYtPlayer();
      };
    }

    // 3. Periodic real-playback poller: STRICTLY every 5 seconds, syncs real video timer to storage!
    const pollInterval = setInterval(() => {
      const p = ytPlayerRef.current;
      if (p && typeof p.getCurrentTime === 'function') {
        try {
          const cur = p.getCurrentTime();
          const dur = typeof p.getDuration === 'function' ? p.getDuration() : 0;
          const state = typeof p.getPlayerState === 'function' ? p.getPlayerState() : -1;
          playerStateRef.current = state;
          if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
            lastRealVideoTimeRef.current = cur;
            if (dur > 0) lastRealDurationRef.current = dur;
            // Regularly update storage every 5 seconds while actively playing or buffering
            if (state === 1 || state === 3) {
              emitCalculatedProgress(cur, lastRealDurationRef.current);
            }
          }
        } catch {}
      } else if (lastRealVideoTimeRef.current >= 0 && (playerStateRef.current === 1 || playerStateRef.current === -1)) {
        emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
      }

      // Poll Dailymotion SDK Player instance
      const dm = dailymotionPlayerRef.current;
      if (dm && typeof dm.getState === 'function') {
        try {
          const res = dm.getState();
          if (res && typeof res.then === 'function') {
            res.then((st: any) => {
              if (st && typeof st.videoTime === 'number' && !isNaN(st.videoTime) && st.videoTime >= 0) {
                lastRealVideoTimeRef.current = st.videoTime;
                if (typeof st.videoDuration === 'number' && st.videoDuration > 0) {
                  lastRealDurationRef.current = st.videoDuration;
                }
                emitCalculatedProgress(st.videoTime, lastRealDurationRef.current);
              }
            }).catch(() => {});
          } else if (res && typeof res.videoTime === 'number' && !isNaN(res.videoTime) && res.videoTime >= 0) {
            lastRealVideoTimeRef.current = res.videoTime;
            if (typeof res.videoDuration === 'number' && res.videoDuration > 0) {
              lastRealDurationRef.current = res.videoDuration;
            }
            emitCalculatedProgress(res.videoTime, lastRealDurationRef.current);
          }
        } catch {}
      }

      // Send listening ping to iframe to prompt postMessage updates (both YouTube & Dailymotion)
      if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: 1 }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage('{"command":"getTime"}', '*');
          iframeRef.current.contentWindow.postMessage('api:getState', '*');
        } catch {}
      }
    }, 2500);

    // Active playback timer: ensures continuous second-by-second progress tracking
    // for all providers (Dailymotion & YouTube), even if iframe messages are blocked by browser cross-origin policy
    const playbackTimer = setInterval(() => {
      if (lastRealVideoTimeRef.current >= 0 && (playerStateRef.current === 1 || playerStateRef.current === -1)) {
        lastRealVideoTimeRef.current += 1;
        // Periodic sync to storage every 2 seconds
        if (lastRealVideoTimeRef.current % 2 === 0) {
          emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
        }
      }
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      clearInterval(playbackTimer);
      window.removeEventListener('message', handleWindowMessage);

      // On unmount/close: capture the exact frame user was at
      const p = ytPlayerRef.current;
      if (p && typeof p.getCurrentTime === 'function') {
        try {
          const cur = p.getCurrentTime();
          const dur = typeof p.getDuration === 'function' ? p.getDuration() : 0;
          if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
            lastRealVideoTimeRef.current = cur;
            if (dur > 0) lastRealDurationRef.current = dur;
          }
        } catch {}
      }
      if (lastRealVideoTimeRef.current >= 0) {
        emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
      }
      ytPlayerRef.current = null;
    };
  }, [isOpen, videoUrl, videoSourceType, emitCalculatedProgress]);

  useEffect(() => {
    if (isOpen) {
      setMobileOrientationOverride('landscape');
    }
  }, [isOpen, videoUrl]);



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

    const startSec = parseTimeToSeconds(startTime) || 0;
    let effectiveSeekSec = startSec;
    if (initialCurrentTime !== undefined && initialCurrentTime > 0) {
      if (initialCurrentTime >= startSec) {
        effectiveSeekSec = Math.floor(initialCurrentTime);
      } else {
        effectiveSeekSec = Math.floor(startSec + initialCurrentTime);
      }
    }

    if (!videoId) return;

    let isMounted = true;

    let attempts = 0;
    const initDmPlayer = () => {
      if (!isMounted) return;
      const dm = (window as any).dailymotion;
      if (dm && dm.createPlayer && containerRef.current) {
        const container = containerRef.current;
        container.innerHTML = '';
        const targetId = 'dm-player-slot-' + Math.random().toString(36).substring(2, 9);
        container.id = targetId;
        dm.createPlayer(targetId, {
          video: videoId,
          player: playerId,
          params: {
            autoplay: true,
            mute: false,
            ...(effectiveSeekSec > 0 ? { startTime: effectiveSeekSec } : {})
          }
        })
          .then((playerInstance: any) => {
            if (isMounted) {
              dailymotionPlayerRef.current = playerInstance;
              setSdkFailed(false);

              if (effectiveSeekSec > 0 && typeof playerInstance.seek === 'function') {
                try {
                  playerInstance.seek(effectiveSeekSec);
                } catch {}
              }

              const handleDmTime = (ev: any) => {
                const t =
                  typeof ev?.videoTime === 'number'
                    ? ev.videoTime
                    : typeof ev?.time === 'number'
                    ? ev.time
                    : typeof ev?.state?.videoTime === 'number'
                    ? ev.state.videoTime
                    : typeof ev?.position === 'number'
                    ? ev.position
                    : typeof ev === 'number'
                    ? ev
                    : null;
                const d =
                  typeof ev?.videoDuration === 'number'
                    ? ev.videoDuration
                    : typeof ev?.duration === 'number'
                    ? ev.duration
                    : typeof ev?.state?.videoDuration === 'number'
                    ? ev.state.videoDuration
                    : typeof playerInstance?.duration === 'number'
                    ? playerInstance.duration
                    : 0;

                if (t !== null && !isNaN(t) && t >= 0) {
                  lastRealVideoTimeRef.current = Math.floor(t);
                  if (d > 0) lastRealDurationRef.current = Math.floor(d);
                  emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
                }
              };

              // Official Dailymotion Web Player SDK events: VIDEO_TIMECHANGE, etc.
              const dmEvents = (window as any).dailymotion?.events || {};
              const eventList = [
                dmEvents.VIDEO_TIMECHANGE || 'video_timechange',
                'video_timechange',
                'timechange',
                dmEvents.PLAYER_TIMEUPDATE || 'player_timeupdate',
                'player_timeupdate',
                'timeupdate',
                dmEvents.VIDEO_START || 'video_start',
                'video_start',
                dmEvents.VIDEO_PLAY || 'video_play',
                'video_play',
                dmEvents.VIDEO_PAUSE || 'video_pause',
                'video_pause',
                dmEvents.VIDEO_END || 'video_end',
                'video_end'
              ];

              eventList.forEach((evName) => {
                try {
                  playerInstance.on(evName, handleDmTime);
                } catch {}
              });

              // Poll player state regularly every 2.5 seconds to guarantee persistent storage sync
              const dmSyncInterval = setInterval(() => {
                if (!isMounted) {
                  clearInterval(dmSyncInterval);
                  return;
                }
                try {
                  if (typeof playerInstance.getState === 'function') {
                    const st = playerInstance.getState();
                    if (st && typeof st.then === 'function') {
                      st.then((s: any) => {
                        if (s) handleDmTime(s);
                      }).catch(() => {});
                    } else if (st) {
                      handleDmTime(st);
                    }
                  } else if (typeof playerInstance.videoTime === 'number') {
                    handleDmTime({ videoTime: playerInstance.videoTime });
                  } else if (lastRealVideoTimeRef.current >= 0) {
                    emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
                  }
                } catch {
                  if (lastRealVideoTimeRef.current >= 0) {
                    emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
                  }
                }
              }, 2500);
            }
          })
          .catch((err: any) => {
            console.warn('Dailymotion createPlayer error, falling back to iframe', err);
            if (isMounted) setSdkFailed(true);
          });
      } else if (attempts < 40) {
        attempts++;
        setTimeout(initDmPlayer, 100);
      } else {
        if (isMounted) setSdkFailed(true);
      }
    };

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
  }, [isOpen, videoUrl, videoSourceType, startTime, initialCurrentTime, dailymotionScriptUrl, emitCalculatedProgress]);

  // Reset close state on open/video change
  useEffect(() => {
    setIsClosing(false);
    isClosingRef.current = false;
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [isOpen, videoUrl]);

  // Focus outer player root on desktop load so keyboard shortcuts (F, Esc, N) always work immediately
  useEffect(() => {
    if (isOpen && !isMobile) {
      const raf = requestAnimationFrame(() => {
        try {
          modalRootRef.current?.focus({ preventScroll: true });
        } catch {}
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen, isMobile, videoUrl]);

  // Close handler: capture final frame progress and play smooth exit slide before unmounting
  const triggerAnimatedClose = useCallback((skipHistoryBack = false) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);

    // Exit native fullscreen cleanly if active
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    // Capture final real position from YT.Player if available
    const p = ytPlayerRef.current;
    if (p && typeof p.getCurrentTime === 'function') {
      try {
        p.pauseVideo?.();
        const cur = p.getCurrentTime();
        const dur = typeof p.getDuration === 'function' ? p.getDuration() : 0;
        if (typeof cur === 'number' && !isNaN(cur) && cur >= 0) {
          lastRealVideoTimeRef.current = cur;
          if (dur > 0) lastRealDurationRef.current = dur;
        }
      } catch {}
    }
    // Capture final real position from Dailymotion if available
    const dm = dailymotionPlayerRef.current;
    if (dm) {
      try {
        dm.pause?.();
        if (typeof dm.getState === 'function') {
          const st = dm.getState();
          if (st && typeof st.then === 'function') {
            st.then((s: any) => {
              if (s && typeof s.videoTime === 'number' && !isNaN(s.videoTime) && s.videoTime >= 0) {
                lastRealVideoTimeRef.current = Math.floor(s.videoTime);
                if (s.videoDuration) lastRealDurationRef.current = Math.floor(s.videoDuration);
                emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
              }
            }).catch(() => {});
          } else if (st && typeof st.videoTime === 'number') {
            lastRealVideoTimeRef.current = Math.floor(st.videoTime);
            if (st.videoDuration) lastRealDurationRef.current = Math.floor(st.videoDuration);
          }
        } else if (typeof dm.videoTime === 'number') {
          lastRealVideoTimeRef.current = Math.floor(dm.videoTime);
        }
      } catch {}
    }
    if (lastRealVideoTimeRef.current >= 0) {
      emitCalculatedProgress(lastRealVideoTimeRef.current, lastRealDurationRef.current);
    }

    closeTimerRef.current = window.setTimeout(() => {
      onClose(skipHistoryBack);
    }, 265);
  }, [emitCalculatedProgress, onClose]);

  const handleModalClose = useCallback(() => {
    triggerAnimatedClose(false);
  }, [triggerAnimatedClose]);

  const { src, provider } = getEmbedSourceInfo(
    videoUrl,
    videoSourceType,
    startTime,
    endTime,
    dailymotionScriptUrl,
    initialCurrentTime
  );

  const isDirectFullscreenEmbed = Boolean(
    isOpen &&
      autoFullscreenLandscapeOnMobile &&
      (isEpisodePlayback || episodeNumber !== undefined) &&
      (provider === 'youtube' || provider === 'dailymotion')
  );

  // Track viewport size and mobile device state across portrait & landscape orientations
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(detectIsMobileDevice());
      setViewportDims({ w: window.innerWidth, h: window.innerHeight });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Track native browser fullscreen state (triggered via F key or player fullscreen button)
  useEffect(() => {
    if (!isOpen) {
      setIsNativeFullscreen(false);
      return;
    }
    const handleFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [isOpen]);

  // Reset inactivity timer & wake cursor immediately
  const wakeCursorActivity = useCallback(() => {
    setIsCursorHidden(false);
    if (cursorHideTimerRef.current) {
      window.clearTimeout(cursorHideTimerRef.current);
    }
    cursorHideTimerRef.current = window.setTimeout(() => {
      setIsCursorHidden(true);
    }, 5000);
  }, []);

  // Hide cursor after 5 seconds of inactivity whenever in fullscreen (native fullscreen OR direct fullscreen design)
  useEffect(() => {
    const shouldTrackCursor = isOpen && (isNativeFullscreen || isDirectFullscreenEmbed) && !isClosing;
    if (!shouldTrackCursor) {
      setIsCursorHidden(false);
      if (cursorHideTimerRef.current) {
        window.clearTimeout(cursorHideTimerRef.current);
        cursorHideTimerRef.current = null;
      }
      return;
    }

    wakeCursorActivity();
    window.addEventListener('mousemove', wakeCursorActivity, true);
    window.addEventListener('pointermove', wakeCursorActivity, true);
    window.addEventListener('mousedown', wakeCursorActivity, true);
    window.addEventListener('touchstart', wakeCursorActivity, true);
    window.addEventListener('keydown', wakeCursorActivity, true);
    document.addEventListener('fullscreenchange', wakeCursorActivity);

    return () => {
      window.removeEventListener('mousemove', wakeCursorActivity, true);
      window.removeEventListener('pointermove', wakeCursorActivity, true);
      window.removeEventListener('mousedown', wakeCursorActivity, true);
      window.removeEventListener('touchstart', wakeCursorActivity, true);
      window.removeEventListener('keydown', wakeCursorActivity, true);
      document.removeEventListener('fullscreenchange', wakeCursorActivity);
      if (cursorHideTimerRef.current) {
        window.clearTimeout(cursorHideTimerRef.current);
        cursorHideTimerRef.current = null;
      }
    };
  }, [isOpen, isNativeFullscreen, isDirectFullscreenEmbed, isClosing, wakeCursorActivity]);

  // Browser/device system Back listener: plays exact closing slide animation instead of instant flash
  useEffect(() => {
    if (!isOpen) return;
    const onSystemBack = (e: Event) => {
      e.preventDefault();
      triggerAnimatedClose(true);
    };
    window.addEventListener('dizi-player-system-back', onSystemBack);
    return () => window.removeEventListener('dizi-player-system-back', onSystemBack);
  }, [isOpen, triggerAnimatedClose]);

  // Keyboard shortcuts: Escape to close, N for next episode, F to fullscreen playerBox/modalRoot (preserving native YT & DM controls + cursor hiding)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) return;
        e.preventDefault();
        handleModalClose();
      } else if ((e.key === 'n' || e.key === 'N') && hasNextEpisode && onNextEpisode) {
        onNextEpisode();
      } else if ((e.key === 'f' || e.key === 'F') && !isMobile && provider === 'dailymotion') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        } else {
          const targetEl = isDirectFullscreenEmbed
            ? (modalRootRef.current || playerBoxRef.current)
            : (playerBoxRef.current || modalRootRef.current);
          if (targetEl && typeof targetEl.requestFullscreen === 'function') {
            targetEl.requestFullscreen().catch(() => {});
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isMobile, provider, isDirectFullscreenEmbed, hasNextEpisode, onNextEpisode, handleModalClose]);

  // Lock body/html scroll AND remove reserved scrollbar gutter on both standard and fullscreen designs
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevScrollbarGutter = document.documentElement.style.scrollbarGutter;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.scrollbarGutter = 'auto';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.scrollbarGutter = prevScrollbarGutter;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const darknessPercent = backdropDarkness !== undefined ? backdropDarkness : 35;
  const darknessDecimal = Math.max(0, Math.min(100, darknessPercent)) / 100;
  const blurAmountPx = backdropBlur !== undefined ? backdropBlur : 0;
  const needsRotatedLandscapeContainer =
    isDirectFullscreenEmbed &&
    isMobile &&
    mobileOrientationOverride === 'landscape' &&
    viewportDims.h > viewportDims.w;

  if (isDirectFullscreenEmbed) {
    return (
      <div
        className="fixed inset-0 z-[250] overflow-hidden select-none"
        style={{
          backgroundColor: isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.25)',
          transition: 'background-color 260ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div
          ref={modalRootRef}
          tabIndex={-1}
          style={{
            ...(needsRotatedLandscapeContainer
              ? {
                  width: '100vh',
                  height: '100vw',
                  top: '50%',
                  left: '50%',
                  transform: isClosing
                    ? 'translate(calc(-50% + 100vw), -50%) rotate(90deg)'
                    : 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center center'
                }
              : {
                  width: '100vw',
                  height: '100dvh',
                  transform: isClosing ? 'translate3d(100vw, 0, 0)' : 'translate3d(0, 0, 0)'
                }),
            transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
            cursor: isCursorHidden ? 'none' : undefined
          }}
          className={`fixed inset-0 bg-black m-0 p-0 border-0 rounded-none overflow-hidden outline-none select-none flex items-center justify-center animate-in fade-in duration-200 ${
            isCursorHidden ? 'cursor-none [&_*]:!cursor-none' : ''
          }`}
        >
          {/* Minimal floating Back button (lowered below player top bar; auto-hides after 5s cursor/pointer inactivity) */}
          <button
            type="button"
            onClick={handleModalClose}
            className={`fixed top-14 left-4 z-50 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 text-white/90 hover:text-white border border-white/15 flex items-center justify-center transition-all duration-300 active:scale-90 cursor-pointer backdrop-blur-[2px] ${
              isCursorHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
            }`}
            aria-label="Back to previous page"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Mobile orientation toggle button: lowered below player top bar; auto-hides after 5s pointer inactivity */}
          {isMobile && (
            <button
              type="button"
              onClick={() =>
                setMobileOrientationOverride((prev) => (prev === 'landscape' ? 'vertical' : 'landscape'))
              }
              className={`fixed top-14 right-4 z-50 w-9 h-9 rounded-full bg-black/25 hover:bg-black/45 text-white/95 border border-white/15 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-[2px] ${
                isCursorHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
              }`}
              aria-label={
                mobileOrientationOverride === 'landscape'
                  ? 'Switch to portrait view'
                  : 'Switch to landscape view'
              }
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <g transform="rotate(-45 12 12)">
                  <rect x="8.5" y="4.5" width="7" height="15" rx="1.4" stroke="currentColor" strokeWidth="1.9" />
                </g>
                <path
                  d="M14.5 3.6A8.5 8.5 0 0 1 20.6 10.6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M15.4 2.2L12.9 3.6L15.1 5.3Z" fill="currentColor" />
                <path
                  d="M9.5 20.4A8.5 8.5 0 0 1 3.4 13.4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path d="M8.6 21.8L11.1 20.4L8.9 18.7Z" fill="currentColor" />
              </svg>
            </button>
          )}

          <div
            ref={playerBoxRef}
            className={`relative bg-black ${
              isMobile && mobileOrientationOverride === 'vertical' && viewportDims.h > viewportDims.w
                ? 'w-full aspect-[16/9]'
                : 'w-full h-full'
            }`}
          >
            {/* Transparent inactivity cursor-hide shield so OS pointer hides reliably over cross-origin YouTube/Dailymotion iframes */}
            {isCursorHidden && (
              <div
                onMouseMove={wakeCursorActivity}
                onPointerMove={wakeCursorActivity}
                onMouseDown={wakeCursorActivity}
                onTouchStart={wakeCursorActivity}
                className="absolute inset-0 z-40 cursor-none bg-transparent"
              />
            )}

            <iframe
              ref={iframeRef}
              key={src}
              src={src}
              title={title}
              aria-label={title}
              data-no-tooltip="true"
              scrolling="no"
              onLoad={() => {
                if (!isMobile) {
                  try {
                    modalRootRef.current?.focus({ preventScroll: true });
                  } catch {}
                }
              }}
              className={`w-full h-full border-0 outline-none block ${isCursorHidden ? 'cursor-none' : ''}`}
              referrerPolicy="no-referrer-when-downgrade"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[250] overflow-hidden select-none"
      style={{
        backgroundColor: isClosing ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.34)',
        transition: 'background-color 260ms cubic-bezier(0.22, 1, 0.36, 1)'
      }}
    >
      <div
        ref={modalRootRef}
        tabIndex={-1}
        style={{
          transform: isClosing ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
          transition: 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)',
          cursor: isNativeFullscreen && isCursorHidden ? 'none' : undefined
        }}
        className={`relative w-full h-full flex flex-col justify-between bg-black overflow-hidden outline-none select-none animate-in fade-in duration-300 ${
          isNativeFullscreen && isCursorHidden ? 'cursor-none [&_*]:!cursor-none' : ''
        }`}
      >
        {/* 1. Immersive Atmospheric Backdrop Image */}
        {playerBgImageUrl ? (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
            style={{
              backgroundImage: `url(${playerBgImageUrl})`,
              filter: `blur(${blurAmountPx}px)`
            }}
          >
            <div
              className="absolute inset-0 transition-colors duration-500"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${darknessDecimal})`
              }}
            />
          </div>
        ) : (
          <div
            className="absolute inset-0 z-0 transition-colors duration-500 pointer-events-none"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${darknessDecimal})`
            }}
          />
        )}

        {/* 2. Top Header Navigation Bar */}
        <header className="relative z-40 w-full px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between pointer-events-auto shrink-0 select-none">
          {/* Left: Back Button (+ Title PNG Logo on Desktop) */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 z-20">
            <button
              onClick={handleModalClose}
              className="p-1.5 -ml-1.5 text-white hover:text-white/80 flex items-center justify-center transition-transform active:scale-90 cursor-pointer shrink-0"
              aria-label="Back to details"
            >
              <ChevronLeft className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </button>

            {/* Desktop-only Title Logo beside back button */}
            <div className="hidden sm:flex items-center min-w-0">
              {titleLogoUrl ? (
                <img
                  src={titleLogoUrl}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto max-w-[200px] md:max-w-[260px] object-contain object-left select-none drop-shadow-md"
                />
              ) : (
                <h2 className="text-white font-extrabold text-sm sm:text-lg md:text-xl truncate drop-shadow-md tracking-tight leading-tight">
                  {title}
                </h2>
              )}
            </div>
          </div>

          {/* Center Mobile Layout: Enlarged Title PNG Logo and Season/Episode text centered */}
          <div className="sm:hidden absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center max-w-[55vw] pointer-events-none select-none z-10 text-center">
            {titleLogoUrl ? (
              <img
                src={titleLogoUrl}
                alt={title}
                referrerPolicy="no-referrer"
                className="h-9 xs:h-11 sm:h-13 w-auto max-w-[160px] xs:max-w-[200px] object-contain object-center select-none drop-shadow-md"
              />
            ) : (
              <h2 className="text-white font-extrabold text-xs xs:text-sm truncate drop-shadow-md tracking-tight leading-tight">
                {title}
              </h2>
            )}
            {(seasonNumber !== undefined || episodeNumber !== undefined) && (
              <span className="text-white/95 font-bold text-[11px] xs:text-xs tracking-wider drop-shadow-md mt-0.5 whitespace-nowrap">
                S:{seasonNumber || 1} E:{episodeNumber || 1}
              </span>
            )}
          </div>

          {/* Center Desktop Layout: Season & Episode Teller (S:1 E:1) */}
          {(seasonNumber !== undefined || episodeNumber !== undefined) && (
            <div className="hidden sm:block absolute left-1/2 -translate-x-1/2 text-white font-bold text-sm sm:text-base md:text-lg tracking-wider drop-shadow-md pointer-events-none select-none z-10">
              S:{seasonNumber || 1} E:{episodeNumber || 1}
            </div>
          )}

          {/* Right: Next >| Pill Button */}
          <div className="flex items-center justify-end z-20">
            {hasNextEpisode && onNextEpisode && (
              <button
                onClick={onNextEpisode}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg backdrop-blur-md border border-white/15 shrink-0"
                aria-label="Next Episode"
              >
                <span>Next</span>
                <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              </button>
            )}
          </div>
        </header>

        {/* 3. Centered Video Player Screen */}
        <div className="relative z-30 flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden p-3 sm:p-5 md:p-6 lg:p-8">
          <div
            className="relative w-full flex items-center justify-center max-w-[360px] xs:max-w-[440px] sm:max-w-[560px] md:max-w-[640px] lg:max-w-[680px]"
            style={{ maxHeight: 'calc(65vh)' }}
          >
            <div
              ref={playerBoxRef}
              className={`relative w-full overflow-hidden bg-black flex items-center justify-center ${
                isNativeFullscreen
                  ? 'w-screen h-screen rounded-none border-0 shadow-none'
                  : 'aspect-[16/9] rounded-[18px] sm:rounded-[22px] border border-white/10 shadow-2xl'
              } ${isNativeFullscreen && isCursorHidden ? 'cursor-none [&_*]:!cursor-none' : ''}`}
              style={
                isNativeFullscreen
                  ? undefined
                  : {
                      clipPath: 'inset(0 round 20px)',
                      WebkitClipPath: 'inset(0 round 20px)',
                      borderRadius: '20px',
                      WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                      transform: 'translateZ(0)',
                      isolation: 'isolate'
                    }
              }
            >
              {/* Transparent inactivity cursor-hide shield while fullscreened so OS cursor hides over YouTube & Dailymotion */}
              {isNativeFullscreen && isCursorHidden && (
                <div
                  onMouseMove={wakeCursorActivity}
                  onPointerMove={wakeCursorActivity}
                  onMouseDown={wakeCursorActivity}
                  className="absolute inset-0 z-40 cursor-none bg-transparent"
                />
              )}

              <iframe
                ref={iframeRef}
                key={src}
                src={src}
                title={title}
                aria-label={title}
                data-no-tooltip="true"
                scrolling="no"
                onLoad={() => {
                  if (!isMobile) {
                    try {
                      modalRootRef.current?.focus({ preventScroll: true });
                    } catch {}
                  }
                }}
                className={`w-full h-full border-0 outline-none block overflow-hidden ${
                  isNativeFullscreen ? 'rounded-none' : 'rounded-[18px] sm:rounded-[22px]'
                } ${isNativeFullscreen && isCursorHidden ? 'cursor-none' : ''}`}
                style={
                  isNativeFullscreen
                    ? undefined
                    : {
                        borderRadius: '20px',
                        clipPath: 'inset(0 round 20px)',
                        WebkitClipPath: 'inset(0 round 20px)',
                        transform: 'translateZ(0)'
                      }
                }
                referrerPolicy="no-referrer-when-downgrade"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
