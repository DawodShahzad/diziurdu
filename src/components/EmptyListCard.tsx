import React from 'react';

interface EmptyListCardProps {
  variant: 'continue_watching' | 'my_list' | 'liked';
  compact?: boolean;
}

export const EmptyListCard: React.FC<EmptyListCardProps> = ({ variant, compact = false }) => {
  const message =
    variant === 'continue_watching'
      ? "Jump back into what you've started."
      : variant === 'my_list'
      ? "Keep track of the series and films you've saved."
      : 'The titles you give a thumbs up to will appear here.';

  return (
    <div
      className={`w-full rounded-xl bg-[#18181b] md:bg-[#232325] ${
        compact ? 'py-7 px-4' : 'py-9 sm:py-12 px-6'
      } flex flex-col items-center justify-center text-center select-none`}
    >
      <div className={compact ? 'w-11 h-11 mb-3' : 'w-14 h-14 mb-4'}>
        {variant === 'continue_watching' ? (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_6px_14px_rgba(229,9,20,0.28)]" aria-hidden="true">
            <defs>
              <linearGradient id="cw-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff4155" />
                <stop offset="55%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#7b1fa2" />
              </linearGradient>
              <linearGradient id="cw-face" x1="0.15" y1="0" x2="0.85" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="45%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#9c1458" />
              </linearGradient>
            </defs>
            <ellipse cx="30" cy="33" rx="22" ry="23" fill="url(#cw-rim)" />
            <circle cx="33" cy="32" r="21" fill="url(#cw-face)" />
            <path d="M18 19 C25 13, 39 13, 46 21 C38 17, 25 18, 18 25 Z" fill="rgba(255,255,255,0.22)" />
            <circle cx="33" cy="32" r="3" fill="#ffffff" />
            <path d="M33 21 L33 32 L45 34" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M33 32 L25 36" fill="none" stroke="rgba(90,8,25,0.8)" strokeWidth="2.8" strokeLinecap="round" />
          </svg>
        ) : variant === 'my_list' ? (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_6px_14px_rgba(229,9,20,0.28)]" aria-hidden="true">
            <defs>
              <linearGradient id="ml-lid" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff6b6b" />
                <stop offset="100%" stopColor="#e50914" />
              </linearGradient>
              <linearGradient id="ml-box" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#880e4f" />
              </linearGradient>
            </defs>
            {/* Open top lid */}
            <path d="M12 22 L19 13 L45 13 L52 22 Z" fill="url(#ml-lid)" />
            {/* Inner glow */}
            <path d="M14 22 L50 22 L46 31 L18 31 Z" fill="#ff9e80" opacity="0.45" />
            {/* Front chest */}
            <rect x="13" y="25" width="38" height="26" rx="4" fill="url(#ml-box)" />
            <rect x="13" y="25" width="38" height="6" rx="2" fill="rgba(255,255,255,0.16)" />
            {/* Keyhole / clasp */}
            <rect x="29" y="29" width="6" height="9" rx="2" fill="#4a0624" />
            {/* Sparkles */}
            <path d="M32 14 L33.6 19 L38.5 20.5 L33.6 22 L32 27 L30.4 22 L25.5 20.5 L30.4 19 Z" fill="#ffffff" />
            <circle cx="24" cy="17" r="1.4" fill="#ffffff" opacity="0.85" />
            <circle cx="41" cy="18" r="1.2" fill="#ffffff" opacity="0.85" />
          </svg>
        ) : (
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_6px_14px_rgba(229,9,20,0.28)]" aria-hidden="true">
            <defs>
              <linearGradient id="lk-hand" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0%" stopColor="#ff5f40" />
                <stop offset="55%" stopColor="#e50914" />
                <stop offset="100%" stopColor="#7b1fa2" />
              </linearGradient>
            </defs>
            <path
              d="M20 29 C20 29 26 22 27 16 C28 11 31 9 33.5 11 C36 13 35.5 20 34 25 L46 25 C49.5 25 51.5 27.8 50.5 31 C52 32.5 52 35.5 50 37.5 C51.2 39.5 50.2 42.5 48 44 C48.8 46.5 47 49.5 43.5 50 L24 50 C19.5 50 17 47 17 43 L17 34 C17 31 18 29.8 20 29 Z"
              fill="url(#lk-hand)"
            />
            <path
              d="M12 31 C12 29 13.5 27.5 15.5 27.5 L19 27.5 C20.5 27.5 21.5 28.8 21.5 30.5 L21.5 48 C21.5 49.5 20.5 50.5 19 50.5 L15.5 50.5 C13.5 50.5 12 49 12 47 Z"
              fill="#9b1c6d"
            />
          </svg>
        )}
      </div>

      <p className={`${compact ? 'text-xs' : 'text-sm sm:text-[15px]'} text-zinc-200 font-medium`}>
        {message}
      </p>
    </div>
  );
};
