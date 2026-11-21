import React, { useState, useEffect, useRef } from 'react';
import { Show, CategoryItem } from '../types';
import fullBackupData from '../full_backup.json';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaImage } from './MediaImage';
import { useDeviceLayout } from '../utils/deviceLayout';

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
  onCategorySelectionChange?: (category: CategoryItem | null) => void;
  resetKey?: number;
  initialCategory?: CategoryItem | null;
  mobileCategoriesStyle?: 'grid' | 'stacked_cards';
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
  onCategorySelectionChange,
  resetKey,
  initialCategory,
  mobileCategoriesStyle = 'grid'
}) => {
  const { isMobile } = useDeviceLayout();
  const [selectedCategory, setSelectedCategory] = useState<CategoryItem | null>(initialCategory || null);
  const categoryScrollPosRef = useRef<number>(0);

  // Sync when initialCategory changes
  useEffect(() => {
    setSelectedCategory(initialCategory || null);
  }, [initialCategory]);

  // Notify parent whenever internal selectedCategory changes
  useEffect(() => {
    onCategorySelectionChange?.(selectedCategory);
  }, [selectedCategory, onCategorySelectionChange]);

  // When resetKey changes (e.g. user re-clicks Categories in filter strip), return to categories list
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
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
    <div
      className={`pb-36 w-full animate-in fade-in duration-300 ${
        isMobile
          ? selectedCategory
            ? 'pt-14 px-2.5 sm:px-4'
            : 'pt-2 sm:pt-4 px-3 sm:px-4'
          : selectedCategory
          ? 'pt-28 lg:pt-32 px-8 xl:px-12'
          : 'pt-36 lg:pt-40 px-8 xl:px-12'
      }`}
    >
      {/* If a category is selected: mobile & desktop show top header name & 2:3 poster grid */}
      {selectedCategory ? (
        <div className={isMobile ? 'pt-2' : 'pt-2'}>
          {/* Mobile Fixed Header matching Top 10 List Page */}
          {isMobile ? (
            <div className="fixed top-0 inset-x-0 z-50 h-14 bg-black px-4 flex items-center justify-between border-b border-white/10 select-none">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    onCategorySelectionChange?.(null);
                    window.scrollTo({ top: categoryScrollPosRef.current || 0, behavior: 'instant' });
                  }}
                  className="p-1 -ml-1.5 text-white hover:text-white/80 active:scale-90 transition-transform cursor-pointer shrink-0"
                  aria-label="Back to categories"
                >
                  <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
                </button>
                <h1 className="text-lg font-black text-white tracking-tight truncate">
                  {selectedCategory.name}
                </h1>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-6 select-none">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  onCategorySelectionChange?.(null);
                  window.scrollTo({ top: categoryScrollPosRef.current || 0, behavior: 'instant' });
                }}
                className="p-1.5 -ml-1.5 text-white/85 hover:text-white hover:bg-white/10 rounded-full active:scale-90 transition-all cursor-pointer shrink-0"
                aria-label="Back to categories"
              >
                <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
              </button>
              <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight truncate">
                {selectedCategory.name}
              </h1>
            </div>
          )}

          {/* Posters Grid for Selected Category: exact match to Mobile DetailModal More Like This */}
          <div
            className={`grid ${
              isMobile
                ? 'grid-cols-3 gap-2 sm:gap-2.5'
                : 'grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5'
            }`}
          >
            {getShowsForCategory(selectedCategory).map((show) => (
              <div
                key={show.id}
                data-show-id={show.id}
                onClick={() => onOpenDetails(show)}
                className="aspect-[2/3] rounded-md overflow-hidden bg-black shadow cursor-pointer group active:scale-95 transition-transform"
              >
                <MediaImage
                  src={show.posterVerticalUrl || show.posterUrl || show.posterLandscapeUrl}
                  fallbackTitle={show.title}
                  fallbackClassName={`w-full h-full ${isMobile ? 'bg-[#111]' : 'bg-[#181818]'} flex items-center justify-center p-2.5 text-center select-none`}
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
        /* Main Categories View */
        <div className="w-full">
          {/* Mobile Stacked Landscape Cards Option (matching image_471696e6.png) */}
          {isMobile && mobileCategoriesStyle === 'stacked_cards' && (
            <div className="space-y-3 pb-4">
              {activeCategories.map((cat) => {
                const matchedShows = getShowsForCategory(cat);
                const subtitleText =
                  cat.description?.trim() ||
                  (matchedShows.length > 0
                    ? Array.from(new Set(matchedShows.flatMap((s) => s.genres || [])))
                        .slice(0, 3)
                        .join(', ')
                    : `${cat.name} Collection`);
                const collageImages = [
                  ...matchedShows.slice(0, 4).map((s) => s.posterLandscapeUrl || s.backdropUrl || s.posterVerticalUrl),
                  cat.imageUrl
                ].filter(Boolean);

                return (
                  <div
                    key={`stacked-${cat.id}`}
                    onClick={() => {
                      handleSelectCategory(cat);
                      if (onSelectCategoryCard) {
                        onSelectCategoryCard(cat);
                      }
                    }}
                    className="group relative w-full h-[106px] rounded-[10px] overflow-hidden bg-[#141416] border border-white/[0.08] flex items-center justify-between cursor-pointer active:scale-[0.985] transition-all duration-200 shadow-lg"
                  >
                    {/* Right Artwork Zone */}
                    <div className="absolute right-0 top-0 bottom-0 w-[64%] overflow-hidden pointer-events-none">
                      {cat.narrowLandscapeUrl ? (
                        <MediaImage
                          src={cat.narrowLandscapeUrl}
                          fallbackTitle={cat.name}
                          hideFallback={true}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : collageImages.length >= 2 ? (
                        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-1 rotate-[-10deg] scale-125 opacity-90">
                          {[0, 1, 2, 3].map((slotIdx) => (
                            <div key={slotIdx} className="w-full h-full overflow-hidden rounded-[3px] bg-zinc-900">
                              <img
                                src={collageImages[slotIdx % collageImages.length]}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <MediaImage
                          src={cat.imageUrl}
                          fallbackTitle={cat.name}
                          hideFallback={true}
                          className="w-full h-full object-cover object-center"
                        />
                      )}

                      {/* Left-to-right gradient fade blending artwork smoothly into dark card background */}
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background:
                            'linear-gradient(90deg, #141416 0%, rgba(20,20,22,0.92) 18%, rgba(20,20,22,0.45) 52%, rgba(0,0,0,0.22) 100%)'
                        }}
                      />
                    </div>

                    {/* Left Title & Subtitle */}
                    <div className="relative z-10 flex-1 pl-4 pr-3 py-3 min-w-0 max-w-[60%]">
                      <h3 className="text-white font-bold text-[17px] tracking-tight truncate leading-snug drop-shadow">
                        {cat.name}
                      </h3>
                      <p className="text-zinc-400 text-[12px] font-medium truncate mt-0.5 leading-snug">
                        {subtitleText}
                      </p>
                    </div>

                    {/* Right subtle circular chevron indicator */}
                    <div className="relative z-10 pr-3.5 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-zinc-900/80 border border-white/15 flex items-center justify-center text-white/90 shadow-md">
                        <ChevronRight className="w-4 h-4 stroke-[2.2]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Grid Categories View (Desktop always; Mobile when mobileCategoriesStyle === 'grid') */}
          {(!isMobile || mobileCategoriesStyle !== 'stacked_cards') && (
          <div
            className={`grid ${
              isMobile
                ? 'grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3'
                : 'grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5'
            }`}
          >
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
                  className={`group relative ${
                    isMobile ? 'aspect-[2/3] bg-black' : 'aspect-[16/9] bg-[#16171d]'
                  } w-full rounded-2xl overflow-hidden border border-zinc-400/[0.09] cursor-pointer shadow-md transition-all duration-200 active:scale-95 hover:border-zinc-300/30`}
                >
                  {/* Category Background Image */}
                  <MediaImage
                    src={cat.imageUrl}
                    fallbackTitle={cat.name}
                    hideFallback={true}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          )}
        </div>
      )}
    </div>
  );
};
