import React, { useEffect, useRef, useState } from 'react';
import { CastMember, Show } from '../types';
import { X, Plus, Check, Star } from 'lucide-react';
import { getActorFilmography } from '../utils/actorIndex';

interface CastPoolModalProps {
  actor: CastMember | null;
  allShows: Show[];
  watchlist?: string[];
  onToggleWatchlist?: (showId: string) => void;
  onClose: () => void;
  onSelectShow: (show: Show) => void;
  onPlayShow: (show: Show) => void;
}

export const CastPoolModal: React.FC<CastPoolModalProps> = ({
  actor,
  allShows,
  watchlist = [],
  onToggleWatchlist,
  onClose,
  onSelectShow
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localWatchlist, setLocalWatchlist] = useState<string[]>(watchlist);

  useEffect(() => {
    setLocalWatchlist(watchlist);
  }, [watchlist]);

  const handleToggleCardWatchlist = (e: React.MouseEvent, showId: string) => {
    e.stopPropagation();
    setLocalWatchlist((prev) =>
      prev.includes(showId) ? prev.filter((id) => id !== showId) : [...prev, showId]
    );
    if (onToggleWatchlist) {
      onToggleWatchlist(showId);
    }
  };

  // Lock body scroll while modal is active, cleanly restoring on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Always load from the top when opened
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [actor?.id]);

  if (!actor) return null;

  // Use real-time relational actor index to get complete prioritized filmography
  const appearances = getActorFilmography(actor, allShows);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-60 overflow-y-auto overflow-x-hidden p-0 sm:p-5 bg-black/50 flex items-start justify-center custom-scrollbar animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[780px] bg-[#181818] border-0 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl my-0 sm:my-6 flex flex-col min-h-screen sm:min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Top-Right Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-9 h-9 rounded-full bg-[#181818]/80 hover:bg-[#282828] text-white flex items-center justify-center border border-white/20 transition-colors cursor-pointer shadow-lg backdrop-blur-md"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Container - Scrolls via outer primary scrollbar */}
        <div className="flex-1 bg-[#181818]">
          {/* Clean Actor Profile Header - no border outline, slight shadow, picture with same shape as profile icon rounded-[4px], just name next to picture */}
          <div className="px-4 py-5 sm:p-6 md:p-8 bg-[#181818] border-b border-white/10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[4px] overflow-hidden shadow-md shrink-0 bg-zinc-900 border-0">
                <img
                  src={actor.profileUrl}
                  alt={actor.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 pr-12 sm:pr-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display break-words leading-tight">
                  {actor.name}
                </h2>
                {actor.character && (
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium mt-1 leading-snug">
                    {actor.character}
                  </p>
                )}
                {actor.biography && (
                  <p className="text-xs sm:text-sm text-zinc-300 mt-2 line-clamp-2 leading-relaxed">
                    {actor.biography}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Shows and Movies Grid - edge to edge on mobile with proper top padding and pb-36 to clear navbar */}
          <div className="px-0 pt-5 sm:pt-6 sm:p-6 md:p-8 bg-[#181818] pb-36 sm:pb-8">
            <div className="flex items-center justify-between px-4 sm:px-0 mb-3.5 sm:mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight font-display">
                Appears In
              </h3>
              <span className="text-xs font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                {appearances.length} {appearances.length === 1 ? 'title' : 'titles'}
              </span>
            </div>

            {appearances.length > 0 ? (
              <>
                {/* Mobile: 3-column 2:3 vertical poster cards matching "More Like This" style */}
                <div className="grid grid-cols-3 gap-2 px-2 sm:hidden">
                  {appearances.map((app) => {
                    const relShow = app.show;
                    return (
                      <div
                        key={`m-${relShow.id}-${app.character}`}
                        onClick={() => {
                          onSelectShow(relShow);
                          onClose();
                        }}
                        className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
                      >
                        <img
                          src={relShow.posterVerticalUrl || relShow.posterUrl || relShow.posterLandscapeUrl}
                          alt={relShow.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Desktop and Tablet: standard card grid with metadata and synopsis */}
                <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {appearances.map((app) => {
                    const relShow = app.show;
                    const isSaved = localWatchlist.includes(relShow.id);
                    return (
                      <div
                        key={`${relShow.id}-${app.character}`}
                        onClick={() => {
                          onSelectShow(relShow);
                          onClose();
                        }}
                        className="bg-[#2f2f2f] hover:bg-[#383838] rounded-md overflow-hidden flex flex-col shadow-lg border border-transparent hover:border-white/20 transition-colors cursor-pointer group/card"
                      >
                        {/* Card Thumbnail */}
                        <div className="aspect-video w-full bg-black relative overflow-hidden">
                          <img
                            src={relShow.posterLandscapeUrl || relShow.backdropUrl}
                            alt={relShow.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute top-2.5 right-2.5 text-sm sm:text-[14.5px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                            {relShow.durationOrSeasons}
                          </span>
                        </div>

                        {/* Card Body & Metadata row */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                                <span className="border border-white/40 px-1 py-0.2 rounded text-[11px] font-bold text-white">
                                  {relShow.maturityRating}
                                </span>
                                <span className="border border-white/40 px-1 py-0.2 rounded text-[10px] font-bold text-white">
                                  HD
                                </span>
                                <span className="text-xs text-zinc-300 ml-0.5">
                                  {relShow.releaseYear.split('-')[0].trim()}
                                </span>
                              </div>

                              {/* Circular Watchlist Save button (+) / (✓) */}
                              <button
                                onClick={(e) => handleToggleCardWatchlist(e, relShow.id)}
                                className="w-9 h-9 rounded-full border-2 border-white/40 hover:border-white bg-[#181818]/60 text-white flex items-center justify-center cursor-pointer shrink-0 ml-2"
                                aria-label={isSaved ? "Remove from Watchlist" : "Add to Watchlist"}
                              >
                                {isSaved ? (
                                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                                ) : (
                                  <Plus className="w-5 h-5 text-white" />
                                )}
                              </button>
                            </div>

                            {/* Synopsis text */}
                            <p className="text-xs md:text-sm text-zinc-300 line-clamp-3 leading-snug mt-2">
                              {relShow.synopsis || relShow.shortDescription}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-zinc-400 px-4">
                No titles featuring this actor are currently listed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

