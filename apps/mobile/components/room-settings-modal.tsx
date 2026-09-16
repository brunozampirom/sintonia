// Lobby settings panel. Host edits and the changes broadcast via
// UPDATE_ROOM_SETTINGS so guests see the same values. Guests open the same
// modal in read-only mode just to peek at what's coming.

import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { RoomConfig } from '@sintonia/game-core';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const SCORE_OPTIONS = [5, 10, 15, 20, 30];
const SKIP_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: -1, label: '∞' },
];
const TIME_OPTIONS = [
  { value: -1, label: '∞' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
];

interface RoomSettingsModalProps {
  visible: boolean;
  readOnly: boolean;
  initial: RoomConfig;
  onClose: () => void;
  /** Called only when host taps "Salvar". Receives the new config. */
  onSave?: (config: RoomConfig) => void;
}

interface SectionProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, iconColor, title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        if (!selected) haptics.selection();
        onPress();
      }}
      style={[styles.chip, selected && styles.chipSelected, disabled && styles.chipDisabled]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function RoomSettingsModal({
  visible,
  readOnly,
  initial,
  onClose,
  onSave,
}: RoomSettingsModalProps) {
  const { t } = useTranslation();
  const [voiceMode, setVoiceMode] = useState(initial.voiceMode);
  const [winningScore, setWinningScore] = useState(initial.winningScore);
  const [skips, setSkips] = useState(initial.skipsPerPlayer);
  const [clueTimeLimit, setClueTimeLimit] = useState(initial.clueTimeLimit);
  const [guessTimeLimit, setGuessTimeLimit] = useState(initial.guessTimeLimit);

  // Re-sync the form whenever the modal opens with new server-broadcast
  // values (otherwise host edits could stomp on stale local state).
  useEffect(() => {
    if (!visible) return;
    setVoiceMode(initial.voiceMode);
    setWinningScore(initial.winningScore);
    setSkips(initial.skipsPerPlayer);
    setClueTimeLimit(initial.clueTimeLimit);
    setGuessTimeLimit(initial.guessTimeLimit);
  }, [visible, initial]);

  function handleSave() {
    if (readOnly) return;
    haptics.play();
    onSave?.({
      voiceMode,
      winningScore,
      skipsPerPlayer: skips,
      clueTimeLimit,
      guessTimeLimit,
    });
    onClose();
  }

  function handleClose() {
    haptics.play();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Animated.View entering={FadeIn.duration(180)} style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              {readOnly ? t('roomSettings.titleReadOnly') : t('roomSettings.title')}
            </Text>
            <Pressable onPress={handleClose} hitSlop={14} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={GameColors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* DICA */}
            <Section icon="chatbubble-ellipses" iconColor={GameColors.mint} title={t('onlineConfig.dica.title')}>
              <View style={styles.dicaRow}>
                <Pressable
                  disabled={readOnly}
                  onPress={() => {
                    if (!voiceMode) haptics.selection();
                    setVoiceMode(true);
                  }}
                  style={[styles.dicaCard, voiceMode && styles.dicaCardActive, readOnly && styles.dicaCardReadOnly]}
                >
                  <MaterialIcons name="record-voice-over" size={22} color={voiceMode ? GameColors.accent : GameColors.textMuted} />
                  <Text style={[styles.dicaTitle, voiceMode && styles.dicaTitleActive]}>{t('onlineConfig.dica.voz.title')}</Text>
                </Pressable>
                <Pressable
                  disabled={readOnly}
                  onPress={() => {
                    if (voiceMode) haptics.selection();
                    setVoiceMode(false);
                  }}
                  style={[styles.dicaCard, !voiceMode && styles.dicaCardActive, readOnly && styles.dicaCardReadOnly]}
                >
                  <Ionicons name="chatbubble" size={22} color={!voiceMode ? GameColors.accent : GameColors.textMuted} />
                  <Text style={[styles.dicaTitle, !voiceMode && styles.dicaTitleActive]}>{t('onlineConfig.dica.texto.title')}</Text>
                </Pressable>
              </View>
            </Section>

            <Section icon="trophy-outline" iconColor={GameColors.accent} title={t('onlineConfig.pontos.title')}>
              <View style={styles.chipRow}>
                {SCORE_OPTIONS.map((s) => (
                  <Chip key={s} label={String(s)} selected={winningScore === s} disabled={readOnly} onPress={() => setWinningScore(s)} />
                ))}
              </View>
            </Section>

            <Section icon="play-skip-forward-outline" iconColor={GameColors.sky} title={t('onlineConfig.skips.title')}>
              <View style={styles.chipRow}>
                {SKIP_OPTIONS.map((opt) => (
                  <Chip key={opt.value} label={opt.label} selected={skips === opt.value} disabled={readOnly} onPress={() => setSkips(opt.value)} />
                ))}
              </View>
            </Section>

            <Section icon="time-outline" iconColor={GameColors.coral} title={t('onlineConfig.tempo.title')}>
              <Text style={styles.timeSubLabel}>{t('onlineConfig.tempo.dar')}</Text>
              <View style={styles.chipRow}>
                {TIME_OPTIONS.map((opt) => (
                  <Chip
                    key={`clue-${opt.value}`}
                    label={opt.label}
                    selected={clueTimeLimit === opt.value}
                    disabled={readOnly}
                    onPress={() => setClueTimeLimit(opt.value)}
                  />
                ))}
              </View>
              <View style={{ height: 8 }} />
              <Text style={styles.timeSubLabel}>{t('onlineConfig.tempo.adivinhar')}</Text>
              <View style={styles.chipRow}>
                {TIME_OPTIONS.map((opt) => (
                  <Chip
                    key={`guess-${opt.value}`}
                    label={opt.label}
                    selected={guessTimeLimit === opt.value}
                    disabled={readOnly}
                    onPress={() => setGuessTimeLimit(opt.value)}
                  />
                ))}
              </View>
            </Section>
          </ScrollView>

          {!readOnly && (
            <View style={styles.footer}>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
              >
                <Text style={styles.saveBtnText}>{t('roomSettings.save')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    backgroundColor: GameColors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: GameColors.text,
  },
  closeBtn: { padding: 4 },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: GameColors.text },
  dicaRow: { flexDirection: 'row', gap: 10 },
  dicaCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dicaCardActive: { borderColor: GameColors.accent },
  dicaCardReadOnly: { opacity: 0.85 },
  dicaTitle: { fontSize: 13, fontWeight: '800', color: GameColors.textMuted },
  dicaTitleActive: { color: GameColors.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: { borderColor: GameColors.accent },
  chipDisabled: { opacity: 0.7 },
  chipText: { fontSize: 14, fontWeight: '700', color: GameColors.textMuted },
  chipTextSelected: { color: GameColors.accent },
  timeSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: GameColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: GameColors.surface,
  },
  saveBtn: {
    backgroundColor: GameColors.primary,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: 'center',
  },
  saveBtnPressed: { transform: [{ scale: 0.97 }] },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 1.3,
  },
});
