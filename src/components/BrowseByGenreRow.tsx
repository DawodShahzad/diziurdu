import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryItem, Show, ManagedGenreItem } from '../types';
import { MediaImage } from './MediaImage';
import { useDeviceLayout } from '../utils/deviceLayout';

export interface GenreItem {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  keywords: string[];
  enabled?: boolean;
}

// Curated high quality square genre cards matching image_616b6384.png
export const DEFAULT_GENRES: GenreItem[] = [
  {
    id: 'action',
    name: 'Action',
    displayName: 'ACTION',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
    keywords: ['action', 'combat', 'warrior', 'battle', 'adventure'],
    enabled: true
  },
  {
    id: 'adult-animation',
    name: 'Adult Animation',
    displayName: 'ADULT ANIMATION',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    keywords: ['animation', 'anime', 'cartoon', 'animated', 'adult animation'],
    enabled: true
  },
  {
    id: 'comedy',
    name: 'Comedy',
    displayName: 'COMEDY',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    keywords: ['comedy', 'humor', 'sitcom', 'funny', 'romantic comedy'],
    enabled: true
  },
  {
    id: 'crime',
    name: 'Crime',
    displayName: 'CRIME',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    keywords: ['crime', 'mafia', 'detective', 'underworld', 'police'],
    enabled: true
  },
  {
    id: 'documentaries',
    name: 'Documentaries',
    displayName: 'DOCUMENTARIES',
    imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    keywords: ['documentary', 'history', 'biography', 'docuseries', 'true story'],
    enabled: true
  },
  {
    id: 'drama',
    name: 'Drama',
    displayName: 'DRAMA',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    keywords: ['drama', 'emotional', 'family saga', 'tragedy', 'relationships'],
    enabled: true
  },
  {
    id: 'romance',
    name: 'Romance',
    displayName: 'ROMANCE',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
    keywords: ['romance', 'love', 'romantic', 'passion', 'romantic dramas'],
    enabled: true
  },
  {
    id: 'historical',
    name: 'Historical Epics',
    displayName: 'HISTORICAL',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    keywords: ['historical', 'ottoman', 'empire', 'ancient', 'historical epics'],
    enabled: true
  },
  {
    id: 'thriller',
    name: 'Thriller',
    displayName: 'THRILLER',
    imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
    keywords: ['thriller', 'suspense', 'mystery', 'psychological', 'investigation'],
    enabled: true
  }
];

interface BrowseByGenreRowProps {
  categories?: CategoryItem[];
  shows?: Show[];
  managedGenres?: ManagedGenreItem[];
  onSelectGenre: (genre: GenreItem | CategoryItem) => void;
  className?: string;
}

let hasBrowseByGenreLoaded = false;
const cachedGenreLoadedIndices = new Set<number>([0, 1, 2, 3, 4, 5]);

export const BrowseByGenreRow: React.FC<BrowseByGenreRowProps> = ({
  categories = [],
  managedGenres,
  onSelectGenre,
  className = ''
}) => {
  const rowSectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isMobile, isLandscape } = useDeviceLayout();
  const isMobileLandscapeLayout = Boolean(isMobile && isLandscape);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [navBox, setNavBox] = useState<{ top: number; height: number } | null>(null);
  const [isRowInView, setIsRowInView] = useState(hasBrowseByGenreLoaded);
  const [loadedCardIndices, setLoadedCardIndices] = useState<Set<number>>(() => new Set(cachedGenreLoadedIndices));

  // Use admin-managed genre cards if configured, otherwise fallback to default genres + category artwork
  const displayGenres = React.useMemo(() => {
    if (managedGenres && managedGenres.length > 0) {
      return managedGenres
        .filter((g) => g.enabled !== false)
        .map((g) => ({
          id: g.id,
          name: g.name,
          displayName: g.displayName || g.name.toUpperCase(),
          imageUrl: g.imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
          keywords: g.keywords && g.keywords.length > 0 ? g.keywords : [g.name.toLowerCase()],
          enabled: g.enabled !== false
        }));
    }

    const list: GenreItem[] = [...DEFAULT_GENRES];

    // Also enrich with any category artwork if matched
    if (categories && categories.length > 0) {
      categories.forEach((cat) => {
        const found = list.find(
          (g) =>
            g.name.toLowerCase() === cat.name.toLowerCase() ||
            cat.name.toLowerCase().includes(g.name.toLowerCase()) ||
            g.name.toLowerCase().includes(cat.name.toLowerCase())
        );
        if (found && cat.imageUrl) {
          found.imageUrl = cat.imageUrl;
        } else if (!found) {
          list.push({
            id: cat.id,
            name: cat.name,
            displayName: cat.name.toUpperCase(),
            imageUrl: cat.imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
            keywords: cat.genreKeywords || [cat.name.toLowerCase()]
          });
        }
      });
    }

    return list;
  }, [categories, managedGenres]);

  useEffect(() => {
    const el = rowSectionRef.current;
    if (!el || isRowInView) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          hasBrowseByGenreLoaded = true;
          setIsRowInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: '120px 0px', threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isRowInView]);

  useEffect(() => {
    if (!isRowInView) return;
    const container = scrollRef.current;
    if (!container) return;
    const obs = new IntersectionObserver(
      (entries) => {
        setLoadedCardIndices((prev) => {
          let changed = false;
          const next = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const raw = (entry.target as HTMLElement).dataset.genreIdx;
              if (raw !== undefined) {
                const idx = Number(raw);
                if (!next.has(idx)) {
                  next.add(idx);
                  changed = true;
                }
              }
            }
          });
          return changed ? next : prev;
        });
      },
      { root: container, rootMargin: '0px 80px 0px 80px', threshold: 0.01 }
    );
    container.querySelectorAll('[data-genre-idx]').forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, [isRowInView, displayGenres.length]);

  const updateNavBox = () => {
    const el = scrollRef.current;
    const parentEl = el?.parentElement;
    if (!el || !parentEl) return;
    const cardEl = el.querySelector('[data-genre-idx]') as HTMLElement | null;
    if (!cardEl) return;
    const parentRect = parentEl.getBoundingClientRect();
    const cardRect = cardEl.getBoundingClientRect();
    const height = Math.round(cardRect.height);
    if (height > 0) {
      setNavBox({ top: Math.round(cardRect.top - parentRect.top), height });
    }
  };

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    updateNavBox();
  };

  useEffect(() => {
    checkScroll();
    const rafId = requestAnimationFrame(checkScroll);
    const el = scrollRef.current;
    if (!el) return () => cancelAnimationFrame(rafId);

    const handleWheel = (e: WheelEvent) => {
      const firstCard = el.querySelector('[data-genre-idx]') as HTMLElement | null;
      if (!firstCard) return;
      const cardRect = firstCard.getBoundingClientRect();
      const y = e.clientY;
      if (y < cardRect.top || y > cardRect.bottom) {
        e.preventDefault();
        if (Math.abs(e.deltaY) > 0) {
          window.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
        }
      }
    };

    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    const firstCard = el.querySelector('[data-genre-idx]') as HTMLElement | null;
    if (firstCard) ro.observe(firstCard);
    el.addEventListener('scroll', checkScroll, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('resize', checkScroll);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', checkScroll);
    };
  }, [displayGenres, isRowInView]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth'
    });
  };

  return (
    <section
      ref={rowSectionRef}
      className={`relative w-full ${isMobileLandscapeLayout ? 'my-1' : 'my-2 sm:my-3'} select-none group/row ${className}`}
    >
      {/* Section Title matching feed header spacing */}
      <div className="px-4 md:px-8 xl:px-12 mb-1 sm:mb-1.5">
        {!isRowInView ? (
          <div className="w-40 h-5 sm:h-6 rounded skeleton-wave" />
        ) : (
          <h2
            className={`text-white/95 tracking-tight ${
              isMobileLandscapeLayout
                ? 'font-normal text-[13.5px]'
                : 'font-semibold text-[15px] sm:text-base md:text-[17px]'
            }`}
          >
            Browse by Genre
          </h2>
        )}
      </div>

      {!isRowInView ? (
        <div className="flex items-center gap-2 sm:gap-3.5 md:gap-4 overflow-hidden px-3 sm:px-4 md:px-8 xl:px-12 py-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`genre-skel-${i}`}
              className="aspect-square w-[calc((100vw-2rem)/3.22)] sm:w-[calc((100vw-4rem)/3.8)] md:w-[calc((100vw-6rem)/5.5)] lg:w-[calc((100vw-7rem)/6.4)] max-w-[220px] shrink-0 rounded-lg md:rounded-xl skeleton-wave"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      ) : (
      /* Row Container with arrows */
      <div className="relative w-full">
        {/* Left Arrow Button */}
        {!isMobile && canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            style={{
              top: navBox ? `${navBox.top}px` : '4px',
              height: navBox ? `${navBox.height}px` : 'calc(100% - 8px)',
              background: 'linear-gradient(to right, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
            }}
            className="flex group/nav absolute left-0 z-30 w-12 sm:w-14 md:w-16 rounded-none text-white items-center justify-start pl-1.5 sm:pl-2 cursor-pointer border-0 select-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
          </button>
        )}

        {/* Scrollable square cards row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2 sm:gap-3.5 md:gap-4 overflow-x-auto no-scrollbar px-3 sm:px-4 md:px-8 xl:px-12 py-1 scroll-smooth"
        >
          {displayGenres.map((genre, gIdx) => (
            <div
              key={genre.id}
              data-genre-idx={gIdx}
              onClick={() => onSelectGenre(genre)}
              className="relative aspect-square w-[calc((100vw-2rem)/3.22)] sm:w-[calc((100vw-4rem)/3.8)] md:w-[calc((100vw-6rem)/5.5)] lg:w-[calc((100vw-7rem)/6.4)] max-w-[220px] shrink-0 rounded-lg md:rounded-xl overflow-hidden bg-[#181818] cursor-pointer shadow-lg active:scale-95 group/card"
            >
              {/* Genre artwork image (no zoom-in effect) */}
              <MediaImage
                src={genre.imageUrl}
                fallbackTitle={genre.displayName}
                hideFallback={true}
                deferLoad={!loadedCardIndices.has(gIdx)}
                className="w-full h-full object-cover"
              />

              {/* Clean matte dark overlay (glare removed) */}
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />

              {/* Centered uppercase genre name with reduced boldness */}
              <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                <span className="text-white font-bold text-xs xs:text-sm sm:text-base md:text-lg tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] line-clamp-2 leading-tight">
                  {genre.displayName}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Right Arrow Button */}
        {!isMobile && canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            style={{
              top: navBox ? `${navBox.top}px` : '4px',
              height: navBox ? `${navBox.height}px` : 'calc(100% - 8px)',
              background: 'linear-gradient(to left, rgba(0, 0, 0, 0.72) 0%, rgba(0, 0, 0, 0.42) 45%, rgba(0, 0, 0, 0.14) 76%, rgba(0, 0, 0, 0) 100%)'
            }}
            className="flex group/nav absolute right-0 z-30 w-12 sm:w-14 md:w-16 rounded-none text-white items-center justify-end pr-1.5 sm:pr-2 cursor-pointer border-0 select-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8 stroke-[2.5] drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)] group-active/nav:scale-75 transition-transform duration-100" />
          </button>
        )}
      </div>
      )}
    </section>
  );
};
