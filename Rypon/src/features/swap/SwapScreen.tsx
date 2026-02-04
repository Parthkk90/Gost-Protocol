import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { SAMPLE_ASSETS } from "../../data/sampleData";

const { width } = Dimensions.get("window");

export const SwapScreen: React.FC = () => {
  const [fromAmount, setFromAmount] = useState("1.5");
  const [toAmount] = useState("209.80");
  const [slippage] = useState(0.5);

  const solBalance = SAMPLE_ASSETS[0].balance;
  const rate = 140.2;
  const networkFee = 0.01;

  const handleMaxPress = () => {
    setFromAmount(solBalance.toString());
  };

  const handleSwap = () => {
    // Swap action
    console.log("Swapping...");
  };

  return (
    <View style={styles.container}>
      {/* Background Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Swap</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={24}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* From Card */}
          <View style={styles.swapCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>You pay</Text>
              <View style={styles.balanceRow}>
                <TouchableOpacity
                  style={styles.maxButton}
                  onPress={handleMaxPress}
                >
                  <Text style={styles.maxButtonText}>MAX</Text>
                </TouchableOpacity>
                <Text style={styles.balanceText}>
                  Balance: {solBalance} SOL
                </Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              <TextInput
                style={styles.amountInput}
                value={fromAmount}
                onChangeText={setFromAmount}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity style={styles.tokenSelector}>
                <LinearGradient
                  colors={[Colors.gradientStart, Colors.gradientEnd]}
                  style={styles.tokenIcon}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.tokenIconText}>S</Text>
                </LinearGradient>
                <Text style={styles.tokenName}>SOL</Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.usdValue}>≈ $210.45</Text>
          </View>

          {/* Swap Button */}
          <View style={styles.swapButtonContainer}>
            <TouchableOpacity style={styles.swapButton}>
              <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* To Card */}
          <View style={[styles.swapCard, styles.toCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>You receive</Text>
            </View>

            <View style={styles.cardContent}>
              <TextInput
                style={styles.amountInput}
                value={toAmount}
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="decimal-pad"
                editable={false}
              />

              <TouchableOpacity style={styles.tokenSelector}>
                <View
                  style={[styles.tokenIcon, { backgroundColor: Colors.usdc }]}
                >
                  <Text style={styles.tokenIconText}>$</Text>
                </View>
                <Text style={styles.tokenName}>USDC</Text>
                <Ionicons
                  name="chevron-down"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.toCardFooter}>
              <Text style={styles.usdValue}>≈ $209.80</Text>
              <View style={styles.slippageBadge}>
                <Text style={styles.slippageText}>-0.3%</Text>
              </View>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={styles.detailsSection}>
            <DetailRow label="Rate" value={`1 SOL ≈ ${rate} USDC`} showInfo />
            <View style={styles.detailDivider} />
            <DetailRow
              label="Est. Network Fee"
              value={`< $${networkFee.toFixed(2)}`}
              icon="flash"
            />
            <DetailRow
              label="Max Slippage"
              value={`${slippage}%`}
              icon="create-outline"
            />
          </View>
        </View>

        {/* Bottom Action */}
        <View style={styles.footer}>
          <Button
            title="Review Order"
            onPress={handleSwap}
            style={styles.reviewButton}
            textStyle={styles.reviewButtonText}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  showInfo?: boolean;
  icon?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  showInfo,
  icon,
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailLabel}>
      <Text style={styles.detailLabelText}>{label}</Text>
      {showInfo && (
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={Colors.textSecondary}
        />
      )}
    </View>
    <View style={styles.detailValue}>
      {icon && (
        <Ionicons name={icon as any} size={14} color={Colors.successLight} />
      )}
      <Text style={styles.detailValueText}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  glowTop: {
    position: "absolute",
    top: "-10%",
    right: "-20%",
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  glowBottom: {
    position: "absolute",
    bottom: "-10%",
    left: "-10%",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#3b82f6",
    opacity: 0.1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  swapCard: {
    backgroundColor: Colors.cardDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toCard: {
    marginTop: -4,
    paddingTop: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  maxButton: {
    backgroundColor: `${Colors.primary}1A`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  maxButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
  },
  balanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tokenSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.glassEffect,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 6,
  },
  tokenIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  tokenIconText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  usdValue: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  toCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  slippageBadge: {
    backgroundColor: `${Colors.error}1A`,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  slippageText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.error,
  },
  swapButtonContainer: {
    alignItems: "center",
    height: 8,
    marginVertical: 0,
    zIndex: 10,
  },
  swapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardDark,
    borderWidth: 4,
    borderColor: Colors.backgroundDark,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    position: "absolute",
    top: -20,
  },
  detailsSection: {
    marginTop: 24,
    paddingHorizontal: 8,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailLabelText: {
    fontSize: 14,
    fontWeight: "400",
    color: Colors.textSecondary,
  },
  detailValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailValueText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.borderDark,
    marginVertical: 4,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  reviewButton: {
    backgroundColor: Colors.textPrimary,
  },
  reviewButtonText: {
    color: Colors.backgroundDark,
  },
});
