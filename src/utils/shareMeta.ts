import { Show } from '../types';

export interface ResolvedShowShareMeta {
  shareTitle: string;
  shareDescription: string;
  linkPreviewImage: string;
  displayBackdrop: string;
  ambianceColor: string;
}

const makeAbsoluteUrl = (rawUrl: string): string => {
  const clean = (rawUrl || '').trim();
  if (!clean) return '';
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (typeof window !== 'undefined' && clean.startsWith('/')) {
    return `${window.location.origin}${clean}`;
  }
  return clean;
};

export const hexToRgbTuple = (hex?: string): [number, number, number] => {
  let clean = (hex || '#b45309').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return [180, 83, 9];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export const resolveShowShareMeta = (
  show: Show,
  platformName = 'Dizi Urdu',
  isMobileView = false
): ResolvedShowShareMeta => {
  const preferred = show.preferredSharePreviewAspect || '1.91:1';
  const rawPreview =
    (preferred === '1:1'
      ? show.shareLinkPreviewImage1x1Url ||
        show.shareLinkPreviewImage191x100Url ||
        show.shareLinkPreviewImage4x3Url
      : preferred === '4:3'
      ? show.shareLinkPreviewImage4x3Url ||
        show.shareLinkPreviewImage191x100Url ||
        show.shareLinkPreviewImage1x1Url
      : show.shareLinkPreviewImage191x100Url ||
        show.shareLinkPreviewImage4x3Url ||
        show.shareLinkPreviewImage1x1Url) ||
    show.moreInfoBackdropUrl ||
    show.desktopRecommendationBackdropUrl ||
    show.backdropUrl ||
    show.posterLandscapeUrl ||
    show.posterVerticalUrl ||
    '';

  const linkPreviewImage = makeAbsoluteUrl(rawPreview);

  // Pick backdrop & exact matching admin-selected ambiance color for the Share Popout UI
  const activePair =
    show.desktopRecAndMoreInfoPairs && show.desktopRecAndMoreInfoPairs.length > 0
      ? show.desktopRecAndMoreInfoPairs[
          Math.min(
            Math.max(0, show.activeRecPairIndex ?? 0),
            show.desktopRecAndMoreInfoPairs.length - 1
          )
        ]
      : undefined;

  let displayBackdrop = '';
  let ambianceColor = show.ambientColor || show.recommendationBackdropColor || '#b45309';

  if (isMobileView) {
    if (show.mobileMoreInfoBackdropUrl) {
      displayBackdrop = show.mobileMoreInfoBackdropUrl;
      ambianceColor = show.mobileMoreInfoBackdropAmbiance || ambianceColor;
    } else if (show.mobileRecommendation16x9BackdropUrl) {
      displayBackdrop = show.mobileRecommendation16x9BackdropUrl;
      ambianceColor = show.mobileRecommendation16x9BackdropAmbiance || ambianceColor;
    } else if (show.moreInfoBackdropUrl) {
      displayBackdrop = show.moreInfoBackdropUrl;
      ambianceColor = show.moreInfoBackdropAmbiance || ambianceColor;
    } else if (activePair?.moreInfoBackdropUrl || activePair?.recBackdropUrl) {
      displayBackdrop = activePair.moreInfoBackdropUrl || activePair.recBackdropUrl;
      ambianceColor = activePair.ambianceColor || ambianceColor;
    } else {
      displayBackdrop =
        show.backdropUrl ||
        show.posterLandscapeUrl ||
        rawPreview ||
        show.posterVerticalUrl ||
        '';
      ambianceColor = show.ambientColor || ambianceColor;
    }
  } else {
    if (activePair?.moreInfoBackdropUrl || activePair?.recBackdropUrl) {
      displayBackdrop = activePair.moreInfoBackdropUrl || activePair.recBackdropUrl;
      ambianceColor = activePair.ambianceColor || ambianceColor;
    } else if (show.moreInfoBackdropUrl) {
      displayBackdrop = show.moreInfoBackdropUrl;
      ambianceColor = show.moreInfoBackdropAmbiance || ambianceColor;
    } else if (show.desktopRecommendationBackdropUrl) {
      displayBackdrop = show.desktopRecommendationBackdropUrl;
      ambianceColor = show.desktopRecommendationBackdropAmbiance || ambianceColor;
    } else if (show.desktopSpecialSingleFeedUrl) {
      displayBackdrop = show.desktopSpecialSingleFeedUrl;
      ambianceColor = show.desktopSpecialSingleFeedAmbiance || ambianceColor;
    } else {
      displayBackdrop =
        show.backdropUrl ||
        show.posterLandscapeUrl ||
        rawPreview ||
        show.posterVerticalUrl ||
        '';
      ambianceColor = show.ambientColor || ambianceColor;
    }
  }

  const maturity = show.maturityRating || '16+';
  const genreList = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.join(', ') : 'Drama';
  const year = show.releaseYear || '2025';
  const durationOrSeasons =
    show.type === 'series'
      ? show.durationOrSeasons ||
        (show.seasons && show.seasons.length > 0
          ? `${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''}`
          : '1 Season')
      : show.durationOrSeasons || 'Feature Film';
  const details = show.synopsis || show.description || show.shortDescription || '';

  const shareTitle = show.shareTitle?.trim() || `${show.title} - ${platformName}`;
  const shareDescription =
    show.shareDescription?.trim() ||
    `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;

  return {
    shareTitle,
    shareDescription,
    linkPreviewImage,
    displayBackdrop: makeAbsoluteUrl(displayBackdrop) || linkPreviewImage,
    ambianceColor
  };
};
