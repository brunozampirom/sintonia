import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ModeCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  accent: string;
  badge?: string;
  delay: number;
  onPress: () => void;
}

function ModeCard({ icon, title, description, accent, badge, delay, onPress }: ModeCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={{ width: '100%' }}>
      <Pressable
        onPress={() => {
          haptics.play();
          onPress();
        }}
        style={({ pressed }) => [styles.card, { borderColor: accent + '44' }, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconBox, { borderColor: accent + '66', backgroundColor: accent + '15' }]}>
          <Ionicons name={icon} size={28} color={accent} />
        </View>

        <View style={styles.textCol}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {title}
            </Text>
            {badge && (
              <View style={[styles.badge, { borderColor: accent, backgroundColor: accent + '22' }]}>
                <Text style={[styles.badgeText, { color: accent }]}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={GameColors.textMuted}
          style={styles.chevron}
        />
      </Pressable>
    </Animated.View>
  );
}

export default function PlayModeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>{t('playMode.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={styles.content}>
        <ModeCard
          icon="phone-portrait-outline"
          title={t('playMode.mesmoCelular.title')}
          description={t('playMode.mesmoCelular.description')}
          accent={GameColors.primary}
          delay={100}
          onPress={() => router.push('/game-setup')}
        />
        <ModeCard
          icon="wifi"
          title={t('playMode.online.title')}
          description={t('playMode.online.description')}
          accent={GameColors.sky}
          badge={t('playMode.online.badge')}
          delay={220}
          onPress={() => router.push('/online-entry')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: GameColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.surface,
    borderRadius: 24,
    paddingVertical: 22,
    paddingHorizontal: 20,
    gap: 18,
    borderWidth: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textCol: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 26,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 0.2,
    lineHeight: 30,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  cardDescription: {
    fontSize: 14,
    color: GameColors.textMuted,
    lineHeight: 20,
  },
  chevron: {
    marginLeft: 4,
  },
});
