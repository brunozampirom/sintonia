import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
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
import { useResponsiveLayout } from '@/hooks/use-responsive-layout';
import { HeaderIconButton, HeaderSpacer, HeaderTitle, ScreenHeader } from '@/components/screen-header';
import type { LanguagePreference } from '@/i18n';
import { haptics } from '@/lib/haptics';
import { useTranslation } from 'react-i18next';

const LANGUAGE_OPTIONS: LanguagePreference[] = ['system', 'pt-BR', 'en', 'es'];

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, effectiveLanguage } = useSettings();
  const { t } = useTranslation();
  const { isLandscape, isTablet, containerMaxWidth } = useResponsiveLayout();
  const [newLeft, setNewLeft] = useState('');
  const [newRight, setNewRight] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const getLanguageLabel = (lang: LanguagePreference) => {
    if (lang === 'system') return t('settings.language.system');
    if (lang === 'pt-BR') return t('settings.language.ptBR');
    if (lang === 'es') return t('settings.language.es');
    return t('settings.language.en');
  };

  const handleAddSpectrum = () => {
    const left = newLeft.trim();
    const right = newRight.trim();
    if (!left || !right) {
      Alert.alert(t('settings.customSpectrums.fillBothFields'));
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

  const responsiveContainer = isTablet ? {
    maxWidth: containerMaxWidth,
    alignSelf: 'center' as const,
    width: '100%' as const,
  } : undefined;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <ScreenHeader style={responsiveContainer}>
        <HeaderIconButton icon="chevron-back" onPress={() => { haptics.back(); router.back(); }} />
        <HeaderTitle>{t('settings.title')}</HeaderTitle>
        <HeaderSpacer />
      </ScreenHeader>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, responsiveContainer]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={isLandscape ? styles.grid : undefined}>
        <Animated.View entering={FadeInDown.delay(50)} style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="language-outline" size={20} color={GameColors.sky} />
            <Text style={styles.sectionTitle}>{t('settings.language.title')}</Text>
          </View>
          <Text style={styles.sectionDesc}>{t('settings.language.description')}</Text>

          <View style={styles.languageRow}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = settings.language === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.languageChip, isSelected && styles.languageChipSelected]}
                  onPress={() => updateSettings({ language: option })}
                >
                  <Text style={[styles.languageChipText, isSelected && styles.languageChipTextSelected]}>
                    {getLanguageLabel(option)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.effectiveLanguageText}>
            {t('settings.language.effective', { language: getLanguageLabel(effectiveLanguage) })}
          </Text>
        </Animated.View>

        {/* Haptics */}
        <Animated.View entering={FadeInDown.delay(75)} style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.toggleSectionHeader}>
            <View style={styles.toggleSectionTitleRow}>
              <Ionicons
                name={Platform.OS === 'android' ? 'musical-notes-outline' : 'pulse-outline'}
                size={20}
                color={GameColors.accent}
              />
              <Text style={styles.sectionTitle}>
                {t(Platform.OS === 'android' ? 'settings.haptics.titleAndroid' : 'settings.haptics.title')}
              </Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={(value) => {
                updateSettings({ hapticsEnabled: value });
                // Confirm with a tap so the user feels the change immediately
                // when turning ON. When turning OFF, the next call will already
                // be muted by the bridge.
                if (value) {
                  setTimeout(() => haptics.buttonPress(), 50);
                }
              }}
              trackColor={{ false: GameColors.surfaceLight, true: GameColors.accent }}
              thumbColor={GameColors.text}
            />
          </View>
          <Text style={styles.sectionDesc}>
            {t(Platform.OS === 'android' ? 'settings.haptics.descriptionAndroid' : 'settings.haptics.description')}
          </Text>
        </Animated.View>

        {/* Custom Spectrums */}
        <Animated.View entering={FadeInDown.delay(100)} style={[styles.section, isLandscape && styles.sectionLandscape]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color={GameColors.pink} />
            <Text style={styles.sectionTitle}>{t('settings.customSpectrums.title')}</Text>
          </View>
          <Text style={styles.sectionDesc}>
            {settings.customSpectrums.length === 0
              ? t('settings.customSpectrums.empty')
              : t('settings.customSpectrums.count', { count: settings.customSpectrums.length })}
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
                placeholder={t('settings.customSpectrums.leftPlaceholder')}
                placeholderTextColor={GameColors.textMuted}
                maxLength={50}
              />
              <TextInput
                style={styles.addInput}
                value={newRight}
                onChangeText={setNewRight}
                placeholder={t('settings.customSpectrums.rightPlaceholder')}
                placeholderTextColor={GameColors.textMuted}
                maxLength={50}
              />
              <View style={styles.addFormButtons}>
                <Pressable style={styles.addConfirmButton} onPress={handleAddSpectrum}>
                  <Ionicons name="checkmark" size={18} color={GameColors.text} />
                  <Text style={styles.addConfirmText}>{t('common.actions.add')}</Text>
                </Pressable>
                <Pressable
                  style={styles.addCancelButton}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewLeft('');
                    setNewRight('');
                  }}
                >
                  <Text style={styles.addCancelText}>{t('common.actions.cancel')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={GameColors.secondary} />
              <Text style={styles.addButtonText}>{t('settings.customSpectrums.addSpectrum')}</Text>
            </Pressable>
          )}
        </Animated.View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionLandscape: {
    width: '48.5%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  toggleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  languageRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  languageChip: {
    flex: 1,
    backgroundColor: GameColors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languageChipSelected: {
    borderColor: GameColors.sky,
  },
  languageChipText: {
    color: GameColors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  languageChipTextSelected: {
    color: GameColors.text,
  },
  effectiveLanguageText: {
    color: GameColors.textMuted,
    fontSize: 12,
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
