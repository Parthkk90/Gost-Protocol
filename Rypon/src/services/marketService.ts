/**
 * Market Data Service
 * Handles price feeds and market data
 */

import { apiClient } from './api';

export interface SolPriceResponse {
  price: number;
  change24h: number;
  timestamp: string;
}

export interface TokenBalance {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  mint: string;
}

class MarketService {
  /**
   * Get current SOL price in USD
   */
  async getSolPrice(): Promise<SolPriceResponse> {
    try {
      return await apiClient.get<SolPriceResponse>('/market/sol-price');
    } catch (error) {
      console.error('Failed to fetch SOL price:', error);
      // Fallback price
      return {
        price: 150,
        change24h: 2.4,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get token balances for wallet
   */
  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    try {
      return await apiClient.get<TokenBalance[]>(`/wallet/${walletAddress}/tokens`);
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
      return [];
    }
  }

  /**
   * Get tokens for wallet (alias for getTokenBalances used by CollectiblesScreen)
   */
  async getTokens(walletAddress: string): Promise<TokenBalance[]> {
    return this.getTokenBalances(walletAddress);
  }

  /**
   * Get NFTs for wallet
   */
  async getNFTs(walletAddress: string): Promise<any[]> {
    try {
      return await apiClient.get<any[]>(`/wallet/${walletAddress}/nfts`);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
      return [];
    }
  }
}

export const marketService = new MarketService();
