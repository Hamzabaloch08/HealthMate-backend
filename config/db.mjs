import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

// Replace the following with your Atlas connection string
const uri = process.env.MONGO_URI;

if (!uri) {
  throw new Error("❌ MONGO_URI is missing in .env");
}

export const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ Connection error:", err);
    await client.close();
    process.exit(1);
  }
}

run().catch(console.dir);

process.on("SIGINT", async () => {
  console.log("🛑 App is terminating...");
  await client.close();
  console.log("👋 MongoDB connection closed.");
  process.exit(0);
});
