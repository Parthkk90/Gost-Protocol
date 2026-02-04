/**
 * Privacy Service
 * Handles Privacy Cash SDK integration
 */

import { apiClient } from './api';

export interface PrivacySettings {
  num_decoys: number;
  entropy_source: 'esp32' | 'software';
  privacy_level: 'maximum' | 'balanced' | 'basic';
  esp32_url?: string;
}

export interface EntropyResponse {
  success: boolean;
  entropy: string;
  source: 'esp32' | 'software';
}

export interface PrivacyScoreResponse {
  transaction_id: string;
  privacy_score: 'HIGH' | 'MEDIUM' | 'LOW';
  decoys_count: number;
  burner_used: boolean;
  entropy_source: string;
}

class PrivacyService {
  /**
   * Get hardware entropy from ESP32
   */
  async getEntropy(): Promise<EntropyResponse> {
    return apiClient.privacyRequest<EntropyResponse>('/entropy');
  }

  /**
   * Get privacy score for transaction
   */
  async getPrivacyScore(txId: string): Promise<PrivacyScoreResponse> {
    return apiClient.get<PrivacyScoreResponse>(`/privacy/score/${txId}`);
  }

  /**
   * Get privacy settings
   */
  async getPrivacySettings(): Promise<PrivacySettings> {
    // Load from AsyncStorage or API
    return {
      num_decoys: 4,
      entropy_source: 'esp32',
      privacy_level: 'maximum',
    };
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<void> {
    // Save to AsyncStorage or API
    console.log('Privacy settings updated:', settings);
  }

  /**
   * Check ESP32 status
   */
  async checkESP32Status(): Promise<{
    online: boolean;
    ip_address: string;
    last_ping: string;
  }> {
    try {
      await this.getEntropy();
      return {
        online: true,
        ip_address: '10.214.161.157',
        last_ping: new Date().toISOString(),
      };
    } catch (error) {
      return {
        online: false,
        ip_address: '10.214.161.157',
        last_ping: new Date().toISOString(),
      };
    }
  }
}

export const privacyService = new PrivacyService();
export default privacyService;
