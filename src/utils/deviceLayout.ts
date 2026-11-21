import { useState, useEffect } from 'react';

export interface DeviceLayoutInfo {
  isMobile: boolean;
  isTablet: boolean;
  width: number;
  height: number;
}

/**
 * Determines whether the current viewport / device should use Mobile Layout.
 * Preserves Mobile Layout even when a smartphone (touch/coarse pointer or mobile UA)
 * is rotated into landscape orientation (e.g., 844x390 or 932x430) where width > 768px.
 */
export const detectIsMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w <= 768) return true;

  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches);
  const isMobileUA =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Smartphones rotated horizontally have tall aspect ratio inverted (short height <= 560px) and width < 1080px
  if ((isCoarsePointer || isMobileUA) && Math.min(w, h) <= 560 && w < 1080) {
    return true;
  }

  return false;
};

export const detectIsTabletDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (detectIsMobileDevice()) return false;
  return window.innerWidth < 1024;
};

export const useDeviceLayout = (): DeviceLayoutInfo => {
  const [layout, setLayout] = useState<DeviceLayoutInfo>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const isMobile = detectIsMobileDevice();
    const isTablet = !isMobile && w < 1024;
    return { isMobile, isTablet, width: w, height: h };
  });

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isMobile = detectIsMobileDevice();
      const isTablet = !isMobile && w < 1024;
      setLayout((prev) =>
        prev.isMobile === isMobile &&
        prev.isTablet === isTablet &&
        prev.width === w &&
        prev.height === h
          ? prev
          : { isMobile, isTablet, width: w, height: h }
      );
    };

    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener('resize', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      if (vv) vv.removeEventListener('resize', update);
    };
  }, []);

  return layout;
};
