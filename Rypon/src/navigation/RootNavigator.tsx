import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { RootStackParamList } from "./types";

// Onboarding screens
import { GetStartedScreen } from "../features/onboarding/GetStartedScreen";
import { OnboardingStep1Screen } from "../features/onboarding/OnboardingStep1Screen";
import { OnboardingStep2Screen } from "../features/onboarding/OnboardingStep2Screen";
import { OnboardingStep3Screen } from "../features/onboarding/OnboardingStep3Screen";

// Main app
import { BottomTabNavigator } from "./BottomTabNavigator";

// Wallet screens
import { CreateWalletScreen } from "../features/wallet/CreateWalletScreen";
import { ImportWalletScreen } from "../features/wallet/ImportWalletScreen";

// Other screens
import { ReceiveScreen } from "../features/receive/ReceiveScreen";
import { SendScreen } from "../features/send/SendScreen";
import { SettingsScreen } from "../features/settings/SettingsScreen";

// Vault screens
import { CreateVaultScreen } from "../features/vault/CreateVaultScreen";

// Payment screens
import { TapToPayScreen } from "../features/payment/TapToPayScreen";
import { PaymentProcessingScreen } from "../features/payment/PaymentProcessingScreen";
import { PaymentSuccessScreen } from "../features/payment/PaymentSuccessScreen";

// Transaction screens
import { TransactionListScreen } from "../features/transactions/TransactionListScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
        initialRouteName="OnboardingStep1"
      >
        {/* Onboarding Flow */}
        <Stack.Screen
          name="OnboardingStep1"
          component={OnboardingStep1Screen}
        />
        <Stack.Screen
          name="OnboardingStep2"
          component={OnboardingStep2Screen}
        />
        <Stack.Screen
          name="OnboardingStep3"
          component={OnboardingStep3Screen}
        />
        <Stack.Screen name="GetStarted" component={GetStartedScreen} />

        {/* Wallet Screens */}
        <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
        <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />

        {/* Main App */}
        <Stack.Screen name="MainTabs" component={BottomTabNavigator} />

        {/* Modal Screens */}
        <Stack.Screen
          name="Send"
          component={SendScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="Receive"
          component={ReceiveScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: "card" }}
        />
        
        {/* Vault Screens */}
        <Stack.Screen
          name="CreateVault"
          component={CreateVaultScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="VaultManagement"
          component={CreateVaultScreen}
          options={{ presentation: "card" }}
        />
        
        {/* Payment Screens */}
        <Stack.Screen
          name="TapToPay"
          component={TapToPayScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="PaymentProcessing"
          component={PaymentProcessingScreen}
          options={{ presentation: "fullScreenModal" }}
        />
        <Stack.Screen
          name="PaymentSuccess"
          component={PaymentSuccessScreen}
          options={{ presentation: "fullScreenModal" }}
        />
        
        {/* Transaction Screens */}
        <Stack.Screen
          name="TransactionList"
          component={TransactionListScreen}
          options={{ presentation: "card" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
