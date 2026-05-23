import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ModeCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  description: string;
  delay: number;
  onPress: () => void;
}

function ModeCard({ icon, iconColor, title, description, delay, onPress }: ModeCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay)} style={{ width: '100%' }}>
      <Pressable
        onPress={() => {
          haptics.play();
          onPress();
        }}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={[styles.iconWrap, { backgroundColor: iconColor + '22' }]}>
          <Ionicons name={icon} size={32} color={iconColor} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function PlayModeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <ScreenHeader>
        <HeaderIconButton icon="chevron-back" onPress={() => router.back()} />
        <HeaderTitle>Como vão jogar?</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <View style={styles.content}>
        <ModeCard
          icon="people"
          iconColor={GameColors.primary}
          title="Mesmo celular"
          description="Todo mundo na mesma tela. Passa o celular a cada rodada — modo clássico."
          delay={100}
          onPress={() => router.push('/game-setup')}
        />
        <ModeCard
          icon="wifi"
          iconColor={GameColors.sky}
          title="Online"
          description="Cada um no próprio celular. Convida a galera por link ou QR code."
          delay={220}
          onPress={() => router.push('/online-mode')}
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
    backgroundColor: GameColors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: GameColors.text,
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    color: GameColors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
});
