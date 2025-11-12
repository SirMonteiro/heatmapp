import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { api } from "@/services/api"
import { UserData } from "@/services/api/types"
import { useAppTheme } from "@/theme/context"

export function HeaderLoja() {
  const { theme } = useAppTheme()
  const { colors } = theme

  const [moedas, setMoedas] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let mounted = true

    async function loadCurrentUser() {
      setLoading(true)
      const res = await api.getCurrentUser()
      if (!mounted) return

      if (res.kind === "ok") {
        console.log("fetch de current user realizado com sucesso!");
        setMoedas(typeof res.data.moedas === "number" ? res.data.moedas : 0)
      } else {
        // se não autorizado ou erro, mostra 0 
        console.warn("Não foi possível obter o usuário atual:", res)
        setMoedas(0)
      }
      setLoading(false)
    }

    loadCurrentUser()
    return () => {
      mounted = false
    }
  }, [])

  return (
      <View style={styles.headerContainer}>
        <View style={styles.balanceContainer}>
          <Text style={styles.headerText}>Você possui:</Text>

          <Image
            source={require("../../assets/icons/coin.png")}
            style={styles.coinIcon}
            resizeMode="contain"
          />

          
        {loading ? (
          <ActivityIndicator size="small" color="#FFB37C" />
        ) : (
          <Text style={styles.balanceText}>{moedas ?? 0}</Text>
        )}

        </View>
      </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#F8F9FE",
    height: 71,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  balanceContainer: {
    flexDirection: "row",
    marginLeft: 15,
    marginTop: 25,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    fontFamily: "Inter-ExtraBold",
  },
  coinIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 8,
  },
  balanceText: {
    color: "#FFB37C",
    fontSize: 18,
    fontWeight: "800",
  },
})
