import React from 'react';
import { Download, X, Share, PlusSquare, Smartphone, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface PWAInstallPopoutProps {
  isOpen: boolean;
  isIOS: boolean;
  canPromptInstall: boolean;
  isInstalling: boolean;
  platformName?: string;
  onInstall: () => void;
  onClose: () => void;
}

/**
 * Custom-designed Cinema-Dark Install App popout.
 * - Mobile: Ergonomic bottom sheet respecting safe-area insets and 48px primary CTA.
 * - Desktop: Compact bottom-right floating glass card.
 * - Automatically displays a 2-step visual guide on iOS Safari where beforeinstallprompt is unavailable.
 */
export const PWAInstallPopout: React.FC<PWAInstallPopoutProps> = ({
  isOpen,
  isIOS,
  canPromptInstall,
  isInstalling,
  platformName = 'Dizi Urdu',
  onInstall,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`Install ${platformName} App`}
      className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[260] px-3 sm:px-0 pb-[max(env(safe-area-inset-bottom),12px)] sm:pb-0 pointer-events-none select-none animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div className="pointer-events-auto relative w-full sm:w-[376px] mx-auto sm:mx-0 rounded-2xl bg-[#14151a]/95 backdrop-blur-xl border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Top subtle crimson sheen */}
        <div
          className="pointer-events-none absolute -top-16 -right-12 w-48 h-48 rounded-full blur-3xl opacity-25"
          style={{
            background: 'radial-gradient(circle, rgba(229, 9, 20, 0.9) 0%, transparent 72%)'
          }}
        />

        {/* Mobile drag affordance */}
        <div className="sm:hidden w-10 h-1 rounded-full bg-white/15 mx-auto mt-2.5" />

        <div className="relative p-4 sm:p-5">
          {/* Header Row: Static App Icon + Title + Close */}
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-[#09090b] border border-white/10 p-1.5 flex items-center justify-center shrink-0 shadow-lg">
              <img
                src="/pwa-192x192.png"
                alt={platformName}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-display font-bold text-white tracking-tight truncate">
                  Install {platformName}
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                Fullscreen cinema mode, instant launch, and quick home screen shortcuts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              aria-label="Dismiss install prompt"
              className="absolute top-3 right-3 min-w-[44px] min-h-[44px] -mt-1.5 -mr-1.5 flex items-center justify-center text-zinc-400 hover:text-white active:scale-90 transition-all cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center">
                <X className="w-4 h-4" />
              </span>
            </button>
          </div>

          {/* Body: Either Native Install CTA or iOS/Manual Guided Steps */}
          {canPromptInstall ? (
            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                disabled={isInstalling}
                onClick={() => {
                  triggerHaptic(10);
                  onInstall();
                }}
                className="flex-1 min-h-[46px] px-4 rounded-xl bg-[#e50914] hover:bg-[#c80812] active:scale-[0.98] disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_8px_24px_rgba(229,9,20,0.35)] cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.4]" />
                <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onClose();
                }}
                className="min-h-[46px] px-4 rounded-xl bg-white/8 hover:bg-white/14 active:scale-[0.98] text-zinc-300 hover:text-white font-medium text-xs transition-all cursor-pointer"
              >
                Not now
              </button>
            </div>
          ) : isIOS ? (
            <div className="mt-4 space-y-2.5">
              <div className="rounded-xl bg-[#09090b]/85 border border-white/8 p-3 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-[11px]">
                    1
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Tap the <Share className="w-3.5 h-3.5 text-[#3ea6ff] inline" /> <strong className="text-white">Share</strong> button in Safari
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-200">
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-white font-bold text-[11px]">
                    2
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Select <PlusSquare className="w-3.5 h-3.5 text-white inline" /> <strong className="text-white">Add to Home Screen</strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onClose();
                }}
                className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/16 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-2.5">
              <div className="rounded-xl bg-[#09090b]/85 border border-white/8 p-3 flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                <Smartphone className="w-4 h-4 text-[#e50914] shrink-0 mt-0.5" />
                <span>
                  Open your browser menu (<strong className="text-white">⋮</strong> or address bar icon) and tap{' '}
                  <strong className="text-white">Install app</strong> or <strong className="text-white">Add to Home Screen</strong>.
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic(10);
                  onClose();
                }}
                className="w-full min-h-[44px] rounded-xl bg-white/10 hover:bg-white/16 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Okay, close</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
