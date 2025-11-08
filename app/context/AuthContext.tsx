import {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useMMKVString } from "react-native-mmkv"

import { api } from "@/services/api"
import type { UserData } from "@/services/api/types"

export type AuthContextType = {
  isAuthenticated: boolean
  authToken?: string
  //authEmail?: string
  authUsername?: string
  currentUser?: UserData | null
  setAuthToken: (token?: string) => void
  //setAuthEmail: (email: string) => void
  setAuthUsername: (username: string) => void
  login: (username: string, password: string) => Promise<boolean>
  fetchCurrentUser: () => Promise<void>
  logout: () => void
  validationError: string
}

export const AuthContext = createContext<AuthContextType | null>(null)

export interface AuthProviderProps {}

export const AuthProvider: FC<PropsWithChildren<AuthProviderProps>> = ({ children }) => {
  const [authToken, setAuthToken] = useMMKVString("AuthProvider.authToken")
  //const [authEmail, setAuthEmail] = useMMKVString("AuthProvider.authEmail")
  const [authUsernameStorage, setAuthUsername] = useMMKVString("AuthProvider.authUsername")
  const authUsername = authUsernameStorage ?? ""

  const [currentUser, setCurrentUser] = useState<UserData | null>(null)

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        console.log(`Tentando login com username="${username}"`)

        const response = await api.login({ username, password })

        if (response.kind !== "ok") {
          console.error("Falha no login:", response.kind)
          return false
        }

        // Armazena token e username localmente
        setAuthToken(response.data.access)
        api.setAuthToken(response.data.access)
        setAuthUsername(username)

        return true
      } catch (err) {
        console.error("Erro durante login:", err)
        return false
      }
    },
    [setAuthToken, setAuthUsername],
  )

  const fetchCurrentUser = useCallback(async () => {
    if (!authToken) return
    try {
      const response = await api.getCurrentUser()

      if (response.kind !== "ok") {
        console.error("Erro ao buscar usuário:", response.kind)
        return
      }

      setCurrentUser(response.data)
    } catch (err) {
      console.error("Erro ao buscar current user:", err)
    }
  }, [authToken])
  // Carrega current user automaticamente quando loga
  useEffect(() => {
    api.setAuthToken(authToken)
    if (authToken) fetchCurrentUser()
  }, [authToken, fetchCurrentUser])

  const logout = useCallback(() => {
    setAuthToken(undefined)
    //setAuthEmail("")
    setAuthUsername("")
    api.setAuthToken(undefined)
    setCurrentUser(null)
  }, [setAuthUsername, setAuthToken])

  const validationError = useMemo(() => {
    //if (!authEmail || authEmail.length === 0) return "can't be blank"
    if (!authUsername || authUsername.length === 0) return "can't be blank"
    if (authUsername.length < 3) return "must be at least 3 characters"
    //if (authEmail.length < 6) return "must be at least 6 characters"

    //if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authEmail)) return "must be a valid email address"
    //if (!/^[a-zA-Z0-9_]+$/.test(authUsername)) return "deve conter apenas letras, números ou _" NAO SEI PQ TA BUGANDO
    return ""
  }, [authUsername])

  const value = {
    isAuthenticated: !!authToken,
    authToken,
    authUsername,
    currentUser,
    setAuthUsername,
    setAuthToken,
    login,
    fetchCurrentUser,
    logout,
    validationError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}
