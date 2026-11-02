export type MediaType = 'series' | 'movie';

export type VideoSourceType = 'direct' | 'youtube' | 'dailymotion' | 'external';

export interface CastMember {
  id: string;             // Persistent identifier (e.g., tmdbId string like "cast-120879" or standardized name slug)
  name: string;           // Canonical actor name (e.g., "Engin Altan Düzyatan")
  character: string;      // Specific role in THIS show/movie (e.g., "Ertuğrul Bey")
  profileUrl: string;     // Actor headshot image URL
  order?: number;         // Billing order: 0-1 = Main Lead, 2-4 = Supporting Lead, 5+ = Recurring/Minor
  tmdbId?: number;
  biography?: string;
  birthYear?: string;
}

export interface Episode {
  id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  subheading?: string; // e.g. "The Beginning of the Legend" or episode tagline
  duration: string; // e.g. "48m"
  thumbnailUrl: string;
  synopsis: string;
  videoUrl: string;
  videoSourceType?: VideoSourceType; // 'direct' | 'youtube' | 'dailymotion' | 'external'
  releaseDate?: string;
  startTime?: string; // in seconds e.g. "30" or "0:30"
  endTime?: string; // in seconds e.g. "120" or "2:00"
  playerBgImageUrl?: string; // custom backdrop for embed player page
}

export interface Season {
  seasonNumber: number;
  title: string;
  episodes: Episode[];
}

export interface WhereToWatch {
  provider: 'youtube' | 'netflix' | 'tabii' | 'prime' | 'other';
  name: string;
  url: string;
  iconType?: string;
  logoUrl?: string;
  bgColor?: string;
  textColor?: string;
  textBefore?: string; // Text before image, e.g. "Watch on"
  textAfter?: string; // Text after image, e.g. "YouTube"
  freeOrSub?: 'Free with Ads' | 'Subscription' | 'Official Channel' | 'Free Stream';
}

export interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  description?: string;
  genreKeywords?: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  avatarUrl: string;
  handle?: string;
  email?: string;
  assignedShowIds?: string[]; // IDs of movies / series assigned to this profile
}

export interface PlayEvent {
  timestamp: number; // Unix epoch ms
}

export interface BlogSection {
  title: string;
  content: string;
  imageUrl?: string;
  quote?: string;
}

export interface TrailerItem {
  id: string;
  title: string;
  thumbnailUrl?: string;
  videoUrl: string;
  videoSourceType?: VideoSourceType; // 'direct' | 'youtube' | 'dailymotion'
  duration?: string;
  startTime?: string;
  endTime?: string;
  playerBgImageUrl?: string;
}

export interface Show {
  id: string;
  title: string;
  turkishTitle?: string;
  type: MediaType;
  
  // TMDB & Common Metadata
  tmdbId?: number;
  slug?: string;
  announcementPill?: string; // 5-7 words pill displayed over recommendation banner
  is_recommended?: boolean; // recommendation eligibility for hero and featured strips
  categories?: string[]; // category tags
  supportingTitles?: string[]; // Multiple supporting/alternative titles used to search for this show/movie

  // Assets & Media URLs
  backdropUrl: string; // 16:9 Landscape Backdrop
  backdropUrl2?: string; // Secondary Landscape Backdrop for A/B discovery (4-day monthly rotation)
  backdropUrls?: string[]; // Multiple 16:9 Landscape Backdrops
  verticalBackdropUrl?: string; // 9:16 Vertical Backdrop for mobile
  verticalBackdropUrl2?: string; // Secondary Vertical Backdrop for mobile
  verticalBackdropUrls?: string[]; // Multiple 9:16 Vertical Backdrops (mobile recommendation)
  posterLandscapeUrl: string; // 16:9 Title-Included Poster
  posterLandscapeUrl2?: string; // Secondary 16:9 Title-Included Poster
  posterLandscapeUrls?: string[]; // Multiple 16:9 Title-Included Posters
  posterVerticalUrl?: string; // 2:3 Vertical Title-Included Poster
  posterVerticalUrl2?: string; // Secondary 2:3 Vertical Title-Included Poster
  posterVerticalUrls?: string[]; // Multiple 2:3 Vertical Posters
  poster9x16Url?: string; // 9:16 Vertical Title-Included Poster (Stretch Feeds)
  poster9x16Urls?: string[]; // Multiple 9:16 Stretch Feed Title Posters
  poster1x2Url?: string; // 1:2 Vertical Title-Included Poster (Mobile Ultra-Tall Stretch Feeds)
  poster1x2Urls?: string[]; // Multiple 1:2 Ultra-Tall Title Posters
  posterUrl?: string; // Generic / vertical poster fallback
  titleLogoUrl?: string; // Transparent PNG logo / clearart
  sourceWatermarkUrl?: string; // Optional Source Watermark displayed on preview video only (top-left on recommendation, top-right on popout preview)
  trailerUrl: string; // Main trailer / extended clip (.mp4, .webm, or .m3u8)
  hoverPreviewUrl?: string; // Legacy / general hover preview (.mp4, .webm, or .m3u8)
  popoutPreviewUrl?: string; // Dedicated popout view preview link (.mp4, .webm, or .m3u8)
  detailPreviewUrl?: string; // Dedicated more info modal preview link (.mp4, .webm, or .m3u8)
  trailersAndMore?: TrailerItem[]; // Dynamic additional trailers / clips array

  logoText: string;
  logoSubtext?: string;
  synopsis: string;
  shortDescription: string;
  description?: string; // Generic description alias
  ambientColor: string; // Hex color for hero/card ambient glow e.g. '#b45309'
  ambientGlowRgb: string; // e.g. '180, 83, 9'
  recommendationBackdropColor?: string; // Custom backdrop glow color override
  backdropDarkness?: number; // Custom backdrop darkness percentage (0 - 100)
  embedBackdropUrl?: string; // Embedded player backdrop image
  embedBackdropDarkness?: number; // Embedded player backdrop darkness percentage (0 - 100)
  embedBackdropBlur?: number; // Embedded player backdrop blur in pixels (0 - 24)
  releaseYear: string;
  maturityRating: string; // '16+', '18+', '13+'
  maturityDetails?: string; // e.g. 'violence, sex, nudity, language, substances, self-harm'
  matchScore: number; // e.g. 98%
  imdbRating: number; // e.g. 9.1
  imdbVotes?: string | number; // e.g. '301,875'
  director?: string;
  directorProfileUrl?: string;
  durationOrSeasons: string; // '5 Seasons' or '2h 18m'
  genres: string[];
  thisSeriesIs?: string[]; // e.g. ['Scandalous', 'Thought-provoking', 'Steamy']
  qualityBadges: string[]; // ['4K Ultra HD', 'HDR', 'Dolby Atmos', '5.1']
  
  // Scoring Architecture
  points: number; // Legacy & current score
  all_time_score?: number; // User likes (+100) + plays (+1)
  play_events?: PlayEvent[]; // Timestamped play logs for 24-Hour Top 10 metric

  // Where to watch module
  whereToWatchEnabled?: boolean;
  whereToWatch: WhereToWatch[];

  // Episodic / Movie Architecture
  hasEpisodicContent?: boolean; // Toggle for Shows
  seasons?: Season[];
  movieStreamEnabled?: boolean; // Single Movie Video Source Toggle
  movieStreamUrl?: string; // Direct movie video stream URL
  movieStreamType?: VideoSourceType; // 'direct' | 'youtube' | 'dailymotion'

  cast: CastMember[];
  blog: {
    heading: string;
    publishedDate: string;
    author: string;
    readTime: string;
    heroImage: string;
    sections: BlogSection[];
    trivia: string[];
    slug?: string;
  };
}

export interface FeedConfig {
  id: string;
  title: string;
  subtitle?: string;
  categoryKey:
    | 'as_you_watch_dirilis'
    | 'you_must_like_this'
    | 'top_10_series'
    | 'top_10_movies'
    | 'top_10_24h'
    | 'best_of_engin_altan'
    | 'best_of_kivanc'
    | 'romantic_series'
    | 'bingey_thrillers'
    | 'all_shows'
    | 'custom'
    | (string & {});
  filterActor?: string;
  filterGenre?: string;
  filterType?: MediaType;
  showRankNumbers?: boolean;
  enabled: boolean;
  showIds?: string[]; // Explicit multi-select shows assigned to this feed
  displayOrder?: number;
  isCuratedByAdmin?: boolean;

  // Multi-source dropdown configuration (1 or 2 dropdowns per row)
  sourceType1?: 'genre' | 'categories' | 'custom';
  selectedGenres1?: string[];
  selectedCategories1?: string[];
  selectedShowIds1?: string[];

  hasSecondSource?: boolean;
  sourceType2?: 'genre' | 'categories' | 'custom';
  selectedGenres2?: string[];
  selectedCategories2?: string[];
  selectedShowIds2?: string[];

  // Special Feed configuration
  isSpecialFeed?: boolean;
  isStretchableFeed?: boolean; // Optional stretchable feed row where cards expand from 2:3 to 16:9 on hover
  specialLogoUrl?: string;
  specialTagline?: string;
  specialExploreText?: string;
  specialExploreAction?: 'showcase' | 'category'; // Action when user clicks Explore All
  specialExploreCategory?: string; // Target category key if specialExploreAction is 'category'
  specialBgImageUrl?: string;
  specialBgDarkness?: number; // 0 to 100 percentage
  specialBgColor?: string;
}

export interface ProfilePictureGroup {
  id: string;
  title?: string;
  showId?: string;
  showTitle?: string;
  sourceType?: 'movie' | 'series' | 'custom';
  type?: 'movie' | 'series' | 'custom';
  images: string[]; // array of image link URLs
  enabled?: boolean;
  displayOrder?: number;
}

export interface AdminSettings {
  enableWhereToWatch: boolean;
  enableHorizontalEpisodes: boolean;
  autoplayHoverTrailers: boolean;
  ambientGlowIntensity: 'high' | 'medium' | 'subtle';
  dailymotionScriptUrl?: string;
  useCustomLogo?: boolean;
  customLogoUrl?: string;
  platformName?: string;
  backdropDarkness?: number; // 0 to 100 percentage
  enableStretchableCards?: boolean; // Hover expands portrait poster into 16:9 landscape with logo and preview
  profilePictureGroups?: ProfilePictureGroup[];

  // Mobile Layout Options (Mobile view only)
  mobileNavbarStyle?: 'floating' | 'bottom_fixed'; // Floating pill island vs full-width fixed bottom dock
  mobileNavbarShowLabels?: boolean; // Show or hide text labels under mobile navbar buttons
  mobileRecommendationStyle?: 'portrait' | 'landscape'; // 2:3 portrait card vs 16:9 widescreen preview
  showTop10Badges?: boolean; // Toggle displaying red TOP 10 badges on cards and details
}

export interface WatchHistoryItem {
  showId: string;
  showTitle: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  videoUrl: string;
  videoSourceType?: VideoSourceType;
  updatedAt: number;
  thumbnailUrl?: string;
  progressPercent?: number;
  completed?: boolean;
}

export interface NotificationItem {
  id: string;
  showId?: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  timeAgo: string;
  unread: boolean;
  createdAt?: number;
}
