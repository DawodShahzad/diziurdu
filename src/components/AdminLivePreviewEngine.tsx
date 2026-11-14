import React, { useState } from 'react';
import { Show } from '../types';
import { Monitor, Smartphone, Layers, Play, Plus, Check, Volume2, Info, Star, Share2 } from 'lucide-react';

interface AdminLivePreviewEngineProps {
  formData: Show;
}

export const AdminLivePreviewEngine: React.FC<AdminLivePreviewEngineProps> = ({ formData }) => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile' | 'social' | 'categories'>('desktop');

  const title = formData.title || 'Untitled Show';
  const logo = formData.titleLogoUrl;
  const synopsis =
    formData.synopsis ||
    formData.description ||
    formData.shortDescription ||
    'A gripping dramatic story filled with suspense, passion, and intense family rivalries.';

  // Colors
  const desktopRecAmbiance = formData.desktopRecommendationBackdropAmbiance || formData.ambientColor || '#b45309';
  const desktopFeedAmbiance = formData.desktopNormalFeed16x9Ambiance || formData.ambientColor || '#b45309';
  const desktopTop10Ambiance = formData.desktopTop10Image2x3Ambiance || formData.ambientColor || '#b45309';
  const desktopSpecialAmbiance = formData.desktopSpecialSingleFeedAmbiance || formData.ambientColor || '#0d9488';
  const stretchAmbiance = formData.stretchableFeedPoster9x16Ambiance || formData.ambientColor || '#b45309';
  const moreInfoAmbiance = formData.moreInfoBackdropAmbiance || formData.ambientColor || '#b45309';

  const mobileRec9x16Ambiance = formData.mobileRecommendation9x16BackdropAmbiance || formData.ambientColor || '#0d9488';
  const mobileNormal2x3Ambiance = formData.mobileNormalFeed2x3Ambiance || formData.ambientColor || '#b45309';
  const mobileSpecialAmbiance = formData.mobileSpecialSingleFeedAmbiance || formData.ambientColor || '#0d9488';
  const mobileNoPreviewPosterAmbiance = formData.mobileNoPreviewPosterHeroAmbiance || formData.ambientColor || '#b45309';
  const mobileNoPreviewCardAmbiance = formData.mobileNoPreviewCard2x3Ambiance || formData.ambientColor || '#b45309';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Engine Header & Subtabs */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-900 border border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Live Preview Engine
            </span>
            <h4 className="text-sm font-bold text-white">Real-Time User Experience Simulator</h4>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Toggle between Desktop, Mobile, Social Share Cards, and Category layouts to inspect how all uploaded images and individual ambiance colors look to real users.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'desktop' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop Views</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'mobile' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Views</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'social' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Link Preview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'categories' ? 'bg-amber-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEWS                                                          */}
      {/* ========================================================================= */}
      {activeTab === 'desktop' && (
        <div className="space-y-6">
          {/* A. Modern Top 10 Rank Feed Strip Preview */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white">Modern Top 10 Rank Card (Feed Strip)</h5>
                <p className="text-[10px] text-zinc-400">
                  80% exposed rank number on left, uniform 2:3 card width (cards 1-10 identical size), bottom logo translates up on hover with Play/List buttons.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Ambiance: {desktopTop10Ambiance}
              </span>
            </div>

            <div className="p-8 bg-[#0b0d14] rounded-xl flex items-center justify-center overflow-visible">
              <div className="relative flex items-center select-none group/top10preview cursor-pointer">
                {/* 80% Exposed Outlined Rank Number */}
                <div className="relative z-0 pointer-events-none select-none shrink-0 flex items-center justify-end leading-none w-14 sm:w-18 overflow-visible">
                  <span
                    className="text-8xl sm:text-9xl md:text-[140px] font-black font-sans tracking-tighter"
                    style={{
                      WebkitTextStroke: '2px rgba(255, 255, 255, 0.45)',
                      color: 'transparent',
                      lineHeight: 0.85
                    }}
                  >
                    1
                  </span>
                </div>

                {/* 2:3 Poster Card */}
                <div className="-ml-3 relative z-10 aspect-[2/3] w-44 sm:w-52 shrink-0 rounded-xl overflow-visible transition-transform duration-300 ease-out group-hover/top10preview:scale-[1.05]">
                  {/* Glowing Ambiance Halo on Hover */}
                  <div
                    className="absolute -inset-y-8 -inset-x-6 rounded-3xl pointer-events-none -z-10 blur-2xl opacity-0 group-hover/top10preview:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, ${desktopTop10Ambiance}88 0%, ${desktopTop10Ambiance}40 45%, ${desktopTop10Ambiance}10 70%, transparent 85%)`
                    }}
                  />

                  <div className="relative w-full h-full rounded-xl overflow-hidden bg-[#14151b] shadow-2xl">
                    <img
                      src={
                        formData.desktopTop10Image2x3Url ||
                        formData.posterVerticalUrl ||
                        formData.poster9x16Url ||
                        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80'
                      }
                      alt="Top 10"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/95 via-black/50 to-transparent pointer-events-none z-10" />

                    {/* Logo at Bottom Center */}
                    <div className="absolute inset-x-2 bottom-3.5 z-20 flex flex-col items-center justify-end pointer-events-none transition-transform duration-300 ease-out group-hover/top10preview:-translate-y-12">
                      {logo ? (
                        <img
                          src={logo}
                          alt="Logo"
                          className="h-10 sm:h-12 w-auto max-h-14 max-w-[85%] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                        />
                      ) : (
                        <span className="text-white font-extrabold text-xs sm:text-sm text-center tracking-tight drop-shadow-md">
                          {title}
                        </span>
                      )}
                    </div>

                    {/* Hover Action Buttons */}
                    <div className="flex absolute inset-x-2 bottom-3 z-30 items-center justify-center gap-2 opacity-0 group-hover/top10preview:opacity-100 transition-opacity duration-200">
                      <div className="px-4 py-1.5 rounded-full bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-black/60 text-white border border-white/60 flex items-center justify-center shadow-lg">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* B. Desktop Single Special Feed Banner (Prime Video Layout) */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white">Desktop Single Special Feed Banner (Prime Video Layout)</h5>
                <p className="text-[10px] text-zinc-400">
                  Poster strictly right ~60% with smooth left dissolve, far-left soft atmospheric glow, Watch pill, (+) Watchlist, and (ℹ) Info buttons.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Ambiance: {desktopSpecialAmbiance}
              </span>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden min-h-[280px] bg-[#090b10] shadow-2xl flex items-center">
              {/* Far-Left Soft Ambiance */}
              <div
                className="absolute inset-y-0 left-0 w-[42%] pointer-events-none z-10 opacity-40"
                style={{
                  background: `radial-gradient(ellipse 75% 90% at 5% 50%, ${desktopSpecialAmbiance} 0%, transparent 80%)`
                }}
              />

              {/* Left Column Content */}
              <div className="relative z-20 w-[42%] p-6 sm:p-8 flex flex-col items-start gap-2.5">
                {logo ? (
                  <img
                    src={logo}
                    alt={title}
                    className="h-10 sm:h-12 w-auto max-w-[260px] object-contain object-left drop-shadow"
                  />
                ) : (
                  <h3 className="text-xl sm:text-2xl font-black text-white">{title}</h3>
                )}
                <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                    {formData.maturityRating || '16+'}
                  </span>
                  <span>1 Season</span>
                  <span>•</span>
                  <span>Drama, Action</span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2 max-w-[380px] leading-relaxed">{synopsis}</p>

                {/* 3 Action Buttons matching Prime Video reference */}
                <div className="mt-1 flex items-center gap-2">
                  <div className="px-5 py-2 rounded-full bg-white text-black font-bold text-xs flex items-center gap-1.5 shadow-lg">
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Watch S1 E1</span>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-800/80 text-white border border-white/15 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-zinc-800/80 text-white border border-white/15 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Right Side Video/Artwork (Strictly Right 58%) */}
              <div className="absolute top-0 bottom-0 right-0 w-[58%] overflow-hidden pointer-events-none rounded-r-2xl bg-[#090b10]">
                <img
                  src={
                    formData.desktopSpecialSingleFeedUrl ||
                    formData.backdropUrl ||
                    formData.posterLandscapeUrl ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80'
                  }
                  alt={title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-y-0 left-0 w-36 pointer-events-none z-10"
                  style={{
                    background:
                      'linear-gradient(to right, #090b10 0%, rgba(9,11,16,0.94) 22%, rgba(9,11,16,0.58) 52%, rgba(9,11,16,0.18) 78%, transparent 100%)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* C. Desktop Recommendation Hero & 16:9 Normal Feed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desktop Recommendation Hero Backdrop */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Desktop Recommendation Backdrop</span>
                <span className="text-[10px] font-mono text-zinc-400">{desktopRecAmbiance}</span>
              </div>
              <div
                className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 25px ${desktopRecAmbiance}45` }}
              >
                <img
                  src={
                    formData.desktopRecommendationBackdropUrl ||
                    formData.backdropUrl ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80'
                  }
                  alt="Desktop Rec"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3">
                  {logo ? (
                    <img src={logo} alt="Logo" className="max-h-7 max-w-[140px] object-contain drop-shadow" />
                  ) : (
                    <span className="text-xs font-bold text-white drop-shadow">{title}</span>
                  )}
                </div>
              </div>
            </div>

            {/* 16:9 Normal Feed Card (powers Continue Watching & My List) */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">16:9 Normal Feed Poster</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Also Continue Watching & My List</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{desktopFeedAmbiance}</span>
              </div>
              <div
                className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg group/feedcard cursor-pointer"
                style={{ boxShadow: `0 0 25px ${desktopFeedAmbiance}45` }}
              >
                <img
                  src={
                    formData.desktopNormalFeed16x9Url ||
                    formData.posterLandscapeUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80'
                  }
                  alt="Normal Feed"
                  className="w-full h-full object-cover group-hover/feedcard:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-3">
                  <span className="text-xs font-bold text-white drop-shadow">{title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEWS                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'mobile' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Mobile Rec 9:16 Backdrop */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile 9:16 Backdrop</span>
                <span className="text-[10px] text-zinc-400">Clean Hero Recommendation</span>
              </div>
              <div
                className="relative aspect-[9/16] w-full max-w-[200px] mx-auto rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 22px ${mobileRec9x16Ambiance}50` }}
              >
                <img
                  src={
                    formData.mobileRecommendation9x16BackdropUrl ||
                    formData.verticalBackdropUrl ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=720&q=80'
                  }
                  alt="Mobile 9:16"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center text-center">
                  {logo && <img src={logo} alt="Logo" className="max-h-7 max-w-[80%] object-contain drop-shadow mb-1" />}
                  <span className="text-[11px] font-bold text-white">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile Rec 16:9 Backdrop */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile 16:9 Backdrop</span>
                <span className="text-[10px] text-zinc-400">Landscape Mobile Screen</span>
              </div>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                <img
                  src={
                    formData.mobileRecommendation16x9BackdropUrl ||
                    formData.backdropUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80'
                  }
                  alt="Mobile 16:9"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2.5">
                  <span className="text-[11px] font-bold text-white truncate">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile No-Preview Rec: Style 1 (Full-Bleed 9:14 Poster Hero) */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile No-Preview: Style 1</span>
                <span className="text-[10px] text-zinc-400">9:14 Full-Bleed Edge-to-Edge</span>
              </div>
              <div
                className="relative aspect-[9/14] w-full max-w-[190px] mx-auto rounded-none sm:rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 20px ${mobileNoPreviewPosterAmbiance}40` }}
              >
                <img
                  src={
                    formData.mobileNoPreviewPosterHeroUrl ||
                    formData.posterVerticalUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=720&q=80'
                  }
                  alt="Style 1 Poster Hero"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col items-center justify-end p-3 text-center">
                  {logo && <img src={logo} alt="Logo" className="max-h-8 max-w-[85%] object-contain drop-shadow mb-1" />}
                  <span className="text-[10px] font-bold text-white truncate">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile No-Preview Rec: Style 2 (Centered 2:3 Floating Card Hero) */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile No-Preview: Style 2</span>
                <span className="text-[10px] text-zinc-400">2:3 Floating Card with Halo</span>
              </div>
              <div
                className="relative aspect-[2/3] w-full max-w-[180px] mx-auto rounded-2xl overflow-hidden bg-black shadow-lg border border-white/10"
                style={{ boxShadow: `0 0 25px ${mobileNoPreviewCardAmbiance}60` }}
              >
                <img
                  src={
                    formData.mobileNoPreviewCard2x3Url ||
                    formData.mobileRecommendation9x16BackdropUrl ||
                    formData.posterVerticalUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80'
                  }
                  alt="Style 2 Card Hero"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col items-center justify-end p-3 text-center">
                  {logo && <img src={logo} alt="Logo" className="max-h-7 max-w-[80%] object-contain drop-shadow mb-1" />}
                  <span className="text-[10px] font-bold text-white truncate">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile Normal Feed 2:3 Poster */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile Normal 2:3</span>
                <span className="text-[10px] text-zinc-400">Portrait Carousel Card</span>
              </div>
              <div
                className="relative aspect-[2/3] w-full max-w-[180px] mx-auto rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 20px ${mobileNormal2x3Ambiance}45` }}
              >
                <img
                  src={
                    formData.mobileNormalFeed2x3Url ||
                    formData.posterVerticalUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=640&q=80'
                  }
                  alt="Mobile 2:3"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent">
                  <span className="text-[10px] font-bold text-white truncate block">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile Special Feed Backdrop */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile Special Feed</span>
                <span className="text-[10px] text-zinc-400">Single Card Snapping</span>
              </div>
              <div
                className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 20px ${mobileSpecialAmbiance}45` }}
              >
                <img
                  src={
                    formData.mobileSpecialSingleFeedUrl ||
                    formData.backdropUrl ||
                    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1280&q=80'
                  }
                  alt="Mobile Special"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white truncate">{title}</span>
                </div>
              </div>
            </div>

            {/* Mobile More Info Backdrop */}
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between">
              <div className="mb-2">
                <span className="text-xs font-bold text-white block">Mobile More Info</span>
                <span className="text-[10px] text-zinc-400">Modal Header Backdrop</span>
              </div>
              <div
                className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg"
                style={{ boxShadow: `0 0 20px ${(formData.mobileMoreInfoBackdropAmbiance || '#b45309')}45` }}
              >
                <img
                  src={
                    formData.mobileMoreInfoBackdropUrl ||
                    formData.backdropUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80'
                  }
                  alt="Mobile More Info"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[10px] font-bold text-white truncate">{title}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ONLINE SOCIAL LINK PREVIEW (WHATSAPP SIMULATOR)                         */}
      {/* ========================================================================= */}
      {activeTab === 'social' && (
        <div className="p-5 rounded-xl bg-[#0b141a] border border-emerald-900/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h5 className="text-xs font-bold text-white tracking-wide">
                Live Social Share Card (WhatsApp / Twitter / Chat Preview)
              </h5>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">
              Aspect: {formData.preferredSharePreviewAspect || '1.91:1'}
            </span>
          </div>

          {/* Chat Bubble Container (Matching user reference image_6f972374.png) */}
          <div className="max-w-md mx-auto my-3 select-none">
            <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-none overflow-hidden shadow-2xl border border-emerald-800/60 p-1.5">
              {(() => {
                const preferred = formData.preferredSharePreviewAspect || '1.91:1';
                const activeImg =
                  preferred === '1:1'
                    ? formData.shareLinkPreviewImage1x1Url || formData.shareLinkPreviewImage191x100Url || formData.posterLandscapeUrl || formData.backdropUrl
                    : preferred === '4:3'
                    ? formData.shareLinkPreviewImage4x3Url || formData.shareLinkPreviewImage191x100Url || formData.posterLandscapeUrl || formData.backdropUrl
                    : formData.shareLinkPreviewImage191x100Url || formData.shareLinkPreviewImage4x3Url || formData.posterLandscapeUrl || formData.backdropUrl;

                const aspectClass =
                  preferred === '1:1'
                    ? 'aspect-square'
                    : preferred === '4:3'
                    ? 'aspect-[4/3]'
                    : 'aspect-[1.91/1]';

                return (
                  <div className={`relative w-full ${aspectClass} rounded-xl overflow-hidden bg-black`}>
                    {activeImg ? (
                      <img
                        src={activeImg}
                        alt="Social Share"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
                        <Share2 className="w-8 h-8 mb-1" />
                        <span>Paste Link Preview Image URL</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-3 bg-[#025144] rounded-b-xl space-y-1">
                <h4 className="text-sm font-bold text-white line-clamp-1 leading-snug">
                  {formData.shareTitle || formData.title || 'Series / Movie Title'}
                </h4>
                <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
                  {formData.shareDescription || formData.synopsis || formData.description || 'Discover Cast, Official Trailers, and Urdu Dubbed Turkish Dramas on Dizi Urdu'}
                </p>
                <span className="text-[10px] text-zinc-400 font-mono block pt-0.5">
                  diziurdu.dawoodshahzad75.workers.dev
                </span>
              </div>

              <div className="px-2 pt-1.5 pb-1 flex items-center justify-between text-[11px] text-emerald-200">
                <span className="truncate max-w-[280px] font-mono text-[10px] text-emerald-300 underline">
                  https://diziurdu.dawoodshahzad75.workers.dev/share/{formData.slug || formData.id}
                </span>
                <span className="text-[9.5px] text-emerald-300 font-mono shrink-0 flex items-center gap-1">
                  11:30 pm <Check className="w-3 h-3 text-cyan-300 inline" />
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10.5px] text-zinc-400 text-center">
            Shows only title of series/movie and infos in description, with your selected link preview image.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CATEGORIES & GENRES CARDS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category 16:9 Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-white block">Category 16:9 Card</span>
                <span className="text-[10px] text-zinc-400">Desktop category tile</span>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-lg group/cat16">
                <img
                  src={
                    formData.category16x9ImageUrl ||
                    formData.posterLandscapeUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1280&q=80'
                  }
                  alt="Category 16:9"
                  className="w-full h-full object-cover group-hover/cat16:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-3">
                  <span className="text-base font-black text-white tracking-wider uppercase drop-shadow">
                    Drama & Romance
                  </span>
                </div>
              </div>
            </div>

            {/* Category 9:16 Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-white block">Category 9:16 Card</span>
                <span className="text-[10px] text-zinc-400">Mobile vertical category</span>
              </div>
              <div className="relative aspect-[9/16] max-h-56 mx-auto rounded-xl overflow-hidden bg-black shadow-lg group/cat9">
                <img
                  src={
                    formData.category9x16ImageUrl ||
                    formData.poster9x16Url ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=720&q=80'
                  }
                  alt="Category 9:16"
                  className="w-full h-full object-cover group-hover/cat9:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-2 text-center">
                  <span className="text-sm font-black text-white uppercase drop-shadow">
                    Historical Epic
                  </span>
                </div>
              </div>
            </div>

            {/* Genre 1:1 Square Card */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div>
                <span className="text-xs font-bold text-white block">Genre 1:1 Square Card</span>
                <span className="text-[10px] text-zinc-400">Square genre buttons</span>
              </div>
              <div className="relative aspect-square max-h-56 mx-auto rounded-xl overflow-hidden bg-black shadow-lg group/genre1">
                <img
                  src={
                    formData.genre1x1ImageUrl ||
                    formData.posterLandscapeUrl ||
                    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=500&q=80'
                  }
                  alt="Genre 1:1"
                  className="w-full h-full object-cover group-hover/genre1:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-2 text-center">
                  <span className="text-sm font-black text-white uppercase drop-shadow">
                    Action & Crime
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
