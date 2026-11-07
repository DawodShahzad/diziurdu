import React from 'react';
import { Show } from '../types';

interface SpecialSingleFeedProps {
  show: Show;
  onPlay: (show: Show) => void;
  onOpenDetails: (show: Show) => void;
  className?: string;
}

export const SpecialSingleFeed: React.FC<SpecialSingleFeedProps> = ({
  show,
  onPlay,
  onOpenDetails,
  className = ''
}) => {
  if (!show) return null;

  // Determine watch label: "Watch S1 E1" for series or "Watch Movie" for movies
  const isSeries = show.type === 'series';
  const firstSeason = show.seasons?.[0];
  const firstEpisode = firstSeason?.episodes?.[0];
  const seasonNum = firstSeason?.seasonNumber || 1;
  const episodeNum = firstEpisode?.episodeNumber || 1;
  const watchButtonLabel = isSeries ? `Watch S${seasonNum} E${episodeNum}` : 'Watch Movie';

  // Backdrop image source
  const backdropSrc = show.backdropUrl2 || show.backdropUrl || show.posterLandscapeUrl;

  // Genres display string (first 2-3 genres)
  const genresStr = (show.genres || []).slice(0, 3).join(', ');

  return (
    <div className={`hidden md:block relative w-full px-4 md:px-8 xl:px-12 my-6 sm:my-8 select-none ${className}`}>
      <div
        onClick={() => onOpenDetails(show)}
        className="relative w-full rounded-2xl overflow-hidden bg-[#0c0d10] border border-white/10 shadow-2xl min-h-[280px] lg:min-h-[340px] flex items-center group cursor-pointer"
      >
        {/* Right Side: High-res Backdrop Image */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[70%] lg:w-[65%] h-full overflow-hidden pointer-events-none">
          <img
            src={backdropSrc}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Subtle top/bottom edge darkening */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d10]/80 via-transparent to-[#0c0d10]/40" />
        </div>

        {/* Smooth Gradient: Fades backdrop seamlessly into the solid dark background on the far left */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c0d10] via-[#0c0d10]/95 via-45% to-transparent pointer-events-none z-10 w-full md:w-[75%] lg:w-[70%]" />

        {/* Ambient glow matching show color */}
        <div
          className="absolute -left-20 -top-20 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none z-10"
          style={{
            backgroundColor: show.ambientColor || '#b45309'
          }}
        />

        {/* Left Side Content Container */}
        <div className="relative z-20 max-w-xl p-6 sm:p-8 lg:p-10 flex flex-col items-start gap-3.5 sm:gap-4 pointer-events-auto">
          {/* 1. Transparent Title PNG Logo */}
          <div className="min-w-0">
            {show.titleLogoUrl ? (
              <img
                src={show.titleLogoUrl}
                alt={show.title}
                referrerPolicy="no-referrer"
                className="h-12 sm:h-14 lg:h-16 w-auto max-w-[240px] sm:max-w-[300px] object-contain object-left select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {show.title}
              </h2>
            )}
          </div>

          {/* 2. Metadata Infos row: PG 1 Season Kids & Family */}
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-300 font-medium select-none flex-wrap">
            {show.maturityRating && (
              <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold text-[11px] border border-white/15">
                {show.maturityRating}
              </span>
            )}
            {show.durationOrSeasons && (
              <span>{show.durationOrSeasons}</span>
            )}
            {genresStr && (
              <>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">{genresStr}</span>
              </>
            )}
          </div>

          {/* 3. Synopsis: max 2 lines */}
          <p className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed line-clamp-2 max-w-lg select-none">
            {show.synopsis || show.shortDescription || show.description}
          </p>

          {/* 4. White Rounded Button with Play symbol and "Watch S1 E1" (reduced gap between play symbol and text) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(show);
            }}
            className="mt-1 inline-flex items-center gap-1.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm sm:text-base shadow-xl cursor-pointer active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={`${watchButtonLabel} - ${show.title}`}
          >
            {/* Play symbol */}
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M7.05 3.6A1.5 1.5 0 0 0 4.75 4.9v14.2a1.5 1.5 0 0 0 2.3 1.3l12.1-7.1a1.5 1.5 0 0 0 0-2.6L7.05 3.6z" />
            </svg>
            <span className="tracking-wide">{watchButtonLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
