import React from "react"
import { View, Text, StyleSheet, Image, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"
import { HeaderLoja } from "@/components/HeaderLoja"
import { BannerLoja } from "@/components/BannerLoja"
import { ItemLoja } from "@/components/ItemLoja"


export function Loja() {
  const { theme } = useAppTheme()
  const { colors } = theme

  // Itens que serão passados para o ItemLoja
  const produtos = [
    {
      id: 1,
      imagem: require("../../assets/images/osaka-1.png"),
      titulo: "Ícone Osaka",
      descricao: "Customize seu perfil com esse ícone autista!",
      preco: 25,
    },
    {
      id: 2,
      imagem: require("../../assets/images/gatoLingua.webp"),
      titulo: "Ícone Gato 1",
      descricao: "Customize seu perfil com esse ícone de gato!",
      preco: 30,
    },
    {
      id: 3,
      imagem: require("../../assets/images/gatoSentido.webp"),
      titulo: "Ícone Gato 2",
      descricao: "Customize seu perfil com esse ícone de gato!",
      preco: 35,
    },
    {
      id: 4,
      imagem: require("../../assets/images/bocchi-1.png"),
      titulo: "Ícone Bocchi",
      descricao: "Customize seu perfil com esse ícone autista musical!",
      preco: 40,
    },
  ];

//console.log("VOU ME MATAR")
  return (
    
    <SafeAreaView style={{ flex: 1 }}> 
    {/* flex 1 é pra ocupar a tela toda*/}
    <HeaderLoja />
    <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
      {/*  paddinBottom é pra que a navbar não fique em cima*/}
      <Text>{"\n\n"}</Text>
      <BannerLoja />
      {produtos.map((produto) => (
        <ItemLoja
          key={produto.id}
          imagem={produto.imagem}
          titulo={produto.titulo}
          descricao={produto.descricao}
          preco={produto.preco}
        />
      ))}
    </ScrollView>
  </SafeAreaView>
  )
}

