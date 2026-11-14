import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryItem, Show, ManagedGenreItem } from '../types';
import { MediaImage } from './MediaImage';

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

export const BrowseByGenreRow: React.FC<BrowseByGenreRowProps> = ({
  categories = [],
  managedGenres,
  onSelectGenre,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [displayGenres]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const offset = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth'
    });
  };

  return (
    <section className={`relative w-full my-4 sm:my-6 select-none group/row ${className}`}>
      {/* Section Title matching image_616b6384.png */}
      <div className="px-4 md:px-8 xl:px-12 mb-2.5 sm:mb-3">
        <h2 className="text-white font-extrabold text-base sm:text-lg md:text-xl tracking-tight">
          Browse by Genre
        </h2>
      </div>

      {/* Row Container with arrows */}
      <div className="relative w-full">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="hidden md:flex group/nav absolute left-0 top-0 bottom-0 z-30 w-12 sm:w-14 rounded-r-xl rounded-l-none bg-black/60 text-white items-center justify-center cursor-pointer shadow-xl select-none"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
          </button>
        )}

        {/* Scrollable square cards row */}
        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 sm:gap-3.5 md:gap-4 overflow-x-auto no-scrollbar px-4 md:px-8 xl:px-12 py-1 scroll-smooth"
        >
          {displayGenres.map((genre) => (
            <div
              key={genre.id}
              onClick={() => onSelectGenre(genre)}
              className="relative aspect-square w-[calc((100vw-2.5rem)/2.38)] sm:w-[calc((100vw-4rem)/3.8)] md:w-[calc((100vw-6rem)/5.5)] lg:w-[calc((100vw-7rem)/6.4)] max-w-[220px] shrink-0 rounded-md sm:rounded-lg overflow-hidden bg-[#181818] cursor-pointer shadow-lg active:scale-95 group/card"
            >
              {/* Genre artwork image (no zoom-in effect) */}
              <MediaImage
                src={genre.imageUrl}
                fallbackTitle={genre.displayName}
                hideFallback={true}
                loading="lazy"
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
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="hidden md:flex group/nav absolute right-0 top-0 bottom-0 z-30 w-12 sm:w-14 rounded-l-xl rounded-r-none bg-black/60 text-white items-center justify-center cursor-pointer shadow-xl select-none"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-8 h-8 stroke-[2.5] group-active/nav:scale-75 transition-transform duration-100" />
          </button>
        )}
      </div>
    </section>
  );
};
