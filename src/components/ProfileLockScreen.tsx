import React, { useState, useEffect, useRef } from 'react';
import { Delete, Check, AlertCircle, MoreVertical } from 'lucide-react';
import { DiziLogo } from './DiziLogo';

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
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [setupStep, setSetupStep] = useState<'create' | 'confirm'>('create');
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<boolean>(false);

  // Retrieve stored PIN
  const getStoredPin = (): string => {
    try {
      return localStorage.getItem('dizi_profile_lock_pin') || '';
    } catch {
      return '';
    }
  };

  const handleDigitPress = (digit: string) => {
    if (isSuccess) return;
    if (pin.length >= 4) return;
    setIsError(false);
    setErrorMessage('');
    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (isSettingUp) {
        if (setupStep === 'create') {
          // Move to confirm step
          setTimeout(() => {
            setConfirmPin(nextPin);
            setPin('');
            setSetupStep('confirm');
          }, 200);
        } else {
          // Confirm step
          if (nextPin === confirmPin) {
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
              setPin('');
              setConfirmPin('');
              setSetupStep('create');
              setIsError(false);
              setErrorMessage('');
            }, 900);
          }
        }
      } else {
        // Unlocking flow
        const expectedPin = getStoredPin();
        // If no PIN was stored, default to 1234 or auto unlock
        const validPin = expectedPin || '1234';
        if (nextPin === validPin) {
          setIsSuccess(true);
          setTimeout(() => {
            try {
              sessionStorage.setItem('dizi_profile_unlocked', 'true');
            } catch {}
            onUnlockSuccess();
          }, 300);
        } else {
          setIsError(true);
          setErrorMessage('Incorrect PIN. Please try again.');
          setTimeout(() => {
            setPin('');
            setIsError(false);
          }, 700);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isSuccess) return;
    setIsError(false);
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  };

  // Physical keyboard listener for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete();
      } else if (e.key === 'Escape') {
        setPin('');
        setIsError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, setupStep, confirmPin, isSettingUp]);

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
    <div className="fixed inset-0 z-[250] bg-[#0c0d12] text-white flex flex-col justify-between py-3.5 sm:py-6 px-5 sm:px-8 select-none overflow-hidden font-sans h-[100dvh] max-h-[100dvh]">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px] opacity-20"
          style={{ background: 'radial-gradient(circle, #e11d48 0%, #b45309 50%, transparent 80%)' }}
        />
      </div>

      {/* Top Header: Actual App Logo on top left and Three Dots on top right in parallel */}
      <header className="relative z-20 w-full max-w-md mx-auto flex items-center justify-between pt-1 shrink-0">
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
              className="absolute right-0 top-full mt-1.5 w-44 rounded-xl bg-[#1c1e24] border border-white/15 p-1.5 shadow-2xl z-30 text-left animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
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

      {/* Center Body: Profile Avatar (no border, no lock icon) + Title + 4 Indicator Dots */}
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center my-auto px-2">
        {/* Profile Avatar: NO BORDER and NO LOCK ICON per user instruction */}
        <div className="mb-2 sm:mb-3">
          <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-22 md:h-22 rounded-full overflow-hidden shadow-2xl bg-zinc-800">
            <img
              src={userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
              alt={userName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Name & Heading */}
        <h2 className="text-base sm:text-xl font-bold text-white tracking-tight">
          {isSettingUp
            ? setupStep === 'create'
              ? 'Choose 4-Digit PIN'
              : 'Confirm 4-Digit PIN'
            : userName || 'Profile Locked'}
        </h2>

        {/* 4 Input Dots Matching Reference */}
        <div className="flex items-center gap-3.5 sm:gap-4 my-3 sm:my-5">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full transition-all duration-200 ${
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
        ) : (
          <p className="text-[11px] text-zinc-500 font-medium hidden md:block">
            Use physical keyboard numbers 0–9
          </p>
        )}
      </div>

      {/* Bottom Area: Custom On-Screen Keypad for Mobile (Fully visible without vertical scrolling) */}
      <div className="relative z-10 w-full max-w-xs mx-auto md:hidden pb-1 shrink-0">
        <div className="grid grid-cols-3 gap-y-2 sm:gap-y-3 gap-x-4 sm:gap-x-6 justify-items-center">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitPress(digit)}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/20 active:scale-95 text-white text-xl sm:text-2xl font-bold flex items-center justify-center transition-all cursor-pointer border border-white/5 shadow-sm"
              aria-label={`Digit ${digit}`}
            >
              {digit}
            </button>
          ))}

          {/* Row 4: Empty space, 0, Backspace */}
          <div className="w-14 h-14 sm:w-16 sm:h-16" />

          <button
            type="button"
            onClick={() => handleDigitPress('0')}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/[0.04] hover:bg-white/[0.1] active:bg-white/20 active:scale-95 text-white text-xl sm:text-2xl font-bold flex items-center justify-center transition-all cursor-pointer border border-white/5 shadow-sm"
            aria-label="Digit 0"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full hover:bg-white/[0.08] active:bg-white/20 active:scale-90 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer text-lg sm:text-xl font-bold"
            aria-label="Delete last digit"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
          </button>
        </div>
      </div>

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
  );
};
