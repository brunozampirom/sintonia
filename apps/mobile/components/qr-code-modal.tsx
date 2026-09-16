// Modal com QR code do link da sala. Estilo casa com o ReviewPromptModal:
// overlay escuro com card centralizado e botão de fechar. Útil quando todo
// mundo tá numa mesa de bar — alguém escaneia em vez de digitar o código.

import { GameColors } from '@/constants/theme';
import { haptics } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

interface QRCodeModalProps {
  visible: boolean;
  code: string;
  url: string;
  onClose: () => void;
}

export function QRCodeModal({ visible, code, url, onClose }: QRCodeModalProps) {
  const { t } = useTranslation();

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
        <Animated.View entering={FadeIn.duration(220).delay(60)} style={styles.card}>
          <Pressable onPress={handleClose} style={styles.closeBtn} hitSlop={16}>
            <Ionicons name="close" size={20} color={GameColors.textMuted} />
          </Pressable>
          <Text style={styles.eyebrow}>{t('qrModal.sala', { code })}</Text>
          <View style={styles.qrWrap}>
            <QRCode
              value={url}
              size={220}
              color={GameColors.text}
              backgroundColor={GameColors.surface}
              quietZone={8}
            />
          </View>
          <Text style={styles.url} numberOfLines={1}>{url}</Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: GameColors.surface,
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: GameColors.textMuted,
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: GameColors.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  qrWrap: {
    padding: 14,
    backgroundColor: GameColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  url: {
    fontSize: 12,
    color: GameColors.textMuted,
    fontWeight: '600',
    marginTop: 6,
  },
});
