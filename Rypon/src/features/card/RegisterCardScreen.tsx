/**
 * Register Card Screen
 * User registers their NFC card to link with vault
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/ui';
import { cardService } from '../../services/cardService';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterCard'>;
type RouteTypeProp = RouteProp<RootStackParamList, 'RegisterCard'>;

export const RegisterCardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteTypeProp>();
  const { vaultAddress } = route.params;

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formatCardNumber = (text: string) => {
    const formatted = cardService.formatCardNumber(text);
    setCardNumber(formatted);
  };

  const handleRegister = async () => {
    // Validate inputs
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please enter your card number');
      return;
    }

    if (!cardService.validateCardNumber(cardNumber)) {
      Alert.alert('Error', 'Invalid card number');
      return;
    }

    if (!cardName.trim()) {
      Alert.alert('Error', 'Please enter a name for your card');
      return;
    }

    setIsLoading(true);
    try {
      await cardService.registerCard({
        card_number: cardNumber,
        card_name: cardName,
        vault_address: vaultAddress,
      });

      Alert.alert('Success', 'Card registered successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to register card');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs')}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Register Card</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Card Visual */}
          <View style={styles.cardVisual}>
            <View style={styles.cardIllustration}>
              <Ionicons name="card" size={80} color={Colors.primary} />
              <View style={styles.nfcIcon}>
                <Ionicons name="wifi" size={24} color={Colors.primary} />
              </View>
            </View>
          </View>

          {/* Info */}
          <Text style={styles.infoText}>
            Link your NFC card to your vault for instant tap-to-pay
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Card Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Number</Text>
              <TextInput
                style={styles.input}
                value={cardNumber}
                onChangeText={formatCardNumber}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="number-pad"
                maxLength={19}
              />
              {cardNumber.length > 0 && (
                <View style={styles.inputIcon}>
                  {cardService.validateCardNumber(cardNumber) ? (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  ) : (
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  )}
                </View>
              )}
            </View>

            {/* Card Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Card Name (Optional)</Text>
              <TextInput
                style={styles.input}
                value={cardName}
                onChangeText={setCardName}
                placeholder="My Main Card"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          {/* Security Note */}
          <View style={styles.securityNote}>
            <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
            <Text style={styles.securityText}>
              Your card is hashed and stored securely. We never see your full number.
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title={isLoading ? 'Registering...' : 'Register Card'}
            onPress={handleRegister}
            disabled={
              isLoading ||
              !cardNumber.trim() ||
              !cardService.validateCardNumber(cardNumber)
            }
            icon={
              isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#FFF" />
              )
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  keyboardView: {
    flex: 1,
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
  skipText: {
    fontSize: 16,
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  cardVisual: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIllustration: {
    width: 240,
    height: 150,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  nfcIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: Colors.primary + '20',
    padding: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  securityText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    padding: 24,
  },
});
