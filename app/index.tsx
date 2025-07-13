import {router} from "expo-router"
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import {Colors} from "./utils/constant"
import {useEffect, useRef} from "react"
import {useAuth} from "./lib/auth"

export default function Index() {
  const { isLoading } = useAuth()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start()
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bodyContainer}>
        {isLoading ?? (
            <>
            <ActivityIndicator
            size="large"
            color={Colors.light}
            style={{ marginTop: 50 }}
        />
            ) : (
        <View style={styles.titleContainer}>
          <Animated.Text
            style={[
              styles.bodyText,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            Blaze Expense
          </Animated.Text>
          <Animated.Text
            style={[
              styles.bodyText2,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            Tracker
          </Animated.Text>
        </View>
        <Pressable
          style={styles.link}
          onPress={() => router.replace("/(auth)/sign-in")}
        >
          <Text style={styles.linkText}>Get Started</Text>
        </Pressable>
            </>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bodyContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 50,
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  bodyText: {
    fontSize: 36,
    color: Colors.light,
    textAlign: "center",
    fontWeight: "bold",
  },
  bodyText2: {
    fontSize: 26,
    color: Colors.light,
    textAlign: "center",
    fontWeight: "bold",
  },
  link: {
    backgroundColor: Colors.light,
    padding: 16,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  linkText: {
    fontSize: 20,
    color: Colors.dark,
    fontWeight: "600",
    textAlign: "center",
  },
})
