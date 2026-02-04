import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, PageIndicator } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "OnboardingStep2"
>;

export const OnboardingStep2Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('OnboardingStep1');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Background Pattern */}
      <View style={styles.backgroundPattern} />
      <View style={styles.glowCenter} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <PageIndicator currentPage={1} totalPages={3} />

        <TouchableOpacity onPress={() => navigation.navigate("GetStarted")}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Illustration */}
        <View style={styles.heroContainer}>
          <View style={styles.animatedGlow} />

          <LinearGradient
            colors={[Colors.surfaceDark, Colors.backgroundDark]}
            style={styles.mainCard}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          >
            <View style={styles.cardGlow} />

            {/* Wallet Icon Display */}
            <View style={styles.cardContent}>
              <Ionicons name="cash" size={80} color={Colors.primary} />
            </View>

            {/* Badge */}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>💳 Credit Line</Text>
            </View>
          </LinearGradient>

          {/* Floating Elements */}
          <View style={[styles.floatingCard, styles.floatingCard1]}>
            <Ionicons name="shield-checkmark" size={24} color="#d4a5f4" />
          </View>
          <View style={[styles.floatingCard, styles.floatingCard2]}>
            <Ionicons name="lock-closed" size={20} color="#f4a5d4" />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Instant Credit Line{"\n"}Backed by SOL
          </Text>
          <Text style={styles.subtitle}>
            Deposit SOL as collateral and get a USDC credit line for payments
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title="Next"
          onPress={() => navigation.navigate("OnboardingStep3")}
          icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
  },
  glowCenter: {
    position: "absolute",
    top: "25%",
    left: "50%",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    transform: [{ translateX: -250 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroContainer: {
    width: 280,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  animatedGlow: {
    position: "absolute",
    width: "150%",
    height: "150%",
    borderRadius: 9999,
    backgroundColor: Colors.primary,
    opacity: 0.05,
  },
  mainCard: {
    width: 256,
    aspectRatio: 1,
    borderRadius: 40,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden",
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.glassEffect,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  floatingCard: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingCard1: {
    right: -16,
    top: -16,
  },
  floatingCard2: {
    left: -16,
    bottom: -16,
    width: 48,
    height: 48,
  },
  textContainer: {
    alignItems: "center",
    gap: 12,
    maxWidth: 340,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
  },
});
