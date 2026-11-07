import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Show,
  FeedConfig,
  AdminSettings,
  CastMember,
  Season,
  Episode,
  WhereToWatch,
  TrailerItem,
  BlogSection,
  VideoSourceType,
  CategoryItem,
  UserProfile,
  ProfilePictureGroup,
  NotificationItem
} from '../types';
import {
  Film,
  Tv,
  Plus,
  Trash2,
  Edit,
  Pencil,
  Save,
  X,
  Search,
  Sparkles,
  Sliders,
  TrendingUp,
  Settings,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  Star,
  Users,
  Video,
  Database,
  Lock,
  LogOut,
  FolderPlus,
  Copy,
  AlertTriangle,
  Play,
  Image as ImageIcon,
  Download,
  Upload,
  Globe,
  Radio,
  Clock,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  Bell
} from 'lucide-react';
import { DiziLogo } from './DiziLogo';
import fullBackupData from '../full_backup.json';

const INITIAL_CATEGORIES = ((fullBackupData as any)?.categoriesList as CategoryItem[]) || [];
const INITIAL_PROFILE_PICTURE_GROUPS = ((fullBackupData as any)?.profilePictureGroups as ProfilePictureGroup[]) || [];

interface AdminDashboardPageProps {
  shows: Show[];
  feeds: FeedConfig[];
  adminSettings: AdminSettings;
  notifications?: NotificationItem[];
  initialTab?: 'overview' | 'shows' | 'feeds' | 'categories' | 'profiles' | 'notifications' | 'image_health' | 'video_health' | 'settings' | 'export_import';
  initialEditingFeedId?: string;
  onUpdateShows: (shows: Show[]) => void;
  onUpdateFeeds: (feeds: FeedConfig[]) => void;
  onUpdateSettings: (settings: AdminSettings) => void;
  onUpdateNotifications?: (notifications: NotificationItem[]) => void;
  onExitAdmin: () => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  shows,
  feeds,
  adminSettings,
  notifications = [],
  initialTab,
  initialEditingFeedId,
  onUpdateShows,
  onUpdateFeeds,
  onUpdateSettings,
  onUpdateNotifications,
  onExitAdmin
}) => {
  type AdminTab = 'overview' | 'shows' | 'feeds' | 'categories' | 'profiles' | 'notifications' | 'image_health' | 'video_health' | 'settings' | 'export_import';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialEditingFeedId ? 'feeds' : (initialTab || 'overview'));

  // Always load admin panel from the top on mount and tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Search & Filters for Shows Table
  const [showSearch, setShowSearch] = useState('');
  const [showTypeFilter, setShowTypeFilter] = useState<'all' | 'series' | 'movie'>('all');

  // Delete Confirmation Modal State (Reliable in-app confirmation that avoids blocked window.confirm)
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    title: string;
    type: 'show' | 'feed';
  } | null>(null);

  // Editing / Creating Show Form State (Separate modals for Shows & Movies)
  const [modalMode, setModalMode] = useState<'none' | 'show' | 'movie'>('none');
  const [formData, setFormData] = useState<Show | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState<boolean>(false);
  const [activeFormTab, setActiveFormTab] = useState<'metadata' | 'media' | 'where_to_watch' | 'episodes_stream' | 'blog'>('metadata');

  // TMDB fetch state
  const [tmdbLoading, setTmdbLoading] = useState<boolean>(false);
  const [tmdbError, setTmdbError] = useState<string | null>(null);

  // Selected season for episodic editor
  const [selectedSeasonIdx, setSelectedSeasonIdx] = useState<number>(0);

  // Custom Feed Creation with Multi-Source Dropdowns & Special Feeds
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [newFeedSubtitle, setNewFeedSubtitle] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState<FeedConfig['categoryKey']>('custom');
  const [newFeedShowRank, setNewFeedShowRank] = useState<boolean>(false);

  // Dropdown 1
  const [sourceType1, setSourceType1] = useState<'genre' | 'categories' | 'custom'>('genre');
  const [selectedGenres1, setSelectedGenres1] = useState<string[]>([]);
  const [selectedCategories1, setSelectedCategories1] = useState<string[]>([]);
  const [selectedShowIds1, setSelectedShowIds1] = useState<string[]>([]);

  // Dropdown 2 (optional second source for 1 row)
  const [hasSecondSource, setHasSecondSource] = useState<boolean>(false);
  const [sourceType2, setSourceType2] = useState<'genre' | 'categories' | 'custom'>('categories');
  const [selectedGenres2, setSelectedGenres2] = useState<string[]>([]);
  const [selectedCategories2, setSelectedCategories2] = useState<string[]>([]);
  const [selectedShowIds2, setSelectedShowIds2] = useState<string[]>([]);

  // Editing existing feed
  const [editingFeedId, setEditingFeedId] = useState<string | null>(initialEditingFeedId || null);

  // Special & Stretchable Feed configuration
  const [isSpecialFeed, setIsSpecialFeed] = useState<boolean>(false);
  const [isStretchableFeed, setIsStretchableFeed] = useState<boolean>(false);
  const [specialLogoUrl, setSpecialLogoUrl] = useState<string>('');
  const [specialTagline, setSpecialTagline] = useState<string>('');
  const [specialExploreText, setSpecialExploreText] = useState<string>('Explore All');
  const [specialExploreAction, setSpecialExploreAction] = useState<'showcase' | 'category'>('showcase');
  const [specialExploreCategory, setSpecialExploreCategory] = useState<string>('historical-ottoman');
  const [specialBgImageUrl, setSpecialBgImageUrl] = useState<string>('');
  const [specialBgDarkness, setSpecialBgDarkness] = useState<number>(45); // 0 to 100 percentage slider (same as video player page)

  // Search queries for custom show selector inside dropdowns
  const [sourceSearchQuery1, setSourceSearchQuery1] = useState<string>('');
  const [sourceSearchQuery2, setSourceSearchQuery2] = useState<string>('');

  // All distinct genres across catalog
  const ALL_GENRES: string[] = useMemo(() => {
    const set = new Set<string>();
    shows.forEach((s) => (s.genres || []).forEach((g) => set.add(g)));
    return Array.from(set).filter(Boolean).sort();
  }, [shows]);

  // Feed source multi-select toggles
  const toggleGenre1 = (genre: string) => {
    setSelectedGenres1((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };
  const toggleCategory1 = (cat: string) => {
    setSelectedCategories1((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const toggleShow1 = (showId: string) => {
    setSelectedShowIds1((prev) =>
      prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
    );
  };

  const toggleGenre2 = (genre: string) => {
    setSelectedGenres2((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };
  const toggleCategory2 = (cat: string) => {
    setSelectedCategories2((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };
  const toggleShow2 = (showId: string) => {
    setSelectedShowIds2((prev) =>
      prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
    );
  };

  // Feed Shows Assignment Modal
  const [assigningFeed, setAssigningFeed] = useState<FeedConfig | null>(null);
  const [feedSearchTerm, setFeedSearchTerm] = useState('');

  // Toast / notification banner
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Image Health Check State
  const [imageQuickEdits, setImageQuickEdits] = useState<Record<string, string>>({});
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Video Health Check State
  const [videoQuickEdits, setVideoQuickEdits] = useState<Record<string, string>>({});
  const [brokenVideos, setBrokenVideos] = useState<Set<string>>(new Set());
  const [healthyVideos, setHealthyVideos] = useState<Set<string>>(new Set());
  const [videoFilterType, setVideoFilterType] = useState<'all' | 'broken' | 'trailers' | 'episodes' | 'movies'>('all');
  const [testingVideoKey, setTestingVideoKey] = useState<string | null>(null);

  // Categories Management State (categories with card pictures)
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_custom_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES || [];
  });

  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Editing Category Modal State
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');

  const handleStartEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatImage(cat.imageUrl);
    setEditCatDesc(cat.description || '');
  };

  const handleSaveCategoryEdit = () => {
    if (!editingCategory) return;
    if (!editCatName.trim()) {
      notify('Category name is required');
      return;
    }
    const updatedImg = editCatImage.trim() || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80';
    setCategoriesList((prev) =>
      prev.map((c) =>
        c.id === editingCategory.id
          ? {
              ...c,
              name: editCatName.trim(),
              imageUrl: updatedImg,
              description: editCatDesc.trim()
            }
          : c
      )
    );
    notify(`Saved category "${editCatName.trim()}" image & details!`);
    setEditingCategory(null);
  };

  useEffect(() => {
    localStorage.setItem('cineflix_custom_categories', JSON.stringify(categoriesList));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cineflix_custom_categories',
      newValue: JSON.stringify(categoriesList)
    }));
  }, [categoriesList]);

  // Dynamic categories available across portal when adding shows/movies
  const AVAILABLE_CATEGORIES = categoriesList.map((c) => c.name);

  // User Profiles Management State (profiles with name, profile pictures, and assigned movies/series)
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_user_profiles');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'prof-1',
        name: 'Member Profile',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        assignedShowIds: []
      },
      {
        id: 'prof-2',
        name: 'Cinema VIP',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        assignedShowIds: []
      }
    ];
  });

  const [newProfName, setNewProfName] = useState('');
  const [newProfAvatar, setNewProfAvatar] = useState('');
  const [newProfAssignedShows, setNewProfAssignedShows] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('cineflix_user_profiles', JSON.stringify(userProfiles));
  }, [userProfiles]);

  // Profile Picture Groups (Shows & Movies avatar icons library for end users)
  const [profilePictureGroups, setProfilePictureGroups] = useState<ProfilePictureGroup[]>(() => {
    if (adminSettings.profilePictureGroups && adminSettings.profilePictureGroups.length > 0) {
      return adminSettings.profilePictureGroups;
    }
    try {
      const saved = localStorage.getItem('cineflix_profile_picture_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROFILE_PICTURE_GROUPS || [];
  });

  const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
  const [groupSourceType, setGroupSourceType] = useState<'movie' | 'series' | 'custom'>('series');
  const [groupCustomName, setGroupCustomName] = useState<string>('');
  const [groupShowId, setGroupShowId] = useState<string>('');
  const [groupImageLinks, setGroupImageLinks] = useState<string[]>(['']);

  // Editing existing feed title
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupTitle, setEditGroupTitle] = useState<string>('');

  // Quick single image URL per group for inline adder: { [groupId]: '' }
  const [quickAddGroupImage, setQuickAddGroupImage] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('cineflix_profile_picture_groups', JSON.stringify(profilePictureGroups));
    onUpdateSettings({
      ...adminSettings,
      profilePictureGroups
    });
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'cineflix_profile_picture_groups',
      newValue: JSON.stringify(profilePictureGroups)
    }));
  }, [profilePictureGroups]);

  // Localhost Direct Disk Write helper
  const isInitialMount = useRef(true);
  const lastSavedHashRef = useRef<string>('');

  const saveToDiskDirectly = async (overrideData?: {
    shows?: Show[];
    feeds?: FeedConfig[];
    adminSettings?: AdminSettings;
    categoriesList?: CategoryItem[];
    profilePictureGroups?: ProfilePictureGroup[];
    notifications?: NotificationItem[];
  }) => {
    try {
      const payload = {
        exported_at: new Date().toISOString(),
        app: (overrideData?.adminSettings ?? adminSettings).platformName || 'Dizi Urdu',
        version: '2.0',
        shows: overrideData?.shows ?? shows,
        feeds: overrideData?.feeds ?? feeds,
        adminSettings: {
          ...(overrideData?.adminSettings ?? adminSettings),
          profilePictureGroups: overrideData?.profilePictureGroups ?? profilePictureGroups
        },
        categoriesList: overrideData?.categoriesList ?? categoriesList,
        profilePictureGroups: overrideData?.profilePictureGroups ?? profilePictureGroups,
        notifications: overrideData?.notifications ?? notifications
      };

      const serialized = JSON.stringify({
        s: payload.shows,
        f: payload.feeds,
        a: payload.adminSettings,
        c: payload.categoriesList,
        p: payload.profilePictureGroups,
        n: payload.notifications
      });

      // Avoid unnecessary duplicate disk saves
      if (lastSavedHashRef.current === serialized) {
        return;
      }
      lastSavedHashRef.current = serialized;

      await fetch('/api/save-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch {
      // Local development auto-sync
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        lastSavedHashRef.current = JSON.stringify({
          s: shows,
          f: feeds,
          a: { ...adminSettings, profilePictureGroups },
          c: categoriesList,
          p: profilePictureGroups,
          n: notifications
        });
      } catch {}
      return;
    }
    const timer = setTimeout(() => {
      saveToDiskDirectly();
    }, 1200);
    return () => clearTimeout(timer);
  }, [shows, feeds, adminSettings, categoriesList, profilePictureGroups, notifications]);

  // Push Notification State
  const [notifImageUrl, setNotifImageUrl] = useState<string>('');
  const [notifHeading, setNotifHeading] = useState<string>('');
  const [notifSubheading, setNotifSubheading] = useState<string>('');
  const [notifShowId, setNotifShowId] = useState<string>('');
  const [notifTimeAgo, setNotifTimeAgo] = useState<string>('Just now');

  const handlePushNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifHeading.trim()) {
      notify('Please enter a heading for the notification.');
      return;
    }
    const targetShow = shows.find((s) => s.id === notifShowId);
    const fallbackImage = targetShow?.posterLandscapeUrl || shows[0]?.posterLandscapeUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=240&q=80';
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      showId: notifShowId || (shows[0]?.id || ''),
      title: notifHeading.trim(),
      description: notifSubheading.trim() || 'Watch new episodes and highlights streaming in 4K.',
      thumbnailUrl: notifImageUrl.trim() || fallbackImage,
      timeAgo: notifTimeAgo.trim() || 'Just now',
      unread: true,
      createdAt: Date.now()
    };

    const updated = [newNotif, ...notifications];
    if (onUpdateNotifications) {
      onUpdateNotifications(updated);
    }
    setNotifHeading('');
    setNotifSubheading('');
    setNotifImageUrl('');
    notify(`Push Notification "${newNotif.title}" broadcast to navbar!`);
  };

  const handleDeleteNotification = (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    if (onUpdateNotifications) {
      onUpdateNotifications(updated);
    }
    notify('Notification removed.');
  };

  const handleToggleUnreadNotification = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, unread: !n.unread } : n));
    if (onUpdateNotifications) {
      onUpdateNotifications(updated);
    }
  };

  // Filtered shows for catalog list
  const filteredShows = shows.filter((s) => {
    const matchType = showTypeFilter === 'all' || s.type === showTypeFilter;
    const q = showSearch.toLowerCase();
    const matchQuery =
      s.title.toLowerCase().includes(q) ||
      (s.turkishTitle && s.turkishTitle.toLowerCase().includes(q)) ||
      (s.supportingTitles && s.supportingTitles.some((st) => st.toLowerCase().includes(q))) ||
      (s.slug && s.slug.toLowerCase().includes(q)) ||
      s.genres.some((g) => g.toLowerCase().includes(q));
    return matchType && matchQuery;
  });

  // Calculate 24-hour play count for a show
  const get24HourPlays = (s: Show): number => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const count = (s.play_events || []).filter((e) => e.timestamp >= twentyFourHoursAgo).length;
    return count;
  };

  // 24-Hour Top 10 sorted shows
  const top10Rolling24h = [...shows]
    .sort((a, b) => {
      const pB = get24HourPlays(b);
      const pA = get24HourPlays(a);
      if (pB !== pA) return pB - pA;
      return (b.all_time_score || b.points) - (a.all_time_score || a.points);
    })
    .slice(0, 10);

  // Initialize a blank show or movie
  const getBlankTitle = (type: 'series' | 'movie'): Show => ({
    id: `${type}-${Date.now()}`,
    title: type === 'series' ? 'New Turkish Series' : 'New Turkish Feature Film',
    turkishTitle: '',
    type,
    tmdbId: undefined,
    slug: (type === 'series' ? 'new-series-' : 'new-movie-') + Math.floor(Math.random() * 9000 + 1000),
    announcementPill: type === 'series' ? 'Season 1 Streaming Now' : 'Premiere Feature Film',
    is_recommended: true,
    isSpecialSingleFeedEligible: false,
    categories: ['Historical Epics', 'Action & Combat'],
    supportingTitles: [],

    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80',
    backdropUrl2: '',
    verticalBackdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=720&q=80',
    verticalBackdropUrl2: '',
    posterLandscapeUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80',
    posterLandscapeUrl2: '',
    posterVerticalUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
    posterVerticalUrl2: '',
    posterVerticalUrls: [],
    poster9x16Url: '',
    poster9x16Urls: [],
    poster1x2Url: '',
    poster1x2Urls: [],
    backdropUrls: [],
    verticalBackdropUrls: [],
    posterLandscapeUrls: [],
    titleLogoUrl: '',
    sourceWatermarkUrl: '',
    embedBackdropUrl: '',
    embedBackdropDarkness: 35,
    embedBackdropBlur: 0,
    trailerUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    hoverPreviewUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    popoutPreviewUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    detailPreviewUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    trailersAndMore: [
      {
        id: `clip-${Date.now()}-1`,
        title: 'Official Teaser Preview',
        videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
        duration: '1m 45s'
      }
    ],

    logoText: type === 'series' ? 'SERIES' : 'MOVIE',
    logoSubtext: '',
    synopsis: 'An epic narrative of honor, family alliances, and high-stakes drama across Anatolia.',
    shortDescription: 'Streaming in ultra high-definition 4K with Dolby Atmos sound.',
    ambientColor: '#d97706',
    ambientGlowRgb: '217, 119, 6',
    releaseYear: '2025',
    maturityRating: '16+',
    maturityDetails: 'violence, historical warfare, tense sequences',
    matchScore: 98,
    imdbRating: 8.7,
    durationOrSeasons: type === 'series' ? '1 Season' : '2h 10m',
    genres: ['Historical Epic', 'Action', 'Drama'],
    thisSeriesIs: ['Epic', 'Inspiring', 'Action-packed'],
    qualityBadges: ['4K Ultra HD', 'HDR10', 'Dolby Atmos'],

    points: 1200,
    all_time_score: 1200,
    play_events: [],

    whereToWatchEnabled: true,
    whereToWatch: [
      {
        provider: 'youtube',
        name: 'YouTube',
        url: 'https://youtube.com',
        bgColor: '#FF0000',
        logoUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=120&q=80',
        freeOrSub: 'Official Channel'
      },
      {
        provider: 'netflix',
        name: 'Netflix',
        url: 'https://netflix.com',
        bgColor: '#E50914',
        logoUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=120&q=80',
        freeOrSub: 'Subscription'
      }
    ],

    hasEpisodicContent: type === 'series',
    seasons:
      type === 'series'
        ? [
            {
              seasonNumber: 1,
              title: 'Season 1',
              episodes: [
                {
                  id: `ep-${Date.now()}-1`,
                  seasonNumber: 1,
                  episodeNumber: 1,
                  title: 'Episode 1: The Gathering Storm',
                  subheading: '',
                  duration: '48m',
                  thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
                  synopsis: '',
                  videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
                }
              ]
            }
          ]
        : undefined,

    movieStreamEnabled: type === 'movie',
    movieStreamType: 'direct',
    movieStreamUrl:
      type === 'movie'
        ? 'https://vjs.zencdn.net/v/oceans.mp4'
        : undefined,

    cast: [
      {
        id: `actor-${Date.now()}-1`,
        name: 'Burak Özçivit',
        character: 'Lead Commander',
        profileUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
      }
    ],

    blog: {
      heading: 'Behind the Scenes & Production',
      publishedDate: 'Just Added',
      author: 'Dizi Editorial Desk',
      readTime: '3 min read',
      heroImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80',
      slug: (type === 'series' ? 'article-series-' : 'article-movie-') + Date.now(),
      sections: [
        {
          title: 'Cinematography and Historical Sets',
          content: 'Filmed on expansive sets crafted with museum-grade accuracy and Turkish artisans.'
        }
      ],
      trivia: ['Authentic medieval armor hand-forged for the actors.', 'Original orchestral symphonic scores.']
    }
  });

  // Open separate Add Modal
  const handleOpenAddModal = (type: 'show' | 'movie') => {
    const mediaType = type === 'show' ? 'series' : 'movie';
    setFormData(getBlankTitle(mediaType));
    setIsEditingExisting(false);
    setModalMode(type);
    setActiveFormTab('metadata');
    setSelectedSeasonIdx(0);
    setTmdbError(null);
  };

  // Open Edit Modal
  const handleOpenEditModal = (showToEdit: Show) => {
    // Clone show to allow mutations
    setFormData(JSON.parse(JSON.stringify(showToEdit)));
    setIsEditingExisting(true);
    setModalMode(showToEdit.type === 'movie' ? 'movie' : 'show');
    setActiveFormTab('metadata');
    setSelectedSeasonIdx(0);
    setTmdbError(null);
  };

  // Auto-Fetch from TMDB
  const handleFetchTMDB = async () => {
    if (!formData || !formData.tmdbId) {
      setTmdbError('Please enter a valid numeric TMDB ID first.');
      return;
    }
    setTmdbLoading(true);
    setTmdbError(null);

    const isMovie = formData.type === 'movie';
    const endpointType = isMovie ? 'movie' : 'tv';
    const id = formData.tmdbId;

    try {
      // 1. Fetch primary data from TMDB API or public TMDB mirrors
      // We query TMDB demo / open endpoints with fallback parsing
      const primaryRes = await fetch(
        `https://api.themoviedb.org/3/${endpointType}/${id}?api_key=4e44d9029b1270a757cddc766a1bcb63&append_to_response=credits,content_ratings,release_dates`
      );

      if (!primaryRes.ok) {
        throw new Error(`TMDB responded with HTTP ${primaryRes.status}`);
      }

      const data = await primaryRes.json();

      // Extract details
      const title = data.title || data.name || formData.title;
      const originalTitle = data.original_title || data.original_name || '';
      const releaseYear = (data.release_date || data.first_air_date || '').slice(0, 4) || formData.releaseYear;
      const voteAverage = data.vote_average ? Math.round(data.vote_average * 10) / 10 : formData.imdbRating;
      const synopsis = data.overview || formData.synopsis;

      // Extract genres
      const fetchedGenres = (data.genres || []).map((g: { name: string }) => g.name);

      // Extract maturity rating
      let maturity = formData.maturityRating || '16+';
      if (!isMovie && data.content_ratings?.results) {
        const usRating = data.content_ratings.results.find((r: { iso_3166_1: string; rating: string }) => r.iso_3166_1 === 'US' || r.iso_3166_1 === 'TR');
        if (usRating?.rating) maturity = usRating.rating;
      } else if (isMovie && data.release_dates?.results) {
        const usDates = data.release_dates.results.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'US' || r.iso_3166_1 === 'TR');
        const cert = usDates?.release_dates?.[0]?.certification;
        if (cert) maturity = cert;
      }

      // Extract full billing cast (full means full)
      const fetchedCast: CastMember[] = (data.credits?.cast || []).map((c: any, idx: number) => ({
        id: `cast-${c.id || Math.random()}`,
        name: c.name || 'Actor',
        character: c.character || 'Character',
        order: c.order ?? idx,
        profileUrl: c.profile_path
          ? `https://image.tmdb.org/t/p/w300${c.profile_path}`
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        tmdbId: c.id
      }));

      // Extract Backdrop and Posters if available
      const backdrop = data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : formData.backdropUrl;
      const posterV = data.poster_path ? `https://image.tmdb.org/t/p/w780${data.poster_path}` : formData.posterVerticalUrl;

      // Auto generate slug
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      setFormData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          title,
          turkishTitle: originalTitle || prev.turkishTitle,
          slug: prev.slug || generatedSlug,
          releaseYear: releaseYear ? `${releaseYear}` : prev.releaseYear,
          imdbRating: voteAverage,
          synopsis,
          shortDescription: synopsis.slice(0, 140) + '...',
          maturityRating: maturity,
          genres: fetchedGenres.length > 0 ? fetchedGenres : prev.genres,
          cast: fetchedCast.length > 0 ? fetchedCast : prev.cast,
          backdropUrl: backdrop,
          posterVerticalUrl: posterV
        };
      });

      notify(`TMDB data successfully fetched for "${title}"!`);
    } catch (err: any) {
      console.warn('TMDB Fetch Error:', err);
      setTmdbError(`Could not fetch TMDB ID ${id}: ${err.message || 'Check connection or verify ID'}`);
    } finally {
      setTmdbLoading(false);
    }
  };

  // Save the Show / Movie Form
  const handleSaveFormData = () => {
    if (!formData) return;
    if (!formData.title.trim()) {
      alert('Please provide a title.');
      return;
    }

    if (isEditingExisting) {
      onUpdateShows(shows.map((s) => (s.id === formData.id ? formData : s)));
      notify(`Updated "${formData.title}" successfully.`);
    } else {
      onUpdateShows([formData, ...shows]);
      notify(`Created new ${formData.type === 'movie' ? 'movie' : 'series'} "${formData.title}"!`);
    }

    setModalMode('none');
    setFormData(null);
  };

  // Delete a Show / Movie (Uses in-app modal instead of iframe-blocked window.confirm)
  const handleDeleteShow = (id: string, title: string) => {
    setDeleteConfirmTarget({ id, title, type: 'show' });
  };

  // Feed Strips Management
  const moveFeed = (index: number, direction: 'up' | 'down') => {
    const updated = [...feeds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onUpdateFeeds(updated);
  };

  const toggleFeedEnabled = (feedId: string) => {
    onUpdateFeeds(feeds.map((f) => (f.id === feedId ? { ...f, enabled: !f.enabled } : f)));
  };

  const handleDeleteFeed = (feedId: string, title?: string) => {
    const feed = feeds.find((f) => f.id === feedId);
    setDeleteConfirmTarget({ id: feedId, title: title || feed?.title || 'this feed row', type: 'feed' });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    if (deleteConfirmTarget.type === 'show') {
      onUpdateShows(shows.filter((s) => s.id !== deleteConfirmTarget.id));
      notify(`Permanently removed "${deleteConfirmTarget.title}".`);
    } else {
      onUpdateFeeds(feeds.filter((f) => f.id !== deleteConfirmTarget.id));
      notify(`Deleted feed row "${deleteConfirmTarget.title}".`);
    }
    setDeleteConfirmTarget(null);
  };

  const handleStartEditFeed = (feed: FeedConfig) => {
    setActiveTab('feeds');
    setEditingFeedId(feed.id);
    setNewFeedTitle(feed.title || '');
    setNewFeedSubtitle(feed.subtitle || '');
    setNewFeedCategory(feed.categoryKey || 'custom');
    setNewFeedShowRank(Boolean(feed.showRankNumbers));
    setSourceType1(feed.sourceType1 || (feed.showIds && feed.showIds.length > 0 ? 'custom' : 'genre'));
    setSelectedGenres1(feed.selectedGenres1 || []);
    setSelectedCategories1(feed.selectedCategories1 || []);
    setSelectedShowIds1(feed.selectedShowIds1 || feed.showIds || []);
    setHasSecondSource(Boolean(feed.hasSecondSource));
    setSourceType2(feed.sourceType2 || 'categories');
    setSelectedGenres2(feed.selectedGenres2 || []);
    setSelectedCategories2(feed.selectedCategories2 || []);
    setSelectedShowIds2(feed.selectedShowIds2 || []);
    setIsSpecialFeed(Boolean(feed.isSpecialFeed));
    setSpecialLogoUrl(feed.specialLogoUrl || '');
    setSpecialTagline(feed.specialTagline || '');
    setSpecialExploreText(feed.specialExploreText || 'Explore All');
    setSpecialExploreAction(feed.specialExploreAction || 'showcase');
    setSpecialExploreCategory(feed.specialExploreCategory || 'historical-ottoman');
    setSpecialBgImageUrl(feed.specialBgImageUrl || '');
    setSpecialBgImageUrl(feed.specialBgImageUrl || '');
    setSpecialBgDarkness(feed.specialBgDarkness ?? 45);
    setIsStretchableFeed(Boolean(feed.isStretchableFeed));

    setTimeout(() => {
      const formEl = document.getElementById('admin-feed-form-section');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCancelEditFeed = () => {
    setEditingFeedId(null);
    setNewFeedTitle('');
    setNewFeedSubtitle('');
    setNewFeedCategory('custom');
    setNewFeedShowRank(false);
    setSelectedGenres1([]);
    setSelectedCategories1([]);
    setSelectedShowIds1([]);
    setHasSecondSource(false);
    setSelectedGenres2([]);
    setSelectedCategories2([]);
    setSelectedShowIds2([]);
    setIsSpecialFeed(false);
    setIsStretchableFeed(false);
    setSpecialLogoUrl('');
    setSpecialTagline('');
    setSpecialExploreText('Explore All');
    setSpecialExploreAction('showcase');
    setSpecialExploreCategory('historical-ottoman');
    setSpecialBgImageUrl('');
    setSpecialBgDarkness(45);
  };

  useEffect(() => {
    if (initialEditingFeedId) {
      const feedToEdit = feeds.find((f) => f.id === initialEditingFeedId);
      if (feedToEdit) {
        handleStartEditFeed(feedToEdit);
      }
    }
  }, [initialEditingFeedId]);

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedTitle.trim()) return;

    if (editingFeedId) {
      const updatedFeeds = feeds.map((f) => {
        if (f.id !== editingFeedId) return f;
        return {
          ...f,
          title: newFeedTitle.trim(),
          subtitle: newFeedSubtitle.trim() || undefined,
          showRankNumbers: newFeedShowRank,
          sourceType1,
          selectedGenres1,
          selectedCategories1,
          selectedShowIds1,
          hasSecondSource,
          sourceType2: hasSecondSource ? sourceType2 : undefined,
          selectedGenres2: hasSecondSource ? selectedGenres2 : undefined,
          selectedCategories2: hasSecondSource ? selectedCategories2 : undefined,
          selectedShowIds2: hasSecondSource ? selectedShowIds2 : undefined,
          isSpecialFeed,
          isStretchableFeed,
          specialLogoUrl: specialLogoUrl.trim() || undefined,
          specialTagline: specialTagline.trim() || undefined,
          specialExploreText: specialExploreText.trim() || 'Explore All',
          specialExploreAction: isSpecialFeed ? specialExploreAction : undefined,
          specialExploreCategory: isSpecialFeed && specialExploreAction === 'category' ? specialExploreCategory : undefined,
          specialBgImageUrl: specialBgImageUrl.trim() || undefined,
          specialBgDarkness: isSpecialFeed ? specialBgDarkness : undefined,
          showIds: sourceType1 === 'custom' ? selectedShowIds1 : (f.showIds || []),
          isCuratedByAdmin: true
        };
      });

      onUpdateFeeds(updatedFeeds);
      notify(`Saved changes to feed "${newFeedTitle.trim()}".`);
      handleCancelEditFeed();
      return;
    }

    const newFeed: FeedConfig = {
      id: `feed-${Date.now()}`,
      title: newFeedTitle.trim(),
      subtitle: newFeedSubtitle.trim() || (isSpecialFeed ? 'Special Curated Collection' : isStretchableFeed ? 'Stretchable feed row' : 'Curated catalog row'),
      categoryKey: 'custom',
      showRankNumbers: newFeedShowRank,
      enabled: true,
      isCuratedByAdmin: true,
      sourceType1,
      selectedGenres1,
      selectedCategories1,
      selectedShowIds1,
      hasSecondSource,
      sourceType2: hasSecondSource ? sourceType2 : undefined,
      selectedGenres2: hasSecondSource ? selectedGenres2 : undefined,
      selectedCategories2: hasSecondSource ? selectedCategories2 : undefined,
      selectedShowIds2: hasSecondSource ? selectedShowIds2 : undefined,
      isSpecialFeed,
      isStretchableFeed,
      specialLogoUrl: specialLogoUrl.trim() || undefined,
      specialTagline: specialTagline.trim() || undefined,
      specialExploreText: specialExploreText.trim() || 'Explore All',
      specialExploreAction: isSpecialFeed ? specialExploreAction : undefined,
      specialExploreCategory: isSpecialFeed && specialExploreAction === 'category' ? specialExploreCategory : undefined,
      specialBgImageUrl: specialBgImageUrl.trim() || undefined,
      specialBgDarkness: isSpecialFeed ? specialBgDarkness : undefined,
      showIds: sourceType1 === 'custom' ? selectedShowIds1 : []
    };

    onUpdateFeeds([...feeds, newFeed]);
    handleCancelEditFeed();
    notify(`Created ${isSpecialFeed ? 'Special Feed' : isStretchableFeed ? 'Stretchable Feed Row' : 'Feed Row'} "${newFeed.title}".`);
  };

  // Toggle show assignment in a feed
  const toggleShowInFeed = (feedId: string, showId: string) => {
    const targetFeed = feeds.find((f) => f.id === feedId);
    if (!targetFeed) return;
    const currentIds = targetFeed.showIds || [];
    const updatedIds = currentIds.includes(showId)
      ? currentIds.filter((id) => id !== showId)
      : [...currentIds, showId];

    const updatedFeeds = feeds.map((f) => (f.id === feedId ? { ...f, showIds: updatedIds } : f));
    onUpdateFeeds(updatedFeeds);
    if (assigningFeed && assigningFeed.id === feedId) {
      setAssigningFeed({ ...assigningFeed, showIds: updatedIds });
    }
  };

  // =========================================================================
  // ONLY 1 BACKUP SYSTEM: Full Database Backup (100% of settings, catalog & images)
  // =========================================================================
  const handleExportFullDatabase = () => {
    const backupData = {
      exported_at: new Date().toISOString(),
      app: adminSettings.platformName || 'Dizi Urdu',
      version: '2.0',
      shows,
      feeds,
      adminSettings: {
        ...adminSettings,
        profilePictureGroups
      },
      categoriesList,
      profilePictureGroups,
      notifications
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'full_backup.json';
    link.click();
    URL.revokeObjectURL(url);
    notify('Full database backup exported (100% of titles, aspect ratios, feeds, avatars & settings)!');
  };

  const handleImportFullDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const importedShows = parsed.shows && Array.isArray(parsed.shows) ? parsed.shows : (Array.isArray(parsed) ? parsed : null);
        if (!importedShows) {
          alert('Invalid full backup JSON file: Missing "shows" list.');
          return;
        }

        onUpdateShows(importedShows);
        if (parsed.feeds && Array.isArray(parsed.feeds)) onUpdateFeeds(parsed.feeds);
        if (parsed.adminSettings) onUpdateSettings(parsed.adminSettings);
        if (parsed.categoriesList && Array.isArray(parsed.categoriesList)) {
          setCategoriesList(parsed.categoriesList);
          localStorage.setItem('cineflix_custom_categories', JSON.stringify(parsed.categoriesList));
        }
        if (parsed.profilePictureGroups && Array.isArray(parsed.profilePictureGroups)) {
          setProfilePictureGroups(parsed.profilePictureGroups);
          localStorage.setItem('cineflix_profile_picture_groups', JSON.stringify(parsed.profilePictureGroups));
        }
        if (parsed.notifications && Array.isArray(parsed.notifications) && onUpdateNotifications) {
          onUpdateNotifications(parsed.notifications);
        }

        await saveToDiskDirectly({
          shows: importedShows,
          feeds: parsed.feeds || feeds,
          adminSettings: parsed.adminSettings || adminSettings,
          categoriesList: parsed.categoriesList || categoriesList,
          profilePictureGroups: parsed.profilePictureGroups || profilePictureGroups,
          notifications: parsed.notifications || notifications
        });

        notify(`Full database restored! Loaded ${importedShows.length} titles, custom feeds, avatars and all platform settings.`);
      } catch (err: any) {
        alert(`Error parsing backup JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCatalogOnly = () => handleExportFullDatabase();
  const handleExportJSON = () => handleExportFullDatabase();
  const handleImportCatalogOnly = (e: React.ChangeEvent<HTMLInputElement>) => handleImportFullDatabase(e);
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => handleImportFullDatabase(e);

  // Gather all stored images for Health Check
  interface StoredImageRef {
    key: string;
    showId: string;
    showTitle: string;
    label: string;
    url: string;
    fieldPath: string; // e.g. "posterLandscapeUrl"
  }

  const allStoredImages: StoredImageRef[] = [];
  shows.forEach((s) => {
    if (s.posterLandscapeUrl) {
      allStoredImages.push({
        key: `${s.id}-posterLandscape`,
        showId: s.id,
        showTitle: s.title,
        label: '16:9 Landscape Poster',
        url: imageQuickEdits[`${s.id}-posterLandscape`] ?? s.posterLandscapeUrl,
        fieldPath: 'posterLandscapeUrl'
      });
    }
    if (s.backdropUrl) {
      allStoredImages.push({
        key: `${s.id}-backdrop`,
        showId: s.id,
        showTitle: s.title,
        label: '16:9 Desktop Backdrop',
        url: imageQuickEdits[`${s.id}-backdrop`] ?? s.backdropUrl,
        fieldPath: 'backdropUrl'
      });
    }
    if (s.titleLogoUrl) {
      allStoredImages.push({
        key: `${s.id}-titleLogo`,
        showId: s.id,
        showTitle: s.title,
        label: 'Title PNG Logo',
        url: imageQuickEdits[`${s.id}-titleLogo`] ?? s.titleLogoUrl,
        fieldPath: 'titleLogoUrl'
      });
    }
    if (s.posterVerticalUrl) {
      allStoredImages.push({
        key: `${s.id}-posterVertical`,
        showId: s.id,
        showTitle: s.title,
        label: '2:3 Vertical Poster',
        url: imageQuickEdits[`${s.id}-posterVertical`] ?? s.posterVerticalUrl,
        fieldPath: 'posterVerticalUrl'
      });
    }
    (s.seasons || []).forEach((season) => {
      season.episodes.forEach((ep) => {
        if (ep.thumbnailUrl) {
          allStoredImages.push({
            key: `${s.id}-ep-${ep.id}-thumb`,
            showId: s.id,
            showTitle: `${s.title} (S${season.seasonNumber}E${ep.episodeNumber})`,
            label: `Episode Thumbnail`,
            url: imageQuickEdits[`${s.id}-ep-${ep.id}-thumb`] ?? ep.thumbnailUrl,
            fieldPath: `season-${season.seasonNumber}-ep-${ep.id}`
          });
        }
      });
    });
  });

  // Also include category card pictures in Image Health check
  categoriesList.forEach((cat) => {
    if (cat.imageUrl) {
      allStoredImages.push({
        key: `cat-${cat.id}-card`,
        showId: cat.id,
        showTitle: `Category: ${cat.name}`,
        label: 'Category Card Picture',
        url: imageQuickEdits[`cat-${cat.id}-card`] ?? cat.imageUrl,
        fieldPath: `category-${cat.id}`
      });
    }
  });

  // Handle quick edit save in Image Health tab
  const handleSaveQuickImage = (imgRef: StoredImageRef, newUrl: string) => {
    if (!newUrl.trim()) return;

    if (imgRef.fieldPath.startsWith('category-')) {
      const catId = imgRef.fieldPath.replace('category-', '');
      setCategoriesList((prev) =>
        prev.map((c) => (c.id === catId ? { ...c, imageUrl: newUrl } : c))
      );
      setImageQuickEdits((prev) => ({ ...prev, [imgRef.key]: newUrl }));
      setBrokenImages((prev) => {
        const next = new Set(prev);
        next.delete(imgRef.key);
        return next;
      });
      notify(`Saved updated category image URL for "${imgRef.showTitle}".`);
      return;
    }

    const updatedShows = shows.map((s) => {
      if (s.id !== imgRef.showId) return s;
      const clone = { ...s };
      if (imgRef.fieldPath === 'posterLandscapeUrl') clone.posterLandscapeUrl = newUrl;
      else if (imgRef.fieldPath === 'backdropUrl') clone.backdropUrl = newUrl;
      else if (imgRef.fieldPath === 'titleLogoUrl') clone.titleLogoUrl = newUrl;
      else if (imgRef.fieldPath === 'posterVerticalUrl') clone.posterVerticalUrl = newUrl;
      else if (imgRef.fieldPath.startsWith('season-')) {
        // Episode thumbnail
        const parts = imgRef.fieldPath.split('-');
        const sNum = parseInt(parts[1]);
        const epId = parts.slice(3).join('-');
        if (clone.seasons) {
          clone.seasons = clone.seasons.map((se) =>
            se.seasonNumber === sNum
              ? {
                  ...se,
                  episodes: se.episodes.map((ep) => (ep.id === epId ? { ...ep, thumbnailUrl: newUrl } : ep))
                }
              : se
          );
        }
      }
      return clone;
    });

    onUpdateShows(updatedShows);
    setImageQuickEdits((prev) => ({ ...prev, [imgRef.key]: newUrl }));
    setBrokenImages((prev) => {
      const next = new Set(prev);
      next.delete(imgRef.key);
      return next;
    });
    notify(`Saved updated image URL for "${imgRef.showTitle}".`);
  };

  // Video Health Check Data Collection
  interface StoredVideoRef {
    key: string;
    showId: string;
    showTitle: string;
    label: string;
    url: string;
    fieldPath: string;
    category: 'trailer' | 'hover' | 'movie' | 'episode' | 'clip';
  }

  const allStoredVideos: StoredVideoRef[] = [];
  shows.forEach((s) => {
    if (s.trailerUrl) {
      allStoredVideos.push({
        key: `${s.id}-trailer`,
        showId: s.id,
        showTitle: s.title,
        label: 'Official Trailer & Hero Preview',
        url: videoQuickEdits[`${s.id}-trailer`] ?? s.trailerUrl,
        fieldPath: 'trailerUrl',
        category: 'trailer'
      });
    }
    if (s.hoverPreviewUrl) {
      allStoredVideos.push({
        key: `${s.id}-hoverPreview`,
        showId: s.id,
        showTitle: s.title,
        label: 'Card Hover Popout Clip',
        url: videoQuickEdits[`${s.id}-hoverPreview`] ?? s.hoverPreviewUrl,
        fieldPath: 'hoverPreviewUrl',
        category: 'hover'
      });
    }
    if (s.movieStreamUrl || (s.type === 'movie' && s.movieStreamEnabled)) {
      allStoredVideos.push({
        key: `${s.id}-movieStream`,
        showId: s.id,
        showTitle: s.title,
        label: 'Full Movie Stream (Master)',
        url: videoQuickEdits[`${s.id}-movieStream`] ?? (s.movieStreamUrl || s.trailerUrl),
        fieldPath: 'movieStreamUrl',
        category: 'movie'
      });
    }
    (s.trailersAndMore || []).forEach((tr, trIdx) => {
      if (tr.videoUrl) {
        allStoredVideos.push({
          key: `${s.id}-extra-trailer-${tr.id || trIdx}`,
          showId: s.id,
          showTitle: s.title,
          label: tr.title || `Bonus Trailer Clip ${trIdx + 1}`,
          url: videoQuickEdits[`${s.id}-extra-trailer-${tr.id || trIdx}`] ?? tr.videoUrl,
          fieldPath: `trailersAndMore-${tr.id || trIdx}`,
          category: 'clip'
        });
      }
    });
    (s.seasons || []).forEach((season) => {
      season.episodes.forEach((ep) => {
        if (ep.videoUrl) {
          allStoredVideos.push({
            key: `${s.id}-s${season.seasonNumber}-ep${ep.episodeNumber}`,
            showId: s.id,
            showTitle: `${s.title} (S${season.seasonNumber}:E${ep.episodeNumber} "${ep.title}")`,
            label: `Episode Video Stream`,
            url: videoQuickEdits[`${s.id}-s${season.seasonNumber}-ep${ep.episodeNumber}`] ?? ep.videoUrl,
            fieldPath: `season-${season.seasonNumber}-ep-${ep.id}`,
            category: 'episode'
          });
        }
      });
    });
  });

  // Handle saving updated video stream URL
  const handleSaveQuickVideo = (vRef: StoredVideoRef, newUrl: string) => {
    if (!newUrl.trim()) return;
    const updatedShows = shows.map((s) => {
      if (s.id !== vRef.showId) return s;
      const clone = { ...s };
      if (vRef.fieldPath === 'trailerUrl') clone.trailerUrl = newUrl;
      else if (vRef.fieldPath === 'hoverPreviewUrl') clone.hoverPreviewUrl = newUrl;
      else if (vRef.fieldPath === 'movieStreamUrl') {
        clone.movieStreamUrl = newUrl;
        clone.movieStreamEnabled = true;
      } else if (vRef.fieldPath.startsWith('trailersAndMore-')) {
        const trIdOrIdx = vRef.fieldPath.replace('trailersAndMore-', '');
        if (clone.trailersAndMore) {
          clone.trailersAndMore = clone.trailersAndMore.map((tr, idx) =>
            tr.id === trIdOrIdx || String(idx) === trIdOrIdx ? { ...tr, videoUrl: newUrl } : tr
          );
        }
      } else if (vRef.fieldPath.startsWith('season-')) {
        const parts = vRef.fieldPath.split('-');
        const sNum = parseInt(parts[1]);
        const epId = parts.slice(3).join('-');
        if (clone.seasons) {
          clone.seasons = clone.seasons.map((se) =>
            se.seasonNumber === sNum
              ? {
                  ...se,
                  episodes: se.episodes.map((ep) => (ep.id === epId ? { ...ep, videoUrl: newUrl } : ep))
                }
              : se
          );
        }
      }
      return clone;
    });

    onUpdateShows(updatedShows);
    setVideoQuickEdits((prev) => ({ ...prev, [vRef.key]: newUrl }));
    setBrokenVideos((prev) => {
      const next = new Set(prev);
      next.delete(vRef.key);
      return next;
    });
    setHealthyVideos((prev) => new Set([...prev, vRef.key]));
    notify(`Saved updated video stream URL for "${vRef.showTitle}".`);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0f0f0f] text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Top Admin Header Bar - YouTube Studio Theme */}
      <header className="h-14 sm:h-16 shrink-0 bg-[#0f0f0f] border-b border-[#282828] px-4 sm:px-6 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <DiziLogo variant="red" size="sm" />
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-red-600/10 border border-red-600/30 text-red-500 text-xs font-bold tracking-wider">
            <span>Studio</span>
          </div>
        </div>

        {/* Global Toast Message */}
        {statusMessage && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold rounded-full animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Center Quick Search (YouTube Studio Style) */}
        <div className="hidden md:flex items-center gap-2 bg-[#1f1f1f] border border-[#333333] rounded-full px-3.5 py-1.5 w-72 lg:w-96 text-xs text-zinc-300 focus-within:border-red-600 transition-colors">
          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search catalog shows, movies, feeds..."
            value={showSearch}
            onChange={(e) => {
              setShowSearch(e.target.value);
              if (activeTab !== 'shows') setActiveTab('shows');
            }}
            className="bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Create Action */}
          <button
            onClick={() => handleOpenAddModal('show')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer shadow"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
          </button>

          {/* Full Database Backup Only */}
          <button
            onClick={handleExportFullDatabase}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b3323] hover:bg-[#23442f] border border-emerald-700/50 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Download full_backup.json (100% Full Database Backup)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Full Backup</span>
          </button>

          <button
            onClick={onExitAdmin}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272727] hover:bg-[#333333] border border-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Studio</span>
          </button>
        </div>
      </header>

      {/* Main Admin Console Layout - Fixed Viewport with Independent Scrolling */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation - YouTube Studio Aesthetic */}
        <aside className="w-60 md:w-64 bg-[#0f0f0f] border-r border-[#282828] overflow-y-auto shrink-0 flex flex-col p-3 space-y-1 min-h-0 [scrollbar-width:thin] [scrollbar-color:#333_transparent]">
          <div className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider font-mono">
            Channel & Studio
          </div>

          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'overview'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${activeTab === 'overview' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span>Dashboard & Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('shows')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'shows'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Tv className={`w-4 h-4 ${activeTab === 'shows' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Content Catalog</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
              {shows.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feeds')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'feeds'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Layers className={`w-4 h-4 ${activeTab === 'feeds' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Feeds & Rows Manager</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
              {feeds.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'categories'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <FolderPlus className={`w-4 h-4 ${activeTab === 'categories' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Categories</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
              {categoriesList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profiles')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'profiles'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className={`w-4 h-4 ${activeTab === 'profiles' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Profile Pic Feeds</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
              {profilePictureGroups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'notifications'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Notifications</span>
            </div>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('image_health')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'image_health'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon className={`w-4 h-4 ${activeTab === 'image_health' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Image Health</span>
            </div>
            {brokenImages.size > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-mono font-bold">
                {brokenImages.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('video_health')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left justify-between ${
              activeTab === 'video_health'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Video className={`w-4 h-4 ${activeTab === 'video_health' ? 'text-red-500' : 'text-zinc-400'}`} />
              <span>Video Health</span>
            </div>
            {brokenVideos.size > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-mono font-bold">
                {brokenVideos.size}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'settings'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <Sliders className={`w-4 h-4 ${activeTab === 'settings' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span>Customization</span>
          </button>

          <button
            onClick={() => setActiveTab('export_import')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
              activeTab === 'export_import'
                ? 'bg-[#272727] text-white font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            <Database className={`w-4 h-4 ${activeTab === 'export_import' ? 'text-red-500' : 'text-zinc-400'}`} />
            <span>Database Backup</span>
          </button>

          <div className="mt-auto pt-4 border-t border-[#282828] px-2 space-y-2">
            <button
              onClick={() => handleOpenAddModal('show')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Show</span>
            </button>

            <button
              onClick={() => handleOpenAddModal('movie')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#272727] hover:bg-[#333333] text-zinc-200 text-xs font-bold transition-colors cursor-pointer border border-white/5"
            >
              <Film className="w-3.5 h-3.5 text-red-400" />
              <span>Add Movie</span>
            </button>
          </div>
        </aside>

        {/* Right Main Panel Content - Single Clean Scroll Container (YouTube Studio Dark #0f0f0f) */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full overflow-y-auto bg-[#0f0f0f] space-y-6 scroll-smooth min-h-0 [scrollbar-width:thin] [scrollbar-color:#333_transparent]">
          <div className="max-w-7xl mx-auto w-full space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW & 24H TOP 10 METRICS                                      */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Overview & Scoring Analytics</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Real-time 24-hour play metrics, user favorite score weights (+100), and top 10 rankings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddModal('show')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Show</span>
                  </button>
                  <button
                    onClick={() => handleOpenAddModal('movie')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
                  >
                    <Film className="w-3.5 h-3.5 text-red-400" />
                    <span>+ Add Movie</span>
                  </button>
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900 to-[#141724] border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Tv className="w-3.5 h-3.5 text-red-400" />
                    <span>Shows & Movies</span>
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-2 font-mono flex items-baseline gap-2">
                    {shows.length}
                    <span className="text-xs text-zinc-500 font-sans font-normal">
                      ({shows.filter((s) => s.type === 'series').length} Series, {shows.filter((s) => s.type === 'movie').length} Movies)
                    </span>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900 to-[#141724] border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>24-Hour Play Clicks</span>
                  </span>
                  <div className="text-3xl font-extrabold text-amber-400 mt-2 font-mono">
                    {shows.reduce((acc, s) => acc + get24HourPlays(s), 0)}
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Calculated strictly within rolling now - 24h
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900 to-[#141724] border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>User Engagement Metric</span>
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                    {shows.reduce((acc, s) => acc + (s.all_time_score || s.points), 0).toLocaleString()}
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Like (+100 pts) · Play (+1 pt)
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-gradient-to-br from-zinc-900 to-[#141724] border border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Active Feed Strips</span>
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-2 font-mono flex items-baseline gap-2">
                    {feeds.filter((f) => f.enabled).length}
                    <span className="text-xs text-zinc-500 font-sans font-normal">
                      of {feeds.length} total
                    </span>
                  </div>
                </div>
              </div>

              {/* 24-Hour Rolling Top 10 Feed Ranking Table */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Dynamic 24-Hour Top 10 Ranking</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Determined dynamically by timestamped play clicks within the past 24 hours (<code className="font-mono text-zinc-300">now - 24h</code>).
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('shows')}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                  >
                    View Complete Catalog →
                  </button>
                </div>

                <div className="space-y-2">
                  {top10Rolling24h.map((show, idx) => {
                    const plays24h = get24HourPlays(show);
                    return (
                      <div
                        key={show.id}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/40 border border-zinc-800/80 hover:bg-zinc-800/70 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-full bg-red-950/80 text-red-400 text-xs font-black font-mono flex items-center justify-center shrink-0 border border-red-800/50">
                            #{idx + 1}
                          </span>
                          <div className="w-14 h-9 rounded-md overflow-hidden bg-black shrink-0 relative border border-white/10">
                            <img
                              src={show.posterLandscapeUrl}
                              alt={show.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 px-1 py-0.2 bg-black/80 text-[8px] font-mono text-white uppercase">
                              {show.type}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate flex items-center gap-2">
                              {show.title}
                              {show.is_recommended && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/60">
                                  Hero Eligible
                                </span>
                              )}
                              {show.isSpecialSingleFeedEligible && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                                  Special Feed
                                </span>
                              )}
                            </p>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Slug: /{show.slug || show.id} · {show.durationOrSeasons} · {show.maturityRating}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className="text-xs font-bold text-amber-400 font-mono block">
                              {plays24h} 24h plays
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {(show.all_time_score || show.points).toLocaleString()} all-time pts
                            </span>
                          </div>

                          {/* Quick +1 Play Simulator */}
                          <button
                            onClick={() => {
                              const now = Date.now();
                              const updatedShows = shows.map((s) => {
                                if (s.id !== show.id) return s;
                                return {
                                  ...s,
                                  points: s.points + 1,
                                  all_time_score: (s.all_time_score || s.points) + 1,
                                  play_events: [...(s.play_events || []), { timestamp: now }]
                                };
                              });
                              onUpdateShows(updatedShows);
                              notify(`Simulated +1 play event for "${show.title}".`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs font-semibold cursor-pointer transition-colors"
                            title="Simulate user play button click"
                          >
                            +1 Play
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SHOWS & MOVIES CATALOG                                             */}
          {/* ========================================================================= */}
          {activeTab === 'shows' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Catalog Management</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage series, movies, TMDB auto-fetching, media assets, episodes, and editorial blogs.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    onClick={() => handleOpenAddModal('show')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Show</span>
                  </button>

                  <button
                    onClick={() => handleOpenAddModal('movie')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer border border-white/10"
                  >
                    <Film className="w-4 h-4 text-red-400" />
                    <span>Add Movie</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2 bg-zinc-800/80 rounded-lg px-3 py-1.5 flex-1 w-full text-xs text-white">
                  <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by title, turkish title, slug, or genre..."
                    value={showSearch}
                    onChange={(e) => setShowSearch(e.target.value)}
                    className="bg-transparent text-white outline-none w-full placeholder-zinc-500"
                  />
                  {showSearch && (
                    <button
                      onClick={() => setShowSearch('')}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                  {(['all', 'series', 'movie'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setShowTypeFilter(type)}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                        showTypeFilter === type
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {type === 'all' ? 'All Titles' : type === 'series' ? 'Series Only' : 'Movies Only'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shows List */}
              <div className="space-y-3">
                {filteredShows.length === 0 ? (
                  <div className="p-12 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/60 text-zinc-400 text-xs">
                    No catalog items found matching your filters.
                  </div>
                ) : (
                  filteredShows.map((show) => {
                    const plays24h = get24HourPlays(show);
                    return (
                      <div
                        key={show.id}
                        className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                          {/* Poster Thumbnail */}
                          <div className="w-20 sm:w-24 h-14 rounded-lg overflow-hidden bg-black shrink-0 relative border border-white/10">
                            <img
                              src={show.posterLandscapeUrl}
                              alt={show.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-white text-[9px] font-mono font-bold uppercase">
                              {show.type}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-bold text-white tracking-tight">{show.title}</h3>
                              {show.turkishTitle && (
                                <span className="text-xs text-zinc-400 italic">
                                  ({show.turkishTitle})
                                </span>
                              )}
                              {show.is_recommended && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800/80 font-mono">
                                  Recommended Hero
                                </span>
                              )}
                              {show.isSpecialSingleFeedEligible && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800/80 font-mono">
                                  Special Single Feed
                                </span>
                              )}
                              {show.tmdbId && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/80 font-mono">
                                  TMDB #{show.tmdbId}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
                              <span className="text-amber-400 font-bold">{plays24h} plays (24h)</span>
                              <span>•</span>
                              <span>{(show.all_time_score || show.points).toLocaleString()} total score</span>
                              <span>•</span>
                              <span>{show.durationOrSeasons}</span>
                              <span>•</span>
                              <span className="text-zinc-500">/watch/{show.slug || show.id}</span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              {show.genres.slice(0, 3).map((g) => (
                                <span
                                  key={g}
                                  className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                                >
                                  {g}
                                </span>
                              ))}
                              {show.announcementPill && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950/80 text-red-300 border border-red-800/60">
                                  📣 {show.announcementPill}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(show)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Form</span>
                          </button>

                          <button
                            onClick={() => handleDeleteShow(show.id, show.title)}
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete title"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FEEDS & FEED LIST MANAGER                                          */}
          {/* ========================================================================= */}
          {activeTab === 'feeds' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Homepage Feeds & Feed Rows</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Create, rename, reorder, delete rows, or explicitly assign specific shows and movies to any strip.
                </p>
              </div>

              {/* Add Custom Feed Row Form - YouTube Studio style with 1 or 2 dropdown sources and Special Feed support */}
              <form
                id="admin-feed-form-section"
                onSubmit={handleAddFeed}
                className="p-5 sm:p-6 bg-[#181818] rounded-xl border border-[#2c2c2c] space-y-4"
              >
                {editingFeedId && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <Pencil className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Editing Feed: &quot;{newFeedTitle || 'Untitled Feed'}&quot;</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEditFeed}
                      className="px-3 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer border border-white/10"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-[#2c2c2c] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-white">
                      {editingFeedId ? 'Edit Feed Strip / Special Feed' : 'Create New Feed Strip or Special Feed'}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">1 or 2 sources with dynamic mixture</span>
                </div>

                {/* Title & Subtitle */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Feed Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Adrenaline Rush Hits or Special Showcase"
                      value={newFeedTitle}
                      onChange={(e) => setNewFeedTitle(e.target.value)}
                      required
                      className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Hand-picked explosive series & movies"
                      value={newFeedSubtitle}
                      onChange={(e) => setNewFeedSubtitle(e.target.value)}
                      className="w-full bg-[#121212] border border-[#333] rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* DROPDOWN 1: Primary Source */}
                <div className="p-4 rounded-lg bg-[#121212] border border-[#2a2a2a] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center text-[10px] font-bold">1</span>
                      <span>Content Source (Dropdown 1)</span>
                    </label>
                    <select
                      value={sourceType1}
                      onChange={(e) => setSourceType1(e.target.value as any)}
                      className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-500"
                    >
                      <option value="genre">Genre (Choose multiple genres)</option>
                      <option value="categories">Categories (Choose multiple categories)</option>
                      <option value="custom">Custom (Pick movies / series yourself)</option>
                    </select>
                  </div>

                  {/* Multi-select for Source 1 */}
                  {sourceType1 === 'genre' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-zinc-400">Select one or more genres:</div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {ALL_GENRES.map((g: string) => {
                          const active = selectedGenres1.includes(g);
                          return (
                            <button
                              key={`src1-g-${g}`}
                              type="button"
                              onClick={() => toggleGenre1(g)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                active ? 'bg-red-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                              }`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                      {selectedGenres1.length > 0 && (
                        <div className="text-[11px] text-red-400 font-mono">
                          Selected {selectedGenres1.length} genre(s): {selectedGenres1.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {sourceType1 === 'categories' && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] text-zinc-400">Select one or more categories:</div>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                        {AVAILABLE_CATEGORIES.map((cat) => {
                          const active = selectedCategories1.includes(cat);
                          return (
                            <button
                              key={`src1-c-${cat}`}
                              type="button"
                              onClick={() => toggleCategory1(cat)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                active ? 'bg-red-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                      {selectedCategories1.length > 0 && (
                        <div className="text-[11px] text-red-400 font-mono">
                          Selected {selectedCategories1.length} category(ies): {selectedCategories1.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {sourceType1 === 'custom' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search shows/movies to add..."
                        value={sourceSearchQuery1}
                        onChange={(e) => setSourceSearchQuery1(e.target.value)}
                        className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                      />
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                        {shows
                          .filter((s) => !sourceSearchQuery1 || s.title.toLowerCase().includes(sourceSearchQuery1.toLowerCase()))
                          .map((s) => {
                            const active = selectedShowIds1.includes(s.id);
                            return (
                              <button
                                key={`src1-s-${s.id}`}
                                type="button"
                                onClick={() => toggleShow1(s.id)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                                  active ? 'bg-red-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                                }`}
                              >
                                <span>{s.title}</span>
                                <span className="text-[10px] opacity-70">({s.type})</span>
                              </button>
                            );
                          })}
                      </div>
                      {selectedShowIds1.length > 0 && (
                        <div className="text-[11px] text-red-400 font-mono">
                          Selected {selectedShowIds1.length} title(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DROPDOWN 2: Optional Second Source for Mixture */}
                <div className="p-4 rounded-lg bg-[#121212] border border-[#2a2a2a] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">2</span>
                      <span>Secondary Content Source (Dropdown 2)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setHasSecondSource(!hasSecondSource)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                        hasSecondSource
                          ? 'bg-red-950/80 text-red-300 border border-red-800'
                          : 'bg-[#252525] hover:bg-[#333] text-zinc-300 border border-white/10'
                      }`}
                    >
                      {hasSecondSource ? '− Remove 2nd Source' : '+ Add 2nd Dropdown for 1 Row'}
                    </button>
                  </div>

                  {hasSecondSource && (
                    <div className="space-y-3 pt-2 border-t border-[#222]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-zinc-400">Select source type:</span>
                        <select
                          value={sourceType2}
                          onChange={(e) => setSourceType2(e.target.value as any)}
                          className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-red-500"
                        >
                          <option value="genre">Genre</option>
                          <option value="categories">Categories</option>
                          <option value="custom">Custom (Pick movies / series)</option>
                        </select>
                      </div>

                      {sourceType2 === 'genre' && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                            {ALL_GENRES.map((g: string) => {
                              const active = selectedGenres2.includes(g);
                              return (
                                <button
                                  key={`src2-g-${g}`}
                                  type="button"
                                  onClick={() => toggleGenre2(g)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                    active ? 'bg-blue-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                                  }`}
                                >
                                  {g}
                                </button>
                              );
                            })}
                          </div>
                          {selectedGenres2.length > 0 && (
                            <div className="text-[11px] text-blue-400 font-mono">
                              Selected {selectedGenres2.length} genre(s): {selectedGenres2.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {sourceType2 === 'categories' && (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
                            {AVAILABLE_CATEGORIES.map((cat) => {
                              const active = selectedCategories2.includes(cat);
                              return (
                                <button
                                  key={`src2-c-${cat}`}
                                  type="button"
                                  onClick={() => toggleCategory2(cat)}
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                    active ? 'bg-blue-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                                  }`}
                                >
                                  {cat}
                                </button>
                              );
                            })}
                          </div>
                          {selectedCategories2.length > 0 && (
                            <div className="text-[11px] text-blue-400 font-mono">
                              Selected {selectedCategories2.length} category(ies): {selectedCategories2.join(', ')}
                            </div>
                          )}
                        </div>
                      )}

                      {sourceType2 === 'custom' && (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Search shows/movies for source 2..."
                            value={sourceSearchQuery2}
                            onChange={(e) => setSourceSearchQuery2(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                          />
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                            {shows
                              .filter((s) => !sourceSearchQuery2 || s.title.toLowerCase().includes(sourceSearchQuery2.toLowerCase()))
                              .map((s) => {
                                const active = selectedShowIds2.includes(s.id);
                                return (
                                  <button
                                    key={`src2-s-${s.id}`}
                                    type="button"
                                    onClick={() => toggleShow2(s.id)}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                                      active ? 'bg-blue-600 text-white font-semibold' : 'bg-[#222] hover:bg-[#2e2e2e] text-zinc-300 border border-white/5'
                                    }`}
                                  >
                                    <span>{s.title}</span>
                                    <span className="text-[10px] opacity-70">({s.type})</span>
                                  </button>
                                );
                              })}
                          </div>
                          {selectedShowIds2.length > 0 && (
                            <div className="text-[11px] text-blue-400 font-mono">
                              Selected {selectedShowIds2.length} title(s)
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-2.5 rounded bg-blue-950/40 border border-blue-900/60 text-[11px] text-blue-300 leading-relaxed">
                        ✨ <strong>Dynamic Mixture Active:</strong> The feed row will intelligently combine content from both sources (e.g. Genre + Categories) without duplicate replication.
                      </div>
                    </div>
                  )}
                </div>

                {/* SPECIAL FEED OPTION */}
                <div className="p-4 rounded-lg bg-[#121212] border border-[#2a2a2a] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSpecialFeed}
                      onChange={(e) => setIsSpecialFeed(e.target.checked)}
                      className="w-4 h-4 rounded accent-red-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Configure as Special Feed (Pinned Left Block & Seamless Background)</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Displays logo, subtitle, and &quot;Explore All&quot; button pinned on the left side with smooth gradient merging into the base page color.
                      </div>
                    </div>
                  </label>

                  {isSpecialFeed && (
                    <div className="pt-3 border-t border-[#222] space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Special Logo URL (leave empty for text title)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. /dizi-logo-red.png or https://..."
                            value={specialLogoUrl}
                            onChange={(e) => setSpecialLogoUrl(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Explore All Button Label
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Explore All"
                            value={specialExploreText}
                            onChange={(e) => setSpecialExploreText(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* Special Subtitle / Tagline */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 mb-1">
                          Special Subtitle / Tagline
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. The greatest sultans, conquest commanders & legends"
                          value={specialTagline}
                          onChange={(e) => setSpecialTagline(e.target.value)}
                          className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                        />
                      </div>

                      {/* Explore All Click Destination Setting */}
                      <div className="p-3 bg-[#191919] rounded-lg border border-[#2a2a2a] space-y-2">
                        <label className="block text-[11px] font-semibold text-zinc-300">
                          When user clicks &quot;Explore All&quot;, lead to:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                            specialExploreAction === 'showcase'
                              ? 'bg-red-950/40 border-red-600 text-white'
                              : 'bg-[#1e1e1e] border-[#333] text-zinc-300 hover:border-zinc-500'
                          }`}>
                            <input
                              type="radio"
                              name="specialExploreAction"
                              checked={specialExploreAction === 'showcase'}
                              onChange={() => setSpecialExploreAction('showcase')}
                              className="accent-red-600"
                            />
                            <div>
                              <div className="font-semibold">Special Feed Showcase Page</div>
                              <div className="text-[10px] text-zinc-400">Same background picture, logo & all assigned titles in a clean grid without feed rows</div>
                            </div>
                          </label>

                          <label className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                            specialExploreAction === 'category'
                              ? 'bg-red-950/40 border-red-600 text-white'
                              : 'bg-[#1e1e1e] border-[#333] text-zinc-300 hover:border-zinc-500'
                          }`}>
                            <input
                              type="radio"
                              name="specialExploreAction"
                              checked={specialExploreAction === 'category'}
                              onChange={() => setSpecialExploreAction('category')}
                              className="accent-red-600"
                            />
                            <div>
                              <div className="font-semibold">Category Page directly</div>
                              <div className="text-[10px] text-zinc-400">Navigate directly to a category page</div>
                            </div>
                          </label>
                        </div>

                        {specialExploreAction === 'category' && (
                          <div className="pt-2">
                            <label className="block text-[11px] text-zinc-400 mb-1">
                              Target Category
                            </label>
                            <select
                              value={specialExploreCategory}
                              onChange={(e) => setSpecialExploreCategory(e.target.value)}
                              className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="historical-ottoman">Historical & Ottoman</option>
                              <option value="action-thrills">Action & Thrills</option>
                              <option value="drama">Drama</option>
                              <option value="romance">Romance</option>
                              <option value="crime">Crime</option>
                              <option value="comedy">Comedy</option>
                              <option value="kids-family">Kids & Family</option>
                              <option value="sci-fi">Sci-Fi</option>
                              <option value="horror">Horror</option>
                              <option value="reality-documentary">Reality & Documentary</option>
                              <option value="westerns-classics">Westerns & Classics</option>
                              <option value="movies">Movies</option>
                              <option value="series">TV Series</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Background Picture URL & Backdrop Darkness Slider */}
                      <div className="space-y-3 pt-1">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-semibold text-zinc-300">
                              Special Background Picture URL (Cinematic image backdrop)
                            </label>
                            <span className="text-[10px] text-zinc-500">
                              (Defaults to 1st show&apos;s backdrop if empty)
                            </span>
                          </div>
                          <input
                            type="text"
                            placeholder="e.g. https://images.unsplash.com/... or leave empty to auto-use first show backdrop"
                            value={specialBgImageUrl}
                            onChange={(e) => setSpecialBgImageUrl(e.target.value)}
                            className="w-full bg-[#1e1e1e] border border-[#333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 font-mono"
                          />
                        </div>

                        {/* Backdrop Darkness Slider (0% - 100%) - same as backdrop darkness in video player page */}
                        <div className="p-3 bg-[#191919] rounded-lg border border-[#2a2a2a] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Backdrop Image Darkness</span>
                            </label>
                            <span className="px-2 py-0.5 rounded bg-black/60 text-white font-mono text-xs font-bold border border-white/10">
                              {specialBgDarkness}%
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-zinc-500 font-mono">0% (Bright)</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={specialBgDarkness}
                              onChange={(e) => setSpecialBgDarkness(parseInt(e.target.value, 10))}
                              className="flex-1 accent-red-600 cursor-pointer h-1.5 bg-[#2c2c2c] rounded-lg"
                            />
                            <span className="text-[10px] text-zinc-500 font-mono">100% (Dark)</span>
                          </div>
                          <p className="text-[10px] text-zinc-400">
                            Same as backdrop darkness in video player page. Adjusts image darkness for optimal readability while seamlessly fading into the page&apos;s base color (#141414).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* STRETCHABLE FEED OPTION */}
                <div className="p-4 rounded-lg bg-[#121212] border border-[#2a2a2a] space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isStretchableFeed}
                      onChange={(e) => setIsStretchableFeed(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-600"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>Configure as Stretchable Feed (2:3 tall poster expanding to 16:9 preview on desktop hover)</span>
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Default feeds remain standard 16:9 landscape cards. Enabling this row makes it stretchable like Amazon Prime Video: cards stay at a constant row height, expanding to 16:9 aspect ratio on hover with title logo and preview controls.
                      </div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFeedShowRank}
                      onChange={(e) => setNewFeedShowRank(e.target.checked)}
                      className="rounded accent-red-600"
                    />
                    <span>Render Big #1-10 Rank Numbers over posters</span>
                  </label>

                  <div className="flex items-center gap-2">
                    {editingFeedId && (
                      <button
                        type="button"
                        onClick={handleCancelEditFeed}
                        className="px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md ${
                        editingFeedId
                          ? 'bg-amber-500 hover:bg-amber-400 text-black'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {editingFeedId ? (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>Save Changes</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>{isSpecialFeed ? 'Create Special Feed' : isStretchableFeed ? 'Create Stretchable Feed' : 'Create Feed Strip'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Feed Strips List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                  Configured Homepage Strips ({feeds.length})
                </p>

                {feeds.map((feed, index) => {
                  const assignedCount = feed.showIds?.length || 0;
                  return (
                    <div
                      key={feed.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                        feed.enabled
                          ? 'bg-[#181818] border-[#2c2c2c]'
                          : 'bg-[#121212] border-[#202020] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-[#272727] text-zinc-300 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                            <span>{feed.title}</span>
                            {feed.isSpecialFeed && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/60 text-amber-300 font-mono font-bold flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Special Feed</span>
                              </span>
                            )}
                            {feed.isStretchableFeed && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 font-mono font-bold flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                <span>Stretchable Feed</span>
                              </span>
                            )}
                            {feed.showRankNumbers && (
                              <span className="text-[10px] px-2 py-0.5 bg-red-950 text-red-400 rounded-full border border-red-800/80 font-mono">
                                #1-10 Rank Numbers
                              </span>
                            )}
                            {feed.sourceType1 && (
                              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full border border-white/10 font-mono">
                                Source: {feed.sourceType1}
                                {feed.hasSecondSource && ` + ${feed.sourceType2} (Mix)`}
                              </span>
                            )}
                            {assignedCount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-950 text-blue-300 rounded-full border border-blue-800/80 font-mono">
                                {assignedCount} Selected Titles
                              </span>
                            )}
                          </h4>
                          {feed.subtitle && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">{feed.subtitle}</p>
                          )}
                          <span className="text-[10px] text-zinc-500 font-mono">
                            key: {feed.categoryKey}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Edit feed button */}
                        <button
                          onClick={() => handleStartEditFeed(feed)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 hover:text-amber-200 text-xs font-semibold cursor-pointer border border-amber-500/20 active:scale-95"
                          title="Edit this feed row"
                        >
                          <Pencil className="w-3.5 h-3.5 text-amber-400" />
                          <span>Edit</span>
                        </button>

                        {/* Assign shows button */}
                        <button
                          onClick={() => {
                            setAssigningFeed(feed);
                            setFeedSearchTerm('');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Assign Titles</span>
                        </button>

                        {/* Move Up */}
                        <button
                          onClick={() => moveFeed(index, 'up')}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          onClick={() => moveFeed(index, 'down')}
                          disabled={index === feeds.length - 1}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* Toggle Visibility */}
                        <button
                          onClick={() => toggleFeedEnabled(feed.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            feed.enabled
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}
                          title={feed.enabled ? 'Hide Feed' : 'Show Feed'}
                        >
                          {feed.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Delete Feed */}
                        <button
                          onClick={() => handleDeleteFeed(feed.id)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Feed"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: CATEGORIES & CARD PICTURES                                           */}
          {/* ========================================================================= */}
          {activeTab === 'categories' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Categories & Card Pictures</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage all categories and their card pictures. Categories configured here are dynamically available as checkboxes when creating or editing series and movies.
                  </p>
                </div>
              </div>

              {/* Add New Category Box */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-500" />
                  <span>Create New Category</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Anatolian Epics"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                      Card Picture URL *
                    </label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={newCatImage}
                      onChange={(e) => setNewCatImage(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                      Category Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sagas set in the heart of Anatolia"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {newCatImage ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-400">Card Preview:</span>
                      <img
                        src={newCatImage}
                        alt=""
                        className="h-10 w-16 object-cover rounded border border-zinc-700"
                      />
                    </div>
                  ) : <div />}

                  <button
                    type="button"
                    onClick={() => {
                      if (!newCatName.trim()) {
                        notify('Category name is required');
                        return;
                      }
                      const fallbackImg = newCatImage.trim() || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80';
                      const newCategory: CategoryItem = {
                        id: `cat-${Date.now()}`,
                        name: newCatName.trim(),
                        imageUrl: fallbackImg,
                        description: newCatDesc.trim()
                      };
                      setCategoriesList([...categoriesList, newCategory]);
                      setNewCatName('');
                      setNewCatImage('');
                      setNewCatDesc('');
                      notify(`Created category "${newCategory.name}"!`);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Category</span>
                  </button>
                </div>
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoriesList.map((cat, idx) => (
                  <div
                    key={cat.id || idx}
                    className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col justify-between gap-3 overflow-hidden group hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10">
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow">
                          {cat.name}
                        </span>

                        {/* Quick Edit Image Button Overlay on Hover */}
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 hover:bg-red-600 text-white text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 backdrop-blur-sm cursor-pointer shadow-md"
                          title="Edit category image"
                        >
                          <Pencil className="w-3 h-3 text-amber-300" />
                          <span>Edit Image</span>
                        </button>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-zinc-400 line-clamp-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[11px] text-zinc-500">
                      <span>{shows.filter((s) => (s.categories || []).includes(cat.name)).length} Shows/Movies</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartEditCategory(cat)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer border border-zinc-700"
                          title="Edit category image and details"
                        >
                          <Pencil className="w-3 h-3 text-amber-400" />
                          <span>Edit Image</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoriesList(categoriesList.filter((c) => c.id !== cat.id));
                            notify(`Deleted category "${cat.name}"`);
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit Category Image & Details Modal */}
              {editingCategory && (
                <div
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                  onClick={() => setEditingCategory(null)}
                >
                  <div
                    className="bg-[#181818] border border-zinc-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Pencil className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white tracking-tight">
                            Edit Category Card Picture
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Updating picture and details for &quot;{editingCategory.name}&quot;
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                      {/* Live 16:9 Card Picture Preview */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1.5 font-mono">
                          Live Card Picture Preview (16:9 Landscape)
                        </label>
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-lg group">
                          <img
                            src={editCatImage || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80'}
                            alt={editCatName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                            <span className="text-sm sm:text-base font-extrabold text-white drop-shadow-md block">
                              {editCatName || 'Category Name'}
                            </span>
                            {editCatDesc && (
                              <span className="text-[11px] text-zinc-300 line-clamp-1 drop-shadow mt-0.5 block">
                                {editCatDesc}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Picture URL Input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider font-mono">
                            Category Image URL *
                          </label>
                          <span className="text-[11px] text-zinc-500 font-mono">16:9 Landscape ratio</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={editCatImage}
                          onChange={(e) => setEditCatImage(e.target.value)}
                          placeholder="https://images.unsplash.com/... or paste direct image link"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white font-mono placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                        />
                      </div>

                      {/* Quick Pick Sample Show Backdrops */}
                      <div>
                        <span className="block text-[11px] text-zinc-400 font-semibold mb-1.5 font-mono">
                          Quick Pick Backdrop from Catalog:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {shows.slice(0, 6).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setEditCatImage(s.posterLandscapeUrl || s.backdropUrl)}
                              className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700"
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Category Name */}
                      <div>
                        <label className="block text-[11px] text-zinc-300 font-bold uppercase tracking-wider mb-1.5 font-mono">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          placeholder="e.g. Ottoman & Historical Sagas"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors"
                        />
                      </div>

                      {/* Category Description */}
                      <div>
                        <label className="block text-[11px] text-zinc-300 font-bold uppercase tracking-wider mb-1.5 font-mono">
                          Category Description
                        </label>
                        <textarea
                          rows={2}
                          value={editCatDesc}
                          onChange={(e) => setEditCatDesc(e.target.value)}
                          placeholder="Brief description displayed on category page..."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition-colors resize-none"
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveCategoryEdit}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Image & Category</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PROFILES & MOVIE/SERIES ASSIGNMENT                                   */}
          {/* ========================================================================= */}
          {activeTab === 'profiles' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Profiles & Shows Manager</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Manage viewing profiles, set avatar pictures, and assign movies/series to specific profile lists.
                  </p>
                </div>
              </div>

              {/* Add New Profile Form */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" />
                  <span>Create New Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                      Profile Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. VIP Member, Historical Cinema"
                      value={newProfName}
                      onChange={(e) => setNewProfName(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                      Profile Picture / Avatar URL *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={newProfAvatar}
                        onChange={(e) => setNewProfAvatar(e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                      />
                      {newProfAvatar && (
                        <img
                          src={newProfAvatar}
                          alt=""
                          className="w-8 h-8 rounded-[4px] object-cover ring-1 ring-white/20 shrink-0"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Assign Shows / Movies to this profile */}
                <div>
                  <label className="block text-[11px] text-zinc-400 font-semibold mb-1.5">
                    Assign Movies & Series to this Profile
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg bg-zinc-850 border border-zinc-800 custom-scrollbar">
                    {shows.map((s) => {
                      const isAssigned = newProfAssignedShows.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-2 rounded border transition-colors cursor-pointer text-xs ${
                            isAssigned
                              ? 'bg-red-950/60 border-red-700 text-white font-semibold'
                              : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewProfAssignedShows([...newProfAssignedShows, s.id]);
                              } else {
                                setNewProfAssignedShows(newProfAssignedShows.filter((id) => id !== s.id));
                              }
                            }}
                            className="rounded accent-red-600"
                          />
                          <span className="truncate">{s.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProfName.trim()) {
                        notify('Profile name is required');
                        return;
                      }
                      const fallbackAvatar = newProfAvatar.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                      const newProfile: UserProfile = {
                        id: `prof-${Date.now()}`,
                        name: newProfName.trim(),
                        avatarUrl: fallbackAvatar,
                        assignedShowIds: newProfAssignedShows
                      };
                      setUserProfiles([...userProfiles, newProfile]);
                      setNewProfName('');
                      setNewProfAvatar('');
                      setNewProfAssignedShows([]);
                      notify(`Created profile "${newProfile.name}"!`);
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Profile</span>
                  </button>
                </div>
              </div>

              {/* Profiles List Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProfiles.map((prof) => (
                  <div
                    key={prof.id}
                    className="p-5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prof.avatarUrl}
                          alt={prof.name}
                          className="w-12 h-12 rounded-[4px] object-cover ring-1 ring-white/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white truncate">{prof.name}</h4>
                          <span className="text-[11px] text-zinc-400">
                            {(prof.assignedShowIds || []).length} Assigned Titles
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUserProfiles(userProfiles.filter((p) => p.id !== prof.id));
                            notify(`Deleted profile "${prof.name}"`);
                          }}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          title="Delete Profile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Assigned Shows List */}
                      <div>
                        <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                          Assigned Movies & Series:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(prof.assignedShowIds || []).length > 0 ? (
                            prof.assignedShowIds!.map((showId) => {
                              const s = shows.find((sh) => sh.id === showId);
                              return (
                                <span
                                  key={showId}
                                  className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                                >
                                  {s ? s.title : showId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">No titles assigned yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ========================================================================= */}
              {/* ========================================================================= */}
              {/* PROFILE PICTURE FEEDS MANAGER (MOVIES, SERIES & CUSTOM WITH ORDER & HIDE) */}
              {/* ========================================================================= */}
              <div className="pt-8 border-t border-zinc-800 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-red-500" />
                      <span>Profile Picture Feeds (Avatar Collections)</span>
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Create feeds of profile pictures from Movies, Series, or Custom Collections. Add images, edit titles, hide/unhide feeds, and reorder arrangement for end users.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingGroup(!isAddingGroup);
                      setGroupImageLinks(['']);
                      setGroupShowId('');
                      setGroupCustomName('');
                    }}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingGroup ? 'Close Form' : 'Create Avatar Feed'}</span>
                  </button>
                </div>

                {/* Create New Profile Picture Feed Form */}
                {isAddingGroup && (
                  <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5 animate-in fade-in duration-150">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-red-500" />
                      <span>Create New Avatar Feed</span>
                    </h3>

                    {/* Step 1: Select Source Type */}
                    <div className="space-y-2">
                      <label className="block text-[11px] text-zinc-400 font-semibold">
                        1. Feed Source Type *
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'series' as const, label: 'From Series' },
                          { id: 'movie' as const, label: 'From Movie' },
                          { id: 'custom' as const, label: 'Custom Name' }
                        ].map((source) => (
                          <button
                            key={source.id}
                            type="button"
                            onClick={() => {
                              setGroupSourceType(source.id);
                              setGroupShowId('');
                              if (source.id !== 'custom') {
                                setGroupCustomName('');
                              }
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              groupSourceType === source.id
                                ? 'bg-red-600 text-white shadow'
                                : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                            }`}
                          >
                            {source.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Source Details */}
                    {groupSourceType !== 'custom' ? (
                      <div className="space-y-3">
                        <label className="block text-[11px] text-zinc-400 font-semibold">
                          2. Select Available {groupSourceType === 'series' ? 'Series' : 'Movie'} *
                        </label>
                        <select
                          value={groupShowId}
                          onChange={(e) => {
                            const showId = e.target.value;
                            setGroupShowId(showId);
                            const sel = shows.find((s) => s.id === showId);
                            if (sel) {
                              setGroupCustomName(sel.title);
                            }
                          }}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500 cursor-pointer"
                        >
                          <option value="">-- Choose a {groupSourceType === 'series' ? 'Series' : 'Movie'} --</option>
                          {shows
                            .filter((s) => s.type === groupSourceType)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title}
                              </option>
                            ))}
                        </select>

                        {/* Quick Auto-Populate from Show */}
                        {groupShowId && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-850 border border-zinc-800">
                            {(() => {
                              const sel = shows.find((s) => s.id === groupShowId);
                              if (!sel) return null;
                              return (
                                <>
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={sel.posterLandscapeUrl || sel.backdropUrl}
                                      alt={sel.title}
                                      className="w-14 h-9 rounded object-cover border border-white/10"
                                    />
                                    <div>
                                      <h4 className="text-xs font-bold text-white">{sel.title}</h4>
                                      <p className="text-[10px] text-zinc-400">
                                        {(sel.cast || []).length} cast members available
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const castUrls = (sel.cast || []).map((c) => c.profileUrl).filter(Boolean);
                                      const starting = [
                                        sel.posterVerticalUrl || sel.posterLandscapeUrl,
                                        ...castUrls
                                      ].filter(Boolean);
                                      setGroupImageLinks(starting.length > 0 ? starting : ['']);
                                      notify(`Imported ${starting.length} images from "${sel.title}"!`);
                                    }}
                                    className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-200 font-semibold transition-colors cursor-pointer"
                                  >
                                    Auto-Import Cast & Poster Images
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] text-zinc-400 font-semibold">
                          2. Custom Feed Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ottoman Warriors, Modern Romance, Villains & Antiheroes..."
                          value={groupCustomName}
                          onChange={(e) => setGroupCustomName(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                        />
                      </div>
                    )}

                    {/* Step 3: Add Multiple Images */}
                    <div className="space-y-3 pt-2 border-t border-zinc-800">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] text-zinc-400 font-semibold">
                          3. Add Profile Images (Image URLs)
                        </label>
                        <button
                          type="button"
                          onClick={() => setGroupImageLinks([...groupImageLinks, ''])}
                          className="text-[11px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Another Image Link</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {groupImageLinks.map((link, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 font-mono w-5">#{idx + 1}</span>
                            <input
                              type="text"
                              placeholder="https://images.unsplash.com/photo-..."
                              value={link}
                              onChange={(e) => {
                                const updated = [...groupImageLinks];
                                updated[idx] = e.target.value;
                                setGroupImageLinks(updated);
                              }}
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                            />
                            {link ? (
                              <img
                                src={link}
                                alt="Preview"
                                className="w-8 h-8 rounded-[4px] object-cover border border-zinc-700 shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-[4px] bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-[10px] shrink-0">
                                ?
                              </div>
                            )}
                            {groupImageLinks.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupImageLinks(groupImageLinks.filter((_, i) => i !== idx));
                                }}
                                className="text-zinc-500 hover:text-red-400 p-1"
                                title="Remove this link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingGroup(false);
                          setGroupShowId('');
                          setGroupCustomName('');
                          setGroupImageLinks(['']);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          let title = groupCustomName.trim();
                          let selectedShow: Show | undefined;
                          if (groupSourceType !== 'custom') {
                            if (!groupShowId) {
                              notify('Please select a show or movie');
                              return;
                            }
                            selectedShow = shows.find((s) => s.id === groupShowId);
                            if (!selectedShow) return;
                            title = title || selectedShow.title;
                          } else {
                            if (!title) {
                              notify('Please enter a custom feed name');
                              return;
                            }
                          }

                          const validImages = groupImageLinks.map((l) => l.trim()).filter(Boolean);
                          if (validImages.length === 0) {
                            notify('Please enter at least one valid profile image link');
                            return;
                          }

                          const newGroup: ProfilePictureGroup = {
                            id: `group-${Date.now()}`,
                            title,
                            showId: selectedShow?.id,
                            showTitle: title,
                            sourceType: groupSourceType,
                            type: groupSourceType,
                            images: validImages,
                            enabled: true,
                            displayOrder: profilePictureGroups.length
                          };

                          setProfilePictureGroups([...profilePictureGroups, newGroup]);
                          setIsAddingGroup(false);
                          setGroupShowId('');
                          setGroupCustomName('');
                          setGroupImageLinks(['']);
                          notify(`Created avatar feed "${title}"!`);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                      >
                        <Save className="w-4 h-4" />
                        <span>Create Feed</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Profile Picture Feeds List with Reordering, Hide/Unhide, Edit & Add Images */}
                <div className="space-y-4">
                  {profilePictureGroups.map((group, groupIdx) => {
                    const isEditing = editingGroupId === group.id;
                    const isVisible = group.enabled !== false;
                    const feedTitle = group.title || group.showTitle || 'Avatar Feed';
                    const newImageUrl = quickAddGroupImage[group.id] || '';
                    const linkedShow = group.showId ? shows.find((s) => s.id === group.showId) : undefined;

                    return (
                      <div
                        key={group.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isVisible
                            ? 'bg-zinc-900 border-zinc-800'
                            : 'bg-zinc-900/50 border-zinc-800/60 opacity-80'
                        } space-y-4 shadow-md`}
                      >
                        {/* Feed Card Top Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                          {/* Left: Reorder Arrows, Order Badge, and Title */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Move Up / Move Down Arrangement Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={groupIdx === 0}
                                onClick={() => {
                                  if (groupIdx === 0) return;
                                  const updated = [...profilePictureGroups];
                                  const temp = updated[groupIdx];
                                  updated[groupIdx] = updated[groupIdx - 1];
                                  updated[groupIdx - 1] = temp;
                                  setProfilePictureGroups(updated);
                                  notify(`Moved "${feedTitle}" up in arrangement`);
                                }}
                                className={`p-1 rounded-md border text-xs ${
                                  groupIdx === 0
                                    ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer'
                                }`}
                                title="Move Feed Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={groupIdx === profilePictureGroups.length - 1}
                                onClick={() => {
                                  if (groupIdx === profilePictureGroups.length - 1) return;
                                  const updated = [...profilePictureGroups];
                                  const temp = updated[groupIdx];
                                  updated[groupIdx] = updated[groupIdx + 1];
                                  updated[groupIdx + 1] = temp;
                                  setProfilePictureGroups(updated);
                                  notify(`Moved "${feedTitle}" down in arrangement`);
                                }}
                                className={`p-1 rounded-md border text-xs ${
                                  groupIdx === profilePictureGroups.length - 1
                                    ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer'
                                }`}
                                title="Move Feed Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/50 text-zinc-400 border border-white/5">
                              #{groupIdx + 1}
                            </span>

                            {/* Feed Title or Inline Edit Input */}
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editGroupTitle}
                                  onChange={(e) => setEditGroupTitle(e.target.value)}
                                  className="bg-zinc-800 border border-red-500 rounded px-2.5 py-1 text-xs text-white outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!editGroupTitle.trim()) return;
                                    setProfilePictureGroups((prev) =>
                                      prev.map((g) =>
                                        g.id === group.id
                                          ? { ...g, title: editGroupTitle.trim(), showTitle: editGroupTitle.trim() }
                                          : g
                                      )
                                    );
                                    setEditingGroupId(null);
                                    notify('Updated feed title!');
                                  }}
                                  className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingGroupId(null)}
                                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-[11px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className="text-sm font-bold text-white tracking-tight truncate">
                                  {feedTitle}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditGroupTitle(feedTitle);
                                  }}
                                  className="text-zinc-500 hover:text-zinc-300 p-1 cursor-pointer"
                                  title="Edit Feed Title"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Source Type Badge */}
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {group.sourceType === 'movie' ? 'Movie' : group.sourceType === 'series' ? 'Series' : 'Custom'}
                            </span>

                            {/* Hidden from Users Badge */}
                            {!isVisible && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                                Hidden
                              </span>
                            )}
                          </div>

                          {/* Right Actions: Hide/Unhide & Delete Feed */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            {/* Hide / Unhide Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const newEnabled = !isVisible;
                                setProfilePictureGroups((prev) =>
                                  prev.map((g) =>
                                    g.id === group.id ? { ...g, enabled: newEnabled } : g
                                  )
                                );
                                notify(`${newEnabled ? 'Unhid' : 'Hidden'} avatar feed "${feedTitle}"`);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                                isVisible
                                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-emerald-400'
                                  : 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-700 text-amber-300'
                              }`}
                              title={isVisible ? 'Hide feed from user profile picker' : 'Unhide feed for users'}
                            >
                              {isVisible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                            </button>

                            {/* Delete Feed Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setProfilePictureGroups(profilePictureGroups.filter((g) => g.id !== group.id));
                                notify(`Removed avatar feed "${feedTitle}"`);
                              }}
                              className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
                              title="Delete Avatar Feed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Add Images directly to this Feed */}
                        <div className="p-3 bg-zinc-850/80 rounded-xl border border-zinc-800 space-y-2">
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add image URL (https://...)"
                              value={newImageUrl}
                              onChange={(e) =>
                                setQuickAddGroupImage((prev) => ({
                                  ...prev,
                                  [group.id]: e.target.value
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newImageUrl.trim()) {
                                  e.preventDefault();
                                  setProfilePictureGroups((prev) =>
                                    prev.map((g) =>
                                      g.id === group.id
                                        ? { ...g, images: [...g.images, newImageUrl.trim()] }
                                        : g
                                    )
                                  );
                                  setQuickAddGroupImage((prev) => ({ ...prev, [group.id]: '' }));
                                  notify(`Added image to "${feedTitle}"!`);
                                }
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 font-mono"
                            />

                            {newImageUrl.trim() && (
                              <img
                                src={newImageUrl.trim()}
                                alt="Preview"
                                className="w-8 h-8 rounded object-cover border border-zinc-700 shrink-0 self-center"
                              />
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (!newImageUrl.trim()) return;
                                setProfilePictureGroups((prev) =>
                                  prev.map((g) =>
                                    g.id === group.id
                                      ? { ...g, images: [...g.images, newImageUrl.trim()] }
                                      : g
                                  )
                                );
                                setQuickAddGroupImage((prev) => ({ ...prev, [group.id]: '' }));
                                notify(`Added image to "${feedTitle}"!`);
                              }}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Image</span>
                            </button>

                            {/* Quick Add Cast Photos from linked show */}
                            {linkedShow && (linkedShow.cast || []).length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const castUrls = (linkedShow.cast || [])
                                    .map((c) => c.profileUrl)
                                    .filter(Boolean);
                                  const unadded = castUrls.filter((u) => !group.images.includes(u));
                                  if (unadded.length === 0) {
                                    notify('All cast photos already added to this feed!');
                                    return;
                                  }
                                  setProfilePictureGroups((prev) =>
                                    prev.map((g) =>
                                      g.id === group.id
                                        ? { ...g, images: [...g.images, ...unadded] }
                                        : g
                                    )
                                  );
                                  notify(`Added ${unadded.length} cast photos from "${linkedShow.title}"!`);
                                }}
                                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-semibold rounded-lg cursor-pointer shrink-0"
                              >
                                + Add {linkedShow.cast?.length} Cast Headshots
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Images Gallery in Feed */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-zinc-400 font-semibold">
                              Feed Images ({group.images.length} {group.images.length === 1 ? 'image' : 'images'}):
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {group.images.map((imgUrl, imgIdx) => (
                              <div
                                key={imgIdx}
                                className="relative group/pic w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 shadow"
                              >
                                <img
                                  src={imgUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newImages = group.images.filter((_, i) => i !== imgIdx);
                                    setProfilePictureGroups(
                                      profilePictureGroups.map((g) =>
                                        g.id === group.id ? { ...g, images: newImages } : g
                                      )
                                    );
                                    notify('Removed image from feed.');
                                  }}
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/85 text-white flex items-center justify-center opacity-0 group-hover/pic:opacity-100 transition-opacity hover:bg-red-600 cursor-pointer shadow"
                                  title="Delete image"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            {group.images.length === 0 && (
                              <div className="p-4 text-xs text-zinc-500 italic bg-black/30 rounded-lg w-full text-center border border-white/5">
                                No images in this feed yet. Use the field above to add image URLs.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {profilePictureGroups.length === 0 && (
                    <div className="p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-400 text-xs">
                      No avatar feeds created yet. Click "Create Avatar Feed" above to create feeds of images from Movies, Series, or Custom Collections.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: PUSH NOTIFICATIONS BROADCAST CONSOLE                                 */}
          {/* ========================================================================= */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Bell className="w-6 h-6 text-red-500" />
                    <span>Push Notifications Console</span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Broadcast real-time notifications with image, heading, and subheading directly to user app bell dropdown.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">
                    Active: <strong className="text-white">{notifications.length}</strong>
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800">
                    {notifications.filter((n) => n.unread).length} Unread
                  </span>
                </div>
              </div>

              {/* Form Card: Push New Notification */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#12141f] to-[#181b2a] border border-zinc-800 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-400" />
                    <span>Create & Push Broadcast Notification</span>
                  </h2>
                  <span className="text-[11px] text-zinc-400">
                    Instantly appears with red badge in Navbar bell
                  </span>
                </div>

                <form onSubmit={handlePushNotification} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left: Input Fields */}
                    <div className="md:col-span-8 space-y-4">
                      {/* 1. Heading Input Field */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
                          Notification Heading (Title) *
                        </label>
                        <input
                          type="text"
                          required
                          value={notifHeading}
                          onChange={(e) => setNotifHeading(e.target.value)}
                          placeholder="e.g. New Episode Available or Season 2 Premiere"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                        />
                      </div>

                      {/* 2. Subheading Input Field */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
                          Notification Subheading (Description / Body Text)
                        </label>
                        <textarea
                          rows={2}
                          value={notifSubheading}
                          onChange={(e) => setNotifSubheading(e.target.value)}
                          placeholder="e.g. Watch the thrilling new episode of Kuruluş: Osman streaming now in 4K HDR with Dolby Atmos."
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                        />
                      </div>

                      {/* 3. Image Link Input Field */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                            Banner Image URL (Thumbnail)
                          </label>
                          <span className="text-[11px] text-zinc-400">16:9 Landscape recommended</span>
                        </div>
                        <input
                          type="text"
                          value={notifImageUrl}
                          onChange={(e) => setNotifImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/... or paste image URL"
                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-red-500 transition-colors"
                        />
                        {/* Quick Show Poster Sample buttons */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[11px] text-zinc-500 font-mono">Quick Pick:</span>
                          {shows.slice(0, 4).map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setNotifImageUrl(s.posterLandscapeUrl || s.backdropUrl);
                                setNotifShowId(s.id);
                                if (!notifHeading) setNotifHeading(`New: ${s.title}`);
                              }}
                              className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                            >
                              {s.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Target Show Selector & Time Tag */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
                            Target Show (Opens on Click)
                          </label>
                          <select
                            value={notifShowId}
                            onChange={(e) => setNotifShowId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                          >
                            <option value="">-- None (General Announcement) --</option>
                            {shows.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title} ({s.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5 font-mono">
                            Time Badge
                          </label>
                          <input
                            type="text"
                            value={notifTimeAgo}
                            onChange={(e) => setNotifTimeAgo(e.target.value)}
                            placeholder="e.g. Just now, 5m ago"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right: Live Preview Box */}
                    <div className="md:col-span-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                        <span className="text-xs font-bold text-zinc-400 font-mono uppercase tracking-wider">
                          Live Bell Dropdown Preview
                        </span>
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      </div>

                      {/* Preview Notification Item */}
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-[#141414] border border-white/10 shadow-lg">
                        <div className="w-[100px] h-[58px] rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/10 relative">
                          <img
                            src={
                              notifImageUrl ||
                              (shows.find((s) => s.id === notifShowId)?.posterLandscapeUrl || shows[0]?.posterLandscapeUrl)
                            }
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=240&q=80';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className="text-xs font-bold text-white leading-snug">
                            {notifHeading || 'Notification Heading Preview'}
                          </p>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {notifSubheading || 'Subheading description text will appear right here.'}
                          </p>
                          <span className="text-[10px] text-zinc-500 mt-1 block">
                            {notifTimeAgo || 'Just now'}
                          </span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-[#e50914] block mt-1.5 shrink-0" />
                      </div>

                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        When users click on this in the navbar bell, it marks as read and instantly opens the selected show!
                      </p>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifHeading('');
                        setNotifSubheading('');
                        setNotifImageUrl('');
                        setNotifShowId('');
                      }}
                      className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Reset Form
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-red-950/50"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Push Broadcast Notification</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Notifications Management List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Active Notifications</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                      {notifications.length}
                    </span>
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateNotifications) onUpdateNotifications([]);
                        notify('Cleared all notifications.');
                      }}
                      className="text-xs text-zinc-500 hover:text-red-400 transition-colors cursor-pointer font-medium"
                    >
                      Clear All Notifications
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start justify-between gap-3 group hover:border-zinc-700 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-[100px] h-[58px] rounded-lg overflow-hidden shrink-0 bg-black border border-white/10 relative">
                          <img
                            src={notif.thumbnailUrl}
                            alt={notif.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{notif.title}</h4>
                            {notif.unread && (
                              <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-mono font-bold">
                                UNREAD
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                            {notif.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-zinc-500">
                            <span>{notif.timeAgo}</span>
                            {notif.showId && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400 truncate font-mono">
                                  {shows.find((s) => s.id === notif.showId)?.title || notif.showId}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleUnreadNotification(notif.id)}
                          className="text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          {notif.unread ? 'Mark Read' : 'Mark Unread'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNotification(notif.id)}
                          className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {notifications.length === 0 && (
                    <div className="col-span-full p-8 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-500 text-xs">
                      No active notifications. Use the form above to push a new notification to the user navbar!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: IMAGE HEALTH VALIDATOR                                             */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {activeTab === 'image_health' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Image Health Validator</h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Verifies all stored poster, backdrop, logo, and thumbnail URLs. Flags broken/404 links and provides inline replacement.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-zinc-400">
                    Total Assets: <strong className="text-white">{allStoredImages.length}</strong>
                  </span>
                  {brokenImages.size > 0 && (
                    <span className="text-xs font-mono px-2 py-1 rounded bg-red-950 text-red-400 border border-red-800">
                      {brokenImages.size} Broken
                    </span>
                  )}
                </div>
              </div>

              {/* Grid of Image Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allStoredImages.map((imgRef) => {
                  const isBroken = brokenImages.has(imgRef.key);
                  const currentInputVal = imageQuickEdits[imgRef.key] ?? imgRef.url;

                  return (
                    <div
                      key={imgRef.key}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                        isBroken
                          ? 'bg-red-950/20 border-red-800/80 shadow-lg shadow-red-950/30'
                          : 'bg-zinc-900/70 border-zinc-800'
                      }`}
                    >
                      {/* Image Preview Box */}
                      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                        <img
                          src={imgRef.url}
                          alt={imgRef.label}
                          referrerPolicy="no-referrer"
                          onError={() => {
                            setBrokenImages((prev) => new Set([...prev, imgRef.key]));
                          }}
                          onLoad={() => {
                            setBrokenImages((prev) => {
                              const next = new Set(prev);
                              next.delete(imgRef.key);
                              return next;
                            });
                          }}
                          className="w-full h-full object-cover"
                        />

                        {isBroken && (
                          <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center">
                            <AlertTriangle className="w-6 h-6 text-red-400 mb-1" />
                            <span className="text-xs font-bold text-red-200">Broken / 404 Image Link</span>
                            <span className="text-[10px] text-red-300/80 mt-0.5">Please replace URL below</span>
                          </div>
                        )}
                      </div>

                      {/* Info & Inline Quick-Edit Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">
                            {imgRef.showTitle}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">{imgRef.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={currentInputVal}
                            onChange={(e) =>
                              setImageQuickEdits({ ...imageQuickEdits, [imgRef.key]: e.target.value })
                            }
                            placeholder="Paste new image URL..."
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-red-500 font-mono"
                          />
                          <button
                            onClick={() => handleSaveQuickImage(imgRef, currentInputVal)}
                            className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                            title="Save URL"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4.5: VIDEO STREAM HEALTH CHECKER                                      */}
          {/* ========================================================================= */}
          {activeTab === 'video_health' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                    <Video className="w-6 h-6 text-red-500" />
                    <span>Video Health Validator</span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    Validates all movie streams, episodic video URLs, trailers, and hover previews across the catalog.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      Total: <strong className="text-white">{allStoredVideos.length}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                      Verified: <strong>{healthyVideos.size}</strong>
                    </span>
                    {brokenVideos.size > 0 && (
                      <span className="px-2.5 py-1 rounded bg-red-950/90 text-red-400 border border-red-800 font-bold animate-pulse">
                        {brokenVideos.size} Broken
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pb-1 border-b border-zinc-800/80 text-xs">
                <button
                  onClick={() => setVideoFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    videoFilterType === 'all'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  All Video Streams ({allStoredVideos.length})
                </button>
                <button
                  onClick={() => setVideoFilterType('broken')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    videoFilterType === 'broken'
                      ? 'bg-red-600 text-white'
                      : brokenVideos.size > 0
                      ? 'bg-red-950/70 border border-red-800 text-red-300 hover:text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Broken / Alert Only ({brokenVideos.size})</span>
                </button>
                <button
                  onClick={() => setVideoFilterType('trailers')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    videoFilterType === 'trailers'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  Trailers & Previews ({allStoredVideos.filter((v) => v.category === 'trailer' || v.category === 'hover').length})
                </button>
                <button
                  onClick={() => setVideoFilterType('episodes')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    videoFilterType === 'episodes'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  Episode Streams ({allStoredVideos.filter((v) => v.category === 'episode').length})
                </button>
                <button
                  onClick={() => setVideoFilterType('movies')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    videoFilterType === 'movies'
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                  }`}
                >
                  Full Movies ({allStoredVideos.filter((v) => v.category === 'movie').length})
                </button>
              </div>

              {/* Grid of Video Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allStoredVideos
                  .filter((vRef) => {
                    if (videoFilterType === 'broken') return brokenVideos.has(vRef.key);
                    if (videoFilterType === 'trailers') return vRef.category === 'trailer' || vRef.category === 'hover';
                    if (videoFilterType === 'episodes') return vRef.category === 'episode';
                    if (videoFilterType === 'movies') return vRef.category === 'movie';
                    return true;
                  })
                  .map((vRef) => {
                    const isBroken = brokenVideos.has(vRef.key);
                    const isHealthy = healthyVideos.has(vRef.key);
                    const currentInputVal = videoQuickEdits[vRef.key] ?? vRef.url;

                    return (
                      <div
                        key={vRef.key}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                          isBroken
                            ? 'bg-red-950/25 border-red-800/80 shadow-lg shadow-red-950/30'
                            : 'bg-zinc-900/70 border-zinc-800'
                        }`}
                      >
                        {/* Video Player Box with Live Testing */}
                        <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black border border-white/10 flex items-center justify-center group">
                          <video
                            src={vRef.url}
                            preload="metadata"
                            muted
                            controls
                            playsInline
                            onError={() => {
                              setBrokenVideos((prev) => new Set([...prev, vRef.key]));
                              setHealthyVideos((prev) => {
                                const next = new Set(prev);
                                next.delete(vRef.key);
                                return next;
                              });
                            }}
                            onLoadedMetadata={() => {
                              setHealthyVideos((prev) => new Set([...prev, vRef.key]));
                              setBrokenVideos((prev) => {
                                const next = new Set(prev);
                                next.delete(vRef.key);
                                return next;
                              });
                            }}
                            className="w-full h-full object-cover"
                          />

                          {/* Status Badge in Top-Right */}
                          <div className="absolute top-2 right-2 pointer-events-none">
                            {isBroken ? (
                              <span className="px-2 py-0.5 rounded bg-red-900/90 text-red-200 border border-red-700 text-[10px] font-bold font-mono flex items-center gap-1 shadow">
                                <AlertTriangle className="w-3 h-3 text-red-300" />
                                <span>Playback Error (403/404)</span>
                              </span>
                            ) : isHealthy ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-900/90 text-emerald-200 border border-emerald-700 text-[10px] font-bold font-mono flex items-center gap-1 shadow">
                                <Check className="w-3 h-3 text-emerald-300" />
                                <span>Stream OK</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700 text-[10px] font-mono shadow">
                                Checking...
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stream Information & Inline Quick-Edit Field */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate max-w-[200px]" title={vRef.showTitle}>
                              {vRef.showTitle}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                              {vRef.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={currentInputVal}
                              onChange={(e) =>
                                setVideoQuickEdits({ ...videoQuickEdits, [vRef.key]: e.target.value })
                              }
                              placeholder="Paste MP4 / stream video URL..."
                              className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-[11px] text-zinc-200 outline-none focus:border-red-500 font-mono"
                            />
                            <button
                              onClick={() =>
                                setVideoQuickEdits({
                                  ...videoQuickEdits,
                                  [vRef.key]: 'https://vjs.zencdn.net/v/oceans.mp4'
                                })
                              }
                              className="px-2 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-[10px] font-bold transition-colors cursor-pointer shrink-0"
                              title="Fill with verified test MP4 stream"
                            >
                              Sample
                            </button>
                            <button
                              onClick={() => handleSaveQuickVideo(vRef, currentInputVal)}
                              className="px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                              title="Save Stream URL"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PLATFORM SETTINGS & TOGGLES                                        */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Platform Feature Toggles</h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Adjust visual appearance, interactive behaviors, and playback preferences.
                </p>
              </div>

              <div className="space-y-4">
                {/* Where to watch toggle */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Enable &quot;Where to Watch&quot; Provider Buttons
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Displays official stream buttons (YouTube, Netflix, Tabii) on show detail views.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...adminSettings,
                        enableWhereToWatch: !adminSettings.enableWhereToWatch
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      adminSettings.enableWhereToWatch ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        adminSettings.enableWhereToWatch ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Horizontal Episodes Row */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Horizontal Scrollable Line for Episodes
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Renders season episodes in a sleek horizontal scrollable carousel.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...adminSettings,
                        enableHorizontalEpisodes: !adminSettings.enableHorizontalEpisodes
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      adminSettings.enableHorizontalEpisodes ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        adminSettings.enableHorizontalEpisodes ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Autoplay trailers on hover */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Autoplay Video Trailers on Poster Hover
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Streams video previews with audio when hovering over show cards.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        ...adminSettings,
                        autoplayHoverTrailers: !adminSettings.autoplayHoverTrailers
                      })
                    }
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      adminSettings.autoplayHoverTrailers ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        adminSettings.autoplayHoverTrailers ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Ambient glow intensity */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Hero & Ambient Glow Intensity
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Controls the saturation of background atmospheric lighting effects.
                    </p>
                  </div>
                  <select
                    value={adminSettings.ambientGlowIntensity}
                    onChange={(e) =>
                      onUpdateSettings({
                        ...adminSettings,
                        ambientGlowIntensity: e.target.value as 'high' | 'medium' | 'subtle'
                      })
                    }
                    className="bg-zinc-800 border border-zinc-700 text-xs text-white rounded-lg px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="high">High (Dramatic)</option>
                    <option value="medium">Medium (Balanced)</option>
                    <option value="subtle">Subtle (Minimal)</option>
                  </select>
                </div>

                {/* Dailymotion Library Script URL Input */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Dailymotion Player Library Script
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Global embed script required for Dailymotion web player library integration.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={adminSettings.dailymotionScriptUrl || 'https://geo.dailymotion.com/libs/player/x1o1xe.js'}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...adminSettings,
                          dailymotionScriptUrl: e.target.value
                        })
                      }
                      placeholder="https://geo.dailymotion.com/libs/player/x1o1xe.js"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...adminSettings,
                          dailymotionScriptUrl: 'https://geo.dailymotion.com/libs/player/x1o1xe.js'
                        })
                      }
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>

                {/* Platform Brand Name: One change here updates the platform name everywhere on the platform in one click */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Platform Brand Name</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-500/30">Global</span>
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Changing the platform name here updates it everywhere across the website, navigation, footers, profile pages, and settings in one click.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={adminSettings.platformName ?? 'Dizi Urdu'}
                      onChange={(e) => {
                        const updated = {
                          ...adminSettings,
                          platformName: e.target.value
                        };
                        onUpdateSettings(updated);
                        try {
                          localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                          window.dispatchEvent(new Event('cineflix_branding_change'));
                        } catch {}
                      }}
                      placeholder="e.g. Dizi Urdu"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-semibold outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = {
                          ...adminSettings,
                          platformName: 'Dizi Urdu'
                        };
                        onUpdateSettings(updated);
                        try {
                          localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                          window.dispatchEvent(new Event('cineflix_branding_change'));
                        } catch {}
                      }}
                      className="px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Reset to Dizi Urdu
                    </button>
                  </div>
                </div>

                {/* Custom Branding Logo with toggle and image link input field */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Custom Website Branding Logo</h4>
                      <p className="text-xs text-zinc-400">
                        Toggle to replace the default website logo with your custom branding image URL. If disabled, reverts to default website logo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({
                          ...adminSettings,
                          useCustomLogo: !adminSettings.useCustomLogo
                        })
                      }
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        adminSettings.useCustomLogo ? 'bg-red-600' : 'bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          adminSettings.useCustomLogo ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {adminSettings.useCustomLogo && (
                    <div className="pt-2 space-y-2 border-t border-zinc-800">
                      <label className="block text-xs font-semibold text-zinc-300">
                        Custom Logo Image Link (PNG / SVG / WebP URL)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={adminSettings.customLogoUrl || ''}
                          onChange={(e) =>
                            onUpdateSettings({
                              ...adminSettings,
                              customLogoUrl: e.target.value
                            })
                          }
                          placeholder="https://example.com/brand-logo.png"
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                        />
                        {adminSettings.customLogoUrl && (
                          <div className="p-1.5 bg-black/60 rounded border border-zinc-700 h-9 flex items-center justify-center shrink-0">
                            <img
                              src={adminSettings.customLogoUrl}
                              alt="Logo Preview"
                              className="h-6 w-auto max-w-[100px] object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Show Top 10 Badges toggle */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Show Top 10 Badges on Cards & Details
                    </h4>
                    <p className="text-xs text-zinc-400">
                      Displays red &quot;TOP 10&quot; badge in corner of ranking cards and in More Info page. Turn off to hide everywhere in one toggle.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = {
                        ...adminSettings,
                        showTop10Badges: adminSettings.showTop10Badges === false ? true : false
                      };
                      onUpdateSettings(updated);
                      try {
                        localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                      } catch {}
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                      adminSettings.showTop10Badges !== false ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        adminSettings.showTop10Badges !== false ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* ========================================================================= */}
                {/* DEDICATED SECTION: MOBILE LAYOUT OPTIONS (MOBILE VIEWPORT ONLY)            */}
                {/* ========================================================================= */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#131520] to-[#181b2a] border border-red-500/30 space-y-5 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Mobile Layout Controls
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                          Mobile Only
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        These settings strictly customize mobile phone layouts (<code className="text-zinc-300 font-mono">&le; 768px</code>) and never impact desktop or tablet views.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Option 1: Mobile Bottom Navbar Style */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Mobile Bottom Navigation Bar Style
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Switch between a modern floating island pill or a full-width dock fixed to the bottom edge.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-800/90 p-1 rounded-xl border border-zinc-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileNavbarStyle: 'floating' as const
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            (adminSettings.mobileNavbarStyle || 'floating') === 'floating'
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Floating Pill
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileNavbarStyle: 'bottom_fixed' as const
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            adminSettings.mobileNavbarStyle === 'bottom_fixed'
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Bottom-Fixed Dock
                        </button>
                      </div>
                    </div>

                    {/* Option 2: Mobile Navbar Button Text Labels */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Navbar Button Labels (Text Under Icons)
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Toggle between showing text labels (&quot;Home&quot;, &quot;Search&quot;, &quot;Profile&quot;) or minimal icons-only buttons.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-800/90 p-1 rounded-xl border border-zinc-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileNavbarShowLabels: true
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            adminSettings.mobileNavbarShowLabels !== false
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Show Text
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileNavbarShowLabels: false
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            adminSettings.mobileNavbarShowLabels === false
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          Hide Text (Icons Only)
                        </button>
                      </div>
                    </div>

                    {/* Option 3: Mobile Hero Recommendation Style */}
                    <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Mobile Hero Recommendation Style
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Switch between current 2:3 vertical poster card (no background autoplay) or a 16:9 widescreen card (3s backdrop delay before preview, no play/more info buttons, tap opens details, zero black screen).
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-zinc-800/90 p-1 rounded-xl border border-zinc-700 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileRecommendationStyle: 'portrait' as const
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            (adminSettings.mobileRecommendationStyle || 'portrait') === 'portrait'
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          2:3 Portrait Card
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...adminSettings,
                              mobileRecommendationStyle: 'landscape' as const
                            };
                            onUpdateSettings(updated);
                            try {
                              localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                            } catch {}
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            adminSettings.mobileRecommendationStyle === 'landscape'
                              ? 'bg-red-600 text-white shadow'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          16:9 Widescreen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: DATABASE & CATALOG MANAGEMENT (2 EXPORTS, 2 IMPORTS)              */}
          {/* ========================================================================= */}
          {/* ========================================================================= */}
          {/* TAB 6: FULL DATABASE BACKUP (ONLY 1 UNIFIED BACKUP OPTION)               */}
          {/* ========================================================================= */}
          {activeTab === 'export_import' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                  <Database className="w-6 h-6 text-red-500" />
                  <span>Full Database Backup</span>
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Single comprehensive backup system. Export or restore 100% of your platform data: complete titles catalog, all aspect ratios (16:9, 9:16, 1:2, 2:3, backdrops), video streams, home feed rows, categories, avatar galleries, and settings.
                </p>
              </div>

              {/* Direct Localhost Disk Auto-Sync Status Bar */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#111915] border border-emerald-500/30 text-zinc-300 text-xs leading-relaxed space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 font-bold text-white text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                    <span>Direct Disk Write Active (Localhost Auto-Sync)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      saveToDiskDirectly();
                      notify('Saved directly to disk: src/full_backup.json');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Sync to Disk Now</span>
                  </button>
                </div>
                <p className="text-zinc-400 text-[11.5px]">
                  When running on localhost, adding, editing, or deleting any title, episode, feed, category, or avatar feed directly writes to <code className="font-mono text-cyan-400">src/full_backup.json</code> on your disk in real time.
                </p>
              </div>

              {/* ONLY 1 BACKUP CARD: Full Database Backup */}
              <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-500">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Full Database Backup</h3>
                    <p className="text-xs text-zinc-400">Includes 100% of all settings, catalogue, image arrays & feeds</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Shows & Movies</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">{shows.length} Total Titles</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Custom Feed Rows</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">{feeds.length} Rows Configured</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Custom Categories</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">{categoriesList.length} Categories</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Profile Picture Feeds</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">{profilePictureGroups.length} Avatar Feeds</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>All Aspect Ratios</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">16:9, 9:16, 1:2, 2:3, Backdrops</p>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Platform Settings</span>
                    </span>
                    <p className="text-zinc-400 font-mono text-[11px]">Branding, Layout, Mobile Dock</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleExportFullDatabase}
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-950/40"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Database Backup (.json)</span>
                  </button>

                  <label className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 border border-zinc-700">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    <span>Restore Full Database Backup (.json)</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFullDatabase}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* SEPARATE FULL MODAL: "ADD SHOW" & "ADD MOVIE"                             */}
      {/* ========================================================================= */}
      {modalMode !== 'none' && formData && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-[#12141d] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-4 max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="p-5 border-b border-zinc-800 bg-[#161924] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    formData.type === 'movie'
                      ? 'bg-amber-950 border border-amber-800 text-amber-400'
                      : 'bg-red-950 border border-red-800 text-red-400'
                  }`}
                >
                  {formData.type === 'movie' ? <Film className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isEditingExisting
                      ? `Edit ${formData.type === 'movie' ? 'Movie' : 'Show'}: ${formData.title}`
                      : formData.type === 'movie'
                      ? 'Add New Feature Film'
                      : 'Add New Television Series'}
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    ID: {formData.id} · Type: {formData.type.toUpperCase()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setModalMode('none');
                  setFormData(null);
                }}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center px-6 border-b border-zinc-800 gap-6 text-xs font-bold uppercase tracking-wider bg-zinc-900/60 overflow-x-auto">
              <button
                onClick={() => setActiveFormTab('metadata')}
                className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeFormTab === 'metadata'
                    ? 'border-red-600 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1. TMDB & Metadata
              </button>
              <button
                onClick={() => setActiveFormTab('media')}
                className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeFormTab === 'media'
                    ? 'border-red-600 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2. Media Assets & Clips
              </button>
              <button
                onClick={() => setActiveFormTab('where_to_watch')}
                className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeFormTab === 'where_to_watch'
                    ? 'border-red-600 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3. Where to Watch
              </button>
              <button
                onClick={() => setActiveFormTab('episodes_stream')}
                className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeFormTab === 'episodes_stream'
                    ? 'border-red-600 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {formData.type === 'movie' ? '4. Movie Stream Source' : '4. Seasons & Episodes'}
              </button>
              <button
                onClick={() => setActiveFormTab('blog')}
                className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  activeFormTab === 'blog'
                    ? 'border-red-600 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                5. Editorial Article
              </button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar text-xs">
              {/* TAB 1: METADATA & TMDB AUTO FETCH */}
              {activeFormTab === 'metadata' && (
                <div className="space-y-4">
                  {/* TMDB Auto Fetch Trigger Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-zinc-900 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-900/60 border border-blue-600/50 flex items-center justify-center text-blue-300 shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">TMDB Auto-Fetch Integration</h4>
                        <p className="text-[11px] text-zinc-400">
                          Auto-populates Maturity rating, Release year, Cast, Synopsis, and Genres.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="TMDB ID (e.g. 62710)"
                        value={formData.tmdbId ?? ''}
                        onChange={(e) =>
                          setFormData({ ...formData, tmdbId: e.target.value ? parseInt(e.target.value) : undefined })
                        }
                        className="w-36 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleFetchTMDB}
                        disabled={tmdbLoading}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        {tmdbLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Fetch from TMDB</span>
                      </button>
                    </div>
                  </div>

                  {tmdbError && (
                    <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{tmdbError}</span>
                    </div>
                  )}

                  {/* Title & Turkish Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Turkish Title</label>
                      <input
                        type="text"
                        value={formData.turkishTitle || ''}
                        onChange={(e) => setFormData({ ...formData, turkishTitle: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Supporting Titles (Alternative Search Titles) */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-white font-semibold text-sm">
                          Supporting Titles (Search Keywords)
                        </label>
                        <p className="text-xs text-zinc-400">
                          Add multiple alternative or supporting titles (e.g. Urdu, English, romanized, alternate spellings). These do not appear anywhere on cards or banners, but users can search for them to find this title.
                        </p>
                      </div>
                    </div>

                    {/* Chips for existing supporting titles */}
                    {(formData.supportingTitles || []).length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(formData.supportingTitles || []).map((st, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-medium text-white shadow-sm"
                          >
                            <span>{st}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (formData.supportingTitles || []).filter((_, i) => i !== idx);
                                setFormData({ ...formData, supportingTitles: updated });
                              }}
                              className="text-zinc-400 hover:text-red-400 cursor-pointer"
                              title="Remove supporting title"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Add new supporting title input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="e.g. Resurrection Ertugrul, Ertugrul Ghazi, Dirilis"
                        id="new-supporting-title-input"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-red-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.currentTarget.value || '').trim();
                            if (val) {
                              const current = formData.supportingTitles || [];
                              if (!current.includes(val)) {
                                setFormData({ ...formData, supportingTitles: [...current, val] });
                              }
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('new-supporting-title-input') as HTMLInputElement | null;
                          if (input) {
                            const val = (input.value || '').trim();
                            if (val) {
                              const current = formData.supportingTitles || [];
                              if (!current.includes(val)) {
                                setFormData({ ...formData, supportingTitles: [...current, val] });
                              }
                              input.value = '';
                            }
                          }
                        }}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer border border-zinc-700 flex items-center gap-1.5 shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Title</span>
                      </button>
                    </div>
                  </div>

                  {/* Slug & Announcement Pill */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">
                        Slug / Shareable Username (<code className="text-zinc-300">/watch/&#123;slug&#125;</code>)
                      </label>
                      <input
                        type="text"
                        value={formData.slug || ''}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono"
                        placeholder="e.g. ertugrul-ghazi or kurulus-osman"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">
                        Announcement Pill (5–7 words displayed over banner)
                      </label>
                      <input
                        type="text"
                        value={formData.announcementPill || ''}
                        onChange={(e) => setFormData({ ...formData, announcementPill: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                        placeholder="e.g. Season 4 Trending #1 This Week"
                      />
                    </div>
                  </div>

                  {/* Recommendation Eligibility Checkbox */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Hero & Recommendation Eligibility</h5>
                      <p className="text-[11px] text-zinc-400">
                        When enabled, title can appear in hero top banner and featured recommendation strips.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_recommended ?? true}
                        onChange={(e) => setFormData({ ...formData, is_recommended: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {/* Special Single Feed Eligibility Checkbox */}
                  <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Special Single Feed Eligible</h5>
                      <p className="text-[11px] text-zinc-400">
                        When enabled, title is eligible to be featured in the special single feed banner on the desktop homepage.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isSpecialSingleFeedEligible ?? false}
                        onChange={(e) => setFormData({ ...formData, isSpecialSingleFeedEligible: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {/* Category Checkboxes */}
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-2">Category Checkboxes</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {AVAILABLE_CATEGORIES.map((cat) => {
                        const isChecked = (formData.categories || []).includes(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors cursor-pointer ${
                              isChecked ? 'bg-red-950/40 border-red-800/80 text-white' : 'bg-zinc-850 border-zinc-800 text-zinc-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const prev = formData.categories || [];
                                const updated = e.target.checked ? [...prev, cat] : prev.filter((c) => c !== cat);
                                setFormData({ ...formData, categories: updated });
                              }}
                              className="rounded accent-red-600"
                            />
                            <span className="text-[11px] font-medium">{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Year, Rating, Maturity, Points */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Release Year</label>
                      <input
                        type="text"
                        value={formData.releaseYear}
                        onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Duration / Seasons</label>
                      <input
                        type="text"
                        value={formData.durationOrSeasons}
                        onChange={(e) => setFormData({ ...formData, durationOrSeasons: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Age / Maturity</label>
                      <input
                        type="text"
                        value={formData.maturityRating}
                        onChange={(e) => setFormData({ ...formData, maturityRating: e.target.value })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Rating (IMDb / TMDB)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.imdbRating}
                        onChange={(e) => setFormData({ ...formData, imdbRating: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  {/* Genres Multi-select String */}
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Genres (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.genres.join(', ')}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          genres: e.target.value.split(',').map((g) => g.trim()).filter(Boolean)
                        })
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      placeholder="Historical Epic, Action, Drama"
                    />
                  </div>

                  {/* Synopsis Textarea */}
                  <div>
                    <label className="block text-zinc-400 font-semibold mb-1">Plot Synopsis</label>
                    <textarea
                      rows={3}
                      value={formData.synopsis}
                      onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: MEDIA & ASSET LINKS */}
              {activeFormTab === 'media' && (
                <div className="space-y-4">
                  {/* ========================================================================= */}
                  {/* MULTI-IMAGE ARTWORK MANAGER (ALL ASPECT RATIOS)                            */}
                  {/* ========================================================================= */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 space-y-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                          Multi-Image Artwork
                        </span>
                        <h4 className="text-sm font-bold text-white">Title Posters, Backdrops & Logos</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Add multiple images for every aspect ratio (not limited to 2). The system supports primary art plus unlimited variants for discovery rotation, A/B testing, and layout responsiveness.
                      </p>
                    </div>

                    {/* 1. 16:9 LANDSCAPE TITLE-INCLUDED POSTERS */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-white flex items-center gap-2">
                            <span>16:9 Landscape Title-Included Posters</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">16:9 Card Feed</span>
                          </label>
                          <p className="text-[10px] text-zinc-400">Standard feed carousels, mobile 16:9 continue watching, and landscape cards.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.posterLandscapeUrls || [];
                            setFormData({ ...formData, posterLandscapeUrls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      {/* Primary 16:9 Poster */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Primary 16:9 Poster (Default)</span>
                        <input
                          type="text"
                          value={formData.posterLandscapeUrl || ''}
                          onChange={(e) => setFormData({ ...formData, posterLandscapeUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (Primary 16:9 poster)"
                        />
                      </div>

                      {/* Additional 16:9 Posters */}
                      {(formData.posterLandscapeUrls || []).map((url, idx) => (
                        <div key={`pl-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.posterLandscapeUrls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, posterLandscapeUrls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 16:9 Image URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.posterLandscapeUrls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, posterLandscapeUrls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 2. 16:9 LANDSCAPE BACKDROPS */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-white flex items-center gap-2">
                            <span>16:9 Landscape Backdrops</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">16:9 Hero / Player</span>
                          </label>
                          <p className="text-[10px] text-zinc-400">Desktop video player, hero banner background, and ambient desktop recommendation screen.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.backdropUrls || [];
                            setFormData({ ...formData, backdropUrls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      {/* Primary Backdrop */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Primary 16:9 Backdrop (Default)</span>
                        <input
                          type="text"
                          value={formData.backdropUrl || ''}
                          onChange={(e) => setFormData({ ...formData, backdropUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (Primary 16:9 backdrop)"
                        />
                      </div>

                      {/* Additional 16:9 Backdrops */}
                      {(formData.backdropUrls || []).map((url, idx) => (
                        <div key={`bd-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.backdropUrls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, backdropUrls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 16:9 Backdrop URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.backdropUrls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, backdropUrls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 3. 9:16 STRETCH FEED TITLE-INCLUDED POSTERS (DISTINCT FROM BACKDROP) */}
                    <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-purple-200 flex items-center gap-2">
                            <span>9:16 Stretch Feed Title-Included Posters</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300">9:16 Stretch Feed</span>
                          </label>
                          <p className="text-[10px] text-zinc-300">
                            <strong>Includes drama title typography / logo.</strong> Used inside Desktop & Mobile Stretch Feed carousels.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.poster9x16Urls || [];
                            setFormData({ ...formData, poster9x16Urls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-purple-900/70 hover:bg-purple-800 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      {/* Primary 9:16 Stretch Poster */}
                      <div>
                        <span className="text-[10px] text-purple-300 font-semibold block mb-0.5">Primary 9:16 Stretch Feed Poster (with title artwork)</span>
                        <input
                          type="text"
                          value={formData.poster9x16Url || ''}
                          onChange={(e) => setFormData({ ...formData, poster9x16Url: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-purple-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (9:16 poster with title typography)"
                        />
                      </div>

                      {/* Additional 9:16 Stretch Posters */}
                      {(formData.poster9x16Urls || []).map((url, idx) => (
                        <div key={`p9-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.poster9x16Urls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, poster9x16Urls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-purple-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 9:16 Stretch Poster URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.poster9x16Urls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, poster9x16Urls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 4. 9:16 VERTICAL CLEAN BACKDROPS (DISTINCT FROM STRETCH POSTER) */}
                    <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-blue-200 flex items-center gap-2">
                            <span>9:16 Vertical Clean Backdrops</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300">9:16 Mobile Hero</span>
                          </label>
                          <p className="text-[10px] text-zinc-300">
                            <strong>Clean full-bleed background WITHOUT title typography.</strong> Used for Mobile Recommendation Screens.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.verticalBackdropUrls || [];
                            setFormData({ ...formData, verticalBackdropUrls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-blue-900/70 hover:bg-blue-800 text-blue-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      <div className="p-2 rounded bg-blue-950/50 border border-blue-700/40 text-[10px] text-blue-200">
                        Notice: <strong>9:16 Vertical Backdrop</strong> (clean without title) and <strong>9:16 Stretch Feed Title Poster</strong> (with title typography) are 2 completely different assets.
                      </div>

                      {/* Primary 9:16 Backdrop */}
                      <div>
                        <span className="text-[10px] text-blue-300 font-semibold block mb-0.5">Primary 9:16 Vertical Clean Backdrop (without title text)</span>
                        <input
                          type="text"
                          value={formData.verticalBackdropUrl || ''}
                          onChange={(e) => setFormData({ ...formData, verticalBackdropUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (Clean 9:16 vertical backdrop)"
                        />
                      </div>

                      {/* Additional 9:16 Clean Backdrops */}
                      {(formData.verticalBackdropUrls || []).map((url, idx) => (
                        <div key={`vb-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.verticalBackdropUrls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, verticalBackdropUrls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-blue-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 9:16 Vertical Backdrop URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.verticalBackdropUrls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, verticalBackdropUrls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 5. 2:3 VERTICAL TITLE-INCLUDED POSTERS */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-white flex items-center gap-2">
                            <span>2:3 Vertical Title-Included Posters</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">2:3 Grid & My List</span>
                          </label>
                          <p className="text-[10px] text-zinc-400">Mobile My List cards, Categories pages, and standard vertical poster grids.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.posterVerticalUrls || [];
                            setFormData({ ...formData, posterVerticalUrls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      {/* Primary 2:3 Poster */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Primary 2:3 Poster</span>
                        <input
                          type="text"
                          value={formData.posterVerticalUrl || ''}
                          onChange={(e) => setFormData({ ...formData, posterVerticalUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (Primary 2:3 poster)"
                        />
                      </div>

                      {/* Additional 2:3 Posters */}
                      {(formData.posterVerticalUrls || []).map((url, idx) => (
                        <div key={`pv-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.posterVerticalUrls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, posterVerticalUrls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 2:3 Poster URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.posterVerticalUrls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, posterVerticalUrls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 6. 1:2 ULTRA-TALL VERTICAL POSTERS */}
                    <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-white flex items-center gap-2">
                            <span>1:2 Ultra-Tall Vertical Posters</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">1:2 Ultra-Tall Feed</span>
                          </label>
                          <p className="text-[10px] text-zinc-400">Mobile stretch feed with 1:2 aspect ratio.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const prev = formData.poster1x2Urls || [];
                            setFormData({ ...formData, poster1x2Urls: [...prev, ''] });
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Image URL</span>
                        </button>
                      </div>

                      {/* Primary 1:2 Poster */}
                      <div>
                        <span className="text-[10px] text-zinc-400 font-semibold block mb-0.5">Primary 1:2 Ultra-Tall Poster</span>
                        <input
                          type="text"
                          value={formData.poster1x2Url || ''}
                          onChange={(e) => setFormData({ ...formData, poster1x2Url: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://images.unsplash.com/... (optional 1:2 poster)"
                        />
                      </div>

                      {/* Additional 1:2 Posters */}
                      {(formData.poster1x2Urls || []).map((url, idx) => (
                        <div key={`p12-url-${idx}`} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                              const updated = [...(formData.poster1x2Urls || [])];
                              updated[idx] = e.target.value;
                              setFormData({ ...formData, poster1x2Urls: updated });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                            placeholder={`Variant ${idx + 2} 1:2 Poster URL...`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.poster1x2Urls || []).filter((_, i) => i !== idx);
                              setFormData({ ...formData, poster1x2Urls: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                            title="Delete image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Show Title PNG Logo & Source Watermark */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">
                          Show Title PNG Logo (Clearart with transparent background)
                        </label>
                        <input
                          type="text"
                          value={formData.titleLogoUrl || ''}
                          onChange={(e) => setFormData({ ...formData, titleLogoUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://.../logo.png"
                        />
                      </div>
                      <div>
                        <label className="block text-zinc-400 font-semibold mb-1">
                          Source Watermark URL (Preview overlay only)
                        </label>
                        <input
                          type="text"
                          value={formData.sourceWatermarkUrl || ''}
                          onChange={(e) => setFormData({ ...formData, sourceWatermarkUrl: e.target.value })}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                          placeholder="https://.../source-watermark.png"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ========================================================================= */}
                  {/* LIVE ARTWORK CARD PREVIEWS (INTERACTIVE 16:9, 9:16 & BACKDROPS)            */}
                  {/* ========================================================================= */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#12141c] to-[#181b28] border border-red-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <h4 className="text-sm font-bold text-white tracking-tight">
                            Live Artwork Card Previews (16:9 & 9:16 Cards & Backdrops)
                          </h4>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Real-time rendered cards across every aspect ratio. Distinct cards for 9:16 Stretch Feed Title Poster vs 9:16 Vertical Clean Backdrop.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 self-start sm:self-auto">
                        Aspect Ratios: 16:9 · 9:16 · 2:3 · 1:2
                      </span>
                    </div>

                    {/* Previews Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* PREVIEW CARD 1: 16:9 LANDSCAPE TITLE CARD */}
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-white">16:9 Title Poster</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">16:9 Feed</span>
                          </div>
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10 shadow-md">
                            {formData.posterLandscapeUrl ? (
                              <img
                                src={formData.posterLandscapeUrl}
                                alt="16:9 Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">
                                No 16:9 Poster URL
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                              <span className="text-[11px] font-bold text-white truncate drop-shadow">{formData.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-400">
                          {1 + (formData.posterLandscapeUrls?.length || 0)} image(s) available
                        </div>
                      </div>

                      {/* PREVIEW CARD 2: 16:9 LANDSCAPE BACKDROP */}
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-white">16:9 Backdrop</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400">Hero / Player</span>
                          </div>
                          <div
                            className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10 shadow-md flex items-end p-2"
                            style={{
                              boxShadow: `0 0 20px ${(formData.recommendationBackdropColor || formData.ambientColor || '#b45309')}30`
                            }}
                          >
                            {formData.backdropUrl ? (
                              <img
                                src={formData.backdropUrl}
                                alt="Backdrop Preview"
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px]">
                                No 16:9 Backdrop URL
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                            {formData.titleLogoUrl ? (
                              <img src={formData.titleLogoUrl} alt="Logo" className="relative z-10 max-h-6 max-w-[120px] object-contain drop-shadow" />
                            ) : (
                              <span className="relative z-10 text-[11px] font-bold text-white truncate drop-shadow">{formData.title}</span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-zinc-400">
                          {1 + (formData.backdropUrls?.length || 0)} image(s) available
                        </div>
                      </div>

                      {/* PREVIEW CARD 3: 9:16 STRETCH FEED TITLE POSTER (WITH TITLE ARTWORK) */}
                      <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-800/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-purple-200">9:16 Stretch Feed Poster</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-900/60 text-purple-300">Stretch</span>
                          </div>
                          <div className="relative w-full aspect-[9/16] max-h-60 rounded-lg overflow-hidden bg-black border border-purple-500/30 shadow-md mx-auto">
                            {(formData.poster9x16Url || formData.posterLandscapeUrl) ? (
                              <img
                                src={formData.poster9x16Url || formData.posterLandscapeUrl}
                                alt="9:16 Stretch Feed Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] text-center p-2">
                                No 9:16 Poster URL
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-purple-900/90 text-purple-200 text-[8px] font-bold uppercase tracking-wider">
                              Title Artwork
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                              <span className="text-[10px] font-bold text-white line-clamp-1">{formData.title}</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-purple-300/80">
                          Used in carousels · {1 + (formData.poster9x16Urls?.length || 0)} image(s)
                        </div>
                      </div>

                      {/* PREVIEW CARD 4: 9:16 VERTICAL CLEAN BACKDROP (WITHOUT TITLE ARTWORK) */}
                      <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-blue-200">9:16 Clean Backdrop</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-300">Clean Hero</span>
                          </div>
                          <div className="relative w-full aspect-[9/16] max-h-60 rounded-lg overflow-hidden bg-black border border-blue-500/30 shadow-md mx-auto">
                            {(formData.verticalBackdropUrl || formData.backdropUrl) ? (
                              <img
                                src={formData.verticalBackdropUrl || formData.backdropUrl}
                                alt="9:16 Clean Backdrop Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px] text-center p-2">
                                No 9:16 Backdrop URL
                              </div>
                            )}
                            <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-blue-900/90 text-blue-200 text-[8px] font-bold uppercase tracking-wider">
                              Clean Backdrop
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-1.5 bg-blue-950/80 text-[8.5px] text-blue-200 text-center border-t border-blue-800/40">
                              No title typography
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-blue-300/80">
                          Mobile hero · {1 + (formData.verticalBackdropUrls?.length || 0)} image(s)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation & More Info Ambient Glow Accent (100% Original Backdrop, no darkness overlay) */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div>
                      <h5 className="text-xs font-bold text-white">Recommendation & More Info Ambient Glow Accent</h5>
                      <p className="text-[11px] text-zinc-400">
                        Backdrop images on the recommendation and more info page are 100% original. Choose ambient glow accent color for this title.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Color Picker */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                          Ambient Glow Accent Color (Hex)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={formData.recommendationBackdropColor || formData.ambientColor || '#b45309'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                recommendationBackdropColor: e.target.value,
                                ambientColor: e.target.value
                              });
                            }}
                            className="w-9 h-9 rounded bg-transparent cursor-pointer border-0"
                          />
                          <input
                            type="text"
                            value={formData.recommendationBackdropColor || formData.ambientColor || '#b45309'}
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                recommendationBackdropColor: e.target.value,
                                ambientColor: e.target.value
                              });
                            }}
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Live 100% Original Backdrop Preview */}
                      <div>
                        <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                          Live 100% Original Backdrop Preview
                        </label>
                        <div
                          className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-700 shadow-lg flex items-end p-2.5 select-none"
                          style={{
                            backgroundColor: '#000',
                            boxShadow: `0 0 25px ${(formData.recommendationBackdropColor || formData.ambientColor || '#b45309')}40`
                          }}
                        >
                          {formData.backdropUrl && (
                            <img
                              src={formData.backdropUrl}
                              alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                          <div className="relative z-10 text-white font-bold text-xs drop-shadow truncate">
                            {formData.title}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Embedded Player Backdrop, Darkness & Blurness (Configured once per show for all episodes & trailers) */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-red-500" />
                          <span>Embedded Player Backdrop, Darkness & Blurness</span>
                        </h5>
                        <p className="text-[11px] text-zinc-400">
                          Configure embedded player backdrop image, darkness slider, and blurness slider once for this show. Works for every episode and trailer in the player.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                          {formData.embedBackdropDarkness ?? 35}% Darkness
                        </span>
                        <span className="text-[11px] font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                          {formData.embedBackdropBlur ?? 0}px Blur
                        </span>
                      </div>
                    </div>

                    {/* Image URL Input + Copy Button */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-zinc-400 font-semibold">
                          Player Backdrop Image URL
                        </label>
                        {formData.backdropUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                embedBackdropUrl: formData.backdropUrl
                              });
                              notify('Copied main backdrop to embedded player backdrop');
                            }}
                            className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                          >
                            Use Main Backdrop
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={formData.embedBackdropUrl || ''}
                          onChange={(e) => setFormData({ ...formData, embedBackdropUrl: e.target.value })}
                          placeholder={formData.backdropUrl || 'https://images.unsplash.com/...'}
                          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                        />
                        {(formData.embedBackdropUrl || formData.backdropUrl) && (
                          <img
                            src={formData.embedBackdropUrl || formData.backdropUrl}
                            alt=""
                            className="w-12 h-8 rounded object-cover border border-zinc-700 shrink-0"
                          />
                        )}
                      </div>
                    </div>

                    {/* Darkness & Blurness Sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Darkness Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] text-zinc-400 font-semibold">
                            Backdrop Darkness
                          </label>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            {formData.embedBackdropDarkness ?? 35}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={formData.embedBackdropDarkness ?? 35}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              embedBackdropDarkness: parseInt(e.target.value) || 0
                            });
                          }}
                          className="w-full accent-red-600 cursor-pointer mt-1"
                        />
                      </div>

                      {/* Blurness Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[11px] text-zinc-400 font-semibold">
                            Backdrop Blurness
                          </label>
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            {formData.embedBackdropBlur ?? 0}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={24}
                          value={formData.embedBackdropBlur ?? 0}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              embedBackdropBlur: parseInt(e.target.value) || 0
                            });
                          }}
                          className="w-full accent-red-600 cursor-pointer mt-1"
                        />
                      </div>
                    </div>

                    {/* Live Embedded Player Preview */}
                    <div>
                      <div className="text-[11px] font-semibold text-zinc-400 mb-1.5">
                        Live Embedded Player Backdrop Preview:
                      </div>
                      <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black border border-zinc-700 shadow-2xl flex items-center justify-center select-none">
                        {/* Background Image with Blur */}
                        {(formData.embedBackdropUrl || formData.backdropUrl) && (
                          <img
                            src={formData.embedBackdropUrl || formData.backdropUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-all duration-200"
                            style={{
                              filter: (formData.embedBackdropBlur ?? 0) ? `blur(${formData.embedBackdropBlur}px)` : 'none'
                            }}
                          />
                        )}
                        {/* Darkness Overlay */}
                        <div
                          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-200"
                          style={{
                            opacity: (formData.embedBackdropDarkness ?? 35) / 100
                          }}
                        />
                        {/* Simulated Player UI */}
                        <div className="relative z-10 w-[70%] h-[70%] rounded-lg border border-white/20 bg-black/40 flex items-center justify-center backdrop-blur-xs">
                          <span className="text-xs font-bold text-white/90 drop-shadow flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5" />
                            <span>16:9 Video Player View</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Preview & Trailer Video Links with .m3u8 HLS Support */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-red-500" />
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          Preview Videos & Main Trailer Links
                        </h5>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono font-semibold">
                          Supports .mp4, .webm, &amp; .m3u8 (HLS)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        Configure separate video streams for hover popouts, detail hero previews, and the main trailer player.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {/* 1. Popout View Preview Link */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Popout View Preview Link
                          </label>
                          <span className="text-[10px] text-zinc-500">
                            Plays in feed card hover popout
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.popoutPreviewUrl ?? formData.hoverPreviewUrl ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              popoutPreviewUrl: e.target.value,
                              hoverPreviewUrl: e.target.value
                            })
                          }
                          placeholder="https://.../preview.m3u8 or .mp4"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                        />
                      </div>

                      {/* 2. More Info Modal Preview Link */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            More Info Modal Preview Link
                          </label>
                          <span className="text-[10px] text-zinc-500">
                            Plays in top hero header of details modal
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.detailPreviewUrl || ''}
                          onChange={(e) => setFormData({ ...formData, detailPreviewUrl: e.target.value })}
                          placeholder={formData.trailerUrl || 'https://.../more-info-preview.m3u8 or .mp4'}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                        />
                      </div>

                      {/* 3. Main Trailer Link */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-zinc-300">
                            Main Trailer Link
                          </label>
                          <span className="text-[10px] text-zinc-500">
                            Primary trailer played on Trailer click
                          </span>
                        </div>
                        <input
                          type="text"
                          value={formData.trailerUrl}
                          onChange={(e) => setFormData({ ...formData, trailerUrl: e.target.value })}
                          placeholder="https://.../official-trailer.m3u8 or .mp4"
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trailers & Clips Manager (1 default trailer, add more trailers, with 3 source types) */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">Trailers & Clips Section</h5>
                        <p className="text-[11px] text-zinc-400">
                          Configure trailers and video clips. By default 1 trailer is included; you can add additional trailers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentTrailers = (formData.trailersAndMore && formData.trailersAndMore.length > 0)
                            ? formData.trailersAndMore
                            : [
                                {
                                  id: `trailer-${Date.now()}-1`,
                                  title: `Official 4K Trailer: ${formData.title}`,
                                  duration: '2m 15s',
                                  thumbnailUrl: formData.posterLandscapeUrl || formData.backdropUrl || '',
                                  videoSourceType: 'direct' as VideoSourceType,
                                  videoUrl: formData.trailerUrl || 'https://vjs.zencdn.net/v/oceans.mp4'
                                }
                              ];
                          const newTrNumber = currentTrailers.length + 1;
                          const newClip: TrailerItem = {
                            id: `trailer-${Date.now()}-${newTrNumber}`,
                            title: `Trailer ${newTrNumber}: Teaser & Clip`,
                            duration: '1m 45s',
                            thumbnailUrl: formData.backdropUrl || formData.posterLandscapeUrl || '',
                            videoSourceType: 'direct' as VideoSourceType,
                            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
                          };
                          setFormData({
                            ...formData,
                            trailersAndMore: [...currentTrailers, newClip]
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Trailer</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {((formData.trailersAndMore && formData.trailersAndMore.length > 0)
                        ? formData.trailersAndMore
                        : [
                            {
                              id: `trailer-${formData.id}-main`,
                              title: `Official 4K Trailer: ${formData.title}`,
                              duration: '2m 15s',
                              thumbnailUrl: formData.posterLandscapeUrl || formData.backdropUrl || '',
                              videoSourceType: 'direct' as VideoSourceType,
                              videoUrl: formData.trailerUrl || 'https://vjs.zencdn.net/v/oceans.mp4'
                            }
                          ]
                      ).map((clip, cIdx, arr) => (
                        <div
                          key={clip.id}
                          className="p-3 bg-zinc-850 rounded-xl border border-zinc-700/60 space-y-2.5"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                Trailer #{cIdx + 1} Title
                              </label>
                              <input
                                type="text"
                                placeholder="Trailer Title (e.g. Official 4K Trailer)"
                                value={clip.title}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[cIdx] = { ...updated[cIdx], title: e.target.value };
                                  setFormData({ ...formData, trailersAndMore: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                Duration (e.g. 2m 15s)
                              </label>
                              <input
                                type="text"
                                placeholder="2m 15s"
                                value={clip.duration || ''}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[cIdx] = { ...updated[cIdx], duration: e.target.value };
                                  setFormData({ ...formData, trailersAndMore: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                Thumbnail Link
                              </label>
                              <input
                                type="text"
                                placeholder="https://images.unsplash.com/..."
                                value={clip.thumbnailUrl || ''}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[cIdx] = { ...updated[cIdx], thumbnailUrl: e.target.value };
                                  setFormData({ ...formData, trailersAndMore: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                Video Source Type
                              </label>
                              <select
                                value={clip.videoSourceType || 'direct'}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[cIdx] = {
                                    ...updated[cIdx],
                                    videoSourceType: e.target.value as VideoSourceType
                                  };
                                  setFormData({ ...formData, trailersAndMore: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500"
                              >
                                <option value="direct">Direct video link</option>
                                <option value="youtube">Enter YouTube embed video ID</option>
                                <option value="dailymotion">Enter Dailymotion embed video ID</option>
                                <option value="external">Open in new page target link</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                {clip.videoSourceType === 'youtube'
                                  ? 'YouTube Embed Video ID / URL'
                                  : clip.videoSourceType === 'dailymotion'
                                  ? 'Dailymotion Embed Video ID / URL'
                                  : clip.videoSourceType === 'external'
                                  ? 'External Target Link (Opens in new tab)'
                                  : 'Direct Video Stream Link'}
                              </label>
                              <input
                                type="text"
                                placeholder={
                                  clip.videoSourceType === 'youtube'
                                    ? 'e.g. dQw4w9WgXcQ or https://youtube.com/watch?v=...'
                                    : clip.videoSourceType === 'dailymotion'
                                    ? 'e.g. x8m1234 or https://dailymotion.com/video/...'
                                    : clip.videoSourceType === 'external'
                                    ? 'https://example.com/watch/target-video'
                                    : 'https://vjs.zencdn.net/v/oceans.mp4'
                                }
                                value={clip.videoUrl}
                                onChange={(e) => {
                                  const updated = [...arr];
                                  updated[cIdx] = { ...updated[cIdx], videoUrl: e.target.value };
                                  // Keep first trailer in sync with show.trailerUrl
                                  if (cIdx === 0) {
                                    setFormData({
                                      ...formData,
                                      trailerUrl: e.target.value,
                                      trailersAndMore: updated
                                    });
                                  } else {
                                    setFormData({ ...formData, trailersAndMore: updated });
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white text-xs outline-none focus:border-red-500 font-mono"
                              />
                            </div>
                            {arr.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = arr.filter((_, idx) => idx !== cIdx);
                                  setFormData({ ...formData, trailersAndMore: updated });
                                }}
                                className="self-end p-2 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Delete trailer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WHERE TO WATCH MODULE */}
              {activeFormTab === 'where_to_watch' && (
                <div className="space-y-4">
                  {/* Main Toggle Switch */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-white">Enable &quot;Where to Watch&quot; Module</h5>
                      <p className="text-[11px] text-zinc-400">
                        When enabled, exposes streaming providers (YouTube, Netflix, Tabii, Prime) to users.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.whereToWatchEnabled ?? true}
                        onChange={(e) => setFormData({ ...formData, whereToWatchEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {/* Providers List with Dynamic Add */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-300 font-mono">Configured Streaming Providers</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newProv: WhereToWatch = {
                            provider: 'other',
                            name: 'Tabii',
                            url: 'https://tabii.com',
                            bgColor: '#00d26a',
                            logoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=120&q=80',
                            freeOrSub: 'Official Channel'
                          };
                          setFormData({ ...formData, whereToWatch: [...formData.whereToWatch, newProv] });
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Provider</span>
                      </button>
                    </div>

                    {formData.whereToWatch.map((prov, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3.5 rounded-xl bg-zinc-850 border border-zinc-700/80 space-y-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Text Before Image
                            </label>
                            <input
                              type="text"
                              value={prov.textBefore ?? 'Watch on'}
                              onChange={(e) => {
                                const updated = [...formData.whereToWatch];
                                updated[pIdx].textBefore = e.target.value;
                                setFormData({ ...formData, whereToWatch: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                              placeholder="e.g. Watch on"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Source Image Link (Icon/Logo)
                            </label>
                            <input
                              type="text"
                              value={prov.logoUrl || ''}
                              onChange={(e) => {
                                const updated = [...formData.whereToWatch];
                                updated[pIdx].logoUrl = e.target.value;
                                setFormData({ ...formData, whereToWatch: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                              placeholder="https://.../logo.png"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Text After Image
                            </label>
                            <input
                              type="text"
                              value={prov.textAfter ?? prov.name ?? ''}
                              onChange={(e) => {
                                const updated = [...formData.whereToWatch];
                                updated[pIdx].textAfter = e.target.value;
                                setFormData({ ...formData, whereToWatch: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                              placeholder="e.g. Netflix, YouTube"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Platform Name (Fallback)
                            </label>
                            <input
                              type="text"
                              value={prov.name}
                              onChange={(e) => {
                                const updated = [...formData.whereToWatch];
                                updated[pIdx].name = e.target.value;
                                setFormData({ ...formData, whereToWatch: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                              placeholder="e.g. YouTube, Netflix"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Background Color (Hex)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={prov.bgColor || '#E50914'}
                                onChange={(e) => {
                                  const updated = [...formData.whereToWatch];
                                  updated[pIdx].bgColor = e.target.value;
                                  setFormData({ ...formData, whereToWatch: updated });
                                }}
                                className="w-8 h-8 rounded bg-transparent cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={prov.bgColor || '#E50914'}
                                onChange={(e) => {
                                  const updated = [...formData.whereToWatch];
                                  updated[pIdx].bgColor = e.target.value;
                                  setFormData({ ...formData, whereToWatch: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Text Color (Hex)
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={prov.textColor || '#ffffff'}
                                onChange={(e) => {
                                  const updated = [...formData.whereToWatch];
                                  updated[pIdx].textColor = e.target.value;
                                  setFormData({ ...formData, whereToWatch: updated });
                                }}
                                className="w-8 h-8 rounded bg-transparent cursor-pointer border-none"
                              />
                              <input
                                type="text"
                                value={prov.textColor || '#ffffff'}
                                onChange={(e) => {
                                  const updated = [...formData.whereToWatch];
                                  updated[pIdx].textColor = e.target.value;
                                  setFormData({ ...formData, whereToWatch: updated });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] text-zinc-400 font-semibold mb-1">
                              Access Type
                            </label>
                            <select
                              value={prov.freeOrSub || 'Subscription'}
                              onChange={(e) => {
                                const updated = [...formData.whereToWatch];
                                updated[pIdx].freeOrSub = e.target.value as any;
                                setFormData({ ...formData, whereToWatch: updated });
                              }}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                              <option value="Official Channel">Official Channel</option>
                              <option value="Subscription">Subscription</option>
                              <option value="Free with Ads">Free with Ads</option>
                              <option value="Free Stream">Free Stream</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Direct Watch Link URL (https://...)"
                            value={prov.url}
                            onChange={(e) => {
                              const updated = [...formData.whereToWatch];
                              updated[pIdx].url = e.target.value;
                              setFormData({ ...formData, whereToWatch: updated });
                            }}
                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.whereToWatch.filter((_, idx) => idx !== pIdx);
                              setFormData({ ...formData, whereToWatch: updated });
                            }}
                            className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400"
                            title="Delete provider"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: PLAYBACK & EPISODE ARCHITECTURE */}
              {activeFormTab === 'episodes_stream' && (
                <div className="space-y-4">
                  {formData.type === 'movie' ? (
                    /* FOR MOVIES: Movie Video Source Toggle */
                    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-white">Movie Video Stream Source</h5>
                          <p className="text-[11px] text-zinc-400">
                            When toggled ON, clicking &quot;Play&quot; opens direct stream. When OFF, defaults to &quot;Where to Watch&quot; providers.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.movieStreamEnabled ?? true}
                            onChange={(e) => setFormData({ ...formData, movieStreamEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      {formData.movieStreamEnabled && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                          <div>
                            <label className="block text-zinc-300 font-semibold mb-1 text-xs">
                              Movie Source Type (4 Playback Modes)
                            </label>
                            <select
                              value={formData.movieStreamType || 'direct'}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  movieStreamType: e.target.value as VideoSourceType
                                })
                              }
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-red-500 font-medium"
                            >
                              <option value="direct">Direct video link (.mp4 / stream)</option>
                              <option value="youtube">YouTube (Embed player)</option>
                              <option value="dailymotion">Dailymotion (Embed player)</option>
                              <option value="external">Direct target link (Plays official trailer on site)</option>
                            </select>
                            {formData.movieStreamType === 'external' && (
                              <p className="text-[11px] text-amber-400/90 mt-1.5 leading-relaxed">
                                ℹ️ Direct target link active: Clicking play on hero recommendation, card popout preview, or more info modal (+backdrop) will safely load the official trailer for viewers.
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-zinc-400 font-semibold mb-1 text-xs">
                              {formData.movieStreamType === 'youtube'
                                ? 'YouTube Embed Video ID / URL'
                                : formData.movieStreamType === 'dailymotion'
                                ? 'Dailymotion Embed Video ID / URL'
                                : formData.movieStreamType === 'external'
                                ? 'Direct Target URL (External Link)'
                                : 'Direct Video Stream Link (.mp4 / stream URL)'}
                            </label>
                            <input
                              type="text"
                              value={formData.movieStreamUrl || ''}
                              onChange={(e) => setFormData({ ...formData, movieStreamUrl: e.target.value })}
                              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                              placeholder={
                                formData.movieStreamType === 'youtube'
                                  ? 'e.g. dQw4w9WgXcQ or https://youtube.com/watch?v=...'
                                  : formData.movieStreamType === 'dailymotion'
                                  ? 'e.g. x8m1234 or https://dailymotion.com/video/...'
                                  : formData.movieStreamType === 'external'
                                  ? 'https://example.com/watch/target-movie'
                                  : 'https://vjs.zencdn.net/v/oceans.mp4'
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* FOR SHOWS: Episodic Toggle & Season / Episode Manager */
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-white">Episodic Architecture (Episodes Toggle)</h5>
                          <p className="text-[11px] text-zinc-400">
                            Controls visibility of episodes on the detail page and video carousel.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.hasEpisodicContent ?? true}
                            onChange={(e) => setFormData({ ...formData, hasEpisodicContent: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                      </div>

                      {formData.hasEpisodicContent && (
                        <div className="space-y-3">
                          {/* Season Selector Bar */}
                          <div className="flex items-center justify-between bg-zinc-850 p-2.5 rounded-xl border border-zinc-700">
                            <div className="flex items-center gap-2">
                              {(formData.seasons || []).map((s, sIdx) => (
                                <button
                                  key={s.seasonNumber}
                                  type="button"
                                  onClick={() => setSelectedSeasonIdx(sIdx)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                    selectedSeasonIdx === sIdx
                                      ? 'bg-red-600 text-white'
                                      : 'bg-zinc-800 text-zinc-300 hover:text-white'
                                  }`}
                                >
                                  Season {s.seasonNumber} ({s.episodes.length} Ep)
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const currentSeasons = formData.seasons || [];
                                const newSeasonNum = currentSeasons.length + 1;
                                const newSeason: Season = {
                                  seasonNumber: newSeasonNum,
                                  title: `Season ${newSeasonNum}`,
                                  episodes: []
                                };
                                setFormData({
                                  ...formData,
                                  seasons: [...currentSeasons, newSeason]
                                });
                                setSelectedSeasonIdx(currentSeasons.length);
                              }}
                              className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Season</span>
                            </button>
                          </div>

                          {/* Episodes inside current season */}
                          {formData.seasons && formData.seasons[selectedSeasonIdx] && (
                            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="text-xs font-bold text-white">
                                  Episodes for Season {formData.seasons[selectedSeasonIdx].seasonNumber}
                                </h5>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const seasonsClone = [...formData.seasons!];
                                    const epCount = seasonsClone[selectedSeasonIdx].episodes.length + 1;
                                    const newEp: Episode = {
                                      id: `ep-${Date.now()}-${epCount}`,
                                      seasonNumber: seasonsClone[selectedSeasonIdx].seasonNumber,
                                      episodeNumber: epCount,
                                      title: `Episode ${epCount}`,
                                      subheading: '',
                                      duration: '45m',
                                      thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80',
                                      synopsis: '',
                                      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4'
                                    };
                                    seasonsClone[selectedSeasonIdx].episodes.push(newEp);
                                    setFormData({ ...formData, seasons: seasonsClone });
                                  }}
                                  className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Episode</span>
                                </button>
                              </div>

                              <div className="space-y-3">
                                {formData.seasons[selectedSeasonIdx].episodes.map((ep, epIdx) => (
                                  <div
                                    key={ep.id}
                                    className="p-3 bg-zinc-850 rounded-xl border border-zinc-750 space-y-2"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Ep #{ep.episodeNumber} Title
                                        </label>
                                        <input
                                          type="text"
                                          value={ep.title}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].title = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Subheading / Tagline
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. S1:E1 Part 1 or Subtitle"
                                          value={ep.subheading || ''}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].subheading = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Duration (e.g. 45m)
                                        </label>
                                        <input
                                          type="text"
                                          value={ep.duration}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].duration = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Episode Thumbnail URL
                                        </label>
                                        <input
                                          type="text"
                                          value={ep.thumbnailUrl}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].thumbnailUrl = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white font-mono"
                                        />
                                      </div>
                                    </div>

                                    {/* Episode Synopsis */}
                                    <div>
                                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                        Episode Synopsis / Description
                                      </label>
                                      <input
                                        type="text"
                                        placeholder="Brief summary of what happens in this episode..."
                                        value={ep.synopsis || ''}
                                        onChange={(e) => {
                                          const sc = [...formData.seasons!];
                                          sc[selectedSeasonIdx].episodes[epIdx].synopsis = e.target.value;
                                          setFormData({ ...formData, seasons: sc });
                                        }}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-red-500"
                                      />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                                      <div className="sm:col-span-4">
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Video Source Type
                                        </label>
                                        <select
                                          value={ep.videoSourceType || 'direct'}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].videoSourceType = e.target.value as VideoSourceType;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-red-500"
                                        >
                                          <option value="direct">Direct video link</option>
                                          <option value="youtube">Enter YouTube embed video ID</option>
                                          <option value="dailymotion">Enter Dailymotion embed video ID</option>
                                          <option value="external">Open in new page target link</option>
                                        </select>
                                      </div>
                                      <div className="sm:col-span-6">
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          {ep.videoSourceType === 'youtube'
                                            ? 'YouTube Embed Video ID / URL'
                                            : ep.videoSourceType === 'dailymotion'
                                            ? 'Dailymotion Embed Video ID / URL'
                                            : ep.videoSourceType === 'external'
                                            ? 'External Target Link (Opens in new tab)'
                                            : 'Direct Video Stream Link'}
                                        </label>
                                        <input
                                          type="text"
                                          placeholder={
                                            ep.videoSourceType === 'youtube'
                                              ? 'e.g. dQw4w9WgXcQ or https://youtube.com/watch?v=...'
                                              : ep.videoSourceType === 'dailymotion'
                                              ? 'e.g. x8m1234 or https://dailymotion.com/video/...'
                                              : ep.videoSourceType === 'external'
                                              ? 'https://example.com/watch/target-episode'
                                              : 'https://vjs.zencdn.net/v/oceans.mp4'
                                          }
                                          value={ep.videoUrl}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].videoUrl = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-red-500"
                                        />
                                      </div>
                                      <div className="sm:col-span-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes = sc[selectedSeasonIdx].episodes.filter(
                                              (_, idx) => idx !== epIdx
                                            );
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full py-1.5 rounded bg-zinc-800 hover:bg-red-950 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-colors"
                                        >
                                          Delete Ep
                                        </button>
                                      </div>
                                    </div>

                                    {/* Start time, End time, and Player Background Image for YouTube / Dailymotion */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-700/60">
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Start Time (sec / mm:ss)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 15 or 1:30"
                                          value={ep.startTime || ''}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].startTime = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-red-500 font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          End Time (sec / mm:ss)
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. 180 or 3:00"
                                          value={ep.endTime || ''}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].endTime = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-red-500 font-mono"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">
                                          Player Background Image Link
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="https://images.unsplash.com/..."
                                          value={ep.playerBgImageUrl || ''}
                                          onChange={(e) => {
                                            const sc = [...formData.seasons!];
                                            sc[selectedSeasonIdx].episodes[epIdx].playerBgImageUrl = e.target.value;
                                            setFormData({ ...formData, seasons: sc });
                                          }}
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white outline-none focus:border-red-500 font-mono"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: EMBEDDED BLOG / ARTICLE EDITOR */}
              {activeFormTab === 'blog' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-zinc-400 font-semibold mb-1">Article Heading</label>
                      <input
                        type="text"
                        value={formData.blog?.heading || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            blog: { ...formData.blog, heading: e.target.value }
                          })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                        placeholder="e.g. Inside the Ottoman Epic Production"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Author</label>
                      <input
                        type="text"
                        value={formData.blog?.author || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            blog: { ...formData.blog, author: e.target.value }
                          })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Article Slug</label>
                      <input
                        type="text"
                        value={formData.blog?.slug || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            blog: { ...formData.blog, slug: e.target.value }
                          })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono"
                        placeholder="e.g. article-ertugrul-production"
                      />
                    </div>
                    <div>
                      <label className="block text-zinc-400 font-semibold mb-1">Hero Image URL</label>
                      <input
                        type="text"
                        value={formData.blog?.heroImage || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            blog: { ...formData.blog, heroImage: e.target.value }
                          })
                        }
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Dynamic Editorial Sections */}
                  <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-white">Editorial Sections & Paragraphs</h5>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSections = formData.blog?.sections || [];
                          const newSec: BlogSection = {
                            title: 'New Section Title',
                            content: 'Paragraph content details regarding set design, costume, or direction.'
                          };
                          setFormData({
                            ...formData,
                            blog: { ...formData.blog, sections: [...currentSections, newSec] }
                          });
                        }}
                        className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Section</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(formData.blog?.sections || []).map((sec, secIdx) => (
                        <div
                          key={secIdx}
                          className="p-3 bg-zinc-850 rounded-lg border border-zinc-750 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={sec.title}
                              onChange={(e) => {
                                const sc = [...(formData.blog?.sections || [])];
                                sc[secIdx].title = e.target.value;
                                setFormData({ ...formData, blog: { ...formData.blog, sections: sc } });
                              }}
                              className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-white"
                              placeholder="Section Subtitle"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const sc = (formData.blog?.sections || []).filter((_, idx) => idx !== secIdx);
                                setFormData({ ...formData, blog: { ...formData.blog, sections: sc } });
                              }}
                              className="p-1.5 rounded hover:bg-red-950 text-zinc-400 hover:text-red-400"
                              title="Delete section"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <textarea
                            rows={3}
                            value={sec.content}
                            onChange={(e) => {
                              const sc = [...(formData.blog?.sections || [])];
                              sc[secIdx].content = e.target.value;
                              setFormData({ ...formData, blog: { ...formData.blog, sections: sc } });
                            }}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white"
                            placeholder="Rich paragraph editorial content..."
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="p-4 border-t border-zinc-800 bg-[#161924] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setModalMode('none');
                  setFormData(null);
                }}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveFormData}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>Save {formData.type === 'movie' ? 'Movie' : 'Show'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FEED SHOWS MULTI-SELECT ASSIGNMENT MODAL                                  */}
      {/* ========================================================================= */}
      {assigningFeed && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-[#13151f] border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-zinc-800 bg-[#161826] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Assign Titles to Feed: {assigningFeed.title}
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Select which shows and movies appear in this homepage row.
                </span>
              </div>
              <button
                onClick={() => setAssigningFeed(null)}
                className="w-7 h-7 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-zinc-800 bg-zinc-900/60">
              <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white">
                <Search className="w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Filter shows by name..."
                  value={feedSearchTerm}
                  onChange={(e) => setFeedSearchTerm(e.target.value)}
                  className="bg-transparent text-white outline-none w-full"
                />
              </div>
            </div>

            {/* Shows Checkbox List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
              {shows
                .filter((s) => s.title.toLowerCase().includes(feedSearchTerm.toLowerCase()))
                .map((show) => {
                  const isAssigned = (assigningFeed.showIds || []).includes(show.id);
                  return (
                    <div
                      key={show.id}
                      onClick={() => toggleShowInFeed(assigningFeed.id, show.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                        isAssigned
                          ? 'bg-red-950/40 border-red-800 text-white'
                          : 'bg-zinc-850 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => {}}
                          className="rounded accent-red-600"
                        />
                        <div className="w-12 h-8 rounded overflow-hidden bg-black shrink-0">
                          <img
                            src={show.posterLandscapeUrl}
                            alt={show.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{show.title}</p>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {show.type.toUpperCase()} · {show.durationOrSeasons}
                          </span>
                        </div>
                      </div>

                      <span className="text-[11px] font-mono text-amber-400">
                        {show.points} pts
                      </span>
                    </div>
                  );
                })}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-[#161826] flex justify-end">
              <button
                onClick={() => setAssigningFeed(null)}
                className="px-5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* IN-APP PERMANENT DELETION CONFIRMATION MODAL                              */}
      {/* ========================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#161822] border border-red-800/80 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Confirm {deleteConfirmTarget.type === 'show' ? 'Title Deletion' : 'Feed Row Deletion'}
                </h3>
                <span className="text-xs text-zinc-400">
                  This action cannot be undone.
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
              Are you sure you want to permanently remove <strong className="text-white">&quot;{deleteConfirmTarget.title}&quot;</strong> from {deleteConfirmTarget.type === 'show' ? 'the streaming catalog' : 'homepage feeds'}?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-950/50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
