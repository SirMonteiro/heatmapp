import {View, Text, Image, StyleSheet} from "react-native"

type ItemRankingProps = {
  posicao: number;
  icone: any; // path da imagem?
  username: string;
  streak: number;
};

export function ItemRanking ({posicao, icone, username, streak}: ItemRankingProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.posicao}>{posicao}</Text>
            <Image
            source={icone}
            style={styles.icone}
            />
            <Text style={styles.username}>{username}</Text>
            <View style={styles.streakContainer}>
                <Image
                source={require("../../assets/icons/fire.png")}
                style={styles.fogo}
                />
                <Text style={styles.streak}>{streak}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: "#ddd"
  },
  posicao: {
    width: 30,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  icone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 10
  },
  username: {
    flex: 1,
    fontSize: 16,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fogo: {
    width: 40,
    height: 40,
  },
  streak: {
    color: "#ed3241",
    fontFamily: "Inter-ExtraBold",
    fontWeight: 800,
    letterSpacing: 0.2,
    fontSize: 18,
  }
});