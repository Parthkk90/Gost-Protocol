import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { WALLET_ADDRESSES } from "../../data/sampleData";

export const ReceiveScreen: React.FC = () => {
  const navigation = useNavigation();

  const copyAddress = async () => {
    await Clipboard.setStringAsync(WALLET_ADDRESSES.full);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
        >
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Receive</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons
            name="share-outline"
            size={24}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Network Indicator */}
        <View style={styles.networkIndicator}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>Solana Network</Text>
        </View>

        {/* QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={WALLET_ADDRESSES.full}
              size={220}
              backgroundColor="white"
              color="black"
            />
          </View>

          {/* Logo Overlay */}
          <View style={styles.logoOverlay}>
            <View style={styles.logoCircle}>
              <View style={styles.logoGradient}>
                <Ionicons
                  name="logo-bitcoin"
                  size={24}
                  color={Colors.textPrimary}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Address Display */}
        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>WALLET ADDRESS</Text>
          <TouchableOpacity
            style={styles.addressContainer}
            onPress={copyAddress}
          >
            <Text style={styles.addressText}>{WALLET_ADDRESSES.short}</Text>
            <Ionicons
              name="copy-outline"
              size={18}
              color={Colors.primary}
              style={styles.copyIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            This address can only receive{" "}
            <Text style={styles.infoBold}>Solana (SOL)</Text> and{" "}
            <Text style={styles.infoBold}>SPL tokens</Text>. Sending other
            assets may result in permanent loss.
          </Text>
        </View>
      </View>

      {/* Bottom Action */}
      <View style={styles.footer}>
        <Button
          title="Copy Address"
          onPress={copyAddress}
          icon={<Ionicons name="copy-outline" size={24} color="#FFF" />}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  networkIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.glassEffect,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 32,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.successLight,
    shadowColor: Colors.successLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  qrCard: {
    width: 260,
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    padding: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 32,
    position: "relative",
  },
  qrContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  logoGradient: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addressSection: {
    width: "100%",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: 320,
  },
  addressText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.textPrimary,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  copyIcon: {
    opacity: 0.8,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: `${Colors.primary}0D`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    borderRadius: 16,
    padding: 16,
    maxWidth: 320,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.borderDark,
  },
});
