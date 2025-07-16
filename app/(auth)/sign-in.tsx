import { StyleSheet, Text, TextInput, Alert, SafeAreaView } from "react-native"
import { Colors } from "@/app/utils/constant"
import { Link } from "expo-router"
import { useState } from "react"
import { useAuth } from "../lib/auth"
import LottieView from "lottie-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { GlassCard, GradientButton } from "@/components/ui/AnimatedComponents"
import { MotiView } from "moti"

export default function SignInScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await signIn(email, password)
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign in"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          Colors.gradientStart,
          Colors.gradientMiddle,
          Colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 1000 }}
        style={styles.bodyContainer}
      >
        <GlassCard style={styles.glassCard}>
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 300 }}
          >
            <LottieView
              source={require("../../assets/lottie/login-glossy.json")}
              autoPlay
              loop
              style={styles.lottie}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", delay: 500 }}
          >
            <Text style={styles.title}>Welcome Back</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", delay: 700 }}
            style={{ width: "100%" }}
          >
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(text) => setEmail(text)}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateX: 20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", delay: 900 }}
            style={{ width: "100%" }}
          >
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textDim}
              secureTextEntry
              onChangeText={(text) => setPassword(text)}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 1100 }}
            style={{ width: "100%" }}
          >
            <GradientButton
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleSignIn}
              style={styles.button}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", delay: 1300 }}
            style={styles.signupContainer}
          >
            <Text style={styles.signupText}>No account yet? </Text>
            <Link href="/sign-up" style={styles.signupLink}>
              Sign Up
            </Link>
          </MotiView>
        </GlassCard>
      </MotiView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  bodyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  glassCard: {
    width: "90%",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    padding: 28,
    alignItems: "center",
    shadowColor: Colors.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    color: Colors.primary,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    color: Colors.dark,
    fontSize: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
    marginTop: 5,
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: Colors.light,
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1.1,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  signupText: {
    color: Colors.gray,
    fontSize: 15,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 2,
  },
})
