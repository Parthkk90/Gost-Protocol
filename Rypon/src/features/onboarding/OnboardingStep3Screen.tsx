import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
  "OnboardingStep3"
>;

export const OnboardingStep3Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <PageIndicator currentPage={2} totalPages={3} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Hero Illustration */}
        <View style={styles.heroContainer}>
          <View style={styles.heroGlow} />
          <View style={styles.shieldContainer}>
            <Ionicons
              name="phone-portrait"
              size={120}
              color={Colors.textPrimary}
            />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            NFC Payments{"\n"}Just Tap Your Card
          </Text>
          <Text style={styles.subtitle}>
            Register your NFC card and pay anywhere with complete privacy
          </Text>
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.footer}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate("GetStarted")}
          icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            // Navigate to import wallet
            navigation.navigate("GetStarted");
          }}
        >
          <Text style={styles.secondaryButtonText}>
            Already have a wallet? Import
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  heroContainer: {
    width: width * 0.7,
    maxWidth: 280,
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
    opacity: 0.2,
  },
  shieldContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
    maxWidth: 300,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    gap: 16,
  },
  secondaryButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
});
