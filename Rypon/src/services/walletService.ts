/**
 * Wallet Service
 * Handles wallet creation, import, and management
 * React Native compatible - no @solana/web3.js dependency
 */

import * as bip39 from 'bip39';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface Wallet {
  publicKey: string;
  secretKey: Uint8Array;
  mnemonic?: string;
}

class WalletService {
  private static WALLET_KEY = 'privacy_cash_wallet';
  private static MNEMONIC_KEY = 'privacy_cash_mnemonic';

  /**
   * Generate new wallet with mnemonic
   */
  async createWallet(): Promise<{ wallet: Wallet; mnemonic: string }> {
    // Generate 12-word mnemonic
    const mnemonic = bip39.generateMnemonic();
    
    // Derive seed from mnemonic
    const seed = await bip39.mnemonicToSeed(mnemonic);
    
    // Create keypair from seed (first 32 bytes)
    const keypair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));
    
    const wallet: Wallet = {
      publicKey: bs58.encode(keypair.publicKey),
      secretKey: keypair.secretKey,
      mnemonic,
    };

    // Store wallet (encrypted on device)
    await this.saveWallet(wallet);
    
    return { wallet, mnemonic };
  }

  /**
   * Import wallet from mnemonic
   */
  async importWallet(mnemonic: string): Promise<Wallet> {
    // Validate mnemonic
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    // Derive seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = nacl.sign.keyPair.fromSeed(seed.slice(0, 32));

    const wallet: Wallet = {
      publicKey: bs58.encode(keypair.publicKey),
      secretKey: keypair.secretKey,
      mnemonic,
    };

    await this.saveWallet(wallet);
    
    return wallet;
  }

  /**
   * Save wallet to secure storage
   */
  private async saveWallet(wallet: Wallet): Promise<void> {
    try {
      // Store public key in AsyncStorage (safe)
      await AsyncStorage.setItem('wallet_public_key', wallet.publicKey);

      // Store secret key in SecureStore (encrypted)
      await SecureStore.setItemAsync(
        WalletService.WALLET_KEY,
        JSON.stringify(Array.from(wallet.secretKey))
      );

      // Store mnemonic in SecureStore
      if (wallet.mnemonic) {
        await SecureStore.setItemAsync(
          WalletService.MNEMONIC_KEY,
          wallet.mnemonic
        );
      }
    } catch (error) {
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Load wallet from storage
   */
  async loadWallet(): Promise<Wallet | null> {
    try {
      const publicKey = await AsyncStorage.getItem('wallet_public_key');
      const secretKeyStr = await SecureStore.getItemAsync(WalletService.WALLET_KEY);
      const mnemonic = await SecureStore.getItemAsync(WalletService.MNEMONIC_KEY);

      if (!publicKey || !secretKeyStr) {
        return null;
      }

      const secretKeyArray = JSON.parse(secretKeyStr);
      const secretKey = new Uint8Array(secretKeyArray);

      return {
        publicKey,
        secretKey,
        mnemonic: mnemonic || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    const publicKey = await AsyncStorage.getItem('wallet_public_key');
    return !!publicKey;
  }

  /**
   * Get public key only (safe)
   */
  async getPublicKey(): Promise<string | null> {
    return await AsyncStorage.getItem('wallet_public_key');
  }

  /**
   * Delete wallet (logout)
   */
  async deleteWallet(): Promise<void> {
    await AsyncStorage.removeItem('wallet_public_key');
    await SecureStore.deleteItemAsync(WalletService.WALLET_KEY);
    await SecureStore.deleteItemAsync(WalletService.MNEMONIC_KEY);
  }

  /**
   * Get signing keypair
   * Returns the nacl keypair for signing transactions
   */
  async getSigningKeypair(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array } | null> {
    const wallet = await this.loadWallet();
    if (!wallet) return null;

    return {
      publicKey: bs58.decode(wallet.publicKey),
      secretKey: wallet.secretKey,
    };
  }

  /**
   * Sign a message with the wallet's secret key
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array | null> {
    const wallet = await this.loadWallet();
    if (!wallet) return null;

    return nacl.sign.detached(message, wallet.secretKey);
  }
}

export const walletService = new WalletService();
export default walletService;
