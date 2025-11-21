import { FC, useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageStyle,
  Modal,
  Pressable,
  ScrollView,
  TextStyle,
  View,
  ViewStyle,
} from "react-native"
// eslint-disable-next-line import/no-unresolved
import * as ImagePicker from "expo-image-picker"
import * as Location from "expo-location"
import Ionicons from "@expo/vector-icons/Ionicons"

import { Button } from "@/components/Button"
import type { ButtonAccessoryProps } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { api } from "@/services/api"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface AreasVerdesModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

type SelectedImage = {
  uri: string
  base64: string
  fileName?: string | null
  mimeType?: string | null
}

export const AreasVerdesModal: FC<AreasVerdesModalProps> = ({ visible, onClose, onSuccess }) => {
  const { themed, theme } = useAppTheme()

  const [titulo, setTitulo] = useState("")
  const [modoAcesso, setModoAcesso] = useState("")
  const [descricao, setDescricao] = useState("")
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPickingImage, setIsPickingImage] = useState(false)

  const resetForm = useCallback(() => {
    setTitulo("")
    setModoAcesso("")
    setDescricao("")
    setSelectedImage(null)
    setIsSubmitting(false)
    setIsPickingImage(false)
  }, [])

  useEffect(() => {
    if (!visible) resetForm()
  }, [visible, resetForm])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [onClose, resetForm])

  const handleImagePickerResult = useCallback((result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return

    const asset = result.assets?.[0]
    if (!asset) return

    if (!asset.base64) {
      Alert.alert("Erro", "Não foi possível obter a imagem selecionada.")
      return
    }

    const fileName = asset.fileName ?? asset.uri?.split("/").pop() ?? `area-verde-${Date.now()}.jpg`
    const mimeType = asset.mimeType ?? (asset.type === "image" ? "image/jpeg" : undefined)

    setSelectedImage({
      uri: asset.uri,
      base64: asset.base64,
      fileName,
      mimeType,
    })
  }, [])

  const pickImageFromLibrary = useCallback(async () => {
    setIsPickingImage(true)
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso à galeria para selecionar uma imagem.",
        )
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      })

      handleImagePickerResult(result)
    } catch (error) {
      console.error("Failed to pick image from library:", error)
      Alert.alert("Erro", "Não foi possível selecionar a imagem.")
    } finally {
      setIsPickingImage(false)
    }
  }, [handleImagePickerResult])

  const captureImage = useCallback(async () => {
    setIsPickingImage(true)
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Permita o acesso à câmera para capturar uma imagem.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      })

      handleImagePickerResult(result)
    } catch (error) {
      console.error("Failed to capture image:", error)
      Alert.alert("Erro", "Não foi possível capturar a imagem.")
    } finally {
      setIsPickingImage(false)
    }
  }, [handleImagePickerResult])

  const handleAddImage = useCallback(() => {
    Alert.alert("Adicionar imagem", "Selecione uma opção", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galeria", onPress: () => void pickImageFromLibrary() },
      { text: "Câmera", onPress: () => void captureImage() },
    ])
  }, [captureImage, pickImageFromLibrary])

  const handleRemoveImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const handleSubmit = useCallback(async () => {
    const tituloTrimmed = titulo.trim()
    const modoAcessoTrimmed = modoAcesso.trim()
    const descricaoTrimmed = descricao.trim()

    if (!tituloTrimmed || !modoAcessoTrimmed) {
      Alert.alert("Campos obrigatórios", "Informe título e modo de acesso da área verde.")
      return
    }

    if (!selectedImage) {
      Alert.alert("Imagem obrigatória", "Adicione uma fotografia da área verde.")
      return
    }

    setIsSubmitting(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Permita acesso à localização para enviar a área verde.",
        )
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const response = await api.submitAreaVerdeData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        titulo: tituloTrimmed,
        modoAcesso: modoAcessoTrimmed,
        descricao: descricaoTrimmed.length > 0 ? descricaoTrimmed : undefined,
        imageBase64: selectedImage.base64,
        imageContentType: selectedImage.mimeType ?? undefined,
        imageFileName: selectedImage.fileName ?? undefined,
      })

      if (response.kind === "ok") {
        Alert.alert("Sucesso", "Área verde enviada com sucesso!")
        onSuccess?.()
        handleClose()
      } else {
        Alert.alert("Erro", "Não foi possível enviar os dados. Tente novamente.")
      }
    } catch (error) {
      console.error("Failed to submit area verde:", error)
      Alert.alert("Erro", "Ocorreu um erro ao enviar os dados.")
    } finally {
      setIsSubmitting(false)
    }
  }, [descricao, handleClose, modoAcesso, onSuccess, selectedImage, titulo])

  const isFormValid = useMemo(() => {
    return (
      titulo.trim().length > 0 && modoAcesso.trim().length > 0 && !!selectedImage && !isSubmitting
    )
  }, [modoAcesso, selectedImage, isSubmitting, titulo])

  const imageButtonLabel = useMemo(() => {
    if (isPickingImage) return "Selecionando..."
    return selectedImage ? "Trocar imagem" : "Adicionar imagem"
  }, [isPickingImage, selectedImage])

  const renderAddImageLeftAccessory = useCallback(
    ({ style }: ButtonAccessoryProps) =>
      isPickingImage ? (
        <ActivityIndicator style={style} color={theme.colors.palette.neutral100} />
      ) : (
        <Ionicons name="camera" size={20} color={theme.colors.palette.neutral100} style={style} />
      ),
    [isPickingImage, theme.colors.palette.neutral100],
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <Pressable style={themed($modalOverlay)} onPress={handleClose}>
        <Pressable style={themed($modalContent)} onPress={(e) => e.stopPropagation()}>
          <View style={themed($modalHeader)}>
            <Pressable
              style={themed($closeButton)}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <Icon icon="x" size={24} />
            </Pressable>
          </View>

          <View style={themed($modalBody)}>
            <ScrollView
              contentContainerStyle={themed($scrollContent)}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={themed($instructionText)}>
                Envie uma fotografia da área verde, sua forma de acesso, e, opcionalmente, uma
                descrição.
              </Text>

              <Text style={themed($instructionSubtext)}>
                Essas informações serão vinculadas à localização atual e agregadas ao mapa de áreas
                verdes.
              </Text>

              <Button
                style={themed($imageButton)}
                textStyle={themed($imageButtonText)}
                onPress={handleAddImage}
                disabled={isPickingImage}
                accessibilityLabel="Adicionar imagem da área verde"
                LeftAccessory={renderAddImageLeftAccessory}
              >
                {imageButtonLabel}
              </Button>

              {selectedImage && (
                <View style={themed($imagePreviewContainer)}>
                  <Image source={{ uri: selectedImage.uri }} style={themed($imagePreview)} />
                  <Pressable
                    style={themed($imageRemoveButton)}
                    onPress={handleRemoveImage}
                    accessibilityRole="button"
                    accessibilityLabel="Remover imagem selecionada"
                  >
                    <Icon icon="x" size={16} color={theme.colors.palette.neutral100} />
                  </Pressable>
                  <Text style={themed($imageFileName)} numberOfLines={1}>
                    {selectedImage.fileName}
                  </Text>
                </View>
              )}

              <View style={themed($fieldsContainer)}>
                <TextField
                  value={titulo}
                  onChangeText={setTitulo}
                  placeholder="Título"
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  containerStyle={themed($textFieldContainer)}
                  inputWrapperStyle={themed($textFieldWrapper)}
                  style={themed($textFieldInput)}
                />

                <TextField
                  value={modoAcesso}
                  onChangeText={setModoAcesso}
                  placeholder="Modo de acesso"
                  autoCapitalize="sentences"
                  returnKeyType="next"
                  containerStyle={themed($textFieldContainer)}
                  inputWrapperStyle={themed($textFieldWrapper)}
                  style={themed($textFieldInput)}
                />

                <TextField
                  value={descricao}
                  onChangeText={setDescricao}
                  placeholder="Descrição (opcional)"
                  autoCapitalize="sentences"
                  multiline
                  numberOfLines={4}
                  containerStyle={themed($textFieldContainer)}
                  inputWrapperStyle={themed([$textFieldWrapper, $textFieldWrapperMultiline])}
                  style={themed([$textFieldInput, $textFieldInputMultiline])}
                />
              </View>
            </ScrollView>

            <View style={themed($submitButtonContainer)}>
              <Button
                style={themed($submitButton)}
                textStyle={themed($submitButtonText)}
                onPress={handleSubmit}
                disabled={!isFormValid}
                accessibilityLabel="Enviar área verde"
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.palette.neutral100} />
                ) : (
                  "Enviar"
                )}
              </Button>
            </View>
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
  paddingBottom: spacing.sm,
  height: "80%",
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

const $modalBody: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $scrollContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexGrow: 1,
  paddingHorizontal: spacing.xl,
  paddingTop: spacing.lg,
  paddingBottom: spacing.lg,
  gap: spacing.lg,
})

const $instructionText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.text,
})

const $instructionSubtext: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 14,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
})

const $imageButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  backgroundColor: colors.palette.primary500,
  width: "100%",
  paddingVertical: spacing.sm,
})

const $imageButtonText: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.palette.neutral100,
})

const $imagePreviewContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  width: "100%",
  borderRadius: 16,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  position: "relative",
})

const $imagePreview: ThemedStyle<ImageStyle> = () => ({
  width: "100%",
  height: 180,
  borderRadius: 16,
})

const $imageRemoveButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: spacing.xs,
  right: spacing.xs,
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: colors.palette.neutral900,
  alignItems: "center",
  justifyContent: "center",
})

const $imageFileName: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  backgroundColor: colors.background,
})

const $fieldsContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  gap: spacing.md,
})

const $textFieldContainer: ThemedStyle<ViewStyle> = () => ({
  width: "100%",
})

const $textFieldWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.palette.neutral300,
  backgroundColor: colors.palette.neutral100,
})

const $textFieldWrapperMultiline: ThemedStyle<ViewStyle> = () => ({
  minHeight: 120,
})

const $textFieldInput: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.normal,
  color: colors.text,
})

const $textFieldInputMultiline: ThemedStyle<TextStyle> = () => ({
  minHeight: 96,
  textAlignVertical: "top",
})

const $submitButtonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.xl,
  paddingBottom: spacing.xl,
})

const $submitButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  minHeight: 50,
  backgroundColor: colors.palette.primary500,
  paddingVertical: spacing.sm,
})

const $submitButtonText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.palette.neutral100,
})
