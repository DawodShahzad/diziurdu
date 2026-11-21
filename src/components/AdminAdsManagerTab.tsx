import React, { useState } from 'react';
import { AdminSettings, AdDeviceLayout, MoreInfoAdSection } from '../types';
import { AdTileBanner } from './AdTileBanner';
import { SearchAdCard } from './SearchAdCard';
import {
  Megaphone,
  LayoutTemplate,
  Film,
  Search,
  PanelBottom,
  Bell,
  X,
  RotateCcw
} from 'lucide-react';

interface AdminAdsManagerTabProps {
  adminSettings: AdminSettings;
  onUpdateSettings: (updated: AdminSettings) => void;
}

const ALL_LAYOUTS: { key: AdDeviceLayout; label: string }[] = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'laptop', label: 'Laptop' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'mobile', label: 'Mobile' }
];

const MORE_INFO_SECTIONS: { id: MoreInfoAdSection; label: string }[] = [
  { id: 'hero', label: 'Beneath Hero / Overview' },
  { id: 'episodes', label: 'Beneath Episodes Section' },
  { id: 'trailers', label: 'Beneath Trailers & More' },
  { id: 'more_like_this', label: 'Beneath More Like This' },
  { id: 'where_to_watch', label: 'Beneath Where to Watch' },
  { id: 'cast', label: 'Beneath Cast & Crew' },
  { id: 'about', label: 'Beneath About & Info' }
];

type AdSubSection = 'tile' | 'more_info' | 'search' | 'narrow_bar' | 'alert_poster';

export const AdminAdsManagerTab: React.FC<AdminAdsManagerTabProps> = ({
  adminSettings,
  onUpdateSettings
}) => {
  const [activeSub, setActiveSub] = useState<AdSubSection>('tile');

  const persist = (patch: Partial<AdminSettings>) => {
    const updated: AdminSettings = { ...adminSettings, ...patch };
    onUpdateSettings(updated);
    try {
      localStorage.setItem('cineflix_settings', JSON.stringify(updated));
    } catch {}
  };

  const toggleLayout = (
    field:
      | 'adTileLayouts'
      | 'moreInfoAdLayouts'
      | 'searchAdLayouts'
      | 'narrowAdBarLayouts'
      | 'alertPosterLayouts',
    layoutKey: AdDeviceLayout
  ) => {
    const current = (adminSettings[field] as AdDeviceLayout[] | undefined) || [
      'desktop',
      'laptop',
      'tablet',
      'mobile'
    ];
    const next = current.includes(layoutKey)
      ? current.filter((l) => l !== layoutKey)
      : [...current, layoutKey];
    persist({ [field]: next } as Partial<AdminSettings>);
  };

  const renderLayoutSelector = (
    field:
      | 'adTileLayouts'
      | 'moreInfoAdLayouts'
      | 'searchAdLayouts'
      | 'narrowAdBarLayouts'
      | 'alertPosterLayouts',
    label = 'Show on Layouts:'
  ) => {
    const current = (adminSettings[field] as AdDeviceLayout[] | undefined) || [
      'desktop',
      'laptop',
      'tablet',
      'mobile'
    ];
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-zinc-400 mr-1">{label}</span>
        {ALL_LAYOUTS.map(({ key, label: btnLabel }) => {
          const checked = current.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleLayout(field, key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                checked
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {btnLabel}
            </button>
          );
        })}
      </div>
    );
  };

  const subTabs: { id: AdSubSection; label: string; icon: React.ReactNode; active: boolean }[] = [
    {
      id: 'tile',
      label: 'Ad Tile',
      icon: <LayoutTemplate className="w-3.5 h-3.5" />,
      active: Boolean(adminSettings.adTileEnabled)
    },
    {
      id: 'more_info',
      label: 'More Info Ad',
      icon: <Film className="w-3.5 h-3.5" />,
      active: Boolean(adminSettings.moreInfoAdEnabled)
    },
    {
      id: 'search',
      label: 'Search Page Ad',
      icon: <Search className="w-3.5 h-3.5" />,
      active: Boolean(adminSettings.searchAdEnabled)
    },
    {
      id: 'narrow_bar',
      label: 'Narrow Ad Bar',
      icon: <PanelBottom className="w-3.5 h-3.5" />,
      active: Boolean(adminSettings.narrowAdBarEnabled)
    },
    {
      id: 'alert_poster',
      label: 'Alert Poster / Video Ad',
      icon: <Bell className="w-3.5 h-3.5" />,
      active: Boolean(adminSettings.alertPosterEnabled)
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Platform Ads Manager
            </h2>
            <p className="text-xs text-zinc-400">
              Design and control Homepage Ad Tiles, More Info Page Ads, Search Sponsored Cards, Narrow Dismissible Bars, and Alert Video/Poster Ads across Desktop, Laptop, Tablet &amp; Mobile.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Section Switcher */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSub(t.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              activeSub === t.id
                ? 'bg-[#272727] border-amber-500/60 text-white shadow'
                : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/70'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                t.active ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
          </button>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* 1. HOMEPAGE AD TILE (Signup-Tile style with bottom-left Ad badge)     */}
      {/* ===================================================================== */}
      {activeSub === 'tile' && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Homepage Ad Tile Banner
              </h3>
              <p className="text-xs text-zinc-400">
                Full-featured promotional Ad Tile with configurable &quot;Ad&quot; badge placement, logo image, text &amp; button positions, optional close button, Padded or Zero-Padding modes, selectable aspect height, and toggleable image glare.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                persist({
                  adTileEnabled: !adminSettings.adTileEnabled,
                  adTileLayouts: adminSettings.adTileLayouts || ['desktop', 'laptop', 'tablet', 'mobile']
                })
              }
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                adminSettings.adTileEnabled
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {adminSettings.adTileEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {renderLayoutSelector('adTileLayouts')}

          {/* Desktop / Laptop / Tablet Creative */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
              Desktop / Laptop / Default Tile Settings
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Padding Mode */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Container Style
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {([
                    { id: 'contained' as const, label: 'Padded' },
                    { id: 'full_bleed' as const, label: 'Zero Padding' }
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => persist({ adTileContainerMode: opt.id })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        (adminSettings.adTileContainerMode || 'contained') === opt.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio / Height */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Aspect Ratio / Height
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {([
                    { id: 'narrow' as const, label: 'Narrower' },
                    { id: 'default' as const, label: 'Default' },
                    { id: 'tall' as const, label: 'Taller' }
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => persist({ adTileAspectHeight: opt.id })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        (adminSettings.adTileAspectHeight || 'default') === opt.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Glare ON/OFF */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Image Glare / Edge Fade
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => persist({ adTileImageGlare: true })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      adminSettings.adTileImageGlare !== false
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Glare On
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ adTileImageGlare: false })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      adminSettings.adTileImageGlare === false
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Glare Off
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileTitle || ''}
                  onChange={(e) => persist({ adTileTitle: e.target.value })}
                  placeholder="Sponsor Headline"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Button Label (optional)
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileButtonText || ''}
                  onChange={(e) => persist({ adTileButtonText: e.target.value })}
                  placeholder="Learn More"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Subtitle (optional)
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileSubtitle || ''}
                  onChange={(e) => persist({ adTileSubtitle: e.target.value })}
                  placeholder="Short promotional copy..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Background Image URL
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileImageUrl || ''}
                  onChange={(e) => persist({ adTileImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Logo Image URL (optional)
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileLogoImageUrl || ''}
                  onChange={(e) => persist({ adTileLogoImageUrl: e.target.value })}
                  placeholder="https://... (transparent PNG logo)"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Destination URL (/watch/... or https://...)
                </label>
                <input
                  type="text"
                  value={adminSettings.adTileButtonUrl || ''}
                  onChange={(e) => persist({ adTileButtonUrl: e.target.value })}
                  placeholder="https://example.com or /watch/slug"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            {/* Badge, Text, Button Positioning & Cross Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Ad Badge Position
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {([
                    { id: 'top_left' as const, label: 'Top Left' },
                    { id: 'bottom_left' as const, label: 'Bottom Left' }
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => persist({ adTileBadgePosition: opt.id })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                        (adminSettings.adTileBadgePosition || 'bottom_left') === opt.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Title &amp; Subtitle Position
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {([
                    { id: 'center' as const, label: 'Center' },
                    { id: 'bottom_left' as const, label: 'Btm Left' },
                    { id: 'bottom_right' as const, label: 'Btm Right' }
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => persist({ adTileTextPosition: opt.id })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        (adminSettings.adTileTextPosition || 'center') === opt.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Action Button Position
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {([
                    { id: 'center' as const, label: 'Center' },
                    { id: 'bottom_left' as const, label: 'Btm Left' },
                    { id: 'bottom_right' as const, label: 'Btm Right' }
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => persist({ adTileButtonPosition: opt.id })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                        (adminSettings.adTileButtonPosition || 'center') === opt.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Cross (X) Close Button
                </label>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => persist({ adTileShowCloseButton: false })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      !adminSettings.adTileShowCloseButton
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={() => persist({ adTileShowCloseButton: true })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      adminSettings.adTileShowCloseButton
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Show X
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Separate Mobile Ad Tile Config */}
          <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/90 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                  Separate Mobile Layout Ad Tile
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Design a completely different Ad Tile creative, aspect height, padding, and glare setting specifically for Mobile.
                </p>
              </div>
              <button
                type="button"
                onClick={() => persist({ adTileSeparateMobile: !adminSettings.adTileSeparateMobile })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  adminSettings.adTileSeparateMobile
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                {adminSettings.adTileSeparateMobile ? 'Separate Mobile Active' : 'Use Same as Desktop'}
              </button>
            </div>

            {adminSettings.adTileSeparateMobile && (
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Container Style
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {([
                        { id: 'contained' as const, label: 'Padded' },
                        { id: 'full_bleed' as const, label: 'Zero Padding' }
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => persist({ adTileMobileContainerMode: opt.id })}
                          className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                            (adminSettings.adTileMobileContainerMode || 'contained') === opt.id
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Aspect Height
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {([
                        { id: 'narrow' as const, label: 'Narrower' },
                        { id: 'default' as const, label: 'Default' },
                        { id: 'tall' as const, label: 'Taller' }
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => persist({ adTileMobileAspectHeight: opt.id })}
                          className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                            (adminSettings.adTileMobileAspectHeight || 'default') === opt.id
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Image Glare
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => persist({ adTileMobileImageGlare: true })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          adminSettings.adTileMobileImageGlare !== false
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Glare On
                      </button>
                      <button
                        type="button"
                        onClick={() => persist({ adTileMobileImageGlare: false })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          adminSettings.adTileMobileImageGlare === false
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Glare Off
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Title
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileTitle || ''}
                      onChange={(e) => persist({ adTileMobileTitle: e.target.value })}
                      placeholder="Mobile Ad Headline"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Button Label
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileButtonText || ''}
                      onChange={(e) => persist({ adTileMobileButtonText: e.target.value })}
                      placeholder="Explore"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Subtitle
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileSubtitle || ''}
                      onChange={(e) => persist({ adTileMobileSubtitle: e.target.value })}
                      placeholder="Mobile promotional copy..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Background Image URL
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileImageUrl || ''}
                      onChange={(e) => persist({ adTileMobileImageUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Logo Image URL (optional)
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileLogoImageUrl || ''}
                      onChange={(e) => persist({ adTileMobileLogoImageUrl: e.target.value })}
                      placeholder="https://... (transparent PNG logo)"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Mobile Destination URL
                    </label>
                    <input
                      type="text"
                      value={adminSettings.adTileMobileButtonUrl || ''}
                      onChange={(e) => persist({ adTileMobileButtonUrl: e.target.value })}
                      placeholder="https://... or /watch/..."
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* Mobile Badge, Text, Button Positioning & Cross Button */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Ad Badge Position
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {([
                        { id: 'top_left' as const, label: 'Top Left' },
                        { id: 'bottom_left' as const, label: 'Bottom Left' }
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => persist({ adTileMobileBadgePosition: opt.id })}
                          className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                            (adminSettings.adTileMobileBadgePosition || adminSettings.adTileBadgePosition || 'bottom_left') === opt.id
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Text Position
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {([
                        { id: 'center' as const, label: 'Center' },
                        { id: 'bottom_left' as const, label: 'Btm Left' },
                        { id: 'bottom_right' as const, label: 'Btm Right' }
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => persist({ adTileMobileTextPosition: opt.id })}
                          className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer ${
                            (adminSettings.adTileMobileTextPosition || adminSettings.adTileTextPosition || 'center') === opt.id
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Button Position
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      {([
                        { id: 'center' as const, label: 'Center' },
                        { id: 'bottom_left' as const, label: 'Btm Left' },
                        { id: 'bottom_right' as const, label: 'Btm Right' }
                      ]).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => persist({ adTileMobileButtonPosition: opt.id })}
                          className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer ${
                            (adminSettings.adTileMobileButtonPosition || adminSettings.adTileButtonPosition || 'center') === opt.id
                              ? 'bg-red-600 text-white'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-zinc-400">
                      Mobile Cross Button
                    </label>
                    <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => persist({ adTileMobileShowCloseButton: false })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          !(adminSettings.adTileMobileShowCloseButton ?? adminSettings.adTileShowCloseButton)
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => persist({ adTileMobileShowCloseButton: true })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          Boolean(adminSettings.adTileMobileShowCloseButton ?? adminSettings.adTileShowCloseButton)
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Show X
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Live Desktop Preview
            </p>
            <div className="rounded-xl bg-[#141414] border border-zinc-800 overflow-hidden py-3">
              <AdTileBanner
                key={`preview-tile-${adminSettings.adTileShowCloseButton ? 'x' : 'nx'}-${adminSettings.adTileBadgePosition || 'bl'}`}
                title={adminSettings.adTileTitle || 'Your Sponsored Headline'}
                subtitle={adminSettings.adTileSubtitle}
                buttonText={adminSettings.adTileButtonText || 'Learn More'}
                imageUrl={adminSettings.adTileImageUrl}
                logoImageUrl={adminSettings.adTileLogoImageUrl}
                containerMode={adminSettings.adTileContainerMode || 'contained'}
                aspectHeight={adminSettings.adTileAspectHeight || 'default'}
                imageGlare={adminSettings.adTileImageGlare !== false}
                badgePosition={adminSettings.adTileBadgePosition || 'bottom_left'}
                textPosition={adminSettings.adTileTextPosition || 'center'}
                buttonPosition={adminSettings.adTileButtonPosition || 'center'}
                showCloseButton={Boolean(adminSettings.adTileShowCloseButton)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. MORE INFO PAGE AD TILE (Movies & Shows with Section Placement)     */}
      {/* ===================================================================== */}
      {activeSub === 'more_info' && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                More Info Page Ad Tile (Movies &amp; Shows)
              </h3>
              <p className="text-xs text-zinc-400">
                Display an Ad Tile directly inside every Movie &amp; Series More Info page and select exactly beneath which section it appears.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                persist({
                  moreInfoAdEnabled: !adminSettings.moreInfoAdEnabled,
                  moreInfoAdPlacement: adminSettings.moreInfoAdPlacement || 'episodes',
                  moreInfoAdLayouts: adminSettings.moreInfoAdLayouts || ['desktop', 'laptop', 'tablet', 'mobile']
                })
              }
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                adminSettings.moreInfoAdEnabled
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {adminSettings.moreInfoAdEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {renderLayoutSelector('moreInfoAdLayouts')}

          {/* Section Placement Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Show Ad Tile Beneath Section
              </label>
              <select
                value={adminSettings.moreInfoAdPlacement || 'episodes'}
                onChange={(e) =>
                  persist({ moreInfoAdPlacement: e.target.value as MoreInfoAdSection })
                }
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-xs font-semibold text-white focus:outline-none focus:border-red-500 cursor-pointer"
              >
                {MORE_INFO_SECTIONS.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Ad Creative Source
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => persist({ moreInfoAdUseCustomCreative: false })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    !adminSettings.moreInfoAdUseCustomCreative
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Use Homepage Ad Tile
                </button>
                <button
                  type="button"
                  onClick={() => persist({ moreInfoAdUseCustomCreative: true })}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    adminSettings.moreInfoAdUseCustomCreative
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Custom Creative
                </button>
              </div>
            </div>
          </div>

          {adminSettings.moreInfoAdUseCustomCreative && (
            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Container Style
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {([
                      { id: 'contained' as const, label: 'Padded' },
                      { id: 'full_bleed' as const, label: 'Zero Padding' }
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => persist({ moreInfoAdContainerMode: opt.id })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          (adminSettings.moreInfoAdContainerMode || 'contained') === opt.id
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Aspect Ratio / Height
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {([
                      { id: 'narrow' as const, label: 'Narrower' },
                      { id: 'default' as const, label: 'Default' },
                      { id: 'tall' as const, label: 'Taller' }
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => persist({ moreInfoAdAspectHeight: opt.id })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          (adminSettings.moreInfoAdAspectHeight || 'default') === opt.id
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Image Glare
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => persist({ moreInfoAdImageGlare: true })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                        adminSettings.moreInfoAdImageGlare !== false
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Glare On
                    </button>
                    <button
                      type="button"
                      onClick={() => persist({ moreInfoAdImageGlare: false })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                        adminSettings.moreInfoAdImageGlare === false
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Glare Off
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdTitle || ''}
                    onChange={(e) => persist({ moreInfoAdTitle: e.target.value })}
                    placeholder="More Info Ad Title"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdButtonText || ''}
                    onChange={(e) => persist({ moreInfoAdButtonText: e.target.value })}
                    placeholder="Learn More"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdSubtitle || ''}
                    onChange={(e) => persist({ moreInfoAdSubtitle: e.target.value })}
                    placeholder="Optional subtitle"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdImageUrl || ''}
                    onChange={(e) => persist({ moreInfoAdImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Logo Image URL (optional)
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdLogoImageUrl || ''}
                    onChange={(e) => persist({ moreInfoAdLogoImageUrl: e.target.value })}
                    placeholder="https://... (transparent PNG logo)"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Target URL
                  </label>
                  <input
                    type="text"
                    value={adminSettings.moreInfoAdButtonUrl || ''}
                    onChange={(e) => persist({ moreInfoAdButtonUrl: e.target.value })}
                    placeholder="https://... or /watch/..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Badge, Text, Button Positioning & Cross Button */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Ad Badge Position
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {([
                      { id: 'top_left' as const, label: 'Top Left' },
                      { id: 'bottom_left' as const, label: 'Bottom Left' }
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => persist({ moreInfoAdBadgePosition: opt.id })}
                        className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                          (adminSettings.moreInfoAdBadgePosition || 'bottom_left') === opt.id
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Title &amp; Subtitle Position
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {([
                      { id: 'center' as const, label: 'Center' },
                      { id: 'bottom_left' as const, label: 'Btm Left' },
                      { id: 'bottom_right' as const, label: 'Btm Right' }
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => persist({ moreInfoAdTextPosition: opt.id })}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer ${
                          (adminSettings.moreInfoAdTextPosition || 'center') === opt.id
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Action Button Position
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    {([
                      { id: 'center' as const, label: 'Center' },
                      { id: 'bottom_left' as const, label: 'Btm Left' },
                      { id: 'bottom_right' as const, label: 'Btm Right' }
                    ]).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => persist({ moreInfoAdButtonPosition: opt.id })}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold cursor-pointer ${
                          (adminSettings.moreInfoAdButtonPosition || 'center') === opt.id
                            ? 'bg-red-600 text-white'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Cross (X) Close Button
                  </label>
                  <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => persist({ moreInfoAdShowCloseButton: false })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                        !adminSettings.moreInfoAdShowCloseButton
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Hide
                    </button>
                    <button
                      type="button"
                      onClick={() => persist({ moreInfoAdShowCloseButton: true })}
                      className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                        adminSettings.moreInfoAdShowCloseButton
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Show X
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Preview for More Info Custom Creative */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Live More Info Ad Preview
                </p>
                <div className="rounded-xl bg-[#141414] border border-zinc-800 overflow-hidden py-3">
                  <AdTileBanner
                    key={`preview-mi-${adminSettings.moreInfoAdShowCloseButton ? 'x' : 'nx'}-${adminSettings.moreInfoAdBadgePosition || 'bl'}`}
                    title={adminSettings.moreInfoAdTitle || 'More Info Sponsored Tile'}
                    subtitle={adminSettings.moreInfoAdSubtitle}
                    buttonText={adminSettings.moreInfoAdButtonText || 'Learn More'}
                    imageUrl={adminSettings.moreInfoAdImageUrl}
                    logoImageUrl={adminSettings.moreInfoAdLogoImageUrl}
                    containerMode={adminSettings.moreInfoAdContainerMode || 'contained'}
                    aspectHeight={adminSettings.moreInfoAdAspectHeight || 'default'}
                    imageGlare={adminSettings.moreInfoAdImageGlare !== false}
                    badgePosition={adminSettings.moreInfoAdBadgePosition || 'bottom_left'}
                    textPosition={adminSettings.moreInfoAdTextPosition || 'center'}
                    buttonPosition={adminSettings.moreInfoAdButtonPosition || 'center'}
                    showCloseButton={Boolean(adminSettings.moreInfoAdShowCloseButton)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. SEARCH PAGE AD TILE (Sponsored Card below search bar)              */}
      {/* ===================================================================== */}
      {activeSub === 'search' && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Search Page Sponsored Ad Card
              </h3>
              <p className="text-xs text-zinc-400">
                Appears naturally inside &quot;Recommended For You&quot; &amp; Search Results at a randomized non-fixed slot using the exact Recommended card UI (Title on top, yellow &quot;Ad&quot; badge below, whole card clickable).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                persist({
                  searchAdEnabled: !adminSettings.searchAdEnabled,
                  searchAdLayouts: adminSettings.searchAdLayouts || ['desktop', 'laptop', 'tablet', 'mobile']
                })
              }
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                adminSettings.searchAdEnabled
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {adminSettings.searchAdEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {renderLayoutSelector('searchAdLayouts')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Badge Label (defaults to Ad)
              </label>
              <input
                type="text"
                value={adminSettings.searchAdBadgeText || ''}
                onChange={(e) => persist({ searchAdBadgeText: e.target.value })}
                placeholder="Ad"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Target URL (/watch/... or https://...)
              </label>
              <input
                type="text"
                value={adminSettings.searchAdButtonUrl || ''}
                onChange={(e) => persist({ searchAdButtonUrl: e.target.value })}
                placeholder="https://... or /watch/..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Title (shown on top)
              </label>
              <input
                type="text"
                value={adminSettings.searchAdTitle || ''}
                onChange={(e) => persist({ searchAdTitle: e.target.value })}
                placeholder="Pepsi – Live it Abhi"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Subtitle (optional, beside Ad badge)
              </label>
              <input
                type="text"
                value={adminSettings.searchAdSubtitle || ''}
                onChange={(e) => persist({ searchAdSubtitle: e.target.value })}
                placeholder="Refresh Your Mood"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Thumbnail Image URL
              </label>
              <input
                type="text"
                value={adminSettings.searchAdImageUrl || ''}
                onChange={(e) => persist({ searchAdImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Live Previews (Mobile Recommended Row + Desktop Grid Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Mobile &quot;Recommended For You&quot; Preview
              </p>
              <div className="p-3.5 rounded-xl bg-black border border-zinc-800">
                <SearchAdCard
                  variant="mobile_row"
                  imageUrl={adminSettings.searchAdImageUrl}
                  badgeText={adminSettings.searchAdBadgeText || 'Ad'}
                  title={adminSettings.searchAdTitle || 'Sponsor Campaign Title'}
                  subtitle={adminSettings.searchAdSubtitle}
                  buttonUrl={adminSettings.searchAdButtonUrl}
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Desktop Search Grid Card Preview
              </p>
              <div className="p-3.5 rounded-xl bg-black border border-zinc-800 max-w-[300px]">
                <SearchAdCard
                  variant="desktop_card"
                  imageUrl={adminSettings.searchAdImageUrl}
                  badgeText={adminSettings.searchAdBadgeText || 'Ad'}
                  title={adminSettings.searchAdTitle || 'Sponsor Campaign Title'}
                  subtitle={adminSettings.searchAdSubtitle}
                  buttonUrl={adminSettings.searchAdButtonUrl}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. NARROW AD BAR WITH TOP-RIGHT CROSS BUTTON                          */}
      {/* ===================================================================== */}
      {activeSub === 'narrow_bar' && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Narrow Dismissible Ad Bar
              </h3>
              <p className="text-xs text-zinc-400">
                Sleek horizontal ad bar matching the recommendation container border. Never displays simultaneously with the Alert Banner and never appears on Episode pages. Leave Button Label empty to make the whole bar clickable (opens URL if set, else dismisses).
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                persist({
                  narrowAdBarEnabled: !adminSettings.narrowAdBarEnabled,
                  narrowAdBarLayouts: adminSettings.narrowAdBarLayouts || ['desktop', 'laptop', 'tablet', 'mobile']
                })
              }
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                adminSettings.narrowAdBarEnabled
                  ? 'bg-red-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
              }`}
            >
              {adminSettings.narrowAdBarEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {renderLayoutSelector('narrowAdBarLayouts')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Bar Position
              </label>
              <div className="flex gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 max-w-md">
                {([
                  { id: 'bottom_floating' as const, label: 'Bottom Floating Bar' },
                  { id: 'top_banner' as const, label: 'Top Floating Banner' }
                ]).map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => persist({ narrowAdBarPlacement: pos.id })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                      (adminSettings.narrowAdBarPlacement || 'bottom_floating') === pos.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Title / Tagline (optional if baked in image)
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarTitle || ''}
                onChange={(e) => persist({ narrowAdBarTitle: e.target.value })}
                placeholder="Live it Abhi"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Subtitle (optional)
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarSubtitle || ''}
                onChange={(e) => persist({ narrowAdBarSubtitle: e.target.value })}
                placeholder="Optional subtext"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Button Label (leave empty to make whole bar clickable)
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarButtonText || ''}
                onChange={(e) => persist({ narrowAdBarButtonText: e.target.value })}
                placeholder="Leave empty or e.g. Join Now"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Target URL (/watch/... or https://...)
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarButtonUrl || ''}
                onChange={(e) => persist({ narrowAdBarButtonUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Banner Background Image URL
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarImageUrl || ''}
                onChange={(e) => persist({ narrowAdBarImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Logo Image URL (optional)
              </label>
              <input
                type="text"
                value={adminSettings.narrowAdBarLogoImageUrl || ''}
                onChange={(e) => persist({ narrowAdBarLogoImageUrl: e.target.value })}
                placeholder="https://... (transparent PNG logo)"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Layout Positioning Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/80">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Ad Badge Position
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {([
                  { id: 'top_left' as const, label: 'Top Left' },
                  { id: 'bottom_left' as const, label: 'Bottom Left' }
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => persist({ narrowAdBarBadgePosition: opt.id })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                      (adminSettings.narrowAdBarBadgePosition || 'top_left') === opt.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Title &amp; Logo Position
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {([
                  { id: 'left' as const, label: 'Left' },
                  { id: 'center' as const, label: 'Center' },
                  { id: 'right' as const, label: 'Right' }
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => persist({ narrowAdBarTextPosition: opt.id })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                      (adminSettings.narrowAdBarTextPosition || 'left') === opt.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Action Button Position
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {([
                  { id: 'left' as const, label: 'Left' },
                  { id: 'center' as const, label: 'Center' },
                  { id: 'right' as const, label: 'Right' }
                ]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => persist({ narrowAdBarButtonPosition: opt.id })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                      (adminSettings.narrowAdBarButtonPosition || 'right') === opt.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Cross (X) Close Button
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                <button
                  type="button"
                  onClick={() => persist({ narrowAdBarShowCloseButton: true })}
                  className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                    adminSettings.narrowAdBarShowCloseButton !== false
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Show X
                </button>
                <button
                  type="button"
                  onClick={() => persist({ narrowAdBarShowCloseButton: false })}
                  className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                    adminSettings.narrowAdBarShowCloseButton === false
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Hide
                </button>
              </div>
            </div>
          </div>

          {/* Display Delay Timer (Min 5s or Random) */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white">Display Delay Timer (Min 5 Seconds)</p>
                <p className="text-[11px] text-zinc-400">
                  Choose a fixed wait time or random delay range before the Narrow Ad Bar appears. Never overlaps with Alert Banner.
                </p>
              </div>
              <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0 self-start sm:self-auto">
                {([
                  { id: 'fixed' as const, label: 'Fixed Delay' },
                  { id: 'random' as const, label: 'Random Delay' }
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => persist({ narrowAdBarDelayMode: mode.id })}
                    className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      (adminSettings.narrowAdBarDelayMode || 'fixed') === mode.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  {(adminSettings.narrowAdBarDelayMode || 'fixed') === 'random'
                    ? 'Minimum Delay (seconds, min 5)'
                    : 'Show After (seconds, min 5)'}
                </label>
                <input
                  type="number"
                  min={5}
                  value={Math.max(5, adminSettings.narrowAdBarDelaySeconds ?? 5)}
                  onChange={(e) => {
                    const val = Math.max(5, parseInt(e.target.value || '5', 10) || 5);
                    const patch: Partial<AdminSettings> = { narrowAdBarDelaySeconds: val };
                    if ((adminSettings.narrowAdBarDelayMaxSeconds ?? 25) < val + 5) {
                      patch.narrowAdBarDelayMaxSeconds = val + 5;
                    }
                    persist(patch);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>
              {(adminSettings.narrowAdBarDelayMode || 'fixed') === 'random' && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Maximum Delay (seconds)
                  </label>
                  <input
                    type="number"
                    min={Math.max(10, (adminSettings.narrowAdBarDelaySeconds ?? 5) + 5)}
                    value={Math.max(
                      (adminSettings.narrowAdBarDelaySeconds ?? 5) + 5,
                      adminSettings.narrowAdBarDelayMaxSeconds ?? 25
                    )}
                    onChange={(e) => {
                      const minAllowed = Math.max(10, (adminSettings.narrowAdBarDelaySeconds ?? 5) + 5);
                      const val = Math.max(minAllowed, parseInt(e.target.value || String(minAllowed), 10) || minAllowed);
                      persist({ narrowAdBarDelayMaxSeconds: val });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Inline Preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              Live Narrow Bar Preview
            </p>
            {(() => {
              const badgePos = adminSettings.narrowAdBarBadgePosition || 'top_left';
              const textPos = adminSettings.narrowAdBarTextPosition || 'left';
              const btnPos = adminSettings.narrowAdBarButtonPosition || 'right';
              const showClose = adminSettings.narrowAdBarShowCloseButton !== false;
              const previewLogo = (adminSettings.narrowAdBarLogoImageUrl || '').trim();
              const previewTitle = (adminSettings.narrowAdBarTitle || '').trim();
              const previewSub = (adminSettings.narrowAdBarSubtitle || '').trim();
              const previewBtn = (adminSettings.narrowAdBarButtonText || '').trim();
              const renderPreviewText = () => (
                <div className="flex items-center gap-2 min-w-0">
                  {previewLogo && (
                    <img
                      src={previewLogo}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-8 w-auto max-w-[110px] object-contain shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-extrabold text-white truncate drop-shadow">
                      {previewTitle || (previewLogo ? '' : 'Your Narrow Ad Banner')}
                    </span>
                    {previewSub && (
                      <span className="text-[11px] text-white/80 truncate">{previewSub}</span>
                    )}
                  </div>
                </div>
              );
              const renderPreviewBtn = () =>
                previewBtn ? (
                  <span className="shrink-0 px-5 py-1.5 rounded-full bg-white text-black font-extrabold text-xs shadow">
                    {previewBtn}
                  </span>
                ) : null;

              return (
                <div className="relative w-full h-[72px] rounded-[9px] overflow-hidden bg-[#0b0d14] border-0 flex items-center">
                  <div className="absolute inset-0 rounded-[inherit] pointer-events-none z-30 border-[2px] border-zinc-400/[0.09]" />
                  {adminSettings.narrowAdBarImageUrl && (
                    <img
                      src={adminSettings.narrowAdBarImageUrl}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <span
                    className={`absolute ${
                      badgePos === 'bottom_left' ? 'bottom-2.5 left-2.5' : 'top-2.5 left-2.5'
                    } z-30 inline-flex items-center justify-center rounded-[4px] bg-[#FFB800] text-[#0d0d0d] px-[5px] py-[2px] text-[10.5px] font-bold tracking-[0.03em] leading-none font-sans`}
                  >
                    AD
                  </span>
                  <div
                    className={`relative z-20 w-full h-full grid grid-cols-3 items-center gap-2 pl-11 ${
                      showClose ? 'pr-10' : 'pr-5'
                    }`}
                  >
                    <div className="flex items-center justify-start gap-2 min-w-0">
                      {textPos === 'left' && renderPreviewText()}
                      {btnPos === 'left' && renderPreviewBtn()}
                    </div>
                    <div className="flex items-center justify-center gap-2 min-w-0">
                      {textPos === 'center' && renderPreviewText()}
                      {btnPos === 'center' && renderPreviewBtn()}
                    </div>
                    <div className="flex items-center justify-end gap-2 min-w-0">
                      {textPos === 'right' && renderPreviewText()}
                      {btnPos === 'right' && renderPreviewBtn()}
                    </div>
                  </div>
                  {showClose && (
                    <span className="absolute top-2.5 right-2.5 z-40 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. ALERT POSTER / VIDEO AD MODAL                                      */}
      {/* ===================================================================== */}
      {activeSub === 'alert_poster' && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Alert Banner Image &amp; Video Ad Poster Modal
              </h3>
              <p className="text-xs text-zinc-400">
                Full controls for the timed Alert Poster / Video Ad popup with yellow Ad badge, countdown timer, skip delay, and frequency caps.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.removeItem('dizi_alert_poster_dismissed');
                    localStorage.removeItem('dizi_alert_dismiss_count');
                    localStorage.removeItem('dizi_alert_action_count');
                  } catch {}
                  window.dispatchEvent(new Event('dizi_alert_poster_reset'));
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Dismissal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextEnabled = !adminSettings.alertPosterEnabled;
                  persist({
                    alertPosterEnabled: nextEnabled,
                    alertPosterButtonAction: adminSettings.alertPosterButtonAction || 'close',
                    alertPosterLayouts: adminSettings.alertPosterLayouts || ['desktop', 'laptop', 'tablet', 'mobile']
                  });
                  if (nextEnabled) {
                    try {
                      sessionStorage.removeItem('dizi_alert_poster_dismissed');
                      window.dispatchEvent(new Event('dizi_alert_poster_reset'));
                    } catch {}
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminSettings.alertPosterEnabled
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                }`}
              >
                {adminSettings.alertPosterEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          {renderLayoutSelector('alertPosterLayouts')}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Alert Title
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterTitle || ''}
                onChange={(e) => persist({ alertPosterTitle: e.target.value })}
                placeholder="Optional title"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Button Label
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterButtonText || ''}
                onChange={(e) => persist({ alertPosterButtonText: e.target.value })}
                placeholder="Close"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Subtitle / Message
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterSubtitle || ''}
                onChange={(e) => persist({ alertPosterSubtitle: e.target.value })}
                placeholder="Optional subtitle"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Poster Image URL
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterImageUrl || ''}
                onChange={(e) => persist({ alertPosterImageUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Alert Video URL (MP4 / HLS)
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterVideoUrl || ''}
                onChange={(e) => persist({ alertPosterVideoUrl: e.target.value })}
                placeholder="https://... .mp4 or .m3u8"
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-200 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(adminSettings.alertPosterIsAd)}
                  onChange={(e) => persist({ alertPosterIsAd: e.target.checked })}
                  className="accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Show Yellow &quot;Ad&quot; Badge (Video Ad Mode)</span>
              </label>

              {adminSettings.alertPosterIsAd && (
                <label className="flex items-center gap-2 text-xs text-zinc-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(adminSettings.alertPosterAdRequireFullWatch)}
                    onChange={(e) => persist({ alertPosterAdRequireFullWatch: e.target.checked })}
                    className="accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span>Require Full Watch Before Dismiss</span>
                </label>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Button Action
              </label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                {([
                  { id: 'close' as const, label: 'Close' },
                  { id: 'login' as const, label: 'Login' },
                  { id: 'link' as const, label: 'Open Link' }
                ]).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => persist({ alertPosterButtonAction: act.id })}
                    className={`flex-1 py-1.5 rounded text-[11px] font-bold cursor-pointer ${
                      (adminSettings.alertPosterButtonAction || 'close') === act.id
                        ? 'bg-red-600 text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Target URL (/watch/... or https://...)
              </label>
              <input
                type="text"
                value={adminSettings.alertPosterButtonUrl || ''}
                onChange={(e) => persist({ alertPosterButtonUrl: e.target.value })}
                placeholder="/watch/slug or https://..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Max Dismissals (0 = unlimited)
              </label>
              <input
                type="number"
                min={0}
                value={adminSettings.alertPosterMaxDismissCount ?? 0}
                onChange={(e) =>
                  persist({ alertPosterMaxDismissCount: Math.max(0, parseInt(e.target.value || '0', 10) || 0) })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Max Action Clicks (0 = unlimited)
              </label>
              <input
                type="number"
                min={0}
                value={adminSettings.alertPosterMaxActionCount ?? 0}
                onChange={(e) =>
                  persist({ alertPosterMaxActionCount: Math.max(0, parseInt(e.target.value || '0', 10) || 0) })
                }
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Display Delay Timer (Min 5s or Random) */}
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3 mt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-white">Display Delay Timer (Min 5 Seconds)</p>
                  <p className="text-[11px] text-zinc-400">
                    Set a fixed delay (at least 5s) or random delay range before showing the Alert Banner. Never shows at the same time as the Narrow Ad Bar and never shows on Episode pages.
                  </p>
                </div>
                <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 shrink-0 self-start sm:self-auto">
                  {([
                    { id: 'fixed' as const, label: 'Fixed Delay' },
                    { id: 'random' as const, label: 'Random Delay' }
                  ]).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => persist({ alertPosterDelayMode: mode.id })}
                      className={`px-3 py-1 rounded text-[11px] font-bold cursor-pointer ${
                        (adminSettings.alertPosterDelayMode || 'fixed') === mode.id
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    {(adminSettings.alertPosterDelayMode || 'fixed') === 'random'
                      ? 'Minimum Delay (seconds, min 5)'
                      : 'Show After (seconds, min 5)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    value={Math.max(5, adminSettings.alertPosterDelaySeconds ?? 5)}
                    onChange={(e) => {
                      const val = Math.max(5, parseInt(e.target.value || '5', 10) || 5);
                      const patch: Partial<AdminSettings> = { alertPosterDelaySeconds: val };
                      if ((adminSettings.alertPosterDelayMaxSeconds ?? 25) < val + 5) {
                        patch.alertPosterDelayMaxSeconds = val + 5;
                      }
                      persist(patch);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                {(adminSettings.alertPosterDelayMode || 'fixed') === 'random' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                      Maximum Delay (seconds)
                    </label>
                    <input
                      type="number"
                      min={Math.max(10, (adminSettings.alertPosterDelaySeconds ?? 5) + 5)}
                      value={Math.max(
                        (adminSettings.alertPosterDelaySeconds ?? 5) + 5,
                        adminSettings.alertPosterDelayMaxSeconds ?? 25
                      )}
                      onChange={(e) => {
                        const minAllowed = Math.max(10, (adminSettings.alertPosterDelaySeconds ?? 5) + 5);
                        const val = Math.max(minAllowed, parseInt(e.target.value || String(minAllowed), 10) || minAllowed);
                        persist({ alertPosterDelayMaxSeconds: val });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
