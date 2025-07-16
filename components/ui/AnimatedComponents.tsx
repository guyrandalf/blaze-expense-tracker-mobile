import React from "react"
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  ViewStyle,
  TextStyle,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Colors } from "@/app/utils/constant"
import { shadows } from "@/app/utils/theme"
import * as Haptics from "expo-haptics"
import { MotiView } from "moti"
import { Skeleton } from "moti/skeleton"

interface AnimatedCardProps {
  style?: ViewStyle
  children: React.ReactNode
}

export const AnimatedCard = ({ style, children }: AnimatedCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "timing", duration: 300 }}
      style={[styles.card, style]}
    >
      {children}
    </MotiView>
  )
}

interface GlassCardProps {
  style?: ViewStyle
  children: React.ReactNode
  intensity?: number
}

export const GlassCard = ({
  style,
  children,
  intensity = 30,
}: GlassCardProps) => {
  return (
    <BlurView intensity={intensity} style={[styles.glassCard, style]}>
      {children}
    </BlurView>
  )
}

interface GradientButtonProps {
  onPress: () => void
  title: string
  style?: ViewStyle
  textStyle?: TextStyle
}

export const GradientButton = ({
  onPress,
  title,
  style,
  textStyle,
}: GradientButtonProps) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.buttonContainer, style]}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={[
          Colors.gradientStart,
          Colors.gradientMiddle,
          Colors.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.buttonText, textStyle]}>{title}</Text>
      </LinearGradient>
    </TouchableOpacity>
  )
}

export const SkeletonLoader = () => {
  return (
    <View style={styles.skeletonContainer}>
      <Skeleton colorMode="dark" width={"100%"} height={60} radius={8} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadows.medium,
  },
  glassCard: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    marginVertical: 8,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  buttonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 8,
    ...shadows.small,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  buttonText: {
    color: Colors.light,
    fontSize: 16,
    fontWeight: "600",
  },
  skeletonContainer: {
    padding: 16,
  },
})
