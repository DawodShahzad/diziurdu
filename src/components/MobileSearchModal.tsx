import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Show, AdminSettings } from '../types';
import { Search, ChevronLeft, ChevronRight, Play, Plus, Check, X } from 'lucide-react';
import { MediaImage } from './MediaImage';
import { SearchAdCard } from './SearchAdCard';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: Show[];
  watchlist?: string[];
  onToggleWatchlist?: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
  initialQuery?: string;
  onQueryChange?: (q: string) => void;
  adminSettings?: AdminSettings;
  onNavigateInternal?: (path: string) => void;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
  shows,
  watchlist = [],
  onToggleWatchlist,
  onOpenDetails,
  onPlayShow,
  initialQuery = '',
  onQueryChange,
  adminSettings,
  onNavigateInternal
}) => {
  const [query, setQuery] = useState<string>(initialQuery);
  const [committedExactQuery, setCommittedExactQuery] = useState<string>('');
  const [randomSearchAdIdx, setRandomSearchAdIdx] = useState<number>(() => Math.floor(Math.random() * 6));
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (isOpen) {
      setRandomSearchAdIdx(Math.floor(Math.random() * 6));
      setTimeout(() => inputRef.current?.focus(), 150);

      scrollYRef.current = window.scrollY;
      const scrollY = window.scrollY;
      document.body.dataset.mobileSearchScrollY = String(scrollY);
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const stored = document.body.dataset.mobileSearchScrollY;
      const targetY = stored !== undefined && stored !== '' ? parseInt(stored, 10) : scrollYRef.current;

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      delete document.body.dataset.mobileSearchScrollY;

      if (typeof targetY === 'number' && !isNaN(targetY)) {
        window.scrollTo(0, targetY);
      }
      setQuery('');
      setCommittedExactQuery('');
    }

    return () => {
      const stored = document.body.dataset.mobileSearchScrollY;
      const targetY = stored !== undefined && stored !== '' ? parseInt(stored, 10) : scrollYRef.current;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      delete document.body.dataset.mobileSearchScrollY;
      if (typeof targetY === 'number' && !isNaN(targetY)) {
        window.scrollTo(0, targetY);
      }
    };
  }, [isOpen]);

  const updateQuery = (next: string, committedExact = '') => {
    setQuery(next);
    setCommittedExactQuery(committedExact);
    onQueryChange?.(next);
  };

  // Build ordered prediction candidates (shows prioritized by popularity/points, then genres/actors)
  const predictionCandidates = useMemo(() => {
    const sorted = [...shows].sort((a, b) => (b.points || 0) - (a.points || 0));
    const terms: string[] = [];
    const seen = new Set<string>();
    const add = (val?: string) => {
      if (!val) return;
      const clean = val.trim();
      if (!clean || seen.has(clean.toLowerCase())) return;
      seen.add(clean.toLowerCase());
      terms.push(clean);
    };
    sorted.forEach((s) => {
      add(s.title);
      add(s.turkishTitle);
      s.supportingTitles?.forEach(add);
    });
    sorted.forEach((s) => {
      s.genres?.forEach(add);
      s.categories?.forEach(add);
      s.cast?.slice(0, 2).forEach((c) => add(c.name));
    });
    return terms;
  }, [shows]);

  // Inline dull predictive autocomplete
  const { fullPrediction, ghostSuffix } = useMemo(() => {
    const raw = query;
    if (!raw.trim()) return { fullPrediction: '', ghostSuffix: '' };
    const lowerRaw = raw.toLowerCase();
    const match = predictionCandidates.find(
      (term) => term.toLowerCase().startsWith(lowerRaw) && term.length > raw.length
    );
    if (!match) return { fullPrediction: '', ghostSuffix: '' };
    return {
      fullPrediction: match,
      ghostSuffix: match.slice(raw.length)
    };
  }, [query, predictionCandidates]);

  // Real-time matching results + exact title spotlight detection
  const { exactSpotlightShow, searchResults, relatedToSpotlight } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { exactSpotlightShow: null as Show | null, searchResults: [] as Show[], relatedToSpotlight: [] as Show[] };
    }

    const matches = shows.filter((s) => {
      const titleMatch = s.title.toLowerCase().includes(q);
      const turkishTitleMatch = Boolean(s.turkishTitle && s.turkishTitle.toLowerCase().includes(q));
      const castMatch = s.cast.some(
        (c) => c.name.toLowerCase().includes(q) || c.character.toLowerCase().includes(q)
      );
      const genreMatch = s.genres.some((g) => g.toLowerCase().includes(q));
      const categoryMatch = Boolean(s.categories && s.categories.some((c) => c.toLowerCase().includes(q)));
      const supportingMatch = Boolean(
        s.supportingTitles && s.supportingTitles.some((st) => st.toLowerCase().includes(q))
      );
      return titleMatch || turkishTitleMatch || castMatch || genreMatch || categoryMatch || supportingMatch;
    });

    matches.sort((a, b) => {
      const aExact = a.title.toLowerCase() === q || a.turkishTitle?.toLowerCase() === q;
      const bExact = b.title.toLowerCase() === q || b.turkishTitle?.toLowerCase() === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = a.title.toLowerCase().startsWith(q);
      const bStarts = b.title.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.points || 0) - (a.points || 0);
    });

    const exactMatch = shows.find(
      (s) =>
        s.title.toLowerCase() === q ||
        (s.turkishTitle && s.turkishTitle.toLowerCase() === q) ||
        (s.supportingTitles && s.supportingTitles.some((st) => st.toLowerCase() === q))
    ) || null;

    const spotlight = exactMatch;

    // Related titles for More Like This (9 rows x 3 cards = 27 max) when spotlight is active
    let relatedList: Show[] = [];
    if (spotlight) {
      const spotGenres = new Set(spotlight.genres.map((g) => g.toLowerCase()));
      const spotCast = new Set(spotlight.cast.map((c) => c.name.toLowerCase()));
      relatedList = shows
        .filter((s) => s.id !== spotlight.id)
        .map((s) => {
          let score = 0;
          s.genres.forEach((g) => {
            if (spotGenres.has(g.toLowerCase())) score += 3;
          });
          s.cast.forEach((c) => {
            if (spotCast.has(c.name.toLowerCase())) score += 4;
          });
          if (s.type === spotlight.type) score += 1;
          score += (s.points || 0) * 0.05;
          return { s, score };
        })
        .sort((a, b) => b.score - a.score)
        .map((x) => x.s)
        .slice(0, 27);
    }

    return {
      exactSpotlightShow: spotlight,
      searchResults: matches.slice(0, 30), // max 10 rows of 3 cards = 30
      relatedToSpotlight: relatedList
    };
  }, [query, committedExactQuery, shows]);

  // Popular suggestions when query is empty
  const keywordSuggestions = useMemo(() => {
    return ['Kuruluş: Osman', 'Barbaroslar', 'Diriliş: Ertuğrul', 'Aile', 'Yargı', 'Teşkilat'];
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200 overscroll-contain"
      onTouchMove={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Top Search Bar (matching reference image_2dd20e86.png) */}
      <div className="px-3.5 pt-3.5 pb-3 bg-black sticky top-0 z-10 flex items-center gap-2.5 touch-none">
        {/* Back button */}
        <button
          onClick={onClose}
          className="p-1 -ml-1 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
        </button>

        {/* Flat rounded-rectangle Search Input Box */}
        <div className="flex-1 relative flex items-center bg-[#333336] rounded-[6px] px-3 py-2.5">
          <Search className="w-5 h-5 text-zinc-400 mr-2.5 shrink-0 stroke-[2]" />
          <div className="relative flex-1 flex items-center overflow-hidden">
            {ghostSuffix && (
              <div
                onClick={() => {
                  updateQuery(fullPrediction, fullPrediction);
                  inputRef.current?.blur();
                }}
                className="absolute inset-0 flex items-center text-[15px] font-normal whitespace-pre overflow-hidden z-20 pointer-events-none"
              >
                <span className="invisible">{query}</span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuery(fullPrediction, fullPrediction);
                    inputRef.current?.blur();
                  }}
                  className="text-zinc-400/70 pointer-events-auto cursor-pointer pr-6"
                >
                  {ghostSuffix}
                </span>
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => updateQuery(e.target.value, '')}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === 'Tab') && fullPrediction) {
                  e.preventDefault();
                  updateQuery(fullPrediction, fullPrediction);
                  inputRef.current?.blur();
                } else if (e.key === 'Enter' && query.trim()) {
                  e.preventDefault();
                  setCommittedExactQuery(query.trim());
                  inputRef.current?.blur();
                }
              }}
              placeholder="Search shows, movies..."
              className="relative z-10 w-full bg-transparent text-white placeholder-zinc-400 text-[15px] outline-none font-normal"
            />
          </div>
          {query.trim() && (
            <button
              onClick={() => {
                updateQuery('', '');
                inputRef.current?.focus();
              }}
              className="relative z-30 p-1 text-zinc-400 hover:text-white cursor-pointer transition-colors shrink-0 active:scale-90"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          )}
        </div>
      </div>

      {/* Results / Suggestions Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-36 overscroll-contain touch-pan-y bg-black">
        {query.trim() === '' ? (
          <div className="px-4 py-4 space-y-4">
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywordSuggestions.map((kw) => (
                <button
                  key={kw}
                  onClick={() => updateQuery(kw, kw)}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/90 font-medium transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>

            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mt-6 mb-3">
              Recommended For You
            </h4>
            <div className="space-y-2.5">
              {(() => {
                const recShows = shows.slice(0, 5);
                const canShowSearchAd = Boolean(
                  adminSettings?.searchAdEnabled &&
                    (adminSettings.searchAdLayouts || ['desktop', 'laptop', 'tablet', 'mobile']).includes('mobile') &&
                    (adminSettings.searchAdTitle?.trim() ||
                      adminSettings.searchAdImageUrl?.trim() ||
                      adminSettings.searchAdSubtitle?.trim())
                );
                const adPos = canShowSearchAd ? Math.min(recShows.length, randomSearchAdIdx) : -1;
                const items: React.ReactNode[] = [];
                recShows.forEach((show, idx) => {
                  if (idx === adPos) {
                    items.push(
                      <SearchAdCard
                        key="mobile-search-rec-ad"
                        variant="mobile_row"
                        imageUrl={adminSettings?.searchAdImageUrl}
                        badgeText={adminSettings?.searchAdBadgeText || 'Ad'}
                        title={adminSettings?.searchAdTitle}
                        subtitle={adminSettings?.searchAdSubtitle}
                        buttonUrl={adminSettings?.searchAdButtonUrl}
                        onNavigateInternal={(path) => {
                          onClose();
                          onNavigateInternal?.(path);
                        }}
                      />
                    );
                  }
                  items.push(
                    <div
                      key={show.id}
                      onClick={() => {
                        onClose();
                        onOpenDetails(show);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="w-24 h-14 rounded-md overflow-hidden shrink-0 bg-zinc-900">
                        <MediaImage
                          src={show.posterLandscapeUrl || show.backdropUrl}
                          fallbackTitle={show.title}
                          fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-1.5 text-center select-none"
                          fallbackTextClassName="text-white/95 font-semibold text-[11px] leading-tight line-clamp-2 break-words font-sans"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{show.title}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {show.releaseYear.split('-')[0]} • {show.genres[0] || 'Drama'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-500 mr-1" />
                    </div>
                  );
                });
                if (canShowSearchAd && adPos >= recShows.length) {
                  items.push(
                    <SearchAdCard
                      key="mobile-search-rec-ad"
                      variant="mobile_row"
                      imageUrl={adminSettings?.searchAdImageUrl}
                      badgeText={adminSettings?.searchAdBadgeText || 'Ad'}
                      title={adminSettings?.searchAdTitle}
                      subtitle={adminSettings?.searchAdSubtitle}
                      buttonUrl={adminSettings?.searchAdButtonUrl}
                      onNavigateInternal={(path) => {
                        onClose();
                        onNavigateInternal?.(path);
                      }}
                    />
                  );
                }
                return items;
              })()}
            </div>
          </div>
        ) : exactSpotlightShow ? (
          /* EXACT TITLE SPOTLIGHT MODE: Recommendation card at top + 9 rows of 3 (27 cards) below */
          <div className="pt-3 space-y-5">
            {/* Mobile Recommendation Spotlight Card */}
            <div className="px-2.5 sm:px-4">
              <div
                data-show-id={exactSpotlightShow.id}
                onClick={() => {
                  onClose();
                  onOpenDetails(exactSpotlightShow);
                }}
                className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#111] shadow-2xl cursor-pointer group"
              >
                <MediaImage
                  src={exactSpotlightShow.mobileSpecialSingleFeedUrl || exactSpotlightShow.backdropUrl2 || exactSpotlightShow.backdropUrl || exactSpotlightShow.posterLandscapeUrl}
                  fallbackTitle={exactSpotlightShow.title}
                  fallbackClassName="absolute inset-0 w-full h-full bg-[#111] flex items-center justify-center p-4 text-center select-none"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3.5 right-3.5 z-10 flex items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {exactSpotlightShow.titleLogoUrl ? (
                      <div className="relative w-[52%] max-w-[190px] aspect-[2.5/1] overflow-hidden shrink-0 mb-1.5">
                        <img
                          src={exactSpotlightShow.titleLogoUrl}
                          alt={exactSpotlightShow.title}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left"
                        />
                      </div>
                    ) : (
                      <h3 className="text-white font-extrabold text-base tracking-tight mb-1 truncate">
                        {exactSpotlightShow.title}
                      </h3>
                    )}
                    <p className="text-[11px] text-zinc-300 font-medium truncate">
                      {exactSpotlightShow.releaseYear.split('-')[0]} • {exactSpotlightShow.maturityRating} • {exactSpotlightShow.genres[0] || 'Drama'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onToggleWatchlist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWatchlist(exactSpotlightShow.id);
                        }}
                        className="w-9 h-9 rounded-full bg-black/65 border border-white/25 text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
                        aria-label="Toggle My List"
                      >
                        {watchlist.includes(exactSpotlightShow.id) ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Plus className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        onPlayShow(exactSpotlightShow);
                      }}
                      className="px-4 py-2 rounded-full bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-transform"
                      aria-label={`Play ${exactSpotlightShow.title}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Play</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 9 rows of 3 (27 cards) matching Mobile More Like This */}
            {relatedToSpotlight.length > 0 && (
              <div className="px-2.5 sm:px-4">
                <h3 className="text-sm font-bold text-white tracking-tight mb-2.5">
                  More Like This
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                  {relatedToSpotlight.slice(0, 27).map((relShow) => (
                    <div
                      key={relShow.id}
                      data-show-id={relShow.id}
                      onClick={() => {
                        onClose();
                        onOpenDetails(relShow);
                      }}
                      className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                    >
                      <MediaImage
                        src={relShow.posterVerticalUrl || relShow.posterUrl || relShow.posterLandscapeUrl}
                        fallbackTitle={relShow.title}
                        fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-2.5 text-center select-none"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : searchResults.length > 0 ? (
          /* TYPING RESULTS: 3 columns of 2:3 cards matching Mobile More Like This, max 10 rows (30 cards) */
          <div className="px-2.5 sm:px-4 pt-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {searchResults.slice(0, 30).map((show) => (
                <div
                  key={show.id}
                  data-show-id={show.id}
                  onClick={() => {
                    onClose();
                    onOpenDetails(show);
                  }}
                  className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                >
                  <MediaImage
                    src={show.posterVerticalUrl || show.posterUrl || show.posterLandscapeUrl}
                    fallbackTitle={show.title}
                    fallbackClassName="w-full h-full bg-[#111] flex items-center justify-center p-2.5 text-center select-none"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center text-zinc-400">
            <p className="text-base font-medium text-white">No results found for &quot;{query}&quot;</p>
            <p className="text-xs text-zinc-500 mt-1">
              Try searching with a different actor, genre, or Turkish title.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
