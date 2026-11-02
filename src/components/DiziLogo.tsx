import React, { useEffect, useState } from 'react';

interface DiziLogoProps {
  variant?: 'red' | 'white' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  customLogoUrl?: string;
}

export const DiziLogo: React.FC<DiziLogoProps> = ({
  variant = 'red',
  size = 'md',
  className = '',
  showSubtitle = false,
  customLogoUrl
}) => {
  const [activeCustomLogo, setActiveCustomLogo] = useState<string | null>(() => {
    if (customLogoUrl) return customLogoUrl;
    if (typeof window !== 'undefined') {
      try {
        const explicit = localStorage.getItem('cineflix_custom_logo');
        if (explicit) return explicit;
        const savedSettings = localStorage.getItem('cineflix_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.useCustomLogo && parsed.customLogoUrl) {
            return parsed.customLogoUrl;
          }
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  useEffect(() => {
    if (customLogoUrl) {
      setActiveCustomLogo(customLogoUrl);
      return;
    }
    const checkLogo = () => {
      try {
        const explicit = localStorage.getItem('cineflix_custom_logo');
        if (explicit) {
          setActiveCustomLogo(explicit);
          return;
        }
        const savedSettings = localStorage.getItem('cineflix_settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          if (parsed.useCustomLogo && parsed.customLogoUrl) {
            setActiveCustomLogo(parsed.customLogoUrl);
            return;
          }
        }
        setActiveCustomLogo(null);
      } catch {
        setActiveCustomLogo(null);
      }
    };

    checkLogo();
    window.addEventListener('storage', checkLogo);
    window.addEventListener('cineflix_branding_change', checkLogo);
    return () => {
      window.removeEventListener('storage', checkLogo);
      window.removeEventListener('cineflix_branding_change', checkLogo);
    };
  }, [customLogoUrl]);

  // Brand color: deep, rich, refined crimson red from brand logo (not bright electric neon)
  const brandRed = '#b81d24';
  const fillColor = variant === 'white' ? '#ffffff' : brandRed;

  const sizeClasses = {
    sm: 'h-5',
    md: 'h-7 sm:h-[30px]',
    lg: 'h-9 sm:h-11',
    xl: 'h-13 sm:h-15'
  };

  if (activeCustomLogo) {
    return (
      <div className={`inline-flex items-center max-w-[150px] ${className}`}>
        <img
          src={activeCustomLogo}
          alt="Brand Logo"
          referrerPolicy="no-referrer"
          className={`${sizeClasses[size]} w-auto max-w-[150px] object-contain select-none transition-transform hover:scale-102`}
        />
      </div>
    );
  }

  const logoSvg = (
    <svg
      viewBox="0 0 220 95"
      fill={fillColor}
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClasses[size]} w-auto max-w-[150px] object-contain select-none transition-transform hover:scale-102 ${className}`}
      aria-label="Dizi"
      role="img"
    >
      {/* 
        Exact authentic "Dizi" Brand Wordmark:
        - Bold, geometric capital "D"
        - Lowercase "i" with circular dot
        - Lowercase "z"
        - Lowercase "i" with PLAY TRIANGLE "►" dot
      */}
      {/* Letter 'D' */}
      <path
        d="M 12 18 
           L 44 18 
           C 66 18, 78 28, 78 47.5 
           C 78 67, 66 77, 44 77 
           L 12 77 
           Z 
           M 27.5 31 
           L 27.5 64 
           L 42 64 
           C 53 64, 61.5 58, 61.5 47.5 
           C 61.5 37, 53 31, 42 31 
           Z"
      />

      {/* Letter 'i' (first) - stem */}
      <rect x="87" y="34" width="15" height="43" rx="1.5" />
      {/* Letter 'i' (first) - circular dot */}
      <circle cx="94.5" cy="22" r="7.8" />

      {/* Letter 'z' */}
      <path
        d="M 116 34 
           L 155 34 
           L 155 44 
           L 132.5 66 
           L 155.5 66 
           L 155.5 77 
           L 115 77 
           L 115 67 
           L 138 45 
           L 116 45 
           Z"
      />

      {/* Letter 'i' (second) - stem */}
      <rect x="169" y="34" width="15" height="43" rx="1.5" />
      {/* Letter 'i' (second) - PLAY TRIANGLE dot pointing right */}
      <path
        d="M 168.5 13.5 
           C 168.5 11.5, 170.8 10.3, 172.5 11.3 
           L 186.5 19.5 
           C 188.2 20.5, 188.2 23, 186.5 24 
           L 172.5 32.2 
           C 170.8 33.2, 168.5 32, 168.5 30 
           Z"
      />
    </svg>
  );

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center justify-center p-2.5 sm:p-3 rounded-2xl shadow-xl ${className}`}
        style={{
          backgroundColor: brandRed,
          boxShadow: '0 10px 25px -5px rgba(184, 29, 36, 0.45)'
        }}
      >
        <svg
          viewBox="0 0 220 95"
          fill="#ffffff"
          xmlns="http://www.w3.org/2000/svg"
          className={`${sizeClasses[size]} w-auto object-contain select-none`}
          aria-label="Dizi"
          role="img"
        >
          {/* Letter 'D' */}
          <path
            d="M 12 18 
               L 44 18 
               C 66 18, 78 28, 78 47.5 
               C 78 67, 66 77, 44 77 
               L 12 77 
               Z 
               M 27.5 31 
               L 27.5 64 
               L 42 64 
               C 53 64, 61.5 58, 61.5 47.5 
               C 61.5 37, 53 31, 42 31 
               Z"
          />
          {/* Letter 'i' (first) - stem */}
          <rect x="87" y="34" width="15" height="43" rx="1.5" />
          {/* Letter 'i' (first) - circular dot */}
          <circle cx="94.5" cy="22" r="7.8" />
          {/* Letter 'z' */}
          <path
            d="M 116 34 
               L 155 34 
               L 155 44 
               L 132.5 66 
               L 155.5 66 
               L 155.5 77 
               L 115 77 
               L 115 67 
               L 138 45 
               L 116 45 
               Z"
          />
          {/* Letter 'i' (second) - stem */}
          <rect x="169" y="34" width="15" height="43" rx="1.5" />
          {/* Letter 'i' (second) - PLAY TRIANGLE dot pointing right */}
          <path
            d="M 168.5 13.5 
               C 168.5 11.5, 170.8 10.3, 172.5 11.3 
               L 186.5 19.5 
               C 188.2 20.5, 188.2 23, 186.5 24 
               L 172.5 32.2 
               C 170.8 33.2, 168.5 32, 168.5 30 
               Z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col items-start ${className}`}>
      {logoSvg}
      {showSubtitle && (
        <span
          className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] -mt-1 ml-1"
          style={{ color: brandRed }}
        >
          HISTORICAL DRAMAS
        </span>
      )}
    </div>
  );
};
