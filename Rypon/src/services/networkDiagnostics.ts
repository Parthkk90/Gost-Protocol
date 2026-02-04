/**
 * Network Diagnostics Service
 * Helps debug connection issues between React Native app and backend
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiClient } from './api';

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

class NetworkDiagnostics {
  /**
   * Run comprehensive network diagnostics
   */
  async runDiagnostics(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];

    // 1. Check device type
    results.push(this.checkDeviceType());

    // 2. Check Expo configuration
    results.push(this.checkExpoConfig());

    // 3. Test backend connectivity
    const backendTest = await this.testBackendConnection();
    results.push(backendTest);

    // 4. Test health endpoint
    const healthTest = await this.testHealthEndpoint();
    results.push(healthTest);

    return results;
  }

  /**
   * Check what device/emulator is being used
   */
  private checkDeviceType(): DiagnosticResult {
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    let deviceType = 'Unknown';
    let expectedBackendUrl = '';

    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      deviceType = 'Physical Device';
      expectedBackendUrl = `http://${debuggerHost}:8080`;
    } else if (Platform.OS === 'android') {
      deviceType = 'Android Emulator';
      expectedBackendUrl = 'http://10.0.2.2:8080';
    } else if (Platform.OS === 'ios') {
      deviceType = 'iOS Simulator';
      expectedBackendUrl = 'http://127.0.0.1:8080';
    }

    return {
      test: 'Device Type Detection',
      status: 'pass',
      message: `Running on ${deviceType}`,
      details: {
        platform: Platform.OS,
        deviceType,
        expectedBackendUrl,
        debuggerHost,
      },
    };
  }

  /**
   * Check Expo configuration
   */
  private checkExpoConfig(): DiagnosticResult {
    const hostUri = Constants.expoConfig?.hostUri;
    
    if (!hostUri) {
      return {
        test: 'Expo Configuration',
        status: 'warning',
        message: 'Expo hostUri not detected - using fallback IPs',
        details: { hostUri: null },
      };
    }

    return {
      test: 'Expo Configuration',
      status: 'pass',
      message: `Expo host: ${hostUri}`,
      details: { hostUri },
    };
  }

  /**
   * Test if backend is reachable
   */
  private async testBackendConnection(): Promise<DiagnosticResult> {
    try {
      const response = await fetch('http://10.0.2.2:8080/health', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          test: 'Backend Connection',
          status: 'pass',
          message: 'Backend is reachable',
          details: data,
        };
      } else {
        return {
          test: 'Backend Connection',
          status: 'fail',
          message: `Backend returned status ${response.status}`,
          details: { status: response.status },
        };
      }
    } catch (error) {
      return {
        test: 'Backend Connection',
        status: 'fail',
        message: 'Cannot reach backend',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          tip: 'Ensure backend is running on http://0.0.0.0:8080',
        },
      };
    }
  }

  /**
   * Test health endpoint specifically
   */
  private async testHealthEndpoint(): Promise<DiagnosticResult> {
    try {
      const health = await apiClient.healthCheck();
      return {
        test: 'Health Endpoint',
        status: 'pass',
        message: 'Health endpoint working',
        details: health,
      };
    } catch (error) {
      return {
        test: 'Health Endpoint',
        status: 'fail',
        message: 'Health endpoint failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get formatted diagnostic report
   */
  async getReport(): Promise<string> {
    const results = await this.runDiagnostics();
    
    let report = '🔍 Network Diagnostics Report\n';
    report += '═'.repeat(50) + '\n\n';

    for (const result of results) {
      const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
      report += `${icon} ${result.test}\n`;
      report += `   ${result.message}\n`;
      if (result.details) {
        report += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
      }
      report += '\n';
    }

    // Add recommendations
    const failedTests = results.filter(r => r.status === 'fail');
    if (failedTests.length > 0) {
      report += '💡 Recommendations:\n';
      report += '─'.repeat(50) + '\n';
      
      if (failedTests.some(t => t.test.includes('Backend'))) {
        report += '1. Ensure backend is running:\n';
        report += '   cd F:\\W3\\gost_protocol\\z-cresca-vault\\relayer\n';
        report += '   python payment_relayer.py\n\n';
        
        report += '2. Check firewall settings:\n';
        report += '   - Allow port 8080 for incoming connections\n';
        report += '   - Windows: Check Windows Defender Firewall\n\n';
        
        report += '3. Verify backend is listening on 0.0.0.0:\n';
        report += '   - Backend should show: "API Server running on http://0.0.0.0:8080"\n\n';
      }
    }

    return report;
  }
}

export const networkDiagnostics = new NetworkDiagnostics();
