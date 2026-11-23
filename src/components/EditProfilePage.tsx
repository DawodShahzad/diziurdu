import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Mail,
  Phone,
  Lock,
  Check,
  X,
  Shield,
  AlertCircle,
  Fingerprint
} from 'lucide-react';
import { DiziLogo } from './DiziLogo';
import { ProfileLockScreen } from './ProfileLockScreen';
import {
  isFingerprintUnlockEnabled,
  registerNativeFingerprint,
  setFingerprintUnlockEnabled
} from '../utils/biometricUnlock';
import { Show } from '../types';
import fullBackupData from '../full_backup.json';

const INITIAL_PROFILE_PICTURE_GROUPS = ((fullBackupData as any)?.profilePictureGroups) || [];

interface EditProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  userAvatar: string;
  userName: string;
  userHandle: string;
  userEmail: string;
  userWhatsapp: string;
  userPassword?: string;
  platformName?: string;
  shows?: Show[];
  onSaveProfile: (updated: {
    avatar: string;
    name: string;
    handle: string;
    email: string;
    whatsapp: string;
    password?: string;
  }) => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({
  isOpen,
  onClose,
  userAvatar,
  userName,
  userHandle,
  userEmail,
  userWhatsapp,
  userPassword,
  platformName = 'Dizi Urdu',
  shows = [],
  onSaveProfile
}) => {
  const [view, setView] = useState<'edit' | 'choose-icon'>('edit');
  const [avatar, setAvatar] = useState<string>(userAvatar);
  const [name, setName] = useState<string>(userName || '');
  const [handle, setHandle] = useState<string>(userHandle || '');
  const [email, setEmail] = useState<string>(userEmail || '');
  const [whatsapp, setWhatsapp] = useState<string>(userWhatsapp || '');
  const [password, setPassword] = useState<string>(userPassword || '');

  // Keep local form synchronized when modal opens
  useEffect(() => {
    if (isOpen) {
      setAvatar(userAvatar);
      setName(userName || '');
      setHandle(userHandle || '');
      setEmail(userEmail || '');
      setWhatsapp(userWhatsapp || '');
      setPassword(userPassword || '');
      setView('edit');
    }
  }, [isOpen, userAvatar, userName, userHandle, userEmail, userWhatsapp, userPassword]);

  // Profile Lock State
  const [isProfileLockEnabled, setIsProfileLockEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dizi_profile_lock_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState<boolean>(() => isFingerprintUnlockEnabled());
  const [isBiometricSetupBusy, setIsBiometricSetupBusy] = useState<boolean>(false);
  const [isPinSetupModalOpen, setIsPinSetupModalOpen] = useState<boolean>(false);
  const [isPinDisablePromptOpen, setIsPinDisablePromptOpen] = useState<boolean>(false);
  const [disablePinInput, setDisablePinInput] = useState<string>('');
  const [disablePinError, setDisablePinError] = useState<string>('');

  // Prevent double scrollbars: lock body and html scroll when profile page is open
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  const [adminGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_profile_picture_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROFILE_PICTURE_GROUPS || [];
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenChooseIcon = () => {
    setView('choose-icon');
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleSelectIcon = (iconUrl: string) => {
    setAvatar(iconUrl);
    try {
      localStorage.setItem('cineflix_user_avatar', iconUrl);
    } catch {}
    onSaveProfile({
      avatar: iconUrl,
      name: name.trim(),
      handle: handle.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      password: password
    });
    setSaveToast('Profile avatar updated');
    setTimeout(() => setSaveToast(null), 2200);
    setView('edit');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      avatar,
      name: name.trim(),
      handle: handle.trim(),
      email: email.trim(),
      whatsapp: whatsapp.trim(),
      password: password
    });
    onClose();
  };

  // Resolve a show's PNG title logo for avatar collections linked to a title
  const resolveGroupLogoUrl = (group: any): string | null => {
    if (group.logoUrl && typeof group.logoUrl === 'string' && group.logoUrl.trim()) {
      return group.logoUrl.trim();
    }
    const groupShowId = (group.showId || '').toString().trim();
    const groupTitleNorm = (group.showTitle || group.title || '').toString().trim().toLowerCase();
    const matchedShow = shows.find((s) => {
      if (groupShowId && s.id === groupShowId) return true;
      if (!groupTitleNorm) return false;
      return (
        s.title.trim().toLowerCase() === groupTitleNorm ||
        (s.turkishTitle && s.turkishTitle.trim().toLowerCase() === groupTitleNorm)
      );
    });
    if (matchedShow && (matchedShow.titleLogoUrl || matchedShow.centralLogoUrl)) {
      return matchedShow.titleLogoUrl || matchedShow.centralLogoUrl || null;
    }
    return null;
  };

  const visibleGroups = adminGroups.filter(
    (group) => group && group.enabled !== false && !group.isHidden && Array.isArray(group.images) && group.images.length > 0
  );

  // =========================================================================
  // VIEW 1: SELECT AVATAR (Matching Reference: #060911 dark canvas, "Select Avatar" + X,
  // left column Show PNG Logo or Section Title, right column circular avatars grid,
  // dull hover effect with ZERO zoom, instant click-to-select returning to Edit Profile)
  // =========================================================================
  if (view === 'choose-icon') {
    return (
      <div
        ref={scrollContainerRef}
        className="fixed inset-0 z-[100] bg-[#060911] text-white min-h-screen overflow-y-auto flex flex-col font-sans select-none animate-in fade-in duration-150"
      >
        <div className="w-full max-w-[1320px] mx-auto px-6 sm:px-10 lg:px-14 pt-8 pb-20">
          {/* Header Row: "Select Avatar" left + minimalist X close right */}
          <div className="flex items-center justify-between mb-12 sm:mb-14">
            <h1 className="text-[28px] sm:text-[34px] font-medium text-white tracking-tight leading-none">
              Select Avatar
            </h1>
            <button
              type="button"
              onClick={() => setView('edit')}
              className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close avatar picker"
            >
              <X className="w-6 h-6 stroke-[1.75]" />
            </button>
          </div>

          {/* Two-Column Avatar Collection Rows */}
          <div className="space-y-14 sm:space-y-16">
            {visibleGroups.map((group) => {
              const logoUrl = resolveGroupLogoUrl(group);
              const label = group.title || group.showTitle || 'Specials';
              return (
                <div
                  key={group.id}
                  className="flex flex-col md:flex-row md:items-start gap-6 md:gap-10"
                >
                  {/* Left Column: Show PNG Logo OR Clean Section Title */}
                  <div className="w-full md:w-[210px] lg:w-[240px] shrink-0 flex items-center md:min-h-[120px]">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={label}
                        referrerPolicy="no-referrer"
                        className="max-h-[76px] max-w-[195px] w-auto object-contain object-left"
                      />
                    ) : (
                      <h2 className="text-2xl sm:text-[30px] font-medium text-white tracking-tight leading-tight">
                        {label}
                      </h2>
                    )}
                  </div>

                  {/* Right Column: Circular Avatars Grid (slightly dull on hover, zero zoom) */}
                  <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-5 sm:gap-6">
                    {group.images.map((imgUrl: string, idx: number) => {
                      const isSelected = avatar === imgUrl;
                      return (
                        <button
                          key={`${group.id}-${idx}`}
                          type="button"
                          onClick={() => handleSelectIcon(imgUrl)}
                          className={`group relative w-full aspect-square rounded-full overflow-hidden bg-[#10141f] cursor-pointer focus:outline-none ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#060911]' : ''
                          }`}
                          aria-label={`Select ${label} avatar ${idx + 1}`}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-[filter,opacity] duration-150 group-hover:brightness-[0.72]"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DESKTOP EDIT PROFILE (Clean structured layout keeping strictly existing options)
  // =========================================================================
  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-[100] bg-[#0a0c12] text-white min-h-screen overflow-y-auto flex flex-col font-sans select-none animate-in fade-in duration-150"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0a0c12]/90 backdrop-blur-md border-b border-white/[0.08] px-6 sm:px-10 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer flex items-center gap-2"
          aria-label="Return to browsing"
        >
          <DiziLogo variant="red" size="md" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          aria-label="Close Edit Profile"
        >
          <X className="w-5.5 h-5.5 stroke-[2]" />
        </button>
      </header>

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1a1d26] border border-white/15 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Centered Edit Profile Content */}
      <main className="flex-1 w-full max-w-[820px] mx-auto px-5 sm:px-8 py-8 sm:py-10">
        <form onSubmit={handleSave} className="w-full space-y-8">
          {/* Page Header + Primary Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
            <h1 className="text-2xl sm:text-[32px] font-semibold text-white tracking-tight">
              Edit Profile
            </h1>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-white/15 hover:border-white/40 text-zinc-300 hover:text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black text-sm font-bold tracking-tight transition-colors shadow-md cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Section 1: Centered Circular Avatar + Profile Name & Handle */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-7 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
            {/* Circular Avatar with Pencil Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={handleOpenChooseIcon}
                className="group relative w-28 h-28 rounded-full overflow-hidden bg-zinc-900 border-2 border-white/15 cursor-pointer block focus:outline-none"
                title="Select Avatar"
                aria-label="Select Avatar"
              >
                <img
                  src={avatar}
                  alt="Profile Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-[filter] duration-150 group-hover:brightness-75"
                />
              </button>
              <button
                type="button"
                onClick={handleOpenChooseIcon}
                className="absolute bottom-0.5 right-0.5 w-9 h-9 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                aria-label="Change avatar"
              >
                <Pencil className="w-4 h-4 stroke-[2.4]" />
              </button>
            </div>

            {/* Name & Handle Inputs */}
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 block">Profile Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter profile name"
                  className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] focus:border-white/40 px-4 py-3 text-sm font-medium text-white placeholder-zinc-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 block">Profile Handle</label>
                <div className="flex items-center rounded-xl bg-white/[0.05] border border-white/[0.1] focus-within:border-white/40 px-4 py-3 transition-colors">
                  <span className="text-sm font-bold text-zinc-400 mr-1.5 select-none">@</span>
                  <input
                    type="text"
                    value={handle.replace(/^@/, '')}
                    onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                    placeholder="username"
                    className="w-full text-sm font-medium text-white placeholder-zinc-500 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Contact & Password */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Account Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 block">Email</label>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] focus-within:border-white/40 px-3.5 py-3 transition-colors">
                  <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full text-sm font-medium text-white placeholder-zinc-500 bg-transparent outline-none truncate"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 block">WhatsApp</label>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] focus-within:border-white/40 px-3.5 py-3 transition-colors">
                  <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-sm font-medium text-white placeholder-zinc-500 bg-transparent outline-none truncate"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 block">Account Password</label>
                <div className="flex items-center gap-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] focus-within:border-white/40 px-3.5 py-3 transition-colors">
                  <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full text-sm font-medium text-white placeholder-zinc-500 bg-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Profile Security (Profile Lock PIN & Fingerprint Unlock) */}
          <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl divide-y divide-white/[0.07]">
            {/* Profile Lock (4-Digit PIN) */}
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Profile Lock (4-Digit PIN)</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isProfileLockEnabled
                        ? `PIN protection is enabled on ${platformName}`
                        : 'Require a 4-digit PIN to unlock on startup'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isProfileLockEnabled) {
                      setDisablePinInput('');
                      setDisablePinError('');
                      setIsPinDisablePromptOpen(true);
                    } else {
                      setIsPinSetupModalOpen(true);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isProfileLockEnabled ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={isProfileLockEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isProfileLockEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isProfileLockEnabled && (
                <div className="pt-2.5 flex items-center justify-between">
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>4-Digit PIN Active</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPinSetupModalOpen(true)}
                    className="text-xs text-zinc-300 hover:text-white font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Change PIN Code
                  </button>
                </div>
              )}
            </div>

            {/* Fingerprint Unlock */}
            <div className="p-6 space-y-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-white/[0.07] flex items-center justify-center shrink-0">
                    <Fingerprint className="w-5 h-5 text-[#ff2e55]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Fingerprint Unlock</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {isFingerprintEnabled
                        ? 'Native mobile fingerprint unlock is enabled'
                        : 'Unlock profile with your mobile fingerprint sensor'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBiometricSetupBusy}
                  onClick={async () => {
                    if (isFingerprintEnabled) {
                      setFingerprintUnlockEnabled(false);
                      setIsFingerprintEnabled(false);
                      setSaveToast('Fingerprint unlock disabled');
                      setTimeout(() => setSaveToast(null), 3000);
                    } else {
                      setIsBiometricSetupBusy(true);
                      try {
                        const res = await registerNativeFingerprint(name || 'Profile', platformName);
                        if (res.ok) {
                          setIsFingerprintEnabled(true);
                          setSaveToast(res.message || 'Fingerprint unlock enabled');
                        } else {
                          setSaveToast(res.message || 'Fingerprint setup cancelled');
                        }
                        setTimeout(() => setSaveToast(null), 3000);
                      } finally {
                        setIsBiometricSetupBusy(false);
                      }
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-60 ${
                    isFingerprintEnabled ? 'bg-red-600' : 'bg-zinc-700'
                  }`}
                  role="switch"
                  aria-checked={isFingerprintEnabled}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isFingerprintEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isFingerprintEnabled && !isProfileLockEnabled && (
                <p className="text-[11px] text-amber-400/90 pt-1">
                  Enable Profile Lock (4-Digit PIN) above to prompt on startup.
                </p>
              )}
            </div>
          </div>
        </form>
      </main>

      {/* PIN Setup / Change Modal */}
      {isPinSetupModalOpen && (
        <ProfileLockScreen
          userAvatar={avatar}
          userName={name}
          platformName={platformName}
          isSettingUp={true}
          onUnlockSuccess={() => {}}
          onPinConfigured={() => {
            setIsProfileLockEnabled(true);
            setIsPinSetupModalOpen(false);
            setSaveToast('Profile lock enabled with 4-digit PIN');
            setTimeout(() => setSaveToast(null), 3000);
          }}
          onCancelSetup={() => setIsPinSetupModalOpen(false)}
        />
      )}

      {/* Disable PIN Prompt Modal */}
      {isPinDisablePromptOpen && (
        <div className="fixed inset-0 z-[150] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161924] border border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-500">
              <Lock className="w-5 h-5 shrink-0" />
              <h4 className="text-sm font-bold text-white">Disable Profile Lock</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Enter your current 4-digit PIN to turn off profile lock.
            </p>
            <div>
              <input
                type="password"
                maxLength={4}
                value={disablePinInput}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setDisablePinInput(val);
                  setDisablePinError('');
                }}
                placeholder="4-digit PIN"
                className="w-full tracking-widest text-center text-lg font-mono bg-zinc-900 border border-zinc-700 focus:border-white text-white rounded-xl py-2 px-3 outline-none"
              />
              {disablePinError && (
                <p className="text-xs text-red-400 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{disablePinError}</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPinDisablePromptOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const stored = localStorage.getItem('dizi_profile_lock_pin') || '';
                  if (disablePinInput === stored) {
                    try {
                      localStorage.setItem('dizi_profile_lock_enabled', 'false');
                      localStorage.removeItem('dizi_profile_lock_pin');
                    } catch {}
                    setIsProfileLockEnabled(false);
                    setIsPinDisablePromptOpen(false);
                    setSaveToast('Profile lock disabled');
                    setTimeout(() => setSaveToast(null), 3000);
                  } else {
                    setDisablePinError('Incorrect PIN. Please try again.');
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow"
              >
                Turn Off Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
