import { FC, useState, useEffect, useRef, useCallback } from "react"
import {
  Modal,
  Pressable,
  View,
  ViewStyle,
  TextStyle,
  Alert,
  ActivityIndicator,
} from "react-native"
import * as Location from "expo-location"
import Ionicons from "@expo/vector-icons/Ionicons"
import RNSoundLevel from "react-native-sound-level"

import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"
import { api } from "@/services/api"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import { UserData } from "@/services/api/types"

interface PoluicaoSonoraModalProps {
  visible: boolean
  onClose: () => void
  onSuccess?: (recompensa: { aumentou_streak: boolean; moedas_ganhas: number } | null, idIcone?: number | null) => void
}

const RECORDING_DURATION_MS = 10000 // 10 seconds
const RECORDING_DURATION_SECONDS = RECORDING_DURATION_MS / 1000

export const PoluicaoSonoraModal: FC<PoluicaoSonoraModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { themed, theme } = useAppTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentDecibel, setCurrentDecibel] = useState<number | null>(null)
  const [averageDecibel, setAverageDecibel] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(RECORDING_DURATION_SECONDS)
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const decibelReadingsRef = useRef<number[]>([])

  const [user, setUser] = useState<UserData | null>(null)
  const [loadingUser, setLoadingUser] = useState<boolean>(true)

  const loadUser = useCallback(async () => {
    setLoadingUser(true)
    const res = await api.getCurrentUser()
    if (res.kind === "ok") setUser(res.data)
    else {
      console.warn("Conta: não foi possível carregar current_user", res)
      setUser(null)
    }
    setLoadingUser(false)
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const clearRecordingTimers = (): void => {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }

  const hasRecording = averageDecibel !== null
  const canSubmit = hasRecording && !isRecording && !isSubmitting

  useEffect(() => {
    return () => {
      clearRecordingTimers()
      RNSoundLevel.stop()
    }
  }, [])

  const startRecording = async (): Promise<void> => {
    try {
      if (__DEV__) console.log("Requesting microphone permission... started")
      // Reset states
      setCurrentDecibel(null)
      setAverageDecibel(null)
      setTimeRemaining(RECORDING_DURATION_SECONDS)
      decibelReadingsRef.current = []
      setIsRecording(true)

      clearRecordingTimers()

      // Start monitoring sound level
      RNSoundLevel.start()

      // Listen to sound level updates
      RNSoundLevel.onNewFrame = (data: { value: number; rawValue: number }) => {
        // value is in dB, typically ranges from -160 to 0
        // Convert to a more meaningful scale (30-120 dB)
        const decibelValue = Math.max(30, Math.min(120, data.value + 100))
        setCurrentDecibel(Math.round(decibelValue))
        decibelReadingsRef.current.push(decibelValue)
      }

      // Start countdown timer - update every second
      countdownTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const nextValue = Math.max(prev - 1, 0)
          if (__DEV__) console.log("Countdown tick", nextValue)

          if (nextValue === 0) {
            void stopRecording()
          }

          return nextValue
        })
      }, 1000)

      // Stop recording after 10 seconds
      recordingTimerRef.current = setTimeout(async () => {
        await stopRecording()
      }, RECORDING_DURATION_MS)
    } catch (error) {
      console.error("Failed to start recording:", error)
      setIsRecording(false)

      // Check if it's a permission error
      if (error instanceof Error && error.message.includes("permission")) {
        Alert.alert(
          "Permissão negada",
          "O acesso ao microfone é necessário para gravar áudio. Por favor, habilite nas configurações do dispositivo.",
        )
      } else {
        Alert.alert("Erro", "Não foi possível iniciar a gravação.")
      }
    }
  }

  const stopRecording = async (): Promise<void> => {
    try {
      // Clear timers
      clearRecordingTimers()

      // Stop monitoring
      RNSoundLevel.stop()
      setIsRecording(false)

      // Calculate average decibel from all readings
      if (decibelReadingsRef.current.length > 0) {
        const sum = decibelReadingsRef.current.reduce((acc, val) => acc + val, 0)
        const average = sum / decibelReadingsRef.current.length
        setAverageDecibel(Math.round(average))
        setCurrentDecibel(null)
      } else {
        // Fallback if no readings were captured
        setAverageDecibel(70)
      }
    } catch (error) {
      console.error("Failed to stop recording:", error)
      setIsRecording(false)
      Alert.alert("Erro", "Não foi possível parar a gravação.")
    }
  }

  const handleSubmit = async (): Promise<void> => {
    if (averageDecibel === null) {
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
      console.log("Submitting audio data...", {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        decibel: averageDecibel,
      })
      const response = await api.submitAudioData({
        user: user?.id,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        decibel: averageDecibel,
      })

      if (response.kind === "ok") {
        const recompensa = (response.data as any)?.recompensa ?? null        
        onSuccess?.(recompensa, user?.id_icone)
        handleClose()
      } else {
        Alert.alert("Erro", "Não foi possível enviar os dados. Tente novamente.")
      }
    } catch (error) {
      console.error("Failed to submit audio:", error)
      Alert.alert("Erro", "Ocorreu um erro ao enviar os dados.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (): void => {
    // Reset state
    setAverageDecibel(null)
    setCurrentDecibel(null)
    setTimeRemaining(RECORDING_DURATION_SECONDS)
    decibelReadingsRef.current = []

    // Stop recording if active
    if (isRecording) {
      RNSoundLevel.stop()
      setIsRecording(false)
    }

    // Clear timers
    clearRecordingTimers()

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
              Envie um áudio curto de 10s, captando os ruídos ao seu redor!
            </Text>

            <Text style={themed($instructionSubtext)}>
              O áudio será vinculado à localização atual e agregado ao mapa de poluição sonora.
            </Text>

            {/* Recording Status with Live Decibel */}
            {isRecording && (
              <View style={themed($recordingContainer)}>
                <View style={themed($recordingIndicator)}>
                  <View style={themed($recordingDot)} />
                  <Text style={themed($recordingText)}>Gravando... {timeRemaining}s</Text>
                </View>
                {currentDecibel !== null && (
                  <View style={themed($liveDecibelContainer)}>
                    <Text style={themed($liveDecibelText)}>{currentDecibel} dB</Text>
                    <Text style={themed($liveDecibelLabel)}>Nível atual</Text>
                  </View>
                )}
              </View>
            )}

            {/* Average Decibel Display */}
            {averageDecibel !== null && !isRecording && (
              <View style={themed($decibelContainer)}>
                <Text style={themed($decibelText)}>Nível médio: {averageDecibel} dB</Text>
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
                  ? `Gravando... ${timeRemaining}s restantes`
                  : averageDecibel !== null
                    ? "Gravar novamente"
                    : "Pressione para iniciar a gravação"}
              </Text>
            </View>

            {/* Submit Button */}
            {!isRecording && (
              <Button
                style={themed($submitButton)}
                textStyle={themed($submitButtonText)}
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityLabel="Enviar áudio"
              >
                {isSubmitting ? (
                  <ActivityIndicator color={theme.colors.palette.neutral100} />
                ) : (
                  "ENVIAR"
                )}
              </Button>
            )}
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
  height: "85%",
  maxHeight: "85%",
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

const $recordingContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  width: "100%",
  alignItems: "center",
  marginBottom: spacing.lg,
})

const $recordingIndicator: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: spacing.md,
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

const $liveDecibelContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  backgroundColor: colors.palette.accent100,
  borderRadius: 16,
  alignItems: "center",
  minWidth: 120,
})

const $liveDecibelText: ThemedStyle<TextStyle> = ({ colors, typography, spacing }) => ({
  fontSize: 32,
  fontFamily: typography.primary.bold,
  color: colors.palette.accent500,
  marginBottom: spacing.xxs,
})

const $liveDecibelLabel: ThemedStyle<TextStyle> = ({ colors, typography }) => ({
  fontSize: 12,
  fontFamily: typography.primary.normal,
  color: colors.textDim,
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
