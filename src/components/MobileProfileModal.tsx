import React, { useState, useEffect, useRef } from 'react';
import { Show, NotificationItem } from '../types';
import {
  X,
  Bell,
  Settings,
  Edit3,
  ArrowLeft,
  Play,
  ChevronRight,
  HelpCircle,
  LogOut,
  User,
  Trash2,
  MessageSquarePlus,
  Check,
  Pencil,
  MoreVertical,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock
} from 'lucide-react';
import { PROFILE_AVATAR_GROUPS } from './AccountModal';
import fullBackupData from '../full_backup.json';

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
  userHandle?: string;
  watchHistory?: Record<string, any>;
  onOpenPosterActionSheet?: (show: Show) => void;
  watchlistShows: Show[];
  continueWatchingShows: Show[];
  onRemoveFromWatchlist: (showId: string) => void;
  onRemoveFromContinueWatching?: (showId: string) => void;
  onClearWatchlist?: () => void;
  onClearWatchHistory?: () => void;
  onOpenDetails: (show: Show) => void;
  onPlayShow: (show: Show) => void;
  notifications: NotificationItem[];
  onUpdateNotifications?: (notifs: NotificationItem[]) => void;
  onOpenShowById?: (showId: string) => void;
  onOpenAccountModal?: () => void;
  onOpenAppSettings?: () => void;
  onRequestContent?: () => void;
  onOpenDownloadModal?: () => void;
  onOpenAdminPanel?: () => void;
  onToggleAuth?: () => void;
  isLoggedIn?: boolean;
  onSelectAvatar?: (avatarUrl: string) => void;
  onUpdateUserName?: (name: string) => void;
  onUpdateUserHandle?: (handle: string) => void;
  onProfileEditOpenChange?: (isOpen: boolean) => void;
}

export const MobileProfileModal: React.FC<MobileProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
  userHandle,
  watchHistory,
  onOpenPosterActionSheet,
  watchlistShows,
  continueWatchingShows,
  onRemoveFromWatchlist,
  onRemoveFromContinueWatching,
  onClearWatchlist,
  onClearWatchHistory,
  onOpenDetails,
  onPlayShow,
  notifications,
  onUpdateNotifications,
  onOpenShowById,
  onOpenAccountModal,
  onOpenAppSettings,
  onRequestContent,
  onToggleAuth,
  isLoggedIn = true,
  onSelectAvatar,
  onUpdateUserName,
  onUpdateUserHandle,
  onProfileEditOpenChange
}) => {
  const [isNotificationsViewOpen, setIsNotificationsViewOpen] = useState<boolean>(false);
  const [isAboutViewOpen, setIsAboutViewOpen] = useState<boolean>(false);
  const [seeAllView, setSeeAllView] = useState<'none' | 'continue-watching' | 'my-list'>('none');

  const [isEditPopoutOpen, setIsEditPopoutOpen] = useState<boolean>(false);
  const [editSheetDragY, setEditSheetDragY] = useState<number>(0);
  const [isEditSheetDragging, setIsEditSheetDragging] = useState<boolean>(false);
  const editTouchStartYRef = useRef<number>(0);

  const handleEditTouchStart = (e: React.TouchEvent) => {
    editTouchStartYRef.current = e.touches[0].clientY;
    setIsEditSheetDragging(true);
  };
  const handleEditTouchMove = (e: React.TouchEvent) => {
    if (!isEditSheetDragging) return;
    const delta = e.touches[0].clientY - editTouchStartYRef.current;
    if (delta > 0) {
      setEditSheetDragY(delta);
    } else {
      setEditSheetDragY(0);
    }
  };
  const handleEditTouchEnd = () => {
    setIsEditSheetDragging(false);
    if (editSheetDragY > 60) {
      setIsEditPopoutOpen(false);
    }
    setEditSheetDragY(0);
  };

  const [editProfileView, setEditProfileView] = useState<'fields' | 'choose-avatar'>('fields');
  const [tempUserName, setTempUserName] = useState<string>(userName);
  const [tempUserHandle, setTempUserHandle] = useState<string>(() => {
    if (userHandle) return userHandle;
    try {
      const saved = localStorage.getItem('cineflix_user_handle');
      if (saved) return saved;
    } catch {}
    return userName.toLowerCase().replace(/\s+/g, '');
  });
  const [tempUserEmail, setTempUserEmail] = useState<string>(() => {
    try {
      return localStorage.getItem('cineflix_user_email') || 'user@diziurdu.com';
    } catch {
      return 'user@diziurdu.com';
    }
  });
  const [tempUserPhone, setTempUserPhone] = useState<string>(() => {
    try {
      return localStorage.getItem('cineflix_user_phone') || '';
    } catch {
      return '';
    }
  });
  const [tempUserPassword, setTempUserPassword] = useState<string>(() => {
    try {
      return localStorage.getItem('cineflix_user_password') || '••••••••';
    } catch {
      return '••••••••';
    }
  });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>(userAvatar);

  const [adminGroups, setAdminGroups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cineflix_profile_picture_groups');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const fromBackup = (fullBackupData as any)?.profilePictureGroups;
    if (Array.isArray(fromBackup) && fromBackup.length > 0) return fromBackup;
    return PROFILE_AVATAR_GROUPS;
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('cineflix_profile_picture_groups');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setAdminGroups(parsed);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    setTempUserName(userName);
    setSelectedAvatarUrl(userAvatar);
    setTempUserHandle(userHandle || userName.toLowerCase().replace(/\s+/g, ''));
  }, [userName, userAvatar, userHandle]);

  useEffect(() => {
    onProfileEditOpenChange?.(isEditPopoutOpen);
    if (!isEditPopoutOpen) {
      setEditProfileView('fields');
    }
    return () => {
      onProfileEditOpenChange?.(false);
    };
  }, [isEditPopoutOpen, onProfileEditOpenChange]);

  const handleSaveProfileEdit = () => {
    if (tempUserName.trim()) {
      onUpdateUserName?.(tempUserName.trim());
      try {
        localStorage.setItem('cineflix_user_name', tempUserName.trim());
      } catch {}
    }
    const cleanHandle = tempUserHandle.trim().replace(/^@/, '');
    if (cleanHandle) {
      onUpdateUserHandle?.(cleanHandle);
      try {
        localStorage.setItem('cineflix_user_handle', cleanHandle);
      } catch {}
    }
    if (selectedAvatarUrl) {
      onSelectAvatar?.(selectedAvatarUrl);
      try {
        localStorage.setItem('cineflix_user_avatar', selectedAvatarUrl);
      } catch {}
    }
    try {
      localStorage.setItem('cineflix_user_email', tempUserEmail.trim());
      localStorage.setItem('cineflix_user_phone', tempUserPhone.trim());
      localStorage.setItem('cineflix_user_password', tempUserPassword);
    } catch {}
    setIsEditPopoutOpen(false);
  };

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsNotificationsViewOpen(false);
      setIsAboutViewOpen(false);
      setSeeAllView('none');
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartYRef.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    } else {
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current === null) return;
    const modalHeight = modalRef.current?.offsetHeight || window.innerHeight;
    // Dismiss if pulled down > 30% of modal height
    if (dragY > modalHeight * 0.3) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
    touchStartYRef.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartYRef.current = e.clientY;
    setIsDragging(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (touchStartYRef.current === null) return;
      const deltaY = moveEvent.clientY - touchStartYRef.current;
      setDragY(deltaY > 0 ? deltaY : 0);
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      if (touchStartYRef.current !== null) {
        const deltaY = upEvent.clientY - touchStartYRef.current;
        const modalHeight = modalRef.current?.offsetHeight || window.innerHeight;
        if (deltaY > modalHeight * 0.3) {
          onClose();
        }
      }
      setDragY(0);
      setIsDragging(false);
      touchStartYRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (!isOpen) return null;

  const unreadNotifCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    if (onUpdateNotifications) {
      onUpdateNotifications(notifications.map((n) => ({ ...n, unread: false })));
    }
  };

  const handleNotifClick = (notif: NotificationItem) => {
    if (onUpdateNotifications) {
      onUpdateNotifications(
        notifications.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
      );
    }
    if (onOpenShowById && notif.showId) {
      onClose();
      onOpenShowById(notif.showId);
    }
  };

  return (
    <div
      ref={modalRef}
      style={{
        transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className="fixed inset-0 z-50 bg-[#121316] flex flex-col justify-start overflow-hidden animate-in fade-in duration-200"
    >
      {/* Floating Back Button: ONLY back button floating, NO black bar behind it */}
      <button
        onClick={() => {
          if (seeAllView !== 'none') {
            setSeeAllView('none');
          } else if (isAboutViewOpen || isNotificationsViewOpen) {
            setIsAboutViewOpen(false);
            setIsNotificationsViewOpen(false);
          } else {
            onClose();
          }
        }}
        className="absolute top-4 left-4 z-40 w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-all shadow-md border border-white/10 active:scale-95"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Subview Title pill (floating centered badge only when in a subview) */}
      {(isAboutViewOpen || isNotificationsViewOpen || seeAllView !== 'none') && (
        <div className="absolute top-4 inset-x-0 flex justify-center pointer-events-none z-30">
          <span className="text-sm font-bold text-white tracking-tight px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow pointer-events-auto">
            {seeAllView === 'continue-watching'
              ? 'Continue Watching'
              : seeAllView === 'my-list'
              ? 'My List'
              : isAboutViewOpen
              ? 'About Dizi Urdu'
              : 'Notifications'}
          </span>
        </div>
      )}

      {/* SUBVIEW 1: SEE ALL CONTINUE WATCHING (1 title per row with edit/remove) */}
      {seeAllView === 'continue-watching' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-16 pb-16">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 px-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Titles
            </span>
            {continueWatchingShows.length > 0 && onClearWatchHistory && (
              <button
                onClick={onClearWatchHistory}
                className="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {continueWatchingShows.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border-0 text-center my-6">
              <p className="text-sm font-medium text-white">No titles in continue watching</p>
              <p className="text-xs text-zinc-400 mt-1">Shows you start watching will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {continueWatchingShows.map((show) => (
                <div
                  key={`all-cw-${show.id}`}
                  className="py-3 flex items-center gap-3.5 group cursor-pointer"
                  onClick={() => {
                    onClose();
                    onPlayShow(show);
                  }}
                >
                  {/* 16:9 Thumbnail (no color border, thin progress line at bottom) */}
                  <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-[#181818] border-0 shrink-0">
                    <img
                      src={show.posterLandscapeUrl || show.backdropUrl}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Bottom Progress Line - not so thick */}
                    <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/20 overflow-hidden pointer-events-none">
                      <div className="h-full bg-red-600 rounded-full w-2/3" />
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {show.title}
                    </h5>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                      <span>{show.type === 'movie' ? 'Film' : 'Series'}</span>
                      {show.releaseYear && <span>• {show.releaseYear}</span>}
                      {show.genres && show.genres.length > 0 && (
                        <span className="truncate">• {show.genres[0]}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove Title Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onRemoveFromContinueWatching) {
                        onRemoveFromContinueWatching(show.id);
                      } else if (onClearWatchHistory) {
                        onClearWatchHistory();
                      }
                    }}
                    className="p-2.5 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    aria-label={`Remove ${show.title}`}
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : seeAllView === 'my-list' ? (
        /* SUBVIEW 2: SEE ALL MY LIST (1 title per row with edit/remove) */
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-16 pb-16">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 px-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Saved Titles
            </span>
            {watchlistShows.length > 0 && onClearWatchlist && (
              <button
                onClick={onClearWatchlist}
                className="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {watchlistShows.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border-0 text-center my-6">
              <p className="text-sm font-medium text-white">Your list is empty</p>
              <p className="text-xs text-zinc-400 mt-1">Tap + My List on any title to save it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {watchlistShows.map((show) => (
                <div
                  key={`all-wl-${show.id}`}
                  className="py-3 flex items-center gap-3.5 group cursor-pointer"
                  onClick={() => {
                    onClose();
                    onOpenDetails(show);
                  }}
                >
                  {/* 2:3 Vertical Poster Thumbnail (no color border) */}
                  <div className="relative w-18 aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border-0 shrink-0">
                    <img
                      src={show.posterVerticalUrl || show.posterLandscapeUrl}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition-colors">
                      {show.title}
                    </h5>
                    <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                      <span>{show.type === 'movie' ? 'Film' : 'Series'}</span>
                      {show.releaseYear && <span>• {show.releaseYear}</span>}
                      {show.maturityRating && <span>• {show.maturityRating}</span>}
                    </div>
                  </div>

                  {/* Remove Title Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromWatchlist(show.id);
                    }}
                    className="p-2.5 rounded-full hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer shrink-0"
                    aria-label={`Remove ${show.title}`}
                    title="Remove from My List"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isAboutViewOpen ? (
        /* SUBVIEW 3: ABOUT */
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-16 pb-14 space-y-5">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-red-950/40 via-[#181818] to-black border border-red-500/20 text-center space-y-2.5 shadow-xl">
            <h1 className="text-2xl font-black text-white font-display tracking-tight flex items-center justify-center gap-1.5">
              <span>Dizi</span>
              <span className="text-red-500">Urdu</span>
            </h1>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
              Your premier portal for premium Turkish drama serials and movies, professionally subtitled and dubbed in Urdu.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
            <p className="text-xs font-semibold text-white">Need help or inquiries?</p>
            <p className="text-xs text-red-400 font-medium">support@diziurdu.tv</p>
            <p className="text-[10px] text-zinc-500 pt-1">© 2026 Dizi Urdu. All Rights Reserved.</p>
          </div>
        </div>
      ) : isNotificationsViewOpen ? (
        /* SUBVIEW 4: NOTIFICATIONS */
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-16 pb-14">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {unreadNotifCount > 0 ? `${unreadNotifCount} New` : 'All Caught Up'}
            </span>
            {unreadNotifCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white/[0.02] border border-white/5 text-center my-6">
              <Bell className="w-10 h-10 text-zinc-500 mx-auto mb-3 opacity-60" />
              <p className="text-sm font-medium text-white">No notifications yet</p>
              <p className="text-xs text-zinc-400 mt-1">We will notify you when new episodes or shows arrive.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                    notif.unread
                      ? 'bg-white/[0.06] border-white/20 hover:bg-white/[0.09]'
                      : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  {notif.thumbnailUrl ? (
                    <img
                      src={notif.thumbnailUrl}
                      alt=""
                      className="w-12 h-16 rounded-md object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-white leading-snug line-clamp-1">{notif.title}</h5>
                      <span className="text-[10px] text-zinc-400 shrink-0">{notif.timeAgo}</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed">{notif.description}</p>
                    {notif.showId && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 mt-1.5">
                        <span>Watch now</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MAIN PROFILE SCREEN */
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-24 space-y-4">
          {/* Top Title: "Profile" text that naturally scrolls away and hides when scrolling down */}
          <div className="pt-11 pb-0.5 px-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Profile</h1>
          </div>

          {/* Main Profile Card: matching user instructions */}
          <div className="relative rounded-2xl bg-[#1d1f24] border border-white/[0.06] p-4 shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Profile Avatar on Left - NO square border */}
              <img
                src={selectedAvatarUrl || userAvatar}
                alt={userName}
                className="w-16 h-16 rounded-xl object-cover shadow-lg border-0 shrink-0"
              />

              {/* Name on Right and Username below without game icon */}
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {userName}
                </h3>
                <div className="text-xs text-zinc-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <span className="truncate">
                    @{tempUserHandle ? tempUserHandle.replace(/^@/, '') : (userHandle ? userHandle.replace(/^@/, '') : userName.toLowerCase().replace(/\s+/g, ''))}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Pencil Icon Button on Right: opens edit profile popout */}
            <button
              onClick={() => {
                setEditProfileView('fields');
                setIsEditPopoutOpen(true);
              }}
              className="p-2.5 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
              aria-label="Edit Profile"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Continue Watching Section matching image_74bcd37d.png */}
          {continueWatchingShows.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  Continue Watching
                </h4>
                {/* See All Element as requested */}
                <button
                  onClick={() => setSeeAllView('continue-watching')}
                  className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>See All</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1">
                {continueWatchingShows.map((show) => {
                  const prog = watchHistory ? watchHistory[show.id] : undefined;
                  const progPercent = prog?.progressPercent && prog.progressPercent > 0 ? prog.progressPercent : 35;
                  const remainingText = prog?.duration && prog?.currentTime !== undefined && prog.duration > prog.currentTime
                    ? `${Math.max(1, Math.round((prog.duration - prog.currentTime) / 60))} min left`
                    : '24 min left';

                  return (
                    <div
                      key={`cw-${show.id}`}
                      className="shrink-0 w-[220px] sm:w-[250px] select-none"
                    >
                      {/* 16:9 Thumbnail with bottom progress bar inside */}
                      <div
                        onClick={() => {
                          onClose();
                          onPlayShow(show);
                        }}
                        className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#181920] border-0 cursor-pointer shadow-md group active:scale-98 transition-transform"
                      >
                        <img
                          src={show.posterLandscapeUrl || show.backdropUrl}
                          alt={show.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Mobile layout: Progress bar at bottom of thumbnail with no bottom padding */}
                        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20 overflow-hidden z-20 pointer-events-none">
                          <div
                            className="h-full bg-white transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, progPercent))}%` }}
                          />
                        </div>
                      </div>

                      {/* Beneath card: S1 E1  24 min left  ⋮ matching image_74bcd37d.png */}
                      <div className="flex items-center justify-between pt-1.5 px-0.5 select-none">
                        <div className="flex items-center gap-2 min-w-0">
                          {(show.type === 'series' || (show.seasons && show.seasons.length > 0)) && (
                            <span className="font-bold text-white text-[13px] tracking-tight shrink-0">
                              S{prog?.seasonNumber || 1} E{prog?.episodeNumber || 1}
                            </span>
                          )}
                          <span className="text-zinc-400 font-normal text-[13px] truncate">
                            {remainingText}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenPosterActionSheet) {
                              onOpenPosterActionSheet(show);
                            }
                          }}
                          className="p-1 -mr-1 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* My List Section (in 2:3, no color border, NO cross button on card, See All > button) */}
          {watchlistShows.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  My List
                </h4>
                {/* See All Element as requested */}
                <button
                  onClick={() => setSeeAllView('my-list')}
                  className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>See All</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
                {watchlistShows.map((show) => (
                  <div
                    key={`wl-${show.id}`}
                    onClick={() => {
                      onClose();
                      onOpenDetails(show);
                    }}
                    className="relative shrink-0 w-[105px] sm:w-[120px] aspect-[2/3] rounded-xl overflow-hidden bg-[#181920] border-0 cursor-pointer shadow-md active:scale-98 transition-transform"
                  >
                    <img
                      src={show.posterVerticalUrl || show.posterLandscapeUrl}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Title text overlay omitted on card as requested */}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Menu Buttons: App Settings, Account, Help, Sign Out matching exact UI in screenshot */}
          <div className="space-y-2.5 pt-2">
            {onOpenAppSettings && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAppSettings();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1f24] hover:bg-[#252830] text-white cursor-pointer transition-colors border border-white/[0.04]"
              >
                <div className="flex items-center gap-3.5">
                  <Settings className="w-5 h-5 text-zinc-300" />
                  <span className="text-sm font-semibold text-white">App Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}

            {/* Account Button: opens edit profile popout as requested */}
            <button
              onClick={() => {
                setEditProfileView('fields');
                setIsEditPopoutOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1f24] hover:bg-[#252830] text-white cursor-pointer transition-colors border border-white/[0.04]"
            >
              <div className="flex items-center gap-3.5">
                <User className="w-5 h-5 text-zinc-300" />
                <span className="text-sm font-semibold text-white">Account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Request Content Button: replaced Help button and icon with Request Content */}
            <button
              onClick={() => {
                if (onRequestContent) {
                  onClose();
                  onRequestContent();
                } else {
                  setIsAboutViewOpen(true);
                }
              }}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1f24] hover:bg-[#252830] text-white cursor-pointer transition-colors border border-white/[0.04]"
            >
              <div className="flex items-center gap-3.5">
                <MessageSquarePlus className="w-5 h-5 text-zinc-300" />
                <span className="text-sm font-semibold text-white">Request content</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </button>

            {onToggleAuth && (
              <button
                onClick={() => {
                  onClose();
                  onToggleAuth();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1f24] hover:bg-[#252830] text-white cursor-pointer transition-colors border border-white/[0.04]"
              >
                <div className="flex items-center gap-3.5">
                  <LogOut className="w-5 h-5 text-zinc-300" />
                  <span className="text-sm font-semibold text-white">{isLoggedIn ? 'Sign Out' : 'Sign In'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Profile Popout Modal (Matching season selector popout background #181818, no blur, reduced opacity) */}
      {isEditPopoutOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/40 flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsEditPopoutOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              transform: editSheetDragY > 0 ? `translateY(${editSheetDragY}px)` : undefined,
              transition: isEditSheetDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full bg-[#181818] border-t border-white/10 rounded-t-3xl px-5 pt-2 pb-[max(env(safe-area-inset-bottom),24px)] shadow-2xl animate-in slide-in-from-bottom duration-250 select-none max-h-[85vh] flex flex-col"
          >
            {/* Top swipeable pill handle */}
            <div
              className="w-full py-2 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
              onTouchStart={handleEditTouchStart}
              onTouchMove={handleEditTouchMove}
              onTouchEnd={handleEditTouchEnd}
              onTouchCancel={handleEditTouchEnd}
            >
              <div className="w-10 h-1 bg-zinc-500 hover:bg-zinc-400 rounded-full shrink-0" />
            </div>

            {/* Header: Title + Controls */}
            <div className="flex items-center justify-between pb-3 shrink-0 border-b border-white/[0.08]">
              {editProfileView === 'choose-avatar' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditProfileView('fields')}
                    className="w-8 h-8 rounded-full bg-[#2c2c2c] hover:bg-[#383838] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    aria-label="Back to fields"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-bold text-white tracking-tight">Choose Profile Icon</h3>
                </div>
              ) : (
                <h3 className="text-xl font-bold text-white tracking-tight">Edit Profile</h3>
              )}
              <button
                onClick={() => setIsEditPopoutOpen(false)}
                className="w-8 h-8 rounded-full bg-[#2c2c2c] hover:bg-[#383838] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* View A: Fields editor styled like desktop version with icons and card groupings */}
            {editProfileView === 'fields' ? (
              <div className="overflow-y-auto custom-scrollbar -mx-2 px-2 py-4 space-y-4">
                {/* Section 1: Profile Avatar with Pencil badge + Profile Name Input */}
                <div className="flex items-start gap-3.5">
                  <div
                    onClick={() => setEditProfileView('choose-avatar')}
                    className="relative w-18 h-18 rounded-xl overflow-hidden bg-zinc-800 shrink-0 shadow cursor-pointer group border border-white/10"
                    title="Change profile picture"
                  >
                    <img
                      src={selectedAvatarUrl || userAvatar}
                      alt="Profile Avatar"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-black/70 border border-white/60 flex items-center justify-center shadow-md">
                        <Pencil className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                      </div>
                    </div>
                  </div>

                  {/* Profile Name Box */}
                  <div className="flex-1">
                    <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2.5 bg-[#202020] transition-colors">
                      <label className="text-[10px] text-zinc-400 font-medium block leading-tight mb-1">
                        Profile name
                      </label>
                      <input
                        type="text"
                        value={tempUserName}
                        onChange={(e) => setTempUserName(e.target.value)}
                        className="w-full text-sm font-medium text-white focus:outline-none bg-transparent"
                        placeholder="Enter profile name"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Profile Handel */}
                <div className="space-y-1.5 pt-1">
                  <h4 className="text-sm font-bold text-white tracking-tight">Profile Handel</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Your handle is a unique name that&apos;ll be used to identify your account across all features.
                  </p>
                  <div className="border border-white/15 focus-within:border-white rounded-xl px-3.5 py-2 bg-[#202020] flex items-center gap-2.5 transition-colors">
                    <span className="text-base font-black text-zinc-400 shrink-0 select-none">@</span>
                    <div className="flex-1 min-w-0">
                      <label className="text-[9px] text-zinc-400 font-medium block leading-none mb-0.5">
                        Profile Handel
                      </label>
                      <input
                        type="text"
                        value={tempUserHandle.replace(/^@/, '')}
                        onChange={(e) => setTempUserHandle(e.target.value.replace(/^@/, ''))}
                        className="w-full text-xs sm:text-sm font-medium text-white focus:outline-none bg-transparent"
                        placeholder="username"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-white/10 pt-1" />

                {/* Section 3: Contact info with desktop style icons */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-white tracking-tight">Contact info</h4>

                  <div className="border border-white/10 rounded-xl overflow-hidden bg-[#202020] divide-y divide-white/10">
                    {/* 1. Email */}
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">Email</p>
                          <input
                            type="email"
                            value={tempUserEmail}
                            onChange={(e) => setTempUserEmail(e.target.value)}
                            className="text-[11px] text-zinc-400 bg-transparent focus:text-white focus:outline-none w-full mt-0.5"
                            placeholder="abc@example.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. WhatsApp / Phone */}
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">WhatsApp</p>
                          <input
                            type="tel"
                            value={tempUserPhone}
                            onChange={(e) => setTempUserPhone(e.target.value)}
                            className="text-[11px] text-zinc-400 bg-transparent focus:text-white focus:outline-none w-full mt-0.5"
                            placeholder="+1 (555) 382-9014"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Account Password */}
                    <div className="p-3">
                      <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white">Account Password</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={tempUserPassword}
                              onChange={(e) => setTempUserPassword(e.target.value)}
                              className="text-[11px] text-zinc-400 bg-transparent focus:text-white focus:outline-none w-full"
                              placeholder="••••••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
                              aria-label={showPassword ? 'Hide' : 'Show'}
                            >
                              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save & Cancel Buttons: rounded pill matching Play/Resume buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditPopoutOpen(false)}
                    className="flex-1 py-2.5 px-6 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-sm shadow transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfileEdit}
                    className="flex-1 py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow transition-colors cursor-pointer text-center"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* View B: Profile Pictures Feeds (Only shown after clicking on profile picture pencil) */
              <div className="overflow-y-auto custom-scrollbar -mx-2 px-2 py-4 space-y-4">
                <p className="text-xs text-zinc-400">
                  Select an avatar to represent your profile
                </p>

                {adminGroups.map((group: any, gIdx: number) => {
                  const title = group.showTitle || group.title || group.seriesTitle || 'Profile Icons';
                  const avatars: { url: string; name: string }[] = Array.isArray(group.images)
                    ? group.images.map((img: string, i: number) => ({ url: img, name: `${title} #${i + 1}` }))
                    : Array.isArray(group.characters)
                    ? group.characters.map((c: any) => ({ url: c.avatarUrl || c.url, name: c.name || title }))
                    : [];

                  if (avatars.length === 0) return null;

                  return (
                    <div key={group.id || gIdx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-zinc-300">{title}</p>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {group.sourceType === 'movie' ? 'Movie' : group.sourceType === 'series' ? 'Series' : 'Collection'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1">
                        {avatars.map((item, cIdx) => {
                          const isPicked = selectedAvatarUrl === item.url;
                          return (
                            <div
                              key={cIdx}
                              onClick={() => {
                                setSelectedAvatarUrl(item.url);
                                setEditProfileView('fields');
                              }}
                              className={`relative w-20 h-20 sm:w-24 sm:h-24 aspect-square shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all ${
                                isPicked
                                  ? 'ring-2 ring-white scale-105 shadow-md'
                                  : 'opacity-85 hover:opacity-100 ring-1 ring-white/10 hover:ring-white/30'
                              }`}
                            >
                              <img
                                src={item.url}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                              {isPicked && (
                                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Done button to return to fields */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileView('fields')}
                    className="w-full py-2.5 px-6 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-sm shadow transition-colors cursor-pointer text-center"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
