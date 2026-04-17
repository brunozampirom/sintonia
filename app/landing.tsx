import { GameColors } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

function SpectrumArc() {
  const arcRadius = 120;
  const cx = 160;
  const cy = 140;
  const startAngle = 10;
  const endAngle = 170;

  function polarToCart(angle: number, r: number) {
    const rad = ((180 - angle) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  const s = polarToCart(startAngle, arcRadius);
  const e = polarToCart(endAngle, arcRadius);
  const d = `M ${s.x} ${s.y} A ${arcRadius} ${arcRadius} 0 0 1 ${e.x} ${e.y}`;

  return (
    <Svg width={320} height={160} viewBox="0 0 320 160">
      <Defs>
        <LinearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={GameColors.mint} />
          <Stop offset="0.2" stopColor="#AAC573" />
          <Stop offset="0.4" stopColor={GameColors.yellow} />
          <Stop offset="0.6" stopColor={GameColors.accent} />
          <Stop offset="0.8" stopColor={GameColors.coral} />
          <Stop offset="1" stopColor={GameColors.pink} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill="none" stroke="url(#specGrad)" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
      <Path d={d} fill="none" stroke="url(#specGrad)" strokeWidth={16} strokeLinecap="round" opacity={0.15} />
    </Svg>
  );
}

interface FeatureCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  desc: string;
  index: number;
}

function FeatureCard({ icon, color, title, desc, index }: FeatureCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(500).delay(600 + index * 100)}
      style={styles.featureCard}
    >
      <View style={[styles.featureIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </Animated.View>
  );
}

export default function LandingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isTablet, containerMaxWidth } = useResponsiveLayout();

  const responsiveContainer = {
    maxWidth: isTablet ? containerMaxWidth : 600,
    alignSelf: 'center' as const,
    width: '100%' as const,
  };

  const features: FeatureCardProps[] = [
    {
      icon: 'people-outline',
      color: GameColors.sky,
      title: t('landing.features.samePhone.title'),
      desc: t('landing.features.samePhone.desc'),
      index: 0,
    },
    {
      icon: 'color-palette-outline',
      color: GameColors.pink,
      title: t('landing.features.spectrums.title'),
      desc: t('landing.features.spectrums.desc'),
      index: 1,
    },
    {
      icon: 'language-outline',
      color: GameColors.accent,
      title: t('landing.features.bilingual.title'),
      desc: t('landing.features.bilingual.desc'),
      index: 2,
    },
    {
      icon: 'create-outline',
      color: GameColors.secondary,
      title: t('landing.features.custom.title'),
      desc: t('landing.features.custom.desc'),
      index: 3,
    },
  ];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.heroSection}>
        <Animated.View entering={FadeInDown.duration(800).delay(100)} style={responsiveContainer}>
          <View style={styles.arcWrap}>
            <SpectrumArc />
          </View>
          <Text style={styles.heroTitle}>WAVELENGTH</Text>
          <Text style={styles.heroSubtitle}>{t('landing.hero.subtitle')}</Text>
          <Text style={styles.heroTagline}>{t('landing.hero.tagline')}</Text>
        </Animated.View>
      </View>

      {/* How it works */}
      <View style={[styles.section, responsiveContainer]}>
        <Animated.Text entering={FadeInDown.duration(500).delay(300)} style={styles.sectionTitle}>
          {t('landing.howItWorks.title')}
        </Animated.Text>
        <View style={styles.stepsRow}>
          {(['step1', 'step2', 'step3'] as const).map((key, i) => (
            <Animated.View
              key={key}
              entering={FadeInDown.duration(500).delay(400 + i * 100)}
              style={styles.stepCard}
            >
              <View style={[styles.stepBadge, { borderColor: [GameColors.sky, GameColors.accent, GameColors.secondary][i] }]}>
                <Text style={[styles.stepBadgeText, { color: [GameColors.sky, GameColors.accent, GameColors.secondary][i] }]}>
                  {i + 1}
                </Text>
              </View>
              <Text style={styles.stepTitle}>{t(`landing.howItWorks.${key}.title`)}</Text>
              <Text style={styles.stepDesc}>{t(`landing.howItWorks.${key}.desc`)}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Features */}
      <View style={[styles.section, responsiveContainer]}>
        <Animated.Text entering={FadeInDown.duration(500).delay(500)} style={styles.sectionTitle}>
          {t('landing.features.title')}
        </Animated.Text>
        <View style={styles.featuresGrid}>
          {features.map((f) => (
            <FeatureCard key={f.icon} {...f} />
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={[styles.ctaSection, responsiveContainer]}>
        <Animated.View entering={FadeInUp.duration(600).delay(800)}>
          <Text style={styles.ctaTitle}>{t('landing.cta.title')}</Text>
          <Text style={styles.ctaSubtitle}>{t('landing.cta.subtitle')}</Text>

          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/')}
          >
            <Text style={styles.ctaButtonText}>{t('landing.cta.playNow')}</Text>
          </Pressable>

          <View style={styles.storeBadges}>
            <Pressable style={styles.storeBadge}>
              <Ionicons name="logo-apple" size={20} color={GameColors.text} />
              <View>
                <Text style={styles.storeLabel}>{t('landing.cta.downloadOn')}</Text>
                <Text style={styles.storeName}>App Store</Text>
              </View>
            </Pressable>
            <Pressable style={styles.storeBadge}>
              <Ionicons name="logo-google-playstore" size={20} color={GameColors.text} />
              <View>
                <Text style={styles.storeLabel}>{t('landing.cta.getItOn')}</Text>
                <Text style={styles.storeName}>Google Play</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Wavelength © 2025</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  arcWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: GameColors.text,
    textAlign: 'center',
    letterSpacing: 8,
    textShadowColor: GameColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  heroSubtitle: {
    fontSize: 18,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 1,
  },
  heroTagline: {
    fontSize: 14,
    color: GameColors.accent,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  // Sections
  section: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  // Steps
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  stepCard: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    minWidth: 140,
    maxWidth: 200,
    flex: 1,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 18,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDesc: {
    fontSize: 12,
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureCard: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    width: '47%',
    minWidth: 150,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GameColors.text,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: GameColors.textMuted,
    lineHeight: 18,
  },
  // CTA
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: GameColors.text,
    textAlign: 'center',
    letterSpacing: 1,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: GameColors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: GameColors.primary,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: GameColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: GameColors.text,
    letterSpacing: 1.5,
  },
  storeBadges: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: GameColors.textMuted,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  storeLabel: {
    fontSize: 9,
    color: GameColors.textMuted,
    fontWeight: '500',
  },
  storeName: {
    fontSize: 14,
    color: GameColors.text,
    fontWeight: '700',
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: GameColors.textMuted,
    fontWeight: '500',
  },
});
