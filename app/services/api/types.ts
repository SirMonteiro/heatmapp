/**
 * These types indicate the shape of the data you expect to receive from your
 * API endpoint, assuming it's a JSON object like we have.
 */
export interface EpisodeItem {
  title: string
  pubDate: string
  link: string
  guid: string
  author: string
  thumbnail: string
  description: string
  content: string
  enclosure: {
    link: string
    type: string
    length: number
    duration: number
    rating: { scheme: string; value: string }
  }
  categories: string[]
}

export interface ApiFeedResponse {
  status: string
  feed: {
    url: string
    title: string
    link: string
    author: string
    description: string
    image: string
  }
  items: EpisodeItem[]
}

/**
 * The options used to configure apisauce.
 */
export interface ApiConfig {
  /**
   * The URL of the api.
   */
  url: string

  /**
   * Milliseconds before we timeout the request.
   */
  timeout: number
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access: string
  refresh?: string
}

export interface UserData {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  streak: number
  moedas: number
  id_icone: number
}

export interface RegisterRequest {
  username: string
  first_name: string
  last_name: string
  email: string
  password: string
}

export interface Icone {
  id: number
  titulo: string
  descricao: string
  preco: number
}

export interface IconeComprado {
  user: number
  icone: number
}
export interface AudioSubmissionRequest {
  latitude: number
  longitude: number
  decibel: number
}

export interface AudioSubmissionResponse {
  id: number
  latitude: number
  longitude: number
  decibel: number
  created_at: string
}

export interface AreaVerdeSubmissionRequest {
  latitude: number
  longitude: number
  titulo: string
  modoAcesso: string
  descricao?: string
  imageBase64: string
  imageContentType?: string
  imageFileName?: string
}

export interface AreaVerdeSubmissionResponse {
  id: number
  local_latitude: number
  local_longitude: number
  titulo: string
  modo_acesso: string
  descricao?: string
  imagem_url?: string
  created_at: string
}

export interface HeatmapPoint {
  latitude: number
  longitude: number
  weight: number
}

export interface HeatmapDataResponse {
  points: HeatmapPoint[]
}
