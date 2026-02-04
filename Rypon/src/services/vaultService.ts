/**
 * Vault Service
 * Handles vault creation, collateral deposits, and vault management
 */

import { apiClient } from './api';

export interface VaultCreateRequest {
  owner_pubkey: string;
  vault_id: number;
  default_ltv?: number;
  base_interest_rate?: number;
}

export interface VaultCreateResponse {
  success: boolean;
  vault_address: string;
  transaction_signature: string;
}

export interface VaultDetails {
  owner: string;
  vault_id: number;
  collateral_amount: number; // lamports
  collateral_usd: number;
  credit_limit: number; // micro-USDC
  credit_limit_usd: number;
  outstanding_balance: number;
  available_credit: number;
  available_credit_usd: number;
  health_factor: number;
  ltv_percent: number;
  apr_percent: number;
}

export interface DepositCollateralRequest {
  vault_address: string;
  amount_sol: number;
}

export interface DepositCollateralResponse {
  success: boolean;
  transaction_signature: string;
  new_collateral_amount: number;
  new_credit_limit: number;
}

class VaultService {
  /**
   * Create a new vault
   */
  async createVault(data: VaultCreateRequest): Promise<VaultCreateResponse> {
    return apiClient.post<VaultCreateResponse>('/vault/create', {
      owner_pubkey: data.owner_pubkey,
      vault_id: data.vault_id,
      default_ltv: data.default_ltv || 15000, // 150%
      base_interest_rate: data.base_interest_rate || 500, // 5%
    });
  }

  /**
   * Get vault details
   */
  async getVaultDetails(vaultAddress: string): Promise<VaultDetails> {
    return apiClient.get<VaultDetails>(`/vault/${vaultAddress}`);
  }

  /**
   * Deposit collateral into vault
   */
  async depositCollateral(
    data: DepositCollateralRequest
  ): Promise<DepositCollateralResponse> {
    return apiClient.post<DepositCollateralResponse>('/vault/deposit', {
      vault_address: data.vaultAddress,
      amount_sol: data.amountSol,
    });
  }

  /**
   * Withdraw collateral from vault
   */
  async withdrawCollateral(
    vaultAddress: string,
    amountSol: number
  ): Promise<any> {
    return apiClient.post('/vault/withdraw', {
      vault_address: vaultAddress,
      amount_sol: amountSol,
    });
  }

  /**
   * Get vault health factor
   */
  async getVaultHealth(vaultAddress: string): Promise<{
    health_factor: number;
    status: 'excellent' | 'good' | 'warning' | 'danger';
  }> {
    return apiClient.get(`/vault/${vaultAddress}/health`);
  }

  /**
   * Calculate credit from SOL amount
   */
  async calculateCredit(solAmount: number): Promise<{
    creditUsd: number;
    ltv: number;
  }> {
    try {
      // Get real SOL price from backend
      const response = await apiClient.get<{ price: number }>('/market/sol-price');
      const solPrice = response.price || 150;
      const collateralUsd = solAmount * solPrice;
      const creditUsd = collateralUsd * 1.5; // 150% LTV
      
      return {
        creditUsd,
        ltv: 150,
      };
    } catch (error) {
      // Fallback to approximate price
      const solPrice = 150;
      const collateralUsd = solAmount * solPrice;
      return {
        creditUsd: collateralUsd * 1.5,
        ltv: 150,
      };
    }
  }
}

export const vaultService = new VaultService();
export default vaultService;
