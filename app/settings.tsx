import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';

const SCORE_OPTIONS = [5, 10, 15, 20];
const SKIP_OPTIONS = [
  { value: 0, label: '0' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: -1, label: '∞' },
];

function ChipSelector({
  options,
  selected,
  onSelect,
}: {
  options: { value: number; label: string }[];
  selected: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          style={[styles.chip, selected === opt.value && styles.chipSelected]}
          onPress={() => onSelect(opt.value)}
        >
          <Text
            style={[
              styles.chipText,
              selected === opt.value && styles.chipTextSelected,
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [newLeft, setNewLeft] = useState('');
  const [newRight, setNewRight] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handleAddSpectrum = () => {
    const left = newLeft.trim();
    const right = newRight.trim();
    if (!left || !right) {
      Alert.alert('Preencha os dois campos');
      return;
    }
    updateSettings({
      customSpectrums: [...settings.customSpectrums, { left, right }],
    });
    setNewLeft('');
    setNewRight('');
    setShowAddForm(false);
  };

  const handleRemoveSpectrum = (index: number) => {
    const next = settings.customSpectrums.filter((_, i) => i !== index);
    updateSettings({ customSpectrums: next });
  };

  const handleNameChange = (playerIndex: 0 | 1, name: string) => {
    const names: [string, string] = [...settings.playerNames];
    names[playerIndex] = name;
    updateSettings({ playerNames: names });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={GameColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isLandscape && styles.scrollContentLandscape]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isLandscape ? styles.landscapeGrid : undefined}>
        {/* Winning Score */}
        <View style={isLandscape ? styles.sectionWrapLandscape : undefined}>
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.section, isLandscape && styles.sectionFill]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy-outline" size={20} color={GameColors.accent} />
            <Text style={styles.sectionTitle}>Pontos pra Vencer</Text>
          </View>
          <ChipSelector
            options={SCORE_OPTIONS.map((v) => ({ value: v, label: String(v) }))}
            selected={settings.winningScore}
            onSelect={(v) => updateSettings({ winningScore: v })}
          />
        </Animated.View>
        </View>

        {/* Player Names */}
        <View style={isLandscape ? styles.sectionWrapLandscape : undefined}>
        <Animated.View entering={FadeInDown.delay(200)} style={[styles.section, isLandscape && styles.sectionFill]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={20} color={GameColors.secondary} />
            <Text style={styles.sectionTitle}>Nomes dos Jogadores</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.nameInput}
              value={settings.playerNames[0]}
              onChangeText={(t) => handleNameChange(0, t)}
              placeholder="Jogador 1"
              placeholderTextColor={GameColors.textMuted}
              maxLength={20}
            />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.nameInput}
              value={settings.playerNames[1]}
              onChangeText={(t) => handleNameChange(1, t)}
              placeholder="Jogador 2"
              placeholderTextColor={GameColors.textMuted}
              maxLength={20}
            />
          </View>
        </Animated.View>
        </View>

        {/* Skips */}
        <View style={isLandscape ? styles.sectionWrapLandscape : undefined}>
        <Animated.View entering={FadeInDown.delay(300)} style={[styles.section, isLandscape && styles.sectionFill]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="play-skip-forward-outline" size={20} color={GameColors.sky} />
            <Text style={styles.sectionTitle}>Pulos por Jogador</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Quantidade de vezes que cada jogador pode pular o espectro por partida
          </Text>
          <ChipSelector
            options={SKIP_OPTIONS}
            selected={settings.skipsPerPlayer}
            onSelect={(v) => updateSettings({ skipsPerPlayer: v })}
          />
        </Animated.View>
        </View>

        {/* Custom Spectrums */}
        <View style={isLandscape ? styles.sectionWrapLandscape : undefined}>
        <Animated.View entering={FadeInDown.delay(400)} style={[styles.section, isLandscape && styles.sectionFill]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color={GameColors.pink} />
            <Text style={styles.sectionTitle}>Palavras Customizadas</Text>
          </View>
          <Text style={styles.sectionDesc}>
            {settings.customSpectrums.length === 0
              ? 'Adicione seus próprios espectros ao jogo'
              : `${settings.customSpectrums.length} espectro${settings.customSpectrums.length > 1 ? 's' : ''} adicionado${settings.customSpectrums.length > 1 ? 's' : ''}`}
          </Text>

          {/* Custom spectrum list */}
          {settings.customSpectrums.map((s, i) => (
            <View key={i} style={styles.spectrumItem}>
              <Text style={styles.spectrumText} numberOfLines={1}>
                {s.left} ↔ {s.right}
              </Text>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveSpectrum(i)}
              >
                <Ionicons name="close-circle" size={20} color={GameColors.primary} />
              </Pressable>
            </View>
          ))}

          {/* Add form */}
          {showAddForm ? (
            <View style={styles.addForm}>
              <TextInput
                style={styles.addInput}
                value={newLeft}
                onChangeText={setNewLeft}
                placeholder="Lado esquerdo"
                placeholderTextColor={GameColors.textMuted}
                maxLength={50}
              />
              <TextInput
                style={styles.addInput}
                value={newRight}
                onChangeText={setNewRight}
                placeholder="Lado direito"
                placeholderTextColor={GameColors.textMuted}
                maxLength={50}
              />
              <View style={styles.addFormButtons}>
                <Pressable style={styles.addConfirmButton} onPress={handleAddSpectrum}>
                  <Ionicons name="checkmark" size={18} color={GameColors.text} />
                  <Text style={styles.addConfirmText}>Adicionar</Text>
                </Pressable>
                <Pressable
                  style={styles.addCancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewLeft('');
                    setNewRight('');
                  }}
                >
                  <Text style={styles.addCancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={GameColors.secondary} />
              <Text style={styles.addButtonText}>Adicionar Espectro</Text>
            </Pressable>
          )}
        </Animated.View>
        </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GameColors.background,
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
  scrollContentLandscape: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  landscapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    columnGap: 12,
    rowGap: 12,
  },
  sectionWrapLandscape: {
    width: '49%',
  },
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionFill: {
    flex: 1,
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: GameColors.textMuted,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: GameColors.surfaceLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: GameColors.accent,
    backgroundColor: GameColors.background,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '700',
    color: GameColors.textMuted,
  },
  chipTextSelected: {
    color: GameColors.accent,
  },
  inputRow: {
    marginBottom: 10,
  },
  nameInput: {
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: '600',
    color: GameColors.text,
  },
  spectrumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  spectrumText: {
    flex: 1,
    fontSize: 14,
    color: GameColors.text,
    fontWeight: '500',
  },
  removeButton: {
    marginLeft: 8,
    padding: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: GameColors.surfaceLight,
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: GameColors.secondary,
  },
  addForm: {
    marginTop: 8,
    gap: 10,
  },
  addInput: {
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '500',
    color: GameColors.text,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  addConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: GameColors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  addConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: GameColors.text,
  },
  addCancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: GameColors.surfaceLight,
  },
  addCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: GameColors.textMuted,
  },
});
