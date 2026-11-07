import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Mail,
  Phone,
  Lock,
  ChevronRight,
  Check,
  ArrowLeft
} from 'lucide-react';
import { DiziLogo } from './DiziLogo';
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
  const [name, setName] = useState<string>(userName || 'Good');
  const [handle, setHandle] = useState<string>(userHandle || 'NeoGuide873');
  const [email, setEmail] = useState<string>(userEmail || 'abc@example.com');
  const [whatsapp, setWhatsapp] = useState<string>(userWhatsapp || '+1 (555) 382-9014');
  const [password, setPassword] = useState<string>(userPassword || '••••••••••••');

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
      name: name.trim() || 'Good',
      handle: handle.trim() || 'NeoGuide873',
      email: email.trim() || 'abc@example.com',
      whatsapp: whatsapp.trim() || '+1 (555) 382-9014',
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
      name: name.trim() || 'Good',
      handle: handle.trim() || 'NeoGuide873',
      email: email.trim() || 'abc@example.com',
      whatsapp: whatsapp.trim() || '+1 (555) 382-9014',
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
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer text-white"
            title="Back to Edit Profile"
            aria-label="Back to Edit Profile"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Center: Title & Subtitle */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-base sm:text-lg font-bold text-white leading-tight font-sans">
              Choose a profile icon
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 font-medium mt-0.5">
              <span>For {name}</span>
              <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shadow-xs inline-block bg-zinc-800">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
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
              className="w-10 h-10 -ml-2 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer mb-2 text-white"
              title="Back to Edit Profile"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
              Choose a profile icon
            </h1>

            <div className="flex items-center gap-2 mt-1.5 text-zinc-400 text-sm sm:text-base font-medium">
              <span>For {name}</span>
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 shadow-xs inline-block bg-zinc-800">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
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
        /* VIEW 2: EDIT PROFILE FULL PAGE (Dark mode matching homepage color) */
        <main className="flex-1 w-full max-w-[560px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in duration-200">
          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
                Edit Profile
              </h1>
            </div>

            {/* Section 1: Profile Avatar with Pencil Overlay + Profile Name Input */}
            <div className="flex items-start gap-4 sm:gap-6 pt-1">
              <div
                onClick={handleOpenChooseIcon}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-zinc-800 shrink-0 cursor-pointer shadow group border border-white/10"
                title="Change Profile Icon"
              >
                <img
                  src={avatar}
                  alt="Profile Icon"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/70 border border-white/60 flex items-center justify-center shadow-md">
                    <Pencil className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Profile Name Box */}
              <div className="flex-1">
                <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#1e1f24] transition-colors">
                  <label className="text-[11px] text-zinc-400 font-medium block leading-tight mb-1">
                    Profile name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter profile name"
                    className="w-full text-base font-medium text-white focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Profile Handel */}
            <div className="space-y-3 pt-2">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Profile Handel
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-400 leading-relaxed mt-1">
                  Your handle is a unique name that&apos;ll be used to identify your account across all {platformName} features.
                </p>
              </div>

              {/* Handle Input Box with @ Symbol */}
              <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#1e1f24] flex items-center gap-3 transition-colors">
                <span className="text-lg font-black text-zinc-400 shrink-0 select-none w-5 text-center leading-none">@</span>
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] text-zinc-400 font-medium block leading-tight mb-0.5">
                    Profile Handel
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter profile handle"
                    className="w-full text-sm sm:text-base font-medium text-white focus:outline-none bg-transparent truncate"
                  />
                </div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-b border-white/10 pt-2" />

            {/* Section 3: Contact Info (Email, WhatsApp, Account Password) with icons matching desktop reference */}
            <div className="space-y-3.5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Contact info
                </h2>
              </div>

              <div className="border border-white/10 rounded-xl overflow-hidden bg-[#1e1f24] divide-y divide-white/10">
                {/* 1. Email */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'email' ? null : 'email')}
                  className="p-3.5 sm:p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Mail className="w-5 h-5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">Email</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5 font-normal">
                          {email}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${
                        activeEditingField === 'email' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {activeEditingField === 'email' && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-white/20 bg-[#141414] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white"
                        placeholder="your.email@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-200"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. WhatsApp */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'whatsapp' ? null : 'whatsapp')}
                  className="p-3.5 sm:p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Phone className="w-5 h-5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">WhatsApp</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5 font-normal">
                          {whatsapp}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${
                        activeEditingField === 'whatsapp' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {activeEditingField === 'whatsapp' && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-white/20 bg-[#141414] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white"
                        placeholder="+1 (555) 000-0000"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-200"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Account Password */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'password' ? null : 'password')}
                  className="p-3.5 sm:p-4 hover:bg-white/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Lock className="w-5 h-5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">Account Password</p>
                        <p className="text-xs text-zinc-400 tracking-widest mt-0.5 font-mono">
                          {password.length > 0 ? '••••••••••••' : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-500 shrink-0 transition-transform ${
                        activeEditingField === 'password' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {activeEditingField === 'password' && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-white/20 bg-[#141414] text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-white"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-zinc-200"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 4: Action Buttons */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-3.5 px-6 rounded-xl text-sm sm:text-base tracking-wide transition-colors shadow cursor-pointer text-center"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-white/20 hover:border-white text-zinc-300 hover:text-white py-2.5 rounded-xl font-bold text-sm transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      )}
    </div>
  );
};
