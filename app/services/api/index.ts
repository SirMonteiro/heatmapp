/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { Image } from "react-native"
import { manipulateAsync, SaveFormat } from "expo-image-manipulator"
import { ApiResponse, ApisauceInstance, create } from "apisauce"
import { jwtDecode, type JwtPayload } from "jwt-decode"

import Config from "@/config"
import type {
  EpisodeItem,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserData,
  Icone,
  IconeComprado,
  AudioSubmissionRequest,
  AudioSubmissionResponse,
  AreaVerdeSubmissionRequest,
  AreaVerdeSubmissionResponse,
  AreaVerdePost,
  HeatmapDataResponse,
} from "@/services/api/types"

import { GeneralApiProblem, getGeneralApiProblem } from "./apiProblem"
import type { ApiConfig, ApiFeedResponse } from "./types"

/**
 * Configuring the apisauce instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 10000,
}

type ApiMethod = "get" | "post" | "put" | "patch" | "delete"

type ApiRequestConfig = {
  url: string
  method?: ApiMethod
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

type ApiResult<T> = { kind: "ok"; data: T } | GeneralApiProblem

const TOKEN_REFRESH_THRESHOLD_MS = 60_000
const AREA_VERDE_MAX_WIDTH = 1280
const AREA_VERDE_MAX_HEIGHT = 720
const AREA_VERDE_JPEG_QUALITY = 0.75

type OptimizedAreaVerdeImage = {
  base64: string
  contentType: string
  fileName: string
}

const stripDataUrlPrefix = (value: string): string => {
  if (!value.includes(",")) return value
  const [, data] = value.split(",", 2)
  return data
}

const ensureJpegFileName = (fileName?: string): string => {
  const fallback = `area-verde-${Date.now()}.jpg`
  if (!fileName?.trim()) return fallback

  const normalized = fileName.trim()
  const lower = normalized.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return normalized
  return `${normalized}.jpg`
}

const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error ?? new Error("Failed to read image size")),
    )
  })

const computeTargetDimensions = (width: number, height: number) => {
  if (width <= AREA_VERDE_MAX_WIDTH && height <= AREA_VERDE_MAX_HEIGHT) {
    return { width, height }
  }

  const widthRatio = AREA_VERDE_MAX_WIDTH / width
  const heightRatio = AREA_VERDE_MAX_HEIGHT / height
  const scale = Math.min(widthRatio, heightRatio)

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

const optimizeAreaVerdeImage = async (
  payload: AreaVerdeSubmissionRequest,
): Promise<OptimizedAreaVerdeImage> => {
  const fallback = {
    base64: stripDataUrlPrefix(payload.imageBase64),
    contentType: payload.imageContentType || "image/jpeg",
    fileName: ensureJpegFileName(payload.imageFileName),
  }

  if (!payload.imageUri) return fallback

  try {
    const { width, height } = await getImageDimensions(payload.imageUri)
    const { width: targetWidth, height: targetHeight } = computeTargetDimensions(width, height)

    const result = await manipulateAsync(
      payload.imageUri,
      [
        {
          resize: {
            width: targetWidth,
            height: targetHeight,
          },
        },
      ],
      {
        compress: AREA_VERDE_JPEG_QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      },
    )

    if (!result.base64) {
      return fallback
    }

    return {
      base64: result.base64,
      contentType: "image/jpeg",
      fileName: ensureJpegFileName(payload.imageFileName),
    }
  } catch (error) {
    if (__DEV__) {
      console.warn(
        "Failed to optimize Área Verde image; falling back to original image data.",
        error,
      )
    }
    return fallback
  }
}

const decodeJwtExpiration = (token: string): number | undefined => {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    if (typeof payload?.exp === "number") return payload.exp * 1000
  } catch (error) {
    if (__DEV__) {
      console.warn("Failed to decode JWT payload", error)
    }
  }

  return undefined
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig
  private accessToken?: string
  private refreshToken?: string
  private accessTokenExpiresAt?: number
  private tokenRefreshPromise: Promise<boolean> | null = null
  private tokensChangeHandler?: (tokens: { accessToken?: string; refreshToken?: string }) => void

  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.apisauce = create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        Accept: "application/json",
      },
    })
  }

  /**
   * Generic request helper used by the specific API methods.
   */
  async request<T>(config: ApiRequestConfig): Promise<ApiResult<T>> {
    await this.ensureValidAccessToken()

    const makeRequest = async (): Promise<ApiResponse<T>> =>
      this.apisauce.any<T>({
        method: config.method ?? "get",
        url: config.url,
        data: config.data,
        params: config.params,
        headers: config.headers,
      })

    let response = await makeRequest()

    if (response.status === 401 && (await this.refreshAccessToken(true))) {
      response = await makeRequest()
    }

    if (!response.ok || typeof response.data === "undefined" || response.data === null) {
      const problem = getGeneralApiProblem(response)
      if (problem) return problem
      return { kind: "bad-data" }
    }

    return { kind: "ok", data: response.data }
  }

  /**
   * Sets or clears the Authorization header for subsequent requests.
   */
  setAuthTokens(
    tokens: { accessToken?: string; refreshToken?: string | null },
    options?: { overwriteRefresh?: boolean },
  ): void {
    this.applyTokens(tokens, { overwriteRefresh: options?.overwriteRefresh ?? false })
  }

  setAuthToken(token?: string, refreshToken?: string): void {
    if (typeof token === "undefined" && typeof refreshToken === "undefined") {
      this.setAuthTokens({ accessToken: undefined, refreshToken: null }, { overwriteRefresh: true })
      return
    }

    const tokens: { accessToken?: string; refreshToken?: string | null } = { accessToken: token }

    if (typeof refreshToken !== "undefined") {
      tokens.refreshToken = refreshToken
    }

    this.setAuthTokens(tokens, { overwriteRefresh: typeof refreshToken !== "undefined" })
  }

  setTokenChangeHandler(
    handler?: (tokens: { accessToken?: string; refreshToken?: string }) => void,
  ): () => void {
    this.tokensChangeHandler = handler
    return () => {
      if (this.tokensChangeHandler === handler) {
        this.tokensChangeHandler = undefined
      }
    }
  }

  private applyTokens(
    tokens: { accessToken?: string; refreshToken?: string | null },
    options: { overwriteRefresh?: boolean; notify?: boolean } = {},
  ): void {
    const { overwriteRefresh = false, notify = false } = options
    const { accessToken, refreshToken } = tokens

    const normalizedAccessToken = accessToken ?? undefined
    const shouldUpdateRefreshToken = overwriteRefresh || typeof refreshToken !== "undefined"
    const normalizedRefreshToken = shouldUpdateRefreshToken
      ? (refreshToken ?? undefined)
      : this.refreshToken

    const accessChanged = normalizedAccessToken !== this.accessToken
    const refreshChanged = shouldUpdateRefreshToken && normalizedRefreshToken !== this.refreshToken

    this.accessToken = normalizedAccessToken
    if (shouldUpdateRefreshToken) {
      this.refreshToken = normalizedRefreshToken
    }

    this.accessTokenExpiresAt = normalizedAccessToken
      ? decodeJwtExpiration(normalizedAccessToken)
      : undefined

    if (this.accessToken) {
      this.apisauce.setHeader("Authorization", `Bearer ${this.accessToken}`)
    } else {
      this.apisauce.deleteHeader("Authorization")
    }

    if ((accessChanged || refreshChanged) && notify && this.tokensChangeHandler) {
      this.tokensChangeHandler({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
      })
    }
  }

  private shouldRefreshToken(): boolean {
    if (!this.accessToken || !this.refreshToken) return false
    if (!this.accessTokenExpiresAt) return true

    const timeUntilExpiry = this.accessTokenExpiresAt - Date.now()
    return timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD_MS
  }

  private async ensureValidAccessToken(): Promise<void> {
    if (!this.accessToken) return

    await this.refreshAccessToken()
  }

  private async refreshAccessToken(force = false): Promise<boolean> {
    if (!this.refreshToken) return false

    if (!force && !this.shouldRefreshToken()) {
      return true
    }

    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise
    }

    this.tokenRefreshPromise = this.performTokenRefresh()

    try {
      return await this.tokenRefreshPromise
    } finally {
      this.tokenRefreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const response = await this.apisauce.post<{ access: string; refresh?: string }>(
        "token/refresh/",
        {
          refresh: this.refreshToken,
        },
      )

      if (!response.ok || !response.data?.access) {
        if (response.status === 400 || response.status === 401) {
          this.applyTokens(
            { accessToken: undefined, refreshToken: null },
            { overwriteRefresh: true, notify: true },
          )
        }
        return false
      }

      const { access, refresh } = response.data
      const hasNewRefresh = typeof refresh === "string"

      this.applyTokens(
        {
          accessToken: access,
          refreshToken: hasNewRefresh ? refresh : undefined,
        },
        { notify: true, overwriteRefresh: hasNewRefresh },
      )

      return true
    } catch (error) {
      if (__DEV__) {
        console.error("Failed to refresh access token", error)
      }

      return false
    }
  }

  /**
   * Gets a list of recent React Native Radio episodes.
   */
  async getEpisodes(): Promise<{ kind: "ok"; episodes: EpisodeItem[] } | GeneralApiProblem> {
    const response = await this.request<ApiFeedResponse>({
      method: "get",
      url: "api.json",
      params: {
        rss_url: "https://feeds.simplecast.com/hEI_f9Dx",
      },
    })

    if (response.kind !== "ok") return response

    // transform the data into the format we are expecting
    try {
      const rawData = response.data

      // This is where we transform the data into the shape we expect for our model.
      const episodes: EpisodeItem[] =
        rawData?.items.map((raw) => ({
          ...raw,
        })) ?? []

      return { kind: "ok", episodes }
    } catch (e) {
      if (__DEV__ && e instanceof Error) {
        console.error(`Bad data: ${e.message}\n${response.data}`, e.stack)
      }
      return { kind: "bad-data" }
    }
  }

  async login(credentials: LoginRequest): Promise<ApiResult<LoginResponse>> {
    return this.request<LoginResponse>({
      method: "post",
      url: "token/",
      data: credentials,
    })
  }

  async getCurrentUser(): Promise<ApiResult<UserData>> {
    return this.request<UserData>({
      method: "get",
      url: "current_user/",
    })
  }

  async getUserProfile(userId: number): Promise<ApiResult<UserData>> {
    return this.request<UserData>({
      method: "get",
      url: `usuarios/${userId}/`,
    })
  }

  async registerUser(payload: RegisterRequest): Promise<ApiResult<UserData>> {
    return this.request<UserData>({
      method: "post",
      url: "usuarios/",
      data: payload,
    })
  }

  async getIcones(): Promise<ApiResult<Icone[]>> {
    return this.request<Icone[]>({
      method: "get",
      url: "icones/",
    })
  }

  async getIconesDisponiveis(): Promise<ApiResult<Icone[]>> {
    return this.request<Icone[]>({
      method: "get",
      url: "icones/disponiveis",
    })
  }

  async comprarIcone(iconeId: number): Promise<ApiResult<{ moedas?: number; detail?: string }>> {
    return this.request<{ moedas?: number; detail?: string }>({
      method: "post",
      url: `icones/${iconeId}/comprar/`,
    })
  }

  async meusIcones(): Promise<ApiResult<IconeComprado[]>> {
    return this.request<IconeComprado[]>({
      method: "get",
      url: `icones_comprados/meus_icones`,
    })
  }

  async submitAudioData(
    payload: AudioSubmissionRequest,
  ): Promise<ApiResult<AudioSubmissionResponse>> {
    return this.request<AudioSubmissionResponse>({
      method: "post",
      url: "posts_ruido/",
      data: {
        user: payload.user,
        local_latitude: payload.latitude,
        local_longitude: payload.longitude,
        decibeis: payload.decibel,
      },
    })
  }

  async submitAreaVerdeData(
    payload: AreaVerdeSubmissionRequest,
  ): Promise<ApiResult<AreaVerdeSubmissionResponse>> {
    const data: Record<string, unknown> = {
      user: payload.user,
      titulo: payload.titulo,
      modo_acesso: payload.modoAcesso,
      local_latitude: payload.latitude,
      local_longitude: payload.longitude,
    }

    if (payload.descricao) {
      data.descricao = payload.descricao
    }

    if (payload.imageBase64) {
      const optimizedImage = await optimizeAreaVerdeImage(payload)
      data.imagem_base64 = optimizedImage.base64
      data.imagem_content_type = optimizedImage.contentType
      data.imagem_nome = optimizedImage.fileName
    }

    // console.log(data)

    return this.request<AreaVerdeSubmissionResponse>({
      method: "post",
      url: "posts_areas/",
      data,
    })
  }

  async getHeatmapData(): Promise<ApiResult<HeatmapDataResponse>> {
    return this.request<HeatmapDataResponse>({
      method: "get",
      url: "posts_ruido/",
    })
  }

  async getAreasVerdes(): Promise<ApiResult<AreaVerdePost[]>> {
    return this.request<AreaVerdePost[]>({
      method: "get",
      url: "posts_areas/",
    })
  }

  async getRanking(): Promise<ApiResult<UserData[]>> {
    return this.request<UserData[]>({
      method: "get",
      url: "usuarios/ranking",
    })
  }
}

// Singleton instance of the API for convenience
export const api = new Api()
