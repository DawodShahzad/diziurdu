import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CategoryItem, Show } from '../types';

export interface GenreItem {
  id: string;
  name: string;
  displayName: string;
  imageUrl: string;
  keywords: string[];
}

// Curated high quality square genre cards matching image_616b6384.png
export const DEFAULT_GENRES: GenreItem[] = [
  {
    id: 'action',
    name: 'Action',
    displayName: 'ACTION',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=600&q=80',
    keywords: ['action', 'combat', 'warrior', 'battle', 'adventure']
  },
  {
    id: 'adult-animation',
    name: 'Adult Animation',
    displayName: 'ADULT ANIMATION',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80',
    keywords: ['animation', 'anime', 'cartoon', 'animated', 'adult animation']
  },
  {
    id: 'comedy',
    name: 'Comedy',
    displayName: 'COMEDY',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    keywords: ['comedy', 'humor', 'sitcom', 'funny', 'romantic comedy']
  },
  {
    id: 'crime',
    name: 'Crime',
    displayName: 'CRIME',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    keywords: ['crime', 'mafia', 'detective', 'underworld', 'police']
  },
  {
    id: 'documentaries',
    name: 'Documentaries',
    displayName: 'DOCUMENTARIES',
    imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    keywords: ['documentary', 'history', 'biography', 'docuseries', 'true story']
  },
  {
    id: 'drama',
    name: 'Drama',
    displayName: 'DRAMA',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=600&q=80',
    keywords: ['drama', 'emotional', 'family saga', 'tragedy', 'relationships']
  },
  {
    id: 'romance',
    name: 'Romance',
    displayName: 'ROMANCE',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
    keywords: ['romance', 'love', 'romantic', 'passion', 'romantic dramas']
  },
  {
    id: 'historical',
    name: 'Historical Epics',
    displayName: 'HISTORICAL',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    keywords: ['historical', 'ottoman', 'empire', 'ancient', 'historical epics']
  },
  {
    id: 'thriller',
    name: 'Thriller',
    displayName: 'THRILLER',
    imageUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=600&q=80',
    keywords: ['thriller', 'suspense', 'mystery', 'psychological', 'investigation']
  }
];

interface BrowseByGenreRowProps {
  categories?: CategoryItem[];
  shows?: Show[];
  onSelectGenre: (genre: GenreItem | CategoryItem) => void;
  className?: string;
}

export const BrowseByGenreRow: React.FC<BrowseByGenreRowProps> = ({
  categories = [],
  shows = [],
  onSelectGenre,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Merge default genres with any custom categories if available
  const displayGenres = React.useMemo(() => {
    // If categories are passed from admin/backup, map them or complement them
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
  }, [categories]);

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
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white items-center justify-center cursor-pointer shadow-xl border border-white/10 active:scale-95 transition-all opacity-0 group-hover/row:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-6 h-6" />
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
              className="relative aspect-square w-28 xs:w-32 sm:w-40 md:w-48 lg:w-52 shrink-0 rounded-md sm:rounded-lg overflow-hidden bg-[#181818] border border-white/10 cursor-pointer shadow-lg active:scale-95 hover:scale-[1.03] hover:border-white/30 transition-all duration-300 group/card"
            >
              {/* Genre artwork image */}
              <img
                src={genre.imageUrl}
                alt={genre.displayName}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';
                }}
              />

              {/* Dark atmospheric overlay for bold white text legibility */}
              <div className="absolute inset-0 bg-black/45 group-hover/card:bg-black/30 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

              {/* Bold centered uppercase genre name */}
              <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                <span className="text-white font-black text-xs xs:text-sm sm:text-base md:text-lg tracking-wider uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] line-clamp-2 leading-tight">
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
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white items-center justify-center cursor-pointer shadow-xl border border-white/10 active:scale-95 transition-all opacity-0 group-hover/row:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </section>
  );
};
