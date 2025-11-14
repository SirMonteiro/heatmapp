import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"
import { api } from "@/services/api"
import { IMAGENS_ICONES, fallbackImage } from "@/utils/IconesImagens"
import type { UserData } from "@/services/api/types"


type UsuarioProps = {
  // se o pai passar os dados do usuário, o componente usa; caso contrário busca current_user
  icone?: any 
  username?: string
  nome_completo?: string
  useCurrentUser?: boolean // força usar current_user mesmo se props forem passadas 
  onPressRightIcon?: () => void
  rightIconName?: string
}


export function HeaderUsuario({
  icone,
  username,
  nome_completo,
  useCurrentUser = false,
  onPressRightIcon,
  rightIconName = "settings",
}: UsuarioProps) {
  const { theme } = useAppTheme()
  const { colors } = theme


  const background = "#e7e7e7"
  const primary = "#2897ff"
  const textPrimary = "#000"
  const textSecondary = "#494a50"

  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)


  // se não vier username ou nome_completo, buscar current_user (ou quando useCurrentUser=true)
  useEffect(() => {
    let mounted = true
    const shouldFetch = useCurrentUser || (!username && !nome_completo && !icone)

    if (!shouldFetch) return

    setLoading(true)
    api
      .getCurrentUser()
      .then((res) => {
        if (!mounted) return
        if (res.kind === "ok") {
          setUser(res.data)
        } else {
          console.warn("HeaderUsuario: falha ao obter current_user", res)
        }
      })
      .catch((err) => {
        console.warn("HeaderUsuario: erro ao chamar current_user", err)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [username, nome_completo, icone, useCurrentUser])


  const resolvedAvatar: ImageSourcePropType | undefined = (() => {
    if (icone != null) {

      return typeof icone === "string" ? ({ uri: icone } as ImageSourcePropType) : (icone as ImageSourcePropType)
    }
    const idIc = user?.id_icone as number | undefined | null
    if (typeof idIc === "number" && idIc > 0) {

      return (IMAGENS_ICONES[idIc] as ImageSourcePropType) ?? (fallbackImage as ImageSourcePropType)
    }
    return fallbackImage as ImageSourcePropType
  })()

  const displayName =
    nome_completo ?? (user ? `${user.first_name ?? ""}${user.last_name ? " " + user.last_name : ""}`.trim() : "")
  const displayUsername = username ?? user?.username ?? ""

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <View style={styles.container}>
        <View style={styles.avatarWrapper}>
          <Image
            source={resolvedAvatar}
            style={styles.avatar}
            resizeMode="cover"
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={primary} />
            </View>
          )}
        </View>

        <View style={styles.textColumn}>
          <Text style={[styles.fullName, { color: textPrimary }]}>
            {displayName || displayUsername || "Usuário"}
          </Text>
          {displayUsername ? (
            <Text style={[styles.username, { color: textSecondary }]}>@{displayUsername}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPressRightIcon}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons
            name={rightIconName as any}
            size={28}
            color={primary}
            style={{ marginRight: Platform.OS === "ios" ? 8 : 0 }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

HeaderUsuario.defaultProps = {
  icone: undefined,
  username: undefined,
  nome_completo: undefined,
  useCurrentUser: false,
  onPressRightIcon: undefined,
  rightIconName: "settings",
}

const styles = StyleSheet.create({
  safeArea: {
    width: "100%",
  },
  container: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
  },
  loadingOverlay: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  textColumn: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  fullName: {
    fontSize: 24,
    letterSpacing: 0.2,
    fontWeight: "800",
  },
  username: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
})

export default HeaderUsuario