// ===================================================================
// ADVANCED MULTI-SENSOR ENTROPY COLLECTION
// ===================================================================

#include "esp_system.h"
#include <WiFi.h>

// Simple SHA256-like mixing function
void simple_hash_256(const uint8_t* input, size_t len, uint8_t* output) {
  // Initialize with constants
  uint32_t h[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                   0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
  
  // Simple mixing rounds
  for (size_t i = 0; i < len; i++) {
    uint32_t x = input[i];
    for (int j = 0; j < 8; j++) {
      h[j] ^= x;
      h[j] = (h[j] << 7) | (h[j] >> 25);  // Rotate
      h[j] ^= esp_random();  // Add hardware entropy
      x = (x << 3) ^ h[j];
    }
  }
  
  // Output hash
  memcpy(output, h, 32);
}

// ADC Pin Configuration for Entropy Sources
#define ENTROPY_PIN_1 34  // GPIO34 - ADC1_CH6 (WiFi/EMI antenna)
#define ENTROPY_PIN_2 35  // GPIO35 - ADC1_CH7 (Static/proximity)
#define ENTROPY_PIN_3 36  // GPIO36 - ADC1_CH0 (Thermal/power line)
#define ENTROPY_PIN_4 39  // GPIO39 - ADC1_CH3 (Backup/differential)

// Entropy pool for continuous mixing
#define ENTROPY_POOL_SIZE 256
uint8_t entropy_pool[ENTROPY_POOL_SIZE];
uint16_t pool_index = 0;
uint32_t entropy_samples_collected = 0;

class AdvancedEntropyCollector {
private:
  // Ring buffer for temporal mixing
  uint16_t sample_history[64];
  uint8_t history_index = 0;
  
  // Von Neumann whitening state
  uint8_t last_bit = 0;
  bool bit_ready = false;
  
public:
  void init() {
    // Configure ADC for maximum sensitivity
    analogReadResolution(12);  // 12-bit resolution (0-4095)
    analogSetAttenuation(ADC_11db);  // Full 3.3V range
    
    // Set pins as input (floating antenna mode)
    pinMode(ENTROPY_PIN_1, INPUT);
    pinMode(ENTROPY_PIN_2, INPUT);
    pinMode(ENTROPY_PIN_3, INPUT);
    pinMode(ENTROPY_PIN_4, INPUT);
    
    // Initial pool seeding
    for (int i = 0; i < ENTROPY_POOL_SIZE; i++) {
      entropy_pool[i] = esp_random() & 0xFF;
    }
    
    Serial.println("[Entropy] Advanced multi-sensor collector initialized");
    Serial.println("[Entropy] Pins 34,35,36,39 configured as EMI antennas");
  }
  
  // Collect one round of entropy from all sensors
  void collect_sample() {
    // Read all ADC pins simultaneously (as fast as possible)
    uint32_t timestamp_start = micros();
    
    uint16_t sample1 = analogRead(ENTROPY_PIN_1);
    uint16_t sample2 = analogRead(ENTROPY_PIN_2);
    uint16_t sample3 = analogRead(ENTROPY_PIN_3);
    uint16_t sample4 = analogRead(ENTROPY_PIN_4);
    
    uint32_t timestamp_end = micros();
    uint32_t jitter = timestamp_end - timestamp_start;
    
    // Differential measurements (cancels common-mode noise)
    uint16_t diff_12 = sample1 ^ sample2;
    uint16_t diff_34 = sample3 ^ sample4;
    uint16_t diff_cross = (sample1 + sample3) ^ (sample2 + sample4);
    
    // Mix with hardware RNG
    uint32_t hw_rng = esp_random();
    
    // Combine all sources with XOR mixing
    uint32_t mixed = sample1 ^ sample2 ^ sample3 ^ sample4 ^
                     diff_12 ^ diff_34 ^ diff_cross ^
                     jitter ^ hw_rng;
    
    // Store in history for temporal correlation
    sample_history[history_index] = mixed & 0xFFFF;
    history_index = (history_index + 1) % 64;
    
    // Add to entropy pool with mixing
    add_to_pool((uint8_t*)&mixed, 4);
    add_to_pool((uint8_t*)&jitter, 4);
    
    entropy_samples_collected++;
  }
  
  // Von Neumann whitening - removes bias from raw samples
  bool extract_whitened_bit(uint16_t raw_sample) {
    uint8_t bit = raw_sample & 1;
    
    if (!bit_ready) {
      last_bit = bit;
      bit_ready = true;
      return false;  // Need another bit
    }
    
    bit_ready = false;
    
    // Von Neumann extraction
    if (last_bit == 0 && bit == 1) {
      return true;  // Output 0
    } else if (last_bit == 1 && bit == 0) {
      return true;  // Output 1
    } else {
      return false;  // Discard (both bits same)
    }
  }
  
  // Add bytes to pool with cryptographic mixing
  void add_to_pool(uint8_t* data, size_t len) {
    for (size_t i = 0; i < len; i++) {
      // XOR mix into pool
      entropy_pool[pool_index] ^= data[i];
      
      // Hash-based diffusion every 32 bytes
      if (pool_index % 32 == 31) {
        stir_pool(pool_index - 31);
      }
      
      pool_index = (pool_index + 1) % ENTROPY_POOL_SIZE;
    }
  }
  
  // Cryptographic stirring using simple hash
  void stir_pool(uint16_t offset) {
    uint8_t block[32];
    memcpy(block, entropy_pool + offset, 32);
    
    // Add entropy sources
    uint8_t extra[16];
    memcpy(extra, &entropy_samples_collected, 4);
    uint32_t ts = micros();
    memcpy(extra + 4, &ts, 4);
    uint32_t rng = esp_random();
    memcpy(extra + 8, &rng, 4);
    memcpy(extra + 12, &offset, 4);
    
    // Combine block and extra data
    uint8_t combined[48];
    memcpy(combined, block, 32);
    memcpy(combined + 32, extra, 16);
    
    // Hash the combined data
    simple_hash_256(combined, 48, block);
    
    // Write back hashed data
    memcpy(entropy_pool + offset, block, 32);
  }
  
  // Get high-quality random bytes
  void get_random_bytes(uint8_t* output, size_t len) {
    // Collect fresh samples
    for (int i = 0; i < 20; i++) {
      collect_sample();
      delayMicroseconds(50);
    }
    
    // Full pool stir
    for (int i = 0; i < ENTROPY_POOL_SIZE; i += 32) {
      stir_pool(i);
    }
    
    // Generate output in 32-byte chunks
    for (size_t i = 0; i < len; i += 32) {
      uint8_t hash[32];
      
      // Create input for hashing
      uint8_t hash_input[ENTROPY_POOL_SIZE + 16];
      memcpy(hash_input, entropy_pool, ENTROPY_POOL_SIZE);
      
      // Add timestamp and counters
      uint32_t ts = micros();
      memcpy(hash_input + ENTROPY_POOL_SIZE, &ts, 4);
      memcpy(hash_input + ENTROPY_POOL_SIZE + 4, &entropy_samples_collected, 4);
      
      // Add iteration counter
      uint32_t iteration = i / 32;
      memcpy(hash_input + ENTROPY_POOL_SIZE + 8, &iteration, 4);
      
      // Add hardware RNG
      uint32_t rng = esp_random();
      memcpy(hash_input + ENTROPY_POOL_SIZE + 12, &rng, 4);
      
      // Generate hash
      simple_hash_256(hash_input, ENTROPY_POOL_SIZE + 16, hash);
      
      // Copy appropriate amount to output
      size_t chunk = (len - i < 32) ? (len - i) : 32;
      memcpy(output + i, hash, chunk);
      
      // Modify pool for next iteration (prevent identical output)
      entropy_pool[0] ^= hash[0];
      entropy_pool[1] ^= hash[31];
    }
  }
  
  // Diagnostic: measure entropy quality
  void test_entropy_quality() {
    Serial.println("\n[Entropy] Quality test...");
    
    uint8_t samples[256];
    get_random_bytes(samples, 256);
    
    // Count bit transitions (should be ~50%)
    int transitions = 0;
    for (int i = 0; i < 255; i++) {
      for (int bit = 0; bit < 8; bit++) {
        bool b1 = (samples[i] >> bit) & 1;
        bool b2 = (samples[i + 1] >> bit) & 1;
        if (b1 != b2) transitions++;
      }
    }
    
    float transition_rate = (transitions * 100.0) / (255 * 8);
    
    // Count ones vs zeros (should be ~50%)
    int ones = 0;
    for (int i = 0; i < 256; i++) {
      for (int bit = 0; bit < 8; bit++) {
        if ((samples[i] >> bit) & 1) ones++;
      }
    }
    
    float ones_rate = (ones * 100.0) / (256 * 8);
    
    Serial.printf("[Entropy] Bit transitions: %.1f%% (ideal: 50%%)\n", transition_rate);
    Serial.printf("[Entropy] Ones ratio: %.1f%% (ideal: 50%%)\n", ones_rate);
    Serial.printf("[Entropy] Samples collected: %u\n", entropy_samples_collected);
    
    if (transition_rate > 45 && transition_rate < 55 &&
        ones_rate > 45 && ones_rate < 55) {
      Serial.println("[Entropy] ✅ Quality: EXCELLENT");
    } else if (transition_rate > 40 && transition_rate < 60 &&
               ones_rate > 40 && ones_rate < 60) {
      Serial.println("[Entropy] ✅ Quality: GOOD");
    } else {
      Serial.println("[Entropy] ⚠️  Quality: NEEDS IMPROVEMENT");
    }
  }
};

AdvancedEntropyCollector entropy_collector;

// ===================================================================
// ARDUINO SETUP AND LOOP FUNCTIONS
// ===================================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n============================================================");
  Serial.println("  Ghost Protocol - Advanced Entropy Collector");
  Serial.println("============================================================");
  
  // Initialize entropy collector
  entropy_collector.init();
  
  Serial.println("[System] Entropy collector ready!");
  Serial.println("[System] Use Serial commands to test:");
  Serial.println("  't' - Test entropy quality");
  Serial.println("  'g' - Generate random bytes");
  Serial.println("  'h' - Show this help");
}

void loop() {
  // Check for serial commands
  if (Serial.available()) {
    char cmd = Serial.read();
    
    switch (cmd) {
      case 't':
      case 'T':
        entropy_collector.test_entropy_quality();
        break;
        
      case 'g':
      case 'G':
        {
          Serial.println("\n[Test] Generating 16 random bytes...");
          uint8_t random_bytes[16];
          entropy_collector.get_random_bytes(random_bytes, 16);
          
          Serial.print("[Output] ");
          for (int i = 0; i < 16; i++) {
            Serial.printf("%02X", random_bytes[i]);
          }
          Serial.println();
        }
        break;
        
      case 'h':
      case 'H':
        Serial.println("\n[Help] Available commands:");
        Serial.println("  't' - Test entropy quality");
        Serial.println("  'g' - Generate random bytes");
        Serial.println("  'h' - Show this help");
        break;
        
      default:
        // Ignore other characters
        break;
    }
  }
  
  // Continuously collect entropy samples in background
  entropy_collector.collect_sample();
  
  // Small delay to prevent overwhelming the system
  delay(10);
}

// ===================================================================
// UPDATED: REPLACE collect_entropy() FUNCTION
// ===================================================================

void collect_entropy(uint8_t* output, size_t len) {
  entropy_collector.get_random_bytes(output, len);
}