import React, { useRef } from 'react';
import { Search, Bell } from 'lucide-react';
import { useDeviceLayout } from '../utils/deviceLayout';
import { DiziLogo } from './DiziLogo';
import { triggerHaptic } from '../utils/haptics';

export interface MobileBottomNavProps {
  activeTab: 'home' | 'trends' | 'search' | 'profile';
  onSelectTab: (tab: 'home' | 'trends' | 'search' | 'profile') => void;
  onTripleTapHome?: () => void;
  onOpenNotifications?: () => void;
  showNotifications?: boolean;
  hasUnreadNotifications?: boolean;
  userAvatar?: string;
  platformName?: string;
  platformIconUrl?: string;
  customLogoUrl?: string;
  useCustomLogo?: boolean;
  navbarStyle?: 'floating' | 'bottom_fixed';
  navbarTheme?: 'solid' | 'glass';
  transparentBlurNavbar?: boolean;
  showLabels?: boolean;
  isHiddenBehindLock?: boolean;
  hideProfileAvatar?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onTripleTapHome,
  onOpenNotifications,
  showNotifications = true,
  hasUnreadNotifications = false,
  userAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=120&q=80',
  platformName = 'Dizi',
  platformIconUrl,
  customLogoUrl,
  useCustomLogo = false,
  navbarStyle = 'floating',
  navbarTheme = 'solid',
  transparentBlurNavbar = false,
  showLabels = true,
  isHiddenBehindLock = false,
  hideProfileAvatar = false
}) => {
  const { isMobile, isLandscape } = useDeviceLayout();
  if (!isMobile) return null;

  const isBottomFixed = navbarStyle === 'bottom_fixed';
  const isTransparentBlur = Boolean(transparentBlurNavbar || navbarTheme === 'glass');

  // Triple-tap tracker on Home button: only triple-tap reloads/rotates feed; single tap navigates to home or scrolls to top
  const homeTapTimesRef = useRef<number[]>([]);
  const handleHomeClick = () => {
    triggerHaptic(10);
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

  const handleTabSelect = (tab: 'home' | 'trends' | 'search' | 'profile') => {
    triggerHaptic(10);
    onSelectTab(tab);
  };

  // =========================================================================
  // MOBILE LANDSCAPE ORIENTATION:
  // Vertical left-side navigation sidebar visible across ALL pages, with
  // platform header icon on top and crisp vertical icon stack:
  // Home -> Search -> Notification (if enabled) -> Profile
  // =========================================================================
  if (isLandscape) {
    const headerIconSrc = platformIconUrl?.trim() || (useCustomLogo && customLogoUrl ? customLogoUrl.trim() : '');
    return (
      <aside
        data-mobile-bottom-navbar={isHiddenBehindLock ? undefined : 'true'}
        data-mobile-landscape-sidebar="true"
        aria-label="Mobile Navigation"
        style={
          isTransparentBlur
            ? {
                backgroundColor: 'rgba(14, 15, 19, 0.72)',
                backdropFilter: 'blur(22px) saturate(155%)',
                WebkitBackdropFilter: 'blur(22px) saturate(155%)',
                border: 'none'
              }
            : { border: 'none' }
        }
        className={`fixed top-0 bottom-0 left-0 z-[160] w-14 flex flex-col items-center py-3 select-none transition-opacity duration-300 border-0 ${
          isHiddenBehindLock ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        } ${isTransparentBlur ? '' : 'bg-black'}`}
      >
        {/* Top: Platform Header Icon */}
        <button
          type="button"
          onClick={handleHomeClick}
          className="w-10 h-10 mb-2 flex items-center justify-center shrink-0 cursor-pointer active:scale-90 transition-transform"
          aria-label={`${platformName} Home`}
        >
          {headerIconSrc ? (
            <img
              src={headerIconSrc}
              alt={platformName}
              referrerPolicy="no-referrer"
              className="w-7 h-7 max-w-[34px] max-h-[34px] object-contain"
            />
          ) : (
            <DiziLogo variant="red" size="sm" className="w-8 h-6 object-contain" />
          )}
        </button>

        {/* Vertical Nav Stack: Home -> Search -> Notification -> Profile */}
        <nav className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
          {/* 1. Home (exact same icon & current tab styling as bottom navbar) */}
          <button
            type="button"
            onClick={handleHomeClick}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Home"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={activeTab === 'home' ? '2.4' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5.5 h-5.5"
            >
              <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
              <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="2.5" />
            </svg>
          </button>

          {/* 2. Search */}
          <button
            type="button"
            onClick={() => handleTabSelect('search')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              activeTab === 'search' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Search"
          >
            <Search
              className={`w-5.5 h-5.5 ${activeTab === 'search' ? 'stroke-[2.5]' : 'stroke-[2]'}`}
            />
          </button>

          {/* 3. Notification (controlled by admin setting) */}
          {showNotifications && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onOpenNotifications?.();
              }}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-200 active:scale-90 transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-5.5 h-5.5 stroke-[2]" />
              {hasUnreadNotifications && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-600" />
              )}
            </button>
          )}

          {/* 4. Profile */}
          <button
            type="button"
            onClick={() => handleTabSelect('profile')}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Profile and My List"
          >
            <img
              data-mobile-nav-avatar="true"
              src={userAvatar}
              alt="Profile"
              className={`w-6 h-6 rounded-full object-cover ${
                hideProfileAvatar ? 'opacity-0' : 'opacity-100'
              } ${activeTab === 'profile' ? 'ring-2 ring-white shadow-sm' : 'ring-0'}`}
            />
          </button>
        </nav>
      </aside>
    );
  }

  // Dynamic icon sizing: when labels are hidden beneath icons, increase icon sizes for balanced presence
  const iconSizeClass = showLabels ? 'w-5 h-5' : 'w-6.5 h-6.5';
  const iconWrapperClass = showLabels ? 'w-5.5 h-5.5' : 'w-7 h-7';

  // Sleek dark translucent blur style (no container border when transparent mode is enabled)
  const frostedBottomBarStyle: React.CSSProperties = {
    backgroundColor: 'rgba(14, 15, 18, 0.72)',
    backdropFilter: 'blur(22px) saturate(155%)',
    WebkitBackdropFilter: 'blur(22px) saturate(155%)',
    border: 'none',
    boxShadow: '0 -8px 28px rgba(0, 0, 0, 0.48)'
  };

  const frostedFloatingPillStyle: React.CSSProperties = {
    borderRadius: '9999px',
    backgroundColor: 'rgba(15, 16, 19, 0.72)',
    backdropFilter: 'blur(22px) saturate(155%)',
    WebkitBackdropFilter: 'blur(22px) saturate(155%)',
    border: 'none',
    boxShadow: '0 12px 34px rgba(0, 0, 0, 0.62)'
  };

  if (isBottomFixed) {
    return (
      <div
        style={isTransparentBlur ? frostedBottomBarStyle : { border: 'none' }}
        className={`fixed bottom-0 left-0 right-0 z-[120] w-full transition-opacity duration-500 border-0 ${
          isHiddenBehindLock ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        } ${
          isTransparentBlur
            ? ''
            : 'bg-[#0a0a0a] shadow-[0_-2px_12px_rgba(0,0,0,0.85)]'
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
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-colors ${
              activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Home"
          >
            <div className={`${iconWrapperClass} flex items-center justify-center`}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={activeTab === 'home' ? '2.4' : '2'}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={iconSizeClass}
              >
                <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
                <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="2.5" />
              </svg>
            </div>
            {showLabels && (
              <span className="text-[10px] font-medium tracking-tight mt-0.5">Home</span>
            )}
          </button>

          {/* 2. Search Tab */}
          <button
            onClick={() => handleTabSelect('search')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-colors ${
              activeTab === 'search' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
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

          {/* 3. Profile / My Dizi Tab */}
          <button
            onClick={() => handleTabSelect('profile')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full rounded-full transition-colors ${
              activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
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
                } ${activeTab === 'profile' ? 'ring-2 ring-white shadow-sm' : 'ring-0'}`}
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

  return (
    <div
      className={`fixed bottom-[max(env(safe-area-inset-bottom),16px)] left-1/2 -translate-x-1/2 z-[120] transition-opacity duration-500 ${
        isHiddenBehindLock ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
    >
      {/* Floating Nav Pill: Solid Dark or Translucent Dark Frosted Blur */}
      <nav
        data-mobile-bottom-navbar={isHiddenBehindLock ? undefined : 'true'}
        aria-label="Mobile Navigation"
        style={
          isTransparentBlur
            ? frostedFloatingPillStyle
            : {
                border: 'none',
                borderRadius: '9999px'
              }
        }
        className={`relative overflow-hidden flex items-center justify-between w-[228px] px-3.5 py-1.5 border-0 ${
          isTransparentBlur ? '' : 'bg-[#0a0a0a] shadow-[0_12px_36px_rgba(0,0,0,0.95)]'
        } ${showLabels ? 'h-[54px]' : 'h-[48px]'} select-none transition-all`}
      >
        {/* 1. Home Tab */}
        <button
          onClick={handleHomeClick}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 rounded-full w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } ${activeTab === 'home' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          aria-label="Home"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center`}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={activeTab === 'home' ? '2.4' : '2'}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={iconSizeClass}
            >
              <path d="M3 9.5L12 3l9 6.5V20a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 20V9.5z" />
              <line x1="9.5" y1="15" x2="14.5" y2="15" strokeWidth="2.5" />
            </svg>
          </div>
          {showLabels && (
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">Home</span>
          )}
        </button>

        {/* 2. Search Tab */}
        <button
          onClick={() => handleTabSelect('search')}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 rounded-full w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } ${activeTab === 'search' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
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

        {/* 3. Profile / My Dizi Tab */}
        <button
          onClick={() => handleTabSelect('profile')}
          className={`relative z-10 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0 rounded-full w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } ${activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          aria-label="Profile and My List"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center relative`}>
            <img
              data-mobile-nav-avatar="true"
              src={userAvatar}
              alt="Profile"
              className={`${iconSizeClass} rounded-full object-cover ${
                hideProfileAvatar ? 'opacity-0' : 'opacity-100'
              } ${activeTab === 'profile' ? 'ring-2 ring-white shadow-sm' : 'ring-0'}`}
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
