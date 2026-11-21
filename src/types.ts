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
  squareLogoUrl?: string; // Square rounded logo for full size more info page
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
  narrowLandscapeUrl?: string;
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
  isSpecialSingleFeedEligible?: boolean; // special single feed banner eligibility on desktop homepage
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
  titleLogoUrl?: string; // Standard 2.5:1 (~650x260) Transparent PNG logo / clearart
  centralLogoUrl?: string; // Optional centered PNG logo for Mobile 2:3 Recommendation & Modern Top 10 Rank cards (falls back to titleLogoUrl)
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
  portraitAmbientColor?: string; // Optional ambient glow color override for 9:16 portrait cards
  verticalBackdropAmbientColor?: string; // Optional ambient glow for 9:16 vertical backdrop
  posterLandscapeAmbientColor?: string; // Optional ambient glow for 16:9 poster
  posterVerticalAmbientColor?: string; // Optional ambient glow for 2:3 vertical poster
  poster1x2AmbientColor?: string; // Optional ambient glow for 1:2 ultra-tall poster

  // Granular Desktop Layout Images & Individual Ambiance Colors
  desktopRecommendationBackdropUrl?: string; // Desktop recommendation hero backdrop (16:9, 1920x1080)
  desktopRecommendationBackdropAmbiance?: string; // Desktop recommendation backdrop ambiance
  desktopNormalFeed16x9Url?: string; // 16:9 Normal feed in desktop (1280x720) - also used for Continue Watching & My List
  desktopNormalFeed16x9Ambiance?: string; // 16:9 Normal feed ambiance
  desktopTop10Image2x3Url?: string; // 2:3 Top 10 list image (640x960)
  desktopTop10Image2x3Ambiance?: string; // 2:3 Top 10 list ambiance
  desktopTop10BackdropUrl?: string; // 16:9 Top 10 feed backdrop image (1920x1080)
  desktopTop10BackdropAmbiance?: string; // Top 10 backdrop ambiance
  moreInfoBackdropUrl?: string; // More info page backdrop image (16:9, 1920x1080) - paired with Desktop Recommendation
  moreInfoBackdropAmbiance?: string; // More info backdrop ambiance
  stretchableFeedPoster9x16Url?: string; // 9:16 Stretchable feed poster with title art (720x1280) - paired with hover backdrop
  stretchableFeedPoster9x16Ambiance?: string; // 9:16 Stretchable feed poster ambiance
  stretchableFeedBackdropUrl?: string; // 16:9 Landscape stretchable feed backdrop image on hover (1920x1080 / 1280x720) - paired with poster
  stretchableFeedBackdropAmbiance?: string; // 16:9 Stretchable feed backdrop ambiance
  desktopSpecialSingleFeedUrl?: string; // Image for single special feed in desktop (16:9, 1920x1080)
  desktopSpecialSingleFeedAmbiance?: string; // Single special feed ambiance
  fullSizeMoreInfoFixedWidthPoster?: boolean; // Full Size More Info Page: constrain poster to right 58% with left glare matching Single Special Feed
  fullSizeMoreInfoFixedWidthVideo?: boolean; // Full Size More Info Page: constrain video preview to right 58% with left glare matching Single Special Feed

  // Paired Artwork Collections (Desktop Rec + More Info, and Stretchable Poster + Hover Backdrop)
  desktopRecAndMoreInfoPairs?: {
    id: string;
    recBackdropUrl: string;
    moreInfoBackdropUrl: string;
    ambianceColor: string;
  }[];
  activeRecPairIndex?: number;

  stretchableFeedPairs?: {
    id: string;
    posterUrl: string;
    hoverBackdropUrl: string; // 16:9 Landscape hover backdrop image
    ambianceColor: string;
  }[];
  activeStretchPairIndex?: number;

  // Granular Mobile Layout Images & Individual Ambiance Colors
  mobileRecommendation9x16BackdropUrl?: string; // Vertical recommendation backdrop (9:16, 720x1280)
  mobileRecommendation9x16BackdropAmbiance?: string; // Mobile recommendation 9:16 backdrop ambiance
  mobileRecommendation16x9BackdropUrl?: string; // Horizontal recommendation backdrop (16:9, 1280x720)
  mobileRecommendation16x9BackdropAmbiance?: string; // Mobile recommendation 16:9 backdrop ambiance
  mobileNoPreviewPosterHeroUrl?: string; // Style 1: Full-Bleed 9:14 Poster Hero (No-Preview Mobile Rec)
  mobileNoPreviewPosterHeroAmbiance?: string; // Style 1 Ambiance
  mobileNoPreviewCard2x3Url?: string; // Style 2: Floating 2:3 Portrait Card Hero (No-Preview Mobile Rec)
  mobileNoPreviewCard2x3Ambiance?: string; // Style 2 Ambiance
  mobileNormalFeed2x3Url?: string; // Mobile normal feed 2:3 poster (640x960)
  mobileNormalFeed2x3Ambiance?: string; // Mobile normal feed 2:3 poster ambiance
  mobileSpecialSingleFeedUrl?: string; // Single special feed backdrop in mobile (16:9 / 9:16)
  mobileSpecialSingleFeedAmbiance?: string;
  mobileMoreInfoBackdropUrl?: string; // Mobile more info page backdrop image (16:9 / 9:16)
  mobileMoreInfoBackdropAmbiance?: string; // Mobile more info backdrop ambiance
  mobileTallStretchPosterUrl?: string; // Tall stretchable feed poster (9:16 / 1:2, 400x800)
  mobileTallStretchPosterAmbiance?: string;
  mobile1x2PosterUrl?: string; // Mobile 1:2 ultra-tall poster image
  mobile1x2PosterAmbiance?: string; // Mobile 1:2 poster ambiance

  // Online Social Sharing / Link Preview Images (WhatsApp, Twitter, Facebook, iMessage)
  shareLinkPreviewImage191x100Url?: string; // 1.91:1 Landscape (1200x630) social share card image
  shareLinkPreviewImage1x1Url?: string; // 1:1 Square (600x600) square share preview image
  shareLinkPreviewImage4x3Url?: string; // 4:3 (800x600) preview card image
  preferredSharePreviewAspect?: '1.91:1' | '1:1' | '4:3'; // Preferred aspect ratio for link preview
  shareTitle?: string; // Custom share title (defaults to show title)
  shareDescription?: string; // Custom share description (defaults to show synopsis)

  // Categories & Genre Images & Individual Ambiance Colors
  category16x9ImageUrl?: string; // Categories card 16:9 image
  category16x9Ambiance?: string; // Categories card 16:9 ambiance
  category9x16ImageUrl?: string; // Categories card 9:16 image
  category9x16Ambiance?: string; // Categories card 9:16 ambiance
  genre1x1ImageUrl?: string; // Genre card 1:1 square image
  genre1x1Ambiance?: string; // Genre card 1:1 square ambiance
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
  specialShowActionButton?: boolean; // Optional admin toggle to display action pill button on desktop Special Feed
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

export interface ManagedGenreItem {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  keywords: string[];
  enabled?: boolean;
}

export interface DetailsOriginMeta {
  element?: HTMLElement | null;
  sourceFeedType: 'normal' | 'other';
  posterUrl?: string;
}

export type AdDeviceLayout = 'desktop' | 'laptop' | 'tablet' | 'mobile';
export type MoreInfoAdSection =
  | 'hero'
  | 'episodes'
  | 'trailers'
  | 'more_like_this'
  | 'where_to_watch'
  | 'cast'
  | 'about';

export interface AdminSettings {
  enableWhereToWatch: boolean;
  enableHorizontalEpisodes: boolean;
  autoplayHoverTrailers: boolean;
  ambientGlowIntensity: 'high' | 'medium' | 'subtle';
  dailymotionScriptUrl?: string;
  useCustomLogo?: boolean;
  customLogoUrl?: string;
  platformName?: string;
  loginDesktopBgMode?: 'collage' | 'image' | 'video' | 'color_glare'; // Desktop Login background style
  loginBackgroundImageUrl?: string; // Desktop Login custom image/GIF URL (also used as start/end image when video uses once_with_image_fade)
  loginDesktopVideoUrl?: string; // Desktop Login custom video URL (.mp4 / .webm)
  loginDesktopVideoPlayMode?: 'loop' | 'once_with_image_fade'; // Loop video OR show image on start & fade back to image when video ends
  loginDesktopGlareColor?: string; // Accent color for Desktop Login color_glare mode (Profile PIN style)
  loginMobileBgMode?: 'collage' | 'image' | 'video' | 'color_glare'; // Mobile Login top display style
  loginMobileMediaUrl?: string; // Mobile Login custom image/GIF URL (also used as start/end image when video uses once_with_image_fade)
  loginMobileVideoUrl?: string; // Mobile Login custom video URL (.mp4 / .webm)
  loginMobileVideoPlayMode?: 'loop' | 'once_with_image_fade'; // Loop video OR show image on start & fade back to image when video ends
  loginMobileGlareColor?: string; // Accent color for Mobile Login color_glare mode
  backdropDarkness?: number; // 0 to 100 percentage
  enableStretchableCards?: boolean; // Hover expands portrait poster into 16:9 landscape with logo and preview
  profilePictureGroups?: ProfilePictureGroup[];

  platformIconUrl?: string; // Custom platform icon/logo displayed in header and drawer
  mobileNavbarStyle?: 'floating' | 'bottom_fixed'; // Floating pill island vs full-width fixed bottom dock
  mobileNavbarTheme?: 'solid' | 'glass'; // Solid dark vs Liquid Glass translucent frosted UI
  mobileNavbarShowLabels?: boolean; // Show or hide text labels under mobile navbar buttons
  mobileRecommendationStyle?: 'portrait' | 'landscape' | 'poster_no_preview'; // 2:3 portrait card vs 16:9 widescreen vs poster hero with top bar & drawer
  useNoPreviewButtonsFor2x3Recommendation?: boolean; // Use the no-preview poster hero button style (Watch + circular +) for 2:3 recommendation
  useFullSizeMoreInfoByDefault?: boolean; // Open Full Size More Info Page by default on desktop when browsing normally (in addition to /share links)
  showTop10Badges?: boolean; // Toggle displaying red TOP 10 badges on cards and details
  modernTop10RankList?: boolean; // Legacy boolean for Top 10 rank list
  top10RankStyle?: 'classic' | 'modern' | 'inside_card'; // 3 rank styles: classic portrait/badge, modern outlined side number, or solid inside-card number
  managedGenres?: ManagedGenreItem[]; // Admin-configured genre cards shown in Browse by Genre row
  startFromFirstEpisodeEnabled?: boolean; // Enable "Start from the 1st Episode" desktop row
  startFromFirstEpisodeShowIds?: string[]; // Admin-picked series IDs for "Start from the 1st Episode" row
  mobileCategoriesStyle?: 'grid' | 'stacked_cards'; // Mobile categories page style: 2:3 card grid vs stacked horizontal landscape cards
  mobileLikeButtonStyle?: 'thumbs' | 'emoji'; // Mobile More Info reaction button: classic thumbs up vs emoji face with 3-reaction hold pill
  desktopPopoutStyle?: 'classic' | 'overlay_red' | 'immersive_fade'; // Desktop hover popout style
  desktopNavbarStyle?: 'classic' | 'floating_glass'; // Classic top bar vs floating blurred transparent glass top bar (hamburger left, logo center, search + profile right)

  // Promotional Sign-Up Tile Banner (Apple TV style)
  signupTileEnabled?: boolean;
  signupTileTitle?: string;
  signupTileSubtitle?: string;
  signupTileButtonText?: string;
  signupTileImageUrl?: string;
  signupTileUseCustomLogo?: boolean;
  signupTileCustomLogoUrl?: string;
  signupTileContainerMode?: 'contained' | 'full_bleed';
  signupTileSeparateMobile?: boolean;
  signupTileMobileTitle?: string;
  signupTileMobileSubtitle?: string;
  signupTileMobileButtonText?: string;
  signupTileMobileImageUrl?: string;
  signupTileMobileUseCustomLogo?: boolean;
  signupTileMobileCustomLogoUrl?: string;
  signupTileMobileContainerMode?: 'contained' | 'full_bleed';
  signupTileLayouts?: ('desktop' | 'tablet' | 'mobile')[];

  // Global Alert Poster Modal (Prime Video Traveling / Video Ad style)
  alertPosterEnabled?: boolean;
  alertPosterImageUrl?: string;
  alertPosterVideoUrl?: string;
  alertPosterIsAd?: boolean;
  alertPosterTitle?: string;
  alertPosterSubtitle?: string;
  alertPosterButtonText?: string;
  alertPosterButtonAction?: 'close' | 'link' | 'login';
  alertPosterButtonUrl?: string;
  alertPosterLayouts?: AdDeviceLayout[];
  alertPosterMaxDismissCount?: number;
  alertPosterMaxActionCount?: number;
  alertPosterAdSkipDelaySeconds?: number;
  alertPosterAdRequireFullWatch?: boolean;
  alertPosterDelayMode?: 'fixed' | 'random';
  alertPosterDelaySeconds?: number;
  alertPosterDelayMaxSeconds?: number;

  // Dedicated Ads Manager: 1) Homepage Ad Tile (Signup-Tile style with configurable Ad badge, logo, positions & close button)
  adTileEnabled?: boolean;
  adTileLayouts?: AdDeviceLayout[];
  adTileTitle?: string;
  adTileSubtitle?: string;
  adTileButtonText?: string;
  adTileButtonUrl?: string;
  adTileImageUrl?: string;
  adTileLogoImageUrl?: string;
  adTileContainerMode?: 'contained' | 'full_bleed';
  adTileAspectHeight?: 'default' | 'tall' | 'narrow';
  adTileImageGlare?: boolean;
  adTileBadgePosition?: 'top_left' | 'bottom_left';
  adTileTextPosition?: 'center' | 'bottom_left' | 'bottom_right';
  adTileButtonPosition?: 'center' | 'bottom_left' | 'bottom_right';
  adTileShowCloseButton?: boolean;
  adTileSeparateMobile?: boolean;
  adTileMobileTitle?: string;
  adTileMobileSubtitle?: string;
  adTileMobileButtonText?: string;
  adTileMobileButtonUrl?: string;
  adTileMobileImageUrl?: string;
  adTileMobileLogoImageUrl?: string;
  adTileMobileContainerMode?: 'contained' | 'full_bleed';
  adTileMobileAspectHeight?: 'default' | 'tall' | 'narrow';
  adTileMobileImageGlare?: boolean;
  adTileMobileBadgePosition?: 'top_left' | 'bottom_left';
  adTileMobileTextPosition?: 'center' | 'bottom_left' | 'bottom_right';
  adTileMobileButtonPosition?: 'center' | 'bottom_left' | 'bottom_right';
  adTileMobileShowCloseButton?: boolean;

  // Dedicated Ads Manager: 2) More Info Page Ad Tile (Movies & Shows)
  moreInfoAdEnabled?: boolean;
  moreInfoAdPlacement?: MoreInfoAdSection;
  moreInfoAdLayouts?: AdDeviceLayout[];
  moreInfoAdUseCustomCreative?: boolean;
  moreInfoAdTitle?: string;
  moreInfoAdSubtitle?: string;
  moreInfoAdButtonText?: string;
  moreInfoAdButtonUrl?: string;
  moreInfoAdImageUrl?: string;
  moreInfoAdLogoImageUrl?: string;
  moreInfoAdContainerMode?: 'contained' | 'full_bleed';
  moreInfoAdAspectHeight?: 'default' | 'tall' | 'narrow';
  moreInfoAdImageGlare?: boolean;
  moreInfoAdBadgePosition?: 'top_left' | 'bottom_left';
  moreInfoAdTextPosition?: 'center' | 'bottom_left' | 'bottom_right';
  moreInfoAdButtonPosition?: 'center' | 'bottom_left' | 'bottom_right';
  moreInfoAdShowCloseButton?: boolean;

  // Dedicated Ads Manager: 3) Search Page Ad Tile (Recommended For You card style at random position)
  searchAdEnabled?: boolean;
  searchAdLayouts?: AdDeviceLayout[];
  searchAdImageUrl?: string;
  searchAdBadgeText?: string;
  searchAdTitle?: string;
  searchAdSubtitle?: string;
  searchAdButtonText?: string;
  searchAdButtonUrl?: string;

  // Dedicated Ads Manager: 4) Narrow Ad Bar with Configurable Cross Button, Positions, Logo & Timer
  narrowAdBarEnabled?: boolean;
  narrowAdBarLayouts?: AdDeviceLayout[];
  narrowAdBarImageUrl?: string;
  narrowAdBarLogoImageUrl?: string;
  narrowAdBarTitle?: string;
  narrowAdBarSubtitle?: string;
  narrowAdBarButtonText?: string;
  narrowAdBarButtonUrl?: string;
  narrowAdBarPlacement?: 'bottom_floating' | 'top_banner';
  narrowAdBarBadgePosition?: 'top_left' | 'bottom_left';
  narrowAdBarTextPosition?: 'left' | 'center' | 'right';
  narrowAdBarButtonPosition?: 'left' | 'center' | 'right';
  narrowAdBarShowCloseButton?: boolean;
  narrowAdBarDelayMode?: 'fixed' | 'random';
  narrowAdBarDelaySeconds?: number;
  narrowAdBarDelayMaxSeconds?: number;

  // Detail & Player UI Options
  hideMobileDetailActionLabels?: boolean;
  mobileAutoFullscreenLandscapeEmbed?: boolean;
  hideFullSizeEpisodeTitles?: boolean;
  hideNavbarOnFullSizeMoreInfo?: boolean;
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
