import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const slug = show.slug || show.id;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/watch/${slug}`
    : `https://diziurdu.com/watch/${slug}`;

  const shareTitle = `${show.title} – Watch on ${platformName}`;
  const shareText = `Watch "${show.title}" with Urdu dubbed episodes and official trailers on ${platformName}!`;

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
          text: shareText,
          url: shareUrl
        });
      } catch {}
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-[#25D366] hover:bg-[#20ba59]',
      textColor: 'text-white',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
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
      name: 'X (Twitter)',
      icon: () => (
        <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'bg-black hover:bg-zinc-800 border border-white/20',
      textColor: 'text-white',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-[#0088cc] hover:bg-[#0077b5]',
      textColor: 'text-white',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-zinc-700 hover:bg-zinc-600',
      textColor: 'text-white',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#16171d] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl relative select-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Share Title</h3>
              <p className="text-xs text-zinc-400">Share with friends & family</p>
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

        {/* Show Preview Card */}
        <div className="flex items-center gap-3.5 my-4 p-2.5 rounded-xl bg-white/[0.04] border border-white/5">
          <img
            src={show.posterLandscapeUrl || show.backdropUrl || show.posterVerticalUrl}
            alt={show.title}
            referrerPolicy="no-referrer"
            className="w-20 h-12 rounded-lg object-cover shrink-0 bg-zinc-800"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{show.title}</h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              {show.releaseYear.split('-')[0]} • {show.genres[0] || 'Drama'} • {show.maturityRating}
            </p>
          </div>
        </div>

        {/* Social Platforms Row */}
        <div className="my-5">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
            Share via
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {shareLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 group cursor-pointer"
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

        {/* Copy Link Section */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Page Link
          </label>
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

        {/* Native Web Share button (if supported on device, e.g. mobile) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <div className="mt-3">
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>More sharing options...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
