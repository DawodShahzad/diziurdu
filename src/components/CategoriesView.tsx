import React, { useState, useEffect, useRef } from 'react';
import { Show } from '../types';

export interface CategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  genreKeywords: string[];
}

interface CategoriesViewProps {
  shows: Show[];
  categories?: CategoryItem[];
  watchlist: string[];
  onToggleWatchlist: (showId: string) => void;
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
  onIncrementPoints: (showId: string) => void;
  onCloseCategories?: () => void;
  onSelectCategoryCard?: (category: CategoryItem) => void;
  resetKey?: number;
}

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: 'historical-ottoman',
    name: 'Historical & Ottoman',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    description: 'Grand Ottoman imperial sagas, heroic warrior conquests, and legendary battles of the Turkish states.',
    genreKeywords: ['historical', 'ottoman', 'war drama', 'epic']
  },
  {
    id: 'action-thrills',
    name: 'Action & Thrills',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    description: 'Adrenaline-fueled sword combat, maritime warfare, high-stakes heists, and pulse-pounding chases.',
    genreKeywords: ['action', 'thriller', 'adventure', 'war']
  },
  {
    id: 'drama',
    name: 'Drama',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    description: 'Heart-wrenching family sagas, deep emotional dilemmas, and award-winning cinematic storytelling.',
    genreKeywords: ['drama', 'poetic drama', 'family']
  },
  {
    id: 'romance',
    name: 'Romance',
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=800&q=80',
    description: 'Passionate Turkish love stories, forbidden attachments, poetry, and magnetic chemistry.',
    genreKeywords: ['romance', 'romantic series', 'love']
  },
  {
    id: 'crime',
    name: 'Crime',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
    description: 'Underworld crime families, mafia loyalties, police mysteries, and dark psychological twists.',
    genreKeywords: ['crime', 'crime drama', 'psychological', 'bingey thriller']
  },
  {
    id: 'comedy',
    name: 'Comedy',
    imageUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=800&q=80',
    description: 'Witty social satire, light-hearted situational comedy, and delightful Turkish humor.',
    genreKeywords: ['comedy', 'satire', 'light']
  },
  {
    id: 'kids-family',
    name: 'Kids & Family',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    description: 'Wholesome entertainment, historical adventure for all generations, and moral stories.',
    genreKeywords: ['family', 'kids', 'adventure']
  },
  {
    id: 'sci-fi',
    name: 'Sci-Fi',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    description: 'Speculative fiction, supernatural mysteries, and futuristic reimaginations.',
    genreKeywords: ['sci-fi', 'mystery', 'fantasy']
  },
  {
    id: 'horror',
    name: 'Horror',
    imageUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=800&q=80',
    description: 'Spine-chilling folklore, psychological dread, haunted landscapes, and nocturnal terrors.',
    genreKeywords: ['horror', 'thriller', 'psychological']
  },
  {
    id: 'reality-documentary',
    name: 'Reality & Documentary',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80',
    description: 'Behind-the-scenes historical retrospectives, cultural documentaries, and life in Anatolia.',
    genreKeywords: ['documentary', 'biography', 'reality']
  },
  {
    id: 'westerns-classics',
    name: 'Westerns & Classics',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    description: 'Golden era Turkish cinema, frontier survival, and timeless cinematic masterpieces.',
    genreKeywords: ['classics', 'frontier', 'award winner', 'historical']
  },
  {
    id: 'superheroes',
    name: 'Superheroes',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    description: 'Legendary Turkish heroes, mythical defenders, and larger-than-life warriors fighting for justice.',
    genreKeywords: ['warrior', 'epic', 'action', 'hero']
  },
  {
    id: 'game-shows',
    name: 'Game Shows',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    description: 'Trivia, cultural contests, and thrilling competitive tournaments.',
    genreKeywords: ['game', 'competition', 'trivia']
  },
  {
    id: 'talk-shows',
    name: 'Talk Shows',
    imageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
    description: 'Candid celebrity conversations, film premieres, and star interviews with Turkish icons.',
    genreKeywords: ['talk show', 'interview', 'celebrity']
  },
  {
    id: 'holidays-religion',
    name: 'Holidays & Religion',
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
    description: 'Islamic history, spiritual reflections, Ramadan specials, and the wisdom of Sufi scholars.',
    genreKeywords: ['religion', 'faith', 'islamic', 'spiritual']
  },
  {
    id: 'soaps-telenovelas',
    name: 'Soaps & Telenovelas',
    imageUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
    description: 'High-drama Turkish dizileri, lavish Istanbul mansions, dynastic secrets, and eternal romances.',
    genreKeywords: ['soaps', 'dizi', 'romance', 'drama']
  }
];

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  shows,
  categories,
  watchlist,
  onToggleWatchlist,
  onOpenDetails,
  onPlayShow,
  onIncrementPoints,
  onCloseCategories,
  onSelectCategoryCard,
  resetKey
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(null);
  const categoryScrollPosRef = useRef<number>(0);

  // When resetKey changes (e.g. user re-clicks Categories in filter strip), return to categories list
  useEffect(() => {
    if (resetKey !== undefined) {
      setSelectedCategory(null);
    }
  }, [resetKey]);

  // Helper to find shows matching an admin-created category
  const getShowsForCategory = (category: CategoryItem): Show[] => {
    const catNameLower = category.name.toLowerCase();
    const catIdLower = category.id.toLowerCase();

    const matches = shows.filter((s) => {
      // 1. Direct match with checked categories on show:
      if (Array.isArray(s.categories) && s.categories.length > 0) {
        return s.categories.some(
          (c) => c.toLowerCase() === catNameLower || c.toLowerCase() === catIdLower
        );
      }
      // 2. Keyword fallback if show categories not yet assigned
      const showGenreStr = (s.genres || []).join(' ').toLowerCase();
      const titleStr = s.title.toLowerCase();
      const descStr = (s.shortDescription || '').toLowerCase();
      const kwList = (category.genreKeywords && category.genreKeywords.length > 0)
        ? category.genreKeywords
        : category.name.toLowerCase().split(/[ &,-]+/).filter(Boolean);
      return kwList.some(
        (kw) =>
          showGenreStr.includes(kw.toLowerCase()) ||
          titleStr.includes(kw.toLowerCase()) ||
          descStr.includes(kw.toLowerCase())
      );
    });

    return matches;
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    categoryScrollPosRef.current = window.scrollY;
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="pt-2 sm:pt-4 pb-36 px-3 sm:px-4 md:px-8 xl:px-12 w-full animate-in fade-in duration-300">
      {/* If a category is selected: header section removed as requested. Directly show the title cards in 2:3 layout */}
      {selectedCategory ? (
        <div className="space-y-4">
          {/* Posters Grid for Selected Genre (Same layout as More Like This section: 2:3 vertical posters, 3 in row on mobile) */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {getShowsForCategory(selectedCategory).map((show) => (
              <div
                key={show.id}
                onClick={() => onOpenDetails(show)}
                className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform border border-white/5"
              >
                <img
                  src={show.posterVerticalUrl || show.posterUrl || show.posterLandscapeUrl}
                  alt={show.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Categories View: "Browse Categories" heading removed. Category cards in 2:3 vertical aspect ratio with white text & glare */
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3 md:gap-4">
            {((categories && categories.length > 0) ? categories : CATEGORIES_DATA).map((cat) => {
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    handleSelectCategory(cat);
                    if (onSelectCategoryCard) {
                      onSelectCategoryCard(cat);
                    }
                  }}
                  className="group relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-[#16171d] border border-zinc-400/[0.09] cursor-pointer shadow-md transition-all duration-200 active:scale-95"
                >
                  {/* Category Background Image */}
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to rich high-res Turkish drama background if external image fails
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80';
                    }}
                  />

                  {/* Dark Gradient Overlay for bottom text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent group-hover:from-black/95 transition-all" />

                  {/* Glare overlay matching popout view */}
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      background:
                        'radial-gradient(ellipse 80% 70% at 50% 100%, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.05) 75%, transparent 100%)'
                    }}
                  />

                  {/* Category Title at Bottom in White with Glare */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-20 flex items-end">
                    <h3 className="text-white font-extrabold text-xs sm:text-sm md:text-base tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)] line-clamp-2 leading-tight">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
