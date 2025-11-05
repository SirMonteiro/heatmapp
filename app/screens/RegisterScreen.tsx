import React, { useState } from "react"
import { View, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native"
import { useAuth } from "../context/AuthContext" 


export function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const API_URL = "" // coloca o ip:8000/api

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
        Alert.alert("Erro, ", "O username deve ter menos de 15 caracteres.")
        return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateFields()) return

    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/usuarios/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      })

      if (response.ok) {
        // ✅ Registro bem-sucedido
        Alert.alert("Sucesso", "Usuário registrado com sucesso! Fazendo login...")

        // Faz login automático
        const loginSuccess = await login(username, password)
        if (loginSuccess) {
          console.log("Login automático bem-sucedido!")
        } else {
          Alert.alert("Erro", "Falha ao realizar login automático.")
          navigation.navigate("Login")
        }
      } else {
        const errorData = await response.json()
        console.error("Erro ao registrar:", errorData)
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
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      <Text style={styles.title}>Crie sua conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome de usuário"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false} 
      />

      <TextInput
        style={styles.input}
        placeholder="Primeiro nome"
        value={firstName}
        onChangeText={setFirstName}
      />

      <TextInput
        style={styles.input}
        placeholder="Sobrenome"
        value={lastName}
        onChangeText={setLastName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        autoCorrect={false} 
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Cadastrando..." : "Registrar"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Já tem conta? Faça login</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    color: "#007bff",
    marginTop: 20,
  },
})
