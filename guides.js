// ===================================================================
// COMPONENT GUIDES — tutorial pemasangan untuk 20 komponen popular
// Kandungan berdasarkan spesifikasi standard yang disahkan.
// ============================================================
const COMPONENT_GUIDES = {
    'DHT11 Temperature & Humidity Sensor': {
        what: 'Measures temperature (0-50°C ±2°C) and humidity (20-90% RH ±5%) using a single digital data line. Good for indoor projects; not weatherproof.',
        wiring: ['VCC → 3.3V-5V', 'DATA → any GPIO (e.g. D4)', 'GND → GND'],
        tips: ['A 10K pull-up resistor between DATA and VCC is required on bare sensors — most 3-pin modules already have one onboard.', 'Place at least 1m away from heat sources for accurate readings.'],
        code: `#include "DHT.h"\n#define DHTPIN 4\n#define DHTTYPE DHT11\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\n\nvoid loop() {\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n  Serial.printf("T: %.1fC  H: %.1f%%\\n", t, h);\n  delay(2000);\n}`,
        issues: [
            ['Readings are NaN', 'Missing pull-up resistor (bare sensor) or loose DATA wire. Add 10K pull-up and reseat wires.'],
            ['Temperature reads ~0°C', 'DATA wire likely on GND. Double-check the wiring table.'],
            ['Works on Uno but not ESP32', 'Some bare DHT11s need 5V VCC to be reliable — power from 5V (VIN) if your breakout allows it.']
        ],
        lib: '"DHT sensor library" by Adafruit (+ Adafruit Unified Sensor)'
    },
    'DHT22 Temperature & Humidity Sensor': {
        what: 'Upgraded DHT11: wider range (-40 to 80°C ±0.5°C, 0-100% RH ±2%) and better accuracy. Same single-wire interface as DHT11.',
        wiring: ['VCC → 3.3V-5V', 'DATA → any GPIO (e.g. D4)', 'GND → GND'],
        tips: ['Same 10K pull-up requirement as DHT11.', 'Sampling interval: do not poll faster than every 2 seconds.'],
        code: `#include "DHT.h"\n#define DHTPIN 4\n#define DHTTYPE DHT22\nDHT dht(DHTPIN, DHTTYPE);\n\nvoid setup() {\n  Serial.begin(115200);\n  dht.begin();\n}\n\nvoid loop() {\n  float h = dht.readHumidity();\n  float t = dht.readTemperature();\n  Serial.printf("T: %.1fC  H: %.1f%%\\n", t, h);\n  delay(2000);\n}`,
        issues: [
            ['NaN readings', 'Pull-up missing or wire too long (>1m unreliable without stronger pull-up).'],
            ['Values frozen', 'Polling too fast — keep the 2s delay in the loop.']
        ],
        lib: '"DHT sensor library" by Adafruit (+ Adafruit Unified Sensor)'
    },
    'HC-SR04 Ultrasonic Sensor': {
        what: 'Measures distance 2cm-400cm (±3mm) by timing an ultrasonic echo. Needs one output pin (TRIG) and one input pin (ECHO).',
        wiring: ['VCC → 5V', 'TRIG → any output GPIO (e.g. D5)', 'ECHO → any input GPIO (e.g. D18)', 'GND → GND'],
        tips: ['ECHO outputs 5V — on 3.3V-only boards (ESP32, ESP8266) use a voltage divider: 1K from ECHO + 2K to GND, tap the middle.', 'Soft or angled surfaces absorb sound and give false readings.'],
        code: `#define TRIG_PIN 5\n#define ECHO_PIN 18\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(TRIG_PIN, OUTPUT);\n  pinMode(ECHO_PIN, INPUT);\n}\n\nvoid loop() {\n  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);\n  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);\n  digitalWrite(TRIG_PIN, LOW);\n  long dur = pulseIn(ECHO_PIN, HIGH, 30000);\n  float cm = dur * 0.034 / 2.0;\n  Serial.printf("Distance: %.1f cm\\n", cm);\n  delay(300);\n}`,
        issues: [
            ['Always reads 0 or max', 'TRIG/ECHO swapped. TRIG is the output from MCU.'],
            ['Random spikes', 'Multiple ultrasonic sensors firing together — stagger readings with delays.'],
            ['Unstable on 3.3V board', 'ECHO is 5V logic — use the voltage divider.']
        ],
        lib: 'None needed (pulseIn built-in)'
    },
    'JSN-SR04T Ultrasonic (Waterproof)': {
        what: 'Waterproof ultrasonic probe (IP65) with 20cm-600cm range — the sealed sensor for outdoor/tank projects. Same interface as HC-SR04.',
        wiring: ['5V → 5V', 'TRIG → output GPIO', 'ECHO → input GPIO (via divider on 3.3V boards)', 'GND → GND'],
        tips: ['Blind zone of ~25cm — objects closer read as max distance.', 'Probe cable can be extended; the control board must stay dry.'],
        code: `// Identical to HC-SR04 — see HC-SR04 guide. Range check:\n// if (cm < 25) Serial.println("In blind zone");`,
        issues: [
            ['Reads max distance when target is close', 'You are inside the 25cm blind zone — mount the sensor further back.']
        ],
        lib: 'None needed'
    },
    'HC-SR501 PIR Motion Sensor': {
        what: 'Passive infrared motion detector — triggers OUT high when moving warm bodies (people/pets) enter range up to ~7m. Two pots: sensitivity & delay.',
        wiring: ['VCC → 5V', 'OUT → any input GPIO', 'GND → GND'],
        tips: ['Needs ~60 seconds warm-up after power-on before readings are reliable.', 'Two orange pots: turn SENSITIVITY anticlockwise to reduce range; TIME controls how long OUT stays high (≈3s to 5min).'],
        code: `#define PIR_PIN 27\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(PIR_PIN, INPUT);\n}\n\nvoid loop() {\n  int motion = digitalRead(PIR_PIN);\n  if (motion) Serial.println("Motion detected!");\n  delay(200);\n}`,
        issues: [
            ['Constant false triggers', 'Pointing at moving curtains/fans, or still in warm-up. Re-aim and wait 60s.'],
            ['Never triggers', 'The jumper under the lens: H (retrigger) vs L (single trigger). Use H for detection loops.']
        ],
        lib: 'None needed'
    },
    'Relay Module 1 Channel (5V)': {
        what: 'Electrically-isolated switch: a small MCU signal (IN) controls a mechanical relay that can switch up to 250VAC/10A or 30VDC loads.',
        wiring: ['VCC → 5V', 'IN → any output GPIO', 'GND → GND', 'Load wires → COM + NO terminals (see module silkscreen)'],
        tips: ['NO = Normally Open (circuit closes when triggered) — this is what most projects use.', '⚠️ Never experiment with mains wall voltage as a student — use low-voltage loads (12V LED strip, 5V bulb).', 'Many modules are ACTIVE LOW (IN=LOW turns relay ON). Test to confirm.'],
        code: `#define RELAY_PIN 26\n\nvoid setup() {\n  Serial.begin(115200);\n  pinMode(RELAY_PIN, OUTPUT);\n  digitalWrite(RELAY_PIN, HIGH); // start OFF (active-low module)\n}\n\nvoid loop() {\n  digitalWrite(RELAY_PIN, LOW);  // ON\n  delay(3000);\n  digitalWrite(RELAY_PIN, HIGH); // OFF\n  delay(3000);\n}`,
        issues: [
            ['Relay stuck ON', 'Your module is active-low — invert your HIGH/LOW logic.'],
            ['Clicks but load does not switch', 'Load wires are on the wrong terminal — check COM/NC/NO labels.']
        ],
        lib: 'None needed'
    },
    'Servo SG90': {
        what: 'Micro servo (9g) rotating 0-180°. Controlled by PWM pulse width: 500µs=0°, 2500µs=180°. Torque ~1.8kg·cm.',
        wiring: ['VCC (orange? no—red) → 5V external recommended', 'SIG (orange/yellow) → any PWM-capable GPIO', 'GND (brown) → GND (shared with MCU!)'],
        tips: ['Power from external 5V supply for anything beyond light testing — servos brownout USB.', 'Common GND between servo supply and MCU is mandatory.'],
        code: `#include <ESP32Servo.h>   // ESP32. On Uno: #include <Servo.h>\nServo myServo;\n\nvoid setup() {\n  myServo.attach(13);\n}\n\nvoid loop() {\n  myServo.write(0);   delay(1000);\n  myServo.write(180); delay(1000);\n}`,
        issues: [
            ['Servo jitters or MCU restarts', 'Power brownout — use external 5V, keep common GND.'],
            ['Buzzing at extremes', 'The horn is mechanically blocked — do not force beyond 0-180°.']
        ],
        lib: 'ESP32: "ESP32Servo" · Uno: built-in <Servo.h>'
    },
    'OLED 0.96" SSD1306 (I2C)': {
        what: '128×64 pixel monochrome display on the I2C bus — only 2 signal wires (SDA/SCL) plus power. Address is usually 0x3C (sometimes 0x3D).',
        wiring: ['VCC → 3.3V', 'GND → GND', 'SDA → board SDA (ESP32: D21)', 'SCL → board SCL (ESP32: D22)'],
        tips: ['Run an I2C scanner sketch first if nothing displays — it prints found addresses to Serial.', 'If display stays black but wiring is correct, try VCC=5V on 5V-tolerant modules.'],
        code: `#include <Wire.h>\n#include <Adafruit_GFX.h>\n#include <Adafruit_SSD1306.h>\nAdafruit_SSD1306 display(128, 64, &Wire, -1);\n\nvoid setup() {\n  Serial.begin(115200);\n  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {\n    Serial.println("OLED not found");\n    while (1);\n  }\n  display.clearDisplay();\n  display.setTextSize(1);\n  display.setTextColor(WHITE);\n  display.setCursor(0, 0);\n  display.println("Hello Pieware!");\n  display.display();\n}\n\nvoid loop() {}`,
        issues: [
            ['Display stays black', 'Wrong I2C address (try 0x3D), or SDA/SCL swapped. Run the scanner.'],
            ['Garbled display', 'Wire too long / poor breadboard contact — keep I2C wires under 30cm.']
        ],
        lib: '"Adafruit SSD1306" + "Adafruit GFX Library"'
    },
    'LCD 16x2 with I2C Adapter': {
        what: 'Classic 16-character × 2-line LCD with a PCF8574 I2C backpack — converts the 16-pin parallel interface into just 4 wires. Address usually 0x27 (0x3F on some packs).',
        wiring: ['VCC → 5V (LCD needs 5V for contrast)', 'GND → GND', 'SDA → board SDA', 'SCL → board SCL'],
        tips: ['If backlight works but no text: turn the blue contrast pot on the backpack until characters appear.', 'I2C on ESP32 is 3.3V logic — most PCF8574 packs accept it, but the LCD contrast needs real 5V on VCC.'],
        code: `#include <LiquidCrystal_I2C.h>\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nvoid setup() {\n  lcd.init();\n  lcd.backlight();\n  lcd.print("Hello Pieware!");\n}\n\nvoid loop() {}`,
        issues: [
            ['Backlight on but no text', 'Contrast pot — rotate it slowly until text appears.'],
            ['Nothing at all', 'Wrong address — scan I2C bus (0x27 vs 0x3F).']
        ],
        lib: '"LiquidCrystal I2C" by Frank de Brabander'
    },
    'LDR Light Sensor Module': {
        what: 'Light-dependent resistor module: analog output (AO) falls as light falls. Digital output (DO) trips at a threshold set by the onboard pot.',
        wiring: ['VCC → 3.3V-5V', 'AO → an ADC pin (ESP32: D34/D35)', 'GND → GND'],
        tips: ['Use AO (analog) for light LEVEL readings; DO only gives on/off at your chosen threshold.', 'The raw value direction depends on the module — print values while covering the sensor to learn yours.'],
        code: `#define LDR_PIN 34\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  int raw = analogRead(LDR_PIN);\n  Serial.printf("Light raw: %d\\n", raw);\n  delay(500);\n}`,
        issues: [
            ['Value does not change', 'You wired DO instead of AO. Use the analog pin.'],
            ['Opposite of expected', 'Modules differ (some invert). Calibrate with your own readings.']
        ],
        lib: 'None needed'
    },
    'Soil Moisture Sensor': {
        what: 'Measures soil water content via conductivity — analog output rises (or falls, per module) with moisture. Fork-shaped probe goes into soil.',
        wiring: ['VCC → 3.3V', 'AO → an ADC pin', 'GND → GND'],
        tips: ['Power it from a GPIO (not VCC) and power on only when reading — this dramatically slows probe corrosion.', 'Calibrate: note raw value in dry air and in a glass of water, map between them.'],
        code: `#define SOIL_PIN 34\n\nvoid setup() { Serial.begin(115200); }\n\nvoid loop() {\n  int raw = analogRead(SOIL_PIN);\n  int pct = map(raw, 3200, 1200, 0, 100); // calibrate these!\n  Serial.printf("Moisture: %d%%\\n", pct);\n  delay(1000);\n}`,
        issues: [
            ['Readings drift over days', 'Probe corrosion — power via GPIO only during readings.'],
            ['Always dry (or always wet)', 'Recalibrate the map() endpoints for YOUR probe.']
        ],
        lib: 'None needed'
    },
    'MQ-2 Gas Sensor': {
        what: 'Detects combustible gases (LPG, propane, smoke) with an analog output. Includes a digital pin with adjustable threshold.',
        wiring: ['VCC → 5V (heater needs 5V)', 'A0 → an ADC pin', 'GND → GND'],
        tips: ['Requires 24-48h burn-in for stable baseline (initial readings drift).', 'Heater draws ~150mA — do not power from a 3.3V pin.'],
        code: `#define MQ_PIN 34\n\nvoid setup() { Serial.begin(115200); }\n\nvoid loop() {\n  int raw = analogRead(MQ_PIN);\n  if (raw > 1500) Serial.println("⚠ Gas/smoke detected!");\n  Serial.printf("MQ-2 raw: %d\\n", raw);\n  delay(500);\n}`,
        issues: [
            ['Readings never stabilise', 'Normal for the first hours — burn-in period.'],
            ['Always high readings', 'Sensor contaminated or freshly powered — allow 2-3 min preheat each session.']
        ],
        lib: 'None needed'
    },
    'RFID RC522 Module': {
        what: '13.56MHz RFID reader/writer — reads MIFARE cards & keyfobs over SPI. The classic door-access component.',
        wiring: ['VCC → 3.3V ONLY (5V destroys it!)', 'GND → GND', 'MOSI → board MOSI', 'MISO → board MISO', 'SCK → board SCK', 'SDA(CS) → a GPIO (default family CS)', 'RST → a free GPIO'],
        tips: ['⚠️ 3.3V power strictly — this is the #1 way students kill this module.', 'Hold the card steady on the antenna for ~1 second.'],
        code: `#include <SPI.h>\n#include <MFRC522.h>\n#define SS_PIN 5\n#define RST_PIN 22\nMFRC522 rfid(SS_PIN, RST_PIN);\n\nvoid setup() {\n  Serial.begin(115200);\n  SPI.begin();\n  rfid.PCD_Init();\n}\n\nvoid loop() {\n  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;\n  Serial.print("Card UID:");\n  for (byte b : rfid.uid.uidByte) Serial.printf(" %02X", b);\n  Serial.println();\n  rfid.PICC_HaltA();\n}`,
        issues: [
            ['Module not detected', 'Check 3.3V power and that SDA(CS)/RST pins in code match wiring.'],
            ['Reads once then stops', 'Missing rfid.PICC_HaltA() at the end of the loop.']
        ],
        lib: '"MFRC522" by GithubCommunity'
    },
    'IR Sensor Module (TCRT5000)': {
        what: 'Infrared reflectance sensor — detects nearby objects/surfaces (0.2-15mm ideal). Digital OUT goes LOW when reflection detected (most modules). Great for line following.',
        wiring: ['VCC → 3.3V-5V', 'OUT → any input GPIO', 'GND → GND'],
        tips: ['Adjust the onboard pot while sliding a white paper at your target distance until the LED flips.', 'Black surfaces absorb IR → usually read as "no reflection".'],
        code: `#define IR_PIN 25\n\nvoid setup() { Serial.begin(115200); pinMode(IR_PIN, INPUT); }\n\nvoid loop() {\n  int hit = digitalRead(IR_PIN); // LOW = reflection (most modules)\n  Serial.println(hit == LOW ? "Line/object detected" : "Clear");\n  delay(100);\n}`,
        issues: [
            ['Inverted readings', 'Module logic differs — invert your comparison or use the pot.'],
            ['Works at wrong distance', 'Turn the pot to retune the threshold.']
        ],
        lib: 'None needed'
    },
    'Buzzer (Active)': {
        what: 'Active buzzer contains its own oscillator — a simple HIGH signal makes sound (fixed ~2-3kHz tone). No tone() needed.',
        wiring: ['+ → any output GPIO', '- → GND'],
        tips: ['Active vs Passive: active makes sound with just HIGH; passive needs tone() and can play melodies.', 'Loud enough for a room; add a transistor if you need more volume.'],
        code: `#define BUZZER_PIN 26\n\nvoid setup() { pinMode(BUZZER_PIN, OUTPUT); }\n\nvoid loop() {\n  digitalWrite(BUZZER_PIN, HIGH); // beep on\n  delay(200);\n  digitalWrite(BUZZER_PIN, LOW);  // beep off\n  delay(800);\n}`,
        issues: [
            ['Very quiet', 'Some buzzers need 5V — check the rated voltage printed on top.'],
            ['Continuous sound even when LOW', 'You have a PASSIVE buzzer wired to a HIGH pin — or + and - swapped.']
        ],
        lib: 'None needed'
    },
    'MPU-6050 Gyro + Accelerometer': {
        what: '6-axis motion sensor: 3-axis accelerometer + 3-axis gyroscope over I2C (address 0x68/0x69). Detects tilt, motion and rotation.',
        wiring: ['VCC → 3.3V', 'GND → GND', 'SDA → board SDA', 'SCL → board SCL'],
        tips: ['Keep the module still during startup — self-test calibrates the gyro offset.', 'Raw values need conversion; start with just printing raws and observing behaviour.'],
        code: `#include <Wire.h>\nconst int MPU = 0x68;\n\nvoid setup() {\n  Serial.begin(115200);\n  Wire.begin();\n  Wire.beginTransmission(MPU);\n  Wire.write(0x6B); Wire.write(0); // wake up\n  Wire.endTransmission(true);\n}\n\nvoid loop() {\n  Wire.beginTransmission(MPU);\n  Wire.write(0x3B); Wire.endTransmission(false);\n  Wire.requestFrom(MPU, 14, true);\n  int16_t ax = Wire.read() << 8 | Wire.read();\n  int16_t ay = Wire.read() << 8 | Wire.read();\n  Serial.printf("AX: %d  AY: %d\\n", ax, ay);\n  delay(200);\n}`,
        issues: [
            ['I2C device not found', 'Address is 0x68 (AD0 low) or 0x69 (AD0 high) — check the AD0 jumper.'],
            ['Values drift constantly', 'Gyro offset — keep flat & still for a few seconds after boot, then subtract the baseline.']
        ],
        lib: '"MPU6050" by Electronic Cats (or raw Wire code above)'
    },
    'Flame Sensor Module': {
        what: 'Detects infrared light from flames (760-1100nm) within ~80cm at 60° angle. Digital output goes LOW on flame detection (most modules).',
        wiring: ['VCC → 3.3V-5V', 'OUT → any input GPIO', 'GND → GND'],
        tips: ['Point the sensor away from sunlight/halogen lamps — they emit IR and cause false alarms.', 'Test with a lighter ~50cm away, not close.'],
        code: `#define FLAME_PIN 25\n\nvoid setup() { Serial.begin(115200); pinMode(FLAME_PIN, INPUT); }\n\nvoid loop() {\n  if (digitalRead(FLAME_PIN) == LOW) Serial.println("🔥 Flame detected!");\n  delay(200);\n}`,
        issues: [
            ['Constant false alarms', 'Sunlight or IR remotes in view — shield the sensor sides.'],
            ['Never triggers', 'Detection pot too strict — rotate it while testing with a lighter.']
        ],
        lib: 'None needed'
    },
    'KY-037 Microphone Sound Sensor': {
        what: 'Microphone with both digital output (threshold via pot) and analog output (raw loudness). KY-037 is the more sensitive variant of KY-038.',
        wiring: ['VCC → 3.3V-5V', 'GND → GND', 'DO → any input GPIO (clap detection)', 'AO → an ADC pin (loudness level)'],
        tips: ['Set the pot so the onboard LED flickers only at your target sound level (clap/voice).', 'Use AO if you want a volume meter instead of on/off.'],
        code: `#define SOUND_DO 26\n\nvoid setup() { Serial.begin(115200); pinMode(SOUND_DO, INPUT); }\n\nvoid loop() {\n  if (digitalRead(SOUND_DO) == HIGH) Serial.println("🎤 Sound detected!");\n  delay(100);\n}`,
        issues: [
            ['Triggers constantly', 'Pot too sensitive — rotate until the LED goes dark in a quiet room.'],
            ['Never triggers', 'Too far from source or pot too strict. Clap close and retune.']
        ],
        lib: 'None needed'
    },
    'WiFi Web Client (HTTP)': {
        what: 'Not a physical component — enables the board to make HTTP requests to websites/APIs over WiFi. Requires a WiFi-capable board (ESP32/ESP8266/Pico W).',
        wiring: ['No wiring — wireless. Configure SSID/password in the generated code.'],
        tips: ['The target website must expose an API endpoint (returns text/JSON).', '2.4GHz WiFi only — ESP boards do not support 5GHz networks.'],
        code: `#include <WiFi.h>\n#include <HTTPClient.h>\nconst char* WIFI_SSID = "YOUR_WIFI_NAME";\nconst char* WIFI_PASS = "YOUR_WIFI_PASSWORD";\nconst char* TARGET_URL = "http://example.com/api/data";\n\nvoid setup() {\n  Serial.begin(115200);\n  WiFi.begin(WIFI_SSID, WIFI_PASS);\n  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }\n  Serial.println("\\nConnected! IP: " + WiFi.localIP().toString());\n}\n\nvoid loop() {\n  if (WiFi.status() == WL_CONNECTED) {\n    HTTPClient http;\n    http.begin(TARGET_URL);\n    int code = http.GET();\n    if (code == 200) Serial.println(http.getString());\n    http.end();\n  }\n  delay(10000);\n}`,
        issues: [
            ['Stuck connecting', 'Wrong SSID/password, or a 5GHz network (use 2.4GHz).'],
            ['HTTP -1 error', 'Wrong URL, or the server blocks the request. Test the URL in a browser first.']
        ],
        lib: 'Built-in (WiFi.h / HTTPClient.h)'
    }
};
