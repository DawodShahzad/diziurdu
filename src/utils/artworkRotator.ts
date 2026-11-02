import { Show } from '../types';

/**
 * Deterministic string hash function (djb2 variant)
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const ROTATION_DAYS = 8;

/**
 * DETERMINISTIC 8-DAY ARTWORK ROTATION ALGORITHM
 * 
 * Requirements:
 * 1. For any given calendar month, if a secondary asset (*2) exists, it is displayed
 *    for a window of exactly 8 consecutive days selected deterministically per month.
 *    For the other days, the primary asset is shown.
 * 2. The 8-day window MUST be calculated via a deterministic hash of item.id + assetType + year + month
 *    (do NOT use Math.random() so that it remains consistent across reloads for all users).
 * 3. backdropUrl2, posterLandscapeUrl2, and posterVerticalUrl2 have distinct hash offsets
 *    so their 8-day active windows do NOT coincide on the same 8 days.
 * 4. Every single movie and series calculates its own independent schedule across the month.
 */
export function getActiveArtwork(
  item: Show,
  date?: Date
): {
  backdropUrl: string;
  posterLandscapeUrl: string;
  posterVerticalUrl: string;
  verticalBackdropUrl?: string;
} {
  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1; // 1-12
  const currentDay = targetDate.getDate(); // 1-31

  // Total days in the current month (28, 29, 30, or 31)
  const daysInMonth = new Date(year, month, 0).getDate();
  const maxStartDay = Math.max(1, daysInMonth - (ROTATION_DAYS - 1));

  // Helper to calculate non-overlapping 8-day windows
  const isOverlapping = (dayA: number, dayB: number): boolean => {
    return Math.abs(dayA - dayB) < ROTATION_DAYS;
  };

  // 1. Calculate deterministic window for Backdrop
  const backdropHash = hashString(`${item.id}_backdrop_${year}_${month}`);
  const backdropStart = 1 + (backdropHash % maxStartDay);

  // 2. Calculate deterministic window for Poster Landscape (must not overlap with backdrop)
  const posterLandscapeHash = hashString(`${item.id}_posterLandscape_${year}_${month}`);
  let posterLandscapeStart = 1 + ((posterLandscapeHash + 9) % maxStartDay);
  let guardCount = 0;
  while (isOverlapping(posterLandscapeStart, backdropStart) && guardCount < maxStartDay) {
    posterLandscapeStart = (posterLandscapeStart % maxStartDay) + 1;
    guardCount++;
  }

  // 3. Calculate deterministic window for Poster Vertical (must not overlap with backdrop or posterLandscape)
  const posterVerticalHash = hashString(`${item.id}_posterVertical_${year}_${month}`);
  let posterVerticalStart = 1 + ((posterVerticalHash + 17) % maxStartDay);
  guardCount = 0;
  while (
    (isOverlapping(posterVerticalStart, backdropStart) ||
     isOverlapping(posterVerticalStart, posterLandscapeStart)) &&
    guardCount < maxStartDay
  ) {
    posterVerticalStart = (posterVerticalStart % maxStartDay) + 1;
    guardCount++;
  }

  // 4. Optional Vertical Backdrop (mobile recommendation)
  const verticalBackdropHash = hashString(`${item.id}_verticalBackdrop_${year}_${month}`);
  let verticalBackdropStart = 1 + ((verticalBackdropHash + 25) % maxStartDay);
  guardCount = 0;
  while (
    (isOverlapping(verticalBackdropStart, backdropStart) ||
     isOverlapping(verticalBackdropStart, posterLandscapeStart) ||
     isOverlapping(verticalBackdropStart, posterVerticalStart)) &&
    guardCount < maxStartDay
  ) {
    verticalBackdropStart = (verticalBackdropStart % maxStartDay) + 1;
    guardCount++;
  }

  // Check if current day falls into each asset's 8-day window
  const isBackdropActive =
    Boolean(item.backdropUrl2 && item.backdropUrl2.trim()) &&
    currentDay >= backdropStart &&
    currentDay <= backdropStart + (ROTATION_DAYS - 1);

  const isPosterLandscapeActive =
    Boolean(item.posterLandscapeUrl2 && item.posterLandscapeUrl2.trim()) &&
    currentDay >= posterLandscapeStart &&
    currentDay <= posterLandscapeStart + (ROTATION_DAYS - 1);

  const isPosterVerticalActive =
    Boolean(item.posterVerticalUrl2 && item.posterVerticalUrl2.trim()) &&
    currentDay >= posterVerticalStart &&
    currentDay <= posterVerticalStart + (ROTATION_DAYS - 1);

  const isVerticalBackdropActive =
    Boolean(item.verticalBackdropUrl2 && item.verticalBackdropUrl2.trim()) &&
    currentDay >= verticalBackdropStart &&
    currentDay <= verticalBackdropStart + (ROTATION_DAYS - 1);

  return {
    backdropUrl: isBackdropActive ? item.backdropUrl2! : item.backdropUrl,
    posterLandscapeUrl: isPosterLandscapeActive ? item.posterLandscapeUrl2! : item.posterLandscapeUrl,
    posterVerticalUrl: isPosterVerticalActive ? item.posterVerticalUrl2! : (item.posterVerticalUrl || item.posterLandscapeUrl),
    verticalBackdropUrl: isVerticalBackdropActive ? item.verticalBackdropUrl2 : item.verticalBackdropUrl
  };
}

/**
 * Returns schedule info for debugging or admin display
 */
export function getArtworkScheduleInfo(item: Show, date?: Date) {
  const targetDate = date || new Date();
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const currentDay = targetDate.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const maxStartDay = Math.max(1, daysInMonth - (ROTATION_DAYS - 1));

  const backdropHash = hashString(`${item.id}_backdrop_${year}_${month}`);
  const backdropStart = 1 + (backdropHash % maxStartDay);

  const posterLandscapeHash = hashString(`${item.id}_posterLandscape_${year}_${month}`);
  let posterLandscapeStart = 1 + ((posterLandscapeHash + 9) % maxStartDay);
  let guardCount = 0;
  while (Math.abs(posterLandscapeStart - backdropStart) < ROTATION_DAYS && guardCount < maxStartDay) {
    posterLandscapeStart = (posterLandscapeStart % maxStartDay) + 1;
    guardCount++;
  }

  const posterVerticalHash = hashString(`${item.id}_posterVertical_${year}_${month}`);
  let posterVerticalStart = 1 + ((posterVerticalHash + 17) % maxStartDay);
  guardCount = 0;
  while (
    (Math.abs(posterVerticalStart - backdropStart) < ROTATION_DAYS ||
     Math.abs(posterVerticalStart - posterLandscapeStart) < ROTATION_DAYS) &&
    guardCount < maxStartDay
  ) {
    posterVerticalStart = (posterVerticalStart % maxStartDay) + 1;
    guardCount++;
  }

  return {
    year,
    month,
    currentDay,
    backdropWindow: { start: backdropStart, end: backdropStart + (ROTATION_DAYS - 1), isCurrent: currentDay >= backdropStart && currentDay <= backdropStart + (ROTATION_DAYS - 1) },
    posterLandscapeWindow: { start: posterLandscapeStart, end: posterLandscapeStart + (ROTATION_DAYS - 1), isCurrent: currentDay >= posterLandscapeStart && currentDay <= posterLandscapeStart + (ROTATION_DAYS - 1) },
    posterVerticalWindow: { start: posterVerticalStart, end: posterVerticalStart + (ROTATION_DAYS - 1), isCurrent: currentDay >= posterVerticalStart && currentDay <= posterVerticalStart + (ROTATION_DAYS - 1) }
  };
}
