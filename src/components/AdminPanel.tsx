import React, { useState } from 'react';
import { Show, FeedConfig, AdminSettings } from '../types';
import {
  X,
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Plus,
  TrendingUp,
  Tv,
  Check,
  RefreshCw,
  Settings2
} from 'lucide-react';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shows: Show[];
  feeds: FeedConfig[];
  adminSettings: AdminSettings;
  onUpdateShows: (shows: Show[]) => void;
  onUpdateFeeds: (feeds: FeedConfig[]) => void;
  onUpdateSettings: (settings: AdminSettings) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  shows,
  feeds,
  adminSettings,
  onUpdateShows,
  onUpdateFeeds,
  onUpdateSettings
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'feeds' | 'points' | 'settings'>('feeds');
  const [newFeedTitle, setNewFeedTitle] = useState<string>('');
  const [newFeedSubtitle, setNewFeedSubtitle] = useState<string>('');
  const [newFeedIsStretchable, setNewFeedIsStretchable] = useState<boolean>(false);
  const [pointSuccessMsg, setPointSuccessMsg] = useState<string | null>(null);

  // Reorder feeds
  const moveFeed = (index: number, direction: 'up' | 'down') => {
    const updated = [...feeds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onUpdateFeeds(updated);
  };

  // Toggle feed enabled
  const toggleFeedEnabled = (feedId: string) => {
    const updated = feeds.map((f) =>
      f.id === feedId ? { ...f, enabled: !f.enabled } : f
    );
    onUpdateFeeds(updated);
  };

  // Add custom feed
  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedTitle.trim()) return;

    const newFeed: FeedConfig = {
      id: `custom-feed-${Date.now()}`,
      title: newFeedTitle.trim(),
      subtitle: newFeedSubtitle.trim() || 'Curated recommendation row',
      categoryKey: 'custom',
      enabled: true,
      isStretchableFeed: newFeedIsStretchable
    };

    onUpdateFeeds([...feeds, newFeed]);
    setNewFeedTitle('');
    setNewFeedSubtitle('');
    setNewFeedIsStretchable(false);
  };

  // Boost show points
  const handleBoostPoints = (showId: string, amount: number) => {
    const updated = shows.map((s) =>
      s.id === showId ? { ...s, points: s.points + amount } : s
    );
    onUpdateShows(updated);
    setPointSuccessMsg(`Points boosted by +${amount}! Top 10 rankings recalculated.`);
    setTimeout(() => setPointSuccessMsg(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#12131c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-zinc-900 to-[#181a26] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {adminSettings.platformName || 'Dizi Urdu'} Admin & Feeds Control Panel
              </h2>
              <p className="text-xs text-zinc-400">
                Manipulate platform name, recommendation feeds, show view-points, and layout options
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center px-6 pt-3 border-b border-zinc-800 gap-6 text-xs font-bold uppercase tracking-wider bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('feeds')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'feeds'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Feed Strips Manager ({feeds.length})
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'points'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Shows & Top 10 Points Ranking
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-red-600 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Platform Feature Toggles
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {/* TAB 1: FEEDS MANAGER */}
          {activeTab === 'feeds' && (
            <div className="space-y-6">
              {/* Add Custom Feed Strip */}
              <form
                onSubmit={handleAddFeed}
                className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-center gap-3"
              >
                <div className="flex-1 w-full space-y-2 sm:space-y-0 sm:flex sm:gap-3">
                  <input
                    type="text"
                    placeholder="New Feed Title (e.g. Oscar Winner Showcase)"
                    value={newFeedTitle}
                    onChange={(e) => setNewFeedTitle(e.target.value)}
                    className="w-full sm:w-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                  />
                  <input
                    type="text"
                    placeholder="Subtitle (e.g. Critical gems selected for tonight)"
                    value={newFeedSubtitle}
                    onChange={(e) => setNewFeedSubtitle(e.target.value)}
                    className="w-full sm:w-1/2 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newFeedIsStretchable}
                    onChange={(e) => setNewFeedIsStretchable(e.target.checked)}
                    className="rounded accent-emerald-500"
                  />
                  <span>Stretchable Feed</span>
                </label>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Feed Strip
                </button>
              </form>

              {/* Feed List with Reorder and Visibility */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Active Homepage Feed Strips (Drag & Order)
                </p>

                {feeds.map((feed, index) => (
                  <div
                    key={feed.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                      feed.enabled
                        ? 'bg-zinc-900/90 border-zinc-800'
                        : 'bg-zinc-950/60 border-zinc-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center font-mono">
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {feed.title}
                          {feed.isStretchableFeed && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">
                              Stretchable Feed
                            </span>
                          )}
                          {feed.showRankNumbers && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-red-950 text-red-400 rounded border border-red-800">
                              Top 10 Strip
                            </span>
                          )}
                        </h4>
                        {feed.subtitle && (
                          <p className="text-xs text-zinc-400">{feed.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Move Up */}
                      <button
                        onClick={() => moveFeed(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => moveFeed(index, 'down')}
                        disabled={index === feeds.length - 1}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* Toggle Enabled */}
                      <button
                        onClick={() => toggleFeedEnabled(feed.id)}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          feed.enabled
                            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                        }`}
                        title={feed.enabled ? 'Hide Feed' : 'Show Feed'}
                      >
                        {feed.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SHOWS & TOP 10 POINTS */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                <strong className="font-bold">Point Ranking System:</strong> Every time a user
                clicks a movie or series poster, it adds +1 point. Shows with the highest points
                automatically top the &quot;Top 10 Series Today&quot; and &quot;Top 10 Movies Today&quot; rows.
              </div>

              {pointSuccessMsg && (
                <div className="p-3 bg-emerald-900/60 border border-emerald-700 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {pointSuccessMsg}
                </div>
              )}

              <div className="space-y-3">
                {shows.map((show) => (
                  <div
                    key={show.id}
                    className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-10 rounded-md overflow-hidden bg-black shrink-0">
                        <img
                          src={show.posterLandscapeUrl}
                          alt={show.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {show.title}
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
                            {show.type}
                          </span>
                        </h4>
                        <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="text-amber-400 font-bold font-mono">
                            {show.points} points
                          </span>
                          <span>·</span>
                          <span>{show.durationOrSeasons}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleBoostPoints(show.id, 50)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        +50 pts
                      </button>
                      <button
                        onClick={() => handleBoostPoints(show.id, 250)}
                        className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 text-red-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        +250 pts (Boost Rank)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM FEATURE TOGGLES */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              {/* Platform Name (Instant 1-Click update everywhere) */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Platform Name</h4>
                    <p className="text-xs text-zinc-400">
                      Changing the platform name here updates it everywhere across the website, navigation, footers, profile pages, and settings in one click.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={adminSettings.platformName ?? 'Dizi Urdu'}
                    onChange={(e) => {
                      const updated = {
                        ...adminSettings,
                        platformName: e.target.value
                      };
                      onUpdateSettings(updated);
                      try {
                        localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                        window.dispatchEvent(new Event('cineflix_branding_change'));
                      } catch {}
                    }}
                    placeholder="e.g. Dizi Urdu"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3.5 py-2.5 text-sm text-white font-semibold outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...adminSettings,
                        platformName: 'Dizi Urdu'
                      };
                      onUpdateSettings(updated);
                      try {
                        localStorage.setItem('cineflix_settings', JSON.stringify(updated));
                        window.dispatchEvent(new Event('cineflix_branding_change'));
                      } catch {}
                    }}
                    className="px-3.5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  >
                    Reset to Dizi Urdu
                  </button>
                </div>
              </div>

              {/* Where to watch toggle */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Enable &quot;Where to Watch&quot; Provider Buttons
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Displays &quot;Watch on YouTube&quot;, &quot;Watch on Netflix&quot;, &quot;Watch on Tabii&quot; buttons on detail page
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...adminSettings,
                      enableWhereToWatch: !adminSettings.enableWhereToWatch
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    adminSettings.enableWhereToWatch ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      adminSettings.enableWhereToWatch ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Horizontal Episodes Line toggle */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Horizontal Scrollable Line for Episodes
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Renders season episodes in a horizontal scrollable row (as requested in brief)
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...adminSettings,
                      enableHorizontalEpisodes: !adminSettings.enableHorizontalEpisodes
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    adminSettings.enableHorizontalEpisodes ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      adminSettings.enableHorizontalEpisodes ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Autoplay hover trailers */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Autoplay Video Trailers on Poster Hover
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Streams preview video when hovering over show posters
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...adminSettings,
                      autoplayHoverTrailers: !adminSettings.autoplayHoverTrailers
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    adminSettings.autoplayHoverTrailers ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      adminSettings.autoplayHoverTrailers ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Stretchable Feed Cards toggle */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Stretchable Feed Cards (Desktop)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Hovering over feed poster smoothly turns it into landscape 16:9, displays logo PNG, and starts preview video
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...adminSettings,
                      enableStretchableCards: adminSettings.enableStretchableCards === false ? true : false
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    adminSettings.enableStretchableCards !== false ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      adminSettings.enableStretchableCards !== false ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Top 10 Badges toggle */}
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Show Top 10 Badges on Cards & More Info
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Displays red &quot;TOP 10&quot; badge in corner of ranking cards and on details page
                  </p>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...adminSettings,
                      showTop10Badges: adminSettings.showTop10Badges === false ? true : false
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    adminSettings.showTop10Badges !== false ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      adminSettings.showTop10Badges !== false ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Mobile Layout Controls (Mobile viewport only) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#121420] to-[#161a29] border border-red-500/30 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <h4 className="text-sm font-bold text-white">Mobile Layout Controls</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30">
                    Mobile Only
                  </span>
                </div>

                {/* 1. Mobile Bottom Navbar Style */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Mobile Bottom Navbar Style</h5>
                    <p className="text-[11px] text-zinc-400">Floating pill island vs fixed bottom edge dock</p>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileNavbarStyle: 'floating' })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        (adminSettings.mobileNavbarStyle || 'floating') === 'floating'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Floating
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileNavbarStyle: 'bottom_fixed' })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        adminSettings.mobileNavbarStyle === 'bottom_fixed'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Bottom Fixed
                    </button>
                  </div>
                </div>

                {/* 2. Mobile Navbar Labels */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Navbar Button Text Labels</h5>
                    <p className="text-[11px] text-zinc-400">Show or hide text labels under bottom navbar icons</p>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileNavbarShowLabels: true })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        adminSettings.mobileNavbarShowLabels !== false
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Show Text
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileNavbarShowLabels: false })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        adminSettings.mobileNavbarShowLabels === false
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      Hide Text
                    </button>
                  </div>
                </div>

                {/* 3. Mobile Recommendation Style */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Mobile Hero Recommendation</h5>
                    <p className="text-[11px] text-zinc-400">2:3 portrait card (no background autoplay) or 16:9 widescreen</p>
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileRecommendationStyle: 'portrait' })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        (adminSettings.mobileRecommendationStyle || 'portrait') === 'portrait'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      2:3 Card
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...adminSettings, mobileRecommendationStyle: 'landscape' })
                      }
                      className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        adminSettings.mobileRecommendationStyle === 'landscape'
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      16:9 Wide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
