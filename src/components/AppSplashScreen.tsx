import React, { useEffect, useState } from 'react';
import { isRunningStandalone } from '../hooks/usePWAInstall';

interface AppSplashScreenProps {
  platformName?: string;
}

/**
 * Branded Launch Splash Screen overlay displaying /pwa-512x512.png with a smooth fade-out.
 * Renders ONLY when launched inside installed standalone PWA mode.
 */
export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ platformName = 'Dizi Urdu' }) => {
  const [shouldRender, setShouldRender] = useState<boolean>(() => isRunningStandalone());
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    if (!shouldRender) return;

    const fadeTimer = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 680);

    const removeTimer = window.setTimeout(() => {
      setShouldRender(false);
    }, 1150);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [shouldRender]);

  if (!shouldRender) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-[#09090b] flex flex-col items-center justify-center select-none pointer-events-none transition-opacity duration-450 ease-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Subtle cinema obsidian-crimson radial ambient glow */}
      <div
        className="absolute w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(229, 9, 20, 0.55) 0%, transparent 72%)'
        }}
      />

      <div
        className={`relative flex flex-col items-center gap-4 transition-transform duration-500 ease-out ${
          isFadingOut ? 'scale-105' : 'scale-100'
        }`}
      >
        <img
          src="/pwa-512x512.png"
          alt={platformName}
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-contain shadow-[0_18px_50px_rgba(0,0,0,0.85)]"
        />
        <span className="text-sm font-display font-bold tracking-[0.22em] uppercase text-white/90">
          {platformName}
        </span>
      </div>
    </div>
  );
};
