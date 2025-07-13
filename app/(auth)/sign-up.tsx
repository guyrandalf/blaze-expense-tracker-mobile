import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../utils/constant"
import { Link } from "expo-router"
import { useState } from "react"
import { useAuth } from "../lib/auth"

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [firstName, setFirstName] = useState<string>("")
  const [lastName, setLastName] = useState<string>("")

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
      <View style={styles.bodyContainer}>
        <View style={styles.loginContainer}>
          <Text style={styles.title}>Create an Account</Text>
          <TextInput
            style={styles.input}
            placeholder="Firstname"
            placeholderTextColor={Colors.gray}
            value={firstName}
            onChangeText={(text) => setFirstName(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Lastname"
            placeholderTextColor={Colors.gray}
            value={lastName}
            onChangeText={(text) => setLastName(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.gray}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => setEmail(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Colors.gray}
            secureTextEntry
            value={password}
            onChangeText={(text) => setPassword(text)}
          />
          <Pressable
            style={styles.button}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size={20} color={Colors.light} />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </Pressable>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Have an account? </Text>
            <Link href="/sign-in" style={styles.signupLink}>
              Sign In
            </Link>
          </View>
        </View>
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
    justifyContent: "center",
  },
  loginContainer: {
    backgroundColor: Colors.dark,
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    color: Colors.light,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: Colors.background,
    padding: 15,
    borderRadius: 5,
    marginBottom: 15,
    color: Colors.light,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    color: Colors.light,
    fontSize: 16,
    fontWeight: "bold",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    color: Colors.gray,
  },
  signupLink: {
    color: Colors.primary,
  },
})
