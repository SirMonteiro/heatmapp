import React from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
  Platform,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"

type UsuarioProps = {
  icone?: any // aceita ImageSourcePropType, uri string ou elemento qualquer (mantive `any` pra compatibilidade)
  username: string
  nome_completo: string
  onPressRightIcon?: () => void
  rightIconName?: string
}

/**
 * HeaderUsuario
 *
 * Componente header adaptado do código Figma fornecido.
 * Layout:
 * - Avatar circular à esquerda (100x100)
 * - Nome completo e @username ao centro-direita
 * - Ícone de ação à direita (opcional)
 *
 * Usa useAppTheme() quando disponível para cores/tema, senão usa valores padrão.
 */
export function HeaderUsuario({
  icone,
  username,
  nome_completo,
  onPressRightIcon,
  rightIconName = "settings",
}: UsuarioProps) {
  const theme = useAppTheme?.()
  const colors = (theme && (theme as any).colors) || {}
  const background = colors.background ?? "#e7e7e7"
  const primary = colors.primary ?? "#2897ff"
  const textPrimary = colors.text ?? "#000"
  const textSecondary = colors.muted ?? "#494a50"

  // normaliza fonte de imagem: aceita string uri ou ImageSourcePropType
  const avatarSource: ImageSourcePropType | undefined =
    icone == null
      ? undefined
      : typeof icone === "string"
      ? { uri: icone }
      : icone

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <View style={styles.container}>
        <Image
          source={
            avatarSource ??
            // placeholder básico (transparent) — substitua por require(...) se quiser um asset local
            { uri: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=" }
          }
          style={styles.avatar}
          resizeMode="cover"
        />

        <View style={styles.textColumn}>
          <Text style={[styles.fullName, { color: textPrimary }]}>
            {nome_completo}
          </Text>
          <Text style={[styles.username, { color: textSecondary }]}>
            @{username}
          </Text>
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
  onPressRightIcon: undefined,
  rightIconName: "settings",
}

const styles = StyleSheet.create({
  safeArea: {
    // segue o Figma com altura total visual ~120
    width: "100%",
  },
  container: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    // backgroundColor vem do SafeAreaView (theme) — manteve-se aqui apenas para fallback se necessário
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginLeft: 8,
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
    // fontFamily: "Inter-ExtraBold", // mantenha se sua app carrega essa font
  },
  username: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 22,
    // fontFamily: "Inter-Regular",
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
})
export default HeaderUsuario