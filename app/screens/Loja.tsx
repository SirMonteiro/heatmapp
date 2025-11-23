import React, { useState, useEffect, useCallback } from "react"
import { useFocusEffect } from "@react-navigation/native"
import { View, Text, StyleSheet, Image, ScrollView, Alert } from "react-native"
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
  const [moedas, setMoedas] = useState<number | null>(null) // pra atualizar a header

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

      const userRes = await api.getCurrentUser()
      if (userRes.kind === "ok") setMoedas(userRes.data.moedas ?? 0)
      else setMoedas(null)
      
      setLoading(false)
    }

    loadIcones()
    return () => {
      mounted = false
    }
  }, [])

  useFocusEffect(
  useCallback(() => {
    let mounted = true

    async function reloadUser() {
      const res = await api.getCurrentUser()
      if (!mounted) return
      setMoedas(res.kind === "ok" ? res.data.moedas ?? 0 : 0)
    }

    reloadUser()

    return () => {
      mounted = false
    }
  }, [])
)

  async function handleBuy(iconeId: number) {
    try {
      const res = await api.comprarIcone(iconeId)
      if (res.kind === "ok") {
        // compra bem-sucedida
        Alert.alert("Compra realizada", res.data.detail ?? "Compra efetuada com sucesso.")
        // remove o ícone comprado da lista
        setProdutos((prev) => prev.filter((p) => p.id !== iconeId))
        // atualiza saldo no header se backend retornou moedas
        if (typeof res.data.moedas === "number") {
          setMoedas(res.data.moedas)
        } else {
          // ou busca o usuário atual novamente
          const userRes = await api.getCurrentUser()
          if (userRes.kind === "ok") setMoedas(userRes.data.moedas ?? 0)
        }
      } else {
        // lidar com erros: saldo insuficiente, já comprado, 401, etc.
        const msg = (res as any).data?.detail ?? (res as any).message ?? "Erro ao comprar."
        Alert.alert("Não foi possível comprar", msg)
      }
    } catch (e) {
      console.warn(e)
      Alert.alert("Erro", "Erro ao processar a compra. Tente novamente.")
    }
  }

//console.log("VOU ME MATAR")
  return (

    
    
    <SafeAreaView style={{ flex: 1 }}> 
    {/* flex 1 é pra ocupar a tela toda*/}
    <HeaderLoja moedas={moedas}/>
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
          onBuy={() => handleBuy(produto.id)}
          disabled={moedas !== null && moedas < produto.preco}
        />
      ))}
    </ScrollView>
  </SafeAreaView>
  )
}

