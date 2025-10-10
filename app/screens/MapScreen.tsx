import { FC, useState, useEffect } from "react"
import {
  Modal,
  Pressable,
  TextStyle,
  View,
  ViewStyle,
  ActivityIndicator,
  Alert,
} from "react-native"
import * as Location from "expo-location"
import LeafletView from "react-native-leaflet-map"
import type {
  LeafletWebViewEvent,
  MapLayer,
  MapMarker,
  LatLngLiteral,
} from "react-native-leaflet-map"

import { ActionPlaceholder } from "@/components/ActionPlaceholder"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { DemoTabScreenProps } from "@/navigators/DemoNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

type ActionType = "audio" | "sintomas" | "area-verde"
type FilterType = "poluicao" | "sintomas" | "areas-verdes"

export const MapScreen: FC<DemoTabScreenProps<"DemoMap">> = function MapScreen(_props) {
  const { themed, theme } = useAppTheme()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionType | undefined>(undefined)
  const [activeFilter, setActiveFilter] = useState<FilterType>("poluicao")
  const [mapCenter, setMapCenter] = useState<LatLngLiteral>({ lat: -23.5489, lng: -46.6388 })
  const [mapZoom, setMapZoom] = useState(13)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const mapLayers: MapLayer[] = [
    {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      baseLayerIsChecked: true,
      baseLayerName: "OpenStreetMap",
      layerType: "TileLayer",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
  ]

  useEffect(() => {
    requestLocationPermission()
  }, [])

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("Location permission denied")
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  const handleGetUserLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const { status } = await Location.getForegroundPermissionsAsync()

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, permita o acesso à localização nas configurações do aplicativo.",
        )
        setIsLoadingLocation(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const userPos: LatLngLiteral = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      }

      setMapCenter(userPos)
      setMapZoom(16)

      const userMarker: MapMarker = {
        id: "user-location",
        position: userPos,
        icon: "🔵",
        size: [35, 35],
      }

      setMarkers((prev) => {
        const filtered = prev.filter((m) => m.id !== "user-location")
        return [...filtered, userMarker]
      })

      console.log("User location set:", userPos)
    } catch (error) {
      console.error("Error getting location:", error)
      Alert.alert("Erro", "Não foi possível obter sua localização.")
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Aviso", "Digite um local para buscar")
      return
    }

    setIsSearching(true)
    try {
      // Add delay to respect Nominatim rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery,
      )}&limit=1&addressdetails=1`

      const response = await fetch(url, {
        headers: {
          "User-Agent": "HeatmapApp/1.0 (React Native)",
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          Alert.alert("Aviso", "Muitas requisições. Aguarde um momento e tente novamente.")
          return
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()
      let results

      try {
        results = JSON.parse(text)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        console.error("Response text:", text.substring(0, 200))
        throw new Error("Resposta inválida do servidor")
      }

      if (results && results.length > 0) {
        const result = results[0]
        const searchPos: LatLngLiteral = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        }

        setMapCenter(searchPos)
        setMapZoom(16)

        const searchMarker: MapMarker = {
          id: `search-${Date.now()}`,
          position: searchPos,
          icon: "🔍",
          size: [30, 30],
        }

        setMarkers((prev) => [...prev, searchMarker])
        setSearchQuery("")
      } else {
        Alert.alert("Não encontrado", "Nenhum local encontrado com esse nome.")
      }
    } catch (error) {
      console.error("Search error:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      Alert.alert("Erro na busca", errorMessage)
    } finally {
      setIsSearching(false)
    }
  }

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.max(prev - 1, 1))
  }

  const handleActionPress = (action: ActionType) => {
    setCurrentAction(action)
    setIsModalVisible(true)
  }

  const closeModal = () => {
    setIsModalVisible(false)
    setCurrentAction(undefined)
  }

  const handleFilterPress = (filter: FilterType) => {
    setActiveFilter(filter)
  }

  const getButtonLabel = () => {
    switch (activeFilter) {
      case "poluicao":
        return "enviar audio"
      case "sintomas":
        return "enviar sintomas"
      case "areas-verdes":
        return "reportar área verde"
      default:
        return "enviar"
    }
  }

  const getButtonAction = (): ActionType => {
    switch (activeFilter) {
      case "poluicao":
        return "audio"
      case "sintomas":
        return "sintomas"
      case "areas-verdes":
        return "area-verde"
      default:
        return "audio"
    }
  }

  const getButtonIcon = () => {
    switch (activeFilter) {
      case "poluicao":
        return "components"
      case "sintomas":
        return "community"
      case "areas-verdes":
        return "check"
      default:
        return "components"
    }
  }

  const handleMapMessage = (event: LeafletWebViewEvent) => {
    if (event.tag === "onMapClicked") {
      const newMarker: MapMarker = {
        id: `marker-${Date.now()}`,
        position: event.location,
        icon: "📍",
        size: [30, 30],
      }
      setMarkers((prev) => [...prev, newMarker])
    }
  }

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)} safeAreaEdges={["top"]}>
      <View style={themed($header)}>
        <Pressable
          style={themed([$filterButton, activeFilter === "poluicao" && $activeFilter])}
          onPress={() => handleFilterPress("poluicao")}
        >
          <Text
            style={themed([$filterText, activeFilter === "poluicao" && $activeFilterText])}
            text="Poluição sonora"
          />
        </Pressable>

        <Pressable
          style={themed([$filterButton, activeFilter === "sintomas" && $activeFilter])}
          onPress={() => handleFilterPress("sintomas")}
        >
          <Text
            style={themed([$filterText, activeFilter === "sintomas" && $activeFilterText])}
            text="sintomas"
          />
        </Pressable>

        <Pressable
          style={themed([$filterButton, activeFilter === "areas-verdes" && $activeFilter])}
          onPress={() => handleFilterPress("areas-verdes")}
        >
          <Text
            style={themed([$filterText, activeFilter === "areas-verdes" && $activeFilterText])}
            text="áreas verdes"
          />
        </Pressable>
      </View>

      <View style={$mapContainer}>
        <LeafletView
          mapLayers={mapLayers}
          mapMarkers={markers}
          mapCenterPosition={mapCenter}
          zoom={mapZoom}
          onMessage={handleMapMessage}
        />

        <View style={themed($searchContainer)}>
          <TextField
            style={themed($searchInput)}
            placeholder="Buscar localização..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            editable={!isSearching}
            containerStyle={themed($searchInputContainer)}
          />
          <Pressable style={themed($searchButton)} onPress={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <ActivityIndicator size="small" color={theme.colors.palette.neutral100} />
            ) : (
              <Text style={themed($searchButtonText)}>🔍</Text>
            )}
          </Pressable>
        </View>

        <View style={themed($mapControls)}>
          <Pressable
            style={themed($controlButton)}
            onPress={handleGetUserLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Text style={themed($gpsButtonText)}>📍</Text>
            )}
          </Pressable>

          <View style={themed($zoomControls)}>
            <Pressable style={themed($controlButton)} onPress={handleZoomIn}>
              <Text style={themed($zoomText)}>+</Text>
            </Pressable>
            <View style={themed($zoomDivider)} />
            <Pressable style={themed($controlButton)} onPress={handleZoomOut}>
              <Text style={themed($zoomText)}>−</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={themed($bottomButtonContainer)}>
        <Button
          style={themed($bottomButton)}
          textStyle={themed($bottomButtonText)}
          onPress={() => handleActionPress(getButtonAction())}
          LeftAccessory={(props) => (
            <Icon icon={getButtonIcon()} size={20} containerStyle={props.style} />
          )}
        >
          {getButtonLabel()}
        </Button>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <View style={themed($modalContainer)}>
          <View style={themed($modalHeader)}>
            <Pressable style={themed($closeButton)} onPress={closeModal}>
              <Icon icon="x" size={24} />
            </Pressable>
          </View>
          <ActionPlaceholder actionType={currentAction} />
        </View>
      </Modal>
    </Screen>
  )
}

const $screenContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
})

const $filterButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.sm,
  paddingVertical: spacing.xs,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
})

const $activeFilter: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tint,
})

const $filterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 12,
  color: colors.text,
  textAlign: "center",
})

const $activeFilterText: ThemedStyle<TextStyle> = ({ colors }) => ({
  color: colors.palette.neutral100,
  fontWeight: "bold",
})

const $mapContainer: ViewStyle = {
  flex: 1,
  position: "relative",
}

const $searchContainer: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  top: spacing.md,
  left: spacing.md,
  right: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.background,
  borderRadius: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
  zIndex: 1000,
})

const $searchInputContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
  backgroundColor: "transparent",
})

const $searchInput: ThemedStyle<TextStyle> = ({ colors }) => ({
  height: 48,
  fontSize: 16,
  color: colors.text,
  backgroundColor: "transparent",
})

const $searchButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 48,
  width: 48,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: colors.palette.primary500,
  borderTopRightRadius: 12,
  borderBottomRightRadius: 12,
})

const $searchButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 20,
})

const $gpsButtonText: ThemedStyle<TextStyle> = () => ({
  fontSize: 24,
})

const $mapControls: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  right: spacing.md,
  bottom: 100,
  gap: spacing.sm,
  zIndex: 1000,
})

const $controlButton: ThemedStyle<ViewStyle> = ({ colors, spacing: _spacing }) => ({
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.background,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $zoomControls: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
  borderRadius: 24,
  overflow: "hidden",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
})

const $zoomDivider: ThemedStyle<ViewStyle> = ({ colors }) => ({
  height: 1,
  backgroundColor: colors.border,
})

const $zoomText: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 24,
  fontWeight: "600",
  color: colors.text,
  lineHeight: 24,
})

const $bottomButtonContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  backgroundColor: colors.background,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
})

const $bottomButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  backgroundColor: colors.palette.primary500,
  minHeight: 50,
  minWidth: 250,
  maxWidth: 350,
})

const $bottomButtonText: ThemedStyle<TextStyle> = ({ typography }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
})

const $modalContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.background,
})

const $modalHeader: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  flexDirection: "row",
  justifyContent: "flex-end",
  paddingHorizontal: spacing.md,
  paddingTop: spacing.md,
})

const $closeButton: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  padding: spacing.xs,
  borderRadius: 20,
  backgroundColor: colors.palette.neutral200,
})
;("")
