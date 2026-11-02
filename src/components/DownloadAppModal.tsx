import React, { useState } from 'react';
import { X, Download, Monitor, Laptop, Tv, Smartphone, Check, Sparkles } from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformName?: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  platformName = 'Dizi Urdu'
}) => {
  if (!isOpen) return null;

  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);

  const startDownload = (platform: string) => {
    setDownloadingPlatform(platform);
    setDownloadProgress(0);
    setDownloadComplete(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= 100) {
        setDownloadProgress(100);
        setDownloadComplete(true);
        clearInterval(interval);
      } else {
        setDownloadProgress(current);
      }
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#12131c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 md:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center mx-auto mb-3 shadow-xl">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-display">
            Download {platformName} for PC & TV
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Stream in native 4K Ultra HD, studio-grade audio, and offline downloads with
            hardware-accelerated PC playback.
          </p>
        </div>

        {/* Download Platforms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Windows PC */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Windows PC Desktop</h4>
                <p className="text-xs text-zinc-400">Windows 10 / 11 (64-bit)</p>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  v3.8.4 · 86 MB (Direct Installer)
                </span>
              </div>
            </div>

            <button
              onClick={() => startDownload('Windows')}
              disabled={downloadingPlatform === 'Windows' && !downloadComplete}
              className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .exe
            </button>
          </div>

          {/* macOS */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">macOS (Apple Silicon & Intel)</h4>
                <p className="text-xs text-zinc-400">macOS 12 Monterey or newer</p>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Universal Binary · 92 MB
                </span>
              </div>
            </div>

            <button
              onClick={() => startDownload('macOS')}
              disabled={downloadingPlatform === 'macOS' && !downloadComplete}
              className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .dmg
            </button>
          </div>

          {/* Android TV */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
                <Tv className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Android TV & Google TV</h4>
                <p className="text-xs text-zinc-400">Sony, TCL, Xiaomi, Shield TV</p>
                <span className="text-[10px] text-emerald-400 font-semibold">APK & TV Store</span>
              </div>
            </div>

            <button
              onClick={() => startDownload('Android TV')}
              className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download TV APK
            </button>
          </div>

          {/* Mobile APK */}
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-600/60 transition-all flex flex-col justify-between group">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Mobile Companion App</h4>
                <p className="text-xs text-zinc-400">iOS TestFlight & Android APK</p>
                <span className="text-[10px] text-amber-400 font-semibold">Remote Control Mode</span>
              </div>
            </div>

            <button
              onClick={() => startDownload('Mobile')}
              className="mt-4 w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Get Companion App
            </button>
          </div>
        </div>

        {/* Download Progress Bar Feedback */}
        {downloadingPlatform && (
          <div className="p-4 bg-zinc-900/90 rounded-xl border border-zinc-800 text-center animate-in fade-in">
            {!downloadComplete ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Downloading {platformName} for {downloadingPlatform}...</span>
                  <span className="font-mono text-white font-bold">{downloadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all duration-200 rounded-full"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                <Check className="w-4 h-4" />
                <span>
                  Downloaded {platformName}_{downloadingPlatform}_Setup.exe successfully! Run file to install.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
