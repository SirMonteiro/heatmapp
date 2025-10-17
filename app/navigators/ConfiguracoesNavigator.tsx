import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { Configuracoes } from "@/screens/Configuracoes"
import { Sobre } from "@/screens/Sobre"

export type ConfiguracoesStackParamList = {
  Configuracoes: undefined
  Sobre: undefined
}

const Stack = createNativeStackNavigator<ConfiguracoesStackParamList>()

export function ConfiguracoesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Configuracoes" component={Configuracoes} />
      <Stack.Screen name="Sobre" component={Sobre} />
    </Stack.Navigator>
  )
}
