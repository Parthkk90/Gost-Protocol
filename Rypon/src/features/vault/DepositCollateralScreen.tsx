/**
 * Deposit Collateral Screen
 * Shows progress while depositing SOL into vault
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui';
import { vaultService } from '../../services/vaultService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DepositCollateral'>;
type RouteTypeProp = RouteProp<RootStackParamList, 'DepositCollateral'>;

enum DepositStep {
  WRAPPING_SOL = 0,
  DEPOSITING = 1,
  SUCCESS = 2,
}

export const DepositCollateralScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { vaultAddress, solAmount } = route.params;

  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.WRAPPING_SOL);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string>('');

  useEffect(() => {
    depositCollateral();
  }, []);

  const depositCollateral = async () => {
    try {
      // Step 1: Wrapping SOL
      setCurrentStep(DepositStep.WRAPPING_SOL);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate wrapping

      // Step 2: Depositing
      setCurrentStep(DepositStep.DEPOSITING);
      const response = await vaultService.depositCollateral({
        vault_address: vaultAddress,
        amount_sol: solAmount,
      });

      setTxSignature(response.transaction_signature);

      // Step 3: Success
      setCurrentStep(DepositStep.SUCCESS);
    } catch (err: any) {
      setError(err.message || 'Failed to deposit collateral');
      Alert.alert('Error', err.message || 'Failed to deposit collateral');
    }
  };

  const handleContinue = () => {
    navigation.navigate('RegisterCard', { vaultAddress });
  };

  const getStepIcon = (step: DepositStep) => {
    if (currentStep === step) {
      return <ActivityIndicator size="small" color={Colors.primary} />;
    } else if (currentStep > step) {
      return <Ionicons name="checkmark-circle" size={24} color={Colors.success} />;
    } else {
      return <View style={styles.stepIconPending} />;
    }
  };

  const getStepText = (step: DepositStep) => {
    if (currentStep === step) {
      return 'In Progress...';
    } else if (currentStep > step) {
      return 'Completed';
    } else {
      return 'Pending';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Depositing Collateral</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {/* Step 1 */}
          <View style={styles.step}>
            <View style={styles.stepIndicator}>{getStepIcon(DepositStep.WRAPPING_SOL)}</View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Wrapping SOL</Text>
              <Text style={styles.stepStatus}>{getStepText(DepositStep.WRAPPING_SOL)}</Text>
            </View>
          </View>

          {/* Connector */}
          <View
            style={[
              styles.stepConnector,
              currentStep > DepositStep.WRAPPING_SOL && styles.stepConnectorActive,
            ]}
          />

          {/* Step 2 */}
          <View style={styles.step}>
            <View style={styles.stepIndicator}>{getStepIcon(DepositStep.DEPOSITING)}</View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Depositing to Vault</Text>
              <Text style={styles.stepStatus}>{getStepText(DepositStep.DEPOSITING)}</Text>
            </View>
          </View>

          {/* Connector */}
          <View
            style={[
              styles.stepConnector,
              currentStep > DepositStep.DEPOSITING && styles.stepConnectorActive,
            ]}
          />

          {/* Step 3 */}
          <View style={styles.step}>
            <View style={styles.stepIndicator}>{getStepIcon(DepositStep.SUCCESS)}</View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Success</Text>
              <Text style={styles.stepStatus}>{getStepText(DepositStep.SUCCESS)}</Text>
            </View>
          </View>
        </View>

        {/* Success Message */}
        {currentStep === DepositStep.SUCCESS && (
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            <Text style={styles.successTitle}>Deposit Successful!</Text>
            <Text style={styles.successMessage}>
              {solAmount} SOL deposited to your vault
            </Text>
            {txSignature && (
              <TouchableOpacity style={styles.txLink}>
                <Text style={styles.txLinkText} numberOfLines={1} ellipsizeMode="middle">
                  {txSignature}
                </Text>
                <Ionicons name="open-outline" size={16} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={48} color={Colors.error} />
            <Text style={styles.errorTitle}>Deposit Failed</Text>
            <Text style={styles.errorMessage}>{error}</Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {currentStep === DepositStep.SUCCESS && (
          <Button
            title="Register Card"
            onPress={handleContinue}
            icon={<Ionicons name="arrow-forward" size={20} color="#FFF" />}
          />
        )}
        {error && (
          <Button
            title="Try Again"
            onPress={() => {
              setError(null);
              setCurrentStep(DepositStep.WRAPPING_SOL);
              depositCollateral();
            }}
            variant="secondary"
          />
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
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepsContainer: {
    marginBottom: 40,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIndicator: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconPending: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepContent: {
    marginLeft: 16,
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  stepStatus: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stepConnector: {
    width: 2,
    height: 40,
    backgroundColor: Colors.border,
    marginLeft: 23,
    marginVertical: 4,
  },
  stepConnectorActive: {
    backgroundColor: Colors.success,
  },
  successCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  txLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    maxWidth: '100%',
  },
  txLinkText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'monospace',
    marginRight: 8,
    flex: 1,
  },
  errorCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: 24,
  },
});
