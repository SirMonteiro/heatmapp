import React from "react"
import { View, Text, StyleSheet, Image, ScrollView } from "react-native"
import { useAppTheme } from "@/theme/context"
import { SafeAreaView } from "react-native-safe-area-context"
import { HeaderLoja } from "@/components/HeaderLoja"
import HeaderUsuario from "@/components/HeaderUsuario"


export function Perfil () {
    const { theme } = useAppTheme()
    const { colors } = theme

    const usuario = {
        icon: require("../../assets/images/gatoLingua.webp"),
        username: "Usarilson",
        nome_completo: "Usuarilson da Silva"
    }

    return ( 
        <SafeAreaView style={{flex: 1}}>
            <HeaderUsuario 
            icone={usuario.icon}
            username= {usuario.username}
            nome_completo={usuario.nome_completo}/>
        </SafeAreaView>
    )
}