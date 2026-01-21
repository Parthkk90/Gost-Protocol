/*
 * Ghost Protocol ESP32 - Configuration Header
 * 
 * Edit this file to configure your ESP32 device
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// WIFI CONFIGURATION
// ============================================
// Replace with your WiFi credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// WiFi connection timeout (milliseconds)
#define WIFI_TIMEOUT 30000

// ============================================
// BLOCKCHAIN NETWORK SELECTION
// ============================================
// Uncomment the network you want to use
#define NETWORK_SEPOLIA
// #define NETWORK_GOERLI
// #define NETWORK_MUMBAI
// #define NETWORK_BSC_TESTNET

// ============================================
// MIMICRY ENGINE SETTINGS
// ============================================
// Heartbeat intervals (milliseconds)
#define HEARTBEAT_INTERVAL_MIN 5000   // Minimum delay between heartbeat decoys
#define HEARTBEAT_INTERVAL_MAX 45000  // Maximum delay between heartbeat decoys

// Storm settings
#define STORM_INTENSITY_MIN 30        // Minimum decoys in a storm
#define STORM_INTENSITY_MAX 80        // Maximum decoys in a storm
#define STORM_DURATION_MIN 2000       // Minimum storm duration (ms)
#define STORM_DURATION_MAX 8000       // Maximum storm duration (ms)
#define STORM_PROBABILITY 30          // % chance of storm every minute

// Anonymization targets
#define NOISE_RATIO_TARGET 50         // Target decoys per real transaction
#define MIN_DECOYS_PER_REAL_TX 50     // Minimum decoys before sending real TX

// ============================================
// WEB DASHBOARD SETTINGS
// ============================================
#define WEB_SERVER_PORT 80            // HTTP port for web dashboard
#define DASHBOARD_AUTO_REFRESH 5000   // Dashboard refresh interval (ms)

// ============================================
// HARDWARE SETTINGS
// ============================================
#define LED_PIN 2                     // Built-in LED pin (usually 2)
#define LED_BLINK_INTERVAL 500        // LED blink rate (ms)

// Serial debug output
#define SERIAL_BAUD_RATE 115200
#define DEBUG_ENABLED true            // Set to false to disable debug output

// ============================================
// RPC ENDPOINTS
// ============================================
// You can add custom RPC endpoints here

// Sepolia Testnet
#ifdef NETWORK_SEPOLIA
const char* RPC_ENDPOINTS[] = {
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc2.sepolia.org",
  "https://sepolia.gateway.tenderly.co"
};
const int RPC_ENDPOINT_COUNT = 4;
#endif

// Goerli Testnet (deprecated but still available)
#ifdef NETWORK_GOERLI
const char* RPC_ENDPOINTS[] = {
  "https://ethereum-goerli.publicnode.com",
  "https://goerli.gateway.tenderly.co",
  "https://rpc.goerli.eth.gateway.fm"
};
const int RPC_ENDPOINT_COUNT = 3;
#endif

// Mumbai Testnet (Polygon)
#ifdef NETWORK_MUMBAI
const char* RPC_ENDPOINTS[] = {
  "https://rpc-mumbai.maticvigil.com",
  "https://polygon-mumbai.gateway.tenderly.co",
  "https://polygon-mumbai-bor.publicnode.com"
};
const int RPC_ENDPOINT_COUNT = 3;
#endif

// BSC Testnet
#ifdef NETWORK_BSC_TESTNET
const char* RPC_ENDPOINTS[] = {
  "https://data-seed-prebsc-1-s1.binance.org:8545",
  "https://bsc-testnet.publicnode.com",
  "https://bsc-testnet.gateway.tenderly.co"
};
const int RPC_ENDPOINT_COUNT = 3;
#endif

// ============================================
// ADVANCED SETTINGS
// ============================================
// HTTP timeout for RPC calls (milliseconds)
#define HTTP_TIMEOUT 10000

// Maximum retry attempts for failed requests
#define MAX_RETRY_ATTEMPTS 3

// Memory management
#define MAX_CONCURRENT_REQUESTS 5     // Limit concurrent HTTP requests
#define JSON_BUFFER_SIZE 512          // Size of JSON document buffer

// Time sync
#define NTP_SERVER_1 "pool.ntp.org"
#define NTP_SERVER_2 "time.nist.gov"
#define NTP_GMT_OFFSET 0              // GMT offset in seconds
#define NTP_DAYLIGHT_OFFSET 0         // Daylight saving offset

// ============================================
// FEATURE FLAGS
// ============================================
#define ENABLE_WEB_DASHBOARD true     // Enable web-based dashboard
#define ENABLE_SERIAL_OUTPUT true     // Enable serial debug output
#define ENABLE_LED_INDICATOR true     // Enable LED status indicator
#define ENABLE_OTA_UPDATES false      // Enable Over-The-Air firmware updates

// ============================================
// SECURITY SETTINGS
// ============================================
// Dashboard authentication (basic)
#define DASHBOARD_AUTH_ENABLED false  // Enable basic auth for dashboard
#define DASHBOARD_USERNAME "admin"
#define DASHBOARD_PASSWORD "ghost123"

// SSL/TLS verification
#define VERIFY_SSL_CERTIFICATES false // Set to true for production (requires more memory)

#endif // CONFIG_H
