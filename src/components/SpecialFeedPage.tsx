import React, { useEffect } from 'react';
import { Show, FeedConfig } from '../types';
import { ShowCard } from './ShowCard';

interface SpecialFeedPageProps {
  feed: FeedConfig;
  shows: Show[];
  watchlist: string[];
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
  onIncrementPoints: (showId: string) => void;
  isGlobalMuted?: boolean;
  onToggleGlobalMute?: () => void;
  onHoverCardStart?: () => void;
  onHoverCardEnd?: () => void;
}

export const SpecialFeedPage: React.FC<SpecialFeedPageProps> = ({
  feed,
  shows,
  watchlist,
  onToggleWatchlist,
  onOpenDetails,
  onPlayShow,
  onIncrementPoints,
  isGlobalMuted = false,
  onToggleGlobalMute,
  onHoverCardStart,
  onHoverCardEnd
}) => {
  // Scroll to top immediately when opening special feed page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [feed.id]);

  // Hero Backdrop: Assigned by admin on special feed or fallback to top show poster
  const heroBackdrop =
    feed.specialBgImageUrl ||
    shows[0]?.backdropUrl ||
    shows[0]?.posterLandscapeUrl ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80';

  // Backdrop darkness strictly controlled by admin slider (default 0, no forced extra darkness)
  const darknessPercent = typeof feed.specialBgDarkness === 'number' ? feed.specialBgDarkness : 0;

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans selection:bg-red-600 selection:text-white">
      {/* 
        1. Special Feed Hero Section:
        - Mobile and tablet (< lg): 16:9 widescreen on top without cropping, with logo placed in the center
        - Desktop (lg and up): Full-screen cover with logo in bottom-left
        - Normal document flow: scrolls naturally with page
        - Hero image rendered via <img> tag
        - No subtitle, no title count, no back button
      */}
      <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-screen lg:min-h-[600px] lg:max-h-[1080px] overflow-hidden select-none">
        {/* Full-bleed Hero Image extending directly under the transparent navbar */}
        <img
          src={heroBackdrop}
          alt={feed.title}
          className="w-full h-full object-cover object-center"
        />

        {/* Backdrop Darkness Overlay - strictly controlled by admin slider */}
        {darknessPercent > 0 && (
          <div
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-300"
            style={{ opacity: darknessPercent / 100 }}
          />
        )}

        {/* Soft, gentle top vignette for navbar legibility without heavy glare */}
        <div className="absolute inset-x-0 top-0 h-14 sm:h-20 lg:h-28 bg-gradient-to-b from-black/50 via-black/15 to-transparent pointer-events-none" />

        {/* Seamless, continuous bottom merge into base page color (#141414) where cards grid starts */}
        <div className="absolute inset-x-0 bottom-0 h-16 sm:h-24 md:h-36 lg:h-64 bg-gradient-to-t from-[#141414] via-[#141414]/75 to-transparent pointer-events-none" />

        {/* Logo Placement: Centered on mobile and tablet (< lg); bottom-left on desktop (lg and up) */}
        <div className="absolute inset-0 lg:inset-auto lg:bottom-16 lg:left-12 xl:left-16 z-20 flex flex-col items-center justify-center text-center lg:items-start lg:text-left max-w-xl mx-auto lg:mx-0 px-4 lg:px-0 select-none pointer-events-none">
          {feed.specialLogoUrl ? (
            <img
              src={feed.specialLogoUrl}
              alt={feed.title}
              className="max-h-16 sm:max-h-24 md:max-h-36 lg:max-h-64 max-w-[70%] sm:max-w-[420px] lg:max-w-[560px] w-auto object-contain object-center lg:object-left drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)] mx-auto lg:mx-0"
            />
          ) : (
            <div className="text-2xl sm:text-4xl md:text-5xl lg:text-8xl font-black text-red-600 uppercase tracking-tighter drop-shadow-[0_16px_36px_rgba(0,0,0,0.95)] font-cinematic leading-[0.9] select-none text-center lg:text-left mx-auto lg:mx-0">
              {feed.title.includes('&') ? (
                <>
                  <div>{feed.title.split('&')[0].trim()}</div>
                  <div className="text-xl sm:text-3xl md:text-4xl lg:text-7xl">& {feed.title.split('&')[1].trim()}</div>
                </>
              ) : (
                feed.title
              )}
            </div>
          )}
        </div>
      </div>

      {/* 
        2. Feed Cards Section:
        - Mobile layout (< sm): 3 in a row poster cards in 2:3 aspect ratio
        - Tablet and desktop (sm and up): Standard responsive grid
      */}
      <div className="relative z-20 w-full px-2 sm:px-4 md:px-8 xl:px-12 -mt-3 sm:-mt-8 md:-mt-12 lg:-mt-20 pb-36">
        {/* Mobile Layout (< sm): 3 in a row poster cards in 2:3 aspect ratio */}
        <div className="grid sm:hidden grid-cols-3 gap-2 sm:gap-2.5">
          {shows.map((show) => (
            <div
              key={show.id}
              onClick={() => onOpenDetails(show)}
              className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#16171d] shadow-md cursor-pointer border border-white/5 active:scale-95 transition-transform"
            >
              <img
                src={show.posterVerticalUrl || show.posterUrl || show.posterLandscapeUrl || ''}
                alt={show.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Tablet and Desktop Grid (sm and up) */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {shows.map((s) => (
            <ShowCard
              key={s.id}
              show={s}
              cardSize="full"
              isInWatchlist={watchlist.includes(s.id)}
              onToggleWatchlist={onToggleWatchlist}
              onOpenDetails={onOpenDetails}
              onPlay={onPlayShow}
              onIncrementPoints={onIncrementPoints}
              isGlobalMuted={isGlobalMuted}
              onToggleGlobalMute={onToggleGlobalMute}
              onHoverPreviewStart={onHoverCardStart}
              onHoverPreviewEnd={onHoverCardEnd}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
