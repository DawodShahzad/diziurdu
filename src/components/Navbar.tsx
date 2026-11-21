import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DiziLogo } from './DiziLogo';
import { NotificationItem, Show } from '../types';
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
  ChevronLeft,
  Trash2,
  RotateCcw,
  Menu
} from 'lucide-react';
import { useDeviceLayout } from '../utils/deviceLayout';

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
  onSelectCategory: (category: 'all' | 'series' | 'movies' | 'categories' | 'watchlist' | 'trends') => void;
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
  isOffline?: boolean;
  hideMobileLogoBar?: boolean;
  isSharePage?: boolean;
  onOpenHamburgerDrawer?: () => void;
  searchSuggestions?: string[];
  onExactSearchCommit?: (query: string) => void;
  hideProfileAvatar?: boolean;
  desktopNavbarStyle?: 'classic' | 'floating_glass';
  shows?: Show[];
  onOpenCreateAccount?: () => void;
  onShareBack?: () => void;
  hideNavbarOnFullSizeMoreInfo?: boolean;
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
  userName = '',
  useCustomLogo = false,
  customLogoUrl,
  notifications: propNotifications,
  onUpdateNotifications,
  onProfileMenuAction,
  onClearWatchlist,
  onClearWatchHistory,
  isSpecialFeedPage = false,
  isOffline = false,
  hideMobileLogoBar = false,
  isSharePage = false,
  onOpenHamburgerDrawer,
  searchSuggestions = [],
  onExactSearchCommit,
  hideProfileAvatar = false,
  desktopNavbarStyle = 'classic',
  shows = [],
  onOpenCreateAccount,
  onShareBack,
  hideNavbarOnFullSizeMoreInfo = false
}) => {
  type ActiveMenu = 'none' | 'search' | 'notifications' | 'profile' | 'more';
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('none');
  const [floatingExpand, setFloatingExpand] = useState<'none' | 'menu' | 'search' | 'profile'>('none');
  const floatingExpandRef = useRef<'none' | 'menu' | 'search' | 'profile'>('none');
  const lastScrollYRef = useRef<number>(0);
  const [floatingSearchDraft, setFloatingSearchDraft] = useState<string>(searchQuery || '');
  const floatingSearchDraftRef = useRef<string>(searchQuery || '');
  const searchQueryRef = useRef<string>(searchQuery || '');
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const { isMobile: isMobileDevice, width: windowWidth } = useDeviceLayout();
  const floatingBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    floatingExpandRef.current = floatingExpand;
  }, [floatingExpand]);

  useEffect(() => {
    floatingSearchDraftRef.current = floatingSearchDraft;
  }, [floatingSearchDraft]);

  useEffect(() => {
    searchQueryRef.current = searchQuery || '';
  }, [searchQuery]);

  // Standard page tabs (Home, Series, Movies, Categories, My list)
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

  // Inline predictive autocomplete suffix (e.g. "ertu" -> dull "grul ghazi")
  const { fullPrediction, ghostSuffix } = useMemo(() => {
    const raw = searchQuery;
    const trimmed = raw.trim();
    if (!trimmed || !searchSuggestions || searchSuggestions.length === 0) {
      return { fullPrediction: '', ghostSuffix: '' };
    }
    const lowerRaw = raw.toLowerCase();
    const match = searchSuggestions.find(
      (s) => s.toLowerCase().startsWith(lowerRaw) && s.length > raw.length
    );
    if (!match) return { fullPrediction: '', ghostSuffix: '' };
    return {
      fullPrediction: match,
      ghostSuffix: match.slice(raw.length)
    };
  }, [searchQuery, searchSuggestions]);

  // Keep search input open when navigated via /search URL with a query
  useEffect(() => {
    if (searchQuery.trim() && activeMenu === 'none') {
      setActiveMenu('search');
    }
  }, [searchQuery]);

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
      const shareScroller = isSharePage
        ? (document.querySelector('[data-share-overlay-scroll="true"]') as HTMLElement | null)
        : null;
      const currentY = isSharePage && shareScroller ? shareScroller.scrollTop : window.scrollY;
      if (
        desktopNavbarStyle === 'floating_glass' &&
        Math.abs(currentY - lastScrollYRef.current) > 4 &&
        (floatingExpandRef.current === 'menu' ||
          floatingExpandRef.current === 'profile' ||
          (floatingExpandRef.current === 'search' &&
            !floatingSearchDraftRef.current.trim() &&
            !searchQueryRef.current.trim()))
      ) {
        setFloatingExpand('none');
      }
      lastScrollYRef.current = currentY;
      setScrollY(currentY);
      // Smoothly activate solid background when scrolling beyond 20px threshold
      setIsScrolled(currentY > 20);
    };

    // Run once on mount / mode change to capture initial scroll position
    handleScroll();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (floatingBarRef.current && !floatingBarRef.current.contains(target)) {
        setFloatingExpand('none');
      }
      if (activeMenu === 'search') {
        return;
      }
      if (
        (activeMenu === 'notifications' && notifContainerRef.current?.contains(target)) ||
        (activeMenu === 'profile' && profileContainerRef.current?.contains(target)) ||
        (activeMenu === 'more' && moreContainerRef.current?.contains(target))
      ) {
        return;
      }
      setActiveMenu('none');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu('none');
        setFloatingExpand('none');
      }
    };

    const shareScroller = isSharePage
      ? (document.querySelector('[data-share-overlay-scroll="true"]') as HTMLElement | null)
      : null;

    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    shareScroller?.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true } as EventListenerOptions);
      shareScroller?.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu, isSharePage]);

  // Sync draft search input when external searchQuery clears
  useEffect(() => {
    setFloatingSearchDraft(searchQuery || '');
  }, [searchQuery]);

  // Collapse floating navbar menus when entering Full Size More Info Page
  useEffect(() => {
    if (isSharePage) {
      setFloatingExpand('none');
    }
  }, [isSharePage]);

  // Disable background scrolling when floating navbar search has text entered
  useEffect(() => {
    const hasSearchText = Boolean(floatingSearchDraft.trim() || searchQuery.trim());
    const shouldLockScroll =
      !isMobileDevice &&
      desktopNavbarStyle === 'floating_glass' &&
      floatingExpand === 'search' &&
      hasSearchText;
    if (!shouldLockScroll) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const shareScroller = document.querySelector('[data-share-overlay-scroll="true"]') as HTMLElement | null;
    const prevShareOverflow = shareScroller ? shareScroller.style.overflowY : '';

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (shareScroller) shareScroller.style.overflowY = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      if (shareScroller) shareScroller.style.overflowY = prevShareOverflow;
    };
  }, [isMobileDevice, desktopNavbarStyle, floatingExpand, floatingSearchDraft, searchQuery]);

  // Floating navbar inline live suggestions (3-4) and matching cards (4)
  const { floatingMatchedSuggestions, floatingMatchedShows } = useMemo(() => {
    const q = floatingSearchDraft.trim().toLowerCase();
    if (!q) {
      return {
        floatingMatchedSuggestions: [] as string[],
        floatingMatchedShows: [] as Show[]
      };
    }

    const sugMatches: string[] = [];
    const seenSug = new Set<string>();
    const addSug = (text: string) => {
      const clean = text.trim();
      if (!clean || seenSug.has(clean.toLowerCase())) return;
      seenSug.add(clean.toLowerCase());
      sugMatches.push(clean);
    };

    shows.forEach((s) => {
      if (s.title.toLowerCase().startsWith(q)) addSug(s.title);
    });
    shows.forEach((s) => {
      if (s.title.toLowerCase().includes(q)) addSug(s.title);
    });
    searchSuggestions.forEach((s) => {
      if (s.toLowerCase().includes(q)) addSug(s);
    });

    const cardMatches = shows
      .filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          Boolean(s.turkishTitle?.toLowerCase().includes(q)) ||
          s.genres.some((g) => g.toLowerCase().includes(q)) ||
          s.cast.some((c) => c.name.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const aStart = a.title.toLowerCase().startsWith(q) ? 1 : 0;
        const bStart = b.title.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStart !== bStart) return bStart - aStart;
        return (b.points || 0) - (a.points || 0);
      })
      .slice(0, 3);

    return {
      floatingMatchedSuggestions: sugMatches.slice(0, 3),
      floatingMatchedShows: cardMatches
    };
  }, [floatingSearchDraft, shows, searchSuggestions]);

  const floatingPageLabel = useMemo(() => {
    if (isSharePage) return null;
    if (searchQuery.trim()) return 'Search';
    if (activeFilter === 'series') return 'Series';
    if (activeFilter === 'movies') return 'Movies';
    if (activeFilter === 'categories') return 'Categories';
    if (activeFilter === 'watchlist') return 'My List';
    return null;
  }, [isSharePage, searchQuery, activeFilter]);

  const commitFloatingSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    onSearchChange(clean);
    onExactSearchCommit?.(clean);
    setFloatingExpand('none');
    setActiveMenu('none');
  };

  const isMinimalScrollableShareHeader = Boolean(
    !isMobileDevice && isSharePage && hideNavbarOnFullSizeMoreInfo
  );

  return (
    <header
      style={{
        top: isOffline && !isMobileDevice ? '52px' : '0px'
      }}
      className={`${
        isMinimalScrollableShareHeader ? 'absolute' : 'fixed'
      } left-0 right-0 z-50 border-none select-none transition-[top] duration-200`}
    >
      {/* Background for Desktop & Mobile: hidden on floating_glass desktop, hidden when Full Size More Info navbar is turned off */}
      {!isMinimalScrollableShareHeader &&
        (!isSharePage || desktopNavbarStyle === 'classic') &&
        ((isMobileDevice && !hideMobileLogoBar) ||
          (!isMobileDevice && desktopNavbarStyle !== 'floating_glass')) && (
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          {/* Subtle resting top gradient (omitted at scroll 0 on share page) */}
          <div
            style={{
              opacity: isSharePage ? 0 : Math.max(0, 1 - scrollY / 50)
            }}
            className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-transparent pointer-events-none transition-opacity duration-300"
          />
          {/* Smooth ramp to black background on scroll */}
          <div
            style={{
              opacity: Math.min(1, Math.max(0, scrollY / 90))
            }}
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-200"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOBILE TOP NAVIGATION (Compact height, logo position strictly constant on scroll) */}
      {/* ========================================================================= */}
      {isMobileDevice && !hideMobileLogoBar && (
        <div
          data-mobile-top-navbar="true"
          className="relative w-full px-4 h-12 flex items-center justify-between"
        >
          {/* Top Bar: Brand Logo on left with NO shadow beneath */}
          <button
            data-brand-logo-target="true"
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
      )}

      {/* ========================================================================= */}
      {/* DESKTOP TOP NAVIGATION                                                    */}
      {/* ========================================================================= */}
      {!isMobileDevice && (isMinimalScrollableShareHeader ? (
        <div className="flex w-full px-4 md:px-8 xl:px-12 py-3.5 items-center justify-start bg-transparent">
          <div className="flex items-center gap-4">
            {desktopNavbarStyle !== 'floating_glass' && (
              <button
                onClick={() => onOpenHamburgerDrawer?.()}
                className="p-1.5 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
            )}
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
                setActiveMenu('none');
              }}
              className="flex items-center gap-1 group cursor-pointer text-left shrink-0 max-w-[95px] sm:max-w-[110px] md:max-w-[125px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
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
          </div>
        </div>
      ) : desktopNavbarStyle === 'floating_glass' ? (
        <div
          className={`flex justify-center w-full pointer-events-none transition-[padding] duration-300 ease-out ${
            isScrolled ? 'pt-[9px] px-4' : 'pt-0 px-0'
          }`}
        >
          <div
            ref={floatingBarRef}
            className={`pointer-events-auto relative isolate flex flex-col transition-[width,padding,border-radius] duration-300 ease-out ${
              isScrolled
                ? 'w-[58%] min-w-[540px] max-w-[920px] px-5 overflow-hidden'
                : 'w-full px-4 md:px-8 xl:px-12 overflow-visible'
            } ${
              isScrolled
                ? floatingExpand !== 'none'
                  ? 'rounded-[24px]'
                  : 'rounded-[28px]'
                : 'rounded-none'
            }`}
          >
            {/* Dedicated Frosted Glass Backdrop Layer (isolated from foreground so icons, logo, search & profile remain 100% sharp) */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 z-0 transition-[background-color,border-color,box-shadow,border-radius,backdrop-filter] duration-300 ease-out ${
                isScrolled
                  ? floatingExpand !== 'none'
                    ? 'rounded-[24px] bg-black/90 backdrop-blur-sm border border-white/15 shadow-[0_18px_48px_rgba(0,0,0,0.75)]'
                    : 'rounded-[28px] bg-black/45 backdrop-blur-xl border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.55)]'
                  : 'rounded-none bg-transparent backdrop-blur-none border border-transparent shadow-none'
              }`}
            />

            {/* Primary Single-Row Header inside Floating Bar */}
            <div
              data-desktop-navbar-bar="true"
              className={`relative z-10 flex items-center justify-between w-full shrink-0 transition-[height] duration-300 ${
                isScrolled ? 'h-[52px]' : 'h-16'
              }`}
            >
              {/* Left: Back only on Full Size More Info, else Search->Back, Menu/Profile->Cross, Subpage->Back+Label, Home->Hamburger + Inline Links at top */}
              <div className="flex items-center gap-3 z-10">
                {isSharePage ? (
                  <button
                    onClick={() => {
                      setFloatingExpand('none');
                      onShareBack?.();
                    }}
                    className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.6]" />
                  </button>
                ) : floatingExpand === 'search' ? (
                  <button
                    onClick={() => setFloatingExpand('none')}
                    className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-all cursor-pointer"
                    aria-label="Close search options"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.6]" />
                  </button>
                ) : floatingPageLabel && floatingExpand === 'none' ? (
                  <button
                    onClick={() => {
                      setFloatingExpand('none');
                      setFloatingSearchDraft('');
                      onSearchChange('');
                      onSelectCategory('all');
                      setActiveMenu('none');
                    }}
                    className="flex items-center gap-1.5 -ml-1.5 px-2 py-1.5 rounded-full hover:bg-white/10 text-white active:scale-95 transition-all cursor-pointer"
                    aria-label="Back to homepage"
                  >
                    <ChevronLeft className="w-6 h-6 stroke-[2.6]" />
                    <span className="text-[15.5px] sm:text-base font-bold tracking-tight">{floatingPageLabel}</span>
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloatingExpand((prev) =>
                        prev === 'menu' || prev === 'profile' ? 'none' : 'menu'
                      );
                    }}
                    className="p-2 -ml-1.5 rounded-full hover:bg-white/10 text-white active:scale-90 transition-all cursor-pointer flex items-center justify-center"
                    aria-label={
                      floatingExpand === 'menu' || floatingExpand === 'profile'
                        ? 'Collapse menu'
                        : 'Open menu'
                    }
                  >
                    <span className="relative w-5 h-5 flex items-center justify-center">
                      <span
                        className={`absolute w-5 h-[2px] bg-white rounded-full transition-all duration-300 ease-out ${
                          floatingExpand === 'menu' || floatingExpand === 'profile'
                            ? 'translate-y-0 rotate-45'
                            : '-translate-y-[5.5px] rotate-0'
                        }`}
                      />
                      <span
                        className={`absolute w-5 h-[2px] bg-white rounded-full transition-all duration-200 ease-out ${
                          floatingExpand === 'menu' || floatingExpand === 'profile'
                            ? 'opacity-0 scale-x-0'
                            : 'opacity-100 scale-x-100'
                        }`}
                      />
                      <span
                        className={`absolute w-5 h-[2px] bg-white rounded-full transition-all duration-300 ease-out ${
                          floatingExpand === 'menu' || floatingExpand === 'profile'
                            ? 'translate-y-0 -rotate-45'
                            : 'translate-y-[5.5px] rotate-0'
                        }`}
                      />
                    </span>
                  </button>
                )}

                {/* At top (!isScrolled): clicking Hamburger shows page links inline right next to it (like classic navbar, zero background drawer) */}
                {!isScrolled && !isSharePage && floatingExpand === 'menu' && (
                  <nav className="flex items-center gap-1 sm:gap-1.5 text-[15px] animate-in fade-in slide-in-from-left-2 duration-150">
                    {(
                      [
                        { id: 'series' as const, label: 'Series' },
                        { id: 'movies' as const, label: 'Movies' },
                        { id: 'categories' as const, label: 'Categories' },
                        { id: 'watchlist' as const, label: 'My List' }
                      ]
                    ).map((item) => {
                      const isActive = !searchQuery.trim() && activeFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFloatingExpand('none');
                            setFloatingSearchDraft('');
                            onSearchChange('');
                            onSelectCategory(item.id);
                            setActiveMenu('none');
                          }}
                          className={`px-3.5 py-1.5 rounded-full transition-colors cursor-pointer font-medium shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white font-semibold shadow-sm'
                              : 'text-zinc-200 hover:bg-white/15 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                )}
              </div>

              {/* Center: Platform Logo */}
              <button
                data-brand-logo-target="true"
                onClick={() => {
                  setFloatingExpand('none');
                  setFloatingSearchDraft('');
                  onSearchChange('');
                  onSelectCategory('all');
                  setActiveMenu('none');
                }}
                className={`absolute left-1/2 -translate-x-1/2 flex items-center gap-1 cursor-pointer shrink-0 max-w-[130px] transition-opacity duration-150 ${
                  !isScrolled && !isSharePage && floatingExpand === 'menu' && windowWidth < 1020
                    ? 'opacity-0 pointer-events-none'
                    : 'opacity-100'
                }`}
                aria-label="Dizi Home"
              >
                {useCustomLogo && customLogoUrl ? (
                  <img
                    src={customLogoUrl}
                    alt="Brand Logo"
                    referrerPolicy="no-referrer"
                    className="h-7.5 w-auto max-w-[120px] object-contain"
                  />
                ) : (
                  <DiziLogo variant="red" size="md" className="max-w-[120px] h-[34px]" />
                )}
              </button>

              {/* Right: Search Icon / Classic Search at Top & Profile Avatar / Classic Dropdown at Top */}
              <div className="flex items-center gap-2.5 z-10">
                {!isScrolled && floatingExpand === 'search' ? (
                  <div className="relative flex items-center w-8 h-8 justify-center shrink-0">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-black/50 backdrop-blur-none border border-white/25 rounded-full h-[38px] pl-3.5 pr-1 text-sm text-white shadow-2xl z-50 transition-all"
                    >
                      <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                      <div className="relative flex items-center w-56 sm:w-68 md:w-80 h-full overflow-hidden">
                        {ghostSuffix && (
                          <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 flex items-center text-sm font-normal whitespace-pre overflow-hidden select-none"
                          >
                            <span className="invisible">{searchQuery}</span>
                            <span className="text-zinc-400/60">{ghostSuffix}</span>
                          </div>
                        )}
                        <input
                          type="text"
                          placeholder="Titles, actors, genres..."
                          value={searchQuery}
                          onChange={(e) => {
                            setFloatingSearchDraft(e.target.value);
                            onSearchChange(e.target.value);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' && fullPrediction) {
                              e.preventDefault();
                              setFloatingSearchDraft(fullPrediction);
                              onSearchChange(fullPrediction);
                              onExactSearchCommit?.(fullPrediction);
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (fullPrediction) {
                                setFloatingSearchDraft(fullPrediction);
                                onSearchChange(fullPrediction);
                                onExactSearchCommit?.(fullPrediction);
                              } else if (searchQuery.trim()) {
                                onExactSearchCommit?.(searchQuery.trim());
                              }
                            }
                          }}
                          className="relative z-10 bg-transparent text-white placeholder-zinc-400/90 outline-none w-full text-sm font-normal h-full leading-none"
                          autoFocus
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFloatingSearchDraft('');
                          onSearchChange('');
                          setFloatingExpand('none');
                        }}
                        className="w-7 h-7 flex items-center justify-center bg-white/15 hover:bg-white/25 text-white rounded-full cursor-pointer shrink-0 transition-colors ml-1"
                        aria-label="Close search"
                        data-no-tooltip="true"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloatingExpand((prev) => {
                        if (prev === 'search') return 'none';
                        setFloatingSearchDraft(searchQuery || '');
                        return 'search';
                      });
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 text-zinc-100 hover:text-white transition-all cursor-pointer ${
                      floatingExpand === 'search' ? 'bg-white/20 text-white' : ''
                    }`}
                    aria-label="Search"
                  >
                    <Search className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>
                )}

                <div className="relative flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFloatingExpand((prev) => (prev === 'profile' ? 'none' : 'profile'));
                    }}
                    className={`flex items-center gap-1.5 cursor-pointer group p-0.5 rounded-full active:scale-95 transition-transform ${
                      floatingExpand === 'profile' && isScrolled ? 'ring-2 ring-white/40' : ''
                    }`}
                    aria-label="Profile"
                  >
                    <div
                      data-desktop-nav-avatar="true"
                      className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-transparent border-0 shadow-none"
                    >
                      {userAvatar ? (
                        <img
                          src={userAvatar}
                          alt="Profile"
                          referrerPolicy="no-referrer"
                          className={`w-full h-full object-cover ${
                            hideProfileAvatar ? 'opacity-0' : 'opacity-100'
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-full h-full flex items-center justify-center bg-zinc-800 text-white ${
                            hideProfileAvatar ? 'opacity-0' : 'opacity-100'
                          }`}
                        >
                          <User className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* At top (!isScrolled): classic profile dropdown popover anchored right below avatar */}
                  {!isScrolled && floatingExpand === 'profile' && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-11 w-56 bg-[#141414]/98 backdrop-blur-xl border border-[#333333] rounded-xl shadow-2xl py-2 z-50 text-[14.5px] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    >
                      <div className="absolute -top-1.5 right-3 w-3 h-3 bg-[#141414] border-t border-l border-[#333333] rotate-45 z-10" />

                      <div className="space-y-0.5">
                        {isLoggedIn && (
                          <div
                            onClick={() => {
                              onProfileMenuAction?.();
                              onSearchChange('');
                              onOpenAccount?.();
                              setFloatingExpand('none');
                            }}
                            className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                          >
                            <User className="w-5 h-5 text-zinc-300 shrink-0" />
                            <span className="font-medium">Account</span>
                          </div>
                        )}

                        <div
                          onClick={() => {
                            onProfileMenuAction?.();
                            onSearchChange('');
                            onOpenAppSettings?.();
                            setFloatingExpand('none');
                          }}
                          className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <Settings className="w-5 h-5 text-zinc-300 shrink-0" />
                          <span className="font-medium">Settings</span>
                        </div>

                        <div
                          onClick={() => {
                            onProfileMenuAction?.();
                            onSearchChange('');
                            onRequestContent?.();
                            setFloatingExpand('none');
                          }}
                          className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <Plus className="w-5 h-5 text-zinc-300 shrink-0" />
                          <span className="font-medium">Request Content</span>
                        </div>

                        <div
                          onClick={() => {
                            onProfileMenuAction?.();
                            onSearchChange('');
                            onOpenDownloadModal();
                            setFloatingExpand('none');
                          }}
                          className="flex items-center gap-3.5 px-4.5 py-2.5 text-zinc-200 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <Download className="w-5 h-5 text-zinc-300 shrink-0" />
                          <span className="font-medium">Download App</span>
                        </div>
                      </div>

                      <div className="border-t border-zinc-800 my-1.5" />

                      {!isLoggedIn && (
                        <div
                          onClick={() => {
                            onProfileMenuAction?.();
                            if (onOpenCreateAccount) {
                              onOpenCreateAccount();
                            } else {
                              onToggleAuth?.();
                            }
                            setFloatingExpand('none');
                          }}
                          className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer font-semibold transition-colors"
                        >
                          Create Account
                        </div>
                      )}

                      <div
                        onClick={() => {
                          onProfileMenuAction?.();
                          onToggleAuth?.();
                          setFloatingExpand('none');
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

            {/* Scrolled Pill Expanded Section 1: Hamburger Horizontal Menu */}
            {isScrolled && !isSharePage && floatingExpand === 'menu' && (
              <div className="relative z-10 w-full pt-1.5 pb-4 border-t border-white/10 flex items-center justify-center gap-2 sm:gap-4 flex-wrap animate-in fade-in duration-150">
                {(
                  [
                    { id: 'series' as const, label: 'Series' },
                    { id: 'movies' as const, label: 'Movies' },
                    { id: 'categories' as const, label: 'Categories' },
                    { id: 'watchlist' as const, label: 'My List' }
                  ]
                ).map((item) => {
                  const isActive = !searchQuery.trim() && !isSharePage && activeFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFloatingExpand('none');
                        setFloatingSearchDraft('');
                        onSearchChange('');
                        onSelectCategory(item.id);
                        setActiveMenu('none');
                      }}
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-200 hover:text-white hover:bg-white/15'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Scrolled Pill Expanded Section 2: Floating Spotlight Search (Input + Clear, max 3 Suggestions, 3 larger 16:9 Cards) */}
            {isScrolled && floatingExpand === 'search' && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full pt-2 pb-5 border-t border-white/10 space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center h-11 px-4 rounded-full border border-white/25 bg-black/25 focus-within:border-white/50 transition-colors">
                  <Search className="w-4.5 h-4.5 text-zinc-300 mr-3 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search titles, actors, genres..."
                    value={floatingSearchDraft}
                    onChange={(e) => setFloatingSearchDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && floatingSearchDraft.trim()) {
                        e.preventDefault();
                        commitFloatingSearch(floatingSearchDraft);
                      }
                    }}
                    className="flex-1 bg-transparent text-white placeholder-zinc-400 text-sm font-semibold outline-none"
                    autoFocus
                  />
                  {floatingSearchDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setFloatingSearchDraft('');
                        if (searchQuery) onSearchChange('');
                      }}
                      className="text-xs sm:text-sm font-semibold text-white hover:text-zinc-300 cursor-pointer ml-3 shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Vertical Stack of max 3 Suggested Terms */}
                {floatingMatchedSuggestions.length > 0 && (
                  <div className="flex flex-col items-start gap-2 px-1">
                    {floatingMatchedSuggestions.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => commitFloatingSearch(sug)}
                        className="text-left text-sm font-bold text-white hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}

                {/* Horizontal Row of 3 slightly bigger 16:9 Cards */}
                {floatingMatchedShows.length > 0 && (
                  <div className="grid grid-cols-3 gap-3.5 pt-1">
                    {floatingMatchedShows.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setFloatingExpand('none');
                          onOpenShowById?.(s.id);
                        }}
                        className="group relative aspect-video w-full rounded-md overflow-hidden bg-zinc-900 cursor-pointer text-left"
                        title={s.title}
                      >
                        <img
                          src={s.posterLandscapeUrl || s.backdropUrl || s.posterVerticalUrl}
                          alt={s.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                          <span className="text-xs sm:text-sm font-bold text-white line-clamp-1">{s.title}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scrolled Pill Expanded Section 3: Profile Horizontal Row (single row, hides Account when signed out) */}
            {isScrolled && floatingExpand === 'profile' && (
              <div className="relative z-10 w-full pt-2.5 pb-4 border-t border-white/10 flex items-center justify-center gap-2 md:gap-3 lg:gap-5 flex-nowrap whitespace-nowrap animate-in fade-in duration-150">
                {isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onProfileMenuAction?.();
                      onSearchChange('');
                      onOpenAccount?.();
                      setFloatingExpand('none');
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] lg:text-[15px] font-semibold text-zinc-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                  >
                    <User className="w-[17px] h-[17px] shrink-0" />
                    <span>Account</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onProfileMenuAction?.();
                    onSearchChange('');
                    onOpenAppSettings?.();
                    setFloatingExpand('none');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] lg:text-[15px] font-semibold text-zinc-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                >
                  <Settings className="w-[17px] h-[17px] shrink-0" />
                  <span>Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onProfileMenuAction?.();
                    onSearchChange('');
                    onRequestContent?.();
                    setFloatingExpand('none');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] lg:text-[15px] font-semibold text-zinc-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-[17px] h-[17px] shrink-0" />
                  <span>Request Content</span>
                </button>
                {!isLoggedIn && (
                  <button
                    type="button"
                    onClick={() => {
                      onProfileMenuAction?.();
                      if (onOpenCreateAccount) {
                        onOpenCreateAccount();
                      } else {
                        onToggleAuth?.();
                      }
                      setFloatingExpand('none');
                    }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] lg:text-[15px] font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  >
                    <User className="w-[17px] h-[17px] shrink-0" />
                    <span>Create Account</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onProfileMenuAction?.();
                    onToggleAuth?.();
                    setFloatingExpand('none');
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[14px] lg:text-[15px] font-semibold text-zinc-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
                >
                  {isLoggedIn ? <LogOut className="w-[17px] h-[17px] shrink-0" /> : <LogIn className="w-[17px] h-[17px] shrink-0" />}
                  <span>{isLoggedIn ? 'Sign Out' : 'Sign In'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : isSharePage ? (
        <div className="flex w-full px-4 md:px-8 xl:px-12 py-3.5 items-center justify-between bg-transparent">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenHamburgerDrawer?.()}
              className="p-1.5 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.28)]"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('all');
                setActiveMenu('none');
              }}
              className="flex items-center gap-1 group cursor-pointer text-left shrink-0 max-w-[95px] sm:max-w-[110px] md:max-w-[125px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.18)]"
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
          </div>
        </div>
      ) : (
      <div className="flex w-full px-4 md:px-8 xl:px-12 py-3.5 items-center justify-between">
          <>
            {/* Left: Brand Logo & Navigation */}
            <div className="flex items-center gap-4 lg:gap-8">
          {/* Logo with actual Dizi brand logo */}
          {/* Brand Logo with constrained max-width */}
          <button
            data-brand-logo-target="true"
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
          {/* Search: maintains exact Navbar height (container stays w-8 h-8), expanded pill h-[38px] bg-black/50 no blur */}
          <div ref={searchContainerRef} className="relative flex items-center w-8 h-8 justify-center shrink-0">
            {activeMenu === 'search' ? (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-black/50 backdrop-blur-none border border-white/25 rounded-full h-[38px] pl-3.5 pr-1 text-sm text-white shadow-2xl z-50 transition-all">
                <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <div className="relative flex items-center w-56 sm:w-68 md:w-80 h-full overflow-hidden">
                  {/* Inline dull predictive ghost overlay aligned right behind typed input */}
                  {ghostSuffix && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 flex items-center text-sm font-normal whitespace-pre overflow-hidden select-none"
                    >
                      <span className="invisible">{searchQuery}</span>
                      <span className="text-zinc-400/60">{ghostSuffix}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Titles, actors, genres..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && fullPrediction) {
                        e.preventDefault();
                        onSearchChange(fullPrediction);
                        onExactSearchCommit?.(fullPrediction);
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (fullPrediction) {
                          onSearchChange(fullPrediction);
                          onExactSearchCommit?.(fullPrediction);
                        } else if (searchQuery.trim()) {
                          onExactSearchCommit?.(searchQuery.trim());
                        }
                      }
                    }}
                    className="relative z-10 bg-transparent text-white placeholder-zinc-400/90 outline-none w-full text-sm font-normal h-full leading-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    onSearchChange('');
                    setActiveMenu('none');
                  }}
                  className="w-7 h-7 flex items-center justify-center bg-white/15 hover:bg-white/25 text-white rounded-full cursor-pointer shrink-0 transition-colors ml-1"
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

          {/* Profile Avatar: transparent layout box when locked so zero empty circle appears; no blue background */}
          <div ref={profileContainerRef} className="relative flex items-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                openMenu('profile');
              }}
              className="flex items-center gap-1.5 cursor-pointer group p-0.5 rounded-full active:scale-95 transition-transform"
              aria-label="Profile"
            >
              <div
                data-desktop-nav-avatar="true"
                className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-transparent border-0 shadow-none"
              >
                {userAvatar ? (
                  <img
                    src={userAvatar}
                    alt="Profile"
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover ${
                      hideProfileAvatar ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center bg-zinc-800 text-white ${
                      hideProfileAvatar ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
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
                  {/* Account (opens full page edit profile / account setting — hidden when signed out) */}
                  {isLoggedIn && (
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
                  )}

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

                {/* Create Account when guest */}
                {!isLoggedIn && (
                  <div
                    onClick={() => {
                      onProfileMenuAction?.();
                      if (onOpenCreateAccount) {
                        onOpenCreateAccount();
                      } else if (onToggleAuth) {
                        onToggleAuth();
                      }
                      setActiveMenu('none');
                    }}
                    className="px-4 py-2 text-white hover:bg-white/10 cursor-pointer font-semibold transition-colors"
                  >
                    Create Account
                  </div>
                )}

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
        </>
      </div>
      ))}
    </header>
  );
};

