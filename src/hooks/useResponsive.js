import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint values (matches Bootstrap)
 */
export const BREAKPOINTS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400
};

/**
 * Hook for responsive design - tracks screen size and provides utilities
 * @returns {Object} Responsive utilities
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const { width } = windowSize;

  return {
    // Window dimensions
    width: windowSize.width,
    height: windowSize.height,

    // Breakpoint checks
    isXs: width < BREAKPOINTS.sm,
    isSm: width >= BREAKPOINTS.sm && width < BREAKPOINTS.md,
    isMd: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isLg: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
    isXl: width >= BREAKPOINTS.xl && width < BREAKPOINTS.xxl,
    isXxl: width >= BREAKPOINTS.xxl,

    // Common checks
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,

    // Min-width checks (like Bootstrap's @media (min-width))
    isSmUp: width >= BREAKPOINTS.sm,
    isMdUp: width >= BREAKPOINTS.md,
    isLgUp: width >= BREAKPOINTS.lg,
    isXlUp: width >= BREAKPOINTS.xl,

    // Max-width checks (like Bootstrap's @media (max-width))
    isSmDown: width < BREAKPOINTS.md,
    isMdDown: width < BREAKPOINTS.lg,
    isLgDown: width < BREAKPOINTS.xl,

    // Current breakpoint name
    breakpoint: width < BREAKPOINTS.sm ? 'xs' :
                width < BREAKPOINTS.md ? 'sm' :
                width < BREAKPOINTS.lg ? 'md' :
                width < BREAKPOINTS.xl ? 'lg' :
                width < BREAKPOINTS.xxl ? 'xl' : 'xxl'
  };
};

/**
 * Hook for media query matching
 * @param {string} query - CSS media query string
 * @returns {boolean} Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

export default useResponsive;
