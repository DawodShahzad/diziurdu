import React from 'react';
import { Show } from '../types';
import { X, Bookmark, Play, Trash2, Star, Sparkles } from 'lucide-react';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlistShows: Show[];
  onRemoveFromWatchlist: (showId: string) => void;
  onSelectShow: (show: Show) => void;
  onPlayShow: (show: Show) => void;
}

export const WatchlistModal: React.FC<WatchlistModalProps> = ({
  isOpen,
  onClose,
  watchlistShows,
  onRemoveFromWatchlist,
  onSelectShow,
  onPlayShow
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#12131c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-zinc-900 to-[#181a26] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight font-display">
                My Saved Watchlist ({watchlistShows.length})
              </h2>
              <p className="text-xs text-zinc-400">
                Shows and movies bookmarked for later binge viewing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {watchlistShows.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 space-y-3">
              <Bookmark className="w-12 h-12 mx-auto text-zinc-600" />
              <h3 className="text-lg font-bold text-white">Your watchlist is currently empty</h3>
              <p className="text-xs max-w-sm mx-auto text-zinc-500">
                Explore the homepage feed and click the &quot;+ Add to Watchlist&quot; button on any show or
                movie card to bookmark it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {watchlistShows.map((show) => (
                <div
                  key={show.id}
                  className="group bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-all duration-300 flex flex-col shadow-lg"
                >
                  {/* Poster Thumbnail */}
                  <div
                    onClick={() => {
                      onSelectShow(show);
                      onClose();
                    }}
                    className="relative aspect-video w-full overflow-hidden cursor-pointer bg-black"
                  >
                    <img
                      src={show.posterLandscapeUrl}
                      alt={show.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/70 text-zinc-200">
                        {show.type === 'movie' ? 'Movie' : 'Series'}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white drop-shadow">
                          {show.title}
                        </h4>
                        <div className="text-xs text-zinc-300">
                          {show.releaseYear} · {show.durationOrSeasons}
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-yellow-400 font-bold bg-black/70 px-2 py-1 rounded">
                        <span>{show.imdbRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-3.5 flex items-center justify-between bg-zinc-900/60 border-t border-zinc-800/80">
                    <button
                      onClick={() => onRemoveFromWatchlist(show.id)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onPlayShow(show);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Play Now
                      </button>

                      <button
                        onClick={() => {
                          onSelectShow(show);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
