import './firebase';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import fullBackupData from './full_backup.json';
import { Show, FeedConfig, AdminSettings, CastMember, VideoSourceType, NotificationItem, Episode, TrailerItem, CategoryItem, ProfilePictureGroup, DetailsOriginMeta, AdDeviceLayout } from './types';
import { NotFound404Page } from './components/NotFound404Page';

// Extract full database contents directly from full_backup.json
const DB_SHOWS: Show[] = (fullBackupData && Array.isArray((fullBackupData as any).shows))
  ? ((fullBackupData as any).shows as Show[])
  : [];

const DB_FEEDS: FeedConfig[] = (fullBackupData && Array.isArray((fullBackupData as any).feeds))
  ? ((fullBackupData as any).feeds as FeedConfig[])
  : [];

const DB_SETTINGS: AdminSettings = (fullBackupData && (fullBackupData as any).adminSettings)
  ? ((fullBackupData as any).adminSettings as AdminSettings)
  : {
      platformName: 'Dizi Urdu',
      enableWhereToWatch: true,
      enableHorizontalEpisodes: true,
      autoplayHoverTrailers: true,
      ambientGlowIntensity: 'high',
      dailymotionScriptUrl: 'https://geo.dailymotion.com/libs/player/x8lr5.js',
      mobileNavbarStyle: 'floating',
      mobileNavbarTheme: 'solid',
      mobileNavbarShowLabels: true,
      mobileRecommendationStyle: 'portrait',
      useNoPreviewButtonsFor2x3Recommendation: false,
      useFullSizeMoreInfoByDefault: false,
      backdropDarkness: 35,
      enableStretchableCards: true,
      showTop10Badges: true,
      modernTop10RankList: true,
      top10RankStyle: 'modern',
      desktopNavbarStyle: 'classic',
      signupTileEnabled: false,
      signupTileLayouts: ['desktop', 'tablet', 'mobile'],
      alertPosterEnabled: false,
      alertPosterButtonAction: 'close',
      alertPosterLayouts: ['desktop', 'tablet', 'mobile']
    };

const DB_CATEGORIES: CategoryItem[] = (fullBackupData && Array.isArray((fullBackupData as any).categoriesList))
  ? ((fullBackupData as any).categoriesList as CategoryItem[])
  : [];

const DB_PROFILE_GROUPS: ProfilePictureGroup[] = (fullBackupData && Array.isArray((fullBackupData as any).profilePictureGroups))
  ? ((fullBackupData as any).profilePictureGroups as ProfilePictureGroup[])
  : [];

const DB_NOTIFICATIONS: NotificationItem[] = (fullBackupData && Array.isArray((fullBackupData as any).notifications))
  ? ((fullBackupData as any).notifications as NotificationItem[])
  : [];

import { generateDailyFeeds } from './utils/feedEngine';
import { Navbar } from './components/Navbar';
import { DiziLogo } from './components/DiziLogo';
import { HeroRecommendation } from './components/HeroRecommendation';
import { FeedStrip } from './components/FeedStrip';
import { DetailModal } from './components/DetailModal';
import { CastPoolModal } from './components/CastPoolModal';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { DownloadAppModal } from './components/DownloadAppModal';
import { WatchlistModal } from './components/WatchlistModal';
import { EditProfilePage } from './components/EditProfilePage';
import { AppSettingsModal } from './components/AppSettingsModal';
import { RequestContentModal } from './components/RequestContentModal';
import { CustomPlayer } from './components/CustomPlayer';
import { EmbedPlayerModal, isEmbedVideo, parseTimeToSeconds } from './components/EmbedPlayerModal';
import { Footer } from './components/Footer';
import { CategoriesView, CATEGORIES_DATA } from './components/CategoriesView';
import { ShowCard } from './components/ShowCard';
import { SpecialFeedPage } from './components/SpecialFeedPage';
import { SpecialSingleFeed } from './components/SpecialSingleFeed';
import { BrowseByGenreRow, GenreItem, DEFAULT_GENRES } from './components/BrowseByGenreRow';
import { StartFromFirstEpisodeRow } from './components/StartFromFirstEpisodeRow';
import { EmptyListCard } from './components/EmptyListCard';
import { GlobalTooltip } from './components/GlobalTooltip';
import { OfflineAlertBar, useOfflineStatus } from './components/OfflineAlertBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchModal } from './components/MobileSearchModal';
import { MobileProfileModal } from './components/MobileProfileModal';
import { MobilePosterActionSheet } from './components/MobilePosterActionSheet';
import { ShareTitleDesktopPage } from './components/ShareTitleDesktopPage';
import { ShareModal } from './components/ShareModal';
import { ShareArrowIcon } from './components/ShareArrowIcon';
import { ProfileLockScreen } from './components/ProfileLockScreen';
import { LoginPage } from './components/LoginPage';
import { SignupTileBanner } from './components/SignupTileBanner';
import { AdTileBanner } from './components/AdTileBanner';
import { SearchAdCard } from './components/SearchAdCard';
import { NarrowAdBar } from './components/NarrowAdBar';
import { AlertPosterModal } from './components/AlertPosterModal';
import { Film, Tv, Sparkles, Filter, ChevronRight, ChevronLeft, Bookmark, X, Menu, Bell, Check, Plus } from 'lucide-react';
import { WatchProgressItem, EpisodeProgressItem } from './utils/watchProgress';
import { resolveShowShareMeta } from './utils/shareMeta';
import { MediaImage } from './components/MediaImage';
import { detectIsMobileDevice, detectIsTabletDevice } from './utils/deviceLayout';

function getPinnedOrRotatingRecommendation(pool: Show[], storageKey: string, forceRotate = false): Show | null {
  if (!pool || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  let pinnedId: string | null = null;
  try {
    pinnedId = localStorage.getItem(storageKey);
  } catch {}

  // Pinned recommendation across page reloads: keep the same show on reload!
  if (!forceRotate && pinnedId) {
    const existing = pool.find((s) => s.id === pinnedId);
    if (existing) return existing;
  }

  // Pick fresh recommendation when rotating (e.g., 10-min interval or mobile triple tap)
  const differentShows = pool.filter((s) => s.id !== pinnedId);
  const candidates = differentShows.length > 0 ? differentShows : pool;

  const chosenIndex = Math.floor(Math.random() * candidates.length);
  const chosen = candidates[chosenIndex];

  try {
    localStorage.setItem(storageKey, chosen.id);
  } catch {}

  return chosen;
}

export default function App() {
  const currentBackupExportTime = (fullBackupData as any)?.exported_at || '';
  const isOffline = useOfflineStatus();

  // Synchronize state directly from full_backup.json on first load with zero mock data
  const [shows, setShows] = useState<Show[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_shows');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Reject any legacy mock data (e.g., old mock IDs)
          const hasLegacyMock = parsed.some((s: any) => s.id === 'kurulus-osman' || s.id === 'teskilat' || s.id === 'alparslan' || s.id === 'cukurova');
          if (!hasLegacyMock) {
            return parsed;
          }
        }
      }
    } catch {}
    return DB_SHOWS;
  });

  const [feeds, setFeeds] = useState<FeedConfig[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_feeds_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem('cineflix_feeds_v2', JSON.stringify(DB_FEEDS));
    } catch {}
    return DB_FEEDS;
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    try {
      const saved = localStorage.getItem('cineflix_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    try {
      localStorage.setItem('cineflix_settings', JSON.stringify(DB_SETTINGS));
    } catch {}
    return DB_SETTINGS;
  });

  const platformName = adminSettings.platformName?.trim() || 'Dizi Urdu';

  // Listen to cross-tab platform name / branding change events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cineflix_settings' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed) {
            setAdminSettings((prev) => {
              if (JSON.stringify(prev) === JSON.stringify({ ...prev, ...parsed })) {
                return prev;
              }
              return { ...prev, ...parsed };
            });
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const cachedTime = localStorage.getItem('diziurdu_db_exported_at');
      if (!cachedTime || cachedTime !== currentBackupExportTime) {
        return DB_NOTIFICATIONS;
      }
      const saved = localStorage.getItem('cineflix_notifications');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DB_NOTIFICATIONS;
  });

  // Track page reload count in browser storage so that after 3 reloads it changes row arrangement
  const [reloadCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const current = parseInt(localStorage.getItem('dizi_reload_count') || '0', 10);
      const next = current + 1;
      localStorage.setItem('dizi_reload_count', String(next));
      return next;
    } catch {
      return 0;
    }
  });

  const arrangementCycle = Math.floor(reloadCount / 3);

  // Session-frozen feed clock: refreshes ONLY when user reloads/reopens the page (never mid-session)
  const [currentTimeSlot] = useState<number>(() => Date.now());

  useEffect(() => {
    localStorage.setItem('cineflix_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cineflix_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [likedShowIds, setLikedShowIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_liked_shows');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [heroShow, setHeroShow] = useState<Show | null>(shows[0] || null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryItem | null>(null);
  const [categoryRandomHeroShow, setCategoryRandomHeroShow] = useState<Show | null>(null);
  const [selectedShowForDetail, setSelectedShowForDetail] = useState<Show | null>(null);
  const selectedShowRef = useRef<Show | null>(null);
  const isClosingViaPopstateRef = useRef<boolean>(false);
  useEffect(() => {
    selectedShowRef.current = selectedShowForDetail;
  }, [selectedShowForDetail]);
  const [detailVideoMode, setDetailVideoMode] = useState<'trailer' | 'episode'>('trailer');
  const [detailSubView, setDetailSubView] = useState<'main' | 'cast' | 'blog'>('main');
  const [detailEpisodeId, setDetailEpisodeId] = useState<string | null>(null);
  const [detailTrailerId, setDetailTrailerId] = useState<string | null>(null);
  const [selectedActorForPool, setSelectedActorForPool] = useState<CastMember | null>(null);

  // Admin Categories state: synced with localStorage and admin categories tab
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    try {
      localStorage.setItem('cineflix_custom_categories', JSON.stringify(DB_CATEGORIES));
    } catch {}
    return DB_CATEGORIES;
  });

  // On localhost, automatically query the disk database on page load so any changes to full_backup.json take effect immediately
  useEffect(() => {
    fetch('/api/database')
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.shows) && data.shows.length > 0) {
          setShows(data.shows);
          if (Array.isArray(data.feeds)) setFeeds(data.feeds);
          if (data.adminSettings) setAdminSettings(data.adminSettings);
          if (Array.isArray(data.categoriesList)) setCategoriesList(data.categoriesList);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
          if (data.exported_at) {
            try {
              localStorage.setItem('diziurdu_db_exported_at', data.exported_at);
            } catch {}
          }
          try {
            localStorage.setItem('cineflix_shows', JSON.stringify(data.shows));
            if (Array.isArray(data.feeds)) localStorage.setItem('cineflix_feeds_v2', JSON.stringify(data.feeds));
            if (data.adminSettings) localStorage.setItem('cineflix_settings', JSON.stringify(data.adminSettings));
            if (Array.isArray(data.categoriesList)) localStorage.setItem('cineflix_custom_categories', JSON.stringify(data.categoriesList));
            if (Array.isArray(data.notifications)) localStorage.setItem('cineflix_notifications', JSON.stringify(data.notifications));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cineflix_custom_categories' && e.newValue) {
        try {
          setCategoriesList(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sync document title dynamically with platformName
  useEffect(() => {
    if (!selectedShowForDetail) {
      document.title = `${platformName} – Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas`;
    }
  }, [platformName, selectedShowForDetail]);

  // Pinned recommendations for Home, Series, and Movies that do NOT change on reload
  // Stable on page reload; refreshes after 10 minutes or on mobile triple tap of home button
  const [pageRecommendations, setPageRecommendations] = useState<{
    all: Show | null;
    series: Show | null;
    movies: Show | null;
  }>(() => {
    const initialPool: Show[] = shows.length > 0 ? shows : DB_SHOWS;
    const eligibleAll = initialPool.filter((s: Show) => s.is_recommended !== false);
    const poolAll = eligibleAll.length > 0 ? eligibleAll : initialPool;

    const eligibleSeries = initialPool.filter((s: Show) => s.type === 'series' && s.is_recommended !== false);
    const poolSeries = eligibleSeries.length > 0 ? eligibleSeries : initialPool.filter((s: Show) => s.type === 'series');

    const eligibleMovies = initialPool.filter((s: Show) => s.type === 'movie' && s.is_recommended !== false);
    const poolMovies = eligibleMovies.length > 0 ? eligibleMovies : initialPool.filter((s: Show) => s.type === 'movie');

    return {
      all: getPinnedOrRotatingRecommendation(poolAll, 'dizi_pinned_rec_all', false) || poolAll[0] || null,
      series: getPinnedOrRotatingRecommendation(poolSeries, 'dizi_pinned_rec_series', false) || poolSeries[0] || poolAll[0] || null,
      movies: getPinnedOrRotatingRecommendation(poolMovies, 'dizi_pinned_rec_movies', false) || poolMovies[0] || poolAll[0] || null,
    };
  });

  // Keep recommendations synced if shows updates without rotating if pinned show still exists
  useEffect(() => {
    setPageRecommendations((prev) => {
      const eligibleAll = shows.filter((s) => s.is_recommended !== false);
      const poolAll = eligibleAll.length > 0 ? eligibleAll : shows;

      const eligibleSeries = shows.filter((s) => s.type === 'series' && s.is_recommended !== false);
      const poolSeries = eligibleSeries.length > 0 ? eligibleSeries : shows.filter((s) => s.type === 'series');

      const eligibleMovies = shows.filter((s) => s.type === 'movie' && s.is_recommended !== false);
      const poolMovies = eligibleMovies.length > 0 ? eligibleMovies : shows.filter((s) => s.type === 'movie');

      const nextAll = (prev.all && poolAll.find((s) => s.id === prev.all?.id)) || getPinnedOrRotatingRecommendation(poolAll, 'dizi_pinned_rec_all', false) || poolAll[0] || null;
      const nextSeries = (prev.series && poolSeries.find((s) => s.id === prev.series?.id)) || getPinnedOrRotatingRecommendation(poolSeries, 'dizi_pinned_rec_series', false) || poolSeries[0] || poolAll[0] || null;
      const nextMovies = (prev.movies && poolMovies.find((s) => s.id === prev.movies?.id)) || getPinnedOrRotatingRecommendation(poolMovies, 'dizi_pinned_rec_movies', false) || poolMovies[0] || poolAll[0] || null;

      if (prev.all?.id === nextAll?.id && prev.series?.id === nextSeries?.id && prev.movies?.id === nextMovies?.id) {
        return prev;
      }

      return {
        all: nextAll,
        series: nextSeries,
        movies: nextMovies,
      };
    });
  }, [shows]);

  // Feed and row arrangement remain frozen for the entire session (only refreshed on page reload/reopen)

  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(() => {
    // Check if user navigated to admin panel via query param ?admin or hash #admin or path /admin
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      return (
        urlParams.get('admin') === '1' ||
        urlParams.get('admin') === 'true' ||
        urlParams.has('admin') ||
        hash === '#admin' ||
        pathname === '/admin'
      );
    }
    return false;
  });

  const [adminEditingFeedId, setAdminEditingFeedId] = useState<string | undefined>(undefined);
  const [selectedSpecialFeed, setSelectedSpecialFeed] = useState<{
    feed: FeedConfig;
    shows: Show[];
  } | null>(null);

  // Listen to popstate and hashchange so navigating to #admin or changing URL opens the admin panel immediately
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const shouldOpenAdmin =
        urlParams.get('admin') === '1' ||
        urlParams.get('admin') === 'true' ||
        urlParams.has('admin') ||
        hash === '#admin' ||
        pathname === '/admin';
      setIsAdminPanelOpen(shouldOpenAdmin);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Keyboard shortcut for administrator: Ctrl+Shift+A or Cmd+Shift+A
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsAdminPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isAppSettingsModalOpen, setIsAppSettingsModalOpen] = useState<boolean>(false);
  const [isRequestContentModalOpen, setIsRequestContentModalOpen] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  // User Profile state: pick first picture from first picture row as initial when not saved in local browser
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('cineflix_user_avatar');
      if (saved) return saved;
    } catch {}
    // Pick first picture from first picture row from full backup database
    const groups = (DB_PROFILE_GROUPS && DB_PROFILE_GROUPS.length > 0)
      ? DB_PROFILE_GROUPS
      : (((fullBackupData as any)?.profilePictureGroups) || []);
    const firstGroup = groups.find((g: any) => g.enabled !== false && !g.isHidden && Array.isArray(g.images) && g.images.length > 0) || groups[0];
    if (firstGroup) {
      if (Array.isArray(firstGroup.images) && firstGroup.images.length > 0) {
        return firstGroup.images[0];
      }
      if (Array.isArray((firstGroup as any).avatars) && (firstGroup as any).avatars.length > 0) {
        return (firstGroup as any).avatars[0]?.url || (firstGroup as any).avatars[0];
      }
    }
    return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=320&q=80';
  });

  // Keep chosen profile picture saved in local browser storage
  useEffect(() => {
    if (userAvatar) {
      try {
        localStorage.setItem('cineflix_user_avatar', userAvatar);
      } catch {}
    }
  }, [userAvatar]);

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_name') || '';
  });
  const [userHandle, setUserHandle] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_handle') || '';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_email') || '';
  });
  const [userWhatsapp, setUserWhatsapp] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_whatsapp') || '';
  });
  const [userPassword, setUserPassword] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_password') || '';
  });

  // Profile Lock State (4-digit PIN required on website visit when enabled)
  const [isProfileLocked, setIsProfileLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const isEnabled = localStorage.getItem('dizi_profile_lock_enabled') === 'true';
      const hasPin = Boolean(localStorage.getItem('dizi_profile_lock_pin'));
      const isSessionUnlocked = sessionStorage.getItem('dizi_profile_unlocked') === 'true';
      return isEnabled && hasPin && !isSessionUnlocked;
    } catch {
      return false;
    }
  });

  // Shared Title Desktop Page state (/share/:slug) & click origin metadata for exact card collapse animations
  const [sharedTitleShow, setSharedTitleShow] = useState<Show | null>(null);
  const [isShareOverlayClosing, setIsShareOverlayClosing] = useState<boolean>(false);
  const [isShareClosingGlareFading, setIsShareClosingGlareFading] = useState<boolean>(false);
  const sharedTitleShowRef = useRef<Show | null>(null);
  const shareBackStackRef = useRef<Show[]>([]);
  useEffect(() => {
    sharedTitleShowRef.current = sharedTitleShow;
    if (!sharedTitleShow) {
      setIsShareOverlayClosing(false);
      setIsShareClosingGlareFading(false);
    }
  }, [sharedTitleShow]);
  useEffect(() => {
    if (!isShareOverlayClosing) {
      setIsShareClosingGlareFading(false);
      return;
    }
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setIsShareClosingGlareFading(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [isShareOverlayClosing]);
  const [detailOriginMeta, setDetailOriginMeta] = useState<DetailsOriginMeta | null>(null);
  const [is404Page, setIs404Page] = useState<boolean>(false);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = window.location.pathname.replace(/\/+$/, '');
    return p === '/login' || p === '/signup';
  });
  const [loginInitialMode, setLoginInitialMode] = useState<'login' | 'create'>(() => {
    if (typeof window === 'undefined') return 'login';
    const p = window.location.pathname.replace(/\/+$/, '');
    return p === '/signup' ? 'create' : 'login';
  });
  const openedLoginFromSiteRef = useRef<boolean>(false);
  const pendingLoginLogoRectRef = useRef<DOMRect | null>(null);
  const [loginLogoGlide, setLoginLogoGlide] = useState<{
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
    dx: number;
    dy: number;
    targetScale: number;
    active: boolean;
  } | null>(null);
  const [isAlertPosterDismissed, setIsAlertPosterDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('dizi_alert_poster_dismissed') === 'true';
    } catch {
      return false;
    }
  });
  const [hasAlertLoadDelayElapsed, setHasAlertLoadDelayElapsed] = useState<boolean>(false);
  const [alertDelayTick, setAlertDelayTick] = useState<number>(0);
  const [alertDismissCount, setAlertDismissCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const parsed = parseInt(localStorage.getItem('dizi_alert_dismiss_count') || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });
  const [alertActionCount, setAlertActionCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const parsed = parseInt(localStorage.getItem('dizi_alert_action_count') || '0', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  });
  const alertActionTriggeredRef = useRef<boolean>(false);

  const [hasNarrowBarDelayElapsed, setHasNarrowBarDelayElapsed] = useState<boolean>(false);
  const [activeOverlayAd, setActiveOverlayAd] = useState<'none' | 'alert_poster' | 'narrow_bar'>('none');

  const resolveAdDelayMs = (
    mode: 'fixed' | 'random' | undefined,
    minSeconds: number | undefined,
    maxSeconds: number | undefined
  ): number => {
    const safeMin = Math.max(5, Number.isFinite(minSeconds as number) ? Number(minSeconds) : 5);
    if (mode === 'random') {
      const safeMax = Math.max(
        safeMin + 5,
        Number.isFinite(maxSeconds as number) ? Number(maxSeconds) : Math.max(safeMin + 15, 25)
      );
      return Math.round((safeMin + Math.random() * (safeMax - safeMin)) * 1000);
    }
    return safeMin * 1000;
  };

  useEffect(() => {
    setHasAlertLoadDelayElapsed(false);
    if (!adminSettings.alertPosterEnabled) return;
    const delayMs = resolveAdDelayMs(
      adminSettings.alertPosterDelayMode,
      adminSettings.alertPosterDelaySeconds ?? 5,
      adminSettings.alertPosterDelayMaxSeconds ?? 25
    );
    const timer = window.setTimeout(() => {
      setHasAlertLoadDelayElapsed(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [
    alertDelayTick,
    adminSettings.alertPosterEnabled,
    adminSettings.alertPosterDelayMode,
    adminSettings.alertPosterDelaySeconds,
    adminSettings.alertPosterDelayMaxSeconds
  ]);

  useEffect(() => {
    setHasNarrowBarDelayElapsed(false);
    if (!adminSettings.narrowAdBarEnabled) return;
    const delayMs = resolveAdDelayMs(
      adminSettings.narrowAdBarDelayMode,
      adminSettings.narrowAdBarDelaySeconds ?? 5,
      adminSettings.narrowAdBarDelayMaxSeconds ?? 25
    );
    const timer = window.setTimeout(() => {
      setHasNarrowBarDelayElapsed(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [
    alertDelayTick,
    adminSettings.narrowAdBarEnabled,
    adminSettings.narrowAdBarDelayMode,
    adminSettings.narrowAdBarDelaySeconds,
    adminSettings.narrowAdBarDelayMaxSeconds
  ]);

  useEffect(() => {
    const handleResetAlert = () => {
      try {
        sessionStorage.removeItem('dizi_alert_poster_dismissed');
        localStorage.removeItem('dizi_alert_dismiss_count');
        localStorage.removeItem('dizi_alert_action_count');
      } catch {}
      alertActionTriggeredRef.current = false;
      setAlertDismissCount(0);
      setAlertActionCount(0);
      setIsAlertPosterDismissed(false);
      setIsNarrowAdBarDismissed(false);
      setActiveOverlayAd('none');
      setAlertDelayTick((t) => t + 1);
    };
    window.addEventListener('dizi_alert_poster_reset', handleResetAlert);
    return () => window.removeEventListener('dizi_alert_poster_reset', handleResetAlert);
  }, []);

  // Open Login / Create Account page from an in-app navigation so Back returns to previous page
  const openLoginPage = (mode: 'login' | 'create' = 'login') => {
    openedLoginFromSiteRef.current = true;
    setLoginInitialMode(mode);
    setIsRecommendationPaused(true);
    setIsLoginPageOpen(true);
    try {
      const targetPath = mode === 'create' ? '/signup' : '/login';
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch {}
  };

  // When user clicks sign out (or Sign In from guest mode), open Login / Create Account page
  const handleSignOut = () => {
    try {
      sessionStorage.removeItem('dizi_profile_unlocked');
    } catch {}
    setIsLoggedIn(false);
    setIsProfileLocked(false);
    setIsMobileProfileOpen(false);
    setIsHamburgerDrawerOpen(false);
    setIsAdminPanelOpen(false);
    openLoginPage('login');
  };

  // Fullscreen Video Player state
  const [playingMedia, setPlayingMedia] = useState<{
    show: Show;
    videoUrl: string;
    videoSourceType?: VideoSourceType;
    title: string;
    subtitle?: string;
    episodeSubtitle?: string;
    titleLogoUrl?: string;
    previewThumbnailUrl?: string;
    startTime?: string;
    endTime?: string;
    playerBgImageUrl?: string;
    seasonNumber?: number;
    episodeNumber?: number;
    episodeId?: string;
    episodeTitle?: string;
    initialCurrentTime?: number;
    isTrailer?: boolean;
    hasNextEpisode?: boolean;
    nextEpisodeInfo?: {
      videoUrl: string;
      videoSourceType?: VideoSourceType;
      subtitle: string;
      episodeSubtitle: string;
      previewThumbnailUrl?: string;
      startTime?: string;
      endTime?: string;
      playerBgImageUrl?: string;
      seasonNumber: number;
      episodeNumber: number;
      episodeId?: string;
    } | null;
  } | null>(null);
  const playingMediaRef = useRef<typeof playingMedia>(null);
  const suppressNextPlayerPopRef = useRef<boolean>(false);
  useEffect(() => {
    playingMediaRef.current = playingMedia;
  }, [playingMedia]);

  const handleCloseFullPlayer = (skipHistoryBack?: boolean) => {
    playingMediaRef.current = null;
    setPlayingMedia(null);
    if (skipHistoryBack) return;
    try {
      if (window.history.state?.isFullPlayer) {
        suppressNextPlayerPopRef.current = true;
        window.history.back();
      }
    } catch {}
  };

  // User Watch Progress History in Local Storage with exact position tracking (clean empty state for fresh users)
  const [watchHistory, setWatchHistory] = useState<Record<string, WatchProgressItem>>(() => {
    try {
      const saved = localStorage.getItem('dizi_watch_history') || localStorage.getItem('cineflix_watch_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch {}
    return {};
  });

  // Keep watch history saved in local browser storage
  useEffect(() => {
    try {
      localStorage.setItem('dizi_watch_history', JSON.stringify(watchHistory));
      localStorage.setItem('cineflix_watch_history', JSON.stringify(watchHistory));
    } catch {}
  }, [watchHistory]);

  // Handle live progress updates from EmbedPlayerModal (YouTube/Dailymotion) or CustomPlayer (HTML5/HLS)
  // Progress features are strictly for episodes and movies only, not for trailers and more
  const handleProgressUpdate = (
    show: Show,
    currentTime: number,
    duration: number,
    seasonNumber?: number,
    episodeNumber?: number,
    episodeTitle?: string,
    episodeId?: string,
    videoUrl?: string,
    videoSourceType?: VideoSourceType,
    isTrailer?: boolean,
    rawVideoTime?: number
  ) => {
    if (isTrailer) return;
    if (show.type === 'series' && episodeNumber === undefined && !episodeId) return;
    if (!duration || duration <= 0) return;
    const progressPercent = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
    const epKey = episodeId || (episodeNumber !== undefined ? `s${seasonNumber || 1}e${episodeNumber}` : 'movie');

    setWatchHistory((prev) => {
      const existingShow = prev[show.id];
      if (
        existingShow &&
        Math.floor(existingShow.currentTime) === Math.floor(currentTime) &&
        existingShow.progressPercent === progressPercent &&
        existingShow.episodeId === episodeId
      ) {
        return prev;
      }
      const existingEpisodes = existingShow?.episodesProgress || {};

      const updatedEpisode: EpisodeProgressItem = {
        currentTime,
        duration,
        progressPercent,
        seasonNumber,
        episodeNumber,
        episodeId,
        episodeTitle,
        updatedAt: Date.now(),
        rawVideoTime: rawVideoTime !== undefined ? rawVideoTime : currentTime
      };

      // Check if this episode has been watched to >= 90%
      let nextEpisodePrompt: Episode | null = null;
      if (progressPercent >= 90 && show.type === 'series' && show.seasons && show.seasons.length > 0) {
        const curSea = show.seasons.find((s) => s.seasonNumber === (seasonNumber || 1)) || show.seasons[0];
        const epIdx = curSea.episodes.findIndex((e) => (episodeId && e.id === episodeId) || e.episodeNumber === episodeNumber);
        if (epIdx >= 0 && epIdx < curSea.episodes.length - 1) {
          nextEpisodePrompt = curSea.episodes[epIdx + 1];
        } else {
          // Check next season
          const seaIdx = show.seasons.findIndex((s) => s.seasonNumber === curSea.seasonNumber);
          if (seaIdx >= 0 && seaIdx < show.seasons.length - 1) {
            const nextSea = show.seasons[seaIdx + 1];
            if (nextSea.episodes && nextSea.episodes.length > 0) {
              nextEpisodePrompt = nextSea.episodes[0];
            }
          }
        }
      }

      // If episode was watched to 90%+ and has a next episode, prompt next episode with empty progress bar
      let updatedShow: WatchProgressItem;
      if (nextEpisodePrompt) {
        const nextStart = parseTimeToSeconds(nextEpisodePrompt.startTime) || 0;
        const nextDur = parseTimeToSeconds(nextEpisodePrompt.duration) || 45 * 60;
        updatedShow = {
          showId: show.id,
          showTitle: show.title,
          seasonNumber: nextEpisodePrompt.seasonNumber || seasonNumber || 1,
          episodeNumber: nextEpisodePrompt.episodeNumber,
          episodeId: nextEpisodePrompt.id,
          episodeTitle: nextEpisodePrompt.title,
          videoUrl: nextEpisodePrompt.videoUrl,
          videoSourceType: nextEpisodePrompt.videoSourceType,
          currentTime: 0,
          duration: nextDur,
          progressPercent: 0,
          updatedAt: Date.now(),
          thumbnailUrl: nextEpisodePrompt.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl,
          completed: false,
          isNextEpisodePrompt: true,
          rawVideoTime: nextStart,
          episodesProgress: {
            ...existingEpisodes,
            [epKey]: {
              ...updatedEpisode,
              completed: true
            }
          }
        };
      } else {
        updatedShow = {
          showId: show.id,
          showTitle: show.title,
          seasonNumber: seasonNumber !== undefined ? seasonNumber : existingShow?.seasonNumber,
          episodeNumber: episodeNumber !== undefined ? episodeNumber : existingShow?.episodeNumber,
          episodeId: episodeId || existingShow?.episodeId,
          episodeTitle: episodeTitle || existingShow?.episodeTitle,
          videoUrl: videoUrl || existingShow?.videoUrl || show.trailerUrl,
          videoSourceType: videoSourceType || existingShow?.videoSourceType,
          currentTime,
          duration,
          progressPercent,
          updatedAt: Date.now(),
          thumbnailUrl: existingShow?.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl,
          completed: progressPercent >= 95,
          isNextEpisodePrompt: false,
          rawVideoTime: rawVideoTime !== undefined ? rawVideoTime : currentTime,
          episodesProgress: {
            ...existingEpisodes,
            [epKey]: updatedEpisode
          }
        };
      }

      const next = {
        ...prev,
        [show.id]: updatedShow
      };

      try {
        localStorage.setItem('dizi_watch_history', JSON.stringify(next));
        localStorage.setItem('cineflix_watch_history', JSON.stringify(next));
      } catch {}

      return next;
    });
  };

  const initialShowsRef = useRef(shows);
  const initialWatchlistRef = useRef(watchlist);
  const initialWatchHistoryRef = useRef(watchHistory);

  const recordWatchProgress = (
    show: Show,
    seasonNumber?: number,
    episodeNumber?: number,
    episodeTitle?: string,
    videoUrl?: string,
    videoSourceType?: VideoSourceType,
    thumbnailUrl?: string,
    episodeId?: string,
    rawVideoTime?: number
  ) => {
    const epKey = episodeId || (episodeNumber !== undefined ? `s${seasonNumber || 1}e${episodeNumber}` : 'movie');
    setWatchHistory((prev) => {
      const existing = prev[show.id];
      const epExisting = existing?.episodesProgress?.[epKey];
      const updatedShow: WatchProgressItem = {
        showId: show.id,
        showTitle: show.title,
        seasonNumber: seasonNumber !== undefined ? seasonNumber : existing?.seasonNumber,
        episodeNumber: episodeNumber !== undefined ? episodeNumber : existing?.episodeNumber,
        episodeTitle: episodeTitle || existing?.episodeTitle,
        episodeId: episodeId || existing?.episodeId,
        videoUrl: videoUrl || existing?.videoUrl || show.trailerUrl,
        videoSourceType: videoSourceType || existing?.videoSourceType,
        currentTime: epExisting?.currentTime || 0,
        duration: epExisting?.duration || 0,
        progressPercent: epExisting?.progressPercent || 0,
        updatedAt: Date.now(),
        thumbnailUrl: thumbnailUrl || existing?.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl,
        episodesProgress: existing?.episodesProgress || {},
        rawVideoTime: rawVideoTime !== undefined ? rawVideoTime : epExisting?.rawVideoTime
      };
      const next = { ...prev, [show.id]: updatedShow };
      try {
        localStorage.setItem('dizi_watch_history', JSON.stringify(next));
        localStorage.setItem('cineflix_watch_history', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleClearWatchlist = () => {
    setWatchlist([]);
    initialWatchlistRef.current = [];
    try {
      localStorage.removeItem('cineflix_watchlist');
      localStorage.removeItem('dizi_watchlist');
      localStorage.setItem('cineflix_watchlist', '[]');
      localStorage.setItem('dizi_watchlist', '[]');
    } catch {}
  };

  const handleClearWatchHistory = () => {
    setWatchHistory({});
    initialWatchHistoryRef.current = {};
    try {
      localStorage.removeItem('cineflix_watch_history');
      localStorage.removeItem('dizi_watch_history');
      localStorage.setItem('cineflix_watch_history', '{}');
      localStorage.setItem('dizi_watch_history', '{}');
    } catch {}
  };

  const handleRemoveFromWatchHistory = (showId: string) => {
    setWatchHistory((prev) => {
      const updated = { ...prev };
      delete updated[showId];
      try {
        localStorage.setItem('cineflix_watch_history', JSON.stringify(updated));
        localStorage.setItem('dizi_watch_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const [isRecommendationPaused, setIsRecommendationPaused] = useState<boolean>(false);

  // Global Audio Mute state synced across all previews on website
  // Remembers if the user intentionally pressed mute across page reloads
  const [isGlobalMuted, setIsGlobalMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const explicitMute = localStorage.getItem('dizi_user_explicit_mute');
    if (explicitMute !== null) {
      return explicitMute === 'true';
    }
    const legacyMute = localStorage.getItem('cineflix_global_muted');
    if (legacyMute !== null) {
      return legacyMute === 'true';
    }
    return false; // Default: sound enabled!
  });

  const handleToggleGlobalMute = (forcedValue?: boolean) => {
    setIsGlobalMuted((prev) => {
      const next = forcedValue !== undefined ? forcedValue : !prev;
      localStorage.setItem('dizi_user_explicit_mute', String(next));
      localStorage.setItem('cineflix_global_muted', String(next));
      return next;
    });
  };

  // Global Audio Unlocker:
  // When user preference is unmuted (!isGlobalMuted), immediately unlock AudioContext
  // and unmute active video previews without requiring any user gesture.
  useEffect(() => {
    if (isGlobalMuted) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
    } catch {}

    const unlockAllActiveVideos = () => {
      try {
        const allVideos = document.querySelectorAll<HTMLVideoElement>('video');
        allVideos.forEach((v) => {
          if (v && v.muted && !v.closest('[data-custom-player]')) {
            v.muted = false;
            v.volume = 1.0;
          }
        });
      } catch {}
    };

    unlockAllActiveVideos();
    setTimeout(unlockAllActiveVideos, 80);
    setTimeout(unlockAllActiveVideos, 400);

    const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'wheel'];
    const handleGesture = () => {
      unlockAllActiveVideos();
      gestureEvents.forEach((e) => window.removeEventListener(e, handleGesture, { capture: true }));
    };

    gestureEvents.forEach((e) =>
      window.addEventListener(e, handleGesture, { capture: true, passive: true, once: true })
    );

    return () => {
      gestureEvents.forEach((e) => window.removeEventListener(e, handleGesture, { capture: true }));
    };
  }, [isGlobalMuted]);

  // Feed card hover preview coordination: stops recommendation preview when user points to any feed card
  const [isFeedCardHovered, setIsFeedCardHovered] = useState<boolean>(false);

  const [activeFilter, setActiveFilter] = useState<'all' | 'series' | 'movies' | 'categories' | 'watchlist'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam === 'series' || tabParam === 'movies' || tabParam === 'categories') {
          return tabParam;
        }
        const saved = sessionStorage.getItem('cineflix_active_filter');
        if (saved === 'series' || saved === 'movies' || saved === 'categories' || saved === 'all') {
          return saved as any;
        }
      } catch {}
    }
    return 'all';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileScrolled, setIsMobileScrolled] = useState<boolean>(false);
  const [mobileHeaderOpacity, setMobileHeaderOpacity] = useState<number>(0);

  // Mobile and Tablet layout detection & states (preserves Mobile UI when phones rotate to landscape)
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth;
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => detectIsMobileDevice());
  const [isTablet, setIsTablet] = useState<boolean>(() => detectIsTabletDevice());
  // Session-frozen homepage row seed: refreshes on reload/reopen, never shifts while user browses
  const [sessionRowSeed] = useState<number>(() =>
    ((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0) || 1337
  );
  const [isNarrowAdBarDismissed, setIsNarrowAdBarDismissed] = useState<boolean>(false);
  const browseScrollYRef = useRef<number>(0);

  const currentDeviceLayout: 'desktop' | 'tablet' | 'mobile' = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop';
  const currentAdDeviceLayout: AdDeviceLayout = isTablet
    ? 'tablet'
    : isMobile
    ? 'mobile'
    : windowWidth >= 1440
    ? 'desktop'
    : 'laptop';

  const matchesAdLayout = (layouts?: AdDeviceLayout[]): boolean => {
    const list = layouts && layouts.length > 0 ? layouts : (['desktop', 'laptop', 'tablet', 'mobile'] as AdDeviceLayout[]);
    if (list.includes(currentAdDeviceLayout)) return true;
    // Backwards compatibility: if a legacy config only stored 'desktop' without mentioning 'laptop', honor it on laptop unless user explicitly edited layouts
    if (currentAdDeviceLayout === 'laptop' && list.includes('desktop') && layouts === undefined) return true;
    return false;
  };

  const alertMaxDismissCount = adminSettings.alertPosterMaxDismissCount ?? 0;
  const alertMaxActionCount = adminSettings.alertPosterMaxActionCount ?? 0;
  const isAlertSuppressedByLimits =
    (alertMaxDismissCount > 0 && alertDismissCount >= alertMaxDismissCount) ||
    (alertMaxActionCount > 0 && alertActionCount >= alertMaxActionCount);
  const isOnEpisodePage = Boolean(playingMedia);

  const isAlertPosterEligible =
    Boolean(adminSettings.alertPosterEnabled) &&
    hasAlertLoadDelayElapsed &&
    !isAlertPosterDismissed &&
    !isAlertSuppressedByLimits &&
    !isProfileLocked &&
    !isLoginPageOpen &&
    !isAdminPanelOpen &&
    !isOnEpisodePage &&
    matchesAdLayout(adminSettings.alertPosterLayouts);

  const isNarrowAdBarEligible =
    Boolean(adminSettings.narrowAdBarEnabled) &&
    hasNarrowBarDelayElapsed &&
    !isNarrowAdBarDismissed &&
    !isProfileLocked &&
    !isLoginPageOpen &&
    !isAdminPanelOpen &&
    !isOnEpisodePage &&
    matchesAdLayout(adminSettings.narrowAdBarLayouts);

  // Strict mutual exclusion: Alert Banner & Narrow Ad Bar NEVER display at the same time (and NEVER on Episode page)
  useEffect(() => {
    if (activeOverlayAd === 'alert_poster' && !isAlertPosterEligible) {
      setActiveOverlayAd(isNarrowAdBarEligible ? 'narrow_bar' : 'none');
      return;
    }
    if (activeOverlayAd === 'narrow_bar' && !isNarrowAdBarEligible) {
      setActiveOverlayAd(isAlertPosterEligible ? 'alert_poster' : 'none');
      return;
    }
    if (activeOverlayAd === 'none') {
      if (isAlertPosterEligible) {
        setActiveOverlayAd('alert_poster');
      } else if (isNarrowAdBarEligible) {
        setActiveOverlayAd('narrow_bar');
      }
    }
  }, [activeOverlayAd, isAlertPosterEligible, isNarrowAdBarEligible]);

  const isAlertPosterActive = activeOverlayAd === 'alert_poster' && isAlertPosterEligible;
  const isNarrowAdBarActive = activeOverlayAd === 'narrow_bar' && isNarrowAdBarEligible;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsMobile(detectIsMobileDevice());
      setIsTablet(detectIsTabletDevice());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (vv) vv.removeEventListener('resize', handleResize);
    };
  }, []);

  // Strictly block pinch-zoom, multi-touch zoom, and double-tap zoom across all screens in mobile layout
  useEffect(() => {
    if (!isMobile) return;
    let lastTouchEnd = 0;

    const handleTouchStartZoomBlock = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const handleTouchMoveZoomBlock = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const handleTouchEndZoomBlock = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };
    const handleGestureZoomBlock = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', handleTouchStartZoomBlock, { passive: false });
    document.addEventListener('touchmove', handleTouchMoveZoomBlock, { passive: false });
    document.addEventListener('touchend', handleTouchEndZoomBlock, { passive: false });
    document.addEventListener('gesturestart', handleGestureZoomBlock, { passive: false } as any);
    document.addEventListener('gesturechange', handleGestureZoomBlock, { passive: false } as any);
    document.addEventListener('gestureend', handleGestureZoomBlock, { passive: false } as any);

    return () => {
      document.removeEventListener('touchstart', handleTouchStartZoomBlock);
      document.removeEventListener('touchmove', handleTouchMoveZoomBlock);
      document.removeEventListener('touchend', handleTouchEndZoomBlock);
      document.removeEventListener('gesturestart', handleGestureZoomBlock);
      document.removeEventListener('gesturechange', handleGestureZoomBlock);
      document.removeEventListener('gestureend', handleGestureZoomBlock);
    };
  }, [isMobile]);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState<boolean>(false);
  const [actionSheetShow, setActionSheetShow] = useState<Show | null>(null);
  const [isMobileSeasonPickerOpen, setIsMobileSeasonPickerOpen] = useState<boolean>(false);
  const [isMobileProfileEditOpen, setIsMobileProfileEditOpen] = useState<boolean>(false);
  const [isMobileInfoSheetOpen, setIsMobileInfoSheetOpen] = useState<boolean>(false);
  const [customHeroShow, setCustomHeroShow] = useState<Show | null>(null);
  const [categoriesResetKey, setCategoriesResetKey] = useState<number>(0);
  const [selectedCategoryFromGenre, setSelectedCategoryFromGenre] = useState<CategoryItem | null>(null);
  const [selectedGenreView, setSelectedGenreView] = useState<GenreItem | CategoryItem | null>(null);
  const genreReturnScrollRef = useRef<number>(0);
  const [isHamburgerDrawerOpen, setIsHamburgerDrawerOpen] = useState<boolean>(false);
  const [drawerDedicatedView, setDrawerDedicatedView] = useState<'top_10_movies' | 'top_10_series' | 'vertical_my_list' | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [mobileTop10ShareShow, setMobileTop10ShareShow] = useState<Show | null>(null);
  const [isCategoriesDetailOpen, setIsCategoriesDetailOpen] = useState<boolean>(false);
  const [desktopSearchTermFilter, setDesktopSearchTermFilter] = useState<string>('');
  const [desktopCommittedExactQuery, setDesktopCommittedExactQuery] = useState<string>('');
  const searchExploreStripRef = useRef<HTMLDivElement>(null);
  const lastHomeClickTimeRef = useRef<number>(0);

  // Global homepage background-preview pause flag (when any overlay, modal, drawer, or search/profile sheet is active)
  const isHomepagePreviewPaused = Boolean(
    isMobileProfileOpen ||
      isMobileSearchOpen ||
      isAccountModalOpen ||
      isAppSettingsModalOpen ||
      isRequestContentModalOpen ||
      isDownloadModalOpen ||
      isWatchlistModalOpen ||
      isHamburgerDrawerOpen ||
      isLoginPageOpen ||
      isProfileLocked ||
      isAlertPosterActive ||
      playingMedia ||
      selectedShowForDetail ||
      (sharedTitleShow && !isMobile) ||
      actionSheetShow ||
      selectedActorForPool ||
      selectedSpecialFeed ||
      selectedGenreView ||
      isRecommendationPaused
  );

  const pushRoute = (path: string, replace = false) => {
    if (typeof window === 'undefined') return;
    try {
      const current = `${window.location.pathname}${window.location.search}`;
      if (current === path) return;
      if (replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    } catch {}
  };

  const handleGoHome = () => {
    // Return to home without changing recommendation (only mobile triple tap reloads/rotates)
    setIs404Page(false);
    setDrawerDedicatedView(null);
    setSelectedShowForDetail(null);
    setSharedTitleShow(null);
    setDetailOriginMeta(null);
    setIsMobileSearchOpen(false);
    setIsMobileProfileOpen(false);
    setIsAccountModalOpen(false);
    setIsAppSettingsModalOpen(false);
    setSelectedSpecialFeed(null);
    setSelectedCategoryFilter(null);
    setSelectedCategoryFromGenre(null);
    setSelectedGenreView(null);
    setIsCategoriesDetailOpen(false);
    setDesktopSearchTermFilter('');
    setDesktopCommittedExactQuery('');
    setSearchQuery('');
    if (activeFilter !== 'all') {
      setActiveFilter('all');
      try {
        sessionStorage.setItem('cineflix_active_filter', 'all');
      } catch {}
    }
    pushRoute('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTripleTapHome = () => {
    // In mobile layout, triple tap to home button reloads/rotates recommendation and feed arrangement
    const eligibleAll = shows.filter((s) => s.is_recommended !== false);
    const poolAll = eligibleAll.length > 0 ? eligibleAll : shows;
    const nextShow = getPinnedOrRotatingRecommendation(poolAll, 'dizi_pinned_rec_all', true) || poolAll[0] || null;

    setPageRecommendations((prev) => ({
      ...prev,
      all: nextShow
    }));
    setCustomHeroShow(nextShow);
    initialWatchlistRef.current = watchlist;
    initialWatchHistoryRef.current = watchHistory;

    try {
      const current = parseInt(localStorage.getItem('dizi_reload_count') || '0', 10);
      localStorage.setItem('dizi_reload_count', String(current + 3));
    } catch {}

    setDrawerDedicatedView(null);
    setSelectedShowForDetail(null);
    setSharedTitleShow(null);
    setIsMobileSearchOpen(false);
    setIsMobileProfileOpen(false);
    setSelectedSpecialFeed(null);
    setSelectedCategoryFilter(null);
    setSelectedGenreView(null);
    setIsCategoriesDetailOpen(false);
    setDesktopSearchTermFilter('');
    setDesktopCommittedExactQuery('');
    setSearchQuery('');
    setActiveFilter('all');
    pushRoute('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMobileSelectTab = (tab: 'home' | 'search' | 'profile' | 'trends') => {
    if (tab === 'trends') return;
    setActionSheetShow(null);
    if (tab === 'home') {
      setSelectedShowForDetail(null);
      setIsMobileProfileOpen(false);
      setIsMobileSearchOpen(false);
      handleGoHome();
    } else if (tab === 'search') {
      setSelectedShowForDetail(null);
      setIsMobileProfileOpen(false);
      setIsMobileSearchOpen(true);
      pushRoute(searchQuery.trim() ? `/search?q=${encodeURIComponent(searchQuery.trim())}` : '/search');
    } else if (tab === 'profile') {
      setSelectedShowForDetail(null);
      setIsMobileSearchOpen(false);
      setIsMobileProfileOpen(true);
      pushRoute('/profile');
    }
  };

  // Page Scroll Positions: remembers scroll position per page so switching always loads from where left
  const pageScrollPositionsRef = useRef<Record<string, number>>({
    all: 0,
    series: 0,
    movies: 0,
    categories: 0,
    watchlist: 0
  });
  const activeFilterRef = useRef(activeFilter);
  const preSearchScrollRef = useRef<number>(0);

  // Checks if user has scrolled down past 2 lines of regular feed
  const checkTwoFeedLinesScrolled = (): boolean => {
    const feedStrips = document.querySelectorAll('[data-feed-strip]');
    if (feedStrips.length >= 2) {
      const secondStrip = feedStrips[1] as HTMLElement;
      const rect = secondStrip.getBoundingClientRect();
      const secondStripBottomDocY = rect.bottom + window.scrollY;
      return window.scrollY >= secondStripBottomDocY - 120;
    }
    return window.scrollY > 950;
  };

  // Continuously track scroll position for the current page:
  // If user scrolled down more than 2 lines of regular feed on home, series, or movies page,
  // preserve the position; otherwise (less than 2 lines scrolled) reset to 0 (loads from top).
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsMobileScrolled(scrollY > 10);
      const opacity = Math.min(0.9, (scrollY / 384) * 0.9);
      setMobileHeaderOpacity(opacity);
      if (!selectedShowForDetail && !playingMedia && !searchQuery) {
        const current = activeFilterRef.current;
        if (current === 'all' || current === 'series' || current === 'movies') {
          if (checkTwoFeedLinesScrolled()) {
            pageScrollPositionsRef.current[current] = window.scrollY;
          } else {
            pageScrollPositionsRef.current[current] = 0;
          }
        } else {
          pageScrollPositionsRef.current[current] = window.scrollY;
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedShowForDetail, playingMedia, searchQuery]);

  // When switching between pages, load always from where left if > 2 lines were scrolled, else from top
  useEffect(() => {
    activeFilterRef.current = activeFilter;
    const targetScroll = pageScrollPositionsRef.current[activeFilter] ?? 0;

    const restore = () => {
      window.scrollTo({
        top: targetScroll,
        left: 0,
        behavior: 'instant'
      });
    };

    const rafId = requestAnimationFrame(restore);
    const timeoutId = setTimeout(restore, 30);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [activeFilter]);

  // Lock background body scrolling when mobile hamburger menu drawer is open
  useEffect(() => {
    if (isHamburgerDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isHamburgerDrawerOpen]);

  const handleSelectPage = (target: 'all' | 'series' | 'movies' | 'categories' | 'watchlist' | 'trends') => {
    setIs404Page(false);
    setDrawerDedicatedView(null);
    if (target === 'trends') return;
    if (target === 'all') {
      handleGoHome();
      return;
    }
    setSharedTitleShow(null);
    setDetailOriginMeta(null);
    if (target === 'categories') {
      setSelectedCategoryFromGenre(null);
      setIsCategoriesDetailOpen(false);
      setCategoriesResetKey((prev) => prev + 1);
    }
    setSelectedCategoryFilter(null);
    setSelectedSpecialFeed(null);
    setSelectedGenreView(null);
    setDesktopSearchTermFilter('');
    setDesktopCommittedExactQuery('');
    setSearchQuery('');
    if (activeFilter !== target) {
      if (activeFilter === 'all' || activeFilter === 'series' || activeFilter === 'movies') {
        if (checkTwoFeedLinesScrolled()) {
          pageScrollPositionsRef.current[activeFilter] = window.scrollY;
        } else {
          pageScrollPositionsRef.current[activeFilter] = 0;
        }
      } else {
        pageScrollPositionsRef.current[activeFilter] = window.scrollY;
      }
      setActiveFilter(target);
      try {
        sessionStorage.setItem('cineflix_active_filter', target);
      } catch {}
    } else {
      window.scrollTo({ top: pageScrollPositionsRef.current[target] || 0, behavior: 'instant' });
    }
    const routeMap: Record<string, string> = {
      series: '/series',
      movies: '/movies',
      categories: '/categories',
      watchlist: '/mylist'
    };
    pushRoute(routeMap[target] || '/');
  };

  const handleEditCuratedFeed = (feedId: string) => {
    setAdminEditingFeedId(feedId);
    setIsAdminPanelOpen(true);
  };

  const handleExploreSpecialFeed = (feed: FeedConfig, feedShows: Show[]) => {
    const targetCatKey = feed.specialExploreCategory || (feed.categoryKey && feed.categoryKey !== 'custom' ? feed.categoryKey : 'historical-ottoman');
    const cat =
      (categoriesList || CATEGORIES_DATA).find(
        (c) => c.id === targetCatKey || c.name.toLowerCase() === targetCatKey.toLowerCase()
      ) ||
      CATEGORIES_DATA[0];

    const catNameLower = cat.name.toLowerCase();
    const catIdLower = cat.id.toLowerCase();

    const assignedShows = (feed.showIds || [])
      .map((id) => shows.find((s) => s.id === id))
      .filter((s): s is Show => Boolean(s));

    const matches = shows.filter((s) => {
      if (Array.isArray(s.categories) && s.categories.length > 0) {
        return s.categories.some((c) => c.toLowerCase() === catNameLower || c.toLowerCase() === catIdLower);
      }
      const showGenreStr = (s.genres || []).join(' ').toLowerCase();
      const titleStr = s.title.toLowerCase();
      const descStr = (s.shortDescription + ' ' + (s.synopsis || '')).toLowerCase();
      const kwList = (cat.genreKeywords && cat.genreKeywords.length > 0)
        ? cat.genreKeywords
        : cat.name.toLowerCase().split(/[ &,-]+/).filter(Boolean);
      return kwList.some((kw) => showGenreStr.includes(kw.toLowerCase()) || titleStr.includes(kw.toLowerCase()) || descStr.includes(kw.toLowerCase()));
    });

    const combined = [...feedShows];
    for (const s of [...assignedShows, ...matches]) {
      if (!combined.some((item) => item.id === s.id)) {
        combined.push(s);
      }
    }

    const finalShows = combined.length > 0 ? combined : shows;

    setSelectedCategoryFilter(null);
    setSelectedSpecialFeed({
      feed,
      shows: finalShows
    });
    pushRoute(`/collection/${encodeURIComponent(feed.id)}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectCategoryCard = (category: CategoryItem) => {
    setSelectedCategoryFilter(category);
    setSelectedSpecialFeed(null);
    setActiveFilter('categories');
    const catNameLower = category.name.toLowerCase();
    const catIdLower = category.id.toLowerCase();
    const matches = shows.filter((s) => {
      if (Array.isArray(s.categories) && s.categories.length > 0) {
        return s.categories.some((c) => c.toLowerCase() === catNameLower || c.toLowerCase() === catIdLower);
      }
      const showGenreStr = (s.genres || []).join(' ').toLowerCase();
      const titleStr = s.title.toLowerCase();
      const descStr = (s.shortDescription + ' ' + (s.synopsis || '')).toLowerCase();
      const kwList = (category.genreKeywords && category.genreKeywords.length > 0)
        ? category.genreKeywords
        : category.name.toLowerCase().split(/[ &,-]+/).filter(Boolean);
      return kwList.some((kw) => showGenreStr.includes(kw.toLowerCase()) || titleStr.includes(kw.toLowerCase()) || descStr.includes(kw.toLowerCase()));
    });
    const eligible = matches.filter((s) => s.is_recommended !== false);
    const pool = eligible.length > 0 ? eligible : matches;
    if (pool.length > 0) {
      const randomIdx = Math.floor(Math.random() * pool.length);
      setCategoryRandomHeroShow(pool[randomIdx]);
    }
    const slug = category.id || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    pushRoute(`/categories/${encodeURIComponent(slug)}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSearchChange = (query: string) => {
    if (!searchQuery && query) {
      preSearchScrollRef.current = window.scrollY;
    }
    if (query.trim() && sharedTitleShow) {
      setSharedTitleShow(null);
    }
    if (query.trim() && selectedGenreView) {
      setSelectedGenreView(null);
    }
    setDesktopSearchTermFilter('');
    setDesktopCommittedExactQuery('');
    setSearchQuery(query);
    if (query.trim()) {
      pushRoute(`/search?q=${encodeURIComponent(query.trim())}`, true);
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (!query && searchQuery) {
      const fallbackRoute =
        activeFilter === 'series'
          ? '/series'
          : activeFilter === 'movies'
          ? '/movies'
          : activeFilter === 'categories'
          ? '/categories'
          : activeFilter === 'watchlist'
          ? '/mylist'
          : '/';
      pushRoute(fallbackRoute, true);
      requestAnimationFrame(() => {
        window.scrollTo({ top: preSearchScrollRef.current, behavior: 'instant' });
      });
    }
  };

  const handleClearSearch = () => {
    setDesktopSearchTermFilter('');
    setDesktopCommittedExactQuery('');
    setSearchQuery('');
    const fallbackRoute =
      activeFilter === 'series'
        ? '/series'
        : activeFilter === 'movies'
        ? '/movies'
        : activeFilter === 'categories'
        ? '/categories'
        : activeFilter === 'watchlist'
        ? '/mylist'
        : '/';
    pushRoute(fallbackRoute);
    requestAnimationFrame(() => {
      window.scrollTo({ top: preSearchScrollRef.current, behavior: 'instant' });
    });
  };

  // Save changes to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('cineflix_shows', JSON.stringify(shows));
  }, [shows]);

  useEffect(() => {
    localStorage.setItem('cineflix_feeds_v2', JSON.stringify(feeds));
  }, [feeds]);

  useEffect(() => {
    localStorage.setItem('cineflix_settings', JSON.stringify(adminSettings));
    if (adminSettings.useCustomLogo && adminSettings.customLogoUrl) {
      localStorage.setItem('cineflix_custom_logo', adminSettings.customLogoUrl);
    } else {
      localStorage.removeItem('cineflix_custom_logo');
    }
    window.dispatchEvent(new Event('cineflix_branding_change'));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem('cineflix_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem('cineflix_liked_shows', JSON.stringify(likedShowIds));
    } catch {}
  }, [likedShowIds]);

  // Toggle watchlist: only updates watchlist state during session, feed content does not change until next reload!
  const handleToggleWatchlist = (showId: string) => {
    const isAdding = !watchlist.includes(showId);
    setWatchlist((prev) =>
      isAdding ? [...prev, showId] : prev.filter((id) => id !== showId)
    );
  };

  const handleToggleLike = (showId: string) => {
    setLikedShowIds((prev) =>
      prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
    );
  };

  // Play Button Click / Interaction: Adds +1 point with timestamped log entry
  const handleIncrementPoints = (showId: string) => {
    const now = Date.now();
    setShows((prev) =>
      prev.map((s) => {
        if (s.id !== showId) return s;
        const currentPlays = s.play_events || [];
        // Keep logs clean (last 500 events)
        const updatedPlays = [...currentPlays.slice(-499), { timestamp: now }];
        return {
          ...s,
          points: s.points + 1,
          all_time_score: (s.all_time_score || s.points) + 1,
          play_events: updatedPlays
        };
      })
    );
  };

  // Helper to sync page title, meta tags, Open Graph, and Twitter preview tags
  const setMetaTags = (title: string, description: string, image?: string, url?: string) => {
    document.title = title;
    const setMeta = (prop: string, val: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let el = document.querySelector(`meta[${attr}="${prop}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    setMeta('og:title', title);
    setMeta('og:description', description);
    if (image) setMeta('og:image', image);
    if (url) setMeta('og:url', url);

    setMeta('twitter:title', title, true);
    setMeta('twitter:description', description, true);
    if (image) setMeta('twitter:image', image, true);
  };

  // Helper to build clean, simplified URLs:
  // Multi-season: /watch/:slug/s1/e1
  // Single-season: /watch/:slug/e1 (omits season as requested!)
  // Movie / Show: /watch/:slug
  const buildCleanWatchUrl = (
    show: Show,
    episodeId?: string | null,
    options?: { subView?: string; trailerId?: string | null }
  ): string => {
    const slug = show.slug || show.id || show.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const totalSeasons = show.seasons?.length || (show.type === 'series' ? 1 : 0);

    let path = `/watch/${slug}`;

    if (episodeId && show.seasons) {
      let foundEp: any = null;
      let foundSeasonNum = 1;
      for (const s of show.seasons) {
        const ep = s.episodes?.find((e: any) => e.id === episodeId);
        if (ep) {
          foundEp = ep;
          foundSeasonNum = s.seasonNumber || ep.seasonNumber || 1;
          break;
        }
      }

      if (foundEp) {
        const epNum = foundEp.episodeNumber || 1;
        if (totalSeasons > 1) {
          path = `/watch/${slug}/s${foundSeasonNum}/e${epNum}`;
        } else {
          path = `/watch/${slug}/e${epNum}`;
        }
      }
    }

    const queryParams = new URLSearchParams();
    if (options?.subView === 'blog') queryParams.set('tab', 'blog');
    else if (options?.subView === 'cast') queryParams.set('tab', 'cast');
    if (options?.trailerId) queryParams.set('trailer', options.trailerId);

    const qs = queryParams.toString();
    return qs ? `${path}?${qs}` : path;
  };

  // Open Details Modal (or Full Size More Info Page on desktop when enabled by admin) & update address bar
  const handleOpenDetails = (
    show: Show,
    mode: 'trailer' | 'episode' = 'trailer',
    subView: 'main' | 'cast' | 'blog' = 'main',
    episodeId?: string | null,
    trailerId?: string | null,
    originMeta?: DetailsOriginMeta
  ) => {
    isClosingViaPopstateRef.current = false;
    setIs404Page(false);
    setDetailOriginMeta(originMeta || { sourceFeedType: 'other' });
    const slug = show.slug || show.id || show.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const liveShow = shows.find((s) => s.id === show.id) || show;
    const { shareTitle, shareDescription, linkPreviewImage } = resolveShowShareMeta(liveShow, platformName, isMobile);
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

    if (!isMobile && adminSettings.useFullSizeMoreInfoByDefault) {
      if (sharedTitleShowRef.current && sharedTitleShowRef.current.id !== liveShow.id) {
        shareBackStackRef.current.push(sharedTitleShowRef.current);
      } else if (!sharedTitleShowRef.current) {
        browseScrollYRef.current = window.scrollY;
        shareBackStackRef.current = [];
      }
      setSelectedShowForDetail(null);
      setIsShareOverlayClosing(false);
      setSharedTitleShow(liveShow);
      window.scrollTo({ top: 0, behavior: 'instant' });
      try {
        const cleanUrl = buildCleanWatchUrl(liveShow, episodeId, { subView, trailerId });
        const cur = `${window.location.pathname}${window.location.search}`;
        if (cur !== cleanUrl) {
          window.history.pushState({ showId: liveShow.id, slug, fullSizeMoreInfo: true }, '', cleanUrl);
        }
        setMetaTags(shareTitle, shareDescription, linkPreviewImage, `${currentOrigin}${cleanUrl}`);
      } catch {}
      return;
    }

    setDetailVideoMode(mode);
    setDetailSubView(subView);
    setDetailEpisodeId(episodeId || null);
    setDetailTrailerId(trailerId || null);
    setSelectedShowForDetail(liveShow);

    try {
      const cleanUrl = buildCleanWatchUrl(liveShow, episodeId, { subView, trailerId });
      const cur = `${window.location.pathname}${window.location.search}`;
      if (cur !== cleanUrl) {
        window.history.pushState({ showId: liveShow.id, slug }, '', cleanUrl);
      }
      const canonicalShareUrl = `${currentOrigin}${cleanUrl}`;
      setMetaTags(shareTitle, shareDescription, linkPreviewImage, canonicalShareUrl);
    } catch {}
  };

  const handleCloseDetails = (skipHistoryPush?: boolean) => {
    const shouldSkipPush = Boolean(skipHistoryPush || isClosingViaPopstateRef.current);
    isClosingViaPopstateRef.current = false;
    setSelectedShowForDetail(null);
    setDetailOriginMeta(null);
    setDetailSubView('main');
    setDetailEpisodeId(null);
    setDetailTrailerId(null);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    try {
      if (!shouldSkipPush) {
        window.history.pushState(null, '', '/');
      }
      setMetaTags(
        `${platformName} – Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas`,
        `Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas on ${platformName}.`,
        `${window.location.origin}/favicon/android-chrome-512x512.png`,
        window.location.origin
      );
    } catch {}
  };

  // Sub-view change listener for trailers, blog, cast, and episodes (uses replaceState so Back closes modal in 1 gesture)
  const handleSubViewChange = (
    view: 'main' | 'cast' | 'blog',
    meta?: { episode?: Episode | null; trailer?: TrailerItem | null }
  ) => {
    setDetailSubView(view);
    if (!selectedShowForDetail) return;
    try {
      const cleanUrl = buildCleanWatchUrl(
        selectedShowForDetail,
        meta?.episode?.id || null,
        { subView: view, trailerId: meta?.trailer?.id || null }
      );
      const cur = `${window.location.pathname}${window.location.search}`;
      if (cur !== cleanUrl) {
        window.history.replaceState(null, '', cleanUrl);
      }

      if (view === 'blog') {
        setMetaTags(
          `${selectedShowForDetail.blog.heading} – ${platformName}`,
          selectedShowForDetail.blog.sections[0]?.content || selectedShowForDetail.shortDescription,
          selectedShowForDetail.blog.heroImage || selectedShowForDetail.posterLandscapeUrl,
          window.location.origin + cleanUrl
        );
      } else if (view === 'cast') {
        setMetaTags(
          `${selectedShowForDetail.title} – Cast & Characters – ${platformName}`,
          `Explore the cast and characters of ${selectedShowForDetail.title}`,
          selectedShowForDetail.posterLandscapeUrl,
          window.location.origin + cleanUrl
        );
      } else if (meta?.episode) {
        const epTitle = `${selectedShowForDetail.title} S${meta.episode.seasonNumber || 1}:E${meta.episode.episodeNumber} "${meta.episode.title}"`;
        setMetaTags(
          `${epTitle} – ${platformName}`,
          meta.episode.synopsis || meta.episode.subheading || selectedShowForDetail.shortDescription,
          meta.episode.thumbnailUrl || selectedShowForDetail.posterLandscapeUrl,
          window.location.origin + cleanUrl
        );
      } else if (meta?.trailer) {
        const trTitle = `${meta.trailer.title} – ${selectedShowForDetail.title} Trailer`;
        setMetaTags(
          `${trTitle} – ${platformName}`,
          `Watch official trailer for ${selectedShowForDetail.title}`,
          meta.trailer.thumbnailUrl || selectedShowForDetail.posterLandscapeUrl,
          window.location.origin + cleanUrl
        );
      } else {
        const liveDetail = shows.find((s) => s.id === selectedShowForDetail.id) || selectedShowForDetail;
        const { shareTitle, shareDescription, linkPreviewImage } = resolveShowShareMeta(liveDetail, platformName, isMobile);
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        setMetaTags(
          shareTitle,
          shareDescription,
          linkPreviewImage,
          currentOrigin + cleanUrl
        );
      }
    } catch {}
  };

  // Ephemeral Actor Pool modal: intentionally NOT pushed to browser history so Back gesture never re-opens closed actor cards
  const handleSelectActorForPool = (actor: CastMember) => {
    setSelectedActorForPool(actor);
  };

  const handleCloseActorPool = () => {
    setSelectedActorForPool(null);
  };

  // Keep desktop More Info UI synced with admin panel setting
  useEffect(() => {
    if (!isMobile && adminSettings.useFullSizeMoreInfoByDefault && selectedShowForDetail) {
      const targetShow = selectedShowForDetail;
      setSelectedShowForDetail(null);
      setIsShareOverlayClosing(false);
      setSharedTitleShow(targetShow);
    } else if (!isMobile && !adminSettings.useFullSizeMoreInfoByDefault && sharedTitleShow) {
      const targetShow = sharedTitleShow;
      setSharedTitleShow(null);
      setSelectedShowForDetail(targetShow);
    }
  }, [isMobile, adminSettings.useFullSizeMoreInfoByDefault, selectedShowForDetail, sharedTitleShow]);

  // Shareable URL slug listener: /watch/:slug and /share/:slug both open in the admin-selected More Info design
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const wasPlayingFullPlayer = Boolean(playingMediaRef.current);
        if (suppressNextPlayerPopRef.current) {
          suppressNextPlayerPopRef.current = false;
        } else if (wasPlayingFullPlayer && !window.history.state?.isFullPlayer) {
          const ev = new CustomEvent('dizi-player-system-back', { cancelable: true });
          window.dispatchEvent(ev);
          if (!ev.defaultPrevented) {
            setPlayingMedia(null);
          }
        }

        // CRITICAL: When directly playing a video (isFullPlayer history entry), NEVER mount More Info underneath
        // (e.g. when handleIncrementPoints updates `shows` or right before history.back() completes).
        if (window.history.state?.isFullPlayer) {
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const watchParam = urlParams.get('watch');
        const shareParam = urlParams.get('share');
        const episodeParam = urlParams.get('episode');
        const trailerParam = urlParams.get('trailer');
        const tabParam = urlParams.get('tab');
        const actorParam = urlParams.get('actor');

        const pathname = window.location.pathname;
        const normalizedPathname = pathname.replace(/\/+$/, '') || '/';
        if (normalizedPathname === '/login' || normalizedPathname === '/signup') {
          setIs404Page(false);
          setLoginInitialMode(normalizedPathname === '/signup' ? 'create' : 'login');
          setIsLoginPageOpen(true);
          return;
        }
        setIsLoginPageOpen(false);
        let pathTitleSlug: string | null = null;
        let pathSeasonNumber: number | null = null;
        let pathEpisodeNumber: number | null = null;

        const shareMatch = pathname.match(/^\/share\/([^/]+)\/?$/i);
        const multiSeasonMatch = pathname.match(/^\/watch\/([^/]+)\/s([0-9]+)\/e([0-9]+)\/?$/i);
        const singleSeasonMatch = pathname.match(/^\/watch\/([^/]+)\/e([0-9]+)\/?$/i);
        const showOnlyMatch = pathname.match(/^\/watch\/([^/]+)\/?$/i);

        if (shareMatch) {
          pathTitleSlug = decodeURIComponent(shareMatch[1]);
        } else if (multiSeasonMatch) {
          pathTitleSlug = decodeURIComponent(multiSeasonMatch[1]);
          pathSeasonNumber = parseInt(multiSeasonMatch[2], 10);
          pathEpisodeNumber = parseInt(multiSeasonMatch[3], 10);
        } else if (singleSeasonMatch) {
          pathTitleSlug = decodeURIComponent(singleSeasonMatch[1]);
          pathSeasonNumber = 1;
          pathEpisodeNumber = parseInt(singleSeasonMatch[2], 10);
        } else if (showOnlyMatch) {
          pathTitleSlug = decodeURIComponent(showOnlyMatch[1]);
        } else if (pathname.startsWith('/watch/') || pathname.startsWith('/share/')) {
          shareBackStackRef.current = [];
          setSharedTitleShow(null);
          setSelectedShowForDetail(null);
          setIs404Page(true);
          return;
        }

        if (actorParam) {
          const foundActor = shows.flatMap((s) => s.cast).find(
            (c) =>
              c.id.toLowerCase() === actorParam.toLowerCase() ||
              c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === actorParam.toLowerCase()
          );
          if (foundActor) {
            setSelectedActorForPool(foundActor);
          }
        } else {
          setSelectedActorForPool((prev) => (prev ? null : prev));
        }

        const effectiveTitleTarget = pathTitleSlug || watchParam || shareParam;

        if (effectiveTitleTarget) {
          const matched = shows.find(
            (s) =>
              s.id.toLowerCase() === effectiveTitleTarget.toLowerCase() ||
              s.slug?.toLowerCase() === effectiveTitleTarget.toLowerCase() ||
              s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === effectiveTitleTarget.toLowerCase()
          );
          if (matched) {
            let resolvedEpId = episodeParam || null;
            if (pathEpisodeNumber !== null && matched.seasons) {
              for (const sea of matched.seasons) {
                if (pathSeasonNumber === null || sea.seasonNumber === pathSeasonNumber) {
                  const ep = sea.episodes?.find((e: any) => e.episodeNumber === pathEpisodeNumber);
                  if (ep) {
                    resolvedEpId = ep.id;
                    break;
                  }
                }
              }
            }

            const isMobileScreen = detectIsMobileDevice();
            if (!isMobileScreen && adminSettings.useFullSizeMoreInfoByDefault) {
              const isReturningToSameShare = sharedTitleShowRef.current?.id === matched.id;
              if (
                shareBackStackRef.current.length > 0 &&
                shareBackStackRef.current[shareBackStackRef.current.length - 1].id === matched.id
              ) {
                shareBackStackRef.current.pop();
              }
              setSelectedShowForDetail(null);
              setIsShareOverlayClosing(false);
              setSharedTitleShow(matched);
              setIs404Page(false);
              if (!isReturningToSameShare) {
                const scroller = document.querySelector<HTMLElement>('[data-share-overlay-scroll="true"]');
                if (scroller) scroller.scrollTop = 0;
              }
            } else {
              shareBackStackRef.current = [];
              setSharedTitleShow(null);
              setSelectedShowForDetail(matched);
              setIs404Page(false);
              setDetailEpisodeId(resolvedEpId || null);
              setDetailTrailerId(trailerParam || null);
              if (tabParam === 'blog' || tabParam === 'cast') {
                setDetailSubView(tabParam);
              } else {
                setDetailSubView('main');
              }
              if (resolvedEpId) {
                setDetailVideoMode('episode');
              } else {
                setDetailVideoMode('trailer');
              }
            }

            const { shareTitle, shareDescription, linkPreviewImage } = resolveShowShareMeta(matched, platformName, isMobileScreen);
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const cleanUrl = buildCleanWatchUrl(matched, resolvedEpId, { subView: tabParam || undefined, trailerId: trailerParam });
            setMetaTags(shareTitle, shareDescription, linkPreviewImage, currentOrigin + cleanUrl);
            return;
          } else {
            shareBackStackRef.current = [];
            setSharedTitleShow(null);
            setSelectedShowForDetail(null);
            setIs404Page(true);
            return;
          }
        } else {
          shareBackStackRef.current = [];
          let handledShareAnim = false;
          if (sharedTitleShowRef.current) {
            const ev = new CustomEvent('dizi-share-system-back', { cancelable: true });
            window.dispatchEvent(ev);
            if (ev.defaultPrevented) {
              handledShareAnim = true;
            }
          }
          if (!handledShareAnim) {
            setSharedTitleShow((prev) => (prev ? null : prev));
          }

          let handledWithAnimation = false;
          if (selectedShowRef.current) {
            const ev = new CustomEvent('dizi-detail-system-back', { cancelable: true });
            window.dispatchEvent(ev);
            if (ev.defaultPrevented) {
              handledWithAnimation = true;
              isClosingViaPopstateRef.current = true;
            }
          }
          if (!handledWithAnimation) {
            setSelectedShowForDetail((prev) => (prev ? null : prev));
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }
        }

        // Hydrate full page URL routes (Home, Series, Movies, Categories, Category Slug, My List, Top 10, Collection, Search, Profile, Account, Settings)
        if (!pathname.startsWith('/watch/') && !pathname.startsWith('/share/') && !pathname.startsWith('/admin')) {
          const cleanPath = pathname.replace(/\/+$/, '') || '/';
          if (cleanPath === '/series') {
            setIs404Page(false);
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedCategoryFromGenre(null);
            setSelectedGenreView(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('series');
          } else if (cleanPath === '/movies') {
            setIs404Page(false);
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedCategoryFromGenre(null);
            setSelectedGenreView(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('movies');
          } else if (cleanPath === '/categories') {
            setIs404Page(false);
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedCategoryFromGenre(null);
            setSelectedGenreView(null);
            setIsCategoriesDetailOpen(false);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('categories');
          } else if (cleanPath.startsWith('/categories/')) {
            const catSlug = decodeURIComponent(cleanPath.slice('/categories/'.length)).toLowerCase();
            const foundCat = (categoriesList || CATEGORIES_DATA).find(
              (c) =>
                c.id.toLowerCase() === catSlug ||
                c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === catSlug ||
                c.name.toLowerCase() === catSlug
            );
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedGenreView(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('categories');
            if (foundCat) {
              setIs404Page(false);
              setSelectedCategoryFromGenre(foundCat);
              setIsCategoriesDetailOpen(true);
            } else {
              setIs404Page(true);
            }
          } else if (cleanPath.startsWith('/genre/')) {
            const genreSlug = decodeURIComponent(cleanPath.slice('/genre/'.length)).toLowerCase();
            const managed = (adminSettings.managedGenres || []).filter((g) => g.enabled !== false);
            const pool: Array<GenreItem | CategoryItem> = [
              ...managed.map((g) => ({
                id: g.id,
                name: g.name,
                displayName: g.displayName || g.name.toUpperCase(),
                imageUrl: g.imageUrl || '',
                keywords: g.keywords && g.keywords.length > 0 ? g.keywords : [g.name.toLowerCase()]
              })),
              ...DEFAULT_GENRES,
              ...(categoriesList || CATEGORIES_DATA)
            ];
            const foundGenre = pool.find(
              (g) =>
                g.id.toLowerCase() === genreSlug ||
                g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === genreSlug ||
                g.name.toLowerCase() === genreSlug
            );
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedCategoryFromGenre(null);
            setIsCategoriesDetailOpen(false);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            if (foundGenre) {
              setIs404Page(false);
              setSelectedGenreView(foundGenre);
            } else {
              setSelectedGenreView({
                id: genreSlug,
                name: genreSlug.replace(/-/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
                displayName: genreSlug.replace(/-/g, ' ').toUpperCase(),
                imageUrl: '',
                keywords: [genreSlug.replace(/-/g, ' ')]
              });
              setIs404Page(false);
            }
          } else if (cleanPath === '/mylist') {
            setIs404Page(false);
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedGenreView(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('watchlist');
          } else if (cleanPath === '/mylist/saved') {
            setIs404Page(false);
            setSelectedSpecialFeed(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setDrawerDedicatedView('vertical_my_list');
          } else if (cleanPath === '/top10/movies') {
            setIs404Page(false);
            setSelectedSpecialFeed(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setDrawerDedicatedView('top_10_movies');
          } else if (cleanPath === '/top10/series') {
            setIs404Page(false);
            setSelectedSpecialFeed(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setDrawerDedicatedView('top_10_series');
          } else if (cleanPath.startsWith('/collection/')) {
            const feedId = decodeURIComponent(cleanPath.slice('/collection/'.length));
            const foundFeed = feeds.find((f) => f.id === feedId);
            setDrawerDedicatedView(null);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            if (foundFeed) {
              setIs404Page(false);
              const feedShows = (foundFeed.showIds || [])
                .map((id) => shows.find((s) => s.id === id))
                .filter((s): s is Show => Boolean(s));
              setSelectedSpecialFeed({ feed: foundFeed, shows: feedShows.length > 0 ? feedShows : shows });
            } else {
              setIs404Page(true);
            }
          } else if (cleanPath === '/search') {
            setIs404Page(false);
            const qParam = urlParams.get('q') || '';
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery(qParam);
            if (detectIsMobileDevice()) {
              setIsMobileSearchOpen(true);
            }
          } else if (cleanPath === '/profile') {
            setIs404Page(false);
            setIsMobileSearchOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setIsMobileProfileOpen(true);
          } else if (cleanPath === '/account') {
            setIs404Page(false);
            setIsAppSettingsModalOpen(false);
            if (isLoggedIn) {
              setIsAccountModalOpen(true);
            } else {
              setIsAccountModalOpen(false);
              setLoginInitialMode('login');
              setIsLoginPageOpen(true);
            }
          } else if (cleanPath === '/settings') {
            setIs404Page(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(true);
          } else if (cleanPath === '/' && !effectiveTitleTarget) {
            setIs404Page(false);
            setDrawerDedicatedView(null);
            setSelectedSpecialFeed(null);
            setSelectedCategoryFilter(null);
            setSelectedCategoryFromGenre(null);
            setSelectedGenreView(null);
            setIsCategoriesDetailOpen(false);
            setIsMobileSearchOpen(false);
            setIsMobileProfileOpen(false);
            setIsAccountModalOpen(false);
            setIsAppSettingsModalOpen(false);
            setSearchQuery('');
            setActiveFilter('all');
          } else if (cleanPath !== '/') {
            setIs404Page(true);
          }
        }
      } catch {}
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [shows, feeds, categoriesList]);

  // Cleanly restore body scroll whenever no overlay modals, players, or PIN lock screens are open.
  // Full-Size Desktop More Info and Login Page run in primary document flow so desktop NEVER shows a 2nd scrollbar.
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      selectedShowForDetail ||
      playingMedia ||
      selectedActorForPool ||
      isAdminPanelOpen ||
      isAccountModalOpen ||
      isAppSettingsModalOpen ||
      isRequestContentModalOpen ||
      isWatchlistModalOpen ||
      isDownloadModalOpen ||
      isMobileSearchOpen ||
      isMobileProfileOpen ||
      isProfileLocked ||
      isAlertPosterActive
    );
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
  }, [
    selectedShowForDetail,
    playingMedia,
    selectedActorForPool,
    isAdminPanelOpen,
    isAccountModalOpen,
    isAppSettingsModalOpen,
    isRequestContentModalOpen,
    isWatchlistModalOpen,
    isDownloadModalOpen,
    isMobileSearchOpen,
    isMobileProfileOpen,
    isProfileLocked,
    isAlertPosterActive
  ]);

  // Restore saved browse scroll position immediately when Full-Size Desktop More Info starts sliding back down
  useEffect(() => {
    if (isShareOverlayClosing && !isMobile) {
      const savedY = browseScrollYRef.current;
      window.scrollTo({ top: savedY, behavior: 'instant' });
    }
  }, [isShareOverlayClosing, isMobile]);

  // Restore saved browse scroll position when returning from Full-Size Desktop More Info
  const prevSharedTitleRef = useRef<Show | null>(null);
  useEffect(() => {
    if (prevSharedTitleRef.current && !sharedTitleShow && !isMobile) {
      const savedY = browseScrollYRef.current;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      });
    }
    prevSharedTitleRef.current = sharedTitleShow;
  }, [sharedTitleShow, isMobile]);

  // Post-login center logo glide animation into Home / Profile navbar logo (never when going to Profile PIN screen)
  useEffect(() => {
    if (isLoginPageOpen || isProfileLocked || !pendingLoginLogoRectRef.current) return;
    const startRect = pendingLoginLogoRectRef.current;
    pendingLoginLogoRectRef.current = null;

    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;
    let clearTimer: number | null = null;

    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const candidates = Array.from(
          document.querySelectorAll<HTMLElement>('[data-brand-logo-target="true"]')
        );
        const visibleTarget = candidates.find((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });

        const startCenterX = startRect.left + startRect.width / 2;
        const startCenterY = startRect.top + startRect.height / 2;

        let dx = 0;
        let dy = 28 - startCenterY;
        let targetScale = 0.72;

        if (visibleTarget) {
          const targetRect = visibleTarget.getBoundingClientRect();
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const targetCenterY = targetRect.top + targetRect.height / 2;
          dx = targetCenterX - startCenterX;
          dy = targetCenterY - startCenterY;
          targetScale = Math.max(0.45, Math.min(1.4, targetRect.height / Math.max(1, startRect.height)));
        } else {
          dx = window.innerWidth / 2 - startCenterX;
        }

        setLoginLogoGlide({
          startLeft: startRect.left,
          startTop: startRect.top,
          startWidth: startRect.width,
          startHeight: startRect.height,
          dx,
          dy,
          targetScale,
          active: false
        });

        raf3 = window.requestAnimationFrame(() => {
          setLoginLogoGlide((prev) => (prev ? { ...prev, active: true } : null));
        });

        clearTimer = window.setTimeout(() => {
          setLoginLogoGlide(null);
        }, 620);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.cancelAnimationFrame(raf3);
      if (clearTimer !== null) window.clearTimeout(clearTimer);
    };
  }, [isLoginPageOpen, isProfileLocked]);

  // Media Resource Protection:
  // Prevents saving images/videos, opening in new tab via context menu or drag, copying addresses, and Ctrl+S
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (
        target.tagName === 'IMG' ||
        target.tagName === 'VIDEO' ||
        target.closest('img') ||
        target.closest('video') ||
        target.closest('[data-media-protected]') ||
        (target instanceof Element && window.getComputedStyle(target).backgroundImage !== 'none')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('img') || target.closest('video')) {
        e.preventDefault();
        return false;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  // Play show: plays explicit episode if clicked, else resumes from watch history or plays first episode
  const handlePlayShow = (show: Show, explicitEpisode?: Episode | null) => {
    handleIncrementPoints(show.id);
    const hasExplicitEp = Boolean(
      explicitEpisode &&
        typeof explicitEpisode === 'object' &&
        ('episodeNumber' in explicitEpisode || 'id' in explicitEpisode)
    );
    const hasEpisodes =
      show.type === 'series' &&
      show.hasEpisodicContent !== false &&
      show.seasons &&
      show.seasons.length > 0 &&
      show.seasons[0].episodes.length > 0;
    const firstEp = hasEpisodes ? show.seasons![0].episodes[0] : null;

    // Check if user has watch history for this show to resume where left off
    const historyItem = watchHistory[show.id];
    let chosenEp = hasExplicitEp ? explicitEpisode! : firstEp;
    let initialSeekTime = 0;

    if (hasExplicitEp && explicitEpisode) {
      const epKey =
        explicitEpisode.id ||
        `s${explicitEpisode.seasonNumber || 1}e${explicitEpisode.episodeNumber}`;
      const epProgress = historyItem?.episodesProgress?.[epKey];
      const startSec = parseTimeToSeconds(explicitEpisode.startTime) || 0;
      const isSameEpisodeAsHistory = Boolean(
        historyItem &&
          ((historyItem.episodeId && historyItem.episodeId === explicitEpisode.id) ||
            (historyItem.episodeNumber &&
              historyItem.episodeNumber === explicitEpisode.episodeNumber &&
              (!historyItem.seasonNumber ||
                historyItem.seasonNumber === (explicitEpisode.seasonNumber || 1))))
      );

      if (epProgress?.rawVideoTime !== undefined && epProgress.rawVideoTime > 0) {
        initialSeekTime = epProgress.rawVideoTime;
      } else if (epProgress?.currentTime && epProgress.currentTime > 0) {
        initialSeekTime = startSec + epProgress.currentTime;
      } else if (
        isSameEpisodeAsHistory &&
        historyItem?.rawVideoTime !== undefined &&
        historyItem.rawVideoTime > 0
      ) {
        initialSeekTime = historyItem.rawVideoTime;
      } else if (
        isSameEpisodeAsHistory &&
        historyItem?.currentTime &&
        historyItem.currentTime > 0
      ) {
        initialSeekTime = startSec + historyItem.currentTime;
      } else {
        initialSeekTime = startSec;
      }
    } else if (historyItem) {
      if (show.seasons && show.seasons.length > 0) {
        for (const sea of show.seasons) {
          const match = sea.episodes.find(
            (e) =>
              (historyItem.episodeId && e.id === historyItem.episodeId) ||
              (historyItem.episodeNumber &&
                e.episodeNumber === historyItem.episodeNumber &&
                (!historyItem.seasonNumber || sea.seasonNumber === historyItem.seasonNumber))
          );
          if (match) {
            chosenEp = match;
            break;
          }
        }
      }

      const epKey =
        chosenEp?.id ||
        (chosenEp?.episodeNumber !== undefined
          ? `s${chosenEp?.seasonNumber || 1}e${chosenEp?.episodeNumber}`
          : 'movie');
      const epProgress = historyItem.episodesProgress?.[epKey];
      const startSec = parseTimeToSeconds(chosenEp?.startTime) || 0;

      if (epProgress?.rawVideoTime !== undefined && epProgress.rawVideoTime > 0) {
        initialSeekTime = epProgress.rawVideoTime;
      } else if (epProgress?.currentTime && epProgress.currentTime > 0) {
        initialSeekTime = startSec + epProgress.currentTime;
      } else if (historyItem.rawVideoTime !== undefined && historyItem.rawVideoTime > 0) {
        initialSeekTime = historyItem.rawVideoTime;
      } else if (historyItem.currentTime && historyItem.currentTime > 0) {
        initialSeekTime = startSec + historyItem.currentTime;
      } else {
        initialSeekTime = startSec;
      }
    }

    const activeEp = chosenEp || firstEp;

    // Find next episode relative to activeEp
    let secondEp = null;
    if (activeEp && show.seasons && show.seasons.length > 0) {
      const currentSeason = show.seasons.find((sea) => sea.seasonNumber === (activeEp.seasonNumber || 1)) || show.seasons[0];
      const epIndex = currentSeason.episodes.findIndex((e) => e.id === activeEp.id);
      if (epIndex >= 0 && epIndex < currentSeason.episodes.length - 1) {
        secondEp = currentSeason.episodes[epIndex + 1];
      }
    }

    // If source is direct target link, only load trailer
    const isTargetLink =
      (show.type === 'movie' && (show.movieStreamType === 'external' || (show as any).movieStreamType === 'target_link')) ||
      Boolean(activeEp && (activeEp.videoSourceType === 'external' || (activeEp as any).videoSourceType === 'target_link'));

    const effectiveVideoUrl = isTargetLink
      ? (show.trailerUrl || show.hoverPreviewUrl || '')
      : activeEp
      ? activeEp.videoUrl
      : (show.movieStreamUrl || show.trailerUrl || show.hoverPreviewUrl || '');

    const effectiveSourceType: VideoSourceType = isTargetLink
      ? 'direct'
      : activeEp
      ? (activeEp.videoSourceType || 'direct')
      : (show.movieStreamType || 'direct');

    const title = show.title;
    const epSubtitle = isTargetLink
      ? 'Official Trailer'
      : activeEp
      ? activeEp.subheading
        ? `S${activeEp.seasonNumber || 1}: E${activeEp.episodeNumber} "${activeEp.title}" • ${activeEp.subheading}`
        : `S${activeEp.seasonNumber || 1}: E${activeEp.episodeNumber} "${activeEp.title}"`
      : show.type === 'movie'
      ? `${show.releaseYear.split('-')[0]} • Full Movie`
      : 'Official Preview';

    try {
      const slug = show.slug || show.id || show.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const prePlayerUrl = `${window.location.pathname}${window.location.search}`;
      const cleanUrl = buildCleanWatchUrl(
        show,
        activeEp && !isTargetLink ? activeEp.id : null,
        { trailerId: isTargetLink ? 'main' : null }
      );
      window.history.pushState(
        { ...(window.history.state || {}), showId: show.id, slug, isFullPlayer: true, prePlayerUrl },
        '',
        cleanUrl
      );
      setMetaTags(
        `${show.title} – Watch on ${platformName}`,
        show.shortDescription || show.synopsis,
        show.posterLandscapeUrl || show.backdropUrl,
        window.location.origin + cleanUrl
      );
    } catch {}

    // Record user watch history progress: ONLY for episodes and movies, NEVER for trailers
    if (activeEp && !isTargetLink) {
      recordWatchProgress(
        show,
        activeEp.seasonNumber,
        activeEp.episodeNumber,
        activeEp.title,
        effectiveVideoUrl,
        effectiveSourceType,
        activeEp.thumbnailUrl,
        activeEp.id
      );
    } else if (show.type === 'movie' && !isTargetLink) {
      recordWatchProgress(
        show,
        undefined,
        undefined,
        'Full Movie',
        effectiveVideoUrl,
        effectiveSourceType,
        show.posterLandscapeUrl || show.backdropUrl
      );
    }

    const nextMedia = {
      show,
      videoUrl: effectiveVideoUrl,
      videoSourceType: effectiveSourceType,
      title,
      subtitle: epSubtitle,
      episodeSubtitle: epSubtitle,
      titleLogoUrl: show.titleLogoUrl,
      previewThumbnailUrl: activeEp?.thumbnailUrl || show.posterLandscapeUrl || show.backdropUrl,
      startTime: activeEp?.startTime,
      endTime: activeEp?.endTime,
      initialCurrentTime: initialSeekTime,
      isTrailer: Boolean(isTargetLink),
      playerBgImageUrl: activeEp?.playerBgImageUrl || show.backdropUrl,
      seasonNumber: activeEp?.seasonNumber,
      episodeNumber: activeEp?.episodeNumber,
      episodeId: activeEp?.id,
      episodeTitle: activeEp?.title,
      hasNextEpisode: Boolean(secondEp),
      nextEpisodeInfo: secondEp
        ? {
            videoUrl: secondEp.videoUrl,
            videoSourceType: secondEp.videoSourceType,
            subtitle: secondEp.subheading
              ? `S${secondEp.seasonNumber || 1}: E${secondEp.episodeNumber} "${secondEp.title}" • ${secondEp.subheading}`
              : `S${secondEp.seasonNumber || 1}: E${secondEp.episodeNumber} "${secondEp.title}"`,
            episodeSubtitle: secondEp.subheading
              ? `S${secondEp.seasonNumber || 1}: E${secondEp.episodeNumber} "${secondEp.title}" • ${secondEp.subheading}`
              : `S${secondEp.seasonNumber || 1}: E${secondEp.episodeNumber} "${secondEp.title}"`,
            previewThumbnailUrl: secondEp.thumbnailUrl,
            startTime: secondEp.startTime,
            endTime: secondEp.endTime,
            playerBgImageUrl: secondEp.playerBgImageUrl || show.backdropUrl,
            seasonNumber: secondEp.seasonNumber,
            episodeNumber: secondEp.episodeNumber
          }
        : null
    };
    playingMediaRef.current = nextMedia;
    setPlayingMedia(nextMedia);
  };

  // Update show blog
  const handleUpdateShowBlog = (showId: string, updatedBlog: Show['blog']) => {
    setShows((prev) =>
      prev.map((s) => (s.id === showId ? { ...s, blog: updatedBlog } : s))
    );
    if (selectedShowForDetail && selectedShowForDetail.id === showId) {
      setSelectedShowForDetail((prev) => (prev ? { ...prev, blog: updatedBlog } : null));
    }
  };

  // Autocomplete suggestion pool (ordered by popularity/points: show titles first, then Turkish titles, genres, cast)
  const searchSuggestions = useMemo(() => {
    const sorted = [...shows].sort((a, b) => (b.points || 0) - (a.points || 0));
    const terms: string[] = [];
    const seen = new Set<string>();
    const add = (val?: string) => {
      if (!val) return;
      const clean = val.trim();
      if (!clean || seen.has(clean.toLowerCase())) return;
      seen.add(clean.toLowerCase());
      terms.push(clean);
    };
    sorted.forEach((s) => {
      add(s.title);
      add(s.turkishTitle);
      s.supportingTitles?.forEach(add);
    });
    sorted.forEach((s) => {
      s.genres?.forEach(add);
      s.categories?.forEach(add);
      s.cast?.slice(0, 2).forEach((c) => add(c.name));
    });
    return terms;
  }, [shows]);

  // Search filtering: Exact matches, Related matches, "More to explore" terms/genres, and Exact Spotlight detection
  const {
    exactSearchShows,
    searchFeed1Shows,
    searchFeed2Shows,
    exactDesktopSpotlightShow,
    desktopExploreTerms,
    desktopGridShows,
    desktopGridHeading
  } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return {
        exactSearchShows: [],
        searchFeed1Shows: [],
        searchFeed2Shows: [],
        exactDesktopSpotlightShow: null as Show | null,
        desktopExploreTerms: [] as Array<{ label: string; kind: 'title' | 'genre' }>,
        desktopGridShows: [] as Show[],
        desktopGridHeading: ''
      };
    }

    const exact = shows.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(query);
      const realTitleMatch = Boolean(s.turkishTitle && s.turkishTitle.toLowerCase().includes(query));
      const supportingMatch = Boolean(s.supportingTitles && s.supportingTitles.some((st) => st.toLowerCase().includes(query)));
      const logoTextMatch = Boolean(
        (s.logoText && s.logoText.toLowerCase().includes(query)) ||
        (s.logoSubtext && s.logoSubtext.toLowerCase().includes(query))
      );
      const tagCategoryMatch = Boolean(s.categories && s.categories.some((cat) => cat.toLowerCase().includes(query)));
      const vibeMatch = Boolean(s.thisSeriesIs && s.thisSeriesIs.some((vibe) => vibe.toLowerCase().includes(query)));
      const castMatch = s.cast.some((c) => c.name.toLowerCase().includes(query) || c.character.toLowerCase().includes(query));
      const genreMatch = s.genres.some((g) => g.toLowerCase().includes(query));
      const descMatch = s.shortDescription.toLowerCase().includes(query) || s.synopsis.toLowerCase().includes(query);
      return titleMatch || realTitleMatch || supportingMatch || logoTextMatch || tagCategoryMatch || vibeMatch || castMatch || genreMatch || descMatch;
    });

    exact.sort((a, b) => {
      const aExact = a.title.toLowerCase() === query || a.turkishTitle?.toLowerCase() === query;
      const bExact = b.title.toLowerCase() === query || b.turkishTitle?.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = a.title.toLowerCase().startsWith(query);
      const bStarts = b.title.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.points || 0) - (a.points || 0);
    });

    const exactShowIds = new Set(exact.map((s) => s.id));
    const targetGenres = new Set<string>();
    exact.forEach((s) => s.genres.forEach((g) => targetGenres.add(g.toLowerCase())));
    const targetActors = new Set<string>();
    exact.forEach((s) => s.cast.forEach((c) => targetActors.add(c.name.toLowerCase())));

    const nonExactShows = shows.filter((s) => !exactShowIds.has(s.id));
    const scoredRelated = nonExactShows.map((s) => {
      let score = 0;
      s.genres.forEach((g) => {
        if (targetGenres.has(g.toLowerCase()) || g.toLowerCase().includes(query)) score += 3;
      });
      s.cast.forEach((c) => {
        if (targetActors.has(c.name.toLowerCase()) || c.name.toLowerCase().includes(query)) score += 4;
      });
      if (exact.length > 0 && s.type === exact[0].type) score += 1;
      score += (s.points || 0) * 0.05 + s.imdbRating * 0.1;
      return { show: s, score };
    });
    scoredRelated.sort((a, b) => b.score - a.score);
    const related = scoredRelated.map((item) => item.show);

    const feed1 = exact.length > 0
      ? [...exact, ...related.slice(0, Math.max(3, 8 - exact.length))]
      : (related.length > 0 ? related.slice(0, 8) : shows.slice(0, 8));
    const feed2 = related.length > 0 ? related : nonExactShows;

    // Exact title spotlight detection (renders ONLY when an exact title matches)
    const exactTitleShow = shows.find(
      (s) =>
        s.title.toLowerCase() === query ||
        (s.turkishTitle && s.turkishTitle.toLowerCase() === query) ||
        (s.supportingTitles && s.supportingTitles.some((st) => st.toLowerCase() === query))
    ) || null;

    // Build "More to explore:" mixed pills (genres + related show titles)
    const exploreList: Array<{ label: string; kind: 'title' | 'genre' }> = [];
    const seenExplore = new Set<string>();
    const addExplore = (label: string, kind: 'title' | 'genre') => {
      const clean = label.trim();
      if (!clean || seenExplore.has(clean.toLowerCase())) return;
      seenExplore.add(clean.toLowerCase());
      exploreList.push({ label: clean, kind });
    };

    const genrePool = Array.from(
      new Set([
        ...exact.flatMap((s) => s.genres),
        ...shows.flatMap((s) => s.genres).filter((g) => g.toLowerCase().includes(query)),
        ...categoriesList.map((c) => c.name).filter((n) => n.toLowerCase().includes(query) || exact.length === 0)
      ])
    );
    const maxLen = Math.max(genrePool.length, exact.length + related.length);
    for (let i = 0; i < maxLen && exploreList.length < 14; i++) {
      if (i < genrePool.length) addExplore(genrePool[i], 'genre');
      const titleCandidate = exact[i] || related[i];
      if (titleCandidate && exploreList.length < 14) {
        addExplore(titleCandidate.title, 'title');
      }
    }

    // Active Desktop grid items
    let activeGrid: Show[] = [];
    let activeHeading = `Results for "${searchQuery.trim()}"`;

    if (desktopSearchTermFilter) {
      const termLower = desktopSearchTermFilter.toLowerCase();
      activeHeading = `Titles in: ${desktopSearchTermFilter}`;
      activeGrid = shows
        .filter(
          (s) =>
            s.title.toLowerCase() === termLower ||
            s.title.toLowerCase().includes(termLower) ||
            s.genres.some((g) => g.toLowerCase() === termLower) ||
            Boolean(s.categories?.some((c) => c.toLowerCase() === termLower)) ||
            Boolean(s.thisSeriesIs?.some((v) => v.toLowerCase() === termLower))
        )
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 32);
    } else if (exactTitleShow) {
      activeHeading = `More like ${exactTitleShow.title}`;
      activeGrid = related.filter((s) => s.id !== exactTitleShow.id).slice(0, 16); // 4 rows x 4 cards
    } else {
      const merged = [...exact, ...related.filter((r) => !exactShowIds.has(r.id))];
      activeGrid = merged.slice(0, 32); // max 8 rows x 4 cards
    }

    return {
      exactSearchShows: exact,
      searchFeed1Shows: feed1,
      searchFeed2Shows: feed2,
      exactDesktopSpotlightShow: exactTitleShow,
      desktopExploreTerms: exploreList,
      desktopGridShows: activeGrid,
      desktopGridHeading: activeHeading
    };
  }, [searchQuery, desktopCommittedExactQuery, desktopSearchTermFilter, shows, categoriesList]);

  // Freeze catalog snapshot per session (only refreshes on page reload/reopen or if admin adds/removes shows)
  // so clicking/liking/playing never reshuffles homepage rows mid-session.
  const showsIdSignature = useMemo(() => shows.map((s) => s.id).join('|'), [shows]);
  const showsSnapshotForFeedsRef = useRef<Show[]>(shows);
  const lastShowsSigRef = useRef<string>(showsIdSignature);
  if (lastShowsSigRef.current !== showsIdSignature) {
    lastShowsSigRef.current = showsIdSignature;
    showsSnapshotForFeedsRef.current = shows;
  }

  const baseDailyFeeds = useMemo(() => {
    const rows = generateDailyFeeds(
      showsSnapshotForFeedsRef.current,
      initialWatchHistoryRef.current,
      initialWatchlistRef.current,
      new Date(currentTimeSlot),
      feeds,
      arrangementCycle
    );

    // Special feed ONLY shows on home page (activeFilter === 'all')
    const pageRows = activeFilter === 'all' ? rows : rows.filter((row) => !row.isSpecialFeed);

    if (activeFilter === 'series') {
      return pageRows
        .map((row) => ({
          ...row,
          shows: row.shows.filter((s) => s.type === 'series')
        }))
        .filter((row) => row.shows.length >= 2 || row.id === 'feed-continue-watching');
    }

    if (activeFilter === 'movies') {
      return pageRows
        .map((row) => ({
          ...row,
          shows: row.shows.filter((s) => s.type === 'movie')
        }))
        .filter((row) => row.shows.length >= 2 || row.id === 'feed-continue-watching');
    }

    return pageRows;
  }, [showsIdSignature, currentTimeSlot, feeds, activeFilter, arrangementCycle]);

  // Hydrate live show metadata AND update ONLY the Keep Watching row live when watchHistory changes
  const dailyFeeds = useMemo(() => {
    const showById = new Map<string, Show>();
    for (const s of shows) showById.set(s.id, s);

    // Compute live Keep Watching list from current watchHistory
    const historyEntries = Object.values(watchHistory || {})
      .filter(Boolean)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const liveContinueShows: Show[] = [];
    const seenIds = new Set<string>();
    for (const h of historyEntries) {
      if (!h.showId || seenIds.has(h.showId)) continue;
      const liveShow = showById.get(h.showId);
      if (!liveShow) continue;
      if (activeFilter === 'series' && liveShow.type !== 'series') continue;
      if (activeFilter === 'movies' && liveShow.type !== 'movie') continue;
      const isUnfinished =
        h.seasonNumber !== undefined ||
        h.episodeNumber !== undefined ||
        (liveShow.type === 'movie' && (h.progressPercent === undefined || h.progressPercent < 90));
      if (isUnfinished && !h.completed) {
        seenIds.add(liveShow.id);
        liveContinueShows.push(liveShow);
      }
    }

    let hadContinueRow = false;
    const hydrated = baseDailyFeeds
      .map((row) => {
        if (row.id === 'feed-continue-watching' || row.categoryKey === 'continue_watching') {
          hadContinueRow = true;
          return {
            ...row,
            shows: liveContinueShows
          };
        }
        return {
          ...row,
          shows: row.shows.map((s) => showById.get(s.id) || s)
        };
      })
      .filter((row) => {
        if (row.id === 'feed-continue-watching' || row.categoryKey === 'continue_watching') {
          return row.shows.length >= 1;
        }
        return true;
      });

    // If user started watching a new title during this session and Keep Watching wasn't mounted yet,
    // insert it cleanly right after the first row without disturbing any other row order.
    if (!hadContinueRow && liveContinueShows.length >= 1) {
      const keepWatchingRow = {
        id: 'feed-continue-watching',
        title: 'Keep Watching',
        subtitle: 'Pick up right where you left off',
        categoryKey: 'continue_watching' as const,
        shows: liveContinueShows
      };
      const insertAt = hydrated.length > 0 ? 1 : 0;
      hydrated.splice(insertAt, 0, keepWatchingRow);
    }

    return hydrated;
  }, [baseDailyFeeds, shows, watchHistory, activeFilter]);

  // Category filter: matching shows and custom feed lines for multi-line regular feed (strictly from that category)
  const categoryMatchingShows = useMemo(() => {
    if (!selectedCategoryFilter) return [];
    const catNameLower = selectedCategoryFilter.name.toLowerCase();
    const catIdLower = selectedCategoryFilter.id.toLowerCase();

    const matches = shows.filter((s) => {
      // 1. Direct match with checked categories on show:
      if (Array.isArray(s.categories) && s.categories.length > 0) {
        return s.categories.some(
          (c) => c.toLowerCase() === catNameLower || c.toLowerCase() === catIdLower
        );
      }
      // 2. Keyword fallback if show categories not yet explicitly assigned
      const showGenreStr = (s.genres || []).join(' ').toLowerCase();
      const titleStr = s.title.toLowerCase();
      const descStr = (s.shortDescription + ' ' + (s.synopsis || '')).toLowerCase();
      const kwList = (selectedCategoryFilter.genreKeywords && selectedCategoryFilter.genreKeywords.length > 0)
        ? selectedCategoryFilter.genreKeywords
        : selectedCategoryFilter.name.toLowerCase().split(/[ &,-]+/).filter(Boolean);
      return kwList.some(
        (kw) =>
          showGenreStr.includes(kw.toLowerCase()) ||
          titleStr.includes(kw.toLowerCase()) ||
          descStr.includes(kw.toLowerCase())
      );
    });
    return matches;
  }, [shows, selectedCategoryFilter]);

  const categoryFeedsToRender = useMemo(() => {
    if (!selectedCategoryFilter) return null;
    const catName = selectedCategoryFilter.name;
    const allMatches = categoryMatchingShows;
    const seriesMatches = allMatches.filter((s) => s.type === 'series');
    const movieMatches = allMatches.filter((s) => s.type === 'movie');
    const topRatedMatches = [...allMatches].sort((a, b) => b.imdbRating - a.imdbRating);
    const trendingMatches = [...allMatches].sort((a, b) => (b.all_time_score || b.points) - (a.all_time_score || a.points));

    const feedList: Array<{
      feed: FeedConfig;
      customShows: Show[];
    }> = [
      {
        feed: {
          id: `cat-featured-${selectedCategoryFilter.id}`,
          title: `Featured in ${catName}`,
          categoryKey: `cat_${selectedCategoryFilter.id}`,
          enabled: true,
          displayOrder: 1,
          showRankNumbers: false
        },
        customShows: trendingMatches.length > 0 ? trendingMatches : allMatches
      }
    ];

    if (seriesMatches.length > 0) {
      feedList.push({
        feed: {
          id: `cat-series-${selectedCategoryFilter.id}`,
          title: `${catName} Series & Dramas`,
          categoryKey: `cat_series_${selectedCategoryFilter.id}`,
          filterType: 'series',
          enabled: true,
          displayOrder: 2,
          showRankNumbers: false
        },
        customShows: seriesMatches
      });
    }

    if (movieMatches.length > 0) {
      feedList.push({
        feed: {
          id: `cat-movies-${selectedCategoryFilter.id}`,
          title: `${catName} Movies & Feature Films`,
          categoryKey: `cat_movies_${selectedCategoryFilter.id}`,
          filterType: 'movie',
          enabled: true,
          displayOrder: 3,
          showRankNumbers: false
        },
        customShows: movieMatches
      });
    }

    feedList.push({
      feed: {
        id: `cat-top-rated-${selectedCategoryFilter.id}`,
        title: `Critically Acclaimed ${catName}`,
        categoryKey: `cat_top_${selectedCategoryFilter.id}`,
        enabled: true,
        displayOrder: 4,
        showRankNumbers: false
      },
      customShows: topRatedMatches
    });

    return feedList;
  }, [selectedCategoryFilter, categoryMatchingShows]);

  // Recommendation per page (respects is_recommended eligibility flag and rotates on reload):
  const currentHeroShow = useMemo<Show | null>(() => {
    if (!shows || shows.length === 0) return null;

    if (selectedCategoryFilter) {
      if (categoryRandomHeroShow && categoryMatchingShows.some((s) => s.id === categoryRandomHeroShow.id)) {
        return categoryRandomHeroShow;
      }
      const catMatches = categoryMatchingShows.filter((s) => s.is_recommended !== false);
      const pool = catMatches.length > 0 ? catMatches : categoryMatchingShows;
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }
    if (customHeroShow && activeFilter === 'all' && !selectedCategoryFilter) {
      return customHeroShow;
    }
    // Only items with is_recommended !== false can appear as hero recommendation
    const eligibleShows = shows.filter((s) => s.is_recommended !== false);
    const pool = eligibleShows.length > 0 ? eligibleShows : shows;
    if (pool.length === 0) return null;

    if (activeFilter === 'movies') {
      return pageRecommendations.movies || pool.find((s) => s.type === 'movie') || pool[0] || null;
    }
    if (activeFilter === 'series') {
      return pageRecommendations.series || pool.find((s) => s.type === 'series') || pool[0] || null;
    }
    return pageRecommendations.all || (heroShow && heroShow.is_recommended !== false ? heroShow : pool[0]) || null;
  }, [activeFilter, selectedCategoryFilter, categoryMatchingShows, shows, pageRecommendations, heroShow, customHeroShow]);

  // 3-4 special single feed titles for carousel on desktop and mobile homepage
  const specialSingleFeedShows = useMemo<Show[]>(() => {
    if (!shows || shows.length === 0) return [];
    // 1. Look for shows explicitly toggled as special single feed eligible in admin panel
    const explicit = shows.filter((s) => s.isSpecialSingleFeedEligible === true);
    if (explicit.length >= 3) return explicit.slice(0, 4);

    // 2. Supplement with other high-quality shows not equal to currentHeroShow
    const others = shows.filter(
      (s) => !explicit.some((e) => e.id === s.id) && s.id !== currentHeroShow?.id
    );
    const combined = [...explicit, ...others];
    return combined.slice(0, 4);
  }, [shows, currentHeroShow]);

  // Handler for selecting genre card from Browse by Genre row:
  // Opens dedicated genre titles page with the exact same top header name & card style as Category card detail, WITHOUT opening the Categories tab
  const handleSelectGenreFromFeed = (genre: GenreItem | CategoryItem) => {
    genreReturnScrollRef.current = window.scrollY;
    setSelectedGenreView(genre);
    setSelectedCategoryFromGenre(null);
    setSelectedCategoryFilter(null);
    setSelectedSpecialFeed(null);
    setSearchQuery('');
    const slug =
      genre.id ||
      genre.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    pushRoute(`/genre/${encodeURIComponent(slug)}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleCloseGenreView = () => {
    setSelectedGenreView(null);
    const routeMap: Record<string, string> = {
      all: '/',
      series: '/series',
      movies: '/movies',
      categories: '/categories',
      watchlist: '/mylist'
    };
    pushRoute(routeMap[activeFilter] || '/');
    window.setTimeout(() => {
      window.scrollTo({ top: genreReturnScrollRef.current || 0, behavior: 'instant' });
    }, 0);
  };

  const genreViewMatchingShows = useMemo(() => {
    if (!selectedGenreView) return [];
    const genreNameLower = selectedGenreView.name.toLowerCase().trim();
    const genreIdLower = selectedGenreView.id.toLowerCase().trim();
    const rawKeywords =
      'keywords' in selectedGenreView && Array.isArray(selectedGenreView.keywords) && selectedGenreView.keywords.length > 0
        ? selectedGenreView.keywords
        : 'genreKeywords' in selectedGenreView &&
          Array.isArray(selectedGenreView.genreKeywords) &&
          selectedGenreView.genreKeywords.length > 0
        ? selectedGenreView.genreKeywords
        : genreNameLower.split(/[ &,-]+/).filter(Boolean);
    const keywordsLower = Array.from(
      new Set([genreNameLower, genreIdLower, ...rawKeywords.map((k) => k.toLowerCase().trim())])
    ).filter(Boolean);

    return shows.filter((s) => {
      const showGenres = (s.genres || []).map((g) => g.toLowerCase().trim());
      if (
        showGenres.some(
          (g) =>
            g === genreNameLower ||
            g === genreIdLower ||
            keywordsLower.some((kw) => g.includes(kw) || kw.includes(g))
        )
      ) {
        return true;
      }
      const showCats = (s.categories || []).map((c) => c.toLowerCase().trim());
      if (showCats.some((c) => c === genreNameLower || c === genreIdLower)) {
        return true;
      }
      return false;
    });
  }, [shows, selectedGenreView]);

  // Watchlist shows list
  const watchlistShows = shows.filter((s) => watchlist.includes(s.id));

  // "My list" feeds:
  // 1. "Continue Watching": movies/series on which user clicked play or episode play button, most recent first, no duplicates
  const continueWatchingShows = useMemo(() => {
    const sorted = Object.values(watchHistory).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    const seen = new Set<string>();
    const list: Show[] = [];
    for (const item of sorted) {
      if (!seen.has(item.showId)) {
        seen.add(item.showId);
        const s = shows.find((show) => show.id === item.showId);
        if (s) list.push(s);
      }
    }
    return list;
  }, [watchHistory, shows]);

  // 2. "Watchlist": movies/series added to list, most recent added to list shown first
  const userWatchlistShows = useMemo(() => {
    const reversed = [...watchlist].reverse();
    const seen = new Set<string>();
    const list: Show[] = [];
    for (const id of reversed) {
      if (!seen.has(id)) {
        seen.add(id);
        const s = shows.find((show) => show.id === id);
        if (s) list.push(s);
      }
    }
    return list;
  }, [watchlist, shows]);

  // 3. "Series & Films You've Liked": most recent liked first
  const likedShows = useMemo(() => {
    const reversed = [...likedShowIds].reverse();
    const seen = new Set<string>();
    const list: Show[] = [];
    for (const id of reversed) {
      if (!seen.has(id)) {
        seen.add(id);
        const s = shows.find((show) => show.id === id);
        if (s) list.push(s);
      }
    }
    return list;
  }, [likedShowIds, shows]);

  // 3. Random mixed list of movies and series that changes on every reload, max 14 titles
  const [randomMixedShows] = useState<Show[]>(() => {
    return [...shows].sort(() => 0.5 - Math.random()).slice(0, 14);
  });

  // If in Admin Mode, render the standalone full-screen Admin Management GUI
  if (isAdminPanelOpen) {
    return (
      <>
        <GlobalTooltip />
        <AdminDashboardPage
          shows={shows}
          feeds={feeds}
          adminSettings={adminSettings}
          notifications={notifications}
          initialTab={adminEditingFeedId ? 'feeds' : undefined}
          initialEditingFeedId={adminEditingFeedId}
          onUpdateShows={setShows}
          onUpdateFeeds={setFeeds}
          onUpdateSettings={setAdminSettings}
          onUpdateNotifications={setNotifications}
          onExitAdmin={() => {
            setIsAdminPanelOpen(false);
            setAdminEditingFeedId(undefined);
            // Clean URL parameter/hash if present
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('admin');
              if (url.hash === '#admin') {
                url.hash = '';
              }
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
            }
          }}
        />
      </>
    );
  }

  // Standalone Login / Create Account Screen: single browser scrollbar, custom background, minimal footer
  if (isLoginPageOpen) {
    return (
      <>
        <GlobalTooltip />
        <LoginPage
          shows={shows}
          platformName={platformName}
          customLogoUrl={adminSettings.customLogoUrl}
          useCustomLogo={adminSettings.useCustomLogo}
          desktopBgMode={adminSettings.loginDesktopBgMode}
          backgroundImageUrl={adminSettings.loginBackgroundImageUrl}
          desktopVideoUrl={adminSettings.loginDesktopVideoUrl}
          desktopVideoPlayMode={adminSettings.loginDesktopVideoPlayMode || 'loop'}
          desktopGlareColor={adminSettings.loginDesktopGlareColor || '#e11d48'}
          mobileBgMode={adminSettings.loginMobileBgMode}
          mobileMediaUrl={adminSettings.loginMobileMediaUrl}
          mobileVideoUrl={adminSettings.loginMobileVideoUrl}
          mobileVideoPlayMode={adminSettings.loginMobileVideoPlayMode || 'loop'}
          mobileGlareColor={adminSettings.loginMobileGlareColor || '#e11d48'}
          initialEmail={userEmail}
          initialAuthMode={loginInitialMode}
          isGlobalMuted={isGlobalMuted}
          onToggleGlobalMute={(muted) => {
            setIsGlobalMuted(muted);
            try {
              localStorage.setItem('cineflix_global_muted', String(muted));
            } catch {}
          }}
          onAuthSuccess={({ email, password, name, logoRect }) => {
            let shouldShowPinLock = false;
            try {
              localStorage.setItem('cineflix_user_email', email);
              localStorage.setItem('cineflix_user_password', password);
              if (name && name.trim()) {
                localStorage.setItem('cineflix_user_name', name.trim());
              }
              const existingPin = localStorage.getItem('dizi_profile_lock_pin');
              const existingLockEnabled =
                localStorage.getItem('dizi_profile_lock_enabled') === 'true' && Boolean(existingPin);
              shouldShowPinLock = existingLockEnabled;
              if (existingLockEnabled) {
                sessionStorage.removeItem('dizi_profile_unlocked');
              }
            } catch {}
            if (name && name.trim()) {
              setUserName(name.trim());
            }
            setUserEmail(email);
            setUserPassword(password);
            setIsLoggedIn(true);
            setIsRecommendationPaused(false);
            setIsProfileLocked(shouldShowPinLock);

            // Trigger center-logo glide ONLY when landing on Home or Profile (NOT on Profile PIN lock screen)
            if (!shouldShowPinLock && logoRect && logoRect.width > 0 && logoRect.height > 0) {
              pendingLoginLogoRectRef.current = logoRect;
            } else {
              pendingLoginLogoRectRef.current = null;
            }

            setIsLoginPageOpen(false);
            if (openedLoginFromSiteRef.current) {
              openedLoginFromSiteRef.current = false;
              try {
                window.history.back();
              } catch {
                pushRoute('/', true);
              }
            } else {
              pushRoute('/', true);
            }
          }}
          onBack={() => {
            setIsRecommendationPaused(false);
            if (openedLoginFromSiteRef.current) {
              openedLoginFromSiteRef.current = false;
              setIsLoginPageOpen(false);
              try {
                window.history.back();
              } catch {
                handleGoHome();
              }
            } else {
              setIsLoginPageOpen(false);
              handleGoHome();
              pushRoute('/', true);
            }
          }}
          onGoHome={() => {
            openedLoginFromSiteRef.current = false;
            setIsRecommendationPaused(false);
            setIsLoginPageOpen(false);
            handleGoHome();
            pushRoute('/', true);
          }}
        />
      </>
    );
  }

  const handleNavigateInternalUrl = (path: string) => {
    pushRoute(path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div
      style={{
        paddingTop: isOffline && !isMobile ? '52px' : undefined
      }}
      className={`min-h-screen text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white ${
        sharedTitleShow && !isMobile && !isShareOverlayClosing ? 'bg-[#181818]' : isMobile ? 'bg-black' : 'bg-[#141414]'
      }`}
    >
      {/* Live Internet Connection Offline Alert Bar */}
      <OfflineAlertBar isOffline={isOffline} />

      {/* 1. Transparent Navbar (Same like Netflix) - NO admin buttons or links visible to users */}
      <Navbar
        isOffline={isOffline}
        watchlistCount={watchlist.length}
        onOpenWatchlist={() => handleSelectPage('watchlist')}
        onOpenDownloadModal={() => {
          setIsRecommendationPaused(true);
          setIsDownloadModalOpen(true);
        }}
        onOpenAccount={() => {
          if (!isLoggedIn) {
            openLoginPage('login');
            return;
          }
          setIsRecommendationPaused(true);
          setIsAccountModalOpen(true);
          pushRoute('/account');
        }}
        onOpenAppSettings={() => {
          setIsRecommendationPaused(true);
          setIsAppSettingsModalOpen(true);
          pushRoute('/settings');
        }}
        onRequestContent={() => {
          setIsRecommendationPaused(true);
          setIsRequestContentModalOpen(true);
        }}
        onClearWatchlist={handleClearWatchlist}
        onClearWatchHistory={handleClearWatchHistory}
        onProfileMenuAction={() => setIsRecommendationPaused(true)}
        userAvatar={userAvatar}
        userName={userName}
        isLoggedIn={isLoggedIn}
        onToggleAuth={handleSignOut}
        onOpenCreateAccount={() => openLoginPage('create')}
        shows={shows}
        onSelectCategory={handleSelectPage}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchSuggestions={searchSuggestions}
        onExactSearchCommit={(committed) => {
          setDesktopSearchTermFilter('');
          setDesktopCommittedExactQuery(committed);
          pushRoute(`/search?q=${encodeURIComponent(committed)}`, true);
        }}
        useCustomLogo={adminSettings.useCustomLogo}
        customLogoUrl={adminSettings.customLogoUrl}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
        onOpenShowById={(showId) => {
          const found = shows.find((s) => s.id === showId);
          if (found) handleOpenDetails(found, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        isSpecialFeedPage={Boolean(selectedSpecialFeed)}
        hideMobileLogoBar={
          (isMobile && adminSettings.mobileRecommendationStyle === 'poster_no_preview') ||
          Boolean(isMobile && ((activeFilter === 'categories' && isCategoriesDetailOpen) || selectedCategoryFilter || selectedGenreView))
        }
        isSharePage={Boolean(sharedTitleShow && !isMobile && !isShareOverlayClosing)}
        hideProfileAvatar={isProfileLocked}
        onOpenHamburgerDrawer={() => setIsHamburgerDrawerOpen(true)}
        desktopNavbarStyle={adminSettings.desktopNavbarStyle || 'classic'}
        hideNavbarOnFullSizeMoreInfo={Boolean(adminSettings.hideNavbarOnFullSizeMoreInfo)}
        onShareBack={() => {
          if (shareBackStackRef.current.length > 0) {
            window.history.back();
          } else {
            window.dispatchEvent(new CustomEvent('dizi-share-ui-back'));
          }
        }}
      />

      {/* Full-Size Desktop More Info Page (renders in primary document flow; switches to transparent glarence overlay on slide-down back) */}
      {sharedTitleShow && !isMobile && (() => {
        const activeSharedShow = shows.find((s) => s.id === sharedTitleShow.id) || sharedTitleShow;
        return (
          <div
            className={
              isShareOverlayClosing
                ? 'fixed inset-0 z-[45] overflow-hidden pointer-events-none'
                : 'relative z-[45] w-full min-h-screen bg-[#181818]'
            }
          >
            {isShareOverlayClosing && (
              <div
                className="absolute inset-0 bg-black/35 pointer-events-none transition-opacity duration-[440ms] ease-out"
                style={{ opacity: isShareClosingGlareFading ? 0 : 1 }}
              />
            )}
            <ShareTitleDesktopPage
              show={activeSharedShow}
              allShows={shows}
              adminSettings={adminSettings}
              isInWatchlist={watchlist.includes(activeSharedShow.id)}
              watchlist={watchlist}
              watchProgress={watchHistory[activeSharedShow.id]}
              onToggleWatchlist={handleToggleWatchlist}
              onPlayShow={handlePlayShow}
              onPlayTrailer={(s, trailer) => {
                if (trailer.videoSourceType === 'external') {
                  window.open(trailer.videoUrl, '_blank', 'noopener,noreferrer');
                  return;
                }
                try {
                  const prePlayerUrl = `${window.location.pathname}${window.location.search}`;
                  const slug = s.slug || s.id || s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  const cleanUrl = buildCleanWatchUrl(s, null, { trailerId: trailer.id });
                  window.history.pushState(
                    { ...(window.history.state || {}), showId: s.id, slug, isFullPlayer: true, prePlayerUrl },
                    '',
                    cleanUrl
                  );
                } catch {}
                const startSec = parseTimeToSeconds(trailer.startTime) || 0;
                setPlayingMedia({
                  show: s,
                  videoUrl: trailer.videoUrl,
                  videoSourceType: trailer.videoSourceType || 'direct',
                  title: s.title,
                  subtitle: trailer.title,
                  episodeSubtitle: trailer.title,
                  titleLogoUrl: s.titleLogoUrl,
                  previewThumbnailUrl: trailer.thumbnailUrl || s.posterLandscapeUrl || s.backdropUrl,
                  startTime: trailer.startTime,
                  endTime: trailer.endTime,
                  initialCurrentTime: startSec,
                  isTrailer: true,
                  playerBgImageUrl: trailer.playerBgImageUrl || s.backdropUrl,
                  hasNextEpisode: false,
                  nextEpisodeInfo: null
                });
              }}
              onOpenDetails={(s, origin) => {
                if (sharedTitleShowRef.current && sharedTitleShowRef.current.id !== s.id) {
                  shareBackStackRef.current.push(sharedTitleShowRef.current);
                }
                setDetailOriginMeta(origin || { sourceFeedType: 'other' });
                setIsShareOverlayClosing(false);
                setSharedTitleShow(s);
                window.scrollTo({ top: 0, behavior: 'instant' });
                const nextWatchUrl = buildCleanWatchUrl(s);
                if (`${window.location.pathname}${window.location.search}` !== nextWatchUrl) {
                  window.history.pushState({ showId: s.id, fullSizeMoreInfo: true }, '', nextWatchUrl);
                }
              }}
              onSelectActor={(actor) => handleSelectActorForPool(actor)}
              onBackToBrowse={(skipHistoryPush) => {
                shareBackStackRef.current = [];
                setIsShareOverlayClosing(false);
                setSharedTitleShow(null);
                setDetailOriginMeta(null);
                if (!skipHistoryPush) {
                  window.history.pushState({}, '', '/');
                }
              }}
              platformName={platformName}
              isGlobalMuted={isGlobalMuted}
              onToggleGlobalMute={handleToggleGlobalMute}
              likedShowIds={likedShowIds}
              onToggleLike={handleToggleLike}
              originMeta={detailOriginMeta}
              isFullPlayerOpen={Boolean(playingMedia)}
              onClosingStateChange={setIsShareOverlayClosing}
              currentAdLayout={currentAdDeviceLayout}
              onNavigateInternal={handleNavigateInternalUrl}
            />
          </div>
        );
      })()}

      {/* Main Content Area: hidden while Full-Size Desktop More Info is active, un-hidden during transparent slide-down closing */}
      <main className={`${sharedTitleShow && !isMobile && !isShareOverlayClosing ? 'hidden' : 'flex-1'} ${isMobile ? 'pb-18' : 'pb-0'}`}>
        {is404Page ? (
          <NotFound404Page
            onGoHome={handleGoHome}
            onOpenSearch={() => {
              setIs404Page(false);
              if (isMobile && !isTablet) {
                handleMobileSelectTab('search');
              } else {
                handleGoHome();
                window.setTimeout(() => {
                  const searchBtn = document.querySelector<HTMLButtonElement>('button[aria-label="Search"]');
                  searchBtn?.click();
                }, 40);
              }
            }}
            platformName={platformName}
          />
        ) : drawerDedicatedView ? (
          /* Dedicated Top 10 (Dexter reference mobile list design) & Vertical My List View */
          <div className="pt-16 sm:pt-20 pb-24 min-h-screen bg-black text-white animate-in fade-in duration-200">
            {/* Fixed Black Top Header */}
            <div className="fixed top-0 inset-x-0 z-50 h-14 bg-black px-4 flex items-center justify-between border-b border-white/10 select-none">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setDrawerDedicatedView(null);
                    pushRoute('/');
                  }}
                  className="p-1 -ml-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                  aria-label="Back to home"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
                </button>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {drawerDedicatedView === 'top_10_series'
                    ? 'Top 10 Series'
                    : drawerDedicatedView === 'top_10_movies'
                    ? 'Top 10 Movies'
                    : 'My List'}
                </h1>
              </div>
            </div>

            {drawerDedicatedView === 'vertical_my_list' ? (
              <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
                {userWatchlistShows.length === 0 ? (
                  <div className="py-20 text-center text-zinc-400 text-sm">
                    Your watchlist is empty.
                  </div>
                ) : (
                  userWatchlistShows.map((show) => {
                    const artwork = show.backdropUrl || show.posterLandscapeUrl || show.backdropUrl2;
                    const isInWatchlist = watchlist.includes(show.id);
                    return (
                      <div
                        key={`vertical-my-list-${show.id}`}
                        onClick={() => handleOpenDetails(show, 'trailer')}
                        className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#14151b] border border-white/10 shadow-2xl cursor-pointer select-none group"
                      >
                        <MediaImage
                          src={artwork}
                          fallbackTitle={show.title}
                          fallbackClassName="absolute inset-0 w-full h-full bg-[#14151b] flex items-center justify-center p-6 text-center select-none"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />
                        <div className="absolute inset-x-4 bottom-12 z-20 flex flex-col items-center justify-end pointer-events-none">
                          {(show.centralLogoUrl || show.titleLogoUrl) ? (
                            <div className="relative w-[62%] aspect-[2.5/1] overflow-hidden shrink-0">
                              <img
                                src={show.centralLogoUrl || show.titleLogoUrl}
                                alt={show.title}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                              />
                            </div>
                          ) : (
                            <span className="text-white font-extrabold text-base sm:text-lg text-center tracking-tight drop-shadow-md">
                              {show.title}
                            </span>
                          )}
                        </div>
                        <div className="absolute inset-x-4 bottom-3 z-30 flex items-center justify-center gap-3 pointer-events-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayShow(show);
                            }}
                            className="flex items-center gap-1.5 text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
                            aria-label={`Play ${show.title}`}
                          >
                            <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                              <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                                <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
                              </svg>
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">Play</span>
                          </button>
                          <span className="text-white/40 text-xs">|</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleWatchlist(show.id);
                            }}
                            className="flex items-center gap-1.5 text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
                            aria-label={isInWatchlist ? `Remove ${show.title} from list` : `Add ${show.title} to list`}
                          >
                            <div className="w-6 h-6 rounded-full border border-white/80 text-white flex items-center justify-center">
                              {isInWatchlist ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                              {isInWatchlist ? 'In List' : 'My List'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* Mobile Top 10 List Page Redesign: Pure black, borderless 16:9 poster, inside_card gradient rank on top-left, maturity top-right, mute bottom-right, logo + Share/MyList/Play below */
              <div className="max-w-xl mx-auto px-3 sm:px-4 pt-3 pb-24 space-y-6">
                {(() => {
                  const listShows =
                    drawerDedicatedView === 'top_10_series'
                      ? shows.filter((s) => s.type === 'series').sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10)
                      : shows.filter((s) => s.type === 'movie').sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 10);

                  if (listShows.length === 0) {
                    return <div className="py-20 text-center text-zinc-400 text-sm">No titles found.</div>;
                  }

                  return listShows.map((show, idx) => {
                    const artwork = show.backdropUrl || show.posterLandscapeUrl || show.backdropUrl2;
                    const isInWatchlist = watchlist.includes(show.id);
                    const releaseYear = show.releaseYear ? show.releaseYear.split('-')[0].trim() : '';
                    const primaryGenre = show.genres?.[0] || '';
                    const durationOrSeasons =
                      show.durationOrSeasons ||
                      (show.type === 'series'
                        ? `${show.seasons?.length || 1} Season${(show.seasons?.length || 1) > 1 ? 's' : ''}`
                        : 'Feature Film');
                    const synopsisText = show.synopsis || show.description || show.shortDescription || '';

                    return (
                      <div
                        key={`top10-${drawerDedicatedView}-${show.id}`}
                        data-show-id={show.id}
                        className="w-full rounded-2xl overflow-hidden bg-black border border-white/[0.14] shadow-2xl select-none"
                      >
                        {/* 16:9 Artwork Poster: NO mute button and NO maturity badge on top; smooth bottom black fade */}
                        <div
                          onClick={() => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
                          className="relative w-full aspect-video overflow-hidden bg-black cursor-pointer group"
                        >
                          <MediaImage
                            src={artwork}
                            fallbackTitle={show.title}
                            fallbackClassName="absolute inset-0 w-full h-full bg-[#111] flex items-center justify-center p-6 text-center select-none"
                            className="w-full h-full object-cover"
                          />

                          {/* Bottom Black Fade Glare Merging Smoothly into Pure Black Card Body */}
                          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none z-10" />

                          {/* Top-Left Rank Number in inside_card gradient style */}
                          <div className="absolute top-2.5 left-3.5 z-20 pointer-events-none select-none">
                            <span
                              className="text-4xl sm:text-5xl font-black font-display tracking-tight bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent leading-none"
                              style={{
                                WebkitTextFillColor: 'transparent',
                                filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.92))'
                              }}
                            >
                              {idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Raised Logo & Action Row overlapping the bottom fade + Metadata & 2-Line Synopsis underneath */}
                        <div className="-mt-6 relative z-20 px-3.5 pb-3.5 bg-transparent">
                          <div className="flex items-end justify-between gap-3">
                            <div
                              onClick={() => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
                              className="min-w-0 flex-1 cursor-pointer"
                            >
                              {show.titleLogoUrl ? (
                                <div className="relative w-[58%] max-w-[200px] aspect-[2.5/1] overflow-hidden shrink-0">
                                  <img
                                    src={show.titleLogoUrl}
                                    alt={show.title}
                                    referrerPolicy="no-referrer"
                                    className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
                                  />
                                </div>
                              ) : (
                                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                                  {show.title}
                                </h3>
                              )}
                            </div>

                            <div className="flex items-center gap-5 shrink-0 pb-0.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMobileTop10ShareShow(show);
                                }}
                                className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-90 cursor-pointer transition-transform"
                                aria-label={`Share ${show.title}`}
                              >
                                <ShareArrowIcon className="w-5 h-5 text-white" />
                                <span className="text-[10px] font-medium text-zinc-300 leading-none">Share</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleWatchlist(show.id);
                                }}
                                className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-90 cursor-pointer transition-transform"
                                aria-label={isInWatchlist ? `Remove ${show.title} from list` : `Add ${show.title} to list`}
                              >
                                {isInWatchlist ? (
                                  <Check className="w-5 h-5 text-emerald-400 stroke-[2.5]" />
                                ) : (
                                  <Plus className="w-5 h-5 text-white stroke-[2]" />
                                )}
                                <span className="text-[10px] font-medium text-zinc-300 leading-none">
                                  {isInWatchlist ? 'In List' : 'My List'}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayShow(show);
                                }}
                                className="flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-90 cursor-pointer transition-transform"
                                aria-label={`Play ${show.title}`}
                              >
                                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="6 4 20 12 6 20 6 4" />
                                </svg>
                                <span className="text-[10px] font-medium text-zinc-300 leading-none">Play</span>
                              </button>
                            </div>
                          </div>

                          {/* Metadata Line: Year • Maturity Pill • Genre • Duration/Seasons */}
                          <div
                            onClick={() => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
                            className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-zinc-300 cursor-pointer"
                          >
                            {releaseYear && <span>{releaseYear}</span>}
                            {show.maturityRating && (
                              <>
                                {releaseYear && <span className="text-zinc-500">•</span>}
                                <span className="px-1.5 py-0.5 rounded border border-white/30 bg-white/[0.06] text-white text-[10px] font-bold leading-none">
                                  {show.maturityRating}
                                </span>
                              </>
                            )}
                            {primaryGenre && (
                              <>
                                <span className="text-zinc-500">•</span>
                                <span>{primaryGenre}</span>
                              </>
                            )}
                            {durationOrSeasons && (
                              <>
                                <span className="text-zinc-500">•</span>
                                <span>{durationOrSeasons}</span>
                              </>
                            )}
                          </div>

                          {/* 2-Line Synopsis */}
                          {synopsisText && (
                            <p
                              onClick={() => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
                              className="mt-1.5 text-xs text-zinc-400 leading-relaxed line-clamp-2 cursor-pointer"
                            >
                              {synopsisText}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        ) : searchQuery.trim() ? (
          /* Desktop Search Redesign: "More to explore" terms/genres strip + 4-column grid with randomized Recommended-For-You style Search Ad card */
          <div className="relative z-20 pt-20 md:pt-24 pb-16 space-y-6 animate-in fade-in duration-200">
            {/* "More to explore:" related terms & genres bar */}
            {desktopExploreTerms.length > 0 && (
              <div className="w-full px-4 md:px-8 xl:px-12 relative">
                <p className="text-xs text-zinc-400 font-medium mb-2.5 select-none">
                  More to explore:
                </p>
                <div className="relative flex items-center">
                  <div
                    ref={searchExploreStripRef}
                    className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pr-12 py-0.5 scroll-smooth"
                  >
                    {desktopExploreTerms.map((term) => {
                      const isActivePill = desktopSearchTermFilter.toLowerCase() === term.label.toLowerCase();
                      return (
                        <button
                          key={term.label}
                          onClick={() => {
                            if (isActivePill) {
                              setDesktopSearchTermFilter('');
                            } else {
                              setDesktopSearchTermFilter(term.label);
                            }
                          }}
                          className={`px-4 py-2 rounded-md text-xs sm:text-[13px] shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                            isActivePill
                              ? 'bg-white text-black font-semibold shadow-md'
                              : 'bg-[#222226] hover:bg-[#323238] text-zinc-200 font-medium'
                          }`}
                        >
                          {term.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right chevron scroll button */}
                  <button
                    type="button"
                    onClick={() => {
                      searchExploreStripRef.current?.scrollBy({ left: 260, behavior: 'smooth' });
                    }}
                    className="absolute right-0 w-8 h-8 rounded-full bg-[#1a1a1d]/95 hover:bg-zinc-700 border border-white/15 text-white flex items-center justify-center shadow-xl cursor-pointer transition-colors"
                    aria-label="Scroll related terms right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Exact Title Spotlight Mode (ONLY when exact title matches) */}
            {exactDesktopSpotlightShow && !desktopSearchTermFilter && (
              <SpecialSingleFeed
                shows={[exactDesktopSpotlightShow]}
                onPlay={handlePlayShow}
                onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin || { sourceFeedType: 'other' })}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
                isGlobalMuted={isGlobalMuted}
                onToggleGlobalMute={handleToggleGlobalMute}
                isMobile={isMobile && !isTablet}
                isPaused={isHomepagePreviewPaused}
                isAnyOtherCardHovered={isFeedCardHovered}
                isSearchSpotlight={true}
              />
            )}

            {/* 4-Column Results Grid: injects Search Page Ad card at a random non-fixed position matching Recommended For You card UI */}
            <div className="w-full px-4 md:px-8 xl:px-12">
              <h2 className="text-[15px] sm:text-base md:text-[17px] font-semibold text-white/95 tracking-tight mb-4">
                {desktopGridHeading}
              </h2>
              {desktopGridShows.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {(() => {
                    const canShowDesktopSearchAd = Boolean(
                      adminSettings.searchAdEnabled &&
                        matchesAdLayout(adminSettings.searchAdLayouts) &&
                        (adminSettings.searchAdTitle?.trim() ||
                          adminSettings.searchAdImageUrl?.trim() ||
                          adminSettings.searchAdSubtitle?.trim())
                    );
                    const queryHash = (searchQuery.trim() + '|' + sessionRowSeed)
                      .split('')
                      .reduce((acc, ch) => ((acc * 31 + ch.charCodeAt(0)) >>> 0), 7);
                    const adSlotIndex = canShowDesktopSearchAd
                      ? queryHash % Math.max(1, Math.min(8, desktopGridShows.length + 1))
                      : -1;
                    const gridItems: React.ReactNode[] = [];
                    desktopGridShows.forEach((s, idx) => {
                      if (idx === adSlotIndex) {
                        gridItems.push(
                          <SearchAdCard
                            key="desktop-search-grid-ad"
                            variant="desktop_card"
                            imageUrl={adminSettings.searchAdImageUrl}
                            badgeText={adminSettings.searchAdBadgeText || 'Ad'}
                            title={adminSettings.searchAdTitle}
                            subtitle={adminSettings.searchAdSubtitle}
                            buttonUrl={adminSettings.searchAdButtonUrl}
                            onNavigateInternal={handleNavigateInternalUrl}
                          />
                        );
                      }
                      gridItems.push(
                        <ShowCard
                          key={`search-grid-${s.id}`}
                          show={s}
                          cardSize="full"
                          isInWatchlist={watchlist.includes(s.id)}
                          onToggleWatchlist={handleToggleWatchlist}
                          onOpenDetails={(show, origin) => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, origin)}
                          onPlay={handlePlayShow}
                          onIncrementPoints={handleIncrementPoints}
                          isGlobalMuted={isGlobalMuted}
                          onToggleGlobalMute={handleToggleGlobalMute}
                          onHoverPreviewStart={() => setIsFeedCardHovered(true)}
                          onHoverPreviewEnd={() => setIsFeedCardHovered(false)}
                          onLongPress={(show) => setActionSheetShow(show)}
                          showTop10Badge={adminSettings.showTop10Badges !== false}
                          isLiked={likedShowIds.includes(s.id)}
                          onToggleLike={handleToggleLike}
                          popoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                        />
                      );
                    });
                    if (canShowDesktopSearchAd && adSlotIndex >= desktopGridShows.length) {
                      gridItems.push(
                        <SearchAdCard
                          key="desktop-search-grid-ad"
                          variant="desktop_card"
                          imageUrl={adminSettings.searchAdImageUrl}
                          badgeText={adminSettings.searchAdBadgeText || 'Ad'}
                          title={adminSettings.searchAdTitle}
                          subtitle={adminSettings.searchAdSubtitle}
                          buttonUrl={adminSettings.searchAdButtonUrl}
                          onNavigateInternal={handleNavigateInternalUrl}
                        />
                      );
                    }
                    return gridItems;
                  })()}
                </div>
              ) : (
                <div className="py-16 text-center text-zinc-400">
                  <p className="text-base font-medium text-white">No titles found for &quot;{desktopSearchTermFilter || searchQuery}&quot;</p>
                </div>
              )}
            </div>
          </div>
        ) : activeFilter === 'watchlist' ? (
          /* Dedicated "My list" Page: Shows Keep Watching, My List, and Series & Films You've Liked with EmptyListCard art when empty */
          <div className="pt-20 sm:pt-24 pb-16 min-h-[60vh] animate-in fade-in duration-200">
            <div className="relative z-20 space-y-5 md:space-y-6 mt-2 md:mt-3">
              {/* 1st Section: "Keep Watching" */}
              {continueWatchingShows.length > 0 ? (
                <FeedStrip
                  feed={{
                    id: 'my-list-continue-watching',
                    title: 'Keep Watching',
                    categoryKey: 'custom',
                    enabled: true
                  }}
                  shows={shows}
                  customShows={continueWatchingShows}
                  watchlist={watchlist}
                  watchHistory={watchHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)}
                  onPlayShow={handlePlayShow}
                  onIncrementPoints={handleIncrementPoints}
                  isGlobalMuted={isGlobalMuted}
                  onToggleGlobalMute={handleToggleGlobalMute}
                  onHoverCardStart={() => setIsFeedCardHovered(true)}
                  onHoverCardEnd={() => setIsFeedCardHovered(false)}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  onLongPressShow={(s) => setActionSheetShow(s)}
                  enableStretchableCards={false}
                  showTop10Badges={adminSettings.showTop10Badges !== false}
                  modernTop10RankList={adminSettings.modernTop10RankList}
                  top10RankStyle={adminSettings.top10RankStyle}
                  likedShowIds={likedShowIds}
                  onToggleLike={handleToggleLike}
                  feedIndex={0}
                  isPaused={isHomepagePreviewPaused}
                  desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                />
              ) : (
                <div className="px-2.5 sm:px-4 md:px-8 xl:px-12">
                  <EmptyListCard variant="continue_watching" />
                </div>
              )}

              {/* 2nd Section: "My List" */}
              {userWatchlistShows.length > 0 ? (
                <FeedStrip
                  feed={{
                    id: 'my-list-watchlist',
                    title: 'My List',
                    categoryKey: 'watchlist',
                    enabled: true
                  }}
                  shows={shows}
                  customShows={userWatchlistShows}
                  watchlist={watchlist}
                  watchHistory={watchHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)}
                  onPlayShow={handlePlayShow}
                  onIncrementPoints={handleIncrementPoints}
                  isGlobalMuted={isGlobalMuted}
                  onToggleGlobalMute={handleToggleGlobalMute}
                  onHoverCardStart={() => setIsFeedCardHovered(true)}
                  onHoverCardEnd={() => setIsFeedCardHovered(false)}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  onLongPressShow={(s) => setActionSheetShow(s)}
                  enableStretchableCards={false}
                  showTop10Badges={adminSettings.showTop10Badges !== false}
                  modernTop10RankList={adminSettings.modernTop10RankList}
                  top10RankStyle={adminSettings.top10RankStyle}
                  likedShowIds={likedShowIds}
                  onToggleLike={handleToggleLike}
                  feedIndex={0}
                  isPaused={isHomepagePreviewPaused}
                  desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                />
              ) : (
                <div className="px-2.5 sm:px-4 md:px-8 xl:px-12">
                  <EmptyListCard variant="my_list" />
                </div>
              )}

              {/* 3rd Section: "Series & Films You've Liked" */}
              {likedShows.length > 0 ? (
                <FeedStrip
                  feed={{
                    id: 'my-list-liked',
                    title: "Series & Films You've Liked",
                    categoryKey: 'custom',
                    enabled: true
                  }}
                  shows={shows}
                  customShows={likedShows}
                  watchlist={watchlist}
                  watchHistory={watchHistory}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)}
                  onPlayShow={handlePlayShow}
                  onIncrementPoints={handleIncrementPoints}
                  isGlobalMuted={isGlobalMuted}
                  onToggleGlobalMute={handleToggleGlobalMute}
                  onHoverCardStart={() => setIsFeedCardHovered(true)}
                  onHoverCardEnd={() => setIsFeedCardHovered(false)}
                  isMobile={isMobile}
                  isTablet={isTablet}
                  onLongPressShow={(s) => setActionSheetShow(s)}
                  enableStretchableCards={false}
                  showTop10Badges={adminSettings.showTop10Badges !== false}
                  modernTop10RankList={adminSettings.modernTop10RankList}
                  top10RankStyle={adminSettings.top10RankStyle}
                  likedShowIds={likedShowIds}
                  onToggleLike={handleToggleLike}
                  feedIndex={0}
                  isPaused={isHomepagePreviewPaused}
                  desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                />
              ) : (
                <div className="px-2.5 sm:px-4 md:px-8 xl:px-12">
                  <EmptyListCard variant="liked" />
                </div>
              )}
            </div>
          </div>
        ) : selectedSpecialFeed ? (
          /* Redesigned Special Feed Page matching Image 1 & Image 2:
             - Hero backdrop covers top screen and goes under transparent navbar
             - Image scrolls naturally with page (not fixed, not applied as CSS background)
             - Only logo in bottom-left of hero backdrop
             - No topbar, no back button, no subtitle, no title quantity
             - 4-column card feed without rows matching categories page style */
          <SpecialFeedPage
            feed={selectedSpecialFeed.feed}
            shows={selectedSpecialFeed.shows}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
            onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)}
            onPlayShow={handlePlayShow}
            onIncrementPoints={handleIncrementPoints}
            isGlobalMuted={isGlobalMuted}
            onToggleGlobalMute={handleToggleGlobalMute}
            onHoverCardStart={() => setIsFeedCardHovered(true)}
            onHoverCardEnd={() => setIsFeedCardHovered(false)}
            isFeedCardHovered={isFeedCardHovered}
            desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
          />
        ) : selectedGenreView ? (
          /* Dedicated Genre Titles Page: identical top header name & 2:3 poster card grid as Category Card detail, without switching to Categories tab */
          <div
            className={`pb-36 w-full animate-in fade-in duration-300 ${
              isMobile ? 'pt-14 px-2.5 sm:px-4' : 'pt-28 lg:pt-32 px-8 xl:px-12'
            }`}
          >
            <div className="pt-2">
              {isMobile ? (
                <div className="fixed top-0 inset-x-0 z-50 h-14 bg-black px-4 flex items-center justify-between border-b border-white/10 select-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={handleCloseGenreView}
                      className="p-1 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer shrink-0"
                      aria-label="Back"
                    >
                      <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
                    </button>
                    <h1 className="text-lg font-black text-white tracking-tight truncate">
                      {selectedGenreView.name}
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-6 select-none">
                  <button
                    onClick={handleCloseGenreView}
                    className="p-1.5 -ml-1.5 text-white/85 hover:text-white hover:bg-white/10 rounded-full active:scale-90 transition-all cursor-pointer shrink-0"
                    aria-label="Back"
                  >
                    <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
                  </button>
                  <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                    {selectedGenreView.name}
                  </h1>
                </div>
              )}

              {genreViewMatchingShows.length > 0 ? (
                <div
                  className={`grid ${
                    isMobile
                      ? 'grid-cols-3 gap-2 sm:gap-2.5'
                      : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5'
                  }`}
                >
                  {genreViewMatchingShows.map((showItem) => (
                    <div
                      key={showItem.id}
                      data-show-id={showItem.id}
                      onClick={() => handleOpenDetails(showItem, 'trailer')}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                    >
                      <MediaImage
                        src={showItem.posterVerticalUrl || showItem.posterUrl || showItem.posterLandscapeUrl}
                        fallbackTitle={showItem.title}
                        fallbackClassName={`w-full h-full ${isMobile ? 'bg-[#111]' : 'bg-[#181818]'} flex items-center justify-center p-2.5 text-center select-none`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-24 text-center text-zinc-400 text-sm">
                  No titles found in {selectedGenreView.name}.
                </div>
              )}
            </div>
          </div>
        ) : activeFilter === 'categories' && !selectedCategoryFilter ? (
          /* Dedicated Categories View with top mobile filter strip (hidden when a mobile category detail grid is open) */
          <div className={`w-full ${adminSettings.mobileRecommendationStyle === 'poster_no_preview' && !isCategoriesDetailOpen ? 'pt-14' : ''}`}>
            {!isCategoriesDetailOpen && isMobile && (
              adminSettings.mobileRecommendationStyle === 'poster_no_preview' ? (
                <div
                  data-mobile-top-navbar="true"
                  style={{
                    backgroundColor: mobileHeaderOpacity > 0.05 ? `rgba(0, 0, 0, ${mobileHeaderOpacity})` : 'transparent'
                  }}
                  className={`fixed top-0 inset-x-0 z-50 w-full px-4 h-14 flex items-center justify-between select-none transition-colors duration-150 border-0 ${
                    mobileHeaderOpacity > 0.05 ? 'shadow-md' : 'shadow-none'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsHamburgerDrawerOpen(true)}
                      className="p-1 -ml-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="w-6 h-6 text-white" />
                    </button>

                    <div
                      onClick={handleGoHome}
                      className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                    >
                      {adminSettings.platformIconUrl ? (
                        <img
                          src={adminSettings.platformIconUrl}
                          alt={adminSettings.platformName || 'Platform'}
                          className="h-6.5 w-auto object-contain"
                        />
                      ) : adminSettings.customLogoUrl ? (
                        <img
                          src={adminSettings.customLogoUrl}
                          alt={adminSettings.platformName || 'Platform'}
                          className="h-6.5 w-auto object-contain"
                        />
                      ) : (
                        <span className="text-white font-black text-lg tracking-wider font-sans">
                          HBO <span className="font-light text-zinc-300">max</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsNotificationOpen((prev) => !prev)}
                      className="relative p-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5.5 h-5.5 text-white" />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative z-30 w-full px-4 pt-14 pb-[18px] flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
                  {[
                    { id: 'all' as const, label: 'All' },
                    { id: 'series' as const, label: 'Series' },
                    { id: 'movies' as const, label: 'Movies' },
                    { id: 'categories' as const, label: 'Categories' }
                  ].map((tab) => {
                    const isActive = activeFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setSelectedCategoryFilter(null);
                          handleSelectPage(tab.id);
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                          isActive
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-white/[0.08] hover:bg-white/15 text-white backdrop-blur-none border-0'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )
            )}
            <CategoriesView
              shows={shows}
              categories={categoriesList}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
              onPlayShow={handlePlayShow}
              onIncrementPoints={handleIncrementPoints}
              onCloseCategories={() => handleSelectPage('all')}
              onCategorySelectionChange={(cat) => {
                setIsCategoriesDetailOpen(Boolean(cat));
                if (activeFilter === 'categories' && !selectedCategoryFilter) {
                  if (cat) {
                    const slug = cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    pushRoute(`/categories/${encodeURIComponent(slug)}`);
                  } else {
                    pushRoute('/categories');
                  }
                }
              }}
              resetKey={categoriesResetKey}
              initialCategory={selectedCategoryFromGenre}
              mobileCategoriesStyle={adminSettings.mobileCategoriesStyle || 'grid'}
            />
          </div>
        ) : (
          <>
            {/* Mobile Top Header / Filter Strip (hidden on mobile when category detail grid uses Top-10-style header) */}
            {!selectedCategoryFilter && isMobile && (adminSettings.mobileRecommendationStyle === 'poster_no_preview' ? (
              /* Mobile Header: Hamburger Menu + Platform Icon on left, Notification Bell on right (without profile icon) */
              <div
                data-mobile-top-navbar="true"
                style={{
                  backgroundColor: mobileHeaderOpacity > 0.05 ? `rgba(0, 0, 0, ${mobileHeaderOpacity})` : 'transparent'
                }}
                className={`fixed top-0 inset-x-0 z-50 w-full px-4 h-14 flex items-center justify-between select-none transition-colors duration-150 border-0 ${
                  mobileHeaderOpacity > 0.05 ? 'shadow-md' : 'shadow-none'
                }`}
              >
                {/* Left: Hamburger menu icon + Platform icon/logo */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsHamburgerDrawerOpen(true)}
                    className="p-1 -ml-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-6 h-6 text-white" />
                  </button>

                  <div
                    onClick={handleGoHome}
                    className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
                  >
                    {adminSettings.platformIconUrl ? (
                      <img
                        src={adminSettings.platformIconUrl}
                        alt={adminSettings.platformName || 'Platform'}
                        className="h-6.5 w-auto object-contain"
                      />
                    ) : adminSettings.customLogoUrl ? (
                      <img
                        src={adminSettings.customLogoUrl}
                        alt={adminSettings.platformName || 'Platform'}
                        className="h-6.5 w-auto object-contain"
                      />
                    ) : (
                      <span className="text-white font-black text-lg tracking-wider font-sans">
                        HBO <span className="font-light text-zinc-300">max</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Notification Bell button ONLY (without profile icon) */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsNotificationOpen((prev) => !prev)}
                    className="relative p-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5.5 h-5.5 text-white" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Mobile Filter Strip: Natural transparent bar with tabs */
              <div className="relative z-30 w-full px-4 pt-14 pb-[18px] flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
                {[
                  { id: 'all' as const, label: 'All' },
                  { id: 'series' as const, label: 'Series' },
                  { id: 'movies' as const, label: 'Movies' },
                  { id: 'categories' as const, label: 'Categories' }
                ].map((tab) => {
                  const isActive = !searchQuery.trim() && !selectedCategoryFilter && activeFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelectedCategoryFilter(null);
                        handleSelectPage(tab.id);
                      }}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        isActive
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-white/[0.08] hover:bg-white/15 text-white backdrop-blur-none border-0'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ))}

            {/* 2. Hero Recommendation with Ambient Glow (Hidden on mobile when a Category grid is open) */}
            {currentHeroShow ? (
              <div className={selectedCategoryFilter && isMobile ? 'hidden' : ''}>
                <HeroRecommendation
                show={currentHeroShow}
                isInWatchlist={watchlist.includes(currentHeroShow.id)}
                onToggleWatchlist={handleToggleWatchlist}
                onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin || { sourceFeedType: 'other' })}
                onPlay={handlePlayShow}
                isPausedByFeedHover={isFeedCardHovered}
                isPausedByModal={
                  isHomepagePreviewPaused ||
                  activeFilter !== 'all' ||
                  searchQuery.trim().length > 0
                }
                isGlobalMuted={isGlobalMuted}
                onToggleGlobalMute={handleToggleGlobalMute}
                isMobile={isMobile && !isTablet}
                mobileRecommendationStyle={adminSettings.mobileRecommendationStyle || 'portrait'}
                useNoPreviewButtonsFor2x3Recommendation={Boolean(adminSettings.useNoPreviewButtonsFor2x3Recommendation)}
              />
              </div>
            ) : shows.length === 0 ? (
              <div className="min-h-[55vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-zinc-400 shadow-inner">
                  <Film className="w-8 h-8 text-zinc-300" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">No Titles in Database</h2>
                <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">
                  Link your <code className="text-amber-400 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">full_backup.json</code> file in <code className="text-amber-400 font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">src/</code> or add movies and series directly through the Admin Panel.
                </p>
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all cursor-pointer shadow-lg shadow-red-900/40 hover:scale-105 active:scale-95"
                >
                  Open Admin Panel
                </button>
              </div>
            ) : null}

            {/* Active Category Filter: Mobile gets Top-10-style fixed black header; Desktop keeps filter pill */}
            {Boolean(selectedCategoryFilter) && activeFilter !== 'series' && activeFilter !== 'movies' && (
              isMobile ? (
                <div className="fixed top-0 inset-x-0 z-50 h-14 bg-black px-4 flex items-center justify-between border-b border-white/10 select-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => {
                        setSelectedCategoryFilter(null);
                        handleSelectPage('categories');
                      }}
                      className="p-1 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer shrink-0"
                      aria-label="Back to categories"
                    >
                      <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
                    </button>
                    <h1 className="text-lg font-black text-white tracking-tight truncate">
                      {selectedCategoryFilter!.name}
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="flex relative z-30 w-full px-4 md:px-8 xl:px-12 my-3 sm:my-4 items-center justify-between">
                  <div className="inline-flex items-center gap-2.5 bg-white/20 backdrop-blur-sm text-white px-4 py-1.5 rounded-full shadow-sm text-xs sm:text-sm font-medium border-0">
                    <Filter className="w-4 h-4 text-white/90 shrink-0" />
                    <span className="text-zinc-200">Filtering by:</span>
                    <span className="text-white font-bold capitalize tracking-wide">
                      {selectedCategoryFilter!.name}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedCategoryFilter(null);
                        handleSelectPage('all');
                      }}
                      className="ml-2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/25 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                      aria-label="Clear filter"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              )
            )}

            {/* 3. Shows Display: If in selected category, display 3 in a row 2:3 cards matching Mobile More Like This, 4 per line on desktop */}
            {selectedCategoryFilter ? (
              <div
                className={`relative z-20 w-full px-2.5 sm:px-4 md:px-8 xl:px-12 ${
                  isMobile ? 'pt-16 mt-0' : 'pt-0 mt-6'
                } pb-16`}
              >
                {isMobile ? (
                /* Mobile Layout (portrait & landscape): 3 in a row, 2:3 aspect ratio cards matching DetailModal More Like This */
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {categoryMatchingShows.map((s) => (
                    <div
                      key={s.id}
                      data-show-id={s.id}
                      onClick={() => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                    >
                      <MediaImage
                        src={s.posterVerticalUrl || s.posterUrl || s.posterLandscapeUrl}
                        fallbackTitle={s.title}
                        fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-2.5 text-center select-none"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
                ) : (
                /* Tablet / Desktop Grid */
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {categoryMatchingShows.map((s) => (
                    <ShowCard
                      key={s.id}
                      show={s}
                      cardSize="full"
                      isInWatchlist={watchlist.includes(s.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onOpenDetails={(show, origin) => handleOpenDetails(show, 'trailer', 'main', undefined, undefined, origin)}
                      onPlay={handlePlayShow}
                      onIncrementPoints={handleIncrementPoints}
                      isGlobalMuted={isGlobalMuted}
                      onToggleGlobalMute={handleToggleGlobalMute}
                      onHoverPreviewStart={() => setIsFeedCardHovered(true)}
                      onHoverPreviewEnd={() => setIsFeedCardHovered(false)}
                      onLongPress={(show) => setActionSheetShow(show)}
                      popoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                    />
                  ))}
                </div>
                )}
              </div>
            ) : (() => {
              const isUnfilteredHome =
                activeFilter === 'all' && !selectedCategoryFilter && !searchQuery.trim();
              const canShowSignupBanner =
                isUnfilteredHome &&
                Boolean(adminSettings.signupTileEnabled) &&
                (adminSettings.signupTileLayouts || ['desktop', 'tablet', 'mobile']).includes(currentDeviceLayout);

              const useMobileBannerConfig =
                isMobile && !isTablet && Boolean(adminSettings.signupTileSeparateMobile);
              const bannerTitle = useMobileBannerConfig
                ? adminSettings.signupTileMobileTitle
                : adminSettings.signupTileTitle;
              const bannerSubtitle = useMobileBannerConfig
                ? (adminSettings.signupTileMobileSubtitle ?? '')
                : (adminSettings.signupTileSubtitle ?? '');
              const bannerButtonText = useMobileBannerConfig
                ? adminSettings.signupTileMobileButtonText
                : adminSettings.signupTileButtonText;
              const bannerImageUrl = useMobileBannerConfig
                ? adminSettings.signupTileMobileImageUrl
                : adminSettings.signupTileImageUrl;
              const bannerUseCustomLogo = useMobileBannerConfig
                ? Boolean(adminSettings.signupTileMobileUseCustomLogo ?? adminSettings.useCustomLogo)
                : Boolean(adminSettings.signupTileUseCustomLogo ?? adminSettings.useCustomLogo);
              const bannerCustomLogoUrl = useMobileBannerConfig
                ? (adminSettings.signupTileMobileCustomLogoUrl?.trim() || adminSettings.customLogoUrl)
                : (adminSettings.signupTileCustomLogoUrl?.trim() || adminSettings.customLogoUrl);
              const bannerContainerMode =
                isMobile && !isTablet
                  ? (adminSettings.signupTileMobileContainerMode || adminSettings.signupTileContainerMode || 'contained')
                  : (adminSettings.signupTileContainerMode || 'contained');

              const renderSignupBanner = () => (
                <SignupTileBanner
                  shows={shows}
                  title={bannerTitle}
                  subtitle={bannerSubtitle}
                  buttonText={bannerButtonText}
                  imageUrl={bannerImageUrl}
                  platformName={platformName}
                  customLogoUrl={bannerCustomLogoUrl}
                  useCustomLogo={bannerUseCustomLogo}
                  containerMode={bannerContainerMode}
                  onActionClick={() => openLoginPage('create')}
                />
              );

              const canShowAdTile =
                isUnfilteredHome &&
                Boolean(adminSettings.adTileEnabled) &&
                matchesAdLayout(adminSettings.adTileLayouts);
              const useMobileAdTileConfig =
                isMobile && !isTablet && Boolean(adminSettings.adTileSeparateMobile);

              const renderHomepageAdTile = () => (
                <AdTileBanner
                  title={useMobileAdTileConfig ? adminSettings.adTileMobileTitle : adminSettings.adTileTitle}
                  subtitle={useMobileAdTileConfig ? adminSettings.adTileMobileSubtitle : adminSettings.adTileSubtitle}
                  buttonText={useMobileAdTileConfig ? adminSettings.adTileMobileButtonText : adminSettings.adTileButtonText}
                  buttonUrl={useMobileAdTileConfig ? adminSettings.adTileMobileButtonUrl : adminSettings.adTileButtonUrl}
                  imageUrl={useMobileAdTileConfig ? adminSettings.adTileMobileImageUrl : adminSettings.adTileImageUrl}
                  logoImageUrl={useMobileAdTileConfig ? adminSettings.adTileMobileLogoImageUrl : adminSettings.adTileLogoImageUrl}
                  containerMode={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileContainerMode || adminSettings.adTileContainerMode || 'contained')
                      : (adminSettings.adTileContainerMode || 'contained')
                  }
                  aspectHeight={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileAspectHeight || adminSettings.adTileAspectHeight || 'default')
                      : (adminSettings.adTileAspectHeight || 'default')
                  }
                  imageGlare={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileImageGlare !== false)
                      : (adminSettings.adTileImageGlare !== false)
                  }
                  badgePosition={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileBadgePosition || adminSettings.adTileBadgePosition || 'bottom_left')
                      : (adminSettings.adTileBadgePosition || 'bottom_left')
                  }
                  textPosition={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileTextPosition || adminSettings.adTileTextPosition || 'center')
                      : (adminSettings.adTileTextPosition || 'center')
                  }
                  buttonPosition={
                    useMobileAdTileConfig
                      ? (adminSettings.adTileMobileButtonPosition || adminSettings.adTileButtonPosition || 'center')
                      : (adminSettings.adTileButtonPosition || 'center')
                  }
                  showCloseButton={
                    useMobileAdTileConfig
                      ? Boolean(adminSettings.adTileMobileShowCloseButton ?? adminSettings.adTileShowCloseButton)
                      : Boolean(adminSettings.adTileShowCloseButton)
                  }
                  onNavigateInternal={handleNavigateInternalUrl}
                />
              );

              type FeedRowItem = (typeof dailyFeeds)[number];
              type HomeRowEntry =
                | { key: string; kind: 'feed'; row: FeedRowItem }
                | { key: string; kind: 'single_special' }
                | { key: string; kind: 'start_ep1' }
                | { key: string; kind: 'signup_tile' }
                | { key: string; kind: 'ad_tile' }
                | { key: string; kind: 'browse_genre' };

              let orderedRows: HomeRowEntry[];
              if (!isUnfilteredHome) {
                orderedRows = dailyFeeds.map((row) => ({ key: row.id, kind: 'feed', row }));
              } else {
                // Session-frozen PRNG seeded ONCE per reload/reopen so rows never shift while browsing
                let seed = (sessionRowSeed * 2654435761 + 1013904223) >>> 0;
                const nextRand = () => {
                  seed = (seed + 0x6d2b79f5) >>> 0;
                  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
                };

                let keepWatchingEntry: HomeRowEntry | null = null;
                const regularFeeds: HomeRowEntry[] = [];
                const randomInsertPool: HomeRowEntry[] = [];

                dailyFeeds.forEach((row) => {
                  if (row.id === 'feed-continue-watching' || row.categoryKey === 'continue_watching') {
                    keepWatchingEntry = { key: row.id, kind: 'feed', row };
                  } else if (row.isSpecialFeed || row.isStretchableFeed) {
                    randomInsertPool.push({ key: row.id, kind: 'feed', row });
                  } else {
                    regularFeeds.push({ key: row.id, kind: 'feed', row });
                  }
                });

                if (specialSingleFeedShows.length > 0) {
                  randomInsertPool.push({ key: 'special-single-feed', kind: 'single_special' });
                }
                if (adminSettings.startFromFirstEpisodeEnabled !== false) {
                  randomInsertPool.push({ key: 'start-from-first-episode', kind: 'start_ep1' });
                }
                if (canShowSignupBanner) {
                  randomInsertPool.push({ key: 'signup-tile-banner', kind: 'signup_tile' });
                }
                if (canShowAdTile) {
                  randomInsertPool.push({ key: 'homepage-ad-tile', kind: 'ad_tile' });
                }

                // Fisher-Yates shuffle the special/featured/ad modules before random insertion
                for (let i = randomInsertPool.length - 1; i > 0; i--) {
                  const j = Math.floor(nextRand() * (i + 1));
                  const tmp = randomInsertPool[i];
                  randomInsertPool[i] = randomInsertPool[j];
                  randomInsertPool[j] = tmp;
                }

                const assembled: HomeRowEntry[] = [...regularFeeds];
                const minInsertIdx = 1;

                randomInsertPool.forEach((item) => {
                  const span = Math.max(1, assembled.length - minInsertIdx + 1);
                  const insertAt = minInsertIdx + Math.floor(nextRand() * span);
                  assembled.splice(insertAt, 0, item);
                });

                // Place Browse by Genre inside the last 5 rows in BOTH desktop and mobile layouts
                const genreMinIdx = Math.max(minInsertIdx, assembled.length - 4);
                const genreSpan = Math.max(1, assembled.length - genreMinIdx + 1);
                const genreInsertIdx = genreMinIdx + Math.floor(nextRand() * genreSpan);
                assembled.splice(genreInsertIdx, 0, { key: 'browse-by-genre', kind: 'browse_genre' });

                // Re-insert Keep Watching live at row index 1 (right below first row) so adding/removing
                // Keep Watching items updates live WITHOUT shifting the random order of any other rows!
                if (keepWatchingEntry) {
                  const kwIdx = assembled.length > 0 ? 1 : 0;
                  assembled.splice(kwIdx, 0, keepWatchingEntry);
                }

                orderedRows = assembled;
              }

              return (
                <div className="relative z-20 space-y-5 sm:space-y-6 md:space-y-7 mt-2 md:mt-3">
                  {orderedRows.map((entry, idx) => {
                    if (entry.kind === 'single_special') {
                      return (
                        <SpecialSingleFeed
                          key={entry.key}
                          shows={specialSingleFeedShows}
                          onPlay={handlePlayShow}
                          onOpenDetails={(s, origin) =>
                            handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin || { sourceFeedType: 'other' })
                          }
                          watchlist={watchlist}
                          onToggleWatchlist={handleToggleWatchlist}
                          isGlobalMuted={isGlobalMuted}
                          onToggleGlobalMute={handleToggleGlobalMute}
                          isMobile={isMobile && !isTablet}
                          isPaused={isHomepagePreviewPaused}
                          isAnyOtherCardHovered={isFeedCardHovered}
                        />
                      );
                    }

                    if (entry.kind === 'browse_genre') {
                      return (
                        <BrowseByGenreRow
                          key={entry.key}
                          categories={categoriesList}
                          shows={shows}
                          managedGenres={adminSettings.managedGenres}
                          onSelectGenre={handleSelectGenreFromFeed}
                        />
                      );
                    }

                    if (entry.kind === 'start_ep1') {
                      return (
                        <StartFromFirstEpisodeRow
                          key={entry.key}
                          shows={shows}
                          selectedShowIds={adminSettings.startFromFirstEpisodeShowIds}
                          onPlayEpisode={(show, ep) => handlePlayShow(show, ep)}
                          onOpenDetails={(s, origin) =>
                            handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)
                          }
                          watchlist={watchlist}
                          onToggleWatchlist={handleToggleWatchlist}
                          onIncrementPoints={handleIncrementPoints}
                          desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                        />
                      );
                    }

                    if (entry.kind === 'signup_tile') {
                      return <React.Fragment key={entry.key}>{renderSignupBanner()}</React.Fragment>;
                    }

                    if (entry.kind === 'ad_tile') {
                      return <React.Fragment key={entry.key}>{renderHomepageAdTile()}</React.Fragment>;
                    }

                    const row = entry.row;
                    return (
                      <FeedStrip
                        key={row.id}
                        feed={{
                          id: row.id,
                          title: row.title,
                          subtitle: row.subtitle,
                          categoryKey: (row.categoryKey as any) || 'custom',
                          enabled: true,
                          showRankNumbers: row.showRankNumbers,
                          isCuratedByAdmin: row.isCuratedByAdmin,
                          isSpecialFeed: row.isSpecialFeed,
                          isStretchableFeed: row.isStretchableFeed,
                          specialLogoUrl: row.specialLogoUrl,
                          specialTagline: row.specialTagline,
                          specialExploreText: row.specialExploreText,
                          specialShowActionButton: row.specialShowActionButton,
                          specialExploreAction: row.specialExploreAction,
                          specialExploreCategory: row.specialExploreCategory,
                          specialBgImageUrl: row.specialBgImageUrl,
                          specialBgDarkness: row.specialBgDarkness,
                          specialBgColor: row.specialBgColor
                        }}
                        shows={shows}
                        customShows={row.shows}
                        watchlist={watchlist}
                        watchHistory={watchHistory}
                        onToggleWatchlist={handleToggleWatchlist}
                        onOpenDetails={(s, origin) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, origin)}
                        onPlayShow={handlePlayShow}
                        onIncrementPoints={handleIncrementPoints}
                        isGlobalMuted={isGlobalMuted}
                        onToggleGlobalMute={handleToggleGlobalMute}
                        onHoverCardStart={() => setIsFeedCardHovered(true)}
                        onHoverCardEnd={() => setIsFeedCardHovered(false)}
                        onExploreSpecialFeed={(f, fShows) => handleExploreSpecialFeed(f, fShows)}
                        onEditFeed={(feedId) => handleEditCuratedFeed(feedId)}
                        isMobile={isMobile}
                        isTablet={isTablet}
                        onLongPressShow={(s) => setActionSheetShow(s)}
                        enableStretchableCards={adminSettings.enableStretchableCards !== false}
                        showTop10Badges={adminSettings.showTop10Badges !== false}
                        modernTop10RankList={adminSettings.modernTop10RankList}
                        top10RankStyle={adminSettings.top10RankStyle}
                        likedShowIds={likedShowIds}
                        onToggleLike={handleToggleLike}
                        feedIndex={idx}
                        isPaused={isHomepagePreviewPaused}
                        desktopPopoutStyle={adminSettings.desktopPopoutStyle || 'classic'}
                      />
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}

        {/* Global Redesign Footer */}
        <Footer
          shows={shows}
          onOpenAccount={() => {
            if (!isLoggedIn) {
              openLoginPage('login');
              return;
            }
            setIsAccountModalOpen(true);
            pushRoute('/account');
          }}
          onOpenSettings={() => {
            setIsAppSettingsModalOpen(true);
            pushRoute('/settings');
          }}
          onRequestContent={() => setIsRequestContentModalOpen(true)}
          onOpenCategories={() => handleSelectPage('categories')}
          platformName={platformName}
          isMyListPage={activeFilter === 'watchlist' || Boolean(sharedTitleShow && !isMobile)}
        />
      </main>

      {/* 4. Full Detailed Page / Modal */}
      {selectedShowForDetail && (isMobile || !adminSettings.useFullSizeMoreInfoByDefault) && (() => {
        const liveSelectedShow = shows.find((s) => s.id === selectedShowForDetail.id) || selectedShowForDetail;
        return (
        <DetailModal
          show={liveSelectedShow}
          allShows={shows}
          adminSettings={adminSettings}
          isInWatchlist={watchlist.includes(selectedShowForDetail.id)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onClose={handleCloseDetails}
          onPlayShow={handlePlayShow}
          onMobileSeasonSheetChange={setIsMobileSeasonPickerOpen}
          onMobileInfoSheetChange={setIsMobileInfoSheetOpen}
          onSelectShow={(newShow) => handleOpenDetails(newShow, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
          onSelectActor={(actor) => handleSelectActorForPool(actor)}
          currentAdLayout={currentAdDeviceLayout}
          onNavigateInternal={handleNavigateInternalUrl}
          onSelectGenre={(genre) => {
            handleCloseDetails();
            setSearchQuery(genre);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onUpdateShowBlog={handleUpdateShowBlog}
          watchProgress={selectedShowForDetail ? watchHistory[selectedShowForDetail.id] : undefined}
          onWatchInFullPlayer={(s, ep, trailer, initialSeekTime) => {
            try {
              const prePlayerUrl = `${window.location.pathname}${window.location.search}`;
              const slug = s.slug || s.id || s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              const cleanUrl = buildCleanWatchUrl(
                s,
                ep?.id || null,
                { subView: 'main', trailerId: trailer?.id || null }
              );
              window.history.pushState(
                { ...(window.history.state || {}), showId: s.id, slug, isFullPlayer: true, prePlayerUrl },
                '',
                cleanUrl
              );
            } catch {}
            const epSubtitle = trailer
              ? trailer.title
              : ep
              ? ep.subheading
                ? `S${ep.seasonNumber || 1}: E${ep.episodeNumber} "${ep.title}" • ${ep.subheading}`
                : `S${ep.seasonNumber || 1}: E${ep.episodeNumber} "${ep.title}"`
              : s.type === 'movie'
              ? `${s.releaseYear.split('-')[0]} • Full Movie`
              : 'Trailer & Preview';
            const vUrl = trailer ? trailer.videoUrl : ep ? ep.videoUrl : (s.movieStreamUrl || s.trailerUrl || s.hoverPreviewUrl || '');
            const vType = trailer
              ? trailer.videoSourceType
              : ep
              ? ep.videoSourceType
              : (s.movieStreamType || 'direct');

            // Find next episode if playing an episode
            let nextEp = null;
            if (ep && s.seasons && s.seasons.length > 0) {
              const currentSeason = s.seasons.find((sea) => sea.seasonNumber === ep.seasonNumber) || s.seasons[0];
              const epIndex = currentSeason.episodes.findIndex((e) => e.id === ep.id);
              if (epIndex >= 0 && epIndex < currentSeason.episodes.length - 1) {
                nextEp = currentSeason.episodes[epIndex + 1];
              }
            }

            // Calculate exact frame seek position
            const startSec = parseTimeToSeconds(ep?.startTime) || 0;
            const epKey = ep?.id || (ep?.episodeNumber !== undefined ? `s${ep?.seasonNumber || 1}e${ep?.episodeNumber}` : 'movie');
            const epProgress = s && watchHistory[s.id]?.episodesProgress?.[epKey];

            // CRITICAL FIX: Only use top-level watchHistory if it belongs to this exact episode!
            const isSameEpisodeAsHistory = Boolean(
              ep &&
              ((watchHistory[s.id]?.episodeId && watchHistory[s.id]?.episodeId === ep.id) ||
               (watchHistory[s.id]?.episodeNumber && watchHistory[s.id]?.episodeNumber === ep.episodeNumber))
            );

            let effectiveSeek = startSec;
            if (initialSeekTime !== undefined) {
              effectiveSeek = initialSeekTime;
            } else if (epProgress?.rawVideoTime !== undefined && epProgress.rawVideoTime > 0) {
              effectiveSeek = epProgress.rawVideoTime;
            } else if (epProgress?.currentTime !== undefined && epProgress.currentTime > 0) {
              effectiveSeek = startSec + epProgress.currentTime;
            } else if (isSameEpisodeAsHistory && watchHistory[s.id]?.rawVideoTime && watchHistory[s.id]!.rawVideoTime! > 0) {
              effectiveSeek = watchHistory[s.id]!.rawVideoTime!;
            } else if (isSameEpisodeAsHistory && watchHistory[s.id]?.currentTime && watchHistory[s.id]!.currentTime > 0) {
              effectiveSeek = startSec + watchHistory[s.id]!.currentTime;
            } else {
              effectiveSeek = startSec;
            }

            // Record user watch progress history: ONLY for episodes and movies, NEVER for trailers
            const isTrailer = Boolean(trailer) || (s.type === 'series' && !ep);
            if (!isTrailer) {
              if (ep) {
                recordWatchProgress(
                  s,
                  ep.seasonNumber,
                  ep.episodeNumber,
                  ep.title,
                  vUrl,
                  vType,
                  ep.thumbnailUrl,
                  ep.id,
                  effectiveSeek
                );
              } else if (s.type === 'movie') {
                recordWatchProgress(
                  s,
                  undefined,
                  undefined,
                  s.title,
                  vUrl,
                  vType,
                  s.posterLandscapeUrl || s.backdropUrl,
                  undefined,
                  effectiveSeek
                );
              }
            }

            setPlayingMedia({
              show: s,
              videoUrl: vUrl,
              videoSourceType: vType,
              title: s.title,
              subtitle: epSubtitle,
              episodeSubtitle: epSubtitle,
              titleLogoUrl: s.titleLogoUrl,
              previewThumbnailUrl: trailer?.thumbnailUrl || ep?.thumbnailUrl || s.posterLandscapeUrl || s.backdropUrl,
              startTime: ep?.startTime,
              endTime: ep?.endTime,
              initialCurrentTime: effectiveSeek,
              isTrailer: isTrailer,
              playerBgImageUrl: ep?.playerBgImageUrl || s.backdropUrl,
              seasonNumber: ep?.seasonNumber,
              episodeNumber: ep?.episodeNumber,
              episodeId: ep?.id,
              episodeTitle: ep?.title,
              hasNextEpisode: Boolean(nextEp),
              nextEpisodeInfo: nextEp
                ? {
                    videoUrl: nextEp.videoUrl,
                    videoSourceType: nextEp.videoSourceType,
                    subtitle: nextEp.subheading
                      ? `S${nextEp.seasonNumber || 1}: E${nextEp.episodeNumber} "${nextEp.title}" • ${nextEp.subheading}`
                      : `S${nextEp.seasonNumber || 1}: E${nextEp.episodeNumber} "${nextEp.title}"`,
                    episodeSubtitle: nextEp.subheading
                      ? `S${nextEp.seasonNumber || 1}: E${nextEp.episodeNumber} "${nextEp.title}" • ${nextEp.subheading}`
                      : `S${nextEp.seasonNumber || 1}: E${nextEp.episodeNumber} "${nextEp.title}"`,
                    previewThumbnailUrl: nextEp.thumbnailUrl,
                    startTime: nextEp.startTime,
                    endTime: nextEp.endTime,
                    playerBgImageUrl: nextEp.playerBgImageUrl || s.backdropUrl,
                    seasonNumber: nextEp.seasonNumber,
                    episodeNumber: nextEp.episodeNumber
                  }
                : null
            });
          }}
          initialVideoMode={detailVideoMode}
          initialEpisodeId={detailEpisodeId}
          initialTrailerId={detailTrailerId}
          initialSubView={detailSubView}
          onSubViewChange={handleSubViewChange}
          top10ShowIds={[...shows].sort((a, b) => b.points - a.points).slice(0, 10).map((s) => s.id)}
          isGlobalMuted={isGlobalMuted}
          onToggleGlobalMute={handleToggleGlobalMute}
          isFullPlayerOpen={Boolean(playingMedia)}
          likedShowIds={likedShowIds}
          onToggleLike={handleToggleLike}
          originMeta={detailOriginMeta}
        />
        );
      })()}

      {/* 5. Cast Pool Modal (When an actor is clicked) */}
      {selectedActorForPool && (
        <CastPoolModal
          actor={selectedActorForPool}
          allShows={shows}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onClose={handleCloseActorPool}
          onSelectShow={(s) => {
            handleCloseActorPool();
            if (sharedTitleShow && !isMobile) {
              if (sharedTitleShowRef.current && sharedTitleShowRef.current.id !== s.id) {
                shareBackStackRef.current.push(sharedTitleShowRef.current);
              }
              setDetailOriginMeta({ sourceFeedType: 'other' });
              setSharedTitleShow(s);
              const scroller = document.querySelector<HTMLElement>('[data-share-overlay-scroll="true"]');
              if (scroller) scroller.scrollTop = 0;
              const nextWatchUrl = buildCleanWatchUrl(s);
              if (`${window.location.pathname}${window.location.search}` !== nextWatchUrl) {
                window.history.pushState({ showId: s.id, fullSizeMoreInfo: true }, '', nextWatchUrl);
              }
            } else {
              handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
            }
          }}
          onPlayShow={(s) => {
            handleCloseActorPool();
            handlePlayShow(s);
          }}
        />
      )}

      {/* 6. Saved Watchlist Modal */}
      <WatchlistModal
        isOpen={isWatchlistModalOpen}
        onClose={() => setIsWatchlistModalOpen(false)}
        watchlistShows={watchlistShows}
        onRemoveFromWatchlist={handleToggleWatchlist}
        onSelectShow={(s) => {
          setIsWatchlistModalOpen(false);
          handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onPlayShow={(s) => {
          setIsWatchlistModalOpen(false);
          handlePlayShow(s);
        }}
      />

      {/* 7. Download App Modal for PC & TV */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => {
          setIsDownloadModalOpen(false);
          setIsRecommendationPaused(false);
        }}
        platformName={platformName}
      />

      {/* 8. Full Page Account / Edit Profile Settings (only accessible when logged in) */}
      <EditProfilePage
        isOpen={isLoggedIn && isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setIsRecommendationPaused(false);
          pushRoute('/');
        }}
        platformName={platformName}
        userAvatar={userAvatar}
        userName={userName}
        userHandle={userHandle}
        userEmail={userEmail}
        userWhatsapp={userWhatsapp}
        userPassword={userPassword}
        onSaveProfile={(p) => {
          setUserAvatar(p.avatar);
          setUserName(p.name);
          setUserHandle(p.handle);
          setUserEmail(p.email);
          setUserWhatsapp(p.whatsapp);
          try {
            localStorage.setItem('cineflix_user_avatar', p.avatar);
            localStorage.setItem('cineflix_user_name', p.name);
            localStorage.setItem('cineflix_user_handle', p.handle);
            localStorage.setItem('cineflix_user_email', p.email);
            localStorage.setItem('cineflix_user_whatsapp', p.whatsapp);
          } catch {}
          if (p.password) {
            setUserPassword(p.password);
            localStorage.setItem('cineflix_user_password', p.password);
          }
        }}
      />

      {/* 10. App Settings Modal (Playback, Data, Downloads, Audio) */}
      <AppSettingsModal
        isOpen={isAppSettingsModalOpen}
        onClose={() => {
          setIsAppSettingsModalOpen(false);
          setIsRecommendationPaused(false);
          pushRoute('/');
        }}
        platformName={platformName}
        onClearWatchlist={handleClearWatchlist}
        onClearWatchHistory={handleClearWatchHistory}
      />

      {/* 11. Request Content Modal */}
      <RequestContentModal
        isOpen={isRequestContentModalOpen}
        onClose={() => {
          setIsRequestContentModalOpen(false);
          setIsRecommendationPaused(false);
        }}
      />

      {/* 12. Fullscreen Video Player: Embed Modal for YouTube/Dailymotion OR CustomPlayer for direct stream */}
      {playingMedia && (
        isEmbedVideo(playingMedia.videoUrl, playingMedia.videoSourceType) ? (
          <EmbedPlayerModal
            isOpen={true}
            title={playingMedia.title}
            subtitle={playingMedia.subtitle}
            videoUrl={playingMedia.videoUrl}
            videoSourceType={playingMedia.videoSourceType}
            startTime={playingMedia.startTime}
            endTime={playingMedia.endTime}
            initialCurrentTime={playingMedia.initialCurrentTime || 0}
            onProgressUpdate={(cur, dur, raw) => {
              if (playingMedia.isTrailer) return;
              handleProgressUpdate(
                playingMedia.show,
                cur,
                dur,
                playingMedia.seasonNumber,
                playingMedia.episodeNumber,
                playingMedia.episodeTitle || playingMedia.subtitle,
                playingMedia.episodeId,
                playingMedia.videoUrl,
                playingMedia.videoSourceType,
                playingMedia.isTrailer,
                raw
              );
            }}
            playerBgImageUrl={playingMedia.show?.embedBackdropUrl || playingMedia.playerBgImageUrl || playingMedia.show.backdropUrl}
            titleLogoUrl={playingMedia.titleLogoUrl}
            seasonNumber={playingMedia.seasonNumber}
            episodeNumber={playingMedia.episodeNumber}
            hasNextEpisode={playingMedia.hasNextEpisode}
            dailymotionScriptUrl={adminSettings.dailymotionScriptUrl}
            backdropDarkness={playingMedia.show?.embedBackdropDarkness ?? 35}
            backdropBlur={playingMedia.show?.embedBackdropBlur ?? 0}
            autoFullscreenLandscapeOnMobile={Boolean(adminSettings.mobileAutoFullscreenLandscapeEmbed)}
            isEpisodePlayback={!playingMedia.isTrailer}
            onNextEpisode={() => {
              if (playingMedia.nextEpisodeInfo) {
                const next = playingMedia.nextEpisodeInfo;
                // Find next-next episode if available
                let nextNextEp = null;
                if (playingMedia.show.seasons && playingMedia.show.seasons.length > 0) {
                  const currentSeason = playingMedia.show.seasons.find((sea) => sea.seasonNumber === next.seasonNumber) || playingMedia.show.seasons[0];
                  const epIndex = currentSeason.episodes.findIndex((e) => e.episodeNumber === next.episodeNumber);
                  if (epIndex >= 0 && epIndex < currentSeason.episodes.length - 1) {
                    nextNextEp = currentSeason.episodes[epIndex + 1];
                  }
                }

                // Update progress history for next episode
                recordWatchProgress(
                  playingMedia.show,
                  next.seasonNumber,
                  next.episodeNumber,
                  next.subtitle,
                  next.videoUrl,
                  next.videoSourceType,
                  next.previewThumbnailUrl,
                  next.episodeId
                );

                setPlayingMedia({
                  ...playingMedia,
                  videoUrl: next.videoUrl,
                  videoSourceType: next.videoSourceType,
                  subtitle: next.subtitle,
                  episodeSubtitle: next.episodeSubtitle,
                  previewThumbnailUrl: next.previewThumbnailUrl,
                  startTime: next.startTime,
                  endTime: next.endTime,
                  initialCurrentTime: 0,
                  playerBgImageUrl: next.playerBgImageUrl || playingMedia.show.backdropUrl,
                  seasonNumber: next.seasonNumber,
                  episodeNumber: next.episodeNumber,
                  episodeId: next.episodeId,
                  hasNextEpisode: Boolean(nextNextEp),
                  nextEpisodeInfo: nextNextEp
                    ? {
                        videoUrl: nextNextEp.videoUrl,
                        videoSourceType: nextNextEp.videoSourceType,
                        subtitle: `S1: E${nextNextEp.episodeNumber} "${nextNextEp.title}"`,
                        episodeSubtitle: `S1: E${nextNextEp.episodeNumber} "${nextNextEp.title}"`,
                        previewThumbnailUrl: nextNextEp.thumbnailUrl,
                        startTime: nextNextEp.startTime,
                        endTime: nextNextEp.endTime,
                        playerBgImageUrl: nextNextEp.playerBgImageUrl || playingMedia.show.backdropUrl,
                        seasonNumber: nextNextEp.seasonNumber,
                        episodeNumber: nextNextEp.episodeNumber,
                        episodeId: nextNextEp.id
                      }
                    : null
                });
              }
            }}
            onClose={handleCloseFullPlayer}
          />
        ) : (
          <CustomPlayer
            videoUrl={playingMedia.videoUrl}
            title={playingMedia.title}
            subtitle={playingMedia.subtitle}
            episodeSubtitle={playingMedia.episodeSubtitle}
            titleLogoUrl={playingMedia.titleLogoUrl}
            previewThumbnailUrl={playingMedia.previewThumbnailUrl}
            autoPlay={true}
            initialCurrentTime={playingMedia.initialCurrentTime || 0}
            isFullscreenDesign={Boolean(adminSettings.mobileAutoFullscreenLandscapeEmbed && !playingMedia.isTrailer)}
            onProgressUpdate={(cur, dur) => {
              if (playingMedia.isTrailer) return;
              handleProgressUpdate(
                playingMedia.show,
                cur,
                dur,
                playingMedia.seasonNumber,
                playingMedia.episodeNumber,
                playingMedia.episodeTitle || playingMedia.subtitle,
                playingMedia.episodeId,
                playingMedia.videoUrl,
                playingMedia.videoSourceType,
                playingMedia.isTrailer
              );
            }}
            onClose={handleCloseFullPlayer}
          />
        )
      )}

      {/* Mobile Real-Time Search Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => {
          setIsMobileSearchOpen(false);
          setSearchQuery('');
          pushRoute('/');
        }}
        shows={shows}
        watchlist={watchlist}
        onToggleWatchlist={handleToggleWatchlist}
        initialQuery={searchQuery}
        onQueryChange={(q) => {
          setSearchQuery(q);
          if (q.trim()) {
            pushRoute(`/search?q=${encodeURIComponent(q.trim())}`, true);
          } else {
            pushRoute('/search', true);
          }
        }}
        onOpenDetails={(s) => {
          setIsMobileSearchOpen(false);
          handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onPlayShow={(s) => {
          setIsMobileSearchOpen(false);
          handlePlayShow(s);
        }}
        adminSettings={adminSettings}
        onNavigateInternal={handleNavigateInternalUrl}
      />

      {/* Mobile Profile & My List Modal */}
      <MobileProfileModal
        isOpen={isMobileProfileOpen}
        onClose={() => {
          setIsMobileProfileOpen(false);
          pushRoute('/');
        }}
        userName={userName}
        userAvatar={userAvatar}
        watchHistory={watchHistory}
        onOpenPosterActionSheet={(s) => setActionSheetShow(s)}
        watchlistShows={watchlistShows}
        continueWatchingShows={continueWatchingShows}
        likedShows={likedShows}
        onRemoveFromWatchlist={handleToggleWatchlist}
        onRemoveFromContinueWatching={handleRemoveFromWatchHistory}
        onClearWatchlist={handleClearWatchlist}
        onClearWatchHistory={handleClearWatchHistory}
        onOpenDetails={(s) => {
          setIsMobileProfileOpen(false);
          handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onPlayShow={(s) => {
          setIsMobileProfileOpen(false);
          handlePlayShow(s);
        }}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
        onOpenShowById={(showId) => {
          setIsMobileProfileOpen(false);
          const found = shows.find((s) => s.id === showId);
          if (found) handleOpenDetails(found, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onOpenAccountModal={() => {
          setIsMobileProfileOpen(false);
          setIsAccountModalOpen(true);
          pushRoute('/account');
        }}
        onOpenAppSettings={() => {
          setIsMobileProfileOpen(false);
          setIsAppSettingsModalOpen(true);
          pushRoute('/settings');
        }}
        onRequestContent={() => {
          setIsMobileProfileOpen(false);
          setIsRequestContentModalOpen(true);
        }}
        onOpenDownloadModal={() => {
          setIsMobileProfileOpen(false);
          setIsDownloadModalOpen(true);
        }}
        onOpenAdminPanel={() => {
          setIsMobileProfileOpen(false);
          setIsAdminPanelOpen(true);
        }}
        onToggleAuth={handleSignOut}
        onOpenCreateAccount={() => {
          setIsMobileProfileOpen(false);
          openLoginPage('create');
        }}
        isLoggedIn={isLoggedIn}
        onSelectAvatar={(avatarUrl) => {
          setUserAvatar(avatarUrl);
          try {
            localStorage.setItem('cineflix_user_avatar', avatarUrl);
          } catch {}
        }}
        onUpdateUserName={(name) => {
          setUserName(name);
          try {
            localStorage.setItem('cineflix_user_name', name);
          } catch {}
        }}
        userHandle={userHandle}
        onUpdateUserHandle={(handle) => {
          setUserHandle(handle);
          try {
            localStorage.setItem('cineflix_user_handle', handle);
          } catch {}
        }}
        onProfileEditOpenChange={setIsMobileProfileEditOpen}
      />

      {/* Mobile Poster Holding Action Sheet */}
      <MobilePosterActionSheet
        show={actionSheetShow}
        isOpen={Boolean(actionSheetShow)}
        onClose={() => setActionSheetShow(null)}
        isInWatchlist={actionSheetShow ? watchlist.includes(actionSheetShow.id) : false}
        onToggleWatchlist={handleToggleWatchlist}
        onPlayShow={(s) => handlePlayShow(s)}
        onWatchTrailer={(s) => {
          handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onOpenDetails={(s) => handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' })}
        watchProgress={actionSheetShow ? watchHistory[actionSheetShow.id] : undefined}
        onRestartShow={(s) => {
          try {
            const saved = localStorage.getItem('cineflix_watch_progress');
            if (saved) {
              const parsed = JSON.parse(saved);
              delete parsed[s.id];
              localStorage.setItem('cineflix_watch_progress', JSON.stringify(parsed));
              setWatchHistory((prev) => {
                const next = { ...prev };
                delete next[s.id];
                return next;
              });
            }
          } catch {}
          handlePlayShow(s);
        }}
        onDownload={() => {
          setIsDownloadModalOpen(true);
        }}
        onShare={(s) => {
          handleOpenDetails(s, 'trailer', 'main', undefined, undefined, { sourceFeedType: 'other' });
        }}
        onRemoveFromContinueWatching={(sId) => {
          handleRemoveFromWatchHistory(sId);
        }}
      />

      {/* Mobile Floating / Bottom-Fixed Navigation Bar: stays visible behind PIN lock with empty avatar slot until PIN unlock completes */}
      {isMobile && !isTablet && !actionSheetShow && !isMobileSeasonPickerOpen && !isMobileProfileEditOpen && !isMobileInfoSheetOpen && !playingMedia && !isHamburgerDrawerOpen && !isLoginPageOpen && (
        <MobileBottomNav
          activeTab={isMobileSearchOpen ? 'search' : isMobileProfileOpen ? 'profile' : 'home'}
          onSelectTab={handleMobileSelectTab}
          onTripleTapHome={handleTripleTapHome}
          userAvatar={userAvatar}
          platformName={platformName}
          navbarStyle={adminSettings.mobileNavbarStyle || 'floating'}
          navbarTheme={adminSettings.mobileNavbarTheme || 'solid'}
          showLabels={adminSettings.mobileNavbarShowLabels !== false}
          isHiddenBehindLock={false}
          hideProfileAvatar={isProfileLocked}
        />
      )}

      {/* Mobile Hamburger Drawer: translucent dark overlay without blur matching reference (Image 2) */}
      {isHamburgerDrawerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-none animate-in fade-in duration-150 flex flex-col select-none">
          {/* Top Bar of Drawer: EXACT height and pixel coordinates as closed state so logo and icon do not move */}
          <div className="w-full px-4 md:px-8 xl:px-12 py-3.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsHamburgerDrawerOpen(false)}
                className="p-1.5 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              <button
                onClick={() => {
                  setIsHamburgerDrawerOpen(false);
                  handleGoHome();
                }}
                className="flex items-center gap-1 group cursor-pointer text-left shrink-0 max-w-[95px] sm:max-w-[110px] md:max-w-[125px]"
                aria-label="Dizi Home"
              >
                {adminSettings.customLogoUrl ? (
                  <img
                    src={adminSettings.customLogoUrl}
                    alt={adminSettings.platformName || 'Platform'}
                    referrerPolicy="no-referrer"
                    className="h-6.5 sm:h-7.5 md:h-8.5 w-auto max-w-[92px] sm:max-w-[108px] md:max-w-[120px] object-contain"
                  />
                ) : (
                  <DiziLogo variant="red" size="md" className="max-w-[92px] sm:max-w-[108px] md:max-w-[120px] h-7 sm:h-[32px] md:h-[35px]" />
                )}
              </button>
            </div>

            {/* Right: notifications if not on share direct page */}
            {!(sharedTitleShow && !isMobile) && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsHamburgerDrawerOpen(false);
                    setIsNotificationOpen(true);
                  }}
                  className="relative p-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-5.5 h-5.5 text-white" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600" />
                </button>
              </div>
            )}
          </div>

          {/* Drawer Links: Home, Series, Movies, Top 10 Movies, Top 10 Series, My List, Continue Watching (NO genres) */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                setSharedTitleShow(null);
                handleGoHome();
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              Home
            </button>

            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                setSharedTitleShow(null);
                handleSelectPage('series');
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              Series
            </button>

            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                setSharedTitleShow(null);
                handleSelectPage('movies');
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              Movies
            </button>

            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                setSharedTitleShow(null);
                handleSelectPage('categories');
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              Categories
            </button>

            {/* Top 10 Lists: omitted on share direct page per user request ("don't add top 10 list there") */}
            {!(sharedTitleShow && !isMobile) && (
              <>
                <button
                  onClick={() => {
                    setIsHamburgerDrawerOpen(false);
                    setDrawerDedicatedView('top_10_movies');
                    pushRoute('/top10/movies');
                  }}
                  className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
                >
                  Top 10 Movies
                </button>

                <button
                  onClick={() => {
                    setIsHamburgerDrawerOpen(false);
                    setDrawerDedicatedView('top_10_series');
                    pushRoute('/top10/series');
                  }}
                  className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
                >
                  Top 10 Series
                </button>
              </>
            )}

            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                setDrawerDedicatedView('vertical_my_list');
                pushRoute('/mylist/saved');
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              My List
            </button>

            <button
              onClick={() => {
                setIsHamburgerDrawerOpen(false);
                handleSelectPage('watchlist');
              }}
              className="block w-full text-left text-xl font-bold text-white hover:text-white/80 cursor-pointer active:translate-x-1 transition-transform"
            >
              Keep Watching
            </button>
          </div>

          {/* Profile Section moved to bottom left with avatar and user name */}
          <div
            onClick={() => {
              setIsHamburgerDrawerOpen(false);
              setIsMobileProfileOpen(true);
              pushRoute('/profile');
            }}
            className="mt-auto px-6 py-5 border-t border-white/10 flex items-center gap-3.5 cursor-pointer active:bg-white/5 transition-colors select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20 shrink-0">
              <img
                src={userAvatar || 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=120&q=80'}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-white font-bold text-base truncate">{userName || 'Guest'}</span>
              <span className="text-xs text-zinc-400">Switch / Edit Profile</span>
            </div>
          </div>
        </div>
      )}

      {/* Notification Sheet / Popover */}
      {isNotificationOpen && (
        <div
          onClick={() => setIsNotificationOpen(false)}
          className="fixed inset-0 z-[210] bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-2xl bg-[#161618] border border-white/10 p-5 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-red-500" />
                <h3 className="text-white font-bold text-base">Notifications</h3>
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  You're all caught up!
                </p>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  New episodes, series announcements, and watchlist updates will be notified here.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="w-full py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top 10 List Page Share Sheet */}
      {mobileTop10ShareShow && (
        <ShareModal
          show={shows.find((s) => s.id === mobileTop10ShareShow.id) || mobileTop10ShareShow}
          isOpen={true}
          onClose={() => setMobileTop10ShareShow(null)}
          platformName={platformName}
        />
      )}

      {/* Universal Top-Layer Custom Pointer Tooltip */}
      <GlobalTooltip />

      {/* Narrow Dismissible Ad Bar (Mutually exclusive with Alert Banner; never shown on Episode page) */}
      {isNarrowAdBarActive && (
        <NarrowAdBar
          imageUrl={adminSettings.narrowAdBarImageUrl}
          logoImageUrl={adminSettings.narrowAdBarLogoImageUrl}
          title={adminSettings.narrowAdBarTitle}
          subtitle={adminSettings.narrowAdBarSubtitle}
          buttonText={adminSettings.narrowAdBarButtonText}
          buttonUrl={adminSettings.narrowAdBarButtonUrl}
          placement={adminSettings.narrowAdBarPlacement || 'bottom_floating'}
          badgePosition={adminSettings.narrowAdBarBadgePosition || 'top_left'}
          textPosition={adminSettings.narrowAdBarTextPosition || 'left'}
          buttonPosition={adminSettings.narrowAdBarButtonPosition || 'right'}
          showCloseButton={adminSettings.narrowAdBarShowCloseButton !== false}
          isMobile={isMobile && !isTablet}
          onDismiss={() => setIsNarrowAdBarDismissed(true)}
          onNavigateInternal={handleNavigateInternalUrl}
        />
      )}

      {/* Profile Lock Screen: 4-digit PIN required on website visit or after Login */}
      {isProfileLocked && !isLoginPageOpen && (
        <ProfileLockScreen
          userAvatar={userAvatar}
          userName={userName}
          platformName={platformName}
          customLogoUrl={adminSettings.customLogoUrl}
          onUnlockSuccess={() => {
            setIsProfileLocked(false);
            try {
              sessionStorage.setItem('dizi_profile_unlocked', 'true');
            } catch {}
          }}
          onResetLock={() => {
            setIsProfileLocked(false);
          }}
        />
      )}
      {/* Global Alert Poster Announcement Modal (Prime style) */}
      {isAlertPosterActive && (
          <AlertPosterModal
            isOpen={true}
            imageUrl={adminSettings.alertPosterImageUrl}
            videoUrl={adminSettings.alertPosterVideoUrl}
            isAd={Boolean(adminSettings.alertPosterIsAd)}
            adSkipDelaySeconds={adminSettings.alertPosterAdSkipDelaySeconds ?? 5}
            adRequireFullWatch={Boolean(adminSettings.alertPosterAdRequireFullWatch)}
            title={adminSettings.alertPosterTitle}
            subtitle={adminSettings.alertPosterSubtitle}
            buttonText={adminSettings.alertPosterButtonText}
            buttonAction={adminSettings.alertPosterButtonAction || 'close'}
            buttonUrl={adminSettings.alertPosterButtonUrl}
            onClose={() => {
              setIsAlertPosterDismissed(true);
              try {
                sessionStorage.setItem('dizi_alert_poster_dismissed', 'true');
              } catch {}
              if (alertActionTriggeredRef.current) {
                alertActionTriggeredRef.current = false;
                return;
              }
              setAlertDismissCount((prev) => {
                const next = prev + 1;
                try {
                  localStorage.setItem('dizi_alert_dismiss_count', String(next));
                } catch {}
                return next;
              });
            }}
            onActionTriggered={() => {
              alertActionTriggeredRef.current = true;
              setAlertActionCount((prev) => {
                const next = prev + 1;
                try {
                  sessionStorage.setItem('dizi_alert_poster_dismissed', 'true');
                  localStorage.setItem('dizi_alert_action_count', String(next));
                } catch {}
                return next;
              });
            }}
            onOpenLogin={() => openLoginPage('login')}
            onNavigateInternal={(path) => {
              pushRoute(path);
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
          />
        )}

      {/* Smooth Post-Login Logo Glide Overlay (transitions centered Login logo into destination Navbar logo; never runs on PIN lock) */}
      {loginLogoGlide && !isProfileLocked && (
        <div
          className="fixed z-[320] pointer-events-none flex items-center justify-center"
          style={{
            left: `${loginLogoGlide.startLeft}px`,
            top: `${loginLogoGlide.startTop}px`,
            width: `${loginLogoGlide.startWidth}px`,
            height: `${loginLogoGlide.startHeight}px`,
            transformOrigin: 'center center',
            transform: loginLogoGlide.active
              ? `translate3d(${loginLogoGlide.dx}px, ${loginLogoGlide.dy}px, 0) scale(${loginLogoGlide.targetScale})`
              : 'translate3d(0, 0, 0) scale(1)',
            opacity: loginLogoGlide.active ? 0 : 1,
            transition:
              'transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 190ms ease-out 380ms',
            willChange: 'transform, opacity'
          }}
        >
          {adminSettings.useCustomLogo && adminSettings.customLogoUrl ? (
            <img
              src={adminSettings.customLogoUrl}
              alt={platformName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)]"
            />
          ) : (
            <DiziLogo variant="red" size="lg" className="w-full h-full" />
          )}
        </div>
      )}
    </div>
  );
}
