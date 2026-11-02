import { Show, WatchHistoryItem, FeedConfig } from '../types';
import { buildActorIndex } from './actorIndex';

export type WatchHistory = Record<string, WatchHistoryItem> | WatchHistoryItem[];

export interface FeedRow {
  id: string;
  title: string;
  subtitle?: string;
  categoryKey?: string;
  shows: Show[];
  showRankNumbers?: boolean;
  isCuratedByAdmin?: boolean;
  isSpecialFeed?: boolean;
  isStretchableFeed?: boolean;
  specialLogoUrl?: string;
  specialTagline?: string;
  specialExploreText?: string;
  specialExploreAction?: 'showcase' | 'category';
  specialExploreCategory?: string;
  specialBgImageUrl?: string;
  specialBgDarkness?: number;
  specialBgColor?: string;
}

/**
 * Deterministic PRNG seeded by integer
 */
function createSeededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Computes a 30-minute seed integer from current date, hour, and 30-min block (0 or 1)
 * Enables 30-minute rotation across the entire feed row ordering and item content shuffling
 */
export function getThirtyMinuteSeed(date?: Date): number {
  const d = date || new Date();
  const halfHour = Math.floor(d.getMinutes() / 30);
  const slotStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}-${halfHour}`;
  let hash = 0;
  for (let i = 0; i < slotStr.length; i++) {
    hash = ((hash << 5) - hash) + slotStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Hourly seed maintained for backwards compatibility, redirects to 30-minute seed
 */
export function getHourlySeed(date?: Date): number {
  return getThirtyMinuteSeed(date);
}

/**
 * Deterministic Fisher-Yates shuffle with seeded RNG
 */
function seededShuffle<T>(array: T[], rng: () => number): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Internal shuffle of items inside a feed while keeping the top-ranked title
 * in the top 3 spots (spot 0, 1, or 2)
 */
function applyInternalFeedShuffle(shows: Show[], feedSeed: number): Show[] {
  if (shows.length <= 1) return shows;
  const rng = createSeededRandom(feedSeed);

  // Top ranked show is the first item
  const topShow = shows[0];
  const rest = seededShuffle(shows.slice(1), rng);

  // Place topShow randomly in position 0, 1, or 2 (clamped to array length)
  const maxTopPos = Math.min(2, rest.length);
  const targetPos = Math.floor(rng() * (maxTopPos + 1));

  const result = [...rest];
  result.splice(targetPos, 0, topShow);
  return result;
}

/**
 * Helper to normalize WatchHistory to an array of items sorted by updatedAt descending
 */
function normalizeWatchHistory(userHistory: WatchHistory): WatchHistoryItem[] {
  if (!userHistory) return [];
  const list = Array.isArray(userHistory) ? userHistory : Object.values(userHistory);
  return list.filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

/**
 * Check if a title matches keyword tags (genres, categories, synopsis, title)
 */
function matchesKeywords(show: Show, keywords: string[]): boolean {
  const haystack = [
    show.title,
    show.turkishTitle || '',
    ...(show.genres || []),
    ...(show.categories || []),
    ...(show.thisSeriesIs || []),
    show.synopsis || '',
    show.shortDescription || ''
  ]
    .join(' ')
    .toLowerCase();

  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

/**
 * Resolves titles for admin-created feeds with 1 or 2 dropdown sources (genre, categories, custom)
 */
function resolveAdminFeedShows(feed: FeedConfig, catalog: Show[]): Show[] {
  const getPoolShows = (
    sourceType?: 'genre' | 'categories' | 'custom',
    genres?: string[],
    categories?: string[],
    showIds?: string[]
  ): Show[] => {
    if (!sourceType) return [];
    if (sourceType === 'genre' && genres && genres.length > 0) {
      const gLower = genres.map((g) => g.toLowerCase());
      return catalog.filter((s) => (s.genres || []).some((g) => gLower.includes(g.toLowerCase())));
    }
    if (sourceType === 'categories' && categories && categories.length > 0) {
      const cLower = categories.map((c) => c.toLowerCase());
      return catalog.filter((s) => (s.categories || []).some((c) => cLower.includes(c.toLowerCase())));
    }
    if (sourceType === 'custom' && showIds && showIds.length > 0) {
      return showIds.map((id) => catalog.find((s) => s.id === id)).filter((s): s is Show => Boolean(s));
    }
    return [];
  };

  if (feed.sourceType1) {
    const pool1 = getPoolShows(
      feed.sourceType1,
      feed.selectedGenres1,
      feed.selectedCategories1,
      feed.selectedShowIds1
    );

    if (feed.hasSecondSource && feed.sourceType2) {
      const pool2 = getPoolShows(
        feed.sourceType2,
        feed.selectedGenres2,
        feed.selectedCategories2,
        feed.selectedShowIds2
      );

      // Mixture of both selected options (without any replication)
      const mixed: Show[] = [];
      const seen = new Set<string>();
      const maxLen = Math.max(pool1.length, pool2.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < pool1.length && !seen.has(pool1[i].id)) {
          seen.add(pool1[i].id);
          mixed.push(pool1[i]);
        }
        if (i < pool2.length && !seen.has(pool2[i].id)) {
          seen.add(pool2[i].id);
          mixed.push(pool2[i]);
        }
      }
      return mixed;
    }

    return pool1;
  }

  // Fallback to explicit showIds
  if (feed.showIds && feed.showIds.length > 0) {
    return feed.showIds.map((id) => catalog.find((s) => s.id === id)).filter((s): s is Show => Boolean(s));
  }

  // Fallback to actor filter: "Best of [Actor]" feeds or filterActor
  const actorName =
    feed.filterActor ||
    (feed.title.toLowerCase().startsWith('best of ') ? feed.title.slice(8).trim() : null);

  if (actorName) {
    const actorLower = actorName.toLowerCase();
    const matching = catalog.filter((s) =>
      (s.cast || []).some((c) => c.name.toLowerCase().includes(actorLower))
    );
    return matching;
  }

  // Fallback to standard filters
  if (feed.filterType) {
    return catalog.filter((s) => s.type === feed.filterType);
  }
  if (feed.filterGenre) {
    return catalog.filter((s) => (s.genres || []).some((g) => g.toLowerCase().includes(feed.filterGenre!.toLowerCase())));
  }

  return catalog;
}

/**
 * THE CURATED FEED ENGINE
 * 
 * Rules:
 * 1. Shuffles all rows order AND internal feed content every 30 minutes (via getThirtyMinuteSeed).
 * 2. System designed rows:
 *    - Top 10 series & Top 10 movies (strictly 24-hour decay play events)
 *    - Continue watching (user history)
 *    - My list (user list)
 *    - Top picks for you (random)
 *    - Starring X rows (systematic from actor appearances)
 *    - Popular Turkish dramas (top IMDb/TMDB rating)
 *    - Your next watch (random + related to user history)
 *    - New releases (newly added shows / movies + latest release year)
 *    - We think you'll love these (random + top performing and best dramas/movies)
 *    - Hooked from the first episode (random series)
 *    - Most rewatched shows (random series)
 * 3. "Because you watched [Title]" feeds customly pick half content from same genre and half from same category (no replication ever).
 * 4. Admin added rows support 1 or 2 dropdown sources (genre, categories, custom) and special feeds.
 * 5. Strict sequencing constraints:
 *    - First row CANNOT be Top 10 movies/series, Continue watching, or My list.
 *    - "Because you watched XYZ" rows NEVER come consecutively.
 *    - "Starring XYZ" rows CANNOT come consecutively.
 *    - "Top 10 Movies" & "Top 10 Series" CANNOT come consecutively.
 */
export function generateDailyFeeds(
  items: Show[],
  userHistory: WatchHistory,
  userList: string[] = [],
  currentDate?: Date,
  adminFeeds?: FeedConfig[]
): FeedRow[] {
  const catalog = items || [];
  if (catalog.length === 0) return [];

  const targetDate = currentDate || new Date();
  const timeSeed = getThirtyMinuteSeed(targetDate);
  const timeRng = createSeededRandom(timeSeed);

  const historyItems = normalizeWatchHistory(userHistory);
  const userListSet = new Set(userList || []);

  const continueWatchingFeed: FeedRow[] = [];
  const myListFeed: FeedRow[] = [];
  const becauseWatchedFeeds: FeedRow[] = [];
  const top10Feeds: FeedRow[] = [];
  const starringFeeds: FeedRow[] = [];
  const generalFeeds: FeedRow[] = [];
  const specialFeeds: FeedRow[] = [];

  // ==========================================
  // 1. CONTINUE WATCHING (User State)
  // ==========================================
  if (historyItems.length > 0) {
    const continueShows: Show[] = [];
    const seenShowIds = new Set<string>();

    for (const h of historyItems) {
      if (seenShowIds.has(h.showId)) continue;
      const show = catalog.find((s) => s.id === h.showId);
      if (!show) continue;

      const isUnfinished =
        h.seasonNumber !== undefined ||
        h.episodeNumber !== undefined ||
        (show.type === 'movie' && (h.progressPercent === undefined || h.progressPercent < 90));

      if (isUnfinished && !h.completed) {
        seenShowIds.add(show.id);
        continueShows.push(show);
      }
    }

    if (continueShows.length >= 1) {
      continueWatchingFeed.push({
        id: 'feed-continue-watching',
        title: 'Continue Watching',
        subtitle: 'Pick up right where you left off',
        categoryKey: 'continue_watching',
        shows: continueShows
      });
    }
  }

  // ==========================================
  // 2. MY LIST (User Library)
  // ==========================================
  if (userList.length > 0) {
    const myListShows = userList
      .map((id) => catalog.find((s) => s.id === id))
      .filter((s): s is Show => Boolean(s));

    if (myListShows.length >= 1) {
      myListFeed.push({
        id: 'feed-my-list',
        title: 'My List',
        subtitle: 'Titles saved to your personal library',
        categoryKey: 'my_list',
        shows: myListShows
      });
    }
  }

  // ==========================================
  // 3. BECAUSE YOU WATCHED [TITLE]
  // Rule: Customly picked half content from same genre and half from same category (no replication ever)
  // ==========================================
  const watchedCandidates: Show[] = [];
  const seenWatchedIds = new Set<string>();
  for (const h of historyItems) {
    if (!seenWatchedIds.has(h.showId)) {
      seenWatchedIds.add(h.showId);
      const s = catalog.find((item) => item.id === h.showId);
      if (s) watchedCandidates.push(s);
    }
    if (watchedCandidates.length >= 4) break;
  }

  for (const watchedShow of watchedCandidates) {
    const watchedGenres = (watchedShow.genres || []).map((g) => g.toLowerCase());
    const watchedCategories = (watchedShow.categories || []).map((c) => c.toLowerCase());

    // Pool A: From same genres
    const genreMatches = catalog.filter((s) => {
      if (s.id === watchedShow.id) return false;
      return (s.genres || []).some((g) => watchedGenres.includes(g.toLowerCase()));
    });

    // Pool B: From same categories
    const categoryMatches = catalog.filter((s) => {
      if (s.id === watchedShow.id) return false;
      return (s.categories || []).some((c) => watchedCategories.includes(c.toLowerCase()));
    });

    const chosenShows: Show[] = [];
    const chosenIds = new Set<string>();
    const targetHalf = 6;

    // Seeded shuffle candidates for this specific watched show
    const genreRng = createSeededRandom(timeSeed + watchedShow.title.length * 13);
    const catRng = createSeededRandom(timeSeed + watchedShow.title.length * 29);
    const shuffledGenres = seededShuffle(genreMatches, genreRng);
    const shuffledCategories = seededShuffle(categoryMatches, catRng);

    // Pick half from same genre
    for (const s of shuffledGenres) {
      if (chosenShows.length >= targetHalf) break;
      if (!chosenIds.has(s.id)) {
        chosenIds.add(s.id);
        chosenShows.push(s);
      }
    }

    // Pick half from same category (strictly no replication)
    for (const s of shuffledCategories) {
      if (chosenShows.length >= targetHalf * 2) break;
      if (!chosenIds.has(s.id)) {
        chosenIds.add(s.id);
        chosenShows.push(s);
      }
    }

    // Backfill from remaining if one pool was short, maintaining zero duplicates
    if (chosenShows.length < 6) {
      for (const s of [...shuffledGenres, ...shuffledCategories]) {
        if (chosenShows.length >= 10) break;
        if (!chosenIds.has(s.id)) {
          chosenIds.add(s.id);
          chosenShows.push(s);
        }
      }
    }

    if (chosenShows.length >= 3) {
      becauseWatchedFeeds.push({
        id: `feed-because-watched-${watchedShow.id}`,
        title: `Because you watched ${watchedShow.title}`,
        subtitle: `Curated mix of matching genres and categories`,
        categoryKey: `rec_${watchedShow.id}`,
        shows: chosenShows
      });
    }
  }

  // ==========================================
  // 4. TOP 10 SERIES & TOP 10 MOVIES
  // Strictly calculated by 24h play events / decay score
  // ==========================================
  const nowMs = targetDate.getTime();
  const twentyFourHoursAgo = nowMs - 24 * 60 * 60 * 1000;

  const get24hDecayScore = (show: Show): number => {
    let recentScore = 0;
    if (show.play_events && show.play_events.length > 0) {
      for (const ev of show.play_events) {
        if (ev.timestamp >= twentyFourHoursAgo) {
          const deltaHours = (nowMs - ev.timestamp) / (1000 * 60 * 60);
          const weight = Math.exp(-deltaHours / 12);
          recentScore += 10 * weight;
        }
      }
    }
    return recentScore > 0 ? recentScore : (show.all_time_score || show.points);
  };

  // Top 10 Series
  const allSeries = catalog.filter((s) => s.type === 'series');
  const top10Series = [...allSeries]
    .sort((a, b) => get24hDecayScore(b) - get24hDecayScore(a))
    .slice(0, 10);

  if (top10Series.length >= 3) {
    top10Feeds.push({
      id: 'feed-top-10-series-today',
      title: 'Top 10 Series Today',
      subtitle: 'Most streamed Turkish series in the last 24 hours',
      categoryKey: 'top_10_series',
      showRankNumbers: true,
      shows: top10Series
    });
  }

  // Top 10 Movies
  const allMovies = catalog.filter((s) => s.type === 'movie');
  const top10Movies = [...allMovies]
    .sort((a, b) => get24hDecayScore(b) - get24hDecayScore(a))
    .slice(0, 10);

  if (top10Movies.length >= 3) {
    top10Feeds.push({
      id: 'feed-top-10-movies-today',
      title: 'Top 10 Movies Today',
      subtitle: 'Most streamed blockbuster films in the last 24 hours',
      categoryKey: 'top_10_movies',
      showRankNumbers: true,
      shows: top10Movies
    });
  }

  // ==========================================
  // 5. STARRING X ROWS (Systematic from Actor Appearances)
  // ==========================================
  const actorIndex = buildActorIndex(catalog);
  const prominentActors = Array.from(actorIndex.values())
    .filter((act) => act.appearances.length >= 2 || (act.leadShows.length >= 1 && act.appearances.length >= 1))
    .sort((a, b) => b.prominenceScore - a.prominenceScore);

  prominentActors.slice(0, 4).forEach((act) => {
    const actorShows = act.appearances.map((app) => app.show);
    if (actorShows.length >= 2) {
      starringFeeds.push({
        id: `feed-actor-${act.id}`,
        title: `Starring ${act.name}`,
        subtitle: `Explore performances and filmography starring ${act.name}`,
        categoryKey: `starring_${act.id}`,
        shows: actorShows
      });
    }
  });

  // ==========================================
  // 6. SYSTEM DESIGNED ALGORITHMIC ROWS
  // ==========================================

  // (a) "Top Picks for You": Random seeded rotation every 30 minutes
  const randomTopPicks = seededShuffle(catalog, timeRng).slice(0, 15);
  if (randomTopPicks.length >= 3) {
    generalFeeds.push({
      id: 'feed-top-picks-for-you',
      title: 'Top Picks for You',
      subtitle: 'Randomly curated gems updated every 30 minutes',
      categoryKey: 'top_picks',
      shows: randomTopPicks
    });
  }

  // (b) "Popular Turkish Dramas": Based on top IMDb / TMDB rating shows
  const popularByRatings = [...catalog]
    .sort((a, b) => {
      const ratingA = (a.imdbRating || 0) * 10 + (a.matchScore || 0);
      const ratingB = (b.imdbRating || 0) * 10 + (b.matchScore || 0);
      return ratingB - ratingA;
    })
    .slice(0, 15);

  if (popularByRatings.length >= 3) {
    generalFeeds.push({
      id: 'feed-popular-turkish-dramas',
      title: 'Popular Turkish Dramas',
      subtitle: 'Highest rated crowd favorites based on IMDb & TMDB reviews',
      categoryKey: 'popular_dramas',
      shows: popularByRatings
    });
  }

  // (c) "Your Next Watch": Random + related to user history
  const historyGenres = new Set<string>();
  const historyCategories = new Set<string>();
  for (const h of historyItems) {
    const s = catalog.find((item) => item.id === h.showId);
    if (s) {
      (s.genres || []).forEach((g) => historyGenres.add(g.toLowerCase()));
      (s.categories || []).forEach((c) => historyCategories.add(c.toLowerCase()));
    }
  }

  const historyRelatedShows = catalog.filter((s) => {
    const gMatches = (s.genres || []).some((g) => historyGenres.has(g.toLowerCase()));
    const cMatches = (s.categories || []).some((c) => historyCategories.has(c.toLowerCase()));
    return gMatches || cMatches;
  });

  const nextWatchPool: Show[] = [];
  const nextWatchIds = new Set<string>();
  // Half from history-related, half random from catalog
  for (const s of seededShuffle(historyRelatedShows, timeRng)) {
    if (nextWatchPool.length >= 7) break;
    if (!nextWatchIds.has(s.id)) {
      nextWatchIds.add(s.id);
      nextWatchPool.push(s);
    }
  }
  for (const s of seededShuffle(catalog, timeRng)) {
    if (nextWatchPool.length >= 14) break;
    if (!nextWatchIds.has(s.id)) {
      nextWatchIds.add(s.id);
      nextWatchPool.push(s);
    }
  }

  if (nextWatchPool.length >= 3) {
    generalFeeds.push({
      id: 'feed-your-next-watch',
      title: 'Your Next Watch',
      subtitle: 'Personalized recommendations blended with fresh discoveries',
      categoryKey: 'next_watch',
      shows: nextWatchPool
    });
  }

  // (d) "New Releases": newly added shows / movies on platform + latest release year
  const newReleases = [...catalog]
    .sort((a, b) => {
      const yearA = parseInt(a.releaseYear, 10) || 2020;
      const yearB = parseInt(b.releaseYear, 10) || 2020;
      if (yearB !== yearA) return yearB - yearA;
      return (b.all_time_score || b.points) - (a.all_time_score || a.points);
    })
    .slice(0, 15);

  if (newReleases.length >= 3) {
    generalFeeds.push({
      id: 'feed-new-releases',
      title: 'New Releases',
      subtitle: 'Newly added movies and shows fresh on the platform',
      categoryKey: 'new_releases',
      shows: newReleases
    });
  }

  // (e) "We Think You'll Love These": Random + top performing and best dramas/movies
  const topPerformers = catalog.filter((s) => (s.matchScore || 0) >= 90 || (s.all_time_score || s.points) >= 300);
  const loveThesePool: Show[] = [];
  const loveTheseIds = new Set<string>();
  for (const s of seededShuffle(topPerformers, timeRng)) {
    if (loveThesePool.length >= 7) break;
    if (!loveTheseIds.has(s.id)) {
      loveTheseIds.add(s.id);
      loveThesePool.push(s);
    }
  }
  for (const s of seededShuffle(catalog, timeRng)) {
    if (loveThesePool.length >= 14) break;
    if (!loveTheseIds.has(s.id)) {
      loveTheseIds.add(s.id);
      loveThesePool.push(s);
    }
  }

  if (loveThesePool.length >= 3) {
    generalFeeds.push({
      id: 'feed-we-think-youll-love-these',
      title: "We Think You'll Love These",
      subtitle: 'Critically acclaimed blockbusters and audience sensations',
      categoryKey: 'love_these',
      shows: loveThesePool
    });
  }

  // (f) "Hooked from the First Episode": Random series
  const hookedRandom = seededShuffle(allSeries, timeRng).slice(0, 15);
  if (hookedRandom.length >= 3) {
    generalFeeds.push({
      id: 'feed-hooked-first-episode',
      title: 'Hooked from the First Episode',
      subtitle: 'Gripping pilot episodes that draw you in immediately',
      categoryKey: 'hooked_episodes',
      shows: hookedRandom
    });
  }

  // (g) "Most Rewatched Shows": Random series
  const rewatchedRandom = seededShuffle(allSeries, () => timeRng()).slice(0, 15);
  if (rewatchedRandom.length >= 3) {
    generalFeeds.push({
      id: 'feed-most-rewatched-shows',
      title: 'Most Rewatched Shows',
      subtitle: 'Series with the highest replay value and timeless stories',
      categoryKey: 'most_rewatched',
      shows: rewatchedRandom
    });
  }

  // Additional curated theme rows
  const additionalThemes = [
    {
      id: 'feed-action-and-adventure',
      title: 'Action & Adventure',
      subtitle: 'High-octane battles, survival quests, and heart-pounding chases',
      filter: (s: Show) => matchesKeywords(s, ['action', 'adventure', 'war', 'combat', 'battle', 'martial', 'survival'])
    },
    {
      id: 'feed-best-romantic-series',
      title: 'Best Romantic Series',
      subtitle: 'Heartwarming romances, grand gestures, and destined soulmates',
      filter: (s: Show) => s.type === 'series' && matchesKeywords(s, ['romance', 'romantic', 'love', 'passion', 'relationship', 'comedy', 'heart'])
    },
    {
      id: 'feed-incredible-movies',
      title: 'Incredible Movies',
      subtitle: 'Masterfully crafted feature films with emotional depth',
      filter: (s: Show) => s.type === 'movie'
    }
  ];

  for (const theme of additionalThemes) {
    const matched = catalog.filter(theme.filter);
    if (matched.length >= 3) {
      generalFeeds.push({
        id: theme.id,
        title: theme.title,
        subtitle: theme.subtitle,
        categoryKey: theme.id.replace('feed-', ''),
        shows: matched
      });
    }
  }

  // ==========================================
  // 7. ADMIN ADDED ROWS & SPECIAL FEEDS
  // ==========================================
  if (adminFeeds && adminFeeds.length > 0) {
    for (const af of adminFeeds) {
      if (!af.enabled) continue;
      const resolvedShows = resolveAdminFeedShows(af, catalog);
      if (resolvedShows.length >= 1) {
        const feedRow: FeedRow = {
          id: af.id,
          title: af.title,
          subtitle: af.subtitle,
          categoryKey: af.categoryKey,
          shows: resolvedShows,
          showRankNumbers: af.showRankNumbers,
          isCuratedByAdmin: true,
          isSpecialFeed: af.isSpecialFeed,
          isStretchableFeed: af.isStretchableFeed,
          specialLogoUrl: af.specialLogoUrl,
          specialTagline: af.specialTagline,
          specialExploreText: af.specialExploreText,
          specialExploreAction: af.specialExploreAction,
          specialExploreCategory: af.specialExploreCategory,
          specialBgImageUrl: af.specialBgImageUrl,
          specialBgDarkness: af.specialBgDarkness,
          specialBgColor: af.specialBgColor
        };

        if (af.isSpecialFeed) {
          specialFeeds.push(feedRow);
        } else if (
          feedRow.showRankNumbers ||
          feedRow.title.toLowerCase().includes('top 10') ||
          (feedRow.categoryKey && feedRow.categoryKey.includes('top_10'))
        ) {
          // Admin top 10 feed: replace or add to top10Feeds, NEVER to generalFeeds (prevents duplicates & 1st row violations)
          const isSeries = feedRow.categoryKey === 'top_10_series' || feedRow.title.toLowerCase().includes('series');
          const isMovie = feedRow.categoryKey === 'top_10_movies' || feedRow.title.toLowerCase().includes('movie');

          if (isSeries) {
            const existingIdx = top10Feeds.findIndex(
              (r) => r.categoryKey === 'top_10_series' || r.title.toLowerCase().includes('series')
            );
            if (existingIdx >= 0) {
              top10Feeds[existingIdx] = feedRow;
            } else {
              top10Feeds.push(feedRow);
            }
          } else if (isMovie) {
            const existingIdx = top10Feeds.findIndex(
              (r) => r.categoryKey === 'top_10_movies' || r.title.toLowerCase().includes('movie')
            );
            if (existingIdx >= 0) {
              top10Feeds[existingIdx] = feedRow;
            } else {
              top10Feeds.push(feedRow);
            }
          } else {
            top10Feeds.push(feedRow);
          }
        } else {
          generalFeeds.push(feedRow);
        }
      }
    }
  }

  // Deduplicate top10Feeds so there is strictly at most 1 Top 10 Series and at most 1 Top 10 Movies
  const uniqueTop10: FeedRow[] = [];
  const seenTop10Kinds = new Set<string>();
  for (const row of top10Feeds) {
    const isSeries = row.categoryKey === 'top_10_series' || row.title.toLowerCase().includes('series');
    const isMovie = row.categoryKey === 'top_10_movies' || row.title.toLowerCase().includes('movie');
    const kindKey = isSeries ? 'series' : isMovie ? 'movie' : row.id;
    if (!seenTop10Kinds.has(kindKey)) {
      seenTop10Kinds.add(kindKey);
      uniqueTop10.push(row);
    }
  }

  // Helper to test if a row is forbidden from being the first row
  const isDisallowedFirstRow = (row?: FeedRow): boolean => {
    if (!row) return true;
    if (row.isSpecialFeed) return true;
    if (row.showRankNumbers) return true;
    const t = (row.title || '').toLowerCase();
    const id = (row.id || '').toLowerCase();
    const c = (row.categoryKey || '').toLowerCase();
    if (t.includes('top 10') || t.includes('top10') || id.includes('top-10') || id.includes('top10') || c.includes('top_10')) {
      return true;
    }
    if (t.includes('continue watching') || id.includes('continue-watching')) return true;
    if (t.includes('watchlist') || t.includes('my list') || id.includes('watchlist') || id.includes('my-list')) return true;
    return false;
  };

  // ==========================================
  // 8. STRICT ORDERING & SEQUENCING ENGINE
  // Rule A: Rows order changes every 30 minutes (seeded by timeSeed).
  // Rule B: First row CANNOT be Top 10 movies/series, Continue Watching, or My List.
  // Rule C: Only 1 Special Feed shown at a time. If admin added >1, rotates every 30m.
  // Rule D: Special Feed CANNOT be placed in the first 3 rows (must be row 4 or later).
  // Rule E: "Because you watched XYZ" NEVER comes consecutively.
  // Rule F: "Starring XYZ" rows CANNOT come consecutively.
  // Rule G: "Top 10 Movies" and "Top 10 Series" CANNOT come consecutively.
  // ==========================================

  // Pick strictly ONE special feed if any exist, rotating randomly every 30 minutes
  let pickedSpecialFeed: FeedRow | null = null;
  if (specialFeeds.length > 0) {
    const specialSeedRng = createSeededRandom(timeSeed * 10007 + 3821);
    const specialPickerIdx = Math.floor(specialSeedRng() * specialFeeds.length);
    pickedSpecialFeed = specialFeeds[specialPickerIdx];
  }

  // Shuffle pools every 30 minutes
  const shuffledGeneral = seededShuffle(generalFeeds, timeRng);
  const shuffledStarring = seededShuffle(starringFeeds, timeRng);
  const shuffledWatched = seededShuffle(becauseWatchedFeeds, timeRng);

  // 1. Pick First Row: Must NOT be Top 10, Continue Watching, My List, or Special Feed
  const firstRowCandidates = shuffledGeneral.filter((r) => !isDisallowedFirstRow(r));
  const firstRow = firstRowCandidates.length > 0 ? firstRowCandidates[0] : null;

  // Filter out chosen first row and all special feeds from mixed pools (strictly only 1 pickedSpecialFeed is inserted later)
  const remainingGeneral = shuffledGeneral.filter((r) => r.id !== firstRow?.id && !r.isSpecialFeed);

  const sequencedRows: FeedRow[] = [];
  if (firstRow) {
    sequencedRows.push(firstRow);
  }

  // Insert user state feeds (Continue Watching and My List) early (row 2 / row 3)
  if (continueWatchingFeed.length > 0) {
    sequencedRows.push(...continueWatchingFeed);
  }
  if (myListFeed.length > 0) {
    sequencedRows.push(...myListFeed);
  }

  // Pools for interleaving (special feed is excluded from poolMixed; inserted after row 3)
  const poolWatched = [...shuffledWatched];
  const poolStarring = [...shuffledStarring];
  const poolTop10 = [...uniqueTop10];
  const poolMixed = seededShuffle([...remainingGeneral], timeRng);

  // Helper type check
  type RowType = 'watched' | 'starring' | 'top10' | 'other';
  const getRowType = (row?: FeedRow): RowType => {
    if (!row) return 'other';
    if (row.id.includes('because-watched') || row.title.toLowerCase().startsWith('because you watched')) {
      return 'watched';
    }
    if (row.id.includes('feed-actor-') || row.title.toLowerCase().startsWith('starring ')) {
      return 'starring';
    }
    if (row.showRankNumbers || row.id.includes('top-10') || row.title.toLowerCase().includes('top 10')) {
      return 'top10';
    }
    return 'other';
  };

  // Interleave with strict non-consecutive rule enforcement
  let safetyCounter = 0;
  while (
    (poolWatched.length > 0 || poolStarring.length > 0 || poolTop10.length > 0 || poolMixed.length > 0) &&
    safetyCounter < 200
  ) {
    safetyCounter++;
    const lastRow = sequencedRows[sequencedRows.length - 1];
    const lastType = getRowType(lastRow);

    // Try Top 10 if last row was NOT top10
    if (poolTop10.length > 0 && lastType !== 'top10') {
      sequencedRows.push(poolTop10.shift()!);
      continue;
    }

    // Try Because Watched if last row was NOT watched
    if (poolWatched.length > 0 && lastType !== 'watched') {
      sequencedRows.push(poolWatched.shift()!);
      continue;
    }

    // Try Starring X if last row was NOT starring
    if (poolStarring.length > 0 && lastType !== 'starring') {
      sequencedRows.push(poolStarring.shift()!);
      continue;
    }

    // Try Mixed (general / special)
    if (poolMixed.length > 0) {
      sequencedRows.push(poolMixed.shift()!);
      continue;
    }

    // If only constrained items remain, pick whatever is not violating lastType
    if (poolWatched.length > 0 && lastType !== 'watched') {
      sequencedRows.push(poolWatched.shift()!);
    } else if (poolStarring.length > 0 && lastType !== 'starring') {
      sequencedRows.push(poolStarring.shift()!);
    } else if (poolTop10.length > 0 && lastType !== 'top10') {
      sequencedRows.push(poolTop10.shift()!);
    } else {
      // If forced, pop whatever remains
      if (poolWatched.length > 0) sequencedRows.push(poolWatched.shift()!);
      else if (poolStarring.length > 0) sequencedRows.push(poolStarring.shift()!);
      else if (poolTop10.length > 0) sequencedRows.push(poolTop10.shift()!);
    }
  }

  // Insert strictly 1 Special Feed at a random position (can't be placed in first 3 rows)
  if (pickedSpecialFeed) {
    // Purge any accidental special feed entries to strictly guarantee at most 1
    for (let i = sequencedRows.length - 1; i >= 0; i--) {
      if (sequencedRows[i].isSpecialFeed) {
        sequencedRows.splice(i, 1);
      }
    }

    if (sequencedRows.length <= 3) {
      sequencedRows.push(pickedSpecialFeed);
    } else {
      // Must not be in first 3 rows (indices 0, 1, 2) -> insertion index is between 3 and sequencedRows.length
      const minInsertIdx = 3;
      const maxInsertIdx = sequencedRows.length;
      const insertRng = createSeededRandom(timeSeed * 1337 + 97);
      const insertAt = minInsertIdx + Math.floor(insertRng() * (maxInsertIdx - minInsertIdx + 1));
      sequencedRows.splice(insertAt, 0, pickedSpecialFeed);
    }
  }

  // Deduplicate sequenced rows: strictly at most 1 Special Feed, at most 1 Top 10 Series, at most 1 Top 10 Movies, and unique titles
  const seenRowTitles = new Set<string>();
  let hasSpecialFeed = false;
  let hasSeriesTop10 = false;
  let hasMoviesTop10 = false;
  const dedupedSequencedRows: FeedRow[] = [];
  for (const row of sequencedRows) {
    if (row.isSpecialFeed) {
      if (hasSpecialFeed) continue;
      hasSpecialFeed = true;
    }

    const normTitle = row.title.trim().toLowerCase();
    const isSeries10 =
      (normTitle.includes('top 10') || normTitle.includes('top10') || row.categoryKey === 'top_10_series' || row.id.includes('top-10-series') || row.id.includes('top10-series')) &&
      (normTitle.includes('series') || normTitle.includes('tv') || normTitle.includes('show') || row.categoryKey === 'top_10_series' || row.id.includes('series'));
    const isMovie10 =
      (normTitle.includes('top 10') || normTitle.includes('top10') || row.categoryKey === 'top_10_movies' || row.id.includes('top-10-movies') || row.id.includes('top10-movies')) &&
      (normTitle.includes('movie') || normTitle.includes('film') || row.categoryKey === 'top_10_movies' || row.id.includes('movie'));

    if (isSeries10) {
      if (hasSeriesTop10) continue;
      hasSeriesTop10 = true;
    }
    if (isMovie10) {
      if (hasMoviesTop10) continue;
      hasMoviesTop10 = true;
    }
    if (seenRowTitles.has(normTitle)) {
      continue;
    }
    seenRowTitles.add(normTitle);
    dedupedSequencedRows.push(row);
  }

  // Strict enforcement: Ensure 1st row CANNOT be Top 10, Continue Watching, My List, or Special Feed
  while (dedupedSequencedRows.length > 1 && isDisallowedFirstRow(dedupedSequencedRows[0])) {
    const swapIdx = dedupedSequencedRows.findIndex((r, idx) => idx > 0 && !isDisallowedFirstRow(r));
    if (swapIdx > 0) {
      const [allowedRow] = dedupedSequencedRows.splice(swapIdx, 1);
      dedupedSequencedRows.unshift(allowedRow);
    } else {
      break;
    }
  }

  // ==========================================
  // 9. INTERNAL SHUFFLE OF CONTENT (Every 30 mins)
  // Keeps top ranked items in top 3 spots, shuffles the rest
  // ==========================================
  const internallyShuffledRows: FeedRow[] = dedupedSequencedRows.map((row, idx) => {
    // Preserve strict Top 10 rank order for #1-10 rows
    if (row.showRankNumbers) {
      return row;
    }
    const rowSeed = timeSeed + idx * 7919;
    const shuffledItems = applyInternalFeedShuffle(row.shows, rowSeed);
    return {
      ...row,
      shows: shuffledItems
    };
  });

  // Final verification: ensure no single row has fewer than 2 shows unless continue watching / my list
  return internallyShuffledRows.filter(
    (row) => row.shows.length >= 2 || row.id.includes('continue-watching') || row.id.includes('my-list')
  );
}
