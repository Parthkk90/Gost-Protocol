import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { paymentService } from "../../services/paymentService";

const { width } = Dimensions.get("window");

interface Transaction {
  id: string;
  type: "payment" | "deposit" | "withdraw";
  merchant: string;
  amount: number;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  privacyScore: number;
  burnerWallet?: string;
  decoyCount?: number;
}

const getMerchantIcon = (merchant: string) => {
  if (merchant.includes("Coffee")) return "cafe";
  if (merchant.includes("Gas")) return "car";
  if (merchant.includes("Restaurant")) return "restaurant";
  if (merchant.includes("Grocery")) return "cart";
  if (merchant.includes("Vault")) return "wallet";
  return "card";
};

const getPrivacyColor = (score: number) => {
  if (score >= 90) return Colors.success;
  if (score >= 70) return "#F59E0B";
  return "#EF4444";
};

// Safe number formatter helper
const safeToFixed = (value: any, decimals: number = 2): string => {
  const num = parseFloat(value);
  if (isNaN(num) || value === undefined || value === null) {
    return '0.' + '0'.repeat(decimals);
  }
  return num.toFixed(decimals);
};

export const ActivityScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "payments" | "deposits">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyTotal: 0,
    transactionCount: 0,
    avgPrivacy: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const result = await Promise.race([
        paymentService.getTransactions({
          limit: 50,
          sort: 'desc',
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        )
      ]);
      
      // Map API transactions to UI Transaction type
      const mappedTx = (result as any).transactions.map((tx: any): Transaction => ({
        id: tx.id || tx.signature || Math.random().toString(),
        type: tx.type === 'deposit' || tx.type === 'withdraw' ? tx.type : 'payment',
        merchant: tx.merchant_name || 'Unknown Merchant',
        amount: tx.amount_usd || tx.amount || 0,
        timestamp: new Date(tx.timestamp).toLocaleDateString(),
        status: tx.status || 'completed',
        privacyScore: tx.privacy_score || 0,
        burnerWallet: tx.burner_wallet,
        decoyCount: tx.decoys_count,
      }));
      
      setTransactions(mappedTx);
      
      // Calculate stats
      const payments = mappedTx.filter(tx => tx.type === 'payment');
      const monthTotal = payments.reduce((sum: number, tx: Transaction) => sum + tx.amount, 0);
      const avgPriv = payments.reduce((sum: number, tx: Transaction) => sum + (tx.privacyScore || 0), 0) / (payments.length || 1);
      
      setStats({
        monthlyTotal: monthTotal,
        transactionCount: mappedTx.length,
        avgPrivacy: Math.round(avgPriv),
      });
    } catch (error: any) {
      if (error?.message?.includes('timeout') || error?.message?.includes('failed')) {
        console.log('⚠️ Backend not reachable');
      } else {
        console.log('ℹ️ No transactions found');
      }
      setTransactions([]);
      setStats({
        monthlyTotal: 0,
        transactionCount: 0,
        avgPrivacy: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "payments") return tx.type === "payment";
    if (selectedFilter === "deposits") return tx.type === "deposit" || tx.type === "withdraw";
    return true;
  });

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups: { [key: string]: Transaction[] }, tx) => {
    const date = tx.timestamp;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(tx);
    return groups;
  }, {});

  const sections = Object.keys(groupedTransactions).map(date => ({
    title: date,
    data: groupedTransactions[date],
  }));

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const emoji = item.merchant.includes("Coffee") ? "☕" :
                  item.merchant.includes("Gas") ? "⛽" :
                  item.merchant.includes("Pizza") ? "🍕" :
                  item.merchant.includes("Grocery") ? "🛒" :
                  item.type === "deposit" ? "💳" : "🏪";

    return (
      <TouchableOpacity style={styles.txCard}>
        <Text style={styles.txEmoji}>{emoji}</Text>
        
        <View style={styles.txInfo}>
          <Text style={styles.txMerchant}>{item.merchant}</Text>
          <Text style={styles.txTimestamp}>{item.timestamp}</Text>
        </View>

        <View style={styles.txRight}>
          <Text style={styles.txAmount}>
            {item.type === "deposit" ? "+" : "-"}${item.amount.toFixed(2)}
          </Text>
          {item.privacyScore > 0 && (
            <Text style={styles.privacyScore}>🟢 {item.privacyScore}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Activity</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="search-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === "all" && styles.filterButtonActive]}
          onPress={() => setSelectedFilter("all")}
          activeOpacity={0.7}
        >
          {selectedFilter === "all" && (
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Text style={[styles.filterText, selectedFilter === "all" && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === "payments" && styles.filterButtonActive]}
          onPress={() => setSelectedFilter("payments")}
          activeOpacity={0.7}
        >
          {selectedFilter === "payments" && (
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Text style={[styles.filterText, selectedFilter === "payments" && styles.filterTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === "deposits" && styles.filterButtonActive]}
          onPress={() => setSelectedFilter("deposits")}
          activeOpacity={0.7}
        >
          {selectedFilter === "deposits" && (
            <LinearGradient
              colors={[Colors.primary, Colors.gradientEnd]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}
          <Text style={[styles.filterText, selectedFilter === "deposits" && styles.filterTextActive]}>
            Deposits
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Enhanced Stats Card with Gradient */}
      <View style={styles.statsCardWrapper}>
        <LinearGradient
          colors={[Colors.primary + '20', Colors.gradientEnd + '20']}
          style={styles.statsCardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={18} color={Colors.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>This Month</Text>
              <Text style={styles.statValue}>${safeToFixed(stats.monthlyTotal, 2)}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="receipt-outline" size={18} color={Colors.primary} style={styles.statIcon} />
              <Text style={styles.statLabel}>Transactions</Text>
              <Text style={styles.statValue}>{stats.transactionCount}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.success} style={styles.statIcon} />
              <Text style={styles.statLabel}>Avg Privacy</Text>
              <View style={styles.privacyBadge}>
                <View style={[styles.privacyDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.statValue}>{stats.avgPrivacy}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.transactionsList}
          showsVerticalScrollIndicator={false}
        >
          {sections.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="receipt-outline" size={64} color={Colors.textSecondary} />
              <Text style={{ color: Colors.textSecondary, fontSize: 16, marginTop: 16 }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            sections.map((section, index) => (
              <View key={index} style={styles.dateSection}>
                <Text style={styles.dateHeader}>{section.title}</Text>
                {section.data.map((item) => {
                  const emoji = item.merchant.includes("Coffee") ? "☕" :
                                item.merchant.includes("Gas") ? "⛽" :
                                item.merchant.includes("Pizza") ? "🍕" :
                                item.merchant.includes("Grocery") ? "🛒" :
                                item.type === "deposit" ? "💳" : "🏪";

                  return (
                    <TouchableOpacity key={item.id} style={styles.txCard} activeOpacity={0.7}>
                      <View style={styles.txIconContainer}>
                        <LinearGradient
                          colors={item.type === "deposit" ? [Colors.success + '30', Colors.success + '10'] : [Colors.primary + '30', Colors.primary + '10']}
                          style={styles.txIconGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.txEmoji}>{emoji}</Text>
                        </LinearGradient>
                      </View>
                      
                      <View style={styles.txInfo}>
                        <Text style={styles.txMerchant}>{item.merchant}</Text>
                        <View style={styles.txMetaRow}>
                          <View style={[styles.statusBadge, item.status === 'completed' && styles.statusCompleted]}>
                            <Text style={styles.statusText}>{item.status}</Text>
                          </View>
                          {item.decoyCount && (
                            <View style={styles.decoyBadge}>
                              <Ionicons name="eye-off-outline" size={12} color={Colors.textSecondary} />
                              <Text style={styles.decoyText}>{item.decoyCount} decoys</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, item.type === "deposit" && styles.txAmountPositive]}>
                          {item.type === "deposit" ? "+" : "-"}${safeToFixed(item.amount, 2)}
                        </Text>
                        {item.privacyScore > 0 && (
                          <View style={styles.privacyScoreBadge}>
                            <View style={[styles.privacyDot, { backgroundColor: getPrivacyColor(item.privacyScore) }]} />
                            <Text style={[styles.privacyScoreText, { color: getPrivacyColor(item.privacyScore) }]}>
                              {item.privacyScore}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: Colors.surfaceDark,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
  },
  filterText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textSecondary,
    position: 'relative',
    zIndex: 1,
  },
  filterTextActive: {
    color: Colors.textPrimary,
  },
  statsCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsCardGradient: {
    padding: 2,
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.surfaceDark,
    borderRadius: 18,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 8,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  summaryGradient: {
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.8,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.textPrimary,
    opacity: 0.2,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  transactionsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dateSection: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceDark,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  txIconContainer: {
    marginRight: 14,
  },
  txIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txEmoji: {
    fontSize: 28,
  },
  txInfo: {
    flex: 1,
  },
  txMerchant: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txTimestamp: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  txAmountPositive: {
    color: Colors.success,
  },
  privacyScore: {
    fontSize: 13,
    color: Colors.success,
  },
  privacyScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyScoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: Colors.surfaceDark,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusCompleted: {
    backgroundColor: `${Colors.success}20`,
    borderColor: Colors.success,
  },
  statusPending: {
    backgroundColor: "#F59E0B20",
    borderColor: "#F59E0B",
  },
  statusFailed: {
    backgroundColor: "#EF444420",
    borderColor: "#EF4444",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: 'capitalize',
  },
  decoyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  decoyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
});
