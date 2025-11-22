import { FC } from "react"
import {
  Image,
  ImageStyle,
  ImageSourcePropType,
  Modal,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"

import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

export interface AreaVerdeDetails {
  id: number
  latitude: number
  longitude: number
  titulo: string
  modoAcesso: string
  descricao?: string
  imagemUrl?: string
  userId?: number
  author?: {
    id: number
    displayName: string
    username?: string
    avatar: ImageSourcePropType
  }
}

interface AreaVerdeDetailsModalProps {
  visible: boolean
  area: AreaVerdeDetails | null
  onClose: () => void
}

export const AreaVerdeDetailsModal: FC<AreaVerdeDetailsModalProps> = ({
  visible,
  area,
  onClose,
}) => {
  const { themed } = useAppTheme()

  if (!area) return null

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable style={themed($overlay)} onPress={onClose}>
        <Pressable style={themed($content)} onPress={(event) => event.stopPropagation()}>
          <View style={themed($header)}>
            <Text style={themed($title)} text={area.titulo} numberOfLines={2} />
            <Pressable
              style={themed($closeButton)}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar detalhes da área verde"
            >
              <Icon icon="x" size={24} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={themed($scrollContent)}>
            {area.author ? (
              <View style={themed($authorContainer)}>
                <Image source={area.author.avatar} style={themed($authorAvatar)} />
                <View style={themed($authorInfo)}>
                  <Text
                    style={themed($authorName)}
                    text={area.author.displayName}
                    numberOfLines={1}
                  />
                  {area.author.username ? (
                    <Text
                      style={themed($authorUsername)}
                      text={`@${area.author.username}`}
                      numberOfLines={1}
                    />
                  ) : null}
                </View>
              </View>
            ) : null}

            {area.imagemUrl ? (
              <Image source={{ uri: area.imagemUrl }} style={themed($image)} resizeMode="cover" />
            ) : (
              <View style={themed($imagePlaceholder)}>
                <Icon icon="pin" size={36} />
                <Text style={themed($placeholderText)} text="Sem imagem disponível" />
              </View>
            )}

            <View style={themed($section)}>
              <Text style={themed($sectionLabel)} text="Modo de acesso" />
              <Text style={themed($sectionValue)} text={area.modoAcesso} />
            </View>

            {area.descricao ? (
              <View style={themed($section)}>
                <Text style={themed($sectionLabel)} text="Descrição" />
                <Text style={themed($sectionDescription)} text={area.descricao} />
              </View>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const $overlay: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.palette.overlay50,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 24,
})

const $content: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  maxHeight: "85%",
  backgroundColor: colors.background,
  borderRadius: 20,
  paddingBottom: spacing.lg,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 8,
})

const $header: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.lg,
  marginBottom: spacing.sm,
  alignItems: "center",
})

const $title: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  flex: 1,
  fontSize: 20,
  fontFamily: typography.primary.semiBold,
  color: colors.text,
  marginRight: 12,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.xs,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xl,
})

const $authorContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
  padding: spacing.sm,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral200,
})

const $authorAvatar: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: 56,
  height: 56,
  borderRadius: 28,
  marginRight: spacing.sm,
})

const $authorInfo: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $authorName: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontSize: 16,
  fontFamily: typography.primary.semiBold,
  color: colors.text,
})

const $authorUsername: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  marginTop: 2,
  fontSize: 14,
  fontFamily: typography.primary.normal,
  color: colors.palette.neutral600,
})

const $image: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  width: "100%",
  height: 220,
  borderRadius: 16,
  marginBottom: spacing.lg,
})

const $imagePlaceholder: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  width: "100%",
  height: 220,
  borderRadius: 16,
  marginBottom: spacing.lg,
  backgroundColor: colors.palette.neutral200,
  alignItems: "center",
  justifyContent: "center",
})

const $placeholderText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  marginTop: 8,
  color: colors.palette.neutral700,
  fontFamily: typography.primary.medium,
})

const $section: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $sectionLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 14,
  fontFamily: typography.primary.medium,
  textTransform: "uppercase",
  color: colors.palette.neutral600,
  marginBottom: 4,
})

const $sectionValue: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.normal,
  color: colors.text,
})

const $sectionDescription: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.normal,
  color: colors.text,
  lineHeight: 22,
})
