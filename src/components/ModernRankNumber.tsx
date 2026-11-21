import React, { useId } from 'react';

interface ModernRankNumberProps {
  rank: number;
  className?: string;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  fadeRight?: boolean;
  style?: React.CSSProperties;
}

/**
 * Renders crisp Netflix/Apple-TV-style outlined Top 10 rank numbers using SVG `paintOrder="stroke fill"`.
 * Prevents the Chromium double-inner-contour artifact produced by CSS `-webkit-text-stroke`.
 * Supports optional right-edge shadow fade (`fadeRight`) where the digit tucks behind the poster card.
 */
export const ModernRankNumber: React.FC<ModernRankNumberProps> = ({
  rank,
  className = '',
  fillColor = '#141414',
  strokeColor = '#73737a',
  strokeWidth = 6,
  strokeLinejoin = 'round',
  fadeRight = false,
  style
}) => {
  const uid = useId().replace(/:/g, '');
  const strokeGradId = `rank-stroke-fade-${uid}`;
  const isTwoDigit = rank >= 10;
  const viewBox = isTwoDigit ? '0 0 136 140' : '0 0 88 140';
  const resolvedStroke = fadeRight ? `url(#${strokeGradId})` : strokeColor;

  const sharedTextProps: React.SVGProps<SVGTextElement> = {
    fill: fillColor,
    stroke: resolvedStroke,
    strokeWidth,
    strokeLinejoin,
    strokeLinecap: strokeLinejoin === 'miter' ? 'square' : 'round',
    fontSize: 132,
    fontWeight: 900,
    fontFamily: 'Inter, "SF Pro Display", system-ui, -apple-system, sans-serif',
    style: { paintOrder: 'stroke fill' }
  };

  return (
    <svg
      viewBox={viewBox}
      aria-label={`Rank ${rank}`}
      className={`select-none pointer-events-none shrink-0 overflow-visible ${className}`}
      style={style}
    >
      {fadeRight && (
        <defs>
          <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="48%" stopColor={strokeColor} stopOpacity="0.9" />
            <stop offset="76%" stopColor={strokeColor} stopOpacity="0.34" />
            <stop offset="94%" stopColor={strokeColor} stopOpacity="0.06" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {isTwoDigit ? (
        <>
          <text x="27" y="122" textAnchor="middle" {...sharedTextProps}>
            {Math.floor(rank / 10)}
          </text>
          <text x="86" y="122" textAnchor="middle" {...sharedTextProps}>
            {rank % 10}
          </text>
        </>
      ) : (
        <text x="45" y="122" textAnchor="middle" {...sharedTextProps}>
          {rank}
        </text>
      )}
    </svg>
  );
};
