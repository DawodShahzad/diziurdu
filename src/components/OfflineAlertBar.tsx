import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

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

  if (!isOffline) return null;

  return (
    <>
      {/* DESKTOP LAYOUT: Addon at the very top of the page (matching Netflix style, pushing content down) */}
      <div
        role="alert"
        aria-live="assertive"
        className="hidden md:flex fixed top-0 left-0 right-0 z-[60] h-[52px] bg-[#e50914] text-white px-8 flex-col justify-center shadow-md select-none transition-all animate-in fade-in slide-in-from-top-1 duration-200"
      >
        <div className="font-bold text-[14.5px] leading-tight tracking-wide">
          Offline
        </div>
        <div className="text-xs text-white/95 mt-0.5 leading-snug">
          You are offline. Please check your internet connection and try again.
        </div>
      </div>

      {/* MOBILE LAYOUT: Appears floating directly above the bottom navigation bar */}
      <div
        role="alert"
        aria-live="assertive"
        className="md:hidden fixed bottom-[62px] left-3 right-3 z-40 bg-[#e50914] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 border border-white/20 select-none animate-in slide-in-from-bottom-3 duration-250"
      >
        <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center shrink-0">
          <WifiOff className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs leading-tight">
            Offline
          </div>
          <div className="text-[11px] text-white/95 truncate mt-0.5">
            Check your internet connection and try again.
          </div>
        </div>
      </div>
    </>
  );
};
