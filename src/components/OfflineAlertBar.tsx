import React, { useState, useEffect } from 'react';

export const OfflineAlertBar: React.FC = () => {
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

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="w-full bg-[#e50914] text-white px-5 sm:px-8 py-3.5 flex flex-col justify-center sticky top-0 z-[100] shadow-lg select-none transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="font-bold text-[15px] sm:text-base leading-tight tracking-wide">
        Offline
      </div>
      <div className="text-xs sm:text-sm font-normal text-white/95 mt-0.5 leading-snug">
        You are offline. Please check your internet connection and try again.
      </div>
    </div>
  );
};
