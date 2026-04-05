import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GameColors } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useSettings();
  const [newLeft, setNewLeft] = useState('');
  const [newRight, setNewRight] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Custom Spectrums */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color={GameColors.pink} />
            <Text style={styles.sectionTitle}>Palavras Customizadas</Text>
          </View>
          <Text style={styles.sectionDesc}>
            {settings.customSpectrums.length === 0
              ? 'Adicione seus próprios espectros ao jogo'
              : `${settings.customSpectrums.length} espectro${settings.customSpectrums.length > 1 ? 's' : ''} adicionado${settings.customSpectrums.length > 1 ? 's' : ''}`}
          </Text>

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
  section: {
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
