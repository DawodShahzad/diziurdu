import React from 'react';

interface ShareArrowIconProps {
  className?: string;
}

/**
 * Curved forward-pointing outline Share arrow icon
 */
export const ShareArrowIcon: React.FC<ShareArrowIconProps> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M13.5 9V4.5L21 12l-7.5 7.5V15c-4.8 0-8.2 1.5-10.5 4.8.9-4.9 3.9-9.8 10.5-10.8z" />
  </svg>
);
