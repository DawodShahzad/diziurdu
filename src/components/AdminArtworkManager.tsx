import React, { useState } from 'react';
import { Show } from '../types';
import {
  Image,
  Palette,
  Eye,
  Plus,
  Trash2,
  Check,
  Monitor,
  Smartphone,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Share2,
  Link,
  Copy,
  Shuffle
} from 'lucide-react';

interface AdminArtworkManagerProps {
  formData: Show;
  setFormData: (show: Show) => void;
}

const PRESET_AMBIANCE_SWATCHES = [
  { name: 'Amber Glow', hex: '#b45309' },
  { name: 'Teal Ocean', hex: '#0d9488' },
  { name: 'Crimson Night', hex: '#dc2626' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Deep Blue', hex: '#2563eb' },
  { name: 'Rose Sunset', hex: '#e11d48' },
  { name: 'Gold Dune', hex: '#d97706' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Slate Steel', hex: '#475569' }
];

export const AdminArtworkManager: React.FC<AdminArtworkManagerProps> = ({
  formData,
  setFormData
}) => {
  const [activeSection, setActiveSection] = useState<'desktop' | 'mobile' | 'social' | 'categories' | 'logo'>('desktop');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const updateField = (key: keyof Show, value: any) => {
    const updated: any = { ...formData, [key]: value };

    // Always synchronize primary fallback keys so updates immediately take effect everywhere on frontend
    if (key === 'desktopNormalFeed16x9Url') {
      updated.posterLandscapeUrl = value;
    }
    if (key === 'posterLandscapeUrl') {
      updated.desktopNormalFeed16x9Url = value;
    }
    if (key === 'desktopRecommendationBackdropUrl') {
      updated.backdropUrl = value;
    }
    if (key === 'backdropUrl') {
      updated.desktopRecommendationBackdropUrl = value;
    }
    if (key === 'desktopTop10Image2x3Url') {
      updated.posterVerticalUrl = value;
    }
    if (key === 'mobileNormalFeed2x3Url' && !updated.posterVerticalUrl) {
      updated.posterVerticalUrl = value;
    }
    if (key === 'posterVerticalUrl') {
      if (!updated.desktopTop10Image2x3Url) updated.desktopTop10Image2x3Url = value;
      if (!updated.mobileNormalFeed2x3Url) updated.mobileNormalFeed2x3Url = value;
    }
    if (key === 'mobileRecommendation9x16BackdropUrl') {
      updated.verticalBackdropUrl = value;
    }
    if (key === 'mobileNoPreviewPosterHeroUrl') {
      if (!updated.posterVerticalUrl) updated.posterVerticalUrl = value;
      if (!updated.posterUrl) updated.posterUrl = value;
    }
    if (key === 'mobileNoPreviewCard2x3Url') {
      if (!updated.posterVerticalUrl) updated.posterVerticalUrl = value;
    }
    if (key === 'desktopSpecialSingleFeedUrl') {
      if (!updated.backdropUrl2) updated.backdropUrl2 = value;
    }
    if (key === 'mobileSpecialSingleFeedUrl') {
      if (!updated.backdropUrl2) updated.backdropUrl2 = value;
    }
    if (key === 'moreInfoBackdropUrl') {
      if (!updated.backdropUrl) updated.backdropUrl = value;
    }
    if (key === 'mobileMoreInfoBackdropUrl') {
      if (!updated.backdropUrl) updated.backdropUrl = value;
    }
    if (key === 'stretchableFeedPoster9x16Url') {
      updated.poster9x16Url = value;
    }
    if (key === 'titleLogoUrl') {
      updated.logoUrl = value;
    }

    setFormData(updated);
  };

  // Reusable Single Artwork Field Renderer
  const renderSingleArtworkField = ({
    title,
    aspectBadge,
    aspectRatioClass,
    exactDimension,
    description,
    ambianceUsage,
    urlValue,
    onUrlChange,
    ambianceValue,
    onAmbianceChange,
    placeholderText,
    showAmbiance = true
  }: {
    title: string;
    aspectBadge: string;
    aspectRatioClass: string;
    exactDimension: string;
    description: string;
    ambianceUsage: string;
    urlValue: string;
    onUrlChange: (val: string) => void;
    ambianceValue: string;
    onAmbianceChange: (val: string) => void;
    placeholderText: string;
    showAmbiance?: boolean;
  }) => {
    return (
      <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3.5 shadow-md">
        {/* Header with Aspect Ratio & Where Ambiance is Used */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                {aspectBadge}
              </span>
              <span className="text-[10px] font-mono text-zinc-400 font-semibold bg-zinc-800 px-1.5 py-0.5 rounded">
                {exactDimension}
              </span>
              <h5 className="text-xs font-bold text-white tracking-tight">{title}</h5>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{description}</p>
            {showAmbiance && (
              <p className="text-[10.5px] text-amber-300/90 mt-0.5 flex items-center gap-1 font-medium">
                <Palette className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Frontend Ambiance Effect: {ambianceUsage}</span>
              </p>
            )}
          </div>

          {urlValue && (
            <button
              type="button"
              onClick={() => onUrlChange('')}
              className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors self-start sm:self-auto cursor-pointer"
            >
              Clear URL
            </button>
          )}
        </div>

        {/* Controls & Live Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          {/* Controls Column */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                Image Source URL ({exactDimension})
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={urlValue}
                  onChange={(e) => onUrlChange(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full bg-zinc-800/90 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs pr-8"
                />
                {urlValue ? (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" title="Image loaded" />
                ) : (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-zinc-600" title="Waiting for URL" />
                )}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Paste any link to see instant preview with its ambiance halo.
              </p>
            </div>

            {/* Individual Ambiance Color Picker */}
            {showAmbiance && (
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-red-400" />
                    <span>Individual Ambiance Glow Color</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-400 font-semibold">{ambianceValue}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={ambianceValue}
                    onChange={(e) => onAmbianceChange(e.target.value)}
                    className="w-8 h-8 rounded border border-zinc-700 bg-transparent cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={ambianceValue}
                    onChange={(e) => onAmbianceChange(e.target.value)}
                    placeholder="#b45309"
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-white font-mono text-xs uppercase"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-white/20 shrink-0 shadow-sm"
                    style={{ backgroundColor: ambianceValue }}
                  />
                  <span className="text-[10px] text-zinc-400 truncate">Halo shines live on preview</span>
                </div>

                {/* Swatches */}
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[9.5px] text-zinc-500 uppercase tracking-wider font-semibold mr-1">Presets:</span>
                  {PRESET_AMBIANCE_SWATCHES.map((swatch) => (
                    <button
                      key={swatch.hex}
                      type="button"
                      onClick={() => onAmbianceChange(swatch.hex)}
                      title={swatch.name}
                      className={`w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-110 active:scale-95 ${
                        ambianceValue.toLowerCase() === swatch.hex.toLowerCase()
                          ? 'border-white ring-1 ring-white/60 scale-110'
                          : 'border-white/10 hover:border-white/50'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Instant Live Preview Box with Respective Ambiance Glow */}
          <div className="md:col-span-5 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3 h-3 text-emerald-400" />
                <span>Instant Live Preview</span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500">{aspectBadge}</span>
            </div>

            <div className="relative w-full flex justify-center py-2 overflow-visible">
              <div
                className={`relative w-full max-w-[280px] ${aspectRatioClass} rounded-xl overflow-hidden bg-black border border-white/10 shadow-xl transition-all duration-300`}
                style={{
                  boxShadow: showAmbiance
                    ? `0 0 28px ${ambianceValue}55, 0 0 10px ${ambianceValue}33`
                    : 'none'
                }}
              >
                {urlValue ? (
                  <img
                    src={urlValue}
                    alt={title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-zinc-950">
                    <Image className="w-6 h-6 text-zinc-600 mb-1" />
                    <span className="text-[10px] text-zinc-500 font-semibold">Paste Image URL</span>
                    <span className="text-[9px] text-zinc-600 font-mono mt-0.5">{exactDimension}</span>
                  </div>
                )}

                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono font-bold text-zinc-300 border border-white/10 pointer-events-none">
                  {aspectBadge}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                  <span className="text-[11px] font-bold text-white line-clamp-1 drop-shadow">
                    {formData.title || 'Untitled Title'}
                  </span>
                </div>
              </div>
            </div>

            {showAmbiance && (
              <span className="text-[10px] text-zinc-500 text-center mt-1">
                Showing with individual <span className="font-mono text-zinc-400">{ambianceValue}</span> ambiance glow
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Paired Collection Handlers
  const recPairs = formData.desktopRecAndMoreInfoPairs || [];
  const stretchPairs = formData.stretchableFeedPairs || [];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner with Navigation Tabs */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-600/20 text-red-400 border border-red-500/30">
                Artwork Architecture
              </span>
              <h4 className="text-sm font-bold text-white">Surface-Specific Posters, Backdrops & Social Cards</h4>
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Select specific images for Desktop, Mobile, Social Sharing Link Preview, and Categories. Each image has its individual ambiance color and instant aspect ratio preview.
            </p>
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto bg-zinc-950 p-1 rounded-lg border border-zinc-800 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveSection('desktop')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'desktop' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Layout</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('mobile')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'mobile' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Layout</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('social')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'social' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('categories')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'categories' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categories</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('logo')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSection === 'logo' ? 'bg-red-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Logo PNG</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DESKTOP LAYOUT IMAGES                                                  */}
      {/* ========================================================================= */}
      {activeSection === 'desktop' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Monitor className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Desktop Layout Images & Paired Backdrops
            </h4>
          </div>

          {/* 1. Recommendation Backdrop (Paired with More Info) */}
          {renderSingleArtworkField({
            title: '1. Desktop Recommendation Backdrop Image',
            aspectBadge: '16:9 Hero',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1920 × 1080)',
            description: 'Full-bleed desktop hero backdrop displayed on the recommendation screen. Paired with More Info backdrop.',
            ambianceUsage: 'Radiates ambient background glare behind the recommendation screen.',
            urlValue: formData.desktopRecommendationBackdropUrl || '',
            onUrlChange: (val) => updateField('desktopRecommendationBackdropUrl', val),
            ambianceValue: formData.desktopRecommendationBackdropAmbiance || formData.ambientColor || '#b45309',
            onAmbianceChange: (val) => updateField('desktopRecommendationBackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 1920x1080 Recommendation Backdrop)'
          })}

          {/* 2. Normal Feed Poster Images (Also used for Continue Watching & My List) */}
          <div className="relative">
            <div className="absolute top-2 right-4 z-10 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold">
              Shared: Also used for Continue Watching & My List
            </div>
            {renderSingleArtworkField({
              title: '2. 16:9 Normal Feed Poster Images',
              aspectBadge: '16:9 Card',
              aspectRatioClass: 'aspect-video',
              exactDimension: '16:9 (1280 × 720)',
              description: 'Standard 16:9 horizontal card carousels across the desktop homepage. Automatically powers Continue Watching and My List cards.',
              ambianceUsage: 'Glows behind the card when hovered and sets the backdrop glow in quick previews.',
              urlValue: formData.desktopNormalFeed16x9Url || formData.posterLandscapeUrl || '',
              onUrlChange: (val) => {
                updateField('desktopNormalFeed16x9Url', val);
                updateField('posterLandscapeUrl', val);
              },
              ambianceValue: formData.desktopNormalFeed16x9Ambiance || formData.ambientColor || '#b45309',
              onAmbianceChange: (val) => updateField('desktopNormalFeed16x9Ambiance', val),
              placeholderText: 'https://images.unsplash.com/... (16:9 1280x720 Normal Feed Poster)'
            })}
          </div>

          {/* 3. Top 10 Feed Images: 2:3 Card (With Live Preview) */}
          {renderSingleArtworkField({
            title: '3. Desktop Top 10 List Card Image (2:3 Portrait)',
            aspectBadge: '2:3 Card Art',
            aspectRatioClass: 'aspect-[2/3]',
            exactDimension: '2:3 (640 × 960)',
            description: 'Modern Top 10 rank strip uses 2:3 vertical card with 80% exposed rank number on the left.',
            ambianceUsage: 'Illuminates a radial halo behind the card and rank number on hover.',
            urlValue: formData.desktopTop10Image2x3Url || '',
            onUrlChange: (val) => updateField('desktopTop10Image2x3Url', val),
            ambianceValue: formData.desktopTop10Image2x3Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('desktopTop10Image2x3Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (2:3 Top 10 Card Art)'
          })}

          {/* 4. Top 10 Feed Backdrop Image (With Live Preview) */}
          {renderSingleArtworkField({
            title: '4. Desktop Top 10 Feed Backdrop Image (16:9 Widescreen)',
            aspectBadge: '16:9 Backdrop',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1920 × 1080)',
            description: '16:9 cinematic backdrop for the Top 10 strip and special collection headers.',
            ambianceUsage: 'Sets atmospheric background reflection in Top 10 feed header.',
            urlValue: formData.desktopTop10BackdropUrl || '',
            onUrlChange: (val) => updateField('desktopTop10BackdropUrl', val),
            ambianceValue: formData.desktopTop10BackdropAmbiance || '#b45309',
            onAmbianceChange: (val) => updateField('desktopTop10BackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 Top 10 Backdrop)'
          })}

          {/* 4. More Info Page Backdrop Image (Paired with Desktop Recommendation) */}
          <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-600/20 text-purple-300 border border-purple-500/30">
                    Paired System
                  </span>
                  <h5 className="text-xs font-bold text-white">4. More Info Page Backdrop Image (16:9, 1920 × 1080)</h5>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Works in a strict pair with Desktop Recommendation Backdrop. When the recommendation backdrop shifts to a 2nd variant, the more info page shifts to the matching pair.
                </p>
                <p className="text-[10.5px] text-amber-300/90 mt-0.5 flex items-center gap-1 font-medium">
                  <Palette className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Frontend Ambiance Effect: Sets the atmospheric modal reflection behind title details.</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-7 space-y-3">
                <div>
                  <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                    Primary More Info Backdrop URL (Pair #1)
                  </label>
                  <input
                    type="text"
                    value={formData.moreInfoBackdropUrl || ''}
                    onChange={(e) => updateField('moreInfoBackdropUrl', e.target.value)}
                    placeholder="https://... (16:9 More Info Backdrop Image)"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-zinc-400 font-semibold">More Info Ambiance:</span>
                  <input
                    type="color"
                    value={formData.moreInfoBackdropAmbiance || '#b45309'}
                    onChange={(e) => updateField('moreInfoBackdropAmbiance', e.target.value)}
                    className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.moreInfoBackdropAmbiance || '#b45309'}
                    onChange={(e) => updateField('moreInfoBackdropAmbiance', e.target.value)}
                    className="w-24 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Instant Preview */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div
                  className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg"
                  style={{
                    boxShadow: `0 0 25px ${(formData.moreInfoBackdropAmbiance || '#b45309')}55`
                  }}
                >
                  {formData.moreInfoBackdropUrl ? (
                    <img src={formData.moreInfoBackdropUrl} alt="More Info" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      Pair #1 More Info Backdrop
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Paired Variants Manager (Recommendation + More Info) */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Recommendation & More Info Paired Variants ({recPairs.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [
                      ...recPairs,
                      {
                        id: `rec-pair-${Date.now()}`,
                        recBackdropUrl: '',
                        moreInfoBackdropUrl: '',
                        ambianceColor: formData.ambientColor || '#b45309'
                      }
                    ];
                    updateField('desktopRecAndMoreInfoPairs', updated);
                  }}
                  className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Paired Variant</span>
                </button>
              </div>

              {recPairs.map((pair, pIdx) => (
                <div key={pair.id || `rec-p-${pIdx}`} className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 space-y-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-purple-300">Pair #{pIdx + 2} (Variant)</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = recPairs.filter((_, i) => i !== pIdx);
                        updateField('desktopRecAndMoreInfoPairs', updated);
                      }}
                      className="p-1 rounded hover:bg-red-950 text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pair.recBackdropUrl}
                      onChange={(e) => {
                        const updated = [...recPairs];
                        updated[pIdx].recBackdropUrl = e.target.value;
                        updateField('desktopRecAndMoreInfoPairs', updated);
                      }}
                      placeholder="Variant Rec Backdrop URL..."
                      className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={pair.moreInfoBackdropUrl}
                      onChange={(e) => {
                        const updated = [...recPairs];
                        updated[pIdx].moreInfoBackdropUrl = e.target.value;
                        updateField('desktopRecAndMoreInfoPairs', updated);
                      }}
                      placeholder="Matching More Info Backdrop URL..."
                      className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Single Special Feed Backdrop Images */}
          {renderSingleArtworkField({
            title: '5. Single Special Feed Backdrop Image',
            aspectBadge: '16:9 Banner',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1920 × 1080)',
            description: 'Wide desktop special banner image with Prime Video style right-side positioning and smooth left-edge dissolution.',
            ambianceUsage: 'Emerges as the soft atmospheric ambient glow on the far-left side behind logo and buttons.',
            urlValue: formData.desktopSpecialSingleFeedUrl || '',
            onUrlChange: (val) => updateField('desktopSpecialSingleFeedUrl', val),
            ambianceValue: formData.desktopSpecialSingleFeedAmbiance || '#0d9488',
            onAmbianceChange: (val) => updateField('desktopSpecialSingleFeedAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 Single Special Feed Banner)'
          })}

          {/* 6. Stretchable Feed 9:16 Poster (With Live Preview) */}
          {renderSingleArtworkField({
            title: '6. Stretchable Feed Poster (9:16 with Title Artwork)',
            aspectBadge: '9:16 Portrait Poster',
            aspectRatioClass: 'aspect-[9/16]',
            exactDimension: '9:16 (720 × 1280)',
            description: 'Portrait 9:16 poster showing before hover. When hovered on desktop, title stretches and reveals 16:9 hover backdrop.',
            ambianceUsage: 'Radiates around the expanded card halo when user hovers.',
            urlValue: formData.stretchableFeedPoster9x16Url || '',
            onUrlChange: (val) => updateField('stretchableFeedPoster9x16Url', val),
            ambianceValue: formData.stretchableFeedPoster9x16Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('stretchableFeedPoster9x16Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (9:16 Poster with Title Artwork)'
          })}

          {/* 7. Stretchable Feed 16:9 Landscape Hover Backdrop (With Live Preview) */}
          {renderSingleArtworkField({
            title: '7. Stretchable Feed Hover Backdrop (16:9 Landscape)',
            aspectBadge: '16:9 Landscape',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1920 × 1080 / 1280 × 720)',
            description: 'Clean landscape artwork revealed seamlessly when title stretches horizontally on hover.',
            ambianceUsage: 'Illuminates the backdrop layer behind trailer clip.',
            urlValue: formData.stretchableFeedBackdropUrl || '',
            onUrlChange: (val) => updateField('stretchableFeedBackdropUrl', val),
            ambianceValue: formData.stretchableFeedBackdropAmbiance || '#0d9488',
            onAmbianceChange: (val) => updateField('stretchableFeedBackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 Clean Landscape Hover Backdrop)'
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MOBILE LAYOUT IMAGES                                                   */}
      {/* ========================================================================= */}
      {activeSection === 'mobile' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Smartphone className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Mobile Layout Specific Images
            </h4>
          </div>

          {/* 7. Horizontal Recommendation Backdrop */}
          {renderSingleArtworkField({
            title: '1. Mobile Horizontal Recommendation Backdrop',
            aspectBadge: '16:9 Mobile Landscape',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1280 × 720)',
            description: 'Landscape recommendation artwork displayed when mobile device is oriented horizontally.',
            ambianceUsage: 'Glows behind the mobile landscape hero screen.',
            urlValue: formData.mobileRecommendation16x9BackdropUrl || '',
            onUrlChange: (val) => updateField('mobileRecommendation16x9BackdropUrl', val),
            ambianceValue: formData.mobileRecommendation16x9BackdropAmbiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobileRecommendation16x9BackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 Mobile Landscape Backdrop)'
          })}

          {/* 8. Vertical Recommendation Backdrop */}
          {renderSingleArtworkField({
            title: '2. Mobile Vertical Recommendation Backdrop',
            aspectBadge: '9:16 Full Screen',
            aspectRatioClass: 'aspect-[9/16]',
            exactDimension: '9:16 (720 × 1280)',
            description: 'Clean full-screen portrait hero backdrop for mobile portrait recommendation screen.',
            ambianceUsage: 'Sets the full-screen backdrop atmospheric color on the mobile hero.',
            urlValue: formData.mobileRecommendation9x16BackdropUrl || '',
            onUrlChange: (val) => updateField('mobileRecommendation9x16BackdropUrl', val),
            ambianceValue: formData.mobileRecommendation9x16BackdropAmbiance || '#0d9488',
            onAmbianceChange: (val) => updateField('mobileRecommendation9x16BackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (9:16 Mobile Portrait Clean Backdrop)'
          })}

          {/* Style 1: Mobile No-Preview Rec: Full-Bleed 9:14 Poster Hero */}
          {renderSingleArtworkField({
            title: '3. Mobile No-Preview Rec: Style 1 (Full-Bleed 9:14 Poster Hero)',
            aspectBadge: '9:14 Edge-to-Edge',
            aspectRatioClass: 'aspect-[9/14]',
            exactDimension: '9:14 (720 × 1120)',
            description: 'Edge-to-edge full-bleed poster hero on mobile when no-preview poster mode is selected.',
            ambianceUsage: 'Top and bottom gradient fade tint for mobile full-bleed hero.',
            urlValue: formData.mobileNoPreviewPosterHeroUrl || '',
            onUrlChange: (val) => updateField('mobileNoPreviewPosterHeroUrl', val),
            ambianceValue: formData.mobileNoPreviewPosterHeroAmbiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobileNoPreviewPosterHeroAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (9:14 Full-Bleed Poster Hero)'
          })}

          {/* Style 2: Mobile No-Preview Rec: Centered 2:3 Floating Card Hero */}
          {renderSingleArtworkField({
            title: '4. Mobile No-Preview Rec: Style 2 (Centered 2:3 Floating Card Hero)',
            aspectBadge: '2:3 Floating Card',
            aspectRatioClass: 'aspect-[2/3]',
            exactDimension: '2:3 (640 × 960)',
            description: 'Floating portrait card hero with atmospheric glow halo for mobile portrait recommendation.',
            ambianceUsage: 'Atmospheric halo aura radiating behind the centered floating 2:3 card.',
            urlValue: formData.mobileNoPreviewCard2x3Url || '',
            onUrlChange: (val) => updateField('mobileNoPreviewCard2x3Url', val),
            ambianceValue: formData.mobileNoPreviewCard2x3Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobileNoPreviewCard2x3Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (2:3 Centered Floating Hero Card)'
          })}

          {/* 9. Normal Feed Posters (2:3) */}
          {renderSingleArtworkField({
            title: '5. Mobile Normal Feed Posters',
            aspectBadge: '2:3 Mobile Card',
            aspectRatioClass: 'aspect-[2/3]',
            exactDimension: '2:3 (640 × 960)',
            description: 'Portrait 2:3 card artwork for mobile touch carousels and vertical scroll strips.',
            ambianceUsage: 'Subtle atmospheric aura around mobile feed cards.',
            urlValue: formData.mobileNormalFeed2x3Url || '',
            onUrlChange: (val) => updateField('mobileNormalFeed2x3Url', val),
            ambianceValue: formData.mobileNormalFeed2x3Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobileNormalFeed2x3Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (2:3 Mobile Portrait Poster)'
          })}

          {/* 10. Single Special Feed Backdrop in Mobile */}
          {renderSingleArtworkField({
            title: '6. Mobile Single Special Feed Backdrop',
            aspectBadge: '16:9 Mobile Banner',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1280 × 720) or 9:16',
            description: 'Backdrop for the Single Special Feed card on mobile homepage.',
            ambianceUsage: 'Radiates smoothly up to top feed title and down to bottom feed title without dividing lines.',
            urlValue: formData.mobileSpecialSingleFeedUrl || '',
            onUrlChange: (val) => updateField('mobileSpecialSingleFeedUrl', val),
            ambianceValue: formData.mobileSpecialSingleFeedAmbiance || '#0d9488',
            onAmbianceChange: (val) => updateField('mobileSpecialSingleFeedAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (Mobile Special Feed Backdrop)'
          })}

          {/* Mobile More Info Page Backdrop */}
          {renderSingleArtworkField({
            title: '7. Mobile More Info Page Backdrop',
            aspectBadge: '16:9 / 9:16 Mobile Backdrop',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1280 × 720) or 9:16 (720 × 1280)',
            description: 'Header backdrop image displayed when opening the More Info modal on mobile devices.',
            ambianceUsage: 'Mobile header player backdrop in More Info modal.',
            urlValue: formData.mobileMoreInfoBackdropUrl || '',
            onUrlChange: (val) => updateField('mobileMoreInfoBackdropUrl', val),
            ambianceValue: formData.mobileMoreInfoBackdropAmbiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobileMoreInfoBackdropAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (Mobile More Info Backdrop)'
          })}

          {/* 11. Tall Stretchable Feed Posters */}
          {renderSingleArtworkField({
            title: '8. Mobile Tall Stretchable Feed Posters',
            aspectBadge: '1:2 Ultra-Tall',
            aspectRatioClass: 'aspect-[1/2]',
            exactDimension: '1:2 or 9:16 (400 × 800)',
            description: 'Ultra-tall poster for special mobile portrait carousels.',
            ambianceUsage: 'Ambient glow when touched or viewed in portrait feeds.',
            urlValue: formData.mobile1x2PosterUrl || formData.mobileTallStretchPosterUrl || '',
            onUrlChange: (val) => {
              updateField('mobile1x2PosterUrl', val);
              updateField('mobileTallStretchPosterUrl', val);
            },
            ambianceValue: formData.mobile1x2PosterAmbiance || '#b45309',
            onAmbianceChange: (val) => updateField('mobile1x2PosterAmbiance', val),
            placeholderText: 'https://images.unsplash.com/... (1:2 Ultra-Tall Poster)'
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SOCIAL SHARING & ONLINE LINK PREVIEW CARDS (WHATSAPP, TWITTER, ETC.)    */}
      {/* ========================================================================= */}
      {activeSection === 'social' && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Online Link Preview (SEO / Social Cards)
              </span>
              <h4 className="text-sm font-bold text-white">Social Sharing Card Configuration</h4>
            </div>
            <p className="text-[11px] text-zinc-400">
              When users share links of this series/movie on WhatsApp, Twitter, Facebook, LinkedIn, or Discord, this image and title appear in the rich preview card.
            </p>
          </div>

          {/* Aspect Ratio Selector & Required Dimensions */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div>
              <label className="block text-xs font-bold text-white mb-1">
                Choose Preferred Social Preview Aspect Ratio
              </label>
              <p className="text-[11px] text-zinc-400 mb-2.5">
                Social platforms support different image shapes. Provide links for each ratio and select which one to prioritize.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {(['1.91:1', '1:1', '4:3'] as const).map((aspect) => (
                  <button
                    key={aspect}
                    type="button"
                    onClick={() => updateField('preferredSharePreviewAspect', aspect)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      (formData.preferredSharePreviewAspect || '1.91:1') === aspect
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{aspect === '1.91:1' ? '1.91:1 Landscape (1200 × 630)' : aspect === '1:1' ? '1:1 Square (600 × 600)' : '4:3 Classic (800 × 600)'}</span>
                    {(formData.preferredSharePreviewAspect || '1.91:1') === aspect && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Input fields for all required aspect ratios */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                  1.91:1 Landscape Share Card URL (Required for WhatsApp, Twitter Large, Facebook — 1200 × 630 px)
                </label>
                <input
                  type="text"
                  value={formData.shareLinkPreviewImage191x100Url || ''}
                  onChange={(e) => updateField('shareLinkPreviewImage191x100Url', e.target.value)}
                  placeholder="https://... (1.91:1 1200x630 Image URL)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                  1:1 Square Share Card URL (Required for WhatsApp Compact & Discord — 600 × 600 px)
                </label>
                <input
                  type="text"
                  value={formData.shareLinkPreviewImage1x1Url || ''}
                  onChange={(e) => updateField('shareLinkPreviewImage1x1Url', e.target.value)}
                  placeholder="https://... (1:1 600x600 Image URL)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                  4:3 Traditional Card URL (800 × 600 px)
                </label>
                <input
                  type="text"
                  value={formData.shareLinkPreviewImage4x3Url || ''}
                  onChange={(e) => updateField('shareLinkPreviewImage4x3Url', e.target.value)}
                  placeholder="https://... (4:3 800x600 Image URL)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white font-mono text-xs"
                />
              </div>

              {/* Custom Share Title & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                    Share Card Title (Shows only title of series/movie)
                  </label>
                  <input
                    type="text"
                    value={formData.shareTitle || formData.title || ''}
                    onChange={(e) => updateField('shareTitle', e.target.value)}
                    placeholder={formData.title || 'Title of series/movie'}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                    Share Card Description / Infos
                  </label>
                  <input
                    type="text"
                    value={formData.shareDescription || formData.synopsis || formData.description || ''}
                    onChange={(e) => updateField('shareDescription', e.target.value)}
                    placeholder="Short description / infos..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live WhatsApp / Social Share Card Simulator (Matching image_6f972374.png) */}
          <div className="p-5 rounded-xl bg-[#0b141a] border border-emerald-900/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h5 className="text-xs font-bold text-white tracking-wide">
                  Live Social Share Simulator (WhatsApp / Twitter / Social Preview)
                </h5>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                Aspect: {formData.preferredSharePreviewAspect || '1.91:1'}
              </span>
            </div>

            {/* Chat Bubble Container (Matching user reference image_6f972374.png) */}
            <div className="max-w-md mx-auto my-3 select-none">
              <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-none overflow-hidden shadow-2xl border border-emerald-800/60 p-1.5">
                {/* Image Preview Box */}
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

                {/* Card Title & Description (Matching user reference) */}
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

                {/* Link & Time footer */}
                <div className="px-2 pt-1.5 pb-1 flex items-center justify-between text-[11px] text-emerald-200">
                  <span className="truncate max-w-[280px] font-mono text-[10px] text-emerald-300 underline">
                    https://diziurdu.dawoodshahzad75.workers.dev/watch/{formData.slug || formData.id}
                  </span>
                  <span className="text-[9.5px] text-emerald-300 font-mono shrink-0 flex items-center gap-1">
                    11:30 pm <Check className="w-3 h-3 text-cyan-300 inline" />
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10.5px] text-zinc-400 text-center">
              This is the exact rich preview card users will see when sharing this title online across chat apps and social feeds.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CATEGORIES & GENRES CARDS                                              */}
      {/* ========================================================================= */}
      {activeSection === 'categories' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-4 h-4 text-red-500" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Categories & Genres Cards
            </h4>
          </div>

          {/* Category 16:9 */}
          {renderSingleArtworkField({
            title: '1. Category 16:9 Card Image',
            aspectBadge: '16:9 Category',
            aspectRatioClass: 'aspect-video',
            exactDimension: '16:9 (1280 × 720)',
            description: 'Desktop category browsing cards and discovery tiles.',
            ambianceUsage: 'Ambient glow behind the category card tile.',
            urlValue: formData.category16x9ImageUrl || '',
            onUrlChange: (val) => updateField('category16x9ImageUrl', val),
            ambianceValue: formData.category16x9Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('category16x9Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (16:9 Category Card)'
          })}

          {/* Category 9:16 */}
          {renderSingleArtworkField({
            title: '2. Category 9:16 Card Image',
            aspectBadge: '9:16 Category',
            aspectRatioClass: 'aspect-[9/16]',
            exactDimension: '9:16 (720 × 1280)',
            description: 'Mobile category vertical discovery card artwork.',
            ambianceUsage: 'Glow around mobile category card.',
            urlValue: formData.category9x16ImageUrl || '',
            onUrlChange: (val) => updateField('category9x16ImageUrl', val),
            ambianceValue: formData.category9x16Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('category9x16Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (9:16 Mobile Category Card)'
          })}

          {/* Genre 1:1 */}
          {renderSingleArtworkField({
            title: '3. Genre 1:1 Square Card Image',
            aspectBadge: '1:1 Square',
            aspectRatioClass: 'aspect-square',
            exactDimension: '1:1 (500 × 500)',
            description: 'Square 1:1 genre badges and interactive genre row tiles.',
            ambianceUsage: 'Subtle radial aura behind the genre square.',
            urlValue: formData.genre1x1ImageUrl || '',
            onUrlChange: (val) => updateField('genre1x1ImageUrl', val),
            ambianceValue: formData.genre1x1Ambiance || '#b45309',
            onAmbianceChange: (val) => updateField('genre1x1Ambiance', val),
            placeholderText: 'https://images.unsplash.com/... (1:1 Genre Square Card)'
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TITLE PNG LOGO (CLEARART)                                              */}
      {/* ========================================================================= */}
      {activeSection === 'logo' && (
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  2.5:1 PNG (~650×260)
                </span>
                <h4 className="text-xs font-bold text-white tracking-tight">Show Title PNG Logos</h4>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Standard 2.5:1 logo is used for Recommendation, More Info (Normal &amp; Full Size), Card Hover Popout, Single Special Feed, Stretch Feed, Mobile 16:9 &amp; No-Preview Poster. Central Logo is used for Mobile 2:3 Recommendation &amp; Modern Top 10 Rank cards.
              </p>
            </div>
            {formData.titleLogoUrl && (
              <button
                type="button"
                onClick={() => updateField('titleLogoUrl', '')}
                className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                Clear Standard Logo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-7 space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] text-zinc-300 font-semibold">
                    Standard Title Logo PNG URL <span className="text-amber-400 font-mono text-[10px]">(2.5:1 — ~650×260)</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={formData.titleLogoUrl || ''}
                  onChange={(e) => updateField('titleLogoUrl', e.target.value)}
                  placeholder="https://... (2.5:1 transparent PNG logo, e.g. 650×260)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>

              {/* Dedicated Central Logo Field for 2:3 Recommendation & Modern Rank Cards */}
              <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="block text-[11px] text-zinc-200 font-semibold">
                    Central Logo <span className="text-zinc-400 font-normal text-[10px]">(2:3 Recommendation &amp; Modern Rank)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {(!formData.centralLogoUrl || formData.centralLogoUrl === formData.titleLogoUrl) && formData.titleLogoUrl && (
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        Using Standard Logo
                      </span>
                    )}
                    {formData.titleLogoUrl && formData.centralLogoUrl !== formData.titleLogoUrl && (
                      <button
                        type="button"
                        onClick={() => updateField('centralLogoUrl', formData.titleLogoUrl || '')}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
                      >
                        Use Standard Logo
                      </button>
                    )}
                    {formData.centralLogoUrl && (
                      <button
                        type="button"
                        onClick={() => updateField('centralLogoUrl', '')}
                        className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="text"
                  value={formData.centralLogoUrl || ''}
                  onChange={(e) => updateField('centralLogoUrl', e.target.value)}
                  placeholder="https://... (Leave blank to automatically use Standard Logo)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none focus:border-red-500 font-mono text-xs"
                />
                <p className="text-[10px] text-zinc-500 leading-snug">
                  Centered PNG logo for Mobile 2:3 Portrait Recommendation and Modern Top 10 Rank cards. Automatically falls back to Standard Logo if empty.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                  Optional Watermark / Source Tag Logo URL
                </label>
                <input
                  type="text"
                  value={formData.sourceWatermarkUrl || ''}
                  onChange={(e) => updateField('sourceWatermarkUrl', e.target.value)}
                  placeholder="https://... (Channel badge e.g. TRT1, ATV)"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>
            </div>

            {/* Checkered Transparency Live Previews (2.5:1 Standard + Central Logo) */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-emerald-400" />
                  <span>Standard Logo Preview (2.5:1)</span>
                </span>

                <div
                  className="relative w-full aspect-[2.5/1] rounded-xl overflow-hidden flex items-end justify-start border border-zinc-700 shadow-inner"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#09090b'
                  }}
                >
                  {formData.titleLogoUrl ? (
                    <img
                      src={formData.titleLogoUrl}
                      alt="Standard Logo Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom-left drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    />
                  ) : (
                    <span className="m-auto text-zinc-500 text-xs font-mono">No Standard Logo URL</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-sky-400" />
                  <span>Central Logo Preview (2:3 &amp; Rank)</span>
                </span>

                <div
                  className="relative w-full aspect-[2.5/1] rounded-xl overflow-hidden flex items-end justify-center border border-zinc-700 shadow-inner"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#09090b'
                  }}
                >
                  {(formData.centralLogoUrl || formData.titleLogoUrl) ? (
                    <img
                      src={formData.centralLogoUrl || formData.titleLogoUrl}
                      alt="Central Logo Preview"
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 block w-full h-full max-w-full max-h-full object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    />
                  ) : (
                    <span className="m-auto text-zinc-500 text-xs font-mono">No Central Logo URL</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
