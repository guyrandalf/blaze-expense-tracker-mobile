import {useRouter, useSegments} from "expo-router"
import {createContext, useContext, useEffect, useState} from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import {User} from "@/types/auth"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === "(auth)"
      const inDashboardGroup = segments[0] === "(dashboard)"

      if (!user && !inAuthGroup) {
        router.replace("/sign-in")
      } else if (user && !inDashboardGroup) {
        router.replace("/(dashboard)/(tabs)/home")
      }
    }
  }, [user, segments, isLoading, router])

  async function checkUser() {
    try {
      const storedToken = await AsyncStorage.getItem("token")
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/session`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      )

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setToken(storedToken)
      } else {
        await AsyncStorage.removeItem("token")
      }
    } catch (error) {
      console.error("Error checking user session:", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/sign-in`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to sign in")
    }

    const { user: userData, token } = await response.json()
    await AsyncStorage.setItem("token", token)
    setUser(userData)
    setToken(token)
  }

  async function signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/sign-up`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to sign up")
    }

    await signIn(email, password)
  }

  async function signOut() {
    await AsyncStorage.removeItem("token")
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
