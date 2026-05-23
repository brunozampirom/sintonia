import { useWindowDimensions } from 'react-native';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isDesktop = width >= 1024;

  // Scale factor for fonts/spacing: 1.0 on phone, ~1.25 on tablet, ~1.4 on desktop
  const scale = isTablet ? (isDesktop ? 1.4 : 1.25) : 1.0;

  // Max content width to prevent content from stretching too wide
  const containerMaxWidth = isTablet ? 800 : undefined;

  // Dial size: 300 on phone, larger on tablet
  const dialSize = isTablet ? (isLandscape ? 380 : 420) : 300;

  return { width, height, isLandscape, isTablet, isDesktop, scale, containerMaxWidth, dialSize };
}
