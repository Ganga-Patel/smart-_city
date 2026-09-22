#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// GPS module pins (per your wiring)
static const int RXPin = 12;  // D6 on NodeMCU -> connected to GPS TX
static const int TXPin = 14;  // D5 on NodeMCU -> connected to GPS RX
static const uint32_t GPSBaud = 9600; // NEO-6M default baud rate

TinyGPSPlus gps;
SoftwareSerial gpsSerial(RXPin, TXPin);

void setup() {
  Serial.begin(115200);       // Serial monitor
  gpsSerial.begin(GPSBaud);   // GPS module

  Serial.println();
  Serial.println("Live GPS Tracking - NEO-6M + NodeMCU");
  Serial.println("Waiting for GPS signal...");
}

void loop() {
  while (gpsSerial.available() > 0) {
    if (gps.encode(gpsSerial.read())) {
      displayInfo();
    }
  }

  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS data received: check wiring or move to open sky");
    delay(2000);
  }
}

void displayInfo() {
  Serial.print("Location: ");
  if (gps.location.isValid()) {
    Serial.print(gps.location.lat(), 6);
    Serial.print(F(", "));
    Serial.print(gps.location.lng(), 6);
  } else {
    Serial.print("Not Available");
  }

  Serial.print("  |  Satellites: ");
  Serial.print(gps.satellites.isValid() ? gps.satellites.value() : 0);

  Serial.print("  |  Altitude: ");
  if (gps.altitude.isValid()) {
    Serial.print(gps.altitude.meters());
    Serial.print(" m");
  } else {
    Serial.print("N/A");
  }

  Serial.print("  |  Speed: ");
  if (gps.speed.isValid()) {
    Serial.print(gps.speed.kmph());
    Serial.print(" km/h");
  } else {
    Serial.print("N/A");
  }

  Serial.print("  |  Time: ");
  if (gps.time.isValid()) {
    if (gps.time.hour() < 10) Serial.print('0');
    Serial.print(gps.time.hour());
    Serial.print(':');
    if (gps.time.minute() < 10) Serial.print('0');
    Serial.print(gps.time.minute());
    Serial.print(':');
    if (gps.time.second() < 10) Serial.print('0');
    Serial.print(gps.time.second());
    Serial.print(" UTC");
  } else {
    Serial.print("N/A");
  }

  Serial.println();
}