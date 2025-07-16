import { StyleSheet, Text, TextInput, Alert, SafeAreaView } from "react-native"
import { Colors } from "@/app/utils/constant"
import { Link } from "expo-router"
import { useState } from "react"
import { useAuth } from "../lib/auth"
import LottieView from "lottie-react-native"
import { LinearGradient } from "expo-linear-gradient"
import { GlassCard, GradientButton } from "@/components/ui/AnimatedComponents"
import { MotiView } from "moti"

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  async function handleSignUp() {
    if (!email || !password || !firstName || !lastName) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      await signUp(email, password, firstName, lastName)
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to sign up"
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
              source={require("../../assets/lottie/register-glossy.json")}
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
            <Text style={styles.title}>Create Account</Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", delay: 700 }}
            style={{ width: "100%", gap: 16 }}
          >
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={Colors.textDim}
              autoCapitalize="words"
              onChangeText={setFirstName}
              value={firstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={Colors.textDim}
              autoCapitalize="words"
              onChangeText={setLastName}
              value={lastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={setEmail}
              value={email}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.textDim}
              secureTextEntry
              onChangeText={setPassword}
              value={password}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 1100 }}
            style={{ width: "100%" }}
          >
            <GradientButton
              title={loading ? "Creating Account..." : "Sign Up"}
              onPress={handleSignUp}
              style={styles.button}
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", delay: 1300 }}
            style={styles.signupContainer}
          >
            <Text style={styles.signupText}>Already have an account? </Text>
            <Link href="/sign-in" style={styles.signupLink}>
              Sign In
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
  },
  bodyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  glassCard: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 28,
    alignItems: "center",
  },
  lottie: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    color: Colors.light,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    letterSpacing: 1.2,
  },
  input: {
    backgroundColor: Colors.glass,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    color: Colors.light,
    fontSize: 16,
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  button: {
    marginVertical: 8,
    width: "100%",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    backgroundColor: Colors.glass,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  signupText: {
    color: Colors.textDim,
    fontSize: 16,
  },
  signupLink: {
    color: Colors.light,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 4,
  },
})
