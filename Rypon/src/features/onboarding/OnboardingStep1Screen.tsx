import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, PageIndicator } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OnboardingStep1"
>;

export const OnboardingStep1Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Background Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Visual */}
        <View style={styles.heroContainer}>
          <View style={styles.heroGlow} />
          <View style={styles.illustrationPlaceholder}>
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={styles.gradientCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.illustrationText}>🔐</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Complete Privacy{"\n"}Every Payment
          </Text>
          <Text style={styles.subtitle}>
            Use burner wallets + decoys to make your payments untraceable
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <PageIndicator currentPage={0} totalPages={3} />
        <Button
          title="Next"
          onPress={() => navigation.navigate("OnboardingStep2")}
          style={styles.button}
        />
        <View style={styles.safeArea} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  glowTop: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: width * 0.8,
    height: 300,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    opacity: 0.2,
    transform: [{ scale: 1.5 }],
  },
  glowBottom: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: width * 0.6,
    height: 250,
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroContainer: {
    width: width * 0.8,
    maxWidth: 320,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  heroGlow: {
    position: "absolute",
    width: "75%",
    height: "75%",
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    opacity: 0.3,
  },
  illustrationPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  gradientCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  illustrationText: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 24,
  },
  button: {
    marginTop: 0,
  },
  safeArea: {
    height: 8,
  },
});
