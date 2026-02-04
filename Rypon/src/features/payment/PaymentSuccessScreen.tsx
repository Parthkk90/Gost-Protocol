/**
 * Payment Success Screen
 * Shows payment confirmation with privacy details
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentSuccess'>;
type RouteTypeProp = RouteProp<RootStackParamList, 'PaymentSuccess'>;

export const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteTypeProp>();
  const { amount, txSignature, privacyDetails } = route.params;

  const handleViewExplorer = () => {
    const url = `https://solscan.io/tx/${txSignature}?cluster=devnet`;
    Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Payment successful! Amount: $${amount.toFixed(2)} USDC\nTransaction: ${txSignature}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Success Icon */}
      <View style={styles.header}>
        <Text style={styles.successIcon}>✅</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.amount}>${amount.toFixed(2)}</Text>

        {/* Transaction Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>├ Signature:</Text>
            <TouchableOpacity onPress={handleViewExplorer}>
              <Text style={styles.detailValue}>
                {txSignature.slice(0, 4)}...{txSignature.slice(-4)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>├ Burner:</Text>
            <Text style={styles.detailValue}>
              {privacyDetails?.burner_wallet ? 
                `${privacyDetails.burner_wallet.slice(0, 4)}...${privacyDetails.burner_wallet.slice(-3)}` : 
                '9Abc...def'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>├ Privacy Score:</Text>
            <Text style={styles.detailValue}>
              🟢 {privacyDetails?.privacy_score || 98}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>└ Decoys:</Text>
            <Text style={styles.detailValue}>
              {privacyDetails?.decoys_count || 5}
            </Text>
          </View>
        </View>

        {/* Privacy Message */}
        <View style={styles.privacyMessage}>
          <Text style={styles.privacyIcon}>🔐</Text>
          <Text style={styles.privacyText}>Your payment is untraceable</Text>
          <Text style={styles.privacySubtext}>
            Merchant cannot link to your vault
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewExplorer}>
            <Text style={styles.actionButtonText}>View on Solscan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButtonSecondary}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.actionButtonSecondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
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
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 32,
  },
  successIcon: {
    fontSize: 120,
  },
  successCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  detailsCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  privacyMessage: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  privacySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  actionButtonSecondary: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  amountCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  amountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  amount: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  amountCurrency: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  privacyCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginLeft: 12,
  },
  privacyDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  privacyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  privacyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  privacyBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  txCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  txLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  txSignature: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  txAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  txActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  footer: {
    padding: 24,
  },
});
