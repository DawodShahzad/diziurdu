import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Delete, Check, AlertCircle, MoreVertical, Fingerprint } from 'lucide-react';
import { DiziLogo } from './DiziLogo';
import { authenticateNativeFingerprint, isFingerprintUnlockEnabled } from '../utils/biometricUnlock';
import { useDeviceLayout } from '../utils/deviceLayout';

interface ProfileLockScreenProps {
  userAvatar: string;
  userName: string;
  platformName?: string;
  customLogoUrl?: string;
  onUnlockSuccess: () => void;
  onResetLock?: () => void;
  isSettingUp?: boolean;
  onPinConfigured?: (newPin: string) => void;
  onCancelSetup?: () => void;
}

export const ProfileLockScreen: React.FC<ProfileLockScreenProps> = ({
  userAvatar,
  userName,
  platformName = 'Dizi Urdu',
  customLogoUrl,
  onUnlockSuccess,
  onResetLock,
  isSettingUp = false,
  onPinConfigured,
  onCancelSetup
}) => {
  const { isMobile: isMobileDeviceLayout, height: viewportHeight } = useDeviceLayout();
  const isCompactLandscape = isMobileDeviceLayout && viewportHeight <= 520;

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const pinRef = useRef<string>('');
  const confirmPinRef = useRef<string>('');
  const setupStepRef = useRef<'create' | 'confirm'>('create');

  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const isSuccessRef = useRef<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);
  const [showDesktopKeypad, setShowDesktopKeypad] = useState<boolean>(false);
  const [isUnlockGliding, setIsUnlockGliding] = useState<boolean>(false);
  const [glideMetrics, setGlideMetrics] = useState<{
    startLeft: number;
    startTop: number;
    startWidth: number;
    startHeight: number;
    dx: number;
    dy: number;
    targetScale: number;
    active: boolean;
  } | null>(null);
  const avatarBoxRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState<boolean>(() => isFingerprintUnlockEnabled());
  const [isBiometricBusy, setIsBiometricBusy] = useState<boolean>(false);

  useEffect(() => {
    setIsFingerprintEnabled(isFingerprintUnlockEnabled());
  }, [isSettingUp]);

  const playKeyTapSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.018);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.022);
    } catch {
      // Ignore audio errors on restricted devices
    }
  }, []);

  // Retrieve stored PIN
  const getStoredPin = (): string => {
    try {
      return localStorage.getItem('dizi_profile_lock_pin') || '';
    } catch {
      return '';
    }
  };

  // Shared Unlock Success Sequence: identical green checkmark/Unlocked! message & gliding avatar animation
  const triggerUnlockSuccessSequence = useCallback(() => {
    setIsError(false);
    setErrorMessage('');
    isSuccessRef.current = true;
    setIsSuccess(true);
    const avatarEl = avatarBoxRef.current;
    const targetEl = isMobileDeviceLayout
      ? (document.querySelector('[data-mobile-nav-avatar="true"]') as HTMLElement | null)
      : (document.querySelector('[data-desktop-nav-avatar="true"]') as HTMLElement | null);

    if (avatarEl && targetEl) {
      const startRect = avatarEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const dx = targetRect.left + targetRect.width / 2 - (startRect.left + startRect.width / 2);
      const dy = targetRect.top + targetRect.height / 2 - (startRect.top + startRect.height / 2);
      const targetScale = startRect.width > 0 ? targetRect.width / startRect.width : 0.36;

      setGlideMetrics({
        startLeft: startRect.left,
        startTop: startRect.top,
        startWidth: startRect.width,
        startHeight: startRect.height,
        dx,
        dy,
        targetScale,
        active: false
      });
      setIsUnlockGliding(true);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGlideMetrics((prev) => (prev ? { ...prev, active: true } : prev));
        });
      });

      setTimeout(() => {
        try {
          sessionStorage.setItem('dizi_profile_unlocked', 'true');
        } catch {}
        onUnlockSuccess();
      }, 760);
    } else {
      setIsUnlockGliding(true);
      setTimeout(() => {
        try {
          sessionStorage.setItem('dizi_profile_unlocked', 'true');
        } catch {}
        onUnlockSuccess();
      }, 480);
    }
  }, [isMobileDeviceLayout, onUnlockSuccess]);

  const handleFingerprintUnlock = async () => {
    if (isSettingUp || isSuccessRef.current || isBiometricBusy) return;
    setIsError(false);
    setErrorMessage('');
    setIsBiometricBusy(true);
    try {
      const result = await authenticateNativeFingerprint();
      if (result.ok) {
        triggerUnlockSuccessSequence();
      } else if (result.message) {
        setIsError(true);
        setErrorMessage(result.message);
      }
    } finally {
      setIsBiometricBusy(false);
    }
  };

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (isSuccessRef.current) return;
      if (pinRef.current.length >= 4) return;
      setIsError(false);
      setErrorMessage('');
      const nextPin = pinRef.current + digit;
      pinRef.current = nextPin;
      setPin(nextPin);

      if (nextPin.length === 4) {
        if (isSettingUp) {
          if (setupStepRef.current === 'create') {
            setTimeout(() => {
              confirmPinRef.current = nextPin;
              setConfirmPin(nextPin);
              pinRef.current = '';
              setPin('');
              setupStepRef.current = 'confirm';
              setSetupStep('confirm');
            }, 180);
          } else {
            if (nextPin === confirmPinRef.current) {
              isSuccessRef.current = true;
              setIsSuccess(true);
              setTimeout(() => {
                try {
                  localStorage.setItem('dizi_profile_lock_pin', nextPin);
                  localStorage.setItem('dizi_profile_lock_enabled', 'true');
                  sessionStorage.setItem('dizi_profile_unlocked', 'true');
                } catch {}
                onPinConfigured?.(nextPin);
              }, 350);
            } else {
              setIsError(true);
              setErrorMessage('PINs do not match. Try again.');
              setTimeout(() => {
                pinRef.current = '';
                confirmPinRef.current = '';
                setupStepRef.current = 'create';
                setPin('');
                setConfirmPin('');
                setSetupStep('create');
                setIsError(false);
                setErrorMessage('');
              }, 900);
            }
          }
        } else {
          const expectedPin = getStoredPin();
          const validPin = expectedPin || '1234';
          if (nextPin === validPin) {
            triggerUnlockSuccessSequence();
          } else {
            setIsError(true);
            setErrorMessage('Incorrect PIN. Please try again.');
            setTimeout(() => {
              pinRef.current = '';
              setPin('');
              setIsError(false);
            }, 700);
          }
        }
      }
    },
    [isSettingUp, onPinConfigured, triggerUnlockSuccessSequence]
  );

  const handleDelete = useCallback(() => {
    if (isSuccessRef.current) return;
    setIsError(false);
    setErrorMessage('');
    const nextPin = pinRef.current.slice(0, -1);
    pinRef.current = nextPin;
    setPin(nextPin);
  }, []);

  // Physical keyboard listener for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        playKeyTapSound();
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        playKeyTapSound();
        handleDelete();
      } else if (e.key === 'Escape') {
        pinRef.current = '';
        setPin('');
        setIsError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, handleDelete, playKeyTapSound]);

  const handleResetLock = () => {
    try {
      localStorage.removeItem('dizi_profile_lock_pin');
      localStorage.setItem('dizi_profile_lock_enabled', 'false');
      sessionStorage.setItem('dizi_profile_unlocked', 'true');
    } catch {}
    setShowResetConfirm(false);
    onResetLock?.();
    onUnlockSuccess();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[250] ${
          isMobileDeviceLayout ? 'bg-black' : 'bg-[#0c0d12]'
        } text-white flex flex-col justify-between pt-3.5 sm:pt-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 px-4 sm:px-8 select-none overflow-y-auto overflow-x-hidden font-sans h-[100dvh] max-h-[100dvh] transition-opacity duration-500 ease-out ${
          isUnlockGliding ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {/* Ambient background glow (visible on both mobile and desktop) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-36 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[130px] md:blur-[140px] opacity-25 md:opacity-20"
            style={{ background: 'radial-gradient(circle, #e11d48 0%, #b45309 50%, transparent 80%)' }}
          />
        </div>

        {/* Top Header: Actual App Logo on top left and Three Dots on top right in parallel */}
        <header
          className={`relative z-20 w-full max-w-3xl mx-auto flex items-center justify-between pt-1 shrink-0 transition-opacity duration-300 ${
            isUnlockGliding ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <DiziLogo
              variant="red"
              size="sm"
              customLogoUrl={customLogoUrl}
              className="h-6 w-auto object-contain cursor-default"
            />
          </div>

          {/* In parallel: three dots menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-1.5 -mr-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              aria-label="Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Three dots dropdown */}
            {showOptionsMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-52 rounded-xl bg-[#1c1e24] border border-white/15 p-1.5 shadow-2xl z-30 text-left animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                {!isMobileDeviceLayout && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowDesktopKeypad((prev) => !prev);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {showDesktopKeypad ? 'Hide On-Screen Keyboard' : 'Show On-Screen Keyboard'}
                  </button>
                )}
                {!isSettingUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowResetConfirm(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Forgot PIN / Reset
                  </button>
                )}
                {isSettingUp && onCancelSetup && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onCancelSetup();
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancel Setup
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Center Body + Optional Desktop Side-by-Side Keypad / Mobile Bottom Keypad */}
        <div
          className={`relative z-10 w-full mx-auto flex ${
            isCompactLandscape
              ? 'flex-row gap-6 max-w-xl items-center justify-center'
              : !isMobileDeviceLayout && showDesktopKeypad
              ? 'flex-row max-w-3xl gap-12 items-center justify-center'
              : 'flex-col max-w-md items-center justify-center'
          } my-auto flex-1 min-h-0`}
        >
          <div className="w-full max-w-xs flex flex-col items-center text-center my-auto px-2">
            {/* Profile Avatar: NO BORDER and NO LOCK ICON per user instruction */}
            <div className={isCompactLandscape ? 'mb-1.5' : 'mb-2 sm:mb-3'}>
              <div
                ref={avatarBoxRef}
                className={`${
                  isCompactLandscape
                    ? 'w-14 h-14'
                    : 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28'
                } rounded-full overflow-hidden shadow-2xl bg-zinc-800 transition-opacity duration-150 ${
                  glideMetrics ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <img
                  src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt={userName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Profile Name & Heading */}
            <h2
              className={`text-base sm:text-xl font-bold text-white tracking-tight transition-opacity duration-300 ${
                isUnlockGliding ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {isSettingUp
                ? setupStep === 'create'
                  ? 'Choose 4-Digit PIN'
                  : 'Confirm 4-Digit PIN'
                : userName || 'Profile Locked'}
            </h2>

            {/* 4 Input Dots Matching Reference */}
            <div
              className={`flex items-center gap-3.5 sm:gap-4 ${
                isCompactLandscape ? 'my-2.5' : 'my-3 sm:my-5'
              } transition-opacity duration-300 ${isUnlockGliding ? 'opacity-0' : 'opacity-100'}`}
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = idx < pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-150 ${
                      isError
                        ? 'bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.9)] scale-110'
                        : isSuccess
                        ? 'bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)] scale-110'
                        : isFilled
                        ? 'bg-white shadow-[0_0_12px_rgba(255,255,255,0.85)] scale-110'
                        : 'bg-zinc-800 border-2 border-zinc-600'
                    }`}
                  />
                );
              })}
            </div>

            {/* Status / Error Message */}
            {errorMessage ? (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-red-400 font-semibold animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            ) : isSuccess ? (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                <span>{isSettingUp ? 'PIN Set!' : 'Unlocked!'}</span>
              </div>
            ) : null}
          </div>

          {/* Custom On-Screen Keypad: shown on Mobile (portrait & landscape) and on Desktop when toggled */}
          {(isMobileDeviceLayout || showDesktopKeypad) && (
            <div
              className={`relative z-10 w-full max-w-[272px] px-2 mx-auto shrink-0 transition-all duration-300 ${
                isUnlockGliding ? 'opacity-0 translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
              }`}
            >
              <div
                className={`grid grid-cols-3 ${
                  isCompactLandscape ? 'gap-2.5' : 'gap-3.5 sm:gap-5'
                } justify-items-center`}
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      playKeyTapSound();
                      handleDigitPress(digit);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        playKeyTapSound();
                        handleDigitPress(digit);
                      }
                    }}
                    className={`${
                      isCompactLandscape ? 'w-[52px] h-[52px] text-xl' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px] text-2xl sm:text-[26px]'
                    } rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/20 active:scale-95 text-white font-bold flex items-center justify-center transition-transform duration-75 cursor-pointer border border-white/5 shadow-sm touch-manipulation`}
                    aria-label={`Digit ${digit}`}
                  >
                    {digit}
                  </button>
                ))}

                {/* Row 4: Fingerprint Unlock (bottom-left on mobile when enabled, Lucide icon), 0, Backspace */}
                {isMobileDeviceLayout ? (
                  !isSettingUp && isFingerprintEnabled ? (
                    <button
                      type="button"
                      onClick={handleFingerprintUnlock}
                      disabled={isBiometricBusy}
                      className={`${
                        isCompactLandscape ? 'w-[52px] h-[52px]' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]'
                      } bg-transparent border-0 shadow-none rounded-full flex items-center justify-center active:scale-90 transition-transform cursor-pointer focus:outline-none disabled:opacity-60 touch-manipulation`}
                      aria-label="Unlock with Fingerprint"
                    >
                      <Fingerprint className="w-8 h-8 text-[#ff2e55] stroke-[1.75]" />
                    </button>
                  ) : (
                    <div className={isCompactLandscape ? 'w-[52px] h-[52px]' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]'} />
                  )
                ) : (
                  <div className={isCompactLandscape ? 'w-[52px] h-[52px]' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]'} />
                )}

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    playKeyTapSound();
                    handleDigitPress('0');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      playKeyTapSound();
                      handleDigitPress('0');
                    }
                  }}
                  className={`${
                    isCompactLandscape ? 'w-[52px] h-[52px] text-xl' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px] text-2xl sm:text-[26px]'
                  } rounded-full bg-white/[0.06] hover:bg-white/[0.12] active:bg-white/20 active:scale-95 text-white font-bold flex items-center justify-center transition-transform duration-75 cursor-pointer border border-white/5 shadow-sm touch-manipulation`}
                  aria-label="Digit 0"
                >
                  0
                </button>

                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault();
                    playKeyTapSound();
                    handleDelete();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      playKeyTapSound();
                      handleDelete();
                    }
                  }}
                  className={`${
                    isCompactLandscape ? 'w-[52px] h-[52px]' : 'w-[62px] h-[62px] sm:w-[70px] sm:h-[70px]'
                  } rounded-full hover:bg-white/[0.08] active:bg-white/20 active:scale-90 text-zinc-300 hover:text-white flex items-center justify-center transition-transform duration-75 cursor-pointer text-xl font-bold touch-manipulation`}
                  aria-label="Delete last digit"
                >
                  <Delete className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom spacer on desktop so header+center align cleanly */}
        {!isMobileDeviceLayout && <div className="h-2 shrink-0" />}

      {/* Forgot PIN Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161922] border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-white">Reset Profile Lock?</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              If you forgot your 4-digit PIN, you can reset the profile lock and continue accessing your profile.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetLock}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Reset & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Gliding Avatar Overlay Portal: Reverse-parabola arc flight into navbar avatar slot on unlock */}
      {glideMetrics && (
        <div
          style={{
            position: 'fixed',
            left: glideMetrics.startLeft,
            top: glideMetrics.startTop,
            width: glideMetrics.startWidth,
            height: glideMetrics.startHeight,
            zIndex: 320,
            pointerEvents: 'none',
            transform: glideMetrics.active
              ? `translate3d(${glideMetrics.dx}px, 0, 0)`
              : 'translate3d(0, 0, 0)',
            transition: 'transform 760ms cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }}
        >
          <div
            className={glideMetrics.active ? 'w-full h-full pin-avatar-parabola-y' : 'w-full h-full'}
            style={
              {
                '--arc-dy': `${glideMetrics.dy}px`,
                '--arc-peak': glideMetrics.dy >= 0 ? '-46px' : '28px',
                '--arc-out-x': glideMetrics.dx >= 0 ? '-26px' : '26px'
              } as React.CSSProperties
            }
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '9999px',
                overflow: 'hidden',
                boxShadow: '0 14px 36px rgba(0,0,0,0.75)',
                transform: glideMetrics.active
                  ? `scale(${glideMetrics.targetScale})`
                  : 'scale(1)',
                transition: 'transform 760ms cubic-bezier(0.22, 1, 0.36, 1)'
              }}
            >
              <img
                src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                alt={userName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
