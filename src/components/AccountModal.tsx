import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  CreditCard,
  Shield,
  ChevronRight,
  Sparkles,
  Camera,
  ArrowLeft,
  Check,
  CheckCircle2,
  Tv,
  Lock,
  Smartphone,
  Mail,
  Edit2
} from 'lucide-react';

export interface ProfileAvatarGroup {
  seriesTitle: string;
  characters: {
    name: string;
    avatarUrl: string;
    role?: string;
  }[];
}

export const PROFILE_AVATAR_GROUPS: ProfileAvatarGroup[] = [
  {
    seriesTitle: 'Diriliş: Ertuğrul',
    characters: [
      {
        name: 'Ertuğrul Gazi',
        role: 'Kayı Bey',
        avatarUrl: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Halime Sultan',
        role: 'Seljuk Princess',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Turgut Alp',
        role: 'Battle Axe Master',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Bamsı Beyrek',
        role: 'Twin Sword Champion',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Süleyman Şah',
        role: 'Patriarch',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=240&q=80'
      }
    ]
  },
  {
    seriesTitle: "Barbaroslar: Akdeniz'in Kılıcı",
    characters: [
      {
        name: 'Oruç Reis',
        role: 'Mediterranean Captain',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Hızır Hayreddin Reis',
        role: 'Grand Admiral',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'İlyas Reis',
        role: 'Sea Brother',
        avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Isabel',
        role: 'Alexandria Innkeeper',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80'
      }
    ]
  },
  {
    seriesTitle: 'Aile (The Family)',
    characters: [
      {
        name: 'Aslan Soykan',
        role: 'Family Leader',
        avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Devin Akın',
        role: 'Psychologist',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Hülya Soykan',
        role: 'Matriarch',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Bedri',
        role: 'Enforcer',
        avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=240&q=80'
      }
    ]
  },
  {
    seriesTitle: 'Kuruluş: Osman',
    characters: [
      {
        name: 'Osman Bey',
        role: 'Empire Founder',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Bala Hatun',
        role: 'Chief Lady',
        avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Malhun Hatun',
        role: 'Noble Princess',
        avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Boran Alp',
        role: 'Loyal Bard',
        avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=240&q=80'
      }
    ]
  },
  {
    seriesTitle: 'Classic Platform Avatars',
    characters: [
      {
        name: 'Classic Blue OTT',
        role: 'Iconic',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Kayı Red Banner',
        role: 'Emblem',
        avatarUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=240&q=80'
      },
      {
        name: 'Golden Crescent',
        role: 'Sovereign',
        avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=240&q=80'
      }
    ]
  }
];

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  currentAvatar: string;
  onSelectAvatar: (avatarUrl: string) => void;
  platformName?: string;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  userEmail = 'dawoodshahzad75@gmail.com',
  currentAvatar,
  onSelectAvatar,
  platformName = 'Dizi Urdu'
}) => {
  const [view, setView] = useState<'account' | 'choose-avatar'>('account');
  const [selectedAvatarTemp, setSelectedAvatarTemp] = useState<string>(currentAvatar);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [adminGroups, setAdminGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_profile_picture_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
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

  if (!isOpen) return null;

  const handlePickAvatar = (avatarUrl: string, characterName: string) => {
    setSelectedAvatarTemp(avatarUrl);
    onSelectAvatar(avatarUrl);
    setSuccessToast(`Profile icon updated to ${characterName}!`);
    setTimeout(() => {
      setSuccessToast(null);
      setView('account');
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-modal-backdrop select-none">
      <div className="relative w-full max-w-3xl bg-[#14151a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-modal-content">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/10 flex items-center justify-between bg-[#111216]">
          <div className="flex items-center gap-3">
            {view === 'choose-avatar' ? (
              <button
                onClick={() => setView('account')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Back to Account"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : null}

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {view === 'account' ? 'Account & Membership' : 'Choose a Profile Icon'}
              </h2>
              <p className="text-xs text-zinc-400">
                {view === 'account'
                  ? 'Manage your subscription, billing, and profile icons'
                  : 'Select an icon grouped by your favorite Turkish & global series'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-6 flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 custom-scrollbar text-xs">
          {view === 'account' ? (
            /* ACCOUNT VIEW */
            <div className="space-y-6">
              {/* SECTION 1: PROFILE & PARENTAL CONTROLS (With Clickable Profile Image) */}
              <div className="bg-[#181920] border border-white/10 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Profile & Parental Controls
                  </h3>
                  <span className="text-[11px] text-zinc-500">Click avatar to change icon</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121318] border border-white/5">
                  <div className="flex items-center gap-4">
                    {/* Clickable Profile Avatar that opens choose-avatar page! */}
                    <div
                      onClick={() => setView('choose-avatar')}
                      className="relative group cursor-pointer"
                      title="Click to choose a profile icon from series"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-blue-600 shadow-xl ring-2 ring-white/20 group-hover:ring-red-500 transition-all">
                        <img
                          src={currentAvatar}
                          alt="Profile Avatar"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform"
                        />
                      </div>
                      {/* Camera / Edit Overlay Badge */}
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white drop-shadow" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-600 border border-black flex items-center justify-center text-white shadow">
                        <Edit2 className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">Ertuğrul Member</h4>
                        <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-bold">
                          Primary
                        </span>
                      </div>
                      <p className="text-zinc-400 text-xs mt-0.5">{userEmail}</p>
                      <button
                        onClick={() => setView('choose-avatar')}
                        className="text-red-400 hover:text-red-300 text-xs font-semibold mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Change profile icon</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 text-xs font-medium">
                      All Maturity Ratings (18+)
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: MEMBERSHIP & BILLING */}
              <div className="bg-[#181920] border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Membership & Billing
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    Active Subscription
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-[#121318] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Email Address</span>
                      <span className="text-white font-medium">{userEmail}</span>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer">
                      Change
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121318] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Password</span>
                      <span className="text-white font-medium">••••••••••••</span>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer">
                      Change
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121318] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Phone Number</span>
                      <span className="text-white font-medium">+1 (555) 019-2834</span>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer">
                      Update
                    </button>
                  </div>

                  <div className="p-3.5 rounded-lg bg-[#121318] border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-500 text-[11px] block">Payment Card</span>
                      <div className="flex items-center gap-1.5 text-white font-medium">
                        <CreditCard className="w-4 h-4 text-zinc-400" />
                        <span>Visa ending in 4242</span>
                      </div>
                    </div>
                    <button className="text-red-400 hover:text-red-300 text-xs font-semibold cursor-pointer">
                      Manage
                    </button>
                  </div>
                </div>

                <div className="text-zinc-400 text-[11px] pt-1">
                  Next billing date is <span className="text-white font-semibold">November 9, 2026</span> via Visa card.
                </div>
              </div>

              {/* SECTION 3: PLAN DETAILS */}
              <div className="bg-[#181920] border border-white/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Plan Details
                  </h3>
                  <button className="text-red-400 hover:text-red-300 font-semibold cursor-pointer">
                    Change Plan
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/30 to-[#121318] border border-red-500/20 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Premium 4K Ultra HD Plan</span>
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-black uppercase">
                        Ultra HD
                      </span>
                    </div>
                    <p className="text-zinc-400 text-xs">
                      4 simultaneous screens • 4K HDR • Unrestricted Turkish & Global OTT Library
                    </p>
                  </div>
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2">
                <button className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                  Cancel Membership
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* CHOOSE PROFILE ICON VIEW (Grouped by series, exact like screenshot!) */
            <div className="space-y-8 animate-in fade-in">
              {/* Current Icon Highlight Header */}
              <div className="p-4 rounded-xl bg-[#181920] border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-blue-600 shadow-md ring-2 ring-red-500">
                    <img
                      src={currentAvatar}
                      alt="Current Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-white font-bold block text-sm">Current Profile Icon</span>
                    <span className="text-zinc-400 text-xs">Click any character below to instantly switch icon</span>
                  </div>
                </div>

                <button
                  onClick={() => setView('account')}
                  className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer transition-colors"
                >
                  Back to Account
                </button>
              </div>

              {/* Admin Configured Profile Picture Groups */}
              {adminGroups.map((group) => (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {group.showTitle}
                    </h3>
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {group.type}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      ({group.images.length} {group.images.length === 1 ? 'icon' : 'icons'})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {group.images.map((imgUrl: string, idx: number) => {
                      const isSelected = (selectedAvatarTemp || currentAvatar) === imgUrl;
                      return (
                        <button
                          key={idx}
                          onClick={() => handlePickAvatar(imgUrl, `${group.showTitle} #${idx + 1}`)}
                          className={`group/char relative p-2 rounded-xl text-left transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-red-600/10 border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.35)]'
                              : 'bg-[#181920] border-white/5 hover:border-white/25 hover:bg-[#1f2029]'
                          }`}
                        >
                          <div className="relative aspect-square w-full rounded-[4px] overflow-hidden bg-zinc-800">
                            <img
                              src={imgUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300 group-hover/char:scale-105"
                            />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Series Groups */}
              {PROFILE_AVATAR_GROUPS.map((group) => (
                <div key={group.seriesTitle} className="space-y-3">
                  <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {group.seriesTitle}
                    </h3>
                    <span className="text-[11px] text-zinc-500 font-medium">
                      ({group.characters.length} icons)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {group.characters.map((char) => {
                      const isSelected = currentAvatar === char.avatarUrl;
                      return (
                        <button
                          key={char.name}
                          onClick={() => handlePickAvatar(char.avatarUrl, char.name)}
                          className={`group/char relative p-2 rounded-xl text-left transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-red-600/10 border-red-500 shadow-[0_0_15px_rgba(229,9,20,0.35)]'
                              : 'bg-[#181920] border-white/5 hover:border-white/25 hover:bg-[#1f2029]'
                          }`}
                        >
                          {/* Avatar Image Frame */}
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-800 mb-2">
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-300"
                            />

                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>

                          <div className="truncate">
                            <span className="font-bold text-white text-xs block truncate group-hover/char:text-red-400 transition-colors">
                              {char.name}
                            </span>
                            {char.role && (
                              <span className="text-[10px] text-zinc-400 block truncate">
                                {char.role}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
