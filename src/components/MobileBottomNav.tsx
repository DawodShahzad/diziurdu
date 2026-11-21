import React, { useRef } from 'react';
import { Search } from 'lucide-react';
import { useDeviceLayout } from '../utils/deviceLayout';

export interface MobileBottomNavProps {
  activeTab: 'home' | 'trends' | 'search' | 'profile';
  onSelectTab: (tab: 'home' | 'trends' | 'search' | 'profile') => void;
  onTripleTapHome?: () => void;
  userAvatar?: string;
  platformName?: string;
  navbarStyle?: 'floating' | 'bottom_fixed';
  navbarTheme?: 'solid' | 'glass';
  showLabels?: boolean;
  isHiddenBehindLock?: boolean;
  hideProfileAvatar?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onTripleTapHome,
  userAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=120&q=80',
  navbarStyle = 'floating',
  navbarTheme = 'solid',
  showLabels = true,
  isHiddenBehindLock = false,
  hideProfileAvatar = false
}) => {
  const { isMobile } = useDeviceLayout();
  if (!isMobile) return null;

  const isBottomFixed = navbarStyle === 'bottom_fixed';
  const isGlass = navbarTheme === 'glass';

  // Triple-tap tracker on Home button: only triple-tap reloads/rotates feed; single or double tap navigates to home
  const homeTapTimesRef = useRef<number[]>([]);
  const handleHomeClick = () => {
    const now = Date.now();
    homeTapTimesRef.current = homeTapTimesRef.current.filter((t) => now - t < 1200);
    homeTapTimesRef.current.push(now);

    if (homeTapTimesRef.current.length >= 3) {
      homeTapTimesRef.current = [];
      if (onTripleTapHome) {
        onTripleTapHome();
        return;
      }
    }
    onSelectTab('home');
  };

  // Dynamic icon sizing: when labels are hidden beneath icons, increase icon sizes for balanced presence
  const iconSizeClass = showLabels ? 'w-5 h-5' : 'w-6.5 h-6.5';
  const iconWrapperClass = showLabels ? 'w-5.5 h-5.5' : 'w-7 h-7';

  if (isBottomFixed) {
    return (
      <div
        style={
          isGlass
            ? {
                backgroundColor: 'rgba(14, 16, 22, 0.16)',
                backdropFilter: 'blur(8px) saturate(165%) brightness(1.06)',
                WebkitBackdropFilter: 'blur(8px) saturate(165%) brightness(1.06)',
                borderTop: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow:
                  '0 -8px 28px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.35)'
              }
            : undefined
        }
        className={`fixed bottom-0 left-0 right-0 z-[120] w-full transition-opacity duration-500 ${
          isHiddenBehindLock ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        } ${
          isGlass
            ? ''
            : 'bg-[#0a0a0a] border-t border-white/10 shadow-[0_-2px_12px_rgba(0,0,0,0.85)]'
        } ${
          showLabels
            ? 'pb-[max(env(safe-area-inset-bottom),8px)] pt-1'
            : 'pb-[max(env(safe-area-inset-bottom),4px)] pt-0.5'
        }`}
      >
        <nav
          data-mobile-bottom-navbar={isHiddenBehindLock ? undefined : 'true'}
          aria-label="Mobile Navigation"
          className={`flex items-center justify-around w-full max-w-md mx-auto ${
            showLabels ? 'h-[50px]' : 'h-[42px]'
          } px-4 select-none`}
        >
          {/* 1. Home Tab */}
          <button
            onClick={handleHomeClick}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-all ${
              activeTab === 'home'
                ? isGlass
                  ? 'text-[#1ab2ff]'
                  : 'text-white'
                : isGlass
                ? 'text-white/90 hover:text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Home"
          >
            <div className={`${iconWrapperClass} flex items-center justify-center`}>
              <svg
                viewBox="0 0 24 24"
                fill={isGlass && activeTab === 'home' ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={activeTab === 'home' ? '2.4' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={iconSizeClass}
              >
                <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
                {!(isGlass && activeTab === 'home') && (
                  <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="2.5" />
                )}
              </svg>
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Home</span>
            )}
          </button>

          {/* 2. Search Tab */}
          <button
            onClick={() => onSelectTab('search')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-all ${
              activeTab === 'search'
                ? isGlass
                  ? 'text-[#1ab2ff]'
                  : 'text-white'
                : isGlass
                ? 'text-white/90 hover:text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Search"
          >
            <div className={`${iconWrapperClass} flex items-center justify-center`}>
              <Search
                className={`${iconSizeClass} ${
                  activeTab === 'search' ? 'stroke-[2.5]' : 'stroke-[2]'
                }`}
              />
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Search</span>
            )}
          </button>

          {/* 4. Profile / My Dizi Tab */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-all ${
              activeTab === 'profile'
                ? isGlass
                  ? 'text-[#1ab2ff]'
                  : 'text-white'
                : isGlass
                ? 'text-white/90 hover:text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Profile and My List"
          >
            <div className={`${iconWrapperClass} flex items-center justify-center relative`}>
              <img
                data-mobile-nav-avatar="true"
                src={userAvatar}
                alt="Profile"
                className={`${iconSizeClass} rounded-full object-cover ${
                  hideProfileAvatar ? 'opacity-0' : 'opacity-100'
                } ${
                  activeTab === 'profile'
                    ? isGlass
                      ? 'ring-2 ring-[#1ab2ff] shadow-sm'
                      : 'ring-2 ring-white shadow-sm'
                    : 'ring-0'
                }`}
              />
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Profile</span>
            )}
          </button>
        </nav>
      </div>
    );
  }

  const glassActivePillStyle: React.CSSProperties = {
    background:
      'linear-gradient(180deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.05) 100%)',
    boxShadow:
      'inset 0 0.5px 0 rgba(255, 255, 255, 0.36), 0 2px 8px rgba(0, 0, 0, 0.14)'
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] transition-opacity duration-500 ${
        isHiddenBehindLock ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Floating Nav Pill: Solid Dark or High-Transparency Crystal Glass UI */}
      <nav
        data-mobile-bottom-navbar={isHiddenBehindLock ? undefined : 'true'}
        aria-label="Mobile Navigation"
        style={
          isGlass
            ? {
                borderRadius: '9999px',
                border: '1px solid rgba(255, 255, 255, 0.24)',
                background: 'rgba(14, 16, 22, 0.14)',
                backdropFilter: 'blur(8px) saturate(165%) brightness(1.08)',
                WebkitBackdropFilter: 'blur(8px) saturate(165%) brightness(1.08)',
                boxShadow:
                  '0 12px 34px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.44), inset 0 -0.5px 0 rgba(255, 255, 255, 0.16)'
              }
            : {
                border: '1px solid #2a2a2e',
                borderRadius: '9999px'
              }
        }
        className={`relative overflow-hidden flex items-center justify-between ${
          isGlass ? 'w-[248px] p-1' : 'w-[220px] px-3.5 py-1.5 bg-[#0a0a0a] shadow-[0_12px_36px_rgba(0,0,0,0.95)]'
        } ${showLabels ? (isGlass ? 'h-[60px]' : 'h-[52px]') : isGlass ? 'h-[52px]' : 'h-[48px]'} select-none transition-all`}
      >
        {/* Subtle top optical glass sheen */}
        {isGlass && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-0 h-1/2 rounded-full"
            style={{
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, transparent 100%)'
            }}
          />
        )}

        {/* 1. Home Tab */}
        <button
          onClick={handleHomeClick}
          style={isGlass && activeTab === 'home' ? glassActivePillStyle : undefined}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 rounded-full ${
            isGlass
              ? `w-[82px] h-full ${
                  activeTab === 'home'
                    ? 'text-[#1ab2ff]'
                    : 'text-white/95 hover:text-white'
                }`
              : `w-14 ${showLabels ? 'h-10' : 'h-9'} ${
                  activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`
          }`}
          aria-label="Home"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center`}>
            <svg
              viewBox="0 0 24 24"
              fill={isGlass && activeTab === 'home' ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={activeTab === 'home' ? '2.4' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={iconSizeClass}
            >
              <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
              {!(isGlass && activeTab === 'home') && (
                <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="2.5" />
              )}
            </svg>
          </div>
          {showLabels && (
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Home</span>
          )}
        </button>

        {/* 2. Search Tab */}
        <button
          onClick={() => onSelectTab('search')}
          style={isGlass && activeTab === 'search' ? glassActivePillStyle : undefined}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 rounded-full ${
            isGlass
              ? `w-[78px] h-full ${
                  activeTab === 'search'
                    ? 'text-[#1ab2ff]'
                    : 'text-white/95 hover:text-white'
                }`
              : `w-14 ${showLabels ? 'h-10' : 'h-9'} ${
                  activeTab === 'search' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`
          }`}
          aria-label="Search"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center`}>
            <Search
              className={`${iconSizeClass} ${
                activeTab === 'search' ? 'stroke-[2.5]' : 'stroke-[2]'
              }`}
            />
          </div>
          {showLabels && (
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Search</span>
          )}
        </button>

        {/* 4. Profile / My Dizi Tab */}
        <button
          onClick={() => onSelectTab('profile')}
          style={isGlass && activeTab === 'profile' ? glassActivePillStyle : undefined}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 rounded-full ${
            isGlass
              ? `w-[78px] h-full ${
                  activeTab === 'profile'
                    ? 'text-[#1ab2ff]'
                    : 'text-white/95 hover:text-white'
                }`
              : `w-14 ${showLabels ? 'h-10' : 'h-9'} ${
                  activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`
          }`}
          aria-label="Profile and My List"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center relative`}>
            <img
              data-mobile-nav-avatar="true"
              src={userAvatar}
              alt="Profile"
              className={`${iconSizeClass} rounded-full object-cover ${
                hideProfileAvatar ? 'opacity-0' : 'opacity-100'
              } ${
                activeTab === 'profile'
                  ? isGlass
                    ? 'ring-2 ring-[#1ab2ff] shadow-sm'
                    : 'ring-2 ring-white shadow-sm'
                  : 'ring-0'
              }`}
            />
          </div>
          {showLabels && (
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Profile</span>
          )}
        </button>
      </nav>
    </div>
  );
};
