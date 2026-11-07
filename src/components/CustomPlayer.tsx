import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Check,
  ArrowLeft
} from 'lucide-react';
import { attachHlsVideo, setHlsQuality } from '../utils/hlsHelper';

export interface CustomPlayerProps {
  videoUrl: string;
  title: string;
  subtitle?: string;
  episodeSubtitle?: string;
  titleLogoUrl?: string;
  previewThumbnailUrl?: string;
  autoPlay?: boolean;
  initialCurrentTime?: number;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onClose?: () => void;
  onEnded?: () => void;
}

type StreamQuality = '1080p' | '720p' | '480p' | 'Auto';
type CenterIconType = 'play' | 'pause' | 'volume' | 'volume-low' | 'volume-mute' | 'rewind' | 'forward';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const CustomPlayer: React.FC<CustomPlayerProps> = ({
  videoUrl,
  title,
  subtitle,
  episodeSubtitle,
  titleLogoUrl,
  previewThumbnailUrl = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
  autoPlay = true,
  initialCurrentTime = 0,
  onProgressUpdate,
  onClose,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [bufferedProgress, setBufferedProgress] = useState<number>(0);

  // Quality & Speed controls - default to 720p as requested
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality>('720p');
  const [showQualityMenu, setShowQualityMenu] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);

  // Content Preview on Scrubber Hover & Drag
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number>(0);
  const [isDraggingSeek, setIsDraggingSeek] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);

  // Center Screen Action Indicator:
  // Small size, 10% black opacity, no blur, no border, radius corner
  const [centerIcon, setCenterIcon] = useState<CenterIconType | null>(null);
  const centerIconTimerRef = useRef<number | null>(null);

  // Top-Center Notification Pill:
  // Shows % of volume or speed in a small pill with 10% black opacity, no blur, no border, radius corner
  const [topPillText, setTopPillText] = useState<string | null>(null);
  const topPillTimerRef = useRef<number | null>(null);

  // 7-Second Paused Overlay: Only shows after 7 seconds of pointer stay while paused
  const [showPausedOverlay, setShowPausedOverlay] = useState<boolean>(false);
  const pauseStayTimerRef = useRef<number | null>(null);

  // Inactivity timer for 2 seconds
  const hideControlsTimer = useRef<number | null>(null);
  const isPointerOverControlsRef = useRef<boolean>(false);

  const showCenterIcon = useCallback((type: CenterIconType) => {
    setCenterIcon(type);
    if (centerIconTimerRef.current) window.clearTimeout(centerIconTimerRef.current);
    centerIconTimerRef.current = window.setTimeout(() => {
      setCenterIcon(null);
    }, 650);
  }, []);

  const showTopPill = useCallback((text: string) => {
    setTopPillText(text);
    if (topPillTimerRef.current) window.clearTimeout(topPillTimerRef.current);
    topPillTimerRef.current = window.setTimeout(() => {
      setTopPillText(null);
    }, 1500);
  }, []);

  // Update seek position from mouse or touch event
  const updateSeekFromPointer = useCallback((clientX: number) => {
    if (!progressBarRef.current || !videoRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || 0);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setHoverProgress(pos);
    setHoverTime(targetTime);

    // Seek the real-time preview frame
    if (previewVideoRef.current && isFinite(targetTime)) {
      try {
        previewVideoRef.current.currentTime = targetTime;
      } catch {}
    }
  }, [duration]);

  // Global window listeners for drag scrubbing
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        updateSeekFromPointer(e.clientX);
      }
    };

    const handleWindowMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingSeek(false);
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (isDraggingRef.current && e.touches[0]) {
        updateSeekFromPointer(e.touches[0].clientX);
      }
    };

    const handleWindowTouchEnd = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDraggingSeek(false);
      }
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('touchmove', handleWindowTouchMove);
    window.addEventListener('touchend', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [updateSeekFromPointer]);

  // Attach video stream (handles MP4, WebM, and .m3u8 HLS seamlessly)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const cleanup = attachHlsVideo(video, videoUrl, {
      autoPlay,
      muted: isMuted,
      defaultQuality: selectedQuality
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [videoUrl, autoPlay]);

  const previewCleanupRef = useRef<(() => void) | undefined>(undefined);

  // Real-time hover preview video stream attachment via callback ref
  const setPreviewVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (previewCleanupRef.current) {
      previewCleanupRef.current();
      previewCleanupRef.current = undefined;
    }
    previewVideoRef.current = el;
    if (el && videoUrl) {
      previewCleanupRef.current = attachHlsVideo(el, videoUrl, {
        autoPlay: false,
        muted: true,
        defaultQuality: selectedQuality
      });
      if (isFinite(hoverTime) && hoverTime > 0) {
        try {
          el.currentTime = hoverTime;
        } catch {}
      }
    }
  }, [videoUrl, hoverTime, selectedQuality]);

  useEffect(() => {
    return () => {
      if (previewCleanupRef.current) {
        previewCleanupRef.current();
        previewCleanupRef.current = undefined;
      }
    };
  }, []);

  // Video element lifecycle and event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateBufferedRange = () => {
      if (!video.duration) return;
      const cur = video.currentTime;
      let forwardBuffered = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= cur && cur <= video.buffered.end(i)) {
          forwardBuffered = video.buffered.end(i);
          break;
        } else if (video.buffered.end(i) > forwardBuffered) {
          forwardBuffered = video.buffered.end(i);
        }
      }
      setBufferedProgress(Math.min(1, Math.max(0, forwardBuffered / video.duration)));

      // Medium buffering threshold: if buffering, wait for at least 3.5s of buffer ahead before clearing buffer indicator
      const bufferAhead = forwardBuffered - cur;
      if (bufferAhead >= 3.5 || forwardBuffered >= (video.duration - 0.5)) {
        setIsBuffering(false);
      }
    };

    const hasSeekedInitialRef = { current: false };

    const handleTimeUpdate = () => {
      if (!isDraggingRef.current) {
        setCurrentTime(video.currentTime);
      }
      if (onProgressUpdate && video.duration) {
        onProgressUpdate(video.currentTime, video.duration);
      }
      updateBufferedRange();
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (initialCurrentTime > 0 && !hasSeekedInitialRef.current) {
        hasSeekedInitialRef.current = true;
        try {
          video.currentTime = initialCurrentTime;
        } catch {}
      }
      updateBufferedRange();
    };

    const handleProgress = () => {
      updateBufferedRange();
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlayThrough = () => {
      setIsBuffering(false);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
      setIsPlaying(true);
      // Clear pause overlay immediately when playing resumes
      if (pauseStayTimerRef.current) {
        window.clearTimeout(pauseStayTimerRef.current);
        pauseStayTimerRef.current = null;
      }
      setShowPausedOverlay(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      // Start 7-second timer of pointer stay to appear
      if (pauseStayTimerRef.current) window.clearTimeout(pauseStayTimerRef.current);
      pauseStayTimerRef.current = window.setTimeout(() => {
        setShowPausedOverlay(true);
      }, 7000);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      try {
        if (onProgressUpdate && video.duration > 0) {
          onProgressUpdate(video.currentTime, video.duration);
        }
      } catch {}
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      if (pauseStayTimerRef.current) window.clearTimeout(pauseStayTimerRef.current);
      if (centerIconTimerRef.current) window.clearTimeout(centerIconTimerRef.current);
      if (topPillTimerRef.current) window.clearTimeout(topPillTimerRef.current);
      if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    };
  }, [onEnded, onProgressUpdate, initialCurrentTime]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      showCenterIcon('pause');
    } else {
      videoRef.current.play().catch(() => {});
      showCenterIcon('play');
    }
  }, [isPlaying, showCenterIcon]);

  const handleSkip = useCallback((seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = target;
    setCurrentTime(target);
    if (seconds < 0) {
      showCenterIcon('rewind');
    } else {
      showCenterIcon('forward');
    }
  }, [duration, showCenterIcon]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (nextMuted) {
      showCenterIcon('volume-mute');
      showTopPill('Volume: Muted');
    } else {
      showCenterIcon('volume');
      showTopPill(`Volume: ${Math.round(volume * 100)}%`);
    }
  }, [isMuted, volume, showCenterIcon, showTopPill]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const handleSetSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
    showTopPill(`Speed: ${speed}x`);
  }, [showTopPill]);

  const decreasePlaybackRate = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const newIdx = currentIdx > 0 ? currentIdx - 1 : 0;
    handleSetSpeed(SPEED_OPTIONS[newIdx]);
  }, [playbackSpeed, handleSetSpeed]);

  const increasePlaybackRate = useCallback(() => {
    const currentIdx = SPEED_OPTIONS.indexOf(playbackSpeed);
    const newIdx = currentIdx !== -1 && currentIdx < SPEED_OPTIONS.length - 1 ? currentIdx + 1 : SPEED_OPTIONS.length - 1;
    handleSetSpeed(SPEED_OPTIONS[newIdx]);
  }, [playbackSpeed, handleSetSpeed]);

  // Adjust volume with ArrowUp / ArrowDown
  const changeVolumeBy = useCallback((delta: number) => {
    const newVol = Math.max(0, Math.min(1, Math.round((volume + delta) * 100) / 100));
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
    if (newVol === 0) {
      setIsMuted(true);
      if (videoRef.current) videoRef.current.muted = true;
      showCenterIcon('volume-mute');
      showTopPill('Volume: Muted');
    } else {
      setIsMuted(false);
      if (videoRef.current) videoRef.current.muted = false;
      showCenterIcon(newVol < 0.3 ? 'volume-low' : 'volume');
      showTopPill(`Volume: ${Math.round(newVol * 100)}%`);
    }
  }, [volume, showCenterIcon, showTopPill]);

  // Keyboard controls handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-10);
      } else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') {
        e.preventDefault();
        handleSkip(10);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        changeVolumeBy(0.05);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changeVolumeBy(-0.05);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === '<' || (e.shiftKey && e.key === ',')) {
        e.preventDefault();
        decreasePlaybackRate();
      } else if (e.key === '>' || (e.shiftKey && e.key === '.')) {
        e.preventDefault();
        increasePlaybackRate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
          setIsFullscreen(false);
        }
        if (onClose) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    handleSkip,
    changeVolumeBy,
    toggleMute,
    toggleFullscreen,
    decreasePlaybackRate,
    increasePlaybackRate,
    onClose
  ]);

  // Quality switcher with real-time video rendering buffer / resolution effect
  const handleSelectQuality = (quality: StreamQuality) => {
    setSelectedQuality(quality);
    setShowQualityMenu(false);
    showTopPill(`Quality: ${quality === 'Auto' ? 'Auto (1080p)' : quality}`);
    setIsBuffering(true);
    setHlsQuality(videoRef.current, quality);
    setTimeout(() => setIsBuffering(false), 200);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val === 0) {
        setIsMuted(true);
        videoRef.current.muted = true;
      } else if (isMuted) {
        setIsMuted(false);
        videoRef.current.muted = false;
      }
    }
    showTopPill(`Volume: ${Math.round(val * 100)}%`);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetHideTimer = useCallback(() => {
    if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
    if (!isPointerOverControlsRef.current && !isDraggingRef.current) {
      hideControlsTimer.current = window.setTimeout(() => {
        if (!isPointerOverControlsRef.current && !isDraggingRef.current) {
          setShowControls(false);
          setShowQualityMenu(false);
          setShowSpeedMenu(false);
        }
      }, 2000);
    }
  }, []);

  // When pointer hovers/moves:
  // - Show controls and show pointer cursor
  // - When pointer is on controls, it NEVER hides!
  // - Inactivity of 2 seconds over the video area hides both pointer and video controls
  // - If paused, reset 7-second stay timer so logo PNG only appears after 7 full seconds of pointer stillness
  const handleMouseMove = () => {
    setShowControls(true);
    setShowPausedOverlay(false);

    if (!isPointerOverControlsRef.current) {
      resetHideTimer();
    } else {
      if (hideControlsTimer.current) {
        window.clearTimeout(hideControlsTimer.current);
      }
    }

    // 7-second timer for logo PNG & details when paused
    if (!isPlaying) {
      if (pauseStayTimerRef.current) window.clearTimeout(pauseStayTimerRef.current);
      pauseStayTimerRef.current = window.setTimeout(() => {
        setShowPausedOverlay(true);
      }, 7000);
    }
  };

  // Scrubber mouse events for hover frame preview
  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * (duration || 0);
    setHoverProgress(pos);
    setHoverTime(targetTime);

    if (previewVideoRef.current && isFinite(targetTime)) {
      try {
        previewVideoRef.current.currentTime = targetTime;
      } catch {}
    }
  };

  const handleProgressMouseLeave = () => {
    if (!isDraggingRef.current) {
      setHoverProgress(null);
    }
  };

  // Formatted remaining time like "49:35"
  const remainingTime = Math.max(0, duration - currentTime);
  const displayRemainingOrTotal = duration > 0 ? formatTime(remainingTime) : '00:00';

  const activeEpisodeLine =
    episodeSubtitle || subtitle || 'S1: E1 "The Camp in the Highlands"';

  // Quality indicator: HD when 720p/1080p/Auto, SD when 480p
  const isHD = selectedQuality === '1080p' || selectedQuality === '720p' || selectedQuality === 'Auto';

  // Video resolution / quality visual rendering
  const videoFilterStyle = selectedQuality === '480p'
    ? { filter: 'blur(0.45px) contrast(0.96)' }
    : selectedQuality === '720p'
    ? { filter: 'contrast(0.99)' }
    : { filter: 'none' };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (!isDraggingRef.current) {
          setShowControls(false);
        }
      }}
      data-no-tooltip="true"
      className={`relative w-full h-full min-h-[360px] bg-black overflow-hidden group select-none shadow-2xl flex flex-col justify-between font-sans ${
        showControls ? 'cursor-default' : 'cursor-none'
      }`}
    >
      {/* Background Video Element - Protected against direct download / right click - always set to fit */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        style={videoFilterStyle}
        onClick={togglePlay}
        playsInline
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Buffering Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
          <div className="w-14 h-14 border-4 border-[#b81d24] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* 
        TOP-CENTER NOTIFICATION PILL:
        Displays volume % and speed in a small pill with 10% black opacity, no blur, no border, and radius corner
      */}
      {topPillText && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in duration-200">
          <div className="px-4 py-1.5 rounded-lg bg-black/10 text-white font-medium text-xs sm:text-sm tracking-wide select-none">
            {topPillText}
          </div>
        </div>
      )}

      {/* 
        CENTER SCREEN ACTION INDICATOR:
        Play, pause, speaker icon (volume up/down), rewind, forward
        Small in size, 10% opacity black background, no blur, no border, radius corner
      */}
      {centerIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-35 animate-in fade-in zoom-in-95 duration-150">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/10 flex items-center justify-center text-white">
            {centerIcon === 'play' && <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-0.5" />}
            {centerIcon === 'pause' && <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />}
            {centerIcon === 'volume' && <Volume2 className="w-7 h-7 sm:w-8 sm:h-8" />}
            {centerIcon === 'volume-low' && <Volume1 className="w-7 h-7 sm:w-8 sm:h-8" />}
            {centerIcon === 'volume-mute' && <VolumeX className="w-7 h-7 sm:w-8 sm:h-8" />}
            {centerIcon === 'rewind' && (
              <div className="relative flex items-center justify-center">
                <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="absolute text-[9px] font-black font-sans select-none pointer-events-none">10</span>
              </div>
            )}
            {centerIcon === 'forward' && (
              <div className="relative flex items-center justify-center">
                <RotateCw className="w-7 h-7 sm:w-8 sm:h-8" />
                <span className="absolute text-[9px] font-black font-sans select-none pointer-events-none">10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 
        PAUSED OVERLAY (AFTER 7 SECONDS OF POINTER STAY):
      {/* 
        UNIFORM VIDEO GLARE (When logo PNG and paused overlay appear):
        Smooth, non-sudden uniform glare covering the whole video with high contrast for logo and text
      */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-1000 ease-in-out ${
          !isPlaying && showPausedOverlay && !showControls ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'rgba(0, 0, 0, 0.55)'
        }}
      />

      {/* 
        PAUSED OVERLAY (AFTER 7 SECONDS OF POINTER STAY):
        Only displays after 7 seconds of pointer stay when video is paused.
        Logo PNG & details on left, and small opacity-80% text "Paused" on bottom right.
        NEVER shows when user moves pointer (controls show instead).
      */}
      {!isPlaying && showPausedOverlay && !showControls && (
        <div className="animate-in fade-in duration-700 ease-out pointer-events-none select-none">
          <div className="absolute left-8 sm:left-14 md:left-20 top-1/2 -translate-y-1/2 z-25 max-w-lg select-none pointer-events-none">
            {/* Stylized Logo PNG or fallback title */}
            {titleLogoUrl ? (
              <img
                src={titleLogoUrl}
                alt={title}
                referrerPolicy="no-referrer"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="max-h-20 sm:max-h-28 md:max-h-36 max-w-[320px] md:max-w-[420px] object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)] mb-3 pointer-events-none"
              />
            ) : (
              <div className="mb-3">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.95)] leading-none font-display">
                  {title}
                </h1>
              </div>
            )}

            {/* Episode details line */}
            <p className="text-sm sm:text-base md:text-lg font-bold text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.95)] tracking-wide">
              {activeEpisodeLine}
            </p>
          </div>

          {/* Bottom right: small opacity 80% text "Paused" */}
          <div className="absolute bottom-6 right-8 sm:bottom-8 sm:right-12 z-25 select-none pointer-events-none">
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/80 font-sans drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Paused
            </span>
          </div>
        </div>
      )}

      {/* 
        TOP HEADER CONTROLS:
        Top left: Back button (All native tooltips removed)
      */}
      <div
        onMouseEnter={() => {
          isPointerOverControlsRef.current = true;
          if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
        }}
        onMouseLeave={() => {
          isPointerOverControlsRef.current = false;
          resetHideTimer();
        }}
        className={`relative p-5 sm:p-7 bg-gradient-to-b from-black/90 via-black/40 to-transparent transition-opacity duration-300 z-30 flex items-center justify-between ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div>
          {onClose && (
            <button
              onClick={onClose}
              data-no-tooltip="true"
              className="text-white hover:text-zinc-300 transition-colors cursor-pointer p-1.5 rounded-full hover:bg-white/10"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 md:w-7 md:h-7" />
            </button>
          )}
        </div>
      </div>

      {/* 
        BOTTOM CONTROLS BAR:
        - Slim, sleek red scrubber with real-time frame preview on hover and draggable seek bar
        - Left: Play/Pause, Rewind 10s, Forward 10s, Volume (revealed on hover), Time
        - Center: Video Title & Episode Info
        - Right: Quality (HD/SD badge), Speed controls, Fullscreen button
        (All tooltips removed)
      */}
      <div
        onMouseEnter={() => {
          isPointerOverControlsRef.current = true;
          if (hideControlsTimer.current) window.clearTimeout(hideControlsTimer.current);
        }}
        onMouseLeave={() => {
          isPointerOverControlsRef.current = false;
          resetHideTimer();
        }}
        className={`relative bg-gradient-to-t from-black/95 via-black/85 to-transparent px-5 sm:px-8 pb-5 sm:pb-7 pt-8 transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* 1. Slim Sleek Red Scrubber Bar with Real-Time Frame Preview & Drag Support */}
        <div className="relative mb-3.5 flex items-center">
          <div
            ref={progressBarRef}
            data-no-tooltip="true"
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              setIsDraggingSeek(true);
              updateSeekFromPointer(e.clientX);
            }}
            onTouchStart={(e) => {
              isDraggingRef.current = true;
              setIsDraggingSeek(true);
              if (e.touches[0]) {
                updateSeekFromPointer(e.touches[0].clientX);
              }
            }}
            onMouseMove={handleProgressMouseMove}
            onMouseLeave={handleProgressMouseLeave}
            className="relative w-full py-2.5 cursor-pointer group/bar flex items-center touch-none"
          >
            {/* The Track: Sleek red progress bar with dull white buffer indication */}
            <div className="w-full h-1 group-hover/bar:h-1.5 bg-white/20 rounded-full overflow-hidden transition-all relative">
              {/* Dull White Buffered Bar: Loaded video chunk progress */}
              <div
                className="absolute inset-y-0 left-0 bg-white/35 rounded-full pointer-events-none transition-[width] duration-300 ease-out"
                style={{ width: `${bufferedProgress * 100}%` }}
              />
              {/* Played Bar (Brand Red) */}
              <div
                className="absolute inset-y-0 left-0 bg-[#b81d24] rounded-full pointer-events-none transition-[width] duration-75 ease-linear"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>

            {/* Scrubber Head Circle Thumb */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg pointer-events-none ${
                isDraggingSeek ? 'scale-125 ring-4 ring-[#b81d24]/50' : 'group-hover/bar:scale-125'
              }`}
              style={{
                left: `calc(${(currentTime / (duration || 1)) * 100}% - 7px)`,
                transition: isDraggingSeek ? 'none' : 'left 80ms linear, transform 150ms ease-out'
              }}
            />

            {/* 
              Hover Frame Content Preview:
              Previews the exact video frame where user hovers or drags on the seek bar
              (No static thumbnail, lazy-loaded on hover, smooth pointer tracking)
            */}
            {(hoverProgress !== null || isDraggingSeek) && (
              <div
                className="absolute bottom-6 -translate-x-1/2 pointer-events-none z-50 flex flex-col items-center will-change-[left] animate-in fade-in zoom-in-95 duration-100"
                style={{
                  left: `${(hoverProgress ?? (currentTime / (duration || 1))) * 100}%`,
                  transition: isDraggingSeek ? 'none' : 'left 60ms cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
              >
                {/* Frame Preview Box */}
                <div className="w-36 sm:w-44 aspect-video bg-zinc-950 border border-white/30 rounded-lg overflow-hidden shadow-2xl relative flex items-center justify-center">
                  {/* Real-time frame video at exact hovered position (lazy-loaded on hover) */}
                  <video
                    ref={setPreviewVideoRef}
                    preload="auto"
                    muted
                    playsInline
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    className="w-full h-full object-cover absolute inset-0 z-10 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-20 pointer-events-none" />
                </div>
                {/* Timestamp Badge */}
                <span className="mt-1 px-2.5 py-0.5 rounded bg-black/90 text-white font-sans text-xs font-bold border border-white/20 shadow-md">
                  {formatTime(hoverTime)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Controls Row */}
        <div className="relative flex items-center justify-between gap-4 w-full">
          {/* Bottom-Left Controls: Play/Pause, Rewind 10, Forward 10, Volume (mini progress bar), Time */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0 z-10">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              data-no-tooltip="true"
              className="text-white hover:text-zinc-200 transition-transform hover:scale-110 cursor-pointer p-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            {/* 10s Rewind */}
            <button
              onClick={() => handleSkip(-10)}
              data-no-tooltip="true"
              className="relative text-white hover:text-zinc-200 transition-transform hover:scale-110 cursor-pointer p-1 flex items-center justify-center"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="absolute text-[8px] font-black font-sans select-none pointer-events-none">10</span>
            </button>

            {/* 10s Fast Forward */}
            <button
              onClick={() => handleSkip(10)}
              data-no-tooltip="true"
              className="relative text-white hover:text-zinc-200 transition-transform hover:scale-110 cursor-pointer p-1 flex items-center justify-center"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              <span className="absolute text-[8px] font-black font-sans select-none pointer-events-none">10</span>
            </button>

            {/* Volume Control Group: Mini progress bar that reveals on hover without shifting center title */}
            <div className="flex items-center group/vol" data-no-tooltip="true">
              <button
                onClick={toggleMute}
                data-no-tooltip="true"
                className="text-white hover:text-zinc-200 transition-colors cursor-pointer p-1 shrink-0"
                aria-label="Toggle mute"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : volume < 0.3 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              {/* Mini progress bar on hover */}
              <div className="w-0 opacity-0 pointer-events-none group-hover/vol:w-16 sm:group-hover/vol:w-20 group-hover/vol:opacity-100 group-hover/vol:pointer-events-auto transition-all duration-200 ease-out flex items-center overflow-hidden pl-1.5">
                <div className="relative w-14 sm:w-18 h-4 flex items-center cursor-pointer">
                  {/* Mini track */}
                  <div className="w-full h-1 bg-white/25 rounded-full overflow-hidden relative pointer-events-none">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-75"
                      style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                    />
                  </div>
                  {/* Mini thumb */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow pointer-events-none"
                    style={{
                      left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)`
                    }}
                  />
                  {/* Native range input on top for smooth dragging */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    data-no-tooltip="true"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Volume slider"
                  />
                </div>
              </div>
            </div>

            {/* Elapsed / Remaining Time */}
            <div className="hidden xs:flex items-center text-xs font-semibold text-zinc-300 font-sans tracking-tight">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-zinc-500">/</span>
              <span>{displayRemainingOrTotal}</span>
            </div>
          </div>

          {/* Center: Video Title & Episode Info - Absolute Centered so hovering volume bar NEVER shifts it */}
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-center pointer-events-none max-w-[34%] sm:max-w-[46%] md:max-w-[54%] z-0">
            <span className="text-white font-bold text-xs sm:text-sm md:text-base truncate w-full font-sans drop-shadow">
              {title}
            </span>
            <span className="text-zinc-400 text-[10px] sm:text-xs truncate w-full font-sans mt-0.5 drop-shadow">
              {activeEpisodeLine}
            </span>
          </div>

          {/* Bottom-Right Controls: Quality HD/SD, Speed, Fullscreen (All tooltips removed) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 z-10">
            {/* 
              Quality Button with HD/SD symbol:
              Shows "HD" when 720p/1080p, shows "SD" when below HD (480p)
            */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                data-no-tooltip="true"
                className="px-2 py-0.5 rounded border border-white/40 hover:border-white text-white font-black text-xs transition-colors cursor-pointer flex items-center gap-1 hover:bg-white/10"
                aria-label="Quality settings"
              >
                <span className={isHD ? 'text-white' : 'text-zinc-400'}>
                  {isHD ? 'HD' : 'SD'}
                </span>
              </button>

              {/* Quality Dropdown Menu */}
              {showQualityMenu && (
                <div className="absolute bottom-11 right-0 bg-[#14151b] border border-zinc-700/80 rounded-xl shadow-2xl p-2 min-w-[150px] text-xs z-50 animate-in fade-in" data-no-tooltip="true">
                  <div className="font-bold text-zinc-400 px-2 py-1 uppercase text-[10px] tracking-wider border-b border-zinc-800 mb-1">
                    Stream Quality
                  </div>
                  {(['Auto', '1080p', '720p', '480p'] as StreamQuality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSelectQuality(q)}
                      data-no-tooltip="true"
                      className="w-full text-left px-2.5 py-1.5 rounded text-zinc-200 hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{q === 'Auto' ? 'Auto (1080p)' : q}</span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {q === '480p' ? 'SD' : 'HD'}
                        </span>
                      </div>
                      {selectedQuality === q && (
                        <Check className="w-3.5 h-3.5 text-[#b81d24] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 
              Speed Controls: right side of quality control
            */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
                data-no-tooltip="true"
                className="px-2 py-0.5 rounded text-white hover:text-zinc-200 font-bold text-xs transition-colors cursor-pointer hover:bg-white/10"
                aria-label="Playback Speed"
              >
                <span>{playbackSpeed}x</span>
              </button>

              {/* Speed Menu Dropdown */}
              {showSpeedMenu && (
                <div className="absolute bottom-11 right-0 bg-[#14151b] border border-zinc-700/80 rounded-xl shadow-2xl p-2 min-w-[130px] text-xs z-50 animate-in fade-in" data-no-tooltip="true">
                  <div className="font-bold text-zinc-400 px-2 py-1 uppercase text-[10px] tracking-wider border-b border-zinc-800 mb-1">
                    Speed
                  </div>
                  {SPEED_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSetSpeed(s)}
                      data-no-tooltip="true"
                      className="w-full text-left px-2.5 py-1.5 rounded text-zinc-200 hover:bg-white/10 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>{s === 1 ? '1x (Normal)' : `${s}x`}</span>
                      {playbackSpeed === s && (
                        <Check className="w-3.5 h-3.5 text-[#b81d24] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              data-no-tooltip="true"
              className="text-white hover:text-zinc-200 transition-transform hover:scale-110 cursor-pointer p-1"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              ) : (
                <Maximize2 className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
