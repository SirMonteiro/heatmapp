import { FC, useState, useEffect, useRef, useMemo } from "react"
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
import MapView, { PROVIDER_GOOGLE, Heatmap } from "react-native-maps"
import type { Region } from "react-native-maps"

import { ActionPlaceholder } from "@/components/ActionPlaceholder"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { DemoTabScreenProps } from "@/navigators/DemoNavigator"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// ============================================================================
// Types
// ============================================================================

type ActionType = "audio" | "sintomas" | "area-verde"
type FilterType = "poluicao" | "sintomas" | "areas-verdes"

interface HeatmapPoint {
  latitude: number
  longitude: number
  weight: number
}

interface NominatimSearchResult {
  lat: string
  lon: string
  display_name: string
  addresstype?: string
}

// ============================================================================
// Constants
// ============================================================================

const INITIAL_REGION: Region = {
  latitude: -23.483134,
  longitude: -46.500682,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

const NOMINATIM_API_URL = "https://nominatim.openstreetmap.org/search"
const SEARCH_DEBOUNCE_MS = 1000
const ANIMATION_DURATION_MS = 300
const LOCATION_ANIMATION_DURATION_MS = 1000

const ZOOM_FACTOR_BASE = 0.0922
const MIN_MAP_DELTA = 0.005
const MAX_MAP_DELTA = 1.5
const HEATMAP_RADIUS_BASE = 40
const MIN_HEATMAP_RADIUS = 20
const MAX_HEATMAP_RADIUS = 80
const HEATMAP_OPACITY = 0.7

const HEATMAP_COLORS = {
  HIGH: "#ff0000",
  MEDIUM_HIGH: "#ff9900",
  MEDIUM: "#ffff00",
  LOW: "#00ff00",
} as const

const WEIGHT_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM_HIGH: 0.6,
  MEDIUM: 0.4,
} as const

const HEATMAP_GRADIENT = {
  colors: [
    HEATMAP_COLORS.LOW,
    "#c8ff00",
    HEATMAP_COLORS.MEDIUM,
    HEATMAP_COLORS.MEDIUM_HIGH,
    HEATMAP_COLORS.HIGH,
  ],
  startPoints: [
    0,
    WEIGHT_THRESHOLDS.MEDIUM / 2,
    WEIGHT_THRESHOLDS.MEDIUM,
    WEIGHT_THRESHOLDS.MEDIUM_HIGH,
    1,
  ],
  colorMapSize: 512,
}

// ============================================================================
// Helpers
// ============================================================================

const clampDelta = (value: number): number =>
  Math.min(MAX_MAP_DELTA, Math.max(MIN_MAP_DELTA, value))

const normalizeRegion = (targetRegion: Region): Region => ({
  ...targetRegion,
  latitudeDelta: clampDelta(targetRegion.latitudeDelta),
  longitudeDelta: clampDelta(targetRegion.longitudeDelta),
})

const getHeatmapRadius = (latitudeDelta: number): number => {
  const zoomRatio = ZOOM_FACTOR_BASE / Math.max(latitudeDelta, MIN_MAP_DELTA)
  const radius = HEATMAP_RADIUS_BASE * zoomRatio
  return Math.min(MAX_HEATMAP_RADIUS, Math.max(MIN_HEATMAP_RADIUS, Math.round(radius)))
}

/**
 * Sample heatmap data for different filter types
 * In production, this would come from an API
 */
const SAMPLE_HEATMAP_DATA: HeatmapPoint[] = [
  { latitude: -23.483134, longitude: -46.500682, weight: 1.0 },
  { latitude: -23.484134, longitude: -46.501682, weight: 0.8 },
  { latitude: -23.482134, longitude: -46.499682, weight: 0.6 },
  { latitude: -23.485134, longitude: -46.502682, weight: 0.9 },
  { latitude: -23.481134, longitude: -46.498682, weight: 0.7 },
]

const SINTOMAS_HEATMAP_DATA: HeatmapPoint[] = [
  { latitude: -23.483134, longitude: -46.500682, weight: 0.5 },
  { latitude: -23.484134, longitude: -46.501682, weight: 0.7 },
]

const AREAS_VERDES_HEATMAP_DATA: HeatmapPoint[] = [
  { latitude: -23.483134, longitude: -46.500682, weight: 0.9 },
  { latitude: -23.485134, longitude: -46.502682, weight: 1.0 },
]

// ============================================================================
// Component
// ============================================================================

export const MapScreen: FC<DemoTabScreenProps<"DemoMap">> = function MapScreen(_props) {
  const { themed, theme } = useAppTheme()
  const mapRef = useRef<MapView>(null)

  // State management
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<ActionType | undefined>(undefined)
  const [activeFilter, setActiveFilter] = useState<FilterType>("poluicao")
  const [region, setRegion] = useState<Region>(INITIAL_REGION)
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>(SAMPLE_HEATMAP_DATA)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)

  const heatmapRadius = useMemo(
    () => getHeatmapRadius(region.latitudeDelta),
    [region.latitudeDelta],
  )

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
  }, [])

  // Update heatmap data when filter changes
  useEffect(() => {
    updateHeatmapForFilter(activeFilter)
  }, [activeFilter])

  /**
   * Request foreground location permissions
   */
  const requestLocationPermission = async (): Promise<void> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        console.log("Location permission denied")
      }
    } catch (error) {
      console.error("Error requesting location permission:", error)
    }
  }

  /**
   * Update heatmap data based on selected filter
   */
  const updateHeatmapForFilter = (filter: FilterType): void => {
    switch (filter) {
      case "poluicao":
        setHeatmapData(SAMPLE_HEATMAP_DATA)
        break
      case "sintomas":
        setHeatmapData(SINTOMAS_HEATMAP_DATA)
        break
      case "areas-verdes":
        setHeatmapData(AREAS_VERDES_HEATMAP_DATA)
        break
      default:
        setHeatmapData(SAMPLE_HEATMAP_DATA)
    }
  }

  /**
   * Get user's current location and animate to it
   */
  const handleGetUserLocation = async (): Promise<void> => {
    setIsLoadingLocation(true)
    try {
      const { status } = await Location.getForegroundPermissionsAsync()

      if (status !== "granted") {
        Alert.alert(
          "Permissão necessária",
          "Por favor, permita o acesso à localização nas configurações do aplicativo.",
        )
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const newRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }

      const normalizedRegion = normalizeRegion(newRegion)

      setRegion(normalizedRegion)
      mapRef.current?.animateToRegion(normalizedRegion, LOCATION_ANIMATION_DURATION_MS)
    } catch (error) {
      console.error("Error getting location:", error)
      Alert.alert("Erro", "Não foi possível obter sua localização.")
    } finally {
      setIsLoadingLocation(false)
    }
  }

  /**
   * Search for location using OpenStreetMap Nominatim API
   */
  const handleSearch = async (): Promise<void> => {
    if (!searchQuery.trim()) {
      Alert.alert("Aviso", "Digite um local para buscar")
      return
    }

    setIsSearching(true)
    try {
      // Debounce to prevent API rate limiting
      await new Promise((resolve) => setTimeout(resolve, SEARCH_DEBOUNCE_MS))

      const url = `${NOMINATIM_API_URL}?format=json&q=${encodeURIComponent(
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
      let results: NominatimSearchResult[]

      try {
        results = JSON.parse(text)
      } catch (parseError) {
        console.error("JSON parse error:", parseError)
        throw new Error("Resposta inválida do servidor")
      }

      if (results && results.length > 0) {
        const result = results[0]
        const newRegion: Region = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }

        const normalizedRegion = normalizeRegion(newRegion)

        setRegion(normalizedRegion)
        mapRef.current?.animateToRegion(normalizedRegion, LOCATION_ANIMATION_DURATION_MS)
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

  /**
   * Zoom in on the map
   */
  const handleZoomIn = (): void => {
    const newRegion: Region = {
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    }
    const normalizedRegion = normalizeRegion(newRegion)
    setRegion(normalizedRegion)
    mapRef.current?.animateToRegion(normalizedRegion, ANIMATION_DURATION_MS)
  }

  /**
   * Zoom out on the map
   */
  const handleZoomOut = (): void => {
    const newRegion: Region = {
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    }
    const normalizedRegion = normalizeRegion(newRegion)
    setRegion(normalizedRegion)
    mapRef.current?.animateToRegion(normalizedRegion, ANIMATION_DURATION_MS)
  }

  /**
   * Open action modal
   */
  const handleActionPress = (action: ActionType): void => {
    setCurrentAction(action)
    setIsModalVisible(true)
  }

  /**
   * Close action modal
   */
  const closeModal = (): void => {
    setIsModalVisible(false)
    setCurrentAction(undefined)
  }

  /**
   * Handle filter button press
   */
  const handleFilterPress = (filter: FilterType): void => {
    setActiveFilter(filter)
  }

  /**
   * Get button configuration based on active filter
   */
  const getButtonConfig = () => {
    switch (activeFilter) {
      case "poluicao":
        return {
          label: "enviar audio",
          action: "audio" as ActionType,
          icon: "components" as const,
        }
      case "sintomas":
        return {
          label: "enviar sintomas",
          action: "sintomas" as ActionType,
          icon: "community" as const,
        }
      case "areas-verdes":
        return {
          label: "reportar área verde",
          action: "area-verde" as ActionType,
          icon: "check" as const,
        }
      default:
        return {
          label: "enviar",
          action: "audio" as ActionType,
          icon: "components" as const,
        }
    }
  }

  const buttonConfig = getButtonConfig()

  return (
    <Screen preset="fixed" contentContainerStyle={themed($screenContainer)} safeAreaEdges={["top"]}>
      {/* Filter Tabs */}
      <View style={themed($header)}>
        <Pressable
          style={themed([$filterButton, activeFilter === "poluicao" && $activeFilter])}
          onPress={() => handleFilterPress("poluicao")}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por poluição sonora"
          accessibilityState={{ selected: activeFilter === "poluicao" }}
        >
          <Text
            style={themed([$filterText, activeFilter === "poluicao" && $activeFilterText])}
            text="Poluição sonora"
          />
        </Pressable>

        <Pressable
          style={themed([$filterButton, activeFilter === "sintomas" && $activeFilter])}
          onPress={() => handleFilterPress("sintomas")}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por sintomas"
          accessibilityState={{ selected: activeFilter === "sintomas" }}
        >
          <Text
            style={themed([$filterText, activeFilter === "sintomas" && $activeFilterText])}
            text="sintomas"
          />
        </Pressable>

        <Pressable
          style={themed([$filterButton, activeFilter === "areas-verdes" && $activeFilter])}
          onPress={() => handleFilterPress("areas-verdes")}
          accessibilityRole="button"
          accessibilityLabel="Filtrar por áreas verdes"
          accessibilityState={{ selected: activeFilter === "areas-verdes" }}
        >
          <Text
            style={themed([$filterText, activeFilter === "areas-verdes" && $activeFilterText])}
            text="áreas verdes"
          />
        </Pressable>
      </View>

      {/* Map Container */}
      <View style={$mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={$map}
          initialRegion={INITIAL_REGION}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
          accessibilityLabel="Mapa de calor interativo"
        >
          <Heatmap
            points={heatmapData}
            radius={heatmapRadius}
            gradient={HEATMAP_GRADIENT}
            opacity={HEATMAP_OPACITY}
          />
        </MapView>

        {/* Search Bar */}
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
            accessibilityLabel="Campo de busca de localização"
          />
          <Pressable
            style={themed($searchButton)}
            onPress={handleSearch}
            disabled={isSearching}
            accessibilityRole="button"
            accessibilityLabel="Buscar localização"
            accessibilityState={{ disabled: isSearching }}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={theme.colors.palette.neutral100} />
            ) : (
              <Text style={themed($searchButtonText)}>🔍</Text>
            )}
          </Pressable>
        </View>

        {/* Map Controls (GPS and Zoom) */}
        <View style={themed($mapControls)}>
          {/* GPS Location Button */}
          <Pressable
            style={themed($controlButton)}
            onPress={handleGetUserLocation}
            disabled={isLoadingLocation}
            accessibilityRole="button"
            accessibilityLabel="Ir para minha localização"
            accessibilityState={{ disabled: isLoadingLocation }}
          >
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color={theme.colors.text} />
            ) : (
              <Text style={themed($gpsButtonText)}>📍</Text>
            )}
          </Pressable>

          {/* Zoom Controls */}
          <View style={themed($zoomControls)}>
            <Pressable
              style={themed($controlButton)}
              onPress={handleZoomIn}
              accessibilityRole="button"
              accessibilityLabel="Aumentar zoom"
            >
              <Text style={themed($zoomText)}>+</Text>
            </Pressable>
            <View style={themed($zoomDivider)} />
            <Pressable
              style={themed($controlButton)}
              onPress={handleZoomOut}
              accessibilityRole="button"
              accessibilityLabel="Diminuir zoom"
            >
              <Text style={themed($zoomText)}>−</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bottom Action Button */}
      <View style={themed($bottomButtonContainer)}>
        <Button
          style={themed($bottomButton)}
          textStyle={themed($bottomButtonText)}
          onPress={() => handleActionPress(buttonConfig.action)}
          LeftAccessory={(props) => (
            <Icon icon={buttonConfig.icon} size={20} containerStyle={props.style} />
          )}
          accessibilityLabel={buttonConfig.label}
        >
          {buttonConfig.label}
        </Button>
      </View>

      {/* Action Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
        accessibilityViewIsModal
      >
        <View style={themed($modalContainer)}>
          <View style={themed($modalHeader)}>
            <Pressable
              style={themed($closeButton)}
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Fechar modal"
            >
              <Icon icon="x" size={24} />
            </Pressable>
          </View>
          <ActionPlaceholder actionType={currentAction} />
        </View>
      </Modal>
    </Screen>
  )
}

// ============================================================================
// Styles
// ============================================================================

const $screenContainer: ThemedStyle<ViewStyle> = () => ({
  flex: 1,
})

// Header Styles
const $header: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  justifyContent: "space-around",
  alignItems: "center",
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.sm,
  backgroundColor: colors.background,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  zIndex: 10,
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

// Map Styles
const $mapContainer: ViewStyle = {
  flex: 1,
  position: "relative",
}

const $map: ViewStyle = {
  flex: 1,
}

// Search Bar Styles
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

// Map Controls Styles
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

const $controlButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
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

// Bottom Button Styles
const $bottomButtonContainer: ThemedStyle<ViewStyle> = ({ spacing, colors }) => ({
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  backgroundColor: colors.background,
  borderTopWidth: 1,
  borderTopColor: colors.border,
  alignItems: "center",
  justifyContent: "center",
  zIndex: 10,
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

// Modal Styles
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
