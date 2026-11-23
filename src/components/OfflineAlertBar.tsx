import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useDeviceLayout } from '../utils/deviceLayout';

export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined') {
      return !navigator.onLine;
    }
    return false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
}

interface OfflineAlertBarProps {
  isOffline?: boolean;
}

export const OfflineAlertBar: React.FC<OfflineAlertBarProps> = ({ isOffline: propIsOffline }) => {
  const detectedOffline = useOfflineStatus();
  const isOffline = propIsOffline !== undefined ? propIsOffline : detectedOffline;
  const { isMobile, isLandscape } = useDeviceLayout();

  if (!isOffline) return null;

  return (
    <>
      {/* DESKTOP LAYOUT: Sleek dark-themed cinema banner at top of viewport */}
      <div
        role="alert"
        aria-live="assertive"
        className="hidden md:flex fixed top-0 left-0 right-0 z-[180] h-[52px] bg-[#14151a]/95 backdrop-blur-md border-b border-white/10 text-white px-8 items-center justify-between shadow-lg select-none transition-all animate-in fade-in slide-in-from-top-1 duration-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[#e50914]/15 border border-[#e50914]/35 flex items-center justify-center shrink-0">
            <WifiOff className="w-4 h-4 text-[#e50914]" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm leading-tight text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse" />
              <span>You are offline</span>
            </div>
            <div className="text-xs text-zinc-400 truncate mt-0.5">
              Browsing cached catalog. Reconnect to stream episodes and trailers.
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE LAYOUT: Sleek dark glass alert pill above bottom nav (or inset from left sidebar in landscape) */}
      <div
        role="alert"
        aria-live="assertive"
        className={`md:hidden fixed z-[150] bg-[#14151a]/95 backdrop-blur-xl text-white px-3.5 py-2.5 rounded-2xl shadow-[0_14px_36px_rgba(0,0,0,0.8)] flex items-center gap-3 border border-white/12 select-none animate-in slide-in-from-bottom-3 duration-250 ${
          isMobile && isLandscape
            ? 'bottom-[max(env(safe-area-inset-bottom),12px)] left-[68px] right-4 max-w-sm'
            : 'bottom-[calc(max(env(safe-area-inset-bottom),8px)+66px)] left-3 right-3'
        }`}
      >
        <div className="w-8 h-8 rounded-xl bg-[#e50914]/15 border border-[#e50914]/35 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-[#e50914]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs leading-tight text-white flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e50914] animate-pulse shrink-0" />
            <span>You are offline</span>
          </div>
          <div className="text-[11px] text-zinc-400 truncate mt-0.5">
            Cached browsing active. Reconnect to stream.
          </div>
        </div>
      </div>
    </>
  );
};
