import { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState, useMemo } from "react"
import { useMMKVString } from "react-native-mmkv"

// Dados pro current user!
export type UserData = {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  streak: number
  moedas: number
  id_icone: number
}


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

  const API_URL = "http://192.168.15.151:8000/api" // coloca o ip:8000/api

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        console.log(`Tentando login com username="${username}"`)

        const response = await fetch(`${API_URL}/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })

        if (!response.ok) {
          console.error("Falha no login:", response.status)
          return false
        }

        const data = await response.json()

        // Armazena token e username localmente
        setAuthToken(data.access)
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
      const response = await fetch(`${API_URL}/current_user/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        console.error("Erro ao buscar usuário:", response.status)
        return
      }

      const data = await response.json()
      setCurrentUser(data)
    } catch (err) {
      console.error("Erro ao buscar current user:", err)
    }
  }, [authToken])


  // Carrega current user automaticamente quando loga
  useEffect(() => {
    if (authToken) fetchCurrentUser()
  }, [authToken, fetchCurrentUser])

  const logout = useCallback(() => {
    setAuthToken(undefined)
    //setAuthEmail("")
    setAuthUsername("")
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
