import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiziLogo } from './DiziLogo';
import { NotificationItem } from '../types';
import {
  Search,
  Bell,
  Download,
  Bookmark,
  ShieldCheck,
  LogOut,
  LogIn,
  X,
  Play,
  User,
  Settings,
  Plus,
  ChevronDown,
  Trash2,
  RotateCcw
} from 'lucide-react';

interface NavbarProps {
  watchlistCount: number;
  onOpenWatchlist: () => void;
  onOpenDownloadModal: () => void;
  onOpenAdminPanel?: () => void;
  onOpenAccount?: () => void;
  onOpenAppSettings?: () => void;
  onRequestContent?: () => void;
  isLoggedIn?: boolean;
  onToggleAuth?: () => void;
  onSelectCategory: (category: 'all' | 'series' | 'movies' | 'categories' | 'watchlist') => void;
  activeFilter: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenShowById?: (showId: string) => void;
  userAvatar?: string;
  userName?: string;
  useCustomLogo?: boolean;
  customLogoUrl?: string;
  notifications?: NotificationItem[];
  onUpdateNotifications?: (notifs: NotificationItem[]) => void;
  onProfileMenuAction?: () => void;
  onClearWatchlist?: () => void;
  onClearWatchHistory?: () => void;
  isSpecialFeedPage?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  watchlistCount,
  onOpenWatchlist,
  onOpenDownloadModal,
  onOpenAdminPanel,
  onOpenAccount,
  onOpenAppSettings,
  onRequestContent,
  isLoggedIn = true,
  onToggleAuth,
  onSelectCategory,
  activeFilter,
  searchQuery,
  onSearchChange,
  onOpenShowById,
  userAvatar = 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=120&q=80',
  userName = 'Good',
  useCustomLogo = false,
  customLogoUrl,
  notifications: propNotifications,
  onUpdateNotifications,
  onProfileMenuAction,
  onClearWatchlist,
  onClearWatchHistory,
  isSpecialFeedPage = false
}) => {
  type ActiveMenu = 'none' | 'search' | 'notifications' | 'profile' | 'more';
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('none');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 5 standard page tabs
  const ALL_PAGES = [
    { id: 'all' as const, label: 'Home' },
    { id: 'series' as const, label: 'Series' },
    { id: 'movies' as const, label: 'Movies' },
    { id: 'categories' as const, label: 'Categories' },
    { id: 'watchlist' as const, label: 'My list' },
  ];

  // Exact adaptive slot calculation:
  // 5 slots: All 5 page links fit
  // 4 slots: 3 links + "More ▾" (containing remaining 2)
  // 3 slots: 2 links + "More ▾" (containing remaining 3)
  // 2 slots: 1 link + "More ▾" (containing remaining 4)
  // 1 slot: Only 1 button showing current page name (dropdown with other 4)
  const navSlots = useMemo(() => {
    const isSearchOpen = activeMenu === 'search';
    if (isSearchOpen) {
      if (windowWidth >= 1200) return 4;
      if (windowWidth >= 1020) return 3;
      if (windowWidth >= 860) return 2;
      return 1;
    }
    if (windowWidth >= 1100) return 5;
    if (windowWidth >= 950) return 4;
    if (windowWidth >= 800) return 3;
    if (windowWidth >= 660) return 2;
    return 1;
  }, [windowWidth, activeMenu]);

  // References to keep exactly ONE menu visible at a time
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);
  const moreContainerRef = useRef<HTMLDivElement>(null);

  // Toggle single active menu - opening any closes all others
  const openMenu = (menu: ActiveMenu) => {
    setActiveMenu((prev) => (prev === menu ? 'none' : menu));
  };

  const [localNotificationList, setLocalNotificationList] = useState<NotificationItem[]>(() => [
    {
      id: 'notif-1',
      showId: 'dirilis-ertugrul',
      title: 'New Episode Released',
      description: 'Diriliş: Ertuğrul — Season 2 is now available to stream in 4K',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=240&q=80',
      timeAgo: '2h ago',
      unread: true
    },
    {
      id: 'notif-2',
      showId: 'aile',
      title: 'Trending #1 in Thrillers',
      description: 'Aile is the most-watched romantic crime series today',
      thumbnailUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=240&q=80',
      timeAgo: '1d ago',
      unread: true
    },
    {
      id: 'notif-3',
      showId: 'barbaroslar',
      title: 'Recommended For You',
      description: 'Explore Barbaroslar: Akdeniz\'in Kılıcı starring Engin Altan',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=240&q=80',
      timeAgo: '2d ago',
      unread: false
    }
  ]);

  const notificationList = propNotifications || localNotificationList;

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark this notification as read immediately
    const updated = notificationList.map((n) =>
      n.id === notif.id ? { ...n, unread: false } : n
    );
    if (onUpdateNotifications) {
      onUpdateNotifications(updated);
    } else {
      setLocalNotificationList(updated);
    }
    if (onOpenShowById && notif.showId) {
      onOpenShowById(notif.showId);
    }
    setActiveMenu('none');
  };

  const handleMarkAllRead = () => {
    const updated = notificationList.map((n) => ({ ...n, unread: false }));
    if (onUpdateNotifications) {
      onUpdateNotifications(updated);
    } else {
      setLocalNotificationList(updated);
    }
  };

  const [scrollY, setScrollY] = useState<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      // Smoothly activate solid background when scrolling beyond 20px threshold
      setIsScrolled(window.scrollY > 20);
    };

    // Run once on mount to capture initial scroll position
    handleScroll();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        (activeMenu === 'search' && searchContainerRef.current?.contains(target)) ||
        (activeMenu === 'notifications' && notifContainerRef.current?.contains(target)) ||
        (activeMenu === 'profile' && profileContainerRef.current?.contains(target)) ||
        (activeMenu === 'more' && moreContainerRef.current?.contains(target))
      ) {
        return;
      }
      setActiveMenu('none');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu('none');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu]);

  // Compute mobile top navbar background opacity: starts at 0% at top, smoothly reaches 100% solid black at 3 inches (~288px)
  const mobileNavOpacity = Math.min(1.0, scrollY / 288);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-none select-none">
      {/* Background for Mobile: starts at 0% opacity, attains 100% solid black at 3 inches scroll, 0 blur */}
      <div
        className="md:hidden absolute inset-0 pointer-events-none backdrop-blur-none transition-[background-color] duration-75"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${mobileNavOpacity})`
        }}
      />

      {/* Background for Desktop: with simple 0.7s fade-in and 0.5s fade-out */}
      <div className="hidden md:block absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Soft, gentle top vignette when at top (matching Netflix reference image) */}
        <div
          style={{
            transition: isScrolled ? 'opacity 700ms linear' : 'opacity 500ms linear',
            opacity: isScrolled ? 0 : 1
          }}
          className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none"
        />
        {/* Solid black fill on scroll: Desktop only */}
        <div
          style={{
            transition: isScrolled ? 'opacity 700ms linear' : 'opacity 500ms linear',
            opacity: isScrolled ? 1 : 0
          }}
          className="hidden md:block absolute inset-0 bg-black shadow-[0_8px_30px_rgb(0,0,0,0.85)] pointer-events-none"
        />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE TOP NAVIGATION (Compact height, logo position strictly constant on scroll) */}
      {/* ========================================================================= */}
      <div className="md:hidden relative w-full px-4 h-12 flex items-center justify-between">
        {/* Top Bar: Brand Logo on left with NO shadow beneath */}
        <button
          onClick={() => {
            onSearchChange('');
            onSelectCategory('all');
            setActiveMenu('none');
          }}
          className="flex items-center gap-1 cursor-pointer text-left shrink-0 max-w-[120px]"
          aria-label="Dizi Home"
        >
          {useCustomLogo && customLogoUrl ? (
            <img
              src={customLogoUrl}
              alt="Brand Logo"
              referrerPolicy="no-referrer"
              className="h-7 w-auto max-w-[110px] object-contain"
            />
          ) : (
            <DiziLogo variant="red" size="md" className="max-w-[110px] h-7" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP TOP NAVIGATION */}
      {/* ========================================================================= */}
      <div className="hidden md:flex w-full px-4 md:px-8 xl:px-12 py-3.5 items-center justify-between">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-4 lg:gap-8">
          {/* Logo with actual Dizi brand logo */}
          {/* Brand Logo with constrained max-width */}
          <button
            onClick={() => {
              onSearchChange('');
              onSelectCategory('all');
              setActiveMenu('none');
            }}
            className="flex items-center gap-1 group cursor-pointer text-left shrink-0 max-w-[95px] sm:max-w-[110px] md:max-w-[125px]"
            aria-label="Dizi Home"
          >
            {useCustomLogo && customLogoUrl ? (
              <img
                src={customLogoUrl}
                alt="Brand Logo"
                referrerPolicy="no-referrer"
                className="h-6.5 sm:h-7.5 md:h-8.5 w-auto max-w-[92px] sm:max-w-[108px] md:max-w-[120px] object-contain"
              />
            ) : (
              <DiziLogo variant="red" size="md" className="max-w-[92px] sm:max-w-[108px] md:max-w-[120px] h-7 sm:h-[32px] md:h-[35px]" />
            )}
          </button>

          {/* Navigation Links: Dynamic space handling (5, 4, 3, 2, or 1 slot) */}
          <nav className="flex items-center gap-1 sm:gap-1.5 md:gap-2 text-[15px] sm:text-[15.5px]">
            {navSlots === 1 ? (
              /* When only space for 1 link: show ONLY a text + dropdown button showing the CURRENT page name, with current page badge */
              <div ref={moreContainerRef} className="relative">
                {(() => {
                  const currentPageObj = ALL_PAGES.find((p) => p.id === activeFilter) || ALL_PAGES[0];
                  const otherPages = ALL_PAGES.filter((p) => p.id !== currentPageObj.id);

                  return (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openMenu('more');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[14.5px] sm:text-[15px] font-semibold transition-all cursor-pointer shrink-0 bg-white/20 text-white shadow-sm"
                        aria-label="Page navigation"
                      >
                        <span>{currentPageObj.label}</span>
                        <svg
                          viewBox="0 0 10 6"
                          className={`w-2.5 h-1.5 transition-transform duration-200 fill-current ${
                            activeMenu === 'more' ? 'rotate-180' : 'rotate-0'
                          }`}
                        >
                          <polygon points="0,0 10,0 5,6" />
                        </svg>
                      </button>

                      {activeMenu === 'more' && (
                        <div className="absolute left-0 top-full mt-2 w-48 bg-[#141414]/98 backdrop-blur-xl border border-[#333333] rounded-[6px] shadow-2xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                          {otherPages.map((page) => (
                            <button
                              key={page.id}
                              onClick={() => {
                                onSelectCategory(page.id);
                                setActiveMenu('none');
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between font-medium text-zinc-300 hover:bg-white/10 hover:text-white cursor-pointer"
                            >
                              <span>{page.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : navSlots < 5 ? (
              /* When space for 4, 3, or 2 links: show first (navSlots-1) links as they are, and remaining in "More ▾" dropdown */
              <>
                {ALL_PAGES.slice(0, navSlots - 1).map((page) => {
                  const isActive = !searchQuery.trim() && activeFilter === page.id;
                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        onSelectCategory(page.id);
                        setActiveMenu('none');
                      }}
                      className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer font-medium shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white font-semibold shadow-sm'
                          : 'text-zinc-300 hover:bg-white/13 hover:text-zinc-300'
                      }`}
                    >
                      {page.label}
                    </button>
                  );
                })}

                {/* More dropdown containing remaining pages */}
                <div ref={moreContainerRef} className="relative">
                  {(() => {
                    const dropdownPages = ALL_PAGES.slice(navSlots - 1);
                    const isCurrentInMore = dropdownPages.some((p) => p.id === activeFilter) && !searchQuery.trim();

                    return (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openMenu('more');
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[14.5px] sm:text-[15px] font-medium transition-all cursor-pointer shrink-0 ${
                            isCurrentInMore
                              ? 'bg-white/20 text-white font-semibold shadow-sm'
                              : activeMenu === 'more'
                              ? 'bg-white/13 text-white'
                              : 'text-zinc-300 hover:bg-white/13 hover:text-zinc-300'
                          }`}
                          aria-label="More navigation"
                        >
                          <span>More</span>
                          <svg
                            viewBox="0 0 10 6"
                            className={`w-2.5 h-1.5 transition-transform duration-200 fill-current ${
                              activeMenu === 'more' ? 'rotate-180' : 'rotate-0'
                            }`}
                          >
                            <polygon points="0,0 10,0 5,6" />
                          </svg>
                        </button>

                        {activeMenu === 'more' && (
                          <div className="absolute left-0 top-full mt-2 w-48 bg-[#141414]/98 backdrop-blur-xl border border-[#333333] rounded-xl shadow-2xl py-1.5 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            {dropdownPages.map((page) => {
                              const isActive = activeFilter === page.id;
                              return (
                                <button
                                  key={page.id}
                                  onClick={() => {
                                    onSelectCategory(page.id);
                                    setActiveMenu('none');
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between cursor-pointer ${
                                    isActive
                                      ? 'font-bold text-white bg-white/10'
                                      : 'font-medium text-zinc-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  <span>{page.label}</span>
                                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              /* When space for all 5 links: show all 5 links directly */
              ALL_PAGES.map((page) => {
                const isActive = !searchQuery.trim() && activeFilter === page.id;
                return (
                  <button
                    key={page.id}
                    onClick={() => {
                      onSelectCategory(page.id);
                      setActiveMenu('none');
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-full transition-colors cursor-pointer font-medium shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white font-semibold shadow-sm'
                        : 'text-zinc-300 hover:bg-white/13 hover:text-zinc-300'
                    }`}
                  >
                    {page.label}
                  </button>
                );
              })
            )}
          </nav>
        </div>

        {/* Right: Search, Notifications, Profile (Only ONE menu visible at a time) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search: maintains stable height and position; does not push right-side elements */}
          <div ref={searchContainerRef} className="relative flex items-center w-8 h-8 justify-center shrink-0">
            {activeMenu === 'search' ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-[#141414] border border-zinc-600/90 rounded-full h-[30px] pl-2.5 pr-0.5 text-sm text-white shadow-2xl z-50 transition-all">
                <Search className="w-3.5 h-3.5 text-zinc-400 mr-1.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Titles, actors, genres..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="bg-transparent text-white placeholder-zinc-400 outline-none w-40 sm:w-56 text-xs sm:text-sm h-full leading-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    onSearchChange('');
                    setActiveMenu('none');
                  }}
                  className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-full cursor-pointer shrink-0 transition-colors"
                  aria-label="Close search"
                  data-no-tooltip="true"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openMenu('search');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/13 text-zinc-200 hover:text-white transition-all cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
            )}
          </div>

          {/* Bell Notification with red count badge and hover badge matching page links */}
          <div ref={notifContainerRef} className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMenu('notifications');
              }}
              className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/13 text-zinc-200 hover:text-white transition-all cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4.5 h-4.5 stroke-[2.2]" />
              {notificationList.filter(n => n.unread).length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#e50914] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-md">
                  {notificationList.filter(n => n.unread).length}
                </span>
              )}
            </button>

            {/* Notifications Popup (Netflix style dark dropdown with top caret) */}
            {activeMenu === 'notifications' && (
              <div className="absolute right-0 top-11 w-88 sm:w-96 bg-[#141414]/98 backdrop-blur-xl border border-[#333333] rounded-xl shadow-2xl py-1 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Triangular Caret Indicator pointing up to bell */}
                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#141414] border-t border-l border-[#333333] rotate-45 z-10" />

                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                  <span className="text-[15px] font-bold text-white tracking-wide">
                    Notifications
                  </span>
                  {notificationList.filter(n => n.unread).length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllRead();
                      }}
                      className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
                    >
                      Mark all as read
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500">All caught up</span>
                  )}
                </div>

                <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-800/80">
                  {notificationList.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`flex items-start gap-3.5 px-4 py-3 hover:bg-zinc-800/60 transition-colors cursor-pointer group ${
                        notif.unread ? 'bg-zinc-900/40' : 'bg-transparent'
                      }`}
                    >
                      {/* Left: Thumbnail image with subtle rounded corners */}
                      <div className="w-[110px] h-[62px] rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10 relative">
                        <img
                          src={notif.thumbnailUrl}
                          alt={notif.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Middle: Content with increased typography */}
                      <div className="flex-1 min-w-0 pr-1">
                        <p className={`text-[14.5px] sm:text-[15px] ${notif.unread ? 'font-bold text-white' : 'font-semibold text-zinc-300'} group-hover:text-red-400 transition-colors leading-snug`}>
                          {notif.title}
                        </p>
                        <p className="text-[12.5px] sm:text-[13px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                          {notif.description}
                        </p>
                        <span className="text-[11.5px] text-zinc-500 mt-1.5 block">
                          {notif.timeAgo}
                        </span>
                      </div>

                      {/* Right: Unread indicator */}
                      {notif.unread && (
                        <div className="pt-2 shrink-0">
                          <span
                            className="w-2 h-2 rounded-full bg-[#e50914] block shadow-[0_0_8px_rgba(229,9,20,0.8)]"
                            title="Unread"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar: Circular profile icon matching image */}
          <div ref={profileContainerRef} className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMenu('profile');
              }}
              className="flex items-center gap-1.5 cursor-pointer group p-0.5 rounded-full active:scale-95 transition-all"
              aria-label="Profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-sky-600 to-blue-500 shadow-md shrink-0 flex items-center justify-center">
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-sky-600 to-blue-500 text-white">
                    <User className="w-4.5 h-4.5" />
                  </div>
                )}
              </div>
            </button>

            {/* Profile Menu Dropdown: Netflix style rectangular with rounded corners */}
            {activeMenu === 'profile' && (
              <div className="absolute right-0 top-11 w-56 bg-[#141414]/98 backdrop-blur-xl border border-[#333333] rounded-xl shadow-2xl py-2 z-50 text-[14.5px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Triangular Caret Indicator pointing up to avatar */}
                <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#141414] border-t border-l border-[#333333] rotate-45 z-10" />

                <div className="space-y-0.5">
                  {/* Account (opens full page edit profile / account setting) */}
                  <div
                    onClick={() => {
                      onProfileMenuAction?.();
                      onSearchChange('');
                      if (onOpenAccount) onOpenAccount();
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <User className="w-5 h-5 text-zinc-300 shrink-0" />
                    <span className="font-medium">Account</span>
                  </div>

                  {/* App Settings */}
                  <div
                    onClick={() => {
                      onProfileMenuAction?.();
                      onSearchChange('');
                      if (onOpenAppSettings) onOpenAppSettings();
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Settings className="w-5 h-5 text-zinc-300 shrink-0" />
                    <span className="font-medium">Settings</span>
                  </div>

                  {/* Request Content */}
                  <div
                    onClick={() => {
                      onProfileMenuAction?.();
                      onSearchChange('');
                      if (onRequestContent) onRequestContent();
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-5 h-5 text-zinc-300 shrink-0" />
                    <span className="font-medium">Request Content</span>
                  </div>

                  {/* Download App */}
                  <div
                    onClick={() => {
                      onProfileMenuAction?.();
                      onSearchChange('');
                      if (onOpenDownloadModal) onOpenDownloadModal();
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Download className="w-5 h-5 text-zinc-300 shrink-0" />
                    <span className="font-medium">Download App</span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="border-t border-zinc-800 my-1.5" />

                {/* Sign out / Sign in */}
                <div
                  onClick={() => {
                    onProfileMenuAction?.();
                    if (onToggleAuth) onToggleAuth();
                    setActiveMenu('none');
                  }}
                  className="px-4 py-2 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer font-medium transition-colors"
                >
                  {isLoggedIn ? 'Sign out of Dizi' : 'Sign in to Dizi'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

