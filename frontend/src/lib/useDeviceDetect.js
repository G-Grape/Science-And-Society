import { useState, useEffect } from 'react';

// ─── Singleton detection: compute ONCE synchronously, share everywhere ──────
// By detecting synchronously (before first render), we avoid the flash of
// heavy animations that the old useEffect-based approach had.

function detectDevice() {
  if (typeof window === 'undefined') return { isMobile: false, isLowEnd: false, isHeavyAnimationSafe: true };

  // 1. Touch/Pointer Check (catches "Desktop Site" mode on mobile)
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    || 'ontouchstart' in window
    || navigator.maxTouchPoints > 0;

  // 2. User Agent check (catches phones spoofing desktop viewport)
  const ua = navigator.userAgent.toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);

  // 3. CPU cores — flag as low-end if ≤ 4 cores (covers most budget/mid phones)
  const logicalCores = navigator.hardwareConcurrency || 4;
  const isLowCoreCPU = logicalCores <= 4;

  // 4. Memory — flag if < 4GB (covers low-end and many mid-range devices)
  const deviceMemory = navigator.deviceMemory || 4;
  const isLowMemory = deviceMemory < 4;

  // 5. Viewport width
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
