import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { Show } from '../types';
import { DiziLogo } from './DiziLogo';
import { Footer } from './Footer';
import { useDeviceLayout } from '../utils/deviceLayout';

export type LoginBgMode = 'collage' | 'image' | 'video' | 'color_glare';
export type LoginVideoPlayMode = 'loop' | 'once_with_image_fade';

interface LoginPageProps {
  shows: Show[];
  platformName?: string;
  customLogoUrl?: string;
  useCustomLogo?: boolean;
  // Desktop background options
  desktopBgMode?: LoginBgMode;
  backgroundImageUrl?: string;
  desktopVideoUrl?: string;
  desktopVideoPlayMode?: LoginVideoPlayMode;
  desktopGlareColor?: string;
  // Mobile top visual options
  mobileBgMode?: LoginBgMode;
  mobileMediaUrl?: string;
  mobileVideoUrl?: string;
  mobileVideoPlayMode?: LoginVideoPlayMode;
  mobileGlareColor?: string;
  initialEmail?: string;
  initialAuthMode?: 'login' | 'create';
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: (muted: boolean) => void;
  onAuthSuccess: (user: {
    email: string;
    password: string;
    name?: string;
    logoRect?: DOMRect | null;
  }) => void;
  onBack: () => void;
  onGoHome: () => void;
}

const isVideoMediaUrl = (url: string): boolean => {
  const clean = url.trim().toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(clean);
};

interface LoginVideoWithImageFadeProps {
  videoUrl: string;
  fallbackImageUrl?: string;
  playMode: LoginVideoPlayMode;
  renderFallbackCollage: () => React.ReactNode;
}

const LoginVideoWithImageFade: React.FC<LoginVideoWithImageFadeProps> = ({
  videoUrl,
  fallbackImageUrl,
  playMode,
  renderFallbackCollage
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideoLayer, setShowVideoLayer] = useState<boolean>(playMode === 'loop');
  const [hasEndedOnce, setHasEndedOnce] = useState<boolean>(false);

  useEffect(() => {
    setHasEndedOnce(false);
    if (playMode === 'loop') {
      setShowVideoLayer(true);
      return;
    }
    setShowVideoLayer(false);
    const v = videoRef.current;
    if (v) {
      try {
        v.currentTime = 0;
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {}
    }
  }, [videoUrl, playMode]);

  const handleVideoPlaying = () => {
    if (playMode === 'loop') {
      setShowVideoLayer(true);
      return;
    }
    if (!hasEndedOnce) {
      window.setTimeout(() => {
        setShowVideoLayer(true);
      }, 650);
    }
  };

  const handleVideoEnded = () => {
    if (playMode === 'once_with_image_fade') {
      setHasEndedOnce(true);
      setShowVideoLayer(false);
    }
  };

  const cleanImg = (fallbackImageUrl || '').trim();

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Underlying Start / End Image (or Collage if no companion image was set) */}
      {cleanImg ? (
        <img
          src={cleanImg}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        renderFallbackCollage()
      )}

      {/* Video Layer: loops continuously OR smoothly fades in from start image & fades back out when ended */}
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        muted
        loop={playMode === 'loop'}
        playsInline
        onPlaying={handleVideoPlaying}
        onEnded={handleVideoEnded}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
          showVideoLayer ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const LoginPage: React.FC<LoginPageProps> = ({
  shows,
  platformName = 'Dizi Urdu',
  customLogoUrl,
  useCustomLogo = false,
  desktopBgMode,
  backgroundImageUrl,
  desktopVideoUrl,
  desktopVideoPlayMode = 'loop',
  desktopGlareColor = '#e11d48',
  mobileBgMode,
  mobileMediaUrl,
  mobileVideoUrl,
  mobileVideoPlayMode = 'loop',
  mobileGlareColor = '#e11d48',
  initialEmail = '',
  initialAuthMode = 'login',
  onAuthSuccess,
  onBack,
  onGoHome
}) => {
  const { isMobile } = useDeviceLayout();
  const [authMode, setAuthMode] = useState<'login' | 'create'>(initialAuthMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const desktopLogoRef = useRef<HTMLButtonElement>(null);
  const mobileLogoRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setAuthMode(initialAuthMode);
  }, [initialAuthMode]);

  // Lock orientation to vertical (portrait) on mobile login screen
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined') return;
    let locked = false;
    try {
      const orientation = (window.screen as unknown as { orientation?: { lock?: (o: string) => Promise<void>; unlock?: () => void } }).orientation;
      if (orientation?.lock) {
        orientation
          .lock('portrait')
          .then(() => {
            locked = true;
          })
          .catch(() => {});
      }
    } catch {}
    return () => {
      if (locked) {
        try {
          const orientation = (window.screen as unknown as { orientation?: { unlock?: () => void } }).orientation;
          orientation?.unlock?.();
        } catch {}
      }
    };
  }, [isMobile]);

  // Resolve effective desktop & mobile background modes (with backwards compatibility for legacy URL fields)
  const cleanDesktopImg = (backgroundImageUrl || '').trim();
  const cleanDesktopVid = (desktopVideoUrl || '').trim();
  const resolvedDesktopMode: LoginBgMode = useMemo(() => {
    if (desktopBgMode) return desktopBgMode;
    if (cleanDesktopVid) return 'video';
    if (cleanDesktopImg) return isVideoMediaUrl(cleanDesktopImg) ? 'video' : 'image';
    return 'collage';
  }, [desktopBgMode, cleanDesktopVid, cleanDesktopImg]);

  const effectiveDesktopVideoUrl =
    cleanDesktopVid || (isVideoMediaUrl(cleanDesktopImg) ? cleanDesktopImg : '');
  const effectiveDesktopImageUrl =
    !isVideoMediaUrl(cleanDesktopImg) ? cleanDesktopImg : '';

  const cleanMobileImg = (mobileMediaUrl || '').trim();
  const cleanMobileVid = (mobileVideoUrl || '').trim();
  const resolvedMobileMode: LoginBgMode = useMemo(() => {
    if (mobileBgMode) return mobileBgMode;
    if (cleanMobileVid) return 'video';
    if (cleanMobileImg) return isVideoMediaUrl(cleanMobileImg) ? 'video' : 'image';
    return 'collage';
  }, [mobileBgMode, cleanMobileVid, cleanMobileImg]);

  const effectiveMobileVideoUrl =
    cleanMobileVid || (isVideoMediaUrl(cleanMobileImg) ? cleanMobileImg : '');
  const effectiveMobileImageUrl =
    !isVideoMediaUrl(cleanMobileImg) ? cleanMobileImg : '';

  // Desktop catalog poster wall collage fallback
  const desktopCollagePosters = useMemo(() => {
    const urls: string[] = [];
    for (const s of shows) {
      const img = s.posterLandscapeUrl || s.backdropUrl || s.posterVerticalUrl || s.posterUrl;
      if (img && !urls.includes(img)) {
        urls.push(img);
      }
      if (urls.length >= 24) break;
    }
    return urls;
  }, [shows]);

  // Mobile circular portrait/artwork collage
  const mobileCollageImages = useMemo(() => {
    const urls: string[] = [];
    for (const s of shows) {
      if (s.cast && s.cast.length > 0) {
        for (const c of s.cast) {
          if (c.profileUrl && !urls.includes(c.profileUrl)) {
            urls.push(c.profileUrl);
          }
          if (urls.length >= 16) break;
        }
      }
      if (urls.length >= 16) break;
    }
    if (urls.length < 12) {
      for (const s of shows) {
        const img = s.posterVerticalUrl || s.posterUrl || s.posterLandscapeUrl || s.backdropUrl;
        if (img && !urls.includes(img)) {
          urls.push(img);
        }
        if (urls.length >= 16) break;
      }
    }
    return urls;
  }, [shows]);

  const renderDesktopCollage = () =>
    desktopCollagePosters.length > 0 ? (
      <div className="w-full h-full grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 p-2.5 opacity-55 scale-[1.02]">
        {Array.from({ length: 24 }).map((_, idx) => {
          const src = desktopCollagePosters[idx % desktopCollagePosters.length];
          return (
            <div key={idx} className="relative aspect-[16/10] rounded-lg overflow-hidden bg-zinc-900">
              <img
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          );
        })}
      </div>
    ) : null;

  const renderMobileCollage = () => (
    <div className="absolute -inset-x-6 -top-6 bottom-0 flex flex-col justify-center gap-3.5 opacity-85">
      {[0, 1, 2, 3].map((rowIdx) => (
        <div
          key={rowIdx}
          className={`flex items-center justify-center gap-3.5 ${
            rowIdx % 2 === 1 ? 'translate-x-5' : '-translate-x-4'
          }`}
        >
          {Array.from({ length: 5 }).map((_, colIdx) => {
            const imgIndex = rowIdx * 5 + colIdx;
            const src =
              mobileCollageImages.length > 0
                ? mobileCollageImages[imgIndex % mobileCollageImages.length]
                : '';
            return (
              <div
                key={colIdx}
                className="w-[82px] h-[82px] sm:w-[94px] sm:h-[94px] rounded-full overflow-hidden bg-zinc-900 shrink-0 shadow-lg"
              >
                {src && (
                  <img
                    src={src}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (authMode === 'create' && !forgotMode && trimmedName.length < 2) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (forgotMode) {
      setForgotSent(true);
      return;
    }

    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    const activeLogoEl = isMobile ? mobileLogoRef.current : desktopLogoRef.current;
    const logoRect = activeLogoEl ? activeLogoEl.getBoundingClientRect() : null;

    window.setTimeout(() => {
      setIsSubmitting(false);
      onAuthSuccess({
        email: trimmedEmail,
        password,
        name: authMode === 'create' ? trimmedName : undefined,
        logoRect
      });
    }, 180);
  };

  // =========================================================================
  // MOBILE LAYOUT
  // Vertical orientation-locked viewport: top media section adapts to screen
  // height while logo and form block remain strictly fixed with minimal bottom
  // padding so toggling Login <-> Create Account NEVER shifts the logo up/down.
  // =========================================================================
  if (isMobile) {
    const mobileAccent = (mobileGlareColor || '#e11d48').trim();
    return (
      <div className="fixed inset-0 h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden select-none">
        {/* Top Flexible Media Section (adjusts automatically to screen height above fixed logo + form dock) */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-black">
          {/* Transparent Back Button with exact More Info shadow (no circle container) */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-3.5 left-3 z-30 h-9 w-9 bg-transparent text-white hover:text-white/80 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2.2] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]" />
          </button>

          {/* Media Layer */}
          {resolvedMobileMode === 'color_glare' ? (
            <div className="absolute inset-0 bg-black overflow-hidden">
              <div
                className="absolute -top-24 left-1/2 -translate-x-1/2 w-[460px] h-[460px] rounded-full blur-[120px] opacity-35"
                style={{
                  background: `radial-gradient(circle, ${mobileAccent} 0%, #b45309 52%, transparent 80%)`
                }}
              />
            </div>
          ) : resolvedMobileMode === 'video' && effectiveMobileVideoUrl ? (
            <LoginVideoWithImageFade
              videoUrl={effectiveMobileVideoUrl}
              fallbackImageUrl={effectiveMobileImageUrl}
              playMode={mobileVideoPlayMode}
              renderFallbackCollage={renderMobileCollage}
            />
          ) : resolvedMobileMode === 'image' && effectiveMobileImageUrl ? (
            <img
              src={effectiveMobileImageUrl}
              alt=""
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            renderMobileCollage()
          )}

          {/* Smooth Dark Glarence Covering Top Section & Merging Seamlessly into Pure Black Lower Section */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background:
                'radial-gradient(ellipse 92% 82% at 50% 34%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.48) 68%, rgba(0,0,0,0.86) 100%)'
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 h-[58%] pointer-events-none z-10"
            style={{
              background:
                'linear-gradient(to top, #000000 0%, rgba(0,0,0,0.95) 18%, rgba(0,0,0,0.74) 44%, rgba(0,0,0,0.36) 72%, rgba(0,0,0,0) 100%)'
            }}
          />

          {/* Centered Platform Logo — anchored right above the fixed-height lower dock so it NEVER moves up or down */}
          <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center">
            <button
              ref={mobileLogoRef}
              type="button"
              onClick={onGoHome}
              aria-label="Go to homepage"
              className="inline-flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              {useCustomLogo && customLogoUrl ? (
                <img
                  src={customLogoUrl}
                  alt={platformName}
                  referrerPolicy="no-referrer"
                  className="h-9.5 w-auto max-w-[170px] object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]"
                />
              ) : (
                <DiziLogo
                  variant="red"
                  size="lg"
                  className="h-9.5 max-w-[170px] drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]"
                />
              )}
            </button>
          </div>
        </div>

        {/* Fixed-Height Lower Form Dock (reduced bottom padding, locked height so logo NEVER shifts between Login / Create Account) */}
        <div className="relative z-20 shrink-0 h-[258px] w-full bg-black px-6 pt-2 pb-[max(env(safe-area-inset-bottom),12px)] flex flex-col justify-end">
          <div className="w-full max-w-[400px] mx-auto">
            {forgotMode && (
              <div className="text-center mb-2.5">
                <h2 className="text-sm font-bold text-white">Reset Password</h2>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Enter your email to receive reset instructions.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className={authMode === 'create' ? 'space-y-2' : 'space-y-2.5'}>
              {/* Name Input (Create Account mode only) */}
              {!forgotMode && authMode === 'create' && (
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    autoComplete="name"
                    className="w-full rounded-xl bg-white/[0.1] focus:bg-white/[0.15] text-white placeholder-zinc-400 px-4 py-2.5 text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors"
                  />
                </div>
              )}

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className={`w-full rounded-xl bg-white/[0.1] focus:bg-white/[0.15] text-white placeholder-zinc-400 px-4 ${
                    authMode === 'create' ? 'py-2.5' : 'py-3'
                  } text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors`}
                />
              </div>

              {/* Password Input (No Confirm Password) */}
              {!forgotMode && (
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete={authMode === 'create' ? 'new-password' : 'current-password'}
                    className={`w-full rounded-xl bg-white/[0.1] focus:bg-white/[0.15] text-white placeholder-zinc-400 pl-4 pr-11 ${
                      authMode === 'create' ? 'py-2.5' : 'py-3'
                    } text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {!forgotMode && authMode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode(true);
                      setForgotSent(false);
                      setErrorMsg(null);
                    }}
                    className="text-[11px] text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {errorMsg && (
                <p className="text-[11px] text-rose-400 font-semibold text-center bg-rose-500/10 rounded-lg py-1.5 px-3">
                  {errorMsg}
                </p>
              )}
              {forgotSent && forgotMode && (
                <p className="text-[11px] text-emerald-400 font-semibold text-center bg-emerald-500/10 rounded-lg py-1.5 px-3">
                  Reset link sent to {email}. Check your inbox.
                </p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full rounded-xl bg-[#e50914] hover:bg-[#f41924] active:scale-[0.98] disabled:opacity-60 text-white font-bold text-sm ${
                  authMode === 'create' ? 'py-2.5' : 'py-3'
                } shadow-[0_10px_28px_rgba(229,9,20,0.38)] transition-all cursor-pointer`}
              >
                {isSubmitting
                  ? 'Please wait...'
                  : forgotMode
                  ? 'Send Reset Link'
                  : authMode === 'create'
                  ? 'Sign Up'
                  : 'Login'}
              </button>
            </form>

            {/* Bottom Mode Switch (compact spacing, reduced bottom padding) */}
            <div className="mt-3 text-center">
              {forgotMode ? (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setForgotSent(false);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-zinc-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              ) : authMode === 'login' ? (
                <p className="text-xs text-zinc-400">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('create');
                      setErrorMsg(null);
                    }}
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p className="text-xs text-zinc-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-white font-bold hover:underline cursor-pointer"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP LAYOUT
  // - Non-sticky transparent navbar that scrolls naturally with the page
  // - Clickable centered logo -> Homepage
  // - Circular-corner top-right Create Account / Login button
  // - Lighter center glarence, slightly stronger top & bottom edge glarence
  // - Supports Collage, Image/GIF, Video (loop or fade-in/out with image), or Color Glarence (PIN style)
  // - No duplicate bottom "Already have an account / Don't have an account" inside the card
  // - Fits 1920x1080 full screen cleanly without vertical scrollbar; background scrolls on narrow windows
  // =========================================================================
  const desktopAccent = (desktopGlareColor || '#e11d48').trim();

  return (
    <div className="relative min-h-screen w-full bg-[#0d0e11] text-white flex flex-col justify-between overflow-x-hidden select-none">
      {/* Scrollable Background Layer (absolute inset-0 so it scrolls naturally when window is narrow/short) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#0c0d12]">
        {resolvedDesktopMode === 'color_glare' ? (
          <div className="absolute inset-0 bg-[#0c0d12] overflow-hidden">
            <div
              className="absolute -top-36 left-1/2 -translate-x-1/2 w-[720px] h-[640px] rounded-full blur-[150px] opacity-28"
              style={{
                background: `radial-gradient(circle, ${desktopAccent} 0%, #b45309 50%, transparent 80%)`
              }}
            />
          </div>
        ) : resolvedDesktopMode === 'video' && effectiveDesktopVideoUrl ? (
          <LoginVideoWithImageFade
            videoUrl={effectiveDesktopVideoUrl}
            fallbackImageUrl={effectiveDesktopImageUrl}
            playMode={desktopVideoPlayMode}
            renderFallbackCollage={renderDesktopCollage}
          />
        ) : resolvedDesktopMode === 'image' && effectiveDesktopImageUrl ? (
          <img
            src={effectiveDesktopImageUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        ) : (
          renderDesktopCollage()
        )}

        {/* Slightly reduced center glarence so background media breathes, with slightly increased top & bottom edge glarence */}
        {resolvedDesktopMode !== 'color_glare' && (
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 85% 75% at 50% 48%, rgba(10,11,15,0.26) 0%, rgba(10,11,15,0.48) 62%, rgba(10,11,15,0.72) 100%)'
              }}
            />
            {/* Increased Top Glarence */}
            <div
              className="absolute inset-x-0 top-0 h-44"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(8,9,13,0.84) 0%, rgba(8,9,13,0.48) 42%, rgba(8,9,13,0.16) 76%, rgba(8,9,13,0) 100%)'
              }}
            />
            {/* Increased Bottom Glarence */}
            <div
              className="absolute inset-x-0 bottom-0 h-56"
              style={{
                background:
                  'linear-gradient(to top, rgba(10,11,15,0.96) 0%, rgba(10,11,15,0.72) 38%, rgba(10,11,15,0.32) 72%, rgba(10,11,15,0) 100%)'
              }}
            />
          </>
        )}
      </div>

      {/* Desktop Top Navbar: Transparent, NON-sticky (moves naturally with page scroll) */}
      <header className="relative z-20 w-full bg-transparent select-none">
        <div className="relative w-full h-[68px] px-6 md:px-10 xl:px-12 flex items-center justify-between">
          {/* Left: Back Button */}
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center gap-1 p-1.5 -ml-1.5 rounded-full text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer z-10"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.4] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]" />
          </button>

          {/* Center: Clickable Platform Logo leading directly to Homepage */}
          <button
            ref={desktopLogoRef}
            type="button"
            onClick={onGoHome}
            aria-label="Go to homepage"
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            {useCustomLogo && customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt={platformName}
                referrerPolicy="no-referrer"
                className="h-7.5 w-auto max-w-[125px] object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
              />
            ) : (
              <DiziLogo
                variant="red"
                size="md"
                className="max-w-[125px] h-[34px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]"
              />
            )}
          </button>

          {/* Right: Crisp White Rounded-Full Pill Sign Up / Login Button */}
          <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setForgotSent(false);
              setErrorMsg(null);
              setAuthMode((prev) => (prev === 'login' ? 'create' : 'login'));
            }}
            className="z-10 px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs sm:text-[13.5px] font-bold tracking-tight shadow-md transition-all active:scale-95 cursor-pointer"
          >
            {authMode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </div>
      </header>

      {/* Main Centered Auth Card (Reduced Opacity, Reduced Corner Radius, NO Border, NO Logo, NO duplicate bottom switch) */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-[400px] rounded-xl bg-[#14161a]/52 backdrop-blur-md border-0 shadow-[0_24px_70px_rgba(0,0,0,0.58)] px-7 sm:px-9 py-8 sm:py-9">
          {/* Card Heading */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-[26px] font-extrabold text-white tracking-tight">
              {forgotMode
                ? 'Reset Password'
                : authMode === 'create'
                ? 'Sign Up'
                : 'Login Now'}
            </h1>
            {forgotMode && (
              <p className="text-xs text-zinc-300/80 mt-1.5">
                Enter your email and we&apos;ll send reset instructions.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name Input (Create Account Mode) */}
            {!forgotMode && authMode === 'create' && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  autoComplete="name"
                  className="w-full rounded-lg bg-white/[0.11] hover:bg-white/[0.15] focus:bg-white/[0.18] text-white placeholder-zinc-300/75 px-4 py-3 text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors"
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                className="w-full rounded-lg bg-white/[0.11] hover:bg-white/[0.15] focus:bg-white/[0.18] text-white placeholder-zinc-300/75 px-4 py-3 text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors"
              />
            </div>

            {/* Password Input (No Confirm Password, No Stay Signed In) */}
            {!forgotMode && (
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={authMode === 'create' ? 'new-password' : 'current-password'}
                  className="w-full rounded-lg bg-white/[0.11] hover:bg-white/[0.15] focus:bg-white/[0.18] text-white placeholder-zinc-300/75 pl-4 pr-11 py-3 text-sm font-medium border-0 outline-none focus:ring-1 focus:ring-white/25 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-300/80 hover:text-white cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* Forgot Password Link (Login mode) */}
            {!forgotMode && authMode === 'login' && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setForgotSent(false);
                    setErrorMsg(null);
                  }}
                  className="text-xs text-zinc-300/85 hover:text-white font-medium transition-colors cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Error / Success Notice */}
            {errorMsg && (
              <p className="text-xs text-rose-300 font-semibold text-center bg-rose-500/15 rounded-lg py-2 px-3">
                {errorMsg}
              </p>
            )}
            {forgotSent && forgotMode && (
              <p className="text-xs text-emerald-300 font-semibold text-center bg-emerald-500/15 rounded-lg py-2 px-3">
                Reset link sent to {email}. Check your inbox.
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-1 rounded-lg bg-[#e50914] hover:bg-[#f41924] active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm tracking-wide py-3 shadow-[0_10px_28px_rgba(229,9,20,0.4)] transition-all cursor-pointer"
            >
              {isSubmitting
                ? 'Please wait...'
                : forgotMode
                ? 'Send Reset Link'
                : authMode === 'create'
                ? 'Sign Up'
                : 'Login'}
            </button>
          </form>

          {/* Only show Back to Login when inside Forgot Password mode (top navbar already has Create Account / Login toggle) */}
          {forgotMode && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setForgotMode(false);
                  setForgotSent(false);
                  setErrorMsg(null);
                }}
                className="text-xs text-zinc-300 hover:text-white font-semibold transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Desktop Footer — compact spacing so 1920x1080 full screen has zero vertical scrollbar */}
      <div className="relative z-10 w-full [&>footer]:mt-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer shows={shows} platformName={platformName} />
      </div>
    </div>
  );
};
