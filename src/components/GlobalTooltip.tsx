import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
  arrowOffset: number;
}

export const GlobalTooltip: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let currentTarget: HTMLElement | null = null;

    const updateTooltipForTarget = (target: HTMLElement) => {
      // Suppress native browser tooltip by moving title to data-tooltip immediately
      const titleAttr = target.getAttribute('title');
      if (titleAttr && titleAttr.trim()) {
        target.setAttribute('data-tooltip', titleAttr.trim());
        target.removeAttribute('title');
      }

      const text = target.getAttribute('data-tooltip');
      if (!text || !text.trim() || target.hasAttribute('data-no-tooltip')) {
        setTooltip((prev) => (prev ? null : null));
        return;
      }

      const rect = target.getBoundingClientRect();
      const placeOnBottom = rect.top < 45;
      const targetCenterX = rect.left + rect.width / 2;

      const x = Math.max(12, Math.min(window.innerWidth - 12, targetCenterX));
      const y = placeOnBottom ? rect.bottom + 8 : rect.top - 8;
      const placement = placeOnBottom ? 'bottom' : 'top';

      setTooltip((prev) => {
        if (
          prev &&
          prev.text === text.trim() &&
          Math.abs(prev.x - x) < 1 &&
          Math.abs(prev.y - y) < 1 &&
          prev.placement === placement
        ) {
          return prev;
        }
        return {
          text: text.trim(),
          x,
          y,
          placement,
          arrowOffset: 0
        };
      });
    };

    let clickedElement: HTMLElement | null = null;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-tooltip], [title], button') as HTMLElement | null;
      if (
        !target ||
        target === clickedElement ||
        (clickedElement && (clickedElement === target || clickedElement.contains(target) || target.contains(clickedElement))) ||
        target.tagName.toLowerCase() === 'iframe' ||
        target.hasAttribute('data-no-tooltip')
      ) {
        setTooltip(null);
        currentTarget = null;
        return;
      }

      // Immediately remove title attribute to prevent the browser from showing its own duplicate native tooltip
      if (target.hasAttribute('title')) {
        const t = target.getAttribute('title');
        if (t && t.trim()) target.setAttribute('data-tooltip', t.trim());
        target.removeAttribute('title');
      }

      currentTarget = target;
      updateTooltipForTarget(target);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (clickedElement) {
        if (!related || (!clickedElement.contains(related) && related !== clickedElement)) {
          clickedElement = null; // Reset only when mouse genuinely exits the clicked button
        }
      }

      const target = (e.target as HTMLElement).closest('[data-tooltip], [title], button');
      if (target && target === currentTarget) {
        if (!related || (!currentTarget.contains(related) && related !== currentTarget)) {
          setTooltip(null);
          currentTarget = null;
        }
      }
    };

    const handleDismissOnClick = (e: MouseEvent) => {
      // Current tooltip disappears when user clicks the button.
      // The updated tooltip only shows when user hovers over the button again, not on the same hover.
      const target = (e.target as HTMLElement).closest('button, [data-tooltip], [title], a') as HTMLElement | null;
      if (target) {
        clickedElement = target;
      }
      setTooltip(null);
      currentTarget = null;
    };

    const handleWindowScroll = () => {
      setTooltip(null);
      currentTarget = null;
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    document.addEventListener('mousedown', handleDismissOnClick, { passive: true });
    document.addEventListener('click', handleDismissOnClick, { passive: true });
    window.addEventListener('scroll', handleWindowScroll, { passive: true, capture: true });

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('mousedown', handleDismissOnClick);
      document.removeEventListener('click', handleDismissOnClick);
      window.removeEventListener('scroll', handleWindowScroll, { capture: true });
    };
  }, []);

  if (!tooltip || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        top: `${tooltip.y}px`,
        left: `${tooltip.x}px`,
        transform: tooltip.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)'
      }}
      className="fixed z-[999999] pointer-events-none transition-opacity duration-150 animate-in fade-in select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
    >
      <div className="relative bg-white text-black font-semibold text-[13.5px] px-3.5 py-1.5 rounded-[6px] font-sans tracking-normal whitespace-nowrap leading-snug">
        {tooltip.text}
        {/* Seamless caret without any dark line or gap */}
        {tooltip.placement === 'top' ? (
          <svg
            className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-3.5 h-1.5 fill-white pointer-events-none block overflow-visible"
            viewBox="0 0 14 6"
          >
            <path d="M0 0 L7 6 L14 0 Z" />
          </svg>
        ) : (
          <svg
            className="absolute bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-3.5 h-1.5 fill-white pointer-events-none block overflow-visible"
            viewBox="0 0 14 6"
          >
            <path d="M0 6 L7 0 L14 6 Z" />
          </svg>
        )}
      </div>
    </div>,
    document.body
  );
};

export const Tooltip: React.FC<{
  content: string;
  children: React.ReactElement;
}> = ({ content, children }) => {
  return React.cloneElement(children, {
    'data-tooltip': content
  } as any);
};
