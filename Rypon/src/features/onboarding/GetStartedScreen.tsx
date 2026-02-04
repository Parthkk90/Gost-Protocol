import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "GetStarted"
>;

export const GetStartedScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleCreateWallet = () => {
    // Navigate to create wallet screen
    navigation.navigate("CreateWallet");
  };

  const handleImportWallet = () => {
    // Navigate to import wallet screen
    navigation.navigate("ImportWallet");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Section */}
      <View style={styles.content}>
        {/* Logo Container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoGlowContainer}>
            <LinearGradient
              colors={[Colors.primary, "#9333ea"]}
              style={styles.logoGlow}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          </View>
          <View style={styles.logoCircle}>
            <Ionicons
              name="logo-bitcoin"
              size={48}
              color={Colors.textPrimary}
            />
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.title}>Welcome to SolWallet</Text>
        <Text style={styles.subtitle}>
          The safe and secure way to store, send, and swap your crypto assets on
          Solana.
        </Text>

        {/* Hero Image */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[
              `${Colors.primary}33`,
              "transparent",
              `${Colors.gradientEnd}1A`,
            ]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroContent}>
            <Ionicons
              name="shield-checkmark"
              size={80}
              color={Colors.primary}
            />
          </View>

          {/* Badge */}
          <View style={styles.securityBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={Colors.success}
            />
            <Text style={styles.badgeText}>Audited & Secure</Text>
          </View>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <Button
          title="Create New Wallet"
          onPress={handleCreateWallet}
          style={styles.primaryButton}
        />
        <Button
          title="Import Existing Wallet"
          onPress={handleImportWallet}
          variant="secondary"
          style={styles.secondaryButton}
        />
        <Text style={styles.legalText}>
          By continuing, you agree to our{" "}
          <Text style={styles.legalLink}>Terms of Service</Text> &{" "}
          <Text style={styles.legalLink}>Privacy Policy</Text>.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  logoContainer: {
    position: "relative",
    marginBottom: 40,
  },
  logoGlowContainer: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 9999,
    overflow: "hidden",
    opacity: 0.25,
  },
  logoGlow: {
    flex: 1,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 24,
    marginBottom: 40,
  },
  heroCard: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  heroGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  securityBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textPrimary,
    opacity: 0.9,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  legalText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  legalLink: {
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
});
