import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Show } from '../types';
import { DiziLogo } from './DiziLogo';
import { Eye, EyeOff, Volume2, VolumeX, ChevronLeft, ChevronRight } from 'lucide-react';
import { attachHlsVideo } from '../utils/hlsHelper';
import { MediaImage } from './MediaImage';

interface LoginPageProps {
  shows: Show[];
  platformName?: string;
  customLogoUrl?: string;
  initialEmail?: string;
  initialAuthMode?: 'login' | 'create';
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (muted: boolean) => void;
  onAuthSuccess: (data: { email: string; password: string; mode: 'login' | 'create' }) => void;
  onBrowseFree: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  shows,
  platformName = 'DiziUrdu',
  customLogoUrl,
  initialEmail = '',
  initialAuthMode = 'login',
  isGlobalMuted = true,
  onToggleGlobalMute,
  onAuthSuccess,
  onBrowseFree
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'create'>(initialAuthMode);
  useEffect(() => {
    setAuthMode(initialAuthMode);
  }, [initialAuthMode]);
  const [email, setEmail] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hintMsg, setHintMsg] = useState<string>('');

  // Top 3 movies & series of the platform sorted by popularity points
  const top3Shows = useMemo(() => {
    const validShows = (shows || []).filter((s) =>
      Boolean(
        s &&
          (s.desktopRecommendationBackdropUrl ||
            s.backdropUrl ||
            s.backdropUrl2 ||
            s.posterLandscapeUrl)
      )
    );
    const sorted = [...validShows].sort((a, b) => (b.points || 0) - (a.points || 0));
    return sorted.slice(0, 3);
  }, [shows]);

  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  // Video does NOT auto-play; user must click Play to start playback
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  const [localMuted, setLocalMuted] = useState<boolean>(isGlobalMuted);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 3D Turn-Around Animation State when user clicks Left / Right
  const [turnPhase, setTurnPhase] = useState<'idle' | 'out' | 'in-start'>('idle');
  const [turnDir, setTurnDir] = useState<'next' | 'prev'>('next');
  const turnTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current);
    };
  }, []);

  const effectiveMuted = onToggleGlobalMute ? isGlobalMuted : localMuted;
  const activeShow = top3Shows[activeSlideIndex] || top3Shows[0];

  // Ambiance color selected by admin for the backdrop image (matches Desktop Recommendation priority)
  const activeAmbiance = useMemo(() => {
    if (!activeShow) return '#b45309';
    return (
      activeShow.desktopRecommendationBackdropAmbiance ||
      activeShow.recommendationBackdropColor ||
      activeShow.desktopSpecialSingleFeedAmbiance ||
      activeShow.ambientColor ||
      '#b45309'
    );
  }, [activeShow]);

  const activeBackdrop = useMemo(() => {
    if (!activeShow) return '';
    return (
      activeShow.desktopRecommendationBackdropUrl ||
      activeShow.desktopSpecialSingleFeedUrl ||
      activeShow.backdropUrl2 ||
      activeShow.backdropUrl ||
      activeShow.posterLandscapeUrl
    );
  }, [activeShow]);

  const activePreviewUrl = useMemo(() => {
    if (!activeShow) return '';
    return (
      activeShow.trailerUrl ||
      activeShow.seasons?.[0]?.episodes?.[0]?.videoUrl ||
      (activeShow as any).streamUrl ||
      ''
    );
  }, [activeShow]);

  // Attach/play preview video ONLY when user clicks Play
  useEffect(() => {
    setIsVideoReady(false);
    const video = videoRef.current;
    if (!video || !activePreviewUrl || !isPlayingPreview) {
      if (video && !video.paused) video.pause();
      return;
    }

    const cleanup = attachHlsVideo(video, activePreviewUrl, {
      autoPlay: true,
      muted: Boolean(effectiveMuted)
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [activeSlideIndex, activePreviewUrl, isPlayingPreview]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = Boolean(effectiveMuted);
    }
  }, [effectiveMuted]);

  const triggerTurnSlide = (direction: 'next' | 'prev') => {
    if (top3Shows.length <= 1 || turnPhase !== 'idle') return;
    if (turnTimerRef.current) window.clearTimeout(turnTimerRef.current);

    setTurnDir(direction);
    setTurnPhase('out');

    turnTimerRef.current = window.setTimeout(() => {
      setIsPlayingPreview(false);
      setIsVideoReady(false);
      setActiveSlideIndex((prev) =>
        direction === 'next'
          ? (prev + 1) % top3Shows.length
          : (prev - 1 + top3Shows.length) % top3Shows.length
      );
      setTurnPhase('in-start');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTurnPhase('idle');
        });
      });
    }, 220);
  };

  const handlePrevSlide = () => triggerTurnSlide('prev');
  const handleNextSlide = () => triggerTurnSlide('next');

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!activePreviewUrl) {
      return;
    }
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
      if (video && !video.paused) video.pause();
    } else {
      setIsPlayingPreview(true);
      if (video && video.paused) {
        video.play().catch(() => {});
      }
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !effectiveMuted;
    if (onToggleGlobalMute) {
      onToggleGlobalMute(nextMuted);
    } else {
      setLocalMuted(nextMuted);
    }
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setHintMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please enter an email address and password.');
      return;
    }
    onAuthSuccess({
      email: trimmedEmail,
      password,
      mode: authMode
    });
  };

  // Convert hex color to rgba for smooth multi-stop ambient lighting
  const hexToRgba = (hex: string, alpha: number) => {
    let clean = (hex || '#b45309').replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return `rgba(180, 83, 9, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // 3D turning transform for Top-3 card
  const getCardTransformStyle = (): React.CSSProperties => {
    if (turnPhase === 'out') {
      return {
        transform:
          turnDir === 'next'
            ? 'rotateY(90deg) rotateX(4deg) scale(0.92)'
            : 'rotateY(-104deg) rotateX(4deg) scale(0.92)',
        opacity: 0.2,
        transition: 'transform 220ms cubic-bezier(0.4, 0, 1, 1), opacity 200ms ease-in'
      };
    }
    if (turnPhase === 'in-start') {
      return {
        transform:
          turnDir === 'next'
            ? 'rotateY(-104deg) rotateX(4deg) scale(0.92)'
            : 'rotateY(90deg) rotateX(4deg) scale(0.92)',
        opacity: 0.2,
        transition: 'none'
      };
    }
    return {
      transform: 'rotateY(-8deg) rotateX(2.5deg) scale(1)',
      opacity: 1,
      transition: 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1), opacity 280ms ease-out'
    };
  };

  // Shared button style matching desktop HeroRecommendation circular mute button
  const desktopRecButtonStyle =
    'w-8 h-8 sm:w-8.5 sm:h-8.5 md:w-9 md:h-9 xl:w-9.5 xl:h-9.5 rounded-full bg-black/25 hover:bg-black/40 text-white border-0 flex items-center justify-center cursor-pointer shadow-md transition-all active:scale-95';

  return (
    <div className="fixed inset-0 z-[240] min-h-[100dvh] bg-[#070709] text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none font-sans">
      {/* Dynamic Page-Wide Ambient Radial Glow from Active Backdrop's Selected Ambiance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute right-[5%] top-[12%] w-[720px] h-[620px] rounded-full blur-[130px] transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(activeAmbiance, 0.32)} 0%, ${hexToRgba(activeAmbiance, 0.1)} 45%, transparent 75%)`
          }}
        />
        <div
          className="absolute left-[10%] top-[24%] w-[460px] h-[460px] rounded-full blur-[120px] transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${hexToRgba(activeAmbiance, 0.16)} 0%, transparent 70%)`
          }}
        />
      </div>

      {/* 1. Top Header Bar: Admin Logo Left | Login/Create Account Middle | Browse Free Right */}
      <header className="relative z-20 w-full max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 pt-5 pb-3 flex items-center justify-between gap-3 shrink-0">
        {/* Top Left: Admin Selected Logo */}
        <div className="flex items-center shrink-0">
          <DiziLogo
            variant="red"
            size="md"
            customLogoUrl={customLogoUrl}
            className="cursor-default"
          />
        </div>

        {/* Middle: Single Pill Selector for Login / Create Account */}
        <div className="flex items-center p-1 rounded-full bg-black/25 shadow-md border-0">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMsg('');
              setHintMsg('');
            }}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('create');
              setErrorMsg('');
              setHintMsg('');
            }}
            className={`px-4 sm:px-5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              authMode === 'create'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Right Side: Browse Free Button */}
        <button
          type="button"
          onClick={onBrowseFree}
          className="px-4 sm:px-6 py-2 rounded-full bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm shadow-lg cursor-pointer transition-transform active:scale-95 shrink-0"
        >
          Browse Free
        </button>
      </header>

      {/* 2. Center Split Section: Left Form Card + Right Tilted Top-3 Showcase Card */}
      <main className="relative z-10 w-full max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-12 py-6 sm:py-10 my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Side: Identical Container Dimensions for both Login & Create Account */}
          <div className="lg:col-span-5 flex justify-center lg:justify-start">
            <div className="relative w-full max-w-[390px] rounded-2xl p-6 sm:p-8 bg-[#121215]/90 border-[2.5px] border-zinc-400/[0.09] shadow-[0_30px_80px_-15px_rgba(0,0,0,0.95)] backdrop-blur-xl overflow-hidden">
              {/* Top Specular Ambiance Accent Glow along Card Top Border */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-28 transition-all duration-700"
                style={{
                  background: `radial-gradient(ellipse 85% 60% at 50% 0%, ${hexToRgba(activeAmbiance, 0.25)} 0%, transparent 100%)`
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-0 h-[1.5px] transition-all duration-700"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${hexToRgba(activeAmbiance, 0.8)} 50%, transparent 100%)`
                }}
              />

              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                <div className="space-y-1 pb-1">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight line-clamp-1">
                    {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 line-clamp-1">
                    {authMode === 'login'
                      ? `to continue watching on ${platformName}.`
                      : `Join ${platformName} and start streaming free.`}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Email address"
                      autoComplete="email"
                      className="w-full px-4 py-3 rounded-full bg-white/[0.06] border border-white/12 focus:border-white/40 text-sm text-white placeholder-zinc-400 outline-none transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Password"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-4 pr-11 py-3 rounded-full bg-white/[0.06] border border-white/12 focus:border-white/40 text-sm text-white placeholder-zinc-400 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Fixed-height slot keeps Login & Create Account containers identical height */}
                  <div className="flex justify-end h-4 items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setHintMsg('You can use any email and password to sign in right now.')
                      }
                      className={`text-[11px] text-zinc-400 hover:text-zinc-200 transition-opacity ${
                        authMode === 'login'
                          ? 'opacity-100 cursor-pointer pointer-events-auto'
                          : 'opacity-0 pointer-events-none'
                      }`}
                      tabIndex={authMode === 'login' ? 0 : -1}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Fixed feedback height prevents vertical resize jump */}
                <div className="min-h-[16px]">
                  {errorMsg && (
                    <p className="text-xs text-red-400 font-medium px-1">{errorMsg}</p>
                  )}
                  {!errorMsg && hintMsg && (
                    <p className="text-xs text-zinc-300 font-medium px-1">{hintMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full text-black font-bold text-sm shadow-lg cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    backgroundColor: activeAmbiance,
                    color: '#090b10',
                    boxShadow: `0 8px 24px ${hexToRgba(activeAmbiance, 0.35)}`
                  }}
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <p className="text-center text-[11px] text-zinc-400 pt-1">
                  100% Free • No Ads
                </p>
              </form>
            </div>
          </div>

          {/* Right Side: Tilted Top 3 Movies & Series Card with Desktop Recommendation Shadow & Border */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end">
            {activeShow && (
              <div
                className="relative w-full max-w-[640px]"
                style={{ perspective: '1300px' }}
              >
                {/* Wide Diffused Ambient Aura Behind Container (same as HeroRecommendation) */}
                <div
                  aria-hidden="true"
                  className="absolute -inset-8 rounded-full blur-[110px] pointer-events-none transition-all duration-1000 ease-out"
                  style={{
                    background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${activeAmbiance} 0%, ${activeAmbiance}65 35%, ${activeAmbiance}20 65%, transparent 100%)`,
                    opacity: 0.72
                  }}
                />

                {/* 3D Tilted Showcase Container with Turn-Around Animation */}
                <div
                  className="relative aspect-[16/10] sm:aspect-[16/9.5] w-full rounded-[14px] sm:rounded-[18px] md:rounded-[22px] overflow-hidden bg-[#121319] border-0"
                  style={{
                    ...getCardTransformStyle(),
                    transformStyle: 'preserve-3d',
                    boxShadow: `0 35px 95px -15px rgba(0,0,0,0.98), 0 15px 45px rgba(0,0,0,0.8), 0 0 60px ${activeAmbiance}65, 0 0 110px ${activeAmbiance}25`
                  }}
                >
                  {/* Exact Inner Overlay Border matching Desktop Recommendation Element */}
                  <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border-[2.5px] border-zinc-400/[0.09]" />

                  {/* Base Backdrop Poster Image */}
                  <MediaImage
                    key={`login-backdrop-${activeShow.id}`}
                    src={activeBackdrop}
                    fallbackTitle={activeShow.title}
                    hideFallback={isPlayingPreview && isVideoReady}
                    fallbackClassName="absolute inset-0 w-full h-full bg-[#121319] flex items-center justify-center p-6 text-center select-none"
                    fallbackTextClassName="text-white/80 font-bold text-xl sm:text-2xl font-sans"
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
                  />

                  {/* Preview Video: Plays ONLY when user explicitly clicks Play */}
                  {activePreviewUrl && isPlayingPreview && (
                    <video
                      ref={videoRef}
                      key={`login-video-${activeShow.id}`}
                      poster={activeBackdrop}
                      autoPlay
                      playsInline
                      loop
                      muted={effectiveMuted}
                      onPlaying={() => setIsVideoReady(true)}
                      onPause={() => setIsVideoReady(false)}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                        isVideoReady ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  )}

                  {/* Vignette Scrim for Rank Number & ClearArt Logo Contrast */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 38%, transparent 65%), linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 45%)'
                    }}
                  />

                  {/* Top-Left Rank Number (Desktop Recommendation / Top 10 Style) */}
                  <div className="absolute top-4 left-5 sm:top-6 sm:left-7 z-20 pointer-events-none select-none">
                    <span
                      className="text-6xl sm:text-7xl lg:text-[84px] font-black leading-none tracking-tight inline-block"
                      style={{
                        backgroundImage:
                          'linear-gradient(180deg, #ffffff 35%, #a1a1aa 100%)',
                        WebkitBackgroundClip: 'text',
                        color: 'transparent',
                        filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.75))'
                      }}
                    >
                      {activeSlideIndex + 1}
                    </span>
                  </div>

                  {/* Bottom-Left Title PNG Logo */}
                  <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 z-20 pointer-events-none max-w-[55%]">
                    {activeShow.titleLogoUrl ? (
                      <img
                        src={activeShow.titleLogoUrl}
                        alt={activeShow.title}
                        referrerPolicy="no-referrer"
                        className="max-h-14 sm:max-h-20 lg:max-h-24 w-auto object-contain object-left drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                      />
                    ) : (
                      <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-lg">
                        {activeShow.title}
                      </h2>
                    )}
                  </div>

                  {/* Bottom-Right Controls: Same Desktop Recommendation Mute Button Style */}
                  <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-2">
                    {/* Play / Pause Button */}
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      aria-label={isPlayingPreview ? 'Pause preview' : 'Play preview'}
                      className={desktopRecButtonStyle}
                    >
                      {isPlayingPreview ? (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-white" viewBox="0 0 24 24">
                          <rect x="5" y="4" width="4.8" height="16" rx="1" />
                          <rect x="14.2" y="4" width="4.8" height="16" rx="1" />
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5 text-white" viewBox="0 0 24 24">
                          <polygon points="6,4 20,12 6,20" />
                        </svg>
                      )}
                    </button>

                    {/* Mute / Unmute Button (exact HeroRecommendation mute button) */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      aria-label={effectiveMuted ? 'Unmute preview' : 'Mute preview'}
                      className={desktopRecButtonStyle}
                    >
                      {effectiveMuted ? (
                        <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      )}
                    </button>

                    {/* Left / Right Top 3 Carousel Buttons (exact HeroRecommendation mute button style) */}
                    {top3Shows.length > 1 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handlePrevSlide}
                          aria-label="Previous featured title"
                          className={desktopRecButtonStyle}
                        >
                          <ChevronLeft className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextSlide}
                          aria-label="Next featured title"
                          className={desktopRecButtonStyle}
                        >
                          <ChevronRight className="w-4 h-4 text-white stroke-[2.2]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Simple Minimal Footer */}
      <footer className="relative z-10 w-full max-w-[1260px] mx-auto px-5 sm:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-zinc-500 border-t border-white/[0.06] shrink-0">
        <span>© {new Date().getFullYear()} {platformName}. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Help</span>
        </div>
      </footer>
    </div>
  );
};
