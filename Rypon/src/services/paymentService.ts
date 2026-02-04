/**
 * Payment Service
 * Handles NFC card payments and transaction processing
 */

import { apiClient } from './api';

export interface PaymentRequest {
  card_hash: string;
  amount_usdc: number;
  merchant_wallet: string;
}

export interface PaymentResponse {
  approved: boolean;
  transaction_signature: string | null;
  error_message: string | null;
  burner_address: string | null;
  timestamp: string;
  privacy_details?: {
    decoys_count: number;
    privacy_score: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

export interface Transaction {
  id: string;
  merchant_name: string;
  amount_usd: number;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
  transaction_signature: string;
  privacy_score: 'HIGH' | 'MEDIUM' | 'LOW';
  decoys_count: number;
  burner_address?: string;
}

class PaymentService {
  /**
   * Process card payment
   */
  async processPayment(data: PaymentRequest): Promise<PaymentResponse> {
    return apiClient.post<PaymentResponse>('/payment', {
      card_hash: data.card_hash,
      amount_usdc: data.amount_usdc,
      merchant_wallet: data.merchant_wallet,
    });
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(txId: string): Promise<{
    status: string;
    currentStep: number;
    totalSteps: number;
  }> {
    return apiClient.get(`/payment/status/${txId}`);
  }

  /**
   * Get transaction list
   */
  async getTransactions(filters?: {
    page?: number;
    limit?: number;
    sort?: 'asc' | 'desc';
  }): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.page) queryParams.append('page', filters.page.toString());
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.sort) queryParams.append('sort', filters.sort);

      const response = await apiClient.get<any>(`/transactions?${queryParams.toString()}`);
      
      // Backend returns array directly, wrap it in expected format
      if (Array.isArray(response)) {
        return { transactions: response, total: response.length };
      }
      
      // If already in expected format
      return response;
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      // Return empty data on error to prevent crash
      return { transactions: [], total: 0 };
    }
  }

  /**
   * Get transaction details
   */
  async getTransactionDetail(txId: string): Promise<Transaction> {
    return apiClient.get(`/transactions/${txId}`);
  }

  /**
   * Cancel pending payment
   */
  async cancelPayment(txId: string): Promise<void> {
    return apiClient.post(`/payment/cancel/${txId}`);
  }
}

export const paymentService = new PaymentService();
export default paymentService;
