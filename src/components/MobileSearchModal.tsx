import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Show } from '../types';
import { Search, X, ChevronRight, Play, Film, Clock } from 'lucide-react';

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  shows: Show[];
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
}

export const MobileSearchModal: React.FC<MobileSearchModalProps> = ({
  isOpen,
  onClose,
  shows,
  onOpenDetails,
  onPlayShow
}) => {
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollYRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      
      // Store current scroll position and freeze body/html firmly in place
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
      // Restore previous scroll position without any jump or flicker
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

  // Real-time search filtering without clicking enter: exact or closest results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    // Exact and prefix matches first
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

    // Score: exact title prefix gets highest score
    matches.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q);
      const bStarts = b.title.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return (b.points || 0) - (a.points || 0);
    });

    return matches.slice(0, 10);
  }, [query, shows]);

  // Quick keyword suggestions based on current query or top popular titles
  const keywordSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return ['Kuruluş: Osman', 'Barbaroslar', 'Diriliş: Ertuğrul', 'Aile', 'Yargı', 'Teşkilat'];
    }
    const set = new Set<string>();
    searchResults.forEach((s) => {
      set.add(s.title);
      if (s.turkishTitle) set.add(s.turkishTitle);
      s.cast.slice(0, 1).forEach((c) => set.add(c.name));
    });
    return Array.from(set).slice(0, 5);
  }, [query, searchResults]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0d0e12] flex flex-col animate-in fade-in duration-200 overscroll-contain"
      onTouchMove={(e) => {
        // Stop touchmove from bubbling to window/body background
        e.stopPropagation();
      }}
    >
      {/* Top Search Bar (Amazon Prime / Netflix hybrid mobile search style) */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 bg-[#121319]/95 backdrop-blur-md sticky top-0 z-10 flex items-center gap-3 touch-none">
        {/* Search Input Box */}
        <div className="flex-1 relative flex items-center bg-[#1c1d25] border border-white/20 rounded-xl px-3.5 py-2.5 shadow-inner">
          <Search className="w-4.5 h-4.5 text-zinc-400 mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shows, movies, actors..."
            className="w-full bg-transparent text-white placeholder-zinc-400 text-sm outline-none font-medium"
          />
          {query.trim() && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-xs font-semibold text-zinc-400 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Cancel / Close button */}
        <button
          onClick={onClose}
          className="text-sm font-medium text-zinc-300 hover:text-white px-1 py-1 cursor-pointer transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Results / Suggestions Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-36 space-y-4 overscroll-contain touch-pan-y">
        {query.trim() === '' ? (
          /* Empty Search Initial Screen: Popular Searches */
          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
              Popular Searches
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywordSuggestions.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setQuery(kw)}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white/90 font-medium transition-colors cursor-pointer"
                >
                  {kw}
                </button>
              ))}
            </div>

            {/* Quick Suggestions Cards */}
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mt-6 mb-3">
              Recommended For You
            </h4>
            <div className="space-y-2.5">
              {shows.slice(0, 5).map((show) => (
                <div
                  key={show.id}
                  onClick={() => {
                    onClose();
                    onOpenDetails(show);
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-all active:scale-[0.99]"
                >
                  <img
                    src={show.posterLandscapeUrl || show.backdropUrl}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="w-24 h-14 rounded-md object-cover shrink-0 bg-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{show.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {show.releaseYear.split('-')[0]} • {show.genres[0] || 'Drama'}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 mr-1" />
                </div>
              ))}
            </div>
          </div>
        ) : searchResults.length > 0 ? (
          /* Real-time search results list as in image_3b7d796c.png */
          <div className="space-y-3">
            {searchResults.slice(0, 10).map((show) => (
              <div
                key={show.id}
                onClick={() => {
                  onClose();
                  onOpenDetails(show);
                }}
                className="flex items-center gap-3.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] cursor-pointer transition-all"
              >
                {/* 16:9 Thumbnail with subtle badge */}
                <div className="relative w-24 sm:w-28 h-14 sm:h-16 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                  <img
                    src={show.posterLandscapeUrl || show.backdropUrl}
                    alt={show.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Show Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-bold text-white truncate">
                      {show.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <span>{show.releaseYear.split('-')[0]}</span>
                    {show.durationOrSeasons && (
                      <>
                        <span>•</span>
                        <span>{show.durationOrSeasons}</span>
                      </>
                    )}
                    <span className="px-1 py-0.2 border border-zinc-700 rounded text-[10px] text-zinc-400">
                      {show.maturityRating}
                    </span>
                  </div>
                </div>

                {/* Quick Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onPlayShow(show);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 cursor-pointer"
                  aria-label={`Play ${show.title}`}
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                </button>
              </div>
            ))}

            {/* Keyword Suggestions under real-time results as in image_3b7d796c.png */}
            {keywordSuggestions.length > 0 && (
              <div className="pt-4 border-t border-white/10 mt-6 space-y-2">
                {keywordSuggestions.map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setQuery(kw)}
                    className="w-full text-left py-2 px-2 text-sm text-zinc-300 hover:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{kw}</span>
                    <Search className="w-3.5 h-3.5 text-zinc-500" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* No results state */
          <div className="py-12 text-center text-zinc-400">
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
