import { View, Text, StyleSheet, Image, Pressable } from "react-native"
import { Screen } from "@/components/Screen"
import { useNavigation } from "@react-navigation/native"
import { useAppTheme } from "@/theme/context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"

export function Sobre() {
  const navigation = useNavigation()
  const { theme } = useAppTheme()
  const { colors } = theme

  return (
    <Screen preset="scroll" contentContainerStyle={styles.container}>
      {/* Header igual à de Configurações, com botão de voltar */}
      <View style={styles.headerContainer}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back-ios" size={22} color="#006FFD" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
      </View>

      {/* Corpo da tela */}
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/harakicringe.png")} 
          style={styles.image}
        />
        <Text style={[styles.text, { color: colors.text }]}>
          Aplicativo desenvolvido por <Text style={{color: "#006FFD"}}>RuntimeTerror Group</Text>, visando o progresso da civilização humana. 
          {"\n\n"}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec et libero id quam rutrum pharetra. Nulla nec scelerisque ante. Suspendisse dignissim sem lectus, a molestie risus elementum a. Phasellus pulvinar magna eu ullamcorper ultricies. 
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // centraliza o título
    marginBottom: 24,
  },
  backButton: {
    marginTop: 16,
    position: "absolute",
    left: 0, // mantém o botão fixo à esquerda sem deslocar o título
    padding: 8,
  },
  headerTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    alignItems: "center",
  },
  image: {
    width: 238,
    height: 357,
    maxWidth: "100%",
    overflow: "hidden",
    flex: 1

  },
  text: {
    width: 342,
    height: 160,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
    fontWeight: 400,
    textAlign: "left"
  },
})
