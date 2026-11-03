import React, { useState, useEffect, useRef } from 'react';
import { Show, CategoryItem } from '../types';
import fullBackupData from '../full_backup.json';
import { ArrowLeft } from 'lucide-react';

const INITIAL_CATEGORIES: CategoryItem[] = ((fullBackupData as any)?.categoriesList as CategoryItem[]) || [];
export type { CategoryItem };

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

export const CATEGORIES_DATA: CategoryItem[] = INITIAL_CATEGORIES || [];

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

    return shows.filter((s) => {
      // 1. Direct match with checked categories on show:
      if (Array.isArray(s.categories) && s.categories.length > 0) {
        return s.categories.some(
          (c) => c.toLowerCase() === catNameLower || c.toLowerCase() === catIdLower
        );
      }
      // 2. Keyword fallback if show categories not explicitly checked
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
  };

  const handleSelectCategory = (cat: CategoryItem) => {
    categoryScrollPosRef.current = window.scrollY;
    setSelectedCategory(cat);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Only display categories from full backup / admin settings with zero mock data
  const activeCategories = (categories && categories.length > 0)
    ? categories
    : (INITIAL_CATEGORIES && INITIAL_CATEGORIES.length > 0)
    ? INITIAL_CATEGORIES
    : [];

  return (
    <div className="pt-2 sm:pt-4 md:pt-36 lg:pt-40 pb-36 px-3 sm:px-4 md:px-8 xl:px-12 w-full animate-in fade-in duration-300">
      {/* If a category is selected: header with back button and top padding so cards never hide behind navbar */}
      {selectedCategory ? (
        <div className="space-y-6 pt-4 md:pt-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <button
              onClick={() => setSelectedCategory(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Categories</span>
            </button>
            <div className="text-right">
              <h2 className="text-white font-extrabold text-sm sm:text-lg md:text-xl">
                {selectedCategory.name}
              </h2>
              <span className="text-xs text-zinc-400">
                {getShowsForCategory(selectedCategory).length} titles
              </span>
            </div>
          </div>

          {/* Posters Grid for Selected Genre: 2:3 vertical posters with generous top clearance */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 pt-4 md:pt-6">
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
      ) : activeCategories.length === 0 ? (
        <div className="py-24 text-center text-zinc-500">
          <p className="text-base font-medium text-zinc-400">No categories found in database.</p>
          <p className="text-xs text-zinc-500 mt-1">Add categories from the Admin Panel or link your full_backup.json.</p>
        </div>
      ) : (
        /* Main Categories View: Landscape categories on desktop (16:9), portrait on mobile (2:3) with generous top padding */
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
            {activeCategories.map((cat) => {
              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    handleSelectCategory(cat);
                    if (onSelectCategoryCard) {
                      onSelectCategoryCard(cat);
                    }
                  }}
                  className="group relative aspect-[2/3] md:aspect-[16/9] w-full rounded-lg overflow-hidden bg-[#16171d] border border-zinc-400/[0.09] cursor-pointer shadow-md transition-all duration-200 active:scale-95 hover:border-zinc-300/30"
                >
                  {/* Category Background Image */}
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
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
