import React, { useState, useRef, useEffect } from 'react';
import {
  Pencil,
  Gamepad2,
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

export interface AvatarCategory {
  id: string;
  title: string;
  avatars: {
    id: string;
    name: string;
    url: string;
  }[];
}

export const CHOOSE_AVATARS_DATA: AvatarCategory[] = [];

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

  const [adminGroups, setAdminGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_profile_picture_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_PROFILE_PICTURE_GROUPS || [];
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('cineflix_profile_picture_groups');
        if (saved) setAdminGroups(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Scroll position state for the "Choose a profile icon" page
  const [isScrolledDown, setIsScrolledDown] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Editing state for contact info items
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
    setView('edit');
    setSaveToast('Profile icon updated! Click Save to apply.');
    setTimeout(() => {
      setSaveToast(null);
    }, 2200);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSaveProfile({
      avatar,
      name: name.trim() || 'Good',
      handle: handle.trim() || 'NeoGuide873',
      email: email.trim() || 'abc@example.com',
      whatsapp: whatsapp.trim() || '+1 (555) 382-9014',
      password: password.trim() || '••••••••••••'
    });
    setSaveToast('Profile changes saved successfully!');
    setTimeout(() => {
      setSaveToast(null);
      onClose();
    }, 800);
  };

  const scrollCategoryRow = (categoryId: string, direction: 'left' | 'right') => {
    const el = document.getElementById(`avatar-row-${categoryId}`);
    if (el) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleContainerScroll}
      className="fixed inset-0 z-[100] bg-white text-black min-h-screen overflow-y-auto flex flex-col font-sans select-none animate-in fade-in duration-200"
    >
      {/* 
        TOP NAVBAR:
        - When in 'edit' view OR when 'choose-icon' is NOT scrolled: Standard Netflix/Dizi navbar with Red logo on left and user avatar on right (Image 1)
        - When in 'choose-icon' AND scrolled down: Transforms into sticky navbar with Back arrow on left, centered "Choose a profile icon" and "For Good [avatar]" (Image 2)
      */}
      {view === 'choose-icon' && isScrolledDown ? (
        /* Image 2 Scrolled Down Navbar: Back arrow on left, centered title & subtitle */
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 py-2.5 flex items-center justify-between shadow-xs transition-all duration-200">
          {/* Left: Back Arrow button */}
          <button
            onClick={() => setView('edit')}
            className="w-9 h-9 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer text-black"
            title="Back to Edit Profile"
            aria-label="Back to Edit Profile"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Center: Title & Subtitle matching Image 2 */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-base sm:text-lg font-bold text-black leading-tight font-sans">
              Choose a profile icon
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-600 font-medium mt-0.5">
              <span>For {name}</span>
              <div className="w-4 h-4 rounded-full overflow-hidden border border-zinc-300 shadow-xs inline-block bg-blue-600">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Right: Spacer to keep center aligned */}
          <div className="w-9 h-9" />
        </header>
      ) : (
        /* Image 1 Unscrolled Navbar: Red Logo on left, Avatar + Downward Caret on right */
        <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
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

          {/* Right: User Avatar + Downward Caret */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 cursor-pointer p-0.5 group"
              title="Return to browsing"
              aria-label="Return"
            >
              <div className="w-8 h-8 rounded-[4px] overflow-hidden bg-blue-600 shadow-sm">
                <img
                  src={avatar}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4.5px] border-t-zinc-600 group-hover:border-t-black transition-colors" />
            </button>
          </div>
        </header>
      )}

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top duration-200">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* VIEW 1: CHOOSE A PROFILE ICON (Exact 100% UI matching Image 1 and Image 2) */}
      {view === 'choose-icon' ? (
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 pb-20 animate-in fade-in duration-200">
          {/* Unscrolled Body Header matching Image 1 */}
          <div className="mb-6">
            {/* Back button */}
            <button
              onClick={() => setView('edit')}
              className="w-10 h-10 -ml-2 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer mb-2 text-black"
              title="Back to Edit Profile"
              aria-label="Back"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-black tracking-tight font-sans">
              Choose a profile icon
            </h1>

            {/* Subtitle with user name and mini circle avatar */}
            <div className="flex items-center gap-2 mt-1.5 text-zinc-600 text-sm sm:text-base font-medium">
              <span>For {name}</span>
              <div className="w-5 h-5 rounded-full overflow-hidden border border-zinc-300 shadow-xs inline-block bg-blue-600">
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Categories Rows with Horizontal Scrolling matching screenshot */}
          <div className="space-y-8">
            {/* Admin Configured Profile Groups from Shows, Movies, and Custom Feeds */}
            {adminGroups
              .filter((group) => group.enabled !== false)
              .map((group) => (
                <div key={group.id} className="relative group/category">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="text-lg sm:text-xl font-bold text-black tracking-tight font-sans">
                      {group.title || group.showTitle}
                    </h2>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono">
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
                        className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 shrink-0 rounded-md overflow-hidden aspect-square cursor-pointer transition-transform hover:scale-105 shadow-sm border-2 ${
                          isSelected
                            ? 'border-black ring-2 ring-black/30'
                            : 'border-transparent hover:border-black'
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
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center shadow">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                  {/* Right Scroll Arrow Button (Visible on hover if items overflow) */}
                  {group.images && group.images.length > 5 && (
                    <button
                      onClick={() => scrollCategoryRow(group.id, 'right')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-12 bg-black/60 hover:bg-black/80 text-white flex items-center justify-center rounded-l shadow-lg opacity-0 group-hover/category:opacity-100 transition-opacity cursor-pointer z-10"
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
        /* VIEW 2: EDIT PROFILE FULL PAGE (Exact 100% UI matching reference screenshot) */
        <main className="flex-1 w-full max-w-[560px] mx-auto px-4 sm:px-6 py-8 md:py-12 animate-in fade-in duration-200">
          <form onSubmit={handleSave} className="space-y-8">
            {/* Main Title: Edit Profile */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight font-sans">
                Edit Profile
              </h1>
            </div>

            {/* Section 1: Profile Avatar with Pencil Overlay + Profile Name Input */}
            <div className="flex items-start gap-4 sm:gap-6 pt-1">
              {/* Square Avatar with Center Pencil Icon (Clicking opens "Choose a profile icon" view!) */}
              <div
                onClick={handleOpenChooseIcon}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-md overflow-hidden bg-blue-600 shrink-0 cursor-pointer shadow group"
                title="Change Profile Icon"
              >
                <img
                  src={avatar}
                  alt="Profile Icon"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {/* Semi-transparent dark overlay with pencil icon matching screenshot */}
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/55 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-black/60 border border-white/60 flex items-center justify-center shadow-md">
                    <Pencil className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Profile Name Box */}
              <div className="flex-1">
                <div className="border border-zinc-500 focus-within:border-black rounded px-3.5 py-2.5 bg-white transition-colors">
                  <label className="text-[11px] text-zinc-500 font-medium block leading-tight mb-1">
                    Profile name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter profile name"
                    className="w-full text-base font-medium text-black focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Profile Handel */}
            <div className="space-y-3 pt-2">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">
                  Profile Handel
                </h2>
                <p className="text-xs sm:text-[13px] text-zinc-600 leading-relaxed mt-1">
                  Your handle is a unique name that&apos;ll be used to identify your account across all {platformName} features.
                </p>
              </div>

              {/* Handle Input Box with @ Symbol */}
              <div className="border border-zinc-500 focus-within:border-black rounded px-3.5 py-2.5 bg-white flex items-center gap-3 transition-colors">
                <span className="text-lg font-black text-zinc-800 shrink-0 select-none w-5 text-center leading-none">@</span>
                <div className="flex-1 min-w-0">
                  <label className="text-[11px] text-zinc-500 font-medium block leading-tight mb-0.5">
                    Profile Handel
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Enter profile handle"
                    className="w-full text-sm sm:text-base font-medium text-black focus:outline-none bg-transparent truncate"
                  />
                </div>
              </div>
            </div>

            {/* Divider Line */}
            <div className="border-b border-zinc-300 pt-2" />

            {/* Section 3: Contact Info (Email, WhatsApp, Account Password) */}
            <div className="space-y-3.5">
              <div>
                <h2 className="text-xl font-bold text-black tracking-tight">
                  Contact info
                </h2>
              </div>

              {/* Contact Info Card matching screenshot with Email, WhatsApp, and Password */}
              <div className="border border-zinc-300 rounded-lg overflow-hidden bg-white divide-y divide-zinc-200">
                {/* 1. Email */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'email' ? null : 'email')}
                  className="p-3.5 sm:p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Mail className="w-5 h-5 text-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">Email</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5 font-normal">
                          {email}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${
                        activeEditingField === 'email' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Inline Edit Email */}
                  {activeEditingField === 'email' && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-zinc-400 rounded px-2.5 py-1.5 focus:outline-none focus:border-black"
                        placeholder="your.email@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded cursor-pointer hover:bg-zinc-800"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. WhatsApp */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'whatsapp' ? null : 'whatsapp')}
                  className="p-3.5 sm:p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Phone className="w-5 h-5 text-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">WhatsApp</p>
                        <p className="text-xs text-zinc-500 truncate mt-0.5 font-normal">
                          {whatsapp}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${
                        activeEditingField === 'whatsapp' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Inline Edit WhatsApp */}
                  {activeEditingField === 'whatsapp' && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-zinc-400 rounded px-2.5 py-1.5 focus:outline-none focus:border-black"
                        placeholder="+1 (555) 000-0000"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded cursor-pointer hover:bg-zinc-800"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Account Password */}
                <div
                  onClick={() => setActiveEditingField(activeEditingField === 'password' ? null : 'password')}
                  className="p-3.5 sm:p-4 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Lock className="w-5 h-5 text-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900">Account Password</p>
                        <p className="text-xs text-zinc-500 tracking-widest mt-0.5 font-mono">
                          {password.length > 0 ? '••••••••••••' : 'Not set'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform ${
                        activeEditingField === 'password' ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Inline Change Password */}
                  {activeEditingField === 'password' && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="flex-1 text-xs sm:text-sm border border-zinc-400 rounded px-2.5 py-1.5 focus:outline-none focus:border-black"
                        placeholder="New password"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveEditingField(null)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-bold rounded cursor-pointer hover:bg-zinc-800"
                      >
                        Done
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Explanation Note (Exact match from screenshot) */}
              <p className="text-xs text-zinc-600 leading-relaxed pt-1">
                The email associated with this profile is also used for account access and recovery. Visit{' '}
                <button
                  type="button"
                  onClick={() => alert('Account Security: Multi-factor authentication is active for this device.')}
                  className="underline text-black font-medium hover:text-zinc-700 cursor-pointer"
                >
                  account security
                </button>{' '}
                to make changes.
              </p>
            </div>

            {/* Section 4: Action Buttons (Save button matching screenshot + Cancel) */}
            <div className="pt-4 space-y-3">
              <button
                type="submit"
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3.5 px-6 rounded text-sm sm:text-base tracking-wide transition-colors shadow cursor-pointer text-center"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full border border-zinc-300 hover:border-black text-zinc-700 hover:text-black py-2.5 rounded font-bold text-sm transition-colors text-center cursor-pointer"
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
