import {Stack} from "expo-router"
import AuthProvider from "./lib/auth"
import {DataProvider} from "@/context/DataContext"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(dashboard)/(tabs)" />
          </Stack>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
