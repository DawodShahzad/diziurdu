import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_STORAGE_KEY = 'diziurdu_pwa_popout_dismissed_at';
const DISMISS_COOLDOWN_MS = 1000 * 60 * 60 * 24 * 5; // 5 days cooldown after dismiss

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const mqStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const mqFullscreen = window.matchMedia?.('(display-mode: fullscreen)')?.matches;
  const iosStandalone = Boolean((window.navigator as any)?.standalone);
  return Boolean(mqStandalone || mqFullscreen || iosStandalone);
}

export function detectIsIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isWebKit = /WebKit/i.test(ua);
  const isNotCriOS = !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return Boolean(isIOS && isWebKit && isNotCriOS);
}

export interface PWAInstallState {
  isInstalled: boolean;
  canPromptInstall: boolean;
  isIOS: boolean;
  isPopoutOpen: boolean;
  isInstalling: boolean;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'ios_guide' | 'unavailable'>;
  openPopout: () => void;
  closePopout: (rememberDismiss?: boolean) => void;
}

export function usePWAInstall(options?: { suppressAutoPopout?: boolean }): PWAInstallState {
  const suppressAutoPopout = Boolean(options?.suppressAutoPopout);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => isRunningStandalone());
  const [isIOS] = useState<boolean>(() => detectIsIOSSafari());
  const [isPopoutOpen, setIsPopoutOpen] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Listen for beforeinstallprompt, appinstalled, and display-mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsPopoutOpen(false);
    };

    const mq = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setIsPopoutOpen(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mq?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mq?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  // Non-intrusive dwell timer: show custom popout after brief browsing if installable (or iOS Safari) and not recently dismissed
  useEffect(() => {
    if (isInstalled || suppressAutoPopout) return;
    if (!deferredPrompt && !isIOS) return;

    try {
      const dismissedRaw = localStorage.getItem(DISMISS_STORAGE_KEY);
      if (dismissedRaw) {
        const dismissedAt = Number(dismissedRaw);
        if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
          return;
        }
      }
    } catch {}

    const timer = window.setTimeout(() => {
      if (!isRunningStandalone()) {
        setIsPopoutOpen(true);
      }
    }, 6500);

    return () => window.clearTimeout(timer);
  }, [deferredPrompt, isIOS, isInstalled, suppressAutoPopout]);

  const closePopout = useCallback((rememberDismiss = true) => {
    setIsPopoutOpen(false);
    if (rememberDismiss) {
      try {
        localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
      } catch {}
    }
  }, []);

  const openPopout = useCallback(() => {
    if (isInstalled) return;
    setIsPopoutOpen(true);
  }, [isInstalled]);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios_guide' | 'unavailable'> => {
    if (isInstalled) return 'unavailable';

    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setIsPopoutOpen(false);
          return 'accepted';
        }
        closePopout(true);
        return 'dismissed';
      } catch {
        return 'unavailable';
      } finally {
        setIsInstalling(false);
      }
    }

    if (isIOS) {
      setIsPopoutOpen(true);
      return 'ios_guide';
    }

    // Fallback: open popout with manual browser install instructions
    setIsPopoutOpen(true);
    return 'unavailable';
  }, [deferredPrompt, isIOS, isInstalled, closePopout]);

  return {
    isInstalled,
    canPromptInstall: Boolean(deferredPrompt),
    isIOS,
    isPopoutOpen: isPopoutOpen && !isInstalled,
    isInstalling,
    promptInstall,
    openPopout,
    closePopout
  };
}
