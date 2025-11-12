import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, Image, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { useAppTheme } from "@/theme/context"
import { HeaderLoja } from "@/components/HeaderLoja"
import { BannerLoja } from "@/components/BannerLoja"
import { ItemLoja } from "@/components/ItemLoja"
import { api } from "@/services/api"
import { Icone } from "@/services/api/types"

 type Produto =  {
    id: number
    imagem: any
    titulo: string
    descricao: string
    preco: number
  }

export function Loja() {
  const { theme } = useAppTheme()
  const { colors } = theme


  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)

  // TRABALHO DE CORNO AAAAAAAAAAAAAAAAAA
  const ICON_IMAGES: Record<number, any> = {
    1: require("../../assets/images/icones/icone1.jpeg"),
    2: require("../../assets/images/icones/icone2.jpeg"),
    3: require("../../assets/images/icones/icone3.jpeg"),
    4: require("../../assets/images/icones/icone4.jpeg"),
    5: require("../../assets/images/icones/icone5.jpeg"),
    6: require("../../assets/images/icones/icone6.jpeg"),
    7: require("../../assets/images/icones/icone7.jpeg"),
    8: require("../../assets/images/icones/icone8.jpeg"),
  }

  const fallbackImage = ICON_IMAGES[1] // fazer um fallback real depois...

  useEffect(() => {
    let mounted = true

    async function loadIcones() {
      setLoading(true)
      const res = await api.getIcones()
      if (!mounted) return

      if (res.kind === "ok") {
        //console.log("Fetch de icones realizado com sucesso!");
        const items: Produto[] = res.data.map((i: Icone) => ({
          id: i.id,
          imagem: ICON_IMAGES[i.id - 1] ?? fallbackImage,
          titulo: i.titulo,
          descricao: i.descricao,
          preco: i.preco,
        }))
        setProdutos(items)
      } else {
        console.warn("Erro ao carregar ícones:", res)
        // fallback com lista vazia 
        setProdutos([])
      }

      setLoading(false)
    }

    loadIcones()
    return () => {
      mounted = false
    }
  }, [])

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

