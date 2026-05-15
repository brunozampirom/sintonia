import { GameColors } from '@/constants/theme';
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function ScreenHeader({
  children,
  style,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { isLandscape } = useResponsiveLayout();
  return (
    <View style={[styles.header, isLandscape && styles.headerLandscape, style]}>
      {children}
    </View>
  );
}

export function HeaderIconButton({
  icon,
  onPress,
  size = 22,
  color = GameColors.text,
}: {
  icon: IconName;
  onPress: () => void;
  size?: number;
  color?: string;
}) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function HeaderTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function HeaderSpacer() {
  return <View style={styles.spacer} />;
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerLandscape: {
    paddingHorizontal: 0,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GameColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: GameColors.text,
    textAlign: 'center',
  },
  spacer: {
    width: 36,
  },
});
