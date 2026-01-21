/*
 * Ghost Protocol - ESP32 Edition
 * Hardware-Assisted Blockchain Transaction Anonymization
 * 
 * This firmware runs the Ghost Protocol mimicry engine on ESP32
 * Requires: ESP32 with WiFi capability
 * 
 * Hardware: ESP32 Dev Board (any variant with WiFi)
 * IDE: Arduino IDE or PlatformIO
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WebServer.h>
#include <time.h>

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// RPC Endpoints for Sepolia Testnet
const char* RPC_ENDPOINTS[] = {
  "https://rpc.sepolia.org",
  "https://ethereum-sepolia.publicnode.com",
  "https://rpc2.sepolia.org",
  "https://sepolia.gateway.tenderly.co"
};
const int RPC_ENDPOINT_COUNT = 4;

// Known Testnet Contracts
struct Contract {
  const char* address;
  const char* name;
  const char* category;
};

Contract KNOWN_CONTRACTS[] = {
  {"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", "UniswapV2Router", "DEX"},
  {"0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", "WETH", "TOKEN"},
  {"0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", "USDC", "TOKEN"},
  {"0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951", "AaveV3Pool", "LENDING"}
};
const int CONTRACT_COUNT = 4;

// Common DeFi function signatures
const char* DEX_FUNCTIONS[] = {
  "swapExactTokensForTokens",
  "swapTokensForExactTokens",
  "addLiquidity",
  "removeLiquidity",
  "getAmountsOut"
};
const int DEX_FUNCTION_COUNT = 5;

const char* LENDING_FUNCTIONS[] = {
  "deposit",
  "withdraw",
  "borrow",
  "repay",
  "getUserAccountData"
};
const int LENDING_FUNCTION_COUNT = 5;

const char* TOKEN_FUNCTIONS[] = {
  "balanceOf",
  "allowance",
  "approve",
  "transfer",
  "transferFrom"
};
const int TOKEN_FUNCTION_COUNT = 5;

// Mimicry Engine Configuration
#define HEARTBEAT_INTERVAL_MIN 5000   // 5 seconds
#define HEARTBEAT_INTERVAL_MAX 45000  // 45 seconds
#define STORM_INTENSITY_MIN 30        // Reduced for ESP32
#define STORM_INTENSITY_MAX 80        // Reduced for ESP32
#define NOISE_RATIO_TARGET 50         // Decoys per real transaction

// Statistics
unsigned long totalDecoys = 0;
unsigned long stormsTriggered = 0;
unsigned long systemStartTime = 0;
bool engineActive = false;

// Web Dashboard
WebServer server(80);

// LED Status (using built-in LED)
#define LED_PIN 2
bool ledState = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("\n\n=================================================");
  Serial.println("   Ghost Protocol - ESP32 Edition");
  Serial.println("   Blockchain Transaction Anonymization");
  Serial.println("=================================================\n");
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize NTP for timestamps
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  
  // Setup web dashboard
  setupWebServer();
  
  systemStartTime = millis();
  engineActive = true;
  
  Serial.println("\n[OK] System initialized successfully!");
  Serial.println("[INFO] Starting mimicry engine...\n");
}

void loop() {
  server.handleClient();
  
  if (engineActive) {
    // Generate heartbeat decoys at random intervals
    static unsigned long lastHeartbeat = 0;
    static unsigned long nextHeartbeatDelay = random(HEARTBEAT_INTERVAL_MIN, HEARTBEAT_INTERVAL_MAX);
    
    if (millis() - lastHeartbeat >= nextHeartbeatDelay) {
      generateHeartbeatDecoy();
      lastHeartbeat = millis();
      nextHeartbeatDelay = random(HEARTBEAT_INTERVAL_MIN, HEARTBEAT_INTERVAL_MAX);
    }
    
    // Occasionally trigger decoy storms
    static unsigned long lastStorm = 0;
    if (millis() - lastStorm >= 60000) { // Every 60 seconds
      if (random(100) < 30) { // 30% chance
        generateDecoyStorm();
      }
      lastStorm = millis();
    }
  }
  
  // Blink LED to show activity
  static unsigned long lastBlink = 0;
  if (millis() - lastBlink >= 500) {
    ledState = !ledState;
    digitalWrite(LED_PIN, ledState);
    lastBlink = millis();
  }
}

void connectWiFi() {
  Serial.print("[WIFI] Connecting to ");
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
    Serial.print("[INFO] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[INFO] Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\n[ERROR] WiFi connection failed!");
    Serial.println("[INFO] Please check credentials and restart");
  }
}

void generateHeartbeatDecoy() {
  // Select random contract and function
  int contractIdx = random(CONTRACT_COUNT);
  Contract& contract = KNOWN_CONTRACTS[contractIdx];
  
  const char** functions;
  int functionCount;
  
  // Select appropriate functions based on contract category
  if (strcmp(contract.category, "DEX") == 0) {
    functions = DEX_FUNCTIONS;
    functionCount = DEX_FUNCTION_COUNT;
  } else if (strcmp(contract.category, "LENDING") == 0) {
    functions = LENDING_FUNCTIONS;
    functionCount = LENDING_FUNCTION_COUNT;
  } else {
    functions = TOKEN_FUNCTIONS;
    functionCount = TOKEN_FUNCTION_COUNT;
  }
  
  const char* function = functions[random(functionCount)];
  
  // Send decoy RPC call
  sendDecoyRPCCall(contract.address, function);
  
  totalDecoys++;
  
  Serial.print(".");
  if (totalDecoys % 50 == 0) {
    Serial.println();
    printStats();
  }
}

void generateDecoyStorm() {
  int intensity = random(STORM_INTENSITY_MIN, STORM_INTENSITY_MAX);
  
  Serial.println("\n[STORM] Triggering decoy storm!");
  Serial.printf("[STORM] Intensity: %d decoys\n", intensity);
  
  unsigned long stormStart = millis();
  
  for (int i = 0; i < intensity; i++) {
    int contractIdx = random(CONTRACT_COUNT);
    Contract& contract = KNOWN_CONTRACTS[contractIdx];
    
    const char** functions;
    int functionCount;
    
    if (strcmp(contract.category, "DEX") == 0) {
      functions = DEX_FUNCTIONS;
      functionCount = DEX_FUNCTION_COUNT;
    } else if (strcmp(contract.category, "LENDING") == 0) {
      functions = LENDING_FUNCTIONS;
      functionCount = LENDING_FUNCTION_COUNT;
    } else {
      functions = TOKEN_FUNCTIONS;
      functionCount = TOKEN_FUNCTION_COUNT;
    }
    
    const char* function = functions[random(functionCount)];
    sendDecoyRPCCall(contract.address, function);
    
    totalDecoys++;
    
    // Small delay to avoid overwhelming ESP32
    delay(random(50, 150));
  }
  
  unsigned long duration = millis() - stormStart;
  stormsTriggered++;
  
  Serial.printf("[OK] Storm complete in %lu ms\n", duration);
  printStats();
}

void sendDecoyRPCCall(const char* contractAddress, const char* functionName) {
  // Select random RPC endpoint
  const char* rpcUrl = RPC_ENDPOINTS[random(RPC_ENDPOINT_COUNT)];
  
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }
  
  HTTPClient http;
  http.begin(rpcUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Create eth_call JSON-RPC request
  StaticJsonDocument<512> doc;
  doc["jsonrpc"] = "2.0";
  doc["method"] = "eth_call";
  doc["id"] = random(1, 10000);
  
  JsonArray params = doc.createNestedArray("params");
  JsonObject callData = params.createNestedObject();
  callData["to"] = contractAddress;
  
  // Generate function signature hash (simplified - real would use keccak256)
  char data[256];
  snprintf(data, sizeof(data), "0x%08x", random(0x10000000, 0x7FFFFFFF));
  callData["data"] = data;
  
  params.add("latest");
  
  String requestBody;
  serializeJson(doc, requestBody);
  
  // Send request (don't wait for response to save time)
  int httpCode = http.POST(requestBody);
  
  http.end();
}

void printStats() {
  unsigned long uptime = (millis() - systemStartTime) / 1000;
  
  Serial.println("\n=== Ghost Protocol Statistics ===");
  Serial.printf("Total Decoys:     %lu\n", totalDecoys);
  Serial.printf("Storms Triggered: %lu\n", stormsTriggered);
  Serial.printf("Uptime:           %lu seconds (%lu min)\n", uptime, uptime/60);
  
  float decoysPerMinute = uptime > 0 ? (totalDecoys / (uptime / 60.0)) : 0;
  Serial.printf("Decoy Rate:       %.1f per minute\n", decoysPerMinute);
  Serial.println("=================================\n");
}

void setupWebServer() {
  // Root page - Dashboard
  server.on("/", HTTP_GET, []() {
    String html = generateDashboardHTML();
    server.send(200, "text/html", html);
  });
  
  // API endpoint for stats
  server.on("/api/stats", HTTP_GET, []() {
    StaticJsonDocument<512> doc;
    doc["totalDecoys"] = totalDecoys;
    doc["stormsTriggered"] = stormsTriggered;
    doc["uptime"] = (millis() - systemStartTime) / 1000;
    doc["engineActive"] = engineActive;
    doc["wifiRSSI"] = WiFi.RSSI();
    doc["freeHeap"] = ESP.getFreeHeap();
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  // Control endpoints
  server.on("/api/start", HTTP_POST, []() {
    engineActive = true;
    server.send(200, "application/json", "{\"status\":\"started\"}");
  });
  
  server.on("/api/stop", HTTP_POST, []() {
    engineActive = false;
    server.send(200, "application/json", "{\"status\":\"stopped\"}");
  });
  
  server.on("/api/storm", HTTP_POST, []() {
    if (engineActive) {
      generateDecoyStorm();
      server.send(200, "application/json", "{\"status\":\"storm_triggered\"}");
    } else {
      server.send(400, "application/json", "{\"status\":\"engine_not_active\"}");
    }
  });
  
  server.begin();
  Serial.println("[OK] Web server started");
  Serial.print("[INFO] Dashboard available at: http://");
  Serial.println(WiFi.localIP());
}

String generateDashboardHTML() {
  unsigned long uptime = (millis() - systemStartTime) / 1000;
  float decoysPerMinute = uptime > 0 ? (totalDecoys / (uptime / 60.0)) : 0;
  
  String html = "<!DOCTYPE html><html><head><meta charset='UTF-8'>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
  html += "<title>Ghost Protocol - ESP32</title>";
  html += "<style>";
  html += "body{font-family:Arial,sans-serif;background:#0a0e27;color:#e0e0e0;margin:0;padding:20px;}";
  html += ".container{max-width:800px;margin:0 auto;}";
  html += "h1{color:#00d9ff;border-bottom:2px solid #00d9ff;padding-bottom:10px;}";
  html += ".card{background:#1a1f3a;padding:20px;margin:15px 0;border-radius:8px;border:1px solid #2a3550;}";
  html += ".stat{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #2a3550;}";
  html += ".stat:last-child{border-bottom:none;}";
  html += ".label{color:#888;}";
  html += ".value{color:#00d9ff;font-weight:bold;font-size:1.2em;}";
  html += ".status-active{color:#00ff88;}";
  html += ".status-inactive{color:#ff4444;}";
  html += "button{background:#00d9ff;color:#0a0e27;border:none;padding:12px 24px;";
  html += "font-size:16px;border-radius:5px;cursor:pointer;margin:5px;}";
  html += "button:hover{background:#00b3cc;}";
  html += "button.danger{background:#ff4444;}";
  html += "button.danger:hover{background:#cc3333;}";
  html += "</style></head><body>";
  
  html += "<div class='container'>";
  html += "<h1>👻 Ghost Protocol - ESP32 Edition</h1>";
  
  html += "<div class='card'>";
  html += "<h2>System Status</h2>";
  html += "<div class='stat'><span class='label'>Engine Status:</span><span class='value ";
  html += engineActive ? "status-active'>Active" : "status-inactive'>Stopped";
  html += "</span></div>";
  html += "<div class='stat'><span class='label'>WiFi Signal:</span><span class='value'>";
  html += String(WiFi.RSSI()) + " dBm</span></div>";
  html += "<div class='stat'><span class='label'>Free Memory:</span><span class='value'>";
  html += String(ESP.getFreeHeap()) + " bytes</span></div>";
  html += "</div>";
  
  html += "<div class='card'>";
  html += "<h2>Statistics</h2>";
  html += "<div class='stat'><span class='label'>Total Decoys:</span><span class='value'>";
  html += String(totalDecoys) + "</span></div>";
  html += "<div class='stat'><span class='label'>Storms Triggered:</span><span class='value'>";
  html += String(stormsTriggered) + "</span></div>";
  html += "<div class='stat'><span class='label'>Uptime:</span><span class='value'>";
  html += String(uptime / 60) + " min</span></div>";
  html += "<div class='stat'><span class='label'>Decoy Rate:</span><span class='value'>";
  html += String(decoysPerMinute, 1) + "/min</span></div>";
  html += "</div>";
  
  html += "<div class='card'>";
  html += "<h2>Controls</h2>";
  html += "<button onclick='fetch(\"/api/storm\",{method:\"POST\"}).then(()=>location.reload())'>🌩️ Trigger Storm</button>";
  if (engineActive) {
    html += "<button class='danger' onclick='fetch(\"/api/stop\",{method:\"POST\"}).then(()=>location.reload())'>⏸️ Stop Engine</button>";
  } else {
    html += "<button onclick='fetch(\"/api/start\",{method:\"POST\"}).then(()=>location.reload())'>▶️ Start Engine</button>";
  }
  html += "</div>";
  
  html += "<div class='card'>";
  html += "<p style='text-align:center;color:#888;font-size:0.9em;'>";
  html += "Hardware-Assisted Blockchain Transaction Anonymization<br>";
  html += "ESP32 Build | Uptime: " + String(uptime) + "s</p>";
  html += "</div>";
  
  html += "</div>";
  html += "<script>setTimeout(()=>location.reload(),5000);</script>";
  html += "</body></html>";
  
  return html;
}
