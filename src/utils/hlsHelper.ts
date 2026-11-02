import Hls from 'hls.js';

export function isHlsSource(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();
  return (
    clean.includes('.m3u8') ||
    clean.includes('/m3u8') ||
    clean.includes('format=m3u8') ||
    clean.includes('type=m3u8') ||
    clean.includes('manifest.m3u8')
  );
}

export interface AttachHlsOptions {
  autoPlay?: boolean;
  muted?: boolean;
  startTime?: number;
  defaultQuality?: 'Auto' | '1080p' | '720p' | '480p';
  onLoaded?: () => void;
  onError?: (err: any) => void;
}

/**
 * Attaches a video source (standard MP4/WebM or HLS .m3u8) to an HTML5 video element.
 * Prioritizes hls.js on MSE-capable browsers (Chrome, Edge, Firefox, Desktop Safari)
 * and falls back to native HLS on mobile Safari / iOS.
 * Returns a cleanup function that must be called when the component unmounts or src changes.
 */
export function attachHlsVideo(
  video: HTMLVideoElement | null,
  src: string | undefined | null,
  options?: AttachHlsOptions
): (() => void) | undefined {
  if (!video || !src) return;

  const trimmedSrc = src.trim();
  if (!trimmedSrc) return;

  // Cleanup any previous HLS instance attached to this video element
  if ((video as any).__hlsInstance) {
    try {
      (video as any).__hlsInstance.destroy();
    } catch {}
    (video as any).__hlsInstance = null;
  }

  if (options?.muted !== undefined) {
    video.muted = options.muted;
    if (options.muted === false) {
      video.volume = 1.0;
    }
  }

  const attemptPlay = () => {
    if (options?.muted === false) {
      video.muted = false;
      video.volume = 1.0;
    }
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          options?.onLoaded?.();
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          // If browser restricts unmuted autoplay, play muted so visual preview rolls smoothly without black screen
          video.muted = true;
          video.play()
            .then(() => {
              options?.onLoaded?.();
              if (options?.muted === false) {
                // Unlock sound on first user gesture without interrupting visual playback
                const unlockAudio = () => {
                  try {
                    video.muted = false;
                    video.volume = 1.0;
                  } catch {}
                  events.forEach((ev) => window.removeEventListener(ev, unlockAudio, { capture: true }));
                };
                const events = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
                events.forEach((ev) => window.addEventListener(ev, unlockAudio, { capture: true, once: true, passive: true }));
              }
            })
            .catch(() => {});
        });
    }
  };

  if (isHlsSource(trimmedSrc)) {
    // 1. hls.js for all modern browsers supporting MediaSource Extensions
    // MUST be checked before canPlayType because Chromium returns 'maybe' for canPlayType('application/vnd.apple.mpegurl')
    // but cannot decode Apple HLS manifests natively through the video tag.
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false, // Disabled for standard VOD (Mux, Cloudflare, etc.) to ensure reliable buffering
        backBufferLength: 60,
        maxBufferLength: 45, // Medium buffer target (45s ahead)
        maxMaxBufferLength: 90,
        maxBufferSize: 60 * 1024 * 1024, // 60MB
        maxBufferHole: 0.3,
        nudgeMaxRetry: 5,
        startFragPrefetch: true,
        capLevelToPlayerSize: false,
        autoStartLoad: true
      });

      (video as any).__hlsInstance = hls;

      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(trimmedSrc);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Set default quality (default to 720p as requested)
        setHlsQuality(video, options?.defaultQuality || '720p');

        if (options?.startTime && options.startTime > 0) {
          try {
            video.currentTime = options.startTime;
          } catch {}
        }

        if (options?.autoPlay) {
          attemptPlay();
        } else {
          options?.onLoaded?.();
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              try {
                hls.startLoad();
              } catch {}
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              try {
                hls.recoverMediaError();
              } catch {}
              break;
            default:
              try {
                hls.destroy();
              } catch {}
              if ((video as any).__hlsInstance === hls) {
                (video as any).__hlsInstance = null;
              }
              options?.onError?.(data);
              break;
          }
        }
      });

      return () => {
        try {
          hls.destroy();
        } catch {}
        if ((video as any).__hlsInstance === hls) {
          (video as any).__hlsInstance = null;
        }
      };
    }

    // 2. Native HLS support for Safari on iOS / macOS
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = trimmedSrc;
      if (options?.startTime && options.startTime > 0) {
        try {
          video.currentTime = options.startTime;
        } catch {}
      }
      if (options?.autoPlay) {
        attemptPlay();
      }
      return () => {
        try {
          video.removeAttribute('src');
          video.load();
        } catch {}
      };
    }

    // Direct fallback
    video.src = trimmedSrc;
    if (options?.autoPlay) {
      attemptPlay();
    }
    return () => {};
  } else {
    // Direct source (MP4, WebM, etc.)
    video.src = trimmedSrc;
    if (options?.startTime && options.startTime > 0) {
      try {
        video.currentTime = options.startTime;
      } catch {}
    }

    const handleLoaded = () => {
      options?.onLoaded?.();
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.addEventListener('canplay', handleLoaded, { once: true });
    video.addEventListener('playing', handleLoaded, { once: true });

    if (video.readyState >= 2) {
      options?.onLoaded?.();
    }

    if (options?.autoPlay) {
      attemptPlay();
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('canplay', handleLoaded);
      video.removeEventListener('playing', handleLoaded);
    };
  }
}

/**
 * Dynamically switches quality on an active HLS video stream.
 */
export function setHlsQuality(
  video: HTMLVideoElement | null,
  quality: 'Auto' | '1080p' | '720p' | '480p'
): void {
  if (!video) return;
  const hls: Hls | undefined = (video as any).__hlsInstance;
  if (!hls || !hls.levels || hls.levels.length === 0) return;

  if (quality === 'Auto') {
    hls.currentLevel = -1; // Auto ABR (Adaptive Bitrate)
    return;
  }

  const targetHeight = quality === '1080p' ? 1080 : quality === '720p' ? 720 : 480;

  let bestIdx = 0;
  let minDiff = Infinity;
  hls.levels.forEach((lvl, idx) => {
    const diff = Math.abs((lvl.height || 0) - targetHeight);
    if (diff < minDiff) {
      minDiff = diff;
      bestIdx = idx;
    }
  });

  hls.currentLevel = bestIdx;
}

