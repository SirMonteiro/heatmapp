import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"
import { api } from "@/services/api"
import { IMAGENS_ICONES, fallbackImage } from "@/utils/IconesImagens"
import { Button } from "@/components/Button"
import type { IconeComprado, UserData } from "@/services/api/types"

type IconTile = {
  id: number
  source: any
}

export function IconChangeScreen() {
  const navigation = useNavigation()
  const { theme } = useAppTheme()
  const { colors } = theme

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [icons, setIcons] = useState<IconTile[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      try {
        // Busca current user e ícones comprados em paralelo
        const [userRes, boughtRes] = await Promise.all([api.getCurrentUser(), api.meusIcones()])

        if (!mounted) return

        if (userRes.kind === "ok") {
          setUser(userRes.data)
          // define selected atual se houver id_icone no usuário
          if (typeof userRes.data.id_icone === "number" && userRes.data.id_icone > 0) {
            setSelectedId(userRes.data.id_icone)
          }
        } else {
          console.warn("IconChangeScreen: não foi possível obter current_user", userRes)
        }

        if (boughtRes.kind === "ok") {
          // boughtRes.data é IconeComprado[] com icone (id)
          const uniqueIds = Array.from(new Set(boughtRes.data.map((b: IconeComprado) => b.icone)))
          const tiles: IconTile[] = uniqueIds
            .map((id) => {
              const src = IMAGENS_ICONES[id] ?? fallbackImage
              return { id, source: src }
            })
            .filter(Boolean)
          setIcons(tiles)
        } else {
          console.warn("IconChangeScreen: não foi possível obter ícones comprados", boughtRes)
          setIcons([])
        }
      } catch (e) {
        console.warn("IconChangeScreen: erro ao carregar dados", e)
        setIcons([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  async function handleConfirm() {
    if (selectedId == null) {
      Alert.alert("Selecione um ícone", "Escolha um dos ícones comprados para definir como seu avatar.")
      return
    }
    if (!user) {
      Alert.alert("Erro", "Usuário não encontrado. Tente novamente.")
      return
    }

    setSaving(true)
    try {
      // Usa apisauce diretamente para fazer PATCH no endpoint do usuário

      const response = await api.apisauce.patch(`usuarios/${user.id}/`, { id_icone: selectedId })

      if (response.ok && response.data) {
        Alert.alert("Ícone atualizado", (response.data as any).detail ?? "Seu ícone foi atualizado com sucesso.")
        // volta para a tela anterior (Perfil). Perfil deve refazer requisição no focus.
        navigation.goBack()
        return
      }

      // tenta extrair mensagem de erro do corpo
      const body = response.data
      if (body && (body as any).detail) {
        Alert.alert("Não foi possível alterar o ícone", String((body as any).detail))
      } else if (body && (body as any).message) {
        Alert.alert("Não foi possível alterar o ícone", String((body as any).message))
      } else if (typeof body === "string") {
        Alert.alert("Não foi possível alterar o ícone", body)
      } else {
        Alert.alert("Não foi possível alterar o ícone", response.problem ?? "Erro ao atualizar ícone.")
      }
    } catch (e) {
      console.warn("IconChangeScreen: erro ao salvar alteração", e)
      Alert.alert("Erro", "Erro ao atualizar o ícone. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  function renderTile({ item }: { item: IconTile }) {
    const isSelected = selectedId === item.id
    return (
      <TouchableOpacity
        style={[styles.tile, isSelected ? { borderColor:"#006FFD", borderWidth: 2 } : {}]}
        onPress={() => setSelectedId(item.id)}
        activeOpacity={0.8}
      >
        <Image source={item.source} style={styles.tileImage} resizeMode="cover" />
        {isSelected && (
          <View style={styles.checkOverlay}>
            <MaterialIcons name="check-circle" size={28} color={("#006FFD")} />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors?.background ?? "#fff" }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors?.text ?? "#000" }]}>Alterar ícone</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={"#006FFD"} />
        </View>
      ) : icons.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: "#666" }}>Você ainda não possui ícones comprados.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={icons}
            renderItem={renderTile}
            keyExtractor={(it) => String(it.id)}
            numColumns={3}
            contentContainerStyle={styles.grid}
          />

          <View style={styles.footer}>
            <Button
              text="Confirmar"
              preset="filled"
              onPress={handleConfirm}
              disabled={saving}
              style={styles.confirmButton}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    margin: 8,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f2f2f2",
    position: "relative",
  },
  tileImage: {
    width: "100%",
    height: "100%",
  },
  checkOverlay: {
    position: "absolute",
    right: 6,
    top: 6,
    backgroundColor: "transparent",
  },
  footer: {
    padding: 16,
  },
  confirmButton: {
    borderRadius: 12,
    height: 44,
  },
})