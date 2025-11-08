import { FC, useState } from "react"
import { Alert, TextStyle, ViewStyle } from "react-native"

import { Button } from "@/components/Button"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { useAuth } from "@/context/AuthContext"
import type { AppStackScreenProps } from "@/navigators/AppNavigator"
import { api } from "@/services/api"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface RegisterScreenProps extends AppStackScreenProps<"Register"> {}

export const RegisterScreen: FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const { themed } = useAppTheme()

  const validateFields = () => {
    if (!username || !firstName || !lastName || !email || !password) {
      Alert.alert("Erro", "Preencha todos os campos obrigatórios.")
      return false
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert("Erro", "O nome de usuário deve conter apenas letras, números ou _.")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Erro", "Digite um email válido.")
      return false
    }

    if (password.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres.")
      return false
    }

    if (username.length > 15) {
      Alert.alert("Erro", "O username deve ter menos de 15 caracteres.")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateFields() || loading) return

    setLoading(true)
    try {
      const response = await api.registerUser({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
      })

      if (response.kind === "ok") {
        Alert.alert("Sucesso", "Usuário registrado com sucesso! Fazendo login...")

        const loginSuccess = await login(username, password)

        if (!loginSuccess) {
          Alert.alert("Erro", "Falha ao realizar login automático.")
          navigation.navigate("Login")
        }
      } else {
        console.error("Erro ao registrar:", response.kind)
        Alert.alert("Erro", "Não foi possível registrar o usuário.")
      }
    } catch (err) {
      console.error("Erro na requisição:", err)
      Alert.alert("Erro", "Falha de conexão com o servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text text="Crie sua conta" preset="heading" style={themed($title)} />
      <Text
        text="Preencha suas informações para continuar"
        preset="subheading"
        style={themed($subtitle)}
      />

      <TextField
        value={username}
        onChangeText={setUsername}
        label="Nome de usuário"
        placeholder="Digite seu nome de usuário"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        containerStyle={themed($textField)}
      />

      <TextField
        value={firstName}
        onChangeText={setFirstName}
        label="Primeiro nome"
        placeholder="Digite seu primeiro nome"
        autoCapitalize="words"
        containerStyle={themed($textField)}
      />

      <TextField
        value={lastName}
        onChangeText={setLastName}
        label="Sobrenome"
        placeholder="Digite seu sobrenome"
        autoCapitalize="words"
        containerStyle={themed($textField)}
      />

      <TextField
        value={email}
        onChangeText={setEmail}
        label="Email"
        placeholder="Digite seu email"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        containerStyle={themed($textField)}
      />

      <TextField
        value={password}
        onChangeText={setPassword}
        label="Senha"
        placeholder="Digite uma senha"
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        containerStyle={themed($textField)}
      />

      <Button
        text={loading ? "Cadastrando..." : "Registrar"}
        onPress={handleRegister}
        disabled={loading}
        preset="reversed"
        style={themed($primaryButton)}
      />

      <Button
        text="Já tem conta? Faça login"
        onPress={() => navigation.navigate("Login")}
        style={themed($secondaryButton)}
      />
    </Screen>
  )
}

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.xxl,
})

const $title: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.xs,
})

const $subtitle: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
})

const $primaryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.md,
})

const $secondaryButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.sm,
})
