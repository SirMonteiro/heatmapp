import React from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import { Screen } from "@/components/Screen"
import { useAppTheme } from "@/theme/context"

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from "@react-navigation/native";

export function Configuracoes() {
  const { theme } = useAppTheme()
  const { colors, spacing } = theme
  const navigation = useNavigation()

  return (
    <Screen preset="scroll" contentContainerStyle={styles.container}>
      <Text style={[styles.header, { color: colors.text }]}>Configurações</Text>

      <View style={[styles.section, { backgroundColor: colors.background }]}>
        <Pressable style={styles.item} onPress={() => console.log("Ajustes da conta")}>
          <Text style={styles.itemText}>Configurações da Conta</Text>
          <MaterialIcons name="arrow-forward-ios" size={24} color="black" />
        </Pressable>

        <Pressable style={styles.item} onPress={() => console.log("Ajustes da conta")}>
          <Text style={styles.itemText}>Notificações</Text>
          <MaterialIcons name="arrow-forward-ios" size={24} color="black" />
        </Pressable>

        <Pressable style={styles.item} onPress={() => navigation.navigate("Sobre" as never)}>
          <Text style={styles.itemText}>Sobre</Text>
          <MaterialIcons name="arrow-forward-ios" size={24} color="black" />
        </Pressable>

        <Pressable style={styles.item} onPress={() => console.log("Crueldade")}>
          <Text style={styles.itemText}>Escolher qual letalidade inflingir em OgawaSama</Text>
          <MaterialIcons name="arrow-forward-ios" size={24} color="black" />
        </Pressable>

      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: "center",
  },
  section: {
    borderRadius: 12,
    paddingVertical: 4,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",        // <-- coloca o texto e o ícone lado a lado
    justifyContent: "space-between", // <-- empurra o ícone pra direita
    alignItems: "center",        // <-- centraliza verticalmente
  },
  itemText: {
    fontSize: 16,
  },
})
