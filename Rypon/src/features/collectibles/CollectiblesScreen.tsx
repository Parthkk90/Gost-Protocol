import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useEffect } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import { marketService } from "../../services/marketService";
import { walletService } from "../../services/walletService";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  rarity: string;
  floorPrice: number;
}

const MOCK_NFTS: NFT[] = [
  {
    id: "1",
    name: "Solana Monkey #1234",
    collection: "SMB Gen2",
    image: "https://via.placeholder.com/150/7C3AED/FFFFFF?text=SMB",
    rarity: "Rare",
    floorPrice: 12.5,
  },
  {
    id: "2",
    name: "DeGod #567",
    collection: "DeGods",
    image: "https://via.placeholder.com/150/06B6D4/FFFFFF?text=DeGod",
    rarity: "Epic",
    floorPrice: 45.2,
  },
  {
    id: "3",
    name: "Okay Bear #890",
    collection: "Okay Bears",
    image: "https://via.placeholder.com/150/8B5CF6/FFFFFF?text=Bear",
    rarity: "Common",
    floorPrice: 8.3,
  },
  {
    id: "4",
    name: "Privacy NFT #1",
    collection: "Privacy Cash",
    image: "https://via.placeholder.com/150/10B981/FFFFFF?text=Private",
    rarity: "Legendary",
    floorPrice: 100.0,
  },
];

export const CollectiblesScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<"nfts" | "tokens">("nfts");
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [tokens, setTokens] = useState<{ symbol: string; name: string; balance: number; usdValue: number }[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [nftFloorValue, setNftFloorValue] = useState(0);

  useEffect(() => {
    loadCollectibles();
  }, []);

  const loadCollectibles = async () => {
    setLoading(true);
    try {
      const wallet = await walletService.loadWallet();
      if (wallet) {
        // Load NFTs from blockchain with timeout
        try {
          const nftData = await Promise.race([
            marketService.getNFTs(wallet.publicKey),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]);
          setNfts(nftData as NFT[]);
        } catch (e: any) {
          if (e?.message?.includes('timeout') || e?.message?.includes('failed')) {
            console.log('⚠️ Backend not reachable - NFTs not loaded');
          }
          setNfts([]);
        }
        
        // Load token balances from blockchain with timeout
        try {
          const tokenData = await Promise.race([
            marketService.getTokens(wallet.publicKey),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 5000)
            )
          ]);
          setTokens(tokenData as any[]);
        } catch (e: any) {
          if (e?.message?.includes('timeout') || e?.message?.includes('failed')) {
            console.log('⚠️ Backend not reachable - tokens not loaded');
          }
          setTokens([]);
        }
      } else {
        // No wallet connected
        setNfts([]);
        setTokens([]);
      }
    } catch (error) {
      console.log('⚠️ Error loading collectibles');
      setNfts([]);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio values whenever data changes
  useEffect(() => {
    const tokenTotal = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);
    const nftTotal = nfts.reduce((sum, nft) => sum + (nft.floorPrice * 150 || 0), 0);
    setPortfolioValue(tokenTotal);
    setNftFloorValue(nftTotal);
  }, [nfts, tokens]);

  const renderNFT = ({ item }: { item: NFT }) => (
    <TouchableOpacity style={styles.nftCard}>
      <View style={styles.nftImageContainer}>
        <Image source={{ uri: item.image }} style={styles.nftImage} />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.nftGradient}
        />
        {item.rarity && (
          <View style={styles.rarityBadge}>
            <Text style={styles.rarityText}>✨ {item.rarity}</Text>
          </View>
        )}
      </View>
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.nftCollection}>{item.collection}</Text>
        <View style={styles.nftFooter}>
          <View style={styles.nftPriceContainer}>
            <Text style={styles.nftPriceLabel}>Floor</Text>
            <Text style={styles.nftPrice}>◎{item.floorPrice}</Text>
          </View>
          <View style={styles.nftEstimate}>
            <Text style={styles.nftEstimateValue}>~${(item.floorPrice * 150).toFixed(0)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Collectibles</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="filter-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Portfolio Value Card */}
      <View style={styles.portfolioCard}>
        <LinearGradient
          colors={[Colors.primary, Colors.gradientEnd]}
          style={styles.portfolioGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.portfolioLabel}>💼 Total Portfolio Value</Text>
          <Text style={styles.portfolioValue}>${(portfolioValue + nftFloorValue).toFixed(2)}</Text>
          <View style={styles.portfolioStats}>
            <View style={styles.portfolioStat}>
              <Text style={styles.portfolioStatLabel}>🪙 Tokens</Text>
              <Text style={styles.portfolioStatValue}>${portfolioValue.toFixed(2)}</Text>
            </View>
            <View style={styles.portfolioDivider} />
            <View style={styles.portfolioStat}>
              <Text style={styles.portfolioStatLabel}>🖼️ NFT Floor</Text>
              <Text style={styles.portfolioStatValue}>${nftFloorValue.toFixed(2)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "nfts" && styles.tabActive]}
          onPress={() => setSelectedTab("nfts")}
        >
          <Text style={[styles.tabText, selectedTab === "nfts" && styles.tabTextActive]}>
            NFTs
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "tokens" && styles.tabActive]}
          onPress={() => setSelectedTab("tokens")}
        >
          <Text style={[styles.tabText, selectedTab === "tokens" && styles.tabTextActive]}>
            Tokens
          </Text>
        </TouchableOpacity>
      </View>

      {selectedTab === "nfts" ? (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={nfts}
            renderItem={renderNFT}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              nfts.length > 0 ? (
                <View style={styles.collectionStats}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{nfts.length}</Text>
                    <Text style={styles.statLabel}>NFTs</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>◎{nfts.reduce((sum, nft) => sum + nft.floorPrice, 0).toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Total Floor</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{new Set(nfts.map(n => n.collection)).size}</Text>
                    <Text style={styles.statLabel}>Collections</Text>
                  </View>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="images-outline" size={64} color={Colors.textSecondary} />
                <Text style={{ color: Colors.textSecondary, fontSize: 16, marginTop: 16 }}>
                  No NFTs found
                </Text>
              </View>
            }
          />
        )
      ) : (
        loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.tokensContainer} showsVerticalScrollIndicator={false}>
            {tokens.length > 0 && (
              <View style={styles.tokenStatsCard}>
                <Text style={styles.tokenStatsTitle}>🪙 Token Holdings</Text>
                <View style={styles.tokenStatsRow}>
                  <View style={styles.tokenStat}>
                    <Text style={styles.tokenStatValue}>{tokens.length}</Text>
                    <Text style={styles.tokenStatLabel}>Assets</Text>
                  </View>
                  <View style={styles.tokenStat}>
                    <Text style={styles.tokenStatValue}>${portfolioValue.toFixed(2)}</Text>
                    <Text style={styles.tokenStatLabel}>Total Value</Text>
                  </View>
                  <View style={styles.tokenStat}>
                    <Text style={styles.tokenStatValue}>+12.4%</Text>
                    <Text style={styles.tokenStatLabel}>24h Change</Text>
                  </View>
                </View>
              </View>
            )}
            {tokens.length > 0 ? (
              tokens.map((token, index) => (
                <TokenItem
                  key={index}
                  symbol={token.symbol}
                  name={token.name}
                  balance={token.balance.toString()}
                  usdValue={token.usdValue.toFixed(2)}
                />
              ))
            ) : (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={64} color={Colors.textSecondary} />
                <Text style={{ color: Colors.textSecondary, fontSize: 16, marginTop: 16 }}>
                  No tokens found
                </Text>
              </View>
            )}
          </ScrollView>
        )
      )}
    </View>
  );
};

const TokenItem = ({
  symbol,
  name,
  balance,
  usdValue,
}: {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
}) => (
  <TouchableOpacity style={styles.tokenItem}>
    <View style={styles.tokenIconContainer}>
      <LinearGradient
        colors={[Colors.primary, Colors.gradientEnd]}
        style={styles.tokenIcon}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.tokenIconText}>{symbol[0]}</Text>
      </LinearGradient>
    </View>
    <View style={styles.tokenInfo}>
      <Text style={styles.tokenName}>{name}</Text>
      <Text style={styles.tokenBalance}>{balance} {symbol}</Text>
    </View>
    <View style={styles.tokenValue}>
      <Text style={styles.tokenUsd}>${usdValue}</Text>
      <Text style={styles.tokenChange}>+2.4%</Text>
    </View>
  </TouchableOpacity>
);

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
    fontSize: 28,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceDark,
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  portfolioGradient: {
    padding: 20,
  },
  portfolioLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  portfolioStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  portfolioStat: {
    flex: 1,
  },
  portfolioStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  portfolioStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  portfolioDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 16,
  },
  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.cardDark,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  collectionStats: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceDark,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  nftCard: {
    width: ITEM_WIDTH,
    marginBottom: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: Colors.surfaceDark,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nftImageContainer: {
    position: "relative",
  },
  nftImage: {
    width: "100%",
    height: ITEM_WIDTH,
    backgroundColor: Colors.border,
  },
  nftGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_WIDTH * 0.4,
  },
  rarityBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(109, 19, 236, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  nftCollection: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  nftFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  nftPriceContainer: {
    flex: 1,
  },
  nftPriceLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  nftPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  nftEstimate: {
    alignItems: "flex-end",
  },
  nftEstimateValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
  tokensContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tokenStatsCard: {
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  tokenStatsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  tokenStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  tokenStat: {
    alignItems: "center",
  },
  tokenStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tokenStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tokenIconContainer: {
    marginRight: 12,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  tokenIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tokenBalance: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tokenValue: {
    alignItems: "flex-end",
  },
  tokenUsd: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tokenChange: {
    fontSize: 14,
    color: Colors.success,
    fontWeight: "600",
  },
});
