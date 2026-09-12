#include <ESP8266WiFi.h>
#include <Firebase_ESP_Client.h>
#include <DHT.h>

// ================= WIFI =================
#define WIFI_SSID "Click Here For Viruses 🦠"
#define WIFI_PASSWORD "7383527213"

// ================= FIREBASE =================
#define API_KEY "AIzaSyC6BVnaEqgXYZK2MdRDxSK0lXiLWa7zDDc"
#define DATABASE_URL "https://smartcity-61fad-default-rtdb.firebaseio.com/"

// ================= DHT11 =================
#define DHTPIN D3
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

// ================= RAIN =================
#define RAIN_PIN D2

// ================= MQ2 =================
#define MQ2_PIN D5

// ================= FIREBASE =================
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

void setup() {

  Serial.begin(115200);
  delay(1000);

  // Sensors
  dht.begin();

  pinMode(RAIN_PIN, INPUT);
  pinMode(MQ2_PIN, INPUT);

  // ================= WIFI =================

  Serial.println();
  Serial.print("Connecting to WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // ================= FIREBASE =================

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase Authentication OK");
  } 
  else {
    Serial.println("Firebase Authentication Failed");
    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase Connected!");
}

void loop() {

  // =================================================
  // DHT11
  // =================================================

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {

    Serial.println("DHT11 ERROR!");

  } 
  else {

    Serial.print("Temperature: ");
    Serial.print(temperature);
    Serial.println(" C");

    Serial.print("Humidity: ");
    Serial.print(humidity);
    Serial.println(" %");

    // Temperature → Firebase
    if (Firebase.RTDB.setFloat(
          &fbdo,
          "/smartcity/DHT22/temperature",
          temperature)) {

      Serial.println("Temperature uploaded");

    } else {

      Serial.println(fbdo.errorReason());
    }

    // Humidity → Firebase
    if (Firebase.RTDB.setFloat(
          &fbdo,
          "/smartcity/DHT22/humidity",
          humidity)) {

      Serial.println("Humidity uploaded");

    } else {

      Serial.println(fbdo.errorReason());
    }
  }


  // =================================================
  // RAIN SENSOR
  // =================================================

  int rainValue = digitalRead(RAIN_PIN);

  Serial.print("Rain: ");
  Serial.println(rainValue);

  if (Firebase.RTDB.setInt(
        &fbdo,
        "/smartcity/Rain/value",
        rainValue)) {

    Serial.println("Rain uploaded");

  } else {

    Serial.println(fbdo.errorReason());
  }


  // =================================================
  // MQ2
  // =================================================

  int mqValue = digitalRead(MQ2_PIN);

  Serial.print("MQ2: ");
  Serial.println(mqValue);

  if (Firebase.RTDB.setInt(
        &fbdo,
        "/smartcity/MQ2/value",
        mqValue)) {

    Serial.println("MQ2 uploaded");

  } else {

    Serial.println(fbdo.errorReason());
  }
  


  Serial.println("==============================");

  delay(5000);
}