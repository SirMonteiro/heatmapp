import { FC } from "react"
import { Modal, Pressable, View, ViewStyle, TextStyle } from "react-native"

import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AreasVerdesModalProps {
  visible: boolean
  onClose: () => void
}

export const AreasVerdesModal: FC<AreasVerdesModalProps> = ({ visible, onClose }) => {
  const { themed } = useAppTheme()

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={themed($modalOverlay)} onPress={onClose}>
        <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
          {/* Close Button */}
          <View style={themed($modalHeader)}>
            <Pressable
              style={themed($closeButton)}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <Icon icon="x" size={24} />
            </Pressable>
          </View>

          {/* Content */}
          <View style={themed($modalBody)}>
            <Text style={themed($titleText)}>Reportar Área Verde</Text>
            <Text style={themed($descriptionText)}>Funcionalidade em desenvolvimento...</Text>

            <Button
              style={themed($closeButtonBottom)}
              textStyle={themed($closeButtonText)}
              onPress={onClose}
              accessibilityLabel="Fechar"
            >
              Fechar
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ============================================================================
// Styles
// ============================================================================

const $modalOverlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: "flex-end",
})

const $modalContent: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.background,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  paddingBottom: spacing.xl,
  height: "66%",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 5,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.xs,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
})

const $modalBody: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flex: 1,
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.lg,
  alignItems: "center",
  justifyContent: "center",
})

const $titleText: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 24,
  fontFamily: typography.primary.medium,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.lg,
})

const $descriptionText: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $closeButtonBottom: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  backgroundColor: colors.palette.primary500,
  minHeight: 50,
  width: "100%",
})

const $closeButtonText: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
})
