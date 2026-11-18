import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ThumbsUp } from 'lucide-react';

export type EmojiReactionType = 'neutral_face' | 'grin_face' | 'heart_eyes';

interface MobileReactionButtonProps {
  showId: string;
  styleMode?: 'thumbs' | 'emoji';
  isLiked: boolean;
  onToggleLike: (forcedLiked?: boolean) => void;
  hideLabel?: boolean;
}

/* Hollow resting outline face shown before user picks any emoji */
const HollowOutlineIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9.5" />
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
    <path d="M8.5 14.5c1 1.7 2.3 2.5 3.5 2.5s2.5-.8 3.5-2.5" />
  </svg>
);

/* 1. Circular golden-yellow Neutral Face (:|) */
const SquircleNeutralEmoji: React.FC<{ className?: string; animated?: boolean }> = ({
  className = 'w-6 h-6',
  animated = false
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} ${animated ? 'emoji-anim-neutral' : ''}`}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="emojiYellowGradNeutral" cx="42%" cy="34%" r="68%">
        <stop offset="0%" stopColor="#FFE135" />
        <stop offset="65%" stopColor="#FFC800" />
        <stop offset="100%" stopColor="#F5B200" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#emojiYellowGradNeutral)" />
    <circle cx="21.5" cy="27.5" r="3.8" fill="#4A2506" />
    <circle cx="42.5" cy="27.5" r="3.8" fill="#4A2506" />
    <rect x="18" y="40.5" width="28" height="4.8" rx="2.4" fill="#4A2506" />
  </svg>
);

/* 2. Circular golden-yellow Big Happy Grin Face (^_^) */
const SquircleGrinEmoji: React.FC<{ className?: string; animated?: boolean }> = ({
  className = 'w-6 h-6',
  animated = false
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} ${animated ? 'emoji-anim-grin' : ''}`}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="emojiYellowGradGrin" cx="42%" cy="34%" r="68%">
        <stop offset="0%" stopColor="#FFE135" />
        <stop offset="65%" stopColor="#FFC800" />
        <stop offset="100%" stopColor="#F5B200" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#emojiYellowGradGrin)" />
    {/* Happy arched brown eyes */}
    <path d="M16.5 28c0-4.2 3-7 4.8-7s4.8 2.8 4.8 7c-1.4-1.4-3.1-2-4.8-2s-3.4.6-4.8 2z" fill="#4A2506" />
    <path d="M37.9 28c0-4.2 3-7 4.8-7s4.8 2.8 4.8 7c-1.4-1.4-3.1-2-4.8-2s-3.4.6-4.8 2z" fill="#4A2506" />
    {/* Big grin mouth with upper white teeth & red tongue */}
    <path d="M15 35.5c9.5 1.4 24.5 1.4 34 0-.7 9.6-7.8 15.5-17 15.5s-16.3-5.9-17-15.5z" fill="#4A2506" />
    <path d="M17 36.2c9 1.1 21 1.1 30 0-.6 2.1-2.4 3.1-5 3.3-6.7.4-13.3.4-20 0-2.6-.2-4.4-1.2-5-3.3z" fill="#FFFFFF" />
    <path d="M23.8 47.9c2.1-2.6 5-4 8.2-4s6.1 1.4 8.2 4c-2.4 1.8-5.2 2.7-8.2 2.7s-5.8-.9-8.2-2.7z" fill="#E11D24" />
  </svg>
);

/* 3. Circular golden-yellow Heart-Eyes Face (😍) */
const SquircleHeartEyesEmoji: React.FC<{ className?: string; animated?: boolean }> = ({
  className = 'w-6 h-6',
  animated = false
}) => (
  <svg
    viewBox="0 0 64 64"
    className={`${className} ${animated ? 'emoji-anim-love' : ''}`}
    aria-hidden="true"
  >
    <defs>
      <radialGradient id="emojiYellowGradLove" cx="42%" cy="34%" r="68%">
        <stop offset="0%" stopColor="#FFE135" />
        <stop offset="65%" stopColor="#FFC800" />
        <stop offset="100%" stopColor="#F5B200" />
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="28" fill="url(#emojiYellowGradLove)" />
    {/* Left tilted red heart eye */}
    <path
      d="M20.2 33.2c-4.7-3.9-9-7.3-9.7-11.5-.5-3.5 2.1-6.2 5.3-6.2 2 0 3.7 1.1 4.4 2.7.7-1.6 2.4-2.7 4.4-2.7 3.2 0 5.8 2.7 5.3 6.2-.7 4.2-5 7.6-9.7 11.5z"
      fill="#DC1E24"
      transform="rotate(-9 20.5 24)"
    />
    {/* Right tilted red heart eye */}
    <path
      d="M43.8 33.2c-4.7-3.9-9-7.3-9.7-11.5-.5-3.5 2.1-6.2 5.3-6.2 2 0 3.7 1.1 4.4 2.7.7-1.6 2.4-2.7 4.4-2.7 3.2 0 5.8 2.7 5.3 6.2-.7 4.2-5 7.6-9.7 11.5z"
      fill="#DC1E24"
      transform="rotate(9 43.5 24)"
    />
    {/* Happy open smile mouth with red tongue */}
    <path d="M19 39c8.5 1.5 17.5 1.5 26 0-.8 7.8-6.1 12.5-13 12.5S19.8 46.8 19 39z" fill="#4A2506" />
    <path d="M24.8 48.7c2-2.4 4.5-3.6 7.2-3.6s5.2 1.2 7.2 3.6c-2.1 1.5-4.6 2.3-7.2 2.3s-5.1-.8-7.2-2.3z" fill="#E11D24" />
  </svg>
);

const normalizeSavedReaction = (raw: string | null, isLiked: boolean): EmojiReactionType | null => {
  if (raw === 'neutral_face' || raw === 'grin_face' || raw === 'heart_eyes') return raw;
  if (raw === 'smile') return 'grin_face';
  if (raw === 'disappointed') return 'neutral_face';
  return isLiked ? 'grin_face' : null;
};

export const MobileReactionButton: React.FC<MobileReactionButtonProps> = ({
  showId,
  styleMode = 'thumbs',
  isLiked,
  onToggleLike,
  hideLabel = false
}) => {
  const storageKey = `dizi_emoji_reaction_${showId}`;
  const [reaction, setReaction] = useState<EmojiReactionType | null>(() => {
    try {
      return normalizeSavedReaction(localStorage.getItem(storageKey), isLiked);
    } catch {
      return isLiked ? 'grin_face' : null;
    }
  });

  useEffect(() => {
    try {
      setReaction(normalizeSavedReaction(localStorage.getItem(storageKey), isLiked));
    } catch {
      setReaction(isLiked ? 'grin_face' : null);
    }
  }, [showId, storageKey, isLiked]);

  const [isJumping, setIsJumping] = useState(false);
  const [isPillOpen, setIsPillOpen] = useState(false);
  const [hoveredPillOption, setHoveredPillOption] = useState<EmojiReactionType | null>(null);
  const [pillCoords, setPillCoords] = useState<{ left: number; top: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const holdTimerRef = useRef<number | null>(null);
  const longPressOpenedRef = useRef(false);
  const isPointerDownRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedOptionRef = useRef<EmojiReactionType | null>(null);
  const jumpTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
      if (jumpTimerRef.current) window.clearTimeout(jumpTimerRef.current);
    };
  }, []);

  const updatePillAnchor = useCallback(() => {
    const btn = triggerBtnRef.current || containerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const pillHalfWidth = 92;
    const minLeft = pillHalfWidth + 12;
    const maxLeft = Math.max(minLeft, (window.innerWidth || 360) - pillHalfWidth - 12);
    const clampedLeft = Math.min(maxLeft, Math.max(minLeft, rect.left + rect.width / 2));
    setPillCoords({
      left: clampedLeft,
      top: Math.max(58, rect.top - 10)
    });
  }, []);

  // Dismiss pill on outside tap/click or update position on scroll/resize
  useEffect(() => {
    if (!isPillOpen) return;
    updatePillAnchor();

    const handleOutside = (e: Event) => {
      const target = e.target as Node | null;
      const inContainer = Boolean(containerRef.current && target && containerRef.current.contains(target));
      const inPill = Boolean(pillRef.current && target && pillRef.current.contains(target));
      if (!inContainer && !inPill) {
        setIsPillOpen(false);
        setHoveredPillOption(null);
      }
    };

    const handleViewportChange = () => {
      updatePillAnchor();
    };

    document.addEventListener('pointerdown', handleOutside, true);
    window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handleOutside, true);
      window.removeEventListener('scroll', handleViewportChange, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', handleViewportChange);
    };
  }, [isPillOpen, updatePillAnchor]);

  const triggerJump = () => {
    if (jumpTimerRef.current) window.clearTimeout(jumpTimerRef.current);
    setIsJumping(true);
    jumpTimerRef.current = window.setTimeout(() => {
      setIsJumping(false);
      jumpTimerRef.current = null;
    }, 420);
  };

  const applyReaction = (next: EmojiReactionType | null, shouldJump = true) => {
    setReaction(next);
    try {
      if (next === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, next);
      }
    } catch {}
    onToggleLike(next === 'grin_face' || next === 'heart_eyes');
    if (shouldJump && next !== null) {
      triggerJump();
    }
    setIsPillOpen(false);
    setHoveredPillOption(null);
  };

  if (styleMode === 'thumbs') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleLike();
        }}
        className={`flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 active:scale-95 cursor-pointer shrink-0 py-1 ${
          hideLabel ? 'w-9' : 'w-11'
        }`}
        aria-label="Like"
      >
        <ThumbsUp
          className={`${hideLabel ? 'w-6 h-6' : 'w-5 h-5'} transition-colors ${
            isLiked ? 'text-red-500 fill-red-500 stroke-red-500' : 'text-white stroke-[2]'
          }`}
        />
        {!hideLabel && <span className="text-[10px] font-medium text-zinc-300">Like</span>}
      </button>
    );
  }

  const handleTouchOrPointerStart = (clientX: number, clientY: number) => {
    isPointerDownRef.current = true;
    longPressOpenedRef.current = false;
    draggedOptionRef.current = null;
    startPointRef.current = { x: clientX, y: clientY };
    setHoveredPillOption(null);
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = window.setTimeout(() => {
      longPressOpenedRef.current = true;
      updatePillAnchor();
      setIsPillOpen(true);
    }, 220);
  };

  const detectOptionAtPoint = (clientX: number, clientY: number): EmojiReactionType | null => {
    if (!pillRef.current) return null;
    const items = pillRef.current.querySelectorAll<HTMLElement>('[data-reaction-opt]');
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (
        clientX >= rect.left - 8 &&
        clientX <= rect.right + 8 &&
        clientY >= rect.top - 28 &&
        clientY <= rect.bottom + 28
      ) {
        const val = item.dataset.reactionOpt;
        if (val === 'neutral_face' || val === 'grin_face' || val === 'heart_eyes') {
          return val;
        }
      }
    }
    return null;
  };

  const handleMovePoint = (clientX: number, clientY: number) => {
    if (!isPointerDownRef.current) return;
    if (!longPressOpenedRef.current) {
      const dx = Math.abs(clientX - startPointRef.current.x);
      const dy = Math.abs(clientY - startPointRef.current.y);
      if (dx > 20 || dy > 28) {
        if (holdTimerRef.current) {
          window.clearTimeout(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        isPointerDownRef.current = false;
      }
      return;
    }
    const hit = detectOptionAtPoint(clientX, clientY);
    draggedOptionRef.current = hit;
    setHoveredPillOption(hit);
  };

  const handleEndPoint = () => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isPointerDownRef.current && longPressOpenedRef.current && draggedOptionRef.current) {
      const chosen = draggedOptionRef.current;
      isPointerDownRef.current = false;
      applyReaction(chosen, true);
      return;
    }
    isPointerDownRef.current = false;
  };

  // Tapping the emoji button opens the 3-emoji tray (or toggles it closed if already open)
  const handleTapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (longPressOpenedRef.current) {
      longPressOpenedRef.current = false;
      return;
    }
    if (isPillOpen) {
      setIsPillOpen(false);
      return;
    }
    updatePillAnchor();
    setIsPillOpen(true);
  };

  const activeLabel =
    reaction === 'heart_eyes'
      ? 'Loved'
      : reaction === 'grin_face'
      ? 'Liked'
      : reaction === 'neutral_face'
      ? 'Okay'
      : 'Like';

  const pillNode =
    isPillOpen && pillCoords && typeof document !== 'undefined'
      ? createPortal(
          <>
            <style>{`
              @keyframes emojiTrayPopIn {
                0% { opacity: 0; transform: translate(-50%, -85%) scale(0.84); }
                65% { opacity: 1; transform: translate(-50%, -102%) scale(1.03); }
                100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
              }
              @keyframes emojiItemStaggerPop {
                0% { opacity: 0; transform: translateY(10px) scale(0.5); }
                70% { opacity: 1; transform: translateY(-4px) scale(1.14); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes emojiNeutralFloat {
                0%, 100% { transform: rotate(0deg) translateY(0); }
                25% { transform: rotate(-6deg) translateY(-1.5px); }
                75% { transform: rotate(6deg) translateY(-1.5px); }
              }
              @keyframes emojiGrinBounce {
                0%, 100% { transform: translateY(0) scale(1); }
                40% { transform: translateY(-3.5px) scale(1.08) rotate(-4deg); }
                70% { transform: translateY(-1px) scale(1.04) rotate(4deg); }
              }
              @keyframes emojiLovePulse {
                0%, 100% { transform: scale(1) rotate(0deg); }
                30% { transform: scale(1.16) rotate(-5deg); }
                60% { transform: scale(1.06) rotate(5deg); }
                80% { transform: scale(1.14) rotate(-2deg); }
              }
              .emoji-anim-neutral { animation: emojiNeutralFloat 1.9s ease-in-out infinite; }
              .emoji-anim-grin { animation: emojiGrinBounce 1.4s ease-in-out infinite; }
              .emoji-anim-love { animation: emojiLovePulse 1.3s ease-in-out infinite; }
            `}</style>
            <div
              ref={pillRef}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${pillCoords.left}px`,
                top: `${pillCoords.top}px`,
                zIndex: 9999,
                animation: 'emojiTrayPopIn 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards'
              }}
              className="px-3 py-2 rounded-full bg-[#242427]/95 backdrop-blur-md border border-white/15 shadow-[0_14px_34px_rgba(0,0,0,0.92)] flex items-center gap-3 select-none"
            >
              {(
                [
                  { id: 'neutral_face' as const, label: 'Okay', Emoji: SquircleNeutralEmoji, delay: 0 },
                  { id: 'grin_face' as const, label: 'Like', Emoji: SquircleGrinEmoji, delay: 50 },
                  { id: 'heart_eyes' as const, label: 'Love it', Emoji: SquircleHeartEyesEmoji, delay: 100 }
                ]
              ).map(({ id, label, Emoji, delay }) => {
                const isHighlighted = hoveredPillOption === id || (!hoveredPillOption && reaction === id);
                return (
                  <button
                    key={id}
                    type="button"
                    data-reaction-opt={id}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Re-clicking active emoji resets back to hollow outline; otherwise apply selected emoji
                      if (reaction === id) {
                        applyReaction(null, false);
                      } else {
                        applyReaction(id, true);
                      }
                    }}
                    aria-label={label}
                    style={{
                      animation: `emojiItemStaggerPop 300ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-150 cursor-pointer ${
                      isHighlighted
                        ? 'bg-yellow-400/20 scale-125 ring-1 ring-yellow-400/50'
                        : 'bg-transparent hover:bg-white/10 hover:scale-115 active:scale-95'
                    }`}
                  >
                    <Emoji className="w-7 h-7" animated={true} />
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative ${hideLabel ? 'w-9' : 'w-11'} shrink-0 flex flex-col items-center justify-center`}>
      {pillNode}

      <button
        ref={triggerBtnRef}
        type="button"
        style={{ WebkitTouchCallout: 'none', WebkitUserSelect: 'none' }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!isPillOpen) {
            updatePillAnchor();
            setIsPillOpen(true);
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleTouchOrPointerStart(e.clientX, e.clientY);
        }}
        onMouseMove={(e) => handleMovePoint(e.clientX, e.clientY)}
        onMouseUp={() => handleEndPoint()}
        onMouseLeave={() => {
          if (isPointerDownRef.current && !longPressOpenedRef.current) {
            if (holdTimerRef.current) {
              window.clearTimeout(holdTimerRef.current);
              holdTimerRef.current = null;
            }
            isPointerDownRef.current = false;
          }
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (e.touches[0]) {
            handleTouchOrPointerStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches[0]) {
            handleMovePoint(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onTouchEnd={() => handleEndPoint()}
        onTouchCancel={() => handleEndPoint()}
        onClick={handleTapClick}
        className={`flex flex-col items-center justify-center gap-1 text-white hover:text-white/80 cursor-pointer shrink-0 py-1 select-none ${
          hideLabel ? 'w-9' : 'w-11'
        }`}
        aria-label={activeLabel}
      >
        <div
          className={`transition-transform duration-300 ease-out will-change-transform ${
            isJumping ? '-translate-y-3 scale-130' : 'translate-y-0 scale-100'
          }`}
        >
          {reaction === 'heart_eyes' ? (
            <SquircleHeartEyesEmoji className={hideLabel ? 'w-6 h-6' : 'w-5 h-5'} animated={isJumping} />
          ) : reaction === 'grin_face' ? (
            <SquircleGrinEmoji className={hideLabel ? 'w-6 h-6' : 'w-5 h-5'} animated={isJumping} />
          ) : reaction === 'neutral_face' ? (
            <SquircleNeutralEmoji className={hideLabel ? 'w-6 h-6' : 'w-5 h-5'} animated={isJumping} />
          ) : (
            <HollowOutlineIcon className={`${hideLabel ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
          )}
        </div>
        {!hideLabel && (
          <span className="text-[10px] font-medium whitespace-nowrap leading-none text-zinc-300 transition-colors">
            {activeLabel}
          </span>
        )}
      </button>
    </div>
  );
};
