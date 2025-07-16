import { Stack } from "expo-router";
import AuthProvider from "./lib/auth";
import { DataProvider } from "@/context/DataContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DataProvider>
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={["#1e293b", "#6366f1", "#f472b6"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(dashboard)/(tabs)" />
            </Stack>
          </View>
        </DataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
