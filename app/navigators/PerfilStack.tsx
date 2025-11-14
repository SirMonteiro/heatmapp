import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import {Perfil} from "@/screens/Perfil"
import { IconChangeScreen } from "@/screens/IconChangeScreen"

export type PerfilStackParamList = {
  PerfilMain: undefined
  IconChange: undefined
}

const Stack = createNativeStackNavigator<PerfilStackParamList>()

export function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PerfilMain" component={Perfil} />
      <Stack.Screen
        name="IconChange"
        component={IconChangeScreen}
        options={{ title: "Alterar ícone", headerShown: true }}
      />
    </Stack.Navigator>
  )
}