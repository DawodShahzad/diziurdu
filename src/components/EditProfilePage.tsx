import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Mail,
  Phone,
  Lock,
  ChevronRight,
  Check,
  ChevronLeft,
  Shield,
  AlertCircle,
  Fingerprint
} from 'lucide-react';
import { DiziLogo } from './DiziLogo';
import { ProfileLockScreen } from './ProfileLockScreen';
import { isFingerprintUnlockEnabled, registerNativeFingerprint, setFingerprintUnlockEnabled } from '../utils/biometricUnlock';
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
  onSaveProfile
}) => {
  const [view, setView] = useState<'edit' | 'choose-icon'>('edit');
  const [avatar, setAvatar] = useState<string>(userAvatar);
  const [name, setName] = useState<string>(userName || '');
  const [handle, setHandle] = useState<string>(userHandle || '');
  const [email, setEmail] = useState<string>(userEmail || '');
  const [whatsapp, setWhatsapp] = useState<string>(userWhatsapp || '');
  const [password, setPassword] = useState<string>(userPassword || '');

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

  const [isScrolledDown, setIsScrolledDown] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeEditingField, setActiveEditingField] = useState<'email' | 'whatsapp' | 'password' | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (view === 'choose-icon') {
      setIsScrolledDown(scrollTop > 45);
    }
  };

  const handleOpenChooseIcon = () => {
    setView('choose-icon');
    setIsScrolledDown(false);
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
    setSaveToast('Profile icon updated');
    setTimeout(() => setSaveToast(null), 2500);
    setView('edit');
  };

  const scrollCategoryRow = (groupId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(`avatar-row-${groupId}`);
    if (el) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
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

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleContainerScroll}
      className="fixed inset-0 z-[100] bg-[#141414] text-white min-h-screen overflow-y-auto flex flex-col font-sans select-none animate-in fade-in duration-200"
    >
      {/* 
        TOP NAVBAR:
        - When in 'edit' view OR when 'choose-icon' is NOT scrolled: Dark navbar with Red logo on left and user avatar on right
        - When in 'choose-icon' AND scrolled down: Transforms into sticky dark navbar with Back arrow on left, centered "Choose a profile icon"
      */}
      {view === 'choose-icon' && isScrolledDown ? (
        <header className="sticky top-0 z-30 bg-[#141414]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-md transition-all duration-200">
          {/* Left: Back Arrow button */}
          <button
            onClick={() => setView('edit')}
            className="p-1 -ml-1 text-white hover:text-white/80 active:scale-90 flex items-center justify-center transition-transform cursor-pointer"
            title="Back to Edit Profile"
            aria-label="Back to Edit Profile"
          >
            <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
          </button>

          {/* Center: Title & Subtitle */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight font-sans">
              Choose a profile icon
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium mt-0.5">
              <span>For {name || 'Guest'}</span>
              <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shadow-xs inline-block bg-zinc-800">
                <img src={avatar} alt={name || 'Profile'} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Right: Spacer to keep center aligned */}
          <div className="w-9 h-9" />
        </header>
      ) : (
        <header className="sticky top-0 z-30 bg-[#141414] border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
          {/* Left: Red Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="cursor-pointer flex items-center gap-2"
              title="Return to browsing"
              aria-label="Return to Dizi"
            >
              <DiziLogo variant="red" size="md" />
            </button>
          </div>

          {/* Right: User Avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 cursor-pointer p-0.5 group"
              title="Return to browsing"
              aria-label="Return"
            >
              <div className="w-8 h-8 rounded-[6px] overflow-hidden bg-zinc-800 shadow-sm border border-white/10">
                <img
                  src={avatar}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>
        </header>
      )}

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1e1f24] border border-white/20 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* VIEW 1: CHOOSE A PROFILE ICON */}
      {view === 'choose-icon' ? (
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-20 animate-in fade-in duration-200">
          {/* Unscrolled Body Header */}
          <div className="mb-6">
            <button
              onClick={() => setView('edit')}
              className="p-1 -ml-1.5 text-white hover:text-white/80 active:scale-90 flex items-center justify-center transition-transform cursor-pointer mb-2"
              title="Back to Edit Profile"
              aria-label="Back"
            >
              <ChevronLeft className="w-7 h-7 stroke-[2.2]" />
            </button>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
              Choose a profile icon
            </h1>

            <div className="flex items-center gap-2 mt-1.5 text-zinc-400 text-sm sm:text-base font-medium">
              <span>For {name || 'Guest'}</span>
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 shadow-xs inline-block bg-zinc-800">
                <img src={avatar} alt={name || 'Profile'} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Categories Rows with Horizontal Scrolling */}
          <div className="space-y-8">
            {adminGroups
              .filter((group) => group.enabled !== false)
              .map((group) => (
                <div key={group.id} className="relative group/category">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
                      {group.title || group.showTitle}
                    </h2>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                      {group.sourceType === 'movie' ? 'Movie' : group.sourceType === 'series' ? 'Series' : group.sourceType === 'custom' ? 'Collection' : (group.type || 'Avatars')}
                    </span>
                  </div>

                  <div
                    id={`avatar-row-${group.id}`}
                    className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-1"
                  >
                    {group.images.map((imgUrl: string, idx: number) => {
                      const isSelected = avatar === imgUrl;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSelectIcon(imgUrl)}
                          className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-xl overflow-hidden aspect-square cursor-pointer transition-transform hover:scale-105 shadow-sm border-2 ${
                            isSelected
                              ? 'border-white ring-2 ring-white/50'
                              : 'border-transparent hover:border-white/40'
                          }`}
                          title={`${group.showTitle} #${idx + 1}`}
                        >
                          <img
                            src={imgUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {group.images && group.images.length > 5 && (
                    <button
                      onClick={() => scrollCategoryRow(group.id, 'right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-black/80 hover:bg-black text-white flex items-center justify-center rounded-l shadow-lg opacity-0 group-hover/category:opacity-100 transition-opacity cursor-pointer z-10 border-y border-l border-white/20"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </main>
      ) : (
        /* VIEW 2: EDIT PROFILE FULL PAGE (Compact non-scrolling single-screen 2-column desktop layout) */
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 md:py-6 flex items-center animate-in fade-in duration-200">
          <form onSubmit={handleSave} className="w-full space-y-5">
            {/* Compact Header Row with Inline Action Buttons on Desktop */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  Edit Profile
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Manage your profile details, security credentials, and startup PIN lock.
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-white/20 hover:border-white text-zinc-300 hover:text-white rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl text-xs sm:text-sm tracking-wide transition-colors shadow cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* 2-Column Single-Screen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Left Column (4 cols): Profile Identity (Avatar + Name + Handle) */}
              <div className="md:col-span-5 bg-[#1a1b20] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    onClick={handleOpenChooseIcon}
                    className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-800 shrink-0 cursor-pointer shadow group border border-white/15"
                    title="Change Profile Icon"
                  >
                    <img
                      src={avatar}
                      alt="Profile Icon"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                      <div className="w-7 h-7 rounded-full bg-black/75 border border-white/60 flex items-center justify-center shadow-md">
                        <Pencil className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{name || 'Profile'}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">@{handle.replace(/^@/, '') || 'handle'}</p>
                    <button
                      type="button"
                      onClick={handleOpenChooseIcon}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold mt-1.5 cursor-pointer"
                    >
                      Change avatar
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2 bg-[#141414] transition-colors">
                    <label className="text-[11px] text-zinc-400 font-medium block leading-tight mb-0.5">
                      Profile name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter profile name"
                      className="w-full text-sm font-medium text-white focus:outline-none bg-transparent"
                    />
                  </div>

                  <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2 bg-[#141414] flex items-center gap-2.5 transition-colors">
                    <span className="text-base font-black text-zinc-400 shrink-0 select-none">@</span>
                    <div className="flex-1 min-w-0">
                      <label className="text-[11px] text-zinc-400 font-medium block leading-tight mb-0.5">
                        Profile Handle
                      </label>
                      <input
                        type="text"
                        value={handle.replace(/^@/, '')}
                        onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
                        placeholder="username"
                        className="w-full text-sm font-medium text-white focus:outline-none bg-transparent truncate"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (8 cols): Inline Contact Fields + Profile Lock PIN Card */}
              <div className="md:col-span-7 space-y-4">
                {/* Inline Contact & Password Card */}
                <div className="bg-[#1a1b20] border border-white/10 rounded-2xl p-5 space-y-3.5">
                  <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                    Contact & Security
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-white/12 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#141414] flex items-center gap-2.5 transition-colors">
                      <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-zinc-400 font-medium block leading-tight">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@example.com"
                          className="w-full text-xs sm:text-sm font-medium text-white bg-transparent focus:outline-none mt-0.5 truncate"
                        />
                      </div>
                    </div>

                    <div className="border border-white/12 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#141414] flex items-center gap-2.5 transition-colors">
                      <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-zinc-400 font-medium block leading-tight">WhatsApp</label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full text-xs sm:text-sm font-medium text-white bg-transparent focus:outline-none mt-0.5 truncate"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2 border border-white/12 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#141414] flex items-center gap-2.5 transition-colors">
                      <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <label className="text-[10px] text-zinc-400 font-medium block leading-tight">
                          Account Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="New password"
                          className="w-full text-xs sm:text-sm font-medium text-white bg-transparent focus:outline-none mt-0.5"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inline Profile Lock Card */}
                <div className="bg-[#1a1b20] border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                        <Shield className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">Profile Lock (4-Digit PIN)</p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {isProfileLockEnabled
                            ? `PIN protection is enabled on ${platformName}`
                            : `Require a 4-digit PIN to unlock on startup`}
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
                    <div className="pt-2.5 border-t border-white/10 flex items-center justify-between">
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

                {/* Fingerprint Unlock Card */}
                <div className="bg-[#1a1b20] border border-white/10 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
                        <Fingerprint className="w-5 h-5 text-[#ff2e55]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">Fingerprint Unlock</p>
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
            </div>
          </form>
        </main>
      )}

      {/* PIN Setup / Change Modal */}
      {isPinSetupModalOpen && (
        <ProfileLockScreen
          userAvatar={avatar}
          userName={name}
          platformName={platformName}
          isSettingUp={true}
          onUnlockSuccess={() => {}}
          onPinConfigured={(newPin) => {
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
