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
 * Format remaining time in "hm left" style (e.g., "1h 15m left", "10m left").
 */
export function formatProgressTime(currentSec: number, totalSec: number): string {
  const cur = Math.max(0, Math.floor(currentSec || 0));
  const tot = Math.max(0, Math.floor(totalSec || 0));

  if (tot <= 0) {
    return '';
  }

  const remSec = Math.max(0, tot - cur);
  if (remSec === 0) {
    return '0m left';
  }

  const remMins = Math.max(1, Math.round(remSec / 60));
  const remHours = Math.floor(remMins / 60);
  const remM = remMins % 60;

  if (remHours > 0) {
    return remM > 0 ? `${remHours}h ${remM}m left` : `${remHours}h left`;
  }
  return `${remM}m left`;
}
