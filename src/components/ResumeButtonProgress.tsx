import React from 'react';

interface ResumeButtonProgressProps {
  label: string;
  progressPercent?: number;
  className?: string;
  textClassName?: string;
}

/**
 * Renders the play / resume button label with a thin horizontal progress bar directly
 * under the text (grey track with black fill), exactly matching image_f72bd3ca.png.
 */
export const ResumeButtonProgress: React.FC<ResumeButtonProgressProps> = ({
  label,
  progressPercent,
  className = '',
  textClassName = ''
}) => {
  const hasProgress = progressPercent !== undefined && progressPercent > 0;

  return (
    <div className={`flex flex-col items-start leading-none ${className}`}>
      <span className={`tracking-wide font-bold ${textClassName}`}>{label}</span>
      {hasProgress && (
        <div className="w-full h-[2.5px] bg-black/25 rounded-full mt-1 overflow-hidden pointer-events-none">
          <div
            className="h-full bg-black rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
          />
        </div>
      )}
    </div>
  );
};
