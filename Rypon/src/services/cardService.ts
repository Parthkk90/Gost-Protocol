/**
 * Card Service
 * Handles NFC card registration and management
 */

import { apiClient } from './api';
import CryptoJS from 'crypto-js';

export interface RegisterCardRequest {
  card_number: string;
  card_name: string;
  vault_address: string;
}

export interface RegisterCardResponse {
  success: boolean;
  card_hash: string;
  card_name: string;
}

export interface Card {
  id: string;
  card_hash: string;
  card_name: string;
  vault_address: string;
  last_4_digits: string;
  created_at: string;
}

class CardService {
  /**
   * Hash card number (client-side for security)
   */
  hashCardNumber(cardNumber: string): string {
    // Remove spaces and non-digits
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // SHA-256 hash
    return CryptoJS.SHA256(cleanNumber).toString();
  }

  /**
   * Register new NFC card
   */
  async registerCard(data: RegisterCardRequest): Promise<RegisterCardResponse> {
    const cardHash = this.hashCardNumber(data.card_number);
    
    return apiClient.post<RegisterCardResponse>('/card/register', {
      card_number: data.card_number,
      card_name: data.card_name,
      vault_address: data.vault_address,
    });
  }

  /**
   * Get registered cards
   */
  async getCards(): Promise<Card[]> {
    return apiClient.get<Card[]>('/card/list');
  }

  /**
   * Delete card
   */
  async deleteCard(cardId: string): Promise<void> {
    return apiClient.delete(`/card/${cardId}`);
  }

  /**
   * Get card details
   */
  async getCardDetails(cardId: string): Promise<Card> {
    return apiClient.get<Card>(`/card/${cardId}`);
  }

  /**
   * Validate card number (Luhn algorithm)
   */
  validateCardNumber(cardNumber: string): boolean {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Format card number with spaces
   */
  formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.replace(/(\d{4})/g, '$1 ').trim();
  }

  /**
   * Get last 4 digits
   */
  getLast4Digits(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.slice(-4);
  }
}

export const cardService = new CardService();
export default cardService;
