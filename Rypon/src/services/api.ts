/**
 * API Service Configuration
 * Base HTTP client for Privacy Cash Credit Card backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration
// The backend URL is determined based on the environment:
// - Android emulator: uses 10.0.2.2 (special IP that routes to host)
// - iOS simulator: uses 127.0.0.1
// - Real device: uses the local network IP

// Your computer's local network IP (for real device testing)
// ✅ WORKING IP: 10.42.120.208 (WiFi interface - bypasses CloudflareWARP)
const LOCAL_NETWORK_IP = '10.42.120.208'; // Update this to match your PC's IP from test_network_connection.py

const getBackendUrl = () => {
  if (__DEV__) {
    // Try to get the host from Expo's debugger host (works for real devices)
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    console.log('🔍 Device Detection:');
    console.log('  Platform:', Platform.OS);
    console.log('  Debugger Host:', debuggerHost);
    console.log('  Constants.manifest:', !!Constants.expoConfig);
    
    // Physical device detection (has valid network debuggerHost from Expo)
    if (debuggerHost && 
        debuggerHost !== 'localhost' && 
        debuggerHost !== '127.0.0.1' &&
        debuggerHost !== '0.0.0.0') {
      console.log(`📱 Physical device detected - using Expo host: ${debuggerHost}`);
      return `http://${debuggerHost}:8080/api/v1`;
    }
    
    // For Android: Prefer physical device assumption over emulator
    // Most users test on physical devices, and emulator would have Metro bundler running
    if (Platform.OS === 'android') {
      // Check if likely running on emulator (no debuggerHost usually means emulator)
      // But we'll assume physical device by default since it's more common
      if (!debuggerHost || debuggerHost === 'localhost' || debuggerHost === '127.0.0.1') {
        // Use LOCAL_NETWORK_IP for physical device
        console.log(`📱 Android device detected - using network IP: ${LOCAL_NETWORK_IP}:8080`);
        console.log('   (If using emulator, manually change to 10.0.2.2 in api.ts)');
        return `http://${LOCAL_NETWORK_IP}:8080/api/v1`;
      }
    }
    
    // iOS Simulator detection
    if (Platform.OS === 'ios') {
      if (!debuggerHost || debuggerHost === 'localhost' || debuggerHost === '127.0.0.1') {
        console.log('🍎 iOS Simulator detected - using localhost:8080');
        return 'http://127.0.0.1:8080/api/v1';
      } else {
        console.log(`📱 iOS device detected - using: ${debuggerHost}:8080`);
        return `http://${debuggerHost}:8080/api/v1`;
      }
    }
    
    // Final fallback
    console.warn(`⚠️ Using fallback IP: ${LOCAL_NETWORK_IP}:8080`);
    return `http://${LOCAL_NETWORK_IP}:8080/api/v1`;
  }
  return 'http://127.0.0.1:8080/api/v1';
}

const getPrivacyServiceUrl = () => {
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    // Physical device - use Expo detected host
    if (debuggerHost && 
        debuggerHost !== 'localhost' && 
        debuggerHost !== '127.0.0.1' &&
        debuggerHost !== '0.0.0.0') {
      return `http://${debuggerHost}:8081/api/privacy`;
    }
    
    // Android - prefer physical device
    if (Platform.OS === 'android') {
      return `http://${LOCAL_NETWORK_IP}:8081/api/privacy`;
    }
    
    // iOS Simulator
    if (Platform.OS === 'ios') {
      if (!debuggerHost || debuggerHost === 'localhost' || debuggerHost === '127.0.0.1') {
        return 'http://127.0.0.1:8081/api/privacy';
      }
      return `http://${debuggerHost}:8081/api/privacy`;
    }
    
    // Fallback
    return `http://${LOCAL_NETWORK_IP}:8081/api/privacy`;
  }
  return 'http://127.0.0.1:8081/api/privacy';
}

const API_BASE_URL = getBackendUrl();
const PRIVACY_SERVICE_URL = getPrivacyServiceUrl();

// Log the configured URLs in dev mode
if (__DEV__) {
  console.log('\n========================================');
  console.log('🌐 BACKEND CONNECTION INFO:');
  console.log('========================================');
  console.log('API URL:', API_BASE_URL);
  console.log('Privacy URL:', PRIVACY_SERVICE_URL);
  console.log('Platform:', Platform.OS);
  console.log('========================================\n');
  
  // Auto-test connection on startup
  setTimeout(async () => {
    try {
      const healthUrl = API_BASE_URL.replace('/api/v1', '/health');
      console.log('🏥 Testing backend connection:', healthUrl);
      const response = await fetch(healthUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend is REACHABLE:', data);
      } else {
        console.error('❌ Backend responded with status:', response.status);
      }
    } catch (error) {
      console.error('❌ BACKEND NOT REACHABLE!');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.error('\n🔧 TROUBLESHOOTING STEPS:');
      console.error('1. Ensure backend is running: python payment_relayer.py');
      console.error('2. Check Windows Firewall allows port 8080');
      console.error('3. If using Android emulator, change IP to 10.0.2.2 in api.ts');
      console.error('4. If using physical device, ensure same WiFi network\n');
    }
  }, 2000);
}

class APIClient {
  private baseURL: string;
  private privacyURL: string;
  private timeout: number = 30000; // 30 second timeout for production use

  constructor() {
    this.baseURL = API_BASE_URL;
    this.privacyURL = PRIVACY_SERVICE_URL;
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token if exists
    const token = await AsyncStorage.getItem('auth_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('⏱️ Request timeout to:', url);
          throw new Error('Request timeout - Backend may be slow or unreachable');
        }
        if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
          console.error('🔌 Network error connecting to:', url);
          console.error('💡 Check: Backend running? Firewall allowing port 8080? Correct IP?');
          throw new Error(`Cannot reach backend at ${this.baseURL}. Check network connection.`);
        }
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Privacy service request
   */
  async privacyRequest<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${this.privacyURL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Health check (note: health endpoint is at root level, not /api/v1)
   */
  async healthCheck(): Promise<{ status: string; timestamp?: string }> {
    const url = `${this.baseURL.replace('/api/v1', '')}/health`;
    
    console.log('🏥 Health check URL:', url);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Health check successful:', result);
      return result;
    } catch (error) {
      console.error('❌ Health check error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Health check timeout - backend may be down or unreachable');
      }
      throw error;
    }
  }
}

export const apiClient = new APIClient();
export default apiClient;
