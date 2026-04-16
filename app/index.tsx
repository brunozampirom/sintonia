import { GameButton } from '@/components/game-button';
import { Starfield } from '@/components/starfield';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const insets = useSafeAreaInsets();

  const titleSection = (
    <>
      <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.titleBlock}>
        <Text style={[styles.title, isLandscape && styles.titleLandscape]}>{t('common.appName')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.descBlock}>
        <Text style={styles.description}>
          {t('home.description')}
        </Text>
      </Animated.View>
    </>
  );

  const actionSection = (
    <>
      <Animated.View entering={FadeInUp.duration(600).delay(800)} style={styles.buttonBlock}>
        <GameButton title={t('common.actions.play')} onPress={() => router.push('/game-setup')} />
        <View style={{ marginTop: 10 }}>
          <GameButton title={t('common.actions.settings')} onPress={() => router.push('/settings')} variant="secondary" />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(600).delay(1000)} style={styles.rulesBlock}>
        <View style={styles.ruleRow}>
          <View style={styles.ruleIconBox}>
            <Ionicons name="trophy-outline" size={18} color={GameColors.accent} />
          </View>
          <Text style={styles.ruleText}>{t('home.rules.firstToWin', { score: settings.winningScore })}</Text>
        </View>
        <View style={styles.ruleRow}>
          <View style={styles.ruleIconBox}>
            <Ionicons name="swap-horizontal-outline" size={18} color={GameColors.secondary} />
          </View>
          <Text style={styles.ruleText}>{t('home.rules.alternating')}</Text>
        </View>
        <View style={styles.ruleRow}>
          <View style={styles.ruleIconBox}>
            <Ionicons name="phone-portrait-outline" size={18} color={GameColors.sky} />
          </View>
          <Text style={styles.ruleText}>{t('home.rules.samePhone')}</Text>
        </View>
      </Animated.View>

      {isLandscape && (
        <Animated.View entering={FadeInUp.duration(600).delay(1200)} style={styles.tutorialBlock}>
          <Pressable
            onPress={() => router.push('/tutorial')}
            hitSlop={12}
            style={({ pressed }) => [styles.tutorialLink, pressed && styles.tutorialLinkPressed]}
          >
            <Text style={styles.tutorialLinkText}>{t('home.tutorialButton')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </>
  );

  const arcsOverlay = (
    <View style={styles.decorativeContainer} pointerEvents="none">
      <View style={[styles.arc, styles.arc1]} />
      <View style={[styles.arc, styles.arc2]} />
      <View style={[styles.arc, styles.arc3]} />
      <View style={[styles.arc, styles.arc4]} />
      <View style={[styles.arc, styles.arc5]} />
    </View>
  );

  if (isLandscape) {
    return (
      <View style={styles.screenWrap}>
        <Starfield count={100} />
        {arcsOverlay}
        <SafeAreaView style={styles.container}>
          <View style={styles.landscapeContent}>
            <View style={styles.landscapeLeft}>
              {titleSection}
            </View>
            <View style={styles.landscapeRight}>
              {actionSection}
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screenWrap}>
      <Starfield count={100} />
      {arcsOverlay}
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.content}>
            {titleSection}
            {actionSection}
          </View>
        </ScrollView>
      </SafeAreaView>
      <Animated.View
        entering={FadeInUp.duration(600).delay(1200)}
        style={[styles.tutorialFloat, { bottom: insets.bottom + 20 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.push('/tutorial')}
          hitSlop={12}
          style={({ pressed }) => [styles.tutorialLink, pressed && styles.tutorialLinkPressed]}
        >
          <Text style={styles.tutorialLinkText}>{t('home.tutorialButton')}</Text>
        </Pressable>
      </Animated.View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  decorativeContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    height: 200,
  },
  arc: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 3,
    borderBottomWidth: 0,
  },
  arc1: {
    width: 320,
    height: 160,
    borderColor: GameColors.primary,
    opacity: 0.3,
    top: 0,
  },
  arc2: {
    width: 280,
    height: 140,
    borderColor: GameColors.accent,
    opacity: 0.25,
    top: 10,
  },
  arc3: {
    width: 240,
    height: 120,
    borderColor: GameColors.secondary,
    opacity: 0.2,
    top: 20,
  },
  arc4: {
    width: 200,
    height: 100,
    borderColor: GameColors.pink,
    opacity: 0.15,
    top: 30,
  },
  arc5: {
    width: 160,
    height: 80,
    borderColor: GameColors.lavender,
    opacity: 0.1,
    top: 40,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 6,
    textShadowColor: GameColors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 16,
    color: GameColors.textMuted,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 1,
  },
  descBlock: {
    marginVertical: 24,
    paddingHorizontal: 10,
  },
  description: {
    fontSize: 15,
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonBlock: {
    marginVertical: 20,
  },
  rulesBlock: {
    marginTop: 20,
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: {
    color: GameColors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  tutorialBlock: {
    marginTop: 40,
    alignItems: 'center',
  },
  tutorialFloat: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tutorialLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tutorialLinkPressed: {
    opacity: 0.55,
  },
  tutorialLinkText: {
    color: GameColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
    textDecorationLine: 'underline',
  },
  // ===== Landscape =====
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 30,
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeContainerLandscape: {
    top: -80,
    height: 150,
  },
  titleLandscape: {
    fontSize: 40,
    letterSpacing: 4,
  },
});
