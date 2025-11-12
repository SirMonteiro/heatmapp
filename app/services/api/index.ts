/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import { ApiResponse, ApisauceInstance, create } from "apisauce"

import Config from "@/config"
import type {
  EpisodeItem,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UserData,
  Icone
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

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  apisauce: ApisauceInstance
  config: ApiConfig

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
    const response: ApiResponse<T> = await this.apisauce.any<T>({
      method: config.method ?? "get",
      url: config.url,
      data: config.data,
      params: config.params,
      headers: config.headers,
    })

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
  setAuthToken(token?: string): void {
    if (token) {
      this.apisauce.setHeader("Authorization", `Bearer ${token}`)
    } else {
      this.apisauce.deleteHeader("Authorization")
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
    return this.request<Icone[]> ({
      method: "get",
      url: "icones/",
    })
  }

  async getIconesDisponiveis(): Promise<ApiResult<Icone[]>> {
    return this.request<Icone[]> ({
      method: "get",
      url: "icones/disponiveis",
    })
  }

}

// Singleton instance of the API for convenience
export const api = new Api()
