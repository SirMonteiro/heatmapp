import React from "react"
import { View, Text, StyleSheet, Image } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"

export function HeaderLoja() {
  const { theme } = useAppTheme()
  const { colors } = theme

  return (
      <View style={styles.headerContainer}>
        <View style={styles.balanceContainer}>
          <Text style={styles.headerText}>Você possui:</Text>

          <Image
            source={require("../../assets/icons/coin.png")}
            style={styles.coinIcon}
            resizeMode="contain"
          />

          <Text style={styles.balanceText}>25</Text>
        </View>
      </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#F8F9FE",
    height: 71,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  balanceContainer: {
    flexDirection: "row",
    marginLeft: 15,
    marginTop: 25,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    fontFamily: "Inter-ExtraBold",
  },
  coinIcon: {
    width: 25,
    height: 25,
    marginHorizontal: 8,
  },
  balanceText: {
    color: "#FFB37C",
    fontSize: 18,
    fontWeight: "800",
  },
})
