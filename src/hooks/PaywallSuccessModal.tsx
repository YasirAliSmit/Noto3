import React from 'react'
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native'
import Modal from 'react-native-modal'
import { useTranslation } from 'react-i18next'
import { CheckCircle } from 'lucide-react-native'
import LinearGradient from 'react-native-linear-gradient'
import { COLORS } from '../theme/colors'

const withOpacity = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '')
  const normalized =
    sanitized.length === 3 ? sanitized.split('').map((char) => char + char).join('') : sanitized
  const num = parseInt(normalized, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const palette = {
  surface: COLORS.surface,
  accent: COLORS.primary,
  accentSecondary: COLORS.secondary,
  textPrimary: COLORS.text,
  textSecondary: COLORS.muted,
  border: COLORS.border,
} as const

type PaywallSuccessModalProps = {
  visible: boolean
  onClose: () => void
}

const PaywallSuccessModal = ({ visible, onClose }: PaywallSuccessModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      backdropOpacity={0.35}
      useNativeDriver
    >
      <View style={styles.modalContainer}>
        <View style={styles.iconBadge}>
          <LinearGradient
            colors={[palette.accent, palette.accentSecondary]}
            style={styles.iconGradient}
          >
            <CheckCircle size={30} color={palette.surface} />
          </LinearGradient>
        </View>
        <Text style={styles.title}>{t('paywall.success.title')}</Text>
        <Text style={styles.description}>{t('paywall.success.message')}</Text>

        <TouchableOpacity onPress={onClose} activeOpacity={0.9} style={styles.button}>
          <LinearGradient
            colors={[palette.accent, palette.accentSecondary]}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>{t('paywall.success.button')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

export default PaywallSuccessModal

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: withOpacity(palette.accent, 0.35),
    shadowColor: palette.accent,
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: withOpacity(palette.accent, 0.2),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.accent,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: palette.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 18,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  description: {
    color: palette.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    borderRadius: 999,
    overflow: 'hidden',
    minWidth: 180,
  },
  buttonGradient: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 38,
    alignItems: 'center',
  },
  buttonText: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
})
