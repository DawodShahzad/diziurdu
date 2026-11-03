import React, { useState, useEffect } from 'react';
import { Show } from '../types';
import { X, Copy, Check, Share2, MessageCircle, Send, Mail } from 'lucide-react';

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

  const slug = show.slug || show.id;
  // Always use diziurdu.com domain for public sharing links as requested
  const shareUrl = `https://diziurdu.com/watch/${slug}`;
  
  // Exact title format requested: "Abc - Dizi Urdu"
  const shareTitle = `${show.title} - Dizi Urdu`;

  // Always use admin-added backdrop first
  const shareBackdrop =
    show.backdropUrl ||
    show.posterLandscapeUrl ||
    show.posterVerticalUrl ||
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1920&q=80';

  // Description line with maturity rating, genre, year, number of episodes/seasons and admin detail
  const maturity = show.maturityRating || '16+';
  const genreList = Array.isArray(show.genres) && show.genres.length > 0 ? show.genres.join(', ') : 'Drama';
  const year = show.releaseYear || '2025';
  const durationOrSeasons =
    show.type === 'series'
      ? (show.durationOrSeasons || (show.seasons && show.seasons.length > 0 ? `${show.seasons.length} Season${show.seasons.length > 1 ? 's' : ''}` : '1 Season'))
      : (show.durationOrSeasons || 'Feature Film');
  const details = show.synopsis || show.shortDescription || '';

  const shareDescription = `${maturity} • ${genreList} • ${year} • ${durationOrSeasons}${details ? ` • ${details}` : ''}`;

  // Sync document head OpenGraph & Twitter tags when share modal is active
  useEffect(() => {
    if (!isOpen) return;
    const prevTitle = document.title;
    document.title = shareTitle;

    const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
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
    setMeta('property', 'og:image', shareBackdrop);
    setMeta('property', 'og:url', shareUrl);
    setMeta('property', 'og:site_name', 'Dizi Urdu');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', shareTitle);
    setMeta('name', 'twitter:description', shareDescription);
    setMeta('name', 'twitter:image', shareBackdrop);

    return () => {
      document.title = prevTitle;
    };
  }, [isOpen, shareTitle, shareDescription, shareBackdrop, shareUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl
        });
      } catch {}
    }
  };

  const sharePlatforms = [
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
      name: 'X (Twitter)',
      icon: () => (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'bg-black hover:bg-zinc-800 border border-white/20',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareTitle}\n${shareDescription}`)}&url=${encodeURIComponent(shareUrl)}`
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
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(shareBackdrop)}&description=${encodeURIComponent(`${shareTitle} - ${shareDescription}`)}`
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
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#20ba59]',
      textColor: 'text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareTitle}\n${shareDescription}\n${shareUrl}`)}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#0088cc] hover:bg-[#0077b5]',
      textColor: 'text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${shareTitle}\n${shareDescription}`)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-zinc-700 hover:bg-zinc-600',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)}`
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#16171d] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Share Title</h3>
              <p className="text-xs text-zinc-400">Share with friends, family & social channels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Show Preview Card with Admin-added Backdrop */}
        <div className="flex items-center gap-3.5 my-4 p-3 rounded-xl bg-white/[0.04] border border-white/10">
          <img
            src={shareBackdrop}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="w-24 h-14 rounded-lg object-cover shrink-0 bg-zinc-800 shadow-sm border border-white/10"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{shareTitle}</h4>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className="px-1.5 py-0.2 rounded bg-blue-600/80 text-white font-bold text-[10px]">
                {maturity}
              </span>
              <span className="text-[11px] text-zinc-300 truncate">
                {genreList} • {year} • {durationOrSeasons}
              </span>
            </div>
            {details && (
              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">{details}</p>
            )}
          </div>
        </div>

        {/* Social Platforms Row (FB, X, Pinterest, LinkedIn, WhatsApp, Telegram, Email) */}
        <div className="my-4">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
            Share on All Apps & Platforms
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {sharePlatforms.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer p-1"
                >
                  <div className={`w-11 h-11 rounded-full ${item.color} ${item.textColor} flex items-center justify-center shadow-md active:scale-95 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-zinc-300 font-medium text-center truncate w-full group-hover:text-white transition-colors">
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* Copy Link Section (showing diziurdu.com URL) */}
        <div className="mt-4 pt-3.5 border-t border-white/10">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Website Link
            </label>
            <span className="text-[10px] text-emerald-400 font-mono font-medium">diziurdu.com</span>
          </div>
          <div className="flex items-center gap-2 bg-[#101115] border border-white/10 rounded-xl p-1.5 pl-3">
            <span className="text-xs text-zinc-300 truncate flex-1 font-mono">
              {shareUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-black hover:bg-zinc-200 active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Native Web Share button (for mobile sheet with Instagram, Messenger, AirDrop, etc.) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <div className="mt-3">
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More sharing options (Mobile Apps)...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
