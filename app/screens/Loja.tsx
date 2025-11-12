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
import { IMAGENS_ICONES, fallbackImage } from "@/utils/IconesImagens"

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


  useEffect(() => {
    let mounted = true

    async function loadIcones() {
      setLoading(true)
      const res = await api.getIconesDisponiveis()
      if (!mounted) return

      if (res.kind === "ok") {
        //console.log("Fetch de icones realizado com sucesso!");
        const items: Produto[] = res.data.map((i: Icone) => ({
          id: i.id,
          imagem: IMAGENS_ICONES[i.id] ?? fallbackImage,
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

