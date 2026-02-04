import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Header } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { SAMPLE_ASSETS, SAMPLE_CONTACTS } from "../../data/sampleData";

export const SendScreen: React.FC = () => {
  const navigation = useNavigation();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [showUSD, setShowUSD] = useState(false);

  const solBalance = SAMPLE_ASSETS[0].balance;
  const solPrice = SAMPLE_ASSETS[0].usdValue / SAMPLE_ASSETS[0].balance;

  const handleMaxPress = () => {
    setAmount(solBalance.toString());
  };

  const handlePaste = async () => {
    // Paste from clipboard
    setRecipient("8xGvKt2P9fH3aD27wLmN5kJ4bE3cF1");
  };

  const getUSDValue = () => {
    const amountNum = parseFloat(amount) || 0;
    return (amountNum * solPrice).toFixed(2);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header
        title="Send SOL"
        showBack
        onBackPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
        rightIcon="settings-outline"
      />

      {/* Balance Chip */}
      <View style={styles.balanceChip}>
        <View style={styles.statusDot} />
        <Text style={styles.balanceText}>
          Available:{" "}
          <Text style={styles.balanceBold}>{solBalance.toFixed(2)} SOL</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TO</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="at"
              size={20}
              color={Colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Recipient's Solana address"
              placeholderTextColor={Colors.textSecondary}
              value={recipient}
              onChangeText={setRecipient}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity
                style={styles.pasteButton}
                onPress={handlePaste}
              >
                <Text style={styles.pasteButtonText}>Paste</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrButton}>
                <Ionicons
                  name="qr-code-outline"
                  size={22}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputGroup}>
          <View style={styles.amountLabelRow}>
            <Text style={styles.label}>AMOUNT</Text>
            <TouchableOpacity
              onPress={() => setShowUSD(!showUSD)}
              style={styles.toggleButton}
            >
              <Text style={styles.toggleText}>Show USD</Text>
              <Ionicons name="swap-vertical" size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <TouchableOpacity style={styles.maxButton} onPress={handleMaxPress}>
              <Text style={styles.maxButtonText}>MAX</Text>
            </TouchableOpacity>

            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={Colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
              />
              {amount && <Text style={styles.currencySuffix}>SOL</Text>}
            </View>

            <Text style={styles.usdEquivalent}>≈ ${getUSDValue()} USD</Text>
          </View>
        </View>

        {/* Recent Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.contactsTitle}>RECENT CONTACTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contactsList}
          >
            {SAMPLE_CONTACTS.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactItem}
                onPress={() => setRecipient(contact.address)}
              >
                <View style={styles.contactAvatar}>
                  {contact.avatar ? (
                    <Text style={styles.avatarText}>👤</Text>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>
                        {contact.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contactName} numberOfLines={1}>
                  {contact.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button
          title="Next"
          onPress={() => {
            // Navigate to confirm screen or go back
            navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs');
          }}
          icon={<Ionicons name="arrow-forward" size={20} color="#000" />}
          style={styles.nextButton}
          textStyle={styles.nextButtonText}
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
  balanceChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${Colors.surfaceDark}80`,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 24,
    alignSelf: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.successLight,
    shadowColor: Colors.successLight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  balanceBold: {
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: "400",
  },
  inputActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pasteButton: {
    backgroundColor: Colors.glassEffect,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pasteButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  amountLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  toggleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.primary,
  },
  amountContainer: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    position: "relative",
  },
  maxButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: `${Colors.primary}33`,
    borderWidth: 1,
    borderColor: `${Colors.primary}33`,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  maxButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 4,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "300",
    color: Colors.textPrimary,
    textAlign: "center",
    minWidth: 100,
  },
  currencySuffix: {
    fontSize: 20,
    fontWeight: "500",
    color: Colors.textSecondary,
  },
  usdEquivalent: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  contactsSection: {
    marginTop: 32,
  },
  contactsTitle: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  contactsList: {
    gap: 12,
    paddingBottom: 8,
  },
  contactItem: {
    alignItems: "center",
    gap: 8,
    width: 80,
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
  },
  avatarText: {
    fontSize: 32,
    textAlign: "center",
    lineHeight: 56,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  contactName: {
    fontSize: 12,
    fontWeight: "400",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  bottomAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.backgroundDark,
  },
  nextButton: {
    backgroundColor: Colors.textPrimary,
  },
  nextButtonText: {
    color: Colors.backgroundDark,
  },
});
