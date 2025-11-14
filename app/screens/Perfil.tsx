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
  const [loadingUser, setLoadingUser] = useState<boolean>(true)

  const [ranking, setRanking] = useState<UserData[]>([])
  const [loadingRanking, setLoadingRanking] = useState<boolean>(true)

  const loadUser = useCallback(async () => {
    setLoadingUser(true)
    const res = await api.getCurrentUser()
    if (res.kind === "ok") setUser(res.data)
    else {
      console.warn("Perfil: não foi possível carregar current_user", res)
      setUser(null)
    }
    setLoadingUser(false)
  }, [])

  const loadRanking = useCallback(async () => {
    setLoadingRanking(true)
    const res = await api.getRanking()
    if (res.kind === "ok") {
      setRanking(res.data)
    } else {
      console.warn("Perfil: não foi possível carregar ranking", res)
      setRanking([])
    }
    setLoadingRanking(false)
  }, [])

  useEffect(() => {
    if (isFocused) {
      loadUser()
      loadRanking()
    }
  }, [isFocused, loadUser, loadRanking])

  const avatarSource = (() => {
    const id = user?.id_icone
    if (typeof id === "number" && id > 0) {
      return IMAGENS_ICONES[id] ?? fallbackImage
    }
    return fallbackImage
  })()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors?.background ?? "#fff" }}>
      {loadingUser ? (
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

      <ScrollView style={styles.rankingContainer} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.rankingText}>Ranking</Text>

        {loadingRanking ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator size="small" color={"#006FFD"} />
          </View>
        ) : ranking.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <Text style={{ color:"#666" }}>Nenhum usuário no ranking.</Text>
          </View>
        ) : (
          ranking.map((rUser, index) => {
            
            const iconeSource = (typeof rUser.id_icone === "number" && rUser.id_icone >= 0)
              ? IMAGENS_ICONES[rUser.id_icone] ?? fallbackImage
              : fallbackImage

            return (
              <ItemRanking
                key={String(rUser.id)}
                posicao={index + 1}
                icone={iconeSource}
                username={rUser.username}
                streak={rUser.streak ?? 0}
              />
            )
          })
        )}
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
    marginTop: 8,
    marginBottom: 12,
  },
})