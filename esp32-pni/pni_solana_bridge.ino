/*
 * Ghost Protocol - PNI Solana Bridge
 * Complete integration: PNI + Mimicry + Solana Credentials
 * 
 * This firmware combines:
 * - PNI generation and rotation
 * - Payment credential creation for Solana
 * - Mimicry engine for Solana RPC decoys
 * - HTTP API to serve credentials
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <mbedtls/sha256.h>
#include <esp_random.h>
#include <time.h>
#include <EEPROM.h>

// ===================================================================
// CONFIGURATION
// ===================================================================

// WiFi Configuration
const char* WIFI_SSID = "Airtel_Error 404";
const char* WIFI_PASSWORD = "Networknotfound";

// Solana RPC Endpoints (Devnet)
const char* SOLANA_RPC_ENDPOINTS[] = {
  "https://api.devnet.solana.com",
  "https://rpc.ankr.com/solana_devnet",
  "https://solana-devnet.g.alchemy.com/v2/demo"
};
const int SOLANA_RPC_COUNT = 3;

// Known Solana Programs for Mimicry
struct SolanaProgram {
  const char* address;
  const char* name;
  const char* category;
};

SolanaProgram KNOWN_PROGRAMS[] = {
  {"11111111111111111111111111111111", "System Program", "SYSTEM"},
  {"TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "Token Program", "TOKEN"},
  {"ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL", "Associated Token", "TOKEN"},
  {"JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter Aggregator", "DEX"},
  {"PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY", "Phoenix DEX", "DEX"}
};
const int PROGRAM_COUNT = 5;

// PNI Configuration
#define PNI_SIZE 32
#define ROTATION_INTERVAL 86400000  // 24 hours
#define EEPROM_SIZE 512
#define EEPROM_COUNTER_ADDR 0
#define EEPROM_PNI_ADDR 8

// Mimicry Configuration
#define HEARTBEAT_MIN 8000
#define HEARTBEAT_MAX 30000
#define STORM_INTENSITY_MIN 20
#define STORM_INTENSITY_MAX 35

// ===================================================================
// STATE
// ===================================================================

struct PNI {
  uint8_t identifier[PNI_SIZE];
  uint32_t generation_time;
  uint32_t rotation_count;
  bool is_valid;
};

struct SolanaCredential {
  uint8_t credential_id[16];
  uint8_t signature[32];
  uint64_t counter;
  int64_t timestamp;
  char merchant_pubkey[65];  // Hex encoded (64 chars + null)
  char customer_owner[65];    // Hex encoded (64 chars + null)
  uint64_t amount;
  int64_t valid_until;
};

PNI current_pni;
uint64_t transaction_counter = 0;
WebServer server(80);

// Statistics
unsigned long total_decoys = 0;
unsigned long storms_triggered = 0;
unsigned long credentials_generated = 0;
unsigned long system_start_time = 0;
bool mimicry_active = true;

// ===================================================================
// HARDWARE ENTROPY
// ===================================================================

void collect_entropy(uint8_t* output, size_t len) {
  for (size_t i = 0; i < len; i++) {
    uint32_t rng = esp_random();
    output[i] = (rng ^ micros()) & 0xFF;
    delayMicroseconds(100);
  }
}

// ===================================================================
// PNI GENERATION
// ===================================================================

void generate_pni(PNI* pni) {
  Serial.println("\n[PNI] Generating new identifier...");
  
  // Collect hardware entropy
  uint8_t entropy[64];
  collect_entropy(entropy, 64);
  
  // Mix with time and counter
  uint32_t timestamp = millis();
  uint8_t mac[6];
  WiFi.macAddress(mac);
  
  // Hash everything together
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  mbedtls_sha256_update(&ctx, entropy, 64);
  mbedtls_sha256_update(&ctx, (uint8_t*)&timestamp, 4);
  mbedtls_sha256_update(&ctx, mac, 6);
  mbedtls_sha256_update(&ctx, (uint8_t*)&pni->rotation_count, 4);
  mbedtls_sha256_finish(&ctx, pni->identifier);
  mbedtls_sha256_free(&ctx);
  
  pni->generation_time = millis();
  pni->rotation_count++;
  pni->is_valid = true;
  
  // Save to EEPROM
  EEPROM.put(EEPROM_PNI_ADDR, *pni);
  EEPROM.commit();
  
  Serial.print("[PNI] Generated: ");
  for (int i = 0; i < 16; i++) {
    Serial.printf("%02X", pni->identifier[i]);
  }
  Serial.printf("... (rotation #%d)\n", pni->rotation_count);
}

void check_pni_rotation() {
  if (!current_pni.is_valid || 
      (millis() - current_pni.generation_time >= ROTATION_INTERVAL)) {
    Serial.println("[PNI] Rotation triggered!");
    generate_pni(&current_pni);
  }
}

// ===================================================================
// CREDENTIAL GENERATION
// ===================================================================

SolanaCredential generate_credential(const char* merchant_hex, uint64_t amount, const char* customer_hex) {
  SolanaCredential cred;
  
  // Increment and save counter
  transaction_counter++;
  EEPROM.put(EEPROM_COUNTER_ADDR, transaction_counter);
  EEPROM.commit();
  
  // Get current timestamp
  time_t now;
  time(&now);
  cred.timestamp = now;
  cred.valid_until = now + 300;  // 5 minutes
  
  cred.counter = transaction_counter;
  cred.amount = amount;
  strncpy(cred.merchant_pubkey, merchant_hex, 64);
  cred.merchant_pubkey[64] = '\0';
  strncpy(cred.customer_owner, customer_hex, 64);
  cred.customer_owner[64] = '\0';
  
  // Convert hex strings to bytes
  uint8_t merchant_bytes[32];
  uint8_t customer_bytes[32];
  
  for (int i = 0; i < 32; i++) {
    sscanf(merchant_hex + (i * 2), "%2hhx", &merchant_bytes[i]);
    sscanf(customer_hex + (i * 2), "%2hhx", &customer_bytes[i]);
  }
  
  // Prepare counter and timestamp as little-endian bytes
  uint8_t counter_bytes[8];
  for (int i = 0; i < 8; i++) {
    counter_bytes[i] = (cred.counter >> (i * 8)) & 0xFF;
  }
  
  uint8_t timestamp_bytes[8];
  int64_t ts = cred.timestamp;
  for (int i = 0; i < 8; i++) {
    timestamp_bytes[i] = (ts >> (i * 8)) & 0xFF;
  }
  
  uint8_t amount_bytes[8];
  for (int i = 0; i < 8; i++) {
    amount_bytes[i] = (cred.amount >> (i * 8)) & 0xFF;
  }
  
  // Compute HMAC-SHA256 signature using PNI as key
  // Message = counter || merchant_pubkey || timestamp || customer_owner
  // NOTE: Amount is NOT included in signature (matches Solana contract)
  mbedtls_sha256_context hmac_ctx;
  mbedtls_sha256_init(&hmac_ctx);
  mbedtls_sha256_starts(&hmac_ctx, 0);
  
  // HMAC = SHA256(PNI || message)
  mbedtls_sha256_update(&hmac_ctx, current_pni.identifier, PNI_SIZE);
  mbedtls_sha256_update(&hmac_ctx, counter_bytes, 8);
  mbedtls_sha256_update(&hmac_ctx, merchant_bytes, 32);
  mbedtls_sha256_update(&hmac_ctx, timestamp_bytes, 8);
  mbedtls_sha256_update(&hmac_ctx, customer_bytes, 32);
  // Amount is stored in credential but NOT part of HMAC signature
  
  mbedtls_sha256_finish(&hmac_ctx, cred.signature);
  mbedtls_sha256_free(&hmac_ctx);
  
  // Compute credential_id = first 16 bytes of SHA256(signature + counter + merchant + timestamp + customer)
  // This matches Solana contract's derive_credential_id function
  mbedtls_sha256_context ctx;
  mbedtls_sha256_init(&ctx);
  mbedtls_sha256_starts(&ctx, 0);
  
  // Hash: signature || counter || merchant_pubkey || timestamp || customer_owner
  mbedtls_sha256_update(&ctx, cred.signature, 32);
  mbedtls_sha256_update(&ctx, counter_bytes, 8);
  mbedtls_sha256_update(&ctx, merchant_bytes, 32);
  mbedtls_sha256_update(&ctx, timestamp_bytes, 8);
  mbedtls_sha256_update(&ctx, customer_bytes, 32);
  
  uint8_t hash[32];
  mbedtls_sha256_finish(&ctx, hash);
  mbedtls_sha256_free(&ctx);
  
  // credential_id = first 16 bytes of hash
  memcpy(cred.credential_id, hash, 16);
  
  credentials_generated++;
  
  Serial.println("[Credential] Generated successfully");
  Serial.print("[Credential] ID: ");
  for (int i = 0; i < 16; i++) {
    Serial.printf("%02X", cred.credential_id[i]);
  }
  Serial.println();
  Serial.printf("[Credential] Counter: %llu\n", cred.counter);
  Serial.printf("[Credential] Merchant (hex): %s\n", cred.merchant_pubkey);
  Serial.printf("[Credential] Customer (hex): %s\n", cred.customer_owner);
  Serial.printf("[Credential] Amount: %llu\n", cred.amount);
  Serial.printf("[Credential] Valid for: %lld seconds\n", cred.valid_until - cred.timestamp);
  
  return cred;
}

// ===================================================================
// SOLANA MIMICRY ENGINE
// ===================================================================

void send_solana_decoy() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  // Select random RPC endpoint
  const char* rpc_url = SOLANA_RPC_ENDPOINTS[random(SOLANA_RPC_COUNT)];
  
  // Select random program
  int prog_idx = random(PROGRAM_COUNT);
  const char* program_addr = KNOWN_PROGRAMS[prog_idx].address;
  
  HTTPClient http;
  http.begin(rpc_url);
  http.addHeader("Content-Type", "application/json");
  
  // Generate random Solana RPC method
  const char* methods[] = {
    "getAccountInfo",
    "getBalance", 
    "getTokenAccountBalance",
    "getTokenSupply",
    "getProgramAccounts"
  };
  const char* method = methods[random(5)];
  
  // Create JSON-RPC request
  StaticJsonDocument<512> doc;
  doc["jsonrpc"] = "2.0";
  doc["id"] = random(1, 10000);
  doc["method"] = method;
  
  JsonArray params = doc.createNestedArray("params");
  params.add(program_addr);
  
  String request;
  serializeJson(doc, request);
  
  // Send (don't wait for response)
  http.POST(request);
  http.end();
  
  total_decoys++;
}

void generate_heartbeat() {
  send_solana_decoy();
  
  if (total_decoys % 50 == 0) {
    Serial.print(".");
    if (total_decoys % 500 == 0) {
      Serial.println();
      print_stats();
    }
  }
}

void generate_storm() {
  int intensity = random(STORM_INTENSITY_MIN, STORM_INTENSITY_MAX);
  
  Serial.println("\n[STORM] Mimicry storm triggered!");
  Serial.printf("[STORM] Intensity: %d decoys\n", intensity);
  
  unsigned long start = millis();
  
  for (int i = 0; i < intensity; i++) {
    send_solana_decoy();
    delay(random(20, 80));  // Faster spacing
  }
  
  storms_triggered++;
  
  Serial.printf("[OK] Storm complete in %lu ms\n", millis() - start);
}

// ===================================================================
// HTTP API
// ===================================================================

void handle_root() {
  String html = "<!DOCTYPE html><html><head>";
  html += "<title>Ghost Protocol - Solana Bridge</title>";
  html += "<style>body{font-family:Arial;background:#0a0e27;color:#e0e0e0;padding:20px;}";
  html += "h1{color:#00d9ff;}";
  html += ".card{background:#1a1f3a;padding:20px;margin:15px 0;border-radius:8px;}";
  html += ".stat{display:flex;justify-content:space-between;padding:10px 0;}";
  html += ".label{color:#888;}.value{color:#00d9ff;font-weight:bold;}";
  html += "</style></head><body>";
  
  html += "<h1>👻 Ghost Protocol - Solana Bridge</h1>";
  
  html += "<div class='card'><h2>PNI Status</h2>";
  html += "<div class='stat'><span class='label'>Status:</span><span class='value'>";
  html += current_pni.is_valid ? "Active" : "Inactive";
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>Age:</span><span class='value'>";
  html += String((millis() - current_pni.generation_time) / 3600000) + " hours";
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>Rotation:</span><span class='value'>#";
  html += String(current_pni.rotation_count);
  html += "</span></div></div>";
  
  html += "<div class='card'><h2>Transaction Stats</h2>";
  html += "<div class='stat'><span class='label'>Credentials Generated:</span><span class='value'>";
  html += String(credentials_generated);
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>Current Counter:</span><span class='value'>";
  html += String((unsigned long)transaction_counter);
  html += "</span></div></div>";
  
  html += "<div class='card'><h2>Mimicry Engine</h2>";
  html += "<div class='stat'><span class='label'>Total Decoys:</span><span class='value'>";
  html += String(total_decoys);
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>Storms:</span><span class='value'>";
  html += String(storms_triggered);
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>Status:</span><span class='value'>";
  html += mimicry_active ? "Active" : "Stopped";
  html += "</span></div></div>";
  
  html += "<div class='card'><h3>API Endpoints</h3>";
  html += "<p>GET /credential?merchant=<pubkey>&amount=<lamports></p>";
  html += "<p>GET /status (JSON)</p>";
  html += "<p>POST /storm (trigger decoy storm)</p>";
  html += "</div>";
  
  html += "</body></html>";
  
  server.send(200, "text/html", html);
}

void handle_credential() {
  // Check parameters
  if (!server.hasArg("merchant") || !server.hasArg("amount") || !server.hasArg("customer")) {
    server.send(400, "application/json", "{\"error\":\"Missing merchant, amount, or customer\"}");
    return;
  }
  
  String merchant = server.arg("merchant");
  uint64_t amount = server.arg("amount").toInt();
  String customer = server.arg("customer");
  
  // Validate hex string length (64 chars = 32 bytes)
  if (merchant.length() != 64) {
    server.send(400, "application/json", "{\"error\":\"Invalid merchant hex (expected 64 chars)\"}");
    return;
  }
  
  if (customer.length() != 64) {
    server.send(400, "application/json", "{\"error\":\"Invalid customer hex (expected 64 chars)\"}");
    return;
  }
  
  Serial.println("\n[API] Credential request received");
  Serial.printf("[API] Merchant (hex): %s\n", merchant.c_str());
  Serial.printf("[API] Customer (hex): %s\n", customer.c_str());
  Serial.printf("[API] Amount: %llu\n", amount);
  
  // Generate credential
  SolanaCredential cred = generate_credential(merchant.c_str(), amount, customer.c_str());
  
  // Trigger mimicry storm
  if (mimicry_active) {
    Serial.println("[API] Triggering mimicry storm...");
    generate_storm();
  }
  
  // Build JSON response
  StaticJsonDocument<1024> doc;
  
  // Credential ID as hex string
  char cred_id_hex[33];
  for (int i = 0; i < 16; i++) {
    sprintf(cred_id_hex + (i * 2), "%02X", cred.credential_id[i]);
  }
  doc["credential_id"] = cred_id_hex;
  
  // Signature as hex string
  char sig_hex[65];
  for (int i = 0; i < 32; i++) {
    sprintf(sig_hex + (i * 2), "%02X", cred.signature[i]);
  }
  doc["signature"] = sig_hex;
  
  doc["counter"] = (unsigned long)cred.counter;
  doc["timestamp"] = (long)cred.timestamp;
  doc["merchant_pubkey"] = cred.merchant_pubkey;
  doc["customer_owner"] = cred.customer_owner;
  doc["amount"] = (unsigned long)cred.amount;
  doc["valid_until"] = (long)cred.valid_until;
  doc["pni_generation"] = current_pni.rotation_count;
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
  Serial.println("[API] Credential served successfully");
}

void handle_status() {
  StaticJsonDocument<512> doc;
  
  doc["pni_active"] = current_pni.is_valid;
  doc["pni_age_hours"] = (millis() - current_pni.generation_time) / 3600000;
  doc["pni_rotation"] = current_pni.rotation_count;
  doc["transaction_counter"] = (unsigned long)transaction_counter;
  doc["credentials_generated"] = credentials_generated;
  doc["mimicry_active"] = mimicry_active;
  doc["decoys_sent"] = total_decoys;
  doc["storms_triggered"] = storms_triggered;
  doc["uptime_seconds"] = (millis() - system_start_time) / 1000;
  doc["free_heap"] = ESP.getFreeHeap();
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
}

void handle_storm() {
  if (!mimicry_active) {
    server.send(400, "application/json", "{\"error\":\"Mimicry engine not active\"}");
    return;
  }
  
  generate_storm();
  server.send(200, "application/json", "{\"status\":\"storm_triggered\"}");
}

void setup_api() {
  server.on("/", HTTP_GET, handle_root);
  server.on("/credential", HTTP_GET, handle_credential);
  server.on("/status", HTTP_GET, handle_status);
  server.on("/storm", HTTP_POST, handle_storm);
  
  server.begin();
  
  Serial.println("[API] HTTP server started");
  Serial.print("[API] Dashboard: http://");
  Serial.println(WiFi.localIP());
}

// ===================================================================
// SETUP & LOOP
// ===================================================================

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n=================================================");
  Serial.println("   Ghost Protocol - Solana Bridge");
  Serial.println("   PNI + Mimicry + Solana Credentials");
  Serial.println("=================================================\n");
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  // FORCE RESET: Clear EEPROM and start fresh
  // Remove these 4 lines after first successful boot
  Serial.println("[EEPROM] Forcing reset...");
  for (int i = 0; i < EEPROM_SIZE; i++) {
    EEPROM.write(i, 0);
  }
  EEPROM.commit();
  transaction_counter = 0;
  
  // Load counter from EEPROM
  EEPROM.get(EEPROM_COUNTER_ADDR, transaction_counter);
  Serial.printf("[EEPROM] Loaded counter: %llu\n", transaction_counter);
  
  // Try to load PNI from EEPROM
  EEPROM.get(EEPROM_PNI_ADDR, current_pni);
  
  if (!current_pni.is_valid || 
      (millis() - current_pni.generation_time >= ROTATION_INTERVAL)) {
    generate_pni(&current_pni);
  } else {
    Serial.println("[PNI] Loaded from EEPROM");
  }
  
  // Connect WiFi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] WiFi connected!");
    Serial.print("[INFO] IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[ERROR] WiFi failed!");
  }
  
  // Sync time with NTP
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("[NTP] Syncing time...");
  time_t now = 0;
  int retries = 0;
  while (now < 1000000000 && retries < 20) {
    time(&now);
    delay(500);
    retries++;
  }
  Serial.printf("[NTP] Current time: %ld\n", now);
  
  // Setup API
  setup_api();
  
  system_start_time = millis();
  
  Serial.println("\n[OK] System ready!");
  Serial.println("[INFO] Mimicry engine active\n");
}

void loop() {
  server.handleClient();
  
  // Check PNI rotation
  static unsigned long last_rotation_check = 0;
  if (millis() - last_rotation_check >= 3600000) {  // Check every hour
    check_pni_rotation();
    last_rotation_check = millis();
  }
  
  // Heartbeat decoys
  if (mimicry_active) {
    static unsigned long last_heartbeat = 0;
    static unsigned long next_interval = random(HEARTBEAT_MIN, HEARTBEAT_MAX);
    
    if (millis() - last_heartbeat >= next_interval) {
      generate_heartbeat();
      last_heartbeat = millis();
      next_interval = random(HEARTBEAT_MIN, HEARTBEAT_MAX);
    }
  }
  
  // Random storms
  static unsigned long last_random_storm = 0;
  if (millis() - last_random_storm >= 90000 && mimicry_active) {  // Every 90s
    if (random(100) < 20) {  // 20% chance
      generate_storm();
    }
    last_random_storm = millis();
  }
}

void print_stats() {
  unsigned long uptime = (millis() - system_start_time) / 1000;
  
  Serial.println("\n=== Ghost Protocol Stats ===");
  Serial.printf("Credentials: %lu\n", credentials_generated);
  Serial.printf("Counter: %llu\n", transaction_counter);
  Serial.printf("Decoys: %lu\n", total_decoys);
  Serial.printf("Storms: %lu\n", storms_triggered);
  Serial.printf("Uptime: %lu min\n", uptime / 60);
  Serial.println("============================\n");
}
