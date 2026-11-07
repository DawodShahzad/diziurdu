import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  onProgressUpdate?: (currentTime: number, duration: number, rawVideoTime?: number) => void;
  initialCurrentTime?: number;
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
    params.set('enablejsapi', '1');
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
    const playerId = extractDailymotionPlayerId(dailymotionScriptUrl);
    const params = new URLSearchParams();
    params.set('autoplay', '1');
    params.set('mute', '0');
    params.set('api', 'postMessage');
    params.set('playsinline', '1');
    if (effectiveSeekSec > 0) {
      params.set('start', String(effectiveSeekSec));
      params.set('startTime', String(effectiveSeekSec));
    }
    const isCustomPlayer = Boolean(playerId && playerId !== 'x1o1xe' && playerId !== 'default');
    const embedSrc = isCustomPlayer
      ? `https://geo.dailymotion.com/player/${playerId}.html?video=${id}&${params.toString()}`
      : `https://www.dailymotion.com/embed/video/${id}?${params.toString()}`;

    return {
      src: embedSrc,
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
  dailymotionScriptUrl = 'https://geo.dailymotion.com/libs/player/x1o1xe.js',
  backdropDarkness,
  backdropBlur,
  onProgressUpdate,
  initialCurrentTime
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dailymotionPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [sdkFailed, setSdkFailed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

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
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
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

  // Window resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



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

  // Close handler: ensure exact frame progress is emitted on close
  const handleModalClose = useCallback(() => {
    // Capture final real position from YT.Player if available
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
    // Capture final real position from Dailymotion if available
    const dm = dailymotionPlayerRef.current;
    if (dm) {
      try {
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
    onClose();
  }, [emitCalculatedProgress, onClose]);

  // Keyboard shortcut: Escape to close, N to skip to next episode
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      } else if ((e.key === 'n' || e.key === 'N') && hasNextEpisode && onNextEpisode) {
        onNextEpisode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNextEpisode, onNextEpisode, handleModalClose]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const { src, provider } = getEmbedSourceInfo(
    videoUrl,
    videoSourceType,
    startTime,
    endTime,
    dailymotionScriptUrl,
    initialCurrentTime
  );

  const darknessPercent = backdropDarkness !== undefined ? backdropDarkness : 35;
  const darknessDecimal = Math.max(0, Math.min(100, darknessPercent)) / 100;
  const blurAmountPx = backdropBlur !== undefined ? backdropBlur : 0;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col justify-between bg-black overflow-hidden select-none animate-in fade-in duration-300">
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
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95 border border-white/10 shrink-0"
            aria-label="Back to details"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
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

      {/* 3. Centered Video Player Screen (Reduced size by 50% as requested) */}
      <div className="relative z-30 flex-1 w-full flex items-center justify-center p-3 sm:p-5 md:p-6 lg:p-8 min-h-0 overflow-hidden">
        <div
          className="relative w-full max-w-[360px] xs:max-w-[440px] sm:max-w-[560px] md:max-w-[640px] lg:max-w-[680px] flex items-center justify-center"
          style={{
            maxHeight: 'calc(65vh)'
          }}
        >
          <div
            className="relative w-full aspect-[16/9] overflow-hidden rounded-[18px] sm:rounded-[22px] bg-black border border-white/10 shadow-2xl flex items-center justify-center"
            style={{
              clipPath: 'inset(0 round 20px)',
              WebkitClipPath: 'inset(0 round 20px)',
              borderRadius: '20px',
              WebkitMaskImage: '-webkit-radial-gradient(white, black)',
              transform: 'translateZ(0)',
              isolation: 'isolate'
            }}
          >
            <iframe
              ref={iframeRef}
              key={src}
              src={src}
              title={title}
              aria-label={title}
              data-no-tooltip="true"
              scrolling="no"
              className="w-full h-full border-0 outline-none rounded-[18px] sm:rounded-[22px] block overflow-hidden"
              style={{
                borderRadius: '20px',
                clipPath: 'inset(0 round 20px)',
                WebkitClipPath: 'inset(0 round 20px)',
                transform: 'translateZ(0)'
              }}
              referrerPolicy="no-referrer-when-downgrade"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </div>
  );
};
