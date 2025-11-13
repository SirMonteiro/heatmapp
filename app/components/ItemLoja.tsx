import { View, Text, StyleSheet, Image, Alert } from "react-native";
import { Button } from "@/components/Button";

type ItemLojaProps = {
  imagem: any; // path da imagem
  titulo: string;
  descricao: string;
  preco: number;
  onBuy?: () => void
  disabled: boolean
};

export function ItemLoja({ imagem, titulo, descricao, preco, onBuy, disabled}: ItemLojaProps) {
  return (
    <View style={styles.container}>
      <Image source={imagem} style={styles.imagem} resizeMode="cover" />

      {/* Bloco da direita (texto + preço + botão) */}
      <View style={styles.infoContainer}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>

        {/* Linha com preço e botão */}
        <View style={styles.linhaInferior}>
          <View style={styles.precoContainer}>
            <Text style={styles.precoTitulo}>Preço:</Text>
            <Image
              source={require("../../assets/icons/coin.png")}
              style={styles.moedaIcon}
            />
            <Text style={styles.preco}>{preco}</Text>
          </View>

          <Button
            text="Comprar"
            preset="filled"
            onPress={onBuy}
            style={[styles.botao, disabled && styles.botaoDesabilitado]} // wooow
            textStyle={{ color: "#FFF", fontWeight: "700" }}
            disabled={disabled}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f8f9fe",
    borderRadius: 16,
    padding: 12,
    marginVertical: 8,
    alignItems: "flex-start",
  },
  imagem: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
    flexDirection: "column",
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2024",
  },
  descricao: {
    fontSize: 12,
    color: "#71727a",
    marginTop: 4,
    lineHeight: 16,
    flexShrink: 1, // deixa o texto quebrar em várias linhas
  },
  linhaInferior: {
    flexDirection: "row",
    justifyContent: "space-between", // preço à esquerda, botão à direita
    alignItems: "center",
    marginTop: 10,
  },
  precoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  precoTitulo: {
    fontFamily: "Inter-ExtraBold",
    fontWeight: "700",
    fontSize: 14,
    color: "#000",
    marginRight: 4,
  },
  moedaIcon: {
    width: 20,
    height: 20,
    marginRight: 4,
  },
  preco: {
    fontFamily: "Inter-ExtraBold",
    fontWeight: "800",
    color: "#ffb37c",
    fontSize: 16,
    letterSpacing: 0.1,
  },
  botao: {
    backgroundColor: "#006FFD",
    borderRadius: 12,
    height: 36,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  botaoDesabilitado: {
    backgroundColor: "#999",

  }
});
