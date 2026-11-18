import React, { useState, useEffect, useRef } from 'react';
import { Show } from '../types';
import { X, Link2, Check, MessageCircle, Send, Mail, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaImage } from './MediaImage';
import { resolveShowShareMeta, hexToRgbTuple } from '../utils/shareMeta';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: Show;
  platformName?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  show,
  platformName = 'Dizi Urdu'
}) => {
  const [copied, setCopied] = useState(false);
  const [moreToast, setMoreToast] = useState(false);
  const [isMobileView, setIsMobileView] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const desktopRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const currentHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';

  const slug = show.slug || show.id;
  const shareUrl = `${currentOrigin}/share/${slug}`;

  const { shareTitle, shareDescription, linkPreviewImage, displayBackdrop, ambianceColor } =
    resolveShowShareMeta(show, platformName, isMobileView);
  const [ambR, ambG, ambB] = hexToRgbTuple(ambianceColor);

  // Sync OpenGraph & Twitter Card meta tags strictly from Admin Panel Link Preview fields
  useEffect(() => {
    if (!isOpen) return;
    const prevTitle = document.title;
    document.title = shareTitle;

    const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
      if (!contentVal) return;
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', contentVal);
    };

    setMeta('property', 'og:title', shareTitle);
    setMeta('property', 'og:description', shareDescription);
    if (linkPreviewImage) {
      setMeta('property', 'og:image', linkPreviewImage);
      setMeta('property', 'og:image:secure_url', linkPreviewImage);
      setMeta('name', 'twitter:image', linkPreviewImage);
    }
    setMeta('property', 'og:url', shareUrl);
    setMeta('property', 'og:site_name', platformName || currentHost);
    setMeta('property', 'og:type', 'video.other');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', shareTitle);
    setMeta('name', 'twitter:description', shareDescription);

    return () => {
      document.title = prevTitle;
    };
  }, [isOpen, shareTitle, shareDescription, linkPreviewImage, shareUrl, platformName, currentHost]);

  if (!isOpen) return null;

  const copyShareUrl = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleCopyLink = async () => {
    await copyShareUrl();
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleMoreOptions = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback silently if user cancels or platform blocks share sheet
      }
    }
    await copyShareUrl();
    setMoreToast(true);
    setTimeout(() => setMoreToast(false), 2200);
  };

  const sharePlatforms = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#20ba59]',
      textColor: 'text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${shareDescription}\n${shareUrl}`)}`
    },
    {
      name: 'Facebook',
      icon: () => (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      color: 'bg-[#1877F2] hover:bg-[#166fe5]',
      textColor: 'text-white',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X',
      icon: () => (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'bg-zinc-900 hover:bg-zinc-800 border border-white/20',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n${shareDescription}`)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#0088cc] hover:bg-[#0077b5]',
      textColor: 'text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${shareTitle}\n${shareDescription}`)}`
    },
    {
      name: 'LinkedIn',
      icon: () => (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
      color: 'bg-[#0077b5] hover:bg-[#006097]',
      textColor: 'text-white',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Pinterest',
      icon: () => (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.98-.12-2.48.02-3.55.13-.97.87-3.7.87-3.7s-.22-.44-.22-1.1c0-1.03.6-1.8 1.34-1.8.63 0 .94.47.94 1.04 0 .63-.4 1.58-.61 2.46-.17.74.37 1.35 1.1 1.35 1.32 0 2.34-1.39 2.34-3.4 0-1.78-1.28-3.03-3.1-3.03-2.27 0-3.6 1.7-3.6 3.46 0 .68.26 1.42.59 1.82.06.08.07.15.05.23-.06.24-.19.77-.22.88-.04.14-.12.17-.28.1-1.04-.48-1.69-2-1.69-3.21 0-2.62 1.9-5.02 5.48-5.02 2.88 0 5.11 2.05 5.11 4.79 0 2.85-1.8 5.15-4.3 5.15-.84 0-1.63-.44-1.9-.96l-.52 1.98c-.19.72-.7 1.62-1.04 2.18A12 12 0 1 0 12 0z" />
        </svg>
      ),
      color: 'bg-[#E60023] hover:bg-[#c9001f]',
      textColor: 'text-white',
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(linkPreviewImage)}&description=${encodeURIComponent(`${shareTitle} - ${shareDescription}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-zinc-700 hover:bg-zinc-600',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)}`
    }
  ];

  const yearLabel = (show.releaseYear || '').split('-')[0].trim();
  const runtimeLabel =
    show.type === 'series'
      ? show.durationOrSeasons || `${show.seasons?.length || 1} Season${(show.seasons?.length || 1) > 1 ? 's' : ''}`
      : show.durationOrSeasons || 'Movie';
  const primaryGenre = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.slice(0, 2).join(', ') : '';
  const compactInfoItems = [yearLabel, show.maturityRating, runtimeLabel, primaryGenre].filter(Boolean);

  const scrollDesktopRow = (dir: 'left' | 'right') => {
    const el = desktopRowRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Ambient Popout Card Wrapper */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(180deg, rgba(${ambR}, ${ambG}, ${ambB}, 0.24) 0%, rgba(18, 19, 24, 0.96) 52%, #111216 100%)`,
          borderColor: `rgba(${ambR}, ${ambG}, ${ambB}, 0.34)`,
          boxShadow: `0 24px 70px rgba(0, 0, 0, 0.88), 0 0 60px rgba(${ambR}, ${ambG}, ${ambB}, 0.25)`
        }}
        className="relative w-full md:max-w-[480px] rounded-t-3xl md:rounded-2xl border overflow-hidden select-none animate-in fade-in md:zoom-in-95 slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-200"
      >
        {/* Soft Admin-Selected Ambiance Glow Behind Artwork & Top Area */}
        <div
          className="pointer-events-none absolute -top-12 inset-x-0 h-64 opacity-70 blur-2xl"
          style={{
            background: `radial-gradient(ellipse 85% 70% at 50% 25%, rgba(${ambR}, ${ambG}, ${ambB}, 0.55) 0%, transparent 78%)`
          }}
        />

        {/* Top Backdrop Hero Card with PNG Logo & Info */}
        <div className="relative w-full aspect-video bg-black overflow-hidden">
          <MediaImage
            src={displayBackdrop}
            fallbackTitle={show.title}
            fallbackClassName="w-full h-full bg-[#15161c] flex items-center justify-center p-6 text-center"
            className="w-full h-full object-cover object-center"
          />

          {/* Top Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center cursor-pointer transition-colors border border-white/15"
            aria-label="Close Share Popout"
          >
            <X className="w-4.5 h-4.5" />
          </button>

          {/* Bottom Merge Gradient infused with dark ambiance */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-10"
            style={{
              background: `linear-gradient(to top, rgba(16,17,22,1) 0%, rgba(16,17,22,0.82) 32%, rgba(16,17,22,0.34) 68%, transparent 100%)`
            }}
          />

          {/* Title PNG Logo & Compact Info Overlaid at Bottom Left */}
          <div className="absolute bottom-3.5 left-4 right-4 z-20 flex flex-col items-start gap-1.5 pointer-events-none">
            {show.titleLogoUrl ? (
              <img
                src={show.titleLogoUrl}
                alt={show.title}
                referrerPolicy="no-referrer"
                className="max-h-12 sm:max-h-14 max-w-[230px] sm:max-w-[260px] w-auto object-contain object-left drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] line-clamp-1">
                {show.title}
              </h3>
            )}

            {compactInfoItems.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs sm:text-[13px] font-medium text-zinc-200 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                {compactInfoItems.map((item, idx) => (
                  <React.Fragment key={`${item}-${idx}`}>
                    {idx > 0 && <span className="text-white/50 text-[10px]">•</span>}
                    <span>{item}</span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Share Options Section */}
        <div className="relative z-20 px-4 sm:px-5 pt-2.5 pb-6 md:pb-5 space-y-3.5">
          {/* Header Label + Host/Copied Feedback */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-semibold text-zinc-300 tracking-wide">
              Share Title
            </span>
            {(copied || moreToast) && (
              <span className="text-xs font-semibold text-emerald-400 animate-in fade-in duration-150">
                Link copied to clipboard
              </span>
            )}
          </div>

          {/* DESKTOP LAYOUT: Copy Link + More Options moved to upper horizontal scrollable row with all social platforms */}
          <div className="hidden md:block relative group/sharerow">
            <button
              type="button"
              onClick={() => scrollDesktopRow('left')}
              aria-label="Scroll share options left"
              className="absolute -left-2 top-[26px] -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white border border-white/15 flex items-center justify-center opacity-0 group-hover/sharerow:opacity-100 transition-opacity cursor-pointer shadow-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollDesktopRow('right')}
              aria-label="Scroll share options right"
              className="absolute -right-2 top-[26px] -translate-y-1/2 z-30 w-7 h-7 rounded-full bg-black/75 hover:bg-black text-white border border-white/15 flex items-center justify-center opacity-0 group-hover/sharerow:opacity-100 transition-opacity cursor-pointer shadow-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div
              ref={desktopRowRef}
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && desktopRowRef.current) {
                  desktopRowRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex items-start gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth"
            >
              {/* Copy Link (Upper Row First Option) */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1.5 shrink-0 w-14 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/15 hover:bg-white/25 text-white border border-white/15'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Link2 className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white text-center truncate w-full">
                  {copied ? 'Copied' : 'Copy Link'}
                </span>
              </button>

              {/* More Options (Upper Row Second Option) */}
              <button
                type="button"
                onClick={handleMoreOptions}
                className="flex flex-col items-center gap-1.5 shrink-0 w-14 group cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/15 flex items-center justify-center shadow-md transition-transform active:scale-95">
                  <MoreHorizontal className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium text-zinc-300 group-hover:text-white text-center truncate w-full">
                  More Options
                </span>
              </button>

              {/* Horizontally Scrollable Social Apps */}
              {sharePlatforms.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 shrink-0 w-14 group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${item.color} ${item.textColor} flex items-center justify-center shadow-md active:scale-95 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-zinc-300 font-medium text-center truncate w-full group-hover:text-white transition-colors">
                      {item.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* MOBILE LAYOUT: Horizontal scrollable social options row + Copy Link & More Options action bar below */}
          <div className="md:hidden space-y-4">
            <div className="flex items-start gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5 scroll-smooth">
              {sharePlatforms.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 shrink-0 w-14 group cursor-pointer"
                  >
                    <div
                      className={`w-12 h-12 rounded-full ${item.color} ${item.textColor} flex items-center justify-center shadow-md active:scale-95 transition-transform`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] text-zinc-300 font-medium text-center truncate w-full">
                      {item.name}
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-black hover:bg-zinc-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Link2 className="w-4 h-4" />}
                <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={handleMoreOptions}
                className="py-2.5 px-3.5 rounded-xl bg-white/12 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <MoreHorizontal className="w-4 h-4" />
                <span>More Options</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
