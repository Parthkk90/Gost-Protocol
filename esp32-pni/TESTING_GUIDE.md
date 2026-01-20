# ESP32 PNI Testing Checklist

## Pre-Flight Check

### Hardware
- [ ] ESP32 board available
- [ ] USB cable (data-capable)
- [ ] Computer with Arduino IDE installed
- [ ] (Optional) Sensors: MPU6050, microphone, touch

### Software
- [ ] Arduino IDE 2.0+ installed
- [ ] ESP32 board support added
- [ ] CH340/CP210x drivers installed (if needed)

---

## Step 1: Initial Flash (5 minutes)

### 1.1 Open Firmware
```
1. Launch Arduino IDE
2. File → Open
3. Select: esp32-pni/pni_core.ino
4. Wait for IDE to load sketch
```

### 1.2 Configure Board
```
Tools → Board → ESP32 Dev Module

Settings should be:
- Upload Speed: 115200
- Flash Frequency: 80MHz
- Flash Mode: QIO
- Flash Size: 4MB
- Partition Scheme: Default
```

### 1.3 Select Port
```
Tools → Port → COMx (Windows) or /dev/ttyUSBx (Linux/Mac)

If no port appears:
- Check USB cable (must support data, not just power)
- Install drivers: silabs.com/drivers (CP210x)
- Try different USB port
```

### 1.4 Upload
```
1. Click Upload button (→)
2. Wait for "Connecting..." message
3. If stuck: Hold BOOT button on ESP32
4. Wait for "Hard resetting via RTS pin..."
5. Should complete in 10-30 seconds
```

**Expected Output:**
```
Sketch uses XXXX bytes (XX%) of program storage space.
Global variables use XXXX bytes (XX%) of dynamic memory.
esptool.py v3.0
...
Hard resetting via RTS pin...
```

✅ **Success:** "Hard resetting" message appears  
❌ **Failed:** Error messages → Check port/drivers

---

## Step 2: First Boot (2 minutes)

### 2.1 Open Serial Monitor
```
Tools → Serial Monitor
Set baud rate: 115200
Set line ending: Newline
```

### 2.2 Press ESP32 Reset Button

**Expected Output:**
```
======================================
Ghost Protocol - PNI Core v1.0
Personal Noise Injector System
======================================

[HW-Entropy] Initialized all entropy sources
[PNI] Generating new identifier...
[PNI] Generated successfully
[PNI] ID: a3f7c912e4d8b3a62f1a5e9d8c7b4a31...
[PNI] Age: 0 ms
[PNI] Rotation: #1

[System] Ready for payment operations
```

### 2.3 Validate Output

Check for these markers:
- [ ] "Ghost Protocol - PNI Core v1.0" appears
- [ ] "HW-Entropy Initialized" message
- [ ] "PNI Generated successfully" message
- [ ] 64-character hex PNI displayed
- [ ] "Ready for payment operations" message
- [ ] No error messages

✅ **Success:** All markers present  
❌ **Failed:** Missing messages → Check connections/reflash

---

## Step 3: Command Testing (5 minutes)

### 3.1 Test "status" Command
```
Type in Serial Monitor: status
Press Enter
```

**Expected:**
```
[PNI] ID: a3f7c912e4d8b3a6...
[PNI] Age: 12345 ms
[PNI] Rotation: #1
```

**Verify:**
- [ ] Same PNI as initial generation
- [ ] Age increases (time since generation)
- [ ] Rotation count = 1

### 3.2 Test "entropy" Command
```
Type: entropy
Press Enter
```

**Expected:**
```
[Entropy] Collecting fresh samples...
[Entropy] Pool updated
```

**Physical Test:**
```
1. Type: entropy
2. Tap ESP32 board physically
3. Type: entropy
4. Blow air on board
5. Type: entropy
```

**Verify:**
- [ ] Command executes without errors
- [ ] Physical actions don't cause crashes

### 3.3 Test "rotate" Command
```
Type: status (note the PNI)
Type: rotate
Wait for completion
Type: status (check new PNI)
```

**Expected:**
```
[PNI] Rotating identifier (24h interval)
[PNI] Generating new identifier...
[PNI] Generated successfully
[PNI] ID: b8e2f3a7... (DIFFERENT from before)
```

**Verify:**
- [ ] New PNI completely different
- [ ] No shared characters/patterns
- [ ] Rotation count incremented to #2
- [ ] Age reset to ~0 ms

### 3.4 Test "help" Command
```
Type: help
Press Enter
```

**Expected:**
```
Commands:
  status  - Show current PNI
  rotate  - Force PNI rotation
  entropy - Collect fresh entropy
  help    - Show this menu
```

✅ **Success:** All commands work  
❌ **Failed:** Commands don't respond → Reflash firmware

---

## Step 4: Persistence Test (3 minutes)

### 4.1 Record Current PNI
```
Type: status
Copy the PNI ID to notepad
```

### 4.2 Power Cycle
```
1. Unplug ESP32 USB cable
2. Wait 5 seconds
3. Plug back in
4. Open Serial Monitor again
```

### 4.3 Verify Persistence
```
Type: status
Compare PNI with saved value
```

**Expected:**
- [ ] Same PNI as before power cycle
- [ ] Age reset (time since boot)
- [ ] Rotation count same (#1, #2, etc.)

**This proves:** EEPROM persistence works ✓

✅ **Success:** PNI survived reboot  
❌ **Failed:** Different PNI → EEPROM issue

---

## Step 5: Entropy Quality Test (5 minutes)

### 5.1 Generate Multiple PNIs
```
Type: rotate
Wait 1 second
Type: rotate
Wait 1 second
Type: rotate
```

Copy all 3 PNIs to notepad:
```
PNI_1: a3f7c912e4d8b3a6...
PNI_2: b8e2f3a7c9d1e4b6...
PNI_3: 2f1a5e9d8c7b4a31...
```

### 5.2 Visual Inspection

**Check for:**
- [ ] All 3 PNIs completely different
- [ ] No obvious patterns (e.g., "11111111")
- [ ] Good hex character distribution (0-9, a-f)
- [ ] No repeated PNIs

### 5.3 Python Validation (Optional)

Run this Python script:
```python
pni_1 = "a3f7c912e4d8b3a62f1a5e9d8c7b4a319e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b"
pni_2 = "b8e2f3a7c9d1e4b6..."  # Your actual PNIs
pni_3 = "2f1a5e9d8c7b4a31..."

# Check uniqueness
assert pni_1 != pni_2 != pni_3
print("✓ All PNIs unique")

# Check length (256 bits = 64 hex chars)
assert len(pni_1) == 64
print("✓ Correct length")

# Check hex only
assert all(c in '0123456789abcdef' for c in pni_1)
print("✓ Valid hex format")

print("\n✓ Entropy quality: GOOD")
```

✅ **Success:** All checks pass  
❌ **Failed:** Repeated or patterned PNIs → Hardware issue

---

## Step 6: Timing Test (2 minutes)

### 6.1 Measure Generation Time
```
Type: rotate
Start timer
Wait for "Generated successfully"
Stop timer
```

**Expected:** 200-800ms (depending on sensors)

**Acceptable Range:**
- No sensors: 200-500ms ✅
- With sensors: 400-800ms ✅
- Over 2 seconds: ⚠️ Potential issue

### 6.2 Check Background Entropy
```
1. Let ESP32 run for 1 minute
2. Don't type anything
3. Watch serial output
```

**Expected:**
- No error messages
- Quiet operation (no spam)
- System responsive

✅ **Success:** Clean operation  
❌ **Failed:** Errors/crashes → Debug needed

---

## Step 7: Stress Test (5 minutes)

### 7.1 Rapid Rotation
```
Rapidly type: rotate [Enter] rotate [Enter] rotate [Enter]
Do this 10 times quickly
```

**Expected:**
- [ ] All rotations complete successfully
- [ ] No crashes or hangs
- [ ] Each PNI unique
- [ ] Rotation count increments correctly

### 7.2 Long-Term Stability
```
Let ESP32 run for 5 minutes continuously
Check serial output periodically
```

**Expected:**
- [ ] No random reboots
- [ ] No memory errors
- [ ] Responds to commands
- [ ] No garbage output

✅ **Success:** Rock solid  
❌ **Failed:** Crashes/hangs → Check power supply

---

## Step 8: Optional Sensor Test

### 8.1 If You Have Sensors Connected

**Motion Sensor (MPU6050):**
```
1. Type: entropy
2. Shake/rotate the ESP32
3. Type: rotate
4. Note generation time (should be faster with sensor)
```

**Touch Sensor:**
```
1. Type: entropy
2. Touch the sensor pad
3. Look for "[Entropy] Touch detected" message
```

**Audio Sensor:**
```
1. Type: entropy
2. Clap hands near microphone
3. Type: rotate (should incorporate audio noise)
```

**Verify:**
- [ ] Sensor readings don't cause crashes
- [ ] Physical interactions add entropy
- [ ] Generation faster with more sensors

---

## Common Issues & Solutions

### Issue: "No ESP32 port found"
**Solution:**
- Install CP210x/CH340 drivers
- Try different USB cable (data-capable)
- Check Device Manager (Windows)
- Try another USB port

### Issue: "Upload failed" or timeout
**Solution:**
- Hold BOOT button during upload
- Reduce upload speed: Tools → Upload Speed → 115200
- Check correct board selected
- Power cycle ESP32

### Issue: Garbled serial output
**Solution:**
- Check baud rate = 115200
- Press ESP32 reset button
- Unplug/replug USB cable

### Issue: PNI doesn't persist across reboots
**Solution:**
- EEPROM.commit() may be failing
- Check flash size = 4MB in board settings
- Try manual EEPROM format

### Issue: All PNIs look similar
**Solution:**
- Not collecting enough entropy
- Add sensors for better randomness
- Check entropy_pool not stuck

### Issue: ESP32 keeps rebooting
**Solution:**
- Insufficient power (use USB 2.0 port)
- Bad flash/corruption (reflash)
- Defective board (try another)

---

## Success Criteria

### ✅ PASSING (Ready for Phase 2)

- [x] Firmware uploads successfully
- [x] PNI generates on first boot
- [x] All commands respond correctly
- [x] PNI persists across power cycles
- [x] Multiple PNIs are unique
- [x] No crashes or hangs
- [x] Generation time < 1 second
- [x] Rotation counter increments

### ❌ FAILING (Debug Required)

- [ ] Upload fails repeatedly
- [ ] PNI not generated
- [ ] Commands don't work
- [ ] PNI lost after reboot
- [ ] Repeated/similar PNIs
- [ ] Frequent crashes
- [ ] Very slow generation (>2s)
- [ ] Counter doesn't increment

---

## Next Steps After Passing

Once all tests pass:

**Immediate:**
1. Let ESP32 run 24 hours to test auto-rotation
2. Record 10+ PNIs to verify uniqueness at scale
3. Test with different power supplies

**Phase 2:**
1. Add payment credential derivation
2. Implement transaction counter
3. Build merchant ID system
4. Create ZK proof integration

**Hardware:**
1. Add motion sensor (MPU6050) - $3
2. Add touch pad - $2
3. Design enclosure (3D print)
4. Battery integration

---

## Testing Log Template

```
Date: ___________
Board: ESP32 Dev Module
Sensors: None / MPU6050 / Touch / Audio
Power: USB / Battery

Test Results:
[ ] Upload successful
[ ] First boot OK
[ ] Commands working
[ ] Persistence verified
[ ] Entropy quality good
[ ] Timing acceptable
[ ] Stress test passed
[ ] Overall: PASS / FAIL

Notes:
_________________________________
_________________________________

Generated PNIs (for record):
1. ____________________________
2. ____________________________
3. ____________________________
```

---

**Ready to flash? Connect your ESP32 and start with Step 1!**
