/**
 * Create Wallet Screen
 * Creates a real Solana wallet with mnemonic backup
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { Button } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { walletService } from "../../services/walletService";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateWalletScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [isCreating, setIsCreating] = useState(false);
  const [walletCreated, setWalletCreated] = useState(false);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState('');
  const [hasCopied, setHasCopied] = useState(false);
  const [hasConfirmedBackup, setHasConfirmedBackup] = useState(false);

  const handleCreateWallet = async () => {
    try {
      setIsCreating(true);
      
      // Create real wallet using walletService
      const { wallet, mnemonic: mnemonicPhrase } = await walletService.createWallet();
      
      // Split mnemonic into words array
      setMnemonic(mnemonicPhrase.split(' '));
      setPublicKey(wallet.publicKey);
      setWalletCreated(true);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      Alert.alert(
        'Error',
        'Failed to create wallet. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCreating(false);
    }
  };

  const copyMnemonic = async () => {
    await Clipboard.setStringAsync(mnemonic.join(' '));
    setHasCopied(true);
    Alert.alert('Copied!', 'Recovery phrase copied to clipboard. Store it safely and clear your clipboard.');
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(publicKey);
    Alert.alert('Copied!', 'Wallet address copied to clipboard.');
  };

  const handleContinue = () => {
    if (!hasConfirmedBackup) {
      Alert.alert(
        'Backup Required',
        'Please confirm you have saved your recovery phrase before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  // Initial creation screen
  if (!walletCreated) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Wallet</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="wallet" size={48} color="#FFF" />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Create New Wallet</Text>
          <Text style={styles.subtitle}>
            Generate a new Solana wallet with a secure 12-word recovery phrase.
            Make sure to backup your recovery phrase in a safe place.
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.infoText}>Your keys never leave your device</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="lock-closed" size={20} color={Colors.success} />
              <Text style={styles.infoText}>Encrypted secure storage</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="key" size={20} color={Colors.success} />
              <Text style={styles.infoText}>Only you control your funds</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title={isCreating ? "Creating..." : "Generate Wallet"}
            onPress={handleCreateWallet}
            disabled={isCreating}
          />
          {isCreating && (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Wallet created - show mnemonic
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.backButton} />
        <Text style={styles.headerTitle}>Backup Wallet</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Success Badge */}
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.successText}>Wallet Created Successfully!</Text>
        </View>

        {/* Wallet Address */}
        <View style={styles.addressCard}>
          <Text style={styles.addressLabel}>Your Wallet Address</Text>
          <TouchableOpacity onPress={copyAddress} style={styles.addressRow}>
            <Text style={styles.addressText} numberOfLines={1}>
              {publicKey.slice(0, 16)}...{publicKey.slice(-8)}
            </Text>
            <Ionicons name="copy-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color={Colors.warning} />
          <Text style={styles.warningText}>
            Write down these 12 words in order and store them in a safe place.
            Anyone with this phrase can access your funds.
          </Text>
        </View>

        {/* Mnemonic Grid */}
        <View style={styles.mnemonicCard}>
          <View style={styles.mnemonicHeader}>
            <Text style={styles.mnemonicTitle}>Recovery Phrase</Text>
            <TouchableOpacity onPress={copyMnemonic} style={styles.copyButton}>
              <Ionicons 
                name={hasCopied ? "checkmark" : "copy-outline"} 
                size={18} 
                color={Colors.primary} 
              />
              <Text style={styles.copyText}>{hasCopied ? "Copied" : "Copy"}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.mnemonicGrid}>
            {mnemonic.map((word, index) => (
              <View key={index} style={styles.wordBox}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Confirm Backup Checkbox */}
        <TouchableOpacity 
          style={styles.confirmRow}
          onPress={() => setHasConfirmedBackup(!hasConfirmedBackup)}
        >
          <View style={[
            styles.checkbox,
            hasConfirmedBackup && styles.checkboxChecked
          ]}>
            {hasConfirmedBackup && (
              <Ionicons name="checkmark" size={16} color="#FFF" />
            )}
          </View>
          <Text style={styles.confirmText}>
            I have safely stored my recovery phrase
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Continue to Wallet"
          onPress={handleContinue}
          disabled={!hasConfirmedBackup}
          style={!hasConfirmedBackup ? styles.disabledButton : undefined}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDark,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: `${Colors.success}20`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },
  addressCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  addressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: `${Colors.warning}15`,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    flex: 1,
    lineHeight: 20,
  },
  mnemonicCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  mnemonicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mnemonicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  mnemonicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  wordBox: {
    width: (width - 80) / 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  wordNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 16,
  },
  wordText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
