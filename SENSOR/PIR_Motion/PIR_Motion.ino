const int pirPin = 4;   // NodeMCU D2

void setup() {
  pinMode(pirPin, INPUT);
  Serial.begin(9600);

  Serial.println("PIR Starting...");
  delay(30000);  // 30 sec warm-up
  Serial.println("PIR Ready!");
}

void loop() {
  int value = digitalRead(pirPin);

  Serial.print("PIR = ");
  Serial.println(value);

  delay(500);
}