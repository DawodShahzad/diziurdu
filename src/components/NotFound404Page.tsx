import React from 'react';
import { Home, Search, Film } from 'lucide-react';

interface NotFound404PageProps {
  onGoHome: () => void;
  onOpenSearch: () => void;
  platformName?: string;
}

export const NotFound404Page: React.FC<NotFound404PageProps> = ({
  onGoHome,
  onOpenSearch,
  platformName = 'Dizi Urdu'
}) => {
  return (
    <div className="min-h-screen w-full bg-black md:bg-[#141414] text-white flex flex-col items-center justify-center relative overflow-hidden px-6 py-24 select-none">
      {/* Desktop subtle atmospheric glow (hidden on pure black mobile) */}
      <div
        aria-hidden="true"
        className="hidden md:block absolute -top-24 left-1/2 -translate-x-1/2 w-[620px] h-[420px] rounded-full blur-[150px] opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #e50914 0%, #991b1b 45%, transparent 80%)'
        }}
      />

      {/* Mobile Dedicated 404 Layout (#000000 pure black, clean centered cardless minimal hierarchy) */}
      <div className="md:hidden relative z-10 w-full max-w-xs mx-auto flex flex-col items-center text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
          <Film className="w-7 h-7 text-red-500" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.28em] text-red-500 block">
            Error 404
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white font-display">
            Page Not Found
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
            The title or link you&apos;re looking for isn&apos;t available on {platformName}.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            onClick={onGoHome}
            className="w-full py-3 px-6 rounded-full bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Home className="w-4 h-4 fill-black" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full py-2.5 px-6 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Titles</span>
          </button>
        </div>
      </div>

      {/* Desktop Dedicated 404 Layout (#141414 dark cinema backdrop with bold 404 editorial typography) */}
      <div className="hidden md:flex relative z-10 max-w-2xl mx-auto flex-col items-center text-center space-y-6">
        <div className="relative">
          <span className="text-[120px] lg:text-[152px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-300 to-zinc-700 font-display select-none">
            404
          </span>
          <div className="h-1 w-24 mx-auto bg-[#e50914] rounded-full mt-2" />
        </div>

        <div className="space-y-2.5 max-w-lg">
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-display">
            Lost in the Story
          </h1>
          <p className="text-sm lg:text-base text-zinc-400 leading-relaxed">
            Sorry, we couldn&apos;t find the page you were looking for. Explore series, movies, and featured collections back on the home screen.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3.5 pt-2">
          <button
            type="button"
            onClick={onGoHome}
            className="px-7 py-2.5 rounded-full bg-white hover:bg-zinc-200 active:scale-95 text-black font-bold text-sm flex items-center gap-2 shadow-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 fill-black" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={onOpenSearch}
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-sm border border-white/15 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Browse Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};
