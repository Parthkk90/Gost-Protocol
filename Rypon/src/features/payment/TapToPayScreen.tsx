/**
 * Tap to Pay Screen
 * NFC payment initiation screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TapToPay'>;

export const TapToPayScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isWaitingForTap, setIsWaitingForTap] = useState(true);

  // Animated values for NFC waves
  const wave1 = new Animated.Value(0);
  const wave2 = new Animated.Value(0);
  const wave3 = new Animated.Value(0);

  useEffect(() => {
    startWaveAnimation();

    // Simulate NFC card detection after 3 seconds (for demo)
    const timeout = setTimeout(() => {
      handleCardDetected();
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  const startWaveAnimation = () => {
    const createWaveAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createWaveAnimation(wave1, 0),
      createWaveAnimation(wave2, 400),
      createWaveAnimation(wave3, 800),
    ]).start();
  };

  const handleCardDetected = () => {
    setIsWaitingForTap(false);
    
    // Navigate to payment processing screen
    setTimeout(() => {
      navigation.navigate('PaymentProcessing', {
        cardHash: 'demo_card_hash_123',
        merchantWallet: '9fhQBbDvzV6MfL5mL4kFJA72X57qc8Z2A5PR3NmvJYVA',
        amount: 25.50,
      });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
          style={styles.backButton}
        >
          <Ionicons name="close" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>
          {isWaitingForTap ? 'Ready to Pay' : 'Card Detected'}
        </Text>
        <Text style={styles.subtitle}>
          {isWaitingForTap
            ? 'Tap your card on the NFC reader'
            : 'Processing your payment...'}
        </Text>

        {/* NFC Animation */}
        <View style={styles.nfcContainer}>
          {isWaitingForTap ? (
            <>
              {/* Phone Icon with waves */}
              <View style={styles.phoneIcon}>
                <Ionicons name="phone-portrait" size={80} color={Colors.primary} />
                <Text style={styles.phoneWaves}>)))</Text>
              </View>

              {/* Animated Waves */}
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave1,
                  {
                    opacity: wave1,
                    transform: [
                      {
                        scale: wave1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave2,
                  {
                    opacity: wave2,
                    transform: [
                      {
                        scale: wave2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.wave,
                  styles.wave3,
                  {
                    opacity: wave3,
                    transform: [
                      {
                        scale: wave3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.5],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </>
          ) : (
            <View style={styles.successIndicator}>
              <Ionicons name="checkmark-circle" size={100} color={Colors.success} />
            </View>
          )}
        </View>

        {/* Amount Display */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount:</Text>
          <Text style={styles.amountValue}>$25.50</Text>
        </View>

        {/* Privacy Features Card */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔐 Privacy Features Active</Text>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>• Burner wallet:</Text>
            <Text style={styles.privacyStatus}>Creating...</Text>
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>• Decoys:</Text>
            <Text style={styles.privacyStatus}>5 transactions</Text>
          </View>
          <View style={styles.privacyRow}>
            <Text style={styles.privacyLabel}>• Privacy Score:</Text>
            <Text style={styles.privacyStatus}>95+</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
        >
          <Text style={styles.cancelButtonText}>──────────Cancel Payment──────────</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 60,
  },
  nfcContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  phoneIcon: {
    width: 120,
    height: 120,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
    zIndex: 10,
    position: 'relative',
  },
  phoneWaves: {
    position: 'absolute',
    right: -30,
    fontSize: 24,
    color: Colors.primary,
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  wave1: {},
  wave2: {},
  wave3: {},
  successIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  amountLabel: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyCard: {
    width: '100%',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  privacyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  privacyStatus: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  infoCard: {
    width: '100%',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
  },
  cancelButton: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
