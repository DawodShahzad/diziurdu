import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Show } from '../types';
import { Volume2, VolumeX, Plus, Check, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { ShowTitleLogo } from './ShowTitleLogo';
import { ShowCard } from './ShowCard';
import { ResumeButtonProgress } from './ResumeButtonProgress';
import { WatchProgressItem } from '../utils/watchProgress';
import { attachHlsVideo } from '../utils/hlsHelper';
import { MediaImage } from './MediaImage';

interface TrendsFeedProps {
  shows: Show[];
  watchlist: string[];
  watchHistory?: Record<string, WatchProgressItem>;
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
  onBack?: () => void;
  isMobile?: boolean;
  enableBiggerCards?: boolean;
}

export const TrendsFeed: React.FC<TrendsFeedProps> = ({
  shows,
  watchlist,
  watchHistory,
  onToggleWatchlist,
  onOpenDetails,
  onPlayShow,
  onBack,
  isMobile = false,
  enableBiggerCards = false
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'latest' | 'topMovies' | 'topSeries'>('latest');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Group shows
  const latestReleaseShows = useMemo(() => {
    return [...shows]
      .sort((a, b) => {
        const yearA = parseInt(a.releaseYear || '0', 10);
        const yearB = parseInt(b.releaseYear || '0', 10);
        if (yearB !== yearA) return yearB - yearA;
        return (b.points || 0) - (a.points || 0);
      })
      .slice(0, 15);
  }, [shows]);

  const top10Movies = useMemo(() => {
    return shows
      .filter((s) => s.type === 'movie')
      .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
      .slice(0, 10);
  }, [shows]);

  const top10Series = useMemo(() => {
    return shows
      .filter((s) => s.type === 'series')
      .sort((a, b) => (b.imdbRating || 0) - (a.imdbRating || 0))
      .slice(0, 10);
  }, [shows]);

  // Aggregate ~30 titles for mobile vertical feed
  const mobileTrendsShows = useMemo(() => {
    if (activeTab === 'latest') return latestReleaseShows;
    if (activeTab === 'topMovies') return top10Movies;
    if (activeTab === 'topSeries') return top10Series;

    // 'all': combine latest + top movies + top series without duplicates up to 30 titles
    const seen = new Set<string>();
    const list: Show[] = [];
    [...latestReleaseShows, ...top10Movies, ...top10Series].forEach((s) => {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        list.push(s);
      }
    });
    return list.slice(0, 30);
  }, [activeTab, latestReleaseShows, top10Movies, top10Series]);

  // Ref tracking for mobile cards video playback
  const mobileVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    // When active video changes, attach video player
    if (!activeVideoId) return;
    const el = mobileVideoRefs.current[activeVideoId];
    const targetShow = shows.find((s) => s.id === activeVideoId);
    if (el && targetShow?.trailerUrl) {
      const cleanup = attachHlsVideo(el, targetShow.trailerUrl, {
        autoPlay: true,
        muted: isMuted
      });
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [activeVideoId, isMuted, shows]);

  return (
    <div className="w-full text-white min-h-screen bg-black pb-24 md:pb-16 select-none animate-in fade-in duration-200">
      {/* ===================== MOBILE LAYOUT: Vertical Scrolling Feed matching image_316e4175.png ===================== */}
      <div className="md:hidden w-full">
        {/* Sticky Mobile Header */}
        <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-md px-4 pt-10 pb-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer"
                aria-label="Back"
              >
                <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
              </button>
            )}
            <h1 className="text-xl font-black text-white font-display tracking-tight">New & Hot</h1>
          </div>
        </div>

        {/* Tab Pills matching screenshot */}
        <div className="sticky top-[58px] z-30 bg-black/95 backdrop-blur-md px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'latest' as const, label: '🍿 Latest release' },
            { id: 'topMovies' as const, label: '🔥 Top 10 Movies' },
            { id: 'topSeries' as const, label: '🎮 Top 10 Series' },
            { id: 'all' as const, label: '✨ All' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white text-black shadow'
                    : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-white/10'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Vertical Feed: ~30 stacked cards matching image_316e4175.png */}
        <div className="w-full px-3 py-4 space-y-6">
          {mobileTrendsShows.map((show, idx) => {
            const prog = watchHistory?.[show.id];
            const hasProgress = Boolean(prog && prog.progressPercent && prog.progressPercent > 0);
            const isPlaying = activeVideoId === show.id;
            const backdrop = show.backdropUrl2 || show.backdropUrl || show.posterLandscapeUrl;
            const isInList = watchlist.includes(show.id);

            const playBtnLabel = hasProgress
              ? show.type === 'series'
                ? `Resume S${prog?.seasonNumber || 1} E${prog?.episodeNumber || 1}`
                : 'Resume'
              : 'Play';

            return (
              <div
                key={show.id}
                className="w-full rounded-2xl overflow-hidden bg-[#121214] border border-white/[0.08] shadow-xl flex flex-col"
              >
                {/* 1. Video Trailer / Preview on top with Mute button */}
                <div
                  onClick={() => {
                    if (show.trailerUrl) {
                      setActiveVideoId(isPlaying ? null : show.id);
                    } else {
                      onOpenDetails(show);
                    }
                  }}
                  className="relative w-full aspect-video bg-black cursor-pointer overflow-hidden group"
                >
                  <MediaImage
                    src={backdrop}
                    fallbackTitle={show.title}
                    hideFallback={isPlaying}
                    fallbackClassName="w-full h-full bg-[#181818] flex items-center justify-center p-4 text-center select-none"
                    loading="lazy"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      isPlaying ? 'opacity-0' : 'opacity-100'
                    }`}
                  />

                  {show.trailerUrl && (
                    <video
                      ref={(el) => {
                        mobileVideoRefs.current[show.id] = el;
                      }}
                      playsInline
                      muted={isMuted}
                      loop
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                        isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    />
                  )}

                  {/* Play overlay if paused */}
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center shadow-lg border border-white/20">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Circular Mute button in bottom-right */}
                  {isPlaying && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                      }}
                      onPointerDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="absolute bottom-3 right-3 z-20 before:content-[''] before:absolute before:-inset-3 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center cursor-pointer shadow border border-white/20"
                      aria-label="Toggle sound"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* 2. Below Video: Title PNG Logo, infos, 2-line synopsis, and buttons */}
                <div className="p-4 flex flex-col gap-2.5">
                  {/* PNG Logo or Title */}
                  <div
                    onClick={() => onOpenDetails(show)}
                    className="cursor-pointer min-h-[40px] flex items-center"
                  >
                    {show.titleLogoUrl ? (
                      <div className="relative w-[45%] max-w-[200px] aspect-[2.5/1] overflow-hidden shrink-0">
                        <img
                          src={show.titleLogoUrl}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left drop-shadow-md"
                        />
                      </div>
                    ) : (
                      <h2 className="text-xl font-black text-white font-display tracking-tight">
                        {show.title}
                      </h2>
                    )}
                  </div>

                  {/* Metadata line: e.g. "Limited Series coming on 20 November" or year + rating */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <span className="text-red-500 font-bold uppercase tracking-wider text-[11px]">
                      {show.type === 'movie' ? 'Movie' : 'Series'}
                    </span>
                    <span>•</span>
                    <span>{show.releaseYear.split('-')[0]}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded border border-white/30 text-[10px] font-bold">
                      {show.maturityRating}
                    </span>
                    {show.durationOrSeasons && (
                      <>
                        <span>•</span>
                        <span>{show.durationOrSeasons}</span>
                      </>
                    )}
                  </div>

                  {/* 2-line synopsis below logo matching image_316e4175.png */}
                  <p
                    onClick={() => onOpenDetails(show)}
                    className="text-xs sm:text-sm text-zinc-300/90 leading-relaxed line-clamp-2 cursor-pointer"
                  >
                    {show.synopsis || show.shortDescription || show.description}
                  </p>

                  {/* Action Buttons: Play/Resume & My List */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={() => onPlayShow(show)}
                      className="flex-1 py-2.5 px-4 rounded-full bg-white hover:bg-white/90 text-black font-bold text-sm flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-black shrink-0" />
                      <ResumeButtonProgress
                        label={playBtnLabel}
                        progressPercent={hasProgress ? prog?.progressPercent : undefined}
                        textClassName="text-sm font-bold"
                      />
                    </button>

                    <button
                      onClick={() => onToggleWatchlist(show.id)}
                      className="py-2.5 px-5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm flex items-center justify-center gap-1.5 border border-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      {isInList ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>My List</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================== DESKTOP LAYOUT: 3 Row Feeds under Trends ===================== */}
      <div className="hidden md:block w-full px-6 md:px-10 xl:px-14 pt-8 space-y-10">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            Trends
          </h1>
          <span className="text-sm font-medium text-zinc-400">
            Top releases and what everyone is watching
          </span>
        </div>

        {/* 1. Latest release row (shows 3 titles and edge of 4th) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🍿</span>
            <span>Latest release</span>
          </h2>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {latestReleaseShows.map((show, idx) => (
              <div
                key={show.id}
                className="shrink-0 w-[calc((100vw-112px)/3.35)] max-w-[420px]"
              >
                <ShowCard
                  show={show}
                  rankNumber={idx + 1}
                  isInWatchlist={watchlist.includes(show.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  onOpenDetails={onOpenDetails}
                  onPlay={onPlayShow}
                  onIncrementPoints={() => {}}
                  watchProgress={watchHistory?.[show.id]}
                  cardSize="default"
                  biggerCards={true}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 2. Top 10 Movies row */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🔥</span>
            <span>Top 10 Movies</span>
          </h2>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {top10Movies.map((show, idx) => (
              <div
                key={show.id}
                className="shrink-0 w-[calc((100vw-112px)/3.35)] max-w-[420px]"
              >
                <ShowCard
                  show={show}
                  rankNumber={idx + 1}
                  isInWatchlist={watchlist.includes(show.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  onOpenDetails={onOpenDetails}
                  onPlay={onPlayShow}
                  onIncrementPoints={() => {}}
                  watchProgress={watchHistory?.[show.id]}
                  cardSize="default"
                  biggerCards={true}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. Top 10 Series row */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>🎮</span>
            <span>Top 10 Series</span>
          </h2>
          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {top10Series.map((show, idx) => (
              <div
                key={show.id}
                className="shrink-0 w-[calc((100vw-112px)/3.35)] max-w-[420px]"
              >
                <ShowCard
                  show={show}
                  rankNumber={idx + 1}
                  isInWatchlist={watchlist.includes(show.id)}
                  onToggleWatchlist={onToggleWatchlist}
                  onOpenDetails={onOpenDetails}
                  onPlay={onPlayShow}
                  onIncrementPoints={() => {}}
                  watchProgress={watchHistory?.[show.id]}
                  cardSize="default"
                  biggerCards={true}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
