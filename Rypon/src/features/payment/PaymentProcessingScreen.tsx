/**
 * Payment Processing Screen
 * Shows step-by-step progress of privacy payment
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { paymentService } from '../../services/paymentService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PaymentProcessing'>;
type RouteTypeProp = RouteProp<RootStackParamList, 'PaymentProcessing'>;

enum PaymentStep {
  CARD_DETECTED = 0,
  VAULT_VERIFIED = 1,
  GETTING_PRICE = 2,
  CREATING_BURNER = 3,
  GENERATING_DECOYS = 4,
  EXECUTING_PAYMENT = 5,
  SUCCESS = 6,
}

const STEP_LABELS = {
  [PaymentStep.CARD_DETECTED]: 'Card Detected',
  [PaymentStep.VAULT_VERIFIED]: 'Vault Verified',
  [PaymentStep.GETTING_PRICE]: 'Getting SOL Price',
  [PaymentStep.CREATING_BURNER]: 'Creating Burner Wallet',
  [PaymentStep.GENERATING_DECOYS]: 'Generating Decoys',
  [PaymentStep.EXECUTING_PAYMENT]: 'Executing Payment',
  [PaymentStep.SUCCESS]: 'Payment Complete',
};

export const PaymentProcessingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteTypeProp>();
  const { cardHash, merchantWallet, amount } = route.params;

  const [currentStep, setCurrentStep] = useState<PaymentStep>(PaymentStep.CARD_DETECTED);
  const [txSignature, setTxSignature] = useState<string>('');
  const [privacyDetails, setPrivacyDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processPayment();
  }, []);

  const processPayment = async () => {
    try {
      // Step 1: Card Detected
      setCurrentStep(PaymentStep.CARD_DETECTED);
      await delay(800);

      // Step 2: Vault Verified
      setCurrentStep(PaymentStep.VAULT_VERIFIED);
      await delay(800);

      // Step 3: Getting SOL Price
      setCurrentStep(PaymentStep.GETTING_PRICE);
      await delay(1000);

      // Step 4: Creating Burner Wallet
      setCurrentStep(PaymentStep.CREATING_BURNER);
      await delay(1200);

      // Step 5: Generating Decoys
      setCurrentStep(PaymentStep.GENERATING_DECOYS);
      await delay(1500);

      // Step 6: Executing Payment
      setCurrentStep(PaymentStep.EXECUTING_PAYMENT);
      const response = await paymentService.processPayment({
        card_hash: cardHash,
        amount_usdc: amount,
        merchant_wallet: merchantWallet,
      });

      if (response.approved) {
        setTxSignature(response.transaction_signature || '');
        setPrivacyDetails(response.privacy_details);
        setCurrentStep(PaymentStep.SUCCESS);

        // Navigate to success screen after 1 second
        setTimeout(() => {
          navigation.replace('PaymentSuccess', {
            amount,
            txSignature: response.transaction_signature || '',
            privacyDetails: response.privacy_details,
          });
        }, 1500);
      } else {
        throw new Error(response.error_message || 'Payment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
      Alert.alert('Payment Failed', err.message || 'Something went wrong', [
        {
          text: 'OK',
          onPress: () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'),
        },
      ]);
    }
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const getStepIcon = (step: PaymentStep) => {
    if (error) {
      return <Ionicons name="close-circle" size={24} color={Colors.error} />;
    } else if (currentStep === step) {
      return <ActivityIndicator size="small" color={Colors.primary} />;
    } else if (currentStep > step) {
      return <Ionicons name="checkmark-circle" size={24} color={Colors.success} />;
    } else {
      return <View style={styles.stepIconPending} />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Processing Payment</Text>
      </View>

      {/* Amount Display */}
      <View style={styles.amountContainer}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amount}>${amount.toFixed(2)}</Text>
        <Text style={styles.amountSubtitle}>USDC</Text>
      </View>

      {/* Progress Steps */}
      <View style={styles.stepsContainer}>
        {Object.entries(STEP_LABELS).map(([stepKey, label], index) => {
          const step = parseInt(stepKey) as PaymentStep;
          const isLastStep = step === PaymentStep.SUCCESS;
          const stepComplete = currentStep > step;
          const stepCurrent = currentStep === step;
          const stepPending = currentStep < step;

          return (
            <React.Fragment key={step}>
              <View style={styles.step}>
                <View style={styles.stepIndicator}>
                  {stepComplete && <Text style={styles.stepCheck}>✅</Text>}
                  {stepCurrent && <Text style={styles.stepCurrent}>⏳</Text>}
                  {stepPending && <Text style={styles.stepPending}>○</Text>}
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[
                      styles.stepTitle,
                      currentStep === step && styles.stepTitleActive,
                    ]}
                  >
                    {label}
                  </Text>
                  {currentStep === step && !error && (
                    <Text style={styles.stepStatus}>← Current step</Text>
                  )}
                </View>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / PaymentStep.SUCCESS) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round((currentStep / PaymentStep.SUCCESS) * 100)}%
        </Text>
      </View>

      {/* Privacy Info */}
      {currentStep >= PaymentStep.GENERATING_DECOYS && !error && (
        <View style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Text style={styles.privacyTitle}>🔐 Privacy: HIGH</Text>
          </View>
          <Text style={styles.privacyText}>
            5 decoy transactions will be created
          </Text>
        </View>
      )}
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
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  amountContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  amountSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  stepsContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheck: {
    fontSize: 20,
  },
  stepCurrent: {
    fontSize: 20,
  },
  stepPending: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  stepIconPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepContent: {
    marginLeft: 12,
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  stepTitleActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  stepStatus: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
  },
  stepStatusComplete: {
    fontSize: 14,
    color: Colors.success,
  },
  progressBarContainer: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  stepConnector: {
    width: 2,
    height: 32,
    backgroundColor: Colors.border,
    marginLeft: 23,
    marginVertical: 4,
  },
  stepConnectorActive: {
    backgroundColor: Colors.success,
  },
  privacyCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 32,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyHeader: {
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  privacyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
