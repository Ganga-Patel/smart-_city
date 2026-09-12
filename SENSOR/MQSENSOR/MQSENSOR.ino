#define MQ2_PIN A0

void setup() {
  Serial.begin(9600);
}

void loop() {
  int gasValue = analogRead(MQ2_PIN);

  Serial.print("Gas Value = ");
  Serial.println(gasValue);

  delay(1000);
}
