/*
 * Ghost Protocol - Personal Noise Injector (PNI)
 * ESP32 Hardware Implementation
 * 
 * Generates cryptographically unique, unlinkable payment identifiers
 * using true hardware randomness from physical sensors (motion, sound, RF noise)
 */

#include <Arduino.h>
#include <esp_system.h>
#include <esp_random.h>
#include <mbedtls/sha256.h>
#include <driver/adc.h>
#include <WiFi.h>
#include <EEPROM.h>

// Configuration
#define PNI_SIZE 32                    // 256-bit PNI
#define ROTATION_INTERVAL 86400000     // 24 hours in ms
#define ENTROPY_POOL_SIZE 128          // Entropy buffer size
#define EEPROM_SIZE 512

// Pin Configuration for Sensors
#define MOTION_SENSOR_PIN 34           // Accelerometer/gyro
#define TOUCH_SENSOR_PIN 27            // Touch sensor
#define AUDIO_SENSOR_PIN 35            // Microphone/sound
#define TEMP_SENSOR_PIN 36             // Temperature (analog)

// PNI State
struct PNI {
  uint8_t identifier[PNI_SIZE];       // Current PNI
  uint32_t generation_time;           // When generated
  uint32_t rotation_count;            // How many times rotated
  bool is_valid;
};

PNI current_pni;
uint8_t entropy_pool[ENTROPY_POOL_SIZE];
uint16_t entropy_index = 0;

// ===================================================================
// HARDWARE ENTROPY COLLECTION
// ===================================================================

class HardwareEntropy {
public:
  
  // Initialize all entropy sources
  void begin() {
    // Configure ADC for analog noise sampling
    adc1_config_width(ADC_WIDTH_BIT_12);
    adc1_config_channel_atten(ADC1_CHANNEL_6, ADC_ATTEN_DB_11); // GPIO34
    adc1_config_channel_atten(ADC1_CHANNEL_7, ADC_ATTEN_DB_11); // GPIO35
    adc1_config_channel_atten(ADC1_CHANNEL_0, ADC_ATTEN_DB_11); // GPIO36
    
    // Configure touch sensor
    touchAttachInterrupt(TOUCH_SENSOR_PIN, touch_callback, 40);
    
    Serial.println("[HW-Entropy] Initialized all entropy sources");
  }
  
  // Collect entropy from all physical sources
  void collect() {
    // 1. ESP32 hardware RNG (uses RF noise from WiFi)
    uint32_t hw_random = esp_random();
    add_to_pool((uint8_t*)&hw_random, 4);
    
    // 2. Motion sensor (accelerometer noise)
    uint16_t motion = adc1_get_raw(ADC1_CHANNEL_6);
    add_to_pool((uint8_t*)&motion, 2);
    
    // 3. Audio/electrical noise
    uint16_t audio = adc1_get_raw(ADC1_CHANNEL_7);
    add_to_pool((uint8_t*)&audio, 2);
    
    // 4. Temperature sensor drift
    uint16_t temp = adc1_get_raw(ADC1_CHANNEL_0);
    add_to_pool((uint8_t*)&temp, 2);
    
    // 5. System timing jitter
    uint32_t jitter = micros();
    add_to_pool((uint8_t*)&jitter, 4);
    
    // 6. WiFi RSSI noise (if connected)
    if (WiFi.status() == WL_CONNECTED) {
      int32_t rssi = WiFi.RSSI();
      add_to_pool((uint8_t*)&rssi, 4);
    }
    
    // 7. CPU temperature (internal sensor)
    uint8_t cpu_temp = temperatureRead();
    add_to_pool(&cpu_temp, 1);
  }
  
  // Add bytes to entropy pool with mixing
  void add_to_pool(uint8_t* data, size_t len) {
    for (size_t i = 0; i < len; i++) {
      entropy_pool[entropy_index] ^= data[i];  // XOR mixing
      entropy_index = (entropy_index + 1) % ENTROPY_POOL_SIZE;
    }
  }
  
  // Get high-quality random bytes
  void get_random_bytes(uint8_t* output, size_t len) {
    // Mix entropy pool with hardware RNG
    for (size_t i = 0; i < len; i++) {
      collect();  // Fresh entropy for each byte
      output[i] = entropy_pool[(entropy_index + i) % ENTROPY_POOL_SIZE] ^ 
                  (esp_random() & 0xFF);
    }
  }
  
private:
  static void touch_callback() {
    // Touch event adds entropy
    uint32_t touch_time = micros();
    Serial.println("[Entropy] Touch detected");
  }
};

HardwareEntropy hw_entropy;

// ===================================================================
// PNI GENERATOR
// ===================================================================

class PNIGenerator {
public:
  
  // Generate new PNI from hardware entropy
  void generate(PNI* pni) {
    Serial.println("\n[PNI] Generating new identifier...");
    
    // Collect fresh entropy
    for (int i = 0; i < 10; i++) {
      hw_entropy.collect();
      delay(10);
    }
    
    // Generate base random bytes
    uint8_t random_bytes[PNI_SIZE];
    hw_entropy.get_random_bytes(random_bytes, PNI_SIZE);
    
    // Mix with device-specific data
    uint8_t device_id[8];
    get_device_id(device_id);
    
    uint32_t timestamp = millis();
    uint32_t rotation = pni->rotation_count + 1;
    
    // Combine all sources with SHA-256
    mbedtls_sha256_context sha_ctx;
    mbedtls_sha256_init(&sha_ctx);
    mbedtls_sha256_starts(&sha_ctx, 0);  // SHA-256
    
    // Hash everything together
    mbedtls_sha256_update(&sha_ctx, random_bytes, PNI_SIZE);
    mbedtls_sha256_update(&sha_ctx, device_id, 8);
    mbedtls_sha256_update(&sha_ctx, (uint8_t*)&timestamp, 4);
    mbedtls_sha256_update(&sha_ctx, (uint8_t*)&rotation, 4);
    
    mbedtls_sha256_finish(&sha_ctx, pni->identifier);
    mbedtls_sha256_free(&sha_ctx);
    
    // Update metadata
    pni->generation_time = millis();
    pni->rotation_count = rotation;
    pni->is_valid = true;
    
    // Save to EEPROM for persistence
    save_to_eeprom(pni);
    
    Serial.println("[PNI] Generated successfully");
    print_pni(pni);
  }
  
  // Check if PNI needs rotation (24h interval)
  bool needs_rotation(PNI* pni) {
    if (!pni->is_valid) return true;
    uint32_t age = millis() - pni->generation_time;
    return age >= ROTATION_INTERVAL;
  }
  
  // Rotate PNI (generate new one)
  void rotate(PNI* pni) {
    Serial.println("[PNI] Rotating identifier (24h interval)");
    generate(pni);
  }
  
  // Get device-specific ID (MAC address)
  void get_device_id(uint8_t* id) {
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    
    // Derive 8-byte ID from 6-byte MAC
    memcpy(id, mac, 6);
    id[6] = mac[0] ^ mac[3];
    id[7] = mac[1] ^ mac[4];
  }
  
  // Save PNI to EEPROM
  void save_to_eeprom(PNI* pni) {
    EEPROM.write(0, 0x50);  // Magic byte 'P'
    EEPROM.write(1, 0x4E);  // Magic byte 'N'
    EEPROM.write(2, 0x49);  // Magic byte 'I'
    
    for (int i = 0; i < PNI_SIZE; i++) {
      EEPROM.write(3 + i, pni->identifier[i]);
    }
    
    EEPROM.put(3 + PNI_SIZE, pni->generation_time);
    EEPROM.put(7 + PNI_SIZE, pni->rotation_count);
    
    EEPROM.commit();
  }
  
  // Load PNI from EEPROM
  bool load_from_eeprom(PNI* pni) {
    // Check magic bytes
    if (EEPROM.read(0) != 0x50 || 
        EEPROM.read(1) != 0x4E || 
        EEPROM.read(2) != 0x49) {
      Serial.println("[PNI] No saved PNI found");
      return false;
    }
    
    for (int i = 0; i < PNI_SIZE; i++) {
      pni->identifier[i] = EEPROM.read(3 + i);
    }
    
    EEPROM.get(3 + PNI_SIZE, pni->generation_time);
    EEPROM.get(7 + PNI_SIZE, pni->rotation_count);
    
    pni->is_valid = true;
    
    Serial.println("[PNI] Loaded from EEPROM");
    return true;
  }
  
  // Print PNI in hex
  void print_pni(PNI* pni) {
    Serial.print("[PNI] ID: ");
    for (int i = 0; i < PNI_SIZE; i++) {
      if (pni->identifier[i] < 0x10) Serial.print("0");
      Serial.print(pni->identifier[i], HEX);
    }
    Serial.println();
    Serial.printf("[PNI] Age: %u ms\n", millis() - pni->generation_time);
    Serial.printf("[PNI] Rotation: #%u\n", pni->rotation_count);
  }
};

PNIGenerator pni_gen;

// ===================================================================
// SETUP & MAIN LOOP
// ===================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("======================================");
  Serial.println("Ghost Protocol - PNI Core v1.0");
  Serial.println("Personal Noise Injector System");
  Serial.println("======================================\n");
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // Initialize hardware entropy
  hw_entropy.begin();
  
  // Try to load existing PNI
  if (!pni_gen.load_from_eeprom(&current_pni)) {
    // Generate first PNI
    current_pni.rotation_count = 0;
    pni_gen.generate(&current_pni);
  } else {
    // Check if loaded PNI needs rotation
    if (pni_gen.needs_rotation(&current_pni)) {
      pni_gen.rotate(&current_pni);
    } else {
      Serial.println("[PNI] Using existing identifier");
      pni_gen.print_pni(&current_pni);
    }
  }
  
  Serial.println("\n[System] Ready for payment operations");
}

void loop() {
  // Continuously collect entropy in background
  hw_entropy.collect();
  
  // Check for PNI rotation every minute
  static uint32_t last_check = 0;
  if (millis() - last_check > 60000) {
    last_check = millis();
    
    if (pni_gen.needs_rotation(&current_pni)) {
      pni_gen.rotate(&current_pni);
    }
  }
  
  // Check for serial commands
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    
    if (cmd == "status") {
      pni_gen.print_pni(&current_pni);
    }
    else if (cmd == "rotate") {
      pni_gen.rotate(&current_pni);
    }
    else if (cmd == "entropy") {
      Serial.println("[Entropy] Collecting fresh samples...");
      for (int i = 0; i < 5; i++) {
        hw_entropy.collect();
        delay(100);
      }
      Serial.println("[Entropy] Pool updated");
    }
    else if (cmd == "help") {
      Serial.println("\nCommands:");
      Serial.println("  status  - Show current PNI");
      Serial.println("  rotate  - Force PNI rotation");
      Serial.println("  entropy - Collect fresh entropy");
      Serial.println("  help    - Show this menu");
    }
  }
  
  delay(100);
}
