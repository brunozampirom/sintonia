import { GameButton } from '@/components/game-button';
import { SpectrumCard } from '@/components/spectrum-card';
import { Starfield } from '@/components/starfield';
import { WavelengthDial } from '@/components/wavelength-dial';
import { GameColors } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const TUTORIAL_TARGET_ANGLE = 108;

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Step {
  key: string;
  icon: IoniconName;
  color: string;
  renderVisual?: () => React.ReactNode;
}

export default function TutorialScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isLandscape, isTablet, containerMaxWidth, dialSize } = useResponsiveLayout();

  // Tutorial dials are always shown at a smaller scale
  const tutorialDialSize = Math.round(dialSize * 0.8);

  const clueGuessAngle = useSharedValue(TUTORIAL_TARGET_ANGLE);
  const guessAngle = useSharedValue(90);
  const resultGuessAngle = useSharedValue(TUTORIAL_TARGET_ANGLE + 15);

  useEffect(() => {
    guessAngle.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(140, { duration: 2000 }),
          withTiming(45, { duration: 2000 }),
          withTiming(90, { duration: 1200 }),
        ),
        -1,
        false,
      ),
    );
  }, [guessAngle]);

  const steps: Step[] = [
    {
      key: 'objective',
      icon: 'people-outline',
      color: GameColors.sky,
    },
    {
      key: 'clue',
      icon: 'bulb-outline',
      color: GameColors.accent,
      renderVisual: () => (
        <>
          <View style={styles.dialWrap}>
            <WavelengthDial
              targetAngle={TUTORIAL_TARGET_ANGLE}
              guessAngle={clueGuessAngle}
              showTarget
              interactive={false}
              showGuess={false}
              size={tutorialDialSize}
            />
          </View>
          <View style={styles.spectrumHint}>
            <SpectrumCard
              left={t('tutorial.steps.clue.exampleLeft')}
              right={t('tutorial.steps.clue.exampleRight')}
            />
          </View>
        </>
      ),
    },
    {
      key: 'passPhone',
      icon: 'phone-portrait-outline',
      color: GameColors.lavender,
    },
    {
      key: 'guess',
      icon: 'hand-left-outline',
      color: GameColors.pink,
      renderVisual: () => (
        <View style={styles.dialWrap}>
          <WavelengthDial
            targetAngle={0}
            guessAngle={guessAngle}
            showTarget={false}
            interactive={false}
            showGuess
            size={tutorialDialSize}
          />
        </View>
      ),
    },
    {
      key: 'scoring',
      icon: 'trophy-outline',
      color: GameColors.accent,
      renderVisual: () => (
        <>
          <View style={styles.zoneRow}>
            <View style={[styles.zoneChip, { backgroundColor: GameColors.zone4 }]}>
              <Text style={styles.zonePoints}>+4</Text>
              <Text style={styles.zoneLabel}>{t('tutorial.steps.scoring.perfect')}</Text>
            </View>
            <View style={[styles.zoneChip, { backgroundColor: GameColors.zone3 }]}>
              <Text style={styles.zonePoints}>+3</Text>
              <Text style={styles.zoneLabel}>{t('tutorial.steps.scoring.close')}</Text>
            </View>
            <View style={[styles.zoneChip, { backgroundColor: GameColors.zone2 }]}>
              <Text style={[styles.zonePoints, { color: GameColors.textDark }]}>+2</Text>
              <Text style={[styles.zoneLabel, { color: GameColors.textDark }]}>
                {t('tutorial.steps.scoring.near')}
              </Text>
            </View>
            <View style={[styles.zoneChip, { backgroundColor: GameColors.surfaceLight }]}>
              <Text style={styles.zonePoints}>+0</Text>
              <Text style={styles.zoneLabel}>{t('tutorial.steps.scoring.miss')}</Text>
            </View>
          </View>
          <View style={styles.dialWrap}>
            <WavelengthDial
              targetAngle={TUTORIAL_TARGET_ANGLE}
              guessAngle={resultGuessAngle}
              showTarget
              interactive={false}
              showGuess
              size={tutorialDialSize}
            />
          </View>
        </>
      ),
    },
    {
      key: 'winning',
      icon: 'flag-outline',
      color: GameColors.secondary,
    },
  ];

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  return (
    <View style={styles.screenWrap}>
      <Starfield count={60} />
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, responsiveContainer]}>
          <Pressable style={styles.backButton} onPress={() => { haptics.back(); router.back(); }}>
            <Ionicons name="chevron-back" size={22} color={GameColors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('tutorial.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, responsiveContainer]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.Text
            entering={FadeInDown.duration(500).delay(50)}
            style={styles.intro}
          >
            {t('tutorial.intro')}
          </Animated.Text>

          <View style={isLandscape ? styles.grid : undefined}>
            {steps.map((step, i) => (
              <Animated.View
                key={step.key}
                entering={FadeInDown.duration(500).delay(150 + i * 100)}
                style={[styles.card, isLandscape && styles.cardLandscape]}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.badge, { borderColor: step.color }]}>
                    <Text style={[styles.badgeText, { color: step.color }]}>
                      {String(i + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={[styles.iconBox, { backgroundColor: step.color + '22' }]}>
                    <Ionicons name={step.icon} size={22} color={step.color} />
                  </View>
                  <Text style={styles.cardTitle}>
                    {t(`tutorial.steps.${step.key}.title`)}
                  </Text>
                </View>
                <Text style={styles.cardDesc}>
                  {t(`tutorial.steps.${step.key}.description`)}
                </Text>
                {step.renderVisual?.()}
              </Animated.View>
            ))}
          </View>

          <Animated.View
            entering={FadeInUp.duration(500).delay(150 + steps.length * 100 + 100)}
            style={styles.ctaBlock}
          >
            <GameButton
              title={t('tutorial.cta')}
              onPress={() => {
                haptics.play();
                router.replace('/game-setup');
              }}
            />
          </Animated.View>

          <View style={{ height: 24 }} />
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  intro: {
    color: GameColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardLandscape: {
    width: '48.5%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  badge: {
    minWidth: 34,
    height: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: GameColors.text,
  },
  cardDesc: {
    color: GameColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  spectrumHint: {
    marginTop: 14,
    marginHorizontal: -8,
  },
  dialWrap: {
    marginTop: 14,
    alignSelf: 'center',
  },
  zoneRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  zoneChip: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  zonePoints: {
    color: GameColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  zoneLabel: {
    color: GameColors.text,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  ctaBlock: {
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
});
