export interface EpisodeProgressItem {
  currentTime: number;
  duration: number;
  progressPercent: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: string;
  episodeTitle?: string;
  updatedAt: number;
  rawVideoTime?: number;
  completed?: boolean;
}

export interface WatchProgressItem {
  showId: string;
  showTitle: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeId?: string;
  episodeTitle?: string;
  videoUrl: string;
  videoSourceType?: string;
  currentTime: number;
  duration: number;
  progressPercent: number;
  updatedAt: number;
  thumbnailUrl?: string;
  completed?: boolean;
  episodesProgress?: Record<string, EpisodeProgressItem>;
  rawVideoTime?: number;
  isNextEpisodePrompt?: boolean;
}

/**
 * Format remaining or elapsed time matching the user's exact screenshot reference:
 * e.g., "35 of 63m" or "1h 5m of 2h 10m"
 */
export function formatProgressTime(currentSec: number, totalSec: number): string {
  const cur = Math.max(0, Math.floor(currentSec || 0));
  const tot = Math.max(0, Math.floor(totalSec || 0));

  if (tot <= 0) {
    const curMins = Math.floor(cur / 60);
    return `${curMins}m`;
  }

  const curHours = Math.floor(cur / 3600);
  const curMins = Math.floor((cur % 3600) / 60);

  const totHours = Math.floor(tot / 3600);
  const totMins = Math.floor((tot % 3600) / 60);

  let curStr = '';
  if (curHours > 0) {
    curStr = `${curHours}h ${curMins}m`;
  } else {
    curStr = `${curMins}`;
  }

  let totStr = '';
  if (totHours > 0) {
    totStr = `${totHours}h ${totMins}m`;
  } else {
    totStr = `${totMins}m`;
  }

  return `${curStr} of ${totStr}`;
}
