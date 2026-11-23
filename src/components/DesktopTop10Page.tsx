import React from 'react';
import { Show } from '../types';
import { MediaImage } from './MediaImage';
import { ModernRankNumber } from './ModernRankNumber';

interface DesktopTop10PageProps {
  mode: 'series' | 'movies';
  onChangeMode: (mode: 'series' | 'movies') => void;
  shows: Show[];
  onOpenDetails: (show: Show) => void;
  footerSlot?: React.ReactNode;
}

export const DesktopTop10Page: React.FC<DesktopTop10PageProps> = ({
  mode,
  onChangeMode,
  shows,
  onOpenDetails,
  footerSlot
}) => {
  const rankedShows = React.useMemo(() => {
    const filtered = shows.filter((s) =>
      mode === 'series' ? s.type === 'series' : s.type === 'movie'
    );
    return [...filtered]
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);
  }, [shows, mode]);

  const renderCard = (show: Show, rank: number) => {
    const posterSrc =
      show.posterVerticalUrl ||
      show.posterLandscapeUrl ||
      show.backdropUrl ||
      show.backdropUrl2 ||
      '';

    return (
      <button
        key={`desktop-top10-${mode}-${show.id}`}
        type="button"
        onClick={() => onOpenDetails(show)}
        className="group relative flex items-center justify-center shrink-0 focus:outline-none cursor-pointer select-none"
        aria-label={`#${rank} ${show.title}`}
      >
        {/* Classical Rank List Number Style with slightly grey inner fill */}
        <div className="relative -mr-3 sm:-mr-4 md:-mr-5 z-0 pointer-events-none select-none flex items-center shrink-0">
          <ModernRankNumber
            rank={rank}
            fillColor="#2a2a2e"
            strokeColor="#8c8c8c"
            strokeWidth={3.8}
            strokeLinejoin="miter"
            fadeRight={true}
            className={`${
              rank >= 10
                ? 'w-[74px] lg:w-[86px] xl:w-[100px]'
                : 'w-[54px] lg:w-[62px] xl:w-[74px]'
            } h-[92px] lg:h-[110px] xl:h-[128px]`}
          />
        </div>

        {/* Borderless curved-corner poster card that scales slightly larger ONLY on hover */}
        <div className="relative z-10 w-[138px] lg:w-[152px] xl:w-[168px] aspect-[2/3] rounded-[10px] overflow-hidden bg-[#12131a] border-0 shadow-[0_14px_34px_rgba(0,0,0,0.75)] transition-transform duration-300 ease-out group-hover:scale-[1.05]">
          <MediaImage
            src={posterSrc}
            fallbackTitle={show.title}
            fallbackClassName="w-full h-full bg-[#12131a] flex items-center justify-center p-4 text-center select-none"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    );
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col justify-between overflow-hidden bg-[#05060b] text-white pt-24">
      {/* Split-Side Ambient Background: Blue strictly on LEFT (stronger toward bottom-left), Red strictly on RIGHT (stronger toward top-right), dark center separation */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: [
            // Right side: Red glow stronger at top-right, dulling smoothly downward, confined to right half
            'radial-gradient(ellipse 46% 52% at 96% 14%, rgba(226, 20, 32, 0.62) 0%, rgba(168, 14, 24, 0.34) 38%, rgba(88, 10, 18, 0.10) 68%, rgba(5, 6, 11, 0) 90%)',
            'radial-gradient(ellipse 38% 48% at 94% 58%, rgba(150, 12, 22, 0.22) 0%, rgba(72, 8, 16, 0.08) 52%, rgba(5, 6, 11, 0) 82%)',
            // Left side: Blue glow softer near upper-left and growing stronger toward bottom-left, confined to left half
            'radial-gradient(ellipse 48% 58% at 4% 88%, rgba(14, 90, 248, 0.68) 0%, rgba(10, 58, 188, 0.38) 40%, rgba(6, 28, 96, 0.12) 70%, rgba(5, 6, 11, 0) 92%)',
            'radial-gradient(ellipse 38% 46% at 6% 36%, rgba(14, 66, 198, 0.24) 0%, rgba(8, 34, 118, 0.09) 52%, rgba(5, 6, 11, 0) 82%)'
          ].join(', ')
        }}
      />

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 md:px-10 xl:px-12 pb-16 flex-1">
        {/* Series / Movies Selector Pill Only (center logo + TOP 10 removed) */}
        <div className="flex flex-col items-center justify-center text-center mb-10 md:mb-12">
          <div className="inline-flex items-center p-1 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.14] shadow-[0_8px_28px_rgba(0,0,0,0.5)]">
            <button
              type="button"
              onClick={() => onChangeMode('series')}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                mode === 'series'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Series
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('movies')}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                mode === 'movies'
                  ? 'bg-white text-black shadow-md'
                  : 'text-zinc-300 hover:text-white'
              }`}
            >
              Movies
            </button>
          </div>
        </div>

        {/* Fluid Centered Wrapping Rows: naturally adapts to 5, 4, or 3 cards per row based on width and centers remaining titles */}
        {rankedShows.length === 0 ? (
          <div className="py-24 text-center text-zinc-400 text-base">
            No {mode === 'series' ? 'series' : 'movies'} available yet.
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-5 lg:gap-x-7 xl:gap-x-8 gap-y-11 md:gap-y-14">
            {rankedShows.map((show, i) => renderCard(show, i + 1))}
          </div>
        )}
      </div>

      {/* Optional Transparent Footer (rendered ONLY when accessed via direct /top10 slug, hidden when accessed via Categories) */}
      {footerSlot && <div className="relative z-10 w-full">{footerSlot}</div>}
    </div>
  );
};
