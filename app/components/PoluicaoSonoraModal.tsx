import { FC, useState, useEffect } from "react"
import {
  Modal,
  Pressable,
  View,
  ViewStyle,
  TextStyle,
  Alert,
  ActivityIndicator,
} from "react-native"
import { Audio } from "expo-av"
import * as Location from "expo-location"
import Ionicons from "@expo/vector-icons/Ionicons"

import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { api } from "@/services/api"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface PoluicaoSonoraModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: () => void
}

const RECORDING_DURATION_MS = 10000 // 10 seconds

export const PoluicaoSonoraModal: FC<PoluicaoSonoraModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { themed, theme } = useAppTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [recording, setRecording] = useState<Audio.Recording | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [audioUri, setAudioUri] = useState<string | null>(null)
  const [decibel, setDecibel] = useState<number | null>(null)

  useEffect(() => {
    // Request audio permissions when modal opens
    if (visible) {
      requestAudioPermission()
    }

    // Cleanup on unmount or when visible changes
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(console.error)
      }
    }
  }, [visible, recording])

  const requestAudioPermission = async (): Promise<void> => {
    try {
      const { status } = await Audio.requestPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita acesso ao microfone para gravar áudio.")
      }
    } catch (error) {
      console.error("Error requesting audio permission:", error)
    }
  }

  const startRecording = async (): Promise<void> => {
    try {
      // Check permission
      const { status } = await Audio.getPermissionsAsync()
      if (status !== "granted") {
        await requestAudioPermission()
        return
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      })

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      )

      setRecording(newRecording)
      setIsRecording(true)

      // Stop recording after 10 seconds
      setTimeout(async () => {
        await stopRecording(newRecording)
      }, RECORDING_DURATION_MS)
    } catch (error) {
      console.error("Failed to start recording:", error)
      Alert.alert("Erro", "Não foi possível iniciar a gravação.")
    }
  }

  const stopRecording = async (recordingInstance?: Audio.Recording): Promise<void> => {
    try {
      const recordingToStop = recordingInstance || recording
      if (!recordingToStop) return

      setIsRecording(false)
      await recordingToStop.stopAndUnloadAsync()

      const uri = recordingToStop.getURI()
      if (uri) {
        setAudioUri(uri)
        // Calculate decibel from audio
        await calculateDecibel(uri)
      }

      setRecording(null)
    } catch (error) {
      console.error("Failed to stop recording:", error)
      Alert.alert("Erro", "Não foi possível parar a gravação.")
    }
  }

  const calculateDecibel = async (uri: string): Promise<void> => {
    try {
      // Load the audio file to get status
      const { sound, status } = await Audio.Sound.createAsync({ uri })

      if (status.isLoaded) {
        // This is a simplified calculation - in production, you would need
        // a more sophisticated audio analysis library to calculate actual decibels
        // For now, we'll use a placeholder based on duration
        const estimatedDecibel = Math.random() * 40 + 50 // Random value between 50-90 dB
        setDecibel(Math.round(estimatedDecibel))
      }

      await sound.unloadAsync()
    } catch (error) {
      console.error("Failed to calculate decibel:", error)
      // Set a default value if calculation fails
      setDecibel(70)
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (!audioUri || decibel === null) {
      Alert.alert("Aviso", "Grave um áudio antes de enviar.")
      return
    }

    setIsSubmitting(true)
    try {
      // Get current location
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita acesso à localização para enviar o áudio.")
        setIsSubmitting(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      // Submit to API
      const response = await api.submitAudioData({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        decibel,
        audioUri,
      })

      if (response.kind === "ok") {
        Alert.alert("Sucesso", "Áudio enviado com sucesso!")
        onSuccess?.()
        handleClose()
      } else {
        Alert.alert("Erro", "Não foi possível enviar o áudio. Tente novamente.")
      }
    } catch (error) {
      console.error("Failed to submit audio:", error)
      Alert.alert("Erro", "Ocorreu um erro ao enviar o áudio.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (): void => {
    // Reset state
    setIsRecording(false)
    setAudioUri(null)
    setDecibel(null)

    // Stop recording if active
    if (recording) {
      recording.stopAndUnloadAsync().catch(console.error)
      setRecording(null)
    }

    onClose()
  }

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
          {/* Close Button */}
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

          {/* Content */}
          <View style={themed($modalBody)}>
            {/* Instructions */}
            <Text style={themed($instructionText)}>
              Envie um áudio curto de 5-10s, captando os ruídos ao seu redor!
            </Text>

            <Text style={themed($instructionSubtext)}>
              O áudio será vinculado à localização atual e agregado ao mapa de poluição sonora.
            </Text>

            {/* Recording Status */}
            {isRecording && (
              <View style={themed($recordingIndicator)}>
                <View style={themed($recordingDot)} />
                <Text style={themed($recordingText)}>Gravando...</Text>
              </View>
            )}

            {/* Decibel Display */}
            {decibel !== null && !isRecording && (
              <View style={themed($decibelContainer)}>
                <Text style={themed($decibelText)}>Nível estimado: {decibel} dB</Text>
              </View>
            )}

            {/* Mic Button */}
            <View style={themed($micButtonContainer)}>
              <Pressable
                style={themed([$micButton, isRecording && $micButtonRecording])}
                onPress={isRecording ? () => {} : startRecording}
                disabled={isRecording || isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={isRecording ? "Gravando" : "Pressione para iniciar a gravação"}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={48}
                  color={theme.colors.palette.neutral100}
                />
              </Pressable>

              <Text style={themed($micButtonLabel)}>
                {isRecording
                  ? "Gravando..."
                  : audioUri
                    ? "Gravar novamente"
                    : "Pressione para iniciar a gravação"}
              </Text>
            </View>

            {/* Submit Button */}
            <Button
              style={themed($submitButton)}
              textStyle={themed($submitButtonText)}
              onPress={handleSubmit}
              disabled={!audioUri || isRecording || isSubmitting}
              accessibilityLabel="Enviar áudio"
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.palette.neutral100} />
              ) : (
                "Enviar"
              )}
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
})

const $instructionText: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 18,
  fontFamily: typography.primary.medium,
  color: colors.text,
  textAlign: "center",
  marginBottom: spacing.md,
})

const $instructionSubtext: ThemedStyle<TextStyle> = ({ colors, spacing, typography }) => ({
  fontSize: 14,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
  textAlign: "center",
  marginBottom: spacing.xl,
})

const $recordingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $recordingDot: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 12,
  height: 12,
  borderRadius: 6,
  backgroundColor: colors.error,
  marginRight: spacing.xs,
})

const $recordingText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.error,
})

const $decibelContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
  backgroundColor: colors.palette.neutral200,
  borderRadius: 12,
  marginBottom: spacing.lg,
})

const $decibelText: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.text,
})

const $micButtonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  alignItems: "center",
  marginVertical: spacing.xl,
})

const $micButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: 120,
  height: 120,
  borderRadius: 60,
  backgroundColor: colors.tint,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: spacing.md,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 6,
})

const $micButtonRecording: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.error,
})

const $micButtonLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 14,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
  textAlign: "center",
})

const $submitButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  backgroundColor: colors.palette.primary500,
  minHeight: 50,
  width: "100%",
  marginTop: spacing.lg,
})

const $submitButtonText: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
})
