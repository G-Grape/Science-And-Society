import { useState, useEffect } from 'react';

// ─── Singleton detection: compute ONCE synchronously, share everywhere ──────
// By detecting synchronously (before first render), we avoid the flash of
// heavy animations that the old useEffect-based approach had.

function detectDevice() {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false, isHeavyAnimationSafe: true };

  const isMobile = window.innerWidth < 768;

  // User requested to force all animations and features on every device.
  // We keep isMobile accurate for responsive layout, but disable the performance gates.
  const isLowEnd = false;
  const isHeavyAnimationSafe = true;

  return { isMobile, isLowEnd, isHeavyAnimationSafe };
}

// Cache the result so we detect only once per page load
let cachedDetection = null;
function getDetection() {
  if (!cachedDetection) {
    cachedDetection = detectDevice();
  }
  return cachedDetection;
}

export function useDeviceDetect() {
  // Initialize synchronously from cache — no useState flash
  const initial = getDetection();
  const [state, setState] = useState(initial);

  useEffect(() => {
    // Update mobile status on resize only (hardware capabilities don't change)
    const handleResize = () => {
      setState(prev => ({ ...prev, isMobile: window.innerWidth < 768 }));
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}
