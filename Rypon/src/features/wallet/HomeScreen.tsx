import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useCallback } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { RootStackParamList } from "../../navigation/types";
import { vaultService } from "../../services/vaultService";
import { paymentService } from "../../services/paymentService";
import { walletService, Wallet } from "../../services/walletService";
import { apiClient } from "../../services/api";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Safe number formatter helper
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = parseFloat(value);
  if (isNaN(num) || value === undefined || value === null) {
    return '0.' + '0'.repeat(decimals);
  }
  return num.toFixed(decimals);
};

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletName, setWalletName] = useState('My Wallet');
  const [availableCredit, setAvailableCredit] = useState(0);
  const [vaultHealth, setVaultHealth] = useState(185);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasWallet, setHasWallet] = useState(true);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Check backend connection on mount
  useFocusEffect(
    useCallback(() => {
      checkBackendConnection();
      loadData();
    }, [])
  );

  const checkBackendConnection = async () => {
    try {
      console.log('🔍 Starting backend connection check...');
      const result = await apiClient.healthCheck();
      setBackendConnected(true);
      console.log('✅ Backend connection successful:', result);
    } catch (error) {
      setBackendConnected(false);
      console.error('❌ Backend connection failed:', error);
      
      if (error instanceof Error) {
        console.error('  Error name:', error.name);
        console.error('  Error message:', error.message);
        
        // Provide specific troubleshooting hints
        if (error.message.includes('timeout')) {
          console.error('⚠️  Backend server may not be running');
          console.error('  → Check if backend is running on port 8080');
        } else if (error.message.includes('Network request failed')) {
          console.error('⚠️  Network connection issue detected');
          console.error('  → Verify your device is on the same network as the backend');
          console.error('  → Check if backend IP is correct in api.ts');
        } else if (error.message.includes('Failed to fetch')) {
          console.error('⚠️  Cannot reach backend server');
          console.error('  → Verify firewall settings allow port 8080');
        }
      }
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load wallet from secure storage
      const loadedWallet = await walletService.loadWallet();
      
      if (!loadedWallet) {
        // No wallet exists - show create wallet prompt
        setHasWallet(false);
        setIsLoading(false);
        return;
      }
      
      setWallet(loadedWallet);
      setWalletAddress(loadedWallet.publicKey);
      setHasWallet(true);
      
      // Format display address
      const shortAddr = `${loadedWallet.publicKey.slice(0, 6)}...${loadedWallet.publicKey.slice(-4)}`;
      setWalletName(shortAddr);

      // Load vault details from backend
      try {
        const vaultDetails = await vaultService.getVaultDetails(loadedWallet.publicKey);
        const credit = (vaultDetails.credit_limit || 0) - (vaultDetails.outstanding_balance || 0);
        setAvailableCredit(isNaN(credit) ? 0 : credit);
        setVaultHealth(vaultDetails.health_factor || 0);
      } catch (vaultError) {
        console.error('No vault found:', vaultError);
        // No vault exists - user needs to create one
        setAvailableCredit(0);
        setVaultHealth(0);
      }

      // Load recent transactions from backend
      try {
        const result = await paymentService.getTransactions({ limit: 5 });
        setRecentTransactions(result.transactions || []);
      } catch (e) {
        console.error('Failed to load transactions:', e);
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setHasWallet(false);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
  };

  // No wallet - prompt to create
  if (!hasWallet && !isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.header}>
          <View style={styles.headerButton} />
          <Text style={styles.headerTitle}>Privacy Cash</Text>
          <View style={styles.headerButton} />
        </SafeAreaView>

        <View style={styles.noWalletContainer}>
          <LinearGradient
            colors={[Colors.primary, Colors.gradientEnd]}
            style={styles.noWalletIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="wallet" size={48} color="#FFF" />
          </LinearGradient>
          <Text style={styles.noWalletTitle}>Welcome to Privacy Cash</Text>
          <Text style={styles.noWalletSubtitle}>
            Create a new wallet to start making private payments with your credit card.
          </Text>
          <TouchableOpacity
            style={styles.createWalletButton}
            onPress={() => navigation.navigate("CreateWallet")}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={styles.createWalletGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add" size={24} color="#FFF" />
              <Text style={styles.createWalletText}>Create New Wallet</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.importWalletButton}
            onPress={() => navigation.navigate("ImportWallet")}
          >
            <Ionicons name="download-outline" size={20} color={Colors.primary} />
            <Text style={styles.importWalletText}>Import Existing Wallet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Backend Connection Status Banner */}
      {backendConnected === false && (
        <TouchableOpacity 
          style={styles.offlineBanner}
          onPress={() => {
            checkBackendConnection();
            loadData();
          }}
        >
          <Ionicons name="cloud-offline" size={16} color="#FFF" />
          <View style={{ flex: 1 }}>
            <Text style={styles.offlineBannerText}>
              Backend Not Connected
            </Text>
            <Text style={[styles.offlineBannerText, { fontSize: 11, opacity: 0.8 }]}>
              Check console logs • Tap to retry
            </Text>
          </View>
          <Ionicons name="refresh" size={16} color="#FFF" />
        </TouchableOpacity>
      )}
      
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={copyAddress}>
          <Ionicons
            name="qr-code-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>

        {/* Wallet Selector */}
        <TouchableOpacity style={styles.walletSelector}>
          <LinearGradient
            colors={[Colors.primary, Colors.gradientEnd]}
            style={styles.walletIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.walletName}>{walletName}</Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            tintColor={Colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Total Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>💰 Total Balance</Text>
              <Text style={styles.balanceAmount}>${safeToFixed(availableCredit, 2)}</Text>
              <Text style={styles.balanceChange}>↑ +2.4% today</Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  try {
                    navigation.navigate("Send");
                  } catch (e) {
                    console.log('Send screen not available yet');
                  }
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="arrow-up" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Send</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  try {
                    navigation.navigate("Receive");
                  } catch (e) {
                    console.log('Receive screen not available yet');
                  }
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="arrow-down" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Receive</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => {
                  try {
                    navigation.navigate("TapToPay");
                  } catch (e) {
                    console.log('TapToPay screen not available yet');
                  }
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="card" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Tap Pay</Text>
              </TouchableOpacity>
            </View>

            {/* Credit Card Status / Vault Summary */}
            <View style={styles.vaultSection}>
              <Text style={styles.sectionTitle}>💳 Credit Card Status</Text>
              <TouchableOpacity
                style={styles.vaultCard}
                onPress={() => navigation.navigate("VaultManagement")}
              >
                <View style={styles.vaultRow}>
                  <Text style={styles.vaultLabel}>Available:</Text>
                  <Text style={styles.vaultValue}>${safeToFixed(availableCredit, 2)}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '35%' }]} />
                </View>
                <Text style={styles.progressText}>████████░░░░ 35% used</Text>
                <View style={styles.vaultRow}>
                  <Text style={styles.vaultLabel}>Health:</Text>
                  <View style={styles.healthBadge}>
                    <Text style={styles.healthText}>🟢 {vaultHealth}%</Text>
                  </View>
                </View>
                <View style={styles.vaultActions}>
                  <TouchableOpacity
                    style={styles.vaultActionButton}
                    onPress={() => {
                      try {
                        navigation.navigate("CreateVault");
                      } catch (e) {
                        console.log('Vault screen not available yet');
                      }
                    }}
                  >
                    <Text style={styles.vaultActionText}>Deposit More</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.vaultActionButton}
                    onPress={() => {
                      try {
                        navigation.navigate("VaultManagement");
                      } catch (e) {
                        console.log('Vault Management not available yet');
                      }
                    }}
                  >
                    <Text style={styles.vaultActionText}>Manage Vault</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>

            {/* Recent Activity */}
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📊 Recent Activity</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Activity")}>
                  <Text style={styles.seeAllText}>View All →</Text>
                </TouchableOpacity>
              </View>

              {recentTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.emptyStateText}>No payments yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Make your first payment with Tap to Pay
                  </Text>
                </View>
              ) : (
                recentTransactions.map((tx) => (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.transactionItem}
                    onPress={() => navigation.navigate("TransactionDetail", { txId: tx.id })}
                  >
                    <View style={styles.transactionIcon}>
                      <Text style={styles.transactionEmoji}>
                        {tx.merchant_name?.includes('Coffee') ? '☕' : 
                         tx.merchant_name?.includes('Gas') ? '⛽' : 
                         tx.merchant_name?.includes('Pizza') ? '🍕' : '🛒'}
                      </Text>
                    </View>
                    <View style={styles.transactionContent}>
                      <Text style={styles.transactionMerchant}>{tx.merchant_name || 'Merchant'}</Text>
                      <Text style={styles.transactionDate}>
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.transactionRight}>
                      <Text style={styles.transactionAmount}>-${safeToFixed(tx.amount_usd, 2)}</Text>
                      {tx.privacy_score && (
                        <View style={styles.privacyBadge}>
                          <Text style={styles.privacyBadgeText}>🟢{tx.privacy_score}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  offlineBanner: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  offlineBannerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: Colors.backgroundDark,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  walletSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  walletIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  walletName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  creditCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  creditCardGradient: {
    padding: 24,
  },
  creditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  creditCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    opacity: 0.9,
  },
  creditAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  creditSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  vaultHealthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  vaultHealthText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  tapToPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary + '40',
  },
  tapToPayIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.primary + '20',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tapToPayContent: {
    flex: 1,
    marginLeft: 16,
  },
  tapToPayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tapToPaySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    gap: 12,
  },
  quickActionButton: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  balanceCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  balanceChange: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.success,
  },
  vaultSection: {
    marginBottom: 32,
  },
  vaultCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  vaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  vaultLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  vaultValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 12,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
  vaultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  vaultActionButton: {
    flex: 1,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  vaultActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  transactionEmoji: {
    fontSize: 28,
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary + '20',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
    marginLeft: 12,
  },
  transactionMerchant: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  noWalletContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noWalletIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  noWalletTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  noWalletSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  createWalletButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  createWalletGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  createWalletText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
  importWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  importWalletText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
});
