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
  delay: number;
  onPress: () => void;
}

function ModeCard({ icon, title, description, accent, delay, onPress }: ModeCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={{ width: '100%' }}>
      <Pressable
        onPress={() => { haptics.play(); onPress(); }}
        style={({ pressed }) => [styles.card, { borderColor: accent + '44' }, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconBox, { borderColor: accent + '66', backgroundColor: accent + '15' }]}>
          <Ionicons name={icon} size={28} color={accent} />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color={GameColors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

export default function OnlineEntryScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>{t('onlineEntry.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={styles.content}>
        <ModeCard
          icon="add-circle-outline"
          title={t('onlineEntry.criar.title')}
          description={t('onlineEntry.criar.description')}
          accent={GameColors.mint}
          delay={100}
          onPress={() => router.push('/online-config')}
        />
        <ModeCard
          icon="log-in-outline"
          title={t('onlineEntry.entrar.title')}
          description={t('onlineEntry.entrar.description')}
          accent={GameColors.sky}
          delay={220}
          onPress={() => router.push('/join-code')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: GameColors.background },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, gap: 16 },
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
  cardPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  textCol: { flex: 1, gap: 6 },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 0.2,
  },
  cardDescription: {
    fontSize: 13,
    color: GameColors.textMuted,
    lineHeight: 19,
  },
});
