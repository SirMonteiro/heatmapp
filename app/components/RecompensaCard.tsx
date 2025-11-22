import React, { FC } from "react"
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ImageSourcePropType,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from "react-native"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import { IMAGENS_ICONES, fallbackImage } from "@/utils/IconesImagens"

type Recompensa = {
  aumentou_streak: boolean
  moedas_ganhas: number
}

interface RecompensaCardProps {
  recompensa: Recompensa
  idIcone?: number | null
  onClose?: () => void
}

const RecompensaCard: FC<RecompensaCardProps> = ({ recompensa, idIcone, onClose }) => {
  const { theme } = useAppTheme()

  const imagemFonte: ImageSourcePropType =
    typeof idIcone === "number" && IMAGENS_ICONES[idIcone] ? IMAGENS_ICONES[idIcone] : fallbackImage

  return (
    <View style={styles.overlayPointer}>
      <View style={[styles.container, { backgroundColor: theme.colors.palette.neutral100 }]}>
        <Text style={[styles.headerText, { color: theme.colors.text }]}>RECOMPENSA</Text>

        <Image source={imagemFonte} style={styles.userIcon} resizeMode="cover" accessibilityLabel="Ícone do usuário" />

        <View style={styles.infoRow}>
          {recompensa.aumentou_streak && (
            <View style={styles.streakRow}>
              <Text style={[styles.streakText, { color: theme.colors.text }]}>Streak aumentado! <Text style={styles.streakPlus}>+1</Text></Text>
              <Image
                source={require("../../assets/icons/fire.png")}
                style={styles.smallIcon}
                resizeMode="contain"
                accessibilityLabel="Ícone de fogo"
              />
            </View>
          )}
        </View>

        <View style={[styles.coinsRow]}>
          <Text style={[styles.coinsText, { color: theme.colors.text }]}>
            Moedas recebidas: <Text style={styles.coinsPlus}>+{recompensa.moedas_ganhas}</Text>
          </Text>
          <Image
            source={require("../../assets/icons/coin.png")}
            style={styles.coinIcon}
            resizeMode="contain"
            accessibilityLabel="Ícone de moeda"
          />
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, { backgroundColor: theme.colors.palette.primary500 }]}
          accessibilityRole="button"
          accessibilityLabel="Fechar cartão de recompensa"
        >
          <Text style={[styles.closeButtonText, { color: "#FFF" }]}>FECHAR</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create<{
  overlayPointer: ViewStyle
  container: ViewStyle
  headerText: TextStyle
  userIcon: ImageStyle
  infoRow: ViewStyle
  streakRow: ViewStyle
  streakText: TextStyle
  streakPlus: TextStyle
  smallIcon: ImageStyle
  coinsRow: ViewStyle
  coinsText: TextStyle
  coinsPlus: TextStyle
  coinIcon: ImageStyle
  closeButton: ViewStyle
  closeButtonText: TextStyle
}>({
  overlayPointer: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  container: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  headerText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },
  userIcon: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  infoRow: {
    width: "100%",
    marginBottom: 8,
    alignItems: "center",
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 20,
    fontWeight: "600",
    marginRight: 8,
  },
  streakPlus: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ed3241",
  },
  smallIcon: {
    width: 20,
    height: 20,
  },
  coinsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  coinsText: {
    fontFamily: "Inter-ExtraBold",
    fontSize: 20,
    fontWeight: "500",
  },
  coinsPlus: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFB37C",
  },
  coinIcon: {
    width: 22,
    height: 22,
    marginLeft: 8,
  },
  closeButton: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
})

export default RecompensaCard