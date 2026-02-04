/**
 * Import Wallet Screen
 * Import an existing Solana wallet using mnemonic phrase
 */

import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/ui";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { walletService } from "../../services/walletService";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ImportWalletScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [mnemonic, setMnemonic] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleMnemonicChange = (text: string) => {
    setMnemonic(text);
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  };

  const handleImportWallet = async () => {
    const words = mnemonic.trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length !== 12 && words.length !== 24) {
      Alert.alert(
        'Invalid Phrase',
        'Please enter a valid 12 or 24 word recovery phrase.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsImporting(true);
      
      // Import wallet using walletService
      const wallet = await walletService.importWallet(mnemonic.trim().toLowerCase());
      
      Alert.alert(
        'Success!',
        `Wallet imported successfully!\n\nAddress: ${wallet.publicKey.slice(0, 8)}...${wallet.publicKey.slice(-6)}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            },
          },
        ]
      );
      
    } catch (error: any) {
      console.error('Error importing wallet:', error);
      Alert.alert(
        'Import Failed',
        error.message || 'Invalid recovery phrase. Please check and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsImporting(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const Clipboard = await import('expo-clipboard');
      const text = await Clipboard.getStringAsync();
      if (text) {
        handleMnemonicChange(text);
      }
    } catch (error) {
      console.error('Failed to paste:', error);
    }
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Wallet</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.gradientEnd]}
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="download" size={40} color="#FFF" />
          </LinearGradient>
        </View>

        <Text style={styles.title}>Import Existing Wallet</Text>
        <Text style={styles.subtitle}>
          Enter your 12 or 24 word recovery phrase to restore your wallet.
        </Text>

        {/* Warning */}
        <View style={styles.warningCard}>
          <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
          <Text style={styles.warningText}>
            Your recovery phrase is encrypted and stored securely on this device only.
          </Text>
        </View>

        {/* Mnemonic Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Text style={styles.inputLabel}>Recovery Phrase</Text>
            <TouchableOpacity onPress={pasteFromClipboard} style={styles.pasteButton}>
              <Ionicons name="clipboard-outline" size={18} color={Colors.primary} />
              <Text style={styles.pasteText}>Paste</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.textInput}
            value={mnemonic}
            onChangeText={handleMnemonicChange}
            placeholder="Enter your recovery phrase separated by spaces..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />
          
          <View style={styles.wordCountContainer}>
            <Text style={[
              styles.wordCountText,
              wordCount === 12 || wordCount === 24 ? styles.wordCountValid : 
              wordCount > 0 ? styles.wordCountInvalid : {}
            ]}>
              {wordCount} / 12 or 24 words
            </Text>
            {(wordCount === 12 || wordCount === 24) && (
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.infoText}>
              Make sure you're in a private location. Never share your recovery phrase with anyone.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isImporting ? "Importing..." : "Import Wallet"}
          onPress={handleImportWallet}
          disabled={isImporting || (wordCount !== 12 && wordCount !== 24)}
          style={(wordCount !== 12 && wordCount !== 24) ? styles.disabledButton : undefined}
        />
        {isImporting && (
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 24,
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
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${Colors.success}15`,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: `${Colors.success}30`,
  },
  warningText: {
    fontSize: 14,
    color: Colors.success,
    flex: 1,
    lineHeight: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: `${Colors.primary}20`,
    borderRadius: 8,
  },
  pasteText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    textAlignVertical: 'top',
  },
  wordCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  wordCountText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  wordCountValid: {
    color: Colors.success,
  },
  wordCountInvalid: {
    color: Colors.warning,
  },
  infoCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
