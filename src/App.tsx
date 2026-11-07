import React, { useState, useEffect, useMemo, useRef } from 'react';
import fullBackupData from './full_backup.json';
import { Show, FeedConfig, AdminSettings, CastMember, VideoSourceType, NotificationItem, Episode, TrailerItem, CategoryItem, ProfilePictureGroup } from './types';

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
      dailymotionScriptUrl: 'https://geo.dailymotion.com/libs/player/x1o1xe.js',
      mobileNavbarStyle: 'floating',
      mobileNavbarShowLabels: true,
      mobileRecommendationStyle: 'portrait',
      backdropDarkness: 35,
      enableStretchableCards: true,
      showTop10Badges: true
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
import { BrowseByGenreRow, GenreItem } from './components/BrowseByGenreRow';
import { GlobalTooltip } from './components/GlobalTooltip';
import { OfflineAlertBar, useOfflineStatus } from './components/OfflineAlertBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileSearchModal } from './components/MobileSearchModal';
import { MobileProfileModal } from './components/MobileProfileModal';
import { MobilePosterActionSheet } from './components/MobilePosterActionSheet';
import { Film, Tv, Sparkles, Filter, ChevronRight, Bookmark, X } from 'lucide-react';
import { WatchProgressItem, EpisodeProgressItem } from './utils/watchProgress';

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

  // 10-minute feed and row rotation clock
  const [currentTimeSlot, setCurrentTimeSlot] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCurrentTimeSlot(now);
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('cineflix_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cineflix_watchlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [heroShow, setHeroShow] = useState<Show | null>(shows[0] || null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<CategoryItem | null>(null);
  const [categoryRandomHeroShow, setCategoryRandomHeroShow] = useState<Show | null>(null);
  const [selectedShowForDetail, setSelectedShowForDetail] = useState<Show | null>(null);
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

  // Whole feed and recommendation refresh after 10 minutes
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      const eligibleAll = shows.filter((s) => s.is_recommended !== false);
      const poolAll = eligibleAll.length > 0 ? eligibleAll : shows;

      const eligibleSeries = shows.filter((s) => s.type === 'series' && s.is_recommended !== false);
      const poolSeries = eligibleSeries.length > 0 ? eligibleSeries : shows.filter((s) => s.type === 'series');

      const eligibleMovies = shows.filter((s) => s.type === 'movie' && s.is_recommended !== false);
      const poolMovies = eligibleMovies.length > 0 ? eligibleMovies : shows.filter((s) => s.type === 'movie');

      setPageRecommendations({
        all: getPinnedOrRotatingRecommendation(poolAll, 'dizi_pinned_rec_all', true) || poolAll[0] || null,
        series: getPinnedOrRotatingRecommendation(poolSeries, 'dizi_pinned_rec_series', true) || poolSeries[0] || poolAll[0] || null,
        movies: getPinnedOrRotatingRecommendation(poolMovies, 'dizi_pinned_rec_movies', true) || poolMovies[0] || poolAll[0] || null,
      });
      setCurrentTimeSlot(Date.now());
    }, 10 * 60 * 1000);

    return () => clearInterval(refreshTimer);
  }, [shows]);

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
    return localStorage.getItem('cineflix_user_name') || 'Good';
  });
  const [userHandle, setUserHandle] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_handle') || 'NeoGuide873';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_email') || 'abc@example.com';
  });
  const [userWhatsapp, setUserWhatsapp] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_whatsapp') || '+1 (555) 382-9014';
  });
  const [userPassword, setUserPassword] = useState<string>(() => {
    return localStorage.getItem('cineflix_user_password') || '••••••••••••';
  });

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

  // User Watch Progress History in Local Storage with exact position tracking
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

    // Seed initial watch progress matching user reference screenshots so progress bars are visible immediately
    const catalog: Show[] = (fullBackupData && Array.isArray((fullBackupData as any).shows))
      ? ((fullBackupData as any).shows as Show[])
      : DB_SHOWS;
    const firstSeries = catalog.find((s) => s.type === 'series' && s.seasons && s.seasons.length > 0 && s.seasons[0].episodes.length >= 2) || catalog[0];

    if (firstSeries) {
      const ep1 = firstSeries.seasons?.[0]?.episodes?.[0];
      const ep2 = firstSeries.seasons?.[0]?.episodes?.[1];

      const ep1Dur = 48 * 60; // 48 mins
      const ep2Dur = 63 * 60; // 63 mins
      const ep2Cur = 35 * 60; // 35 mins ("35 of 63m")

      const ep1Progress: EpisodeProgressItem = {
        currentTime: ep1Dur,
        duration: ep1Dur,
        progressPercent: 100,
        seasonNumber: 1,
        episodeNumber: 1,
        episodeId: ep1?.id || 'ep-1',
        episodeTitle: ep1?.title || 'Episode 1',
        updatedAt: Date.now() - 3600000
      };

      const ep2Progress: EpisodeProgressItem = {
        currentTime: ep2Cur,
        duration: ep2Dur,
        progressPercent: Math.round((ep2Cur / ep2Dur) * 100),
        seasonNumber: 1,
        episodeNumber: 2,
        episodeId: ep2?.id || 'ep-2',
        episodeTitle: ep2?.title || 'Episode 2',
        updatedAt: Date.now()
      };

      const seedShowProgress: WatchProgressItem = {
        showId: firstSeries.id,
        showTitle: firstSeries.title,
        seasonNumber: 1,
        episodeNumber: 2,
        episodeId: ep2?.id || 'ep-2',
        episodeTitle: ep2?.title || 'Episode 2',
        videoUrl: ep2?.videoUrl || firstSeries.trailerUrl,
        videoSourceType: ep2?.videoSourceType || 'direct',
        currentTime: ep2Cur,
        duration: ep2Dur,
        progressPercent: Math.round((ep2Cur / ep2Dur) * 100),
        updatedAt: Date.now(),
        thumbnailUrl: firstSeries.posterLandscapeUrl || firstSeries.backdropUrl,
        completed: false,
        episodesProgress: {
          [ep1?.id || 's1e1']: ep1Progress,
          [ep2?.id || 's1e2']: ep2Progress
        }
      };

      const initialMap = { [firstSeries.id]: seedShowProgress };
      try {
        localStorage.setItem('dizi_watch_history', JSON.stringify(initialMap));
        localStorage.setItem('cineflix_watch_history', JSON.stringify(initialMap));
      } catch {}
      return initialMap;
    }

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

  // Mobile and Tablet layout detection & states
  const [windowWidth, setWindowWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 1200;
    return window.innerWidth;
  });

  const isMobile = windowWidth <= 768;
  const isTablet = windowWidth > 768 && windowWidth < 1024;

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState<boolean>(false);
  const [actionSheetShow, setActionSheetShow] = useState<Show | null>(null);
  const [isMobileSeasonPickerOpen, setIsMobileSeasonPickerOpen] = useState<boolean>(false);
  const [isMobileProfileEditOpen, setIsMobileProfileEditOpen] = useState<boolean>(false);
  const [isMobileInfoSheetOpen, setIsMobileInfoSheetOpen] = useState<boolean>(false);
  const [customHeroShow, setCustomHeroShow] = useState<Show | null>(null);
  const [categoriesResetKey, setCategoriesResetKey] = useState<number>(0);
  const [selectedCategoryFromGenre, setSelectedCategoryFromGenre] = useState<CategoryItem | null>(null);
  const lastHomeClickTimeRef = useRef<number>(0);

  const handleGoHome = () => {
    // Return to home without changing recommendation (only mobile triple tap reloads/rotates)
    setSelectedShowForDetail(null);
    setIsMobileSearchOpen(false);
    setIsMobileProfileOpen(false);
    setSelectedSpecialFeed(null);
    setSelectedCategoryFilter(null);
    setSelectedCategoryFromGenre(null);
    setSearchQuery('');
    if (activeFilter !== 'all') {
      setActiveFilter('all');
      try {
        sessionStorage.setItem('cineflix_active_filter', 'all');
      } catch {}
    }
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
    setCurrentTimeSlot(Date.now());

    try {
      const current = parseInt(localStorage.getItem('dizi_reload_count') || '0', 10);
      localStorage.setItem('dizi_reload_count', String(current + 3));
    } catch {}

    setSelectedShowForDetail(null);
    setIsMobileSearchOpen(false);
    setIsMobileProfileOpen(false);
    setSelectedSpecialFeed(null);
    setSelectedCategoryFilter(null);
    setSearchQuery('');
    setActiveFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMobileSelectTab = (tab: 'home' | 'search' | 'profile') => {
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
    } else if (tab === 'profile') {
      setSelectedShowForDetail(null);
      setIsMobileSearchOpen(false);
      setIsMobileProfileOpen(true);
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

  const handleSelectPage = (target: 'all' | 'series' | 'movies' | 'categories' | 'watchlist') => {
    if (target === 'all') {
      handleGoHome();
      return;
    }
    if (target === 'categories') {
      setSelectedCategoryFromGenre(null);
      setCategoriesResetKey((prev) => prev + 1);
    }
    setSelectedCategoryFilter(null);
    setSelectedSpecialFeed(null);
    setSearchQuery(''); // Immediately clear search so user navigates away from search page!
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
  };

  const handleEditCuratedFeed = (feedId: string) => {
    setAdminEditingFeedId(feedId);
    setIsAdminPanelOpen(true);
  };

  const handleExploreSpecialFeed = (feed: FeedConfig, feedShows: Show[]) => {
    // Redesigned Special Feed Page (Matching Image 1 & Image 2 references):
    // Hero backdrop covers top screen under transparent navbar, bottom-left logo,
    // no back button, no subtitle, no title quantity, and 4-column card feed without rows.
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSelectCategoryCard = (category: CategoryItem) => {
    setSelectedCategoryFilter(category);
    setSelectedSpecialFeed(null);
    // Keep activeFilter as 'categories' so navbar badge remains 'Categories' (or 'More')
    setActiveFilter('categories');
    // Randomize recommendation on top from the category shows every time user opens a category card
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSearchChange = (query: string) => {
    if (!searchQuery && query) {
      preSearchScrollRef.current = window.scrollY;
    }
    setSearchQuery(query);
    if (query.trim()) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (!query && searchQuery) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: preSearchScrollRef.current, behavior: 'instant' });
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
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

  // Toggle watchlist: only updates watchlist state during session, feed content does not change until next reload!
  const handleToggleWatchlist = (showId: string) => {
    const isAdding = !watchlist.includes(showId);
    setWatchlist((prev) =>
      isAdding ? [...prev, showId] : prev.filter((id) => id !== showId)
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

  // Open Details Modal & update address bar with clean simplified URL
  const handleOpenDetails = (
    show: Show,
    mode: 'trailer' | 'episode' = 'trailer',
    subView: 'main' | 'cast' | 'blog' = 'main',
    episodeId?: string | null,
    trailerId?: string | null
  ) => {
    setDetailVideoMode(mode);
    setDetailSubView(subView);
    setDetailEpisodeId(episodeId || null);
    setDetailTrailerId(trailerId || null);
    setSelectedShowForDetail(show);

    try {
      const slug = show.slug || show.id || show.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const cleanUrl = buildCleanWatchUrl(show, episodeId, { subView, trailerId });
      window.history.pushState({ showId: show.id, slug }, '', cleanUrl);

      const backdrop = show.backdropUrl || show.posterLandscapeUrl || '';
      const maturity = show.maturityRating || '16+';
      const genreList = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.join(', ') : 'Drama';
      const year = show.releaseYear || '2025';
      const durationOrSeasons =
        show.type === 'series'
          ? (show.durationOrSeasons || (show.seasons && show.seasons.length > 0 ? `${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''}` : '1 Season'))
          : (show.durationOrSeasons || 'Feature Film');
      const details = show.synopsis || show.description || show.shortDescription || '';
      const desc = `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const canonicalShareUrl = `${currentOrigin}${cleanUrl}`;
      setMetaTags(`${show.title} - ${platformName}`, desc, backdrop, canonicalShareUrl);
    } catch {}
  };

  const handleCloseDetails = () => {
    setSelectedShowForDetail(null);
    setDetailSubView('main');
    setDetailEpisodeId(null);
    setDetailTrailerId(null);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    try {
      window.history.pushState(null, '', '/');
      setMetaTags(
        `${platformName} – Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas`,
        `Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas on ${platformName}.`,
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
        window.location.origin
      );
    } catch {}
  };

  // Sub-view change listener for trailers, blog, cast, and episodes
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
      window.history.pushState(null, '', cleanUrl);

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
        const backdrop = selectedShowForDetail.backdropUrl || selectedShowForDetail.posterLandscapeUrl || '';
        const maturity = selectedShowForDetail.maturityRating || '16+';
        const genreList = Array.isArray(selectedShowForDetail.genres) && selectedShowForDetail.genres.length > 0 ? selectedShowForDetail.genres.join(', ') : 'Drama';
        const year = selectedShowForDetail.releaseYear || '2025';
        const durationOrSeasons =
          selectedShowForDetail.type === 'series'
            ? (selectedShowForDetail.durationOrSeasons || (selectedShowForDetail.seasons && selectedShowForDetail.seasons.length > 0 ? `${selectedShowForDetail.seasons.length} Season${selectedShowForDetail.seasons.length > 1 ? 's' : ''}` : '1 Season'))
            : (selectedShowForDetail.durationOrSeasons || 'Feature Film');
        const details = selectedShowForDetail.synopsis || selectedShowForDetail.description || selectedShowForDetail.shortDescription || '';
        const desc = `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        setMetaTags(
          `${selectedShowForDetail.title} - ${platformName}`,
          desc,
          backdrop,
          currentOrigin + cleanUrl
        );
      }
    } catch {}
  };

  const handleSelectActorForPool = (actor: CastMember) => {
    setSelectedActorForPool(actor);
    try {
      const currentUrl = new URL(window.location.href);
      const actorSlug = actor.id || actor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      currentUrl.searchParams.set('actor', actorSlug);
      window.history.pushState(null, '', currentUrl.toString());
      setMetaTags(
        `${actor.name} – Cast & Filmography – ${platformName}`,
        `Explore all Turkish dramas and movies starring ${actor.name} on ${platformName}`,
        actor.profileUrl,
        currentUrl.toString()
      );
    } catch {}
  };

  const handleCloseActorPool = () => {
    setSelectedActorForPool(null);
    try {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('actor')) {
        currentUrl.searchParams.delete('actor');
        window.history.pushState(null, '', currentUrl.toString());
      }
      if (selectedShowForDetail) {
        setMetaTags(
          `${selectedShowForDetail.title} – Watch on ${platformName}`,
          selectedShowForDetail.shortDescription || selectedShowForDetail.synopsis,
          selectedShowForDetail.posterLandscapeUrl,
          currentUrl.toString()
        );
      } else {
        setMetaTags(
          `${platformName} – Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas`,
          `Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas on ${platformName}.`,
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
          window.location.origin
        );
      }
    } catch {}
  };

  // Shareable URL slug listener: automatically opens show, episode, trailer, blog, cast, or actor on visit and back/forward
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const watchParam = urlParams.get('watch');
        const episodeParam = urlParams.get('episode');
        const trailerParam = urlParams.get('trailer');
        const tabParam = urlParams.get('tab');
        const actorParam = urlParams.get('actor');

        const pathname = window.location.pathname;
        let pathWatchSlug: string | null = null;
        let pathSeasonNumber: number | null = null;
        let pathEpisodeNumber: number | null = null;

        const multiSeasonMatch = pathname.match(/^\/watch\/([^/]+)\/s([0-9]+)\/e([0-9]+)\/?$/i);
        const singleSeasonMatch = pathname.match(/^\/watch\/([^/]+)\/e([0-9]+)\/?$/i);
        const showOnlyMatch = pathname.match(/^\/watch\/([^/]+)\/?$/i);

        if (multiSeasonMatch) {
          pathWatchSlug = decodeURIComponent(multiSeasonMatch[1]);
          pathSeasonNumber = parseInt(multiSeasonMatch[2], 10);
          pathEpisodeNumber = parseInt(multiSeasonMatch[3], 10);
        } else if (singleSeasonMatch) {
          pathWatchSlug = decodeURIComponent(singleSeasonMatch[1]);
          pathSeasonNumber = 1;
          pathEpisodeNumber = parseInt(singleSeasonMatch[2], 10);
        } else if (showOnlyMatch) {
          pathWatchSlug = decodeURIComponent(showOnlyMatch[1]);
        }

        const effectiveWatchTarget = pathWatchSlug || watchParam;

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

        if (effectiveWatchTarget) {
          const matched = shows.find(
            (s) =>
              s.id.toLowerCase() === effectiveWatchTarget.toLowerCase() ||
              s.slug?.toLowerCase() === effectiveWatchTarget.toLowerCase() ||
              s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === effectiveWatchTarget.toLowerCase()
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

            setSelectedShowForDetail(matched);
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

            const backdrop = matched.backdropUrl || matched.posterLandscapeUrl || '';
            const maturity = matched.maturityRating || '16+';
            const genreList = Array.isArray(matched.genres) && matched.genres.length > 0 ? matched.genres.join(', ') : 'Drama';
            const year = matched.releaseYear || '2025';
            const durationOrSeasons =
              matched.type === 'series'
                ? (matched.durationOrSeasons || (matched.seasons && matched.seasons.length > 0 ? `${matched.seasons.length} Season${matched.seasons.length > 1 ? 's' : ''}` : '1 Season'))
                : (matched.durationOrSeasons || 'Feature Film');
            const details = matched.synopsis || matched.description || matched.shortDescription || '';
            const desc = `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;
            const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
            const cleanUrl = buildCleanWatchUrl(matched, resolvedEpId, { subView: tabParam || undefined, trailerId: trailerParam });
            setMetaTags(`${matched.title} - ${platformName}`, desc, backdrop, currentOrigin + cleanUrl);
          }
        } else {
          setSelectedShowForDetail((prev) => (prev ? null : prev));
          setPlayingMedia((prev) => (prev ? null : prev));
          document.body.style.overflow = '';
          document.documentElement.style.overflow = '';
        }
      } catch {}
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [shows]);

  // Cleanly restore body scroll whenever no modals or players are open
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
      isMobileProfileOpen
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
    isMobileProfileOpen
  ]);

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

  // Play show: plays first episode if episodic content available, else plays trailer clip
  const handlePlayShow = (show: Show) => {
    handleIncrementPoints(show.id);
    const hasEpisodes =
      show.type === 'series' &&
      show.hasEpisodicContent !== false &&
      show.seasons &&
      show.seasons.length > 0 &&
      show.seasons[0].episodes.length > 0;
    const firstEp = hasEpisodes ? show.seasons![0].episodes[0] : null;

    // Check if user has watch history for this show to resume where left off
    const historyItem = watchHistory[show.id];
    let chosenEp = firstEp;
    let initialSeekTime = 0;

    if (historyItem) {
      if (show.seasons && show.seasons.length > 0) {
        for (const sea of show.seasons) {
          const match = sea.episodes.find((e) =>
            (historyItem.episodeId && e.id === historyItem.episodeId) ||
            (historyItem.episodeNumber && e.episodeNumber === historyItem.episodeNumber && (!historyItem.seasonNumber || sea.seasonNumber === historyItem.seasonNumber))
          );
          if (match) {
            chosenEp = match;
            break;
          }
        }
      }

      const epKey = chosenEp?.id || (chosenEp?.episodeNumber !== undefined ? `s${chosenEp?.seasonNumber || 1}e${chosenEp?.episodeNumber}` : 'movie');
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
      const cleanUrl = buildCleanWatchUrl(
        show,
        activeEp && !isTargetLink ? activeEp.id : null,
        { trailerId: isTargetLink ? 'main' : null }
      );
      window.history.pushState({ showId: show.id, slug }, '', cleanUrl);
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

    setPlayingMedia({
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
    });
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

  // Search filtering: Exact matches & Related matches
  const { exactSearchShows, searchFeed1Shows, searchFeed2Shows } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return { exactSearchShows: [], searchFeed1Shows: [], searchFeed2Shows: [] };
    }

    // 1. Exact matches: title, real/turkishTitle, alternative/supportingTitles, logoText, tags/categories, genres, vibes, cast, or synopsis/description
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

    const exactShowIds = new Set(exact.map((s) => s.id));
    const targetGenres = new Set<string>();
    exact.forEach((s) => s.genres.forEach((g) => targetGenres.add(g.toLowerCase())));
    const targetTags = new Set<string>();
    exact.forEach((s) => {
      (s.categories || []).forEach((c) => targetTags.add(c.toLowerCase()));
      (s.thisSeriesIs || []).forEach((v) => targetTags.add(v.toLowerCase()));
    });
    const targetActors = new Set<string>();
    exact.forEach((s) => s.cast.forEach((c) => targetActors.add(c.name.toLowerCase())));

    // 2. Related shows: catalog shows not in exact matches, ranked by genre/actor/type match
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

    // 1st Feed Line: "Search Results" contains exact results if there, plus related to that search
    const feed1 = exact.length > 0
      ? [...exact, ...related.slice(0, Math.max(3, 8 - exact.length))]
      : (related.length > 0 ? related.slice(0, 8) : shows.slice(0, 8));

    // 2nd Feed Line: "Related to Search" contains titles related to that search
    const feed2 = related.length > 0
      ? related
      : shows.filter((s) => !exactShowIds.has(s.id));

    return {
      exactSearchShows: exact,
      searchFeed1Shows: feed1,
      searchFeed2Shows: feed2
    };
  }, [searchQuery, shows]);

  // Comprehensive Feed Engine: Section A (History/State), Section B (Algorithmic Top 10 / Rewatched),
  // Section C (Curated Categories) with 10-minute rotation, 3-reload arrangement cycle, and anti-fatigue de-duplication
  const dailyFeeds = useMemo(() => {
    const rows = generateDailyFeeds(
      shows,
      watchHistory,
      watchlist,
      new Date(currentTimeSlot),
      feeds,
      arrangementCycle
    );

    // Special feed ONLY shows on home page (activeFilter === 'all')
    const pageRows = activeFilter === 'all' ? rows : rows.filter((row) => !row.isSpecialFeed);

    // If activeFilter is 'series', filter to series-only shows and series rows
    if (activeFilter === 'series') {
      return pageRows
        .map((row) => ({
          ...row,
          shows: row.shows.filter((s) => s.type === 'series')
        }))
        .filter((row) => row.shows.length >= 2);
    }

    // If activeFilter is 'movies', filter to movies-only shows and movie rows
    if (activeFilter === 'movies') {
      return pageRows
        .map((row) => ({
          ...row,
          shows: row.shows.filter((s) => s.type === 'movie')
        }))
        .filter((row) => row.shows.length >= 2);
    }

    return pageRows;
  }, [shows, watchHistory, watchlist, currentTimeSlot, feeds, activeFilter, arrangementCycle]);

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

  // Only 1 special single feed on desktop homepage
  const specialFeedShow = useMemo<Show | null>(() => {
    if (!shows || shows.length === 0) return null;
    // 1. Look for show explicitly toggled as special single feed eligible in admin panel
    const explicitlyEligible = shows.find((s) => s.isSpecialSingleFeedEligible === true);
    if (explicitlyEligible) return explicitlyEligible;
    // 2. Otherwise pick an eligible show that isn't the hero recommendation
    const candidate = shows.find(
      (s) => s.id !== currentHeroShow?.id && s.is_recommended !== false && (s.seasons?.length || s.type === 'series')
    );
    return candidate || shows.find((s) => s.id !== currentHeroShow?.id) || shows[0] || null;
  }, [shows, currentHeroShow]);

  // Handler for selecting genre card from Browse by Genre row on homepage
  const handleSelectGenreFromFeed = (genre: GenreItem | CategoryItem) => {
    const catNameLower = genre.name.toLowerCase();
    const foundCat = categoriesList.find(
      (c) =>
        c.name.toLowerCase() === catNameLower ||
        c.id.toLowerCase() === genre.id.toLowerCase() ||
        c.name.toLowerCase().includes(catNameLower) ||
        catNameLower.includes(c.name.toLowerCase())
    );

    const targetCat: CategoryItem = foundCat || {
      id: genre.id,
      name: genre.name,
      imageUrl: genre.imageUrl,
      genreKeywords: (genre as GenreItem).keywords || [genre.name.toLowerCase()]
    };

    setSelectedCategoryFromGenre(targetCat);
    setSelectedCategoryFilter(null);
    setSelectedSpecialFeed(null);
    setSearchQuery('');
    setActiveFilter('categories');
    setCategoriesResetKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

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

  return (
    <div
      style={{
        paddingTop: isOffline && !isMobile ? '52px' : undefined
      }}
      className="min-h-screen bg-[#141414] text-zinc-100 flex flex-col font-sans selection:bg-red-600 selection:text-white"
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
          setIsRecommendationPaused(true);
          setIsAccountModalOpen(true);
        }}
        onOpenAppSettings={() => {
          setIsRecommendationPaused(true);
          setIsAppSettingsModalOpen(true);
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
        onToggleAuth={() => setIsLoggedIn(!isLoggedIn)}
        onSelectCategory={handleSelectPage}
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        useCustomLogo={adminSettings.useCustomLogo}
        customLogoUrl={adminSettings.customLogoUrl}
        notifications={notifications}
        onUpdateNotifications={setNotifications}
        onOpenShowById={(showId) => {
          const found = shows.find((s) => s.id === showId);
          if (found) handleOpenDetails(found, 'trailer');
        }}
        isSpecialFeedPage={Boolean(selectedSpecialFeed)}
      />

      {/* Main Content Area: clearance passing padding on mobile (halved to pb-18) so content completely passes bottom navbar */}
      <main className="flex-1 pb-18 md:pb-0">
        {/* If user is actively searching, show two feed lines matching user requirement */}
        {searchQuery.trim() ? (
          <div className="pt-24 md:pt-28 pb-12 space-y-6 md:space-y-8 animate-in fade-in duration-200">
            {/* Search Header Banner */}
            <div className="w-full px-4 md:px-8 xl:px-12 flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Search: &quot;{searchQuery}&quot;
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {exactSearchShows.length > 0
                    ? `Found ${exactSearchShows.length} exact ${exactSearchShows.length === 1 ? 'title' : 'titles'} and related recommendations`
                    : 'Showing matching recommendations and related titles'}
                </p>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-xs px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer font-medium flex items-center gap-1.5 border border-white/10"
              >
                <span>Clear Search</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1st Feed Line: Search Results (contains exact results if there and related to that search) */}
            <FeedStrip
              feed={{
                id: 'search-results-feed',
                title: exactSearchShows.length > 0
                  ? `Search Results for "${searchQuery}"`
                  : `Top Results for "${searchQuery}"`,
                categoryKey: 'custom',
                enabled: true
              }}
              shows={shows}
              customShows={searchFeed1Shows}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
              onPlayShow={handlePlayShow}
              onIncrementPoints={handleIncrementPoints}
              isGlobalMuted={isGlobalMuted}
              onToggleGlobalMute={handleToggleGlobalMute}
              onHoverCardStart={() => setIsFeedCardHovered(true)}
              onHoverCardEnd={() => setIsFeedCardHovered(false)}
              isMobile={isMobile}
              onLongPressShow={(s) => setActionSheetShow(s)}
              enableStretchableCards={adminSettings.enableStretchableCards !== false}
              showTop10Badges={adminSettings.showTop10Badges !== false}
            />

            {/* 2nd Feed Line: Related to Search */}
            <FeedStrip
              feed={{
                id: 'search-related-feed',
                title: `Related to "${searchQuery}"`,
                categoryKey: 'custom',
                enabled: true
              }}
              shows={shows}
              customShows={searchFeed2Shows}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
              onPlayShow={handlePlayShow}
              onIncrementPoints={handleIncrementPoints}
              isGlobalMuted={isGlobalMuted}
              onToggleGlobalMute={handleToggleGlobalMute}
              onHoverCardStart={() => setIsFeedCardHovered(true)}
              onHoverCardEnd={() => setIsFeedCardHovered(false)}
              isMobile={isMobile}
              onLongPressShow={(s) => setActionSheetShow(s)}
              enableStretchableCards={adminSettings.enableStretchableCards !== false}
              showTop10Badges={adminSettings.showTop10Badges !== false}
            />
          </div>
        ) : activeFilter === 'watchlist' ? (
          /* Dedicated "My list" Page: Shows only user's saved content and watch history; shows nothing when cleared */
          <div className="pt-20 sm:pt-24 pb-16 min-h-[50vh] animate-in fade-in duration-200">
            {continueWatchingShows.length === 0 && userWatchlistShows.length === 0 ? (
              /* Shows nothing when cleared as requested */
              <div className="w-full" />
            ) : (
              <div className="relative z-20 space-y-2.5 md:space-y-3.5 mt-2 md:mt-3">
                {/* 1st Feed Line: "Continue Watching" (shown only if items exist) */}
                {continueWatchingShows.length > 0 && (
                  <FeedStrip
                    feed={{
                      id: 'my-list-continue-watching',
                      title: 'Continue Watching',
                      categoryKey: 'custom',
                      enabled: true
                    }}
                    shows={shows}
                    customShows={continueWatchingShows}
                    watchlist={watchlist}
                    watchHistory={watchHistory}
                    onToggleWatchlist={handleToggleWatchlist}
                    onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
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
                  />
                )}

                {/* 2nd Feed Line: "Watchlist" (shown only if items exist) */}
                {userWatchlistShows.length > 0 && (
                  <FeedStrip
                    feed={{
                      id: 'my-list-watchlist',
                      title: 'Watchlist',
                      categoryKey: 'custom',
                      enabled: true
                    }}
                    shows={shows}
                    customShows={userWatchlistShows}
                    watchlist={watchlist}
                    watchHistory={watchHistory}
                    onToggleWatchlist={handleToggleWatchlist}
                    onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
                    onPlayShow={handlePlayShow}
                    onIncrementPoints={handleIncrementPoints}
                    isGlobalMuted={isGlobalMuted}
                    onToggleGlobalMute={handleToggleGlobalMute}
                    onHoverCardStart={() => setIsFeedCardHovered(true)}
                    onHoverCardEnd={() => setIsFeedCardHovered(false)}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    onLongPressShow={(s) => setActionSheetShow(s)}
                    enableStretchableCards={adminSettings.enableStretchableCards !== false}
                    showTop10Badges={adminSettings.showTop10Badges !== false}
                  />
                )}
              </div>
            )}
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
            onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
            onPlayShow={handlePlayShow}
            onIncrementPoints={handleIncrementPoints}
            isGlobalMuted={isGlobalMuted}
            onToggleGlobalMute={handleToggleGlobalMute}
            onHoverCardStart={() => setIsFeedCardHovered(true)}
            onHoverCardEnd={() => setIsFeedCardHovered(false)}
          />
        ) : activeFilter === 'categories' && !selectedCategoryFilter ? (
          /* Dedicated Categories View with top mobile filter strip */
          <div className="w-full">
            {/* Mobile Filter Strip on Categories page: transparent bar, opaque buttons so buttons & text don't pick up ambient color */}
            <div className="md:hidden relative z-30 w-full px-4 pt-14 pb-[18px] flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
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
            <CategoriesView
              shows={shows}
              categories={categoriesList}
              watchlist={watchlist}
              onToggleWatchlist={handleToggleWatchlist}
              onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
              onPlayShow={handlePlayShow}
              onIncrementPoints={handleIncrementPoints}
              onCloseCategories={() => handleSelectPage('all')}
              resetKey={categoriesResetKey}
              initialCategory={selectedCategoryFromGenre}
            />
          </div>
        ) : (
          <>
            {/* Mobile Filter Strip: Natural transparent bar, buttons transparent as before with equal space below as above */}
            <div className="md:hidden relative z-30 w-full px-4 pt-14 pb-[18px] flex items-center gap-2 overflow-x-auto no-scrollbar select-none">
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

            {/* 2. Hero Recommendation with Ambient Glow (Placed below the filter strip) */}
            {currentHeroShow ? (
              <HeroRecommendation
                show={currentHeroShow}
                isInWatchlist={watchlist.includes(currentHeroShow.id)}
                onToggleWatchlist={handleToggleWatchlist}
                onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
                onPlay={handlePlayShow}
                isPausedByFeedHover={isFeedCardHovered}
                isPausedByModal={
                  Boolean(selectedShowForDetail) ||
                  Boolean(playingMedia) ||
                  Boolean(selectedSpecialFeed) ||
                  Boolean(selectedActorForPool) ||
                  isMobileSearchOpen ||
                  isMobileProfileOpen ||
                  isAccountModalOpen ||
                  isAppSettingsModalOpen ||
                  isRequestContentModalOpen ||
                  isDownloadModalOpen ||
                  isWatchlistModalOpen ||
                  activeFilter !== 'all' ||
                  searchQuery.trim().length > 0 ||
                  isRecommendationPaused
                }
                isGlobalMuted={isGlobalMuted}
                onToggleGlobalMute={handleToggleGlobalMute}
                isMobile={isMobile && !isTablet}
                mobileRecommendationStyle={adminSettings.mobileRecommendationStyle || 'portrait'}
              />
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

            {/* Active Category Filter Pill (shown ONLY for explicit custom category filter, NEVER on series or movies pages) */}
            {Boolean(selectedCategoryFilter) && activeFilter !== 'series' && activeFilter !== 'movies' && (
              <div className="relative z-30 w-full px-4 md:px-8 xl:px-12 my-3 sm:my-4 flex items-center justify-between">
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
            )}

            {/* 3. Shows Display: If in selected category, display 3 in a row 2:3 cards on mobile, 4 per line on desktop */}
            {selectedCategoryFilter ? (
              <div className="relative z-20 w-full px-3 sm:px-4 md:px-8 xl:px-12 mt-4 md:mt-6 pb-16">
                {/* Mobile Layout (< sm): 3 in a row, 2:3 aspect ratio cards */}
                <div className="grid sm:hidden grid-cols-3 gap-2 sm:gap-2.5">
                  {categoryMatchingShows.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleOpenDetails(s, 'trailer')}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                    >
                      <img
                        src={s.posterVerticalUrl || s.posterUrl || s.posterLandscapeUrl}
                        alt={s.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>

                {/* Tablet / Desktop Grid (sm and up) */}
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {categoryMatchingShows.map((s) => (
                    <ShowCard
                      key={s.id}
                      show={s}
                      cardSize="full"
                      isInWatchlist={watchlist.includes(s.id)}
                      onToggleWatchlist={handleToggleWatchlist}
                      onOpenDetails={(show) => handleOpenDetails(show, 'trailer')}
                      onPlay={handlePlayShow}
                      onIncrementPoints={handleIncrementPoints}
                      isGlobalMuted={isGlobalMuted}
                      onToggleGlobalMute={handleToggleGlobalMute}
                      onHoverPreviewStart={() => setIsFeedCardHovered(true)}
                      onHoverPreviewEnd={() => setIsFeedCardHovered(false)}
                      onLongPress={(show) => setActionSheetShow(show)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative z-20 space-y-2.5 md:space-y-3.5 mt-2 md:mt-3">
                {dailyFeeds.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <FeedStrip
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
                      onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
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
                    />

                    {/* Special Single Feed Desktop Section: Exactly 1 single feed banner on desktop homepage */}
                    {idx === 1 && activeFilter === 'all' && !selectedCategoryFilter && !searchQuery.trim() && specialFeedShow && (
                      <SpecialSingleFeed
                        show={specialFeedShow}
                        onPlay={handlePlayShow}
                        onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
                      />
                    )}

                    {/* Browse by Genre Square Feed: Rendered on Desktop & Mobile homepage */}
                    {idx === 2 && activeFilter === 'all' && !selectedCategoryFilter && !searchQuery.trim() && (
                      <BrowseByGenreRow
                        categories={categoriesList}
                        shows={shows}
                        onSelectGenre={handleSelectGenreFromFeed}
                      />
                    )}
                  </React.Fragment>
                ))}

                {/* If feeds list has fewer than 2 rows, guarantee SpecialSingleFeed and BrowseByGenreRow are shown on homepage */}
                {dailyFeeds.length < 2 && activeFilter === 'all' && !selectedCategoryFilter && !searchQuery.trim() && (
                  <>
                    {specialFeedShow && (
                      <SpecialSingleFeed
                        show={specialFeedShow}
                        onPlay={handlePlayShow}
                        onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
                      />
                    )}
                    <BrowseByGenreRow
                      categories={categoriesList}
                      shows={shows}
                      onSelectGenre={handleSelectGenreFromFeed}
                    />
                  </>
                )}
                {dailyFeeds.length === 2 && activeFilter === 'all' && !selectedCategoryFilter && !searchQuery.trim() && (
                  <BrowseByGenreRow
                    categories={categoriesList}
                    shows={shows}
                    onSelectGenre={handleSelectGenreFromFeed}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* Global Redesign Footer */}
        <Footer
          shows={shows}
          onOpenAccount={() => setIsAccountModalOpen(true)}
          onOpenSettings={() => setIsAppSettingsModalOpen(true)}
          onRequestContent={() => setIsRequestContentModalOpen(true)}
          onOpenCategories={() => handleSelectPage('categories')}
          platformName={platformName}
          isMyListPage={activeFilter === 'watchlist'}
        />
      </main>

      {/* 4. Full Detailed Page / Modal */}
      {selectedShowForDetail && (
        <DetailModal
          show={selectedShowForDetail}
          allShows={shows}
          adminSettings={adminSettings}
          isInWatchlist={watchlist.includes(selectedShowForDetail.id)}
          watchlist={watchlist}
          onToggleWatchlist={handleToggleWatchlist}
          onClose={handleCloseDetails}
          onPlayShow={handlePlayShow}
          onMobileSeasonSheetChange={setIsMobileSeasonPickerOpen}
          onMobileInfoSheetChange={setIsMobileInfoSheetOpen}
          onSelectShow={(newShow) => handleOpenDetails(newShow, 'trailer')}
          onSelectActor={(actor) => handleSelectActorForPool(actor)}
          onSelectGenre={(genre) => {
            handleCloseDetails();
            setSearchQuery(genre);
            window.scrollTo({ top: 0, behavior: 'instant' });
          }}
          onUpdateShowBlog={handleUpdateShowBlog}
          watchProgress={selectedShowForDetail ? watchHistory[selectedShowForDetail.id] : undefined}
          onWatchInFullPlayer={(s, ep, trailer, initialSeekTime) => {
            if (ep) {
              handleSubViewChange('main', { episode: ep });
            } else if (trailer) {
              handleSubViewChange('main', { trailer });
            } else {
              handleSubViewChange('main');
            }
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
        />
      )}

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
            handleOpenDetails(s, 'trailer');
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
          handleOpenDetails(s, 'trailer');
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

      {/* 8. Full Page Account / Edit Profile Settings (Exact 100% UI match to Image 2) */}
      <EditProfilePage
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setIsRecommendationPaused(false);
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
            onClose={() => setPlayingMedia(null)}
          />
        ) : (
          <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-in fade-in duration-300">
            <CustomPlayer
              videoUrl={playingMedia.videoUrl}
              title={playingMedia.title}
              subtitle={playingMedia.subtitle}
              episodeSubtitle={playingMedia.episodeSubtitle}
              titleLogoUrl={playingMedia.titleLogoUrl}
              previewThumbnailUrl={playingMedia.previewThumbnailUrl}
              autoPlay={true}
              initialCurrentTime={playingMedia.initialCurrentTime || 0}
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
              onClose={() => setPlayingMedia(null)}
            />
          </div>
        )
      )}

      {/* Mobile Real-Time Search Modal */}
      <MobileSearchModal
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
        shows={shows}
        onOpenDetails={(s) => {
          setIsMobileSearchOpen(false);
          handleOpenDetails(s, 'trailer');
        }}
        onPlayShow={(s) => {
          setIsMobileSearchOpen(false);
          handlePlayShow(s);
        }}
      />

      {/* Mobile Profile & My List Modal */}
      <MobileProfileModal
        isOpen={isMobileProfileOpen}
        onClose={() => setIsMobileProfileOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        watchHistory={watchHistory}
        onOpenPosterActionSheet={(s) => setActionSheetShow(s)}
        watchlistShows={watchlistShows}
        continueWatchingShows={continueWatchingShows}
        onRemoveFromWatchlist={handleToggleWatchlist}
        onRemoveFromContinueWatching={handleRemoveFromWatchHistory}
        onClearWatchlist={handleClearWatchlist}
        onClearWatchHistory={handleClearWatchHistory}
        onOpenDetails={(s) => {
          setIsMobileProfileOpen(false);
          handleOpenDetails(s, 'trailer');
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
          if (found) handleOpenDetails(found, 'trailer');
        }}
        onOpenAccountModal={() => {
          setIsMobileProfileOpen(false);
          setIsAccountModalOpen(true);
        }}
        onOpenAppSettings={() => {
          setIsMobileProfileOpen(false);
          setIsAppSettingsModalOpen(true);
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
        onToggleAuth={() => setIsLoggedIn(!isLoggedIn)}
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
          handleOpenDetails(s, 'trailer');
        }}
        onOpenDetails={(s) => handleOpenDetails(s, 'trailer')}
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
          handleOpenDetails(s, 'trailer');
        }}
        onRemoveFromContinueWatching={(sId) => {
          handleRemoveFromWatchHistory(sId);
        }}
      />

      {/* Mobile Floating / Bottom-Fixed Navigation Bar: hidden when popups / sheets / player are active */}
      {isMobile && !isTablet && !actionSheetShow && !isMobileSeasonPickerOpen && !isMobileProfileEditOpen && !isMobileInfoSheetOpen && !playingMedia && (
        <MobileBottomNav
          activeTab={isMobileSearchOpen ? 'search' : isMobileProfileOpen ? 'profile' : 'home'}
          onSelectTab={handleMobileSelectTab}
          onTripleTapHome={handleTripleTapHome}
          userAvatar={userAvatar}
          platformName={platformName}
          navbarStyle={adminSettings.mobileNavbarStyle || 'floating'}
          showLabels={adminSettings.mobileNavbarShowLabels !== false}
        />
      )}

      {/* Universal Top-Layer Custom Pointer Tooltip */}
      <GlobalTooltip />
    </div>
  );
}
