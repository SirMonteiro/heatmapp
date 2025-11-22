/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
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
      titulo: payload.titulo,
      modo_acesso: payload.modoAcesso,
      local_latitude: payload.latitude,
      local_longitude: payload.longitude,
    }

    if (payload.descricao) {
      data.descricao = payload.descricao
    }

    if (payload.imageBase64) {
      data.imagem_base64 = payload.imageBase64
      if (payload.imageContentType) data.imagem_content_type = payload.imageContentType
      if (payload.imageFileName) data.imagem_nome = payload.imageFileName
    }

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
