"""
ESP32 PNI Validator
Monitors serial output and validates PNI properties
"""

import serial
import serial.tools.list_ports
import time
import re
from datetime import datetime

class PNIValidator:
    def __init__(self):
        self.pni_history = []
        self.rotation_count = 0
        
    def find_esp32_port(self):
        """Auto-detect ESP32 COM port"""
        ports = serial.tools.list_ports.comports()
        for port in ports:
            # Look for CP210x or CH340 (common ESP32 chips)
            if 'CP210' in port.description or 'CH340' in port.description:
                return port.device
            # Also check for Silicon Labs or USB-SERIAL
            if 'Silicon Labs' in port.manufacturer or 'USB-SERIAL' in port.description:
                return port.device
        return None
    
    def validate_pni_format(self, pni_hex):
        """Validate PNI is proper 256-bit hex"""
        if len(pni_hex) != 64:
            return False, f"Invalid length: {len(pni_hex)} (expected 64)"
        
        if not all(c in '0123456789abcdefABCDEF' for c in pni_hex):
            return False, "Contains non-hex characters"
        
        return True, "Valid format"
    
    def check_uniqueness(self, pni_hex):
        """Check if PNI is unique in history"""
        if pni_hex in self.pni_history:
            return False, "DUPLICATE PNI detected!"
        
        self.pni_history.append(pni_hex)
        return True, f"Unique (total recorded: {len(self.pni_history)})"
    
    def analyze_entropy(self, pni_hex):
        """Basic entropy analysis"""
        # Character distribution
        char_counts = {}
        for c in pni_hex.lower():
            char_counts[c] = char_counts.get(c, 0) + 1
        
        # Check for obvious patterns
        if any(count > 10 for count in char_counts.values()):
            return False, "Suspicious character repetition"
        
        # Check for sequential patterns
        for i in range(len(pni_hex) - 4):
            if pni_hex[i:i+5] == pni_hex[i]*5:
                return False, f"Pattern detected: {pni_hex[i]*5}"
        
        return True, "Good entropy distribution"
    
    def monitor(self, port, baud=115200, duration=None):
        """Monitor ESP32 serial output and validate PNIs"""
        print(f"\n{'='*60}")
        print("ESP32 PNI Validator")
        print(f"{'='*60}\n")
        print(f"Port: {port}")
        print(f"Baud: {baud}")
        print(f"Duration: {duration}s" if duration else "Duration: Continuous")
        print(f"\nMonitoring... Press Ctrl+C to stop\n")
        
        try:
            ser = serial.Serial(port, baud, timeout=1)
            time.sleep(2)  # Wait for ESP32 boot
            
            start_time = time.time()
            pni_pattern = re.compile(r'\[PNI\] ID: ([0-9a-fA-F]{64})')
            
            while True:
                if duration and (time.time() - start_time) > duration:
                    break
                
                if ser.in_waiting:
                    line = ser.readline().decode('utf-8', errors='ignore').strip()
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {line}")
                    
                    # Look for PNI in output
                    match = pni_pattern.search(line)
                    if match:
                        pni = match.group(1).lower()
                        self.rotation_count += 1
                        
                        print(f"\n{'='*60}")
                        print(f"PNI DETECTED #{self.rotation_count}")
                        print(f"{'='*60}")
                        
                        # Validate format
                        valid, msg = self.validate_pni_format(pni)
                        print(f"Format: {'✓' if valid else '✗'} {msg}")
                        
                        # Check uniqueness
                        unique, msg = self.check_uniqueness(pni)
                        print(f"Uniqueness: {'✓' if unique else '✗'} {msg}")
                        
                        # Analyze entropy
                        good_entropy, msg = self.analyze_entropy(pni)
                        print(f"Entropy: {'✓' if good_entropy else '✗'} {msg}")
                        
                        print(f"PNI: {pni}")
                        print(f"{'='*60}\n")
                        
                        if not (valid and unique and good_entropy):
                            print("⚠️  WARNING: PNI quality issues detected!")
                
        except KeyboardInterrupt:
            print("\n\nStopping monitor...")
        except Exception as e:
            print(f"\n❌ Error: {e}")
        finally:
            if 'ser' in locals():
                ser.close()
            
            # Print summary
            self.print_summary()
    
    def print_summary(self):
        """Print validation summary"""
        print(f"\n{'='*60}")
        print("VALIDATION SUMMARY")
        print(f"{'='*60}")
        print(f"Total PNIs recorded: {len(self.pni_history)}")
        print(f"All unique: {'✓ YES' if len(self.pni_history) == len(set(self.pni_history)) else '✗ NO'}")
        
        if self.pni_history:
            print(f"\nFirst PNI: {self.pni_history[0]}")
            print(f"Last PNI:  {self.pni_history[-1]}")
            
            # Compare first and last
            if len(self.pni_history) >= 2:
                matching_chars = sum(1 for a, b in zip(self.pni_history[0], self.pni_history[-1]) if a == b)
                print(f"Matching chars: {matching_chars}/64 (lower is better)")
        
        print(f"{'='*60}\n")

def main():
    import sys
    
    validator = PNIValidator()
    
    # Auto-detect port
    port = validator.find_esp32_port()
    
    if not port:
        print("❌ No ESP32 found. Available ports:")
        for p in serial.tools.list_ports.comports():
            print(f"  - {p.device}: {p.description}")
        
        # Manual port entry
        port = input("\nEnter COM port manually (e.g., COM3): ").strip()
    else:
        print(f"✓ Found ESP32 on {port}")
    
    try:
        # Monitor for duration or continuous
        duration = None
        if len(sys.argv) > 1:
            duration = int(sys.argv[1])
        
        validator.monitor(port, duration=duration)
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
