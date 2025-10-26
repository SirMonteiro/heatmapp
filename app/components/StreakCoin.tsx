import {View, Text, Image, StyleSheet} from "react-native"
import { useAppTheme } from "@/theme/context"

type UsuarioProps  = {
    streak: number
    moedas: number
}

export function StreakCoin ({streak, moedas}: UsuarioProps) {
    const { theme } = useAppTheme()
    const { colors } = theme

    return (
        <View style={styles.mainContainer}>
            <View style={styles.dados}>
                <Text style={styles.info}>Streak: </Text>
                <Text style={styles.streakText}>{streak}</Text>
                <Image
                source={require("../../assets/icons/fire.png")}
                style={styles.fireIcon}
                />
            </View>
            <View style={styles.dados}>
                <Text style={styles.info}>Moedas: </Text>
                <Text style={styles.moedas}>{moedas}</Text>
                <Image
                source={require("../../assets/icons/coin.png")}
                style={styles.coinIcon}
                />
            </View>
            <Text>{"\n"}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        maxHeight: 90,
    },
    dados: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
    },
    info: {
        marginLeft: 24,
        fontFamily: "Inter-ExtraBold",
        fontWeight: 800,
        letterSpacing: 0.2,
        fontSize: 24,
    },
    streakText: {
        color: "#ed3241",
        fontFamily: "Inter-ExtraBold",
        fontWeight: 800,
        letterSpacing: 0.2,
        fontSize: 24,
    },
    moedas: {
        color: "#FFB37C",
        fontFamily: "Inter-ExtraBold",
        fontWeight: 800,
        letterSpacing: 0.2,
        fontSize: 24,
        marginLeft: 8
    },
    fireIcon: {
        width: 28,
        height: 28,
        marginLeft: 8,
    },
    coinIcon: {
        width: 28,
        height: 28,
        marginLeft: 8,
    }
})