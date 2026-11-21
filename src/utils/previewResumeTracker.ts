/**
 * Tracks playback time for the most recently hovered feed card preview so that
 * unhovering and re-hovering the SAME card resumes where it left off —
 * UNLESS any other preview on the page (another feed card, hero recommendation,
 * single special feed, or More Info preview) plays in between, or the preview finishes.
 */

interface SavedCardPreview {
  cardKey: string;
  timeSec: number;
}

let savedCardPreview: SavedCardPreview | null = null;

/** Record playback timestamp for a hovered card's preview video. */
export const recordCardPreviewTime = (cardKey: string, timeSec: number): void => {
  if (!cardKey || !Number.isFinite(timeSec) || timeSec <= 0.25) return;
  savedCardPreview = { cardKey, timeSec };
};

/**
 * Notify that ANY preview video on the page has started playing.
 * If a different preview started, clear the saved card timestamp so the old card restarts from 0.
 */
export const notifyPreviewStarted = (sourceKey: string): void => {
  if (savedCardPreview && savedCardPreview.cardKey !== sourceKey) {
    savedCardPreview = null;
  }
};

/** Clear saved timestamp for a card (e.g., when its preview reaches the end). */
export const clearCardPreviewTime = (cardKey: string): void => {
  if (savedCardPreview && savedCardPreview.cardKey === cardKey) {
    savedCardPreview = null;
  }
};

/** Get the resumable timestamp (in seconds) for a card, or 0 if it should start fresh. */
export const getResumableCardPreviewTime = (cardKey: string): number => {
  if (savedCardPreview && savedCardPreview.cardKey === cardKey && savedCardPreview.timeSec > 0.25) {
    return savedCardPreview.timeSec;
  }
  return 0;
};
