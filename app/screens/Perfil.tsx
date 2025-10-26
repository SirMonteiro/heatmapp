import React from "react"
import { View, Text, StyleSheet, Image, ScrollView } from "react-native"
import { useAppTheme } from "@/theme/context"
import { SafeAreaView } from "react-native-safe-area-context"
import { HeaderLoja } from "@/components/HeaderLoja"
import {HeaderUsuario} from "@/components/HeaderUsuario"
import {StreakCoin} from "@/components/StreakCoin"
import { Separator } from "@/components/Separator"
import { ItemRanking } from "@/components/ItemRanking"

export function Perfil () {
    const { theme } = useAppTheme()
    const { colors } = theme

    const usuario = {
        icon: require("../../assets/images/gatoLingua.webp"),
        username: "Usarilson",
        nome_completo: "Usuarilson da Silva",
        streak: 15,
        moedas: 25
    }

    const rankingData = [
        {
            id: "1",
            username: "Desgraçadilson",
            icone: require("../../assets/images/freaky_cat.jpeg"),
            streak: 35
        },
        {
            id: "2",
            username: "faltalover",
            icone: require("../../assets/images/bocchi-1.png"),
            streak: 32
        },
        {
            id: "3",
            username: "esfaqueador_do_parque",
            icone: require("../../assets/images/gatoSentido.webp"),
            streak: 30
        },
        {
            id: "4",
            username: "bergmanfan",
            icone: require("../../assets/images/osaka-1.png"),
            streak: 20
        },
        {
            id: "5",
            username: "ononokiposting",
            icone: require("../../assets/images/bocchi-1.png"),
            streak: 15
        },
        {
            id: "6",
            username: "react-native-hater",
            icone: require("../../assets/images/bocchi-1.png"),
            streak: 5
        },

    ]

    return ( 
        <SafeAreaView style={{flex: 1}}>
            <HeaderUsuario 
            icone={usuario.icon}
            username= {usuario.username}
            nome_completo={usuario.nome_completo}/>
            <Separator/>
            <StreakCoin
            streak={usuario.streak}
            moedas={usuario.moedas}/>
            <Separator/>
            <ScrollView style={styles.rankingContainer}>
                <Text style={styles.rankingText}>Ranking</Text>

                {rankingData.map((item, index) => (
                    <ItemRanking
                    key={item.id}
                    posicao={index + 1}
                    icone={item.icone}
                    username={item.username}
                    streak={item.streak}/>
                ))}
            </ScrollView>
            <Separator/>
        </SafeAreaView>
    )
}


const styles = StyleSheet.create({
    rankingContainer: {
        maxHeight: 600,
    },
    rankingText: {
        textAlign: "center",
        fontFamily: "Inter-ExtraBold",
        fontWeight: 800,
        letterSpacing: 0.2,
        fontSize: 24,
    }
})