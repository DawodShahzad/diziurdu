import React, { useState } from 'react';
import {
  X,
  Tv,
  Download,
  Volume2,
  Subtitles,
  Smartphone,
  Shield,
  Check,
  ChevronRight,
  Wifi,
  HardDrive,
  Trash2,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearWatchlist?: () => void;
  onClearWatchHistory?: () => void;
  platformName?: string;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  onClearWatchlist,
  onClearWatchHistory,
  platformName = 'Dizi Urdu'
}) => {
  const [cellularData, setCellularData] = useState<'automatic' | 'save' | 'max'>('automatic');
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [autoplayPreviews, setAutoplayPreviews] = useState<boolean>(true);
  const [wifiOnlyDownloads, setWifiOnlyDownloads] = useState<boolean>(true);
  const [smartDownloads, setSmartDownloads] = useState<boolean>(true);
  const [downloadQuality, setDownloadQuality] = useState<'standard' | 'high'>('high');
  const [defaultAudio, setDefaultAudio] = useState<string>('Turkish (Original)');
  const [defaultSubtitle, setDefaultSubtitle] = useState<string>('English [CC]');
  const [networkStatus, setNetworkStatus] = useState<string | null>(null);
  const [isTestingNetwork, setIsTestingNetwork] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'playback' | 'downloads' | 'audio' | 'data' | 'about'>('playback');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestNetwork = () => {
    setIsTestingNetwork(true);
    setNetworkStatus(null);
    setTimeout(() => {
      setIsTestingNetwork(false);
      setNetworkStatus('Connected • 84.5 Mbps (4K Ultra HD Ready)');
    }, 1200);
  };

  const AndroidSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-[#065fd4]' : 'bg-[#717171]/40'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out mt-0.5 ${
          checked ? 'translate-x-5.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );

  return (
    <>
      {/* ===================== MOBILE LAYOUT: ANDROID / YOUTUBE APP SETTINGS ===================== */}
      <div className="fixed inset-0 z-50 sm:hidden bg-[#0f0f0f] text-white flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
        {/* Android Top AppBar */}
        <div className="sticky top-0 z-30 bg-[#0f0f0f] border-b border-white/[0.08] px-3 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 active:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-medium text-white tracking-normal">Settings</h2>
          </div>
        </div>

        {/* Action feedback toast */}
        {actionFeedback && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center">
            {actionFeedback}
          </div>
        )}

        {/* Vertically Grouped Android Settings List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/[0.08] pb-12">
          {/* Section 1: General & Playback */}
          <div className="py-2">
            <h3 className="px-5 pt-3 pb-1 text-xs font-bold text-[#3ea6ff] uppercase tracking-wider">
              Playback Preferences
            </h3>

            <div className="px-5 py-3 flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-white">Autoplay next episode</p>
                <p className="text-xs text-zinc-400 mt-0.5">When you finish an episode, we will automatically play the next</p>
              </div>
              <AndroidSwitch checked={autoplayNext} onChange={() => setAutoplayNext(!autoplayNext)} />
            </div>

            <div className="px-5 py-3 flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-white">Autoplay previews</p>
                <p className="text-xs text-zinc-400 mt-0.5">Play video previews while browsing feeds</p>
              </div>
              <AndroidSwitch checked={autoplayPreviews} onChange={() => setAutoplayPreviews(!autoplayPreviews)} />
            </div>

            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Video streaming quality</p>
                <p className="text-xs text-zinc-400 mt-0.5 capitalize">{videoQuality} Definition (Automatic)</p>
              </div>
              <button
                onClick={() => setVideoQuality(videoQuality === 'high' ? 'medium' : videoQuality === 'medium' ? 'low' : 'high')}
                className="text-xs font-bold text-[#3ea6ff] uppercase cursor-pointer"
              >
                {videoQuality}
              </button>
            </div>
          </div>

          {/* Section 2: Downloads & Offline */}
          <div className="py-2">
            <h3 className="px-5 pt-3 pb-1 text-xs font-bold text-[#3ea6ff] uppercase tracking-wider">
              Downloads & Offline
            </h3>

            <div className="px-5 py-3 flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-white">Download over Wi-Fi only</p>
                <p className="text-xs text-zinc-400 mt-0.5">Save mobile cellular data when downloading</p>
              </div>
              <AndroidSwitch checked={wifiOnlyDownloads} onChange={() => setWifiOnlyDownloads(!wifiOnlyDownloads)} />
            </div>

            <div className="px-5 py-3 flex items-center justify-between">
              <div className="pr-4">
                <p className="text-sm font-medium text-white">Smart downloads</p>
                <p className="text-xs text-zinc-400 mt-0.5">Automatically delete watched episodes and download next</p>
              </div>
              <AndroidSwitch checked={smartDownloads} onChange={() => setSmartDownloads(!smartDownloads)} />
            </div>

            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Download quality</p>
                <p className="text-xs text-zinc-400 mt-0.5">{downloadQuality === 'high' ? 'High Definition (1080p)' : 'Standard Definition (720p)'}</p>
              </div>
              <button
                onClick={() => setDownloadQuality(downloadQuality === 'high' ? 'standard' : 'high')}
                className="text-xs font-bold text-[#3ea6ff] uppercase cursor-pointer"
              >
                {downloadQuality}
              </button>
            </div>
          </div>

          {/* Section 3: Audio & Subtitles */}
          <div className="py-2">
            <h3 className="px-5 pt-3 pb-1 text-xs font-bold text-[#3ea6ff] uppercase tracking-wider">
              Audio & Subtitles
            </h3>

            <div className="px-5 py-3">
              <p className="text-sm font-medium text-white">Default audio</p>
              <div className="flex gap-2 mt-2">
                {['Turkish (Original)', 'Urdu Dubbed'].map((a) => (
                  <button
                    key={a}
                    onClick={() => setDefaultAudio(a)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      defaultAudio === a ? 'bg-[#3ea6ff] text-black font-bold' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-3">
              <p className="text-sm font-medium text-white">Default subtitles</p>
              <div className="flex gap-2 mt-2">
                {['English [CC]', 'Urdu Subtitles', 'Off'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setDefaultSubtitle(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                      defaultSubtitle === s ? 'bg-[#3ea6ff] text-black font-bold' : 'bg-white/10 text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Data & History */}
          <div className="py-2">
            <h3 className="px-5 pt-3 pb-1 text-xs font-bold text-[#3ea6ff] uppercase tracking-wider">
              Data & Storage
            </h3>

            {onClearWatchHistory && (
              <div className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Clear Continue Watching</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Reset your saved episode watch progress</p>
                </div>
                <button
                  onClick={() => {
                    onClearWatchHistory();
                    setActionFeedback('Watch history cleared successfully');
                    setTimeout(() => setActionFeedback(null), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-600/30"
                >
                  Clear
                </button>
              </div>
            )}

            {onClearWatchlist && (
              <div className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Clear My List</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Remove all saved series and movies</p>
                </div>
                <button
                  onClick={() => {
                    onClearWatchlist();
                    setActionFeedback('Watchlist cleared successfully');
                    setTimeout(() => setActionFeedback(null), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 text-xs font-bold cursor-pointer hover:bg-red-600/30"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Section 5: Diagnostics & About */}
          <div className="py-2">
            <h3 className="px-5 pt-3 pb-1 text-xs font-bold text-[#3ea6ff] uppercase tracking-wider">
              About & Network
            </h3>

            <div className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">App version</p>
                <p className="text-xs text-zinc-400 mt-0.5">v3.2.0 (Official Build 2026)</p>
              </div>
              <span className="text-xs text-zinc-500">{platformName}</span>
            </div>

            <div className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Internet connection</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{networkStatus || 'Not tested'}</p>
                </div>
                <button
                  onClick={handleTestNetwork}
                  disabled={isTestingNetwork}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
                >
                  {isTestingNetwork ? 'Checking...' : 'Check'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== DESKTOP & TABLET LAYOUT (PRESERVED MODAL) ===================== */}
      <div className="fixed inset-0 z-50 hidden sm:flex items-center justify-center p-3 sm:p-6 bg-black/50 animate-modal-backdrop select-none">
      <div className="relative w-full max-w-2xl bg-[#14151a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-content">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#111216]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">App Settings</h2>
              <p className="text-xs text-zinc-400">Configure playback, downloads, and streaming preferences</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-white/10 px-6 bg-[#0f1014] text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('playback')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'playback'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Video Playback
          </button>
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'downloads'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Downloads
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'audio'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Audio & Subtitles
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'data'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            My List & History
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'about'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Diagnostics & About
          </button>
        </div>

        {/* Settings Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar text-xs">
          {/* TAB 1: VIDEO PLAYBACK */}
          {activeTab === 'playback' && (
            <div className="space-y-6">
              {/* Cellular Data Usage */}
              <div className="space-y-2">
                <label className="text-white font-bold block text-sm">Cellular Data Usage</label>
                <p className="text-zinc-400 text-xs">
                  Balance video stream clarity with mobile data bandwidth consumption
                </p>
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: 'automatic', label: 'Automatic', desc: 'Balances data & 4K quality' },
                    { id: 'save', label: 'Save Data', desc: 'Up to 0.7 GB per hour' },
                    { id: 'max', label: 'Maximum Data', desc: 'Always stream highest 4K' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setCellularData(opt.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        cellularData === opt.id
                          ? 'border-red-500 bg-red-500/10 text-white'
                          : 'border-white/10 bg-[#181920] text-zinc-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">{opt.label}</span>
                        {cellularData === opt.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Streaming Video Quality */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-white font-bold block text-sm">Streaming Quality per Screen</label>
                <p className="text-zinc-400 text-xs">
                  Choose default resolution target for home Wi-Fi & PC streaming
                </p>
                <div className="space-y-2 pt-1">
                  {[
                    { id: 'high', label: 'High (4K Ultra HD)', desc: 'Best video quality. Uses up to 7 GB of data per hour.' },
                    { id: 'medium', label: 'Medium (Standard HD)', desc: 'Standard video quality. Uses up to 0.7 GB per hour.' },
                    { id: 'low', label: 'Low (Basic SD)', desc: 'Basic video quality. Uses up to 0.3 GB per hour.' }
                  ].map((q) => (
                    <div
                      key={q.id}
                      onClick={() => setVideoQuality(q.id as any)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        videoQuality === q.id
                          ? 'border-red-500/60 bg-red-950/20 text-white'
                          : 'border-white/5 bg-[#181920] text-zinc-300 hover:border-white/15'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white text-xs">{q.label}</div>
                        <div className="text-zinc-400 text-[11px] mt-0.5">{q.desc}</div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          videoQuality === q.id ? 'border-red-500 bg-red-600' : 'border-zinc-600'
                        }`}
                      >
                        {videoQuality === q.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181920] border border-white/5">
                  <div>
                    <span className="font-bold text-white block">Autoplay Next Episode</span>
                    <span className="text-zinc-400 text-[11px]">
                      Automatically queue and start the next episode in series
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoplayNext(!autoplayNext)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoplayNext ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        autoplayNext ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#181920] border border-white/5">
                  <div>
                    <span className="font-bold text-white block">Autoplay Previews while Browsing</span>
                    <span className="text-zinc-400 text-[11px]">
                      Play trailer clips automatically when hovering posters
                    </span>
                  </div>
                  <button
                    onClick={() => setAutoplayPreviews(!autoplayPreviews)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      autoplayPreviews ? 'bg-red-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        autoplayPreviews ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOWNLOADS */}
          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#181920] border border-white/5">
                <div>
                  <span className="font-bold text-white block">Wi-Fi Only Downloads</span>
                  <span className="text-zinc-400 text-[11px]">
                    Only download movies and episodes when connected to Wi-Fi
                  </span>
                </div>
                <button
                  onClick={() => setWifiOnlyDownloads(!wifiOnlyDownloads)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    wifiOnlyDownloads ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      wifiOnlyDownloads ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#181920] border border-white/5">
                <div>
                  <span className="font-bold text-white block">Smart Downloads</span>
                  <span className="text-zinc-400 text-[11px]">
                    Delete completed episodes and automatically download the next one
                  </span>
                </div>
                <button
                  onClick={() => setSmartDownloads(!smartDownloads)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    smartDownloads ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      smartDownloads ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Download Video Quality */}
              <div className="p-3.5 rounded-xl bg-[#181920] border border-white/5 space-y-2">
                <span className="font-bold text-white block">Download Video Quality</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDownloadQuality('standard')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      downloadQuality === 'standard'
                        ? 'border-red-500 bg-red-500/10 text-white font-bold'
                        : 'border-white/5 bg-[#121318] text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <span>Standard</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Faster downloads, less storage</p>
                  </button>
                  <button
                    onClick={() => setDownloadQuality('high')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      downloadQuality === 'high'
                        ? 'border-red-500 bg-red-500/10 text-white font-bold'
                        : 'border-white/5 bg-[#121318] text-zinc-400 hover:border-white/10'
                    }`}
                  >
                    <span>High (1080p Full HD)</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Best audio and visual clarity</p>
                  </button>
                </div>
              </div>

              {/* Storage Indicator */}
              <div className="p-3.5 rounded-xl bg-[#181920] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-bold">Internal Storage Usage</span>
                  <span className="text-zinc-400">14.8 GB of 256 GB used</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                  <div className="h-full bg-red-600 w-[12%]" title={`${platformName} Downloads`} />
                  <div className="h-full bg-zinc-600 w-[24%]" title="Other Apps" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>{platformName} Downloads (3.2 GB)</span>
                  </div>
                  <button className="text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Downloads</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIO & SUBTITLES */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#181920] border border-white/5 space-y-2">
                <label className="font-bold text-white block">Default Audio Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Turkish (Original)', 'English 5.1', 'Urdu Dubbed', 'Arabic'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setDefaultAudio(lang)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between ${
                        defaultAudio === lang
                          ? 'border-red-500 bg-red-500/10 text-white font-bold'
                          : 'border-white/5 bg-[#121318] text-zinc-400 hover:border-white/10'
                      }`}
                    >
                      <span>{lang}</span>
                      {defaultAudio === lang && <Check className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#181920] border border-white/5 space-y-2">
                <label className="font-bold text-white block">Default Subtitles</label>
                <div className="grid grid-cols-2 gap-2">
                  {['English [CC]', 'Turkish', 'Urdu', 'Off'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setDefaultSubtitle(sub)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between ${
                        defaultSubtitle === sub
                          ? 'border-red-500 bg-red-500/10 text-white font-bold'
                          : 'border-white/5 bg-[#121318] text-zinc-400 hover:border-white/10'
                      }`}
                    >
                      <span>{sub}</span>
                      {defaultSubtitle === sub && <Check className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subtitle Appearance Preview */}
              <div className="p-4 rounded-xl bg-[#181920] border border-white/5 space-y-2">
                <span className="font-bold text-white block">Subtitle Display Preview</span>
                <div className="relative aspect-[21/9] bg-zinc-950 rounded-lg overflow-hidden flex items-end justify-center p-4 border border-white/10">
                  <div className="text-center bg-black/60 px-4 py-1.5 rounded text-white font-medium text-xs drop-shadow-md">
                    “The truth is the sword of justice, Ertuğrul.”
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MY LIST & WATCH HISTORY */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {actionFeedback && (
                <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{actionFeedback}</span>
                </div>
              )}

              {/* Clear My List Card */}
              <div className="p-4 rounded-xl bg-[#181920] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white block text-sm">Clear My List</span>
                  <span className="text-zinc-400 text-xs">
                    Remove all saved movies and series from your personal watchlist
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (onClearWatchlist) {
                      onClearWatchlist();
                      setActionFeedback('My List has been cleared successfully.');
                      setTimeout(() => setActionFeedback(null), 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-red-600/20 hover:border-red-500/50 border border-zinc-700 text-zinc-200 hover:text-red-400 font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear My List</span>
                </button>
              </div>

              {/* Clear Watch History Card */}
              <div className="p-4 rounded-xl bg-[#181920] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white block text-sm">Clear Watch History</span>
                  <span className="text-zinc-400 text-xs">
                    Reset all playback progress, continue watching rows, and completed episode tracking
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (onClearWatchHistory) {
                      onClearWatchHistory();
                      setActionFeedback('Watch history has been cleared successfully.');
                      setTimeout(() => setActionFeedback(null), 3000);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-red-600/20 hover:border-red-500/50 border border-zinc-700 text-zinc-200 hover:text-red-400 font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear History</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DIAGNOSTICS & ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Network Speed Test */}
              <div className="p-4 rounded-xl bg-[#181920] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Check Network Connection</span>
                  <span className="text-zinc-400 text-[11px]">
                    Verify current bandwidth and Netflix CDN streaming stability
                  </span>
                  {networkStatus && (
                    <div className="mt-2 text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>{networkStatus}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleTestNetwork}
                  disabled={isTestingNetwork}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-2"
                >
                  <Wifi className="w-4 h-4" />
                  <span>{isTestingNetwork ? 'Testing...' : 'Test Now'}</span>
                </button>
              </div>

              {/* Software Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#181920] border border-white/5 text-zinc-300">
                  <span>App Version</span>
                  <span className="font-mono text-white">v5.14.2 (Production Stable)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#181920] border border-white/5 text-zinc-300">
                  <span>Device Architecture</span>
                  <span className="text-white">Web Browser (Chromium / WebKit 4K)</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#181920] border border-white/5 text-zinc-300">
                  <span>Widevine DRM Level</span>
                  <span className="text-white">L1 Hardware Security Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#111216] border-t border-white/10 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer transition-colors shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
    </>
  );
};
