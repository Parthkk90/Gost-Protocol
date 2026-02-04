/**
 * Create Vault Screen
 * User deposits SOL collateral to create their vault and get credit line
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui';
import { vaultService } from '../../services/vaultService';
import { walletService } from '../../services/walletService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CreateVault'>;

const SOL_PRICE_USD = 150; // Update from API in production

export const CreateVaultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [solAmount, setSolAmount] = useState('');
  const [creditUsd, setCreditUsd] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const wallet = await walletService.loadWallet();
      if (wallet) {
        setWalletAddress(wallet.publicKey);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  useEffect(() => {
    if (solAmount) {
      const amount = parseFloat(solAmount);
      if (!isNaN(amount)) {
        const { creditUsd: credit } = vaultService.calculateCredit(amount, SOL_PRICE_USD);
        setCreditUsd(credit);
      }
    } else {
      setCreditUsd(0);
    }
  }, [solAmount]);

  const handleCreateVault = async () => {
    if (!solAmount || parseFloat(solAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid SOL amount');
      return;
    }

    const amount = parseFloat(solAmount);
    if (amount < 0.1) {
      Alert.alert('Error', 'Minimum deposit is 0.1 SOL');
      return;
    }

    setIsLoading(true);
    try {
      // Generate vault ID
      const vaultId = Date.now().toString();

      const response = await vaultService.createVault({
        owner_pubkey: walletAddress,
        vault_id: vaultId,
        default_ltv: 15000, // 150%
        base_interest_rate: 500, // 5%
      });

      // Navigate to deposit screen with vault address
      navigation.navigate('DepositCollateral', {
        vaultAddress: response.vault_address,
        solAmount: amount,
      });
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create vault. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Vault</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
          <Text style={styles.infoText}>
            ℹ️ Deposit SOL as collateral to get a USDC credit line for payments
          </Text>
        </View>

        {/* SOL Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Collateral Amount</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputPrefix}>◎</Text>
            <TextInput
              style={styles.input}
              value={solAmount}
              onChangeText={setSolAmount}
              placeholder="1.0"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>SOL</Text>
            </View>
          </View>
          <Text style={styles.helperText}>
            Available: 2.5 SOL
          </Text>
        </View>

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>You will receive:</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>💳 Credit Limit:</Text>
            <Text style={styles.previewValue}>${creditUsd.toFixed(2)}</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>📈 Est. Yield:</Text>
            <Text style={styles.previewValue}>${((parseFloat(solAmount) || 0) * SOL_PRICE_USD * 0.12).toFixed(2)}/year (12%)</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>💰 LTV Ratio:</Text>
            <Text style={styles.previewValue}>150%</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Button
          title={isLoading ? 'Creating Vault...' : 'Create Vault & Deposit'}
          onPress={handleCreateVault}
          disabled={isLoading || !solAmount || parseFloat(solAmount) < 0.1}
          icon={
            isLoading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            )
          }
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
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 16,
    paddingRight: 12,
  },
  inputPrefix: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.textPrimary,
    padding: 16,
    paddingLeft: 0,
  },
  currencyBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  previewCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  creditCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creditTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  creditAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 4,
  },
  creditHelper: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  ltvBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ltvText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  footer: {
    padding: 24,
  },
});
