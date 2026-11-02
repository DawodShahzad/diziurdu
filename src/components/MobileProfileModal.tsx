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
  Gamepad2,
  Trash2
} from 'lucide-react';

interface MobileProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userAvatar: string;
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
}

export const MobileProfileModal: React.FC<MobileProfileModalProps> = ({
  isOpen,
  onClose,
  userName,
  userAvatar,
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
  isLoggedIn = true
}) => {
  const [isNotificationsViewOpen, setIsNotificationsViewOpen] = useState<boolean>(false);
  const [isAboutViewOpen, setIsAboutViewOpen] = useState<boolean>(false);
  const [seeAllView, setSeeAllView] = useState<'none' | 'continue-watching' | 'my-list'>('none');

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
      {/* Grab Handle Bar at top: Scrolls naturally when user scrolls down (DOES NOT STICK) */}
      <div
        className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="w-10 h-1 bg-white/70 hover:bg-white/90 rounded-full shadow-sm" />
      </div>

      {/* Floating Sticky Controls: ONLY the circular cross button (and back button in subviews) sticks, NO dark background box */}
      <div className="sticky top-2 z-30 px-4 py-1 flex items-center justify-between pointer-events-none bg-transparent shrink-0">
        {/* If in subviews, show back button */}
        {(isAboutViewOpen || isNotificationsViewOpen || seeAllView !== 'none') ? (
          <button
            onClick={() => {
              if (seeAllView !== 'none') {
                setSeeAllView('none');
              } else {
                setIsAboutViewOpen(false);
                setIsNotificationsViewOpen(false);
              }
            }}
            className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors pointer-events-auto shadow-md border border-white/10"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}

        {/* Subview Title pill (only if in subviews) */}
        {(isAboutViewOpen || isNotificationsViewOpen || seeAllView !== 'none') ? (
          <span className="text-sm font-bold text-white tracking-tight pointer-events-auto px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow">
            {seeAllView === 'continue-watching'
              ? 'Continue Watching'
              : seeAllView === 'my-list'
              ? 'My List'
              : isAboutViewOpen
              ? 'About Dizi Urdu'
              : 'Notifications'}
          </span>
        ) : (
          <div className="w-8" />
        )}

        {/* Circular X Close Button on Top Right (Sticky, pointer-events-auto, NO background strip beneath it) */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors pointer-events-auto shadow-md border border-white/10 ml-auto"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* SUBVIEW 1: SEE ALL CONTINUE WATCHING (1 title per row with edit/remove) */}
      {seeAllView === 'continue-watching' ? (
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-1 pb-16">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 px-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {continueWatchingShows.length} {continueWatchingShows.length === 1 ? 'Title' : 'Titles'}
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
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                      <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </div>
                    </div>
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-1 pb-16">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 px-1">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {watchlistShows.length} {watchlistShows.length === 1 ? 'Saved Title' : 'Saved Titles'}
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 pb-14 space-y-5">
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3 pb-14">
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-0 pb-16 space-y-4">
          {/* Centered Profile Title in document flow: scrolls away naturally with page, NOT sticky */}
          <div className="text-center pb-1 -mt-1 select-none">
            <h2 className="text-lg font-bold text-white tracking-tight">Profile</h2>
          </div>
          {/* Main Profile Card: matching reference screenshot */}
          <div className="relative rounded-3xl bg-[#1d1f24] border border-white/[0.06] p-6 shadow-xl flex flex-col items-center text-center">
            {/* Edit Pencil Icon Button in top right */}
            {onOpenAccountModal && (
              <button
                onClick={onOpenAccountModal}
                className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                aria-label="Edit Profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}

            {/* Centered Profile Avatar */}
            <div className="relative">
              <img
                src={userAvatar}
                alt={userName}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl"
              />
            </div>

            {/* Display Name and Username below Profile Avatar */}
            <h3 className="text-xl font-bold text-white tracking-tight mt-3">
              {userName}
            </h3>
            <div className="text-xs text-zinc-400 font-medium flex items-center justify-center gap-1.5 mt-1">
              <Gamepad2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>@{userName.toLowerCase().replace(/\s+/g, '')}</span>
            </div>
          </div>

          {/* Continue Watching Section (in 16:9, no color border, not so thick progress line, See All > button) */}
          {continueWatchingShows.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Continue Watching</span>
                  <span className="text-xs text-zinc-400 font-normal">({continueWatchingShows.length})</span>
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
                {continueWatchingShows.map((show) => (
                  <div
                    key={`cw-${show.id}`}
                    onClick={() => {
                      onClose();
                      onPlayShow(show);
                    }}
                    className="relative shrink-0 w-[220px] sm:w-[250px] aspect-video rounded-xl overflow-hidden bg-[#181920] border-0 cursor-pointer shadow-md group active:scale-98 transition-transform"
                  >
                    <img
                      src={show.posterLandscapeUrl || show.backdropUrl}
                      alt={show.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </div>
                    </div>
                    {/* Bottom Progress Line - not so thick */}
                    <div className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/20 overflow-hidden pointer-events-none">
                      <div className="h-full bg-red-600 rounded-full w-2/3" />
                    </div>
                    <div className="absolute inset-x-0 bottom-1 p-2 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <p className="text-[11px] font-semibold text-white truncate drop-shadow">{show.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My List Section (in 2:3, no color border, NO cross button on card, See All > button) */}
          {watchlistShows.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>My List</span>
                  <span className="text-xs text-zinc-400 font-normal">({watchlistShows.length})</span>
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
                    {/* Cross button omitted on card as requested */}
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black via-black/80 to-transparent">
                      <p className="text-[10px] font-semibold text-white truncate drop-shadow">{show.title}</p>
                    </div>
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

            {onOpenAccountModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAccountModal();
                }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#1d1f24] hover:bg-[#252830] text-white cursor-pointer transition-colors border border-white/[0.04]"
              >
                <div className="flex items-center gap-3.5">
                  <User className="w-5 h-5 text-zinc-300" />
                  <span className="text-sm font-semibold text-white">Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}

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
                <HelpCircle className="w-5 h-5 text-zinc-300" />
                <span className="text-sm font-semibold text-white">Help</span>
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
    </div>
  );
};
