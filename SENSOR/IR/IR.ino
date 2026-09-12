// ==========================================
// HW-201 IR OBSTACLE SENSOR
// NodeMCU ESP8266
// ==========================================

const int irPin = D2;   // HW-201 OUT connected to D2

void setup() {

  // Set IR sensor pin as input
  pinMode(irPin, INPUT);

  // Start Serial Monitor
  Serial.begin(9600);

  Serial.println("HW-201 IR Sensor Starting...");

  delay(2000);

  Serial.println("Sensor Ready!");
}

void loop() {

  // Read sensor output
  int irValue = digitalRead(irPin);

  // Print raw value
  Serial.print("IR Value: ");
  Serial.println(irValue);

  // HW-201 normally gives LOW when object is detected
  if (irValue == LOW) {

    Serial.println("Object Detected!");

  } 
  else {

    Serial.println("No Object");

  }

  delay(500);
}