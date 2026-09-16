import { GameButton } from '@/components/game-button';
import { HomeHeroWaves } from '@/components/home-hero-waves';
import { Starfield } from '@/components/starfield';
import { GameColors } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLandscape, isTablet, scale, containerMaxWidth } = useResponsiveLayout();
  const insets = useSafeAreaInsets();

  const screenWidth = Dimensions.get('window').width;
  const heroWidth = Math.min(screenWidth, 600);
  const heroHeight = Math.round(heroWidth * (340 / 600));

  const heroOverlay = (
    <Animated.View entering={FadeIn.duration(800)} style={styles.decorativeContainer} pointerEvents="none">
      <HomeHeroWaves width={heroWidth} height={heroHeight} />
    </Animated.View>
  );

  const titleBlock = (
    <Animated.View entering={FadeInDown.duration(700).delay(200)} style={styles.titleBlock}>
      <Text
        style={[styles.title, { fontSize: 48 * scale }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {t('common.appName')}
      </Text>
      <Text style={[styles.subtitle, { fontSize: 14 * scale }]}>{t('home.subtitle')}</Text>
      <Text style={[styles.description, { fontSize: 13 * scale }]}>{t('home.description')}</Text>
    </Animated.View>
  );

  const buttonsBlock = (
    <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.buttonsBlock}>
      <GameButton
        fullWidth
        title={t('common.actions.play')}
        onPress={() => {
          haptics.play();
          router.push('/play-mode');
        }}
      />
      <View style={{ height: 10 }} />
      <GameButton
        fullWidth
        title={t('common.actions.settings')}
        onPress={() => {
          haptics.play();
          router.push('/settings');
        }}
        variant="secondary"
      />
    </Animated.View>
  );

  const tutorialLink = (
    <Animated.View entering={FadeInUp.duration(500).delay(650)} style={styles.tutorialWrap}>
      <Pressable
        onPress={() => {
          haptics.play();
          router.push('/tutorial');
        }}
        hitSlop={12}
        style={({ pressed }) => [styles.tutorialPill, pressed && styles.tutorialPillPressed]}
      >
        <Ionicons name="help-circle-outline" size={16} color={GameColors.textMuted} />
        <Text style={styles.tutorialText}>{t('home.tutorialButton')}</Text>
      </Pressable>
    </Animated.View>
  );

  const responsiveContainer = {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  };

  return (
    <View style={styles.screenWrap}>
      <Starfield count={100} />
      {!isLandscape && heroOverlay}
      <SafeAreaView style={styles.container}>
        <View
          style={[
            styles.content,
            isLandscape && styles.contentLandscape,
            isTablet && responsiveContainer,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.centerStack, isLandscape && styles.centerStackLandscape]}>
            {titleBlock}
            {buttonsBlock}
          </View>
          <View style={isLandscape ? styles.tutorialWrapLandscape : undefined}>{tutorialLink}</View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  contentLandscape: {
    paddingTop: 20,
    justifyContent: 'center',
    gap: 24,
  },
  centerStack: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 56,
  },
  centerStackLandscape: {
    flex: 0,
    gap: 28,
  },
  tutorialWrapLandscape: {
    alignItems: 'center',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 5,
    textAlign: 'center',
    textShadowColor: GameColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  subtitle: {
    color: GameColors.textMuted,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'lowercase',
  },
  description: {
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 14,
    paddingHorizontal: 24,
    opacity: 0.85,
  },
  buttonsBlock: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
  },
  tutorialWrap: {
    alignItems: 'center',
    paddingTop: 12,
  },
  tutorialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GameColors.surfaceLight,
  },
  tutorialPillPressed: {
    opacity: 0.55,
  },
  tutorialText: {
    color: GameColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
