import { View, Text, StyleSheet, Image, Pressable , ActivityIndicator} from "react-native"
import React, { useEffect, useState, useCallback } from "react"
import { Screen } from "@/components/Screen"
import { useNavigation } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Separator } from "@/components/Separator"
import { Button } from "@/components/Button"
import { UserData } from "@/services/api/types"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/services/api"


export function Conta() {
  const navigation = useNavigation()
  const { theme } = useAppTheme()
  const { colors } = theme
  const { logout } = useAuth()

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


  return (
    <Screen preset="scroll" contentContainerStyle={styles.container}>
      {/* Header igual à de Configurações, com botão de voltar */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#006FFD" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
      </View>

      {loadingUser && (
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color="#006FFD" />
        </View>
      )}

      {/* Erro */}
      {!loadingUser && !user && (
        <Text style={{ marginTop: 40, color: "red" }}>
          Não foi possível carregar seus dados.
        </Text>
      )}

      <View style={styles.content}>
        <Text style={styles.text}>Nome de Usuário</Text>
        <Text style={styles.textDado}>{user?.username}</Text>
        <Separator/>
        <Text>{"\n"}</Text>
        <Text style={styles.text}>Nome</Text>
        <Text style={styles.textDado}>{user?.first_name}</Text>
        <Separator/>
        <Text>{"\n"}</Text>
        <Text style={styles.text}>Sobrenome</Text>
        <Text style={styles.textDado}>{user?.last_name}</Text>
        <Separator/>
        <Text>{"\n"}</Text>
        <Text style={styles.text}>Email</Text>
        <Text style={styles.textDado}>{user?.email}</Text>
        <Separator/>
        <Text>{"\n\n"}</Text>

        <Button
        text="Desconectar"
        preset="filled"
        onPress={logout}
        style={[styles.botao]} // wooow
        textStyle={{ color: "#FFF", fontWeight: "700" }}
        />

      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", 
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
    position: "absolute",
    left: 0, 
    padding: 8,
  },
  headerTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    alignItems: "center",
  },
  image: {
    width: 238,
    height: 357,
    maxWidth: "100%",
    overflow: "hidden",
    flex: 1

  },
  text: {
    width: 342,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "Inter-Bold",
    fontWeight: 400,
    textAlign: "left"
  },
  textDado: {
    color: "#7a7a7aff",
    marginTop: 6,
    width: 342,
    fontSize: 20,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
    fontWeight: 400,
    textAlign: "left"
  },
  botao: {
    backgroundColor: "#e72e2eff",
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
})
