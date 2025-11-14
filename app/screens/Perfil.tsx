import React, { useEffect, useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native"
import { useAppTheme } from "@/theme/context"
import { SafeAreaView } from "react-native-safe-area-context"
import { HeaderUsuario } from "@/components/HeaderUsuario"
import { StreakCoin } from "@/components/StreakCoin"
import { Separator } from "@/components/Separator"
import { ItemRanking } from "@/components/ItemRanking"
import { api } from "@/services/api"
import { IMAGENS_ICONES, fallbackImage } from "@/utils/IconesImagens"
import type { UserData } from "@/services/api/types"
import { useNavigation, useIsFocused } from "@react-navigation/native"

export function Perfil() {
  const { theme } = useAppTheme()
  const { colors } = theme
  const navigation = useNavigation()
  const isFocused = useIsFocused()

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const loadUser = useCallback(async () => {
    setLoading(true)
    const res = await api.getCurrentUser()
    if (res.kind === "ok") setUser(res.data)
    else {
      console.warn("Perfil: não foi possível carregar current_user", res)
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
   
    if (isFocused) loadUser()
  }, [isFocused, loadUser])

  const avatarSource = (() => {
    const id = user?.id_icone
    if (typeof id === "number" && id > 0) {
      return IMAGENS_ICONES[id - 1] ?? fallbackImage
    }
    return fallbackImage
  })()

  // desmockar depois...
  const rankingData = [
    { id: "1", username: "Desgraçadilson", icone: IMAGENS_ICONES[0] ?? fallbackImage, streak: 35 },
    { id: "2", username: "faltalover", icone: IMAGENS_ICONES[3] ?? fallbackImage, streak: 32 },
    { id: "3", username: "esfaqueador_do_parque", icone: IMAGENS_ICONES[2] ?? fallbackImage, streak: 30 },
    { id: "4", username: "bergmanfan", icone: IMAGENS_ICONES[1] ?? fallbackImage, streak: 20 },
    { id: "5", username: "ononokiposting", icone: IMAGENS_ICONES[3] ?? fallbackImage, streak: 15 },
    { id: "6", username: "react-native-hater", icone: IMAGENS_ICONES[3] ?? fallbackImage, streak: 5 },
  ]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors?.background ?? "#fff" }}>
      {loading ? (
        <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="small" color={"#006FFD"} />
        </View>
      ) : (
        <HeaderUsuario
          icone={avatarSource}
          username={user?.username}
          nome_completo={
            user ? `${user.first_name ?? ""}${user.last_name ? " " + user.last_name : ""}`.trim() : undefined
          }
          onPressRightIcon={() => navigation.navigate("IconChange" as never)}
        />
      )}

      <Separator />

      <StreakCoin streak={user?.streak ?? 0} moedas={user?.moedas ?? 0} />

      <Separator />

      <ScrollView style={styles.rankingContainer}>
        <Text style={styles.rankingText}>Ranking</Text>

        {rankingData.map((item, index) => (
          <ItemRanking key={item.id} posicao={index + 1} icone={item.icone} username={item.username} streak={item.streak} />
        ))}
      </ScrollView>

      <Separator />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  rankingContainer: {
    maxHeight: 600,
  },
  rankingText: {
    textAlign: "center",
    fontFamily: "Inter-ExtraBold",
    fontWeight: "800",
    letterSpacing: 0.2,
    fontSize: 24,
  },
})