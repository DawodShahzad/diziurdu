import React from 'react';
import { Search } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'home' | 'search' | 'profile';
  onSelectTab: (tab: 'home' | 'search' | 'profile') => void;
  userAvatar?: string;
  platformName?: string;
  navbarStyle?: 'floating' | 'bottom_fixed';
  showLabels?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  userAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=120&q=80',
  navbarStyle = 'floating',
  showLabels = true
}) => {
  const isBottomFixed = navbarStyle === 'bottom_fixed';

  // Dynamic icon sizing: when labels are hidden beneath icons, increase icon sizes for balanced presence
  const iconSizeClass = showLabels ? 'w-5 h-5' : 'w-6.5 h-6.5';
  const iconWrapperClass = showLabels ? 'w-5.5 h-5.5' : 'w-7 h-7';

  if (isBottomFixed) {
    return (
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-[120] pointer-events-auto w-full bg-[#14151b]/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-2px_12px_rgba(0,0,0,0.35)] ${
        showLabels ? 'pb-[max(env(safe-area-inset-bottom),8px)] pt-1' : 'pb-[max(env(safe-area-inset-bottom),4px)] pt-0.5'
      }`}>
        <nav
          aria-label="Mobile Navigation"
          className={`flex items-center justify-around w-full max-w-md mx-auto ${
            showLabels ? 'h-[50px]' : 'h-[42px]'
          } px-4 select-none`}
        >
          {/* 1. Home Tab */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full ${
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
            onClick={() => onSelectTab('search')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full ${
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

          {/* 3. Profile / My Dizi Tab - NO border unless user is on that profile page */}
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex flex-col items-center justify-center cursor-pointer flex-1 h-full ${
              activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Profile and My List"
          >
            <div className={`${iconWrapperClass} flex items-center justify-center`}>
              <img
                src={userAvatar}
                alt="Profile"
                className={`${iconSizeClass} rounded-full object-cover transition-all ${
                  activeTab === 'profile' ? 'ring-2 ring-white shadow-sm' : 'ring-0'
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

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-[120] pointer-events-auto">
      {/* Apple Glass UI Floating Nav Pill */}
      <nav
        aria-label="Mobile Navigation"
        className={`flex items-center justify-between w-[220px] ${
          showLabels ? 'h-[52px]' : 'h-[48px]'
        } px-3.5 py-1.5 rounded-full bg-[#16171d]/90 backdrop-blur-2xl border border-white/15 shadow-[0_12px_36px_rgba(0,0,0,0.85)] ring-1 ring-black/40 select-none`}
      >
        {/* 1. Home Tab */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center cursor-pointer w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } shrink-0 ${
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
          onClick={() => onSelectTab('search')}
          className={`flex flex-col items-center justify-center cursor-pointer w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } shrink-0 ${
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

        {/* 3. Profile / My Dizi Tab - NO border unless user is on that profile page */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center cursor-pointer w-14 ${
            showLabels ? 'h-10' : 'h-9'
          } shrink-0 ${
            activeTab === 'profile' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Profile and My List"
        >
          <div className={`${iconWrapperClass} flex items-center justify-center`}>
            <img
              src={userAvatar}
              alt="Profile"
              className={`${iconSizeClass} rounded-full object-cover transition-all ${
                activeTab === 'profile' ? 'ring-2 ring-white shadow-sm' : 'ring-0'
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
};
