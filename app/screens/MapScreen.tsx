import { FC, useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Pressable, TextStyle, View, ViewStyle, Alert, TouchableOpacity } from "react-native"
import * as Location from "expo-location"
import Ionicons from "@expo/vector-icons/Ionicons"
import MapView, { PROVIDER_GOOGLE, Heatmap, Marker } from "react-native-maps"
import type { Region } from "react-native-maps"

import { AreasVerdesModal } from "@/components/AreasVerdesModal"
import { AreaVerdeDetailsModal } from "@/components/AreaVerdeDetailsModal"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { PoluicaoSonoraModal } from "@/components/PoluicaoSonoraModal"
import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import type { DemoTabScreenProps } from "@/navigators/DemoNavigator"
import { api } from "@/services/api"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

// ============================================================================
// Types
// ============================================================================

type ActionType = "audio" | "area-verde"
type FilterType = "poluicao" | "areas-verdes"

interface HeatmapPoint {
  latitude: number
  longitude: number
  weight: number
}

interface AreaVerdeMarker {
  id: number
  latitude: number
  longitude: number
  titulo: string
  modoAcesso: string
  descricao?: string
  imagemUrl?: string
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

const normalizeHeatmapPoint = (rawPoint: unknown): HeatmapPoint | null => {
  if (!rawPoint || typeof rawPoint !== "object") return null

  const point = rawPoint as Record<string, unknown>
  const latitude = Number(
    point.latitude ?? point.lat ?? point.local_latitude ?? point.localLatitude,
  )
  const longitude = Number(
    point.longitude ?? point.lon ?? point.local_longitude ?? point.localLongitude,
  )
  const rawWeight = Number(point.weight ?? point.intensity ?? point.decibel ?? point.decibeis)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const weight = Number.isFinite(rawWeight) ? Math.max(0, rawWeight) : 1

  return {
    latitude,
    longitude,
    weight,
  }
}

const normalizeAreaVerdePost = (rawPost: unknown): AreaVerdeMarker | null => {
  if (!rawPost || typeof rawPost !== "object") return null

  const post = rawPost as Record<string, unknown>
  const id = Number(post.id ?? post.pk)
  const latitude = Number(post.local_latitude ?? post.latitude ?? post.lat)
  const longitude = Number(post.local_longitude ?? post.longitude ?? post.lon)
  const titulo = typeof post.titulo === "string" ? post.titulo.trim() : undefined
  const modoAcesso = typeof post.modo_acesso === "string" ? post.modo_acesso.trim() : undefined
  const descricao = typeof post.descricao === "string" ? post.descricao.trim() : undefined
  const imagemUrl = typeof post.imagem_url === "string" ? post.imagem_url : undefined

  if (!Number.isFinite(id) || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  if (!titulo || !modoAcesso) return null

  return {
    id,
    latitude,
    longitude,
    titulo,
    modoAcesso,
    descricao: descricao && descricao.length > 0 ? descricao : undefined,
    imagemUrl,
  }
}

const parseHeatmapResponse = (
  payload: unknown,
): { points: HeatmapPoint[]; isValidPayload: boolean } => {
  const possiblePoints = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>).points
      : undefined

  if (!Array.isArray(possiblePoints)) {
    return { points: [], isValidPayload: false }
  }

  const points = possiblePoints
    .map(normalizeHeatmapPoint)
    .filter((point): point is HeatmapPoint => point !== null)

  return { points, isValidPayload: true }
}

const getHeatmapRadius = (latitudeDelta: number): number => {
  const zoomRatio = ZOOM_FACTOR_BASE / Math.max(latitudeDelta, MIN_MAP_DELTA)
  const radius = HEATMAP_RADIUS_BASE * zoomRatio
  return Math.min(MAX_HEATMAP_RADIUS, Math.max(MIN_HEATMAP_RADIUS, Math.round(radius)))
}

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
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])
  const [areasVerdesData, setAreasVerdesData] = useState<AreaVerdeMarker[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [selectedArea, setSelectedArea] = useState<AreaVerdeMarker | null>(null)

  const heatmapRadius = useMemo(
    () => getHeatmapRadius(region.latitudeDelta),
    [region.latitudeDelta],
  )
  const showHeatmap = activeFilter === "poluicao" && heatmapData.length > 0
  const showAreaMarkers = activeFilter === "areas-verdes" && areasVerdesData.length > 0

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission()
  }, [])

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
   * Fetch heatmap data from API for poluição sonora
   */
  const fetchHeatmapData = useCallback(async (): Promise<void> => {
    try {
      const response = await api.getHeatmapData()

      if (response.kind === "ok") {
        const { points, isValidPayload } = parseHeatmapResponse(response.data)

        if (isValidPayload) {
          setHeatmapData(points)
        } else {
          console.warn("Heatmap API returned an invalid payload. Clearing heatmap overlay.")
          setHeatmapData([])
        }
      } else {
        console.error("Failed to fetch heatmap data:", response.kind)
        setHeatmapData([])
      }
    } catch (error) {
      console.error("Error fetching heatmap data:", error)
      setHeatmapData([])
    }
  }, [])

  const fetchAreasVerdesData = useCallback(async (): Promise<void> => {
    try {
      const response = await api.getAreasVerdes()

      if (response.kind === "ok") {
        const normalized = response.data
          .map(normalizeAreaVerdePost)
          .filter((post): post is AreaVerdeMarker => post !== null)

        setAreasVerdesData(normalized)
        setSelectedArea((current) => {
          if (!current) return null
          return normalized.find((post) => post.id === current.id) ?? null
        })
      } else {
        console.error("Failed to fetch áreas verdes data:", response.kind)
        setAreasVerdesData([])
        setSelectedArea(null)
      }
    } catch (error) {
      console.error("Error fetching áreas verdes data:", error)
      setAreasVerdesData([])
      setSelectedArea(null)
    }
  }, [])

  // Fetch map overlays when filter changes
  useEffect(() => {
    if (activeFilter === "poluicao") {
      fetchHeatmapData()
    } else {
      fetchAreasVerdesData()
    }
  }, [activeFilter, fetchAreasVerdesData, fetchHeatmapData])

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
   * Center map on user's current location
   */
  const handleGoToUserLocation = async (): Promise<void> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Permita acesso à localização para usar este recurso.")
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })

      const userRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }

      const normalizedRegion = normalizeRegion(userRegion)
      setRegion(normalizedRegion)
      mapRef.current?.animateToRegion(normalizedRegion, LOCATION_ANIMATION_DURATION_MS)
    } catch (error) {
      console.error("Error getting user location:", error)
      Alert.alert("Erro", "Não foi possível obter sua localização.")
    }
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
    if (filter === activeFilter) return

    setActiveFilter(filter)

    if (filter !== "areas-verdes") {
      setSelectedArea(null)
    }
  }

  /**
   * Handle successful audio submission
   */
  const handleAudioSubmitSuccess = (): void => {
    // Refresh heatmap data after successful submission
    if (activeFilter === "poluicao") {
      fetchHeatmapData()
    }
  }

  const handleAreaVerdeSubmitSuccess = (): void => {
    fetchAreasVerdesData()
  }

  const handleAreaDetailsClose = (): void => {
    setSelectedArea(null)
  }

  /**
   * Get button configuration based on active filter
   */
  const getButtonConfig = () => {
    switch (activeFilter) {
      case "poluicao":
        return {
          label: "ENVIAR ÁUDIO",
          action: "audio" as ActionType,
          icon: "components" as const,
        }
      case "areas-verdes":
        return {
          label: "REPORTAR ÁREA VERDE",
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
            text="POLUIÇÃO SONORA"
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
            text="ÁREAS VERDES"
          />
        </Pressable>
      </View>

      {/* Map Container */}
      <View style={$mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          region={region}
          initialRegion={INITIAL_REGION}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          toolbarEnabled={false}
          ref={mapRef}
          style={$map}
          onRegionChangeComplete={setRegion}
          accessibilityLabel="Mapa de calor interativo"
        >
          {showHeatmap && (
            <Heatmap
              points={heatmapData}
              radius={heatmapRadius}
              gradient={HEATMAP_GRADIENT}
              opacity={HEATMAP_OPACITY}
            />
          )}

          {showAreaMarkers &&
            areasVerdesData.map((area) => (
              <Marker
                key={area.id.toString()}
                coordinate={{ latitude: area.latitude, longitude: area.longitude }}
                title={area.titulo}
                description={area.modoAcesso}
                onPress={() => setSelectedArea(area)}
              />
            ))}
        </MapView>

        {/* Search Bar */}
        <View style={themed($searchContainer)}>
          <View style={themed($searchBarWrapper)}>
            <Ionicons
              name="search"
              size={20}
              color={theme.colors.palette.neutral600}
              style={themed($searchIcon)}
            />
            <TextField
              style={themed($searchInput)}
              placeholder="Buscar no mapa"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!isSearching}
              containerStyle={themed($searchInputContainer)}
              inputWrapperStyle={themed($searchInputWrapper)}
              accessibilityLabel="Campo de busca de localização"
            />
            {searchQuery.length > 0 && (
              <Pressable
                style={themed($clearButton)}
                onPress={() => setSearchQuery("")}
                accessibilityRole="button"
                accessibilityLabel="Limpar busca"
              >
                <Ionicons name="close" size={20} color={theme.colors.palette.neutral600} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Location Button */}
        <TouchableOpacity
          style={themed($locationButton)}
          onPress={handleGoToUserLocation}
          accessibilityRole="button"
          accessibilityLabel="Ir para minha localização"
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={24} color={theme.colors.palette.neutral800} />
        </TouchableOpacity>
      </View>

      {/* Bottom Action Button */}
      <View style={themed($bottomButtonContainer)}>
        <Button
          style={themed($bottomButton)}
          textStyle={themed($bottomButtonText)}
          onPress={() => handleActionPress(buttonConfig.action)}
          LeftAccessory={(props) => (
            <Icon icon={buttonConfig.icon} size={20} color="#FFFFFF" containerStyle={props.style} />
          )}
          accessibilityLabel={buttonConfig.label}
        >
          {" " + buttonConfig.label}
        </Button>
      </View>

      {/* Modals */}
      <PoluicaoSonoraModal
        visible={isModalVisible && currentAction === "audio"}
        onClose={closeModal}
        onSuccess={handleAudioSubmitSuccess}
      />

      <AreasVerdesModal
        visible={isModalVisible && currentAction === "area-verde"}
        onClose={closeModal}
        onSuccess={handleAreaVerdeSubmitSuccess}
      />

      <AreaVerdeDetailsModal
        visible={selectedArea !== null}
        area={selectedArea}
        onClose={handleAreaDetailsClose}
      />
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
  width: "100%",
}

const $map: ViewStyle = {
  flex: 1,
}

// Search Bar Styles
const $searchContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  position: "absolute",
  top: spacing.md,
  left: spacing.md,
  right: spacing.md,
  zIndex: 1000,
})

const $searchBarWrapper: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.palette.neutral100,
  borderRadius: 28,
  paddingHorizontal: spacing.md,
  paddingVertical: spacing.xs,
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 4,
})

const $searchIcon: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginRight: spacing.xs,
})

const $searchInputContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  backgroundColor: colors.transparent,
  minHeight: 40,
})

const $searchInputWrapper: ThemedStyle<ViewStyle> = ({ colors }) => ({
  flex: 1,
  borderWidth: 0,
  backgroundColor: colors.transparent,
  minHeight: 40,
})

const $searchInput: ThemedStyle<TextStyle> = ({ colors }) => ({
  fontSize: 16,
  color: colors.text,
  backgroundColor: "transparent",
  minHeight: 40,
})

const $clearButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  padding: spacing.xxs,
  marginLeft: spacing.xs,
})

// Location Button Styles
const $locationButton: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  position: "absolute",
  right: spacing.md,
  bottom: spacing.xl + 16,
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: colors.palette.neutral100,
  alignItems: "center",
  justifyContent: "center",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 4,
  zIndex: 1000,
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

const $bottomButtonText: ThemedStyle<TextStyle> = ({ typography, colors }) => ({
  fontSize: 16,
  fontFamily: typography.primary.medium,
  color: colors.palette.neutral100,
})
