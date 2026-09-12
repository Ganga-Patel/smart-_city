const mqtt = require("mqtt");
const { initializeApp, cert } = require("firebase-admin");
const { getDatabase } = require("firebase-admin/database");

const serviceAccount = require("./smartcity-61fad-firebase-adminsdk-fbsvc-eea2762ce1.json");

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://smartcity-61fad-default-rtdb.firebaseio.com/"
});

const db = getDatabase();

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("Connected to MQTT Broker");

  client.subscribe("smartcity/dht22/temperature");
  client.subscribe("smartcity/dht22/humidity");
});

client.on("message", async (topic, message) => {
  const value = message.toString();

  console.log(`${topic} : ${value}`);

  if (topic === "smartcity/dht22/temperature") {
    await db.ref("sensor/temperature").set({
      value: parseFloat(value),
      timestamp: Date.now()
    });
  }

  if (topic === "smartcity/dht22/humidity") {
    await db.ref("sensor/humidity").set({
      value: parseFloat(value),
      timestamp: Date.now()
    });
  }

  console.log("Firebase Updated");
});